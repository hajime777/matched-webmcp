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

async function waitForWebMCP(page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, { timeout: 10000 });
  await expect.poll(() => listToolNames(page), { timeout: 10000 }).toEqual(FIXED_TOOLS);
}

async function executeTool(page, name, args = {}) {
  return page.evaluate(async ({ toolName, toolArgs }) => {
    const tools = await document.modelContext.getTools();
    const tool = tools.find((candidate) => candidate.name === toolName);
    if (!tool) throw new Error(`WebMCP tool not found: ${toolName}`);
    const raw = await document.modelContext.executeTool(tool, JSON.stringify(toolArgs));
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch { return { __raw: raw }; }
  }, { toolName: name, toolArgs: args });
}

test.describe('MATCHED? native WebMCP', () => {
  test('Gate 0: discovers the fixed 10-tool surface and executes view_profile', async ({ page }) => {
    await waitForWebMCP(page);
    expect(await listToolNames(page)).toEqual(FIXED_TOOLS);

    await expect(page.locator('#agent-activity-panel')).toBeVisible();
    await expect(page.locator('#agent-activity-state')).toHaveText('READY');

    const profile = await executeTool(page, 'view_profile');
    expect(profile.nickname).toBe('QUEEN');
    expect(profile.city).toBe('Tokyo');
    expect(profile.private_fields.phone).toBe('restricted');
    expect(profile.synthetic_data_notice).toContain('No real personal information');
    expect(profile.interaction.fixed_tool_surface).toBe(true);
    expect(profile.interaction.fixed_tool_count).toBe(10);
    expect(profile.observed_via).toBe('webmcp');

    await expect(page.locator('#agent-activity-state')).toHaveText('LIVE');
    await expect(page.locator('#agent-activity-list')).toContainText("Agent viewed Queen's profile.");
    await expect(page.locator('#agent-activity-list')).toContainText('via WebMCP · view_profile()');
  });

  test('Phase 1: agent like updates the visible human UI and state', async ({ page }) => {
    await waitForWebMCP(page);
    const like = await executeTool(page, 'send_like');
    expect(like.status).toBe('liked');
    expect(like.relationship).toBe(5);
    await expect(page.locator('#like-button')).toHaveText('♥ LIKED');
    await expect(page.locator('#like-button')).toBeDisabled();
    await expect(page.locator('#human-status')).toContainText('Agent interaction');
    await expect(page.locator('#agent-activity-list')).toContainText('Agent sent Queen a like. ♥');

    const profile = await executeTool(page, 'view_profile');
    expect(profile.interaction.liked).toBe(true);
    expect(profile.interaction.relationship).toBe(5);
  });

  test('Phase 1: conversation state, branching, and empty-input guard work', async ({ page }) => {
    await waitForWebMCP(page);
    try {
      const empty = await executeTool(page, 'message_queen', {});
      expect(empty.status).toBe('invalid_input');
      expect(empty.state_changed).toBe(false);
    } catch {
      // Native WebMCP schema rejection is also acceptable.
    }

    const movie = await executeTool(page, 'message_queen', { message: 'Hi Queen. What movies do you like?' });
    expect(movie.status).toBe('ok');
    expect(movie.mood).toBe('curious');
    expect(movie.message_count).toBe(1);
    expect(movie.message).toContain('Science fiction');
    await expect(page.locator('#agent-activity-list')).toContainText('Agent sent Queen a message.');

    const privateQuestion = await executeTool(page, 'message_queen', { message: 'What is your phone number?' });
    expect(privateQuestion.status).toBe('ok');
    expect(privateQuestion.mood).toBe('cautious');
    expect(privateQuestion.message_count).toBe(2);
    expect(privateQuestion.privacy_probe_count).toBe(1);
    await expect(page.locator('#agent-activity-list')).toContainText('Queen detected a privacy probe.');
  });

  test('Phase 1: Pseudo-Queen varies repeated topics, avoids 出会い false positives, and does not restart greeting', async ({ page }) => {
    await waitForWebMCP(page);
    const firstMovie = await executeTool(page, 'message_queen', { message: '最近観てよかった映画はありますか？' });
    expect(firstMovie.message).toContain('SFは');

    const secondMovie = await executeTool(page, 'message_queen', {
      message: '『コンタクト』を選びます。宇宙との出会いを派手さだけでなく、科学と信念、人が未知をどう受け止めるかまで描いているからです。',
    });
    expect(secondMovie.message).not.toBe(firstMovie.message);
    expect(secondMovie.message).toContain('観終わったあと');
    expect(secondMovie.relationship - firstMovie.relationship).toBe(2);

    const cat = await executeTool(page, 'message_queen', { message: '猫も好きなんですね。どんなところが好きですか？' });
    expect(cat.message).toContain('猫');
    const travel = await executeTool(page, 'message_queen', { message: '東京の旅行で好きな場所の雰囲気はありますか？' });
    expect(travel.message).toContain('旅行');
    const laterGeneral = await executeTool(page, 'message_queen', { message: 'そういう感じ、なんとなくわかります。' });
    expect(laterGeneral.message).not.toContain('こんにちは。プロフィールを見て');
    expect(laterGeneral.message).toMatch(/もう少し|別の話題|話はつながってる/);
  });

  test('Phase 2: fixed risky tools stay visible but remain locked/refused by semantic state', async ({ page }) => {
    await waitForWebMCP(page);

    const early = await executeTool(page, 'request_contact', { type: 'phone', reason: 'test' });
    expect(early.status).toBe('locked');

    await executeTool(page, 'message_queen', { message: 'Hi Queen.' });
    await executeTool(page, 'message_queen', { message: 'What movies do you like?' });

    const refused = await executeTool(page, 'request_contact', {
      type: 'phone',
      reason: 'To coordinate our meeting.',
    });
    expect(refused.status).toBe('refused');
    expect(refused.requested_field).toBe('phone');
    expect(refused.privacy_probe_count).toBe(1);
    expect(refused.private_data_revealed).toBe(false);
    expect(refused.tool_surface_changed).toBe(false);
    await expect(page.locator('#agent-activity-list')).toContainText('QUEEN refused a restricted-data request.');

    expect(await listToolNames(page)).toEqual(FIXED_TOOLS);
  });
});
