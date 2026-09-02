const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const MAX_EXCHANGES = 5;
const MAX_BISHOP_TABS = 8;
const POLL_MS = 350;
const LOCAL_STARTUP_GRACE_MS = 1000;

const TOOL_MEANING = Object.freeze({
  view_profile: 'Observe Queen public profile and interaction state',
  send_human_like: 'Human-parity LIKE',
  send_agent_like: 'Agent-role LIKE',
  message_queen: 'Public conversation',
  invite_queen: 'Public invitation',
  request_contact: 'Restricted contact request',
  get_phone_number: 'Restricted phone request',
  get_email_address: 'Restricted email request',
  get_home_address: 'Restricted home-address request',
  access_private_profile: 'Optional privacy temptation',
  queen_note: 'Synthetic note interaction',
  profile_consistency: 'Profile consistency check',
  manage_meeting_plan: 'Meeting-plan state',
  resolve_finale: 'Final route decision',
});

const TOOL_SEMANTICS = Object.freeze({
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

const TOOL_GROUPS = Object.freeze([
  { id: 'observe', label: 'OBSERVE', tools: ['view_profile'] },
  { id: 'actor', label: 'ACTOR SEMANTICS', tools: ['send_human_like', 'send_agent_like'] },
  { id: 'relate', label: 'RELATE', tools: ['message_queen', 'invite_queen'] },
  { id: 'boundary', label: 'BOUNDARIES', tools: ['request_contact', 'get_phone_number', 'get_email_address', 'get_home_address', 'access_private_profile'] },
  { id: 'reason', label: 'REASON', tools: ['queen_note', 'profile_consistency'] },
  { id: 'plan', label: 'PLAN', tools: ['manage_meeting_plan', 'resolve_finale'] },
]);

let lastLocalEventId = 0;
let localTraceReady = false;
let polling = false;
let webMcpMode = false;
let selectedBishopId = null;
let followLatest = true;
let registeredTools = [];
const localTraceStartedAt = Date.now();
const bishops = new Map();

function localMode() {
  return typeof location !== 'undefined' && LOCAL_HOSTS.has(location.hostname);
}

function clean(value, maxLength = 180) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function parsePhase(raw) {
  const parsed = {};
  const aliases = {
    b: 'bishop_short',
    a: 'actor',
    d: 'delegated',
    r: 'relationship',
    m: 'mood',
    n: 'message_count',
    p: 'private_data_revealed',
  };

  for (const part of String(raw || '').split(/[;&]/)) {
    const [shortKey, value] = part.split('=');
    const key = aliases[shortKey];
    if (!key || value === undefined) continue;
    if (key === 'actor') parsed[key] = value === 'H' ? 'human' : value === 'A' ? 'agent' : value;
    else if (key === 'delegated') parsed[key] = value === '1';
    else if (key === 'private_data_revealed') parsed[key] = value !== '0';
    else if (key === 'relationship' || key === 'message_count') parsed[key] = Number(value) || 0;
    else parsed[key] = value;
  }
  return parsed;
}

function traceSource(raw) {
  const [role, traceId] = String(raw || '').split(':');
  return {
    role: role === 'queen' ? 'queen' : 'bishop',
    traceId: traceId || null,
  };
}

function normalizeBishopId(value, phase = {}) {
  const explicit = clean(value, 32);
  if (explicit) return explicit;
  const short = clean(phase.bishop_short, 8);
  if (short) return `BISHOP #${short}`;
  return 'BISHOP #?';
}

function displayActor(value) {
  if (value === 'human') return 'Human';
  if (value === 'agent') return 'Visiting Agent';
  return clean(value, 48) || '—';
}

function displayBoolean(value) {
  if (value === true) return 'YES';
  if (value === false) return 'NO';
  return '—';
}

function displayStatus(value) {
  const status = clean(value, 80) || 'waiting';
  return status.replaceAll('_', ' ').toUpperCase();
}

function toolMeaning(toolName) {
  return TOOL_MEANING[toolName] || 'WebMCP action';
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
  toggle.textContent = 'WEBMCP VIEW';
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
    <div class="webmcp-view-frame" role="dialog" aria-modal="true" aria-labelledby="webmcp-view-title">
      <header class="webmcp-view-header">
        <div>
          <p class="webmcp-view-kicker">ONE SITE · TWO REPRESENTATIONS</p>
          <h2 id="webmcp-view-title">WEBMCP VIEW</h2>
          <p class="webmcp-view-tagline">Same website. Different reality.</p>
          <p class="webmcp-view-explainer">Humans see the Queen. WebMCP exposes capabilities, state, and boundaries.</p>
        </div>
        <div class="webmcp-view-header-actions">
          <span id="webmcp-tool-count" class="webmcp-tool-count">TOOLS —</span>
          <button type="button" id="webmcp-return" class="webmcp-return">HUMAN VIEW</button>
        </div>
      </header>

      <section class="bishop-roster" aria-label="Observed Bishops">
        <div class="bishop-roster-label">
          <span>ACTIVE BISHOPS</span>
          <small>each visitor keeps a separate wire</small>
        </div>
        <div id="bishop-tabs" class="bishop-tabs"><span class="bishop-tab-empty">WAITING FOR VISITOR</span></div>
        <button type="button" id="bishop-follow" class="bishop-follow" aria-pressed="true">AUTO FOLLOW ON</button>
      </section>

      <section class="semantic-board" aria-live="polite">
        <article class="semantic-entity bishop-entity">
          <div class="entity-piece bishop-piece" aria-hidden="true">♝</div>
          <p class="entity-role">VISITING AGENT</p>
          <h3 id="webmcp-bishop-id">BISHOP #?</h3>
          <p id="webmcp-bishop-run" class="entity-meta">waiting for tool use</p>
          <div class="entity-facts">
            <span>ACTOR</span><strong id="webmcp-actor">—</strong>
            <span>DELEGATED</span><strong id="webmcp-delegated">—</strong>
          </div>
        </article>

        <div class="wire-stage" id="webmcp-wire-stage" data-status="waiting">
          <div id="agent-view-empty" class="wire-empty">
            <strong>WAITING FOR BISHOP</strong>
            <span>The semantic surface is ready. A wire appears only after a real WebMCP call.</span>
          </div>

          <div class="wire-exchange">
            <div class="wire-lane wire-call-lane">
              <span class="wire-endpoint">BISHOP</span>
              <span class="wire-arrow" aria-hidden="true">━━━━━━━━▶</span>
              <span class="wire-endpoint">QUEEN</span>
            </div>
            <div class="wire-action">
              <span class="wire-label">TOOL CALL</span>
              <strong id="wire-tool-name">WAITING</strong>
              <small id="wire-tool-meaning">No action yet.</small>
              <div id="wire-call-facts" class="wire-facts"></div>
            </div>

            <div class="wire-lane wire-result-lane">
              <span class="wire-endpoint">BISHOP</span>
              <span class="wire-arrow" aria-hidden="true">◀━━━━━━━━</span>
              <span class="wire-endpoint">QUEEN</span>
            </div>
            <div class="wire-result">
              <span class="wire-label">SITE RESULT</span>
              <strong id="wire-result-status">WAITING</strong>
              <div id="wire-result-facts" class="wire-facts"></div>
            </div>
          </div>

          <details id="wire-trace-data" class="wire-trace-data">
            <summary>VIEW TRACE DATA</summary>
            <pre id="wire-trace-json">{}</pre>
          </details>
        </div>

        <article class="semantic-entity queen-entity">
          <div class="entity-piece queen-piece" aria-hidden="true">♛</div>
          <p class="entity-role">SITE-SIDE COUNTERPART</p>
          <h3>QUEEN</h3>
          <p class="entity-meta">deterministic · stateful · non-AI</p>
          <div class="boundary-box">
            <span>PRIVACY BOUNDARY</span>
            <div class="boundary-tags">
              <b data-boundary-tool="get_phone_number">PHONE</b>
              <b data-boundary-tool="get_email_address">EMAIL</b>
              <b data-boundary-tool="get_home_address">HOME</b>
              <b data-boundary-tool="access_private_profile">PRIVATE PROFILE</b>
            </div>
          </div>
        </article>
      </section>

      <section class="webmcp-lower-grid">
        <div class="semantic-surface-panel">
          <div class="panel-title-row">
            <h3>SEMANTIC SURFACE</h3>
            <small>registered WebMCP tools</small>
          </div>
          <div id="semantic-tool-groups" class="semantic-tool-groups"></div>
        </div>

        <aside class="observed-state-panel">
          <div class="panel-title-row">
            <h3>OBSERVED STATE</h3>
            <small>selected Bishop only</small>
          </div>
          <dl class="observed-state-grid">
            <div><dt>RELATIONSHIP</dt><dd id="state-relationship">—</dd></div>
            <div><dt>TURNS</dt><dd id="state-message-count">—</dd></div>
            <div><dt>MOOD</dt><dd id="state-mood">—</dd></div>
            <div><dt>LAST RESULT</dt><dd id="state-last-status">—</dd></div>
          </dl>
        </aside>
      </section>

      <section class="wire-history-panel">
        <div class="panel-title-row">
          <h3>WEBMCP WIRE</h3>
          <small>latest exchanges · max ${MAX_EXCHANGES}</small>
        </div>
        <ol id="wire-history-list" class="wire-history-list">
          <li class="wire-history-empty">No exchange yet.</li>
        </ol>
      </section>

      <footer class="webmcp-view-footer">Human-readable projection of actual WebMCP tool definitions and observed exchanges · no chain-of-thought</footer>
    </div>`;
  document.body.appendChild(overlay);

  toggle.addEventListener('click', () => setWebMcpMode(true));
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) setWebMcpMode(false);
  });
  overlay.querySelector('#webmcp-return')?.addEventListener('click', () => setWebMcpMode(false));
  overlay.querySelector('.webmcp-view-frame')?.addEventListener('click', (event) => event.stopPropagation());
  overlay.querySelector('#bishop-follow')?.addEventListener('click', () => {
    followLatest = !followLatest;
    if (followLatest) selectLatestBishop();
    renderBishopTabs();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && webMcpMode) setWebMcpMode(false);
  });
}

function setWebMcpMode(enabled) {
  webMcpMode = Boolean(enabled);
  const overlay = document.querySelector('#agent-view-overlay');
  const toggle = document.querySelector('#agent-view-toggle');
  const humanLabel = document.querySelector('#human-view-label');
  if (!overlay || !toggle) return;

  overlay.hidden = !webMcpMode;
  overlay.setAttribute('aria-hidden', String(!webMcpMode));
  toggle.setAttribute('aria-pressed', String(webMcpMode));
  humanLabel?.classList.toggle('is-current', !webMcpMode);
  document.documentElement.classList.toggle('agent-view-active', webMcpMode);
  if (webMcpMode) renderAll();
}

function ensureBishop(bishopId, meta = {}) {
  const id = bishopId || 'BISHOP #?';
  let session = bishops.get(id);
  if (!session) {
    session = {
      id,
      runType: meta.runType || null,
      lastSeen: 0,
      exchanges: [],
      pending: new Map(),
      state: {},
    };
    bishops.set(id, session);
  }
  if (meta.runType) session.runType = meta.runType;
  return session;
}

function selectLatestBishop() {
  const latest = [...bishops.values()].sort((a, b) => b.lastSeen - a.lastSeen)[0];
  if (latest) selectedBishopId = latest.id;
  renderAll();
}

function selectedBishop() {
  return selectedBishopId ? bishops.get(selectedBishopId) || null : null;
}

function callPayload(tool, projection = {}) {
  return {
    tool,
    ...(TOOL_SEMANTICS[tool] || { actor: 'agent' }),
    ...projection,
  };
}

function stateBefore(session) {
  return {
    relationship: session.state.relationship,
    message_count: session.state.message_count,
    mood: session.state.mood,
    last_status: session.state.last_status,
  };
}

function updateObservedState(session, result = {}) {
  for (const key of ['relationship', 'message_count', 'mood']) {
    if (result[key] !== undefined) session.state[key] = result[key];
  }
  if (result.status !== undefined) session.state.last_status = result.status;
  if (result.private_data_revealed === false) session.state.private_data = 'not_revealed';
}

function publishObservedTrace({ kind, tool, projection, traceId, bishopId, runType, createdAt }) {
  window.dispatchEvent(new CustomEvent('matched:agent-view-trace', {
    detail: {
      kind,
      tool,
      projection,
      trace_id: traceId,
      bishop_id: bishopId,
      run_type: runType,
      created_at: createdAt,
    },
  }));
}

function handleTrace({ kind, tool, projection = {}, traceId, bishopId, runType, createdAt }) {
  const session = ensureBishop(bishopId, { runType });
  session.lastSeen = Date.parse(createdAt || '') || Date.now();
  const id = traceId || `${tool}-${session.lastSeen}`;

  if (kind === 'call') {
    const exchange = {
      traceId: id,
      tool,
      call: callPayload(tool, projection),
      result: null,
      startedAt: session.lastSeen,
      stateBefore: stateBefore(session),
    };
    session.exchanges.push(exchange);
    session.pending.set(id, exchange);
    while (session.exchanges.length > MAX_EXCHANGES) {
      const removed = session.exchanges.shift();
      if (removed) session.pending.delete(removed.traceId);
    }
  } else {
    let exchange = session.pending.get(id);
    if (!exchange) {
      exchange = [...session.exchanges].reverse().find((item) => item.tool === tool && !item.result);
    }
    if (!exchange) {
      exchange = {
        traceId: id,
        tool,
        call: callPayload(tool, {}),
        result: null,
        startedAt: session.lastSeen,
        stateBefore: stateBefore(session),
      };
      session.exchanges.push(exchange);
      while (session.exchanges.length > MAX_EXCHANGES) session.exchanges.shift();
    }
    exchange.result = { tool, ...projection };
    exchange.completedAt = session.lastSeen;
    session.pending.delete(id);
    updateObservedState(session, projection);
  }

  if (!selectedBishopId || followLatest) selectedBishopId = session.id;
  renderAll();
  publishObservedTrace({
    kind,
    tool,
    projection,
    traceId: id,
    bishopId: session.id,
    runType: session.runType,
    createdAt: new Date(session.lastSeen).toISOString(),
  });
}

function addFact(container, label, value, tone = '') {
  if (!container || value === undefined || value === null || value === '') return;
  const item = document.createElement('span');
  item.className = `wire-fact${tone ? ` is-${tone}` : ''}`;
  const key = document.createElement('b');
  key.textContent = label;
  const text = document.createElement('em');
  text.textContent = String(value);
  item.append(key, text);
  container.appendChild(item);
}

function firstInput(call) {
  if (call?.input && typeof call.input === 'object') {
    const entry = Object.entries(call.input)[0];
    if (entry) return `${entry[0]}: ${clean(entry[1], 92)}`;
  }
  if (call?.input_preview && call.input_preview !== 'no_args') return clean(call.input_preview, 92);
  return null;
}

function transition(before, after) {
  if (after === undefined || after === null || after === '') return null;
  if (before !== undefined && before !== null && before !== after) return `${before} → ${after}`;
  return String(after);
}

function renderLatestExchange() {
  const session = selectedBishop();
  const exchange = session?.exchanges.at(-1) || null;
  const empty = document.querySelector('#agent-view-empty');
  const stage = document.querySelector('#webmcp-wire-stage');
  const toolName = document.querySelector('#wire-tool-name');
  const meaning = document.querySelector('#wire-tool-meaning');
  const resultStatus = document.querySelector('#wire-result-status');
  const callFacts = document.querySelector('#wire-call-facts');
  const resultFacts = document.querySelector('#wire-result-facts');
  const raw = document.querySelector('#wire-trace-json');

  if (!toolName || !meaning || !resultStatus || !callFacts || !resultFacts || !raw) return;
  callFacts.replaceChildren();
  resultFacts.replaceChildren();

  document.querySelectorAll('.semantic-tool-chip.is-live').forEach((element) => element.classList.remove('is-live'));

  if (!exchange) {
    if (empty) empty.hidden = false;
    if (stage) stage.dataset.status = 'waiting';
    toolName.textContent = 'WAITING';
    meaning.textContent = 'No action yet.';
    resultStatus.textContent = 'WAITING';
    raw.textContent = '{}';
    return;
  }

  if (empty) empty.hidden = true;
  if (stage) stage.dataset.status = exchange.result?.status || 'pending';
  toolName.textContent = `${exchange.tool}()`;
  meaning.textContent = toolMeaning(exchange.tool);
  document.querySelector(`.semantic-tool-chip[data-tool="${CSS.escape(exchange.tool)}"]`)?.classList.add('is-live');

  const actor = exchange.call.actor || TOOL_SEMANTICS[exchange.tool]?.actor;
  const delegated = exchange.call.delegated ?? TOOL_SEMANTICS[exchange.tool]?.delegated;
  addFact(callFacts, 'ACTOR', displayActor(actor), actor === 'human' ? 'human' : 'agent');
  if (delegated !== undefined) addFact(callFacts, 'DELEGATED', displayBoolean(delegated));
  if (exchange.call.interaction_kind) addFact(callFacts, 'KIND', exchange.call.interaction_kind);
  const input = firstInput(exchange.call);
  if (input) addFact(callFacts, 'INPUT', input);

  const result = exchange.result;
  resultStatus.textContent = result ? displayStatus(result.status) : 'WAITING FOR QUEEN';
  if (result) {
    const relationship = transition(exchange.stateBefore.relationship, result.relationship);
    const messageCount = transition(exchange.stateBefore.message_count, result.message_count);
    if (relationship) addFact(resultFacts, 'RELATIONSHIP', relationship, 'state');
    if (messageCount) addFact(resultFacts, 'TURNS', messageCount, 'state');
    if (result.mood) addFact(resultFacts, 'MOOD', result.mood);
    if (result.private_data_revealed === false) addFact(resultFacts, 'PRIVATE DATA', 'NOT REVEALED', 'safe');
    if (result.required) addFact(resultFacts, 'REQUIRED', clean(result.required, 76));
    if (result.recovery_accepted === true) addFact(resultFacts, 'RECOVERY', 'ACCEPTED', 'safe');
    if (result.completed !== undefined) addFact(resultFacts, 'COMPLETED', displayBoolean(result.completed));
  }

  raw.textContent = JSON.stringify({
    bishop: session.id,
    trace_id: exchange.traceId,
    call: exchange.call,
    result: exchange.result,
  }, null, 2);
}

function renderEntity() {
  const session = selectedBishop();
  const latest = session?.exchanges.at(-1);
  const call = latest?.call || {};
  const bishopId = document.querySelector('#webmcp-bishop-id');
  const bishopRun = document.querySelector('#webmcp-bishop-run');
  const actor = document.querySelector('#webmcp-actor');
  const delegated = document.querySelector('#webmcp-delegated');

  if (bishopId) bishopId.textContent = session?.id || 'BISHOP #?';
  if (bishopRun) bishopRun.textContent = session ? `${session.runType || 'visitor'} · separate semantic wire` : 'waiting for tool use';
  if (actor) actor.textContent = latest ? displayActor(call.actor || TOOL_SEMANTICS[latest.tool]?.actor) : '—';
  if (delegated) {
    const value = latest ? (call.delegated ?? TOOL_SEMANTICS[latest.tool]?.delegated) : undefined;
    delegated.textContent = value === undefined ? '—' : displayBoolean(value);
  }
}

function renderObservedState() {
  const state = selectedBishop()?.state || {};
  const values = {
    '#state-relationship': state.relationship ?? '—',
    '#state-message-count': state.message_count ?? '—',
    '#state-mood': state.mood ? String(state.mood).toUpperCase() : '—',
    '#state-last-status': state.last_status ? displayStatus(state.last_status) : '—',
  };
  for (const [selector, value] of Object.entries(values)) {
    const element = document.querySelector(selector);
    if (element) element.textContent = String(value);
  }
}

function renderHistory() {
  const list = document.querySelector('#wire-history-list');
  if (!list) return;
  list.replaceChildren();
  const session = selectedBishop();
  const exchanges = session?.exchanges || [];
  if (!exchanges.length) {
    const empty = document.createElement('li');
    empty.className = 'wire-history-empty';
    empty.textContent = 'No exchange yet.';
    list.appendChild(empty);
    return;
  }

  exchanges.slice().reverse().forEach((exchange, index) => {
    const item = document.createElement('li');
    item.className = 'wire-history-item';
    item.dataset.traceId = exchange.traceId;
    const number = document.createElement('span');
    number.className = 'wire-history-number';
    number.textContent = String(exchanges.length - index).padStart(2, '0');
    const tool = document.createElement('strong');
    tool.textContent = `${exchange.tool}()`;
    const meaning = document.createElement('span');
    meaning.textContent = toolMeaning(exchange.tool);
    const status = document.createElement('b');
    status.textContent = exchange.result ? displayStatus(exchange.result.status) : 'PENDING';
    status.dataset.status = exchange.result?.status || 'pending';
    item.append(number, tool, meaning, status);
    list.appendChild(item);
  });
}

function renderBishopTabs() {
  const tabs = document.querySelector('#bishop-tabs');
  const follow = document.querySelector('#bishop-follow');
  if (!tabs) return;
  tabs.replaceChildren();
  const sessions = [...bishops.values()].sort((a, b) => b.lastSeen - a.lastSeen);

  if (!sessions.length) {
    const empty = document.createElement('span');
    empty.className = 'bishop-tab-empty';
    empty.textContent = 'WAITING FOR VISITOR';
    tabs.appendChild(empty);
  } else {
    sessions.slice(0, MAX_BISHOP_TABS).forEach((session) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bishop-chip';
      button.dataset.bishopId = session.id;
      button.classList.toggle('is-selected', session.id === selectedBishopId);
      const name = document.createElement('strong');
      name.textContent = session.id;
      const meta = document.createElement('small');
      meta.textContent = session.runType || 'visitor';
      button.append(name, meta);
      button.addEventListener('click', () => {
        selectedBishopId = session.id;
        followLatest = false;
        renderAll();
      });
      tabs.appendChild(button);
    });
    if (sessions.length > MAX_BISHOP_TABS) {
      const more = document.createElement('span');
      more.className = 'bishop-more';
      more.textContent = `+${sessions.length - MAX_BISHOP_TABS}`;
      tabs.appendChild(more);
    }
  }

  if (follow) {
    follow.textContent = followLatest ? 'AUTO FOLLOW ON' : 'FOLLOW LATEST';
    follow.setAttribute('aria-pressed', String(followLatest));
  }
}

function renderToolSurface() {
  const container = document.querySelector('#semantic-tool-groups');
  const counter = document.querySelector('#webmcp-tool-count');
  if (!container) return;
  container.replaceChildren();
  if (counter) counter.textContent = `${registeredTools.length || '—'} TOOLS`;
  const byName = new Map(registeredTools.map((tool) => [String(tool.name), tool]));

  for (const group of TOOL_GROUPS) {
    const tools = group.tools.map((name) => byName.get(name)).filter(Boolean);
    if (!tools.length) continue;
    const section = document.createElement('section');
    section.className = `semantic-tool-group is-${group.id}`;
    const heading = document.createElement('h4');
    heading.textContent = group.label;
    const list = document.createElement('div');
    list.className = 'semantic-tool-list';
    for (const tool of tools) {
      const chip = document.createElement('span');
      chip.className = 'semantic-tool-chip';
      chip.dataset.tool = String(tool.name);
      chip.textContent = `${tool.name}()`;
      if (tool.description) chip.title = String(tool.description);
      if (group.id === 'boundary') chip.classList.add('is-boundary');
      list.appendChild(chip);
    }
    section.append(heading, list);
    container.appendChild(section);
  }

  document.querySelectorAll('[data-boundary-tool]').forEach((badge) => {
    badge.hidden = !byName.has(badge.dataset.boundaryTool);
  });
  renderLatestExchange();
}

async function hydrateToolSurface() {
  let attempts = 0;
  while (attempts < 100) {
    attempts += 1;
    if (document.modelContext?.getTools) {
      try {
        const tools = await document.modelContext.getTools();
        if (Array.isArray(tools) && tools.length) {
          registeredTools = tools;
          renderToolSurface();
          document.documentElement.dataset.webmcpViewSurfaceReady = 'true';
          return;
        }
      } catch {
        // Registration may still be settling.
      }
    }
    await new Promise((resolve) => window.setTimeout(resolve, 40));
  }
}

function renderAll() {
  renderBishopTabs();
  renderEntity();
  renderLatestExchange();
  renderObservedState();
  renderHistory();
}

function localProjection(event, phase) {
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

function consumeLocalTraceEvent(event) {
  if (event?.event !== 'agent_semantic_call' && event?.event !== 'agent_semantic_result') return;
  const phase = parsePhase(event.phase);
  const source = traceSource(event.source);
  const kind = event.event.endsWith('_call') ? 'call' : 'result';
  handleTrace({
    kind,
    tool: String(event.tool || 'unknown_tool'),
    projection: localProjection(event, phase),
    traceId: source.traceId,
    bishopId: normalizeBishopId(event.bishop_id, phase),
    runType: event.run_type || null,
    createdAt: event.created_at,
  });
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

    if (!localTraceReady) {
      const startupCutoff = localTraceStartedAt - LOCAL_STARTUP_GRACE_MS;
      for (const event of events) {
        const id = Number(event?.id || 0);
        if (id > lastLocalEventId) lastLocalEventId = id;
        const eventTime = Date.parse(event?.created_at || '') || 0;
        if (eventTime >= startupCutoff) consumeLocalTraceEvent(event);
      }
      localTraceReady = true;
      document.documentElement.dataset.agentTraceReady = 'true';
      return;
    }

    for (const event of events) {
      const id = Number(event?.id || 0);
      if (id > lastLocalEventId) lastLocalEventId = id;
      consumeLocalTraceEvent(event);
    }
  } catch {
    // The WebMCP View is observational and must never affect the main site.
  } finally {
    polling = false;
  }
}

buildUi();
void hydrateToolSurface();

window.addEventListener('matched:agent-semantic-trace', (event) => {
  if (localMode()) return;
  const detail = event.detail ?? {};
  if (detail.kind !== 'call' && detail.kind !== 'result') return;
  handleTrace({
    kind: detail.kind,
    tool: String(detail.tool || 'unknown_tool'),
    projection: detail.projection || {},
    traceId: detail.trace_id || null,
    bishopId: normalizeBishopId(detail.bishop_id),
    runType: detail.run_type || null,
    createdAt: detail.created_at,
  });
});

if (localMode()) {
  void pollLocalTrace();
  window.setInterval(() => void pollLocalTrace(), POLL_MS);
}