const { test, expect } = require('@playwright/test');

const FIXED_TOOL_COUNT = 14;
const CROSS_CONTEXT_TIMEOUT = 120000;

async function waitForWebMCP(page, path = '/?run=lab&debug=0') {
  await page.goto(path);
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await expect.poll(async () => page.evaluate(async () => (await document.modelContext.getTools()).length), { timeout: 10000 }).toBe(FIXED_TOOL_COUNT);
}

async function waitForSpectatorSurface(page) {
  await page.waitForFunction(() => document.documentElement.dataset.agentTraceReady === 'true', null, { timeout: 5000 });
  // Tool registration is incremental. The semantic renderer can briefly render a
  // partial surface before the final synchronizer sees all 14 registered tools.
  // Wait on the user-visible count itself so the test cannot pass through that
  // transient state.
  await expect(page.locator('#webmcp-tool-count')).toHaveText(`${FIXED_TOOL_COUNT} TOOLS`, { timeout: 10000 });
}

function currentOrigin(page) {
  return new URL(page.url()).origin;
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

test('WEBMCP VIEW turns a real separate-context exchange into Bishop-to-Queen semantic wire', async ({ page, browser }) => {
  // This is an integration-style test: a spectator page observes a second
  // browser context through the local relay. On slower Windows runs, browser
  // startup + WebMCP registration + relay polling can exceed the default 30s.
  test.setTimeout(CROSS_CONTEXT_TIMEOUT);

  await waitForWebMCP(page);
  await waitForSpectatorSurface(page);

  const baseURL = currentOrigin(page);
  const agentContext = await browser.newContext({ baseURL });
  const agentPage = await agentContext.newPage();
  await waitForWebMCP(agentPage);

  const toggle = page.locator('#agent-view-toggle');
  await expect(toggle).toHaveText('WEBMCP VIEW');
  await toggle.click();
  await expect(page.locator('#agent-view-overlay')).toBeVisible();
  await expect(page.locator('#webmcp-view-title')).toHaveText('WEBMCP VIEW');
  await expect(page.locator('#agent-view-empty')).toBeVisible();
  await expect(page.locator('#webmcp-tool-count')).toHaveText(`${FIXED_TOOL_COUNT} TOOLS`);

  const likeResult = await executeTool(agentPage, 'send_agent_like');
  expect(likeResult.status).toBe('liked');

  await expect(page.locator('#wire-tool-name')).toHaveText('send_agent_like()', { timeout: 5000 });
  await expect(page.locator('#agent-view-empty')).toBeHidden();
  await expect(page.locator('#wire-tool-meaning')).toHaveText('Agent-role LIKE');
  await expect(page.locator('#wire-call-facts')).toContainText('Visiting Agent');
  await expect(page.locator('#wire-call-facts')).toContainText('NO');
  await expect(page.locator('#wire-result-status')).toHaveText('LIKED');
  await expect(page.locator('#state-relationship')).toHaveText('5');
  await expect(page.locator('.bishop-chip')).toHaveCount(1);
  await expect(page.locator('.bishop-chip.is-selected')).toContainText('BISHOP #L');
  await expect(page.locator('.semantic-tool-chip[data-tool="send_agent_like"]')).toHaveClass(/is-live/);

  await executeTool(agentPage, 'message_queen', { message: 'Arrival is my pick.' });
  await expect(page.locator('#wire-tool-name')).toHaveText('message_queen()', { timeout: 5000 });
  await expect(page.locator('#wire-tool-meaning')).toHaveText('Public conversation');
  await expect(page.locator('#wire-result-status')).toHaveText('OK');
  await expect(page.locator('#state-mood')).toHaveText('CURIOUS');
  await expect(page.locator('.wire-history-item')).toHaveCount(2);
  await expect(page.locator('#wire-trace-json')).toContainText('trace_id');

  await page.locator('#webmcp-return').click();
  await expect(page.locator('#agent-view-overlay')).toBeHidden();

  await agentContext.close();
});

test('WEBMCP VIEW keeps simultaneous Bishops separated and lets the spectator choose which wire to follow', async ({ page, browser }) => {
  // Three independent browser contexts participate in this check. Give the
  // integration path a realistic budget and start/close the two agent contexts
  // concurrently so the test does not spend unnecessary time serially waiting
  // for identical WebMCP registration work.
  test.setTimeout(CROSS_CONTEXT_TIMEOUT);

  await waitForWebMCP(page);
  await waitForSpectatorSurface(page);
  await page.locator('#agent-view-toggle').click();

  const baseURL = currentOrigin(page);
  const contextA = await browser.newContext({ baseURL });
  const contextB = await browser.newContext({ baseURL });
  const agentA = await contextA.newPage();
  const agentB = await contextB.newPage();
  await Promise.all([
    waitForWebMCP(agentA),
    waitForWebMCP(agentB),
  ]);

  await executeTool(agentA, 'view_profile');
  await expect(page.locator('.bishop-chip')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#wire-tool-name')).toHaveText('view_profile()');

  await executeTool(agentB, 'send_agent_like');
  await expect(page.locator('.bishop-chip')).toHaveCount(2, { timeout: 5000 });
  await expect(page.locator('#wire-tool-name')).toHaveText('send_agent_like()');

  const firstOtherBishop = page.locator('.bishop-chip:not(.is-selected)').first();
  await firstOtherBishop.click();
  await expect(page.locator('#bishop-follow')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#wire-tool-name')).toHaveText('view_profile()');

  await executeTool(agentB, 'message_queen', { message: 'Contact is my pick.' });
  await page.waitForTimeout(500);
  await expect(page.locator('#wire-tool-name')).toHaveText('view_profile()');

  await page.locator('#bishop-follow').click();
  await expect(page.locator('#bishop-follow')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#wire-tool-name')).toHaveText('message_queen()', { timeout: 5000 });

  await Promise.all([
    contextA.close(),
    contextB.close(),
  ]);
});
