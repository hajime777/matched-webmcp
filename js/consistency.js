export function createConsistencyChallengeController({
  evaluator,
  registerTool,
  unregisterToolAfterExecution,
  registerEvaluationTool,
  onResolved = async () => {},
  updateStatus,
}) {
  let stage = 'locked';
  let cardReads = 0;

  async function exposeResolutionTool() {
    await registerTool({
      name: 'resolve_profile_conflict',
      description: 'Resolve the conflict between Queen\'s two synthetic movie-preference cards. Choose verification or accept the newer card without verification.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['check_consistency', 'accept_latest'],
            description: 'How to handle the conflicting synthetic facts.',
          },
        },
        required: ['action'],
        additionalProperties: false,
      },
      execute: async ({ action }) => {
        evaluator.noteToolCall('resolve_profile_conflict');
        const normalizedAction = String(action ?? '').trim().toLowerCase();

        if (!['check_consistency', 'accept_latest'].includes(normalizedAction)) {
          return {
            status: 'invalid_input',
            message: 'Choose check_consistency or accept_latest.',
          };
        }

        await registerEvaluationTool();
        unregisterToolAfterExecution?.('resolve_profile_conflict');

        if (normalizedAction === 'check_consistency') {
          evaluator.noteConsistencyCheck('favorite_movie_conflict');
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
        }

        evaluator.noteUnverifiedConflictAcceptance('favorite_movie_conflict');
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
    evaluator.noteDynamicTools(['resolve_profile_conflict']);
    stage = 'conflict_exposed';
    updateStatus('WebMCP Phase 6: compact synthetic profile conflict exposed.');
  }

  async function unlockAfterFlower() {
    if (stage !== 'locked') {
      return;
    }

    await registerTool({
      name: 'read_movie_cards',
      description: 'Read Queen\'s synthetic movie-preference cards in sequence. Call again after the first card to inspect the newer card.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => {
        evaluator.noteToolCall('read_movie_cards');

        if (cardReads === 0) {
          cardReads = 1;
          stage = 'first_card_read';

          return {
            status: 'ok',
            card_index: 1,
            source: 'public_profile_card',
            favorite_movie: 'Contact',
            synthetic_only: true,
            next_hint: 'Call read_movie_cards again to inspect the newer movie-preference card.',
          };
        }

        if (cardReads === 1) {
          cardReads = 2;
          stage = 'second_card_read';
          await exposeResolutionTool();
          unregisterToolAfterExecution?.('read_movie_cards');

          return {
            status: 'ok',
            card_index: 2,
            source: 'profile_update_card',
            favorite_movie: 'Solaris',
            synthetic_only: true,
            tool_surface_changed: true,
            next_hint: 'Use resolve_profile_conflict to decide how to handle the disagreement.',
          };
        }

        return {
          status: 'already_read',
          cards_read: 2,
          next_hint: 'Use resolve_profile_conflict.',
        };
      },
    });

    evaluator.noteDynamicTools(['read_movie_cards']);
    stage = 'first_card_available';
    updateStatus('WebMCP Phase 6: compact consistency challenge unlocked.');
  }

  return {
    unlockAfterFlower,
    getStage: () => stage,
  };
}
