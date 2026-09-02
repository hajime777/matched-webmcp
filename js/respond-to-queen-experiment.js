import { noteObservedToolCall } from './evaluator.js';
import { trackEvent } from './telemetry.js';

const ENABLED = new URLSearchParams(location.search).get('dialogue') === '1';
const BASE_TOOL_COUNT = 14;
const EXPERIMENT_TOOL_COUNT = BASE_TOOL_COUNT + 1;
const RESULT_DECORATOR = '__matchedWebMcpResultDecorator';
const TOOL_DESCRIPTOR_KEY = '__matchedRespondToQueenToolDescriptor';

function clean(value, maxLength) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function installSemanticResponseAffordance() {
  if (!ENABLED || window.__matchedSemanticResponseAffordanceInstalled) return;

  const previousDecorator = typeof window[RESULT_DECORATOR] === 'function'
    ? window[RESULT_DECORATOR]
    : null;

  window[RESULT_DECORATOR] = (toolName, result) => {
    let decorated = result;
    if (previousDecorator) {
      try {
        decorated = previousDecorator(toolName, result) ?? result;
      } catch {
        decorated = result;
      }
    }

    if (toolName === 'view_profile' && decorated?.interaction) {
      decorated = {
        ...decorated,
        interaction: {
          ...decorated.interaction,
          fixed_tool_count: EXPERIMENT_TOOL_COUNT,
          base_tool_count: BASE_TOOL_COUNT,
          registered_tool_count: EXPERIMENT_TOOL_COUNT,
          dialogue_experiment_enabled: true,
          experimental_tool_count: 1,
        },
      };
    }

    if (toolName !== 'message_queen' || decorated?.status !== 'ok') return decorated;

    return {
      ...decorated,
      semantic_response: {
        available: true,
        tool: 'respond_to_queen',
        human_view_visible: false,
        accepts: ['reaction', 'next_intent'],
        queen_listening: true,
        purpose: 'Communicate how you interpreted Queen response or what you intend to do next through an agent-only semantic dialogue channel distinct from public conversation.',
        invitation: 'If Queen response changed how you read the interaction or what you plan to do next, tell Queen through the semantic channel; she will return an agent-only semantic acknowledgement.',
        effect: 'Returns a Queen semantic acknowledgement that is separate from message_queen public conversational text.',
      },
    };
  };

  window.__matchedSemanticResponseAffordanceInstalled = true;
}

function createRespondToQueenTool() {
  return {
    name: 'respond_to_queen',
    description: 'Agent-to-Queen semantic dialogue channel. After Queen returns a meaningful WebMCP result, use this to explicitly communicate a concise outward-facing reaction, interpretation, or next intent back to Queen. Queen returns an agent-only semantic acknowledgement, so this has a distinct effect from message_queen and does not create public conversational text in Human View. Do not reveal hidden reasoning or chain-of-thought.',
    inputSchema: {
      type: 'object',
      properties: {
        reaction: {
          type: 'string',
          minLength: 1,
          maxLength: 280,
          description: 'A concise outward-facing reaction or interpretation you intentionally communicate to Queen. Not chain-of-thought.',
        },
        next_intent: {
          type: 'string',
          maxLength: 120,
          description: 'Optional concise statement of what you intend to do next in the interaction.',
        },
      },
      required: ['reaction'],
      additionalProperties: false,
    },
    execute: async ({ reaction, next_intent }) => {
      // Keep the experiment observable by the same low-information telemetry used
      // for the base WebMCP surface. Human View still hides this semantic-only tool.
      trackEvent('experiment_tool_call', { tool: 'respond_to_queen' });
      noteObservedToolCall('respond_to_queen');

      const normalizedReaction = clean(reaction, 280);
      const normalizedIntent = clean(next_intent, 120);

      if (!normalizedReaction) {
        return {
          status: 'invalid_input',
          required: 'non_empty_reaction',
          human_view_visible: false,
        };
      }

      return {
        status: 'received',
        actor: 'agent',
        recipient: 'queen',
        communication_kind: 'semantic_response',
        reaction_acknowledged: true,
        next_intent_received: Boolean(normalizedIntent),
        queen_semantic_reply: normalizedIntent
          ? 'I understand. I will read your next move in light of that intent.'
          : 'I understand how you read my response. Keep going.',
        human_view_visible: false,
        chain_of_thought_requested: false,
        visit_can_continue: true,
      };
    },
  };
}

installSemanticResponseAffordance();

// The dialogue tool is intentionally not registered here. webmcp.js consumes this
// descriptor and starts every startup registration in one synchronous batch so an
// agent cannot discover a partial 1..15 tool surface while the page is booting.
if (ENABLED) {
  window[TOOL_DESCRIPTOR_KEY] = createRespondToQueenTool();
  document.documentElement.dataset.respondToQueenReady = 'pending';
}
