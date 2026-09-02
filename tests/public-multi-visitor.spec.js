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

async function prepareAgentContext(browser, bishopNumber) {
  const context = await browser.newContext();
  await context.addInitScript((number) => {
    sessionStorage.setItem('matched.bishop.id', number);
  }, bishopNumber);
  const page = await context.newPage();
  return { context, page };
}

test('concurrent Bishops keep Queen state isolated and remain separately observable', async ({ browser, page }) => {
  await page.goto('/?run=lab&debug=0&dialogue=1&challenge=1');
  await page.waitForFunction(() => document.documentElement.dataset.webmcpAutoViewReady === 'true', null, { timeout: 10000 });
  await page.waitForFunction(() => document.documentElement.dataset.agentTraceReady === 'true', null, { timeout: 10000 });

  const agentA = await prepareAgentContext(browser, '1001');
  const agentB = await prepareAgentContext(browser, '1002');

  try {
    await Promise.all([
      agentA.page.goto(page.url()),
      agentB.page.goto(page.url()),
    ]);

    await Promise.all([
      agentA.page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 }),
      agentB.page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 }),
    ]);

    await Promise.all([
      agentA.page.waitForFunction(() => document.documentElement.dataset.respondToQueenReady === 'true', null, { timeout: 10000 }),
      agentB.page.waitForFunction(() => document.documentElement.dataset.respondToQueenReady === 'true', null, { timeout: 10000 }),
    ]);

    const initialA = await executeTool(agentA.page, 'view_profile');
    const initialB = await executeTool(agentB.page, 'view_profile');
    expect(initialA.interaction.message_count).toBe(0);
    expect(initialB.interaction.message_count).toBe(0);

    const turnA = await executeTool(agentA.page, 'message_queen', { message: 'A public movie question from Bishop A.' });
    expect(turnA.status).toBe('ok');
    expect(turnA.message_count).toBe(1);

    const afterA = await executeTool(agentA.page, 'view_profile');
    const afterB = await executeTool(agentB.page, 'view_profile');
    expect(afterA.interaction.message_count).toBe(1);
    expect(afterB.interaction.message_count).toBe(0);

    await expect(page.locator('.bishop-chip[data-bishop-id="BISHOP #L001"]')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('.bishop-chip[data-bishop-id="BISHOP #L002"]')).toBeVisible({ timeout: 7000 });
  } finally {
    await agentA.context.close();
    await agentB.context.close();
  }
});
