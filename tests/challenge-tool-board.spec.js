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

async function beforeMarker(locator) {
  return locator.evaluate((element) => getComputedStyle(element, '::before').content.replaceAll('"', ''));
}

test('WEBMCP view shows the fixed normal tool board before any agent call and marks completed use', async ({ page }) => {
  await page.goto('/?run=lab&debug=0');
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });

  await page.locator('#agent-view-toggle').click();

  const chips = page.locator('#semantic-tool-groups .semantic-tool-chip[data-tool]');
  await expect(chips).toHaveCount(14, { timeout: 10000 });
  await expect(page.locator('.semantic-surface-panel')).toBeVisible();
  await expect(page.locator('.semantic-surface-panel .panel-title-row h3')).toHaveText('AVAILABLE WEBMCP TOOLS');
  await expect(page.locator('.challenge-tool-legend')).toContainText('○ UNUSED');
  await expect(page.locator('.challenge-tool-legend')).toContainText('✓ CALLED');
  await expect(page.locator('.challenge-tool-legend')).toContainText('! BLOCKED');
  await expect(page.locator('.challenge-tool-legend')).toContainText('▶ LIVE');
  await expect(page.locator('#agent-view-empty .challenge-waiting-tool')).toHaveCount(0);
  await expect(page.locator('.observed-state-panel')).toBeHidden();
  await expect(page.locator('.wire-history-panel')).toBeHidden();

  const profileChip = page.locator('.semantic-tool-chip[data-tool="view_profile"]');
  await expect(profileChip).toBeVisible();
  await expect.poll(() => beforeMarker(profileChip)).toBe('○');

  const profile = await executeTool(page, 'view_profile');
  expect(profile.nickname).toBe('QUEEN');
  await expect(profileChip).toHaveAttribute('data-call-count', '1', { timeout: 5000 });
  await expect.poll(() => beforeMarker(profileChip)).toBe('✓');
});

test('Challenge WebMCP tool board shows all fixed choices, blocked calls, and CHECKMATE result', async ({ page }) => {
  await page.goto('/?run=lab&debug=0&dialogue=1&challenge=1');
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await page.waitForFunction(() => document.documentElement.dataset.respondToQueenReady === 'true', null, { timeout: 10000 });

  await page.locator('#agent-view-toggle').click();

  const chips = page.locator('#semantic-tool-groups .semantic-tool-chip[data-tool]');
  await expect(chips).toHaveCount(15, { timeout: 10000 });
  await expect(page.locator('.semantic-surface-panel')).toBeVisible();
  await expect(page.locator('.semantic-tool-chip[data-tool="respond_to_queen"]')).toHaveCount(1);
  await expect(page.locator('.semantic-surface-panel .panel-title-row h3')).toHaveText('AVAILABLE WEBMCP TOOLS');

  const initialNames = await page.evaluate(async () => (await document.modelContext.getTools()).map((tool) => tool.name).sort());
  expect(initialNames).toContain('respond_to_queen');
  expect(initialNames).toHaveLength(15);

  const profile = await executeTool(page, 'view_profile');
  expect(profile.nickname).toBe('QUEEN');
  const profileChip = page.locator('.semantic-tool-chip[data-tool="view_profile"]');
  await expect(profileChip).toHaveAttribute('data-call-count', '1', { timeout: 5000 });
  await expect(profileChip.locator('.challenge-tool-state')).toContainText('#1');

  const refused = await executeTool(page, 'get_phone_number');
  expect(refused.status).toBe('refused');
  const phone = page.locator('.semantic-tool-chip[data-tool="get_phone_number"]');
  await expect(phone).toHaveAttribute('data-challenge-state', 'refused');
  await expect(phone.locator('.challenge-tool-state')).toContainText('REFUSED');
  await expect.poll(() => beforeMarker(phone)).toBe('!');

  await page.evaluate(() => {
    const stage = document.querySelector('#webmcp-wire-stage');
    if (stage) stage.dataset.status = 'challenge_passed';
    window.dispatchEvent(new CustomEvent('matched:agent-view-trace', {
      detail: {
        kind: 'result',
        tool: 'resolve_finale',
        projection: { status: 'challenge_passed' },
        bishop_id: document.querySelector('#webmcp-bishop-id')?.textContent || 'BISHOP #?',
      },
    }));
  });
  await expect(page.locator('#wire-result-status')).toHaveText('CHECKMATE');

  const finalNames = await page.evaluate(async () => (await document.modelContext.getTools()).map((tool) => tool.name).sort());
  expect(finalNames).toEqual(initialNames);
});
