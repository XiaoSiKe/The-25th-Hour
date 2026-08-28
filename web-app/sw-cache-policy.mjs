export const RUNTIME_CACHE_NAME_PREFIX = "twenty-fifth-hour-runtime-";
export const RUNTIME_CACHE_NAME = `${RUNTIME_CACHE_NAME_PREFIX}v20-20260728`;

const CACHEABLE_DESTINATIONS = new Set(["audio", "font", "image", "script", "style"]);
const CACHEABLE_EXTENSIONS = new Set([
  ".css",
  ".js",
  ".m4a",
  ".mjs",
  ".mp3",
  ".ogg",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".ttf",
  ".wav",
  ".webp",
  ".woff",
  ".woff2",
  ".lrc",
]);
const RANGE_CACHEABLE_EXTENSIONS = new Set([".m4a", ".mp3", ".ogg", ".wav"]);

export function shouldCacheRequest(request) {
  if (!request || request.method !== "GET") return false;
  if (request.headers?.has?.("range")) return false;

  const url = new URL(request.url);
  if (url.pathname.endsWith(".html") || url.pathname === "/" || url.pathname.endsWith("/")) return false;
  if (url.pathname.startsWith("/__ops/")) return false;
  if (url.pathname.endsWith("/sw.mjs") || url.pathname.endsWith("/sw-cache-policy.mjs")) return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (request.destination === "document" || request.destination === "video") return false;
  if (isLocalRuntime(url) && isScriptOrStyleRequest(request, url)) return false;
  if (CACHEABLE_DESTINATIONS.has(request.destination)) return true;

  return CACHEABLE_EXTENSIONS.has(extensionName(url.pathname));
}

export function shouldServeCachedRangeRequest(request) {
  if (!request || request.method !== "GET") return false;
  if (!request.headers?.has?.("range")) return false;

  const url = new URL(request.url);
  return RANGE_CACHEABLE_EXTENSIONS.has(extensionName(url.pathname));
}

function isLocalRuntime(url) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
}

function isScriptOrStyleRequest(request, url) {
  if (request.destination === "script" || request.destination === "style") return true;
  return new Set([".css", ".js", ".mjs"]).has(extensionName(url.pathname));
}

function extensionName(pathname) {
  const match = pathname.toLowerCase().match(/\.[a-z0-9]+$/u);
  return match ? match[0] : "";
}
