import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("./app.mjs", import.meta.url), "utf8");

assert.ok(
  appSource.includes("const startupReentryFastPath = startupPreloadCached")
    && appSource.includes("|| hasReleasedStartupGate()")
    && appSource.includes("|| hasLocalSave()")
    && appSource.includes("|| hasStartupRepairSources(previousFailedResources)"),
  "startup gate uses cache, release, save, and previous-failure evidence for re-entry",
);

assert.ok(
  appSource.includes("const STARTUP_GATE_TARGET_WAIT_MS = 12000;")
    && appSource.includes("const startupGateWaitMs = startupReentryFastPath\n    ? STARTUP_GATE_CACHED_MAX_WAIT_MS\n    : Math.min(STARTUP_GATE_TARGET_WAIT_MS, STARTUP_GATE_MAX_WAIT_MS);"),
  "startup gate uses a 12-second target budget while retaining a 30-second hard ceiling",
);

assert.ok(
  appSource.includes("adaptivePreloadConcurrency({ high: 4, medium: 3, low: 2 })")
    && appSource.includes("high: STARTUP_AUDIO_PRELOAD_CONCURRENCY,")
    && appSource.includes("const STARTUP_AUDIO_PRELOAD_CONCURRENCY = 2;"),
  "startup gate limits cold-start image and audio concurrency",
);

assert.ok(
  /const runtimeCacheReady = startupReentryFastPath && !startupGateReleasedWithFailures[\s\S]*?await flushRuntimeCacheWrites/u.test(appSource),
  "re-entry startup gate preserves the completion marker without waiting for runtime cache flush",
);

assert.ok(
  appSource.includes("const canMarkStartupPreloadComplete = runtimeCacheReady && (startupPreloadCached || !startupReentryFastPath);"),
  "re-entry startup gate does not promote a lightweight release into a full cache-complete marker",
);

assert.ok(
  appSource.includes("const startupMediaSources = startupReentryFastPath\n    ? []"),
  "re-entry startup gate does not re-check every startup BGM as a hard gate",
);

assert.ok(
  appSource.includes("markStartupGateReleased();"),
  "startup gate records a lightweight release marker after letting the player in",
);

assert.ok(
  appSource.includes("if (!startupReentryFastPath) {\n      clearStartupFailedResources();\n    }"),
  "re-entry startup gate leaves previous failed resources for background repair",
);
