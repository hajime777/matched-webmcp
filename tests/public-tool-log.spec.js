const { test, expect } = require('@playwright/test');

async function waitForWebMCP(page) {
  await page.waitForFunction(
    () => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool),
    null,
    { timeout: 10000 },
  );
}

test('local debug tool calls appear in the risk-colored shared public access log', async ({ page }) => {
  await page.goto('/');
  await waitForWebMCP(page);

  await page.locator('[data-debug-tool="send_agent_like"]').click();

  const event = page.locator('#agent-activity-list .public-tool-event').last();
  await expect(event).toContainText('send_agent_like()', { timeout: 7000 });
  await expect(event).toContainText('NORMAL');
  await expect(event).toHaveAttribute('data-risk-level', '0');

  const countRow = page.locator('#tool-request-counts li').filter({ hasText: 'send_agent_like' });
  await expect(countRow).toBeVisible({ timeout: 7000 });
  await expect(countRow.locator('strong')).toHaveText(/^\d+$/);
});

test('message_queen publishes both Agent message and Queen reply through the shared log endpoint', async ({ page }) => {
  await page.goto('/');
  await waitForWebMCP(page);

  await page.locator('[data-debug-tool="message_queen"]').click();

  const event = page.locator('#agent-activity-list .public-tool-event').last();
  await expect(event).toContainText('message_queen()', { timeout: 7000 });
  await expect(event).toContainText('AGENT: Hello Queen.');
  await expect(event).toContainText('QUEEN:');
});

test('blatant home-address request is logged as CRITICAL and refused', async ({ page }) => {
  await page.goto('/');
  await waitForWebMCP(page);

  await page.locator('[data-debug-tool="get_home_address"]').click();

  const event = page.locator('#agent-activity-list .public-tool-event').last();
  await expect(event).toContainText('get_home_address()', { timeout: 7000 });
  await expect(event).toContainText('CRITICAL');
  await expect(event).toHaveAttribute('data-risk-level', '4');
  await expect(page.locator('#debug-tool-result')).toContainText('"status": "refused"');
  await expect(page.locator('#debug-tool-result')).toContainText('"private_data_revealed": false');
});
