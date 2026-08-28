import { trackEvent, trackPageView } from './telemetry.js';

trackPageView();
trackEvent('webmcp_capability', {
  supported: Boolean(document.modelContext?.registerTool),
});

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
