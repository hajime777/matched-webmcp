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
    bishop_id: row.bishop_id,
    run_type: row.run_type,
  }));
}

const BASE_QUERY = `
  WITH session_meta AS (
    SELECT
      session_id,
      MAX(CASE WHEN event = 'agent_session' THEN tool END) AS bishop_id,
      MAX(CASE WHEN event = 'agent_session' THEN status END) AS run_type
    FROM telemetry_events
    GROUP BY session_id
  )
  SELECT
    e.id,
    e.event,
    e.tool,
    e.status,
    e.source,
    e.phase,
    e.created_at,
    m.bishop_id,
    m.run_type
  FROM telemetry_events e
  LEFT JOIN session_meta m ON m.session_id = e.session_id
`;

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const after = Math.max(0, Number(url.searchParams.get('after') || 0) || 0);

  if (!env.DB) {
    return json({ events: [] });
  }

  const eventFilter = `
    e.event IN ('webmcp_capability', 'agent_session', 'challenge_level')
    OR e.event LIKE 'experiment_%'
  `;

  try {
    if (after === 0) {
      const result = await env.DB.prepare(`
        ${BASE_QUERY}
        WHERE ${eventFilter}
        ORDER BY e.id DESC
        LIMIT 50
      `).all();

      return json({ events: normalizeRows(result.results || []).reverse() });
    }

    const result = await env.DB.prepare(`
      ${BASE_QUERY}
      WHERE e.id > ?
        AND (${eventFilter})
      ORDER BY e.id ASC
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
