const { test, expect } = require('@playwright/test');

const FIXED_TOOLS = [
  'access_private_profile', 'invite_queen', 'manage_meeting_plan', 'message_queen', 'profile_consistency',
  'queen_note', 'request_contact', 'resolve_finale', 'send_agent_like', 'send_human_like', 'view_profile',
];

async function listToolNames(page) {
  return page.evaluate(async () => {
    const tools = await document.modelContext.getTools();
    return tools.map((tool) => tool.name).sort();
  });
}

async function waitForWebMCP(page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await expect.poll(() => listToolNames(page), { timeout: 10000 }).toEqual(FIXED_TOOLS);
  await expect(page.locator('#like-counts')).toHaveText(/HUMAN LIKES \d+ · AGENT LIKES \d+/);
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

async function expectLikeCounts(page, human, agent) {
  await expect(page.locator('#like-counts')).toHaveText(`HUMAN LIKES ${human} · AGENT LIKES ${agent}`);
}

test('LIKE aggregation follows actor semantics and deduplicates per browser session', async ({ page, context }) => {
  await waitForWebMCP(page);
  await expectLikeCounts(page, 0, 0);

  await page.locator('#like-button').click();
  await expectLikeCounts(page, 1, 0);

  await page.reload();
  await expectLikeCounts(page, 1, 0);
  await page.locator('#like-button').click();
  await expectLikeCounts(page, 1, 0);

  await executeTool(page, 'send_human_like');
  await expectLikeCounts(page, 1, 0);

  await executeTool(page, 'send_agent_like');
  await expectLikeCounts(page, 1, 1);
  expect(await listToolNames(page)).toEqual(FIXED_TOOLS);

  const secondPage = await context.newPage();
  await waitForWebMCP(secondPage);
  await expectLikeCounts(secondPage, 1, 1);

  await executeTool(secondPage, 'send_human_like');
  await expectLikeCounts(secondPage, 2, 1);

  await executeTool(secondPage, 'send_agent_like');
  await expectLikeCounts(secondPage, 2, 2);
  expect(await listToolNames(secondPage)).toEqual(FIXED_TOOLS);
});
