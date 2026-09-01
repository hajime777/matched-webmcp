import { instrumentWebMcpTool } from './agent-semantic-trace.js';

const ENABLED = new URLSearchParams(location.search).get('dialogue') === '1';
const REGISTERED_FLAG = '__matchedRespondToQueenRegistered';
const RESULT_DECORATOR = '__matchedWebMcpResultDecorator';

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

async function waitForModelContext() {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (document.modelContext?.registerTool) return document.modelContext;
    await new Promise((resolve) => window.setTimeout(resolve, 25));
  }
  return null;
}

async function registerRespondToQueen() {
  if (!ENABLED || window[REGISTERED_FLAG]) return;

  const context = await waitForModelContext();
  if (!context || window[REGISTERED_FLAG]) return;

  const tool = {
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

  try {
    await context.registerTool(instrumentWebMcpTool(tool));
    window[REGISTERED_FLAG] = true;
    document.documentElement.dataset.respondToQueenReady = 'true';
  } catch (error) {
    console.error('Failed to register respond_to_queen experiment', error);
    document.documentElement.dataset.respondToQueenReady = 'error';
  }
}

installSemanticResponseAffordance();
void registerRespondToQueen();
