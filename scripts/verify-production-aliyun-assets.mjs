Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { hostname: "arch.25thgame.vip" },
});

const HEAD_TIMEOUT_MS = 15000;
const HEAD_CONCURRENCY = 16;
const ALIYUN_PAGE_URL = "https://arch.25thgame.vip/game.html";
const allowR2Failures = process.argv.includes("--allow-r2-failures");

const { musicLibraryTracks } = await import("../web-app/game/music.mjs");
const { DOMESTIC_ASSET_BASE_URL, R2_ASSET_BASE_URL, publicAssetUrl } = await import("../web-app/ui/asset-url.mjs");
const { STARTUP_DOMESTIC_ASSET_PATHS } = await import("../web-app/ui/startup-domestic-assets.mjs");
const {
  criticalStartupImageSources,
  gameplayBackgroundImageSources,
  portfolioBoardImageSources,
  postStartupGameplayImageSources,
  startupLoadingShellImageSources,
  supportDialogImageSources,
} = await import("../web-app/ui/resource-preload.mjs");
const { ENDING_MEMORY_ANIMATION_SRC, ENDING_MEMORY_RUNTIME_SOURCES } = await import("../web-app/ui/render.mjs");
const { uiIconAtlasImageSources } = await import("../web-app/ui/ui-icon-atlas.mjs");

const sources = new Map();

addSources("startup shell image", startupLoadingShellImageSources());
addSources("startup desktop image", criticalStartupImageSources({ isMobileStartSurface: false }));
addSources("startup mobile image", criticalStartupImageSources({ isMobileStartSurface: true }));
addSources("gameplay desktop image", gameplayBackgroundImageSources({ isMobileStartSurface: false }));
addSources("gameplay mobile image", gameplayBackgroundImageSources({ isMobileStartSurface: true }));
addSources("post startup desktop image", postStartupGameplayImageSources({ isMobileStartSurface: false }));
addSources("post startup mobile image", postStartupGameplayImageSources({ isMobileStartSurface: true }));
addSources("support dialog image", supportDialogImageSources());
addSources("portfolio board image", portfolioBoardImageSources());
addSources("ui atlas image", uiIconAtlasImageSources());
addSource("ending memory html", ENDING_MEMORY_ANIMATION_SRC);
addSources("ending memory runtime", ENDING_MEMORY_RUNTIME_SOURCES);

for (const track of musicLibraryTracks()) {
  addSource(`music:${track.id}`, track.src);
  addSource(`music cover:${track.id}`, track.cover);
  addSource(`lyrics:${track.id}`, track.lyricsSrc);
}

const entries = [...sources.entries()].map(([source, labels]) => {
  const url = new URL(publicAssetUrl(source), ALIYUN_PAGE_URL).href;
  return {
    source,
    labels: [...labels].join(", "),
    host: classifyHost(url),
    url,
  };
});

const manifestWarnings = await verifyPublishedDomesticManifest();
if (manifestWarnings.length > 0) {
  reportWarnings("Production Aliyun domestic manifest is stale; checking direct asset URLs instead", manifestWarnings);
}

const headFailures = await checkUrls(entries);
const blockingHeadFailures = allowR2Failures ? headFailures.filter((failure) => failure.host !== "r2") : headFailures;
const warningHeadFailures = allowR2Failures ? headFailures.filter((failure) => failure.host === "r2") : [];
if (blockingHeadFailures.length > 0) {
  reportFailures(
    allowR2Failures ? "Production Aliyun blocking asset HEAD check failed" : "Production Aliyun asset HEAD check failed",
    blockingHeadFailures.map(formatFailure),
  );
}
if (warningHeadFailures.length > 0) {
  reportWarnings("Production Aliyun R2 asset HEAD check warnings", warningHeadFailures.map(formatFailure));
}

const byHost = entries.reduce((counts, entry) => {
  counts[entry.host] = (counts[entry.host] ?? 0) + 1;
  return counts;
}, {});
console.log(
  `Verified ${entries.length} production Aliyun asset URLs: ${JSON.stringify(byHost)}${warningHeadFailures.length > 0 ? ` (${warningHeadFailures.length} R2 warnings)` : ""}.`,
);

function addSources(label, values) {
  for (const value of values) addSource(label, value);
}

function addSource(label, source) {
  if (!source || typeof source !== "string") return;
  const labels = sources.get(source) ?? new Set();
  labels.add(label);
  sources.set(source, labels);
}

function classifyHost(url) {
  if (url.startsWith(DOMESTIC_ASSET_BASE_URL)) return "domestic";
  if (url.startsWith(R2_ASSET_BASE_URL)) return "r2";
  return "site";
}

async function verifyPublishedDomesticManifest() {
  const manifestUrl = `${DOMESTIC_ASSET_BASE_URL}/startup-domestic-assets.json`;
  const response = await fetchWithTimeout(manifestUrl, { method: "GET" });
  if (!response.ok) return [`${manifestUrl} -> ${response.message}`];
  let body = null;
  try {
    body = await response.response.json();
  } catch (error) {
    return [`${manifestUrl} is not valid JSON: ${error?.message || error}`];
  }
  const publishedPaths = new Set(Array.isArray(body.paths) ? body.paths : []);
  return STARTUP_DOMESTIC_ASSET_PATHS
    .filter((source) => !publishedPaths.has(source))
    .map((source) => `${manifestUrl} is missing ${source}`);
}

async function checkUrls(items) {
  const failures = [];
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(HEAD_CONCURRENCY, items.length) }, async () => {
    while (nextIndex < items.length) {
      const entry = items[nextIndex];
      nextIndex += 1;
      const result = await checkUrl(entry.url);
      if (!result.ok) failures.push({ ...entry, message: result.message });
    }
  });
  await Promise.all(workers);
  return failures.sort((left, right) => formatFailure(left).localeCompare(formatFailure(right)));
}

async function checkUrl(url) {
  const head = await fetchWithTimeout(url, { method: "HEAD" });
  if (head.ok) return { ok: true };
  if (head.status === 405) {
    const rangedGet = await fetchWithTimeout(url, { method: "GET", headers: { Range: "bytes=0-0" } });
    if (rangedGet.ok) return { ok: true };
    return rangedGet;
  }
  return head;
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      ...options,
    });
    if (response.ok) return { ok: true, status: response.status, message: `HTTP ${response.status}`, response };
    return { ok: false, status: response.status, message: `HTTP ${response.status}`, response };
  } catch (error) {
    return { ok: false, status: 0, message: error?.name === "AbortError" ? "timeout" : String(error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

function reportFailures(title, failures) {
  console.error(title);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

function reportWarnings(title, warnings) {
  console.warn(title);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

function formatFailure(failure) {
  return `${failure.host} ${failure.source} -> ${failure.url} (${failure.message}; ${failure.labels})`;
}
