import { OPTIMIZED_ASSET_PATHS } from "./optimized-assets-manifest.mjs";
import { STARTUP_DOMESTIC_ASSET_PATHS } from "./startup-domestic-assets.mjs";

export const R2_ASSET_BASE_URL = "https://assets-apac.25thgame.vip/assets/v1";
export const DOMESTIC_ASSET_BASE_URL = "https://assets-cn.25thgame.vip/assets/v1";
const DOMESTIC_AUDIO_CACHE_VERSION = "20260728";

const SITE_OWNED_ASSET_PATHS = new Set([
  "/asset-work/assets/fonts/aa-pixel/AaPingPingGuoGuoXiangSuTi-2-web.ttf",
  "/optimized/asset-work/ui-icon-final/confirmed-icons/00-non-atlas-ui/001_开场 _ 开始界面时钟图1__时钟图1.36b6aac0df0b.webp",
]);
const STARTUP_DOMESTIC_ASSET_PATH_SET = new Set(STARTUP_DOMESTIC_ASSET_PATHS);

export function publicAssetUrl(source) {
  if (!source || typeof source !== "string") return "";
  if (/^(?:https?:|blob:|data:)/iu.test(source)) return source;

  const normalized = source.startsWith("./") ? source.slice(1) : source;
  const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
  const decodedPath = decodePublicAssetPath(path);
  const assetPath = optimizedAssetPathFor(path) ?? optimizedAssetPathFor(decodedPath) ?? path;
  const decodedAssetPath = decodePublicAssetPath(assetPath);
  if (
    isSiteOwnedAssetPath(path)
    || isSiteOwnedAssetPath(decodedPath)
    || isSiteOwnedAssetPath(assetPath)
    || isSiteOwnedAssetPath(decodedAssetPath)
  ) {
    return encodePublicAssetUrl(decodedAssetPath);
  }
  if (isLocalRuntime() && decodedAssetPath.startsWith("/optimized/")) return encodePublicAssetUrl(decodedAssetPath);
  if (shouldUseDomesticStartupAssets() && isStartupDomesticAssetPath(decodedAssetPath)) {
    return encodePublicAssetUrl(domesticAssetUrl(decodedAssetPath));
  }
  if (isR2AssetPath(decodedAssetPath)) return encodePublicAssetUrl(`${R2_ASSET_BASE_URL}${decodedAssetPath}`);
  return encodePublicAssetUrl(source);
}

export function r2FallbackAssetUrl() {
  return "";
}

function optimizedAssetPathFor(path) {
  return OPTIMIZED_ASSET_PATHS[path];
}

function isSiteOwnedAssetPath(path) {
  return SITE_OWNED_ASSET_PATHS.has(path)
    || path.startsWith("/asset-work/assets/fonts/aa-pixel/");
}

function isR2AssetPath(path) {
  return path.startsWith("/optimized/");
}

function isStartupDomesticAssetPath(path) {
  return STARTUP_DOMESTIC_ASSET_PATH_SET.has(path);
}

function domesticAssetUrl(path) {
  const url = `${DOMESTIC_ASSET_BASE_URL}${path}`;
  // A stale CDN object omitted CORS headers for part of the domestic BGM set.
  // The source rule is correct, so a versioned query moves audio to a fresh cache key.
  return path.startsWith("/optimized/asset-work/assets/audio/")
    ? `${url}?v=${DOMESTIC_AUDIO_CACHE_VERSION}`
    : url;
}

function shouldUseDomesticStartupAssets() {
  return globalThis.location?.hostname === "arch.25thgame.vip";
}

function isLocalRuntime() {
  const hostname = globalThis.location?.hostname ?? "";
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function decodePublicAssetPath(source) {
  try {
    return decodeURI(source);
  } catch {
    return source;
  }
}

function encodePublicAssetUrl(source) {
  try {
    return encodeURI(decodeURI(source));
  } catch {
    return encodeURI(source);
  }
}
