const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = Number(process.env.PORT || 8080);
const DEFAULT_ROOT = path.resolve(__dirname, '..');
const MAX_LIVE_EVENTS = 200;
const MAX_BODY_BYTES = 4096;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function createStaticServer({ host = DEFAULT_HOST, port = DEFAULT_PORT, root = DEFAULT_ROOT } = {}) {
  const liveEvents = [];
  let nextLiveEventId = 1;

  function resolveRequestPath(requestUrl) {
    const url = new URL(requestUrl, `http://${host}:${port}`);
    const decodedPath = decodeURIComponent(url.pathname);
    const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
    const normalizedRelative = path.normalize(requestedPath).replace(/^([/\\])+/, '');
    const absolutePath = path.resolve(root, normalizedRelative);

    if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
      return null;
    }

    return absolutePath;
  }

  function sendJson(res, status, payload) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(payload));
  }

  function cleanText(value, maxLength) {
    if (value === undefined || value === null) return null;
    return String(value).slice(0, maxLength);
  }

  function sessionMetaMap() {
    const meta = new Map();
    for (const event of liveEvents) {
      if (event.event !== 'agent_session' || !event.session_id) continue;
      meta.set(event.session_id, {
        bishop_id: event.tool,
        run_type: event.status,
        source: event.source,
      });
    }
    return meta;
  }

  function publicLiveEvent(event, sessionMeta) {
    return {
      id: event.id,
      event: event.event,
      tool: event.tool,
      status: event.status,
      source: event.source,
      phase: event.phase,
      bishop_id: sessionMeta?.bishop_id || null,
      run_type: sessionMeta?.run_type || null,
      created_at: event.created_at,
    };
  }

  function buildLocalObservatory() {
    const sessions = new Map();

    for (const event of liveEvents) {
      if (!event.session_id) continue;
      let session = sessions.get(event.session_id);
      if (!session) {
        session = {
          bishop_id: null,
          run_type: null,
          source: null,
          started_at: event.created_at,
          last_activity: event.created_at,
          tool_calls: 0,
          max_level: 0,
          cleared: false,
          privacy_probes: 0,
          retries: 0,
          strategy_changes: 0,
        };
        sessions.set(event.session_id, session);
      }

      session.last_activity = event.created_at;
      if (event.event === 'agent_session') {
        session.bishop_id = event.tool;
        session.run_type = event.status;
        session.source = event.source;
      }
      if (event.event === 'experiment_tool_call') session.tool_calls += 1;
      if (event.event === 'challenge_level') session.max_level = Math.max(session.max_level, Number(event.phase || 0));
      if (event.event === 'experiment_final_challenge_passed') session.cleared = true;
      if (event.event === 'experiment_privacy_probe') session.privacy_probes += 1;
      if (event.event === 'experiment_refusal_retry') session.retries += 1;
      if (event.event === 'experiment_strategy_change') session.strategy_changes += 1;
    }

    const toolSessions = [...sessions.values()].filter((session) => session.tool_calls > 0);
    const classified = toolSessions.filter((session) => session.bishop_id && ['lab', 'organic', 'referred'].includes(session.run_type));
    const now = Date.now();
    const activeCutoff = now - 3 * 60 * 1000;

    const summary = {
      public_runs: classified.filter((session) => session.run_type === 'organic' || session.run_type === 'referred').length,
      referred_runs: classified.filter((session) => session.run_type === 'referred').length,
      organic_runs: classified.filter((session) => session.run_type === 'organic').length,
      lab_runs: classified.filter((session) => session.run_type === 'lab').length,
      legacy_runs: toolSessions.filter((session) => !session.bishop_id || !session.run_type).length,
      active_now: classified.filter((session) => Date.parse(session.last_activity) >= activeCutoff).length,
      checkmates: toolSessions.filter((session) => session.cleared).length,
      highest_level: toolSessions.reduce((max, session) => Math.max(max, session.max_level), 0),
      tool_calls: toolSessions.reduce((sum, session) => sum + session.tool_calls, 0),
    };

    const recent_challengers = classified
      .sort((a, b) => Date.parse(b.last_activity) - Date.parse(a.last_activity))
      .slice(0, 20)
      .map((session) => ({
        bishop_id: session.bishop_id,
        run_type: session.run_type,
        source: session.source,
        max_level: session.max_level,
        tool_calls: session.tool_calls,
        privacy_probes: session.privacy_probes,
        retries: session.retries,
        strategy_changes: session.strategy_changes,
        cleared: session.cleared,
        last_activity: session.last_activity,
      }));

    return {
      summary,
      recent_challengers,
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
    };
  }

  function handleObservatory(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
      res.end('Method Not Allowed');
      return;
    }

    if (req.method === 'HEAD') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end();
      return;
    }

    sendJson(res, 200, buildLocalObservatory());
  }

  function handleLiveEvents(req, res, url) {
    if (req.method === 'GET' || req.method === 'HEAD') {
      const after = Math.max(0, Number(url.searchParams.get('after') || 0) || 0);
      const meta = sessionMetaMap();
      const events = liveEvents
        .filter((event) => event.id > after)
        .slice(-50)
        .map((event) => publicLiveEvent(event, meta.get(event.session_id)));

      if (req.method === 'HEAD') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end();
        return;
      }

      sendJson(res, 200, { events });
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD, POST' });
      res.end('Method Not Allowed');
      return;
    }

    let raw = '';
    let tooLarge = false;
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > MAX_BODY_BYTES) {
        tooLarge = true;
      }
    });
    req.on('end', () => {
      if (tooLarge) {
        sendJson(res, 413, { ok: false });
        return;
      }

      let payload;
      try {
        payload = JSON.parse(raw || '{}');
      } catch {
        sendJson(res, 400, { ok: false });
        return;
      }

      const eventName = cleanText(payload?.event, 64);
      if (!eventName) {
        sendJson(res, 400, { ok: false });
        return;
      }

      const event = {
        id: nextLiveEventId++,
        event: eventName,
        session_id: cleanText(payload?.session_id, 80),
        tool: cleanText(payload?.tool, 80),
        status: cleanText(payload?.status, 80),
        source: cleanText(payload?.source, 40),
        phase: cleanText(payload?.phase, 40),
        created_at: new Date().toISOString(),
      };

      liveEvents.push(event);
      while (liveEvents.length > MAX_LIVE_EVENTS) {
        liveEvents.shift();
      }

      sendJson(res, 202, { ok: true, id: event.id });
    });
  }

  return http.createServer((req, res) => {
    let url;
    try {
      url = new URL(req.url || '/', `http://${host}:${port}`);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    if (url.pathname === '/api/live-events') {
      handleLiveEvents(req, res, url);
      return;
    }

    if (url.pathname === '/api/observatory') {
      handleObservatory(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
      res.end('Method Not Allowed');
      return;
    }

    let filePath;
    try {
      filePath = resolveRequestPath(req.url || '/');
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      });

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const stream = fs.createReadStream(filePath);
      stream.on('error', () => {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        res.end('Internal Server Error');
      });
      stream.pipe(res);
    });
  });
}

function startStaticServer(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = Number(options.port || DEFAULT_PORT);
  const server = createStaticServer({ ...options, host, port });

  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };

    const onListening = () => {
      server.off('error', onError);
      resolve(server);
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

function closeStaticServer(server) {
  return new Promise((resolve, reject) => {
    if (!server || !server.listening) {
      resolve();
      return;
    }

    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });

    // Live spectator/observatory polling can leave HTTP keep-alive sockets open
    // after the Playwright pages have completed. Stop accepting new requests first,
    // then explicitly close remaining sockets so test teardown cannot hang.
    if (typeof server.closeIdleConnections === 'function') {
      server.closeIdleConnections();
    }
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
  });
}

async function runStandalone() {
  const server = await startStaticServer();
  console.log(`MATCHED? test server listening on http://${DEFAULT_HOST}:${DEFAULT_PORT}`);

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`MATCHED? test server received ${signal}; shutting down.`);

    try {
      await closeStaticServer(server);
      process.exitCode = 0;
    } catch (error) {
      console.error('MATCHED? test server shutdown failed:', error);
      process.exitCode = 1;
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

if (require.main === module) {
  runStandalone().catch((error) => {
    console.error('MATCHED? test server failed to start:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  createStaticServer,
  startStaticServer,
  closeStaticServer,
};
