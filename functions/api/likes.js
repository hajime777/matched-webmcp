const MAX_BODY_BYTES = 2048;
const SESSION_PATTERN = /^[A-Za-z0-9-]{8,80}$/;
const ALLOWED_SOURCES = Object.freeze({
  human: new Set(['human_ui', 'webmcp_delegated']),
  agent: new Set(['webmcp_agent_native']),
});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function sameOrigin(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  return !origin || origin === url.origin;
}

async function counts(db) {
  const row = await db.prepare(`
    SELECT
      COUNT(CASE WHEN actor = 'human' THEN 1 END) AS human_likes,
      COUNT(CASE WHEN actor = 'agent' THEN 1 END) AS agent_likes
    FROM likes
  `).first();

  return {
    human_likes: Number(row?.human_likes || 0),
    agent_likes: Number(row?.agent_likes || 0),
  };
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return json({ error: 'DB binding is not configured' }, 503);

  try {
    return json(await counts(env.DB));
  } catch (error) {
    console.error('MATCHED likes count failed', error);
    return json({ error: 'likes_unavailable' }, 503);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) return json({ error: 'payload_too_large' }, 413);

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  if (!raw || raw.length > MAX_BODY_BYTES) return json({ error: 'invalid_request' }, 400);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const sessionId = String(payload?.session_id || '');
  const actor = String(payload?.actor || '');
  const source = String(payload?.source || '');

  if (!SESSION_PATTERN.test(sessionId)) return json({ error: 'invalid_session' }, 400);
  if (!ALLOWED_SOURCES[actor]?.has(source)) return json({ error: 'invalid_like_semantics' }, 400);
  if (!env.DB) return json({ error: 'DB binding is not configured' }, 503);

  try {
    const result = await env.DB.prepare(`
      INSERT OR IGNORE INTO likes (session_id, actor, source)
      VALUES (?, ?, ?)
    `).bind(sessionId, actor, source).run();

    return json({
      status: Number(result?.meta?.changes || 0) > 0 ? 'liked' : 'already_liked',
      ...(await counts(env.DB)),
    });
  } catch (error) {
    console.error('MATCHED likes insert failed', error);
    return json({ error: 'likes_unavailable' }, 503);
  }
}

export function onRequest() {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: {
      allow: 'GET, POST',
      'cache-control': 'no-store',
    },
  });
}
