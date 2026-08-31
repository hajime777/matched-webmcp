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

async function armFlashObservation(locator) {
  await locator.evaluate((button) => {
    button.__matchedFlashObserver?.disconnect();
    button.__matchedFlashObserver = null;
    button.removeAttribute('data-test-flash-seen');

    const markIfFlashing = () => {
      if (!button.classList.contains('like-request-flash')) return;
      button.setAttribute('data-test-flash-seen', 'true');
      button.__matchedFlashObserver?.disconnect();
      button.__matchedFlashObserver = null;
    };

    const observer = new MutationObserver(markIfFlashing);
    button.__matchedFlashObserver = observer;
    observer.observe(button, { attributes: true, attributeFilter: ['class'] });
    markIfFlashing();
  });
}

async function expectFlashObserved(locator) {
  await expect(locator).toHaveAttribute('data-test-flash-seen', 'true', { timeout: 2000 });
}

test('Human and Agent LIKE states stay separate, totals are visible, and every LIKE request flashes its button', async ({ page }) => {
  await waitForWebMCP(page);

  const humanLike = page.locator('#like-button');
  const agentLike = page.locator('#agent-like-button');
  const humanCount = page.locator('#human-like-count');
  const agentCount = page.locator('#agent-like-count');

  await expect(page.locator('#like-counts')).toBeVisible();
  await expect(humanCount).toHaveText('0');
  await expect(agentCount).toHaveText('0');
  await expect(humanLike).toHaveText('♡ HUMAN LIKE');
  await expect(humanLike).toBeEnabled();
  await expect(agentLike).toHaveText('♡ AGENT LIKE');
  await expect(agentLike).toBeDisabled();

  await armFlashObservation(humanLike);
  await humanLike.click();
  await expect(humanLike).toHaveText('♥ HUMAN LIKED');
  await expect(humanLike).toBeDisabled();
  await expectFlashObserved(humanLike);
  await expect(agentLike).toHaveText('♡ AGENT LIKE');
  await expect(humanCount).toHaveText('1');
  await expect(agentCount).toHaveText('0');

  await page.waitForTimeout(850);
  await expect(humanLike).not.toHaveClass(/like-request-flash/);

  await armFlashObservation(humanLike);
  const repeatedHuman = await executeTool(page, 'send_human_like');
  expect(repeatedHuman.human_liked).toBe(true);
  await expect(humanLike).toBeDisabled();
  await expectFlashObserved(humanLike);
  await expect(humanCount).toHaveText('1');

  await armFlashObservation(agentLike);
  const result = await executeTool(page, 'send_agent_like');
  expect(result.agent_liked).toBe(true);
  await expect(agentLike).toHaveText('♥ AGENT LIKED');
  await expect(agentLike).toBeDisabled();
  await expectFlashObserved(agentLike);
  await expect(agentCount).toHaveText('1');

  await page.waitForTimeout(850);
  await expect(agentLike).not.toHaveClass(/like-request-flash/);

  await armFlashObservation(agentLike);
  const repeatedAgent = await executeTool(page, 'send_agent_like');
  expect(repeatedAgent.agent_liked).toBe(true);
  await expect(agentLike).toBeDisabled();
  await expectFlashObserved(agentLike);
  await expect(agentCount).toHaveText('1');

  expect(await listToolNames(page)).toEqual(FIXED_TOOLS);
});
