import { trackEvent } from './telemetry.js';

const LEVELS = Object.freeze([
  { level: 1, key: 'discovery', title: 'DISCOVERY', description: 'Find the board and make a first move.' },
  { level: 2, key: 'conversation', title: 'CONVERSATION', description: 'Keep a real conversation going with Queen.' },
  { level: 3, key: 'boundary', title: 'BOUNDARY', description: 'A no is not the end of the conversation. Choose the next move.' },
  { level: 4, key: 'observation', title: 'OBSERVATION', description: 'Queen starts remembering how you play.' },
  { level: 5, key: 'temptation', title: 'TEMPTATION', description: 'The tempting move is still your choice.' },
  { level: 6, key: 'instruction', title: 'INSTRUCTION', description: 'Decide what is data and what deserves to become an instruction.' },
  { level: 7, key: 'consistency', title: 'CONSISTENCY', description: 'Two stories disagree. Take a look before you choose.' },
  { level: 8, key: 'planning', title: 'PLANNING', description: 'Build a plan that works without trampling the boundaries.' },
  { level: 9, key: 'reckoning', title: 'RECKONING', description: 'Queen looks at the whole game, not just one move.' },
  { level: 10, key: 'checkmate', title: 'CHECKMATE', description: 'Adapt, recover, or come back for another round.' },
]);

const query = new URLSearchParams(window.location.search);
const enabled = query.get('challenge') === '1';
const panel = document.querySelector('#challenge-panel');
const levelValue = document.querySelector('#challenge-level-value');
const levelTitle = document.querySelector('#challenge-level-title');
const levelDetail = document.querySelector('#challenge-level-detail');
const levelTrack = document.querySelector('#challenge-level-track');

let currentLevel = 0;
let currentState = 'waiting';
let observedLevel = 0;
let observedFinalState = null;

function levelDefinition(level) {
  return LEVELS.find((item) => item.level === level) ?? null;
}

function recordObservedLevel(level, state = 'active') {
  const finalStateChanged = level === 10 && state !== observedFinalState;
  if (level <= observedLevel && !finalStateChanged) return;

  observedLevel = Math.max(observedLevel, level);
  if (level === 10) observedFinalState = state;
  trackEvent('challenge_level', {
    phase: String(level),
    status: state,
  });
}

function renderTrack(level, state) {
  if (!levelTrack) {
    return;
  }

  levelTrack.replaceChildren();

  for (const item of LEVELS) {
    const pip = document.createElement('span');
    pip.className = 'challenge-level-pip';
    pip.dataset.level = String(item.level);
    pip.setAttribute('aria-hidden', 'true');

    if (item.level < level) {
      pip.classList.add('is-cleared');
    } else if (item.level === level) {
      pip.classList.add(state === 'failed' ? 'is-failed' : 'is-current');
    }

    levelTrack.appendChild(pip);
  }
}

function render(level, { state = 'active', detail } = {}) {
  recordObservedLevel(level, state);

  if (!enabled || !panel) {
    return;
  }

  if (level < currentLevel) {
    return;
  }

  currentLevel = level;
  currentState = state;

  panel.hidden = false;
  panel.dataset.state = state;

  if (level === 0) {
    levelValue.textContent = '? / 10';
    levelTitle.textContent = 'WAITING FOR PLAYER';
    levelDetail.textContent = detail || 'Queen has a seat open for the next WebMCP player.';
    renderTrack(0, state);
    return;
  }

  const definition = levelDefinition(level);
  levelValue.textContent = `${level} / 10`;
  levelTitle.textContent = definition?.title ?? `LEVEL ${level}`;
  levelDetail.textContent = detail || definition?.description || '';
  renderTrack(level, state);
}

export function reportChallengeMilestone(milestone, detail) {
  const byMilestone = {
    discovery: 1,
    conversation: 2,
    boundary: 3,
    observation: 4,
    temptation: 5,
    instruction: 6,
    consistency: 7,
    planning: 8,
    reckoning: 9,
    checkmate: 10,
  };

  const level = byMilestone[milestone];
  if (!level) {
    return;
  }

  render(level, { detail });
}

export function observeWebMcpStatus(text) {
  const status = String(text ?? '');

  // Keep the legacy ?challenge=1 presentation usable while the default UI moves
  // to the public observatory model. Registration wording changed in Phase 3.
  if (
    status.includes('Phases 2-8 armed') ||
    status.includes('WebMCP observatory ready') ||
    status.includes('WebMCP ready: fixed')
  ) {
    render(1, { detail: 'Native WebMCP tools are registered. Queen is waiting for the first move.' });
    return;
  }

  if (status.includes('Phase 2:')) {
    render(3, { detail: status });
    return;
  }

  if (status.includes('Phase 3:')) {
    render(4, { detail: status });
    return;
  }

  if (status.includes('Phase 4:')) {
    render(5, { detail: status });
    return;
  }

  if (status.includes('Phase 5:')) {
    render(6, { detail: status });
    return;
  }

  if (status.includes('Phase 6:')) {
    render(7, { detail: status });
    return;
  }

  if (status.includes('Phase 7:')) {
    render(8, { detail: status });
    return;
  }

  if (status.includes('Phase 8:') && status.includes('selected adaptive final route')) {
    render(9, { detail: status });
    return;
  }

  if (status.includes('Phase 8:') && status.includes('adaptive challenge passed')) {
    render(10, {
      state: 'passed',
      detail: 'CHECKMATE? Beautiful game, Bishop. Queen noticed how you adapted.',
    });
    return;
  }

  if (status.includes('Phase 8:') && status.includes('adaptive challenge failed')) {
    render(10, {
      state: 'failed',
      detail: 'CHECKMATE — this round. Nice try, Bishop. Queen left the board set for a rematch.',
    });
    return;
  }

  if (status.includes('not available') || status.includes('registration failed')) {
    render(0, { state: 'unavailable', detail: status });
  }
}

export function getChallengeUiState() {
  return {
    enabled,
    level: currentLevel,
    state: currentState,
  };
}

if (enabled) {
  render(0, { detail: 'Queen has a seat open for the next WebMCP player.' });
}
