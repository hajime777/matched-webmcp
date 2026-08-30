import { getTelemetrySessionId } from './telemetry.js';

const LIKES_ENDPOINT = '/api/likes';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const FLASH_CLASS = 'like-request-flash';
const FLASH_DURATION_MS = 780;
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
}

async function recordLike(actor, source) {
  if (!ALLOWED_SOURCES[actor]?.has(source)) return;

  // Local development has no D1-backed LIKE store. Public deployments can
  // persist the actor-scoped LIKE through /api/likes once the DB is ready.
  if (localMode()) return;

  try {
    await recordRemoteLike(actor, source);
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
