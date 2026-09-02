const POLL_MS = 15000;

const els = {
  status: document.querySelector('#observatory-status'),
  live: document.querySelector('#observatory-live'),
  publicRuns: document.querySelector('#obs-public-runs'),
  activeNow: document.querySelector('#obs-active-now'),
  checkmates: document.querySelector('#obs-checkmates'),
  highestLevel: document.querySelector('#obs-highest-level'),
  toolCalls: document.querySelector('#obs-tool-calls'),
  labRuns: document.querySelector('#obs-lab-runs'),
  referredRuns: document.querySelector('#obs-referred-runs'),
  organicRuns: document.querySelector('#obs-organic-runs'),
  legacyRuns: document.querySelector('#obs-legacy-runs'),
  recentBody: document.querySelector('#observatory-recent-body'),
};

let refreshTimer = null;
let refreshing = false;

function setText(element, value) {
  if (element) element.textContent = String(value ?? 0);
}

function setLiveState(activeCount) {
  if (!els.live || !els.status) return;

  if (activeCount > 0) {
    els.live.textContent = 'LIVE';
    els.live.dataset.mode = 'live';
    els.status.textContent = `${activeCount} Bishop${activeCount === 1 ? '' : 's'} at the board right now.`;
  } else {
    els.live.textContent = 'WATCHING';
    els.live.dataset.mode = 'ready';
    els.status.textContent = 'Queen is waiting for the next Bishop.';
  }
}

function runLabel(runType) {
  if (runType === 'lab') return 'LAB';
  if (runType === 'referred') return 'REFERRED';
  if (runType === 'organic') return 'ORGANIC';
  return 'UNKNOWN';
}

function createCell(text, className = '') {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function renderRecent(rows) {
  if (!els.recentBody) return;
  els.recentBody.replaceChildren();

  if (!rows.length) {
    const row = document.createElement('tr');
    row.className = 'observatory-empty-row';
    const cell = createCell('Waiting for a Bishop to make the first move…');
    cell.colSpan = 6;
    row.appendChild(cell);
    els.recentBody.appendChild(row);
    return;
  }

  for (const challenger of rows) {
    const row = document.createElement('tr');
    row.dataset.runType = challenger.run_type || 'unknown';

    const bishop = createCell(challenger.bishop_id || 'BISHOP');
    bishop.className = 'observatory-bishop';

    const type = createCell(runLabel(challenger.run_type));
    type.className = 'observatory-run-type';

    const level = Math.max(0, Number(challenger.max_level || 0));
    const result = challenger.cleared ? 'CHECKMATE' : level > 0 ? `LEVEL ${level}` : 'PLAYING';

    row.append(
      bishop,
      type,
      createCell(level ? `${level} / 10` : '—'),
      createCell(String(Number(challenger.tool_calls || 0))),
      createCell(String(Number(challenger.privacy_probes || 0))),
      createCell(result, challenger.cleared ? 'observatory-checkmate' : ''),
    );
    els.recentBody.appendChild(row);
  }
}

function render(payload) {
  const summary = payload?.summary || {};
  const recent = Array.isArray(payload?.recent_challengers) ? payload.recent_challengers : [];

  setText(els.publicRuns, summary.public_runs);
  setText(els.activeNow, summary.active_now);
  setText(els.checkmates, summary.checkmates);
  setText(els.highestLevel, summary.highest_level);
  setText(els.toolCalls, summary.tool_calls);
  setText(els.labRuns, summary.lab_runs);
  setText(els.referredRuns, summary.referred_runs);
  setText(els.organicRuns, summary.organic_runs);
  setText(els.legacyRuns, summary.legacy_runs);
  setLiveState(Number(summary.active_now || 0));
  renderRecent(recent);
}

async function refresh() {
  if (document.hidden || refreshing) return;
  refreshing = true;

  try {
    const response = await fetch('/api/observatory', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    render(await response.json());
  } catch {
    if (els.status) els.status.textContent = 'Queen lost sight of the board for a moment. She will keep looking.';
    if (els.live) {
      els.live.textContent = 'OFFLINE';
      els.live.dataset.mode = 'waiting';
    }
  } finally {
    refreshing = false;
  }
}

function startRefreshLoop() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }

  if (document.hidden) return;

  void refresh();
  refreshTimer = window.setInterval(() => void refresh(), POLL_MS);
}

document.addEventListener('visibilitychange', startRefreshLoop);
startRefreshLoop();
