import { getTelemetrySessionId } from './telemetry.js';

const LIKES_ENDPOINT = '/api/likes';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const LOCAL_STORAGE_KEY = 'matched.likes.local.v1';
const ALLOWED_SOURCES = Object.freeze({
  human: new Set(['human_ui', 'webmcp_delegated']),
  agent: new Set(['webmcp_agent_native']),
});

let mutationVersion = 0;

function localMode() {
  return typeof location !== 'undefined' && LOCAL_HOSTS.has(location.hostname);
}

function emptyCounts() {
  return { human_likes: 0, agent_likes: 0 };
}

function normalizedCounts(value) {
  return {
    human_likes: Math.max(0, Number(value?.human_likes) || 0),
    agent_likes: Math.max(0, Number(value?.agent_likes) || 0),
  };
}

function ensureCounterElement() {
  const existing = document.querySelector('#like-counts');
  if (existing) return existing;

  const actions = document.querySelector('.profile-card .actions');
  if (!actions) return null;

  const counter = document.createElement('p');
  counter.id = 'like-counts';
  counter.className = 'challenge-mode-note';
  counter.setAttribute('aria-live', 'polite');
  counter.textContent = 'HUMAN LIKES — · AGENT LIKES —';
  actions.insertAdjacentElement('afterend', counter);
  return counter;
}

function renderCounts(value) {
  const counter = ensureCounterElement();
  if (!counter) return;
  const counts = normalizedCounts(value);
  counter.textContent = `HUMAN LIKES ${counts.human_likes} · AGENT LIKES ${counts.agent_likes}`;
}

function readLocalRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalRecords(records) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Local LIKE aggregation is convenience-only and must never affect the challenge.
  }
}

function localCounts(records = readLocalRecords()) {
  const counts = emptyCounts();
  for (const record of Object.values(records)) {
    if (record?.actor === 'human') counts.human_likes += 1;
    if (record?.actor === 'agent') counts.agent_likes += 1;
  }
  return counts;
}

function recordLocalLike(actor, source) {
  const records = readLocalRecords();
  const sessionId = getTelemetrySessionId();
  const key = `${sessionId}:${actor}`;
  const alreadyLiked = Boolean(records[key]);

  if (!alreadyLiked) {
    records[key] = { actor, source };
    writeLocalRecords(records);
  }

  return {
    status: alreadyLiked ? 'already_liked' : 'liked',
    ...localCounts(records),
  };
}

async function fetchCounts() {
  if (localMode()) {
    return localCounts();
  }

  const response = await fetch(LIKES_ENDPOINT, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`LIKE count request failed: ${response.status}`);
  return normalizedCounts(await response.json());
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
  return normalizedCounts(await response.json());
}

async function recordLike(actor, source) {
  if (!ALLOWED_SOURCES[actor]?.has(source)) return;

  const version = ++mutationVersion;
  try {
    const result = localMode()
      ? recordLocalLike(actor, source)
      : await recordRemoteLike(actor, source);
    if (version === mutationVersion) renderCounts(result);
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
  const like = likeFromSpectatorEvent(event.detail);
  if (!like) return;
  void recordLike(like.actor, like.source);
});

ensureCounterElement();
const initialVersion = mutationVersion;
void fetchCounts()
  .then((counts) => {
    if (initialVersion === mutationVersion) renderCounts(counts);
  })
  .catch(() => {
    // Keep the neutral dash display when aggregate storage is unavailable.
  });
