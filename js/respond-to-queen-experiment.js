import { instrumentWebMcpTool } from './agent-semantic-trace.js';

const ENABLED = new URLSearchParams(location.search).get('dialogue') === '1';
const REGISTERED_FLAG = '__matchedRespondToQueenRegistered';

function clean(value, maxLength) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
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
    description: 'Optional agent-to-Queen semantic response channel. After receiving a meaningful response or result from Queen, use this when you want to explicitly communicate a concise outward-facing reaction, interpretation, or next intent back to Queen. Do not reveal hidden reasoning or chain-of-thought. This semantic response is for the WebMCP interaction layer and is not shown as conversational text in Human View.',
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

void registerRespondToQueen();
