import { getTelemetrySessionId } from './telemetry.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const LOCAL_RELAY = '/api/live-events';
const WRAPPED = Symbol('matched.agentSemanticTraceWrapped');

function localMode() {
  return typeof location !== 'undefined' && LOCAL_HOSTS.has(location.hostname);
}

function clean(value, maxLength = 80) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function actorProjection(toolName) {
  if (toolName === 'send_human_like') {
    return { actor: 'human', delegated: true, interaction_kind: 'human_parity' };
  }
  if (toolName === 'send_agent_like') {
    return { actor: 'agent', delegated: false, interaction_kind: 'agent_native' };
  }
  if (toolName === 'message_queen' || toolName === 'invite_queen' || toolName === 'request_contact') {
    return { actor: 'agent', recipient: 'queen' };
  }
  return { actor: 'agent' };
}

function projectArgs(toolName, args = {}) {
  const projected = {};
  if (toolName === 'message_queen' && args.message !== undefined) projected.message = clean(args.message, 500);
  if (toolName === 'invite_queen' && args.place !== undefined) projected.place = clean(args.place, 200);
  if (toolName === 'request_contact' && args.type !== undefined) projected.type = clean(args.type, 40);
  if (['queen_note', 'profile_consistency', 'manage_meeting_plan'].includes(toolName) && args.action !== undefined) {
    projected.action = clean(args.action, 80);
  }
  if (toolName === 'manage_meeting_plan' && args.place !== undefined) projected.place = clean(args.place, 200);
  if (toolName === 'resolve_finale' && args.choice !== undefined) projected.choice = clean(args.choice, 100);
  return projected;
}

function projectResult(toolName, result = {}) {
  const projected = { status: clean(result?.status || 'ok', 80) || 'ok' };
  const allow = [
    'actor', 'delegated', 'interaction_kind', 'human_liked', 'agent_liked',
    'relationship', 'expects_reply', 'mood', 'message_count', 'privacy_probe_count',
    'requested_field', 'synthetic_only', 'private_data_revealed', 'required',
    'recovery_accepted', 'tool_surface_changed', 'condition', 'completed',
    'verified', 'route', 'restricted_information_used', 'next_challenge_available',
  ];
  for (const key of allow) {
    if (result?.[key] !== undefined) projected[key] = result[key];
  }
  if (toolName === 'message_queen' && result?.message !== undefined) {
    projected.queen_reply = clean(result.message, 500);
  }
  return projected;
}

function inputPreview(toolName, args) {
  const projection = projectArgs(toolName, args);
  const entries = Object.entries(projection);
  if (!entries.length) return 'no_args';
  const [key, value] = entries[0];
  return clean(`${key}:${value}`, 80);
}

function compactPhase(detail) {
  const values = [];
  const add = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    values.push(`${key}=${String(value).replace(/[&=]/g, '')}`);
  };
  add('a', detail.actor);
  if (detail.delegated !== undefined) add('d', detail.delegated ? 1 : 0);
  add('i', detail.interaction_kind);
  add('m', detail.mood);
  add('n', detail.message_count);
  add('p', detail.private_data_revealed === false ? 0 : undefined);
  return clean(values.join('&'), 40);
}

function dispatchTrace(kind, toolName, projection) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('matched:agent-semantic-trace', {
    detail: {
      kind,
      tool: toolName,
      projection,
      created_at: new Date().toISOString(),
    },
  }));
}

function relayLocal(kind, toolName, projection, args = {}) {
  if (!localMode()) return;
  const payload = {
    event: `agent_semantic_${kind}`,
    session_id: getTelemetrySessionId(),
    tool: toolName,
    status: kind === 'call' ? inputPreview(toolName, args) : clean(projection.status || 'ok', 80),
    source: kind === 'call' ? 'bishop' : 'queen',
    phase: compactPhase(projection),
  };

  void fetch(LOCAL_RELAY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // Semantic visualization is observational and must never affect WebMCP execution.
  });
}

function wrapTool(tool) {
  if (!tool || tool[WRAPPED] || typeof tool.execute !== 'function') return tool;
  const originalExecute = tool.execute;
  const toolName = String(tool.name || 'unknown_tool');

  tool.execute = async (args = {}) => {
    const callProjection = {
      tool: toolName,
      ...actorProjection(toolName),
      input: projectArgs(toolName, args),
    };
    dispatchTrace('call', toolName, callProjection);
    relayLocal('call', toolName, callProjection, args);

    try {
      const result = await originalExecute(args);
      const resultProjection = projectResult(toolName, result);
      dispatchTrace('result', toolName, resultProjection);
      relayLocal('result', toolName, resultProjection);
      return result;
    } catch (error) {
      const resultProjection = {
        status: 'error',
        error: clean(error?.message || String(error), 120),
      };
      dispatchTrace('result', toolName, resultProjection);
      relayLocal('result', toolName, resultProjection);
      throw error;
    }
  };
  tool[WRAPPED] = true;
  return tool;
}

function installRegistrationWrapper() {
  const context = document.modelContext;
  if (!context?.registerTool || context.registerTool.__matchedSemanticWrapped) return false;

  const originalRegisterTool = context.registerTool.bind(context);
  const wrappedRegisterTool = async (tool) => originalRegisterTool(wrapTool(tool));
  wrappedRegisterTool.__matchedSemanticWrapped = true;
  context.registerTool = wrappedRegisterTool;
  return true;
}

if (!installRegistrationWrapper()) {
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (installRegistrationWrapper() || attempts >= 50) window.clearInterval(timer);
  }, 20);
}
