const query = new URLSearchParams(window.location.search);
const enabled = query.get('challenge') === '1';

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

function ensureLegend(panel) {
  if (panel.querySelector('.challenge-tool-legend')) return;
  const titleRow = panel.querySelector('.panel-title-row');
  const subtitle = titleRow?.querySelector('small');
  if (subtitle) subtitle.textContent = 'fixed choices · selected Bishop';

  const legend = document.createElement('div');
  legend.className = 'challenge-tool-legend';
  legend.setAttribute('aria-label', 'Tool call states');
  legend.innerHTML = `
    <span class="is-unused">UNUSED</span>
    <span class="is-called">CALLED</span>
    <span class="is-locked">LOCKED</span>
    <span class="is-refused">REFUSED</span>
  `;
  titleRow?.insertAdjacentElement('afterend', legend);
}

async function ensureCompleteToolSurface(container) {
  if (!document.modelContext?.getTools) return;

  let tools;
  try {
    tools = await document.modelContext.getTools();
  } catch {
    return;
  }

  const existing = new Set(
    [...container.querySelectorAll('.semantic-tool-chip[data-tool]')]
      .map((element) => element.dataset.tool),
  );

  const missing = tools.filter((tool) => !existing.has(String(tool.name)));
  if (!missing.length) return;

  let group = container.querySelector('.semantic-tool-group.is-dialogue');
  if (!group) {
    group = document.createElement('section');
    group.className = 'semantic-tool-group is-dialogue';
    const heading = document.createElement('h4');
    heading.textContent = 'DIALOGUE';
    const list = document.createElement('div');
    list.className = 'semantic-tool-list';
    group.append(heading, list);
    container.appendChild(group);
  }

  const list = group.querySelector('.semantic-tool-list');
  for (const tool of missing) {
    const chip = document.createElement('span');
    chip.className = 'semantic-tool-chip';
    chip.dataset.tool = String(tool.name);
    chip.textContent = `${tool.name}()`;
    if (tool.description) chip.title = String(tool.description);
    list?.appendChild(chip);
  }
}

function decorateChip(chip, state) {
  const calls = state?.calls || 0;
  const kind = calls > 0 ? statusClass(state.lastStatus) : 'unused';
  const badgeText = calls > 0 ? `#${calls} · ${statusLabel(state.lastStatus)}` : '';

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

  if (calls === 0) return;

  chip.classList.add(`is-${kind}`);
  const badge = document.createElement('small');
  badge.className = 'challenge-tool-state';
  badge.textContent = badgeText;
  chip.appendChild(badge);
}

async function render() {
  renderQueued = false;
  if (!enabled) return;

  const panel = document.querySelector('.semantic-surface-panel');
  const container = document.querySelector('#semantic-tool-groups');
  if (!panel || !container) return;

  ensureLegend(panel);
  await ensureCompleteToolSurface(container);

  const bishopId = selectedBishopId();
  for (const chip of container.querySelectorAll('.semantic-tool-chip[data-tool]')) {
    decorateChip(chip, toolStateFor(bishopId, chip.dataset.tool));
  }
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(() => void render());
}

function recordTrace(event) {
  if (!enabled) return;
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

  // Local WEBMCP VIEW intentionally consumes the relayed event stream, while
  // this board records the immediate browser trace. The relay can select the
  // Bishop a few hundred milliseconds later, so re-render exactly when that
  // displayed selection changes instead of observing the whole DOM.
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
    if (chips >= 15 || attempts >= 60) window.clearInterval(timer);
  }, 100);
}

if (enabled) {
  window.addEventListener('matched:agent-semantic-trace', recordTrace);
  document.addEventListener('click', (event) => {
    if (event.target.closest('.bishop-chip')) window.setTimeout(scheduleRender, 0);
  });
  observeSelectedBishop();
  startStartupSync();
  scheduleRender();
}
