import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  APP_VERSION,
  compareAppVersions,
  newestVersionManifest,
  parseAppVersion,
  versionGateStatus,
} from "./version-gate.mjs";
import { STARTUP_FONT_SUBSET_TEXT } from "./ui/resource-preload.mjs";

const versionManifest = JSON.parse(readFileSync(new URL("./version.json", import.meta.url), "utf8"));
const currentVersion = parseAppVersion(APP_VERSION);
assert.ok(currentVersion, "current game version uses Vn-YYYYMMDD format");
assert.equal(versionManifest.appVersion, APP_VERSION, "version manifest appVersion matches APP_VERSION");
assert.equal(versionManifest.minSupportedVersion, APP_VERSION, "version manifest minSupportedVersion matches APP_VERSION");
assert.equal(
  [...APP_VERSION].every((character) => STARTUP_FONT_SUBSET_TEXT.includes(character)),
  true,
  "startup font subset includes every current app version character",
);

const previousVersion = `V${Math.max(0, currentVersion.release - 1)}-${currentVersion.date}`;
const nextVersion = `V${currentVersion.release + 1}-${currentVersion.date}`;

assert.deepEqual(
  parseAppVersion(APP_VERSION),
  currentVersion,
  "version parser accepts the required Vn-YYYYMMDD format",
);

assert.equal(parseAppVersion("v2-20260701"), null, "version parser rejects lowercase prefixes");
assert.equal(parseAppVersion("V2-2026-07-01"), null, "version parser rejects extra separators");
assert.equal(compareAppVersions(nextVersion, APP_VERSION), 1, "a higher release is newer on the same date");

assert.deepEqual(
  versionGateStatus({ appVersion: APP_VERSION, minSupportedVersion: APP_VERSION }, APP_VERSION),
  {
    ok: true,
    requiresUpdate: false,
    latestVersion: APP_VERSION,
    minSupportedVersion: APP_VERSION,
  },
  "current bundle can pass the startup gate",
);

assert.equal(
  versionGateStatus({ appVersion: APP_VERSION, minSupportedVersion: APP_VERSION }, previousVersion).requiresUpdate,
  true,
  "old bundles are blocked before gameplay preload",
);

assert.equal(
  versionGateStatus({ appVersion: nextVersion, minSupportedVersion: APP_VERSION }, APP_VERSION).requiresUpdate,
  true,
  "a newer latest version triggers the update gate even when the current bundle is still supported",
);

assert.equal(
  versionGateStatus({ appVersion: "bad", minSupportedVersion: APP_VERSION }, APP_VERSION).requiresUpdate,
  false,
  "malformed remote manifests fail open instead of trapping players",
);

assert.deepEqual(
  newestVersionManifest([
    { appVersion: previousVersion, minSupportedVersion: previousVersion },
    { appVersion: APP_VERSION, minSupportedVersion: APP_VERSION },
  ]),
  { appVersion: APP_VERSION, minSupportedVersion: APP_VERSION },
  "canonical manifests can supersede a stale same-origin manifest",
);

assert.deepEqual(
  newestVersionManifest([
    { appVersion: APP_VERSION, minSupportedVersion: APP_VERSION },
    { appVersion: "bad", minSupportedVersion: "bad" },
  ]),
  { appVersion: APP_VERSION, minSupportedVersion: APP_VERSION },
  "malformed canonical manifests do not override a valid same-origin manifest",
);
