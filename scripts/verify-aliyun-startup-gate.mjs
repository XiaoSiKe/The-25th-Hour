Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: new URL("https://arch.25thgame.vip/game.html"),
});

const HEAD_TIMEOUT_MS = 15000;
const HEAD_CONCURRENCY = 8;
const ALIYUN_PAGE_URL = "https://arch.25thgame.vip/game.html";

const { deferredStartupBgmTracks, startupGateBgmTracks } = await import("../web-app/game/music.mjs");
const {
  DOMESTIC_ASSET_BASE_URL,
  R2_ASSET_BASE_URL,
  publicAssetUrl,
  r2FallbackAssetUrl,
} = await import("../web-app/ui/asset-url.mjs");
const {
  criticalStartupImageSources,
  opportunisticStartupImageSources,
  portfolioBoardImageSources,
  startupLoadingShellImageSources,
  startupPortfolioBoardImageSources,
} = await import("../web-app/ui/resource-preload.mjs");
const { STARTUP_DOMESTIC_ASSET_PATHS } = await import("../web-app/ui/startup-domestic-assets.mjs");

const startupDesktopImages = criticalStartupImageSources({ isMobileStartSurface: false });
const startupMobileImages = criticalStartupImageSources({ isMobileStartSurface: true });
const startupImageSources = [...new Set([...startupDesktopImages, ...startupMobileImages])];
const startupMediaSources = startupGateBgmTracks().map((track) => track.src).filter(Boolean);
const deferredMediaSources = deferredStartupBgmTracks().map((track) => track.src).filter(Boolean);
const domesticMediaSources = [...startupMediaSources, ...deferredMediaSources];
const startupShellImageSources = startupLoadingShellImageSources();
const startupShellImages = new Set(startupShellImageSources);
const startupRoutedImageSources = startupImageSources.filter((source) => !startupShellImages.has(source));
const opportunisticStartupImages = opportunisticStartupImageSources({ isMobileStartSurface: false });
const startupPortfolioBoards = startupPortfolioBoardImageSources();
const startupPortfolioBoardSet = new Set(startupPortfolioBoards);
const postStartPortfolioBoards = portfolioBoardImageSources()
  .filter((source) => !startupPortfolioBoardSet.has(source));
const domesticManifestSet = new Set(STARTUP_DOMESTIC_ASSET_PATHS);

const invariantFailures = [
  ...expectEqual("desktop startup image count", startupDesktopImages.length, 20),
  ...expectEqual("mobile startup image count", startupMobileImages.length, 10),
  ...expectEqual("startup shell image count", startupShellImageSources.length, 1),
  ...expectEqual("startup gate audio count", startupMediaSources.length, 1),
  ...expectEqual("deferred domestic audio count", deferredMediaSources.length, 12),
  ...expectEqual("opportunistic startup image count", opportunisticStartupImages.length, 14),
  ...expectEqual("startup portfolio board count", startupPortfolioBoards.length, 2),
  ...expectEqual("post-start portfolio board count", postStartPortfolioBoards.length, 6),
  ...expectEvery("startup domestic manifest includes startup optimized images", startupRoutedImageSources, (source) => domesticManifestSet.has(source)),
  ...expectEvery("startup domestic manifest includes startup audio", domesticMediaSources, (source) => domesticManifestSet.has(source)),
  ...expectEvery("opportunistic startup images exclude post-start portfolio boards", opportunisticStartupImages, (source) => !postStartPortfolioBoards.includes(source)),
  ...expectEvery("startup domestic manifest excludes post-start portfolio boards", postStartPortfolioBoards, (source) => !domesticManifestSet.has(source)),
];

const routeEntries = [
  ...startupRoutedImageSources.map((source) => entry("startup image", source)),
  ...startupShellImageSources.map((source) => entry("startup shell image", source)),
  ...opportunisticStartupImages.map((source) => entry("startup opportunistic image", source)),
  ...startupMediaSources.map((source) => entry("startup audio", source)),
  ...deferredMediaSources.map((source) => entry("deferred audio", source)),
  ...postStartPortfolioBoards.map((source) => entry("post-start portfolio", source)),
];

const startupRouteFailures = [
  ...expectEvery("Aliyun startup optimized images route to domestic CDN", startupRoutedImageSources, (source) => entry("startup image", source).host === "domestic"),
  ...expectEvery("Aliyun startup shell images stay on site origin", startupShellImageSources, (source) => entry("startup shell image", source).host === "site"),
  ...expectEvery("Aliyun opportunistic startup images route to R2", opportunisticStartupImages, (source) => entry("startup opportunistic image", source).host === "r2"),
  ...expectEvery("Aliyun startup audio routes to domestic CDN", startupMediaSources, (source) => entry("startup audio", source).host === "domestic"),
  ...expectEvery("Aliyun deferred audio routes to domestic CDN", deferredMediaSources, (source) => entry("deferred audio", source).host === "domestic"),
  ...expectEvery("Aliyun post-start portfolio boards route to R2", postStartPortfolioBoards, (source) => entry("post-start portfolio", source).host === "r2"),
  ...expectEvery("Aliyun startup domestic images retry domestic CDN instead of using R2 fallback URLs", startupRoutedImageSources, (source) => entry("startup image", source).fallbackHost === ""),
];

const remoteEntries = [
  ...routeEntries.filter((item) => item.host === "domestic" || item.host === "r2" || item.host === "site"),
];
const remoteFailures = await checkUrls(uniqueUrlEntries(remoteEntries));

const failures = [...invariantFailures, ...startupRouteFailures, ...remoteFailures];
if (failures.length > 0) {
  console.error("Aliyun startup gate validation failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const counts = routeEntries.reduce((summary, item) => {
  summary[item.kind] ??= {};
  summary[item.kind][item.host] = (summary[item.kind][item.host] ?? 0) + 1;
  return summary;
}, {});

console.log(`Verified Aliyun startup gate routing and availability: ${JSON.stringify(counts)}.`);
console.log(`Verified ${STARTUP_DOMESTIC_ASSET_PATHS.length} domestic manifest paths, ${postStartPortfolioBoards.length} post-start portfolio boards on R2, and ${remoteEntries.length} remote startup URLs.`);

function entry(kind, source) {
  const url = new URL(publicAssetUrl(source), ALIYUN_PAGE_URL).href;
  const fallbackUrl = r2FallbackAssetUrl(url);
  return {
    kind,
    source,
    url,
    host: classifyHost(url),
    fallbackUrl,
    fallbackHost: fallbackUrl ? classifyHost(fallbackUrl) : "",
  };
}

function classifyHost(url) {
  if (url.startsWith(DOMESTIC_ASSET_BASE_URL)) return "domestic";
  if (url.startsWith(R2_ASSET_BASE_URL)) return "r2";
  return new URL(url, ALIYUN_PAGE_URL).origin === new URL(ALIYUN_PAGE_URL).origin ? "site" : "other";
}

function expectEqual(label, actual, expected) {
  return actual === expected ? [] : [`${label}: expected ${expected}, got ${actual}`];
}

function expectEvery(label, sources, predicate) {
  return sources
    .filter((source) => !predicate(source))
    .map((source) => `${label}: ${source}`);
}

function uniqueUrlEntries(items) {
  const byUrl = new Map();
  for (const item of items) {
    if (!byUrl.has(item.url)) byUrl.set(item.url, item);
  }
  return [...byUrl.values()];
}

async function checkUrls(items) {
  const failures = [];
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(HEAD_CONCURRENCY, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      const result = await checkUrl(item);
      if (!result.ok) failures.push(`${item.kind} ${item.source} -> ${item.url} (${result.message})`);
    }
  });
  await Promise.all(workers);
  return failures.sort();
}

async function checkUrl(item) {
  const head = await fetchWithTimeout(item.url, { method: "HEAD" });
  if (!head.ok && head.status !== 405) return head;
  const response = head.ok
    ? head.response
    : (await fetchWithTimeout(item.url, { method: "GET", headers: { Range: "bytes=0-0" } })).response;
  if (!response?.ok) return { ok: false, message: head.message, status: head.status };
  const contentType = response.headers.get("content-type") || "";
  const typeOk = expectedContentTypes(item.source).some((type) => contentType.toLowerCase().startsWith(type));
  if (!typeOk) {
    return { ok: false, status: response.status, message: `unexpected content-type ${contentType || "(missing)"}` };
  }
  return { ok: true, status: response.status, message: `HTTP ${response.status}`, response };
}

function expectedContentTypes(source) {
  if (/\.webp(?:[?#].*)?$/iu.test(source)) return ["image/webp"];
  if (/\.m4a(?:[?#].*)?$/iu.test(source)) return ["audio/mp4", "audio/x-m4a"];
  return [""];
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
