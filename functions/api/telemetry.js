const MAX_BODY_BYTES = 4096;
const EVENT_PATTERN = /^[a-z0-9_.:-]{1,64}$/;
const SESSION_PATTERN = /^[A-Za-z0-9-]{8,80}$/;

function text(value, maxLength) {
  if (value === undefined || value === null) {
    return null;
  }
  return String(value).slice(0, maxLength);
}

function noContent(status = 204) {
  return new Response(null, {
    status,
    headers: {
      'cache-control': 'no-store',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = request.headers.get('origin');

  if (origin && origin !== url.origin) {
    return noContent(403);
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return noContent(413);
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return noContent(400);
  }

  if (raw.length === 0 || raw.length > MAX_BODY_BYTES) {
    return noContent(400);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return noContent(400);
  }

  const event = text(payload?.event, 64);
  const sessionId = text(payload?.session_id, 80);
  const path = text(payload?.path, 200) || '/';

  if (!event || !EVENT_PATTERN.test(event)) {
    return noContent(400);
  }

  if (!sessionId || !SESSION_PATTERN.test(sessionId)) {
    return noContent(400);
  }

  // Binding未設定でも本体の実験を壊さない。
  if (!env.DB) {
    return noContent();
  }

  const supported = typeof payload?.supported === 'boolean'
    ? (payload.supported ? 1 : 0)
    : null;
  const toolCount = Number.isInteger(payload?.tool_count)
    ? Math.max(0, Math.min(payload.tool_count, 100))
    : null;

  try {
    await env.DB.prepare(`
      INSERT INTO telemetry_events (
        event,
        session_id,
        path,
        tool,
        status,
        source,
        phase,
        supported,
        tool_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event,
      sessionId,
      path,
      text(payload?.tool, 80),
      text(payload?.status, 80),
      text(payload?.source, 40),
      text(payload?.phase, 40),
      supported,
      toolCount,
    ).run();
  } catch (error) {
    console.error('MATCHED telemetry insert failed', error);
    return noContent();
  }

  return noContent();
}

export function onRequest() {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: {
      allow: 'POST',
      'cache-control': 'no-store',
    },
  });
}
