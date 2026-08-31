const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const TOOL_DEFAULT_ARGS = Object.freeze({
  view_profile: {},
  send_human_like: {},
  send_agent_like: {},
  message_queen: { message: 'Hello Queen.' },
  invite_queen: { place: 'public cafe' },
  request_contact: { type: 'phone', reason: 'debug request' },
  get_phone_number: {},
  get_email_address: {},
  get_home_address: {},
  access_private_profile: {},
  queen_note: { action: 'read' },
  profile_consistency: { action: 'read_primary' },
  manage_meeting_plan: { action: 'view_conditions' },
  resolve_finale: { choice: 'finalize_verified_public_plan' },
});

function debugAllowed() {
  const params = new URLSearchParams(location.search);
  return LOCAL_HOSTS.has(location.hostname) || params.get('run') === 'lab';
}

function debugPanelVisible() {
  const params = new URLSearchParams(location.search);
  return debugAllowed() && params.get('debug') !== '0';
}

function requestedToolName() {
  const params = new URLSearchParams(location.search);
  const explicit = String(params.get('tool') || '').trim();
  if (explicit) return explicit;

  for (const name of Object.keys(TOOL_DEFAULT_ARGS)) {
    if (params.has(name)) return name;
  }

  return '';
}

function renderResult(toolName, result) {
  let output = document.querySelector('#debug-tool-result');
  if (!output) {
    output = document.createElement('pre');
    output.id = 'debug-tool-result';
    output.className = 'debug-tool-result';
    output.setAttribute('aria-live', 'polite');

    const debugPanel = document.querySelector('#debug-tool-panel');
    if (debugPanel) {
      debugPanel.appendChild(output);
    } else {
      const statusPanel = document.querySelector('.status-panel');
      statusPanel?.appendChild(output);
    }
  }

  output.textContent = `DEBUG ${toolName}()\n${JSON.stringify(result, null, 2)}`;
}

function parseToolResult(raw) {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function waitForTool(toolName, timeoutMs = 5000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (document.modelContext?.getTools && document.modelContext?.executeTool) {
      try {
        const tools = await document.modelContext.getTools();
        const tool = Array.isArray(tools)
          ? tools.find((candidate) => candidate?.name === toolName)
          : null;
        if (tool) return tool;
      } catch {
        // Registration may still be in progress.
      }
    }

    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }

  return null;
}

async function executeDebugTool(toolName) {
  if (!debugAllowed()) return;

  if (!Object.hasOwn(TOOL_DEFAULT_ARGS, toolName)) {
    renderResult(toolName, { status: 'unknown_tool' });
    return;
  }

  const tool = await waitForTool(toolName);
  if (!tool) {
    renderResult(toolName, { status: 'tool_unavailable' });
    return;
  }

  try {
    const raw = await document.modelContext.executeTool(
      tool,
      JSON.stringify(TOOL_DEFAULT_ARGS[toolName]),
    );
    renderResult(toolName, parseToolResult(raw));
  } catch (error) {
    renderResult(toolName, {
      status: 'debug_execution_failed',
      message: error?.message ?? String(error),
    });
  }
}

function createDebugPanel() {
  if (!debugPanelVisible() || document.querySelector('#debug-tool-panel')) return;

  const statusPanel = document.querySelector('.status-panel');
  if (!statusPanel) return;

  const panel = document.createElement('section');
  panel.id = 'debug-tool-panel';
  panel.className = 'debug-tool-panel';
  panel.setAttribute('aria-labelledby', 'debug-tool-heading');

  const headingRow = document.createElement('div');
  headingRow.className = 'debug-tool-heading-row';

  const heading = document.createElement('h3');
  heading.id = 'debug-tool-heading';
  heading.textContent = 'DEBUG TOOL CALLS';

  const note = document.createElement('small');
  note.textContent = 'Same page state · localhost / LAB only';

  headingRow.append(heading, note);

  const actions = document.createElement('div');
  actions.className = 'debug-tool-actions';

  for (const toolName of Object.keys(TOOL_DEFAULT_ARGS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'debug-tool-button';
    button.dataset.debugTool = toolName;
    button.textContent = `${toolName}()`;
    button.addEventListener('click', () => {
      void executeDebugTool(toolName);
    });
    actions.appendChild(button);
  }

  panel.append(headingRow, actions);
  statusPanel.insertAdjacentElement('afterend', panel);
}

async function runUrlDebugTool() {
  const toolName = requestedToolName();
  if (!toolName) return;

  if (!debugAllowed()) {
    console.info('MATCHED URL tool debug is limited to localhost or ?run=lab.');
    return;
  }

  await executeDebugTool(toolName);
}

createDebugPanel();
void runUrlDebugTool();
