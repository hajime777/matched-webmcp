const { test, expect } = require('@playwright/test');

test('Observatory refreshes conservatively instead of polling every few seconds', async ({ page }) => {
  let requestCount = 0;

  await page.route('**/api/observatory', async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: {
          public_runs: 0,
          referred_runs: 0,
          organic_runs: 0,
          lab_runs: 0,
          legacy_runs: 0,
          active_now: 0,
          checkmates: 0,
          highest_level: 0,
          tool_calls: 0,
        },
        recent_challengers: [],
      }),
    });
  });

  await page.goto('/observatory.html');
  await expect(page.locator('.observatory-refresh-note')).toContainText('15s');
  await expect.poll(() => requestCount).toBe(1);

  // The old implementation refreshed every 3 seconds. A visible page should not
  // issue another Observatory query during this short window anymore.
  await page.waitForTimeout(4200);
  expect(requestCount).toBe(1);
});
