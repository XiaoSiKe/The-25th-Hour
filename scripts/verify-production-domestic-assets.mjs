const HEAD_TIMEOUT_MS = 8000;
const HEAD_CONCURRENCY = 8;
const ALIYUN_PRODUCTION_HOSTNAME = "arch.25thgame.vip";

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { hostname: ALIYUN_PRODUCTION_HOSTNAME },
});

const { DOMESTIC_ASSET_BASE_URL, publicAssetUrl } = await import("../web-app/ui/asset-url.mjs");
const { STARTUP_DOMESTIC_ASSET_PATHS } = await import("../web-app/ui/startup-domestic-assets.mjs");

const manifestWarnings = await verifyPublishedManifest();
if (manifestWarnings.length > 0) {
  reportWarnings("Production domestic asset manifest is stale; checking direct asset URLs instead", manifestWarnings);
}

const entries = STARTUP_DOMESTIC_ASSET_PATHS
  .map((source) => ({ source, url: publicAssetUrl(source) }))
  .filter((entry) => entry.url.startsWith(DOMESTIC_ASSET_BASE_URL));

const routingFailures = STARTUP_DOMESTIC_ASSET_PATHS
  .map((source) => ({ source, url: publicAssetUrl(source) }))
  .filter((entry) => !entry.url.startsWith(DOMESTIC_ASSET_BASE_URL))
  .map((entry) => `${entry.source} resolves to ${entry.url}, expected ${DOMESTIC_ASSET_BASE_URL}`);

if (routingFailures.length > 0) {
  reportFailures("Production domestic asset routing validation failed", routingFailures);
}

const headFailures = await checkUrls(entries);
if (headFailures.length > 0) {
  reportFailures("Production domestic asset HEAD check failed", headFailures);
}

console.log(`Verified ${entries.length} production domestic asset URLs from ${new URL(DOMESTIC_ASSET_BASE_URL).origin}.`);

async function verifyPublishedManifest() {
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
      if (!result.ok) failures.push(`${entry.source} -> ${entry.url} (${result.message})`);
    }
  });
  await Promise.all(workers);
  return failures.sort();
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
