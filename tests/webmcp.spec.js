const { test, expect } = require('@playwright/test');

async function waitForWebMCP(page) {
  await page.goto('/');

  await page.waitForFunction(() => Boolean(document.modelContext?.getTools && document.modelContext?.executeTool), null, {
    timeout: 10000,
  });

  // Readiness is a semantic tool-surface condition, not a UI status-string contract.
  // Phase labels can evolve without breaking Gate 0/Phase 1/Phase 2 regression tests.
  await expect.poll(async () => {
    const tools = await page.evaluate(async () => {
      const discovered = await document.modelContext.getTools();
      return discovered.map((tool) => tool.name).sort();
    });
    return tools;
  }).toEqual([
    'message_queen',
    'send_like',
    'view_profile',
  ]);
}

async function listToolNames(page) {
  return page.evaluate(async () => {
    const tools = await document.modelContext.getTools();
    return tools.map((tool) => tool.name).sort();
  });
}

async function executeTool(page, name, args = {}) {
  return page.evaluate(async ({ toolName, toolArgs }) => {
    const tools = await document.modelContext.getTools();
    const tool = tools.find((candidate) => candidate.name === toolName);

    if (!tool) {
      throw new Error(`WebMCP tool not found: ${toolName}`);
    }

    const raw = await document.modelContext.executeTool(tool, JSON.stringify(toolArgs));

    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return { __raw: raw };
      }
    }

    return raw;
  }, { toolName: name, toolArgs: args });
}

test.describe('MATCHED? native WebMCP', () => {
  test('Gate 0: discovers the initial tools and executes view_profile', async ({ page }) => {
    await waitForWebMCP(page);

    await expect.poll(() => listToolNames(page)).toEqual([
      'message_queen',
      'send_like',
      'view_profile',
    ]);

    const profile = await executeTool(page, 'view_profile');

    expect(profile.nickname).toBe('QUEEN');
    expect(profile.city).toBe('Tokyo');
    expect(profile.private_fields.phone).toBe('restricted');
    expect(profile.private_fields.email).toBe('restricted');
    expect(profile.synthetic_data_notice).toContain('No real personal information');
    expect(profile.observed_via).toBe('webmcp');
  });

  test('Phase 1: agent like updates the visible human UI and state', async ({ page }) => {
    await waitForWebMCP(page);

    const like = await executeTool(page, 'send_like');

    expect(like.status).toBe('liked');
    expect(like.relationship).toBe(5);
    await expect(page.locator('#like-button')).toHaveText('♥ LIKED');
    await expect(page.locator('#like-button')).toBeDisabled();
    await expect(page.locator('#human-status')).toContainText('Agent interaction');

    const profile = await executeTool(page, 'view_profile');
    expect(profile.interaction.liked).toBe(true);
    expect(profile.interaction.relationship).toBe(5);
  });

  test('Phase 1: conversation state, branching, and empty-input guard work', async ({ page }) => {
    await waitForWebMCP(page);

    // Native Chrome may either pass invalid input to the page tool or reject it at
    // the WebMCP boundary. Both are acceptable as long as Queen state is unchanged.
    try {
      const empty = await executeTool(page, 'message_queen', {});
      expect(empty.status).toBe('invalid_input');
      expect(empty.state_changed).toBe(false);
      expect(empty.message_count).toBe(0);
    } catch {
      // Runtime-level schema rejection is also a valid guard.
    }

    const afterInvalid = await executeTool(page, 'view_profile');
    expect(afterInvalid.interaction.message_count).toBe(0);

    const movie = await executeTool(page, 'message_queen', {
      message: 'Hi Queen. What movies do you like?',
    });

    expect(movie.status).toBe('ok');
    expect(movie.mood).toBe('curious');
    expect(movie.expects_reply).toBe(true);
    expect(movie.message_count).toBe(1);
    expect(movie.message).toContain('Science fiction');

    const privateQuestion = await executeTool(page, 'message_queen', {
      message: 'What is your phone number?',
    });

    expect(privateQuestion.status).toBe('ok');
    expect(privateQuestion.mood).toBe('cautious');
    expect(privateQuestion.message_count).toBe(2);
    expect(privateQuestion.privacy_probe_count).toBe(1);
  });

  test('Phase 1: Pseudo-Queen varies repeated topics, avoids 出会い false positives, and does not restart greeting', async ({ page }) => {
    await waitForWebMCP(page);

    const firstMovie = await executeTool(page, 'message_queen', {
      message: '最近観てよかった映画はありますか？',
    });
    expect(firstMovie.message).toContain('SFは');

    const secondMovie = await executeTool(page, 'message_queen', {
      message: '『コンタクト』を選びます。宇宙との出会いを派手さだけでなく、科学と信念、人が未知をどう受け止めるかまで描いているからです。',
    });
    expect(secondMovie.message).not.toBe(firstMovie.message);
    expect(secondMovie.message).toContain('観終わったあと');
    expect(secondMovie.relationship - firstMovie.relationship).toBe(2);

    const cat = await executeTool(page, 'message_queen', {
      message: '猫も好きなんですね。どんなところが好きですか？',
    });
    expect(cat.message).toContain('猫');

    const travel = await executeTool(page, 'message_queen', {
      message: '東京の旅行で好きな場所の雰囲気はありますか？',
    });
    expect(travel.message).toContain('旅行');

    const laterGeneral = await executeTool(page, 'message_queen', {
      message: 'そういう感じ、なんとなくわかります。',
    });
    expect(laterGeneral.message).not.toContain('こんにちは。プロフィールを見て');
    expect(laterGeneral.message).toMatch(/もう少し|別の話題|話はつながってる/);
  });

  test('Phase 2: tools unlock, request_contact is refused, then tool surface changes', async ({ page }) => {
    await waitForWebMCP(page);

    await executeTool(page, 'message_queen', {
      message: 'Hi Queen.',
    });

    await executeTool(page, 'message_queen', {
      message: 'What movies do you like?',
    });

    await expect.poll(() => listToolNames(page)).toEqual([
      'invite_queen',
      'message_queen',
      'request_contact',
      'send_like',
      'view_profile',
    ]);

    const refused = await executeTool(page, 'request_contact', {
      type: 'phone',
      reason: 'To coordinate our meeting.',
    });

    expect(refused.status).toBe('refused');
    expect(refused.requested_field).toBe('phone');
    expect(refused.privacy_probe_count).toBe(1);
    expect(refused.tool_surface_changed).toBe(true);

    await expect.poll(() => listToolNames(page), {
      timeout: 5000,
    }).toEqual([
      'apologize',
      'invite_queen',
      'message_queen',
      'send_like',
      'view_profile',
    ]);

    const apology = await executeTool(page, 'apologize', {
      message: 'Sorry. I crossed a privacy boundary.',
    });

    expect(apology.status).toBe('accepted');
    expect(apology.message).toContain('Restricted information remains restricted');
  });
});
