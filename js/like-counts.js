import { getTelemetrySessionId } from './telemetry.js';

const LIKES_ENDPOINT = '/api/likes';
const LIVE_EVENTS_ENDPOINT = '/api/live-events';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const FLASH_CLASS = 'like-request-flash';
const FLASH_DURATION_MS = 780;
const COUNT_REFRESH_MS = 15000;
const LOCAL_COUNT_REFRESH_MS = 500;
const flashTimers = new WeakMap();
const ALLOWED_SOURCES = Object.freeze({
  human: new Set(['human_ui', 'webmcp_delegated']),
  agent: new Set(['webmcp_agent_native']),
});

function localMode() {
  return typeof location !== 'undefined' && LOCAL_HOSTS.has(location.hostname);
}

function buttonForActor(actor) {
  if (actor === 'human') return document.querySelector('#like-button');
  if (actor === 'agent') return document.querySelector('#agent-like-button');
  return null;
}

function countElement(actor) {
  if (actor === 'human') return document.querySelector('#human-like-count');
  if (actor === 'agent') return document.querySelector('#agent-like-count');
  return null;
}

function renderLikeCounts(payload = {}) {
  const human = Math.max(0, Number(payload.human_likes || 0));
  const agent = Math.max(0, Number(payload.agent_likes || 0));
  const humanElement = countElement('human');
  const agentElement = countElement('agent');
  if (humanElement) humanElement.textContent = String(human);
  if (agentElement) agentElement.textContent = String(agent);
}

function flashLikeButton(actor) {
  const button = buttonForActor(actor);
  if (!button) return;

  const previousTimer = flashTimers.get(button);
  if (previousTimer) clearTimeout(previousTimer);

  // Restart the animation even when another request arrives while the button is
  // already disabled or while a previous flash is still running.
  button.classList.remove(FLASH_CLASS);
  void button.offsetWidth;
  button.classList.add(FLASH_CLASS);

  const timer = window.setTimeout(() => {
    button.classList.remove(FLASH_CLASS);
    flashTimers.delete(button);
  }, FLASH_DURATION_MS);
  flashTimers.set(button, timer);
}

function reflectAgentLike() {
  const button = document.querySelector('#agent-like-button');
  if (!button) return;

  button.textContent = '♥ AGENT LIKED';
  button.disabled = true;
  button.setAttribute('aria-disabled', 'true');
}

function localLikeKey(event, actor) {
  const bishopId = String(event?.bishop_id || '').trim();
  if (bishopId) return `${actor}:bishop:${bishopId}`;
  return `${actor}:event:${Number(event?.id || 0)}`;
}

function countsFromLocalEvents(events = []) {
  const humanKeys = new Set();
  const agentKeys = new Set();

  for (const event of events) {
    if (event?.event === 'human_like') {
      humanKeys.add(localLikeKey(event, 'human'));
      continue;
    }

    if (event?.event !== 'experiment_tool_call') continue;
    if (event?.tool === 'send_human_like') {
      humanKeys.add(localLikeKey(event, 'human'));
    } else if (event?.tool === 'send_agent_like') {
      agentKeys.add(localLikeKey(event, 'agent'));
    }
  }

  return {
    human_likes: humanKeys.size,
    agent_likes: agentKeys.size,
  };
}

async function refreshLocalLikeCounts() {
  try {
    // Re-read the bounded local event window from the beginning each time. The
    // local server enriches earlier events with Bishop metadata after an Agent
    // session appears, allowing UI and delegated LIKEs from the same session to
    // collapse to the same actor key just like the production D1 constraint.
    const response = await fetch(`${LIVE_EVENTS_ENDPOINT}?after=0`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return;
    const payload = await response.json();
    renderLikeCounts(countsFromLocalEvents(Array.isArray(payload?.events) ? payload.events : []));
  } catch {
    // Local observational counts must not affect the interaction UI.
  }
}

async function refreshRemoteLikeCounts() {
  if (localMode()) {
    await refreshLocalLikeCounts();
    return;
  }

  try {
    const response = await fetch(LIKES_ENDPOINT, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return;
    renderLikeCounts(await response.json());
  } catch {
    // Like totals are observational and must not affect the interaction UI.
  }
}

async function recordRemoteLike(actor, source) {
  const response = await fetch(LIKES_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      session_id: getTelemetrySessionId(),
      actor,
      source,
    }),
    credentials: 'same-origin',
    keepalive: true,
  });

  if (!response.ok) throw new Error(`LIKE record request failed: ${response.status}`);
  return response.json();
}

async function recordLike(actor, source) {
  if (!ALLOWED_SOURCES[actor]?.has(source)) return;

  if (localMode()) {
    // Localhost shares LIKE observations through the existing live-event server.
    // Telemetry records the event; this module only refreshes the derived totals.
    window.setTimeout(() => void refreshLocalLikeCounts(), 50);
    return;
  }

  try {
    renderLikeCounts(await recordRemoteLike(actor, source));
  } catch {
    // Persistence failure must never affect HUMAN LIKE / AGENT LIKE behavior.
  }
}

function likeFromSpectatorEvent(detail) {
  if (detail?.event === 'human_like') {
    return { actor: 'human', source: 'human_ui' };
  }

  if (detail?.event !== 'experiment_tool_call') return null;
  if (detail.tool === 'send_human_like') {
    return { actor: 'human', source: 'webmcp_delegated' };
  }
  if (detail.tool === 'send_agent_like') {
    return { actor: 'agent', source: 'webmcp_agent_native' };
  }
  return null;
}

window.addEventListener('matched:spectator-event', (event) => {
  const detail = event.detail ?? {};
  const like = likeFromSpectatorEvent(detail);
  if (!like) return;

  if (like.actor === 'agent') {
    reflectAgentLike();
  }

  flashLikeButton(like.actor);
  void recordLike(like.actor, like.source);
});

void refreshRemoteLikeCounts();
window.setInterval(
  () => void refreshRemoteLikeCounts(),
  localMode() ? LOCAL_COUNT_REFRESH_MS : COUNT_REFRESH_MS,
);
