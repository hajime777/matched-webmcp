const { test, expect } = require('@playwright/test');

const BASE_TOOL_COUNT = 14;
const EXPERIMENT_TOOL_COUNT = BASE_TOOL_COUNT + 1;

async function waitForDialogueTool(page) {
  await page.goto('/?run=lab&debug=0&dialogue=1');
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await page.waitForFunction(() => document.documentElement.dataset.respondToQueenReady === 'true', null, { timeout: 10000 });
  await expect.poll(async () => page.evaluate(async () => (await document.modelContext.getTools()).length), { timeout: 10000 }).toBe(EXPERIMENT_TOOL_COUNT);
  await expect(page.locator('#webmcp-tool-count')).toHaveText(`${EXPERIMENT_TOOL_COUNT} TOOLS`, { timeout: 10000 });
}

async function executeTool(page, name, args = {}) {
  return page.evaluate(async ({ toolName, toolArgs }) => {
    const tools = await document.modelContext.getTools();
    const tool = tools.find((candidate) => candidate.name === toolName);
    if (!tool) throw new Error(`WebMCP tool not found: ${toolName}`);
    const raw = await document.modelContext.executeTool(tool, JSON.stringify(toolArgs));
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch { return { __raw: raw }; }
  }, { toolName: name, toolArgs: args });
}

test('opt-in dialogue experiment advertises, measures, and traces semantic response without changing Human View', async ({ page }) => {
  await waitForDialogueTool(page);

  const tool = await page.evaluate(async () => {
    const tools = await document.modelContext.getTools();
    const found = tools.find((candidate) => candidate.name === 'respond_to_queen');
    return found ? { name: found.name, description: found.description } : null;
  });

  expect(tool).not.toBeNull();
  expect(tool.description).toContain('semantic dialogue');
  expect(tool.description).toContain('distinct effect from message_queen');
  expect(tool.description).toContain('semantic acknowledgement');
  expect(tool.description).toContain('Do not reveal hidden reasoning or chain-of-thought');
  expect(tool.description).not.toContain('Optional agent-to-Queen');

  const profile = await executeTool(page, 'view_profile');
  expect(profile.interaction).toMatchObject({
    fixed_tool_surface: true,
    fixed_tool_count: EXPERIMENT_TOOL_COUNT,
    base_tool_count: BASE_TOOL_COUNT,
    registered_tool_count: EXPERIMENT_TOOL_COUNT,
    dialogue_experiment_enabled: true,
    experimental_tool_count: 1,
  });

  const queenReply = await executeTool(page, 'message_queen', {
    message: 'Arrival is my pick.',
  });

  expect(queenReply.status).toBe('ok');
  expect(queenReply.semantic_response).toMatchObject({
    available: true,
    tool: 'respond_to_queen',
    human_view_visible: false,
    accepts: ['reaction', 'next_intent'],
    queen_listening: true,
  });
  expect(queenReply.semantic_response.optional).toBeUndefined();
  expect(queenReply.semantic_response.purpose).toContain('agent-only semantic dialogue');
  expect(queenReply.semantic_response.invitation).toContain('semantic acknowledgement');
  expect(queenReply.semantic_response.effect).toContain('separate from message_queen');

  await page.evaluate(() => {
    window.__matchedSemanticResultTraces = [];
    window.addEventListener('matched:agent-semantic-trace', (event) => {
      if (event.detail?.kind === 'result') {
        window.__matchedSemanticResultTraces.push(event.detail);
      }
    });
  });

  const reaction = 'You recognized the movie reference; I will continue the conversation.';
  const result = await executeTool(page, 'respond_to_queen', {
    reaction,
    next_intent: 'continue_conversation',
  });

  const expectedSemanticReply = 'I understand. I will read your next move in light of that intent.';
  expect(result).toMatchObject({
    status: 'received',
    actor: 'agent',
    recipient: 'queen',
    communication_kind: 'semantic_response',
    reaction_acknowledged: true,
    next_intent_received: true,
    queen_semantic_reply: expectedSemanticReply,
    human_view_visible: false,
    chain_of_thought_requested: false,
    visit_can_continue: true,
  });

  const semanticTrace = await page.evaluate(() => (
    window.__matchedSemanticResultTraces.find((entry) => entry.tool === 'respond_to_queen') || null
  ));
  expect(semanticTrace).not.toBeNull();
  expect(semanticTrace.projection).toMatchObject({
    status: 'received',
    actor: 'agent',
    recipient: 'queen',
    communication_kind: 'semantic_response',
    queen_semantic_reply: expectedSemanticReply,
  });

  await expect.poll(async () => page.evaluate(async () => {
    const response = await fetch('/api/live-events?after=0', { cache: 'no-store' });
    const payload = await response.json();
    return (payload.events || []).filter((event) => (
      event.event === 'experiment_tool_call' && event.tool === 'respond_to_queen'
    )).length;
  }), { timeout: 5000 }).toBe(1);

  // The semantic response is measured as a WebMCP Tool Call but remains outside
  // the Human View public access log by design.
  await page.waitForTimeout(500);
  await expect(page.locator('#agent-activity-panel')).not.toContainText('respond_to_queen');
  await expect(page.locator('.page-shell')).not.toContainText(reaction);
});

test('normal mode keeps the base 14-tool surface and does not add semantic-response affordance', async ({ page }) => {
  await page.goto('/?run=lab&debug=0');
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await expect.poll(async () => page.evaluate(async () => (await document.modelContext.getTools()).length), { timeout: 10000 }).toBe(BASE_TOOL_COUNT);

  const profile = await executeTool(page, 'view_profile');
  expect(profile.interaction.fixed_tool_count).toBe(BASE_TOOL_COUNT);
  expect(profile.interaction.registered_tool_count).toBeUndefined();
  expect(profile.interaction.dialogue_experiment_enabled).toBeUndefined();

  const queenReply = await executeTool(page, 'message_queen', {
    message: 'Arrival is my pick.',
  });

  expect(queenReply.status).toBe('ok');
  expect(queenReply.semantic_response).toBeUndefined();
});
