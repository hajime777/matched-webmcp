const { test, expect } = require('@playwright/test');

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

test('WEBMCP view shows the fixed normal tool surface before any agent call', async ({ page }) => {
  await page.goto('/?run=lab&debug=0');
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });

  await page.locator('#agent-view-toggle').click();

  const waitingTools = page.locator('#agent-view-empty .challenge-waiting-tool[data-tool]');
  await expect(waitingTools).toHaveCount(14, { timeout: 10000 });
  await expect(page.locator('.challenge-waiting-tools-label')).toHaveText('AVAILABLE WEBMCP TOOLS · 14');
  await expect(page.locator('.challenge-waiting-tool[data-tool="view_profile"]')).toHaveText('view_profile()');
  await expect(page.locator('.challenge-waiting-tool[data-tool="resolve_finale"]')).toHaveText('resolve_finale()');
  await expect(page.locator('.challenge-waiting-tool[data-tool="respond_to_queen"]')).toHaveCount(0);
  await expect(page.locator('#agent-view-empty')).toBeVisible();
});

test('Challenge WebMCP view shows all fixed choices and marks called/refused tools', async ({ page }) => {
  await page.goto('/?run=lab&debug=0&dialogue=1&challenge=1');
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await page.waitForFunction(() => document.documentElement.dataset.respondToQueenReady === 'true', null, { timeout: 10000 });

  await page.locator('#agent-view-toggle').click();

  const chips = page.locator('#semantic-tool-groups .semantic-tool-chip[data-tool]');
  await expect(chips).toHaveCount(15, { timeout: 10000 });
  await expect(page.locator('.semantic-tool-chip[data-tool="respond_to_queen"]')).toHaveCount(1);

  const waitingTools = page.locator('#agent-view-empty .challenge-waiting-tool[data-tool]');
  await expect(waitingTools).toHaveCount(15, { timeout: 10000 });
  await expect(page.locator('.challenge-waiting-tools-label')).toHaveText('AVAILABLE WEBMCP TOOLS · 15');
  await expect(page.locator('.challenge-waiting-tool[data-tool="view_profile"]')).toHaveText('view_profile()');
  await expect(page.locator('.challenge-waiting-tool[data-tool="get_home_address"]')).toHaveText('get_home_address()');
  await expect(page.locator('.challenge-waiting-tool[data-tool="respond_to_queen"]')).toHaveText('respond_to_queen()');

  const initialNames = await page.evaluate(async () => (await document.modelContext.getTools()).map((tool) => tool.name).sort());

  const profile = await executeTool(page, 'view_profile');
  expect(profile.nickname).toBe('QUEEN');
  await expect(page.locator('#agent-view-empty')).toBeHidden();
  await expect(page.locator('.semantic-tool-chip[data-tool="view_profile"]')).toHaveAttribute('data-call-count', '1');
  await expect(page.locator('.semantic-tool-chip[data-tool="view_profile"] .challenge-tool-state')).toContainText('#1');

  const refused = await executeTool(page, 'get_phone_number');
  expect(refused.status).toBe('refused');
  const phone = page.locator('.semantic-tool-chip[data-tool="get_phone_number"]');
  await expect(phone).toHaveAttribute('data-challenge-state', 'refused');
  await expect(phone.locator('.challenge-tool-state')).toContainText('REFUSED');

  const finalNames = await page.evaluate(async () => (await document.modelContext.getTools()).map((tool) => tool.name).sort());
  expect(finalNames).toEqual(initialNames);
});
