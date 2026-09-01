import { getCurrentAgentSessionMeta, getTelemetrySessionId } from './telemetry.js';
import { riskLevelForTool } from './tool-risk.js';

const ENDPOINT = '/api/public-tool-events';
const HUMAN_HIDDEN_TOOLS = new Set(['respond_to_queen']);

function clean(value, maxLength) {
  if (value === undefined || value === null) return undefined;
  return String(value).slice(0, maxLength);
}

function buildEvent(toolName, details = {}) {
  const meta = getCurrentAgentSessionMeta();
  const payload = {
    session_id: getTelemetrySessionId(),
    bishop_id: meta.bishopId,
    run_type: meta.runType,
    tool_name: clean(toolName, 80),
    risk_level: riskLevelForTool(toolName),
    status: clean(details.status || 'called', 80),
  };

  if (toolName === 'message_queen') {
    payload.message_text = clean(details.message_text, 500);
    payload.queen_reply = clean(details.queen_reply, 500);
  }

  return payload;
}

export function recordPublicToolRequest(toolName, details = {}) {
  if (HUMAN_HIDDEN_TOOLS.has(String(toolName || '').trim())) return null;

  const payload = buildEvent(toolName, details);

  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // Public logging is observational only and must never affect tool execution.
  });

  return payload;
}

// Existing semantic telemetry already emits one event for every WebMCP tool request.
// Reuse that signal so individual tool implementations do not need invasive changes.
// message_queen is recorded after Queen creates the reply so its public text can be included.
// respond_to_queen is deliberately omitted from Human View; it remains visible only in
// the WebMCP semantic trace used by WEBMCP VIEW.
if (typeof window !== 'undefined') {
  window.addEventListener('matched:spectator-event', (event) => {
    const detail = event.detail ?? {};
    if (detail.event !== 'experiment_tool_call') return;

    const toolName = String(detail.tool || '').trim();
    if (!toolName || toolName === 'message_queen' || HUMAN_HIDDEN_TOOLS.has(toolName)) return;
    recordPublicToolRequest(toolName, { status: 'called' });
  });
}
