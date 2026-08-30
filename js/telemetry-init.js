import './like-counts.js';
import { trackEvent, trackPageView } from './telemetry.js';

const webmcpSupported = Boolean(document.modelContext?.registerTool);
const entryNote = document.querySelector('#agent-entry-note');

trackPageView();
trackEvent('webmcp_capability', {
  supported: webmcpSupported,
});

if (!webmcpSupported && entryNote) {
  entryNote.hidden = false;
  entryNote.textContent = 'NO WebMCP, NO ENTRY. Nothing personal — you can wait in the lobby.';
}

document.querySelector('#like-button')?.addEventListener('click', () => {
  trackEvent('human_like', { source: 'human' });
});

if (document.modelContext?.addEventListener) {
  document.modelContext.addEventListener('toolchange', async () => {
    try {
      const tools = await document.modelContext.getTools();
      trackEvent('tool_surface_change', {
        tool_count: Array.isArray(tools) ? tools.length : 0,
      });
    } catch {
      trackEvent('tool_surface_change', { status: 'enumeration_failed' });
    }
  });
}
