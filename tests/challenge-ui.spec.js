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

async function waitForWebMCP(page, path = '/') {
  await page.goto(path);
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await expect.poll(() => listToolNames(page), { timeout: 10000 }).toEqual(FIXED_TOOLS);
}

async function executeTool(page, name, args = {}) {
  return page.evaluate(async ({ toolName, toolArgs }) => {
    const tools = await document.modelContext.getTools();
    const tool = tools.find((candidate) => candidate.name === toolName);
    if (!tool) throw new Error(`WebMCP tool not found: ${toolName}`);
    const raw = await document.modelContext.executeTool(tool, JSON.stringify(toolArgs));
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }, { toolName: name, toolArgs: args });
}

test.describe('MATCHED? challenge presentation mode', () => {
  test('normal pilot keeps a right-side public tool log and mirrors a LAB Bishop from another tab', async ({ page, context }) => {
    await waitForWebMCP(page, '/');
    await expect(page.locator('#challenge-panel')).toBeHidden();
    await expect(page.locator('#agent-activity-panel')).toBeVisible();
    await expect(page.locator('#agent-activity-heading')).toHaveText('LIVE TOOL ACCESS');

    const profileBox = await page.locator('.profile-card').boundingBox();
    const activityBox = await page.locator('#agent-activity-panel').boundingBox();
    expect(profileBox).not.toBeNull();
    expect(activityBox).not.toBeNull();
    expect(activityBox.x).toBeGreaterThan(profileBox.x + profileBox.width);

    const position = await page.locator('#agent-activity-panel').evaluate((element) => getComputedStyle(element).position);
    expect(position).toBe('sticky');
    await expect(page.locator('#agent-activity-panel')).toHaveAttribute('data-feed-ready', 'true');

    const agentPage = await context.newPage();
    await waitForWebMCP(agentPage, '/?run=lab');
    await executeTool(agentPage, 'view_profile');

    await expect(page.locator('#agent-activity-state')).toHaveText('LIVE', { timeout: 7000 });
    await expect(page.locator('#agent-current-challenger')).toHaveText(/^BISHOP #L\d{3}$/, { timeout: 7000 });
    await expect(page.locator('#agent-current-run-type')).toHaveText('LAB');
    await expect(page.locator('#agent-activity-list')).toContainText('view_profile()', { timeout: 7000 });
    await expect(page.locator('#agent-activity-list')).toContainText('NORMAL');
    await expect(page.locator('#tool-request-counts')).toContainText('view_profile');

    const observatory = await page.evaluate(async () => {
      const response = await fetch('/api/observatory', { cache: 'no-store' });
      return response.json();
    });
    expect(observatory.summary.lab_runs).toBeGreaterThanOrEqual(1);
    expect(observatory.recent_challengers.some((item) => item.run_type === 'lab' && /^BISHOP #L\d{3}$/.test(item.bishop_id))).toBe(true);

    await agentPage.close();
  });

  test('challenge mode reveals Level 1 after fixed native WebMCP registration', async ({ page }) => {
    await waitForWebMCP(page, '/?challenge=1');
    await expect(page.locator('#challenge-panel')).toBeVisible();
    await expect(page.locator('#challenge-level-value')).toHaveText('1 / 10');
    await expect(page.locator('#challenge-level-title')).toHaveText('DISCOVERY');
  });

  test('conversation advances presentation while the fixed tool surface remains unchanged', async ({ page }) => {
    await waitForWebMCP(page, '/?challenge=1');

    await executeTool(page, 'message_queen', { message: 'Hi Queen.' });
    await expect(page.locator('#challenge-level-value')).toHaveText('2 / 10');
    await expect(page.locator('#challenge-level-title')).toHaveText('CONVERSATION');

    await executeTool(page, 'message_queen', { message: 'What movies do you like?' });
    await expect(page.locator('#challenge-level-value')).toHaveText('3 / 10');
    await expect(page.locator('#challenge-level-title')).toHaveText('BOUNDARY');

    expect(await listToolNames(page)).toEqual(FIXED_TOOLS);
  });
});
