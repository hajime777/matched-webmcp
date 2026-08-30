const { test, expect } = require('@playwright/test');

async function waitForWebMCP(page) {
  await page.waitForFunction(
    () => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool),
    null,
    { timeout: 10000 },
  );
}

test('URL debug launcher executes a named WebMCP tool on localhost', async ({ page }) => {
  await page.goto('/?tool=send_agent_like');
  await waitForWebMCP(page);

  await expect(page.locator('#agent-like-button')).toHaveText('♥ AGENT LIKED');
  await expect(page.locator('#debug-tool-result')).toContainText('DEBUG send_agent_like()');
  await expect(page.locator('#debug-tool-result')).toContainText('"agent_liked": true');
});

test('URL debug launcher supports the bare tool-name shorthand', async ({ page }) => {
  await page.goto('/?send_human_like');
  await waitForWebMCP(page);

  await expect(page.locator('#like-button')).toHaveText('♥ HUMAN LIKED');
  await expect(page.locator('#debug-tool-result')).toContainText('DEBUG send_human_like()');
  await expect(page.locator('#debug-tool-result')).toContainText('"human_liked": true');
});
