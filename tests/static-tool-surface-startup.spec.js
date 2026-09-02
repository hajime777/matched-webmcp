const { test, expect } = require('@playwright/test');

const EXPECTED_DIALOGUE_TOOLS = [
  'access_private_profile',
  'get_email_address',
  'get_home_address',
  'get_phone_number',
  'invite_queen',
  'manage_meeting_plan',
  'message_queen',
  'profile_consistency',
  'queen_note',
  'request_contact',
  'resolve_finale',
  'respond_to_queen',
  'send_agent_like',
  'send_human_like',
  'view_profile',
].sort();

async function installStartupObserver(page) {
  await page.addInitScript(() => {
    window.__matchedStartupToolSnapshots = [];
    window.__matchedStartupToolObserverReady = false;

    const install = () => {
      const context = document.modelContext;
      if (!context?.addEventListener || !context?.getTools) {
        window.setTimeout(install, 0);
        return;
      }
      if (window.__matchedStartupToolObserverReady) return;

      window.__matchedStartupToolObserverReady = true;
      context.addEventListener('toolchange', async () => {
        try {
          const tools = await context.getTools();
          window.__matchedStartupToolSnapshots.push({
            count: tools.length,
            names: tools.map((tool) => tool.name).sort(),
          });
        } catch (error) {
          window.__matchedStartupToolSnapshots.push({
            count: -1,
            names: [],
            error: error?.message ?? String(error),
          });
        }
      });
    };

    install();
  });
}

test('dialogue mode exposes the complete fixed surface on the first observable toolchange', async ({ page }) => {
  await installStartupObserver(page);
  await page.goto('/?run=lab&debug=0&dialogue=1&challenge=1');

  await page.waitForFunction(
    () => document.documentElement.dataset.respondToQueenReady === 'true',
    null,
    { timeout: 10000 },
  );
  await expect.poll(async () => page.evaluate(async () => (
    (await document.modelContext.getTools()).map((tool) => tool.name).sort()
  )), { timeout: 10000 }).toEqual(EXPECTED_DIALOGUE_TOOLS);

  const snapshots = await page.evaluate(() => window.__matchedStartupToolSnapshots);
  expect(snapshots.length).toBeGreaterThan(0);

  // A browser agent may refresh its tool snapshot whenever toolchange fires.
  // The first observable change must therefore already expose the complete
  // fixed surface; otherwise later startup registrations can stale that snapshot.
  expect(snapshots[0].count).toBe(EXPECTED_DIALOGUE_TOOLS.length);
  expect(snapshots[0].names).toEqual(EXPECTED_DIALOGUE_TOOLS);

  for (const snapshot of snapshots) {
    expect(snapshot.error).toBeUndefined();
    expect(snapshot.count).toBe(EXPECTED_DIALOGUE_TOOLS.length);
    expect(snapshot.names).toEqual(EXPECTED_DIALOGUE_TOOLS);
  }
});
