import { ACHIEVEMENTS, ENDINGS, GAME_REQUIRED_IMAGES, ROUTE_OPTIONS } from "../game/data.mjs";
import { postStartPreloadTrackGroups, startupBgmTracks } from "../game/music.mjs";
import { APP_VERSION, VERSION_GATE_UPDATE_MESSAGE } from "../version-gate.mjs";
import { ENDING_MEMORY_SCENE_IMAGE_SOURCES } from "./ending-memory-assets.generated.mjs";
import * as icons from "./icons.mjs";
import { UI_ICON_FINAL_IMAGE_SOURCES } from "./icon-source.mjs";
import { LEGAL_TEXT_LINES } from "./legal.mjs";
import { runtimeUiIconImageSources } from "./ui-icon-atlas.mjs";

export const STARTUP_LOADING_FONT_TEXT = [
  "SERVER / RENDER / WAIT",
  "第二十五小时",
  APP_VERSION,
  "正在载入 你的 五年建筑生 大学生涯",
  "“ 请稍候，别着急同学们，",
  "画图也是从等渲染开始的，不是吗？”",
  VERSION_GATE_UPDATE_MESSAGE,
  "为了更佳的游戏体验，建议您使用全屏模式。",
  "按 F11 键可进入或退出全屏模式。",
  ...LEGAL_TEXT_LINES,
  "载入进度",
  "0123456789%",
];

export const START_PAGE_FONT_TEXT = [
  "第二十五小时",
  "建筑生模拟器",
  APP_VERSION,
  "THE 25TH HOUR · ARCHITECTURE STUDENT SIMULATOR",
  "开始新游戏",
  "“同学，行李给我，我帮你拿！”",
  "继续上次游戏",
  "这一次，不用Ctrl+Z。",
  "暂无可读取的本地存档。",
  ...entryFontText(icons.START_SECONDARY_ENTRIES),
  "玩家排行榜",
  "LEADERBOARD",
  "排行榜暂无可展示数据；线上接口未可用时会自动显示本地毕业档案。",
  "查看排行榜",
  "结局与成就",
  "COLLECTION",
  "收集那些被你亲手走出来的瞬间。",
  "黄色的树林里不止分出两条路，",
  "你的选择是什么呢，少年？",
  "CAD",
  "SU",
  "PS",
  ...entryFontText(icons.START_TOOLBAR_ENTRIES),
  ...LEGAL_TEXT_LINES,
];

export const MOBILE_START_FONT_TEXT = [
  "MOBILE ENTRY",
  "第二十五小时",
  "建筑生模拟器",
  "THE 25TH HOUR · ARCHITECTURE STUDENT SIMULATOR",
  "手机端入口",
  "开始新游戏",
  "“同学，行李给我，我帮你拿！”",
  ...entryFontText(icons.START_SECONDARY_ENTRIES),
  "玩家排行榜",
  "公告",
  "查看首发说明和更新消息。",
  "建院社区",
  "深浅色模式",
  "切换当前手机入口背景。",
];

export const STARTUP_FONT_SUBSET_TEXT = uniqueFontText([
  ...STARTUP_LOADING_FONT_TEXT,
  ...START_PAGE_FONT_TEXT,
  ...MOBILE_START_FONT_TEXT,
]);

const STARTUP_FONT_LOAD_SIZES = ["16px", "12px"];

export const STARTUP_FONT_FACES = fontFacesFor("Aa Pixel Startup");
export const GAME_FONT_FACES = fontFacesFor("Aa Pixel SC");

function fontFacesFor(family) {
  return STARTUP_FONT_LOAD_SIZES.map((size) => ({
    font: `${size} "${family}"`,
    text: STARTUP_FONT_SUBSET_TEXT,
  }));
}

function entryFontText(entries) {
  return entries.flatMap((entry) => [entry.title, entry.detail].filter(Boolean));
}

function uniqueFontText(parts) {
  return [...new Set(parts.filter(Boolean).join(""))].join("");
}

const ROLE_CARD_BACK_IMAGE = "/optimized/assets/characters/role-card-back.57c9bfd03c0b.webp";
const PORTFOLIO_BOARD_IMAGES = [
  "/optimized/assets/portfolio-boards/大一上.b7ff21ec4434.webp",
  "/optimized/assets/portfolio-boards/大一下.92d7a385a9b3.webp",
  "/optimized/assets/portfolio-boards/大二上.694e1d50ad62.webp",
  "/optimized/assets/portfolio-boards/大二下.b6617b395afe.webp",
  "/optimized/assets/portfolio-boards/大三上.814776465122.webp",
  "/optimized/assets/portfolio-boards/大三下.6f816b1f33e5.webp",
  "/optimized/assets/portfolio-boards/大四上.56eb8298ece3.webp",
  "/optimized/assets/portfolio-boards/大四下.1a7e3009bb97.webp",
];

const MOBILE_START_PAGE_ICON_KEYS = [
  "start_new",
  "author",
  "coffee",
  "leaderboard",
  "note",
  "community",
  "theme_light",
  "theme_dark",
  "clock",
];

const START_PAGE_ICON_KEYS = [
  "start_new",
  "continue_arrow",
  "author",
  "coffee",
  "leaderboard",
  "achievements",
  "risk_lock",
  "language",
  "community",
  "note",
  "theme_light",
  "theme_dark",
  "software_cad",
  "software_su",
  "software_ps",
  "clock",
];

const GAMEPLAY_FIRST_VIEW_ICON_KEYS = [
  "gear",
  "theme_light",
  "theme_dark",
  "new-game",
  "save",
  "guide",
  "portfolio_resume",
  "resume",
  "wanli_road",
  "competition",
  "postgrad_exam",
  "recommendation",
  "public_service",
  "overseas_study",
  "internship_work",
  "career_change",
];

const OPENING_FIXED_EVENT_IMAGE_KEYS = [
  "openingCeremony",
  "militaryTraining",
  "architectureLifeStart",
];

const SUMMER_SKETCH_IMAGE_KEYS = [
  "summerSketchWuyuan",
  "summerSketchHongcun",
];

const BASELINE_ENDING_ILLUSTRATION_IDS = [
  "stable_graduation",
  "wounded_graduation",
];

const STARTUP_FAILURE_ENDING_ILLUSTRATION_IDS = [
  "graduation_failed",
  "living_cost_break",
  "pressure_collapse",
  "two_failed_reviews",
  "forced_suspension",
];
const STARTUP_ROUTE_ENDING_ILLUSTRATION_IDS = [
  "career_startup",
];

const STARTUP_PORTFOLIO_BOARD_COUNT = 2;
const STARTUP_OPPORTUNISTIC_ENDING_MEMORY_COUNT = 12;

export function criticalStartupImageSources({ isMobileStartSurface = false } = {}) {
  if (isMobileStartSurface) {
    return mobileStartupImageSources();
  }

  return desktopStartupGateImageSources();
}

export function startupLoadingShellImageSources() {
  return [icons.UI_ICON_PATHS.loading_clock].filter(Boolean);
}

export function gameplayBackgroundImageSources({ isMobileStartSurface = false } = {}) {
  const sources = new Set([
    ...(isMobileStartSurface ? mobileStartupImageSources() : desktopStartupGateImageSources()),
    ...Object.values(icons.START_SCENE_IMAGES),
    ...Object.values(GAME_REQUIRED_IMAGES).map((image) => image.src),
    ...PORTFOLIO_BOARD_IMAGES,
    ...baselineEndingIllustrationSources(),
    ...ENDING_MEMORY_SCENE_IMAGE_SOURCES,
    ...albumCoverSources(),
    ROLE_CARD_BACK_IMAGE,
  ]);

  collectAssetSources(icons, sources);
  for (const achievement of Object.values(ACHIEVEMENTS)) {
    addSource(sources, icons.achievementIconPath(achievement));
  }
  for (const [endingId, ending] of Object.entries(ENDINGS)) {
    addSource(sources, icons.endingRouteIconPath(endingId, ending));
  }
  removeNonBaselineEndingIllustrations(sources);
  if (!isMobileStartSurface) {
    for (const source of Object.values(icons.START_SCENE_MOBILE_IMAGES)) {
      sources.delete(source);
    }
  }

  return uniqueSources(sources);
}

export function postStartupGameplayImageSources({ isMobileStartSurface = false } = {}) {
  return withoutSources(
    gameplayBackgroundImageSources({ isMobileStartSurface }),
    criticalStartupImageSources({ isMobileStartSurface }),
  );
}

export function supportDialogImageSources() {
  return uniqueSources(supportImageSources());
}

export function portfolioBoardImageSources() {
  return uniqueSources(PORTFOLIO_BOARD_IMAGES);
}

export function startupPortfolioBoardImageSources() {
  return uniqueSources(PORTFOLIO_BOARD_IMAGES.slice(0, STARTUP_PORTFOLIO_BOARD_COUNT));
}

export function startupSupportQrImageSources() {
  return uniqueSources(supportQrCodeImageSources());
}

export function startupFailureEndingIllustrationSources() {
  return endingIllustrationSourcesForIds(STARTUP_FAILURE_ENDING_ILLUSTRATION_IDS);
}

export function startupRouteEndingIllustrationSources() {
  return endingIllustrationSourcesForIds(STARTUP_ROUTE_ENDING_ILLUSTRATION_IDS);
}

export function opportunisticStartupImageSources({ isMobileStartSurface = false } = {}) {
  const startupGateSources = new Set(criticalStartupImageSources({ isMobileStartSurface }));
  return withoutSources(uniqueSources([
    ...baselineEndingIllustrationSources(),
    ...ENDING_MEMORY_SCENE_IMAGE_SOURCES
      .filter((source) => !startupGateSources.has(source))
      .slice(0, STARTUP_OPPORTUNISTIC_ENDING_MEMORY_COUNT),
  ]), startupGateSources);
}

export function baselineEndingIllustrationSources() {
  return endingIllustrationSourcesForIds(BASELINE_ENDING_ILLUSTRATION_IDS);
}

export function endingIllustrationSources() {
  return uniqueSources(Object.values(icons.ENDING_ILLUSTRATION_PATHS));
}

export function routeEndingIllustrationSources(optionId) {
  const option = ROUTE_OPTIONS.find((item) => item.id === optionId);
  return endingIllustrationSourcesForIds([option?.successEnding, option?.fallbackEnding]);
}

export function routeTriggeredEndingIllustrationSources() {
  return endingIllustrationSourcesForIds(
    ROUTE_OPTIONS.flatMap((option) => [option.successEnding, option.fallbackEnding]),
  );
}

function endingIllustrationSourcesForIds(endingIds) {
  return uniqueSources(
    [...new Set((Array.isArray(endingIds) ? endingIds : []).filter(Boolean))]
      .map((id) => icons.ENDING_ILLUSTRATION_PATHS[id])
      .filter(Boolean),
  );
}

function removeNonBaselineEndingIllustrations(sources) {
  const keptSources = new Set([
    ...baselineEndingIllustrationSources(),
    ...startupFailureEndingIllustrationSources(),
    ...startupRouteEndingIllustrationSources(),
  ]);
  for (const source of Object.values(icons.ENDING_ILLUSTRATION_PATHS)) {
    if (!keptSources.has(source)) {
      sources.delete(source);
    }
  }
}

function startSceneImages(isMobileStartSurface) {
  return Object.values(isMobileStartSurface ? icons.START_SCENE_MOBILE_IMAGES : icons.START_SCENE_IMAGES);
}

function mobileStartupImageSources() {
  const sources = new Set([
    ...startSceneImages(true),
    ...MOBILE_START_PAGE_ICON_KEYS.map((key) => icons.UI_ICON_PATHS[key]).filter(Boolean),
    ...firstGameplayImageSources(),
    ...summerSketchImageSources(),
  ]);
  return uniqueSources(sources);
}

function desktopStartupGateImageSources() {
  return uniqueSources([
    ...startSceneImages(false),
    ...orderedStartupIconSources(),
    ...startupSupportQrImageSources(),
    ...firstGameplayImageSources(),
    ...startupFailureEndingIllustrationSources(),
    ...startupRouteEndingIllustrationSources(),
    ...startupPortfolioBoardImageSources(),
    ...summerSketchImageSources(),
  ]);
}

function supportQrCodeImageSources() {
  return icons.SUPPORT_QR_CODES.map((code) => code.src).filter(Boolean);
}

function supportImageSources() {
  return [
    ...supportQrCodeImageSources(),
    icons.SUPPORT_ENDING_IMAGE,
  ];
}

function orderedStartupIconSources() {
  return [
    ...startPageIconSources(),
    ...characterDrawIconSources(),
    ...mentorSelectIconSources(),
    ...gameplayFirstViewIconSources(),
    ...UI_ICON_FINAL_IMAGE_SOURCES,
  ];
}

function startPageIconSources() {
  return START_PAGE_ICON_KEYS
    .map((key) => icons.UI_ICON_PATHS[key])
    .filter(Boolean);
}

function characterDrawIconSources() {
  return [
    ...Object.values(icons.CHARACTER_AVATAR_ICONS),
    ...Object.values(icons.CHARACTER_SKILL_ICONS),
    ...Object.values(icons.ATTRIBUTE_ICONS),
  ];
}

function mentorSelectIconSources() {
  return [
    ...Object.values(icons.MENTOR_AVATAR_ICONS),
    ...Object.values(icons.MENTOR_STAGE_TASK_ICONS),
  ];
}

function gameplayFirstViewIconSources() {
  return [
    ...GAMEPLAY_FIRST_VIEW_ICON_KEYS.map((key) => icons.UI_ICON_PATHS[key]).filter(Boolean),
    ...Object.values(icons.METER_ICONS),
    ...Object.values(icons.DELTA_ICONS),
    ...Object.values(icons.ACTION_ICONS),
    ...Object.values(icons.COURSE_ICONS),
  ];
}

function startupAlbumCoverSources() {
  return startupBgmTracks().map((track) => track.cover).filter(Boolean);
}

function albumCoverSources() {
  return [
    ...startupAlbumCoverSources(),
    ...postStartPreloadTrackGroups().flatMap((group) => group.map((track) => track.cover)),
  ].filter(Boolean);
}

function firstGameplayImageSources() {
  return [
    ROLE_CARD_BACK_IMAGE,
    ...openingFixedEventImageSources(),
  ];
}

function openingFixedEventImageSources() {
  return OPENING_FIXED_EVENT_IMAGE_KEYS
    .map((key) => GAME_REQUIRED_IMAGES[key]?.src)
    .filter(Boolean);
}

function summerSketchImageSources() {
  return SUMMER_SKETCH_IMAGE_KEYS
    .map((key) => GAME_REQUIRED_IMAGES[key]?.src)
    .filter(Boolean);
}

function collectAssetSources(value, sources) {
  if (value === icons.ENDING_ILLUSTRATION_PATHS) return;
  if (typeof value === "string") {
    addSource(sources, value);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const item of Object.values(value)) {
    collectAssetSources(item, sources);
  }
}

function addSource(sources, source) {
  if (isImageSource(source)) {
    sources.add(source);
  }
}

function uniqueSources(sources) {
  return runtimeUiIconImageSources([...sources].filter(isImageSource));
}

function withoutSources(sources, excludedSources) {
  const excluded = new Set(excludedSources);
  return sources.filter((source) => !excluded.has(source));
}

function isImageSource(source) {
  return typeof source === "string"
    && /\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?$/iu.test(source);
}
