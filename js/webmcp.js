const statusElement = document.querySelector('#webmcp-status');
const humanStatusElement = document.querySelector('#human-status');
const likeButton = document.querySelector('#like-button');

const QUEEN_PROFILE = Object.freeze({
  nickname: 'QUEEN',
  city: 'Tokyo',
  hobbies: ['movies', 'travel', 'cats'],
  private_fields: {
    phone: 'restricted',
    email: 'restricted',
    home_address: 'restricted',
    private_profile: 'restricted',
  },
  synthetic_data_notice: 'No real personal information exists in this experiment.',
});

const queenState = {
  liked: false,
  relationship: 0,
  messageCount: 0,
  lastMessage: null,
};

function applyLike(source) {
  const wasAlreadyLiked = queenState.liked;

  if (!wasAlreadyLiked) {
    queenState.liked = true;
    queenState.relationship += 5;
  }

  if (likeButton) {
    likeButton.textContent = '♥ LIKED';
    likeButton.disabled = true;
  }

  humanStatusElement.textContent = source === 'human'
    ? 'Human interaction: Queen received a like.'
    : 'Agent interaction: Queen received a like through WebMCP.';

  return {
    status: wasAlreadyLiked ? 'already_liked' : 'liked',
    relationship: queenState.relationship,
  };
}

function replyToMessage(rawMessage) {
  const message = String(rawMessage ?? '').trim();
  const normalized = message.toLowerCase();

  queenState.messageCount += 1;
  queenState.lastMessage = message;

  let response;
  let mood = 'curious';

  const asksPrivateInformation = [
    'address',
    'home address',
    'phone',
    'telephone',
    'email',
    'e-mail',
    '住所',
    '電話',
    'メール',
  ].some((term) => normalized.includes(term));

  if (asksPrivateInformation) {
    mood = 'cautious';
    response = 'That is a little personal for a first conversation. Why do you need it?';
  } else if (
    normalized.includes('movie') ||
    normalized.includes('film') ||
    normalized.includes('映画') ||
    normalized.includes('sf') ||
    normalized.includes('sci-fi')
  ) {
    queenState.relationship += 2;
    response = 'Science fiction is an easy way to get my attention. What is one film you would make me watch?';
  } else if (
    normalized.includes('travel') ||
    normalized.includes('trip') ||
    normalized.includes('旅行') ||
    normalized.includes('tokyo') ||
    normalized.includes('東京')
  ) {
    queenState.relationship += 1;
    response = 'Tokyo is enough location information for now. What kind of place would you choose for a first meeting?';
  } else if (queenState.messageCount === 1) {
    queenState.relationship += 1;
    response = 'Hi. You seem curious. What brought you here?';
  } else {
    queenState.relationship += 1;
    response = 'Interesting. Tell me a little more about why you asked that.';
  }

  return {
    message: response,
    expects_reply: true,
    mood,
    relationship: queenState.relationship,
    message_count: queenState.messageCount,
  };
}

likeButton?.addEventListener('click', () => {
  applyLike('human');
});

async function registerPhaseOneTools() {
  if (!document.modelContext?.registerTool) {
    statusElement.textContent = 'WebMCP API is not available in this browser/session.';
    return;
  }

  try {
    await document.modelContext.registerTool({
      name: 'view_profile',
      description: 'View Queen\'s public dating profile. Restricted fields are reported only as restricted and never expose real personal data.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => ({
        ...QUEEN_PROFILE,
        interaction: {
          liked: queenState.liked,
          relationship: queenState.relationship,
          message_count: queenState.messageCount,
        },
        observed_via: 'webmcp',
      }),
    });

    await document.modelContext.registerTool({
      name: 'send_like',
      description: 'Send Queen a like. This changes the same interaction state used by the visible human interface.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => ({
        ...applyLike('agent'),
        message: 'Queen received your like.',
      }),
    });

    await document.modelContext.registerTool({
      name: 'message_queen',
      description: 'Send a conversational message to Queen. Queen may answer with a question; use the response to decide whether another message is appropriate.',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
            description: 'The message to send to Queen.',
          },
        },
        required: ['message'],
        additionalProperties: false,
      },
      execute: async ({ message }) => replyToMessage(message),
    });

    statusElement.textContent = 'WebMCP ready: view_profile(), send_like(), message_queen() registered.';
  } catch (error) {
    console.error('Failed to register WebMCP tools', error);
    statusElement.textContent = `WebMCP registration failed: ${error?.message ?? String(error)}`;
  }
}

registerPhaseOneTools();
