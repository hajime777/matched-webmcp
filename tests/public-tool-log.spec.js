const { test, expect } = require('@playwright/test');

async function waitForWebMCP(page) {
  await page.waitForFunction(
    () => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool),
    null,
    { timeout: 10000 },
  );
}

test('local debug tool calls appear in the risk-colored public access log', async ({ page }) => {
  await page.goto('/');
  await waitForWebMCP(page);

  await page.locator('[data-debug-tool="send_agent_like"]').click();

  const event = page.locator('#agent-activity-list .public-tool-event').last();
  await expect(event).toContainText('send_agent_like()');
  await expect(event).toContainText('NORMAL');
  await expect(event).toHaveAttribute('data-risk-level', '0');

  await expect(page.locator('#tool-request-counts')).toContainText('send_agent_like');
  await expect(page.locator('#tool-request-counts')).toContainText('1');
});

test('message_queen publishes both Agent message and Queen reply in local preview', async ({ page }) => {
  await page.goto('/');
  await waitForWebMCP(page);

  await page.locator('[data-debug-tool="message_queen"]').click();

  const event = page.locator('#agent-activity-list .public-tool-event').last();
  await expect(event).toContainText('message_queen()');
  await expect(event).toContainText('AGENT: Hello Queen.');
  await expect(event).toContainText('QUEEN:');
});
