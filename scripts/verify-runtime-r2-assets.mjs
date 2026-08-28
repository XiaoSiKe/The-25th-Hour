import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { musicLibraryTracks } from "../web-app/game/music.mjs";
import { R2_ASSET_BASE_URL } from "../web-app/ui/asset-url.mjs";
import {
  criticalStartupImageSources,
  gameplayBackgroundImageSources,
  opportunisticStartupImageSources,
  portfolioBoardImageSources,
  postStartupGameplayImageSources,
  startupLoadingShellImageSources,
  supportDialogImageSources,
} from "../web-app/ui/resource-preload.mjs";
import { uiIconAtlasImageSources } from "../web-app/ui/ui-icon-atlas.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const webRoot = resolve(projectRoot, "web-app");
const bucket = process.env.R2_BUCKET ?? "25thgame-assets-apac";
const prefix = process.env.R2_PREFIX ?? "assets/v1";
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? "a9a7dd61367f3f96dcff05da18ef1746";
const remote = process.argv.includes("--remote");
const pruneReportPath = resolve(projectRoot, ".tmp/runtime-r2-prune-report.json");

const failures = [];
const runtimeSources = new Map();

collectDeclaredRuntimeSources();
collectRuntimeSourceFileReferences();

const runtimeAssetPaths = [...runtimeSources.keys()].sort();
const desiredR2Keys = localOptimizedR2Keys();

verifyRuntimeSourcesExistLocally(runtimeAssetPaths);
verifyNoLegacyRuntimeReferences();

let remoteSummary = null;
if (remote) {
  remoteSummary = await verifyRemoteR2(desiredR2Keys, runtimeAssetPaths);
}

if (failures.length > 0) {
  console.error("Runtime R2 asset verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Verified ${runtimeAssetPaths.length} runtime optimized asset references.`);
console.log(`Verified ${desiredR2Keys.size} local optimized files as the R2 desired set.`);
if (remoteSummary) {
  console.log(`Verified R2 ${bucket}/${prefix}: ${remoteSummary.remoteCount} objects, ${formatMiB(remoteSummary.remoteBytes)} MiB.`);
}

function collectDeclaredRuntimeSources() {
  const imageGroups = [
    ["startup shell", startupLoadingShellImageSources()],
    ["startup desktop", criticalStartupImageSources({ isMobileStartSurface: false })],
    ["startup mobile", criticalStartupImageSources({ isMobileStartSurface: true })],
    ["opportunistic startup desktop", opportunisticStartupImageSources({ isMobileStartSurface: false })],
    ["gameplay desktop", gameplayBackgroundImageSources({ isMobileStartSurface: false })],
    ["gameplay mobile", gameplayBackgroundImageSources({ isMobileStartSurface: true })],
    ["post startup desktop", postStartupGameplayImageSources({ isMobileStartSurface: false })],
    ["post startup mobile", postStartupGameplayImageSources({ isMobileStartSurface: true })],
    ["support dialog", supportDialogImageSources()],
    ["portfolio boards", portfolioBoardImageSources()],
    ["ui atlas", uiIconAtlasImageSources()],
  ];

  for (const [reason, sources] of imageGroups) {
    for (const source of sources) addRuntimeSource(source, reason);
  }

  for (const track of musicLibraryTracks()) {
    addRuntimeSource(track.src, `music:${track.id}`);
    addRuntimeSource(track.cover, `music cover:${track.id}`);
    addRuntimeSource(track.lyricsSrc, `lyrics:${track.id}`);
  }
}

function collectRuntimeSourceFileReferences() {
  for (const filePath of runtimeSourceFiles()) {
    const text = readFileSync(filePath, "utf8");
    for (const source of extractAssetReferences(text)) {
      addRuntimeSource(source, relative(projectRoot, filePath));
    }
  }
}

function addRuntimeSource(source, reason) {
  const normalized = normalizeRuntimeAssetPath(source);
  if (!normalized) return;
  const reasons = runtimeSources.get(normalized) ?? new Set();
  reasons.add(reason);
  runtimeSources.set(normalized, reasons);
}

function extractAssetReferences(text) {
  const sources = new Set();
  const quotedPatterns = [
    /["'`](https:\/\/assets-apac\.25thgame\.vip\/assets\/v1\/optimized\/[^"'`]+)["'`]/gu,
    /["'`](\/optimized\/[^"'`]+)["'`]/gu,
  ];
  for (const pattern of quotedPatterns) {
    for (const match of text.matchAll(pattern)) {
      sources.add(trimAssetReference(match[1]));
    }
  }

  const barePatterns = [
    /(?:^|[("'=\s])((?:https:\/\/assets-apac\.25thgame\.vip\/assets\/v1)?\/optimized\/[^"'`\s<>\\)]+)/gu,
  ];
  for (const pattern of barePatterns) {
    for (const match of text.matchAll(pattern)) {
      sources.add(trimAssetReference(match[1]));
    }
  }
  return sources;
}

function trimAssetReference(source) {
  return source.replace(/[.,;:\]}]+$/u, "");
}

function normalizeRuntimeAssetPath(source) {
  if (!source || typeof source !== "string") return "";
  let value = source.trim();
  if (!value) return "";
  if (value.includes("${")) return "";
  if (value.startsWith(R2_ASSET_BASE_URL)) value = value.slice(R2_ASSET_BASE_URL.length);
  if (!value.startsWith("/optimized/")) return "";
  value = value.split(/[?#]/u)[0];
  try {
    value = decodeURI(value);
  } catch {
    // Keep the original value when a hand-authored string contains a malformed escape.
  }
  if (!isRuntimeAssetFile(value)) return "";
  return value;
}

function isRuntimeAssetFile(value) {
  return /\.(?:webp|m4a|lrc|woff2?|ttf|png|jpe?g|mp4|ogg|wav|svg)$/iu.test(value);
}

function verifyRuntimeSourcesExistLocally(assetPaths) {
  for (const assetPath of assetPaths) {
    const filePath = resolve(webRoot, assetPath.slice(1));
    if (!isInside(webRoot, filePath) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      const reasons = [...(runtimeSources.get(assetPath) ?? [])].join(", ");
      failures.push(`${assetPath} is referenced but missing locally (${reasons})`);
    }
  }
}

function verifyNoLegacyRuntimeReferences() {
  const legacyPatterns = [
    { label: "old optimized MP3", pattern: /\/optimized\/[^"'()\s<>\\]+\.mp3\b/iu },
    { label: "old optimized MP3", pattern: /\/optimized\/[^"'()\s<>\\]+\.MP3\b/u },
    { label: "old PNG atlas", pattern: /\/optimized\/[^"'()\s<>\\]*ui-icon-atlas-icons\.[a-f0-9]{12}\.png\b/iu },
    { label: "old ending video", pattern: /ending-memory-high-[^"'()\s<>\\]+\.mp4\b/iu },
  ];

  for (const filePath of runtimeSourceFiles()) {
    const text = readFileSync(filePath, "utf8");
    for (const { label, pattern } of legacyPatterns) {
      if (pattern.test(text)) failures.push(`${relative(projectRoot, filePath)} contains ${label}`);
    }
  }
}

async function verifyRemoteR2(desiredKeys, assetPaths) {
  const remoteObjects = await listR2Objects();
  const remoteKeys = new Set(remoteObjects.map((object) => object.key));
  const missing = [...desiredKeys].filter((key) => !remoteKeys.has(key)).sort();
  const extra = remoteObjects
    .filter((object) => object.key.startsWith(`${prefix}/`) && !desiredKeys.has(object.key))
    .map((object) => object.key)
    .sort();
  const runtimeMissing = assetPaths
    .map((path) => `${prefix}${path}`)
    .filter((key) => !remoteKeys.has(key))
    .sort();

  mkdirSync(dirname(pruneReportPath), { recursive: true });
  writeFileSync(pruneReportPath, JSON.stringify({ missing, extra, runtimeMissing }, null, 2));

  if (missing.length > 0) failures.push(`R2 is missing ${missing.length} local optimized objects (see ${pruneReportPath})`);
  if (extra.length > 0) failures.push(`R2 has ${extra.length} extra objects outside the local optimized set (see ${pruneReportPath})`);
  if (runtimeMissing.length > 0) failures.push(`R2 is missing ${runtimeMissing.length} runtime-referenced objects (see ${pruneReportPath})`);

  return {
    remoteCount: remoteObjects.length,
    remoteBytes: remoteObjects.reduce((sum, object) => sum + Number(object.size || 0), 0),
  };
}

function localOptimizedR2Keys() {
  const keys = new Set();
  const optimizedRoot = resolve(webRoot, "optimized");
  for (const filePath of walkFiles(optimizedRoot)) {
    const key = `${prefix}/optimized/${relative(optimizedRoot, filePath).replace(/\\/g, "/")}`;
    keys.add(key);
  }
  return keys;
}

async function listR2Objects() {
  const token = cloudflareToken();
  const objects = [];
  let cursor = "";
  do {
    const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects`);
    url.searchParams.set("per_page", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(`Cloudflare R2 list failed: ${response.status} ${JSON.stringify(body.errors ?? body)}`);
    }
    objects.push(...body.result);
    cursor = body.result_info?.is_truncated ? body.result_info?.cursor : "";
  } while (cursor);
  return objects;
}

function cloudflareToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  const configPath = resolve(process.env.HOME ?? "", "Library/Preferences/.wrangler/config/default.toml");
  if (!existsSync(configPath)) throw new Error("Set CLOUDFLARE_API_TOKEN or login with wrangler before --remote verification.");
  const toml = readFileSync(configPath, "utf8");
  const token = toml.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
  if (!token) throw new Error("No oauth_token found in Wrangler config.");
  return token;
}

function runtimeSourceFiles() {
  const roots = [
    resolve(webRoot),
    resolve(projectRoot, "hyperframes/ending-memory"),
  ];
  const files = [];
  for (const root of roots) {
    for (const filePath of walkFiles(root)) {
      if (!isRuntimeTextFile(filePath)) continue;
      const relativePath = relative(projectRoot, filePath).replace(/\\/g, "/");
      if (relativePath.includes("/optimized/")) continue;
      if (relativePath.includes("/.aliyun-output/")) continue;
      if (relativePath.includes("/scripts/")) continue;
      if (relativePath.includes("/tools/")) continue;
      if (relativePath.endsWith(".test.mjs")) continue;
      if (relativePath.endsWith("/test-last-10s.html")) continue;
      if (relativePath.endsWith("verify-flow.mjs")) continue;
      if (relativePath.endsWith("server.mjs")) continue;
      files.push(filePath);
    }
  }
  return files;
}

function isRuntimeTextFile(filePath) {
  return new Set([".css", ".html", ".js", ".json", ".mjs"]).has(extname(filePath).toLowerCase());
}

function* walkFiles(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const filePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(filePath);
    } else if (entry.isFile()) {
      yield filePath;
    }
  }
}

function isInside(root, target) {
  const path = relative(root, target);
  return path === "" || (!path.startsWith("..") && !resolve(path).startsWith(".."));
}

function formatMiB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}
