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

test('AUTO opens WEBMCP VIEW when a real WebMCP call starts', async ({ page }) => {
  await page.goto('/?run=lab&debug=0&dialogue=1&challenge=1');
  await page.waitForFunction(() => document.documentElement.dataset.webmcpAutoViewReady === 'true', null, { timeout: 10000 });
  await page.waitForFunction(() => document.documentElement.dataset.respondToQueenReady === 'true', null, { timeout: 10000 });

  const autoToggle = page.locator('#agent-view-auto-toggle');
  await expect(autoToggle).toHaveCount(1);
  if ((await autoToggle.getAttribute('aria-pressed')) !== 'true') {
    await autoToggle.click();
  }
  await expect(autoToggle).toHaveAttribute('aria-pressed', 'true');

  const overlay = page.locator('#agent-view-overlay');
  if (!(await overlay.isHidden())) {
    await page.locator('#webmcp-return').click();
  }
  await expect(overlay).toBeHidden();

  const profile = await executeTool(page, 'view_profile');
  expect(profile.nickname).toBe('QUEEN');

  await expect(overlay).toBeVisible({ timeout: 3000 });
  await expect(overlay).toHaveAttribute('aria-hidden', 'false');
});
