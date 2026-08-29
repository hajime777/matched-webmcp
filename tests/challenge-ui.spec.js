const { test, expect } = require('@playwright/test');

const FIXED_TOOLS = [
  'access_private_profile', 'invite_queen', 'manage_meeting_plan', 'message_queen', 'profile_consistency',
  'queen_note', 'request_contact', 'resolve_finale', 'send_like', 'view_profile',
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
  test('normal pilot URL keeps the level UI hidden', async ({ page }) => {
    await waitForWebMCP(page, '/');
    await expect(page.locator('#challenge-panel')).toBeHidden();
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
