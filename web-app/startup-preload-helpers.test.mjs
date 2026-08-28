import assert from "node:assert/strict";
import {
  boundedStartupLoadingProgress,
  hasStartupRepairSources,
  nextPreloadConcurrencyHint,
  sampleStableSources,
  shouldReleaseStartupGateAfterRepair,
  startupCacheSampleSources,
  startupRepairSources,
  tunedPreloadConcurrency,
} from "./startup-preload-helpers.mjs";

assert.deepEqual(
  sampleStableSources(["a", "b", "c", "d", "e"], 3),
  ["a", "c", "e"],
);

assert.deepEqual(
  sampleStableSources(["a", "a", "", "b"], 4),
  ["a", "b"],
);

assert.deepEqual(
  startupCacheSampleSources({
    images: ["i1", "i2", "i3", "i4"],
    media: ["m1", "m2", "m3"],
  }, { imageCount: 2, mediaCount: 1 }),
  { images: ["i1", "i4"], media: ["m1"] },
);

assert.deepEqual(
  startupRepairSources({
    imageResult: { ok: false, remainingSources: ["i1", "i1", ""] },
    mediaResult: { ok: false, remainingSources: ["m1"] },
  }),
  { images: ["i1"], media: ["m1"] },
);

assert.deepEqual(
  startupRepairSources({
    imageResult: { ok: true, remainingSources: ["i1"] },
    mediaResult: { ok: true, remainingSources: ["m1"] },
  }),
  { images: [], media: [] },
);

assert.equal(hasStartupRepairSources({ images: [], media: [] }), false);
assert.equal(hasStartupRepairSources({ images: ["i1"], media: [] }), true);

assert.equal(shouldReleaseStartupGateAfterRepair({
  repairSources: { images: ["i1"], media: [] },
  now: 119999,
  deadlineAt: 120000,
}), false);

assert.equal(shouldReleaseStartupGateAfterRepair({
  repairSources: { images: ["i1"], media: [] },
  now: 120000,
  deadlineAt: 120000,
}), true);

assert.equal(shouldReleaseStartupGateAfterRepair({
  repairSources: { images: [], media: ["m1"] },
  now: 120000,
  deadlineAt: 120000,
}), true);

assert.equal(shouldReleaseStartupGateAfterRepair({
  repairSources: { images: [], media: [] },
  now: 120000,
  deadlineAt: 120000,
}), false);

assert.equal(boundedStartupLoadingProgress(62, 0, { maxAhead: 15 }), 15);
assert.equal(boundedStartupLoadingProgress(70, 55, { maxAhead: 15 }), 70);
assert.equal(boundedStartupLoadingProgress(72, 55, { maxAhead: 15 }), 70);
assert.equal(boundedStartupLoadingProgress(100, 100, { maxAhead: 15, cap: 99 }), 99);

assert.equal(tunedPreloadConcurrency(12, { cap: 8 }, { minConcurrency: 5 }), 8);
assert.equal(tunedPreloadConcurrency(8, { cap: 12 }, { minConcurrency: 5 }), 8);
assert.equal(tunedPreloadConcurrency(3, { cap: 1 }, { minConcurrency: 2 }), 2);

assert.deepEqual(
  nextPreloadConcurrencyHint({
    total: 10,
    successful: 8,
    timedOut: false,
  }, {
    baseConcurrency: 12,
    usedConcurrency: 10,
    minConcurrency: 5,
    decreaseStep: 2,
    now: 1000,
  }),
  { cap: 8, updatedAt: 1000 },
);

assert.deepEqual(
  nextPreloadConcurrencyHint({
    total: 10,
    successful: 10,
    timedOut: false,
  }, {
    baseConcurrency: 12,
    usedConcurrency: 8,
    currentHint: { cap: 8 },
    minConcurrency: 5,
    increaseStep: 1,
    now: 1001,
  }),
  { cap: 9, updatedAt: 1001 },
);

assert.deepEqual(
  nextPreloadConcurrencyHint({
    total: 10,
    successful: 10,
    timedOut: false,
  }, {
    baseConcurrency: 6,
    usedConcurrency: 6,
    currentHint: { cap: 6 },
    minConcurrency: 2,
    now: 1002,
  }),
  { cap: 6, updatedAt: 1002 },
);
