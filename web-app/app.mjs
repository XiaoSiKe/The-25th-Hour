import { reviveState } from "./game/state.mjs";
import { dismissAchievementToasts, recordFinalEnding } from "./game/achievements.mjs";
import { ACHIEVEMENTS, RANDOM_EVENTS } from "./game/data.mjs";
import { externalLinkForEntry } from "./game/external-links.mjs";
import {
  advanceGameFlow,
  applyForInternship,
  choosePendingInteractionOption,
  chooseRouteOption,
  performAction,
  purchaseShopItem,
  recordCoffeeSupport,
  rerollCharacters,
  selectCharacter,
  startIeltsExam,
  startGameProfile,
  submitCompetitionWork,
  visitWanliRoadLocation,
} from "./game/commands.mjs";
import { toViewModel } from "./game/view-model.mjs";
import { progressCap, qualityCap } from "./game/resolver.mjs";
import {
  collectionViewModel,
  collectionHasSubmittedEndingScore,
  commitRunToCollection,
  createEmptyCollection,
  hydrateStateFromCollection,
  latestProfileForNewGame,
  loadCollection,
  recordCollectionCoffeeSupportClick,
  saveCollection,
  updateCollectionLatestProfile,
} from "./game/collection.mjs";
import {
  YEAR_BGM,
  musicForState,
  postStartGameBgmPreloadTrackGroups,
  selectEndingTrackForRun,
  startupGateBgmTracks,
} from "./game/music.mjs";
import {
  SENIOR_TEST_COPY_EVENT_HISTORY_KEY,
  SENIOR_TEST_COPY_SAVE_KEY,
  createSeniorTestCopyState,
  isSeniorTestCopyUrl,
} from "./game/test-senior-copy.mjs";
import { ENDING_MEMORY_ANIMATION_SRC, ENDING_MEMORY_RUNTIME_SOURCES, modalCommandKey, renderGame, renderLoading, renderModal, renderOverlay, renderStart } from "./ui/render.mjs";
import {
  UI_ICON_PATHS,
  achievementIconPath,
  renderUiIcon,
  themeIconPath,
} from "./ui/icons.mjs";
import {
  GAME_FONT_FACES,
  STARTUP_FONT_FACES,
  criticalStartupImageSources,
  endingIllustrationSources,
  opportunisticStartupImageSources,
  portfolioBoardImageSources,
  postStartupGameplayImageSources,
  routeEndingIllustrationSources,
  startupLoadingShellImageSources,
  supportDialogImageSources,
} from "./ui/resource-preload.mjs";
import { escapeHtml } from "./ui/html.mjs";
import { DOMESTIC_ASSET_BASE_URL, publicAssetUrl, R2_ASSET_BASE_URL } from "./ui/asset-url.mjs";
import { RUNTIME_CACHE_NAME, RUNTIME_CACHE_NAME_PREFIX } from "./sw-cache-policy.mjs";
import { captureEndingPageScreenshotBlob } from "./ui/ending-page-screenshot.mjs";
import { normalizeUiLanguage } from "./ui/language.mjs";
import {
  APP_VERSION,
  VERSION_GATE_UPDATE_MESSAGE,
  VERSION_MANIFEST_PATH,
  newestVersionManifest,
  versionGateStatus,
} from "./version-gate.mjs";
import { ENDING_MEMORY_SCENE_IMAGE_SOURCES } from "./ui/ending-memory-assets.generated.mjs";
import {
  boundedStartupLoadingProgress,
  hasStartupRepairSources,
  nextPreloadConcurrencyHint,
  shouldReleaseStartupGateAfterRepair,
  startupCacheSampleSources,
  startupRepairSources,
  tunedPreloadConcurrency,
} from "./startup-preload-helpers.mjs";
import {
  currentAnonymousPlayerId,
  flushPendingEndingReports,
  MONITOR_API_BASE,
  reportCoffeeSupportClick,
  reportEndingAndScore,
  reportGameSessionStart,
  reportSiteVisit,
  startMonitorHeartbeat,
} from "./monitoring/telemetry.mjs";

const SENIOR_TEST_COPY_MODE = isSeniorTestCopyUrl();
// Temporary full-run localStorage key until the IndexedDB save layer replaces it.
const SAVE_KEY = SENIOR_TEST_COPY_MODE ? SENIOR_TEST_COPY_SAVE_KEY : "twenty-fifth-hour-docs-core-v1";
const EVENT_HISTORY_KEY = SENIOR_TEST_COPY_MODE ? SENIOR_TEST_COPY_EVENT_HISTORY_KEY : "twenty-fifth-hour-seen-events-v1";
const HISTORICAL_EVENT_IDS = new Set(RANDOM_EVENTS.filter((event) => event.pool !== "model").map((event) => event.id));
const THEME_KEY = "twenty-fifth-hour-theme";
const LANGUAGE_KEY = "twenty-fifth-hour-language";
const STARTUP_PRELOAD_CACHE_KEY = "twenty-fifth-hour-startup-preload";
const STARTUP_GATE_RELEASED_KEY = "twenty-fifth-hour-startup-gate-released";
const STARTUP_PRELOAD_CACHE_VERSION = `startup-assets-v15:${APP_VERSION}:${DOMESTIC_ASSET_BASE_URL}:${R2_ASSET_BASE_URL}`;
const STARTUP_FAILED_RESOURCES_KEY = "twenty-fifth-hour-startup-failed-resources";
const STARTUP_FAILED_RESOURCE_LIMIT = 240;
const STARTUP_LOADING_SHELL_READY_TIMEOUT_MS = 1800;
const STARTUP_VERSION_CHECK_TIMEOUT_MS = 1400;
const STARTUP_VERSION_RELOAD_DELAY_MS = 180;
const STARTUP_VERSION_RELOAD_ATTEMPT_KEY = "twenty-fifth-hour-version-gate-reload";
const PRELOAD_CONCURRENCY_HINT_KEY = "twenty-fifth-hour-preload-concurrency";
const MOBILE_START_MEDIA_QUERY = "(max-width: 760px), (pointer: coarse) and (max-height: 520px)";
const DESKTOP_FULLSCREEN_TIP_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";
const SURFACE_PARAM = new URLSearchParams(window.location.search).get("surface");
const STARTUP_TIMING_ENABLED = new URLSearchParams(window.location.search).get("startupTiming") === "1";
const ACHIEVEMENT_TOAST_DURATION_MS = 3900;
const UI_DIALOG_REPLACE_MS = 320;
const CHARACTER_DRAW_AUTO_REVEAL_MS = 1260;
const MUSIC_YEAR_FADE_MS = 250;
const SPECIAL_SKILL_FEEDBACK_MS = 1280;
const ENDING_MEMORY_ANIMATION_WAIT_LABEL = "请稍后，正在为你加载毕业相册……";
const ENDING_ASSET_SPRINT_PRELOAD_SEMESTER_INDEX = 6;
const ENDING_MEMORY_ANIMATION_PRELOAD_BYPASS_FAILURES = 1;
const ENDING_MEMORY_ENTRY_READY_TIMEOUT_MS = 2800;
const ENDING_MEMORY_ENTRY_INITIAL_IMAGE_COUNT = 36;
const ENDING_MEMORY_ENTRY_IMAGE_PRELOAD_CONCURRENCY = 14;
const ENDING_MEMORY_SCENE_IMAGE_PRELOAD_CONCURRENCY = 16;
const ENDING_MEMORY_SCENE_IMAGE_PRELOAD_TIMEOUT_MS = 60000;
const ENDING_MEMORY_ENTRY_AUDIO_FADE_MS = 620;
const ENDING_MEMORY_EXIT_MS = 260;
const ENDING_MEMORY_AUDIO_DELAY_MS = 1000;
const ENDING_MEMORY_AUDIO_FADE_MS = 2600;
const ENDING_MEMORY_DOCK_EXIT_AT_SECONDS = 10;
const ENDING_MEMORY_LYRIC_LONG_GAP_SECONDS = 8;
const ENDING_MEMORY_LYRIC_HOLD_SECONDS = 5.2;
const ENDING_MEMORY_LAST_LYRIC_HOLD_SECONDS = 6;
const BACKGROUND_AUDIO_PRELOAD_TIMEOUT_MS = 90000;
const BACKGROUND_IMAGE_PRELOAD_TIMEOUT_MS = 120000;
const STARTUP_AUDIO_PRELOAD_TIMEOUT_MS = 6500;
const STARTUP_IMAGE_PRELOAD_TIMEOUT_MS = 180000;
const STARTUP_RESOURCE_PRELOAD_TIMEOUT_MS = 15000;
const STARTUP_AUDIO_PLAYABLE_READY_STATE = 2;
const STARTUP_AUDIO_PRELOAD_CONCURRENCY = 2;
const STARTUP_PRELOAD_HINT_IMAGE_COUNT = 4;
const STARTUP_AUDIO_PRELOAD_START_DELAY_MS = 160;
const STARTUP_RUNTIME_CACHE_CONTROL_TIMEOUT_MS = 1200;
const STARTUP_CACHE_SAMPLE_IMAGE_COUNT = 6;
const STARTUP_CACHE_SAMPLE_MEDIA_COUNT = 2;
const STARTUP_CACHE_SAMPLE_TIMEOUT_MS = 1200;
const STARTUP_GATE_TARGET_WAIT_MS = 12000;
const STARTUP_GATE_MAX_WAIT_MS = 30000;
const STARTUP_GATE_CACHED_MAX_WAIT_MS = 3000;
const STARTUP_RESOURCE_REPAIR_RETRY_DELAY_MS = 2200;
const RUNTIME_CACHE_WRITE_FLUSH_TIMEOUT_MS = 6000;
const PRIORITY_AUDIO_PRELOAD_CONCURRENCY = 5;
const PRIORITY_AUDIO_RESOURCE_PRELOAD_TIMEOUT_MS = 12000;
const BACKGROUND_BGM_PRELOAD_CONCURRENCY = 3;
const ADJACENT_AUDIO_PRELOAD_CONCURRENCY = 4;
const STARTUP_LOADING_MIN_VISIBLE_MS = 850;
const STARTUP_LOADING_INITIAL_PROGRESS = 8;
const STARTUP_LOADING_CACHED_INITIAL_PROGRESS = 14;
const STARTUP_LOADING_MAX_AHEAD_PERCENT = 15;
const STARTUP_LOADING_PRE_COMPLETE_CAP = 99;
const STARTUP_LOADING_RESOURCE_TARGET_BASE = 8;
const STARTUP_LOADING_RESOURCE_TARGET_RANGE = 86;
const STARTUP_OPPORTUNISTIC_IMAGE_PRELOAD_CONCURRENCY = 4;
const STARTUP_OPPORTUNISTIC_IMAGE_PRELOAD_DELAY_MS = 900;
const STARTUP_OPPORTUNISTIC_IMAGE_PRELOAD_TIMEOUT_MS = 12000;
const STARTUP_OPPORTUNISTIC_RESOURCE_PRELOAD_TIMEOUT_MS = 6000;
const BACKGROUND_IMAGE_PRELOAD_DELAY_MS = 120;
const BACKGROUND_IMAGE_PRELOAD_STAGGER_MS = 16;
const BACKGROUND_IMAGE_PRELOAD_ATTEMPTS = 3;
const BACKGROUND_IMAGE_PRELOAD_RETRY_DELAY_MS = 1400;
const LEADERBOARD_REFRESH_INTERVAL_MS = 60000;
const LEADERBOARD_REFRESH_AFTER_SCORE_MS = 1600;
const MUSIC_TRACK_LOAD_RETRY_MS = 700;
const MUSIC_TRACK_LOAD_RETRY_LIMIT = 1;
const LOCAL_PREVIEW_LEADERBOARD_ROWS = [
  { rank: 1, nickname: "沈砚川", universityName: "同济建筑学院", score: 1860, endingTitle: "大师事务所" },
  { rank: 2, nickname: "陈星河", universityName: "东南建筑学院", score: 1810, endingTitle: "国企设计院" },
  { rank: 3, nickname: "林知遥", universityName: "华南理工建筑学院", score: 1765, endingTitle: "留校保研" },
  { rank: 4, nickname: "周南乔", universityName: "重庆大学建筑城规学院", score: 1690, endingTitle: "外企事务所" },
  { rank: 5, nickname: "许未央", universityName: "天津大学建筑学院", score: 1645, endingTitle: "教师编制" },
  { rank: 6, nickname: "叶青檐", universityName: "西安建筑科技大学", score: 1590, endingTitle: "事业单位" },
  { rank: 7, nickname: "顾时雨", universityName: "哈工大建筑学院", score: 1515, endingTitle: "AI 产品经理" },
  { rank: 8, nickname: "方野", universityName: "南大建筑与城市规划学院", score: 1460, endingTitle: "游戏场景建模师" },
  { rank: 9, nickname: "唐小满", universityName: "浙江大学建工学院", score: 1405, endingTitle: "内容编辑" },
  { rank: 10, nickname: "何亦白", universityName: "湖南大学建筑学院", score: 1355, endingTitle: "地方设计院" },
  { rank: 11, nickname: "罗砚", universityName: "山建大建筑城规学院", score: 1300, endingTitle: "独立小型工作室" },
  { rank: 12, nickname: "江听澜", universityName: "北京建筑大学", score: 1255, endingTitle: "考公上岸" },
  { rank: 13, nickname: "温序", universityName: "大工建筑艺术学院", score: 1200, endingTitle: "稳定毕业" },
  { rank: 14, nickname: "季北辰", universityName: "深大建筑与城市规划学院", score: 1150, endingTitle: "销售" },
  { rank: 15, nickname: "宋临风", universityName: "厦大建筑与土木工程学院", score: 1105, endingTitle: "行政岗位" },
  { rank: 16, nickname: "白晴川", universityName: "武大城市设计学院", score: 1050, endingTitle: "继续备考" },
  { rank: 17, nickname: "当前玩家", universityName: "你的建筑大学", score: 1010, endingTitle: "稳定毕业", isSelf: true },
  { rank: 18, nickname: "陆予安", universityName: "苏科大建筑城规学院", score: 960, endingTitle: "求职待定" },
  { rank: 19, nickname: "夏栀", universityName: "合工大建筑艺术学院", score: 920, endingTitle: "回乡待招录" },
  { rank: 20, nickname: "赵一禾", universityName: "沈阳建筑大学建筑学院", score: 880, endingTitle: "基础服务" },
];
const LOCAL_PREVIEW_LEADERBOARD_SELF_ROW = LOCAL_PREVIEW_LEADERBOARD_ROWS.find((row) => row.isSelf) ?? null;
const QUESTION_COUNTDOWN_FALLBACK_SECONDS = 30;
const QUESTION_COUNTDOWN_TIMEOUT_OPTION_ID = "__question_timeout";
const ANSWER_MODAL_TYPES = new Set([
  "course_exam_intro",
  "course_question",
  "course_result",
  "ielts_exam_intro",
  "ielts_question",
  "ielts_exam_result",
  "route_commit",
  "route_exam_intro",
  "route_question",
  "route_exam_result",
]);
const ANSWER_MODAL_RESULT_TYPES = new Set([
  "course_result",
  "ielts_exam_result",
  "route_exam_result",
]);
const MOBILE_ENTRY_DIALOG_IDS = new Set([
  "mobile_start_blocked",
  "coffee",
  "leaderboard",
  "announcement",
]);
const MOBILE_ENTRY_EXTERNAL_IDS = new Set(["author", "community"]);
const MOBILE_ENTRY_SHELL_COMMANDS = new Set([
  "zoom-support-qr",
  "close-support-qr-preview",
  "close-ui-dialog",
  "toggle-theme",
  "set-theme",
  "set-language",
]);
const ANSWER_MODAL_SELECTOR = [...ANSWER_MODAL_TYPES]
  .map((type) => `.modal-backdrop-${type}`)
  .join(",");
const SOFT_NAV_MODAL_CLASSES = [
  "public-service-modal",
  "internship-work-modal",
  "overseas-route-modal",
  "academic-route-modal",
  "ielts-registration-modal",
  "career-change-modal",
];
const SOFT_NAV_DIALOG_SELECTOR = SOFT_NAV_MODAL_CLASSES
  .map((className) => `.${className}`)
  .join(",");
const SOFT_NAV_REUSABLE_TRANSITIONS = new Set([
  "overseas-route-modal->ielts-registration-modal",
]);
const NEW_PLAYER_GUIDE_STEPS = [
  {
    selectors: [
      ".game-shell .action-section > .section-head",
      ".game-shell .log-calendar-line",
    ],
    title: "建筑生存五年制",
    body: "这是一场持续五年的建筑生涯模拟。\n每年 12 周，每学期 6 周，每周 3 次行动机会。\n你做出的每个选择，都会把你推向不同的未来。",
    cardWidthOffset: "50pt",
    splitRings: true,
  },
  {
    selector: ".game-shell .action-section",
    title: "本周行动",
    body: "这里决定你这一周要做什么。\n自由度很高，不过，\n千万忘记了你的设计课作业！",
  },
  {
    selectors: [
      ".game-shell .action-id-design_iteration",
      ".game-shell .action-id-site_research",
      ".game-shell .action-id-normal_drawing",
      ".game-shell .action-id-crunch_drawing",
    ],
    title: "设计课怎么活着过？",
    bodyHtml: '作业进度 靠正常速度画图 推进，通宵可以救急，<br>但别把它当日常打法。<br><span class="new-player-guide-spaced-line">作业质量靠 方案推敲 和 场地调研。</span>',
    bodyClass: "new-player-guide-tight-copy",
    cardWidthOffset: "70pt",
  },
  {
    selector: ".game-shell .right-rail .course-card",
    title: "设计课程",
    bodyHtml: [
      "进度是及格线，质量是分数线。",
      '<span class="new-player-guide-danger-line">进度 完成百分之90即算过关，否则挂科！</span>',
      '<span class="new-player-guide-danger-line">质量 决定了你的评图成绩，低于60也是挂科！</span>',
      "评图就是拿这两条来给你打分，",
      '<span class="new-player-guide-danger-line">一条没达标，这学期的图纸就等于白画了。</span>',
    ].join("<br>"),
  },
  {
    selectors: [
      ".game-shell .action-id-learn_ai_software",
      ".game-shell .action-id-read_exhibition",
    ],
    title: "学习与提升",
    body: "做设计不是一厢情愿就行的，\n没有审美，作品很难站住，\n没有技术，想法很难落地！",
  },
  {
    selectors: [
      ".game-shell .action-id-socialize",
      ".game-shell .action-id-rest",
    ],
    title: "注意身体",
    body: "压力爆表、精力掉线的时候，先别和设计作业硬碰硬。\n玩一会儿，睡一会儿，放松和恢复不是偷懒，是续命！",
    cardWidthOffset: "85pt",
  },
  {
    selectors: [
      ".game-shell .action-id-outsourcing",
      ".game-shell .action-id-part_time",
    ],
    title: "没钱了怎么办？",
    body: "还能怎么办？去赚啊！\n能接外包就接外包，能兼职就去兼职。",
  },
  {
    selector: ".game-shell .status-console",
    title: "状态面板",
    body: "精力、压力、金钱、GPA 以及角色专属技能都在这里。\n注意你的精力和压力，\n状态太差会影响后续行动与结算。",
    cardWidthOffset: "45pt",
  },
  {
    selector: ".game-shell .log-hero",
    title: "日志区",
    body: "行动、事件和购买记录都会写到这里。\n看不懂刚才发生了什么，可以先回到日志找线索。",
    cardWidthOffset: "30pt",
  },
  {
    selector: ".game-shell .system-panel",
    title: "系统入口",
    body: "这里是本游戏最有趣的部分，\n画图之外，这里还有你五年里不该错过的所有岔路。",
    cardWidthOffset: "60pt",
  },
  {
    selector: ".game-shell .corner-entry-button",
    title: "建筑生的万里路",
    body: "专教之外，还有一个更大的世界等着你去探索！",
    cardWidthOffset: "15pt",
  },
  {
    selector: ".game-shell .right-rail .profile-card",
    title: "角色与能力",
    body: "你以为你只是在画图？其实你在偷偷升级。\n设计、软件、审美、表达、人际、抗压，\n每一个都是在专教里慢慢磨出来的。",
  },
  {
    selector: ".game-shell .right-rail .right-entry-panel",
    title: "作品集与简历",
    body: "你想成为什么样的人？\n那些你画过的图、走过的路、做过的选择，\n会被系统默默记住，最后变成你毕业时的底气。",
    cardWidthOffset: "15pt",
  },
  {
    selector: ".game-shell .right-rail .mentor-card",
    title: "导师任务",
    body: "导师的任务就是你五年里的“隐藏主线”。\n完成它，你的设计课会顺一点；\n拖着不做，你会发现后面越来越吃力。",
  },
  {
    selector: ".game-shell > .game-music-dock",
    title: "校园电台",
    body: "专教不能没有音乐，就像图纸不能没有轴线。\n选一首歌，让它陪你拉完今晚的线。",
  },
  {
    selector: ".game-shell .settings-corner-button",
    title: "快捷设置",
    body: "记住这个位置，迷路时先来这里。",
  },
  {
    selector: ".game-shell",
    title: "故事的起点",
    body: "你的五年建筑人生就此开始，\n同学，你准备好了吗？",
    cardWidthOffset: "25pt",
    fullDarkBackdrop: true,
  },
];
const NEW_PLAYER_GUIDE_PADDING = 10;
const NEW_PLAYER_GUIDE_GAP = 16;
const NEW_PLAYER_GUIDE_VIEWPORT_INSET = 16;
const GRADUATION_DESIGN_GUIDE_STEP = {
  selector: ".game-shell .right-rail .course-card",
  kicker: "毕业设计阶段",
  title: "毕业设计",
  titleIcon: UI_ICON_PATHS.graduation_design,
  bodyHtml: [
    "同学请注意，大五学年将进入毕业设计阶段。",
    '<span class="new-player-guide-danger-line">你需要在毕业前把进度至少推进到 240，质量至少达到 150，</span>',
    "才能顺利完成最终答辩，加油建院人！",
  ].join("<br>"),
  cardWidthOffset: "123pt",
  primaryLabel: "收到，开始推进",
};

const app = document.querySelector("#app");
const runtimeCacheControlPromise = ensureRuntimeCacheControl();
const startupTimingMarks = [];
let startupTimingLogged = false;
let state = null;
let collection = createEmptyCollection();
let bootReady = false;
let loadingVisible = false;
let loadingProgress = 0;
let loadingActualProgress = 0;
let loadingVersionNotice = "";
let loadingProgressTimer = null;
let startMode = "menu";
let uiDialog = null;
let theme = resolveInitialTheme();
let uiLanguage = normalizeUiLanguage(localStorage.getItem(LANGUAGE_KEY));
const mobileStartMedia = window.matchMedia(MOBILE_START_MEDIA_QUERY);
let isMobileStartSurface = resolveMobileStartSurface();
let lyrics = [];
let loadedLyricsSrc = "";
let lyricsRequestId = 0;
let currentLyricIndex = -2;
let currentEndingMemoryLyricIndex = -2;
const selectedEndingMusicPreloadKeys = new Set();
let currentClock = formatClock(new Date());
let autoResumePending = false;
let lastRenderedView = "";
let musicProgressFrame = null;
let questionCountdownTimer = null;
let questionCountdownKey = "";
let questionCountdownEndsAt = 0;
let achievementToastTimer = null;
let achievementToastNextExpiryAt = null;
let collectionAchievementToasts = [];
let collectionAchievementToastTimer = null;
let collectionAchievementToastNextExpiryAt = null;
let uiDialogCloseTimer = null;
let endingScreenshotFeedbackTimer = null;
let endingScreenshotSaveInProgress = false;
let endingScreenshotSaveRequestId = 0;
let pendingCharacterDrawIntro = false;
let characterDrawRevealTimer = null;
let musicFadeFrame = null;
let pendingFadedTrackSrc = "";
let musicPlayRequest = null;
let musicPlayRequestAudio = null;
let musicPlayRequestSrc = "";
let musicAssetRequestId = 0;
let musicAudioContext = null;
const musicGainNodes = new WeakMap();
let endingMemoryRuntimeWarmupPromise = null;
let endingMemoryAudioStartTimer = null;
let endingMemoryAudioFadeFrame = null;
let endingMemoryDockIntroTimer = null;
let endingMemoryDockIntroShell = null;
let endingMemoryDockExitTimer = null;
let graduationFlowSwapTimer = null;
let graduationFlowSwapCleanupTimer = null;
let graduationFlowSwapToken = 0;
let endingMemoryExitAudioRestorePending = false;
let pendingSpecialSkillFeedback = null;
let pendingStartMusicAutoplay = false;
let endingMemoryAnimationPreload = null;
let endingMemoryInitialImagesPreload = null;
let endingMemoryAnimationPreloadFailureCount = 0;
let endingMemoryAnimationWarmupQueued = false;
let endingMemorySceneImagePreloadsQueued = false;
let endingAssetSprintWarmupQueued = false;
let gameplayBackgroundPreloadsQueued = false;
let postStartAssetPreloadsQueued = false;
let pendingStartupAssetRetriesQueued = false;
const queuedStartupOpportunisticImagePreloadSources = new Set();
const queuedEndingIllustrationPreloadSources = new Set();
let pendingStartupRetryImageSources = [];
let pendingStartupRetryMediaSources = [];
let newPlayerGuideStepIndex = -1;
let newPlayerGuideFrame = null;
let graduationDesignGuideActive = false;
let graduationDesignGuidePending = false;
let pendingGuideAfterThemeDialog = false;
let remoteLeaderboardRows = MONITOR_API_BASE ? [] : LOCAL_PREVIEW_LEADERBOARD_ROWS;
let remoteLeaderboardSelfRow = MONITOR_API_BASE ? null : LOCAL_PREVIEW_LEADERBOARD_SELF_ROW;
let leaderboardFetchPromise = null;
let leaderboardLastFetchedAt = 0;
let startProfileError = "";
let startProfileDraft = null;
const startedEndingTelemetryKeys = new Set();
const imagePreloadHandles = new Map();
const imagePreloadPromises = new Map();
const mediaPreloadPromises = new Map();
const runtimeCacheWritePromises = new Map();
let runtimeCacheWriteFailed = false;
const playableAudioWarmupHandles = new Map();
const playableAudioWarmupPromises = new Map();
const failedTrackSources = new Set();
const musicState = {
  playlistId: "",
  trackId: "",
  src: "",
  currentTime: 0,
  paused: false,
  volume: 1,
  playbackRate: 1,
  manual: false,
  manualLyrics: false,
  playlistIndex: 0,
};

function resolveInitialTheme() {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  if (resolveMobileStartSurface()) return "dark";
  return "dark";
}

function resolveMobileStartSurface() {
  if (SURFACE_PARAM === "mobile") return true;
  if (SURFACE_PARAM === "desktop") return false;
  return window.matchMedia(MOBILE_START_MEDIA_QUERY).matches;
}

document.documentElement.dataset.theme = "dark";
syncDocumentLanguage();
document.documentElement.dataset.testCopy = SENIOR_TEST_COPY_MODE ? "senior" : "false";
installResourceHints();

if (SENIOR_TEST_COPY_MODE) {
  state = createSeniorTestCopyState();
  applySeniorTestCopyPreviewState(state);
  attachHistoricalEventIds(state);
} else {
  loadCollection().then((loadedCollection) => {
    collection = loadedCollection;
    if (state) hydrateStateFromCollection(state, collection);
    render();
    queueLeaderboardRefreshAfterPending({ force: true });
  }).catch((error) => {
    console.warn("Failed to load collection", error);
    queueLeaderboardRefreshAfterPending({ force: true });
  });
}

function applySeniorTestCopyPreviewState(targetState) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("memory") !== "ending") return;
  targetState.phase = "ending_memory";
  targetState.pendingInteraction = {
    type: "ending_memory",
    title: "结尾回忆",
    kicker: "固定流程",
    memoryStep: "ending_animation",
    body: "结尾回忆动画播放中。",
    blocks: true,
    options: [{ id: "confirm", label: "同学，毕业快乐！" }],
  };
  targetState.modalQueue = [];
  targetState.pendingEnding = "stable_graduation";
  targetState.ending = null;
  targetState.musicYearStarted = true;
}

function installResourceHints() {
  const origins = new Set([
    resourceOrigin(R2_ASSET_BASE_URL),
    resourceOrigin(DOMESTIC_ASSET_BASE_URL),
    ...ENDING_MEMORY_RUNTIME_SOURCES.map(resourceOrigin),
  ].filter(Boolean));
  origins.delete(window.location.origin);
  for (const origin of origins) {
    addResourceHint("dns-prefetch", origin);
    addResourceHint("preconnect", origin, { crossOrigin: true });
  }
}

function resourceOrigin(source) {
  try {
    return new URL(source, window.location.href).origin;
  } catch {
    return "";
  }
}

function addResourceHint(rel, href, {
  crossOrigin = false,
  as = "",
  type = "",
  fetchPriority = "",
} = {}) {
  if (!href || !document.head) return;
  let normalizedHref = href;
  try {
    normalizedHref = new URL(href, window.location.href).href;
  } catch {}
  const exists = Array.from(document.head.querySelectorAll(`link[rel="${rel}"]`))
    .some((link) => link.href === normalizedHref || link.getAttribute("href") === href);
  if (exists) return;
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  if (as) link.as = as;
  if (type) link.type = type;
  if (fetchPriority) {
    link.fetchPriority = fetchPriority;
    link.setAttribute("fetchpriority", fetchPriority);
  }
  if (crossOrigin) link.setAttribute("crossorigin", "");
  document.head.append(link);
}

function appendStartupPreloadHints(imageSources) {
  for (const source of imageSources.slice(0, STARTUP_PRELOAD_HINT_IMAGE_COUNT)) {
    addResourceHint("preload", assetUrl(source), {
      as: "image",
      fetchPriority: "high",
    });
  }
}

startBootSequence();
render();

setInterval(() => {
  currentClock = formatClock(new Date());
  if (bootReady) {
    updateClock();
  }
}, 1000);

bindMobileStartMediaQuery();
window.addEventListener("resize", refreshNewPlayerGuideOverlay);
window.addEventListener("scroll", refreshNewPlayerGuideOverlay, { passive: true, capture: true });
document.addEventListener("keydown", handleNewPlayerGuideKeydown);
document.addEventListener("error", handleRuntimeImageError, true);
reportSiteVisit({ surface: telemetrySurface() });
startMonitorHeartbeat(() => state, { surface: telemetrySurface });
if (SENIOR_TEST_COPY_MODE) queueLeaderboardRefreshAfterPending({ force: true });

async function startBootSequence() {
  markStartupTiming("boot-start");
  loadingVisible = true;
  loadingVersionNotice = "";
  nudgeLoadingProgress(STARTUP_LOADING_INITIAL_PROGRESS);
  startLoadingProgress();
  render();
  const loadingStartedAt = performance.now();
  const baseStartupImageSources = criticalStartupImageSources({ isMobileStartSurface });
  const baseStartupMediaSources = startupGateMediaSources();
  const startupFontLoadPromise = waitForStartupFonts();
  const gameFontLoadPromise = waitForGameFonts();
  appendStartupPreloadHints(baseStartupImageSources);
  markStartupTiming("startup-preload-hints", {
    images: Math.min(baseStartupImageSources.length, STARTUP_PRELOAD_HINT_IMAGE_COUNT),
    media: 0,
  });
  await waitWithinStartupGateBudget(Promise.allSettled([
    startupFontLoadPromise,
    waitForStartupLoadingShellImages(),
  ]), performance.now() + STARTUP_LOADING_SHELL_READY_TIMEOUT_MS);
  markStartupTiming("loading-shell-ready");

  const startupPreloadMarked = hasCompletedStartupPreload();
  const startupPreloadCached = await validateStartupPreloadCacheIfMarked(startupPreloadMarked, {
    images: baseStartupImageSources,
    media: baseStartupMediaSources,
  }, {
    timeoutMs: STARTUP_CACHE_SAMPLE_TIMEOUT_MS,
  });
  markStartupTiming("startup-cache-sample", { cached: startupPreloadCached });
  nudgeLoadingProgress(startupPreloadCached
    ? STARTUP_LOADING_CACHED_INITIAL_PROGRESS
    : STARTUP_LOADING_INITIAL_PROGRESS);
  render();

  const versionGatePassed = await enforceStartupVersionGate();
  if (!versionGatePassed) return;
  markStartupTiming("version-gate-passed");

  const previousFailedResources = loadStartupFailedResources();
  const startupReentryFastPath = startupPreloadCached
    || hasReleasedStartupGate()
    || hasLocalSave()
    || hasStartupRepairSources(previousFailedResources);
  const cachedStartupImageSourceSet = new Set(baseStartupImageSources);
  const cachedStartupImageSources = startupCacheSampleSources({
    images: baseStartupImageSources,
    media: [],
  }, {
    imageCount: STARTUP_CACHE_SAMPLE_IMAGE_COUNT,
    mediaCount: 0,
  }).images;
  const startupImageSources = prioritizeSourcesByPreviousFailures(
    startupReentryFastPath
      ? [
        ...cachedStartupImageSources,
        ...previousFailedResources.images.filter((source) => cachedStartupImageSourceSet.has(source)),
      ]
      : baseStartupImageSources,
    previousFailedResources.images,
  );
  const startupMediaSources = startupReentryFastPath
    ? []
    : prioritizeSourcesByPreviousFailures(
      baseStartupMediaSources,
      previousFailedResources.media,
    );
  clearStartupPreloadComplete();
  runtimeCacheWriteFailed = false;

  const startupGateWaitMs = startupReentryFastPath
    ? STARTUP_GATE_CACHED_MAX_WAIT_MS
    : Math.min(STARTUP_GATE_TARGET_WAIT_MS, STARTUP_GATE_MAX_WAIT_MS);
  const startupGateDeadlineAt = performance.now() + startupGateWaitMs;
  markStartupTiming("startup-gate-budget", {
    cached: startupPreloadCached,
    reentry: startupReentryFastPath,
    waitMs: startupGateWaitMs,
    hardWaitMs: STARTUP_GATE_MAX_WAIT_MS,
    images: startupImageSources.length,
    media: startupMediaSources.length,
  });
  queueStartupOpportunisticImagePreloads();
  let startupGateReleasedWithFailures = false;
  let pendingImageSources = startupImageSources;
  let pendingMediaSources = startupMediaSources;
  let imagePreloadResult = null;
  let mediaPreloadResult = null;
  while (true) {
    const pendingRepairSources = {
      images: pendingImageSources,
      media: pendingMediaSources,
    };
    if (shouldReleaseStartupGateAfterRepair({
      repairSources: pendingRepairSources,
      now: performance.now(),
      deadlineAt: startupGateDeadlineAt,
    })) {
      saveStartupFailedResources(pendingRepairSources);
      pendingStartupRetryImageSources = pendingRepairSources.images;
      pendingStartupRetryMediaSources = pendingRepairSources.media;
      startupGateReleasedWithFailures = true;
      break;
    }
    ({ imagePreloadResult, mediaPreloadResult } = await preloadStartupGateAttempt({
      imageSources: pendingImageSources,
      mediaSources: pendingMediaSources,
      cachedMediaFastPath: startupPreloadCached,
      deadlineAt: startupGateDeadlineAt,
    }));
    const repairSources = startupRepairSources({
      imageResult: imagePreloadResult,
      mediaResult: mediaPreloadResult,
    });
    if (!hasStartupRepairSources(repairSources)) {
      break;
    }
    saveStartupFailedResources(repairSources);
    pendingStartupRetryImageSources = repairSources.images;
    pendingStartupRetryMediaSources = repairSources.media;
    pendingImageSources = repairSources.images;
    pendingMediaSources = repairSources.media;
    if (shouldReleaseStartupGateAfterRepair({
      repairSources,
      now: performance.now(),
      deadlineAt: startupGateDeadlineAt,
    })) {
      startupGateReleasedWithFailures = true;
      break;
    }
    nudgeLoadingProgress(96);
    render();
    const retryDelayMs = repairSources.images.length
      ? STARTUP_RESOURCE_REPAIR_RETRY_DELAY_MS
      : Math.min(
        STARTUP_RESOURCE_REPAIR_RETRY_DELAY_MS,
        remainingStartupGateWaitMs(startupGateDeadlineAt),
      );
    if (retryDelayMs > 0) await wait(retryDelayMs);
  }

  await waitWithinStartupGateBudget(gameFontLoadPromise, startupGateDeadlineAt);
  markStartupTiming("game-fonts-ready");
  const runtimeCacheFlushTimeoutMs = Math.min(
    RUNTIME_CACHE_WRITE_FLUSH_TIMEOUT_MS,
    remainingStartupGateWaitMs(startupGateDeadlineAt),
  );
  const runtimeCacheReady = startupReentryFastPath && !startupGateReleasedWithFailures
    ? true
    : !startupGateReleasedWithFailures && runtimeCacheFlushTimeoutMs > 0
      ? await flushRuntimeCacheWrites({ timeoutMs: runtimeCacheFlushTimeoutMs })
      : false;
  markStartupTiming("runtime-cache-flush", {
    ready: runtimeCacheReady,
    cachedFastPath: startupPreloadCached,
    reentryFastPath: startupReentryFastPath,
  });
  const canMarkStartupPreloadComplete = runtimeCacheReady && (startupPreloadCached || !startupReentryFastPath);

  if (!startupGateReleasedWithFailures) {
    pendingStartupRetryImageSources = [];
    pendingStartupRetryMediaSources = [];
    if (!startupReentryFastPath) {
      clearStartupFailedResources();
    }
    if (canMarkStartupPreloadComplete) {
      markStartupPreloadComplete();
    }
  }
  markStartupGateReleased();
  loadingVersionNotice = "";
  loadingActualProgress = 100;
  loadingProgress = 100;
  render();
  markStartupTiming("startup-gate-complete");
  finishBootSequence({ loadingStartedAt });
}

async function enforceStartupVersionGate() {
  const manifest = await fetchStartupVersionManifest();
  const status = versionGateStatus(manifest, APP_VERSION);
  if (!status.requiresUpdate) {
    clearStartupVersionReloadAttempts();
    return true;
  }

  loadingVersionNotice = VERSION_GATE_UPDATE_MESSAGE;
  nudgeLoadingProgress(18);
  render();
  await clearRuntimeVersionCaches();
  if (markStartupVersionReloadAttempt(status)) {
    window.setTimeout(() => window.location.reload(), STARTUP_VERSION_RELOAD_DELAY_MS);
  }
  return false;
}

async function fetchStartupVersionManifest() {
  const results = await Promise.allSettled([fetchStartupVersionManifestFromOrigin(window.location.origin)]);
  return newestVersionManifest(results.map((result) => result.status === "fulfilled" ? result.value : null));
}

async function fetchStartupVersionManifestFromOrigin(origin) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), STARTUP_VERSION_CHECK_TIMEOUT_MS);
  try {
    const url = new URL(VERSION_MANIFEST_PATH, origin);
    url.searchParams.set("t", String(Date.now()));
    const response = await fetch(url.href, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Version manifest request failed: ${response.status}`);
    return await response.json();
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function clearRuntimeVersionCaches() {
  clearStartupPreloadCompletions();
  clearStartupGateReleaseMarkers();
  clearStartupFailedResourceCaches();
  const tasks = [];
  if (window.caches?.keys) {
    tasks.push(window.caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => name.startsWith(RUNTIME_CACHE_NAME_PREFIX))
        .map((name) => window.caches.delete(name)))));
  }
  if (navigator.serviceWorker?.getRegistrations) {
    tasks.push(navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.update().catch(() => {})))));
  }
  await Promise.allSettled(tasks);
}

function markStartupVersionReloadAttempt(status) {
  try {
    const key = `${STARTUP_VERSION_RELOAD_ATTEMPT_KEY}:${APP_VERSION}:${status.latestVersion}`;
    if (sessionStorage.getItem(key) === "1") return false;
    sessionStorage.setItem(key, "1");
  } catch {}
  return true;
}

function clearStartupVersionReloadAttempts() {
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(STARTUP_VERSION_RELOAD_ATTEMPT_KEY)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {}
}

function startupGateMediaSources() {
  if (isMobileStartSurface) return [];
  return startupGateBgmTracks().map((track) => track.src).filter(Boolean);
}

function remainingStartupGateWaitMs(deadlineAt) {
  const deadline = Number(deadlineAt);
  if (!Number.isFinite(deadline)) return 0;
  return Math.max(0, Math.ceil(deadline - performance.now()));
}

function preloadTimeoutWithinStartupGate(deadlineAt, fallbackTimeoutMs) {
  const remainingMs = remainingStartupGateWaitMs(deadlineAt);
  if (remainingMs <= 0) return 0;
  const fallback = Math.max(0, Number(fallbackTimeoutMs) || 0);
  return fallback > 0 ? Math.min(fallback, remainingMs) : remainingMs;
}

function incompleteStartupPreloadResult(sources) {
  const remainingSources = [...new Set((Array.isArray(sources) ? sources : []).filter(Boolean))];
  return {
    ok: remainingSources.length === 0,
    timedOut: remainingSources.length > 0,
    total: remainingSources.length,
    complete: 0,
    successful: 0,
    successfulSources: [],
    remainingSources,
  };
}

function waitWithinStartupGateBudget(promise, deadlineAt) {
  const timeoutMs = remainingStartupGateWaitMs(deadlineAt);
  if (timeoutMs <= 0) return Promise.resolve(false);
  return Promise.race([
    promise.then(() => true, () => false),
    wait(timeoutMs).then(() => false),
  ]);
}

async function preloadStartupGateAttempt({
  imageSources = [],
  mediaSources = [],
  cachedMediaFastPath = false,
  deadlineAt = 0,
} = {}) {
  let startupImageSuccess = 0;
  let startupMediaSuccess = 0;
  const startupImageTotal = imageSources.length;
  const startupMediaTotal = mediaSources.length;
  let mediaPreloadPromise = null;
  const syncStartupProgress = () => {
    const imageRatio = startupImageTotal > 0 ? startupImageSuccess / startupImageTotal : 1;
    const mediaRatio = startupMediaTotal > 0 ? startupMediaSuccess / startupMediaTotal : 1;
    const hasImagesAndMedia = startupImageTotal > 0 && startupMediaTotal > 0;
    const imageWeight = hasImagesAndMedia ? 0.78 : startupImageTotal > 0 ? 1 : 0;
    const mediaWeight = hasImagesAndMedia ? 0.22 : startupMediaTotal > 0 ? 1 : 0;
    const ratio = Math.min(1, imageRatio * imageWeight + mediaRatio * mediaWeight);
    nudgeLoadingProgress(
      STARTUP_LOADING_RESOURCE_TARGET_BASE + ratio * STARTUP_LOADING_RESOURCE_TARGET_RANGE,
      ratio * 100,
    );
    render();
  };
  const startStartupMediaPreload = () => {
    if (mediaPreloadPromise) return mediaPreloadPromise;
    const delayMs = startupImageTotal > 0 && startupMediaTotal > 0
      ? STARTUP_AUDIO_PRELOAD_START_DELAY_MS
      : 0;
    mediaPreloadPromise = (delayMs > 0 ? wait(delayMs) : Promise.resolve()).then(() => {
      const timeoutMs = preloadTimeoutWithinStartupGate(deadlineAt, STARTUP_AUDIO_PRELOAD_TIMEOUT_MS);
      if (timeoutMs <= 0) return incompleteStartupPreloadResult(mediaSources);
      markStartupTiming("startup-audio-start", {
        total: startupMediaTotal,
        cachedFastPath: cachedMediaFastPath,
      });
      return preloadStartupMediaSourcesForGate(mediaSources, {
        timeoutMs,
        cachedFastPath: cachedMediaFastPath,
        onProgress: (successful) => {
          startupMediaSuccess = successful;
          syncStartupProgress();
        },
      });
    });
    return mediaPreloadPromise;
  };

  syncStartupProgress();
  startStartupMediaPreload();
  const imageTimeoutMs = preloadTimeoutWithinStartupGate(deadlineAt, STARTUP_IMAGE_PRELOAD_TIMEOUT_MS);
  const imagePreloadResult = imageTimeoutMs <= 0
    ? incompleteStartupPreloadResult(imageSources)
    : await preloadStartupImagesForGate(imageSources, {
      timeoutMs: imageTimeoutMs,
      onProgress: (successful) => {
        startupImageSuccess = successful;
        syncStartupProgress();
      },
    });
  startupImageSuccess = imagePreloadResult.successful;
  markStartupTiming("startup-images-done", {
    total: imagePreloadResult.total,
    successful: imagePreloadResult.successful,
    timedOut: imagePreloadResult.timedOut,
  });
  syncStartupProgress();
  const mediaPreloadResult = await startStartupMediaPreload();
  startupMediaSuccess = mediaPreloadResult.successful;
  markStartupTiming("startup-audio-done", {
    total: mediaPreloadResult.total,
    successful: mediaPreloadResult.successful,
    timedOut: mediaPreloadResult.timedOut,
  });
  syncStartupProgress();
  return { imagePreloadResult, mediaPreloadResult };
}

function startupAudioPreloadConcurrency() {
  return startupAudioPreloadPlan().concurrency;
}

function startupImagePreloadPlan() {
  return preloadConcurrencyPlan("startup-images", adaptivePreloadConcurrency({ high: 4, medium: 3, low: 2 }), {
    minConcurrency: 2,
  });
}

function startupAudioPreloadPlan() {
  return preloadConcurrencyPlan("startup-audio", adaptivePreloadConcurrency({
    high: STARTUP_AUDIO_PRELOAD_CONCURRENCY,
    medium: 2,
    low: 1,
  }));
}

function priorityAudioPreloadPlan() {
  return preloadConcurrencyPlan("priority-audio", adaptivePreloadConcurrency({
    high: PRIORITY_AUDIO_PRELOAD_CONCURRENCY,
    medium: 2,
    low: 1,
  }));
}

function backgroundBgmPreloadPlan() {
  return preloadConcurrencyPlan("background-audio", adaptivePreloadConcurrency({
    high: BACKGROUND_BGM_PRELOAD_CONCURRENCY,
    medium: 2,
    low: 1,
  }), {
    minConcurrency: 1,
  });
}

function preloadConcurrencyPlan(kind, baseConcurrency, { minConcurrency = 1 } = {}) {
  const hint = loadPreloadConcurrencyHint(kind);
  return {
    baseConcurrency,
    concurrency: tunedPreloadConcurrency(baseConcurrency, hint, { minConcurrency }),
    minConcurrency,
  };
}

function recordPreloadConcurrencyResult(kind, plan, result, {
  decreaseStep = 1,
  increaseStep = 1,
} = {}) {
  const currentHint = loadPreloadConcurrencyHint(kind);
  const nextHint = nextPreloadConcurrencyHint(result, {
    baseConcurrency: plan.baseConcurrency,
    usedConcurrency: plan.concurrency,
    currentHint,
    minConcurrency: plan.minConcurrency,
    decreaseStep,
    increaseStep,
  });
  if ((currentHint?.cap ?? plan.baseConcurrency) === nextHint.cap) return;
  savePreloadConcurrencyHint(kind, nextHint);
}

function loadPreloadConcurrencyHint(kind) {
  try {
    const hints = JSON.parse(localStorage.getItem(PRELOAD_CONCURRENCY_HINT_KEY) || "{}");
    return hints && typeof hints === "object" ? hints[kind] ?? null : null;
  } catch {
    return null;
  }
}

function savePreloadConcurrencyHint(kind, hint) {
  try {
    const hints = JSON.parse(localStorage.getItem(PRELOAD_CONCURRENCY_HINT_KEY) || "{}");
    const nextHints = hints && typeof hints === "object" ? hints : {};
    nextHints[kind] = hint;
    localStorage.setItem(PRELOAD_CONCURRENCY_HINT_KEY, JSON.stringify(nextHints));
  } catch {}
}

function adaptivePreloadConcurrency({ high, medium, low }) {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return Math.max(1, high);
  const effectiveType = String(connection.effectiveType || "").toLowerCase();
  const downlink = Number(connection.downlink) || 0;
  if (connection.saveData || effectiveType === "slow-2g" || effectiveType === "2g" || (downlink > 0 && downlink < 0.8)) {
    return Math.max(1, low);
  }
  if (effectiveType === "3g" || (downlink > 0 && downlink < 2.2)) {
    return Math.max(1, medium);
  }
  return Math.max(1, high);
}

async function preloadStartupMediaForGate(sources, {
  timeoutMs = STARTUP_AUDIO_PRELOAD_TIMEOUT_MS,
  cachedFastPath = false,
  onProgress = () => {},
} = {}) {
  if (!sources.length) {
    return {
      ok: true,
      timedOut: false,
      total: 0,
      complete: 0,
      successful: 0,
      successfulSources: [],
      remainingSources: [],
    };
  }
  await waitForRuntimeCacheControl({ timeoutMs: STARTUP_RUNTIME_CACHE_CONTROL_TIMEOUT_MS });
  const plan = startupAudioPreloadPlan();
  const loadMedia = cachedFastPath ? preloadMediaForGate : preloadPlayableAudioForGate;
  const result = await loadMedia(sources, {
    timeoutMs,
    resourceTimeoutMs: STARTUP_RESOURCE_PRELOAD_TIMEOUT_MS,
    concurrency: plan.concurrency,
    requireSuccess: true,
    onProgress,
  });
  recordPreloadConcurrencyResult("startup-audio", plan, result);
  return result;
}

async function preloadStartupImagesForGate(sources, {
  timeoutMs = STARTUP_IMAGE_PRELOAD_TIMEOUT_MS,
  onProgress = () => {},
} = {}) {
  const plan = startupImagePreloadPlan();
  const result = await preloadStartupSourcesForGate(sources, (pendingSources, progress) => {
    return preloadImagesForGate(pendingSources, {
      timeoutMs,
      resourceTimeoutMs: STARTUP_RESOURCE_PRELOAD_TIMEOUT_MS,
      concurrency: plan.concurrency,
      prioritySources: new Set(pendingSources.slice(0, STARTUP_PRELOAD_HINT_IMAGE_COUNT)),
      requireSuccess: true,
      onProgress: progress,
    });
  }, { onProgress });
  recordPreloadConcurrencyResult("startup-images", plan, result, { decreaseStep: 2 });
  return result;
}

function preloadStartupMediaSourcesForGate(sources, {
  timeoutMs = STARTUP_AUDIO_PRELOAD_TIMEOUT_MS,
  cachedFastPath = false,
  onProgress = () => {},
} = {}) {
  return preloadStartupSourcesForGate(sources, (pendingSources, progress) => {
    return preloadStartupMediaForGate(pendingSources, { timeoutMs, cachedFastPath, onProgress: progress });
  }, { onProgress });
}

async function preloadStartupSourcesForGate(sources, loadPendingSources, { onProgress = () => {} } = {}) {
  const allSources = [...new Set(sources.filter(Boolean))];
  if (!allSources.length) {
    return {
      ok: true,
      timedOut: false,
      total: 0,
      complete: 0,
      successful: 0,
      successfulSources: [],
      remainingSources: [],
    };
  }
  const result = await loadPendingSources(allSources, (_complete, _total, successful) => {
    onProgress(successful);
  });
  onProgress(result.successfulSources.length);
  return {
    ok: result.remainingSources.length === 0,
    timedOut: Boolean(result.timedOut),
    total: result.total ?? allSources.length,
    complete: result.complete ?? result.successfulSources.length,
    successful: result.successfulSources.length,
    successfulSources: result.successfulSources,
    remainingSources: result.remainingSources,
  };
}

function finishBootSequence({ loadingStartedAt, postStartDelayMs = 0 }) {
  const finishDelay = Math.max(240, STARTUP_LOADING_MIN_VISIBLE_MS - (performance.now() - loadingStartedAt));
  window.setTimeout(() => {
    markStartupTiming("boot-ready");
    bootReady = true;
    loadingVisible = false;
    stopLoadingProgress();
    document.documentElement.dataset.theme = theme;
    render();
    logStartupTimingSummary();
    window.setTimeout(queuePendingStartupAssetRetries, postStartDelayMs);
  }, finishDelay);
}

async function waitForStartupFonts() {
  await waitForFontFaces(STARTUP_FONT_FACES);
}

async function waitForGameFonts() {
  await waitForFontFaces(GAME_FONT_FACES);
}

async function waitForFontFaces(fontFaces) {
  if (!document.fonts?.load) return;
  const fontLoads = fontFaces
    .map((fontFace) => document.fonts.load(fontFace.font, fontFace.text));
  await Promise.all(fontLoads);
  if (document.fonts.ready) await document.fonts.ready;
}

async function waitForStartupLoadingShellImages() {
  const sources = startupLoadingShellImageSources();
  if (!sources.length) return;
  await preloadImagesForGate(sources, {
    timeoutMs: STARTUP_RESOURCE_PRELOAD_TIMEOUT_MS,
    resourceTimeoutMs: STARTUP_RESOURCE_PRELOAD_TIMEOUT_MS,
    requireSuccess: true,
  });
}

function startupPreloadCacheKey() {
  return `${STARTUP_PRELOAD_CACHE_KEY}:${startupPreloadSurface()}:${STARTUP_PRELOAD_CACHE_VERSION}`;
}

function startupGateReleasedKey() {
  return `${STARTUP_GATE_RELEASED_KEY}:${startupPreloadSurface()}:${STARTUP_PRELOAD_CACHE_VERSION}`;
}

function startupFailedResourcesKey() {
  return `${STARTUP_FAILED_RESOURCES_KEY}:${startupPreloadSurface()}:${STARTUP_PRELOAD_CACHE_VERSION}`;
}

function startupPreloadSurface() {
  return isMobileStartSurface ? "mobile" : "desktop";
}

function hasCompletedStartupPreload() {
  try {
    return localStorage.getItem(startupPreloadCacheKey()) === "complete";
  } catch {
    return false;
  }
}

function hasReleasedStartupGate() {
  try {
    return localStorage.getItem(startupGateReleasedKey()) === "released";
  } catch {
    return false;
  }
}

function hasLocalSave() {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}

async function validateStartupPreloadCacheIfMarked(markedComplete, sources, { timeoutMs = 0 } = {}) {
  if (!markedComplete) return false;
  const validation = validateStartupPreloadCacheSample(sources);
  const ok = timeoutMs > 0
    ? await Promise.race([
      validation,
      wait(timeoutMs).then(() => false),
    ])
    : await validation;
  if (!ok) clearStartupPreloadComplete();
  return ok;
}

async function validateStartupPreloadCacheSample(sources) {
  if (!window.caches?.open) return true;
  const sample = startupCacheSampleSources(sources, {
    imageCount: STARTUP_CACHE_SAMPLE_IMAGE_COUNT,
    mediaCount: STARTUP_CACHE_SAMPLE_MEDIA_COUNT,
  });
  const urls = [...sample.images, ...sample.media]
    .map(assetUrl)
    .filter(Boolean);
  if (!urls.length) return true;
  try {
    const cache = await window.caches.open(RUNTIME_CACHE_NAME);
    const matches = await Promise.all(urls.map((url) => cache.match(url, { ignoreVary: true })));
    return matches.every(Boolean);
  } catch {
    return false;
  }
}

function markStartupPreloadComplete() {
  try {
    localStorage.setItem(startupPreloadCacheKey(), "complete");
  } catch {}
}

function markStartupGateReleased() {
  try {
    localStorage.setItem(startupGateReleasedKey(), "released");
  } catch {}
}

function clearStartupPreloadComplete() {
  try {
    localStorage.removeItem(startupPreloadCacheKey());
  } catch {}
}

function loadStartupFailedResources() {
  try {
    const parsed = JSON.parse(localStorage.getItem(startupFailedResourcesKey()) || "{}");
    return normalizeStartupFailedResources(parsed);
  } catch {
    return normalizeStartupFailedResources();
  }
}

function saveStartupFailedResources({ images = [], media = [] } = {}) {
  const failedResources = normalizeStartupFailedResources({ images, media });
  if (!failedResources.images.length && !failedResources.media.length) {
    clearStartupFailedResources();
    return;
  }
  try {
    localStorage.setItem(startupFailedResourcesKey(), JSON.stringify({
      savedAt: Date.now(),
      version: STARTUP_PRELOAD_CACHE_VERSION,
      ...failedResources,
    }));
  } catch {}
}

function clearStartupFailedResources() {
  try {
    localStorage.removeItem(startupFailedResourcesKey());
  } catch {}
}

function clearStartupFailedResourceCaches() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(STARTUP_FAILED_RESOURCES_KEY)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}

function removeStartupFailedResources({ images = [], media = [] } = {}) {
  const current = loadStartupFailedResources();
  const imageRemovals = new Set(images);
  const mediaRemovals = new Set(media);
  saveStartupFailedResources({
    images: current.images.filter((source) => !imageRemovals.has(source)),
    media: current.media.filter((source) => !mediaRemovals.has(source)),
  });
}

function normalizeStartupFailedResources(resources = {}) {
  return {
    images: uniqueLimitedSources(resources.images),
    media: uniqueLimitedSources(resources.media),
  };
}

function uniqueLimitedSources(sources) {
  return [...new Set((Array.isArray(sources) ? sources : []).filter(Boolean).map(String))]
    .slice(0, STARTUP_FAILED_RESOURCE_LIMIT);
}

function prioritizeSourcesByPreviousFailures(sources, failedSources = []) {
  const sourceSet = new Set(sources.filter(Boolean));
  const prioritized = uniqueLimitedSources(failedSources).filter((source) => sourceSet.has(source));
  const prioritizedSet = new Set(prioritized);
  return [...prioritized, ...sources.filter((source) => !prioritizedSet.has(source))];
}

function clearStartupPreloadCompletions() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(STARTUP_PRELOAD_CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}

function clearStartupGateReleaseMarkers() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(STARTUP_GATE_RELEASED_KEY)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}

function bindMobileStartMediaQuery() {
  const handleChange = () => {
    isMobileStartSurface = resolveMobileStartSurface();
    if (bootReady) {
      render();
    }
  };
  if (typeof mobileStartMedia.addEventListener === "function") {
    mobileStartMedia.addEventListener("change", handleChange);
  } else if (typeof mobileStartMedia.addListener === "function") {
    mobileStartMedia.addListener(handleChange);
  }
}

function telemetrySurface() {
  if (SURFACE_PARAM === "tablet") return "tablet";
  return isMobileStartSurface ? "mobile" : "desktop";
}

function withRemoteLeaderboard(vm) {
  if (!vm) return vm;
  const selfRow = effectiveLeaderboardSelfRow();
  if (!remoteLeaderboardRows.length && !selfRow) return vm;
  const topRows = selfRow
    ? remoteLeaderboardRows.map((row) => isRemoteLeaderboardSelfRow(row, selfRow)
      ? { ...row, ...selfRow, rank: row.rank ?? selfRow.rank, isSelf: true }
      : row)
    : remoteLeaderboardRows;
  return {
    ...vm,
    leaderboard: {
      ...(vm.leaderboard ?? {}),
      topRows,
      selfRow,
    },
  };
}

function effectiveLeaderboardSelfRow() {
  const localSelfRow = localLeaderboardSelfRow();
  if (!localSelfRow) return remoteLeaderboardSelfRow;
  if (!remoteLeaderboardSelfRow) return localSelfRow;
  const localScore = Number(localSelfRow.score);
  const remoteScore = Number(remoteLeaderboardSelfRow.score);
  if (Number.isFinite(remoteScore) && remoteScore > localScore) return remoteLeaderboardSelfRow;
  return {
    ...remoteLeaderboardSelfRow,
    ...localSelfRow,
    rank: remoteLeaderboardSelfRow.rank,
    isSelf: true,
  };
}

function localLeaderboardSelfRow() {
  const currentCollection = viewCollection();
  if (!collectionHasSubmittedEndingScore(currentCollection)) return null;
  const score = Number(currentCollection?.totalScore);
  if (!Number.isFinite(score) || score < 0) return null;
  const profile = currentCollection?.latestProfile ?? {};
  return {
    rank: null,
    nickname: String(profile.nickname ?? "").trim() || "当前玩家",
    universityName: String(profile.universityName ?? "").trim() || "大学名称待同步",
    score: Math.max(0, Math.round(score)),
    isSelf: true,
  };
}

function isRemoteLeaderboardSelfRow(row, selfRow) {
  if (!row || !selfRow) return false;
  if (remoteLeaderboardSelfRow?.rank && row.rank === remoteLeaderboardSelfRow.rank) return true;
  return row.nickname === selfRow.nickname
    && row.universityName === selfRow.universityName;
}

function queueLeaderboardRefresh({ force = false } = {}) {
  if (!MONITOR_API_BASE || typeof window.fetch !== "function") return null;
  const now = Date.now();
  if (!force && leaderboardLastFetchedAt && now - leaderboardLastFetchedAt < LEADERBOARD_REFRESH_INTERVAL_MS) {
    return leaderboardFetchPromise;
  }
  if (leaderboardFetchPromise) return leaderboardFetchPromise;

  const url = new URL(`${MONITOR_API_BASE}/api/leaderboard`);
  url.searchParams.set("limit", "10");
  const playerId = collectionHasSubmittedEndingScore(viewCollection()) ? currentAnonymousPlayerId() : "";
  if (playerId) url.searchParams.set("playerId", playerId);
  if (force) url.searchParams.set("fresh", "1");

  leaderboardFetchPromise = window.fetch(url.toString(), {
    cache: force ? "no-store" : "default",
  })
    .then((response) => {
      if (!response.ok) throw new Error(`leaderboard_${response.status}`);
      return response.json();
    })
    .then((dashboard) => {
      remoteLeaderboardRows = normalizeRemoteLeaderboardRows(dashboard);
      remoteLeaderboardSelfRow = normalizeRemoteLeaderboardSelfRow(dashboard);
      leaderboardLastFetchedAt = Date.now();
      refreshLeaderboardUi();
    })
    .catch((error) => {
      console.warn("Failed to load leaderboard", error);
    })
    .finally(() => {
      leaderboardFetchPromise = null;
    });
  return leaderboardFetchPromise;
}

function queueLeaderboardRefreshAfterPending(options) {
  flushPendingEndingReports()
    .catch(() => false)
    .finally(() => queueLeaderboardRefresh(options));
}

function refreshLeaderboardUi() {
  if (!bootReady) return;
  if (uiDialog === "leaderboard") {
    if (!state) {
      render();
      return;
    }
    refreshLeaderboardDialogContent();
    return;
  }
  if (!state) {
    render();
  }
}

function normalizeRemoteLeaderboardRows(dashboard) {
  const players = Array.isArray(dashboard?.leaderboard?.players)
    ? dashboard.leaderboard.players
    : [];
  return players
    .map((player, index) => normalizeRemoteLeaderboardPlayer(player, { fallbackRank: index + 1, isSelf: false }))
    .filter(Boolean)
    .slice(0, 10);
}

function normalizeRemoteLeaderboardSelfRow(dashboard) {
  const row = normalizeRemoteLeaderboardPlayer(dashboard?.leaderboard?.currentPlayer, { isSelf: true });
  return row?.rank > 0 ? row : null;
}

function normalizeRemoteLeaderboardPlayer(player, { fallbackRank = 0, isSelf = false } = {}) {
  if (!player) return null;
  const rank = Number(player?.rank);
  return {
    rank: Number.isInteger(rank) && rank > 0 ? rank : fallbackRank,
    nickname: String(player?.nickname ?? "").trim() || "匿名玩家",
    universityName: String(player?.universityName ?? player?.school ?? "").trim() || "未知建院",
    score: Math.max(0, Math.round(Number(player?.score) || 0)),
    endingTitle: String(player?.endingTitle ?? "").trim(),
    isSelf,
  };
}

function render() {
  const currentView = state ? state.phase : `start:${startMode}`;
  const shouldResetSelectionScroll =
    currentView !== lastRenderedView
    && (currentView === "character_select" || currentView === "mentor_select");
  const isStartModeSwitch =
    !state
    && currentView.startsWith("start:")
    && lastRenderedView.startsWith("start:");
  const shouldAnimateViewSwitch =
    !state
    && bootReady
    && Boolean(lastRenderedView)
    && currentView !== lastRenderedView
    && !isStartModeSwitch;
  if (!bootReady) {
    if (!loadingVisible) {
      if (app.innerHTML) app.innerHTML = "";
      return;
    }
    const loadingShell = app.querySelector(".loading-shell");
    const nextVersionNoticeState = loadingVersionNotice ? "visible" : "hidden";
    if (loadingShell?.dataset.versionNoticeState === nextVersionNoticeState) {
      updateLoadingProgress();
    } else {
      const preservedMusicDock = preserveMusicDock();
      app.innerHTML = renderLoading({
        progress: loadingProgress,
        showFullscreenTip: shouldShowLoadingFullscreenTip(),
        appVersion: APP_VERSION,
        versionNotice: loadingVersionNotice,
      });
      restorePreservedMusicDock(preservedMusicDock);
      restoreAudioState();
      restoreEndingMemoryAnimationState();
    }
    updateClock();
    return;
  }
  const commitRender = () => {
    const previousRiskSlot = app.querySelector(".log-risk-slot:not(.is-leaving)") ?? null;
    suppressSeniorTestCopyToasts();
    if (state && suppressRepeatedAchievementToasts()) {
      saveState();
    }
    const renderCollection = viewCollection();
    const vm = state ? withRemoteLeaderboard(toViewModel(state, renderCollection)) : null;
    const collectionStartVm = withRemoteLeaderboard({ ...collectionViewModel(renderCollection), achievementToasts: collectionAchievementToasts });
    const mobileStartVm = { ...collectionStartVm, achievementToasts: [] };
    const startVm = state ? null : collectionStartVm;
    const nextMarkup = isMobileStartSurface
      ? renderStart({ hasSave: false, startMode: "menu", theme, uiDialog, language: uiLanguage, currentClock, music: musicForState(null), vm: mobileStartVm, isMobileStartSurface: true, appVersion: APP_VERSION })
      : vm
      ? renderGame(vm, { theme, uiDialog, language: uiLanguage })
      : renderStart({ hasSave: Boolean(localStorage.getItem(SAVE_KEY)), startMode, theme, uiDialog, language: uiLanguage, currentClock, music: musicForState(null), vm: startVm, isMobileStartSurface, appVersion: APP_VERSION, startProfileError, startProfileDraft });
    if (!isMobileStartSurface && vm && replaceGraduationFlowModalContent(vm.pendingInteraction)) {
      updateClock();
      syncQuestionCountdown();
      scheduleAchievementToastDismissal();
      scheduleCollectionAchievementToastDismissal();
      maybeStartPendingGraduationDesignGuide();
      scheduleNewPlayerGuideOverlay();
      lastRenderedView = currentView;
      return;
    }
    if (!isMobileStartSurface && vm && currentView === lastRenderedView && replaceAnswerModalContent(vm.pendingInteraction)) {
      updateClock();
      syncQuestionCountdown();
      scheduleAchievementToastDismissal();
      scheduleCollectionAchievementToastDismissal();
      maybeStartPendingGraduationDesignGuide();
      scheduleNewPlayerGuideOverlay();
      lastRenderedView = currentView;
      return;
    }
    const preservedMusicDock = preserveMusicDock();
    app.innerHTML = nextMarkup;
    if (shouldAnimateViewSwitch) {
      app.firstElementChild?.classList.add("view-soft-enter");
    }
    restorePreservedMusicDock(preservedMusicDock);
    restoreAudioState();
    completeEndingMemoryExitAudioRestoreIfSettled();
    restoreEndingMemoryAnimationState();
    if (shouldPreloadEndingMemoryAnimation()) queueEndingMemoryAnimationWarmup({ includeSceneImages: true });
    restoreStableRiskSlot(previousRiskSlot);
    animateRemovedRiskSlot(previousRiskSlot);
    detachRenderedAchievementToasts();
    updateClock();
    syncQuestionCountdown();
    scheduleAchievementToastDismissal();
    scheduleCollectionAchievementToastDismissal();
    maybeStartPendingGraduationDesignGuide();
    scheduleNewPlayerGuideOverlay();
    if (currentView === "character_select" && pendingCharacterDrawIntro) {
      runCharacterDrawIntro();
    } else {
      clearCharacterDrawRevealTimer();
    }
    if (shouldResetSelectionScroll) {
      resetSelectionScroll();
    }
    lastRenderedView = currentView;
    if (state) {
      queuePostStartAssetPreloads();
      queueGameplayBackgroundPreloads();
      queueCurrentAndUpcomingMusicPreloads();
      queueSelectedEndingMusicPreload();
      maybeQueueEndingAssetSprintWarmup();
    }
  };
  if (shouldAnimateViewSwitch && canUseViewTransition()) {
    try {
      document.startViewTransition(commitRender);
    } catch {
      commitRender();
    }
    return;
  }
  commitRender();
}

function resetSelectionScroll() {
  if (!window.scrollX && !window.scrollY) return;
  window.scrollTo({ left: 0, top: 0 });
}

function startNewPlayerGuide() {
  if (!state || isMobileGameplayBlocked()) {
    showMobileStartBlockedDialog();
    return;
  }
  clearUiDialogCloseTimer();
  uiDialog = null;
  graduationDesignGuideActive = false;
  newPlayerGuideStepIndex = 0;
  document.documentElement.classList.add("is-new-player-guide-active");
  render();
  scheduleNewPlayerGuideOverlay({ focus: true });
}

function startGraduationDesignGuide() {
  if (!state || isMobileGameplayBlocked()) return;
  clearUiDialogCloseTimer();
  uiDialog = null;
  graduationDesignGuideActive = true;
  graduationDesignGuidePending = false;
  newPlayerGuideStepIndex = -1;
  document.documentElement.classList.add("is-new-player-guide-active");
}

function queueGraduationDesignGuide() {
  graduationDesignGuidePending = true;
}

function maybeStartPendingGraduationDesignGuide() {
  if (!graduationDesignGuidePending || graduationDesignGuideActive || newPlayerGuideStepIndex >= 0) return;
  if (!state) {
    graduationDesignGuidePending = false;
    return;
  }
  if (state.phase !== "week_action" || state.pendingInteraction) return;
  if (!findGuideTarget(GRADUATION_DESIGN_GUIDE_STEP.selector)) return;
  startGraduationDesignGuide();
  saveState("graduation_design_guide");
}

function endNewPlayerGuide({ focusGame = false } = {}) {
  newPlayerGuideStepIndex = -1;
  graduationDesignGuideActive = false;
  if (newPlayerGuideFrame) {
    cancelAnimationFrame(newPlayerGuideFrame);
    newPlayerGuideFrame = null;
  }
  document.documentElement.classList.remove("is-new-player-guide-active");
  app.querySelector(".new-player-guide")?.remove();
  if (focusGame) {
    const focusTarget = app.querySelector(".action-button:not(:disabled), .settings-corner-button");
    focusTarget?.focus?.({ preventScroll: true });
  }
}

function moveNewPlayerGuide(stepDelta) {
  if (graduationDesignGuideActive) {
    endNewPlayerGuide({ focusGame: true });
    return;
  }
  if (newPlayerGuideStepIndex < 0) return;
  const nextStep = newPlayerGuideStepIndex + stepDelta;
  if (nextStep >= NEW_PLAYER_GUIDE_STEPS.length) {
    endNewPlayerGuide({ focusGame: true });
    return;
  }
  newPlayerGuideStepIndex = Math.max(0, nextStep);
  scheduleNewPlayerGuideOverlay({ focus: true });
}

function scheduleNewPlayerGuideOverlay({ focus = false } = {}) {
  if (newPlayerGuideFrame) {
    cancelAnimationFrame(newPlayerGuideFrame);
  }
  newPlayerGuideFrame = requestAnimationFrame(() => {
    newPlayerGuideFrame = null;
    renderNewPlayerGuideOverlay({ focus });
  });
}

function renderNewPlayerGuideOverlay({ focus = false } = {}) {
  if (newPlayerGuideStepIndex < 0 && !graduationDesignGuideActive) return;
  const gameShell = app.querySelector(".game-shell");
  if (!state || !gameShell) {
    endNewPlayerGuide();
    return;
  }
  const step = graduationDesignGuideActive
    ? GRADUATION_DESIGN_GUIDE_STEP
    : NEW_PLAYER_GUIDE_STEPS[newPlayerGuideStepIndex];
  if (!step) {
    endNewPlayerGuide();
    return;
  }
  const targetRects = guideStepTargetRects(step);
  if (targetRects.length === 0) {
    endNewPlayerGuide();
    return;
  }
  const rect = guideStepUnionRect(targetRects);
  const splitRingMarkup = step.splitRings
    ? targetRects.map((targetRect) => `
    <div class="new-player-guide-ring new-player-guide-split-ring" aria-hidden="true" style="top:${targetRect.y}px; left:${targetRect.x}px; width:${targetRect.width}px; height:${targetRect.height}px;"></div>`).join("")
    : "";
  const splitMaskMarkup = step.splitRings
    ? `
    <svg class="new-player-guide-split-mask" aria-hidden="true" focusable="false" width="100%" height="100%">
      <defs>
        <mask id="new-player-guide-split-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white"></rect>
          ${targetRects.map((targetRect) => `<rect x="${targetRect.x}" y="${targetRect.y}" width="${targetRect.width}" height="${targetRect.height}" rx="10" ry="10" fill="black"></rect>`).join("")}
        </mask>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="currentColor" mask="url(#new-player-guide-split-mask)"></rect>
    </svg>`
    : "";

  let overlay = app.querySelector(".new-player-guide");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "new-player-guide";
    app.append(overlay);
  }
  overlay.classList.toggle("is-full-dark-backdrop", Boolean(step.fullDarkBackdrop));
  overlay.classList.toggle("is-split-rings", Boolean(step.splitRings));
  overlay.classList.toggle("is-graduation-design-guide", graduationDesignGuideActive);

  const isFirst = !graduationDesignGuideActive && newPlayerGuideStepIndex === 0;
  const isLast = !graduationDesignGuideActive && newPlayerGuideStepIndex === NEW_PLAYER_GUIDE_STEPS.length - 1;
  const titleIconMarkup = step.titleIcon
    ? `<span class="new-player-guide-title-icon" aria-hidden="true">${renderUiIcon(step.titleIcon)}</span>`
    : "";
  const guideActionsMarkup = graduationDesignGuideActive
    ? `
      <div class="new-player-guide-actions">
        <button class="pixel-button is-primary graduation-design-guide-confirm" type="button" data-command="graduation-design-guide-end">${escapeHtml(step.primaryLabel)}</button>
      </div>`
    : `
      <div class="new-player-guide-actions">
        <button class="pixel-button" type="button" data-command="new-player-guide-prev" ${isFirst ? "disabled" : ""}>上一步</button>
        <button class="pixel-button is-primary" type="button" data-command="new-player-guide-next">${isLast ? "Let‘s goooooo！！！" : "下一步"}</button>
        <button class="pixel-button new-player-guide-skip" type="button" data-command="new-player-guide-end">跳过引导</button>
      </div>`;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "new-player-guide-title");
  overlay.dataset.step = graduationDesignGuideActive ? "graduation-design" : String(newPlayerGuideStepIndex + 1);
  overlay.style.setProperty("--guide-card-width-offset", step.cardWidthOffset ?? "0px");
  overlay.innerHTML = `
    <div class="new-player-guide-hit-shield" aria-hidden="true"></div>
    <div class="new-player-guide-shadow new-player-guide-shadow-top" aria-hidden="true"></div>
    <div class="new-player-guide-shadow new-player-guide-shadow-left" aria-hidden="true"></div>
    <div class="new-player-guide-shadow new-player-guide-shadow-right" aria-hidden="true"></div>
    <div class="new-player-guide-shadow new-player-guide-shadow-bottom" aria-hidden="true"></div>
    ${splitMaskMarkup}
    <div class="new-player-guide-ring" aria-hidden="true" ${step.splitRings || step.fullDarkBackdrop ? "hidden" : ""}></div>${splitRingMarkup}
    <section class="new-player-guide-card" tabindex="-1">
      <p class="kicker">${escapeHtml(step.kicker ?? `新手引导 ${newPlayerGuideStepIndex + 1} / ${NEW_PLAYER_GUIDE_STEPS.length}`)}</p>
      <h2 id="new-player-guide-title">${titleIconMarkup}<span>${escapeHtml(step.title)}</span></h2>
      <p class="${escapeHtml(step.bodyClass ?? "")}">${step.bodyHtml ?? escapeHtml(step.body).replace(/\n/g, "<br>")}</p>
      ${guideActionsMarkup}
    </section>
  `;
  positionNewPlayerGuideOverlay(overlay, rect);
  if (focus) {
    overlay.querySelector(".new-player-guide-card")?.focus?.({ preventScroll: true });
  }
}

function guideStepTargetRects(step) {
  const selectors = step.selectors ?? [step.selector];
  return selectors
    .map((selector) => findGuideTarget(selector)?.getBoundingClientRect())
    .filter(Boolean)
    .map(expandedGuideRect);
}

function guideStepUnionRect(rects) {
  if (rects.length === 0) return null;
  return rects.reduce((combined, rect) => ({
    x: Math.min(combined.x, rect.x),
    y: Math.min(combined.y, rect.y),
    width: Math.max(combined.x + combined.width, rect.x + rect.width) - Math.min(combined.x, rect.x),
    height: Math.max(combined.y + combined.height, rect.y + rect.height) - Math.min(combined.y, rect.y),
  }), rects[0]);
}

function findGuideTarget(selector) {
  return [...document.querySelectorAll(selector)].find((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 8
      && rect.height > 8
      && style.display !== "none"
      && style.visibility !== "hidden"
      && style.opacity !== "0";
  }) ?? null;
}

function expandedGuideRect(rect) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const x = clamp(rect.left - NEW_PLAYER_GUIDE_PADDING, 0, viewportWidth - 1);
  const y = clamp(rect.top - NEW_PLAYER_GUIDE_PADDING, 0, viewportHeight - 1);
  const right = clamp(rect.right + NEW_PLAYER_GUIDE_PADDING, x + 1, viewportWidth);
  const bottom = clamp(rect.bottom + NEW_PLAYER_GUIDE_PADDING, y + 1, viewportHeight);
  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}

function positionNewPlayerGuideOverlay(overlay, rect) {
  overlay.style.setProperty("--guide-x", `${rect.x}px`);
  overlay.style.setProperty("--guide-y", `${rect.y}px`);
  overlay.style.setProperty("--guide-w", `${rect.width}px`);
  overlay.style.setProperty("--guide-h", `${rect.height}px`);

  const card = overlay.querySelector(".new-player-guide-card");
  if (!card) return;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardRect = card.getBoundingClientRect();
  const cardWidth = Math.min(cardRect.width || 460, viewportWidth - NEW_PLAYER_GUIDE_VIEWPORT_INSET * 2);
  const cardHeight = cardRect.height || 220;
  const preferredBelow = rect.y + rect.height + NEW_PLAYER_GUIDE_GAP;
  const preferredAbove = rect.y - cardHeight - NEW_PLAYER_GUIDE_GAP;
  const preferredRight = rect.x + rect.width + NEW_PLAYER_GUIDE_GAP;
  const preferredLeft = rect.x - cardWidth - NEW_PLAYER_GUIDE_GAP;
  const maxTop = Math.max(NEW_PLAYER_GUIDE_VIEWPORT_INSET, viewportHeight - cardHeight - NEW_PLAYER_GUIDE_VIEWPORT_INSET);
  const maxLeft = Math.max(NEW_PLAYER_GUIDE_VIEWPORT_INSET, viewportWidth - cardWidth - NEW_PLAYER_GUIDE_VIEWPORT_INSET);
  let top = rect.y + rect.height / 2 - cardHeight / 2;
  let left = rect.x + rect.width / 2 - cardWidth / 2;
  if (preferredBelow + cardHeight <= viewportHeight - NEW_PLAYER_GUIDE_VIEWPORT_INSET) {
    top = preferredBelow;
  } else if (preferredAbove >= NEW_PLAYER_GUIDE_VIEWPORT_INSET) {
    top = preferredAbove;
  } else if (preferredRight + cardWidth <= viewportWidth - NEW_PLAYER_GUIDE_VIEWPORT_INSET) {
    left = preferredRight;
  } else if (preferredLeft >= NEW_PLAYER_GUIDE_VIEWPORT_INSET) {
    left = preferredLeft;
  } else {
    top = viewportHeight - cardHeight - NEW_PLAYER_GUIDE_VIEWPORT_INSET;
  }
  top = clamp(top, NEW_PLAYER_GUIDE_VIEWPORT_INSET, maxTop);
  left = clamp(left, NEW_PLAYER_GUIDE_VIEWPORT_INSET, maxLeft);
  overlay.style.setProperty("--guide-card-x", `${left}px`);
  overlay.style.setProperty("--guide-card-y", `${top}px`);
}

function refreshNewPlayerGuideOverlay() {
  if (newPlayerGuideStepIndex >= 0 || graduationDesignGuideActive) {
    scheduleNewPlayerGuideOverlay();
  }
}

function handleNewPlayerGuideKeydown(event) {
  if (newPlayerGuideStepIndex < 0 && !graduationDesignGuideActive) return;
  if (event.key === "Escape") {
    event.preventDefault();
    endNewPlayerGuide({ focusGame: true });
    return;
  }
  if (event.key === "ArrowRight" || event.key === "Enter") {
    event.preventDefault();
    moveNewPlayerGuide(1);
    return;
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveNewPlayerGuide(-1);
  }
}

function shouldOpenGuideAfterFreshmanCourseSelect(command, interaction, sourceState) {
  return command === "modal-option"
    && interaction?.type === "course_select"
    && Number(sourceState?.year) === 1
    && Number(sourceState?.semesterIndex) === 1;
}

function shouldOpenGraduationDesignGuideAfterYearStart(command, interaction, sourceState) {
  return command === "modal-option"
    && interaction?.type === "year_start"
    && Number(sourceState?.year) === 5;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function queueGameplayBackgroundPreloads() {
  if (gameplayBackgroundPreloadsQueued || isMobileStartSurface || !bootReady || !state) return;
  gameplayBackgroundPreloadsQueued = true;
  const postStartupSources = postStartupGameplayImageSources({ isMobileStartSurface });
  queueImagePreloads(postStartupSources, {
    delay: BACKGROUND_IMAGE_PRELOAD_DELAY_MS,
    stagger: BACKGROUND_IMAGE_PRELOAD_STAGGER_MS,
    useIdle: true,
  });
  queueRouteEndingImagePreloads(state.routeParticipation?.optionId, {
    delay: routeEndingPreloadDelayAfterPortfolio(postStartupSources),
  });
  window.setTimeout(() => {
    queueEndingMemoryAnimationWarmup();
  }, BACKGROUND_IMAGE_PRELOAD_DELAY_MS);
}

function maybeQueueEndingAssetSprintWarmup() {
  if (endingAssetSprintWarmupQueued || isMobileStartSurface || !state || state.ending || !shouldSprintEndingAssetWarmup(state)) return;
  endingAssetSprintWarmupQueued = true;
  queueSelectedEndingMusicPreload();
  queueEndingIllustrationPreloads();
  queueEndingMemoryAnimationWarmup({ includeSceneImages: true });
}

function shouldSprintEndingAssetWarmup(sourceState) {
  const semesterIndex = Number(sourceState?.semesterIndex);
  if (Number.isFinite(semesterIndex)) return semesterIndex >= ENDING_ASSET_SPRINT_PRELOAD_SEMESTER_INDEX;
  const year = Number(sourceState?.year);
  const term = Number(sourceState?.term);
  if (Number.isFinite(year) && Number.isFinite(term)) {
    return (year - 1) * 2 + term >= ENDING_ASSET_SPRINT_PRELOAD_SEMESTER_INDEX;
  }
  return year >= 4;
}

async function queuePostStartAssetPreloads() {
  if (postStartAssetPreloadsQueued) return;
  postStartAssetPreloadsQueued = true;
  queuePendingStartupAssetRetries();
  const shouldLoadGameplayAssets = !isMobileStartSurface;
  if (shouldLoadGameplayAssets) {
    gameplayBackgroundPreloadsQueued = true;
  }

  if (!shouldLoadGameplayAssets) return;

  const trackGroups = postStartGameBgmPreloadTrackGroups();
  const postStartupSources = postStartupGameplayImageSources({ isMobileStartSurface });
  queueImagePreloads(postStartupSources, {
    delay: 0,
    stagger: BACKGROUND_IMAGE_PRELOAD_STAGGER_MS,
    useIdle: true,
  });
  queueRouteEndingImagePreloads(state?.routeParticipation?.optionId, {
    delay: routeEndingPreloadDelayAfterPortfolio(postStartupSources),
  });
  queueEndingMemoryAnimationWarmup();

  for (const group of trackGroups) {
    const plan = backgroundBgmPreloadPlan();
    const result = await preloadMediaForGate(group.map((track) => track.src), {
      timeoutMs: BACKGROUND_AUDIO_PRELOAD_TIMEOUT_MS,
      concurrency: plan.concurrency,
    });
    recordPreloadConcurrencyResult("background-audio", plan, result);
  }
}

function queueCurrentAndUpcomingMusicPreloads() {
  if (!state || isMobileStartSurface) return;
  const currentTrack = musicForState(state);
  const upcomingTrack = upcomingYearFirstTrack(state);
  const sources = [currentTrack?.src, upcomingTrack?.src].filter(Boolean);
  if (!sources.length) return;
  const plan = priorityAudioPreloadPlan();
  preloadPlayableAudioForGate(sources, {
    timeoutMs: BACKGROUND_AUDIO_PRELOAD_TIMEOUT_MS,
    resourceTimeoutMs: PRIORITY_AUDIO_RESOURCE_PRELOAD_TIMEOUT_MS,
    concurrency: plan.concurrency,
  }).then((result) => {
    recordPreloadConcurrencyResult("priority-audio", plan, result);
  });
}

function ensureRunEndingTrackSelected(targetState) {
  if (!targetState || targetState.endingTrackId) return false;
  const track = selectEndingTrackForRun(targetState);
  if (!track?.id) return false;
  targetState.endingTrackId = track.id;
  return true;
}

function queueSelectedEndingMusicPreload() {
  if (!state || isMobileStartSurface) return;
  const track = selectEndingTrackForRun(state);
  const audioUrl = track?.src ? assetUrl(track.src) : "";
  const lyricsUrl = track?.lyricsSrc ? assetUrl(track.lyricsSrc) : "";
  const preloadKey = selectedEndingMusicPreloadKey(track?.id, audioUrl, lyricsUrl);
  if (!preloadKey || selectedEndingMusicPreloadKeys.has(preloadKey)) return;
  selectedEndingMusicPreloadKeys.add(preloadKey);
  if (audioUrl) {
    const plan = priorityAudioPreloadPlan();
    preloadPlayableAudioForGate([audioUrl], {
      timeoutMs: BACKGROUND_AUDIO_PRELOAD_TIMEOUT_MS,
      resourceTimeoutMs: PRIORITY_AUDIO_RESOURCE_PRELOAD_TIMEOUT_MS,
      concurrency: plan.concurrency,
    }).then((result) => {
      recordPreloadConcurrencyResult("priority-audio", plan, result);
      if (!result.ok) selectedEndingMusicPreloadKeys.delete(preloadKey);
    }, () => {
      selectedEndingMusicPreloadKeys.delete(preloadKey);
    });
  }
  if (!lyricsUrl) return;
  preloadMediaForGate([lyricsUrl], {
    timeoutMs: BACKGROUND_AUDIO_PRELOAD_TIMEOUT_MS,
    concurrency: 1,
  }).then((result) => {
    if (!result.ok) selectedEndingMusicPreloadKeys.delete(preloadKey);
  }, () => {
    selectedEndingMusicPreloadKeys.delete(preloadKey);
  });
}

function selectedEndingMusicPreloadKey(trackId, audioUrl, lyricsUrl) {
  if (!trackId || !audioUrl) return "";
  return [trackId, audioUrl, lyricsUrl || ""].join("|");
}

function upcomingYearFirstTrack(sourceState) {
  if (!sourceState || sourceState.ending || sourceState.pendingEnding) return null;
  const currentYear = Math.min(5, Math.max(1, Number(sourceState.year) || 1));
  const targetYear = sourceState.phase === "year_start"
    ? currentYear
    : currentYear < 5
      ? currentYear + 1
      : null;
  return targetYear ? YEAR_BGM.find((group) => group.year === targetYear)?.tracks?.[0] ?? null : null;
}

function queuePendingStartupAssetRetries() {
  if (pendingStartupAssetRetriesQueued) return;
  pendingStartupAssetRetriesQueued = true;
  const failedResources = loadStartupFailedResources();
  const imageSources = [...new Set([...failedResources.images, ...pendingStartupRetryImageSources].filter(Boolean))];
  const mediaSources = [...new Set([...failedResources.media, ...pendingStartupRetryMediaSources].filter(Boolean))];
  pendingStartupRetryImageSources = [];
  pendingStartupRetryMediaSources = [];
  if (imageSources.length) {
    queueImagePreloads(imageSources, {
      delay: 0,
      stagger: BACKGROUND_IMAGE_PRELOAD_STAGGER_MS,
      useIdle: true,
      onSuccess: (source) => removeStartupFailedResources({ images: [source] }),
    });
  }
  if (mediaSources.length) {
    preloadPlayableAudioForGate(mediaSources, {
      timeoutMs: BACKGROUND_AUDIO_PRELOAD_TIMEOUT_MS,
      resourceTimeoutMs: STARTUP_RESOURCE_PRELOAD_TIMEOUT_MS,
      concurrency: startupAudioPreloadConcurrency(),
    }).then((result) => {
      removeStartupFailedResources({ media: result.successfulSources });
    });
  }
}

function queueSupportImagePreloads({ immediate = false } = {}) {
  queueImagePreloads(supportDialogImageSources(), {
    delay: immediate ? 0 : BACKGROUND_IMAGE_PRELOAD_DELAY_MS,
    stagger: immediate ? 40 : BACKGROUND_IMAGE_PRELOAD_STAGGER_MS,
  });
}

function queueStartupOpportunisticImagePreloads() {
  if (isMobileStartSurface) return;
  const sources = opportunisticStartupImageSources({ isMobileStartSurface })
    .filter((source) => !queuedStartupOpportunisticImagePreloadSources.has(source));
  if (!sources.length) return;
  for (const source of sources) {
    queuedStartupOpportunisticImagePreloadSources.add(source);
  }
  window.setTimeout(() => {
    if (!loadingVisible || bootReady) return;
    preloadImagesForGate(sources, {
      timeoutMs: STARTUP_OPPORTUNISTIC_IMAGE_PRELOAD_TIMEOUT_MS,
      resourceTimeoutMs: STARTUP_OPPORTUNISTIC_RESOURCE_PRELOAD_TIMEOUT_MS,
      concurrency: STARTUP_OPPORTUNISTIC_IMAGE_PRELOAD_CONCURRENCY,
    }).catch(() => {});
  }, STARTUP_OPPORTUNISTIC_IMAGE_PRELOAD_DELAY_MS);
}

function queueRouteEndingImagePreloads(optionId, { delay = 0 } = {}) {
  if (isMobileStartSurface || !optionId) return;
  const sources = routeEndingIllustrationSources(optionId)
    .filter((source) => !queuedEndingIllustrationPreloadSources.has(source));
  if (!sources.length) return;
  for (const source of sources) {
    queuedEndingIllustrationPreloadSources.add(source);
  }
  queueImagePreloads(sources, {
    delay,
    stagger: BACKGROUND_IMAGE_PRELOAD_STAGGER_MS,
  });
}

function queueEndingIllustrationPreloads({ delay = 0 } = {}) {
  if (isMobileStartSurface) return;
  const sources = endingIllustrationSources()
    .filter((source) => !queuedEndingIllustrationPreloadSources.has(source));
  if (!sources.length) return;
  for (const source of sources) {
    queuedEndingIllustrationPreloadSources.add(source);
  }
  queueImagePreloads(sources, {
    delay,
    stagger: BACKGROUND_IMAGE_PRELOAD_STAGGER_MS,
  });
}

function routeEndingPreloadDelayAfterPortfolio(postStartupSources) {
  const portfolioSources = new Set(portfolioBoardImageSources());
  const lastPortfolioIndex = postStartupSources.reduce((lastIndex, source, index) => (
    portfolioSources.has(source) ? index : lastIndex
  ), -1);
  return lastPortfolioIndex >= 0
    ? BACKGROUND_IMAGE_PRELOAD_DELAY_MS + (lastPortfolioIndex + 1) * BACKGROUND_IMAGE_PRELOAD_STAGGER_MS
    : BACKGROUND_IMAGE_PRELOAD_DELAY_MS;
}

function queueImagePreloads(sources, { delay = 0, stagger = BACKGROUND_IMAGE_PRELOAD_STAGGER_MS, useIdle = false, onSuccess = () => {} } = {}) {
  const uniqueSources = [...new Set(sources.filter(Boolean))];
  uniqueSources.forEach((source, index) => {
    window.setTimeout(() => {
      const run = () => {
        preloadImageWithRetry(source).then((ok) => {
          if (ok) onSuccess(source);
        });
      };
      if (useIdle) {
        scheduleIdleTask(run);
      } else {
        run();
      }
    }, delay + index * stagger);
  });
}

function preloadImageWithRetry(source, attempt = 1) {
  return preloadImage(source).then((ok) => {
    if (ok || attempt >= BACKGROUND_IMAGE_PRELOAD_ATTEMPTS) return ok;
    return new Promise((resolve) => {
      window.setTimeout(() => {
        resolve(preloadImageWithRetry(source, attempt + 1));
      }, BACKGROUND_IMAGE_PRELOAD_RETRY_DELAY_MS);
    });
  });
}

function preloadImagesForGate(sources, {
  timeoutMs = 0,
  resourceTimeoutMs = 0,
  concurrency = 10,
  prioritySources = null,
  requireSuccess = false,
  retryDelayMs = 1200,
  onProgress = () => {},
} = {}) {
  const uniqueSources = [...new Set(sources.filter(Boolean))];
  const highPrioritySources = prioritySources instanceof Set
    ? prioritySources
    : new Set(Array.isArray(prioritySources) ? prioritySources : []);
  return preloadSourcesForGate(uniqueSources, (source) => preloadImage(source, {
    timeoutMs: resourceTimeoutMs,
    fetchPriority: highPrioritySources.has(source) ? "high" : "",
  }), {
    timeoutMs,
    concurrency,
    requireSuccess,
    retryDelayMs,
    onProgress,
  });
}

function preloadImage(source, { timeoutMs = 0, fetchPriority = "" } = {}) {
  const url = assetUrl(source);
  if (!url) return Promise.resolve(false);
  return preloadImageUrl(url, { timeoutMs, fetchPriority });
}

function preloadImageUrl(url, { timeoutMs = 0, fetchPriority = "" } = {}) {
  if (imagePreloadPromises.has(url)) return imagePreloadPromises.get(url);

  let image = imagePreloadHandles.get(url);
  if (image?.complete) {
    return image.naturalWidth > 0
      ? decodeImage(image)
      : Promise.resolve(false);
  }
  if (!image) {
    image = new Image();
    image.decoding = "async";
    image.loading = "eager";
    imagePreloadHandles.set(url, image);
  }
  if (fetchPriority && "fetchPriority" in image) {
    image.fetchPriority = fetchPriority;
  }

  const promise = new Promise((resolve) => {
    let done = false;
    let timer = null;
    const finish = (ok) => {
      if (done) return;
      done = true;
      if (timer) window.clearTimeout(timer);
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
      if (!ok) {
        image.removeAttribute("src");
      }
      resolve(ok);
    };
    const handleLoad = () => {
      decodeImage(image).then((ok) => {
        if (ok) queueRuntimeCacheWrite(url, { timeoutMs });
        finish(ok);
      });
    };
    const handleError = () => finish(false);
    image.addEventListener("load", handleLoad, { once: true });
    image.addEventListener("error", handleError, { once: true });
    if (timeoutMs > 0) {
      timer = window.setTimeout(() => finish(false), timeoutMs);
    }
    image.src = url;
  }).then((ok) => {
    if (!ok) {
      imagePreloadPromises.delete(url);
      imagePreloadHandles.delete(url);
    }
    return ok;
  });
  imagePreloadPromises.set(url, promise);
  return promise;
}

function assetUrl(source) {
  const publicUrl = publicAssetUrl(source);
  try {
    return new URL(publicUrl, window.location.href).href;
  } catch {
    return "";
  }
}

function runtimeRetryAssetUrl(source) {
  if (!source) return "";
  try {
    const url = new URL(source, window.location.href);
    if (!/^https?:$/iu.test(url.protocol)) return "";
    const retryCount = Number(url.searchParams.get("runtime-retry")) || 0;
    if (retryCount >= 1) return "";
    url.searchParams.set("runtime-retry", String(retryCount + 1));
    return url.href;
  } catch {
    return "";
  }
}

function handleRuntimeImageError(event) {
  const target = event.target;
  if (typeof HTMLImageElement !== "undefined" && target instanceof HTMLImageElement) {
    retryHtmlImageFromCurrentUrl(target);
    return;
  }
  if (typeof SVGImageElement !== "undefined" && target instanceof SVGImageElement) {
    retrySvgImageFromCurrentUrl(target);
  }
}

function retryHtmlImageFromCurrentUrl(image) {
  const current = image.currentSrc || image.src || image.getAttribute("src") || "";
  const retryUrl = runtimeRetryAssetUrl(current);
  if (!retryUrl || image.dataset.runtimeRetrySrc === retryUrl) return;
  image.dataset.runtimeRetrySrc = retryUrl;
  image.src = retryUrl;
}

function retrySvgImageFromCurrentUrl(image) {
  const current = image.href?.baseVal || image.getAttribute("href") || "";
  const retryUrl = runtimeRetryAssetUrl(current);
  if (!retryUrl || image.dataset.runtimeRetrySrc === retryUrl) return;
  image.dataset.runtimeRetrySrc = retryUrl;
  image.setAttribute("href", retryUrl);
}

function decodeImage(image) {
  if (typeof image.decode !== "function") return Promise.resolve(true);
  return image.decode().then(() => true, () => false);
}

function preloadMediaForGate(sources, {
  timeoutMs = 0,
  resourceTimeoutMs = 0,
  concurrency = 2,
  requireSuccess = false,
  retryDelayMs = 1600,
  onProgress = () => {},
} = {}) {
  const uniqueSources = [...new Set(sources.filter(Boolean))];
  return preloadSourcesForGate(uniqueSources, (source) => preloadMedia(source, {
    timeoutMs: resourceTimeoutMs,
  }), {
    timeoutMs,
    concurrency,
    requireSuccess,
    retryDelayMs,
    onProgress,
  });
}

function preloadPlayableAudioForGate(sources, {
  timeoutMs = 0,
  resourceTimeoutMs = 0,
  concurrency = 2,
  requireSuccess = false,
  retryDelayMs = 1600,
  onProgress = () => {},
} = {}) {
  const uniqueSources = [...new Set(sources.filter(Boolean))];
  return preloadSourcesForGate(uniqueSources, (source) => preloadPlayableAudio(source, {
    timeoutMs: resourceTimeoutMs,
  }), {
    timeoutMs,
    concurrency,
    requireSuccess,
    retryDelayMs,
    onProgress,
  });
}

function preloadSourcesForGate(uniqueSources, loadSource, {
  timeoutMs,
  concurrency,
  requireSuccess,
  retryDelayMs,
  onProgress,
}) {
  if (!uniqueSources.length) {
    return Promise.resolve({
      ok: true,
      timedOut: false,
      total: 0,
      complete: 0,
      successful: 0,
      successfulSources: [],
      remainingSources: [],
    });
  }

  const successfulSources = new Set();
  let nextIndex = 0;
  let active = 0;
  let complete = 0;
  const total = uniqueSources.length;
  const effectiveConcurrency = Math.max(1, Number(concurrency) || 1);
  let timedOut = false;
  let settled = false;
  let timer = null;

  return new Promise((resolve) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timer) window.clearTimeout(timer);
      resolve({
        ok: successfulSources.size >= total,
        timedOut,
        total,
        complete,
        successful: successfulSources.size,
        successfulSources: [...successfulSources],
        remainingSources: uniqueSources.filter((source) => !successfulSources.has(source)),
      });
    };
    const pump = () => {
      if (timedOut) return;
      if (complete >= total) {
        finish();
        return;
      }
      while (active < effectiveConcurrency && nextIndex < total) {
        const source = uniqueSources[nextIndex];
        nextIndex += 1;
        active += 1;
        preloadGateResource(() => loadSource(source), {
          requireSuccess,
          retryDelayMs,
          shouldStop: () => timedOut,
        }).then((ok) => {
          if (ok) successfulSources.add(source);
        }).finally(() => {
          active -= 1;
          complete += 1;
          if (!settled) onProgress(complete, total, successfulSources.size);
          pump();
        });
      }
      if (nextIndex >= total && active === 0) finish();
    };
    if (timeoutMs > 0) {
      timer = window.setTimeout(() => {
        timedOut = true;
        finish();
      }, timeoutMs);
    }
    pump();
  });
}

function preloadMedia(source, { timeoutMs = 0 } = {}) {
  const url = assetUrl(source);
  if (!url) return Promise.resolve(false);
  if (mediaPreloadPromises.has(url)) return mediaPreloadPromises.get(url);

  const promise = (/\.lrc(?:[?#].*)?$/iu.test(source)
    ? fetchResourceIntoCache(url, { timeoutMs }).catch(() => false)
    : preloadAudio(url, { timeoutMs })).then((ok) => {
      if (!ok) mediaPreloadPromises.delete(url);
      return ok;
    });
  mediaPreloadPromises.set(url, promise);
  return promise;
}

function preloadPlayableAudio(source, { timeoutMs = 0 } = {}) {
  const url = assetUrl(source);
  if (!url) return Promise.resolve(false);
  if (playableAudioWarmupPromises.has(url)) return playableAudioWarmupPromises.get(url);

  const shouldFetchBeforeWarmup = !isCrossOriginHttpUrl(url) || isCorsReadableAudioResourceUrl(url);
  const promise = (shouldFetchBeforeWarmup
    ? fetchResourceIntoCache(url, { timeoutMs }).then((cached) => (cached ? warmupAudioForPlayback(url, { timeoutMs }) : false))
    : warmupAudioForPlayback(url, { timeoutMs })
  ).catch(() => false).then((ok) => {
    if (ok) {
      mediaPreloadPromises.set(url, Promise.resolve(true));
    } else {
      playableAudioWarmupPromises.delete(url);
      releaseAudioWarmup(url);
    }
    return ok;
  });
  playableAudioWarmupPromises.set(url, promise);
  return promise;
}

function warmupAudioForPlayback(url, { timeoutMs = 0 } = {}) {
  return warmupAudioForPlaybackAttempt(url, { timeoutMs });
}

function warmupAudioForPlaybackAttempt(url, { timeoutMs = 0 } = {}) {
  let audio = playableAudioWarmupHandles.get(url);
  if (audio?.readyState >= STARTUP_AUDIO_PLAYABLE_READY_STATE) return Promise.resolve(true);
  if (!audio) {
    audio = document.createElement("audio");
    audio.preload = "auto";
    audio.muted = true;
    audio.playsInline = true;
    playableAudioWarmupHandles.set(url, audio);
  }
  syncAudioCrossOrigin(audio, url);

  return new Promise((resolve) => {
    let done = false;
    let timer = null;
    const finish = (ok) => {
      if (done) return;
      done = true;
      if (timer) window.clearTimeout(timer);
      audio.removeEventListener("loadeddata", handleReady);
      audio.removeEventListener("canplay", handleReady);
      audio.removeEventListener("canplaythrough", handleReady);
      audio.removeEventListener("error", handleError);
      resolve(ok);
    };
    const handleReady = () => {
      if (audio.readyState >= STARTUP_AUDIO_PLAYABLE_READY_STATE) finish(true);
    };
    const handleError = () => finish(false);
    audio.addEventListener("loadeddata", handleReady);
    audio.addEventListener("canplay", handleReady);
    audio.addEventListener("canplaythrough", handleReady);
    audio.addEventListener("error", handleError, { once: true });
    if (timeoutMs > 0) {
      timer = window.setTimeout(() => finish(false), timeoutMs);
    }
    try {
      if (!sameAudioSource(audio, url)) {
        audio.src = url;
      }
      audio.load();
      handleReady();
    } catch {
      finish(false);
    }
  });
}

function releaseAudioWarmup(url) {
  const audio = playableAudioWarmupHandles.get(url);
  if (!audio) return;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  playableAudioWarmupHandles.delete(url);
}

async function preloadGateResource(load, { requireSuccess, retryDelayMs, shouldStop = () => false }) {
  const maxAttempts = requireSuccess ? 2 : 1;
  for (let attempt = 0; attempt < maxAttempts && !shouldStop(); attempt += 1) {
    if (await load()) return true;
    if (!requireSuccess || attempt === maxAttempts - 1 || shouldStop()) return false;
    await wait(retryDelayMs);
  }
  return false;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function flushRuntimeCacheWrites({ timeoutMs = 0 } = {}) {
  if (!window.caches?.open) return true;
  const writes = [...runtimeCacheWritePromises.values()];
  if (!writes.length) return !runtimeCacheWriteFailed;
  const settled = Promise.all(writes.map((promise) => promise.catch(() => false)))
    .then((results) => !runtimeCacheWriteFailed && results.every(Boolean));
  if (timeoutMs <= 0) return settled;
  return Promise.race([
    settled,
    wait(timeoutMs).then(() => false),
  ]);
}

function queueRuntimeCacheWrite(url, { timeoutMs = 0 } = {}) {
  if (!window.caches?.open || !isHttpUrl(url)) return Promise.resolve(true);
  if (runtimeCacheWritePromises.has(url)) return runtimeCacheWritePromises.get(url);
  const promise = fetchResourceIntoCache(url, { timeoutMs })
    .then((ok) => {
      if (!ok) runtimeCacheWriteFailed = true;
      return ok;
    })
    .catch(() => {
      runtimeCacheWriteFailed = true;
      return false;
    })
    .finally(() => {
      runtimeCacheWritePromises.delete(url);
    });
  runtimeCacheWritePromises.set(url, promise);
  return promise;
}

function ensureRuntimeCacheControl() {
  if (!navigator.serviceWorker?.register) return Promise.resolve(false);
  const controlled = navigator.serviceWorker.controller
    ? Promise.resolve(true)
    : waitForServiceWorkerController();
  return navigator.serviceWorker.register("/sw.mjs", { type: "module" })
    .then(() => navigator.serviceWorker.ready)
    .then(() => navigator.serviceWorker.controller ? true : controlled)
    .catch(() => false);
}

function waitForRuntimeCacheControl({ timeoutMs = 0 } = {}) {
  if (timeoutMs <= 0) return runtimeCacheControlPromise;
  return Promise.race([
    runtimeCacheControlPromise,
    wait(timeoutMs).then(() => false),
  ]);
}

function waitForServiceWorkerController() {
  return new Promise((resolve) => {
    if (navigator.serviceWorker?.controller) {
      resolve(true);
      return;
    }
    const handleControllerChange = () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      resolve(true);
    };
    navigator.serviceWorker?.addEventListener("controllerchange", handleControllerChange, { once: true });
  });
}

async function fetchResourceIntoCache(url, { timeoutMs = 0 } = {}) {
  const response = await fetchRuntimeResource(url, { timeoutMs });
  if (!isUsableResourceResponse(response)) return false;
  const cacheWrite = putRuntimeCacheResponse(url, response.clone());
  const bodyRead = response.type === "opaque"
    ? Promise.resolve(true)
    : response.arrayBuffer().then(() => true, () => false);
  const [bodyOk, cacheOk] = await Promise.all([bodyRead, cacheWrite]);
  return bodyOk && cacheOk;
}

async function fetchRuntimeResource(url, { timeoutMs = 0 } = {}) {
  const fetchOptions = runtimeResourceFetchOptions(url);
  if (timeoutMs <= 0 || typeof AbortController !== "function") {
    return fetch(url, fetchOptions);
  }
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function runtimeResourceFetchOptions(url) {
  return {
    cache: "force-cache",
    ...(isCrossOriginHttpUrl(url) ? { mode: isCorsReadableRuntimeResourceUrl(url) ? "cors" : "no-cors" } : {}),
  };
}

function syncAudioCrossOrigin(audio, url) {
  if (!audio) return false;
  const nextCrossOrigin = isCorsReadableAudioResourceUrl(url) ? "anonymous" : "";
  const changed = (audio.crossOrigin || "") !== nextCrossOrigin;
  if (nextCrossOrigin) {
    audio.crossOrigin = nextCrossOrigin;
  } else {
    audio.removeAttribute("crossorigin");
  }
  return changed;
}

function isCorsReadableRuntimeResourceUrl(url) {
  return isCorsReadableAudioResourceUrl(url) || isLyricsResourceUrl(url);
}

function isCorsReadableAudioResourceUrl(url) {
  if (!isAudioResourceUrl(url)) return false;
  const source = String(url || "");
  return source.startsWith(R2_ASSET_BASE_URL)
    || (source.startsWith(DOMESTIC_ASSET_BASE_URL) && window.location.origin === "https://arch.25thgame.vip");
}

function isLyricsResourceUrl(url) {
  try {
    return /\.lrc$/iu.test(new URL(url, window.location.href).pathname);
  } catch {
    return false;
  }
}

function isAudioResourceUrl(url) {
  try {
    return /\.(?:m4a|mp3|ogg|wav)$/iu.test(new URL(url, window.location.href).pathname);
  } catch {
    return false;
  }
}

function isCrossOriginHttpUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return /^https?:$/iu.test(parsed.protocol) && parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}

async function putRuntimeCacheResponse(url, response) {
  if (!window.caches?.open || !isHttpUrl(url)) return true;
  if (!isUsableResourceResponse(response)) return false;
  try {
    const cache = await window.caches.open(RUNTIME_CACHE_NAME);
    await cache.put(url, response);
    return true;
  } catch {
    return false;
  }
}

function isUsableResourceResponse(response) {
  return Boolean(response) && (response.ok || response.type === "opaque");
}

function isHttpUrl(url) {
  return /^https?:/iu.test(String(url || ""));
}

function preloadAudio(url, { timeoutMs = 0 } = {}) {
  return fetchResourceIntoCache(url, { timeoutMs }).catch(() => false);
}

function scheduleIdleTask(task) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(task, { timeout: 1200 });
    return;
  }
  window.setTimeout(task, 0);
}

function replaceAnswerModalContent(nextInteraction) {
  if (uiDialog || !nextInteraction || !ANSWER_MODAL_TYPES.has(nextInteraction.type)) return false;
  const existingBackdrop = app.querySelector(ANSWER_MODAL_SELECTOR);
  const existingType = answerModalTypeFrom(existingBackdrop);
  if (!existingType || answerModalFamily(existingType) !== answerModalFamily(nextInteraction.type)) return false;
  if (ANSWER_MODAL_RESULT_TYPES.has(existingType) || ANSWER_MODAL_RESULT_TYPES.has(nextInteraction.type)) return false;

  const template = document.createElement("template");
  template.innerHTML = renderModal(nextInteraction).trim();
  const nextBackdrop = template.content.firstElementChild;
  const existingCard = existingBackdrop.querySelector(".modal-card");
  const nextCard = nextBackdrop?.querySelector(".modal-card");
  if (!nextBackdrop || !existingCard || !nextCard) return false;

  syncAttributes(existingBackdrop, nextBackdrop);
  syncAttributes(existingCard, nextCard);
  existingCard.innerHTML = nextCard.innerHTML;

  existingBackdrop.classList.add("is-answer-modal-steady");
  return true;
}

function replaceGraduationFlowModalContent(nextInteraction) {
  if (uiDialog || !isSoftGraduationFlowInteraction(nextInteraction)) return false;
  const existingBackdrop = app.querySelector(".modal-backdrop-graduation_ceremony, .modal-backdrop-ending_memory");
  const existingCard = existingBackdrop?.querySelector(".modal-card.graduation-flow-card");
  if (!existingBackdrop || !existingCard) return false;

  const template = document.createElement("template");
  template.innerHTML = renderModal(nextInteraction).trim();
  const nextBackdrop = template.content.firstElementChild;
  const nextCard = nextBackdrop?.querySelector(".modal-card.graduation-flow-card");
  if (!nextBackdrop || !nextCard) return false;
  if (existingBackdrop.dataset.graduationFlowStep === nextBackdrop.dataset.graduationFlowStep) return false;

  const swapToken = graduationFlowSwapToken + 1;
  graduationFlowSwapToken = swapToken;
  clearGraduationFlowSwapTimers();
  existingBackdrop.classList.add("is-graduation-flow-steady", "is-graduation-flow-soft-leave");
  graduationFlowSwapTimer = window.setTimeout(() => {
    graduationFlowSwapTimer = null;
    if (swapToken !== graduationFlowSwapToken || !existingBackdrop.isConnected || !existingCard.isConnected) return;
    syncAttributes(existingBackdrop, nextBackdrop);
    syncAttributes(existingCard, nextCard);
    existingCard.innerHTML = nextCard.innerHTML;
    existingBackdrop.classList.remove("is-graduation-flow-soft-leave");
    existingBackdrop.classList.add("is-graduation-flow-steady", "is-graduation-flow-soft-swap");
    graduationFlowSwapCleanupTimer = window.setTimeout(() => {
      if (swapToken !== graduationFlowSwapToken) return;
      graduationFlowSwapCleanupTimer = null;
      existingBackdrop.classList.remove("is-graduation-flow-soft-swap");
    }, 460);
  }, 120);
  return true;
}

function clearGraduationFlowSwapTimers() {
  if (graduationFlowSwapTimer !== null) {
    window.clearTimeout(graduationFlowSwapTimer);
    graduationFlowSwapTimer = null;
  }
  if (graduationFlowSwapCleanupTimer !== null) {
    window.clearTimeout(graduationFlowSwapCleanupTimer);
    graduationFlowSwapCleanupTimer = null;
  }
}

function isSoftGraduationFlowInteraction(interaction) {
  if (interaction?.type === "graduation_ceremony") return true;
  return interaction?.type === "ending_memory"
    && ["first_photo", "second_photo"].includes(interaction.memoryStep);
}

function shouldLockCommandTarget(command, interaction) {
  if (command === "route-select" || command === "start-ielts-exam") return true;
  if (command !== "modal-option" || !interaction) return false;
  return Boolean(interaction.blocks) || ANSWER_MODAL_TYPES.has(interaction.type);
}

function isStaleModalCommandTarget(command, target, interaction) {
  if (command !== "modal-option") return false;
  const targetType = target.dataset.modalType ?? "";
  if (targetType && targetType !== (interaction?.type ?? "")) return true;
  const targetKey = target.dataset.modalKey ?? "";
  return Boolean(targetKey && targetKey !== modalCommandKey(interaction));
}

function unlockCommandTarget(target) {
  delete target.dataset.commandPending;
  target.removeAttribute("aria-disabled");
  if ("disabled" in target) {
    target.disabled = false;
  }
}

function answerModalTypeFrom(backdrop) {
  if (!backdrop) return "";
  for (const type of ANSWER_MODAL_TYPES) {
    if (backdrop.classList.contains(`modal-backdrop-${type}`)) return type;
  }
  return "";
}

function answerModalFamily(type) {
  if (type.startsWith("course_")) return "course";
  if (type.startsWith("ielts_")) return "ielts";
  if (type.startsWith("route_")) return "route";
  return "";
}

function syncAttributes(target, source) {
  for (const attribute of [...target.attributes]) {
    target.removeAttribute(attribute.name);
  }
  for (const { name, value } of source.attributes) {
    target.setAttribute(name, value);
  }
}

function syncQuestionCountdown() {
  const countdown = app.querySelector("[data-question-countdown='true']");
  if (!countdown) {
    clearQuestionCountdown(true);
    return;
  }
  const countdownKey = countdown.dataset.questionCountdownKey || "";
  const totalSeconds = Math.max(1, Number(countdown.dataset.questionCountdownSeconds) || QUESTION_COUNTDOWN_FALLBACK_SECONDS);
  const now = Date.now();
  if (countdownKey !== questionCountdownKey || questionCountdownEndsAt <= now) {
    questionCountdownKey = countdownKey;
    questionCountdownEndsAt = now + totalSeconds * 1000;
  }

  clearQuestionCountdown(false);
  const tick = () => {
    if (!countdown.isConnected) {
      clearQuestionCountdown(true);
      return;
    }
    const remaining = Math.max(0, Math.ceil((questionCountdownEndsAt - Date.now()) / 1000));
    countdown.dataset.questionCountdownRemaining = String(remaining);
    const value = countdown.querySelector("[data-question-countdown-value]");
    if (value) value.textContent = String(remaining).padStart(2, "0");
    countdown.classList.toggle("is-urgent", remaining <= 10);
    if (remaining <= 0) {
      clearQuestionCountdown(false);
      resolveQuestionCountdownTimeout(countdownKey);
    }
  };
  tick();
  if (questionCountdownTimer === null && questionCountdownEndsAt > Date.now()) {
    questionCountdownTimer = window.setInterval(tick, 250);
  }
}

function resolveQuestionCountdownTimeout(expiredCountdownKey) {
  const activeCountdown = app.querySelector("[data-question-countdown='true']");
  if (activeCountdown?.dataset.questionCountdownKey !== expiredCountdownKey) return;
  if (!state || !["course_question", "ielts_question", "route_question"].includes(state.pendingInteraction?.type)) return;

  const result = choosePendingInteractionOption(state, QUESTION_COUNTDOWN_TIMEOUT_OPTION_ID);
  if (!result.ok) {
    console.warn("Question countdown timeout rejected", result);
    return;
  }
  advanceGameFlow(state);
  commitEndingToCollection();
  saveState("question_timeout");
  render();
}

function clearQuestionCountdown(resetState = false) {
  if (questionCountdownTimer !== null) {
    window.clearInterval(questionCountdownTimer);
    questionCountdownTimer = null;
  }
  if (resetState) {
    questionCountdownKey = "";
    questionCountdownEndsAt = 0;
  }
}

async function saveEndingPageScreenshot(trigger = null) {
  if (endingScreenshotSaveInProgress) return false;
  const requestId = ++endingScreenshotSaveRequestId;
  const shell = app.querySelector(".ending-shell");
  if (!shell) throw new Error("Ending page is not ready.");
  const restoreButton = markEndingScreenshotButtonSaving(trigger);
  endingScreenshotSaveInProgress = true;
  try {
    const blob = await captureEndingPageScreenshotBlob(shell);
    if (requestId !== endingScreenshotSaveRequestId || !shell.isConnected) return false;
    downloadEndingPageScreenshot(shell, blob);
    return true;
  } finally {
    if (requestId === endingScreenshotSaveRequestId) {
      endingScreenshotSaveInProgress = false;
      restoreButton();
    }
  }
}

function downloadEndingPageScreenshot(shell, blob) {
  const url = URL.createObjectURL(blob);
  const title = shell.querySelector("#ending-title")?.textContent?.trim() || "人生结局";
  const link = document.createElement("a");
  link.href = url;
  link.download = `第二十五小时-${endingScreenshotFilenamePart(title)}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function endingScreenshotButtonFrom(trigger) {
  return trigger?.closest?.("[data-command='save-ending-page-screenshot']") ?? null;
}

function markEndingScreenshotButtonSaving(trigger) {
  const button = endingScreenshotButtonFrom(trigger);
  const detail = button?.querySelector(".start-entry-copy em");
  if (!detail) return () => {};

  window.clearTimeout(endingScreenshotFeedbackTimer);
  const previousDetail = detail.textContent;
  detail.textContent = "请稍后，正在保存结局图片";
  return () => {
    if (detail.isConnected) detail.textContent = previousDetail;
  };
}

function flashEndingScreenshotButtonDetail(trigger, message) {
  const button = endingScreenshotButtonFrom(trigger);
  const detail = button?.querySelector(".start-entry-copy em");
  if (!detail) return;
  window.clearTimeout(endingScreenshotFeedbackTimer);
  const previousDetail = detail.textContent;
  detail.textContent = message;
  endingScreenshotFeedbackTimer = window.setTimeout(() => {
    if (detail.isConnected) detail.textContent = previousDetail;
  }, 1800);
}

function resetEndingScreenshotState() {
  endingScreenshotSaveRequestId += 1;
  endingScreenshotSaveInProgress = false;
  window.clearTimeout(endingScreenshotFeedbackTimer);
  endingScreenshotFeedbackTimer = null;
}

function endingScreenshotErrorMessage(error) {
  const message = String(error?.message ?? "");
  if (message.includes("超时") || message.includes("不支持")) return message;
  return "保存失败，请稍后再试。";
}

function endingScreenshotFilenamePart(value) {
  const normalized = String(value ?? "人生结局")
    .replace(/\s+/g, " ")
    .replace(/\s*——\s*/g, "——")
    .trim();
  return normalized.replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "人生结局";
}

function restoreStableRiskSlot(previousRiskSlot) {
  if (!previousRiskSlot) return;
  const nextRiskSlot = app.querySelector(".log-risk-slot:not(.is-leaving)");
  if (!nextRiskSlot || riskSlotSignature(previousRiskSlot) !== riskSlotSignature(nextRiskSlot)) return;
  previousRiskSlot.classList.add("is-stable");
  previousRiskSlot.removeAttribute("aria-hidden");
  nextRiskSlot.replaceWith(previousRiskSlot);
}

function riskSlotSignature(riskSlot) {
  return [...riskSlot.querySelectorAll(".risk-banner p")]
    .map((item) => item.textContent.trim())
    .join("\n");
}

function animateRemovedRiskSlot(leavingRiskSlot) {
  if (!leavingRiskSlot || app.querySelector(".log-risk-slot")) return;
  const logHero = app.querySelector(".log-hero");
  if (!logHero) return;
  leavingRiskSlot.classList.remove("is-stable");
  leavingRiskSlot.classList.add("is-leaving");
  leavingRiskSlot.setAttribute("aria-hidden", "true");
  logHero.append(leavingRiskSlot);
  window.setTimeout(() => leavingRiskSlot.remove(), 320);
}

function renderUiDialogLayer() {
  const existing = currentUiDialogLayer();
  removeStaleUiDialogLayers(existing);
  if (!bootReady || !uiDialog) return;
  const renderCollection = viewCollection();
  const overlayVm = withRemoteLeaderboard(state ? toViewModel(state, renderCollection) : collectionViewModel(renderCollection));
  const overlay = renderOverlay(overlayVm, { theme, uiDialog, language: uiLanguage });
  if (!overlay) return;
  const template = document.createElement("template");
  template.innerHTML = overlay.trim();
  const next = template.content.firstElementChild;
  if (!next) return;
  next.dataset.uiDialogLayer = "true";
  next.dataset.uiDialogId = uiDialog;
  prepareUiDialogLayerForReuse(existing);
  if (existing && replaceShopDialogContent(existing, next)) {
    return;
  }
  if (existing && replaceCompetitionDialogContent(existing, next)) {
    return;
  }
  if (existing && replaceLeaderboardDialogContent(existing, next)) {
    return;
  }
  if (existing && replaceSoftNavDialogContent(existing, next)) {
    return;
  }
  if (existing && replaceSameUiDialogLayer(existing, next)) {
    return;
  }
  if (existing) {
    next.classList.add("is-switching-in");
    existing.classList.add("is-switching-out");
  }
  app.append(next);
  if (existing) {
    window.setTimeout(() => existing.remove(), UI_DIALOG_REPLACE_MS);
  }
}

function replaceSameUiDialogLayer(existing, next) {
  if (existing.dataset.uiDialogId !== next.dataset.uiDialogId) return false;
  existing.className = next.className;
  existing.innerHTML = next.innerHTML;
  existing.dataset.uiDialogLayer = "true";
  existing.dataset.uiDialogId = next.dataset.uiDialogId;
  return true;
}

function refreshLeaderboardDialogContent() {
  const existing = currentUiDialogLayer();
  if (!existing) {
    renderUiDialogLayer();
    return;
  }
  const renderCollection = viewCollection();
  const overlayVm = withRemoteLeaderboard(state ? toViewModel(state, renderCollection) : collectionViewModel(renderCollection));
  const overlay = renderOverlay(overlayVm, { theme, uiDialog, language: uiLanguage });
  if (!overlay) return;
  const template = document.createElement("template");
  template.innerHTML = overlay.trim();
  const next = template.content.firstElementChild;
  if (!next) return;
  next.dataset.uiDialogLayer = "true";
  next.dataset.uiDialogId = uiDialog;
  if (!replaceLeaderboardDialogContent(existing, next)) {
    renderUiDialogLayer();
  }
}

function uiDialogLayers() {
  return [...app.querySelectorAll(".modal-backdrop[data-ui-dialog-layer='true']")];
}

function currentUiDialogLayer() {
  const layers = uiDialogLayers();
  return layers[layers.length - 1] ?? null;
}

function currentModalBackdrop() {
  const backdrops = [...app.querySelectorAll(".modal-backdrop")];
  return backdrops[backdrops.length - 1] ?? null;
}

function prepareUiDialogLayerForReuse(layer) {
  layer?.classList.remove("is-closing", "is-switching-in", "is-switching-out");
}

function removeStaleUiDialogLayers(activeLayer = null) {
  for (const layer of uiDialogLayers()) {
    if (layer !== activeLayer) {
      layer.remove();
    }
  }
}

function viewCollection() {
  return SENIOR_TEST_COPY_MODE ? { ...collection, hasSeenEndingMemory: true } : collection;
}

function replaceShopDialogContent(existing, next) {
  const existingShop = existing.querySelector(".shop-modal");
  const nextShop = next.querySelector(".shop-modal");
  if (!existingShop || !nextShop) return false;
  const existingTabs = existingShop.querySelector(".shop-category-tabs");
  const nextTabs = nextShop.querySelector(".shop-category-tabs");
  const existingCategory = existingShop.querySelector(".shop-category");
  const nextCategory = nextShop.querySelector(".shop-category");
  if (!existingTabs || !nextTabs || !existingCategory || !nextCategory) return false;

  existingTabs.replaceWith(nextTabs);
  existingCategory.setAttribute("aria-label", nextCategory.getAttribute("aria-label") || "");
  existingCategory.classList.remove("is-shop-category-soft-enter");
  existingCategory.innerHTML = nextCategory.innerHTML;
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    void existingCategory.offsetWidth;
    existingCategory.classList.add("is-shop-category-soft-enter");
    window.setTimeout(() => {
      existingCategory.classList.remove("is-shop-category-soft-enter");
    }, UI_DIALOG_REPLACE_MS);
  }
  return true;
}

function replaceCompetitionDialogContent(existing, next) {
  const existingCompetition = existing.querySelector(".competition-modal");
  const nextCompetition = next.querySelector(".competition-modal");
  if (!existingCompetition || !nextCompetition) return false;
  existingCompetition.className = nextCompetition.className;
  existingCompetition.innerHTML = nextCompetition.innerHTML;
  return true;
}

function replaceLeaderboardDialogContent(existing, next) {
  if (existing.dataset.uiDialogId !== "leaderboard" || next.dataset.uiDialogId !== "leaderboard") return false;
  const existingBoard = existing.querySelector(".leaderboard-dialog-board");
  const nextBoard = next.querySelector(".leaderboard-dialog-board");
  if (!existingBoard || !nextBoard) return false;
  existingBoard.innerHTML = nextBoard.innerHTML;
  return true;
}

function replaceSoftNavDialogContent(existing, next) {
  const existingModal = existing.querySelector(SOFT_NAV_DIALOG_SELECTOR);
  const nextModal = next.querySelector(SOFT_NAV_DIALOG_SELECTOR);
  if (!existingModal || !nextModal || !canReuseSoftNavDialog(existingModal, nextModal)) return false;
  const sameInternshipWork = softNavModalClass(existingModal) === "internship-work-modal"
    && softNavModalClass(nextModal) === "internship-work-modal";
  existingModal.className = nextModal.className;
  existingModal.innerHTML = nextModal.innerHTML;
  if (sameInternshipWork && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    existingModal.classList.add("is-soft-nav-switch");
    window.setTimeout(() => {
      existingModal.classList.remove("is-soft-nav-switch");
    }, 180);
  }
  return true;
}

function softNavModalClass(modal) {
  return SOFT_NAV_MODAL_CLASSES.find((className) => modal.classList.contains(className)) || "";
}

function canReuseSoftNavDialog(existingModal, nextModal) {
  const existingClass = softNavModalClass(existingModal);
  const nextClass = softNavModalClass(nextModal);
  if (!existingClass || !nextClass) return false;
  if (existingClass === nextClass) return true;
  return SOFT_NAV_REUSABLE_TRANSITIONS.has(`${existingClass}->${nextClass}`);
}

function canUseViewTransition() {
  return typeof document.startViewTransition === "function"
    && window.matchMedia("(hover: hover) and (pointer: fine)").matches
    && !isRunningInScaledStage()
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isRunningInScaledStage() {
  const frame = window.frameElement;
  if (!frame) return false;
  try {
    const rect = frame.getBoundingClientRect();
    const scaleX = rect.width / Math.max(1, window.innerWidth);
    const scaleY = rect.height / Math.max(1, window.innerHeight);
    return Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01;
  } catch {
    return false;
  }
}

function shouldPreloadEndingMemoryAnimation() {
  return state?.pendingInteraction?.type === "ending_memory"
    && ["first_photo", "second_photo"].includes(state.pendingInteraction.memoryStep);
}

function queueEndingMemoryAnimationWarmup({ includeSceneImages = false } = {}) {
  if (!endingMemoryAnimationWarmupQueued) {
    endingMemoryAnimationWarmupQueued = true;
    appendEndingMemoryAnimationPreloadLink();
    appendEndingMemoryRuntimePreloadLinks();
    warmupEndingMemoryRuntimeFetches();
    ensureEndingMemoryAnimationPreload();
  }
  if (includeSceneImages) {
    ensureEndingMemoryInitialImagesPreload();
    queueEndingMemorySceneImagePreloads();
  }
}

function appendEndingMemoryAnimationPreloadLink() {
  if (document.querySelector('link[data-ending-memory-animation-preload="true"]')) return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = ENDING_MEMORY_ANIMATION_SRC;
  link.as = "document";
  link.dataset.endingMemoryAnimationPreload = "true";
  document.head.append(link);
}

function appendEndingMemoryRuntimePreloadLinks() {
  for (const source of ENDING_MEMORY_RUNTIME_SOURCES) {
    const href = assetUrl(source);
    if (!href || hasEndingMemoryRuntimePreloadLink(href)) continue;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.as = endingMemoryRuntimePreloadType(source);
    if (resourceOrigin(href) !== window.location.origin) link.setAttribute("crossorigin", "");
    link.dataset.endingMemoryRuntimePreload = "true";
    document.head.append(link);
  }
}

function hasEndingMemoryRuntimePreloadLink(href) {
  return Array.from(document.head.querySelectorAll('link[data-ending-memory-runtime-preload="true"]'))
    .some((link) => link.href === href);
}

function endingMemoryRuntimePreloadType(source) {
  if (/\.css(?:[?#].*)?$/iu.test(source)) return "style";
  if (/\.m?js(?:[?#].*)?$/iu.test(source)) return "script";
  return "fetch";
}

function warmupEndingMemoryRuntimeFetches() {
  if (endingMemoryRuntimeWarmupPromise) return endingMemoryRuntimeWarmupPromise;
  if (typeof window.fetch !== "function") {
    endingMemoryRuntimeWarmupPromise = Promise.resolve([]);
    return endingMemoryRuntimeWarmupPromise;
  }
  const sources = ENDING_MEMORY_RUNTIME_SOURCES;
  endingMemoryRuntimeWarmupPromise = Promise.allSettled(sources.map((source) => {
    const url = assetUrl(source);
    if (!url) return Promise.resolve(false);
    return fetchResourceIntoCache(url, { timeoutMs: STARTUP_RESOURCE_PRELOAD_TIMEOUT_MS }).catch(() => false);
  })).then((results) => {
    const allReady = results.every((result) => result.status === "fulfilled" && result.value !== false);
    if (!allReady) endingMemoryRuntimeWarmupPromise = null;
    return results;
  });
  return endingMemoryRuntimeWarmupPromise;
}

function ensureEndingMemoryAnimationPreload() {
  appendEndingMemoryAnimationPreloadLink();
  appendEndingMemoryRuntimePreloadLinks();
  warmupEndingMemoryRuntimeFetches();
  if (endingMemoryAnimationPreload?.failed) {
    endingMemoryAnimationPreload = null;
  }
  if (endingMemoryAnimationPreload) return endingMemoryAnimationPreload;
  const preload = {
    ready: false,
    failed: false,
    promise: null,
  };
  preload.promise = (typeof window.fetch === "function"
    ? window.fetch(ENDING_MEMORY_ANIMATION_SRC, { cache: "force-cache" })
    : Promise.resolve()
  ).then(
    () => {
      preload.ready = true;
      preload.failed = false;
      endingMemoryAnimationPreloadFailureCount = 0;
      return true;
    },
    () => {
      preload.failed = true;
      endingMemoryAnimationPreloadFailureCount += 1;
      if (endingMemoryAnimationPreload === preload) {
        endingMemoryAnimationPreload = null;
      }
      return false;
    },
  );
  endingMemoryAnimationPreload = preload;
  return preload;
}

function endingMemoryInitialImageSources() {
  return ENDING_MEMORY_SCENE_IMAGE_SOURCES.slice(0, ENDING_MEMORY_ENTRY_INITIAL_IMAGE_COUNT);
}

function ensureEndingMemoryInitialImagesPreload() {
  if (endingMemoryInitialImagesPreload) return endingMemoryInitialImagesPreload;
  const preload = {
    ready: false,
    promise: null,
  };
  preload.promise = preloadImagesForGate(endingMemoryInitialImageSources(), {
    timeoutMs: ENDING_MEMORY_ENTRY_READY_TIMEOUT_MS,
    resourceTimeoutMs: STARTUP_RESOURCE_PRELOAD_TIMEOUT_MS,
    concurrency: ENDING_MEMORY_ENTRY_IMAGE_PRELOAD_CONCURRENCY,
    prioritySources: new Set(endingMemoryInitialImageSources()),
  }).then((result) => {
    preload.ready = result.ok;
    if (!result.ok) endingMemoryInitialImagesPreload = null;
    return result.ok;
  }, () => {
    endingMemoryInitialImagesPreload = null;
    return false;
  });
  endingMemoryInitialImagesPreload = preload;
  return preload;
}

function queueEndingMemorySceneImagePreloads() {
  if (endingMemorySceneImagePreloadsQueued) return;
  endingMemorySceneImagePreloadsQueued = true;
  const initialSources = new Set(endingMemoryInitialImageSources());
  const remainingSources = ENDING_MEMORY_SCENE_IMAGE_SOURCES.filter((source) => !initialSources.has(source));
  preloadImagesForGate(remainingSources, {
    timeoutMs: ENDING_MEMORY_SCENE_IMAGE_PRELOAD_TIMEOUT_MS,
    resourceTimeoutMs: STARTUP_RESOURCE_PRELOAD_TIMEOUT_MS,
    concurrency: ENDING_MEMORY_SCENE_IMAGE_PRELOAD_CONCURRENCY,
    prioritySources: new Set(remainingSources.slice(0, ENDING_MEMORY_ENTRY_INITIAL_IMAGE_COUNT)),
    requireSuccess: true,
    retryDelayMs: 500,
  }).catch(() => {});
}

function waitForEndingMemoryEntryReadiness({ timeoutMs = 0 } = {}) {
  queueEndingMemorySceneImagePreloads();
  const ready = Promise.allSettled([
    ensureEndingMemoryAnimationPreload().promise,
    warmupEndingMemoryRuntimeFetches(),
    ensureEndingMemoryInitialImagesPreload().promise,
  ]).then(() => true);
  return timeoutMs > 0
    ? Promise.race([ready, wait(timeoutMs).then(() => false)])
    : ready;
}

function endingMemoryAnimationReady() {
  return (Boolean(endingMemoryAnimationPreload?.ready)
    && Boolean(endingMemoryInitialImagesPreload?.ready))
    || endingMemoryAnimationPreloadFailureCount >= ENDING_MEMORY_ANIMATION_PRELOAD_BYPASS_FAILURES;
}

function waitForEndingMemoryAnimation(target, id) {
  const button = target.closest("button");
  if (!button || button.dataset.endingMemoryWaiting === "true") return true;
  const label = button.querySelector("strong") ?? button;
  const previousLabel = label.textContent;
  button.dataset.endingMemoryWaiting = "true";
  button.dataset.previousLabel = previousLabel;
  button.disabled = true;
  button.setAttribute("aria-disabled", "true");
  label.textContent = ENDING_MEMORY_ANIMATION_WAIT_LABEL;
  waitForEndingMemoryEntryReadiness({ timeoutMs: ENDING_MEMORY_ENTRY_READY_TIMEOUT_MS }).finally(() => {
    if (!button.isConnected) return;
    if (state?.pendingInteraction?.type === "ending_memory" && state.pendingInteraction.memoryStep === "second_photo") {
      label.textContent = button.dataset.previousLabel || previousLabel;
      delete button.dataset.endingMemoryWaiting;
      delete button.dataset.previousLabel;
      button.disabled = false;
      button.removeAttribute("aria-disabled");
      delayEndingMemoryEntry(target, id);
      return;
    }
    label.textContent = button.dataset.previousLabel || previousLabel;
    button.disabled = false;
    button.removeAttribute("aria-disabled");
    delete button.dataset.endingMemoryWaiting;
    delete button.dataset.previousLabel;
  });
  return true;
}

function shouldDelayEndingMemoryEntry(command, id) {
  return command === "modal-option"
    && id === "confirm"
    && state?.pendingInteraction?.type === "ending_memory"
    && state.pendingInteraction.memoryStep === "second_photo";
}

function delayEndingMemoryEntry(target, id) {
  const button = target.closest("button");
  if (button?.dataset.endingMemoryEntering === "true") return true;
  const label = button?.querySelector("strong") ?? button;
  const previousLabel = label?.textContent ?? "";
  if (button) {
    button.dataset.endingMemoryEntering = "true";
    button.dataset.previousLabel = previousLabel;
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
    if (label) label.textContent = ENDING_MEMORY_ANIMATION_WAIT_LABEL;
  }
  fadeCurrentMusicOut(ENDING_MEMORY_ENTRY_AUDIO_FADE_MS).finally(() => {
    if (!state?.pendingInteraction || state.pendingInteraction.memoryStep !== "second_photo") {
      if (button?.isConnected) {
        if (label) label.textContent = button.dataset.previousLabel || previousLabel;
        delete button.dataset.endingMemoryEntering;
        delete button.dataset.previousLabel;
        button.disabled = false;
        button.removeAttribute("aria-disabled");
      }
      return;
    }
    const result = choosePendingInteractionOption(state, id);
    if (!result.ok) {
      if (button?.isConnected) {
        if (label) label.textContent = button.dataset.previousLabel || previousLabel;
        delete button.dataset.endingMemoryEntering;
        delete button.dataset.previousLabel;
        button.disabled = false;
        button.removeAttribute("aria-disabled");
      }
      console.warn("Command rejected", result);
      return;
    }
    advanceGameFlow(state);
    commitEndingToCollection();
    saveState();
    render();
  });
  return true;
}

function shouldDelayEndingMemoryExit(command, id) {
  return command === "modal-option"
    && ["confirm", "skip"].includes(id)
    && state?.pendingInteraction?.type === "ending_memory"
    && state.pendingInteraction.memoryStep === "ending_animation";
}

function delayEndingMemoryExit(target, id) {
  const shell = app.querySelector(".ending-memory-animation-shell");
  if (!shell || shell.classList.contains("is-exiting")) return true;
  shell.classList.add("is-exiting");
  const button = target.closest("button");
  if (button && "disabled" in button) {
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
  }
  window.setTimeout(() => {
    const result = choosePendingInteractionOption(state, id);
    if (!result.ok) {
      console.warn("Command rejected", result);
      return;
    }
    advanceGameFlow(state);
    commitEndingToCollection();
    saveState();
    endingMemoryExitAudioRestorePending = true;
    musicState.paused = false;
    autoResumePending = true;
    render();
  }, ENDING_MEMORY_EXIT_MS);
  return true;
}

function applyTheme(nextTheme) {
  const normalizedTheme = nextTheme === "dark" ? "dark" : "light";
  if (theme === normalizedTheme && document.documentElement.dataset.theme === normalizedTheme) return;
  theme = normalizedTheme;
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.classList.add("is-theme-switching");
  document.documentElement.dataset.theme = theme;
  syncThemeDependentDom();
  window.setTimeout(() => {
    document.documentElement.classList.remove("is-theme-switching");
  }, 460);
}

function applyUiLanguage(nextLanguage) {
  const normalizedLanguage = normalizeUiLanguage(nextLanguage);
  if (uiLanguage === normalizedLanguage && document.documentElement.lang === normalizedLanguage) return;
  uiLanguage = normalizedLanguage;
  localStorage.setItem(LANGUAGE_KEY, uiLanguage);
  syncDocumentLanguage();
  if (uiDialog) {
    renderUiDialogLayer();
  }
}

function syncDocumentLanguage() {
  document.documentElement.lang = uiLanguage;
  document.documentElement.dataset.language = uiLanguage;
}

function syncThemeDependentDom() {
  const themeIconUrl = assetUrl(themeIconPath(theme));
  app.querySelectorAll(".start-icon-theme, .system-icon-theme").forEach((icon) => {
    const image = icon.querySelector("img");
    if (image) {
      image.src = themeIconUrl;
      return;
    }
    icon.innerHTML = renderUiIcon(themeIconPath(theme), "主题");
  });
  app.querySelectorAll("[data-command='toggle-theme']").forEach((button) => {
    if (button.classList.contains("theme-switch")) {
      button.textContent = theme === "dark" ? "深色" : "浅色";
    } else if (button.classList.contains("pixel-button")) {
      button.textContent = theme === "dark" ? "浅色模式" : "深色模式";
    }
  });
  app.querySelectorAll("[data-command='set-theme']").forEach((button) => {
    const isActive = button.dataset.id === theme;
    button.classList.toggle("is-primary", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function runCharacterDrawIntro() {
  pendingCharacterDrawIntro = false;
  clearCharacterDrawRevealTimer();
  const shell = app.querySelector(".character-draw-shell");
  const toggle = app.querySelector("#character-card-reveal");
  if (!shell || !toggle) return;
  shell.classList.add("is-profile-draw-intro");
  toggle.checked = false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    toggle.checked = true;
    shell.classList.add("is-card-revealed");
    return;
  }
  characterDrawRevealTimer = setTimeout(() => {
    toggle.checked = true;
    shell.classList.add("is-card-revealed");
    characterDrawRevealTimer = null;
  }, CHARACTER_DRAW_AUTO_REVEAL_MS);
}

function clearCharacterDrawRevealTimer() {
  if (!characterDrawRevealTimer) return;
  clearTimeout(characterDrawRevealTimer);
  characterDrawRevealTimer = null;
}

function nudgeLoadingProgress(desiredProgress, actualProgress = loadingActualProgress) {
  loadingActualProgress = Math.max(loadingActualProgress, clampLoadingProgress(actualProgress));
  const nextProgress = boundedStartupLoadingProgress(desiredProgress, loadingActualProgress, {
    maxAhead: STARTUP_LOADING_MAX_AHEAD_PERCENT,
    cap: STARTUP_LOADING_PRE_COMPLETE_CAP,
  });
  loadingProgress = Math.max(loadingProgress, nextProgress);
}

function markStartupTiming(label, details = {}) {
  if (!STARTUP_TIMING_ENABLED) return;
  startupTimingMarks.push({
    label,
    at: performance.now(),
    ...details,
  });
}

function logStartupTimingSummary() {
  if (!STARTUP_TIMING_ENABLED || startupTimingLogged || !startupTimingMarks.length) return;
  startupTimingLogged = true;
  const first = startupTimingMarks[0].at;
  const rows = startupTimingMarks.map((mark) => ({
    label: mark.label,
    ms: Math.round(mark.at - first),
    ...Object.fromEntries(Object.entries(mark).filter(([key]) => key !== "label" && key !== "at")),
  }));
  console.table(rows);
}

function clampLoadingProgress(progress) {
  const number = Number(progress);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function updateLoadingProgress() {
  const progressValue = Math.max(0, Math.min(100, Math.round(Number(loadingProgress) || 0)));
  const loadingBar = app.querySelector(".loading-bar");
  if (!loadingBar) return;
  loadingBar.style.setProperty("--loading-progress", `${progressValue}%`);
  loadingBar.style.setProperty("--loading-progress-ratio", String(progressValue / 100));
  loadingBar.setAttribute("aria-valuenow", String(progressValue));
}

function startLoadingProgress() {
  loadingProgressTimer = setInterval(() => {
    if (bootReady) {
      stopLoadingProgress();
      return;
    }
    const progressCap = boundedStartupLoadingProgress(
      loadingActualProgress + STARTUP_LOADING_MAX_AHEAD_PERCENT,
      loadingActualProgress,
      {
        maxAhead: STARTUP_LOADING_MAX_AHEAD_PERCENT,
        cap: STARTUP_LOADING_PRE_COMPLETE_CAP,
      },
    );
    if (loadingProgress >= progressCap) return;
    const increment = loadingProgress < 36 ? 2
      : loadingProgress < 54 ? 1
      : 0.35;
    loadingProgress = Math.min(progressCap, loadingProgress + increment);
    render();
  }, 420);
}

function stopLoadingProgress() {
  if (!loadingProgressTimer) return;
  clearInterval(loadingProgressTimer);
  loadingProgressTimer = null;
}

function shouldShowLoadingFullscreenTip() {
  if (SURFACE_PARAM === "mobile" || SURFACE_PARAM === "tablet") return false;
  const hasTouch = (navigator.maxTouchPoints || 0) > 0
    || navigator.userAgentData?.mobile === true
    || window.matchMedia("(pointer: coarse)").matches;
  return !hasTouch && window.matchMedia(DESKTOP_FULLSCREEN_TIP_MEDIA_QUERY).matches;
}

function isMobileGameplayBlocked() {
  return isMobileStartSurface;
}

function showMobileStartBlockedDialog() {
  clearUiDialogCloseTimer();
  uiDialog = "mobile_start_blocked";
  renderUiDialogLayer();
}

function isMobileEntryCommand(command, id) {
  if (MOBILE_ENTRY_SHELL_COMMANDS.has(command)) return true;
  if (command === "ui-dialog") return MOBILE_ENTRY_DIALOG_IDS.has(id);
  if (command === "open-external-link") return MOBILE_ENTRY_EXTERNAL_IDS.has(id);
  return false;
}

function shouldBlockMobileGameplayCommand(command, id) {
  return isMobileStartSurface && !isMobileEntryCommand(command, id);
}

function closeSupportQrPreview() {
  app.querySelector(".support-qr-preview")?.remove();
}

function showSupportQrPreview(target) {
  const src = target.dataset.src;
  const label = target.dataset.label || "收款码";
  if (!src) return;
  closeSupportQrPreview();
  const preview = document.createElement("div");
  preview.className = "support-qr-preview";
  preview.innerHTML = `
    <button class="support-qr-preview-backdrop" type="button" data-command="close-support-qr-preview" aria-label="关闭放大二维码"></button>
    <figure class="support-qr-preview-card">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(label)}" decoding="async" />
      <button class="support-qr-preview-close pixel-button" type="button" data-command="close-support-qr-preview" aria-label="关闭放大二维码">返回</button>
    </figure>
  `;
  app.append(preview);
}

function profileDraftFrom(profile) {
  return {
    nickname: String(profile?.nickname ?? ""),
    universityName: String(profile?.universityName ?? ""),
  };
}

function syncStartProfileDraftFromForm(form = app.querySelector("[data-form='start']")) {
  startProfileDraft = {
    nickname: String(form?.querySelector("input[name='nickname']")?.value ?? ""),
    universityName: String(form?.querySelector("input[name='universityName']")?.value ?? ""),
  };
}

function setStartProfileError(message, { focus = false } = {}) {
  startProfileError = String(message ?? "");
  const form = app.querySelector("[data-form='start']");
  const errorOutput = form?.querySelector("[data-start-profile-error]");
  const nicknameInput = form?.querySelector("input[name='nickname']");
  if (!form || !errorOutput || !nicknameInput) {
    render();
    return;
  }
  errorOutput.textContent = startProfileError;
  errorOutput.hidden = !startProfileError;
  if (startProfileError) {
    nicknameInput.setAttribute("aria-invalid", "true");
    nicknameInput.setAttribute("aria-describedby", "start-profile-name-error");
    if (focus) nicknameInput.focus({ preventScroll: true });
  } else {
    nicknameInput.removeAttribute("aria-invalid");
    nicknameInput.removeAttribute("aria-describedby");
  }
}

function startNewGameWithProfile(profile) {
  startProfileDraft = profileDraftFrom(profile);
  resetEndingScreenshotState();
  const result = startGameProfile(profile);
  if (!result.ok) {
    console.warn("Command rejected", result);
    uiDialog = "profile_invalid";
    render();
    return false;
  }
  const collectionResult = updateCollectionLatestProfile(collection, profile);
  collection = collectionResult.collection;
  if (collectionResult.changed && !SENIOR_TEST_COPY_MODE) {
    saveCollection(collection).catch((error) => {
      console.warn("Failed to save collection", error);
    });
  }
  state = result.state;
  hydrateStateFromCollection(state, collection);
  ensureRunEndingTrackSelected(state);
  attachHistoricalEventIds(state);
  reportGameSessionStart(state, { surface: telemetrySurface() });
  startMode = "menu";
  uiDialog = null;
  startProfileError = "";
  startProfileDraft = null;
  pendingGuideAfterThemeDialog = false;
  pendingCharacterDrawIntro = true;
  saveState();
  render();
  return true;
}

app.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form='start']");
  if (!form) return;
  const submitter = event.submitter?.closest?.("[data-command='start-game']");
  if (!submitter) return;
  event.preventDefault();
  if (isMobileGameplayBlocked()) {
    showMobileStartBlockedDialog();
    return;
  }
  const formData = new FormData(form);
  const profile = {
    nickname: formData.get("nickname"),
    universityName: formData.get("universityName"),
  };
  startProfileDraft = profileDraftFrom(profile);
  setStartProfileError("");
  startNewGameWithProfile(profile);
});

app.addEventListener("input", (event) => {
  const form = event.target?.closest?.("[data-form='start']");
  if (!form) return;
  syncStartProfileDraftFromForm(form);
  if (startProfileError && event.target?.matches?.("input[name='nickname']")) {
    setStartProfileError("");
  }
});

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-command]");
  if (!target) return;

  const command = target.dataset.command;
  const id = target.dataset.id;
  let result = { ok: true };
  if (command === "start-new-player-guide") {
    startNewPlayerGuide();
    return;
  }
  if (command === "new-player-guide-next") {
    moveNewPlayerGuide(1);
    return;
  }
  if (command === "new-player-guide-prev") {
    moveNewPlayerGuide(-1);
    return;
  }
  if (command === "new-player-guide-end") {
    endNewPlayerGuide({ focusGame: true });
    return;
  }
  if (command === "graduation-design-guide-end") {
    endNewPlayerGuide({ focusGame: true });
    render();
    return;
  }
  if (shouldBlockMobileGameplayCommand(command, id)) {
    showMobileStartBlockedDialog();
    return;
  }
  if (command === "zoom-support-qr") {
    showSupportQrPreview(target);
    return;
  }
  if (command === "close-support-qr-preview") {
    closeSupportQrPreview();
    return;
  }
  if (
    command === "modal-option"
    && id === "confirm"
    && state?.pendingInteraction?.type === "ending_memory"
    && state.pendingInteraction.memoryStep === "second_photo"
    && !endingMemoryAnimationReady()
  ) {
    waitForEndingMemoryAnimation(target, id);
    return;
  }
  if (shouldDelayEndingMemoryEntry(command, id)) {
    delayEndingMemoryEntry(target, id);
    return;
  }
  if (shouldDelayEndingMemoryExit(command, id)) {
    delayEndingMemoryExit(target, id);
    return;
  }
  if (isStaleModalCommandTarget(command, target, state?.pendingInteraction)) {
    return;
  }
  const lockCommandTarget = shouldLockCommandTarget(command, state?.pendingInteraction);
  if (lockCommandTarget) {
    if (target.dataset.commandPending === "true") {
      return;
    }
    target.dataset.commandPending = "true";
    target.setAttribute("aria-disabled", "true");
    if ("disabled" in target) {
      target.disabled = true;
    }
  }

  if (command === "show-start-form") {
    if (isMobileGameplayBlocked()) {
      showMobileStartBlockedDialog();
      return;
    }
    const latestProfile = latestProfileForNewGame(collection);
    if (latestProfile) {
      startNewGameWithProfile(latestProfile);
      return;
    }
    startProfileError = "";
    startProfileDraft = null;
    startMode = "profile";
    render();
    return;
  }
  if (command === "close-start-form") {
    startProfileError = "";
    startProfileDraft = null;
    startMode = "menu";
    render();
    return;
  }
  if (command === "ui-dialog") {
    if (id === "leaderboard") {
      queueLeaderboardRefreshAfterPending();
    }
    if (id === "coffee") {
      queueSupportImagePreloads({ immediate: true });
      reportCoffeeSupportClick({ surface: telemetrySurface() });
      if (isMobileStartSurface) {
        closeSupportQrPreview();
      }
      if (state) {
        result = recordCoffeeSupport(state);
        if (!result.ok) {
          console.warn("Command rejected", result);
          return;
        }
        saveState();
      } else {
        if (!SENIOR_TEST_COPY_MODE) {
          const collectionResult = recordCollectionCoffeeSupportClick(collection);
          collection = collectionResult.collection;
          if (collectionResult.unlockedAchievementId) {
            queueCollectionAchievementToast(collectionResult.unlockedAchievementId);
          }
          saveCollection(collection).catch((error) => {
            console.warn("Failed to save collection", error);
          });
        }
      }
    }
    clearUiDialogCloseTimer();
    uiDialog = id;
    if (id === "coffee") {
      render();
    } else {
      renderUiDialogLayer();
    }
    return;
  }
  if (command === "open-external-link") {
    const link = externalLinkForEntry(id);
    if (!link?.url) {
      console.warn("External link unavailable", { id, configKey: link?.configKey });
      return;
    }
    window.open(link.url, "_blank", "noopener,noreferrer");
    return;
  }
  if (command === "toggle-settings") {
    if (uiDialog === "game_settings") {
      closeUiDialogSmoothly();
    } else {
      clearUiDialogCloseTimer();
      uiDialog = "game_settings";
      renderUiDialogLayer();
    }
    return;
  }
  if (command === "close-ui-dialog") {
    closeUiDialogSmoothly();
    return;
  }
  if (command === "save-ending-page-screenshot") {
    saveEndingPageScreenshot(target)
      .then((saved) => {
        if (saved) flashEndingScreenshotButtonDetail(target, "已保存当前结局页面图片。");
      })
      .catch((error) => {
        console.warn("Failed to save ending page screenshot", error);
        flashEndingScreenshotButtonDetail(target, endingScreenshotErrorMessage(error));
      });
    return;
  }
  if (command === "set-theme") {
    applyTheme(id === "light" ? "light" : "dark");
    return;
  }
  if (command === "choose-startup-theme") {
    if (id === "light") {
      applyTheme("light");
    } else {
      if (theme === "dark") localStorage.setItem(THEME_KEY, "dark");
      applyTheme("dark");
    }
    uiDialog = pendingGuideAfterThemeDialog ? "guide_after_course_select" : null;
    pendingGuideAfterThemeDialog = false;
    render();
    return;
  }
  if (command === "set-language") {
    applyUiLanguage(id);
    return;
  }
  if (command === "toggle-theme") {
    applyTheme(theme === "dark" ? "light" : "dark");
    return;
  }
  if (command === "load-save") {
    if (isMobileGameplayBlocked()) {
      showMobileStartBlockedDialog();
      return;
    }
    const loadResult = loadSave();
    if (loadResult.ok) {
      state = loadResult.state;
      hydrateStateFromCollection(state, collection);
      const endingTrackSelected = ensureRunEndingTrackSelected(state);
      attachHistoricalEventIds(state);
      reportGameSessionStart(state, { surface: telemetrySurface() });
      commitEndingToCollection();
      const flowResult = advanceGameFlow(state);
      if (flowResult.ok && flowResult.steps > 0) {
        commitEndingToCollection();
        saveState("load_flow_recovery");
      } else if (endingTrackSelected) {
        saveState("load_ending_track_recovery");
      } else if (!flowResult.ok) {
        console.warn("Flow recovery after load failed", flowResult);
      }
      uiDialog = null;
    } else {
      uiDialog = "load_failed";
    }
    render();
    return;
  }
  if (command === "new-game") {
    if (state && !state.ending && id !== "confirmed") {
      uiDialog = "confirm_new_game";
      render();
      return;
    }
    if (state?.ending) {
      reportEndingTelemetry();
    } else {
      queueLeaderboardRefreshAfterPending({ force: true });
    }
    persistHistoricalEventIds(state);
    resetEndingScreenshotState();
    state = SENIOR_TEST_COPY_MODE ? createSeniorTestCopyState() : null;
    if (state) {
      ensureRunEndingTrackSelected(state);
      attachHistoricalEventIds(state);
    }
    uiDialog = null;
    pendingGuideAfterThemeDialog = false;
    graduationDesignGuidePending = false;
    startProfileError = "";
    startProfileDraft = null;
    startMode = "menu";
    // Only discard the current run save; submitted collection records stay intact.
    localStorage.removeItem(SAVE_KEY);
    resetMusicState({ reloadAudio: false });
    pendingStartMusicAutoplay = true;
    render();
    return;
  }
  if (command === "save") {
    const saveResult = saveState("manual_save");
    uiDialog = saveResult.ok ? "save_success" : "save_failed";
    render();
    return;
  }
  if (command === "music-toggle") {
    toggleMusic();
    return;
  }
  if (command === "music-next" || command === "music-prev") {
    const audio = currentMusicAudio();
    if (isMusicLocked(audio)) {
      setMusicStatus(musicLockReason(audio));
      return;
    }
    playTrackOffset(audio, command === "music-next" ? 1 : -1, { force: true, immediate: true });
    return;
  }

  if (!state) return;
  const interactionBeforeCommand = state.pendingInteraction;
  const shouldOpenCourseGuide = shouldOpenGuideAfterFreshmanCourseSelect(command, interactionBeforeCommand, state);
  const shouldOpenGraduationGuide = shouldOpenGraduationDesignGuideAfterYearStart(command, interactionBeforeCommand, state);
  const selectedRouteOptionId = command === "route-select" ? id : "";
  const confirmedRouteOptionId = command === "modal-option"
    && id !== "cancel"
    && ["route_commit", "route_contract"].includes(interactionBeforeCommand?.type)
    ? interactionBeforeCommand.optionId
    : "";

  switch (command) {
    case "reroll":
      result = rerollCharacters(state);
      if (result.ok) pendingCharacterDrawIntro = true;
      break;
    case "select-character":
      result = selectCharacter(state, id);
      break;
    case "perform-action":
      if (id === "special_skill") {
        clearUiDialogCloseTimer();
        uiDialog = "special_skill_confirm";
        renderUiDialogLayer();
        return;
      }
      result = performAction(state, id);
      break;
    case "confirm-special-skill": {
      const before = readVisibleMeterSnapshot(state);
      result = performAction(state, "special_skill");
      if (result.ok) {
        uiDialog = null;
        pendingSpecialSkillFeedback = specialSkillFeedbackFrom(before, readVisibleMeterSnapshot(state), state.profile?.characterId);
      }
      break;
    }
    case "buy-shop-item":
      result = purchaseShopItem(state, id);
      if (result.ok) uiDialog = null;
      break;
    case "route-select":
      result = chooseRouteOption(state, id);
      if (result.ok) uiDialog = null;
      break;
    case "internship-apply":
      result = applyForInternship(state, id);
      if (result.ok) uiDialog = null;
      break;
    case "competition-submit":
      result = submitCompetitionWork(state, id);
      if (result.ok) uiDialog = null;
      break;
    case "wanli-road-visit":
      result = visitWanliRoadLocation(state, id);
      if (result.ok) uiDialog = null;
      break;
    case "start-ielts-exam":
      result = startIeltsExam(state);
      if (result.ok) uiDialog = null;
      break;
    case "modal-option":
      result = choosePendingInteractionOption(state, id);
      break;
    default:
      result = { ok: false, reason: "unknown_command" };
  }

  if (!result.ok) {
    if (lockCommandTarget) {
      unlockCommandTarget(target);
    }
    console.warn("Command rejected", result);
    return;
  }
  queueRouteEndingImagePreloads(selectedRouteOptionId);
  queueRouteEndingImagePreloads(confirmedRouteOptionId);
  advanceGameFlow(state);
  commitEndingToCollection();
  if (shouldOpenCourseGuide) {
    clearUiDialogCloseTimer();
    if (theme === "dark") {
      pendingGuideAfterThemeDialog = true;
      uiDialog = "startup_theme";
    } else {
      pendingGuideAfterThemeDialog = false;
      uiDialog = "guide_after_course_select";
    }
  }
  if (shouldOpenGraduationGuide) {
    queueGraduationDesignGuide();
  }
  saveState();
  render();
  playPendingSpecialSkillFeedback();
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-music='audio']")) {
    const file = target.files?.[0];
    const audio = currentMusicAudio();
    if (isMusicLocked(audio)) {
      target.value = "";
      setMusicStatus(musicLockReason(audio));
      return;
    }
    if (file && audio) {
      musicState.trackId = audio.dataset.trackId || musicState.trackId;
      musicState.src = URL.createObjectURL(file);
      musicState.currentTime = 0;
      musicState.paused = false;
      musicState.manual = true;
      loadedLyricsSrc = "";
      audio.dataset.trackDuration = "";
      audio.src = musicState.src;
      requestAudioPlay(audio);
      setMusicStatus(`正在播放本地文件：${file.name}`);
    }
  }
  if (target.matches("[data-music='lrc']")) {
    const file = target.files?.[0];
    const audio = currentMusicAudio();
    if (isMusicLocked(audio)) {
      target.value = "";
      setMusicStatus(musicLockReason(audio));
      return;
    }
    if (!file) return;
    file.text().then((text) => {
      lyricsRequestId += 1;
      lyrics = parseLrc(text);
      currentLyricIndex = -2;
      currentEndingMemoryLyricIndex = -2;
      musicState.manualLyrics = true;
      loadedLyricsSrc = "";
      updateLyric(currentMusicAudio()?.currentTime ?? 0);
    });
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (!target.matches("[data-music-progress]")) return;
  const audio = currentMusicAudio();
  if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const ratio = Number(target.value) / Number(target.max || 1000);
  audio.currentTime = audio.duration * Math.max(0, Math.min(1, ratio));
  musicState.currentTime = audio.currentTime;
  updateLyric(audio.currentTime);
  updateMusicProgress(audio);
});

app.addEventListener("timeupdate", (event) => {
  if (event.target.matches("[data-audio-player]") && isCurrentAudioTrackEvent(event.target)) {
    musicState.currentTime = event.target.currentTime || 0;
    updateLyric(event.target.currentTime);
    updateMusicProgress(event.target);
  }
}, true);

document.addEventListener("pointerdown", resumeMusicAfterUserGesture, { capture: true });
document.addEventListener("keydown", resumeMusicAfterUserGesture, { capture: true });

app.addEventListener("loadedmetadata", (event) => {
  if (event.target.matches("[data-audio-player]")) {
    failedTrackSources.delete(event.target.dataset.trackSrc || "");
    failedTrackSources.delete(event.target.currentSrc || "");
    updateMusicProgress(event.target);
  }
}, true);

app.addEventListener("durationchange", (event) => {
  if (event.target.matches("[data-audio-player]")) {
    updateMusicProgress(event.target);
  }
}, true);

document.addEventListener("play", (event) => {
  if (event.target.matches("[data-audio-player]")) {
    const activeAudio = currentMusicAudio();
    if (activeAudio && event.target !== activeAudio) {
      event.target.pause();
      return;
    }
    pauseOtherMusicPlayers(event.target);
    autoResumePending = false;
    musicState.paused = false;
    updateMusicProgress(event.target);
    startMusicProgressLoop(event.target);
  }
}, true);

app.addEventListener("pause", (event) => {
  if (event.target.matches("[data-audio-player]") && isCurrentAudioTrackEvent(event.target)) {
    musicState.paused = autoResumePending ? false : !event.target.ended;
    musicState.currentTime = event.target.currentTime || musicState.currentTime;
    stopMusicProgressLoop();
    updateMusicProgress(event.target);
  }
}, true);

app.addEventListener("ended", (event) => {
  if (event.target.matches("[data-audio-player]") && isCurrentAudioTrackEvent(event.target)) {
    stopMusicProgressLoop();
    playNextTrack(event.target);
  }
}, true);

app.addEventListener("error", (event) => {
  if (event.target.matches("[data-audio-player]") && isCurrentAudioTrackEvent(event.target)) {
    handleAudioResourceError(event.target);
  }
}, true);

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type !== "ending-memory:complete") return;
  const animation = app.querySelector("[data-ending-memory-animation]");
  if (!animation || event.source !== animation.contentWindow) return;
  const shell = animation.closest(".ending-memory-animation-shell");
  if (!shell) return;
  shell.dataset.endingMemoryAnimationComplete = "true";
  clearEndingMemoryDockExitTimer();
  shell.classList.add("is-audio-faded");
  revealEndingMemoryCompleteButtonFromShell(shell);
});

document.addEventListener("animationend", (event) => {
  if (event.animationName === "achievementToastSilky" && event.target.matches(".achievement-toast")) {
    const id = event.target.dataset.achievementId;
    const host = event.target.closest(".achievement-toasts");
    event.target.remove();
    if (host && !host.querySelector(".achievement-toast")) {
      host.remove();
    }
    if (state && id) {
      dismissAchievementToasts(state, [id]);
      saveState();
      scheduleAchievementToastDismissal();
    } else if (id) {
      dismissCollectionAchievementToast(id);
      scheduleCollectionAchievementToastDismissal();
    }
  }
});

function queueCollectionAchievementToast(achievementId) {
  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) return;
  collectionAchievementToasts = [
    {
      id: achievementId,
      achievementId,
      title: achievement.title,
      body: achievement.body,
      score: achievement.score,
      shownAt: Date.now(),
      slot: 0,
      icon: achievementIconPath(achievementId === "no_fail_two_years" ? "三年没挂科" : achievement),
    },
    ...collectionAchievementToasts.map((toast, index) => ({ ...toast, slot: index + 1 })),
  ];
  scheduleCollectionAchievementToastDismissal();
}

function dismissCollectionAchievementToast(achievementId) {
  collectionAchievementToasts = collectionAchievementToasts.filter((toast) => (
    (toast.id ?? toast.achievementId) !== achievementId
  ));
}

function scheduleCollectionAchievementToastDismissal() {
  if (!collectionAchievementToasts.length) {
    clearCollectionAchievementToastTimer();
    return;
  }

  const now = Date.now();
  const expiredIds = expiredCollectionAchievementToastIds(now);
  if (expiredIds.length) {
    collectionAchievementToasts = collectionAchievementToasts.filter((toast) => {
      const id = toast.id ?? toast.achievementId;
      return !expiredIds.includes(id);
    });
    clearCollectionAchievementToastTimer();
    removeAchievementToastNodes(expiredIds);
    scheduleCollectionAchievementToastDismissal();
    return;
  }

  const nextExpiryAt = Math.min(
    ...collectionAchievementToasts.map((toast) => Number(toast.shownAt) + ACHIEVEMENT_TOAST_DURATION_MS),
  );
  if (collectionAchievementToastTimer && collectionAchievementToastNextExpiryAt === nextExpiryAt) {
    return;
  }

  clearCollectionAchievementToastTimer();
  collectionAchievementToastNextExpiryAt = nextExpiryAt;
  collectionAchievementToastTimer = setTimeout(() => {
    collectionAchievementToastTimer = null;
    collectionAchievementToastNextExpiryAt = null;
    scheduleCollectionAchievementToastDismissal();
  }, Math.max(0, nextExpiryAt - now));
}

function clearCollectionAchievementToastTimer() {
  if (collectionAchievementToastTimer) {
    clearTimeout(collectionAchievementToastTimer);
    collectionAchievementToastTimer = null;
  }
  collectionAchievementToastNextExpiryAt = null;
}

function expiredCollectionAchievementToastIds(now) {
  return collectionAchievementToasts
    .filter((toast) => Number.isFinite(Number(toast.shownAt)) && now - Number(toast.shownAt) >= ACHIEVEMENT_TOAST_DURATION_MS)
    .map((toast) => toast.id ?? toast.achievementId)
    .filter(Boolean);
}

function scheduleAchievementToastDismissal() {
  if (!state?.achievementToasts?.length) {
    clearAchievementToastTimer();
    return;
  }

  if (suppressRepeatedAchievementToasts()) {
    saveState();
    if (!state?.achievementToasts?.length) {
      clearAchievementToastTimer();
      return;
    }
  }

  const now = Date.now();
  let normalizedShownAt = false;
  state.achievementToasts = state.achievementToasts.map((toast) => {
    if (Number.isFinite(Number(toast.shownAt))) return toast;
    normalizedShownAt = true;
    return { ...toast, shownAt: now };
  });

  const expiredIds = expiredAchievementToastIds(now);
  if (expiredIds.length) {
    dismissAchievementToasts(state, expiredIds);
    clearAchievementToastTimer();
    saveState();
    removeAchievementToastNodes(expiredIds);
    scheduleAchievementToastDismissal();
    return;
  }

  const nextExpiryAt = Math.min(
    ...state.achievementToasts.map((toast) => Number(toast.shownAt) + ACHIEVEMENT_TOAST_DURATION_MS),
  );
  if (normalizedShownAt) {
    saveState();
  }
  if (achievementToastTimer && achievementToastNextExpiryAt === nextExpiryAt) {
    return;
  }

  clearAchievementToastTimer();
  achievementToastNextExpiryAt = nextExpiryAt;
  achievementToastTimer = setTimeout(() => {
    achievementToastTimer = null;
    achievementToastNextExpiryAt = null;
    if (!state?.achievementToasts?.length) {
      return;
    }
    const timedOutIds = expiredAchievementToastIds(Date.now());
    if (!timedOutIds.length) {
      scheduleAchievementToastDismissal();
      return;
    }
    dismissAchievementToasts(state, timedOutIds);
    saveState();
    removeAchievementToastNodes(timedOutIds);
    scheduleAchievementToastDismissal();
  }, Math.max(0, nextExpiryAt - now));
}

function clearAchievementToastTimer() {
  if (achievementToastTimer) {
    clearTimeout(achievementToastTimer);
    achievementToastTimer = null;
  }
  achievementToastNextExpiryAt = null;
}

function removeAchievementToastNodes(ids) {
  ids.forEach((id) => {
    document.querySelectorAll(`.achievement-toast[data-achievement-id="${CSS.escape(String(id))}"]`).forEach((node) => node.remove());
  });
  document.querySelectorAll(".achievement-toasts").forEach((host) => {
    if (!host.querySelector(".achievement-toast")) {
      host.remove();
    }
  });
}

function expiredAchievementToastIds(now) {
  return (state?.achievementToasts ?? [])
    .filter((toast) => Number.isFinite(Number(toast.shownAt)) && now - Number(toast.shownAt) >= ACHIEVEMENT_TOAST_DURATION_MS)
    .map((toast) => toast.id ?? toast.achievementId)
    .filter(Boolean);
}

function suppressRepeatedAchievementToasts() {
  const queuedIds = new Set();
  const usedSlots = new Set();
  let changed = false;
  const nextToasts = [];
  for (const toast of state.achievementToasts ?? []) {
    const id = toast?.id ?? toast?.achievementId;
    if (!id) {
      changed = true;
      continue;
    }
    if (queuedIds.has(id)) {
      changed = true;
      continue;
    }
    queuedIds.add(id);
    let slot = Number(toast.slot);
    if (!Number.isInteger(slot) || slot < 0 || usedSlots.has(slot)) {
      slot = 0;
      while (usedSlots.has(slot)) slot += 1;
      changed = true;
    }
    usedSlots.add(slot);
    nextToasts.push(slot === toast.slot ? toast : { ...toast, slot });
  }
  if (changed || nextToasts.length !== (state.achievementToasts ?? []).length) {
    state.achievementToasts = nextToasts;
  }
  return changed;
}

function commitEndingToCollection(endingId = state?.ending ?? state?.pendingEnding) {
  if (!state || !endingId) return;
  const previousEnding = state.ending;
  const shouldRestoreEnding = previousEnding !== endingId;
  if (shouldRestoreEnding) state.ending = endingId;
  try {
    recordFinalEnding(state);
    if (SENIOR_TEST_COPY_MODE) {
      suppressSeniorTestCopyToasts();
      return;
    }
    const result = commitRunToCollection(collection, state);
    collection = result.collection;
    let collectionChanged = result.changed;
    if (state.endingMemoryWatched && !collection.hasSeenEndingMemory) {
      collection = {
        ...collection,
        hasSeenEndingMemory: true,
        updatedAt: new Date().toISOString(),
      };
      collectionChanged = true;
    }
    hydrateStateFromCollection(state, collection);
    if (!collectionChanged) {
      reportEndingTelemetry(endingId);
      return;
    }
    saveCollection(collection).catch((error) => {
      console.warn("Failed to save collection", error);
    });
    reportEndingTelemetry(endingId);
  } finally {
    if (shouldRestoreEnding) state.ending = previousEnding;
  }
}

function reportEndingTelemetry(endingId = state?.ending) {
  if (!state || !endingId || SENIOR_TEST_COPY_MODE) return;
  const telemetryKey = `${state.runId ?? ""}:${endingId}`;
  if (startedEndingTelemetryKeys.has(telemetryKey)) {
    queueLeaderboardRefreshAfterPending({ force: true });
    return;
  }
  startedEndingTelemetryKeys.add(telemetryKey);
  const reportState = state.ending === endingId ? state : { ...state, ending: endingId };
  const vm = toViewModel(reportState, viewCollection());
  const reportPromise = reportEndingAndScore({
    state: reportState,
    ending: vm.ending,
    score: vm.achievements?.leaderboardScore ?? 0,
    surface: telemetrySurface(),
  });
  Promise.resolve(reportPromise)
    .catch(() => false)
    .finally(() => queueLeaderboardRefresh({ force: true }));
  window.setTimeout(() => queueLeaderboardRefreshAfterPending({ force: true }), LEADERBOARD_REFRESH_AFTER_SCORE_MS);
}

function saveState(writeReason = "auto_save") {
  if (!state) return { ok: false, reason: "no_state", writeReason };
  try {
    suppressSeniorTestCopyToasts();
    persistHistoricalEventIds(state);
    const serialized = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, serialized);
    const stored = localStorage.getItem(SAVE_KEY);
    if (stored !== serialized) {
      return { ok: false, reason: "write_not_confirmed", writeReason };
    }
    const revived = reviveState(JSON.parse(stored));
    if (!revived) {
      return { ok: false, reason: "invalid_saved_state", writeReason };
    }
    return { ok: true, writeReason, bytes: serialized.length };
  } catch (error) {
    console.warn("Failed to save state", { writeReason, error });
    return { ok: false, reason: "local_storage_failed", writeReason };
  }
}

function suppressSeniorTestCopyToasts() {
  if (!SENIOR_TEST_COPY_MODE) return;
  if (state?.achievementToasts?.length) {
    state.achievementToasts = [];
  }
  if (collectionAchievementToasts.length) {
    collectionAchievementToasts = [];
    clearCollectionAchievementToastTimer();
  }
}

function attachHistoricalEventIds(targetState) {
  if (!targetState) return;
  const ids = new Set([
    ...(Array.isArray(targetState.historicalSeenEventIds) ? targetState.historicalSeenEventIds : []),
    ...loadHistoricalEventIds(),
  ].filter((id) => HISTORICAL_EVENT_IDS.has(id)));
  targetState.historicalSeenEventIds = [...ids].sort();
}

function loadHistoricalEventIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(EVENT_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => HISTORICAL_EVENT_IDS.has(id)) : [];
  } catch {
    return [];
  }
}

function persistHistoricalEventIds(sourceState) {
  const baseIds = Array.isArray(sourceState?.historicalSeenEventIds)
    ? sourceState.historicalSeenEventIds
    : loadHistoricalEventIds();
  const ids = new Set(baseIds.filter((id) => HISTORICAL_EVENT_IDS.has(id)));
  for (const entry of sourceState?.eventHistory ?? []) {
    const id = typeof entry === "string" ? entry : entry?.id ?? entry?.eventId;
    if (HISTORICAL_EVENT_IDS.has(id)) ids.add(id);
  }
  const nextIds = [...ids].sort();
  if (sourceState) sourceState.historicalSeenEventIds = nextIds;
  localStorage.setItem(EVENT_HISTORY_KEY, JSON.stringify(nextIds));
}

function currentMusicAudio() {
  return app?.querySelector("[data-audio-player]") ?? null;
}

function musicAudioElements() {
  return [...document.querySelectorAll("[data-audio-player]")];
}

function clearMusicPlayRequest() {
  musicPlayRequest = null;
  musicPlayRequestAudio = null;
  musicPlayRequestSrc = "";
}

function pauseOtherMusicPlayers(activeAudio) {
  for (const audio of musicAudioElements()) {
    if (audio !== activeAudio) audio.pause();
  }
  if (musicPlayRequestAudio && musicPlayRequestAudio !== activeAudio) {
    clearMusicPlayRequest();
  }
}

function pauseAllMusicPlayers() {
  for (const audio of musicAudioElements()) {
    audio.pause();
  }
  clearMusicPlayRequest();
}

function resetMusicState({ reloadAudio = true } = {}) {
  cancelMusicFade();
  clearEndingMemoryAudioStartTimer();
  cancelEndingMemoryAudioFade();
  clearEndingMemoryDockIntroTimer();
  clearEndingMemoryDockExitTimer();
  endingMemoryExitAudioRestorePending = false;
  if (!(musicState.volume > 0)) {
    musicState.volume = 1;
  }
  for (const audio of musicAudioElements()) {
    delete audio.dataset.musicOutputFaded;
    setAudioOutputLevel(audio, musicState.volume, { allowGain: true });
    audio.pause();
    audio.removeAttribute("src");
    delete audio.dataset.endingMemoryAudioStarted;
    if (reloadAudio) audio.load();
  }
  musicState.playlistId = "";
  musicState.trackId = "";
  musicState.src = "";
  musicState.currentTime = 0;
  musicState.paused = false;
  musicState.manual = false;
  musicState.manualLyrics = false;
  musicState.playlistIndex = 0;
  autoResumePending = false;
  clearMusicPlayRequest();
  musicAssetRequestId += 1;
  failedTrackSources.clear();
  lyrics = [];
  currentLyricIndex = -2;
  currentEndingMemoryLyricIndex = -2;
  loadedLyricsSrc = "";
  lyricsRequestId += 1;
}

function loadSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return { ok: false, reason: "no_save" };
  try {
    const revived = reviveState(JSON.parse(raw));
    if (!revived) return { ok: false, reason: "invalid_save" };
    return { ok: true, state: revived };
  } catch (error) {
    console.warn("Failed to load save", error);
    return { ok: false, reason: "parse_failed" };
  }
}

function parseLrc(text) {
  return text
    .split(/\r?\n/)
    .flatMap((line) => {
      const matches = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
      const lyric = line.replace(/\[[^\]]+\]/g, "").trim();
      return matches.map((match) => ({
        time: Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3] ?? 0}`),
        text: lyric,
      }));
    })
    .filter((line) => line.text)
    .sort((a, b) => a.time - b.time);
}

function updateLyric(currentTime) {
  const target = app.querySelector("[data-current-lyric]");
  let lyricTime = Number(currentTime);
  if (!Number.isFinite(lyricTime)) lyricTime = 0;
  if (!musicState.manualLyrics && lyrics.length === 0) {
    if (target) {
      target.classList.add("is-hidden");
      target.innerHTML = "";
    }
    updateEndingMemoryLyric(-1, lyricTime);
    currentLyricIndex = -2;
    currentEndingMemoryLyricIndex = -2;
    return;
  }
  target?.classList.remove("is-hidden");
  const index = findLyricIndex(lyricTime);
  updateEndingMemoryLyric(index, lyricTime);
  const groupIndex = index >= 0 ? Math.floor(index / 2) * 2 : index;
  if (groupIndex === currentLyricIndex) return;
  currentLyricIndex = groupIndex;
  const lines = groupIndex >= 0 ? lyrics.slice(groupIndex, groupIndex + 2) : [];
  if (target) {
    target.innerHTML = lines.length
      ? lines.map((line) => `<span>${escapeHtml(line.text)}</span>`).join("")
      : "";
  }
}

function updateEndingMemoryLyric(index, currentTime = 0) {
  const target = app.querySelector("[data-ending-memory-lyric]");
  if (!target) return;
  const line = shouldShowEndingMemoryLyric(index, currentTime) ? lyrics[index]?.text ?? "" : "";
  if (!line) {
    currentEndingMemoryLyricIndex = -1;
    target.textContent = "";
    target.dataset.lyricIndex = "";
    target.classList.add("is-hidden");
    target.classList.remove("is-showing");
    return;
  }
  if (currentEndingMemoryLyricIndex === index && target.textContent === line && !target.classList.contains("is-hidden")) return;
  currentEndingMemoryLyricIndex = index;
  target.dataset.lyricIndex = String(index);
  target.textContent = line;
  target.classList.remove("is-hidden", "is-showing");
  void target.offsetWidth;
  target.classList.add("is-showing");
}

function shouldShowEndingMemoryLyric(index, currentTime) {
  if (index < 0 || !lyrics[index]) return false;
  const current = lyrics[index];
  const next = lyrics[index + 1];
  const elapsed = Math.max(0, Number(currentTime) - Number(current.time));
  if (!next) {
    return elapsed <= ENDING_MEMORY_LAST_LYRIC_HOLD_SECONDS;
  }
  const gap = Number(next.time) - Number(current.time);
  if (gap < ENDING_MEMORY_LYRIC_LONG_GAP_SECONDS) {
    return true;
  }
  return elapsed <= ENDING_MEMORY_LYRIC_HOLD_SECONDS;
}

function findLyricIndex(currentTime) {
  let low = 0;
  let high = lyrics.length - 1;
  let index = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (lyrics[middle].time <= currentTime) {
      index = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return index;
}

function captureAudioState() {
  const audio = app?.querySelector("[data-audio-player]");
  if (!audio) return;
  if (audio.src && musicState.manual) musicState.src = audio.src;
  const endingMemoryAudioStarting = isEndingMemoryAudio(audio) && audio.dataset.endingMemoryAudioStarted !== "true";
  const outputFaded = audio.dataset.musicOutputFaded === "true";
  if (!musicFadeFrame) {
    if (!endingMemoryAudioStarting) {
      musicState.currentTime = audio.currentTime || musicState.currentTime;
      musicState.paused = audio.paused;
    }
    if (!isEndingMemoryAudio(audio) && !outputFaded) {
      musicState.volume = baseAudioVolume(audio);
    }
  }
  musicState.playbackRate = audio.playbackRate;
  preserveAlbumSpinPhase(audio);
}

function preserveMusicDock() {
  const dock = app?.querySelector(".music-dock");
  if (!dock) return null;
  captureAudioState();
  musicDockParking().append(dock);
  return dock;
}

function restorePreservedMusicDock(dock) {
  if (!dock) return;
  const placeholder = app?.querySelector(".music-dock");
  if (!placeholder) {
    disposePreservedMusicDock(dock);
    return;
  }
  syncMusicDock(dock, placeholder);
  placeholder.replaceWith(dock);
}

function getFloatingAchievementToasts() {
  return [...document.body.children].find((node) => node.classList?.contains("achievement-toasts")) ?? null;
}

function detachRenderedAchievementToasts() {
  const renderedToasts = app?.querySelector(".achievement-toasts");
  if (!renderedToasts) return;
  const host = getFloatingAchievementToasts();
  if (!host) {
    document.body.append(renderedToasts);
  } else {
    renderedToasts.querySelectorAll(".achievement-toast").forEach((toast) => {
      const id = toast.dataset.achievementId;
      const existingToast = id
        ? host.querySelector(`.achievement-toast[data-achievement-id="${CSS.escape(id)}"]`)
        : null;
      if (existingToast) {
        syncAchievementToastShell(existingToast, toast);
        toast.remove();
      } else if (id) {
        host.append(toast);
      } else {
        toast.remove();
      }
    });
    renderedToasts.remove();
  }
}

function syncAchievementToastShell(target, source) {
  syncOptionalAttribute(target, source, "class");
  syncOptionalAttribute(target, source, "style");
  syncOptionalAttribute(target, source, "role");
  syncOptionalAttribute(target, source, "aria-label");
  syncOptionalAttribute(target, source, "data-achievement-shown-at");
}

function syncOptionalAttribute(target, source, name) {
  const nextValue = source.getAttribute(name);
  if (nextValue === null) {
    if (target.hasAttribute(name)) target.removeAttribute(name);
    return;
  }
  if (target.getAttribute(name) !== nextValue) {
    target.setAttribute(name, nextValue);
  }
}

function syncMusicDock(preservedDock, renderedDock) {
  preservedDock.className = renderedDock.className;
  const preservedAudio = preservedDock.querySelector("[data-audio-player]");
  const renderedAudio = renderedDock.querySelector("[data-audio-player]");
  const activeRenderedTrack = currentRenderedPlaylistTrack(preservedAudio, renderedAudio);
  const preservedCanSwitch = Boolean(preservedDock.querySelector("[data-command='music-next']"));
  const renderedCanSwitch = Boolean(renderedDock.querySelector("[data-command='music-next']"));
  const preservedLocked = preservedAudio?.dataset.musicLocked || "";
  const renderedLocked = renderedAudio?.dataset.musicLocked || "";
  const sameRenderedTrack = preservedAudio && renderedAudio
    && (preservedAudio.dataset.playlistId || "") === (renderedAudio.dataset.playlistId || "")
    && preservedCanSwitch === renderedCanSwitch
    && preservedLocked === renderedLocked
    && (
      activeRenderedTrack
      || (
        (preservedAudio.dataset.trackId || "") === (renderedAudio.dataset.trackId || "")
        && (preservedAudio.dataset.trackSrc || "") === (renderedAudio.dataset.trackSrc || "")
      )
    );
  if (preservedAudio && renderedAudio) {
    for (const { name, value } of renderedAudio.attributes) {
      if (name.startsWith("data-")) {
        preservedAudio.setAttribute(name, value);
      }
    }
    if (renderedAudio.dataset.endingMemoryAudioStarted !== "true") {
      delete preservedAudio.dataset.endingMemoryAudioStarted;
    }
    if (activeRenderedTrack) {
      applyAudioTrackDataset(preservedAudio, activeRenderedTrack);
    }
    preservedAudio.controls = renderedAudio.controls;
    preservedAudio.crossOrigin = renderedAudio.crossOrigin;
    preservedAudio.loop = renderedAudio.loop;
  }
  const preservedTrackCard = preservedDock.querySelector(".track-card");
  const renderedTrackCard = renderedDock.querySelector(".track-card");
  if (preservedTrackCard && renderedTrackCard) {
    preservedTrackCard.className = renderedTrackCard.className;
    if (sameRenderedTrack) {
      syncMusicTrackText(preservedTrackCard, renderedTrackCard);
    } else {
      preservedTrackCard.innerHTML = renderedTrackCard.innerHTML;
    }
  }
  const preservedHead = preservedDock.querySelector(".section-head");
  const renderedHead = renderedDock.querySelector(".section-head");
  if (preservedHead && renderedHead) {
    preservedHead.innerHTML = renderedHead.innerHTML;
  }
  syncOptionalMusicDockElement(preservedDock, renderedDock, "[data-current-lyric]");
  syncMusicControl(preservedDock, renderedDock, "[data-command='music-next']", ["disabled", "title"]);
  syncMusicControl(preservedDock, renderedDock, "[data-command='music-prev']", ["disabled", "title"]);
  syncMusicControl(preservedDock, renderedDock, "[data-music-progress]", ["disabled", "min", "max", "aria-label"]);
  syncMusicControl(preservedDock, renderedDock, "[data-music='audio']", ["disabled"]);
  syncMusicControl(preservedDock, renderedDock, "[data-music='lrc']", ["disabled"]);
  syncMusicControl(preservedDock, renderedDock, "[data-music-label='audio']", ["class", "title"]);
  syncMusicControl(preservedDock, renderedDock, "[data-music-label='lrc']", ["class", "title"]);
}

function syncMusicTrackText(preservedTrackCard, renderedTrackCard) {
  for (const selector of [".track-copy", ".music-station", ".music-time", ".lyric-line", ".music-status"]) {
    const preserved = preservedTrackCard.querySelector(selector);
    const rendered = renderedTrackCard.querySelector(selector);
    if (preserved && rendered) {
      preserved.innerHTML = rendered.innerHTML;
      preserved.className = rendered.className;
      for (const { name, value } of rendered.attributes) {
        if (name !== "class") preserved.setAttribute(name, value);
      }
    }
  }
}

function syncOptionalMusicDockElement(preservedDock, renderedDock, selector) {
  const preserved = preservedDock.querySelector(selector);
  const rendered = renderedDock.querySelector(selector);
  if (!rendered) {
    preserved?.remove();
    return;
  }
  if (!preserved) {
    const before = selector === "[data-current-lyric]"
      ? preservedDock.querySelector("[data-music-status]")
      : null;
    const clone = rendered.cloneNode(true);
    if (before) {
      before.before(clone);
    } else {
      preservedDock.append(clone);
    }
    return;
  }
  preserved.innerHTML = rendered.innerHTML;
  for (const { name } of [...preserved.attributes]) {
    if (!rendered.hasAttribute(name)) preserved.removeAttribute(name);
  }
  for (const { name, value } of rendered.attributes) {
    preserved.setAttribute(name, value);
  }
}

function currentRenderedPlaylistTrack(preservedAudio, renderedAudio) {
  if (!preservedAudio || !renderedAudio) return null;
  if (musicState.manual) return null;
  const playlistId = renderedAudio.dataset.playlistId || "";
  if (!playlistId || playlistId !== musicState.playlistId) return null;

  const playlist = parsePlaylist(renderedAudio);
  const currentTrackId = musicState.trackId || preservedAudio.dataset.trackId || "";
  const currentTrackSrc = musicState.src || preservedAudio.dataset.trackSrc || "";
  return playlist.find((track) => track.id === currentTrackId)
    ?? playlist.find((track) => currentTrackSrc && track.src === currentTrackSrc)
    ?? null;
}

function applyAudioTrackDataset(audio, track) {
  audio.dataset.trackId = track.id || "";
  audio.dataset.trackSrc = track.src || "";
  audio.dataset.trackDuration = String(track.duration ?? "");
  audio.dataset.trackVolume = String(track.volume ?? 1);
  audio.dataset.lyricsSrc = track.lyricsSrc || "";
  audio.dataset.allowsLyrics = track.allowsLyrics === true ? "true" : "false";
}

function preserveAlbumSpinPhase(audio) {
  const cover = app?.querySelector("[data-track-cover]");
  if (!cover) return;
  const currentTime = Number.isFinite(audio?.currentTime) ? audio.currentTime : musicState.currentTime;
  const phase = ((Number(currentTime) || 0) % 8 + 8) % 8;
  cover.style.setProperty("--album-spin-delay", `${-phase}s`);
}

function syncMusicControl(preservedDock, renderedDock, selector, attributes) {
  const preserved = preservedDock.querySelector(selector);
  const rendered = renderedDock.querySelector(selector);
  if (!preserved || !rendered) return;
  for (const attribute of attributes) {
    if (attribute === "class") {
      preserved.className = rendered.className;
    } else if (rendered.hasAttribute(attribute)) {
      preserved.setAttribute(attribute, rendered.getAttribute(attribute) ?? "");
    } else {
      preserved.removeAttribute(attribute);
    }
  }
}

function disposePreservedMusicDock(dock) {
  const audio = dock?.querySelector("[data-audio-player]");
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
  dock?.remove();
}

function musicDockParking() {
  let parking = document.querySelector("[data-music-dock-parking]");
  if (parking) return parking;

  parking = document.createElement("div");
  parking.dataset.musicDockParking = "true";
  parking.setAttribute("aria-hidden", "true");
  Object.assign(parking.style, {
    position: "fixed",
    width: "1px",
    height: "1px",
    left: "-9999px",
    top: "0",
    overflow: "hidden",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.append(parking);
  return parking;
}

function restoreEndingMemoryAnimationState() {
  const animation = app?.querySelector("[data-ending-memory-animation]");
  if (!animation) {
    clearEndingMemoryDockIntroTimer();
    clearEndingMemoryDockExitTimer();
    clearEndingMemoryAudioStartTimer();
    cancelEndingMemoryAudioFade();
    return;
  }
  const shell = animation.closest(".ending-memory-animation-shell");
  if (!shell) return;
  scheduleEndingMemoryDockIntro(shell);
  scheduleEndingMemoryDockExit(shell);
  if (shell.dataset.endingMemoryAnimationComplete === "true") {
    revealEndingMemoryCompleteButtonFromShell(shell);
  }
}

function clearEndingMemoryDockIntroTimer() {
  if (!endingMemoryDockIntroTimer) return;
  clearTimeout(endingMemoryDockIntroTimer);
  endingMemoryDockIntroTimer = null;
  endingMemoryDockIntroShell = null;
}

function clearEndingMemoryDockExitTimer() {
  if (!endingMemoryDockExitTimer) return;
  clearTimeout(endingMemoryDockExitTimer);
  endingMemoryDockExitTimer = null;
}

function clearEndingMemoryAudioStartTimer() {
  if (!endingMemoryAudioStartTimer) return;
  clearTimeout(endingMemoryAudioStartTimer);
  endingMemoryAudioStartTimer = null;
}

function cancelEndingMemoryAudioFade() {
  if (!endingMemoryAudioFadeFrame) return;
  cancelAnimationFrame(endingMemoryAudioFadeFrame);
  endingMemoryAudioFadeFrame = null;
}

function scheduleEndingMemoryDockIntro(shell) {
  if (!shell || shell.classList.contains("is-audio-visible") || shell.classList.contains("is-audio-faded")) {
    return;
  }
  if (endingMemoryDockIntroTimer && endingMemoryDockIntroShell === shell) return;
  clearEndingMemoryDockIntroTimer();
  endingMemoryDockIntroShell = shell;
  endingMemoryDockIntroTimer = window.setTimeout(() => {
    endingMemoryDockIntroTimer = null;
    endingMemoryDockIntroShell = null;
    if (!shell.isConnected || shell.classList.contains("is-audio-faded")) return;
    shell.classList.add("is-audio-visible");
  }, ENDING_MEMORY_AUDIO_DELAY_MS);
}

function scheduleEndingMemoryDockExit(shell) {
  if (!shell || shell.classList.contains("is-audio-faded") || endingMemoryDockExitTimer) return;
  endingMemoryDockExitTimer = window.setTimeout(() => {
    endingMemoryDockExitTimer = null;
    if (!shell.isConnected || shell.classList.contains("is-audio-faded")) return;
    shell.classList.add("is-audio-visible");
    shell.querySelector(".ending-memory-audio-host")?.getBoundingClientRect();
    shell.classList.add("is-audio-faded");
  }, ENDING_MEMORY_DOCK_EXIT_AT_SECONDS * 1000);
}

function revealEndingMemoryCompleteButtonFromShell(shell) {
  const button = shell?.querySelector("[data-ending-memory-complete]");
  if (!shell || !button) return;
  if (shell.classList.contains("is-complete")) return;
  shell.classList.add("is-complete");
}

function restoreAudioState() {
  const audio = app?.querySelector("[data-audio-player]");
  if (!audio) return;
  const shouldRestoreEndingMemoryExitAudio = shouldRestoreEndingMemoryExitAudioPlayback(audio);
  if (shouldRestoreEndingMemoryExitAudio) {
    clearEndingMemoryAudioStartTimer();
    if (!(musicState.volume > 0)) {
      musicState.volume = 1;
    }
    musicState.paused = false;
    autoResumePending = true;
  }
  pauseOtherMusicPlayers(audio);
  const playlistId = audio.dataset.playlistId || "";
  const trackId = audio.dataset.trackId || "";
  const trackSrc = audio.dataset.trackSrc || "";
  const playlist = parsePlaylist(audio);
  const currentTrackIndex = playlist.findIndex((track) => track.id === musicState.trackId);
  const playlistChanged = Boolean(playlistId && playlistId !== musicState.playlistId);
  const trackChanged = Boolean(!playlistChanged && trackId && trackId !== musicState.trackId);
  const enteringEndingPlaylist = playlistChanged && playlistId.startsWith("ending");
  const enteringYearPlaylist = playlistChanged && playlistId.startsWith("year:");
  if (playlistChanged) {
    musicState.playlistId = playlistId;
    musicState.trackId = trackId;
    musicState.src = "";
    musicState.currentTime = 0;
    musicState.manual = false;
    musicState.manualLyrics = false;
    musicState.playlistIndex = 0;
    lyrics = [];
    currentLyricIndex = -2;
    currentEndingMemoryLyricIndex = -2;
    loadedLyricsSrc = "";
    lyricsRequestId += 1;
  } else if (currentTrackIndex >= 0) {
    musicState.playlistIndex = currentTrackIndex;
  } else if (trackChanged) {
    musicState.trackId = trackId;
    musicState.src = "";
    musicState.currentTime = 0;
    musicState.manual = false;
    musicState.manualLyrics = false;
    lyrics = [];
    currentLyricIndex = -2;
    currentEndingMemoryLyricIndex = -2;
    loadedLyricsSrc = "";
    lyricsRequestId += 1;
  }
  const shouldFadeExistingTrack = (enteringEndingPlaylist || enteringYearPlaylist)
    && audio.src
    && !audio.paused
    && !audio.ended;
  if (!shouldFadeExistingTrack) {
    applyAudioOutputVolume(audio, { allowGain: true });
  }
  audio.playbackRate = musicState.playbackRate;
  if (isPendingEndingMusic(audio)) {
    suspendPendingEndingMusic(audio);
    return;
  }
  if (musicState.manual && musicState.src) {
    audio.src = musicState.src;
    restoreAudioPlayback(audio, { forcePlay: shouldRestoreEndingMemoryExitAudio });
    return;
  }
  if (!trackSrc) {
    updateMusicProgress(audio);
    setMusicStatus("当前曲目没有配置音频路径");
    return;
  }
  const track = playlist[musicState.playlistIndex] ?? playlist.find((item) => item.id === trackId) ?? { id: trackId, src: trackSrc };
  if (!playlistChanged && !trackChanged && sameAudioSource(audio, track.src) && musicState.src === track.src) {
    updateTrackDisplay(track);
    loadTrackLyrics(track.lyricsSrc, track.allowsLyrics === true);
    updateLyric(audio.currentTime || musicState.currentTime);
    restoreAudioPlayback(audio, { forcePlay: shouldRestoreEndingMemoryExitAudio });
    return;
  }
  if (musicFadeFrame && pendingFadedTrackSrc === track.src) {
    if (shouldRestoreEndingMemoryExitAudio) {
      cancelMusicFade();
    } else {
      return;
    }
  }
  if (enteringEndingPlaylist || enteringYearPlaylist) {
    musicState.currentTime = 0;
    musicState.paused = false;
    pendingStartMusicAutoplay = false;
    if (shouldFadeExistingTrack) {
      fadeToTrackStart(audio, track);
      return;
    }
    cancelMusicFade();
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {}
    ensureTrackAsset(audio, track, { restart: true, forcePlay: shouldRestoreEndingMemoryExitAudio });
    return;
  }
  if (playlistChanged && audio.src && !audio.paused) {
    fadeToTrackStart(audio, track);
    return;
  }
  ensureTrackAsset(audio, track, { restart: playlistChanged || trackChanged, forcePlay: shouldRestoreEndingMemoryExitAudio });
}

function shouldRestoreEndingMemoryExitAudioPlayback(audio) {
  return endingMemoryExitAudioRestorePending
    && state?.phase === "ending"
    && Boolean(state?.ending)
    && !state.pendingInteraction
    && !isPendingEndingMusic(audio);
}

function completeEndingMemoryExitAudioRestoreIfSettled() {
  if (
    endingMemoryExitAudioRestorePending
    && state?.phase === "ending"
    && Boolean(state?.ending)
    && !state.pendingInteraction
  ) {
    endingMemoryExitAudioRestorePending = false;
  }
}

function isPendingEndingMusic(audio) {
  return isPendingEndingPlaylistId(audio?.dataset.playlistId || "");
}

function isPendingEndingPlaylistId(playlistId) {
  return String(playlistId || "").startsWith("ending-pending:");
}

function suspendPendingEndingMusic(audio) {
  cancelMusicFade();
  clearMusicPlayRequest();
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  musicState.src = "";
  musicState.currentTime = 0;
  musicState.manual = false;
  musicState.manualLyrics = false;
  autoResumePending = false;
  lyrics = [];
  currentLyricIndex = -2;
  currentEndingMemoryLyricIndex = -2;
  loadedLyricsSrc = "";
  lyricsRequestId += 1;
  updateLyric(0);
  updateMusicProgress(audio);
  setMusicStatus("进入结局页面后播放结局曲");
}

function sameAudioSource(audio, src) {
  if (!audio || !src) return false;
  const current = audio.currentSrc || audio.src || "";
  if (!current) return false;
  const targetSrc = assetUrl(src) || src;
  try {
    return current === new URL(targetSrc, window.location.href).href;
  } catch {
    return current.endsWith(targetSrc);
  }
}

function isCurrentAudioTrackEvent(audio) {
  if (!audio || audio !== currentMusicAudio()) return false;
  const expectedSrc = musicState.src || audio.dataset.trackSrc || "";
  if (!expectedSrc) return true;
  return sameAudioSource(audio, expectedSrc);
}

function restoreAudioPlayback(audio, options = {}) {
  if (options.startMuted) {
    setAudioOutputLevel(audio, 0, { allowGain: true });
  } else {
    delete audio.dataset.musicOutputFaded;
    applyAudioOutputVolume(audio, { allowGain: true });
  }
  audio.playbackRate = musicState.playbackRate;
  if (Number.isFinite(musicState.currentTime) && Math.abs(audio.currentTime - musicState.currentTime) > 0.5) {
    audio.currentTime = musicState.currentTime;
  }
  updateLyric(audio.currentTime || musicState.currentTime);
  if (isEndingMemoryAudio(audio)) {
    restoreEndingMemoryAudioPlayback(audio);
    updateMusicProgress(audio);
    return;
  }
  if ((options.forcePlay || !musicState.paused) && audio.paused) {
    requestAudioPlay(audio, { preserveOutputLevel: options.startMuted === true });
  }
  updateMusicProgress(audio);
}

function isEndingMemoryAudio(audio) {
  return Boolean(audio?.closest?.(".ending-memory-audio-host"));
}

function restoreEndingMemoryAudioPlayback(audio) {
  if (musicState.paused || !audio.paused || audio.dataset.endingMemoryAudioStarted === "true") {
    return;
  }
  if (endingMemoryAudioStartTimer) {
    clearTimeout(endingMemoryAudioStartTimer);
  }
  const targetVolume = effectiveAudioVolume(audio) || trackVolumeScale(audio);
  setAudioOutputLevel(audio, 0, { allowGain: true });
  endingMemoryAudioStartTimer = setTimeout(() => {
    endingMemoryAudioStartTimer = null;
    if (!audio.isConnected || musicState.paused) return;
    audio.dataset.endingMemoryAudioStarted = "true";
    requestAudioPlay(audio, { preserveOutputLevel: true });
    fadeEndingMemoryAudioIn(audio, targetVolume);
  }, ENDING_MEMORY_AUDIO_DELAY_MS);
}

function fadeEndingMemoryAudioIn(audio, targetVolume) {
  cancelEndingMemoryAudioFade();
  const startedAt = performance.now();
  const tick = (now) => {
    if (!audio.isConnected) {
      endingMemoryAudioFadeFrame = null;
      return;
    }
    const ratio = Math.min(1, (now - startedAt) / ENDING_MEMORY_AUDIO_FADE_MS);
    setAudioOutputLevel(audio, targetVolume * ratio, { allowGain: true });
    if (ratio < 1) {
      endingMemoryAudioFadeFrame = requestAnimationFrame(tick);
      return;
    }
    endingMemoryAudioFadeFrame = null;
    setAudioOutputLevel(audio, targetVolume, { allowGain: true });
    delete audio.dataset.musicOutputFaded;
  };
  endingMemoryAudioFadeFrame = requestAnimationFrame(tick);
}

function fadeToTrackStart(audio, track) {
  cancelMusicFade();
  clearMusicPlayRequest();
  pendingFadedTrackSrc = track?.src || "";
  const startVolume = currentAudioOutputLevel(audio);
  const startedAt = performance.now();
  const tick = (now) => {
    const ratio = Math.min(1, (now - startedAt) / MUSIC_YEAR_FADE_MS);
    setAudioOutputLevel(audio, Math.max(0, startVolume * (1 - ratio)), { allowGain: true });
    if (ratio < 1) {
      musicFadeFrame = requestAnimationFrame(tick);
      return;
    }
    musicFadeFrame = null;
    pendingFadedTrackSrc = "";
    autoResumePending = true;
    audio.pause();
    setAudioOutputLevel(audio, 0, { allowGain: true });
    musicState.currentTime = 0;
    ensureTrackAsset(audio, track, { restart: true, startMuted: true });
    if (!isEndingMemoryAudio(audio)) {
      fadeAudioIn(audio);
    }
  };
  musicFadeFrame = requestAnimationFrame(tick);
}

function fadeAudioIn(audio) {
  const targetVolume = effectiveAudioVolume(audio);
  const startedAt = performance.now();
  const tick = (now) => {
    if (!audio.isConnected) {
      musicFadeFrame = null;
      return;
    }
    const ratio = Math.min(1, (now - startedAt) / MUSIC_YEAR_FADE_MS);
    setAudioOutputLevel(audio, targetVolume * ratio, { allowGain: true });
    if (ratio < 1) {
      musicFadeFrame = requestAnimationFrame(tick);
      return;
    }
    musicFadeFrame = null;
    setAudioOutputLevel(audio, targetVolume, { allowGain: true });
    delete audio.dataset.musicOutputFaded;
  };
  musicFadeFrame = requestAnimationFrame(tick);
}

function fadeCurrentMusicOut(durationMs) {
  const audio = currentMusicAudio();
  if (!audio || audio.paused || audio.ended) return Promise.resolve();
  cancelMusicFade();
  clearMusicPlayRequest();
  const baseVolumeBeforeFade = baseAudioVolume(audio);
  const startVolume = currentAudioOutputLevel(audio);
  const fadeDuration = Math.max(1, Number(durationMs) || MUSIC_YEAR_FADE_MS);
  const startedAt = performance.now();
  return new Promise((resolve) => {
    const tick = (now) => {
      if (!audio.isConnected) {
        musicFadeFrame = null;
        resolve();
        return;
      }
      const ratio = Math.min(1, (now - startedAt) / fadeDuration);
      const easedRatio = 1 - Math.cos((ratio * Math.PI) / 2);
      setAudioOutputLevel(audio, startVolume * (1 - easedRatio), { allowGain: true });
      if (ratio < 1) {
        musicFadeFrame = requestAnimationFrame(tick);
        return;
      }
      musicFadeFrame = null;
      setAudioOutputLevel(audio, 0, { allowGain: true });
      autoResumePending = true;
      audio.dataset.musicOutputFaded = "true";
      audio.pause();
      if (baseVolumeBeforeFade > 0) {
        musicState.volume = baseVolumeBeforeFade;
      }
      resolve();
    };
    musicFadeFrame = requestAnimationFrame(tick);
  });
}

function cancelMusicFade() {
  if (!musicFadeFrame) return;
  cancelAnimationFrame(musicFadeFrame);
  musicFadeFrame = null;
  pendingFadedTrackSrc = "";
}

function resumeMusicAfterUserGesture() {
  const audio = currentMusicAudio();
  if (!audio || musicState.manual || !audio.src) return;
  if (isEndingMemoryAudio(audio) && audio.dataset.endingMemoryAudioStarted !== "true") return;
  if (!audio.paused && !autoResumePending) {
    resumeMusicAudioContext();
    return;
  }
  if (musicState.paused && !autoResumePending) return;
  requestAudioPlay(audio);
}

function requestAudioPlay(audio, options = {}) {
  if (!audio) return null;
  const requestSrc = audioRequestSource(audio);
  if (musicPlayRequest && musicPlayRequestAudio === audio && musicPlayRequestSrc === requestSrc) return musicPlayRequest;
  pauseOtherMusicPlayers(audio);
  if (!options.preserveOutputLevel && !shouldPreserveAudioOutputLevel(audio)) {
    applyAudioOutputVolume(audio, { allowGain: true });
  }
  resumeMusicAudioContext();
  if (musicPlayRequest) clearMusicPlayRequest();
  musicState.paused = false;
  autoResumePending = true;
  musicPlayRequestAudio = audio;
  musicPlayRequestSrc = requestSrc;
  const playRequest = audio
    .play()
    .then(() => {
      if (musicPlayRequest !== playRequest || musicPlayRequestAudio !== audio || musicPlayRequestSrc !== requestSrc) return;
      resumeMusicAudioContext();
      clearMusicPlayRequest();
      autoResumePending = false;
      setMusicStatus("正在播放当前阶段音乐");
    })
    .catch(() => {
      if (musicPlayRequest !== playRequest || musicPlayRequestAudio !== audio || musicPlayRequestSrc !== requestSrc) return;
      clearMusicPlayRequest();
      musicState.paused = false;
      autoResumePending = true;
      setMusicStatus("浏览器拦截了自动播放，点击页面任意位置后会继续播放");
    });
  musicPlayRequest = playRequest;
  return musicPlayRequest;
}

function audioRequestSource(audio) {
  return audio?.currentSrc || audio?.src || audio?.dataset.trackSrc || "";
}

function setAudioSource(audio, src) {
  if (!audio || !src) return;
  const crossOriginChanged = syncAudioCrossOrigin(audio, src);
  if (!sameAudioSource(audio, src) || crossOriginChanged) {
    audio.src = src;
    audio.load();
    return;
  }
  audio.src = src;
}

function ensureTrackAsset(audio, track, options = {}) {
  if (musicFadeFrame && pendingFadedTrackSrc !== (track?.src || "")) {
    cancelMusicFade();
  }
  const src = track?.src || "";
  const restart = options.restart === true;
  const sourceChanged = musicState.src !== src;
  if (restart || musicState.src !== src) {
    clearMusicPlayRequest();
  }
  musicAssetRequestId += 1;
  if (restart) {
    musicState.currentTime = 0;
  }

  if (!src) {
    musicState.src = "";
    audio.removeAttribute("src");
    audio.load();
    updateMusicProgress(audio);
    setMusicStatus("当前曲目没有配置音频路径");
    return;
  }

  failedTrackSources.delete(src);
  musicState.trackId = track.id || musicState.trackId;
  musicState.src = src;
  const playableSrc = assetUrl(src);
  audio.dataset.trackId = musicState.trackId;
  audio.dataset.trackSrc = src;
  audio.dataset.trackDuration = String(track.duration ?? "");
  audio.dataset.trackVolume = String(track.volume ?? 1);
  audio.dataset.lyricsSrc = track.lyricsSrc || "";
  audio.dataset.allowsLyrics = track.allowsLyrics === true ? "true" : "false";
  if (sourceChanged) {
    audio.dataset.trackLoadRetries = "0";
  }
  setAudioSource(audio, playableSrc || src);
  if (restart) {
    try {
      audio.currentTime = 0;
    } catch {}
  }
  updateTrackDisplay(track);
  setMusicStatus("已加载当前阶段对应曲目");
  loadTrackLyrics(track.lyricsSrc, track.allowsLyrics === true);
  preloadAdjacentPlaylistTracks(audio);
  restoreAudioPlayback(audio, {
    startMuted: options.startMuted === true,
    forcePlay: options.forcePlay === true,
  });
}

function preloadAdjacentPlaylistTracks(audio) {
  const playlist = parsePlaylist(audio);
  if (playlist.length <= 1) return;
  const index = Number.isInteger(musicState.playlistIndex) ? musicState.playlistIndex : 0;
  const sources = [
    playlist[(index + 1) % playlist.length]?.src,
    playlist[(index - 1 + playlist.length) % playlist.length]?.src,
  ].filter(Boolean);
  preloadPlayableAudioForGate(sources, {
    timeoutMs: BACKGROUND_AUDIO_PRELOAD_TIMEOUT_MS,
    resourceTimeoutMs: PRIORITY_AUDIO_RESOURCE_PRELOAD_TIMEOUT_MS,
    concurrency: ADJACENT_AUDIO_PRELOAD_CONCURRENCY,
  });
}

function effectiveAudioVolume(audio) {
  return musicState.volume * trackVolumeScale(audio);
}

function currentAudioOutputLevel(audio) {
  if (!audio) return 0;
  const mediaVolume = Math.max(0, Number(audio.volume) || 0);
  const gain = musicGainNodes.get(audio)?.gain?.gain?.value;
  return Number.isFinite(gain) ? mediaVolume * Math.max(0, gain) : mediaVolume;
}

function baseAudioVolume(audio) {
  const scale = trackVolumeScale(audio);
  if (scale <= 0) return musicState.volume;
  if (musicGainNodes.has(audio)) return Math.min(1, Math.max(0, Number(audio?.volume) || musicState.volume));
  return Math.min(1, Math.max(0, (Number(audio?.volume) || 0) / scale));
}

function trackVolumeScale(audio) {
  const scale = Number(audio?.dataset.trackVolume);
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function applyAudioOutputVolume(audio, options = {}) {
  setAudioOutputLevel(audio, effectiveAudioVolume(audio), options);
}

function shouldPreserveAudioOutputLevel(audio) {
  return isEndingMemoryAudio(audio)
    && (
      endingMemoryAudioStartTimer !== null
      || endingMemoryAudioFadeFrame !== null
      || audio.dataset.endingMemoryAudioStarted !== "true"
    );
}

function setAudioOutputLevel(audio, outputLevel, options = {}) {
  if (!audio) return;
  const safeOutputLevel = Math.max(0, Number(outputLevel) || 0);
  const shouldUseGain = options.allowGain === true
    && canUseAudioGainNode(audio)
    && (safeOutputLevel > 1 || musicGainNodes.has(audio));
  if (!shouldUseGain) {
    audio.volume = Math.min(1, safeOutputLevel);
    return;
  }
  const entry = ensureMusicGainNode(audio);
  if (!entry) {
    audio.volume = Math.min(1, safeOutputLevel);
    return;
  }
  const baseVolume = Math.min(1, Math.max(0.0001, musicState.volume));
  audio.volume = baseVolume;
  entry.gain.gain.value = safeOutputLevel / baseVolume;
}

function canUseAudioGainNode(audio) {
  const source = audio?.currentSrc || audio?.src || assetUrl(audio?.dataset?.trackSrc || "");
  if (!source) return false;
  try {
    const url = new URL(source, window.location.href);
    return url.origin === window.location.origin || audio.crossOrigin === "anonymous";
  } catch {
    return false;
  }
}

function ensureMusicGainNode(audio) {
  const existing = musicGainNodes.get(audio);
  if (existing) return existing;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  musicAudioContext = musicAudioContext ?? new AudioContextCtor();
  const source = musicAudioContext.createMediaElementSource(audio);
  const gain = musicAudioContext.createGain();
  source.connect(gain);
  gain.connect(musicAudioContext.destination);
  const entry = { source, gain };
  musicGainNodes.set(audio, entry);
  return entry;
}

function resumeMusicAudioContext() {
  if (musicAudioContext?.state === "suspended") {
    musicAudioContext.resume().catch(() => {});
  }
}

function toggleMusic() {
  const audio = currentMusicAudio();
  if (!audio) return;
  if (isPendingEndingMusic(audio)) {
    suspendPendingEndingMusic(audio);
    return;
  }
  const anyPlaying = musicAudioElements().some((item) => !item.paused && !item.ended);
  if (audio.paused && !anyPlaying) {
    musicState.paused = false;
    autoResumePending = false;
    requestAudioPlay(audio);
  } else {
    musicState.paused = true;
    autoResumePending = false;
    clearMusicPlayRequest();
    cancelMusicFade();
    pauseAllMusicPlayers();
  }
  updateMusicProgress(audio);
}

function updateMusicProgress(audio) {
  const progress = app.querySelector("[data-music-progress]");
  const time = app.querySelector("[data-music-time]");
  const toggle = app.querySelector("[data-music-toggle]");
  const currentTime = Number.isFinite(audio?.currentTime) ? audio.currentTime : 0;
  const duration = resolveAudioDuration(audio);
  const locked = isMusicLocked(audio);
  if (progress) {
    const progressRatio = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
    progress.disabled = duration <= 0 || locked;
    progress.value = duration > 0 ? String(Math.round(progressRatio * Number(progress.max || 1000))) : "0";
    progress.style.setProperty("--music-progress", `${Math.round(progressRatio * 1000) / 10}%`);
  }
  if (time) {
    time.textContent = `${formatDuration(currentTime)} / ${duration > 0 ? formatDuration(duration) : "--:--"}`;
  }
  if (toggle) {
    const paused = !audio || audio.paused;
    const label = paused ? "播放音乐" : "暂停音乐";
    toggle.classList.toggle("is-paused", paused);
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
  }
}

function resolveAudioDuration(audio) {
  const nativeDuration = Number(audio?.duration);
  if (Number.isFinite(nativeDuration) && nativeDuration > 0) return nativeDuration;
  const trackDuration = Number(audio?.dataset.trackDuration);
  return Number.isFinite(trackDuration) && trackDuration > 0 ? trackDuration : 0;
}

function startMusicProgressLoop(audio) {
  stopMusicProgressLoop();
  const tick = () => {
    if (!audio || audio.paused || audio.ended) {
      musicProgressFrame = null;
      updateMusicProgress(audio);
      return;
    }
    musicState.currentTime = audio.currentTime || musicState.currentTime;
    updateLyric(audio.currentTime || musicState.currentTime);
    updateMusicProgress(audio);
    musicProgressFrame = requestAnimationFrame(tick);
  };
  musicProgressFrame = requestAnimationFrame(tick);
}

function stopMusicProgressLoop() {
  if (!musicProgressFrame) return;
  cancelAnimationFrame(musicProgressFrame);
  musicProgressFrame = null;
}

function loadTrackLyrics(src, allowsLyrics) {
  if (musicState.manualLyrics) {
    lyricsRequestId += 1;
    updateLyric(currentMusicAudio()?.currentTime ?? musicState.currentTime);
    return;
  }
  if (!allowsLyrics || !src) {
    lyricsRequestId += 1;
    lyrics = [];
    currentLyricIndex = -2;
    currentEndingMemoryLyricIndex = -2;
    musicState.manualLyrics = false;
    loadedLyricsSrc = "";
    updateLyric(0);
    return;
  }
  if (loadedLyricsSrc === src) {
    updateLyric(currentMusicAudio()?.currentTime ?? musicState.currentTime);
    return;
  }
  const requestId = (lyricsRequestId += 1);
  fetchLyricsText(src)
    .then((text) => {
      if (requestId !== lyricsRequestId) return;
      const parsedLyrics = text ? parseLrc(text) : [];
      lyrics = parsedLyrics;
      currentLyricIndex = -2;
      currentEndingMemoryLyricIndex = -2;
      musicState.manualLyrics = false;
      loadedLyricsSrc = parsedLyrics.length ? src : "";
      updateLyric(currentMusicAudio()?.currentTime ?? musicState.currentTime);
    })
    .catch(() => {
      if (requestId !== lyricsRequestId) return;
      lyrics = [];
      currentLyricIndex = -2;
      currentEndingMemoryLyricIndex = -2;
      loadedLyricsSrc = "";
      updateLyric(currentMusicAudio()?.currentTime ?? musicState.currentTime);
    });
}

function fetchLyricsText(src) {
  const url = assetUrl(src) || src;
  return fetchReadableLyrics(url);
}

function fetchReadableLyrics(url, options = {}) {
  return fetch(url, readableLyricsFetchOptions(url, options))
    .then((response) => {
      if (!response.ok) throw new Error(`lyrics_${response.status}`);
      return response.text();
    });
}

function readableLyricsFetchOptions(url, options = {}) {
  return {
    cache: options.cache || "default",
    ...(isCrossOriginHttpUrl(url) ? { mode: "cors" } : {}),
  };
}

function playNextTrack(audio, options = {}) {
  playTrackOffset(audio, 1, options);
}

function playTrackOffset(audio, step, options = {}) {
  if (!audio) return;
  if (options.force && isMusicLocked(audio)) {
    setMusicStatus(musicLockReason(audio));
    return;
  }
  if (musicState.manual && !options.force) return;
  const playlist = parsePlaylist(audio);
  if (playlist.length <= 1) return;
  cancelMusicFade();
  clearMusicPlayRequest();
  musicState.currentTime = 0;
  musicState.paused = false;
  musicState.manual = false;
  musicState.playlistIndex = nextPlaylistIndex(playlist, step, options);
  lyrics = [];
  currentLyricIndex = -2;
  currentEndingMemoryLyricIndex = -2;
  musicState.manualLyrics = false;
  loadedLyricsSrc = "";
  lyricsRequestId += 1;
  const nextTrack = playlist[musicState.playlistIndex];
  if (!options.immediate && !options.skipFailed && audio.src && !audio.paused && !audio.ended) {
    fadeToTrackStart(audio, nextTrack);
    return;
  }
  const shouldFadeIn = !options.skipFailed && audio.ended;
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {}
  ensureTrackAsset(audio, nextTrack, { restart: true, startMuted: shouldFadeIn });
  if (shouldFadeIn) {
    fadeAudioIn(audio);
  }
}

function nextPlaylistIndex(playlist, step, options = {}) {
  const length = playlist.length;
  const start = Number.isInteger(musicState.playlistIndex) ? musicState.playlistIndex : 0;
  if (options.skipFailed !== true) {
    return (start + step + length) % length;
  }
  for (let offset = 1; offset <= length; offset += 1) {
    const candidate = (start + step * offset + length * offset) % length;
    const src = playlist[candidate]?.src || "";
    if (!src || !failedTrackSources.has(src)) return candidate;
  }
  return (start + step + length) % length;
}

function handleAudioResourceError(audio) {
  const failedSrc = audio?.currentSrc || audio?.src || audio?.dataset.trackSrc || musicState.src || "";
  if (retryAudioResourceLoad(audio)) {
    return;
  }
  if (failedSrc) failedTrackSources.add(failedSrc);
  updateMusicProgress(audio);
  const playlist = parsePlaylist(audio);
  if (playlist.length > 1) {
    setMusicStatus("当前音乐加载失败，正在切换下一首");
    playTrackOffset(audio, 1, { skipFailed: true });
    return;
  }
  musicState.paused = true;
  setMusicStatus("音乐资源加载失败，可稍后重试或选择本地 MP3 测试");
}

function retryAudioResourceLoad(audio) {
  if (!audio || !audio.isConnected || !isCurrentAudioTrackEvent(audio)) return false;
  const trackSrc = audio.dataset.trackSrc || musicState.src || "";
  if (!trackSrc) return false;
  const retryCount = Number(audio.dataset.trackLoadRetries) || 0;
  if (retryCount >= MUSIC_TRACK_LOAD_RETRY_LIMIT) return false;
  audio.dataset.trackLoadRetries = String(retryCount + 1);
  failedTrackSources.delete(trackSrc);
  setMusicStatus("当前音乐加载不稳定，正在重试当前曲目");
  window.setTimeout(() => {
    if (!isCurrentAudioTrackEvent(audio)) return;
    clearMusicPlayRequest();
    setAudioSource(audio, assetUrl(trackSrc) || trackSrc);
    restoreAudioPlayback(audio, { forcePlay: true });
  }, MUSIC_TRACK_LOAD_RETRY_MS);
  return true;
}

function clearUiDialogCloseTimer() {
  if (!uiDialogCloseTimer) return;
  clearTimeout(uiDialogCloseTimer);
  uiDialogCloseTimer = null;
}

function closeUiDialogSmoothly() {
  if (!uiDialog) {
    return;
  }
  clearUiDialogCloseTimer();
  const backdrop = currentUiDialogLayer() ?? currentModalBackdrop();
  removeStaleUiDialogLayers(backdrop?.dataset.uiDialogLayer === "true" ? backdrop : null);
  uiDialog = null;
  if (!backdrop || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    backdrop?.remove();
    return;
  }
  backdrop.classList.add("is-closing");
  uiDialogCloseTimer = setTimeout(() => {
    uiDialogCloseTimer = null;
    backdrop.remove();
  }, UI_DIALOG_REPLACE_MS);
}

function readVisibleMeterSnapshot(source) {
  if (!source) return {};
  const metric = (value, max, min = 0) => {
    const numericValue = Number(value) || 0;
    const numericMin = Number(min) || 0;
    const numericMax = Math.max(numericMin + 1, Number(max) || 100);
    const ratio = (numericValue - numericMin) / (numericMax - numericMin);
    return {
      value: numericValue,
      max: numericMax,
      min: numericMin,
      ratio: Math.max(0, Math.min(1, ratio)),
    };
  };
  return {
    energy: metric(source.energy, source.maxEnergy ?? 100),
    pressure: metric(source.pressure, 100),
    money: metric(Math.round(source.money ?? 0), 10000, -3000),
    progress: metric(source.progress, progressCap(source)),
    quality: metric(source.quality, qualityCap(source)),
    gpa: metric(source.gpa ?? 0, 4),
    gpaModifier: metric(source.gpaModifier ?? source.temporaryGpaModifier ?? 0, 1, -1),
  };
}

function specialSkillFeedbackFrom(before, after, characterId = "") {
  const preferredOrder = {
    ordinary_person: ["energy", "pressure", "progress", "quality"],
    mixed_in: [],
    pressure_immune: ["energy", "pressure", "progress", "quality"],
    design_enabler: ["progress", "quality", "pressure", "energy"],
    poor_scholar: ["progress", "quality", "energy", "pressure"],
    full_pressure: ["progress", "energy", "pressure"],
    future_boss: ["money", "progress", "quality", "pressure"],
    born_lucky: ["money", "pressure"],
    gene_rebel: ["money", "progress", "quality", "pressure"],
    town_exam_ace: ["progress", "gpa", "energy", "pressure"],
    corbusier_heir: ["money", "progress", "quality", "pressure"],
  }[characterId] ?? ["energy", "pressure", "money", "progress", "quality", "gpa", "gpaModifier"];
  const changed = preferredOrder
    .map((key) => {
      const beforeMetric = before[key] ?? { value: 0, ratio: 0 };
      const afterMetric = after[key] ?? { value: 0, ratio: 0 };
      return {
        key,
        delta: Math.round((afterMetric.value - beforeMetric.value) * 100) / 100,
        beforeValue: beforeMetric.value,
        afterValue: afterMetric.value,
        beforeRatio: beforeMetric.ratio ?? 0,
        afterRatio: afterMetric.ratio ?? 0,
      };
    })
    .filter((item) => item.delta !== 0);
  const stamps = [];
  return { changed, stamps };
}

function playPendingSpecialSkillFeedback() {
  const feedback = pendingSpecialSkillFeedback;
  pendingSpecialSkillFeedback = null;
  if (!feedback || (!feedback.changed.length && !feedback.stamps.length)) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = [];
  for (const [index, item] of feedback.changed.entries()) {
    const tile = specialSkillFeedbackTarget(item.key);
    if (!tile) continue;
    const delay = reduceMotion ? 0 : index * 90;
    if (isSpecialSkillNumberFeedback(item.key)) {
      animateSpecialSkillNumber(tile, item, delay, targets);
      continue;
    }
    if (isSpecialSkillInlineNumberFeedback(item.key)) {
      animateSpecialSkillInlineNumber(tile, item, delay, targets);
      continue;
    }
    const bar = tile.querySelector(".meter-track span");
    if (bar) {
      animateSpecialSkillBar(tile, bar, item, delay, reduceMotion, targets);
    } else {
      const transient = createSpecialSkillTransientBars([item]);
      tile.append(transient);
      const transientBar = transient.querySelector(".special-skill-transient-bar span");
      animateSpecialSkillBar(tile, transientBar, item, delay, reduceMotion, targets, transient);
    }
  }
  const consolePanel = app.querySelector(".status-console");
  if (consolePanel && feedback.stamps.length) {
    const ruleBars = createSpecialSkillTransientBars(feedback.stamps);
    ruleBars.classList.add("is-rule-bars");
    consolePanel.append(ruleBars);
    for (const [index, item] of feedback.stamps.entries()) {
      const bar = ruleBars.querySelectorAll(".special-skill-transient-bar span")[index];
      animateSpecialSkillBar(ruleBars, bar, item, reduceMotion ? 0 : index * 90, reduceMotion, targets);
    }
    targets.push({ removable: ruleBars });
  }
  window.setTimeout(() => {
    for (const item of targets) {
      item.target?.classList.remove(
        "special-skill-meter-feedback",
        "special-skill-number-host",
        "special-skill-inline-number-host",
        "is-skill-positive",
        "is-skill-negative"
      );
      item.target?.style.removeProperty("--skill-feedback-delay");
      item.target?.style.removeProperty("--skill-impact");
      item.bar?.classList.remove("special-skill-bar-feedback");
      item.bar?.style.removeProperty("transition-delay");
      item.mark?.remove();
      item.segment?.remove();
      item.number?.remove();
      if (item.inline && item.finalText) {
        item.inline.textContent = item.finalText;
        item.inline.classList.remove("special-skill-inline-number-feedback");
        item.inline.style.removeProperty("--skill-feedback-delay");
      }
      item.removable?.remove();
    }
  }, reduceMotion ? 260 : SPECIAL_SKILL_FEEDBACK_MS + 240);
}

function specialSkillFeedbackTarget(key) {
  if (key === "progress" || key === "quality") {
    const label = key === "progress" ? "进度" : "质量";
    return [...app.querySelectorAll(".course-progress > div")]
      .find((node) => node.textContent.includes(label))
      ?? app.querySelector(`.meter-${CSS.escape(key)}`);
  }
  return app.querySelector(`.status-${CSS.escape(key)}`)
    ?? app.querySelector(`.meter-${CSS.escape(key)}`);
}

function animateSpecialSkillBar(target, bar, item, delay, reduceMotion, targets, removable = null) {
  if (!bar) return;
  const beforeRatio = clampRatio(item.beforeRatio);
  const afterRatio = clampRatio(item.afterRatio);
  const oldPercent = `${Math.round(beforeRatio * 100)}%`;
  const newPercent = `${Math.round(afterRatio * 100)}%`;
  const impact = Math.min(1, Math.max(0.28, Math.abs(afterRatio - beforeRatio) * 1.8));
  const tone = specialSkillFeedbackTone(item);
  const track = bar.closest(".meter-track");
  const mark = createSpecialSkillOldMark(beforeRatio, reduceMotion);
  const segment = createSpecialSkillChangeSegment(beforeRatio, afterRatio, reduceMotion);
  if (track && mark) track.append(mark);
  if (track && segment) track.append(segment);
  target.classList.add("special-skill-meter-feedback", tone);
  target.style.setProperty("--skill-feedback-delay", `${delay}ms`);
  target.style.setProperty("--skill-impact", String(Math.round(impact * 100) / 100));
  bar.classList.add("special-skill-bar-feedback");
  bar.style.transitionDelay = `${delay}ms`;
  bar.style.inlineSize = reduceMotion ? newPercent : oldPercent;
  if (!reduceMotion) {
    bar.getBoundingClientRect();
    requestAnimationFrame(() => {
      bar.style.inlineSize = newPercent;
    });
  }
  targets.push({ target, bar, mark, segment, removable });
}

function animateSpecialSkillNumber(target, item, delay, targets) {
  const tone = specialSkillFeedbackTone(item);
  const number = createSpecialSkillNumberFeedback(item);
  target.classList.add("special-skill-number-host", tone);
  target.style.setProperty("--skill-feedback-delay", `${delay}ms`);
  target.append(number);
  targets.push({ target, number });
}

function animateSpecialSkillInlineNumber(target, item, delay, targets) {
  const inline = target.querySelector(".status-copy strong");
  if (!inline) return;
  const tone = specialSkillFeedbackTone(item);
  const before = document.createElement("span");
  const after = document.createElement("span");
  before.className = "special-skill-inline-old";
  after.className = "special-skill-inline-new";
  before.textContent = specialSkillInlineNumberText(item.beforeValue, item.key);
  after.textContent = specialSkillInlineNumberText(item.afterValue, item.key);
  inline.textContent = "";
  inline.append(before, after);
  inline.classList.add("special-skill-inline-number-feedback");
  inline.style.setProperty("--skill-feedback-delay", `${delay}ms`);
  target.classList.add("special-skill-inline-number-host", tone);
  target.style.setProperty("--skill-feedback-delay", `${delay}ms`);
  targets.push({ target, inline, finalText: after.textContent });
}

function createSpecialSkillNumberFeedback(item) {
  const node = document.createElement("i");
  node.className = "special-skill-number-feedback";
  node.setAttribute("aria-hidden", "true");
  node.textContent = specialSkillNumberFeedbackText(item);
  return node;
}

function isSpecialSkillNumberFeedback(key) {
  return key === "money";
}

function isSpecialSkillInlineNumberFeedback(key) {
  return key === "gpa" || key === "gpaModifier";
}

function specialSkillNumberFeedbackText(item) {
  const delta = Number(item.delta) || 0;
  const sign = delta >= 0 ? "+" : "-";
  if (item.key === "money") {
    return `${sign}¥${Math.abs(Math.round(delta))}`;
  }
  return `${sign}${Math.abs(delta).toFixed(2)}`;
}

function specialSkillInlineNumberText(value, key) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "未知";
  if (key === "gpa" || key === "gpaModifier") return numeric.toFixed(2);
  return String(numeric);
}

function createSpecialSkillTransientBars(items) {
  const wrap = document.createElement("div");
  wrap.className = "special-skill-transient-bars";
  for (const item of items) {
    const row = document.createElement("div");
    row.className = `special-skill-transient-bar special-skill-transient-${item.key}`;
    row.classList.add(specialSkillFeedbackTone(item));
    const label = document.createElement("span");
    label.textContent = specialSkillMetricLabel(item.key, item.label);
    const track = document.createElement("div");
    track.className = "meter-track";
    const fill = document.createElement("span");
    fill.style.inlineSize = `${Math.round(Math.max(0, Math.min(1, item.beforeRatio ?? 0)) * 100)}%`;
    track.append(fill);
    row.append(label, track);
    wrap.append(row);
  }
  return wrap;
}

function createSpecialSkillOldMark(beforeRatio, reduceMotion) {
  if (reduceMotion) return null;
  const mark = document.createElement("i");
  mark.className = "special-skill-old-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.style.insetInlineStart = `${Math.round(clampRatio(beforeRatio) * 100)}%`;
  return mark;
}

function createSpecialSkillChangeSegment(beforeRatio, afterRatio, reduceMotion) {
  if (reduceMotion) return null;
  const start = Math.min(clampRatio(beforeRatio), clampRatio(afterRatio));
  const width = Math.abs(clampRatio(afterRatio) - clampRatio(beforeRatio));
  if (width <= 0) return null;
  const segment = document.createElement("i");
  segment.className = "special-skill-change-segment";
  segment.setAttribute("aria-hidden", "true");
  segment.style.insetInlineStart = `${Math.round(start * 100)}%`;
  segment.style.inlineSize = `${Math.max(1, Math.round(width * 100))}%`;
  return segment;
}

function specialSkillFeedbackTone(item) {
  if (item.key === "pressure") return item.delta > 0 ? "is-skill-negative" : "is-skill-positive";
  return item.delta >= 0 ? "is-skill-positive" : "is-skill-negative";
}

function clampRatio(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function specialSkillMetricLabel(key, fallback = "") {
  return fallback || {
    energy: "精力",
    pressure: "压力",
    money: "金钱状态",
    progress: "课设进度",
    quality: "课设质量",
    gpa: "个人 GPA",
    gpaModifier: "GPA 学期修正",
  }[key] || key;
}

function isMusicLocked(audio) {
  return audio?.dataset.musicLocked === "true";
}

function musicLockReason(audio) {
  return audio?.dataset.musicLockReason || "购买音乐会员后可以手动切歌";
}

function parsePlaylist(audio) {
  try {
    const playlist = JSON.parse(audio.dataset.playlist || "[]");
    return Array.isArray(playlist) ? playlist : [];
  } catch {
    return [];
  }
}

function updateTrackDisplay(track) {
  const title = app.querySelector("[data-track-title]");
  const meta = app.querySelector("[data-track-meta]");
  const cover = app.querySelector("[data-track-cover]");
  if (title) title.textContent = track.title ?? "未知曲目";
  if (meta) meta.textContent = `${track.artist ?? "未知"} · ${track.kind ?? track.placeholder ?? ""}`;
  if (cover && (track.coverSource || track.cover)) {
    const nextCoverSource = track.coverSource || track.cover;
    if (cover.dataset.trackCoverSrc !== nextCoverSource) {
      cover.dataset.trackCoverSrc = nextCoverSource;
      cover.innerHTML = renderUiIcon(nextCoverSource);
    }
  }
}

function setMusicStatus(text) {
  const target = app.querySelector("[data-music-status]");
  if (target) {
    target.textContent = text;
  }
}

function updateClock() {
  for (const target of app.querySelectorAll("[data-current-clock]")) {
    target.textContent = currentClock;
  }
}

function formatClock(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
