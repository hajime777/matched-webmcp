const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const REMOTE_POLL_MS = 5000;
const BUFFER_TTL_MS = 15000;

let lastRemoteEventId = 0;
let remoteTraceReady = false;
let remotePolling = false;
const remoteTraceStartedAt = Date.now();
const localTraceIds = new Set();
const remoteCallIds = new Set();
const bufferedResults = new Map();

function remoteMode() {
  return typeof location !== 'undefined' && !LOCAL_HOSTS.has(location.hostname);
}

function clean(value, maxLength = 180) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function parsePhase(raw) {
  const parsed = {};
  const aliases = {
    b: 'bishop_short',
    a: 'actor',
    d: 'delegated',
    r: 'relationship',
    m: 'mood',
    n: 'message_count',
    p: 'private_data_revealed',
  };

  for (const part of String(raw || '').split(/[;&]/)) {
    const [shortKey, value] = part.split('=');
    const key = aliases[shortKey];
    if (!key || value === undefined) continue;
    if (key === 'actor') parsed[key] = value === 'H' ? 'human' : value === 'A' ? 'agent' : value;
    else if (key === 'delegated') parsed[key] = value === '1';
    else if (key === 'private_data_revealed') parsed[key] = value !== '0';
    else if (key === 'relationship' || key === 'message_count') parsed[key] = Number(value) || 0;
    else parsed[key] = value;
  }
  return parsed;
}

function traceSource(raw) {
  const [, traceId] = String(raw || '').split(':');
  return traceId || null;
}

function normalizeBishopId(value, phase = {}) {
  const explicit = clean(value, 32);
  if (explicit) return explicit;
  const short = clean(phase.bishop_short, 8);
  return short ? `BISHOP #${short}` : 'BISHOP #?';
}

function projectionFor(event, phase) {
  if (event.event === 'agent_semantic_call') {
    return {
      ...phase,
      input_preview: String(event.status || 'input_not_persisted'),
    };
  }
  return {
    status: String(event.status || 'ok'),
    ...phase,
  };
}

function publishRemoteTrace(event) {
  const phase = parsePhase(event.phase);
  const traceId = traceSource(event.source);
  const kind = event.event === 'agent_semantic_call' ? 'call' : 'result';

  window.dispatchEvent(new CustomEvent('matched:agent-semantic-trace', {
    detail: {
      kind,
      tool: String(event.tool || 'unknown_tool'),
      projection: projectionFor(event, phase),
      trace_id: traceId,
      bishop_id: normalizeBishopId(event.bishop_id, phase),
      run_type: event.run_type || null,
      created_at: event.created_at,
      transport: 'production-relay',
    },
  }));
}

function pruneExpiredResults(now = Date.now()) {
  for (const [traceId, entry] of bufferedResults) {
    if (now - entry.bufferedAt >= BUFFER_TTL_MS) bufferedResults.delete(traceId);
  }
}

function consumeRemoteEvent(event) {
  if (event?.event !== 'agent_semantic_call' && event?.event !== 'agent_semantic_result') return;
  const traceId = traceSource(event.source);
  if (!traceId || localTraceIds.has(traceId)) return;

  if (event.event === 'agent_semantic_call') {
    remoteCallIds.add(traceId);
    publishRemoteTrace(event);
    const buffered = bufferedResults.get(traceId);
    if (buffered) {
      bufferedResults.delete(traceId);
      publishRemoteTrace(buffered.event);
    }
    return;
  }

  if (remoteCallIds.has(traceId)) {
    publishRemoteTrace(event);
    return;
  }

  // D1 inserts are independent observational writes. If a result becomes visible
  // before its matching call, hold it briefly so WEBMCP VIEW still receives a
  // call -> result pair when the call row arrives on a later poll. An orphaned
  // result is discarded rather than presented without observable call evidence.
  bufferedResults.set(traceId, { event, bufferedAt: Date.now() });
}

async function pollRemoteTrace() {
  if (!remoteMode() || remotePolling || document.hidden) return;
  remotePolling = true;

  try {
    const response = await fetch(`/api/live-events?after=${lastRemoteEventId}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return;

    const payload = await response.json();
    const events = Array.isArray(payload?.events) ? payload.events : [];

    if (!remoteTraceReady) {
      // Production telemetry is shared. Establish a cursor only; historical rows
      // must never open AUTO or populate a newly opened spectator view.
      for (const event of events) {
        const id = Number(event?.id || 0);
        if (id > lastRemoteEventId) lastRemoteEventId = id;
      }
      remoteTraceReady = true;
      document.documentElement.dataset.agentRemoteTraceReady = 'true';
      return;
    }

    const recoveringFromEmptyBaseline = lastRemoteEventId === 0;
    for (const event of events) {
      const id = Number(event?.id || 0);
      if (id > lastRemoteEventId) lastRemoteEventId = id;
      const eventTime = Date.parse(event?.created_at || '') || 0;
      if (recoveringFromEmptyBaseline && eventTime < remoteTraceStartedAt) continue;
      consumeRemoteEvent(event);
    }
    pruneExpiredResults();
  } catch {
    // Spectator transport is observational only and must never affect WebMCP.
  } finally {
    remotePolling = false;
  }
}

// Remember rich same-document traces so the acting page does not replay its own
// D1 copy when the production spectator feed catches up.
window.addEventListener('matched:agent-semantic-trace', (event) => {
  if (event.detail?.transport === 'production-relay') return;
  const traceId = clean(event.detail?.trace_id, 32);
  if (traceId) localTraceIds.add(traceId);
});

if (remoteMode()) {
  window.setTimeout(() => void pollRemoteTrace(), 0);
  window.setInterval(() => void pollRemoteTrace(), REMOTE_POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void pollRemoteTrace();
  });
}
