import { ENDING_TRACKS, postStartGameBgmPreloadTrackGroups, startupGateBgmTracks } from "../web-app/game/music.mjs";
import { R2_ASSET_BASE_URL, publicAssetUrl } from "../web-app/ui/asset-url.mjs";
import { ENDING_MEMORY_SCENE_IMAGE_SOURCES } from "../web-app/ui/ending-memory-assets.generated.mjs";
import { criticalStartupImageSources, opportunisticStartupImageSources } from "../web-app/ui/resource-preload.mjs";

const HEAD_TIMEOUT_MS = 8000;
const HEAD_CONCURRENCY = 8;
const FETCH_RETRY_COUNT = 1;
const FETCH_RETRY_DELAY_MS = 400;
const MIN_SAMPLE_COUNT = 48;
const CORS_SAMPLE_COUNT = 18;
const PRODUCTION_R2_CORS_ORIGINS = [
  "https://arch.25thgame.vip",
];

const samples = new Map();
const validationFailures = [];

addSamples("startup image", sampleEvenly(criticalStartupImageSources({ isMobileStartSurface: false }), 28));
addSamples("opportunistic startup image", sampleEvenly(opportunisticStartupImageSources({ isMobileStartSurface: false }), 16));
addSamples("ending memory image", sampleEvenly(ENDING_MEMORY_SCENE_IMAGE_SOURCES, 12));
addSamples("startup bgm", startupGateBgmTracks().map((track) => track.src));
addSamples("post-start bgm", postStartGameBgmPreloadTrackGroups().flatMap((group) => group.map((track) => track.src)));
addSamples("ordinary ending bgm", ENDING_TRACKS.flatMap((track) => [track.src, track.lyricsSrc]));

const sampleEntries = [...samples.entries()].map(([url, labels]) => ({
  url,
  labels: [...new Set(labels)].join(", "),
}));

if (sampleEntries.length < MIN_SAMPLE_COUNT) {
  validationFailures.push(`Only ${sampleEntries.length} production R2 samples collected; expected at least ${MIN_SAMPLE_COUNT}.`);
}

if (validationFailures.length > 0) {
  reportFailures("Production R2 sample validation failed", validationFailures);
}

const headFailures = await checkUrls(sampleEntries);
const corsSampleEntries = sampleEntries
  .filter((entry) => entry.labels.includes("ordinary ending bgm"))
  .slice(0, CORS_SAMPLE_COUNT);
const corsFailures = await checkCorsHeaders(corsSampleEntries, PRODUCTION_R2_CORS_ORIGINS);

if (headFailures.length > 0 || corsFailures.length > 0) {
  const failures = [
    ...headFailures.map((failure) => `HEAD: ${failure}`),
    ...corsFailures.map((failure) => `CORS: ${failure}`),
  ];
  reportFailures("Production R2 sampled validation failed", failures);
}

console.log(`Verified ${sampleEntries.length} production R2 HEAD samples and ${corsSampleEntries.length} CORS samples from ${new URL(R2_ASSET_BASE_URL).origin}.`);

function addSamples(label, sources) {
  for (const source of sources) addSample(label, source);
}

function addSample(label, source) {
  const url = productionR2Url(source);
  if (!url) return;
  const labels = samples.get(url) ?? [];
  labels.push(label);
  samples.set(url, labels);
}

function productionR2Url(source) {
  if (!source || typeof source !== "string") return "";
  const publicUrl = publicAssetUrl(source);
  let url = null;
  try {
    url = new URL(publicUrl);
  } catch {
    return "";
  }
  if (url.hostname === "assets-cn.25thgame.vip") {
    validationFailures.push(`${source} resolves to the domestic CDN host; this check only verifies R2 samples.`);
    return "";
  }
  if (!url.href.startsWith(R2_ASSET_BASE_URL)) return "";
  return url.href;
}

function sampleEvenly(items, limit) {
  const uniqueItems = [...new Set(items.filter(Boolean))];
  if (uniqueItems.length <= limit) return uniqueItems;
  if (limit <= 1) return uniqueItems.slice(0, 1);
  const lastIndex = uniqueItems.length - 1;
  const sampled = [];
  for (let index = 0; index < limit; index += 1) {
    sampled.push(uniqueItems[Math.round((index * lastIndex) / (limit - 1))]);
  }
  return [...new Set(sampled)];
}

async function checkUrls(entries) {
  const failures = [];
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(HEAD_CONCURRENCY, entries.length) }, async () => {
    while (nextIndex < entries.length) {
      const entry = entries[nextIndex];
      nextIndex += 1;
      const result = await checkUrl(entry.url);
      if (!result.ok) {
        failures.push(`${entry.url} (${entry.labels}) -> ${result.message}`);
      }
    }
  });
  await Promise.all(workers);
  return failures.sort();
}

async function checkCorsHeaders(entries, origins) {
  const failures = [];
  for (const entry of entries) {
    await Promise.all(origins.map(async (origin) => {
      const result = await checkCorsUrl(entry.url, origin);
      if (!result.ok) {
        failures.push(`${entry.url} (${entry.labels}, Origin: ${origin}) -> ${result.message}`);
      }
    }));
  }
  return failures.sort();
}

async function checkCorsUrl(url, origin) {
  const response = await fetchResponseWithRetry(url, {
    method: "HEAD",
    headers: { Origin: origin },
  });
  if (!response.ok) return response;
  const allowedOrigin = response.response.headers.get("access-control-allow-origin") ?? "";
  if (allowedOrigin === origin || allowedOrigin === "*") return { ok: true };
  return {
    ok: false,
    status: response.status,
    message: `missing access-control-allow-origin for ${origin}`,
  };
}

async function checkUrl(url) {
  const head = await fetchWithRetry(url, { method: "HEAD" });
  if (head.ok) return { ok: true };
  if (head.status === 405) {
    const rangedGet = await fetchWithRetry(url, { method: "GET", headers: { Range: "bytes=0-0" } });
    if (rangedGet.ok) return { ok: true };
    return rangedGet;
  }
  return head;
}

async function fetchResponseWithRetry(url, options) {
  return retryFetch(() => fetchResponseWithTimeout(url, options));
}

async function fetchWithRetry(url, options) {
  return retryFetch(() => fetchWithTimeout(url, options));
}

async function retryFetch(fetchOnce) {
  let result = null;
  for (let attempt = 0; attempt <= FETCH_RETRY_COUNT; attempt += 1) {
    result = await fetchOnce();
    if (!shouldRetryFetchResult(result) || attempt >= FETCH_RETRY_COUNT) return result;
    await delay(FETCH_RETRY_DELAY_MS * (attempt + 1));
  }
  return result;
}

function shouldRetryFetchResult(result) {
  return !result?.ok && (result?.status === 0 || result?.status >= 500);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchResponseWithTimeout(url, options) {
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
    if (response.ok) return { ok: true, status: response.status, message: `HTTP ${response.status}` };
    return { ok: false, status: response.status, message: `HTTP ${response.status}` };
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
