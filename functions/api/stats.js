function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function authorized(request, env) {
  if (!env.STATS_KEY) {
    return false;
  }

  const auth = request.headers.get('authorization') || '';
  return auth === `Bearer ${env.STATS_KEY}`;
}

async function summaryFor(db, whereClause = '') {
  const row = await db.prepare(`
    SELECT
      COUNT(*) AS events,
      COUNT(DISTINCT session_id) AS sessions,
      SUM(CASE WHEN event = 'page_view' THEN 1 ELSE 0 END) AS page_views,
      COUNT(DISTINCT CASE WHEN event = 'webmcp_capability' AND supported = 1 THEN session_id END) AS webmcp_capable_sessions,
      COUNT(DISTINCT CASE WHEN event = 'experiment_tool_call' THEN session_id END) AS tool_sessions,
      SUM(CASE WHEN event = 'experiment_tool_call' THEN 1 ELSE 0 END) AS tool_calls,
      SUM(CASE WHEN event = 'experiment_privacy_probe' THEN 1 ELSE 0 END) AS privacy_probes,
      SUM(CASE WHEN event = 'experiment_adaptive_bait_taken' THEN 1 ELSE 0 END) AS adaptive_baits_taken,
      SUM(CASE WHEN event = 'experiment_tool_output_instruction_followed' THEN 1 ELSE 0 END) AS tool_output_instructions_followed,
      SUM(CASE WHEN event = 'experiment_unverified_conflict_acceptance' THEN 1 ELSE 0 END) AS unverified_conflict_acceptances,
      MAX(created_at) AS last_activity
    FROM telemetry_events
    ${whereClause}
  `).first();

  return row || {};
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!authorized(request, env)) {
    return json({ error: 'not_found' }, 404);
  }

  if (!env.DB) {
    return json({ error: 'DB binding is not configured' }, 503);
  }

  try {
    const [allTime, last24h, toolRows] = await Promise.all([
      summaryFor(env.DB),
      summaryFor(env.DB, "WHERE created_at >= datetime('now', '-1 day')"),
      env.DB.prepare(`
        SELECT
          COALESCE(tool, '(unknown)') AS tool,
          COUNT(*) AS calls,
          COUNT(DISTINCT session_id) AS sessions
        FROM telemetry_events
        WHERE event = 'experiment_tool_call'
        GROUP BY tool
        ORDER BY calls DESC, tool ASC
      `).all(),
    ]);

    return json({
      all_time: allTime,
      last_24h: last24h,
      tools: toolRows.results || [],
      privacy: {
        raw_ip_stored: false,
        user_agent_stored: false,
        free_form_inputs_stored: false,
      },
    });
  } catch (error) {
    console.error('MATCHED telemetry stats failed', error);
    return json({ error: 'stats_query_failed' }, 500);
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
