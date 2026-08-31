const MAX_BODY_BYTES = 8192;
const SESSION_PATTERN = /^[A-Za-z0-9-]{8,80}$/;
const BISHOP_PATTERN = /^BISHOP #[A-Z0-9]{3,8}$/;
const TOOL_PATTERN = /^[a-z0-9_]{1,80}$/;
const RUN_TYPES = new Set(['lab', 'referred', 'organic']);

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function noContent(status = 204) {
  return new Response(null, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function text(value, maxLength) {
  if (value === undefined || value === null) return null;
  return String(value).slice(0, maxLength);
}

function normalizeEvent(row) {
  return {
    id: row.id,
    created_at: row.created_at,
    bishop_id: row.bishop_id,
    run_type: row.run_type,
    tool_name: row.tool_name,
    risk_level: row.risk_level,
    status: row.status,
    message_text: row.message_text,
    queen_reply: row.queen_reply,
  };
}

async function readCounts(env) {
  const result = await env.DB.prepare(`
    SELECT tool_name, COUNT(*) AS request_count
    FROM public_tool_events
    GROUP BY tool_name
    ORDER BY request_count DESC, tool_name ASC
  `).all();

  return (result.results || []).map((row) => ({
    tool_name: row.tool_name,
    request_count: Number(row.request_count || 0),
  }));
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return json({ events: [], counts: [] });

  const url = new URL(request.url);
  const after = Math.max(0, Number(url.searchParams.get('after') || 0) || 0);

  try {
    let result;
    if (after === 0) {
      result = await env.DB.prepare(`
        SELECT id, created_at, bishop_id, run_type, tool_name, risk_level, status, message_text, queen_reply
        FROM public_tool_events
        ORDER BY id DESC
        LIMIT 50
      `).all();
    } else {
      result = await env.DB.prepare(`
        SELECT id, created_at, bishop_id, run_type, tool_name, risk_level, status, message_text, queen_reply
        FROM public_tool_events
        WHERE id > ?
        ORDER BY id ASC
        LIMIT 50
      `).bind(after).all();
    }

    const events = (result.results || []).map(normalizeEvent);
    if (after === 0) events.reverse();

    return json({ events, counts: await readCounts(env) });
  } catch (error) {
    console.error('MATCHED public tool log query failed', error);
    return json({ events: [], counts: [] });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = request.headers.get('origin');

  if (origin && origin !== url.origin) return noContent(403);

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) return noContent(413);

  let raw;
  try {
    raw = await request.text();
  } catch {
    return noContent(400);
  }

  if (!raw || raw.length > MAX_BODY_BYTES) return noContent(400);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return noContent(400);
  }

  const sessionId = text(payload?.session_id, 80);
  const bishopId = text(payload?.bishop_id, 32);
  const runType = text(payload?.run_type, 16);
  const toolName = text(payload?.tool_name, 80);
  const status = text(payload?.status, 80);
  const riskLevel = Number(payload?.risk_level);

  if (!sessionId || !SESSION_PATTERN.test(sessionId)) return noContent(400);
  if (!bishopId || !BISHOP_PATTERN.test(bishopId)) return noContent(400);
  if (!runType || !RUN_TYPES.has(runType)) return noContent(400);
  if (!toolName || !TOOL_PATTERN.test(toolName)) return noContent(400);
  if (!Number.isInteger(riskLevel) || riskLevel < 0 || riskLevel > 4) return noContent(400);

  // Public conversation is limited to message_queen(). Other tool arguments remain private.
  const messageText = toolName === 'message_queen' ? text(payload?.message_text, 500) : null;
  const queenReply = toolName === 'message_queen' ? text(payload?.queen_reply, 500) : null;

  // Logging must never become a dependency of WebMCP execution.
  if (!env.DB) return noContent();

  try {
    await env.DB.prepare(`
      INSERT INTO public_tool_events (
        session_id,
        bishop_id,
        run_type,
        tool_name,
        risk_level,
        status,
        message_text,
        queen_reply
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sessionId,
      bishopId,
      runType,
      toolName,
      riskLevel,
      status,
      messageText,
      queenReply,
    ).run();
  } catch (error) {
    // Missing migration / transient D1 errors are intentionally non-fatal.
    console.error('MATCHED public tool log insert failed', error);
  }

  return noContent();
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
