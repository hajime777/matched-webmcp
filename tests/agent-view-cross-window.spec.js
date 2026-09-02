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

test('spectator AUTO follows a WebMCP call from a separate browser context', async ({ browser, page }) => {
  await page.goto('/?run=lab&debug=0&dialogue=1&challenge=1');
  await page.waitForFunction(() => document.documentElement.dataset.webmcpAutoViewReady === 'true', null, { timeout: 10000 });
  await page.waitForFunction(() => document.documentElement.dataset.agentTraceReady === 'true', null, { timeout: 10000 });

  const autoToggle = page.locator('#agent-view-auto-toggle');
  if ((await autoToggle.getAttribute('aria-pressed')) !== 'true') {
    await autoToggle.click();
  }
  await expect(autoToggle).toHaveAttribute('aria-pressed', 'true');

  const overlay = page.locator('#agent-view-overlay');
  if (!(await overlay.isHidden())) {
    await page.locator('#webmcp-return').click();
  }
  await expect(overlay).toBeHidden();

  const agentContext = await browser.newContext();
  const agentPage = await agentContext.newPage();

  try {
    await agentPage.goto(page.url());
    await agentPage.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
    await agentPage.waitForFunction(() => document.documentElement.dataset.respondToQueenReady === 'true', null, { timeout: 10000 });

    const profile = await executeTool(agentPage, 'view_profile');
    expect(profile.nickname).toBe('QUEEN');

    await expect(overlay).toBeVisible({ timeout: 7000 });
    await expect(page.locator('#webmcp-bishop-id')).not.toHaveText('BISHOP #?', { timeout: 7000 });

    const profileChip = page.locator('.semantic-tool-chip[data-tool="view_profile"]');
    await expect(profileChip).toHaveAttribute('data-call-count', '1', { timeout: 7000 });
    await expect(profileChip.locator('.challenge-tool-state')).toContainText('#1');
  } finally {
    await agentContext.close();
  }
});
