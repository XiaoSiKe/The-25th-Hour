export function sampleStableSources(sources, count) {
  const uniqueSources = [...new Set((Array.isArray(sources) ? sources : []).filter(Boolean).map(String))];
  const sampleCount = Math.max(0, Math.floor(Number(count) || 0));
  if (sampleCount === 0) return [];
  if (uniqueSources.length <= sampleCount) return uniqueSources;
  if (sampleCount === 1) return [uniqueSources[0]];

  const indexes = new Set();
  for (let index = 0; index < sampleCount; index += 1) {
    indexes.add(Math.round((index * (uniqueSources.length - 1)) / (sampleCount - 1)));
  }
  return uniqueSources.filter((_source, index) => indexes.has(index));
}

export function startupCacheSampleSources({ images = [], media = [] } = {}, {
  imageCount = 6,
  mediaCount = 2,
} = {}) {
  return {
    images: sampleStableSources(images, imageCount),
    media: sampleStableSources(media, mediaCount),
  };
}

export function startupRepairSources({ imageResult = null, mediaResult = null } = {}) {
  return {
    images: imageResult?.ok ? [] : uniqueSources(imageResult?.remainingSources),
    media: mediaResult?.ok ? [] : uniqueSources(mediaResult?.remainingSources),
  };
}

export function hasStartupRepairSources(repairSources = {}) {
  return uniqueSources(repairSources.images).length > 0
    || uniqueSources(repairSources.media).length > 0;
}

export function shouldReleaseStartupGateAfterRepair({ repairSources = {}, now = 0, deadlineAt = Infinity } = {}) {
  const deadline = Number(deadlineAt);
  const images = uniqueSources(repairSources.images);
  const media = uniqueSources(repairSources.media);
  return (images.length > 0 || media.length > 0)
    && Number.isFinite(deadline)
    && Number(now) >= deadline;
}

export function boundedStartupLoadingProgress(desiredProgress, actualProgress, {
  maxAhead = 15,
  cap = 99,
} = {}) {
  const desired = clampPercent(desiredProgress);
  const actual = clampPercent(actualProgress);
  const ahead = Math.max(0, Number(maxAhead) || 0);
  const hardCap = Math.min(clampPercent(cap), actual + ahead);
  return Math.min(desired, hardCap);
}

export function tunedPreloadConcurrency(baseConcurrency, hint, { minConcurrency = 1 } = {}) {
  const minimum = positiveInteger(minConcurrency, 1);
  const base = Math.max(minimum, positiveInteger(baseConcurrency, minimum));
  const cap = positiveInteger(hint?.cap, base);
  return Math.max(minimum, Math.min(base, cap));
}

export function nextPreloadConcurrencyHint(result, {
  baseConcurrency,
  usedConcurrency,
  currentHint = null,
  minConcurrency = 1,
  decreaseStep = 1,
  increaseStep = 1,
  now = Date.now(),
} = {}) {
  const minimum = positiveInteger(minConcurrency, 1);
  const base = Math.max(minimum, positiveInteger(baseConcurrency, minimum));
  const used = Math.max(minimum, Math.min(base, positiveInteger(usedConcurrency, base)));
  const currentCap = positiveInteger(currentHint?.cap, base);
  const total = Math.max(0, Number(result?.total) || 0);
  const successful = Math.max(0, Number(result?.successful) || 0);
  const failed = Boolean(result?.timedOut) || (total > 0 && successful < total);
  const downStep = positiveInteger(decreaseStep, 1);
  const upStep = positiveInteger(increaseStep, 1);
  const cap = failed
    ? Math.max(minimum, used - downStep)
    : Math.min(base, currentCap + upStep);

  return {
    cap,
    updatedAt: Number(now) || Date.now(),
  };
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function positiveInteger(value, fallback) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function uniqueSources(sources) {
  return [...new Set((Array.isArray(sources) ? sources : []).filter(Boolean).map(String))];
}
