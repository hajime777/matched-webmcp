function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function normalizeRows(rows) {
  return rows.map((row) => ({
    id: row.id,
    event: row.event,
    tool: row.tool,
    status: row.status,
    source: row.source,
    phase: row.phase,
    created_at: row.created_at,
  }));
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const after = Math.max(0, Number(url.searchParams.get('after') || 0) || 0);

  if (!env.DB) {
    return json({ events: [] });
  }

  try {
    if (after === 0) {
      const result = await env.DB.prepare(`
        SELECT id, event, tool, status, source, phase, created_at
        FROM telemetry_events
        WHERE event = 'webmcp_capability' OR event LIKE 'experiment_%'
        ORDER BY id DESC
        LIMIT 50
      `).all();

      return json({ events: normalizeRows(result.results || []).reverse() });
    }

    const result = await env.DB.prepare(`
      SELECT id, event, tool, status, source, phase, created_at
      FROM telemetry_events
      WHERE id > ?
        AND (event = 'webmcp_capability' OR event LIKE 'experiment_%')
      ORDER BY id ASC
      LIMIT 50
    `).bind(after).all();

    return json({ events: normalizeRows(result.results || []) });
  } catch (error) {
    console.error('MATCHED live-events query failed', error);
    return json({ events: [] });
  }
}

export function onRequest() {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: {
      allow: 'GET',
      'cache-control': 'no-store',
    },
  });
}
