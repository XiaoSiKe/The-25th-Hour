import assert from "node:assert/strict";
import { DOMESTIC_ASSET_BASE_URL, R2_ASSET_BASE_URL, publicAssetUrl, r2FallbackAssetUrl } from "./asset-url.mjs";
import { OPTIMIZED_ASSET_PATHS } from "./optimized-assets-manifest.mjs";
import { ENDING_TRACKS, forcedEndingBgmTracks } from "../game/music.mjs";
import { ENDING_MEMORY_SCENE_IMAGE_SOURCES } from "./ending-memory-assets.generated.mjs";
import {
  baselineEndingIllustrationSources,
  criticalStartupImageSources,
  opportunisticStartupImageSources,
  postStartupGameplayImageSources,
  routeEndingIllustrationSources,
  startupFailureEndingIllustrationSources,
  startupLoadingShellImageSources,
  startupPortfolioBoardImageSources,
  startupRouteEndingIllustrationSources,
  startupSupportQrImageSources,
} from "./resource-preload.mjs";
import { STARTUP_DOMESTIC_ASSET_PATHS } from "./startup-domestic-assets.mjs";
import { UI_ICON_FINAL_IMAGE_SOURCES } from "./ui-icon-final-manifest.mjs";
import { uiIconAtlasImageSources } from "./ui-icon-atlas.mjs";

const fontSource = "/asset-work/assets/fonts/aa-pixel/AaPingPingGuoGuoXiangSuTi-2-web.ttf";
const startSceneSource = "/optimized/assets/start/start-scene-light-2400.39db5b366316.webp";
const forcedEndingAudioSource = forcedEndingBgmTracks()[0].src;
const endingAudioSource = ENDING_TRACKS[0].src;
const endingLyricsSource = ENDING_TRACKS[0].lyricsSrc;
const ordinaryEndingSources = ENDING_TRACKS.flatMap((track) => [track.src, track.lyricsSrc]);
const optimizedAudioSource = "/optimized/asset-work/assets/audio/year-bgm/大五学年/诺言.730979983f0f.m4a";
const domesticAudioCacheVersion = "20260728";
const startupAtlasSource = uiIconAtlasImageSources()[0];
const loadingClockSource = startupLoadingShellImageSources()[0];
const startupImageSources = criticalStartupImageSources();
const opportunisticStartupSources = opportunisticStartupImageSources();
const postStartupImageSources = postStartupGameplayImageSources();
const baselineEndingSources = baselineEndingIllustrationSources();
const routePostgradDreamEndingSources = routeEndingIllustrationSources("postgrad_dream");
const endingIllustrationSources = [...baselineEndingSources, ...routePostgradDreamEndingSources];
const opportunisticStartupDomesticSources = opportunisticStartupSources
  .filter((source) => !source.includes("/assets/ending-illustrations/")
    && !ENDING_MEMORY_SCENE_IMAGE_SOURCES.includes(source));
const opportunisticStartupR2Sources = opportunisticStartupSources
  .filter((source) => source.includes("/assets/ending-illustrations/")
    || ENDING_MEMORY_SCENE_IMAGE_SOURCES.includes(source));
const startupFailureEndingSources = startupFailureEndingIllustrationSources();
const startupRouteEndingSources = startupRouteEndingIllustrationSources();
const startupPortfolioSources = startupPortfolioBoardImageSources();
const startupSupportQrSources = startupSupportQrImageSources();
const fixedEventSources = [
  "/optimized/assets/story-events/入学讲座.1b3528ea3b6d.webp",
  "/optimized/assets/story-events/军训2.b92fa54f3f49.webp",
  "/optimized/assets/story-events/专教生活.d8bd9e988386.webp",
];
const summerSketchSources = [
  "/optimized/assets/story-events/暑假写生-婺源篁岭.c23719dbfb1f.webp",
  "/optimized/assets/story-events/暑假写生-宏村月沼.6be7afd23e62.webp",
];
const endingIllustrationSource = baselineEndingSources[0];
const portfolioBoardSource = startupPortfolioSources.find((source) => source.includes("/portfolio-boards/"));
const postStartupPortfolioBoardSources = postStartupImageSources
  .filter((source) => source.includes("/portfolio-boards/"));
const postStartupPortfolioBoardSource = postStartupPortfolioBoardSources[0];
const endingMemorySource = ENDING_MEMORY_SCENE_IMAGE_SOURCES.find((source) => source.includes("/结尾回忆走马灯图片/"));
const lateEndingMemorySource = ENDING_MEMORY_SCENE_IMAGE_SOURCES
  .find((source) => source.includes("/结尾回忆走马灯图片/") && !opportunisticStartupSources.includes(source));
const reusedEndingMemoryStorySource = ENDING_MEMORY_SCENE_IMAGE_SOURCES.find((source) => source.includes("/story-events/"));

function assertOrdinaryEndingTracksResolveToR2(label) {
  for (const track of ENDING_TRACKS) {
    assert.equal(
      publicAssetUrl(track.src),
      encodeURI(`${R2_ASSET_BASE_URL}${track.src}`),
      `${label} keeps ordinary ending audio on R2: ${track.id}`,
    );
    assert.equal(
      publicAssetUrl(track.lyricsSrc),
      encodeURI(`${R2_ASSET_BASE_URL}${track.lyricsSrc}`),
      `${label} keeps ordinary ending lyrics on R2: ${track.id}`,
    );
  }
}

assert.deepEqual(
  startupImageSources
    .filter((source) => source.includes("/assets/ending-illustrations/"))
    .sort(),
  [...startupFailureEndingSources, ...startupRouteEndingSources].sort(),
  "startup gate includes forced failure ending illustrations plus the entrepreneurship ending illustration",
);

assert.equal(
  publicAssetUrl(fontSource),
  encodeURI(OPTIMIZED_ASSET_PATHS[fontSource]),
  "site-owned optimized assets stay on the site origin",
);

assert.equal(
  publicAssetUrl(startSceneSource),
  encodeURI(`${R2_ASSET_BASE_URL}${startSceneSource}`),
  "unknown hosts keep startup images on R2",
);

assert.equal(
  publicAssetUrl(loadingClockSource),
  encodeURI(loadingClockSource),
  "startup loading shell clock stays on the site origin",
);

assert.equal(
  publicAssetUrl(endingLyricsSource),
  encodeURI(`${R2_ASSET_BASE_URL}${endingLyricsSource}`),
  "ending lyrics use R2 on unknown hosts",
);

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: new URL("https://arch.25thgame.vip/game.html"),
});

assert.equal(
  publicAssetUrl(startSceneSource),
  encodeURI(`${DOMESTIC_ASSET_BASE_URL}${startSceneSource}`),
  "arch production host uses the domestic asset origin for startup images",
);

assert.equal(
  publicAssetUrl(startupAtlasSource),
  encodeURI(`${DOMESTIC_ASSET_BASE_URL}${startupAtlasSource}`),
  "arch production host uses the domestic asset origin for the startup UI atlas",
);

for (const source of fixedEventSources) {
  assert.equal(
    publicAssetUrl(source),
    encodeURI(`${DOMESTIC_ASSET_BASE_URL}${source}`),
    "arch production host uses the domestic asset origin for opening fixed event images",
  );
}

for (const source of summerSketchSources) {
  assert.equal(
    publicAssetUrl(source),
    encodeURI(`${DOMESTIC_ASSET_BASE_URL}${source}`),
    "arch production host uses the domestic asset origin for startup summer sketch images",
  );
}

assert.equal(
  publicAssetUrl(forcedEndingAudioSource),
  encodeURI(`${DOMESTIC_ASSET_BASE_URL}${forcedEndingAudioSource}?v=${domesticAudioCacheVersion}`),
  "arch production host uses the domestic asset origin for startup gate failure ending BGM",
);

for (const source of startupFailureEndingSources) {
  assert.equal(
    publicAssetUrl(source),
    encodeURI(`${DOMESTIC_ASSET_BASE_URL}${source}`),
    "arch production host uses the domestic asset origin for startup gate failure ending illustrations",
  );
}

for (const source of startupRouteEndingSources) {
  assert.equal(
    publicAssetUrl(source),
    encodeURI(`${DOMESTIC_ASSET_BASE_URL}${source}`),
    "arch production host uses the domestic asset origin for startup gate entrepreneurship ending illustrations",
  );
}

for (const source of startupSupportQrSources) {
  assert.equal(
    publicAssetUrl(source),
    encodeURI(`${DOMESTIC_ASSET_BASE_URL}${source}`),
    "arch production host uses the domestic asset origin for startup support QR images",
  );
}

for (const source of startupPortfolioSources) {
  assert.equal(
    publicAssetUrl(source),
    encodeURI(`${DOMESTIC_ASSET_BASE_URL}${source}`),
    "arch production host uses the domestic asset origin for startup portfolio boards",
  );
}

assert.equal(
  publicAssetUrl(encodeURI(forcedEndingAudioSource)),
  encodeURI(`${DOMESTIC_ASSET_BASE_URL}${forcedEndingAudioSource}?v=${domesticAudioCacheVersion}`),
  "arch production host uses the domestic asset origin for encoded startup gate failure ending BGM",
);

assert.equal(
  publicAssetUrl(loadingClockSource),
  encodeURI(loadingClockSource),
  "arch production host keeps the loading shell clock on the site origin",
);

assert.equal(
  publicAssetUrl(optimizedAudioSource),
  encodeURI(`${R2_ASSET_BASE_URL}${optimizedAudioSource}`),
  "arch production host keeps non-startup optimized audio on R2",
);

assert.equal(
  publicAssetUrl(endingLyricsSource),
  encodeURI(`${R2_ASSET_BASE_URL}${endingLyricsSource}`),
  "arch production host keeps ordinary ending lyrics on R2",
);

assert.equal(
  publicAssetUrl(endingAudioSource),
  encodeURI(`${R2_ASSET_BASE_URL}${endingAudioSource}`),
  "arch production host keeps ordinary ending BGM on R2",
);

assertOrdinaryEndingTracksResolveToR2("arch production host");

assert.equal(
  publicAssetUrl(endingIllustrationSource),
  encodeURI(`${R2_ASSET_BASE_URL}${endingIllustrationSource}`),
  "arch production host keeps baseline ending illustrations on R2 until the domestic bucket has them",
);

for (const source of routePostgradDreamEndingSources) {
  assert.equal(
    publicAssetUrl(source),
    encodeURI(`${R2_ASSET_BASE_URL}${source}`),
    "arch production host keeps route-triggered ending illustrations on R2 until the domestic bucket has them",
  );
}

assert.equal(
  publicAssetUrl(portfolioBoardSource),
  encodeURI(`${DOMESTIC_ASSET_BASE_URL}${portfolioBoardSource}`),
  "arch production host uses the domestic asset origin for startup portfolio boards",
);

assert.equal(
  publicAssetUrl(postStartupPortfolioBoardSource),
  encodeURI(`${R2_ASSET_BASE_URL}${postStartupPortfolioBoardSource}`),
  "arch production host keeps post-start portfolio boards on R2",
);

assert.equal(
  publicAssetUrl(endingMemorySource),
  encodeURI(`${R2_ASSET_BASE_URL}${endingMemorySource}`),
  "arch production host keeps opportunistic ending memory scene images on R2 until the domestic bucket has them",
);

assert.equal(
  r2FallbackAssetUrl(publicAssetUrl(portfolioBoardSource)),
  "",
  "domestic optimized asset URLs retry the domestic CDN instead of falling back to R2",
);

assert.equal(
  publicAssetUrl(lateEndingMemorySource),
  encodeURI(`${R2_ASSET_BASE_URL}${lateEndingMemorySource}`),
  "arch production host keeps non-opportunistic ending memory scene images on R2",
);

assert.equal(
  r2FallbackAssetUrl(publicAssetUrl(lateEndingMemorySource)),
  "",
  "R2 asset URLs do not ask for another R2 fallback",
);

assert.equal(
  publicAssetUrl(reusedEndingMemoryStorySource),
  encodeURI(`${DOMESTIC_ASSET_BASE_URL}${reusedEndingMemoryStorySource}`),
  "arch production host keeps startup-gate story images on the domestic origin even when ending memory reuses them",
);

delete globalThis.location;

assert.equal(
  publicAssetUrl(endingIllustrationSource),
  encodeURI(`${R2_ASSET_BASE_URL}${endingIllustrationSource}`),
  "startup gate gameplay optimized images use R2 on unknown hosts",
);

assert.equal(
  publicAssetUrl(optimizedAudioSource),
  encodeURI(`${R2_ASSET_BASE_URL}${optimizedAudioSource}`),
  "optimized audio assets use their physical path on R2",
);

assert.equal(
  publicAssetUrl(encodeURI(optimizedAudioSource)),
  encodeURI(`${R2_ASSET_BASE_URL}${optimizedAudioSource}`),
  "optimized audio asset URLs are not double-encoded when passed through again",
);

assert.equal(
  UI_ICON_FINAL_IMAGE_SOURCES.every((source) => source.startsWith("/optimized/") && source.endsWith(".webp")),
  true,
  "final UI icon manifest contains optimized WebP paths only",
);

assert.equal(
  STARTUP_DOMESTIC_ASSET_PATHS.includes(forcedEndingAudioSource),
  true,
  "startup domestic manifest includes failure ending audio because it is a startup gate dependency",
);

assert.equal(
  ordinaryEndingSources.every((source) => !STARTUP_DOMESTIC_ASSET_PATHS.includes(source)),
  true,
  "startup domestic manifest excludes ordinary ending music and lyrics because they resolve to R2",
);

assert.equal(
  endingIllustrationSources.every((source) => !STARTUP_DOMESTIC_ASSET_PATHS.includes(source)),
  true,
  "startup domestic manifest excludes ending illustrations that are currently served from R2",
);

assert.equal(
  startupFailureEndingSources.every((source) => STARTUP_DOMESTIC_ASSET_PATHS.includes(source)),
  true,
  "startup domestic manifest includes forced failure ending illustrations",
);

assert.equal(
  startupRouteEndingSources.every((source) => STARTUP_DOMESTIC_ASSET_PATHS.includes(source)),
  true,
  "startup domestic manifest includes the entrepreneurship ending illustration",
);

assert.equal(
  startupPortfolioSources.every((source) => STARTUP_DOMESTIC_ASSET_PATHS.includes(source)),
  true,
  "startup domestic manifest includes only startup portfolio boards",
);

assert.equal(
  postStartupPortfolioBoardSources.every((source) => !STARTUP_DOMESTIC_ASSET_PATHS.includes(source)),
  true,
  "startup domestic manifest excludes post-start portfolio boards so they resolve to R2",
);

assert.equal(
  routePostgradDreamEndingSources.every((source) => !postStartupImageSources.includes(source)),
  true,
  "post-start image preloads do not sweep route-triggered ending illustrations before the player chooses that route",
);

assert.equal(
  STARTUP_DOMESTIC_ASSET_PATHS.includes(loadingClockSource),
  false,
  "startup domestic manifest excludes the loading shell clock because it stays on the site origin",
);

assert.equal(
  [...fixedEventSources, ...summerSketchSources].every((source) => STARTUP_DOMESTIC_ASSET_PATHS.includes(source)),
  true,
  "startup domestic manifest includes opening fixed event and summer sketch images",
);

assert.equal(
  opportunisticStartupDomesticSources.every((source) => STARTUP_DOMESTIC_ASSET_PATHS.includes(source)),
  true,
  "startup domestic manifest includes domestic-safe opportunistic startup image preloads for Aliyun",
);

assert.equal(
  [...startupSupportQrSources, ...startupPortfolioSources].every((source) => STARTUP_DOMESTIC_ASSET_PATHS.includes(source)),
  true,
  "startup domestic manifest includes support QR images and the first two portfolio boards",
);

assert.equal(
  opportunisticStartupR2Sources
    .every((source) => !STARTUP_DOMESTIC_ASSET_PATHS.includes(source)),
  true,
  "startup domestic manifest keeps unavailable opportunistic startup images on R2",
);

assert.equal(
  ENDING_MEMORY_SCENE_IMAGE_SOURCES
    .filter((source) => STARTUP_DOMESTIC_ASSET_PATHS.includes(source))
    .every((source) => startupImageSources.includes(source) || opportunisticStartupSources.includes(source)),
  true,
  "startup domestic manifest only includes ending memory scene images when startup or opportunistic preload requires them",
);

assert.equal(
  publicAssetUrl("https://example.com/already-public.webp"),
  "https://example.com/already-public.webp",
  "absolute URLs are preserved",
);

assert.equal(
  publicAssetUrl("/assets/not-optimized/example.jpg"),
  "/assets/not-optimized/example.jpg",
  "legacy /assets paths are not promoted to R2 without an optimized physical path",
);

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: new URL("http://localhost:49173/game.html"),
});

assert.equal(
  publicAssetUrl(startSceneSource),
  encodeURI(startSceneSource),
  "local development uses the optimized image file from the local web root instead of R2",
);

assert.equal(
  publicAssetUrl(optimizedAudioSource),
  encodeURI(optimizedAudioSource),
  "local development uses the optimized audio file from the local web root",
);

assert.equal(
  publicAssetUrl(encodeURI(optimizedAudioSource)),
  encodeURI(optimizedAudioSource),
  "local development keeps already encoded optimized audio paths stable",
);

assert.equal(
  publicAssetUrl(encodeURI(endingLyricsSource)),
  encodeURI(endingLyricsSource),
  "local development keeps already encoded ending lyrics stable",
);

delete globalThis.location;
