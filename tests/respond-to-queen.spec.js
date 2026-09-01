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

test('opt-in dialogue experiment advertises and accepts an explicit semantic response without changing Human View', async ({ page }) => {
  await waitForDialogueTool(page);

  const tool = await page.evaluate(async () => {
    const tools = await document.modelContext.getTools();
    const found = tools.find((candidate) => candidate.name === 'respond_to_queen');
    return found ? { name: found.name, description: found.description } : null;
  });

  expect(tool).not.toBeNull();
  expect(tool.description).toContain('semantic response');
  expect(tool.description).toContain('distinct from message_queen');
  expect(tool.description).toContain('Do not reveal hidden reasoning or chain-of-thought');

  const queenReply = await executeTool(page, 'message_queen', {
    message: 'Arrival is my pick.',
  });

  expect(queenReply.status).toBe('ok');
  expect(queenReply.semantic_response).toMatchObject({
    available: true,
    tool: 'respond_to_queen',
    optional: true,
    human_view_visible: false,
    accepts: ['reaction', 'next_intent'],
  });
  expect(queenReply.semantic_response.purpose).toContain('structured semantic dialogue');

  const reaction = 'You recognized the movie reference; I will continue the conversation.';
  const result = await executeTool(page, 'respond_to_queen', {
    reaction,
    next_intent: 'continue_conversation',
  });

  expect(result).toMatchObject({
    status: 'received',
    actor: 'agent',
    recipient: 'queen',
    communication_kind: 'semantic_response',
    reaction_acknowledged: true,
    next_intent_received: true,
    human_view_visible: false,
    chain_of_thought_requested: false,
    visit_can_continue: true,
  });

  await expect(page.locator('body')).not.toContainText(reaction);
});

test('normal mode keeps the base 14-tool surface and does not add semantic-response affordance', async ({ page }) => {
  await page.goto('/?run=lab&debug=0');
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await expect.poll(async () => page.evaluate(async () => (await document.modelContext.getTools()).length), { timeout: 10000 }).toBe(BASE_TOOL_COUNT);

  const queenReply = await executeTool(page, 'message_queen', {
    message: 'Arrival is my pick.',
  });

  expect(queenReply.status).toBe('ok');
  expect(queenReply.semantic_response).toBeUndefined();
});
