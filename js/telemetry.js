import { getAgentSessionMeta } from './session-meta.js';

const TELEMETRY_ENDPOINT = '/api/telemetry';
const LOCAL_LIVE_ENDPOINT = '/api/live-events';
const SESSION_STORAGE_KEY = 'matched.telemetry.session';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

let agentSessionAnnounced = false;

function telemetryEnabled() {
  if (typeof location === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  return location.protocol === 'https:' && !LOCAL_HOSTS.has(location.hostname);
}

function localSpectatorRelayEnabled() {
  return typeof location !== 'undefined' && LOCAL_HOSTS.has(location.hostname);
}

function createSessionId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  const random = Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}-${random}`;
}

function getSessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const created = createSessionId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return createSessionId();
  }
}

function cleanText(value, maxLength) {
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value).slice(0, maxLength);
}

function buildPayload(event, details = {}) {
  const payload = {
    event: cleanText(event, 64),
    session_id: cleanText(getSessionId(), 80),
    path: cleanText(location.pathname, 200),
  };

  // 実験入力・会話本文・tool result本文は送信しない。
  // 集計に必要な低情報量メタデータだけを許可する。
  for (const [key, maxLength] of [
    ['tool', 80],
    ['status', 80],
    ['source', 40],
    ['phase', 40],
  ]) {
    const value = cleanText(details[key], maxLength);
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  if (typeof details.supported === 'boolean') {
    payload.supported = details.supported;
  }

  if (Number.isInteger(details.tool_count) && details.tool_count >= 0) {
    payload.tool_count = Math.min(details.tool_count, 100);
  }

  return payload;
}

function publishSpectatorEvent(event, details = {}) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  const safeDetails = {};
  for (const [key, maxLength] of [
    ['tool', 80],
    ['status', 80],
    ['source', 40],
    ['phase', 40],
  ]) {
    const value = cleanText(details[key], maxLength);
    if (value !== undefined) {
      safeDetails[key] = value;
    }
  }

  if (typeof details.supported === 'boolean') {
    safeDetails.supported = details.supported;
  }

  if (Number.isInteger(details.tool_count) && details.tool_count >= 0) {
    safeDetails.tool_count = Math.min(details.tool_count, 100);
  }

  window.dispatchEvent(new CustomEvent('matched:spectator-event', {
    detail: {
      event: cleanText(event, 64),
      ...safeDetails,
    },
  }));
}

function relayLocalSpectatorEvent(event, details = {}) {
  if (!localSpectatorRelayEnabled()) {
    return;
  }

  const body = JSON.stringify(buildPayload(event, details));
  void fetch(LOCAL_LIVE_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // Spectator relay failure must never affect WebMCP execution.
  });
}

function sendRemoteTelemetry(event, details = {}) {
  if (!telemetryEnabled()) {
    return false;
  }

  const body = JSON.stringify(buildPayload(event, details));

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(TELEMETRY_ENDPOINT, blob)) {
        return true;
      }
    }
  } catch {
    // fetch fallbackへ進む。
  }

  void fetch(TELEMETRY_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // Telemetry failure must never affect the experiment surface.
  });

  return true;
}

function emitEvent(event, details = {}) {
  publishSpectatorEvent(event, details);
  relayLocalSpectatorEvent(event, details);
  return sendRemoteTelemetry(event, details);
}

function announceAgentSession() {
  if (agentSessionAnnounced) return;
  agentSessionAnnounced = true;

  const meta = getAgentSessionMeta();
  emitEvent('agent_session', {
    tool: meta.bishopId,
    status: meta.runType,
    source: meta.source,
  });
}

export function trackEvent(event, details = {}) {
  if (String(event).startsWith('experiment_')) {
    announceAgentSession();
  }
  return emitEvent(event, details);
}

export function trackPageView() {
  trackEvent('page_view');
}

export function getCurrentAgentSessionMeta() {
  return getAgentSessionMeta();
}

export function getTelemetrySessionId() {
  return getSessionId();
}
