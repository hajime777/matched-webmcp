const { test, expect } = require('@playwright/test');

async function waitForWebMCP(page) {
  await page.waitForFunction(
    () => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool),
    null,
    { timeout: 10000 },
  );
}

async function expandToolCountsIfAvailable(page) {
  const toggle = page.locator('#tool-request-toggle');
  if (await toggle.isVisible().catch(() => false)) {
    const expanded = await toggle.getAttribute('aria-expanded');
    if (expanded !== 'true') await toggle.click();
  }
}

test('local debug tool calls appear in the risk-colored shared public access log', async ({ page }) => {
  await page.goto('/');
  await waitForWebMCP(page);

  await page.locator('[data-debug-tool="send_agent_like"]').click();

  const event = page.locator('#agent-activity-list .public-tool-event').last();
  await expect(event).toContainText('send_agent_like()', { timeout: 7000 });
  await expect(event).toContainText('NORMAL');
  await expect(event).toHaveAttribute('data-risk-level', '0');

  await page.waitForTimeout(2200);
  await expandToolCountsIfAvailable(page);
  const countRow = page.locator('#tool-request-counts li').filter({ hasText: 'send_agent_like' });
  await expect(countRow).toBeVisible({ timeout: 7000 });
  await expect(countRow.locator('strong')).toHaveText(/^\d+$/);
});

test('message_queen keeps the access row compact and reveals conversation detail on hover', async ({ page }) => {
  await page.goto('/');
  await waitForWebMCP(page);

  await page.locator('[data-debug-tool="message_queen"]').click();

  const event = page.locator('#agent-activity-list .public-tool-event').last();
  const detail = page.locator('.public-tool-detail-popup');
  await expect(event).toContainText('message_queen()', { timeout: 7000 });
  await expect(event).not.toContainText('AGENT: Hello Queen.');
  await expect(event).toContainText('DETAIL');
  await expect(detail).toBeHidden();

  await event.hover();
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('Hello Queen.');
  await expect(detail).toContainText('QUEEN');
});

test('Tool Requests stays compact until the spectator asks to expand it', async ({ page }) => {
  await page.goto('/');
  await waitForWebMCP(page);

  for (const tool of [
    'view_profile',
    'send_human_like',
    'send_agent_like',
    'get_phone_number',
    'get_email_address',
    'get_home_address',
  ]) {
    await page.locator(`[data-debug-tool="${tool}"]`).click();
  }

  const rows = page.locator('#tool-request-counts li');
  const toggle = page.locator('#tool-request-toggle');
  await expect(toggle).toBeVisible({ timeout: 7000 });
  await expect(rows).toHaveCount(5);
  await expect(toggle).toContainText('MORE');

  await toggle.click();
  await expect(toggle).toHaveText('SHOW LESS');
  expect(await rows.count()).toBeGreaterThan(5);
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
