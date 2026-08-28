Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: new URL("https://arch.25thgame.vip/game.html"),
});

const HEAD_TIMEOUT_MS = 12000;
const DOMESTIC_PAGE_ORIGIN = "https://arch.25thgame.vip";

const { deferredStartupBgmTracks, startupGateBgmTracks } = await import("../web-app/game/music.mjs");
const { DOMESTIC_ASSET_BASE_URL, publicAssetUrl } = await import("../web-app/ui/asset-url.mjs");

const audioEntries = [...startupGateBgmTracks(), ...deferredStartupBgmTracks()]
  .map((track) => ({
    id: track.id,
    title: track.title,
    source: track.src,
    url: publicAssetUrl(track.src),
  }))
  .filter((entry) => entry.url.startsWith(DOMESTIC_ASSET_BASE_URL));

const failures = [];
if (audioEntries.length !== 13) {
  failures.push(`Expected 13 domestic BGM URLs, got ${audioEntries.length}.`);
}

for (const entry of audioEntries) {
  const result = await checkCors(entry.url);
  if (!result.ok) {
    const cacheBypassUrl = new URL(entry.url);
    cacheBypassUrl.searchParams.set("cors_probe", String(Date.now()));
    const cacheBypassResult = await checkCors(cacheBypassUrl.href);
    const hint = cacheBypassResult.ok
      ? "source/origin is correct with a cache-buster; refresh the CDN cached object"
      : "source/origin also fails with a cache-buster; fix CDN/OSS CORS rules";
    failures.push(`${entry.id} ${entry.title} -> ${entry.url} (${result.message}; ${hint})`);
  }
}

if (failures.length > 0) {
  console.error("Production domestic CORS validation failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Verified domestic startup and deferred BGM CORS for ${audioEntries.length} URLs from ${new URL(DOMESTIC_ASSET_BASE_URL).origin}.`);

async function checkCors(url) {
  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: {
      Origin: DOMESTIC_PAGE_ORIGIN,
      Range: "bytes=0-0",
      "Cache-Control": "no-cache",
    },
  });
  if (!response.ok && response.status !== 206) {
    return { ok: false, message: response.message };
  }

  const allowOrigin = response.response.headers.get("access-control-allow-origin") || "";
  if (allowOrigin !== "*" && allowOrigin !== DOMESTIC_PAGE_ORIGIN) {
    return {
      ok: false,
      message: `Access-Control-Allow-Origin=${allowOrigin || "(missing)"}, expected ${DOMESTIC_PAGE_ORIGIN} or *`,
    };
  }

  const allowMethods = response.response.headers.get("access-control-allow-methods") || "";
  if (allowMethods && !/\bGET\b/iu.test(allowMethods)) {
    return {
      ok: false,
      message: `Access-Control-Allow-Methods=${allowMethods}, expected GET`,
    };
  }

  return { ok: true };
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
    if (response.ok || response.status === 206) {
      return { ok: true, status: response.status, message: `HTTP ${response.status}`, response };
    }
    return { ok: false, status: response.status, message: `HTTP ${response.status}`, response };
  } catch (error) {
    return { ok: false, status: 0, message: error?.name === "AbortError" ? "timeout" : String(error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}
