export function normalizeSeed(seed: number): number {
  const normalized = seed >>> 0;
  return normalized === 0 ? 0x9e3779b9 : normalized;
}

export function nextRng(state: number): [number, number] {
  let x = state >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  const next = x >>> 0;
  return [next, next / 0x100000000];
}

export function randomInt(state: number, minInclusive: number, maxInclusive: number): [number, number] {
  const [next, value] = nextRng(state);
  const span = maxInclusive - minInclusive + 1;
  return [next, minInclusive + Math.floor(value * span)];
}
