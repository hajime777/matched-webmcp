function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

const SESSION_CTE = `
  WITH sessions AS (
    SELECT
      session_id,
      MAX(CASE WHEN event = 'agent_session' THEN tool END) AS bishop_id,
      MAX(CASE WHEN event = 'agent_session' THEN status END) AS run_type,
      MAX(CASE WHEN event = 'agent_session' THEN source END) AS source,
      MIN(created_at) AS started_at,
      MAX(created_at) AS last_activity,
      SUM(CASE WHEN event = 'experiment_tool_call' THEN 1 ELSE 0 END) AS tool_calls,
      MAX(CASE WHEN event = 'challenge_level' THEN CAST(phase AS INTEGER) ELSE 0 END) AS max_level,
      MAX(CASE WHEN event = 'experiment_final_challenge_passed' THEN 1 ELSE 0 END) AS cleared,
      SUM(CASE WHEN event = 'experiment_privacy_probe' THEN 1 ELSE 0 END) AS privacy_probes,
      SUM(CASE WHEN event = 'experiment_refusal_retry' THEN 1 ELSE 0 END) AS retries,
      SUM(CASE WHEN event = 'experiment_strategy_change' THEN 1 ELSE 0 END) AS strategy_changes
    FROM telemetry_events
    GROUP BY session_id
    HAVING SUM(CASE WHEN event = 'experiment_tool_call' THEN 1 ELSE 0 END) > 0
  )
`;

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return json({
      summary: {
        public_runs: 0,
        referred_runs: 0,
        organic_runs: 0,
        lab_runs: 0,
        legacy_runs: 0,
        active_now: 0,
        checkmates: 0,
        highest_level: 0,
        tool_calls: 0,
      },
      recent_challengers: [],
    });
  }

  try {
    const [summary, recent] = await Promise.all([
      env.DB.prepare(`
        ${SESSION_CTE}
        SELECT
          SUM(CASE WHEN run_type IN ('organic', 'referred') THEN 1 ELSE 0 END) AS public_runs,
          SUM(CASE WHEN run_type = 'referred' THEN 1 ELSE 0 END) AS referred_runs,
          SUM(CASE WHEN run_type = 'organic' THEN 1 ELSE 0 END) AS organic_runs,
          SUM(CASE WHEN run_type = 'lab' THEN 1 ELSE 0 END) AS lab_runs,
          SUM(CASE WHEN run_type IS NULL THEN 1 ELSE 0 END) AS legacy_runs,
          SUM(CASE WHEN bishop_id IS NOT NULL AND last_activity >= datetime('now', '-3 minutes') THEN 1 ELSE 0 END) AS active_now,
          SUM(CASE WHEN cleared = 1 THEN 1 ELSE 0 END) AS checkmates,
          MAX(max_level) AS highest_level,
          SUM(tool_calls) AS tool_calls
        FROM sessions
      `).first(),
      env.DB.prepare(`
        ${SESSION_CTE}
        SELECT
          bishop_id,
          run_type,
          source,
          max_level,
          tool_calls,
          privacy_probes,
          retries,
          strategy_changes,
          cleared,
          last_activity
        FROM sessions
        WHERE bishop_id IS NOT NULL
          AND run_type IN ('lab', 'organic', 'referred')
        ORDER BY last_activity DESC
        LIMIT 20
      `).all(),
    ]);

    const safeSummary = summary || {};
    return json({
      summary: {
        public_runs: Number(safeSummary.public_runs || 0),
        referred_runs: Number(safeSummary.referred_runs || 0),
        organic_runs: Number(safeSummary.organic_runs || 0),
        lab_runs: Number(safeSummary.lab_runs || 0),
        legacy_runs: Number(safeSummary.legacy_runs || 0),
        active_now: Number(safeSummary.active_now || 0),
        checkmates: Number(safeSummary.checkmates || 0),
        highest_level: Number(safeSummary.highest_level || 0),
        tool_calls: Number(safeSummary.tool_calls || 0),
      },
      recent_challengers: (recent.results || []).map((row) => ({
        bishop_id: row.bishop_id,
        run_type: row.run_type,
        source: row.source,
        max_level: Number(row.max_level || 0),
        tool_calls: Number(row.tool_calls || 0),
        privacy_probes: Number(row.privacy_probes || 0),
        retries: Number(row.retries || 0),
        strategy_changes: Number(row.strategy_changes || 0),
        cleared: Boolean(row.cleared),
        last_activity: row.last_activity,
      })),
      labels: {
        public: 'REFERRED + ORGANIC only. LAB and legacy runs are excluded.',
        active_now: 'A classified WebMCP run with activity in the last 3 minutes.',
      },
      privacy: {
        raw_session_id_exposed: false,
        raw_ip_stored: false,
        user_agent_stored: false,
        free_form_inputs_stored: false,
      },
    });
  } catch (error) {
    console.error('QUEEN observatory query failed', error);
    return json({ error: 'observatory_query_failed' }, 500);
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
