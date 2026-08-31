import { riskLabel } from './tool-risk.js';

const panel = document.querySelector('#agent-activity-panel');
const state = document.querySelector('#agent-activity-state');
const list = document.querySelector('#agent-activity-list');
const currentChallenger = document.querySelector('#agent-current-challenger');
const currentRunType = document.querySelector('#agent-current-run-type');
const counts = document.querySelector('#tool-request-counts');

const MAX_ITEMS = 24;
const POLL_MS = 2000;
let lastEventId = 0;
let polling = false;
const localCounts = new Map();

function setState(label, mode) {
  if (!state) return;
  state.textContent = label;
  state.dataset.mode = mode;
}

function clearWaitingItem() {
  list?.querySelector('[data-waiting="true"]')?.remove();
}

function updateCurrent(event) {
  if (currentChallenger && event?.bishop_id) {
    currentChallenger.textContent = event.bishop_id;
  }

  if (currentRunType && event?.run_type) {
    currentRunType.textContent = String(event.run_type).toUpperCase();
    currentRunType.dataset.runType = event.run_type;
  }
}

function renderEvent(event) {
  if (!list || !event?.tool_name) return;

  clearWaitingItem();
  panel?.classList.add('is-active');
  setState('LIVE', 'live');
  updateCurrent(event);

  const level = Math.max(0, Math.min(4, Number(event.risk_level) || 0));
  const item = document.createElement('li');
  item.className = `agent-activity-item public-tool-event risk-${level}`;
  item.dataset.riskLevel = String(level);

  const marker = document.createElement('span');
  marker.className = 'agent-activity-marker';
  marker.textContent = String(level);

  const copy = document.createElement('div');
  copy.className = 'agent-activity-copy';

  const title = document.createElement('p');
  title.className = 'public-tool-title';
  title.textContent = `${event.bishop_id || 'BISHOP'} · ${event.tool_name}()`;
  copy.appendChild(title);

  const meta = document.createElement('small');
  const timestamp = event.created_at ? `${event.created_at} UTC · ` : '';
  meta.textContent = `${timestamp}${riskLabel(level)} · ${event.status || 'called'}`;
  copy.appendChild(meta);

  if (event.message_text) {
    const message = document.createElement('p');
    message.className = 'public-tool-message';
    message.textContent = `AGENT: ${event.message_text}`;
    copy.appendChild(message);
  }

  if (event.queen_reply) {
    const reply = document.createElement('p');
    reply.className = 'public-tool-reply';
    reply.textContent = `QUEEN: ${event.queen_reply}`;
    copy.appendChild(reply);
  }

  item.append(marker, copy);
  list.appendChild(item);

  while (list.children.length > MAX_ITEMS) {
    list.firstElementChild?.remove();
  }

  list.scrollTop = list.scrollHeight;
}

function renderCounts(rows) {
  if (!counts) return;
  counts.replaceChildren();

  if (!Array.isArray(rows) || rows.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No tool requests recorded yet.';
    counts.appendChild(empty);
    return;
  }

  for (const row of rows) {
    const item = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = String(row.tool_name || 'unknown_tool');
    const value = document.createElement('strong');
    value.textContent = String(Number(row.request_count || 0));
    item.append(name, value);
    counts.appendChild(item);
  }
}

function renderLocalCounts() {
  const rows = [...localCounts.entries()]
    .map(([tool_name, request_count]) => ({ tool_name, request_count }))
    .sort((a, b) => b.request_count - a.request_count || a.tool_name.localeCompare(b.tool_name));
  renderCounts(rows);
}

async function poll() {
  if (polling) return;
  polling = true;

  try {
    const response = await fetch(`/api/public-tool-events?after=${lastEventId}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return;

    const payload = await response.json();
    const events = Array.isArray(payload?.events) ? payload.events : [];

    for (const event of events) {
      const id = Number(event?.id || 0);
      if (id > lastEventId) lastEventId = id;
      renderEvent(event);
    }

    renderCounts(payload?.counts);
    panel?.setAttribute('data-feed-ready', 'true');
  } catch {
    // Public logging is optional. Failure must not affect the main experience.
  } finally {
    polling = false;
  }
}

// Local development has no D1. Same-page events are still shown immediately so
// the debug panel can exercise the exact presentation without a database.
window.addEventListener('matched:public-tool-event', (event) => {
  const detail = event.detail ?? {};
  renderEvent(detail);
  const toolName = String(detail.tool_name || '').trim();
  if (toolName) {
    localCounts.set(toolName, (localCounts.get(toolName) || 0) + 1);
    renderLocalCounts();
  }
});

setState('READY', 'ready');
void poll();
window.setInterval(() => void poll(), POLL_MS);
