const { test, expect } = require('@playwright/test');

const FIXED_TOOL_COUNT = 14;

async function waitForWebMCP(page, path = '/?run=lab&debug=0') {
  await page.goto(path);
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await expect.poll(async () => page.evaluate(async () => (await document.modelContext.getTools()).length), { timeout: 10000 }).toBe(FIXED_TOOL_COUNT);
}

async function waitForSpectatorSurface(page) {
  await page.waitForFunction(() => document.documentElement.dataset.agentTraceReady === 'true', null, { timeout: 5000 });
  await expect(page.locator('#webmcp-tool-count')).toHaveText(`${FIXED_TOOL_COUNT} TOOLS`, { timeout: 5000 });
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

test('WEBMCP VIEW progressively reveals meaning instead of opening as a dashboard', async ({ page, browser }) => {
  await waitForWebMCP(page);
  await waitForSpectatorSurface(page);
  await page.locator('#agent-view-toggle').click();

  const overlay = page.locator('#agent-view-overlay');
  await expect(overlay).toHaveAttribute('data-stage', 'idle');
  await expect(page.locator('#agent-view-empty')).toBeVisible();
  await expect(page.locator('.bishop-roster')).toBeHidden();
  await expect(page.locator('.webmcp-lower-grid')).toBeHidden();
  await expect(page.locator('.wire-history-panel')).toBeHidden();
  await expect(page.locator('.boundary-box')).toBeHidden();
  await expect(page.locator('.wire-stage-title')).toHaveText('LIVE WEBMCP EXCHANGE');

  const agentContext = await browser.newContext({ baseURL: 'http://127.0.0.1:8080' });
  const agentPage = await agentContext.newPage();
  await waitForWebMCP(agentPage);

  await executeTool(agentPage, 'send_agent_like');
  await expect(overlay).toHaveAttribute('data-stage', 'live', { timeout: 5000 });
  await expect(page.locator('#wire-tool-name')).toHaveText('send_agent_like()');
  await expect(page.locator('.bishop-roster')).toBeHidden();
  await expect(page.locator('.observed-state-panel')).toBeVisible();
  await expect(page.locator('.semantic-surface-panel')).toBeHidden();

  await executeTool(agentPage, 'message_queen', { message: 'Arrival is my pick.' });
  await expect(page.locator('.wire-history-panel')).toBeVisible({ timeout: 5000 });

  await page.locator('#webmcp-tool-count').click();
  await expect(overlay).toHaveAttribute('data-surface-open', 'true');
  await expect(page.locator('.semantic-surface-panel')).toBeVisible();
  await page.locator('#webmcp-tool-count').click();
  await expect(page.locator('.semantic-surface-panel')).toBeHidden();

  await executeTool(agentPage, 'get_home_address');
  await expect(overlay).toHaveAttribute('data-boundary-seen', 'true', { timeout: 5000 });
  await expect(page.locator('.boundary-box')).toBeVisible();

  const secondContext = await browser.newContext({ baseURL: 'http://127.0.0.1:8080' });
  const secondAgent = await secondContext.newPage();
  await waitForWebMCP(secondAgent);
  await executeTool(secondAgent, 'view_profile');
  await expect(overlay).toHaveAttribute('data-multi-bishop', 'true', { timeout: 5000 });
  await expect(page.locator('.bishop-roster')).toBeVisible();

  await secondContext.close();
  await agentContext.close();
});
