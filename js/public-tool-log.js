import { riskLabel } from './tool-risk.js';

const panel = document.querySelector('#agent-activity-panel');
const state = document.querySelector('#agent-activity-state');
const list = document.querySelector('#agent-activity-list');
const currentChallenger = document.querySelector('#agent-current-challenger');
const currentRunType = document.querySelector('#agent-current-run-type');
const counts = document.querySelector('#tool-request-counts');
const countSummary = counts?.closest('.tool-request-summary');
const countToggle = document.querySelector('#tool-request-toggle');

const MAX_ITEMS = 24;
const COUNT_PREVIEW = 5;
const POLL_MS = 5000;
const COUNTS_REFRESH_MS = 60000;
let lastEventId = 0;
let lastCountsAt = 0;
let polling = false;
let countRows = [];
let countsExpanded = false;
let detailPinned = false;
let detailOwner = null;
const localCounts = new Map();

const detailPopup = document.createElement('aside');
detailPopup.className = 'public-tool-detail-popup';
detailPopup.hidden = true;
detailPopup.setAttribute('role', 'tooltip');
document.body.appendChild(detailPopup);

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

function compactTimestamp(value) {
  const raw = String(value || '');
  const match = raw.match(/(?:T|\s)(\d{2}:\d{2}:\d{2})/);
  return match ? `${match[1]} UTC` : raw;
}

function positionDetail(owner) {
  if (!owner || detailPopup.hidden) return;
  const rect = owner.getBoundingClientRect();
  const gap = 8;
  const margin = 12;
  const width = Math.min(420, window.innerWidth - margin * 2);
  detailPopup.style.width = `${width}px`;

  const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
  detailPopup.style.left = `${left}px`;

  const popupHeight = detailPopup.offsetHeight;
  const below = rect.bottom + gap;
  const above = rect.top - popupHeight - gap;
  const top = below + popupHeight <= window.innerHeight - margin
    ? below
    : Math.max(margin, above);
  detailPopup.style.top = `${top}px`;
}

function showDetail(owner, event, { pinned = false } = {}) {
  if (!event?.message_text && !event?.queen_reply) return;

  detailPopup.replaceChildren();

  const heading = document.createElement('strong');
  heading.textContent = `${event.bishop_id || 'BISHOP'} · ${event.tool_name}()`;
  detailPopup.appendChild(heading);

  if (event.message_text) {
    const label = document.createElement('small');
    label.textContent = 'AGENT';
    const message = document.createElement('p');
    message.textContent = event.message_text;
    detailPopup.append(label, message);
  }

  if (event.queen_reply) {
    const label = document.createElement('small');
    label.textContent = 'QUEEN';
    const reply = document.createElement('p');
    reply.textContent = event.queen_reply;
    detailPopup.append(label, reply);
  }

  detailOwner = owner;
  detailPinned = pinned;
  detailPopup.hidden = false;
  positionDetail(owner);
}

function hideDetail({ force = false } = {}) {
  if (detailPinned && !force) return;
  detailPopup.hidden = true;
  detailOwner = null;
  detailPinned = false;
}

function attachDetailBehavior(item, event) {
  if (!event?.message_text && !event?.queen_reply) return;

  item.classList.add('has-detail');
  item.tabIndex = 0;
  item.setAttribute('aria-label', `${event.bishop_id || 'BISHOP'} ${event.tool_name}. Hover or tap for conversation details.`);

  item.addEventListener('mouseenter', () => {
    if (!detailPinned) showDetail(item, event);
  });
  item.addEventListener('mouseleave', () => hideDetail());
  item.addEventListener('focus', () => {
    if (!detailPinned) showDetail(item, event);
  });
  item.addEventListener('blur', () => hideDetail());
  item.addEventListener('click', () => {
    if (detailPinned && detailOwner === item) {
      hideDetail({ force: true });
      return;
    }
    showDetail(item, event, { pinned: true });
  });
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
  title.title = title.textContent;
  copy.appendChild(title);

  const meta = document.createElement('small');
  const timestamp = compactTimestamp(event.created_at);
  meta.textContent = `${timestamp ? `${timestamp} · ` : ''}${riskLabel(level)} · ${event.status || 'called'}`;
  copy.appendChild(meta);

  if (event.message_text || event.queen_reply) {
    const hint = document.createElement('span');
    hint.className = 'public-tool-detail-hint';
    hint.textContent = 'DETAIL';
    copy.appendChild(hint);
  }

  item.append(marker, copy);
  attachDetailBehavior(item, event);
  list.appendChild(item);

  while (list.children.length > MAX_ITEMS) {
    if (detailOwner === list.firstElementChild) hideDetail({ force: true });
    list.firstElementChild?.remove();
  }

  list.scrollTop = list.scrollHeight;
}

function renderCounts(rows) {
  if (!counts) return;
  countRows = Array.isArray(rows) ? rows : [];
  counts.replaceChildren();

  if (countRows.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No tool requests recorded yet.';
    counts.appendChild(empty);
    if (countToggle) countToggle.hidden = true;
    return;
  }

  const visibleRows = countsExpanded ? countRows : countRows.slice(0, COUNT_PREVIEW);
  for (const row of visibleRows) {
    const item = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = String(row.tool_name || 'unknown_tool');
    name.title = name.textContent;
    const value = document.createElement('strong');
    value.textContent = String(Number(row.request_count || 0));
    item.append(name, value);
    counts.appendChild(item);
  }

  if (countSummary) countSummary.dataset.expanded = String(countsExpanded);
  if (!countToggle) return;

  const remaining = Math.max(0, countRows.length - COUNT_PREVIEW);
  countToggle.hidden = remaining === 0;
  countToggle.textContent = countsExpanded ? 'SHOW LESS' : `+ ${remaining} MORE`;
  countToggle.setAttribute('aria-expanded', String(countsExpanded));
}

function renderLocalCounts() {
  const rows = [...localCounts.entries()]
    .map(([tool_name, request_count]) => ({ tool_name, request_count }))
    .sort((a, b) => b.request_count - a.request_count || a.tool_name.localeCompare(b.tool_name));
  renderCounts(rows);
}

function pollRequest() {
  const now = Date.now();
  const includeCounts = lastCountsAt === 0 || now - lastCountsAt >= COUNTS_REFRESH_MS;
  const params = new URLSearchParams({ after: String(lastEventId) });
  if (includeCounts) params.set('counts', '1');
  return {
    url: `/api/public-tool-events?${params.toString()}`,
    includeCounts,
    requestedAt: now,
  };
}

async function poll() {
  if (polling || document.hidden) return;
  polling = true;
  const requestInfo = pollRequest();

  try {
    const response = await fetch(requestInfo.url, {
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

    if (Array.isArray(payload?.counts)) {
      renderCounts(payload.counts);
      if (requestInfo.includeCounts) lastCountsAt = requestInfo.requestedAt;
    }
    panel?.setAttribute('data-feed-ready', 'true');
  } catch {
    // Public logging is optional. Failure must not affect the main experience.
  } finally {
    polling = false;
  }
}

countToggle?.addEventListener('click', () => {
  countsExpanded = !countsExpanded;
  renderCounts(countRows);
});

window.addEventListener('resize', () => positionDetail(detailOwner));
list?.addEventListener('scroll', () => {
  if (detailPinned) positionDetail(detailOwner);
  else hideDetail({ force: true });
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') hideDetail({ force: true });
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void poll();
});

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
window.setInterval(() => {
  if (!document.hidden) void poll();
}, POLL_MS);
