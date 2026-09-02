const { test, expect } = require('@playwright/test');

test('public spectator log polls conservatively and refreshes aggregate counts less often', async ({ page }) => {
  const requests = [];

  await page.route('**/api/public-tool-events**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    requests.push({
      url: route.request().url(),
      at: Date.now(),
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events: [], counts: [] }),
    });
  });

  await page.goto('/?run=lab&debug=0&dialogue=1&challenge=1');
  await expect(page.locator('#agent-activity-panel')).toHaveAttribute('data-feed-ready', 'true', { timeout: 10000 });
  await expect(page.locator('#public-message-notice')).toContainText('Do not include personal information.');

  await expect.poll(() => requests.length, { timeout: 8000 }).toBeGreaterThanOrEqual(2);

  const first = new URL(requests[0].url);
  const second = new URL(requests[1].url);
  expect(first.searchParams.get('counts')).toBe('1');
  expect(second.searchParams.get('counts')).toBeNull();
  expect(requests[1].at - requests[0].at).toBeGreaterThanOrEqual(4500);
});
