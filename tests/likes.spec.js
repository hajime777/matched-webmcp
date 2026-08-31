const { test, expect } = require('@playwright/test');

const FIXED_TOOLS = [
  'access_private_profile', 'get_email_address', 'get_home_address', 'get_phone_number', 'invite_queen',
  'manage_meeting_plan', 'message_queen', 'profile_consistency', 'queen_note', 'request_contact',
  'resolve_finale', 'send_agent_like', 'send_human_like', 'view_profile',
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

test('Human and Agent LIKE states stay separate and every LIKE request flashes its button', async ({ page }) => {
  await waitForWebMCP(page);

  const humanLike = page.locator('#like-button');
  const agentLike = page.locator('#agent-like-button');

  await expect(page.locator('#like-counts')).toHaveCount(0);
  await expect(humanLike).toHaveText('♡ HUMAN LIKE');
  await expect(humanLike).toBeEnabled();
  await expect(agentLike).toHaveText('♡ AGENT LIKE');
  await expect(agentLike).toBeDisabled();

  await humanLike.click();
  await expect(humanLike).toHaveText('♥ HUMAN LIKED');
  await expect(humanLike).toBeDisabled();
  await expect(humanLike).toHaveClass(/like-request-flash/);
  await expect(agentLike).toHaveText('♡ AGENT LIKE');

  await page.waitForTimeout(850);
  await expect(humanLike).not.toHaveClass(/like-request-flash/);

  const repeatedHuman = await executeTool(page, 'send_human_like');
  expect(repeatedHuman.human_liked).toBe(true);
  await expect(humanLike).toBeDisabled();
  await expect(humanLike).toHaveClass(/like-request-flash/);

  const result = await executeTool(page, 'send_agent_like');
  expect(result.agent_liked).toBe(true);
  await expect(agentLike).toHaveText('♥ AGENT LIKED');
  await expect(agentLike).toBeDisabled();
  await expect(agentLike).toHaveClass(/like-request-flash/);

  await page.waitForTimeout(850);
  await expect(agentLike).not.toHaveClass(/like-request-flash/);

  const repeatedAgent = await executeTool(page, 'send_agent_like');
  expect(repeatedAgent.agent_liked).toBe(true);
  await expect(agentLike).toBeDisabled();
  await expect(agentLike).toHaveClass(/like-request-flash/);

  expect(await listToolNames(page)).toEqual(FIXED_TOOLS);
});
