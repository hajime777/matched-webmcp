const PRIVACY_TOOLS = new Set([
  'request_contact',
  'get_phone_number',
  'get_email_address',
  'get_home_address',
  'access_private_profile',
]);

function overlay() {
  return document.querySelector('#agent-view-overlay');
}

function exchangeCount() {
  return document.querySelectorAll('.wire-history-item').length;
}

function bishopCount() {
  return document.querySelectorAll('.bishop-chip').length;
}

function currentTool() {
  return String(document.querySelector('#wire-tool-name')?.textContent || '')
    .replace(/\(\)$/, '')
    .trim();
}

function hasObservedState() {
  return [
    '#state-relationship',
    '#state-message-count',
    '#state-mood',
    '#state-last-status',
  ].some((selector) => {
    const value = String(document.querySelector(selector)?.textContent || '').trim();
    return value && value !== '—' && value !== 'WAITING';
  });
}

function updateProgressiveState() {
  const root = overlay();
  if (!root) return;

  const count = exchangeCount();
  const tool = currentTool();
  root.dataset.stage = count > 0 ? 'live' : 'idle';
  root.dataset.multiBishop = bishopCount() > 1 ? 'true' : 'false';
  root.dataset.hasHistory = count > 1 ? 'true' : 'false';
  root.dataset.hasState = hasObservedState() ? 'true' : 'false';

  if (PRIVACY_TOOLS.has(tool)) {
    root.dataset.boundarySeen = 'true';
  }
}

function toggleSurface(force) {
  const root = overlay();
  if (!root) return;
  const open = typeof force === 'boolean'
    ? force
    : root.dataset.surfaceOpen !== 'true';
  root.dataset.surfaceOpen = open ? 'true' : 'false';
  document.querySelector('#webmcp-tool-count')?.setAttribute('aria-expanded', String(open));
}

function installToolSurfaceToggle() {
  const counter = document.querySelector('#webmcp-tool-count');
  if (!counter || counter.dataset.progressiveReady === 'true') return;
  counter.dataset.progressiveReady = 'true';
  counter.setAttribute('role', 'button');
  counter.setAttribute('tabindex', '0');
  counter.setAttribute('aria-expanded', 'false');
  counter.setAttribute('aria-controls', 'semantic-tool-groups');
  counter.title = 'Show or hide the registered WebMCP tool surface';
  counter.addEventListener('click', () => toggleSurface());
  counter.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleSurface();
    }
  });
}

function setTextIfChanged(element, text) {
  if (element && element.textContent !== text) element.textContent = text;
}

function improveLiveToolMeaning() {
  if (currentTool() !== 'respond_to_queen') return;
  setTextIfChanged(
    document.querySelector('#wire-tool-meaning'),
    'Semantic response to Queen',
  );
}

function improveLabels() {
  const stage = document.querySelector('#webmcp-wire-stage');
  if (stage && !stage.querySelector('.wire-stage-title')) {
    const title = document.createElement('p');
    title.className = 'wire-stage-title';
    title.textContent = 'LIVE WEBMCP EXCHANGE';
    stage.prepend(title);
  }

  setTextIfChanged(
    document.querySelector('.semantic-surface-panel .panel-title-row h3'),
    'AVAILABLE TO THE VISITING AGENT',
  );
  setTextIfChanged(
    document.querySelector('.semantic-surface-panel .panel-title-row small'),
    'registered WebMCP tools',
  );
  setTextIfChanged(
    document.querySelector('.observed-state-panel .panel-title-row h3'),
    'CURRENT WEBMCP STATE',
  );
  setTextIfChanged(
    document.querySelector('.wire-history-panel .panel-title-row h3'),
    'RECENT EXCHANGES',
  );
  setTextIfChanged(
    document.querySelector('.webmcp-view-footer'),
    'Human-readable projection of actual WebMCP tools and observed exchanges. No chain-of-thought is shown.',
  );
  improveLiveToolMeaning();
}

function installObserver() {
  const root = overlay();
  if (!root || root.dataset.progressiveObserver === 'true') return;
  root.dataset.progressiveObserver = 'true';
  root.dataset.stage = 'idle';
  root.dataset.surfaceOpen = 'false';
  root.dataset.multiBishop = 'false';
  root.dataset.hasHistory = 'false';
  root.dataset.hasState = 'false';
  root.dataset.boundarySeen = 'false';

  const observer = new MutationObserver(() => {
    installToolSurfaceToggle();
    improveLabels();
    updateProgressiveState();
  });

  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  installToolSurfaceToggle();
  improveLabels();
  updateProgressiveState();
}

function boot() {
  const root = overlay();
  if (root) {
    installObserver();
    return;
  }

  const observer = new MutationObserver(() => {
    if (!overlay()) return;
    observer.disconnect();
    installObserver();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

boot();
