import { getTelemetrySessionId } from './telemetry.js';

const LIKES_ENDPOINT = '/api/likes';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const FLASH_CLASS = 'like-request-flash';
const FLASH_DURATION_MS = 780;
const COUNT_REFRESH_MS = 15000;
const flashTimers = new WeakMap();
const localLikedActors = new Set();
const localLikeCounts = { human_likes: 0, agent_likes: 0 };
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

async function refreshRemoteLikeCounts() {
  if (localMode()) {
    renderLikeCounts(localLikeCounts);
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
    if (!localLikedActors.has(actor)) {
      localLikedActors.add(actor);
      if (actor === 'human') localLikeCounts.human_likes += 1;
      if (actor === 'agent') localLikeCounts.agent_likes += 1;
      renderLikeCounts(localLikeCounts);
    }
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
window.setInterval(() => void refreshRemoteLikeCounts(), COUNT_REFRESH_MS);
