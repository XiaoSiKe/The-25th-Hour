const STAGE_WIDTH = 1710;
const STAGE_HEIGHT = 991;
const TABLET_STAGE_PORTRAIT_WIDTH = 834;
const TABLET_STAGE_PORTRAIT_HEIGHT = 1112;
const TABLET_STAGE_LANDSCAPE_WIDTH = 1112;
const TABLET_STAGE_LANDSCAPE_HEIGHT = 834;
const MOBILE_STAGE_WIDTH = 400;
const MOBILE_STAGE_HEIGHT = 824;
const SURFACES = new Set(["mobile", "tablet", "desktop"]);

function viewportSize() {
  const viewportWidth = Math.max(1, document.documentElement.clientWidth || window.innerWidth || STAGE_WIDTH);
  const viewportHeight = Math.max(1, document.documentElement.clientHeight || window.innerHeight || STAGE_HEIGHT);
  return { viewportWidth, viewportHeight };
}

function stageSurface() {
  const requestedSurface = new URLSearchParams(window.location.search).get("surface");
  if (SURFACES.has(requestedSurface)) return requestedSurface;
  const { viewportWidth, viewportHeight } = viewportSize();
  const isTouchLike = (navigator.maxTouchPoints || 0) > 0
    || window.matchMedia("(pointer: coarse)").matches
    || navigator.userAgentData?.mobile === true;
  const isPhonePortraitOrNarrow = viewportWidth <= 540 && viewportHeight <= 1000;
  const isPhoneLandscape = isTouchLike && viewportHeight <= 520 && viewportWidth <= 960;
  if (isPhonePortraitOrNarrow || isPhoneLandscape) return "mobile";
  const shortestSide = Math.min(viewportWidth, viewportHeight);
  const longestSide = Math.max(viewportWidth, viewportHeight);
  const isTabletLike = isTouchLike && shortestSide >= 600 && longestSide <= 1400;
  return isTabletLike ? "tablet" : "desktop";
}

function stageLayout() {
  return "scaled";
}

let pendingStageSync = 0;
let lastStageSignature = "";
let lastVisualViewportWidth = Math.round(window.visualViewport?.width || 0);

function syncStageSource() {
  const frame = document.querySelector("[data-stage-frame]");
  if (!frame) return;

  const source = frame.dataset.stageSrc || frame.getAttribute("src") || "./game.html";
  const url = new URL(source, window.location.href);
  url.searchParams.set("surface", stageSurface());
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }
  if (frame.src !== url.href) {
    frame.src = url.href;
  }
}

function syncStageScale() {
  const { viewportWidth, viewportHeight } = viewportSize();
  const surface = stageSurface();
  const layout = stageLayout();
  document.documentElement.dataset.stageSurface = surface;
  document.documentElement.dataset.stageLayout = layout;

  if (layout !== "scaled") {
    document.documentElement.style.setProperty("--stage-width", `${viewportWidth}px`);
    document.documentElement.style.setProperty("--stage-height", `${viewportHeight}px`);
    document.documentElement.style.setProperty("--stage-scale", "1");
    document.documentElement.style.setProperty("--stage-left", "0px");
    document.documentElement.style.setProperty("--stage-top", "0px");
    return;
  }

  const { stageWidth, stageHeight } = stageSize(surface, viewportWidth, viewportHeight);
  const scale = Math.min(viewportWidth / stageWidth, viewportHeight / stageHeight);
  const scaledWidth = stageWidth * scale;
  const scaledHeight = stageHeight * scale;
  const stageLeft = (viewportWidth - scaledWidth) / 2;
  const stageTop = (viewportHeight - scaledHeight) / 2;
  const signature = [
    surface,
    layout,
    Math.round(viewportWidth),
    Math.round(viewportHeight),
    stageWidth,
    stageHeight,
    scale.toFixed(6),
    stageLeft.toFixed(3),
    stageTop.toFixed(3),
  ].join(":");

  if (signature === lastStageSignature) return;
  lastStageSignature = signature;

  document.documentElement.style.setProperty("--stage-width", `${stageWidth}px`);
  document.documentElement.style.setProperty("--stage-height", `${stageHeight}px`);
  document.documentElement.style.setProperty("--stage-scale", String(scale));
  document.documentElement.style.setProperty("--stage-left", `${stageLeft}px`);
  document.documentElement.style.setProperty("--stage-top", `${stageTop}px`);
}

function stageSize(surface, viewportWidth, viewportHeight) {
  if (surface === "mobile") {
    return { stageWidth: MOBILE_STAGE_WIDTH, stageHeight: MOBILE_STAGE_HEIGHT };
  }
  if (surface === "tablet") {
    const isPortrait = viewportHeight >= viewportWidth;
    return isPortrait
      ? { stageWidth: TABLET_STAGE_PORTRAIT_WIDTH, stageHeight: TABLET_STAGE_PORTRAIT_HEIGHT }
      : { stageWidth: TABLET_STAGE_LANDSCAPE_WIDTH, stageHeight: TABLET_STAGE_LANDSCAPE_HEIGHT };
  }
  return { stageWidth: STAGE_WIDTH, stageHeight: STAGE_HEIGHT };
}

function syncStage() {
  syncStageScale();
  syncStageSource();
}

function scheduleStageSync() {
  if (pendingStageSync) return;
  pendingStageSync = window.requestAnimationFrame(() => {
    pendingStageSync = 0;
    syncStage();
  });
}

function handleVisualViewportResize() {
  const nextWidth = Math.round(window.visualViewport?.width || 0);
  if (nextWidth && nextWidth === lastVisualViewportWidth) return;
  lastVisualViewportWidth = nextWidth;
  scheduleStageSync();
}

function registerRuntimeCache() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.mjs", { type: "module" })
    .then(() => navigator.serviceWorker.ready)
    .catch(() => {});
}

registerRuntimeCache();
syncStage();
window.addEventListener("resize", scheduleStageSync, { passive: true });
window.addEventListener("orientationchange", scheduleStageSync, { passive: true });
window.visualViewport?.addEventListener("resize", handleVisualViewportResize, { passive: true });
