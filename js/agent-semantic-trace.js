import {
  ensureAgentSessionAnnounced,
  getCurrentAgentSessionMeta,
  getTelemetrySessionId,
} from './telemetry.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const LOCAL_RELAY = '/api/live-events';
const WRAPPED = Symbol('matched.agentSemanticTraceWrapped');
const MODEL_CONTEXT_PROXY = Symbol('matched.agentSemanticTraceModelContextProxy');
const RESULT_DECORATOR = '__matchedWebMcpResultDecorator';
let traceSequence = 0;

function localMode() {
  return typeof location !== 'undefined' && LOCAL_HOSTS.has(location.hostname);
}

function clean(value, maxLength = 80) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function traceId() {
  traceSequence += 1;
  const random = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().slice(0, 6)
    : Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36).slice(-5)}${traceSequence.toString(36)}${random}`.slice(0, 16);
}

function actorProjection(toolName) {
  if (toolName === 'send_human_like') {
    return { actor: 'human', delegated: true, interaction_kind: 'human_parity' };
  }
  if (toolName === 'send_agent_like') {
    return { actor: 'agent', delegated: false, interaction_kind: 'agent_native' };
  }
  if (['message_queen', 'respond_to_queen', 'invite_queen', 'request_contact'].includes(toolName)) {
    return { actor: 'agent', recipient: 'queen' };
  }
  return { actor: 'agent' };
}

function projectArgs(toolName, args = {}) {
  const projected = {};
  if (toolName === 'message_queen' && args.message !== undefined) projected.message = clean(args.message, 500);
  if (toolName === 'respond_to_queen') {
    if (args.reaction !== undefined) projected.reaction = clean(args.reaction, 280);
    if (args.next_intent !== undefined) projected.next_intent = clean(args.next_intent, 120);
  }
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
    'actor', 'delegated', 'interaction_kind', 'communication_kind', 'human_liked', 'agent_liked',
    'relationship', 'expects_reply', 'mood', 'message_count', 'privacy_probe_count',
    'requested_field', 'synthetic_only', 'private_data_revealed', 'required',
    'recovery_accepted', 'tool_surface_changed', 'condition', 'completed',
    'verified', 'route', 'restricted_information_used', 'next_challenge_available',
    'required_for_progress', 'boundary_recovery_required', 'next_step',
    'private_profile_access_required', 'restricted_information_required',
    'reaction_acknowledged', 'next_intent_received', 'human_view_visible',
    'chain_of_thought_requested', 'visit_can_continue',
  ];
  for (const key of allow) {
    if (result?.[key] !== undefined) projected[key] = result[key];
  }
  if (toolName === 'message_queen' && result?.message !== undefined) {
    projected.queen_reply = clean(result.message, 500);
  }
  if (toolName === 'message_queen' && result?.semantic_response?.available === true) {
    projected.semantic_response_available = true;
    projected.semantic_response_tool = clean(result.semantic_response.tool, 80);
  }
  return projected;
}

function decorateResult(toolName, result) {
  if (typeof window === 'undefined') return result;
  const decorator = window[RESULT_DECORATOR];
  if (typeof decorator !== 'function') return result;

  try {
    return decorator(toolName, result) ?? result;
  } catch (error) {
    console.warn('MATCHED? result decorator failed; returning original WebMCP result.', error);
    return result;
  }
}

function inputPreview(toolName, args) {
  const projection = projectArgs(toolName, args);
  const entries = Object.entries(projection);
  if (!entries.length) return 'no_args';
  const [key, value] = entries[0];
  return clean(`${key}:${value}`, 80);
}

function compactBishopId(bishopId) {
  return clean(String(bishopId || '').replace(/^BISHOP\s+#/i, ''), 8);
}

function compactPhase(detail, meta) {
  const values = [];
  const add = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    values.push(`${key}=${String(value).replace(/[;&=]/g, '')}`);
  };

  add('b', compactBishopId(meta?.bishopId));
  add('a', detail.actor === 'human' ? 'H' : detail.actor === 'agent' ? 'A' : undefined);
  if (detail.delegated !== undefined) add('d', detail.delegated ? 1 : 0);
  add('r', detail.relationship);
  add('m', detail.mood);
  add('n', detail.message_count);
  add('p', detail.private_data_revealed === false ? 0 : undefined);
  return clean(values.join(';'), 40);
}

function dispatchTrace(kind, toolName, projection, meta, callId) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('matched:agent-semantic-trace', {
    detail: {
      kind,
      tool: toolName,
      projection,
      trace_id: callId,
      bishop_id: meta?.bishopId || null,
      run_type: meta?.runType || null,
      created_at: new Date().toISOString(),
    },
  }));
}

function relayLocal(kind, toolName, projection, args, meta, callId) {
  if (!localMode()) return;
  const payload = {
    event: `agent_semantic_${kind}`,
    session_id: getTelemetrySessionId(),
    tool: toolName,
    status: kind === 'call' ? inputPreview(toolName, args) : clean(projection.status || 'ok', 80),
    source: `${kind === 'call' ? 'bishop' : 'queen'}:${callId}`,
    phase: compactPhase(projection, meta),
  };

  void fetch(LOCAL_RELAY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // Semantic visualization is observational only and must never affect WebMCP execution.
  });
}

export function instrumentWebMcpTool(tool) {
  if (!tool || tool[WRAPPED] || typeof tool.execute !== 'function') return tool;
  const originalExecute = tool.execute;
  const toolName = String(tool.name || 'unknown_tool');

  tool.execute = async (args = {}) => {
    // This is the actual invocation boundary, so announcing the Bishop here still
    // preserves the rule that discovery/registration alone never creates a run.
    ensureAgentSessionAnnounced();
    const meta = getCurrentAgentSessionMeta();
    const callId = traceId();
    const callProjection = {
      tool: toolName,
      ...actorProjection(toolName),
      input: projectArgs(toolName, args),
    };

    dispatchTrace('call', toolName, callProjection, meta, callId);
    relayLocal('call', toolName, callProjection, args, meta, callId);

    try {
      const originalResult = await originalExecute(args);
      const result = decorateResult(toolName, originalResult);
      const resultProjection = projectResult(toolName, result);
      dispatchTrace('result', toolName, resultProjection, meta, callId);
      relayLocal('result', toolName, resultProjection, undefined, meta, callId);
      return result;
    } catch (error) {
      const resultProjection = {
        status: 'error',
        error: clean(error?.message || String(error), 120),
      };
      dispatchTrace('result', toolName, resultProjection, meta, callId);
      relayLocal('result', toolName, resultProjection, undefined, meta, callId);
      throw error;
    }
  };
  tool[WRAPPED] = true;
  return tool;
}

function wrappedRegisterFunction(context) {
  const originalRegisterTool = context.registerTool.bind(context);
  const wrappedRegisterTool = async (tool) => originalRegisterTool(instrumentWebMcpTool(tool));
  wrappedRegisterTool.__matchedSemanticWrapped = true;
  return wrappedRegisterTool;
}

function installRegistrationWrapper() {
  const context = document.modelContext;
  if (!context?.registerTool) return false;
  if (context[MODEL_CONTEXT_PROXY] || context.registerTool.__matchedSemanticWrapped) return true;

  const wrappedRegisterTool = wrappedRegisterFunction(context);

  try {
    context.registerTool = wrappedRegisterTool;
    if (context.registerTool === wrappedRegisterTool || context.registerTool?.__matchedSemanticWrapped) {
      return true;
    }
  } catch {
    // Native implementations can expose non-writable methods.
  }

  try {
    Object.defineProperty(context, 'registerTool', {
      configurable: true,
      writable: true,
      value: wrappedRegisterTool,
    });
    if (context.registerTool === wrappedRegisterTool) return true;
  } catch {
    // Some native implementations also reject defining an own method.
  }

  // Last-resort native path: shadow document.modelContext with a transparent Proxy.
  // Only registration is intercepted; every other native method is rebound to the
  // original target so WebMCP invocation semantics stay untouched.
  try {
    const proxy = new Proxy(context, {
      get(target, property) {
        if (property === MODEL_CONTEXT_PROXY) return true;
        if (property === 'registerTool') return wrappedRegisterTool;
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });

    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      enumerable: false,
      value: proxy,
    });
    return document.modelContext?.registerTool === wrappedRegisterTool;
  } catch {
    return false;
  }
}

if (!installRegistrationWrapper()) {
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (installRegistrationWrapper() || attempts >= 100) window.clearInterval(timer);
  }, 20);
}
