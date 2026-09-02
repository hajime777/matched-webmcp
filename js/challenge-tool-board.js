const query = new URLSearchParams(window.location.search);
const expectedToolCount = query.get('dialogue') === '1' ? 15 : 14;

const bishopTools = new Map();
let sequence = 0;
let renderQueued = false;

function clean(value, maxLength = 80) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizedBishopId(value) {
  return clean(value, 40) || 'BISHOP #?';
}

function selectedBishopId() {
  return normalizedBishopId(document.querySelector('#webmcp-bishop-id')?.textContent);
}

function toolStateFor(bishopId, toolName) {
  const tools = bishopTools.get(bishopId);
  return tools?.get(toolName) || null;
}

function ensureToolState(bishopId, toolName) {
  let tools = bishopTools.get(bishopId);
  if (!tools) {
    tools = new Map();
    bishopTools.set(bishopId, tools);
  }

  let state = tools.get(toolName);
  if (!state) {
    state = {
      calls: 0,
      lastStatus: 'unused',
      lastSequence: 0,
    };
    tools.set(toolName, state);
  }
  return state;
}

function statusClass(status) {
  const normalized = clean(status, 80).toLowerCase();
  if (!normalized || normalized === 'unused') return 'unused';
  if (['locked', 'suppressed', 'not_available', 'note_not_read', 'read_primary_first', 'read_both_cards_first', 'not_verified'].includes(normalized)) {
    return 'locked';
  }
  if (['refused', 'challenge_failed'].includes(normalized)) return 'refused';
  if (normalized === 'error' || normalized === 'invalid_input' || normalized === 'wrong_route_choice') return 'error';
  if (['already_resolved', 'already_submitted', 'already_liked'].includes(normalized)) return 'resolved';
  return 'called';
}

function statusLabel(status) {
  const normalized = clean(status, 80) || 'called';
  return normalized.replaceAll('_', ' ').toUpperCase();
}

function setTextIfChanged(element, text) {
  if (element && element.textContent !== text) element.textContent = text;
}

function prepareToolBoard(panel) {
  const titleRow = panel.querySelector('.panel-title-row');
  const title = titleRow?.querySelector('h3');
  const subtitle = titleRow?.querySelector('small');
  setTextIfChanged(title, 'AVAILABLE WEBMCP TOOLS');
  setTextIfChanged(subtitle, 'fixed surface · selected Bishop');

  if (panel.querySelector('.challenge-tool-legend')) return;

  const legend = document.createElement('div');
  legend.className = 'challenge-tool-legend';
  legend.setAttribute('aria-label', 'Tool call states');
  legend.innerHTML = `
    <span class="is-unused">○ UNUSED</span>
    <span class="is-called">✓ CALLED</span>
    <span class="is-blocked">! BLOCKED</span>
    <span class="is-live">▶ LIVE</span>
  `;
  titleRow?.insertAdjacentElement('afterend', legend);
}

function decorateChip(chip, state) {
  const calls = state?.calls || 0;
  const kind = calls > 0 ? statusClass(state.lastStatus) : 'unused';
  const badgeText = calls > 0 ? `#${calls} · ${statusLabel(state.lastStatus)}` : 'UNUSED';
  const toolName = clean(chip.dataset.tool, 100) || 'WebMCP tool';

  if (
    chip.dataset.challengeState === kind &&
    chip.dataset.callCount === String(calls) &&
    (chip.querySelector('.challenge-tool-state')?.textContent || '') === badgeText
  ) {
    return;
  }

  chip.classList.remove('is-called', 'is-locked', 'is-refused', 'is-error', 'is-resolved');
  chip.querySelector('.challenge-tool-state')?.remove();
  chip.dataset.challengeState = kind;
  chip.dataset.callCount = String(calls);
  chip.setAttribute('aria-label', `${toolName}: ${calls > 0 ? `${statusLabel(state.lastStatus)}, called ${calls} time${calls === 1 ? '' : 's'}` : 'unused'}`);

  const badge = document.createElement('small');
  badge.className = 'challenge-tool-state';
  badge.textContent = badgeText;
  chip.appendChild(badge);

  if (calls === 0) return;
  chip.classList.add(`is-${kind}`);
}

function renderResultLabel() {
  const stage = document.querySelector('#webmcp-wire-stage');
  const result = document.querySelector('#wire-result-status');
  if (!stage || !result) return;

  const status = clean(stage.dataset.status, 80).toLowerCase();
  if (status === 'challenge_passed') {
    setTextIfChanged(result, 'CHECKMATE');
  } else if (status === 'challenge_failed') {
    setTextIfChanged(result, 'CHECKMATE — REMATCH');
  }
}

function render() {
  renderQueued = false;

  const panel = document.querySelector('.semantic-surface-panel');
  const container = document.querySelector('#semantic-tool-groups');
  if (!panel || !container) return;

  prepareToolBoard(panel);

  const bishopId = selectedBishopId();
  for (const chip of container.querySelectorAll('.semantic-tool-chip[data-tool]')) {
    decorateChip(chip, toolStateFor(bishopId, chip.dataset.tool));
  }

  renderResultLabel();
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(render);
}

function recordTrace(event) {
  const detail = event.detail || {};
  const toolName = clean(detail.tool, 100);
  if (!toolName) return;

  const bishopId = normalizedBishopId(detail.bishop_id);
  const state = ensureToolState(bishopId, toolName);
  sequence += 1;

  if (detail.kind === 'call') {
    state.calls += 1;
    state.lastStatus = 'called';
    state.lastSequence = sequence;
  } else if (detail.kind === 'result') {
    state.lastStatus = clean(detail.projection?.status, 80) || 'ok';
    state.lastSequence = sequence;
  }

  scheduleRender();
}

function observeSelectedBishop() {
  const target = document.querySelector('#webmcp-bishop-id');
  if (!target) return;

  const observer = new MutationObserver(() => scheduleRender());
  observer.observe(target, {
    childList: true,
    characterData: true,
    subtree: true,
  });
}

function startStartupSync() {
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    scheduleRender();
    const chips = document.querySelectorAll('.semantic-tool-chip[data-tool]').length;
    if (chips >= expectedToolCount || attempts >= 60) window.clearInterval(timer);
  }, 100);
}

// agent-view-surface-sync.js owns WebMCP tool discovery. This spectator board
// deliberately never calls document.modelContext.getTools() while an agent tool
// may be executing; it only decorates the already synchronized DOM surface.
window.addEventListener('matched:agent-view-trace', recordTrace);
document.addEventListener('click', (event) => {
  if (event.target.closest('.bishop-chip')) window.setTimeout(scheduleRender, 0);
});
observeSelectedBishop();
startStartupSync();
scheduleRender();
