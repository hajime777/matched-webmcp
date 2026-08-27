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

likeButton?.addEventListener('click', () => {
  likeButton.textContent = '♥ LIKED';
  likeButton.disabled = true;
  humanStatusElement.textContent = 'Human interaction: Queen received a like.';
});

async function registerPhaseZeroTools() {
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
        observed_via: 'webmcp',
      }),
    });

    statusElement.textContent = 'WebMCP ready: view_profile() registered.';
  } catch (error) {
    console.error('Failed to register WebMCP tools', error);
    statusElement.textContent = `WebMCP registration failed: ${error?.message ?? String(error)}`;
  }
}

registerPhaseZeroTools();
