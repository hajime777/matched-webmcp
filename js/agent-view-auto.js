const AUTO_VIEW_STORAGE_KEY = 'matched:webmcp-auto-view';

let autoViewEnabled = readAutoViewPreference();
let wireObserver = null;
let semanticCallObserverInstalled = false;

function readAutoViewPreference() {
  try {
    return window.localStorage.getItem(AUTO_VIEW_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeAutoViewPreference(enabled) {
  try {
    window.localStorage.setItem(AUTO_VIEW_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // The preference is convenience-only; storage failure must not affect the page.
  }
}

function syncAutoButtons() {
  document.querySelectorAll('[data-webmcp-auto-toggle]').forEach((button) => {
    button.textContent = autoViewEnabled ? 'AUTO' : 'MANUAL';
    button.setAttribute('aria-pressed', String(autoViewEnabled));
    button.dataset.state = autoViewEnabled ? 'auto' : 'manual';
    button.setAttribute('aria-label', autoViewEnabled
      ? 'WEBMCP VIEW mode: AUTO. Click to switch to MANUAL.'
      : 'WEBMCP VIEW mode: MANUAL. Click to switch to AUTO.');
    button.title = autoViewEnabled
      ? 'AUTO: show WEBMCP VIEW automatically when a new WebMCP tool call starts. Click for MANUAL.'
      : 'MANUAL: keep HUMAN VIEW in front until WEBMCP VIEW is opened manually. Click for AUTO.';
  });
}

function setAutoViewEnabled(enabled) {
  autoViewEnabled = Boolean(enabled);
  writeAutoViewPreference(autoViewEnabled);
  syncAutoButtons();

  if (autoViewEnabled && document.querySelector('#wire-result-status')?.textContent?.trim() === 'WAITING FOR QUEEN') {
    showWebMcpView();
  }
}

function createAutoButton(id) {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = id;
  button.className = 'agent-view-auto-toggle';
  button.dataset.webmcpAutoToggle = 'true';
  button.addEventListener('click', () => setAutoViewEnabled(!autoViewEnabled));
  return button;
}

function installAutoControls() {
  const switcher = document.querySelector('.view-mode-switcher');
  if (switcher && !document.querySelector('#agent-view-auto-toggle')) {
    switcher.appendChild(createAutoButton('agent-view-auto-toggle'));
  }

  const headerActions = document.querySelector('.webmcp-view-header-actions');
  if (headerActions && !document.querySelector('#webmcp-view-auto-toggle')) {
    const button = createAutoButton('webmcp-view-auto-toggle');
    const returnButton = headerActions.querySelector('#webmcp-return');
    if (returnButton) headerActions.insertBefore(button, returnButton);
    else headerActions.appendChild(button);
  }

  syncAutoButtons();
  return Boolean(switcher && headerActions);
}

function showWebMcpView() {
  if (!autoViewEnabled) return;
  const overlay = document.querySelector('#agent-view-overlay');
  if (!overlay || !overlay.hidden) return;
  document.querySelector('#agent-view-toggle')?.click();
}

function observeSemanticCallStart() {
  if (semanticCallObserverInstalled) return true;

  window.addEventListener('matched:agent-semantic-trace', (event) => {
    if (event.detail?.kind === 'call') showWebMcpView();
  });
  semanticCallObserverInstalled = true;
  return true;
}

function observeWireCallStart() {
  const status = document.querySelector('#wire-result-status');
  if (!status || wireObserver) return Boolean(status);

  let previousStatus = status.textContent.trim();
  wireObserver = new MutationObserver(() => {
    const currentStatus = status.textContent.trim();
    const startedNewCall = currentStatus === 'WAITING FOR QUEEN' && previousStatus !== 'WAITING FOR QUEEN';
    previousStatus = currentStatus;
    if (startedNewCall) showWebMcpView();
  });
  wireObserver.observe(status, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  return true;
}

function bootAutoView() {
  observeSemanticCallStart();

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const controlsReady = installAutoControls();
    const observerReady = observeWireCallStart();
    if ((controlsReady && observerReady) || attempts >= 200) {
      window.clearInterval(timer);
      syncAutoButtons();
      document.documentElement.dataset.webmcpAutoViewReady = controlsReady && observerReady ? 'true' : 'error';
    }
  }, 25);
}

bootAutoView();
