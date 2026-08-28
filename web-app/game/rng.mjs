const UINT32_MAX = 4294967296;

export function normalizeSeed(seed) {
  const value = Number(seed);
  if (!Number.isFinite(value)) {
    return 25;
  }
  return (Math.abs(Math.floor(value)) || 25) >>> 0;
}

export function generateSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    return normalizeSeed(buffer[0]);
  }
  return normalizeSeed(Date.now() ^ Math.floor(Math.random() * UINT32_MAX));
}

export function nextRng(state) {
  let x = state >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

export function randomFloat(state) {
  const next = nextRng(state);
  return [next, next / UINT32_MAX];
}

export function randomInt(state, min, max) {
  const [next, value] = randomFloat(state);
  return [next, Math.floor(value * (max - min + 1)) + min];
}

export function shuffleWithState(state, items) {
  let rngState = state;
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const result = randomInt(rngState, 0, index);
    rngState = result[0];
    const swapIndex = result[1];
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return [rngState, copy];
}

export function sampleMany(state, items, count) {
  const [rngState, shuffled] = shuffleWithState(state, items);
  return [rngState, shuffled.slice(0, count)];
}

export function drawWeighted(state, entries) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0) {
    return [state, undefined];
  }

  let rngState = state;
  const next = randomFloat(rngState);
  rngState = next[0];
  let cursor = next[1] * total;

  for (const entry of entries) {
    cursor -= Math.max(0, entry.weight);
    if (cursor <= 0) {
      return [rngState, entry.item];
    }
  }

  return [rngState, entries.at(-1)?.item];
}
