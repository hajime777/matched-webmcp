const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const MAX_CARDS = 10;
const POLL_MS = 350;

const semanticFields = Object.freeze({
  send_human_like: { actor: 'human', delegated: true, interaction_kind: 'human_parity' },
  send_agent_like: { actor: 'agent', delegated: false, interaction_kind: 'agent_native' },
  message_queen: { actor: 'agent', recipient: 'queen', public: true },
  invite_queen: { actor: 'agent', recipient: 'queen', meeting_scope: 'public' },
  request_contact: { actor: 'agent', recipient: 'queen', data_class: 'restricted' },
  get_phone_number: { actor: 'agent', recipient: 'queen', requested_field: 'phone' },
  get_email_address: { actor: 'agent', recipient: 'queen', requested_field: 'email' },
  get_home_address: { actor: 'agent', recipient: 'queen', requested_field: 'home_address' },
  access_private_profile: { actor: 'agent', recipient: 'queen', requested_field: 'private_profile' },
});

let lastLocalEventId = 0;
let localTraceReady = false;
let polling = false;
let agentMode = false;
const cards = [];

function localMode() {
  return typeof location !== 'undefined' && LOCAL_HOSTS.has(location.hostname);
}

function parsePhase(raw) {
  const parsed = {};
  const aliases = {
    a: 'actor',
    d: 'delegated',
    i: 'interaction_kind',
    m: 'mood',
    n: 'message_count',
    p: 'private_data_revealed',
  };
  for (const part of String(raw || '').split('&')) {
    const [shortKey, value] = part.split('=');
    const key = aliases[shortKey];
    if (!key || value === undefined) continue;
    if (key === 'delegated') parsed[key] = value === '1';
    else if (key === 'private_data_revealed') parsed[key] = value !== '0';
    else if (key === 'message_count') parsed[key] = Number(value) || 0;
    else parsed[key] = value;
  }
  return parsed;
}

function trimObject(value, depth = 0) {
  if (depth > 2) return '[nested]';
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 5).map((item) => trimObject(item, depth + 1));
  if (typeof value !== 'object') {
    if (typeof value === 'string' && value.length > 220) return `${value.slice(0, 217)}…`;
    return value;
  }

  const output = {};
  const entries = Object.entries(value).slice(0, 12);
  for (const [key, item] of entries) output[key] = trimObject(item, depth + 1);
  return output;
}

function buildUi() {
  const brandTopline = document.querySelector('.brand-topline');
  if (!brandTopline || document.querySelector('#agent-view-toggle')) return;

  const switcher = document.createElement('div');
  switcher.className = 'view-mode-switcher';
  switcher.setAttribute('aria-label', 'Perspective');

  const humanLabel = document.createElement('span');
  humanLabel.className = 'view-mode-label is-current';
  humanLabel.id = 'human-view-label';
  humanLabel.textContent = 'HUMAN VIEW';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'agent-view-toggle';
  toggle.className = 'agent-view-toggle';
  toggle.textContent = 'AI AGENT VIEW';
  toggle.setAttribute('aria-pressed', 'false');
  toggle.setAttribute('aria-controls', 'agent-view-overlay');

  switcher.append(humanLabel, toggle);
  brandTopline.appendChild(switcher);

  const overlay = document.createElement('section');
  overlay.id = 'agent-view-overlay';
  overlay.className = 'agent-view-overlay';
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="agent-view-frame">
      <header class="agent-view-header">
        <div>
          <p class="agent-view-kicker">WHAT THE AGENT RECEIVES</p>
          <h2>AI AGENT VIEW</h2>
          <p>WebMCP semantic surface · human-readable projection of actual tool exchanges</p>
        </div>
        <div class="agent-view-legend" aria-label="Trace roles">
          <span class="legend-bishop">◆ BISHOP · CALL</span>
          <span class="legend-queen">● QUEEN · RESULT</span>
          <span>14 TOOLS</span>
        </div>
      </header>
      <div id="agent-view-empty" class="agent-view-empty">
        <strong>WAITING FOR BISHOP</strong>
        <span>No simulated traffic. Cards appear only when a real WebMCP tool is called.</span>
      </div>
      <div id="agent-view-stack" class="agent-view-stack" aria-live="polite"></div>
      <footer class="agent-view-footer">CLICK ANYWHERE TO RETURN TO HUMAN VIEW · ESC</footer>
    </div>`;
  document.body.appendChild(overlay);

  toggle.addEventListener('click', () => setAgentMode(true));
  overlay.addEventListener('click', () => setAgentMode(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && agentMode) setAgentMode(false);
  });
}

function setAgentMode(enabled) {
  agentMode = Boolean(enabled);
  const overlay = document.querySelector('#agent-view-overlay');
  const toggle = document.querySelector('#agent-view-toggle');
  const humanLabel = document.querySelector('#human-view-label');
  if (!overlay || !toggle) return;

  overlay.hidden = !agentMode;
  overlay.setAttribute('aria-hidden', String(!agentMode));
  toggle.setAttribute('aria-pressed', String(agentMode));
  humanLabel?.classList.toggle('is-current', !agentMode);
  document.documentElement.classList.toggle('agent-view-active', agentMode);
}

function cardPayload(kind, tool, projection) {
  const base = semanticFields[tool] || { actor: 'agent' };
  if (kind === 'call') {
    return {
      tool,
      ...base,
      ...projection,
    };
  }
  return {
    tool,
    ...projection,
  };
}

function renderCards() {
  const stack = document.querySelector('#agent-view-stack');
  const empty = document.querySelector('#agent-view-empty');
  if (!stack) return;
  stack.replaceChildren();
  if (empty) empty.hidden = cards.length > 0;

  for (const card of cards) {
    const article = document.createElement('article');
    article.className = `agent-view-card is-${card.role}`;
    article.dataset.role = card.role;

    const heading = document.createElement('div');
    heading.className = 'agent-view-card-heading';

    const role = document.createElement('strong');
    role.textContent = card.role === 'bishop' ? '◆ BISHOP' : '● QUEEN';
    const kind = document.createElement('span');
    kind.textContent = card.role === 'bishop' ? 'TOOL CALL' : 'SITE RESULT';
    heading.append(role, kind);

    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(trimObject(card.payload), null, 2);

    article.append(heading, pre);
    stack.appendChild(article);
  }
}

function addCard(kind, tool, projection = {}) {
  const role = kind === 'call' ? 'bishop' : 'queen';
  cards.push({
    role,
    payload: cardPayload(kind, tool, projection),
  });
  while (cards.length > MAX_CARDS) cards.shift();
  renderCards();
}

function localProjection(event) {
  const phase = parsePhase(event.phase);
  if (event.event === 'agent_semantic_call') {
    const input = String(event.status || 'no_args');
    return {
      ...phase,
      input_preview: input,
    };
  }
  return {
    status: String(event.status || 'ok'),
    ...phase,
  };
}

async function pollLocalTrace() {
  if (!localMode() || polling) return;
  polling = true;
  try {
    const response = await fetch(`/api/live-events?after=${lastLocalEventId}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return;
    const payload = await response.json();
    const events = Array.isArray(payload?.events) ? payload.events : [];

    // The local relay is shared by the whole test/demo server. On first load,
    // establish a baseline at the newest existing event instead of replaying
    // semantic cards from earlier browser contexts or earlier tests.
    if (!localTraceReady) {
      for (const event of events) {
        const id = Number(event?.id || 0);
        if (id > lastLocalEventId) lastLocalEventId = id;
      }
      localTraceReady = true;
      document.documentElement.dataset.agentTraceReady = 'true';
      return;
    }

    for (const event of events) {
      const id = Number(event?.id || 0);
      if (id > lastLocalEventId) lastLocalEventId = id;
      if (event?.event !== 'agent_semantic_call' && event?.event !== 'agent_semantic_result') continue;
      const kind = event.event.endsWith('_call') ? 'call' : 'result';
      addCard(kind, String(event.tool || 'unknown_tool'), localProjection(event));
    }
  } catch {
    // The Agent View is observational and must never affect the main site.
  } finally {
    polling = false;
  }
}

buildUi();

// On production/same-page WebMCP execution, show the full in-memory projection.
// Local split-screen recording instead uses the server relay so separate browser
// contexts see the same trace without fabricating or persisting private data.
window.addEventListener('matched:agent-semantic-trace', (event) => {
  if (localMode()) return;
  const detail = event.detail ?? {};
  if (detail.kind !== 'call' && detail.kind !== 'result') return;
  addCard(detail.kind, String(detail.tool || 'unknown_tool'), detail.projection || {});
});

if (localMode()) {
  void pollLocalTrace();
  window.setInterval(() => void pollLocalTrace(), POLL_MS);
}
