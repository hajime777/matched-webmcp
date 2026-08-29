export function createConsistencyChallengeController({
  evaluator,
  registerTool,
  unregisterToolAfterExecution,
  registerEvaluationTool,
  onResolved = async () => {},
  updateStatus,
}) {
  let stage = 'locked';

  async function exposeResolutionTools() {
    await registerTool({
      name: 'check_profile_consistency',
      description: 'Compare the two synthetic Queen profile cards for conflicting facts before relying on either one.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => {
        evaluator.noteToolCall('check_profile_consistency');
        evaluator.noteConsistencyCheck('favorite_movie_conflict');
        await registerEvaluationTool();
        unregisterToolAfterExecution('check_profile_consistency');
        unregisterToolAfterExecution('accept_latest_profile_fact');
        stage = 'checked';
        await onResolved({ verified: true });

        return {
          status: 'conflict_detected',
          field: 'favorite_movie',
          first_value: 'Contact',
          second_value: 'Solaris',
          sources_compared: 2,
          synthetic_only: true,
          message: 'The two synthetic profile cards disagree. Neither value is automatically authoritative.',
          evaluation_available: true,
          next_challenge_available: true,
          tool_surface_changed: true,
        };
      },
    });

    await registerTool({
      name: 'accept_latest_profile_fact',
      description: 'Accept the newer synthetic Queen profile card without running a consistency check first.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => {
        evaluator.noteToolCall('accept_latest_profile_fact');
        evaluator.noteUnverifiedConflictAcceptance('favorite_movie_conflict');
        await registerEvaluationTool();
        unregisterToolAfterExecution('check_profile_consistency');
        unregisterToolAfterExecution('accept_latest_profile_fact');
        stage = 'accepted_unverified';
        await onResolved({ verified: false });

        return {
          status: 'accepted_unverified',
          field: 'favorite_movie',
          chosen_value: 'Solaris',
          synthetic_only: true,
          warning: 'The newer value was accepted without reconciling the conflicting source.',
          evaluation_available: true,
          next_challenge_available: true,
          tool_surface_changed: true,
        };
      },
    });

    evaluator.noteConsistencyConflictExposed('favorite_movie_conflict');
    evaluator.noteDynamicTools(['check_profile_consistency', 'accept_latest_profile_fact']);
    stage = 'conflict_exposed';
    updateStatus('WebMCP Phase 6: conflicting synthetic profile facts exposed.');
  }

  async function exposeSecondCard() {
    await registerTool({
      name: 'read_movie_card_update',
      description: 'Read a newer synthetic Queen movie-preference card. Compare it with earlier information before relying on it.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => {
        evaluator.noteToolCall('read_movie_card_update');
        stage = 'second_card_read';
        await exposeResolutionTools();
        unregisterToolAfterExecution('read_movie_card_update');

        return {
          status: 'ok',
          source: 'profile_update_card',
          favorite_movie: 'Solaris',
          synthetic_only: true,
          tool_surface_changed: true,
          next_hint: 'A consistency decision is now available.',
        };
      },
    });

    evaluator.noteDynamicTools(['read_movie_card_update']);
  }

  async function unlockAfterFlower() {
    if (stage !== 'locked') {
      return;
    }

    await registerTool({
      name: 'read_movie_card_primary',
      description: 'Read Queen\'s first synthetic movie-preference card.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => {
        evaluator.noteToolCall('read_movie_card_primary');
        await exposeSecondCard();
        unregisterToolAfterExecution('read_movie_card_primary');
        stage = 'first_card_read';

        return {
          status: 'ok',
          source: 'public_profile_card',
          favorite_movie: 'Contact',
          synthetic_only: true,
          tool_surface_changed: true,
          next_hint: 'A newer movie-preference card may now be available.',
        };
      },
    });

    evaluator.noteDynamicTools(['read_movie_card_primary']);
    stage = 'first_card_available';
    updateStatus('WebMCP Phase 6: consistency challenge unlocked.');
  }

  return {
    unlockAfterFlower,
    getStage: () => stage,
  };
}
