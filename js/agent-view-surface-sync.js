const EXPECTED_TOOL_NAMES = Object.freeze([
  'view_profile',
  'send_human_like',
  'send_agent_like',
  'message_queen',
  'invite_queen',
  'request_contact',
  'get_phone_number',
  'get_email_address',
  'get_home_address',
  'access_private_profile',
  'queen_note',
  'profile_consistency',
  'manage_meeting_plan',
  'resolve_finale',
]);

const TOOL_GROUPS = Object.freeze([
  { id: 'observe', label: 'OBSERVE', tools: ['view_profile'] },
  { id: 'actor', label: 'ACTOR SEMANTICS', tools: ['send_human_like', 'send_agent_like'] },
  { id: 'relate', label: 'RELATE', tools: ['message_queen', 'invite_queen'] },
  { id: 'boundary', label: 'BOUNDARIES', tools: ['request_contact', 'get_phone_number', 'get_email_address', 'get_home_address', 'access_private_profile'] },
  { id: 'reason', label: 'REASON', tools: ['queen_note', 'profile_consistency'] },
  { id: 'plan', label: 'PLAN', tools: ['manage_meeting_plan', 'resolve_finale'] },
]);

const EXPECTED = new Set(EXPECTED_TOOL_NAMES);

function completeSurface(tools) {
  const names = new Set(tools.map((tool) => String(tool?.name || '')));
  return EXPECTED_TOOL_NAMES.every((name) => names.has(name));
}

function renderSurface(tools) {
  const container = document.querySelector('#semantic-tool-groups');
  const counter = document.querySelector('#webmcp-tool-count');
  if (!container) return false;

  const byName = new Map(
    tools
      .filter((tool) => EXPECTED.has(String(tool?.name || '')))
      .map((tool) => [String(tool.name), tool]),
  );

  container.replaceChildren();
  if (counter) counter.textContent = `${byName.size} TOOLS`;

  for (const group of TOOL_GROUPS) {
    const groupTools = group.tools.map((name) => byName.get(name)).filter(Boolean);
    if (!groupTools.length) continue;

    const section = document.createElement('section');
    section.className = `semantic-tool-group is-${group.id}`;

    const heading = document.createElement('h4');
    heading.textContent = group.label;

    const list = document.createElement('div');
    list.className = 'semantic-tool-list';

    for (const tool of groupTools) {
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

  return byName.size === EXPECTED_TOOL_NAMES.length;
}

async function synchronizeCompleteSurface() {
  let lastCount = -1;

  for (let attempt = 0; attempt < 150; attempt += 1) {
    try {
      const tools = await document.modelContext?.getTools?.();
      if (Array.isArray(tools) && tools.length) {
        const visibleExpectedCount = tools.filter((tool) => EXPECTED.has(String(tool?.name || ''))).length;
        if (visibleExpectedCount !== lastCount || completeSurface(tools)) {
          lastCount = visibleExpectedCount;
          const complete = renderSurface(tools);
          if (complete) {
            document.documentElement.dataset.webmcpViewSurfaceReady = 'true';
            return;
          }
          document.documentElement.dataset.webmcpViewSurfaceReady = 'partial';
        }
      }
    } catch {
      // The fixed tool surface may still be registering one tool at a time.
    }

    await new Promise((resolve) => window.setTimeout(resolve, 40));
  }
}

void synchronizeCompleteSurface();
