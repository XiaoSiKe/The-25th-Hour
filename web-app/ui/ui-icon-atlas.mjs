import { UI_ICON_ATLAS_ENTRIES, UI_ICON_ATLAS_IMAGES } from "./ui-icon-atlas-manifest.mjs";
import { DOMESTIC_ASSET_BASE_URL, R2_ASSET_BASE_URL } from "./asset-url.mjs";

const ATLAS_ENTRY_BY_SOURCE = new Map(Object.entries(UI_ICON_ATLAS_ENTRIES));
const ATLAS_IMAGE_SOURCES = UI_ICON_ATLAS_IMAGES.map((atlas) => atlas.src);

export function uiIconAtlasEntryFor(source) {
  if (!source || typeof source !== "string") return null;
  return ATLAS_ENTRY_BY_SOURCE.get(normalizeUiIconSource(source)) ?? null;
}

export function uiIconAtlasImageSources() {
  return ATLAS_IMAGE_SOURCES;
}

export function runtimeUiIconImageSources(sources) {
  const runtimeSources = new Set();
  for (const source of sources) {
    if (!source) continue;
    const entry = uiIconAtlasEntryFor(source);
    runtimeSources.add(entry?.atlas ?? source);
  }
  return [...runtimeSources];
}

function normalizeUiIconSource(source) {
  if (source.startsWith(R2_ASSET_BASE_URL)) return source.slice(R2_ASSET_BASE_URL.length);
  if (source.startsWith(DOMESTIC_ASSET_BASE_URL)) return source.slice(DOMESTIC_ASSET_BASE_URL.length);
  try {
    const url = new URL(source);
    if (`${url.origin}/assets/v1` === R2_ASSET_BASE_URL) return decodeURI(url.pathname.replace(/^\/assets\/v1/u, ""));
    if (`${url.origin}/assets/v1` === DOMESTIC_ASSET_BASE_URL) return decodeURI(url.pathname.replace(/^\/assets\/v1/u, ""));
  } catch {}
  try {
    return decodeURI(source);
  } catch {
    return source;
  }
}
