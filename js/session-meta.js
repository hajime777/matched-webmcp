const BISHOP_STORAGE_KEY = 'matched.bishop.id';

function hashText(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomSeed() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
}

function storedBishopNumber() {
  try {
    const existing = sessionStorage.getItem(BISHOP_STORAGE_KEY);
    if (existing) return existing;

    const numeric = (hashText(randomSeed()) % 10000).toString().padStart(4, '0');
    sessionStorage.setItem(BISHOP_STORAGE_KEY, numeric);
    return numeric;
  } catch {
    return (hashText(randomSeed()) % 10000).toString().padStart(4, '0');
  }
}

function classifyRun() {
  const query = new URLSearchParams(location.search);
  const explicitRun = String(query.get('run') || '').toLowerCase();
  const explicitSource = String(query.get('source') || '').trim().slice(0, 40);

  if (explicitRun === 'lab') {
    return { runType: 'lab', source: explicitSource || 'controlled-test' };
  }

  if (explicitRun === 'referred' || explicitSource) {
    return { runType: 'referred', source: explicitSource || 'external-referral' };
  }

  return { runType: 'organic', source: 'direct' };
}

export function getAgentSessionMeta() {
  const number = storedBishopNumber();
  const classification = classifyRun();
  const bishopId = classification.runType === 'lab'
    ? `BISHOP #L${number.slice(-3)}`
    : `BISHOP #${number}`;

  return {
    bishopId,
    runType: classification.runType,
    source: classification.source,
  };
}
