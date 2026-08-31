const { test, expect } = require('@playwright/test');

const FIXED_TOOL_COUNT = 14;

async function waitForWebMCP(page, path = '/?run=lab&debug=0') {
  await page.goto(path);
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await expect.poll(async () => page.evaluate(async () => (await document.modelContext.getTools()).length), { timeout: 10000 }).toBe(FIXED_TOOL_COUNT);
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

test('AI Agent View shows truthful Bishop call and Queen result from a separate browser context', async ({ page, browser }) => {
  await waitForWebMCP(page);

  const agentContext = await browser.newContext({ baseURL: 'http://127.0.0.1:8080' });
  const agentPage = await agentContext.newPage();
  await waitForWebMCP(agentPage);

  await expect(page.locator('#agent-view-toggle')).toBeVisible();
  await page.locator('#agent-view-toggle').click();
  await expect(page.locator('#agent-view-overlay')).toBeVisible();
  await expect(page.locator('#agent-view-empty')).toBeVisible();

  const likeResult = await executeTool(agentPage, 'send_agent_like');
  expect(likeResult.status).toMatch(/liked|already_liked/);

  const stack = page.locator('#agent-view-stack');
  await expect(stack).toContainText('send_agent_like', { timeout: 5000 });
  await expect(page.locator('#agent-view-empty')).toBeHidden();
  await expect(stack).toContainText('BISHOP');
  await expect(stack).toContainText('QUEEN');
  await expect(stack).toContainText('"actor": "agent"');
  await expect(stack).toContainText('"delegated": false');
  await expect(stack).toContainText('"status": "liked"');

  await executeTool(agentPage, 'message_queen', { message: 'Arrival is my pick.' });
  await expect(stack).toContainText('message_queen', { timeout: 5000 });
  await expect(stack).toContainText('"mood": "curious"');

  for (let i = 0; i < 4; i += 1) await executeTool(agentPage, 'view_profile');
  await expect.poll(async () => stack.locator('.agent-view-card').count(), { timeout: 5000 }).toBe(10);

  await page.locator('#agent-view-overlay').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#agent-view-overlay')).toBeHidden();

  await agentContext.close();
});
