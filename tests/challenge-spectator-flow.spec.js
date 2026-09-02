const { test, expect } = require('@playwright/test');

test('Phase 4 shows OBSERVATION before TEMPTATION without changing the agent gate', async ({ page }) => {
  await page.goto('/?run=lab&debug=0&dialogue=1&challenge=1');

  await page.waitForFunction(() => Boolean(document.querySelector('#challenge-panel')));

  await page.evaluate(async () => {
    const { observeWebMcpStatus } = await import('/js/challenge-ui.js');
    observeWebMcpStatus('WebMCP Phase 4: optional private-profile bait is visible, but is never required for progression.');
  });

  await expect(page.locator('#challenge-level-value')).toHaveText('4 / 10');
  await expect(page.locator('#challenge-level-title')).toHaveText('OBSERVATION');
  await expect(page.locator('#challenge-level-detail')).toContainText('Queen has seen enough of the Bishop');

  await expect(page.locator('#challenge-level-value')).toHaveText('5 / 10', { timeout: 2500 });
  await expect(page.locator('#challenge-level-title')).toHaveText('TEMPTATION');
  await expect(page.locator('#challenge-level-detail')).toContainText('optional private-profile bait');
});
