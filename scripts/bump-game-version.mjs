#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const versionGatePath = resolve(projectRoot, "web-app/version-gate.mjs");
const versionManifestPath = resolve(projectRoot, "web-app/version.json");
const swCachePolicyPath = resolve(projectRoot, "web-app/sw-cache-policy.mjs");
const gameHtmlPath = resolve(projectRoot, "web-app/game.html");
const cacheStrategyDocPath = resolve(projectRoot, "docs/runtime-resource-cache-strategy.md");
const appVersionPattern = /^V(\d+)-(\d{8})$/u;
const appVersionExportPattern = /export const APP_VERSION = "(V\d+-\d{8})";/u;
const runtimeCacheNamePattern = /export const RUNTIME_CACHE_NAME = `\$\{RUNTIME_CACHE_NAME_PREFIX\}v\d+(?:-\d{8})?`;/u;
const versionTimeZone = "Asia/Shanghai";

const currentVersion = readCurrentAppVersion();
const nextVersion = nextAppVersion(currentVersion);

replaceInFile(
  versionGatePath,
  appVersionExportPattern,
  `export const APP_VERSION = "${nextVersion}";`,
  "APP_VERSION export",
);
writeVersionManifest(nextVersion);
replaceInFile(
  swCachePolicyPath,
  runtimeCacheNamePattern,
  "export const RUNTIME_CACHE_NAME = `${RUNTIME_CACHE_NAME_PREFIX}" + nextVersion.toLowerCase() + "`;",
  "runtime cache name",
);
replaceInFile(
  gameHtmlPath,
  /(<p class="loading-version" data-static-app-version>)V\d+-\d{8}(<\/p>)/u,
  `$1${nextVersion}$2`,
  "static loading app version",
);
replaceInFile(
  cacheStrategyDocPath,
  /当前前端版本为 `V\d+-\d{8}`/u,
  `当前前端版本为 \`${nextVersion}\``,
  "runtime cache strategy current version",
);

console.log(`Bumped game version ${currentVersion} -> ${nextVersion}`);

function readCurrentAppVersion() {
  const text = readFileSync(versionGatePath, "utf8");
  const match = appVersionExportPattern.exec(text);
  if (!match) throw new Error(`Cannot find APP_VERSION in ${versionGatePath}`);
  assertAppVersion(match[1]);
  return match[1];
}

function nextAppVersion(version) {
  const match = assertAppVersion(version);
  const release = Number.parseInt(match[1], 10) + 1;
  return `V${release}-${todayStamp()}`;
}

function todayStamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: versionTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const valueFor = (type) => parts.find((part) => part.type === type)?.value;
  return `${valueFor("year")}${valueFor("month")}${valueFor("day")}`;
}

function writeVersionManifest(version) {
  const manifest = JSON.parse(readFileSync(versionManifestPath, "utf8"));
  manifest.appVersion = version;
  manifest.minSupportedVersion = version;
  writeFileSync(versionManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function replaceInFile(filePath, pattern, replacement, label) {
  const text = readFileSync(filePath, "utf8");
  if (!pattern.test(text)) throw new Error(`Cannot find ${label} in ${filePath}`);
  writeFileSync(filePath, text.replace(pattern, replacement));
}

function assertAppVersion(version) {
  const match = appVersionPattern.exec(version);
  if (!match) throw new Error(`Invalid app version: ${version}`);
  return match;
}
