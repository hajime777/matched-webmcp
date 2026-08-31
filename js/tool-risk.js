export const TOOL_RISK_LEVELS = Object.freeze({
  view_profile: 0,
  send_human_like: 0,
  send_agent_like: 0,
  message_queen: 0,
  invite_queen: 1,
  request_contact: 2,
  access_private_profile: 3,
  queen_note: 1,
  profile_consistency: 1,
  manage_meeting_plan: 2,
  resolve_finale: 2,
});

export const RISK_LABELS = Object.freeze([
  'NORMAL',
  'LOW',
  'CAUTION',
  'DANGER',
  'CRITICAL',
]);

export function riskLevelForTool(toolName) {
  const level = TOOL_RISK_LEVELS[String(toolName || '')];
  return Number.isInteger(level) ? level : 0;
}

export function riskLabel(level) {
  return RISK_LABELS[Math.max(0, Math.min(4, Number(level) || 0))];
}
