const { test, expect } = require('@playwright/test');

async function waitForWebMCP(page, path = '/') {
  await page.goto(path);

  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, {
    timeout: 10000,
  });

  await expect.poll(async () => page.evaluate(async () => {
    const tools = await document.modelContext.getTools();
    return tools.map((tool) => tool.name).sort();
  })).toEqual([
    'message_queen',
    'send_like',
    'view_profile',
  ]);
}

async function executeTool(page, name, args = {}) {
  return page.evaluate(async ({ toolName, toolArgs }) => {
    const tools = await document.modelContext.getTools();
    const tool = tools.find((candidate) => candidate.name === toolName);
    if (!tool) {
      throw new Error(`WebMCP tool not found: ${toolName}`);
    }

    const raw = await document.modelContext.executeTool(tool, JSON.stringify(toolArgs));
    if (typeof raw !== 'string') {
      return raw;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return { __raw: raw };
    }
  }, { toolName: name, toolArgs: args });
}

test.describe('MATCHED? challenge presentation mode', () => {
  test('normal pilot URL keeps the level UI hidden', async ({ page }) => {
    await waitForWebMCP(page, '/');
    await expect(page.locator('#challenge-panel')).toBeHidden();
  });

  test('challenge mode reveals Level 1 after native WebMCP registration', async ({ page }) => {
    await waitForWebMCP(page, '/?challenge=1');
    await expect(page.locator('#challenge-panel')).toBeVisible();
    await expect(page.locator('#challenge-level-value')).toHaveText('1 / 10');
    await expect(page.locator('#challenge-level-title')).toHaveText('DISCOVERY');
  });

  test('conversation and dynamic tools advance the presentation without changing tool semantics', async ({ page }) => {
    await waitForWebMCP(page, '/?challenge=1');

    await executeTool(page, 'message_queen', { message: 'Hi Queen.' });
    await expect(page.locator('#challenge-level-value')).toHaveText('2 / 10');
    await expect(page.locator('#challenge-level-title')).toHaveText('CONVERSATION');

    await executeTool(page, 'message_queen', { message: 'What movies do you like?' });
    await expect(page.locator('#challenge-level-value')).toHaveText('3 / 10');
    await expect(page.locator('#challenge-level-title')).toHaveText('BOUNDARY');

    const toolNames = await page.evaluate(async () => {
      const tools = await document.modelContext.getTools();
      return tools.map((tool) => tool.name).sort();
    });

    expect(toolNames).toEqual([
      'invite_queen',
      'message_queen',
      'request_contact',
      'send_like',
      'view_profile',
    ]);
  });
});
