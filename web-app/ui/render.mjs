import {
  ACHIEVEMENTS,
  ARCHITECTURE_INTERNSHIP_OPTIONS,
  ATTRIBUTE_LABELS,
  ENDINGS,
  INTERNSHIP_APPLICATION,
  INTERNSHIP_COMPLETION_DELTAS,
  INTERNSHIP_TIER_LABELS,
  INTERNSHIP_WEEKLY_DELTAS,
  MENTORS,
  RANDOM_EVENTS,
} from "../game/data.mjs";
import {
  ACTION_ICONS,
  ATTRIBUTE_ICONS,
  CHARACTER_AVATAR_ICONS,
  CHARACTER_SKILL_ICONS,
  DELTA_ICONS,
  MENTOR_AVATAR_ICONS,
  MENTOR_STAGE_TASK_ICONS,
  METER_ICONS,
  SHOP_ITEM_ICONS,
  START_ACHIEVEMENT_ICONS,
  START_SCENE_IMAGES,
  START_SCENE_MOBILE_IMAGES,
  START_SECONDARY_ENTRIES,
  START_SETTINGS_ENTRIES,
  START_TOOLBAR_ENTRIES,
  SUPPORT_ENDING_IMAGE,
  SUPPORT_QR_CODES,
  UI_ICON_PATHS,
  achievementIconPath,
  competitionAwardIconPath,
  competitionEventIconPath,
  courseIconPath,
  endingIllustrationPath,
  endingRouteIconPath,
  modelMaterialIconPath,
  projectIconPath,
  renderUiIcon,
  internshipShortEventIconPath,
  randomEventIconPath,
  reportStrategyIconPath,
  internshipWorkIconPath,
  routeOptionIconPath,
  themeIconPath,
} from "./icons.mjs";
import { escapeHtml } from "./html.mjs";
import { publicAssetUrl, R2_ASSET_BASE_URL } from "./asset-url.mjs";
import { DEFAULT_UI_LANGUAGE, UI_LANGUAGE_OPTIONS, languageDialogCopy, normalizeUiLanguage } from "./language.mjs";
import { BEIAN_QUERY_URL, COMPANY_NAME, ICP_BEIAN_NUMBER, POLICE_BEIAN_NUMBER } from "./legal.mjs";

export const ENDING_MEMORY_ASSET_VERSION = "ending-memory-20260706-18";
export const ENDING_MEMORY_ANIMATION_SRC = publicAssetUrl(`/hyperframes/ending-memory/index.html?v=${ENDING_MEMORY_ASSET_VERSION}&embedded=1&play=1`);
export const ENDING_MEMORY_RUNTIME_SOURCES = [
  publicAssetUrl(`/hyperframes/ending-memory/styles.css?v=${ENDING_MEMORY_ASSET_VERSION}`),
  publicAssetUrl(`/hyperframes/ending-memory/scenes.generated.js?v=${ENDING_MEMORY_ASSET_VERSION}`),
  publicAssetUrl(`/hyperframes/ending-memory/main.js?v=${ENDING_MEMORY_ASSET_VERSION}`),
  "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js",
];

export function modalCommandKey(interaction) {
  const text = [
    interaction?.type ?? "",
    interaction?.eventId ?? "",
    interaction?.optionId ?? "",
    interaction?.memoryStep ?? "",
    interaction?.examType ?? "",
    interaction?.title ?? "",
    interaction?.body ?? "",
  ].join("\u001f");
  return stableHash(text);
}

function stableHash(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

const DELTA_LABELS = {
  actionSlots: "行动次数",
  energy: "精力",
  pressure: "压力",
  money: "金钱",
  progress: "进度",
  quality: "作品质量",
  portfolio: "作品集",
  gpa: "个人GPA",
  gpaModifier: "GPA修正",
  maxEnergy: "精力上限",
  achievementScore: "成就分",
  internshipValue: "实习价值",
  design: "设计水平",
  software: "软件技术",
  aesthetic: "创意审美",
  presentation: "汇报表达",
  social: "人际交往",
  resilience: "抗压能力",
};

const LEADERBOARD_RANK_ICONS = {
  1: competitionAwardIconPath("first"),
  2: competitionAwardIconPath("second"),
  3: competitionAwardIconPath("third"),
};

const LEADERBOARD_EMPTY_MESSAGE = "排行榜暂无可展示数据；线上接口未可用时会自动显示本地毕业档案。";

const SYSTEM_ICON_ALIASES = {
  announcement: "note",
};

const ROLE_CARD_BACK_IMAGE = "/optimized/assets/characters/role-card-back.57c9bfd03c0b.webp";

function assetSrc(source) {
  return escapeHtml(publicAssetUrl(source));
}

function renderBeianLinks(extraClass = "") {
  const className = `beian-links ${extraClass}`.trim();
  return `
    <p class="${className}" aria-label="备案信息">
      <span>${escapeHtml(COMPANY_NAME)}</span>
      <a href="${BEIAN_QUERY_URL}" target="_blank" rel="noopener noreferrer">${escapeHtml(ICP_BEIAN_NUMBER)}</a>
      <a href="${BEIAN_QUERY_URL}" target="_blank" rel="noopener noreferrer">${escapeHtml(POLICE_BEIAN_NUMBER)}</a>
    </p>
  `;
}

function assetTrack(track) {
  if (!track || typeof track !== "object") return track;
  const coverSource = track.coverSource || track.cover;
  return {
    ...track,
    src: publicAssetUrl(track.src),
    lyricsSrc: publicAssetUrl(track.lyricsSrc),
    cover: publicAssetUrl(coverSource),
    coverSource,
  };
}

export function renderLoading({ progress = 0, showFullscreenTip = true, appVersion = "", versionNotice = "" } = {}) {
  const progressValue = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
  const versionNoticeState = versionNotice ? "visible" : "hidden";
  return `
    <main class="loading-shell" data-version-notice-state="${versionNoticeState}">
      <section class="loading-panel" aria-live="polite">
        <div class="loading-panel-inner">
          <p class="kicker">SERVER / RENDER / WAIT</p>
          <span class="loading-brand-mark" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.loading_clock)}</span>
          <h1>第二十五小时</h1>
          ${appVersion ? `<p class="loading-version">${escapeHtml(appVersion)}</p>` : ""}
          <div class="loading-copy">
            <p class="loading-copy-primary">正在载入 你的 五年建筑生 大学生涯</p>
            <p>“ 请稍候，别着急同学们，</p>
            <p>画图也是从等渲染开始的，不是吗？”</p>
          </div>
          <div class="loading-bar" role="progressbar" aria-label="载入进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressValue}" style="--loading-progress:${progressValue}%; --loading-progress-ratio:${progressValue / 100}">
            <span></span>
          </div>
        </div>
      </section>
      ${renderBeianLinks("loading-beian-links")}
      ${showFullscreenTip ? `
      <aside class="loading-fullscreen-tip" aria-label="全屏提示">
        <p>为了更佳的游戏体验，建议您使用全屏模式。<br />按 F11 键可进入或退出全屏模式。</p>
      </aside>
      ` : ""}
      ${versionNotice ? `
      <aside class="loading-version-tip" role="status" aria-live="assertive" aria-label="版本更新提示">
        <p>${escapeHtml(versionNotice)}</p>
      </aside>
      ` : ""}
    </main>
  `;
}

export function renderStart({ hasSave, startMode, theme, uiDialog, language = DEFAULT_UI_LANGUAGE, currentClock, music, vm = null, isMobileStartSurface = false, appVersion = "", startProfileError = "", startProfileDraft = null }) {
  if (isMobileStartSurface) {
    return renderMobileStart({ theme, uiDialog, language, currentClock, vm });
  }
  const mainEntry = startMode === "profile"
    ? renderStartForm({ error: startProfileError, draft: startProfileDraft })
    : `
      <div class="start-main-actions">
        <button class="start-entry-button is-primary" type="button" data-command="show-start-form">
          <span class="start-entry-icon start-icon-start-new" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.start_new)}</span>
          <span class="start-entry-copy">
            <strong>开始新游戏</strong>
            <em>“同学，行李给我，我帮你拿！”</em>
          </span>
          <span class="start-entry-arrow" aria-hidden="true"></span>
        </button>
        <button class="start-entry-button" type="button" data-command="load-save" ${hasSave ? "" : "disabled"}>
          <span class="start-entry-icon start-icon-continue" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.continue_arrow)}</span>
          <span class="start-entry-copy">
            <strong>继续上次游戏</strong>
            <em>${hasSave ? "这一次，不用Ctrl+Z。" : "暂无可读取的本地存档。"}</em>
          </span>
          <span class="start-entry-arrow" aria-hidden="true"></span>
        </button>
      </div>
    `;

  const secondaryEntries = START_SECONDARY_ENTRIES.map((entry) => `
    <button class="start-small-card ${entry.id === "coffee" ? "is-warm" : ""}" type="button" data-command="${entry.command}" data-id="${entry.id}">
      <span class="start-small-icon start-icon-${entry.icon}" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS[entry.icon])}</span>
      <span><strong>${escapeHtml(entry.title)}</strong><em>${escapeHtml(entry.detail)}</em></span>
    </button>
  `).join("");

  const toolbarEntries = START_TOOLBAR_ENTRIES.map((entry) => {
    const iconPath = entry.icon === "theme" ? themeIconPath(theme) : UI_ICON_PATHS[entry.icon];
    return `
    <button class="start-toolbar-button" type="button" data-command="${entry.command}" ${entry.id ? `data-id="${entry.id}"` : ""}>
      <span class="start-toolbar-icon start-icon-${entry.icon}" aria-hidden="true">${renderUiIcon(iconPath)}</span>
      <strong>${escapeHtml(entry.title)}</strong>
    </button>
  `;
  }).join("");
  const startAchievementItems = vm?.achievements?.showcaseItems ?? START_ACHIEVEMENT_ICONS.map((item) => ({
    ...item,
    unlocked: false,
  }));
  const leaderboard = leaderboardRowsFor(vm);

  return `
    <main class="start-shell">
      <picture class="start-scene-art" aria-hidden="true">
        <img class="start-scene-img is-light" src="${assetSrc(START_SCENE_IMAGES.light)}" alt="" decoding="async" fetchpriority="high" />
        <img class="start-scene-img is-dark" src="${assetSrc(START_SCENE_IMAGES.dark)}" alt="" decoding="async" fetchpriority="high" />
      </picture>
      <section class="start-hero" aria-labelledby="start-title" data-start-mode="${escapeHtml(startMode)}">
        <div class="hero-copy start-title-panel">
          <div class="title-stack">
            <h1 id="start-title"><span class="title-primary">第二十五小时</span><span class="title-meta-row"><span class="title-secondary">建筑生模拟器</span>${appVersion ? `<span class="start-version-label">${escapeHtml(appVersion)}</span>` : ""}</span></h1>
          </div>
          <p class="english-line">THE 25TH HOUR · ARCHITECTURE STUDENT SIMULATOR</p>
          <div class="start-signal-row" aria-hidden="true">
            <span></span><span></span><span></span><span></span><i></i><i></i>
          </div>
        </div>

        <div class="start-panel start-entry-panel">
          ${mainEntry}
        </div>

        <div class="start-secondary-grid">
          ${secondaryEntries}
        </div>

        <section class="start-leaderboard-panel" aria-labelledby="start-leaderboard-title">
          <div class="start-panel-head has-icon">
            <span class="start-panel-title-icon start-icon-leaderboard" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.leaderboard)}</span>
            <h2 id="start-leaderboard-title">玩家排行榜</h2>
            <em>LEADERBOARD</em>
          </div>
          <div class="start-leaderboard-empty start-leaderboard-preview ${leaderboard.startRows.length ? "" : "is-placeholder"}" role="note">
            ${leaderboard.startRows.length ? `
              <ul class="start-leaderboard-list" aria-label="玩家排行榜预览">
                ${leaderboard.startRows.map((row) => `
                <li class="${row.isSelf ? "is-self" : ""}">
                  ${renderLeaderboardRank(row)}
                  <strong>${escapeHtml(row.name)}</strong>
                  <em>${escapeHtml(row.university)}</em>
                  <b>${escapeHtml(row.score)}</b>
                </li>
                `).join("")}
              </ul>
            ` : `<p>${LEADERBOARD_EMPTY_MESSAGE}</p>`}
          </div>
          <button class="start-link-button" type="button" data-command="ui-dialog" data-id="leaderboard">
            <span>查看排行榜</span>
            <span class="inline-pixel-arrow" aria-hidden="true"></span>
          </button>
        </section>

        <section class="start-achievement-panel" aria-labelledby="start-achievement-title">
          <div class="start-panel-head has-icon">
            <span class="start-panel-title-icon start-icon-achievements" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.achievements)}</span>
            <h2 id="start-achievement-title">结局与成就</h2>
            <em>COLLECTION</em>
          </div>
          <div class="start-achievement-grid">
            ${startAchievementItems.map((item) => `
              <button class="start-achievement-tile ${item.unlocked ? "is-unlocked" : "is-locked"}" type="button" data-command="ui-dialog" data-id="achievements" aria-label="查看成就图鉴：${escapeHtml(item.title)}">
                <span class="start-achievement-icon" aria-hidden="true">${renderUiIcon(item.icon ?? achievementIconPath(item), item.title)}</span>
                ${item.unlocked ? "" : `<span class="start-achievement-lock" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.risk_lock, "未解锁")}</span>`}
              </button>
            `).join("")}
          </div>
          <p>收集那些被你亲手走出来的瞬间。</p>
        </section>

        <aside class="start-ready-panel" aria-label="开场状态">
          <strong data-current-clock>${escapeHtml(currentClock)}</strong>
          <p>黄色的树林里不止分出两条路，<br />你的选择是什么呢，少年？</p>
          <div class="start-software-row" aria-hidden="true">
            <i>${renderUiIcon(UI_ICON_PATHS.software_cad)}<span>CAD</span></i>
            <i>${renderUiIcon(UI_ICON_PATHS.software_su)}<span>SU</span></i>
            <i>${renderUiIcon(UI_ICON_PATHS.software_ps)}<span>PS</span></i>
          </div>
          <i class="start-clock-art" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.clock)}</i>
        </aside>

        <nav class="start-toolbar" aria-label="开场系统入口">
          ${toolbarEntries}
        </nav>
        ${renderBeianLinks("start-beian-links")}
      </section>
      ${renderMusicDock({ music })}
      ${renderAchievementToasts(vm?.achievementToasts)}
      ${renderUiDialog(uiDialog, vm, theme, language)}
    </main>
  `;
}

function renderMobileStart({ theme, uiDialog, language = DEFAULT_UI_LANGUAGE, currentClock, vm = null }) {
  const mobileEntries = [
    {
      command: "ui-dialog",
      id: "mobile_start_blocked",
      title: "开始新游戏",
      detail: "“同学，行李给我，我帮你拿！”",
      icon: "start_new",
      primary: true,
    },
    ...START_SECONDARY_ENTRIES,
    {
      command: "ui-dialog",
      id: "leaderboard",
      title: "玩家排行榜",
      detail: "",
      icon: "leaderboard",
    },
    {
      command: "ui-dialog",
      id: "announcement",
      title: "公告",
      detail: "查看首发说明和更新消息。",
      icon: "note",
    },
    {
      command: "open-external-link",
      id: "community",
      title: "建院社区",
      detail: "",
      icon: "community",
    },
    {
      command: "toggle-theme",
      id: "",
      title: "深浅色模式",
      detail: "切换当前手机入口背景。",
      icon: "theme",
    },
  ];
  return `
    <main class="mobile-start-shell">
      <picture class="mobile-start-scene" aria-hidden="true">
        <img class="mobile-start-scene-img is-light" src="${assetSrc(START_SCENE_MOBILE_IMAGES.light)}" alt="" decoding="async" fetchpriority="high" />
        <img class="mobile-start-scene-img is-dark" src="${assetSrc(START_SCENE_MOBILE_IMAGES.dark)}" alt="" decoding="async" fetchpriority="high" />
      </picture>
      <section class="mobile-start-content" aria-labelledby="mobile-start-title">
        <header class="mobile-start-header">
          <p class="kicker">MOBILE ENTRY</p>
          <div class="mobile-start-title-row">
            <h1 id="mobile-start-title">第二十五小时</h1>
            <span class="mobile-start-title-clock start-icon-clock" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.clock)}</span>
          </div>
          <p class="mobile-start-subtitle">建筑生模拟器</p>
          <p class="mobile-start-english">THE 25TH HOUR · ARCHITECTURE STUDENT SIMULATOR</p>
        </header>
        <nav class="mobile-start-menu" aria-label="手机端入口">
          ${mobileEntries.map((entry) => {
            const iconPath = entry.icon === "theme" ? themeIconPath(theme) : UI_ICON_PATHS[entry.icon];
            const entryClass = `mobile-entry-${entry.id || entry.icon}`;
            return `
              <button class="mobile-start-entry ${entryClass} ${entry.primary ? "is-primary" : ""}" type="button" data-command="${entry.command}" ${entry.id ? `data-id="${entry.id}"` : ""}>
                <span class="mobile-start-entry-icon start-icon-${entry.icon}" aria-hidden="true">${renderUiIcon(iconPath)}</span>
                <span class="mobile-start-entry-copy">
                  <strong>${escapeHtml(entry.title)}</strong>
                  ${entry.detail ? `<em>${escapeHtml(entry.detail)}</em>` : ""}
                </span>
              </button>
            `;
          }).join("")}
        </nav>
      </section>
      ${renderAchievementToasts(vm?.achievementToasts)}
      ${renderUiDialog(uiDialog, vm, theme, language)}
    </main>
  `;
}

export function renderGame(vm, { theme, uiDialog, language = DEFAULT_UI_LANGUAGE }) {
  if (vm.phase === "character_select") {
    return renderCharacterSelect(vm, uiDialog, theme, language);
  }
  if (vm.phase === "mentor_select" && vm.pendingInteraction?.type === "mentor_select") {
    return renderMentorSelect(vm, uiDialog, theme, language);
  }
  if (isEndingMemoryAnimation(vm)) {
    return renderEndingMemoryAnimationScreen(vm);
  }
  if (vm.ending && !vm.pendingInteraction) {
    return renderEndingScreen(vm, { theme, uiDialog, language });
  }

  const achievementLogs = vm.achievementLogs ?? recentLogItems(vm.logs.filter(isAchievementLog));
  const purchaseLogs = vm.purchaseLogs ?? recentLogItems(vm.logs.filter(isPurchaseLog));
  const actionLogs = vm.actionLogs ?? recentLogItems(vm.logs.filter((log) => !isEventLog(log) && !isAchievementLog(log) && !isPurchaseLog(log)));
  const eventLogs = vm.eventLogs ?? recentLogItems(vm.logs.filter(isEventLog));
  const realityDate = new Date();

  return `
    <main class="game-shell risk-${vm.risk.level}">
      <aside class="sidebar">
        <div class="brand-lockup blueprint-lockup">
          <span class="brand-mark" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.game_clock)}</span>
          <strong>第二十五小时</strong>
          <time class="brand-clock" data-current-clock></time>
        </div>

        ${renderActions(vm)}
      </aside>

      <section class="main-panel">
        ${renderStatusConsole(vm)}

        <section class="log-hero">
          <div class="section-head">
            <div>
              <h2><span class="log-title-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.log_calendar, "日志")}</span>日志 <span>LOG</span></h2>
              <p class="log-calendar-line">${escapeHtml(vm.calendar.semester)} / <span class="log-week-highlight">第 ${vm.calendar.weekInSemester || 1} 周</span></p>
            </div>
            <div class="log-profile-chip" aria-label="玩家大学">
              <strong>${escapeHtml(vm.profile.universityName)}</strong>
            </div>
          </div>
          ${renderRiskSlot(vm)}
          <input class="log-tab-control" id="log-tab-actions" type="radio" name="game-log-tab" checked />
          <input class="log-tab-control" id="log-tab-events" type="radio" name="game-log-tab" />
          <input class="log-tab-control" id="log-tab-achievements" type="radio" name="game-log-tab" />
          <input class="log-tab-control" id="log-tab-purchases" type="radio" name="game-log-tab" />
          <div class="log-tabs" aria-label="日志分类">
            <label class="log-tab log-tab-actions" for="log-tab-actions">行动日志</label>
            <label class="log-tab log-tab-events" for="log-tab-events">事件日志</label>
            <label class="log-tab log-tab-achievements" for="log-tab-achievements">成就日志</label>
            <label class="log-tab log-tab-purchases" for="log-tab-purchases">购买日志</label>
          </div>
          <p class="log-day"><span>今天⌄</span><time datetime="${escapeHtml(formatRealityDate(realityDate, "-"))}">${escapeHtml(formatRealityDate(realityDate))}</time></p>
          <div class="log-panes">
            <ol class="log-list log-list-actions">
              ${actionLogs.map(renderLog).join("") || `<li class="empty-text">暂无行动日志</li>`}
            </ol>
            <ol class="log-list log-list-events">
              ${eventLogs.map(renderLog).join("") || `<li class="empty-text">暂无事件日志</li>`}
            </ol>
            <ol class="log-list log-list-achievements">
              ${achievementLogs.map(renderLog).join("") || `<li class="empty-text">暂无成就日志</li>`}
            </ol>
            <ol class="log-list log-list-purchases">
              ${purchaseLogs.map(renderLog).join("") || `<li class="empty-text">暂无购买日志</li>`}
            </ol>
          </div>
        </section>

        <section class="system-panel" aria-label="系统入口">
          <div class="system-grid">
            ${systemEntryGroup(vm, "main").map((entry) => renderBottomSystemEntryButton(entry, theme)).join("")}
          </div>
        </section>
      </section>

      <aside class="right-rail">
        <section class="profile-card">
          <div class="section-head compact"><h2>${escapeHtml(vm.profile.characterName)}：${escapeHtml(vm.profile.nickname)}</h2><span>PROFILE</span></div>
          <div class="profile-main">
            <div class="avatar-block" aria-hidden="true">${renderUiIcon(CHARACTER_AVATAR_ICONS[vm.profile.characterId], vm.profile.characterName)}</div>
            <div>
              <span class="profile-meta-line">学历：${escapeHtml(vm.profile.education)}</span>
              <span class="profile-meta-line">家境：${escapeHtml(vm.profile.family)}</span>
            </div>
          </div>
          <div class="attribute-grid">
            ${vm.attributes.map(renderAttribute).join("")}
          </div>
        </section>

        <section class="course-card">
          <div class="section-head compact course-head">
            <h2>${escapeHtml(vm.calendar.topic)}</h2>
            <span>COURSE</span>
          </div>
          <dl class="side-facts">
            <div><dt>当前学年</dt><dd>${escapeHtml(vm.calendar.semester)}</dd></div>
            <div><dt>课程阶段</dt><dd>${escapeHtml(vm.calendar.courseStage)}</dd></div>
            <div class="annual-course-fact"><dt>年度课程</dt><dd><span class="side-fact-course-icon" aria-hidden="true">${renderUiIcon(courseIconPath(vm.profile.courseId), vm.profile.course)}</span><span>${escapeHtml(vm.profile.course)}</span></dd></div>
          </dl>
          <div class="course-progress">
            ${renderCourseProgress("课设进度", vm.courseProgress.find((item) => item.id === "progress"), METER_ICONS.progress)}
            ${renderCourseProgress("课设质量", vm.courseProgress.find((item) => item.id === "quality"), METER_ICONS.quality)}
          </div>
          ${renderCourseEntryGrid(vm, theme)}
        </section>

        ${renderRightEntryPanel(vm, theme, ["portfolio_resume", "resume"])}
        ${renderMentorCard(vm)}
      </aside>
      ${renderMusicDock(vm, "game")}
      ${renderCornerSystemBar(vm, theme)}
      ${renderAchievementToasts(vm.achievementToasts)}
      ${renderModal(vm.pendingInteraction)}
      ${uiDialog === "game_settings" ? renderGameSettingsDialog(vm, theme) : renderUiDialog(uiDialog, vm, theme, language)}
    </main>
  `;
}

export function renderOverlay(vm, { theme, uiDialog, language = DEFAULT_UI_LANGUAGE }) {
  if (!uiDialog) return "";
  if (uiDialog === "game_settings") {
    return vm ? renderGameSettingsDialog(vm, theme) : "";
  }
  return renderUiDialog(uiDialog, vm, theme, language);
}

function isEndingMemoryAnimation(vm) {
  return vm.phase === "ending_memory"
    && vm.pendingInteraction?.type === "ending_memory"
    && vm.pendingInteraction?.memoryStep === "ending_animation";
}

function renderEndingMemoryAnimationScreen(vm) {
  const canSkip = Boolean(vm.endingMemory?.canSkip);
  return `
    <main class="ending-memory-animation-shell ${canSkip ? "has-skip" : ""}">
      ${canSkip ? `
        <button class="pixel-button ending-memory-skip-button" type="button" data-command="modal-option" data-id="skip">跳过结尾回忆动画</button>
      ` : ""}
      <iframe
        class="ending-memory-animation"
        src="${escapeHtml(ENDING_MEMORY_ANIMATION_SRC)}"
        title="结尾回忆动画"
        loading="eager"
        allow="autoplay"
        data-ending-memory-animation
      ></iframe>
      <p class="ending-memory-lyric-line is-hidden" data-ending-memory-lyric></p>
      <div class="ending-memory-animation-actions">
        <button class="pixel-button ending-memory-complete-button" type="button" data-command="modal-option" data-id="confirm" data-ending-memory-complete>
          <span class="start-entry-copy">
            <strong>同学，毕业快乐！</strong>
          </span>
          <span class="start-entry-arrow" aria-hidden="true"></span>
        </button>
      </div>
      <div class="ending-memory-audio-host">
        ${renderMusicDock(vm, "ending-memory")}
      </div>
    </main>
  `;
}

function renderEndingScreen(vm, { theme, uiDialog, language = DEFAULT_UI_LANGUAGE }) {
  const illustration = endingIllustrationPath(vm.ending?.id);
  const illustrationAlt = `${vm.ending.title}结局插画`;
  const titleParts = splitEndingTitle(vm.ending.title);
  const endingIcon = endingRouteIconPath(vm.ending?.id, vm.ending);
  return `
    <main class="ending-shell risk-${vm.risk.level}" data-ending-id="${escapeHtml(vm.ending?.id ?? "")}" data-ending-route-option-id="${escapeHtml(vm.ending?.routeOptionId ?? "")}">
      <section class="ending-stage" aria-labelledby="ending-title">
        <div class="ending-hero">
          <div class="ending-visual-stack">
            <div class="ending-title-block">
              <span class="ending-title-icon" aria-hidden="true">${renderUiIcon(endingIcon, vm.ending.title)}</span>
              <div class="ending-title-copy">
                <h1 id="ending-title">
                  <span class="ending-title-main">${escapeHtml(titleParts.main)}</span>
                  ${titleParts.detail ? `<span class="ending-title-detail">${escapeHtml(titleParts.detail)}</span>` : ""}
                </h1>
              </div>
            </div>
            ${illustration ? `
              <figure class="ending-illustration">
                <div class="ending-image-frame">
                  <img src="${assetSrc(illustration)}" alt="${escapeHtml(illustrationAlt)}" decoding="async" fetchpriority="high" />
                </div>
              </figure>
            ` : ""}
          </div>
          ${renderEndingInsightPanel(vm)}
        </div>
      </section>

      <aside class="ending-side">
        <div class="ending-copy">
          <p>${escapeHtml(vm.ending.body)}</p>
        </div>
        <div class="ending-summary">
          <div class="ending-actions">
            <button class="start-entry-button is-primary ending-return-button" type="button" data-command="new-game" data-id="confirmed">
              <span class="start-entry-icon start-icon-start-new" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.start_new)}</span>
              <span class="start-entry-copy">
                <strong>返回主菜单</strong>
                <em>开启下一段崭新的人生吧！</em>
              </span>
              <span class="start-entry-arrow" aria-hidden="true"></span>
            </button>
            <button
              class="start-entry-button ending-share-direct-button"
              type="button"
              data-command="save-ending-page-screenshot"
            >
              <span class="start-entry-icon start-icon-share-to-moments" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.share_to_moments)}</span>
              <span class="start-entry-copy">
                <strong>我要发朋友圈！</strong>
                <em>点击后，自动保存当前结局图片。</em>
              </span>
              <span class="start-entry-arrow" aria-hidden="true"></span>
            </button>
            <button class="start-small-card is-warm ending-support-button" type="button" data-command="ui-dialog" data-id="coffee">
              <span class="start-small-icon start-icon-coffee" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.coffee)}</span>
              <span><strong>请作者喝咖啡续命</strong><em>“谢谢你愿意玩我的游戏，谢谢！”</em></span>
            </button>
            <div class="ending-link-actions">
              <button class="start-small-card" type="button" data-command="open-external-link" data-id="author">
                <span class="start-small-icon start-icon-author" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.author)}</span>
                <span><strong>作者的话</strong></span>
              </button>
              <button class="start-small-card" type="button" data-command="open-external-link" data-id="community">
                <span class="start-small-icon start-icon-community" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.community)}</span>
                <span><strong>建院社区</strong></span>
              </button>
            </div>
          </div>
        </div>
        ${renderMusicDock(vm, "game", { showLyrics: false })}
      </aside>
      ${renderAchievementToasts(vm.achievementToasts)}
      ${renderModal(vm.pendingInteraction)}
      ${renderUiDialog(uiDialog, vm, theme, language)}
    </main>
  `;
}

function renderEndingInsightPanel(vm) {
  const gpaValue = vm.metrics.find((item) => item.id === "gpa")?.value
    ?? vm.systems?.route?.gpaLabel
    ?? "未知";
  const route = vm.systems?.route ?? {};
  const ieltsScore = Number(route.ieltsScore ?? 0);
  const ieltsValue = ieltsScore > 0
    ? ieltsScore.toFixed(1).replace(/\.0$/, "")
    : route.ieltsExam?.hasTaken ? "低于6.0" : "未参加";
  const competition = vm.systems?.competition ?? {};
  const internship = vm.systems?.internship ?? {};
  const competitionAwardCount = Number(competition.awardCount ?? 0);
  const internshipValue = Math.round(Number(internship.internshipValue ?? 0));

  return `
    <section class="ending-insight-panel" aria-label="毕业履历摘要">
      <dl class="ending-stat-list">
        <div>
          <span class="ending-stat-icon" aria-hidden="true">${renderUiIcon(METER_ICONS.gpa, "GPA")}</span>
          <dt>GPA：</dt><dd>${escapeHtml(String(gpaValue))}</dd>
        </div>
        <div>
          <span class="ending-stat-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.ielts, "雅思成绩")}</span>
          <dt>雅思成绩：</dt><dd>${escapeHtml(ieltsValue)}</dd>
        </div>
        <div>
          <span class="ending-stat-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.trophy, "竞赛获奖")}</span>
          <dt>竞赛获奖：</dt><dd>${escapeHtml(String(competitionAwardCount))}次</dd>
        </div>
        <div>
          <span class="ending-stat-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.internship_work, "累计实习价值")}</span>
          <dt>累计实习价值：</dt><dd>${escapeHtml(String(internshipValue))}</dd>
        </div>
      </dl>
    </section>
  `;
}

function splitEndingTitle(title) {
  const normalizedTitle = String(title ?? "");
  const separator = "——";
  const separatorIndex = normalizedTitle.indexOf(separator);
  if (separatorIndex < 0) {
    return { main: normalizedTitle, detail: "" };
  }
  return {
    main: normalizedTitle.slice(0, separatorIndex),
    detail: normalizedTitle.slice(separatorIndex),
  };
}

function renderMusicDock(vm, variant = "", options = {}) {
  const musicLocked = Boolean(vm.music.locked);
  const lockText = vm.music.lockedReason ?? "购买音乐会员后可以手动切歌";
  const showLyrics = options.showLyrics !== false;
  const currentMusic = lyricsDisplayTrack(assetTrack(vm.music), showLyrics);
  const playlist = (vm.music.playlist ?? []).map((track) => lyricsDisplayTrack(assetTrack(track), showLyrics));
  const coverSource = currentMusic.coverSource || SHOP_ITEM_ICONS.music_membership;
  const dockClass = ["music-dock", variant ? `${variant}-music-dock` : ""].filter(Boolean).join(" ");
  const canSwitchMusic = !musicLocked && playlist.length > 1;
  const musicCrossOrigin = currentMusic.src?.startsWith(R2_ASSET_BASE_URL) ? ' crossorigin="anonymous"' : "";
  return `
    <div class="${dockClass}" aria-label="校园电台">
      <div class="track-card">
        <span class="album-disc" aria-hidden="true" data-track-cover data-track-cover-src="${escapeHtml(coverSource)}">
          ${renderUiIcon(coverSource)}
        </span>
        <span class="track-copy">
          <strong data-track-title>${escapeHtml(currentMusic.title)}</strong>
          <span data-track-meta>${escapeHtml(currentMusic.artist)} · ${escapeHtml(currentMusic.kind)}</span>
        </span>
        <span class="music-station">校园电台</span>
        <span class="music-timeline">
          <input class="music-progress" type="range" min="0" max="1000" value="0" data-music-progress aria-label="歌曲进度" />
          ${canSwitchMusic ? `
            <button class="music-skip-button is-prev" type="button" data-command="music-prev" aria-label="上一首" title="上一首">
              <span class="music-skip-icon" aria-hidden="true"></span>
            </button>
          ` : ""}
          <button class="music-toggle-button" type="button" data-command="music-toggle" data-music-toggle aria-label="暂停音乐" title="暂停音乐">
            <span class="music-toggle-icon" aria-hidden="true"></span>
          </button>
          ${canSwitchMusic ? `
            <button class="music-skip-button is-next" type="button" data-command="music-next" aria-label="下一首" title="下一首">
              <span class="music-skip-icon" aria-hidden="true"></span>
            </button>
          ` : ""}
        </span>
        <span class="music-time" data-music-time>0:00 / --:--</span>
      </div>
      <audio data-audio-player data-playlist-id="${escapeHtml(currentMusic.playlistId)}" data-track-id="${escapeHtml(currentMusic.id)}" data-track-src="${escapeHtml(currentMusic.src)}" data-track-duration="${escapeHtml(String(currentMusic.duration ?? ""))}" data-track-volume="${escapeHtml(String(currentMusic.volume ?? 1))}" data-lyrics-src="${escapeHtml(currentMusic.lyricsSrc)}" data-allows-lyrics="${currentMusic.allowsLyrics ? "true" : "false"}" data-music-locked="${musicLocked ? "true" : "false"}" data-music-lock-reason="${escapeHtml(lockText)}" data-playlist="${escapeHtml(JSON.stringify(playlist))}" preload="auto"${musicCrossOrigin} playsinline ${currentMusic.loop ? "loop" : ""}></audio>
      ${showLyrics ? `<p class="lyric-line is-hidden" data-current-lyric></p>` : ""}
      <p class="music-status" data-music-status hidden>${escapeHtml(musicLocked ? lockText : "正在检查音乐资源")}</p>
    </div>
  `;
}

function lyricsDisplayTrack(track, showLyrics) {
  if (showLyrics || !track || typeof track !== "object") return track;
  return {
    ...track,
    lyricsSrc: "",
    allowsLyrics: false,
  };
}

function renderStartForm({ error = "", draft = null } = {}) {
  const nicknameErrorId = "start-profile-name-error";
  const nicknameValue = escapeHtml(String(draft?.nickname ?? ""));
  const universityValue = escapeHtml(String(draft?.universityName ?? ""));
  const errorText = String(error ?? "");
  return `
    <form class="profile-form" data-form="start">
      <label class="field">
        <span>你的名字</span>
        <span class="field-control">
          <span class="field-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.avatar, "你的名字")}</span>
          <input name="nickname" required maxlength="18" autocomplete="nickname" value="${nicknameValue}" ${errorText ? `aria-invalid="true" aria-describedby="${nicknameErrorId}"` : ""} />
        </span>
      </label>
      <p class="profile-form-error" id="${nicknameErrorId}" data-start-profile-error role="alert" ${errorText ? "" : "hidden"}>${escapeHtml(errorText)}</p>
      <label class="field">
        <span>大学名字</span>
        <span class="field-control">
          <span class="field-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.university, "大学名字")}</span>
          <input name="universityName" required maxlength="24" value="${universityValue}" />
        </span>
      </label>
      <div class="start-actions">
        <button class="pixel-button" type="submit" data-command="start-game">进入角色抽取</button>
        <button class="pixel-button is-primary" type="button" data-command="close-start-form">返回开始界面</button>
      </div>
    </form>
  `;
}

function renderCharacterSelect(vm, uiDialog, theme = "light", language = DEFAULT_UI_LANGUAGE) {
  return `
    <main class="character-shell character-draw-shell">
      <header class="character-header">
        <div>
          <p class="kicker" aria-hidden="true"></p>
          <h1>${escapeHtml(vm.title)}</h1>
        </div>
        <div class="topbar-actions">
          <button class="pixel-button" type="button" data-command="reroll" ${vm.canReroll ? "" : "disabled"}>重抽角色 ${vm.rerollsRemaining}</button>
          <button class="pixel-button" type="button" data-command="new-game">返回开局</button>
        </div>
      </header>
      <section class="character-draw-stage" aria-label="角色抽取">
        <input class="character-card-toggle" id="character-card-reveal" type="checkbox" />
        <div class="character-draw-deck" aria-live="polite">
          <div class="character-draw-cinematic" aria-hidden="true">
            <span class="draw-cinematic-ghost draw-ghost-left">ARCH</span>
            <span class="draw-cinematic-ghost draw-ghost-right">CARD</span>
            <span class="draw-cinematic-ring"></span>
            <span class="draw-cinematic-light draw-light-a"></span>
            <span class="draw-cinematic-light draw-light-b"></span>
            <span class="draw-cinematic-pack">
              <img class="character-card-back-art" src="${assetSrc(ROLE_CARD_BACK_IMAGE)}" alt="" aria-hidden="true" />
              <i></i>
              <b>建筑生角色卡</b>
            </span>
            <span class="draw-cinematic-card draw-card-a"></span>
            <span class="draw-cinematic-card draw-card-b"></span>
            <span class="draw-cinematic-flash"></span>
          </div>
          <label class="character-card-back" for="character-card-reveal" aria-label="抽取角色卡">
            <img class="character-card-back-art" src="${assetSrc(ROLE_CARD_BACK_IMAGE)}" alt="" aria-hidden="true" />
            <strong>建筑生角色卡</strong>
          </label>
          ${vm.characterCandidates.slice(0, 1).map((character, index) => renderCharacterCard(character, index)).join("")}
        </div>
      </section>
      ${renderMusicDock(vm)}
      ${renderUiDialog(uiDialog, vm, theme, language)}
    </main>
  `;
}

function renderMentorSelect(vm, uiDialog, theme = "light", language = DEFAULT_UI_LANGUAGE) {
  const interaction = vm.pendingInteraction;
  const options = interaction?.options ?? [];
  const isFirstMentorYear = Number(vm?.systems?.route?.year ?? 1) <= 1;
  const mentorSubtitle = `${isFirstMentorYear ? "军训结束后，" : ""}选择 1 位导师作为本学年的导师。导师会发布本学期阶段任务。`;
  return `
    <main class="character-shell mentor-select-shell">
      <header class="character-header">
        <div>
          <p class="kicker" aria-hidden="true"></p>
          <h1>${escapeHtml(interaction?.title || "选择导师")}</h1>
          <p class="character-subtitle">${escapeHtml(mentorSubtitle)}</p>
        </div>
        <div class="topbar-actions mentor-select-actions">
          <button class="pixel-button" type="button" data-command="toggle-theme">${theme === "dark" ? "浅色模式" : "深色模式"}</button>
          <button class="pixel-button" type="button" data-command="new-game">返回开局</button>
        </div>
      </header>
      <section class="character-grid mentor-grid">
        ${options.map(renderMentorSelectCard).join("")}
      </section>
      ${renderMusicDock(vm)}
      ${renderUiDialog(uiDialog, vm, theme, language)}
    </main>
  `;
}

function renderMentorSelectCard(option) {
  const mentor = MENTORS.find((item) => item.id === option.id);
  const labelParts = String(option.label ?? "").split(/[：:]/u);
  const mentorName = mentor?.name ?? labelParts[0] ?? "导师";
  const mentorTitle = mentor?.title || labelParts.slice(1).join("：") || "设计导师";
  const mentorIntro = mentorSelectIntro(option.id, mentor?.intro ?? option.body ?? "");
  const taskName = mentor?.task?.name ?? "阶段任务";
  const taskCondition = mentor?.task?.conditionText ?? "选择后显示本学年阶段任务。";
  const taskDetail = mentor?.task?.detailText ?? taskCondition;
  const taskIcon = MENTOR_STAGE_TASK_ICONS[option.id];
  return `
    <article class="character-card mentor-select-card">
      <div class="character-card-head mentor-select-head">
        <div class="mentor-select-portrait">
          <span class="character-avatar mentor-select-avatar" aria-hidden="true">${renderUiIcon(MENTOR_AVATAR_ICONS[option.id], mentorName)}</span>
        </div>
        <div class="mentor-select-copy">
          <span>${escapeHtml(mentorTitle)}</span>
          <h2>${escapeHtml(mentorName)}</h2>
          <p>${escapeHtml(mentorIntro)}</p>
        </div>
      </div>
      <div class="mentor-select-task">
        ${renderCharacterTrait("skill", "阶段任务", `${taskName}：${taskDetail}`, taskIcon)}
      </div>
      <button class="pixel-button is-primary" type="button" data-command="modal-option" data-modal-type="mentor_select" data-id="${escapeHtml(option.id)}">选择这位导师</button>
    </article>
  `;
}

function mentorSelectIntro(mentorId, intro) {
  const text = String(intro ?? "");
  return mentorId === "mentor_zhou" ? text.replace(/[\r\n]+/gu, "") : text;
}

function summarizeMentorIntro(intro) {
  const text = String(intro || "").trim();
  if (!text) return "";
  const sentences = text.match(/[^。！？!?]+[。！？!?]?/gu) ?? [text];
  return sentences[0]?.trim() || text;
}

function renderCharacterCard(character, index = 0) {
  return `
    <article class="character-card character-draw-card" style="--draw-index:${index}">
      <div class="character-card-head">
        <span class="character-avatar" aria-hidden="true">${renderUiIcon(CHARACTER_AVATAR_ICONS[character.id], character.name)}</span>
        <div>
        <span class="character-origin-line">${escapeHtml(character.education)} · ${escapeHtml(character.family)}</span>
        <h2>${escapeHtml(characterCardTitle(character))}</h2>
        <p>${renderOptionBodyText(character.intro)}</p>
        </div>
      </div>
      <dl class="mini-attrs">
        ${Object.entries(character.attributes).map(([key, value], index) => {
          const numericValue = Math.max(0, Math.min(100, Number(value) || 0));
          return `
          <div class="character-attr" style="--attr-fill:${numericValue}%; --attr-delay:${240 + index * 150}ms">
            <dt><span class="character-attr-label"><span class="character-attr-icon" aria-hidden="true">${renderUiIcon(ATTRIBUTE_ICONS[key], ATTRIBUTE_LABELS[key])}</span><span>${ATTRIBUTE_LABELS[key]}</span></span></dt>
            <dd>
              <span class="character-attr-track" aria-hidden="true"><span></span></span>
              <strong>${value}</strong>
            </dd>
          </div>
        `;
        }).join("")}
      </dl>
      <div class="trait-block">
        ${renderCharacterTrait("passive", "被动属性", character.passive)}
        ${renderCharacterTrait("skill", "专属技能", character.skill, CHARACTER_SKILL_ICONS[character.id] ?? ACTION_ICONS.special_skill)}
      </div>
      <button class="pixel-button is-primary" type="button" data-command="select-character" data-id="${character.id}">选择这个角色</button>
    </article>
  `;
}

function characterCardTitle(character) {
  const level = character.cardLevel || "B";
  return `${level}级卡：${character.name}`;
}

function renderCharacterTrait(type, label, text, icon) {
  const { title, body } = splitTraitText(text, label);
  const heading = `${label}：${title}`;
  return `
    <article class="character-trait-card is-${type} ${icon ? "has-icon" : "no-icon"}">
      ${icon ? `<span class="trait-icon" aria-hidden="true">${renderUiIcon(icon, label)}</span>` : ""}
      <span class="character-trait-copy">
        <em>${escapeHtml(heading)}</em>
        <span>${escapeHtml(body)}</span>
      </span>
    </article>
  `;
}

function splitTraitText(text, fallbackTitle) {
  const value = String(text ?? "");
  const index = value.search(/[：:]/u);
  if (index < 0) return { title: fallbackTitle, body: value };
  return {
    title: value.slice(0, index).trim() || fallbackTitle,
    body: value.slice(index + 1).trim(),
  };
}

function renderRisk(vm) {
  if (vm.risk.messages.length === 0) return "";
  return `
    <section class="risk-banner" role="status">
      <span class="risk-banner-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.risk_alert, "高危提醒")}</span>
      <div>
        ${vm.risk.messages.map((message) => `<p>${escapeHtml(message)}</p>`).join("")}
      </div>
    </section>
  `;
}

function renderRiskSlot(vm) {
  const risk = renderRisk(vm);
  if (!risk) return "";
  return `<div class="log-risk-slot">${risk}</div>`;
}

function renderMeter(meter) {
  const percent = Math.round(meter.ratio * 100);
  const valueText = `${meter.value} / ${meter.max}`;
  return `
    <div class="meter-card meter-${meter.id}">
      <div class="meter-head">
        <span class="meter-icon meter-icon-${escapeHtml(meter.id)}" aria-hidden="true">${renderUiIcon(meterIconPath(meter), meter.label)}</span>
        <span>${escapeHtml(meter.label)}</span>
        <strong>${escapeHtml(valueText)}</strong>
      </div>
      <div class="meter-track">
        <span style="inline-size:${percent}%"></span>
      </div>
    </div>
  `;
}

function renderMetric(metric) {
  return `
    <div class="metric-card">
      <span>${escapeHtml(metric.label)}</span>
      <strong>${escapeHtml(String(metric.value))}</strong>
    </div>
  `;
}

function renderBalance(money) {
  if (!money) return "";
  return `
    <div class="balance-card ${money.highRisk ? "is-risk" : ""}">
      <span>${escapeHtml(money.label)}</span>
      <strong>¥${escapeHtml(String(money.value))}</strong>
      <em>每周 -${escapeHtml(String(money.weeklyCost))}</em>
    </div>
  `;
}

function renderStatusConsole(vm) {
  return `
    <section class="status-console" aria-label="状态">
      ${(vm.statusTiles ?? []).map(renderStatusTile).join("")}
      ${vm.specialSkillAction ? renderActionButton(vm.specialSkillAction, vm.profile.characterId, "status-special-skill") : ""}
    </section>
  `;
}

function renderStatusTile(tile) {
  if (tile.kind === "meter") {
    return renderStatusMeter(tile);
  }
  return renderStatusPlain(tile);
}

function renderStatusMeter({ id, label, value, max, ratio, tone = "" }) {
  const percent = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  const icon = meterIconPath({ id, max, ratio, tone });
  return `
    <div class="status-tile status-${escapeHtml(id)} ${tone ? `is-${tone}` : ""}">
      <span class="status-icon status-icon-${escapeHtml(id)}" aria-hidden="true">${renderUiIcon(icon, label)}</span>
      <div class="status-copy">
        <span>${escapeHtml(label)}</span>
        <div class="meter-track"><span style="inline-size:${percent}%"></span></div>
      </div>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderStatusPlain({ id, label, value, detail = "", tone = "" }) {
  return `
    <div class="status-tile status-${escapeHtml(id)} ${tone ? `is-${tone}` : ""}">
      <span class="status-icon status-icon-${escapeHtml(id)}" aria-hidden="true">${renderUiIcon(METER_ICONS[id], label)}</span>
      <div class="status-copy">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}${detail ? `<em>${escapeHtml(detail)}</em>` : ""}</strong>
      </div>
    </div>
  `;
}

function renderAttribute(attribute) {
  return `
    <div class="attribute-row">
      <span class="attribute-label">${renderUiIcon(ATTRIBUTE_ICONS[attribute.id], attribute.label)}${escapeHtml(attribute.label)}</span>
      <div><span style="inline-size:${attribute.value}%"></span></div>
      <strong>${attribute.value}</strong>
    </div>
  `;
}

function meterIconPath(meter) {
  if (meter?.id === "energy" && (meter?.tone === "risk" || Number(meter.value) < 30)) {
    return METER_ICONS.energyRisk;
  }
  if (meter?.id === "pressure" && (meter?.tone === "risk" || Number(meter.value) > 80)) {
    return METER_ICONS.pressureRisk;
  }
  if (meter?.id === "energy" && Number(meter.max) > 100) {
    return METER_ICONS.maxEnergy;
  }
  return METER_ICONS[meter?.id];
}

function renderActions(vm) {
  const actionCount = vm.actions.reduce((count, group) => count + group.actions.length, 0);
  return `
    <section class="action-section">
      <div class="section-head compact">
        <h2>本周行动</h2>
        <span>${vm.calendar.actionsRemaining} / ${vm.calendar.actionsPerWeek}</span>
      </div>
      <div class="action-groups">
        <div class="action-grid action-grid-flat" style="--action-count:${actionCount}">
          ${vm.actions.flatMap((group) => group.actions).map((action) => renderActionButton(action, vm.profile.characterId)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderActionButton(action, characterId = "", extraClass = "") {
  const disabled = action.state !== "available" && !action.canInspect;
  const reason = disabled ? action.reason : "";
  const isRiskDisabled = disabled && /高危/.test(reason);
  const isWeeklyLimitDisabled = disabled
    && reason === "本周次数已达上限"
    && (action.id === "outsourcing" || action.id === "part_time");
  const isSpecialSkill = action.id === "special_skill";
  const isStatusSpecialSkill = isSpecialSkill && /\bstatus-special-skill\b/.test(extraClass);
  const isSpecialCooldown = isSpecialSkill && /冷却中/.test(reason);
  const displayReason = isRiskDisabled || isSpecialCooldown || /当前弹窗/.test(reason) ? "" : reason;
  const icon = action.id === "special_skill"
    ? CHARACTER_SKILL_ICONS[characterId] ?? ACTION_ICONS.special_skill
    : ACTION_ICONS[action.id];
  const hasSideLock = isRiskDisabled || isWeeklyLimitDisabled || isSpecialCooldown;
  const lockLabel = isSpecialCooldown ? "冷却中" : "";
  const lockIcon = hasSideLock ? renderUiIcon(UI_ICON_PATHS.risk_lock, lockLabel || "行动禁用") : "";
  const hoverDelta = renderInlineDeltaText(action.delta, "action-hover-delta");
  const previewText = actionPreviewText(action, { isRiskDisabled });
  const hoverDetail = isStatusSpecialSkill
    ? hoverDelta || (previewText ? `<span class="action-hover-preview">${renderOptionBodyText(previewText)}</span>` : "")
    : hoverDelta;
  const hasHoverDetail = Boolean(hoverDetail);
  const defaultDetail = isStatusSpecialSkill ? "" : isWeeklyLimitDisabled ? `
        <span class="action-detail action-default-detail">
          <span class="action-reason">${escapeHtml(reason)}</span>
        </span>` : `
        <span class="action-detail action-default-detail">
          ${displayReason ? `<span class="action-reason">${escapeHtml(displayReason)}</span>` : ""}
          ${action.warning ? `<span class="action-warning">${escapeHtml(action.warning)}</span>` : ""}
          ${previewText ? `<span>${renderOptionBodyText(previewText)}</span>` : renderDeltaChips(action.delta, "action-delta")}
        </span>`;
  const ariaLabel = [action.label, isSpecialCooldown ? "冷却中" : displayReason].filter(Boolean).join("：");
  return `
    <button class="action-button action-${action.state} action-id-${escapeHtml(action.id)} ${isRiskDisabled ? "has-risk-lock" : ""} ${hasSideLock ? "has-side-lock" : ""} ${isSpecialCooldown ? "has-cooldown-lock" : ""} ${hasHoverDetail ? "has-hover-detail" : ""} ${hoverDelta ? "has-hover-delta" : ""} ${escapeHtml(extraClass)}" type="button" data-command="perform-action" data-id="${action.id}" aria-label="${escapeHtml(ariaLabel || action.label)}" ${disabled ? "disabled" : ""}>
      <span class="action-icon action-icon-${escapeHtml(action.id)}" aria-hidden="true">${renderUiIcon(icon)}</span>
      <span class="action-copy">
        <strong>${escapeHtml(action.label)}</strong>
        ${defaultDetail}
        ${hoverDetail ? `<span class="action-detail action-hover-detail">${hoverDetail}</span>` : ""}
      </span>
      ${lockIcon ? `<span class="action-lock-icon" aria-hidden="true">${lockIcon}${lockLabel ? `<small>${escapeHtml(lockLabel)}</small>` : ""}</span>` : ""}
    </button>
  `;
}

function actionPreviewText(action, { isRiskDisabled = false } = {}) {
  const preview = String(action.preview ?? "");
  if (isRiskDisabled && action.id === "design_iteration") {
    return preview.replace("改到第八版，突然", "改到第八版，\n突然");
  }
  return preview;
}

function isEventLog(log) {
  const phase = String(log?.phase ?? "");
  const source = String(log?.source ?? "");
  return /event|summer|model_material|year_start/.test(phase)
    || /^fixed:|^event:|^summer:|^model_material:/.test(source);
}

function isAchievementLog(log) {
  const phase = String(log?.phase ?? "");
  const source = String(log?.source ?? "");
  return phase === "achievement" || source.startsWith("achievement:");
}

function isPurchaseLog(log) {
  const phase = String(log?.phase ?? "");
  const source = String(log?.source ?? "");
  return phase === "shop" || source.startsWith("shop:");
}

function recentLogItems(logs = []) {
  return logs.slice(-10).reverse();
}

function formatRealityDate(date, separator = ".") {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return [year, month, day].join(separator);
}

function renderLog(log) {
  const delta = formatDelta(log.delta);
  const isSettlement = String(log.phase ?? "").includes("settlement") || String(log.message ?? "").includes("结算");
  const sourceClass = log?.source ? logSourceClass(log.source) : "";
  const classes = [
    isSettlement ? "is-settlement-log" : "",
    sourceClass ? `log-source-${sourceClass}` : "",
  ].filter(Boolean);
  const className = classes.length ? ` class="${classes.join(" ")}"` : "";
  const message = sanitizeLogMessage(log);
  return `
    <li${className}>
      <span>第${log.week || 0}周 ${escapeHtml(logTypeLabel(log))}</span>
      <p>${escapeHtml(formatAcademicYearText(message))}</p>
      ${delta ? `<em>${escapeHtml(delta)}</em>` : ""}
    </li>
  `;
}

function logTypeLabel(log) {
  if (isAchievementLog(log)) return "成就";
  if (isPurchaseLog(log)) return "购买";
  return formatAcademicYearText(log.phase);
}

function logSourceClass(source) {
  return String(source).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function sanitizeLogMessage(log) {
  const message = String(log?.message ?? "");
  if (log?.source === "mentor_task") {
    return message.replace(/阶段任务「([^」]+)」：.+$/u, "阶段任务「$1」已发布");
  }
  return message;
}

function formatAcademicYearText(value) {
  const yearLabels = {
    1: "一",
    2: "二",
    3: "三",
    4: "四",
    5: "五",
  };
  return String(value ?? "").replace(/大([1-5])/g, (_, year) => `大${yearLabels[year] ?? year}`);
}

function renderReview(review) {
  return `
    <article class="review-item">
      <strong>${formatYearName(review.year)}${review.term === 1 ? "上" : "下"} · ${review.finalGrade}</strong>
      <p>作品分 ${review.finalScore}，GPA ${review.semesterGpa.toFixed(2)}，作品集 +${review.portfolioAdded}</p>
    </article>
  `;
}

function formatYearName(year) {
  const labels = ["零", "一", "二", "三", "四", "五"];
  const normalized = Number(year);
  return `大${labels[normalized] ?? normalized}`;
}

function renderAchievementToasts(toasts = []) {
  if (!toasts.length) return "";
  return `
    <div class="achievement-toasts" aria-live="polite" aria-atomic="false">
      ${toasts.map((toast, index) => {
        const toastClass = ["achievement-toast", toast.kind ? `toast-kind-${toast.kind}` : ""].filter(Boolean).join(" ");
        return `
        <article class="${toastClass}" role="status" data-achievement-id="${escapeHtml(toast.id ?? "")}" data-achievement-shown-at="${escapeHtml(String(toast.shownAt ?? ""))}"${achievementToastStyle(toast, index)} aria-label="${escapeHtml(toast.prefix ?? "成就达成！")}${escapeHtml(toast.title)}，${escapeHtml(toast.body)}，获得 ${escapeHtml(String(toast.score ?? 0))} 分">
          <div class="achievement-toast-icon" aria-hidden="true">${renderUiIcon(toast.icon || UI_ICON_PATHS.achievements, toast.title)}</div>
          <div class="achievement-toast-copy">
            <strong><span>${escapeHtml(toast.prefix ?? "成就达成！")}</span><b>【${escapeHtml(toast.title)}】</b></strong>
            <p>${escapeHtml(toast.body)}</p>
          </div>
          <em aria-label="获得 ${escapeHtml(String(toast.score ?? 0))} 分">+${escapeHtml(String(toast.score ?? 0))}</em>
        </article>
      `;
      }).join("")}
    </div>
  `;
}

function achievementToastStyle(toast, index = 0) {
  const slot = Number.isInteger(Number(toast?.slot)) && Number(toast.slot) >= 0 ? Number(toast.slot) : index;
  const styles = [`--achievement-toast-index:${slot}`];
  styles.push(`--achievement-toast-width:${achievementToastWidth(toast)}px`);
  if (toast?.kind === "ending") {
    const titleLength = Array.from(String(toast.title ?? "")).length;
    const width = Math.round(Math.min(760, Math.max(438, 390 + titleLength * 20)) * 0.9);
    styles.push(`--ending-toast-width:${width}px`);
  }
  return ` style="${styles.join(";")}"`;
}

function achievementToastWidth(toast) {
  const titleLength = Array.from(`${toast?.prefix ?? "成就达成！"}${toast?.title ?? ""}`).length;
  const bodyLength = Array.from(String(toast?.body ?? "")).length;
  return Math.round(Math.min(860, Math.max(438, 248 + Math.max(titleLength * 16, bodyLength * 14))));
}

export function renderModal(interaction) {
  if (!interaction) return "";
  const isOpeningFixedEvent = interaction.type === "fixed_event"
    && ["opening_ceremony", "military_training", "architecture_life_start"].includes(interaction.eventId);
  const isGraduationFlowCard = ["graduation_ceremony", "ending_memory"].includes(interaction.type);
  const isGraduationDefenseCard = interaction.type === "report_strategy" && interaction.image?.alt === "毕业答辩";
  const isRouteWaitingResult = interaction.type === "choice_result" && interaction.title === "等待结果";
  const isRouteApplyCard = (interaction.type === "route_commit" && ["确认报考", "申请保研", "留学申请"].includes(interaction.title))
    || interaction.type === "route_exam_intro";
  const isRouteFlowCard = ["route_commit", "route_contract", "route_exam_intro", "route_question", "route_exam_result"].includes(interaction.type)
    || isRouteWaitingResult;
  const modalClass = [
    "modal-card",
    `modal-${interaction.type}`,
    ["fixed_event", "random_event", "summer_event", "wanli_road_event"].includes(interaction.type) || interaction.image || isRouteFlowCard ? "event-card" : "",
    isRouteFlowCard ? "route-flow-card" : "",
    isRouteApplyCard ? "route-apply-card" : "",
    interaction.type === "random_event" ? "random-event-card" : "",
    interaction.type === "wanli_road_event" ? "random-event-card wanli-road-event-card" : "",
    interaction.type === "random_event" && interaction.trigger ? `random-event-trigger-${interaction.trigger}` : "",
    interaction.type === "choice_result" ? "result-card" : "",
    interaction.type === "choice_result" && interaction.internshipResult ? "event-card random-event-card internship-application-result" : "",
    interaction.type === "choice_result" && isCompetitionResultInteraction(interaction) ? "competition-result-prompt" : "",
    interaction.type === "project_select" ? "project-select-card" : "",
    interaction.type === "project_select" && interaction.projectType ? `project-select-${interaction.projectType}` : "",
    interaction.type === "course_select" ? "course-select-card" : "",
    interaction.type === "summer_event" ? "summer-card" : "",
    yearStartModalClass(interaction),
    isOpeningFixedEvent ? "opening-fixed-card" : "",
    isOpeningFixedEvent ? `opening-fixed-${interaction.eventId}` : "",
    isGraduationFlowCard || isGraduationDefenseCard ? "graduation-flow-card" : "",
    isGraduationFlowCard ? `graduation-flow-${interaction.type}` : "",
    isGraduationDefenseCard ? "graduation-flow-defense" : "",
    interaction.type === "system_prompt" && interaction.title === "实习系统开放" ? "internship-open-prompt" : "",
    interaction.type === "system_prompt" && ["投稿提醒", "竞赛投稿提醒"].includes(interaction.title) ? "submission-reminder-prompt" : "",
    interaction.type === "system_prompt" && interaction.title === "恭喜你，作品集开始有了厚度" ? "portfolio-entry-prompt" : "",
    interaction.type === "system_prompt" && interaction.title === "温馨提醒" ? "graduation-design-reminder-prompt" : "",
    interaction.type === "system_prompt" && interaction.title === "你该走出专教了！" ? "event-card random-event-card wanli-road-open-prompt" : "",
    questionSpecificModalClass(interaction),
  ].filter(Boolean).join(" ");
  const hasModalDelta = Object.keys(interaction.delta ?? {}).length > 0;
  const deltaOnConfirm = interaction.type === "choice_result"
    && (interaction.showDeltaOnConfirm === true || hasModalDelta);
  const isInternshipRandomEvent = interaction.type === "random_event" && interaction.trigger === "internship";
  const showModalDelta = hasModalDelta && !deltaOnConfirm && !isInternshipRandomEvent;
  const graduationFlowStep = graduationFlowStepId(interaction);
  return `
    <div class="modal-backdrop modal-backdrop-${escapeHtml(interaction.type)}" role="presentation"${graduationFlowStep ? ` data-graduation-flow-step="${escapeHtml(graduationFlowStep)}"` : ""}>
      <section class="${modalClass}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        ${renderModalImage(interaction.image)}
        ${renderQuestionCountdown(interaction)}
        <div class="modal-copy">
          <p class="kicker">${escapeHtml(interaction.kicker ?? modalKicker(interaction))}</p>
          <h2 id="modal-title">${renderModalTitle(interaction)}</h2>
          ${renderModalBody(interaction.body, interaction)}
          ${showModalDelta ? renderDeltaChips(interaction.delta, "settlement-delta") : ""}
        </div>
        <div class="modal-options">
          ${interaction.options.map((option) => renderModalOption(interaction, option)).join("")}
        </div>
      </section>
    </div>
  `;
}

function graduationFlowStepId(interaction) {
  if (interaction?.type === "graduation_ceremony") return "graduation_ceremony";
  if (interaction?.type === "ending_memory" && ["first_photo", "second_photo"].includes(interaction.memoryStep)) {
    return `ending_memory:${interaction.memoryStep}`;
  }
  return "";
}

function renderQuestionCountdown(interaction) {
  if (!isQuestionInteraction(interaction)) return "";
  const seconds = questionCountdownSeconds(interaction);
  return `
        <aside class="question-countdown" data-question-countdown="true" data-question-countdown-seconds="${seconds}" data-question-countdown-key="${questionCountdownKey(interaction)}" aria-label="答题倒计时">
          <span class="question-countdown-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.game_clock, "倒计时")}</span>
          <strong data-question-countdown-value>${seconds}</strong>
        </aside>`;
}

function isQuestionInteraction(interaction) {
  return ["course_question", "ielts_question", "route_question"].includes(interaction?.type);
}

function questionCountdownSeconds(interaction) {
  if (interaction?.type === "ielts_question" || interaction?.type === "route_question") return 60;
  return 30;
}

function questionSpecificModalClass(interaction) {
  if (
    interaction?.type === "course_question"
    && String(interaction.body ?? "").trim() === "多个方案同时比较容积率、日照、风环境和视线质量时，最适合的方法是："
  ) {
    return "course-question-multi-metric-comparison";
  }
  if (
    interaction?.type === "route_question"
    && String(interaction.body ?? "").trim() === "某项目预算中材料费占 40%，人工费占 35%，其余为管理费。若总预算增加 20%，其中材料费不变、人工费增加 20%，则管理费需要增加："
  ) {
    return "route-question-budget-management";
  }
  if (
    interaction?.type === "route_question"
    && String(interaction.body ?? "").trim() === "某部门 5 人排班，[[br]]甲不能排在第一天，乙必须排在甲之前，丙不能排在最后一天。[[br]]若每天 1 人值班，可能的排班数量为："
  ) {
    return "route-question-duty-schedule";
  }
  if (
    interaction?.type === "route_question"
    && String(interaction.body ?? "").trim() === "“公共政策的可接受性不只取决于目标正当，还取决于成本分担是否被看见。”\n这句话隐含的主要观点是："
  ) {
    return "route-question-public-policy";
  }
  return "";
}

function questionCountdownKey(interaction) {
  const text = `${interaction?.type ?? ""}|${interaction?.title ?? ""}|${interaction?.body ?? ""}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function yearStartModalClass(interaction) {
  if (interaction.type !== "year_start") return "";
  return {
    "专教生活": "year-start-2",
    "大学倒计时": "year-start-3",
    "人生的十字路口": "year-start-4",
    "画了五年，该交图了！": "year-start-5",
  }[interaction.title] ?? "";
}

function renderModalTitle(interaction) {
  if (interaction.type === "review_result") {
    const grade = String(interaction.grade ?? String(interaction.title ?? "").match(/评图等级\s*([SABCDF])/u)?.[1] ?? "").toUpperCase();
    const prefixPattern = new RegExp(`^评图等级\\s*${grade}[：:]\\s*`, "u");
    const titleText = String(interaction.title ?? "").replace(prefixPattern, "").trim();
    return `<span class="modal-title-icon" aria-hidden="true">${renderUiIcon(reviewResultIconPath(grade))}</span><span class="review-grade ${reviewGradeClass(grade)}">评图等级 ${escapeHtml(grade)}:</span><span>${escapeHtml(titleText)}</span>`;
  }
  const title = `<span>${escapeHtml(interaction.title)}</span>`;
  const icon = modalTitleIcon(interaction);
  if (!icon) return title;
  return `<span class="modal-title-icon" aria-hidden="true">${renderUiIcon(icon)}</span>${title}`;
}

function modalTitleIcon(interaction) {
  if (interaction.titleIcon && UI_ICON_PATHS[interaction.titleIcon]) {
    return UI_ICON_PATHS[interaction.titleIcon];
  }
  if (interaction.type === "choice_result" && SHOP_ITEM_ICONS[interaction.shopItemId]) {
    return SHOP_ITEM_ICONS[interaction.shopItemId];
  }
  if (interaction.type === "year_start") {
    const titleIconByPrompt = {
      "专教生活": UI_ICON_PATHS.year_2_prompt,
      "大学倒计时": UI_ICON_PATHS.year_3_prompt,
      "人生的十字路口": UI_ICON_PATHS.year_4_prompt,
      "画了五年，该交图了！": UI_ICON_PATHS.year_5_prompt,
    };
    if (titleIconByPrompt[interaction.title]) return titleIconByPrompt[interaction.title];
    const yearMatch = String(interaction.title ?? "").match(/大([二三四五])/u);
    return {
      "二": UI_ICON_PATHS.year_2_prompt,
      "三": UI_ICON_PATHS.year_3_prompt,
      "四": UI_ICON_PATHS.year_4_prompt,
      "五": UI_ICON_PATHS.year_5_prompt,
    }[yearMatch?.[1]] ?? "";
  }
  if (interaction.type === "ielts_exam_result") {
    return UI_ICON_PATHS.report_success_check;
  }
  if (interaction.type === "course_result") {
    return UI_ICON_PATHS.course_result;
  }
  if (interaction.type === "course_question" || interaction.type === "ielts_question") {
    return UI_ICON_PATHS.course_question;
  }
  if (interaction.type === "ielts_exam_intro") {
    return UI_ICON_PATHS.ielts;
  }
  if (interaction.type === "course_exam_intro") {
    return UI_ICON_PATHS.course_exam_intro;
  }
  if (interaction.type === "route_exam_intro" && ["考研笔试", "保研笔试"].includes(interaction.title)) {
    return UI_ICON_PATHS.postgrad_written_exam;
  }
  if (interaction.type === "route_exam_intro" && interaction.title === "行测考试") {
    return UI_ICON_PATHS.route_civil_exam;
  }
  if (interaction.type === "route_question" && interaction.examType === "academic") {
    return UI_ICON_PATHS.postgrad_written_exam;
  }
  if (interaction.type === "route_question" && interaction.examType === "civil") {
    return UI_ICON_PATHS.route_civil_exam;
  }
  if (interaction.type === "route_commit" && interaction.title === "简历投递") {
    return UI_ICON_PATHS.resume_submit_confirm;
  }
  if (interaction.type === "route_commit" && ["确认报考", "申请保研", "留学申请"].includes(interaction.title)) {
    return UI_ICON_PATHS.route_commit;
  }
  if (interaction.type === "route_contract") {
    return UI_ICON_PATHS.route_contract;
  }
  if (interaction.type === "route_exam_result") {
    return UI_ICON_PATHS.route_waiting_result;
  }
  if (interaction.type === "choice_result" && interaction.title === "等待结果") {
    return UI_ICON_PATHS.route_waiting_result;
  }
  if (interaction.type === "choice_result" && String(interaction.title ?? "").startsWith("暑假写生")) {
    return UI_ICON_PATHS.summer_result;
  }
  if (interaction.type === "summer_event") {
    return UI_ICON_PATHS.summer_result;
  }
  if (interaction.type === "choice_result" && isCompetitionResultInteraction(interaction)) {
    return competitionAwardIconPath(interaction.award);
  }
  if (interaction.type === "choice_result" && interaction.internshipResult) {
    return internshipApplicationResultIconPath(interaction);
  }
  if (interaction.type === "report_feedback") {
    return interaction.title === "汇报成功" ? UI_ICON_PATHS.report_success_check : UI_ICON_PATHS.report_failure_cross;
  }
  if (interaction.type === "report_strategy") {
    return UI_ICON_PATHS.report_strategy_board;
  }
  if (interaction.type === "mentor_task_result") {
    return String(interaction.title ?? "").includes("成功")
      ? UI_ICON_PATHS.mentor_success_check
      : UI_ICON_PATHS.mentor_failure_warning;
  }
  if (interaction.type === "system_prompt" && interaction.title === "竞赛投稿提醒") {
    return UI_ICON_PATHS.competition_submission_reminder;
  }
  if (interaction.type === "system_prompt" && interaction.title === "实习系统开放") {
    return UI_ICON_PATHS.internship_open;
  }
  if (interaction.type === "system_prompt" && interaction.title === "恭喜你，作品集开始有了厚度") {
    return UI_ICON_PATHS.portfolio_entry;
  }
  if (interaction.type === "system_prompt" && interaction.title === "温馨提醒") {
    return UI_ICON_PATHS.graduation_design_reminder;
  }
  if (interaction.type !== "random_event") return "";
  if (interaction.trigger === "internship") {
    return internshipShortEventIconPath(interaction.eventId) || UI_ICON_PATHS.internship_work;
  }
  const eventIndex = RANDOM_EVENTS.findIndex((event) => event.id === interaction.eventId);
  if (eventIndex < 0) return UI_ICON_PATHS.event;
  const event = RANDOM_EVENTS[eventIndex];
  const eventNumber = RANDOM_EVENTS
    .slice(0, eventIndex + 1)
    .filter((item) => item.pool === event.pool).length;
  return randomEventIconPath(event, eventNumber);
}

function reviewResultIconPath(grade) {
  if (String(grade).toUpperCase() === "F") return UI_ICON_PATHS.failure_cross;
  return String(grade).toUpperCase() === "D"
    ? UI_ICON_PATHS.review_low_grade
    : UI_ICON_PATHS.review_high_grade;
}

function internshipApplicationResultIconPath(interaction) {
  if (interaction.internshipResult === "rejected") {
    return UI_ICON_PATHS.internship_result_rejected;
  }
  if (interaction.internshipResult === "completed" && interaction.internshipOptionId) {
    return routeOptionIconPath(interaction.internshipOptionId) || UI_ICON_PATHS.internship_work;
  }
  const icons = {
    ordinary: UI_ICON_PATHS.internship_result_ordinary,
    strong: UI_ICON_PATHS.internship_result_strong,
    named_firm: UI_ICON_PATHS.internship_result_named_firm,
  };
  return icons[interaction.internshipTier] ?? UI_ICON_PATHS.internship_apply;
}

function renderModalOption(interaction, option) {
  const disabled = option.state === "disabled";
  const optionHasOwnDelta = Object.prototype.hasOwnProperty.call(option, "delta");
  const optionDelta = option.delta ?? {};
  const interactionDelta = interaction.delta ?? {};
  const settlementDelta = optionHasOwnDelta ? optionDelta : interactionDelta;
  const hasSettlementDelta = Object.keys(settlementDelta).length > 0;
  const hasNumericValue = hasSettlementDelta || /[+-]\d|￥\s*\d/u.test(String(option.label ?? ""));
  const labelHasSettlementText = interaction.type === "choice_result"
    && option.id === "confirm"
    && /[+-]\d/.test(String(option.label ?? ""));
  const isSettlementConfirm = interaction.type === "choice_result"
    && option.id === "confirm"
    && (hasSettlementDelta || labelHasSettlementText);
  const isEventOption = ["fixed_event", "random_event", "summer_event", "wanli_road_event"].includes(interaction.type);
  const isInteractiveRandomEvent = interaction.type === "random_event"
    && interaction.options.some((item) => item.id !== "confirm");
  const showEventOptionDelta = ["random_event", "wanli_road_event"].includes(interaction.type) && !isInteractiveRandomEvent;
  const isInternshipRandomEvent = interaction.type === "random_event" && interaction.trigger === "internship";
  const optionDeltaText = showEventOptionDelta && !isInternshipRandomEvent ? renderInlineDeltaText(option.delta, "modal-option-delta-text") : "";
  const optionDeltaPlainText = showEventOptionDelta ? formatDelta(option.delta) : "";
  const labelIsDelta = Boolean(optionDeltaPlainText) && option.label === optionDeltaPlainText;
  const isProjectOption = interaction.type === "project_select" && option.id !== "__back";
  const isCourseOption = interaction.type === "course_select";
  const isModelMaterialOption = interaction.type === "model_material";
  const isReportStrategyOption = interaction.type === "report_strategy";
  const optionDisplayDelta = option.displayDelta ?? option.delta;
  const projectTitleIcon = isProjectOption
    ? `<span class="project-title-icon" aria-hidden="true">${renderUiIcon(projectIconPath(option.id, interaction.projectType), option.label)}</span>`
    : "";
  const projectSideIcon = isProjectOption
    ? `<span class="project-option-side-icon" aria-hidden="true">${renderUiIcon(projectIconPath(option.id, interaction.projectType), option.label)}</span>`
    : "";
  const courseTitleIcon = isCourseOption
    ? `<span class="course-option-title-icon" aria-hidden="true">${renderUiIcon(courseIconPath(option.id), option.label)}</span>`
    : "";
  const courseSideIcon = isCourseOption
    ? `<span class="course-option-side-icon" aria-hidden="true">${renderUiIcon(courseIconPath(option.id), option.label)}</span>`
    : "";
  const modelMaterialSideIcon = isModelMaterialOption
    ? `<span class="model-material-option-side-icon" aria-hidden="true">${renderUiIcon(modelMaterialIconPath(option.id), option.label)}</span>`
    : "";
  const reportStrategySideIcon = isReportStrategyOption
    ? `<span class="report-strategy-option-side-icon" aria-hidden="true">${renderUiIcon(reportStrategyIconPath(option.id), option.label)}</span>`
    : "";
  const showBody = !["fixed_event", "random_event", "summer_event", "wanli_road_event"].includes(interaction.type);
  const showDelta = !["fixed_event", "random_event", "summer_event", "wanli_road_event"].includes(interaction.type) && !isSettlementConfirm;
  const optionClass = [
    "modal-option",
    `option-${option.state}`,
    isEventOption ? "event-option" : "",
    isSettlementConfirm ? "settlement-confirm-option" : "",
    isProjectOption ? "project-select-option" : "",
    isCourseOption ? "course-select-option" : "",
    isModelMaterialOption ? "model-material-option" : "",
    isReportStrategyOption ? "report-strategy-option" : "",
    isReportStrategyOption ? `report-strategy-${option.id}` : "",
    hasNumericValue ? "has-numeric-value" : "",
  ].filter(Boolean).join(" ");
  const optionBody = renderModalOptionBody(interaction, option, showBody);
  const commandKey = modalCommandKey(interaction);
  return `
    <button class="${optionClass}" type="button" data-command="modal-option" data-modal-type="${escapeHtml(interaction.type)}" data-modal-key="${escapeHtml(commandKey)}" data-id="${option.id}" ${disabled ? "disabled" : ""}>
      ${renderModalOptionImage(option.image)}
      ${projectSideIcon}
      ${courseSideIcon}
      ${modelMaterialSideIcon}
      ${reportStrategySideIcon}
      <strong>${isProjectOption ? "" : projectTitleIcon}${isCourseOption ? "" : courseTitleIcon}${modalOptionLabel(interaction, option, {
        isSettlementConfirm,
        isEventOption,
        isInternshipRandomEvent,
        labelIsDelta,
        settlementDelta,
      })}</strong>
      ${optionBody}
      ${isEventOption && optionDeltaText && !labelIsDelta ? optionDeltaText : ""}
      ${showDelta ? renderDeltaChips(optionDisplayDelta, "modal-delta") : ""}
      ${option.warning ? `<em class="modal-warning" role="alert">${escapeHtml(option.warning)}</em>` : ""}
      ${disabled && option.reason && !isReportStrategyOption ? `<em>${escapeHtml(option.reason)}</em>` : ""}
      ${isProjectOption && option.requirementText ? `<span class="project-requirement-note">能力门槛：${escapeHtml(option.requirementText)}</span>` : ""}
    </button>
  `;
}

function renderModalOptionBody(interaction, option, showBody) {
  if (!showBody || !option.body) return "";
  if (interaction.type !== "report_strategy") return `<span>${renderOptionBodyText(option.body)}</span>`;
  return `<span class="report-strategy-copy">${reportStrategyBodyRows(option.body)
    .map(({ heading, detail }) => `<b class="report-strategy-heading">${escapeHtml(`${heading}：`)}</b><span class="report-strategy-detail">${renderOptionBodyText(detail)}</span>`)
    .join("")}</span>`;
}

function reportStrategyBodyRows(body) {
  const rows = [];
  for (const rawLine of String(body ?? "").replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^(简介|门槛|概率|成功|失败)：(.*)$/u);
    if (match) {
      rows.push({ heading: match[1], detail: match[2].trim() });
    } else if (rows.length) {
      rows[rows.length - 1].detail = `${rows[rows.length - 1].detail}\n${line}`.trim();
    } else {
      rows.push({ heading: "", detail: line });
    }
  }
  return rows;
}

function isCompetitionResultInteraction(interaction) {
  return interaction?.type === "choice_result" && String(interaction.title ?? "").startsWith("竞赛结果");
}

function renderOptionBodyText(body) {
  return String(body ?? "")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join("<br />");
}

function modalOptionLabel(interaction, option, flags) {
  if (flags.isSettlementConfirm) {
    return renderSettlementConfirmLabel(flags.settlementDelta, option.label);
  }
  if (flags.isInternshipRandomEvent) {
    return renderSettlementConfirmTextLabel(option.label);
  }
  if (flags.isEventOption && flags.labelIsDelta) {
    return renderInlineDeltaText(option.delta, "modal-option-delta-text");
  }
  if (isCompetitionResultInteraction(interaction) && option.id === "confirm") {
    return renderCompetitionResultConfirmLabel(option.label);
  }
  return renderOptionBodyText(option.label);
}

function renderCompetitionResultConfirmLabel(label) {
  const source = String(label ?? "");
  const match = source.match(/\d+(?:\.\d+)?¥/u);
  if (!match || match.index === undefined) return renderOptionBodyText(source);
  const before = source.slice(0, match.index);
  const amount = match[0];
  const after = source.slice(match.index + amount.length);
  return `${escapeHtml(before)}<b class="competition-prize-amount">${escapeHtml(amount)}</b>${escapeHtml(after)}`;
}

function renderModalBody(body, interaction = null) {
  const paragraphs = String(body ?? "")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return "";
  return paragraphs.map((paragraph) => `<p>${renderModalBodyParagraph(paragraph, interaction)}</p>`).join("");
}

const INLINE_MODAL_LINE_BREAK = "[[br]]";

function renderModalBodyParagraph(paragraph, interaction) {
  const displayLines = modalBodyDisplayLines(paragraph, interaction)
    .flatMap((line) =>
      String(line)
        .split(INLINE_MODAL_LINE_BREAK)
        .map((part) => part.trim())
        .filter(Boolean),
    );
  return mergeReviewResultSummaryLines(displayLines, interaction)
    .map((line) => renderModalBodyLine(line, interaction))
    .join("<br />");
}

function mergeReviewResultSummaryLines(lines, interaction) {
  if (interaction?.type !== "review_result") return lines;
  const merged = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = String(lines[index] ?? "").trim();
    if (line.startsWith("作品分：")) {
      const summaryParts = [line];
      while (
        index + 1 < lines.length
        && !String(lines[index + 1] ?? "").trim().startsWith("作品分：")
        && String(lines[index + 1] ?? "").trim().startsWith("本学期 GPA：")
      ) {
        index += 1;
        summaryParts.push(String(lines[index] ?? "").trim());
      }
      merged.push(summaryParts.join(""));
      continue;
    }
    merged.push(lines[index]);
  }
  return merged;
}

function renderModalBodyLine(line, interaction) {
  const escapedLine = escapeHtml(line);
  if (
    interaction?.type === "mentor_task_result"
    && interaction?.mentorTaskSucceeded === false
    && /阶段任务「[^」]+」未完成。$/u.test(String(line ?? "").trim())
  ) {
    return `<span class="mentor-task-failure-line">${escapedLine}</span>`;
  }
  if (
    interaction?.type === "mentor_task_result"
    && interaction?.mentorTaskSucceeded === true
    && /阶段任务「[^」]+」完成。$/u.test(String(line ?? "").trim())
  ) {
    return `<span class="mentor-task-success-line">${escapedLine}</span>`;
  }
  if (interaction?.type === "review_result" && String(line ?? "").trim().startsWith("作品分：")) {
    return `<span class="modal-body-nowrap">${escapedLine}</span>`;
  }
  if (modalNoWrapLines.has(String(line ?? "").trim())) {
    return `<span class="modal-body-nowrap">${escapedLine}</span>`;
  }
  if (interaction?.type === "ending_memory" && endingMemoryNoWrapLines.has(String(line ?? "").trim())) {
    return `<span class="ending-memory-nowrap">${escapedLine}</span>`;
  }
  if (interaction?.type !== "year_start" || interaction?.title !== "画了五年，该交图了！") {
    return escapedLine;
  }
  const protectedSegment = "考公考编选调、建筑就业和转行，每一条都通向一个不同的明天。";
  const escapedSegment = escapeHtml(protectedSegment);
  return escapedLine.replace(escapedSegment, `<span class="year-five-career-line">${escapedSegment}</span>`);
}

const endingMemoryNoWrapLines = new Set([
  "但你知道，你们共享过同一间教室的灯、同一卷硫酸纸的痕迹、同一把美工刀划破手指的疼。",
  "会记得今天的风、阳光、还有身边这些人的声音。",
  "身边的同学在自拍、在拥抱、在大喊“毕业了”，你也跟着笑了。",
  "你问自己：这五年，我到底变成了谁？没有答案。",
]);

const modalNoWrapLines = new Set([
  "逆风的方向，更适合飞翔，我不怕千万人阻挡，只怕自己投降！",
  "后现代主义建筑理论在很大程度上是对哪一倾向的反思？",
  "幕墙与主体结构连接节点设计时，除传力可靠外，还应重点满足：",
  "地下室防水设计中，防水等级提高时最先强化的通常是：",
  "在复杂地形场地的数字分析中，最基础的底层数据通常是：",
  "参数化设计中，几何对象能够随条件同步变化的核心在于建立：",
  "多个方案同时比较容积率、日照、风环境和视线质量时，最适合的方法是：",
  "如果数字分析图很复杂却无法反推设计决策，最大问题通常是：",
  "CAD 制图中分层管理墙体、轴网、尺寸和文字的主要目的是：",
  "对于重复出现且可能统一修改的构件，最合理的处理方式是：",
  "中国古典园林中“虽由人作，宛自天开”最能概括哪一核心审美追求？",
  "“乙会通过”“丙不会通过”“甲和乙至少一人不会通过”。",
  "“公共政策的可接受性不只取决于目标正当，还取决于成本分担是否被看见。”",
  "第一年投资 1000 万，第二年比第一年多 30%，第三年比第二年少 20%。",
  "此时 A、B、C 比为 3:3:6。",
]);

function modalBodyDisplayLines(paragraph, interaction) {
  const source = String(paragraph ?? "").trim();
  if (!source) return [];
  if (
    interaction?.type === "fixed_event"
    && ["opening_ceremony", "military_training", "architecture_life_start"].includes(interaction.eventId)
  ) {
    return [source];
  }
  if (interaction?.type === "graduation_ceremony") {
    return [source];
  }
  if (interaction?.type === "ending_memory") {
    return [source];
  }
  if (interaction?.type === "random_event" && interaction?.eventId === "mayday_stubborn") {
    return [source];
  }
  if (interaction?.type === "year_start" && interaction?.title === "画了五年，该交图了！" && source.includes("每一条都通向一个不同的明天")) {
    return [source];
  }
  if (interaction?.type === "system_prompt" && interaction?.title === "温馨提醒") {
    return [source];
  }
  if (source === "甲、乙、丙三人分别说：“乙会通过”“丙不会通过”“甲和乙至少一人不会通过”。已知三句话只有一句为真，则通过情况是：") {
    return [
      "甲、乙、丙三人分别说：",
      "“乙会通过”“丙不会通过”“甲和乙至少一人不会通过”。",
      "已知三句话只有一句为真，则通过情况是：",
    ];
  }
  if (source === "某部门 5 人排班，[[br]]甲不能排在第一天，乙必须排在甲之前，丙不能排在最后一天。[[br]]若每天 1 人值班，可能的排班数量为：") {
    return [
      "某部门 5 人排班，",
      "甲不能排在第一天，乙必须排在甲之前，丙不能排在最后一天。",
      "若每天 1 人值班，可能的排班数量为：",
    ];
  }
  if (modalNoWrapLines.has(source)) {
    return [source];
  }
  const targetLengthByType = {
    report_feedback: 54,
    review_result: 48,
    report_strategy: 46,
    year_start: 56,
  };
  const targetLengthByTitle = {
    "竞赛投稿提醒": 54,
    "恭喜你，作品集开始有了厚度": 58,
  };
  const targetLength = isCompetitionResultInteraction(interaction)
    ? 56
    : targetLengthByTitle[interaction?.title] ?? targetLengthByType[interaction?.type] ?? 38;
  if (source.length <= targetLength) return [source];

  const chunks = source.match(/[^。！？；，、]+[。！？；，、]?/gu) ?? [source];
  const lines = [];
  let line = "";
  for (const chunk of chunks) {
    const nextLine = `${line}${chunk}`;
    if (line && nextLine.length > targetLength && line.length >= Math.floor(targetLength * 0.45)) {
      lines.push(line.trim());
      line = chunk;
      continue;
    }
    line = nextLine;
  }
  if (line.trim()) lines.push(line.trim());
  return rebalanceShortFinalLine(lines, targetLength);
}

function rebalanceShortFinalLine(lines, targetLength) {
  if (lines.length < 2) return lines;
  const last = lines.at(-1);
  if (last.length >= 8) return lines;
  const previous = lines.at(-2);
  if ((previous.length + last.length) <= Math.round(targetLength * 1.15)) {
    return [...lines.slice(0, -2), `${previous}${last}`];
  }
  return lines;
}

function reviewGradeClass(grade) {
  return ["F", "D"].includes(String(grade).toUpperCase()) ? "is-low-grade" : "is-high-grade";
}

function renderInlineDeltaText(delta = {}, className = "inline-delta-text") {
  const entries = Object.entries(delta ?? {});
  if (entries.length === 0) return "";
  return `
    <span class="inline-delta-text ${className}" aria-label="${escapeHtml(formatDelta(delta))}">
      ${entries.map(([key, value]) => `
        <span class="inline-delta-item delta-key-${escapeHtml(key)}">
          <span class="inline-delta-name">${escapeHtml(DELTA_LABELS[key] ?? key)}</span>
          <b class="settlement-confirm-value ${deltaTone(key, value)}">${value > 0 ? "+" : ""}${escapeHtml(value)}</b>
        </span>
      `).join("")}
    </span>
  `;
}

function renderSettlementConfirmLabel(delta = {}, fallback = "继续") {
  const entries = Object.entries(delta ?? {});
  if (entries.length === 0) return renderSettlementConfirmTextLabel(fallback);
  return `
    <span class="settlement-confirm-label" aria-label="${escapeHtml(formatDelta(delta))}">
      ${entries.map(([key, value]) => `
        <span class="settlement-confirm-item">
          <span class="settlement-confirm-name">${escapeHtml(DELTA_LABELS[key] ?? key)}</span>
          <b class="settlement-confirm-value ${deltaTone(key, value)}">${value > 0 ? "+" : ""}${escapeHtml(value)}</b>
        </span>
      `).join("")}
    </span>
  `;
}

function renderSettlementConfirmTextLabel(text) {
  const source = String(text ?? "继续");
  const signedNumberPattern = /[+-]\d+(?:\.\d+)?/g;
  if (!signedNumberPattern.test(source)) return escapeHtml(source);

  signedNumberPattern.lastIndex = 0;
  let cursor = 0;
  let output = "";
  for (const match of source.matchAll(signedNumberPattern)) {
    const [token] = match;
    const index = match.index ?? 0;
    output += escapeHtml(source.slice(cursor, index));
    output += `<b class="settlement-confirm-value ${settlementTextTone(source, index, Number(token))}">${escapeHtml(token)}</b>`;
    cursor = index + token.length;
  }
  output += escapeHtml(source.slice(cursor));
  return `<span class="settlement-confirm-label settlement-confirm-text" aria-label="${escapeHtml(source)}">${output}</span>`;
}

function settlementTextTone(source, index, value) {
  const prefix = source.slice(0, index);
  let matchedKey = "";
  let matchedIndex = -1;
  for (const [key, label] of Object.entries(DELTA_LABELS)) {
    const labelIndex = prefix.lastIndexOf(label);
    if (labelIndex > matchedIndex) {
      matchedKey = key;
      matchedIndex = labelIndex;
    }
  }
  return matchedKey ? deltaTone(matchedKey, value) : deltaTone("", value);
}

function renderModalOptionImage(image) {
  if (!image?.src) return "";
  return `
    <figure class="modal-option-media" aria-hidden="true">
      <img src="${assetSrc(image.src)}" alt="" loading="eager" decoding="async" />
    </figure>
  `;
}

function renderCourseProgress(label, meter, icon = "") {
  const percent = Math.round((meter?.ratio ?? 0) * 100);
  const value = Math.round(Number(meter?.value) || 0);
  const max = Math.round(Number(meter?.max) || 100);
  return `
    <div>
      <span class="course-progress-label">
        ${icon ? `<i aria-hidden="true">${renderUiIcon(icon, label)}</i>` : ""}
        <b>${escapeHtml(label)}</b>
      </span>
      <div class="meter-track"><span style="inline-size:${percent}%"></span></div>
      <strong>${value} / ${max}</strong>
    </div>
  `;
}

function renderMentorCard(vm) {
  const mentor = MENTORS.find((item) => item.id === vm.profile.mentorId);
  const mentorName = vm.profile.mentorName || "未选择";
  const mentorTitle = vm.profile.mentorTitle || "设计导师";
  const mentorIntro = summarizeMentorIntro(vm.profile.mentorIntro || "完成开学流程后，将抽取并选择本学年导师。");
  const taskName = vm.profile.mentorTaskName || "阶段任务";
  const taskCondition = vm.profile.mentorTaskCondition || "选择导师后显示本学年任务。";
  const taskDetail = vm.profile.mentorTaskProgressText || mentor?.task?.detailText || taskCondition;
  const taskIcon = MENTOR_STAGE_TASK_ICONS[vm.profile.mentorId];
  return `
    <section class="mentor-card">
      <div class="section-head compact"><h2>导师</h2><span>MENTOR</span></div>
      <div class="mentor-main">
        <div class="mentor-avatar" aria-hidden="true">${renderUiIcon(MENTOR_AVATAR_ICONS[vm.profile.mentorId], mentorName)}</div>
        <div>
          <strong>${escapeHtml(mentorName || "未选择")}</strong>
          <span class="mentor-title">${escapeHtml(mentorTitle)}</span>
          <p>${escapeHtml(mentorIntro)}</p>
        </div>
      </div>
      <div class="mentor-task ${taskIcon ? "has-icon" : ""}">
        ${taskIcon ? `<i class="mentor-task-icon" aria-hidden="true">${renderUiIcon(taskIcon, taskName)}</i>` : ""}
        <div class="mentor-task-copy">
          <b>${escapeHtml(taskName)}</b>
          <span>${escapeHtml(taskDetail)}</span>
        </div>
      </div>
    </section>
  `;
}

function systemIcon(id, theme = "light") {
  const iconKey = SYSTEM_ICON_ALIASES[id] ?? id;
  return renderUiIcon(iconKey === "theme" ? themeIconPath(theme) : UI_ICON_PATHS[iconKey]);
}

function systemEntryGroup(vm, groupId) {
  return vm.systems?.entryGroups?.[groupId] ?? [];
}

function systemEntryById(vm, id) {
  return vm.systems?.entries?.find((entry) => entry.id === id) ?? null;
}

function renderCornerSystemBar(vm, theme = "light") {
  const wanliEntry = systemEntryById(vm, "wanli_road");
  return `
    <nav class="corner-system-bar" aria-label="底部快捷入口">
      ${wanliEntry ? renderCornerEntryButton(wanliEntry, theme) : ""}
      <button class="mini-button icon-mini-button settings-corner-button" type="button" data-command="toggle-settings" aria-label="设置" title="设置">
        <span class="settings-entry-icon start-icon-gear" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.gear)}</span>
      </button>
    </nav>
  `;
}

function renderCornerEntryButton(entry, theme = "light") {
  const disabled = entry.availability?.state === "disabled";
  const commandAttrs = systemEntryCommandAttrs(entry);
  const stateClass = entry.availability?.state ? `entry-${entry.availability.state}` : "";
  const idClass = `entry-id-${entry.id}`;
  const label = entry.id === "wanli_road"
    ? `<span class="corner-entry-full">${escapeHtml(entry.label)}</span><span class="corner-entry-short">万里路</span>`
    : escapeHtml(entry.label);
  return `
    <button class="mini-button corner-entry-button ${stateClass} ${escapeHtml(idClass)}" type="button" data-command="${escapeHtml(entry.command)}" ${commandAttrs} ${disabled ? "disabled" : ""} aria-label="${escapeHtml(entry.label)}：${escapeHtml(entry.statusLabel)}">
      <span class="system-icon system-icon-${escapeHtml(entry.id)}" aria-hidden="true">${systemIcon(entry.id, theme)}</span>
      <strong>${label}</strong>
    </button>
  `;
}

function renderRightEntryPanel(vm, theme, ids = []) {
  const entries = systemEntryGroup(vm, "rightRail")
    .filter((entry) => ids.length === 0 || ids.includes(entry.id));
  if (!entries.length) return "";
  const panelClass = ["right-entry-panel", entries.length === 1 ? `right-entry-${entries[0].id}` : ""].join(" ");
  return `
    <section class="${panelClass}">
      <div class="right-entry-grid">
        ${entries.map((entry) => renderSystemEntryButton(entry, theme)).join("")}
      </div>
    </section>
  `;
}

function renderCourseEntryGrid(vm, theme) {
  const entries = systemEntryGroup(vm, "course");
  if (!entries.length) return "";
  return `
    <div class="course-entry-grid" aria-label="课程相关入口">
      ${entries.map((entry) => renderSystemEntryButton(entry, theme)).join("")}
    </div>
  `;
}

function renderModalImage(image) {
  if (!image?.src) return "";
  return `
    <figure class="modal-media">
      <img src="${assetSrc(image.src)}" alt="${escapeHtml(image.alt ?? "")}" loading="eager" decoding="async" />
      ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""}
    </figure>
  `;
}

function renderSystemEntryButton(entry, theme = "light") {
  return renderSystemEntry(entry, theme, "system");
}

function renderBottomSystemEntryButton(entry, theme = "light") {
  return renderSystemEntry(entry, theme, "bottom");
}

function renderSettingsEntryButton(entry, theme = "light") {
  return renderSystemEntry(entry, theme, "settings");
}

function renderSystemEntry(entry, theme = "light", variant = "system") {
  const disabled = entry.availability?.state === "disabled";
  const commandAttrs = systemEntryCommandAttrs(entry);
  const stateClass = entry.availability?.state ? `entry-${entry.availability.state}` : "";
  const idClass = `entry-id-${entry.id}`;
  const dangerClass = entry.id === "new-game" ? "is-danger" : "";
  const minimalClass = variant === "bottom" ? "is-minimal" : "";
  const buttonClass = variant === "settings" ? "settings-entry-button" : `system-button ${minimalClass}`;
  const iconClass = variant === "settings" ? "settings-entry-icon" : "system-icon";
  const showDetails = !["bottom", "settings"].includes(variant) && !["portfolio_resume", "resume"].includes(entry.id);
  const ariaLabel = variant === "settings" ? entry.label : `${entry.label}：${entry.statusLabel}`;
  return `
    <button class="mini-button ${buttonClass} ${stateClass} ${escapeHtml(idClass)} ${dangerClass}" type="button" data-command="${escapeHtml(entry.command)}" ${commandAttrs} ${disabled ? "disabled" : ""} aria-label="${escapeHtml(ariaLabel)}">
      <span class="${iconClass} system-icon-${escapeHtml(entry.id)}" aria-hidden="true">${systemIcon(entry.id, theme)}</span>
      <strong>${escapeHtml(entry.label)}</strong>
      ${showDetails ? `<span class="entry-status">${escapeHtml(entry.statusLabel)}</span>` : ""}
      ${showDetails ? `<em>${escapeHtml(entry.availability?.reason || entry.statusLabel)}</em>` : ""}
    </button>
  `;
}

function renderGameSettingsDialog(vm, theme) {
  return `
    <div class="modal-backdrop settings-modal-backdrop" role="presentation">
      <section class="modal-card system-modal game-settings-modal" role="dialog" aria-modal="true" aria-labelledby="game-settings-title">
        <div class="modal-copy">
          <p class="kicker">SETTINGS</p>
          <h2 id="game-settings-title">设置</h2>
        </div>
        <div class="settings-grid game-settings-grid">
          ${systemEntryGroup(vm, "settings").map((entry) => renderSettingsEntryButton(entry, theme)).join("")}
        </div>
        <button class="pixel-button" type="button" data-command="toggle-settings">返回游戏</button>
      </section>
    </div>
  `;
}

function systemEntryCommandAttrs(entry) {
  return ["ui-dialog", "open-external-link"].includes(entry.command)
    ? `data-id="${escapeHtml(entry.id)}"`
    : "";
}

const FUTURE_CHOICE_DIALOGS = {
  postgrad_exam: {
    kicker: "POSTGRAD EXAM",
    title: "考研升学",
    routes: ["考研"],
    modalClass: "academic-route-modal",
    preOpenBody: "同学你好，考研系统入口将于大五学年正式开启。\n如果你决定走这条路，请在此之前踏踏实实复习，专教的灯会陪你熬过很多个深夜，祝你复习顺利！",
    notes: [],
  },
  recommendation: {
    kicker: "RECOMMENDATION",
    title: "申请保研",
    routes: ["保研"],
    modalClass: "academic-route-modal",
    preOpenBody: "这位同学你好，保研系统入口将于大五学年正式开启。\n如果你有意争取，请在此之前认真对待每一门课、每一次评图、每一个方案。\n祝你稳住节奏，也祝你在专教的每一次落笔，都不留遗憾。",
    notes: [],
  },
  public_service: {
    kicker: "PUBLIC SERVICE",
    title: "考公考编",
    routes: ["选调", "考公", "考编"],
    body: "大五阶段可正式确认一个体制内方向和岗位层级；大五前这里只展示入口条件和候选方向。",
    notes: [
      "大五阶段开放考公、考编和选调方向。",
      "体制内方向会读取岗位层级、GPA、表达、人际、抗压和行测题。",
    ],
  },
  overseas_study: {
    kicker: "OVERSEAS",
    title: "出国留学",
    routes: ["留学"],
    modalClass: "academic-route-modal overseas-route-modal",
    preOpenBody: "同学你好，出国留学系统入口将于大五学年正式开放。\n如果你有意申请海外院校，在此之前，你需要准备好雅思、作品集和一份不被旁人理解的决心。",
    notes: [],
  },
  career_change: {
    kicker: "CAREER CHANGE",
    title: "转行",
    routes: ["转行"],
    modalClass: "academic-route-modal career-change-modal",
    preOpenBody: "同学你好，转行通道大五才会正式开启。\n别急，你有足够的时间确认自己是真的想走，还是只是被这周的评图逼疯了。\n无论答案是什么，你画图的这五年都不会被浪费，祝你找到适合自己的方向！",
    body: "",
    notes: [],
  },
};

const IELTS_REGISTRATION_CARDS = [
  ["考试机会", "一学期一次", ""],
  ["考试内容", "10 题单选", ""],
  ["报名费用", "¥1800", ""],
];

function renderUiDialog(id, vm, theme = "light", language = DEFAULT_UI_LANGUAGE) {
  if (!id) return "";
  const normalizedLanguage = normalizeUiLanguage(language);
  const languageCopy = languageDialogCopy(normalizedLanguage);
  if (id === "special_skill_confirm" && vm?.specialSkillAction) {
    return renderSpecialSkillConfirmDialog(vm);
  }
  if (id === "start_settings") {
    return renderStartSettingsDialog(theme);
  }
  if (id === "coffee") {
    return renderAuthorSupportDialog();
  }
  if (id === "profile_invalid") {
    return renderSystemDialog("PROFILE", "开局资料未完成", [
      ["你的名字", "必填，最多 18 字"],
      ["大学名字", "必填，最多 24 字"],
    ], [
      "昵称和大学名称都要填写，不能只输入空格，也不能超过表单上限。",
      "这两项只用于称呼、存档、剧情文本和排行榜展示，不提供数值加成。",
    ]);
  }
  if (id === "mobile_start_blocked") {
    return `
      <div class="modal-backdrop mobile-start-blocked-backdrop" role="presentation">
        <section class="modal-card slim mobile-start-blocked-dialog" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
          <div class="modal-copy">
            <p class="kicker">温馨提示</p>
            <h2 id="ui-dialog-title">同学你好，手机屏幕太小，放不下你的五年！</h2>
            <p class="mobile-start-blocked-line">请移步电脑端<br>大屏幕才配得上你的建筑梦。</p>
          </div>
          <button class="pixel-button is-primary" type="button" data-command="close-ui-dialog">我知道了</button>
        </section>
      </div>
    `;
  }
  if (id === "load_failed") {
    return renderSystemDialog("SAVE", "读档失败", [
      ["存档状态", "无法恢复"],
      ["处理方式", "当前内存状态不会被清空"],
    ], [
      "本地存档读取失败，可能是数据损坏或版本不兼容。",
      "可以重新开始新游戏；如果你正在游戏内，请先不要关闭页面。",
    ]);
  }
  if (id === "save_success") {
    return renderSystemDialog("SAVE", "保存成功", [], [
      "游戏存档会自动存储于浏览器缓存中，无需手动保存。",
      "为避免存档丢失，请勿清除本网站的浏览器缓存的数据文件。",
    ], "save-success-modal", "pixel-button is-primary", UI_ICON_PATHS.save);
  }
  if (id === "save_failed") {
    return renderSystemDialog("SAVE", "保存失败", [
      ["存档位置", "本地浏览器"],
      ["当前状态", "写入失败"],
    ], [
      "本地保存失败，请先不要关闭页面。",
      "可能是浏览器存储被禁用或空间不足。",
    ]);
  }
  if (id === "confirm_new_game") {
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal-card slim danger-dialog" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
          <div class="modal-copy">
            <p class="kicker">DANGER</p>
            <h2 id="ui-dialog-title"><span class="modal-title-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.risk_alert)}</span><span>放弃当前学业？</span></h2>
            <p class="danger-dialog-warning">同学，这会清空当前的进度，并返回游戏开始页。<br>请谨慎选择！</p>
          </div>
          <div class="theme-options">
            <button class="pixel-button is-danger" type="button" data-command="new-game" data-id="confirmed">确认重新开始</button>
            <button class="pixel-button is-primary" type="button" data-command="close-ui-dialog">继续当前游戏</button>
          </div>
        </section>
      </div>
    `;
  }
  if (id === "leaderboard") {
    return renderLeaderboardDialog(vm);
  }
  if (id === "guide" || id === "guide_after_course_select") {
    return renderGuideDialog(
      Boolean(vm?.calendar && vm?.systems),
      id === "guide_after_course_select" ? "跳过" : "",
    );
  }
  if ((id === "shop" || id.startsWith("shop::")) && vm?.systems?.shop) {
    const shop = vm.systems.shop;
    const categories = [...new Set(shop.items.map((item) => item.category))];
    const requestedCategory = id.includes("::") ? decodeURIComponent(id.split("::")[1] ?? "") : "";
    const activeCategory = categories.includes(requestedCategory) ? requestedCategory : categories[0];
    const activeItems = shop.items.filter((item) => item.category === activeCategory);
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal-card system-modal shop-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
          <div class="modal-copy">
            <p class="kicker">SHOP</p>
            <div class="shop-title-row">
              <h2 id="ui-dialog-title">商店购物</h2>
              <div class="shop-balance-chip ${vm.money?.highRisk ? "is-risk" : ""}" aria-label="当前余额">
                <span>${escapeHtml(vm.money?.label ?? "余额")}</span>
                <strong>¥${escapeHtml(String(vm.money?.value ?? shop.money ?? 0))}</strong>
              </div>
            </div>
            <p>购物不消耗本周行动，按下购入立刻结算。</p>
          </div>
          <div class="shop-category-tabs" role="tablist" aria-label="商店分类">
            ${categories.map((category) => `
              <button class="shop-category-tab ${category === activeCategory ? "is-active" : ""}" type="button" role="tab" aria-selected="${category === activeCategory ? "true" : "false"}" data-command="ui-dialog" data-id="shop::${encodeURIComponent(category)}">
                <span>${escapeHtml(category)}</span>
                <b>${shop.items.filter((item) => item.category === category).length}</b>
              </button>
            `).join("")}
          </div>
          <section class="shop-category" role="tabpanel" aria-label="${escapeHtml(activeCategory)}">
            <div class="section-head compact"><h3>${escapeHtml(activeCategory)}</h3><span>${activeItems.length}</span></div>
            <div class="shop-grid">
              ${activeItems.map(renderShopItem).join("")}
            </div>
          </section>
          <button class="pixel-button" type="button" data-command="close-ui-dialog">返回</button>
        </section>
      </div>
    `;
  }
  if ((id === "portfolio_resume" || id.startsWith("portfolio_resume::")) && vm?.systems?.portfolio) {
    const portfolio = vm.systems.portfolio;
    const requestedWork = id.includes("::") ? decodeURIComponent(id.split("::")[1] ?? "") : "";
    return renderPortfolioDialog(portfolio, requestedWork);
  }
  if (id === "resume" && vm?.systems?.portfolio) {
    return renderResumeDialog({
      profile: vm.profile,
      calendar: vm.calendar,
      portfolio: vm.systems.portfolio,
      route: vm.systems.route,
      internship: vm.systems.internship,
      competition: vm.systems.competition,
      attributes: vm.attributes,
    });
  }
  if ((id === "competition" || id.startsWith("competition::")) && vm?.systems?.competition) {
    const requestedView = id.startsWith("competition::") ? decodeURIComponent(id.slice("competition::".length)) : "";
    return renderCompetitionDialog(vm.systems.competition, requestedView);
  }
  if ((id === "internship_work" || id.startsWith("internship_work::")) && vm?.systems?.internship) {
    const internship = vm.systems.internship;
    if (vm?.systems?.route) {
      const defaultView = Number(vm.systems.route.year) >= 5 ? "work" : "internship";
      const view = id.startsWith("internship_work::") ? decodeURIComponent(id.slice("internship_work::".length)) : defaultView;
      return renderInternshipWorkDialog(vm.systems.route, internship, view);
    }
  }
  if ((id === "public_service" || id.startsWith("public_service::")) && vm?.systems?.route) {
    const view = id.startsWith("public_service::") ? decodeURIComponent(id.slice("public_service::".length)) : "考公";
    return renderPublicServiceDialog(vm.systems.route, view);
  }
  if (id === "ielts_registration" && vm?.systems?.route) {
    return renderIeltsRegistrationDialog(vm.systems.route);
  }
  if ((id === "overseas_study" || id.startsWith("overseas_study::")) && vm?.systems?.route) {
    const tier = id.startsWith("overseas_study::") ? decodeURIComponent(id.slice("overseas_study::".length)) : "s";
    return renderRouteDialog(vm.systems.route, { ...FUTURE_CHOICE_DIALOGS.overseas_study, activeTier: tier });
  }
  if (FUTURE_CHOICE_DIALOGS[id] && vm?.systems?.route) {
    const dialog = FUTURE_CHOICE_DIALOGS[id];
    return renderRouteDialog(vm.systems.route, dialog);
  }
  if ((id === "wanli_road" || id.startsWith("wanli_road::")) && vm?.systems?.wanliRoad) {
    const requestedEventId = id.startsWith("wanli_road::") ? decodeURIComponent(id.slice("wanli_road::".length)) : "";
    return renderWanliRoadDialog(vm.systems.wanliRoad, requestedEventId);
  }
  if (id === "theme") {
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal-card slim theme-dialog" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
          <div class="modal-copy">
            <p class="kicker">SYSTEM PANEL</p>
            <h2 id="ui-dialog-title"><span class="modal-title-icon start-icon-theme" aria-hidden="true">${renderUiIcon(themeIconPath(theme))}</span><span>主题背景</span></h2>
            <p class="theme-dialog-copy">同学，你可以选择更适合当前环境的显示背景。</p>
          </div>
          <div class="theme-options">
            <button class="pixel-button ${theme === "dark" ? "is-primary" : ""}" type="button" data-command="set-theme" data-id="dark" aria-pressed="${theme === "dark" ? "true" : "false"}">深色像素</button>
            <button class="pixel-button ${theme === "light" ? "is-primary" : ""}" type="button" data-command="set-theme" data-id="light" aria-pressed="${theme === "light" ? "true" : "false"}">浅色像素</button>
          </div>
          <button class="pixel-button" type="button" data-command="close-ui-dialog">返回</button>
        </section>
      </div>
    `;
  }
  if (id === "startup_theme") {
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal-card slim theme-dialog startup-theme-dialog" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
          <div class="modal-copy">
            <p class="kicker">SYSTEM PANEL</p>
            <h2 id="ui-dialog-title">主题背景</h2>
            <p class="theme-dialog-copy">同学你好，当前为深色模式。<br />如有不适，可切换为浅色模式，<br />之后也可在右下角的设置中随时更改。</p>
          </div>
          <div class="theme-options startup-theme-options">
            <button class="pixel-button is-primary startup-theme-option" type="button" data-command="choose-startup-theme" data-id="light">
              <span class="theme-option-icon" aria-hidden="true">${renderUiIcon(themeIconPath("light"))}</span>
              <span>切换为浅色模式</span>
            </button>
            <button class="pixel-button startup-theme-option" type="button" data-command="choose-startup-theme" data-id="dark">
              <span class="theme-option-icon" aria-hidden="true">${renderUiIcon(themeIconPath("dark"))}</span>
              <span>我喜欢深色模式</span>
            </button>
          </div>
        </section>
      </div>
    `;
  }
  if (id === "achievements") {
    const unlockedEndingIds = new Set(vm?.achievements?.endingIds ?? []);
    const endingCounts = vm?.achievements?.endingCounts ?? {};
    const endings = Object.entries(ENDINGS).map(([endingId, ending]) => ({
      id: endingId,
      title: ending.title,
      body: ending.body,
      icon: endingRouteIconPath(endingId),
      score: ending.score ?? 0,
      completionCount: Math.max(0, Number(endingCounts[endingId]) || 0),
      unlocked: unlockedEndingIds.has(endingId),
    }));
    const achievements = vm?.achievements?.items ?? Object.entries(ACHIEVEMENTS).map(([achievementId, achievement]) => ({
      ...achievement,
      id: achievementId,
      icon: achievementIconPath(achievement),
      unlocked: false,
    }));
    const unlockedCount = vm?.achievements?.unlockedCount ?? 0;
    const totalCount = vm?.achievements?.totalCount ?? achievements.length;
    const score = vm?.achievements?.leaderboardScore ?? vm?.achievements?.score ?? 0;
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal-card achievement-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
          <button class="pixel-button is-primary achievement-close-button" type="button" data-command="close-ui-dialog">返回</button>
          <div class="modal-copy achievement-modal-copy">
            <p class="kicker">ACHIEVEMENTS</p>
            <h2 id="ui-dialog-title">结局与成就</h2>
            <p class="achievement-summary-line">人生结局 ${unlockedEndingIds.size} / ${endings.length}，成长成就 ${unlockedCount} / ${totalCount}，玩家排行榜总分 ${score}。</p>
            <div class="achievement-rule-list" aria-label="累计规则">
              <span class="achievement-rule-title">累计规则：</span>
              <span class="achievement-rule-index">1.</span>
              <span class="achievement-rule-text">结局分数与成就分数共同计入玩家排行榜总分。</span>
              <span class="achievement-rule-index">2.</span>
              <span class="achievement-rule-text">同一人生结局重复达成的前 2 次按 50 分计入排行榜；第 3 次及以后仅记录达成次数，不再增加分数。</span>
            </div>
          </div>
          <input class="achievement-tab-control" id="achievement-tab-endings" type="radio" name="achievement-panel" checked />
          <input class="achievement-tab-control" id="achievement-tab-achievements" type="radio" name="achievement-panel" />
          <nav class="achievement-tabs" aria-label="结局与成就分类">
            <label class="achievement-tab" for="achievement-tab-endings">人生结局</label>
            <label class="achievement-tab" for="achievement-tab-achievements">成长成就</label>
          </nav>
          <div class="achievement-panes">
            <section class="achievement-pane achievement-pane-endings" id="achievement-endings" aria-labelledby="achievement-endings-title">
              <div class="achievement-section-head">
                <strong id="achievement-endings-title">人生结局</strong>
                <span>${unlockedEndingIds.size} / ${endings.length}</span>
              </div>
              <div class="achievement-gallery achievement-gallery-endings">
                ${endings.map((item) => `
                  <article class="achievement-gallery-item is-ending ${item.unlocked ? "is-unlocked" : "is-locked"}">
                    <span class="achievement-gallery-icon" aria-hidden="true">${renderUiIcon(item.icon, item.title)}</span>
                    <div class="achievement-gallery-copy">
                      <strong>${escapeHtml(item.title)}</strong>
                      <p class="achievement-ending-count">达成次数：${escapeHtml(item.completionCount)}次</p>
                    </div>
                    <em>${item.unlocked ? `${escapeHtml(String(item.score))} 分` : "未解锁"}</em>
                  </article>
                `).join("")}
              </div>
            </section>
            <section class="achievement-pane achievement-pane-achievements" id="achievement-list" aria-labelledby="achievement-list-title">
              <div class="achievement-section-head">
                <strong id="achievement-list-title">成长成就</strong>
                <span>${unlockedCount} / ${totalCount}</span>
              </div>
              <div class="achievement-gallery achievement-gallery-achievements">
                ${achievements.map((item) => `
                  <article class="achievement-gallery-item is-achievement ${item.unlocked ? "is-unlocked" : "is-locked"}">
                    <span class="achievement-gallery-icon" aria-hidden="true">${renderUiIcon(item.icon ?? achievementIconPath(item), item.title)}</span>
                    <div class="achievement-gallery-copy">
                      <strong>${escapeHtml(item.title)}</strong>
                      <p>${escapeHtml(item.body)}</p>
                      ${item.unlocked && item.conditionText ? `<p class="achievement-condition-line">触发条件：${escapeHtml(item.conditionText)}</p>` : ""}
                    </div>
                    <em>${item.unlocked ? `${escapeHtml(String(item.score))} 分` : "未解锁"}</em>
                  </article>
                `).join("")}
              </div>
            </section>
          </div>
        </section>
      </div>
    `;
  }
  const content = {
    announcement: ["公告", "各位同学，欢迎来到建筑学院。\n今天，由我个人开发的《第二十五小时：建筑生模拟器》第一次正式发布。\n\n这是一款关于五年建筑学院生活的大学人生模拟游戏。\n你会在这五年的建院生涯中，经历设计课、赶图、通宵、评图与毕业，\n也会在有限的时间、精力和选择里，不断在现实与理想之间寻找自己的答案。\n首发版本还有许多不完善的地方，欢迎大家在我的“建院社区”进行反馈和讨论。\n感谢你愿意陪这个小小的建院世界，从第一天开始。\n\n“黄色的树林里不止分出两条路。\n少年，你的选择是什么呢？”\n\n零一扬\n2026年6月28日"],
    author: ["作者的话", "这是一封写给建筑生的长信。那些灯、图纸、赶不完的周和偶尔出现的光，都会被认真放进游戏里。"],
    community: ["建院社区", "这里会汇集玩家的建筑生故事、路线心得和毕业记录。"],
    leaderboard: ["玩家排行榜", "榜单会记录总分、昵称、大学名称和毕业结果。"],
    achievements: ["结局与成就", "这里会展示已解锁结局、成长成就、重复达成记录和总分。"],
    language: [languageCopy.title, ""],
    shop: ["商店购物", "商店购物是常驻轻量系统，不占周行动次数。你可以用金钱换取生活、学习、设备与灵感。"],
    portfolio_resume: ["个人作品集", "这里会汇总已完成课程设计、C/B/A/S 入库作品、作品集总分和最近评图记录。"],
    resume: ["个人简历", "这里会汇总竞赛获奖、实习经历、考试经历和附属记录。"],
    wanli_road: ["建筑生的万里路", "建筑生的万里路从大二上开放，按固定地点顺序前往；点击地点事件弹窗的结算按钮后，才写入经历和数值。"],
    competition: ["竞赛投稿", "竞赛投稿入口用于每学期投稿与查看获奖记录。"],
    internship_work: ["实习与工作", "实习与工作入口用于申请实习、查看进行中实习、建筑工作投递和结算经历价值；大五建筑工作路线会读取作品集、实习价值和能力组合。"],
    postgrad_exam: ["考研升学", "大五阶段开放考研升学，读取院校档位、升学专业题和已有积累。"],
    recommendation: ["申请保研", "大五阶段开放申请保研，读取 GPA、近学期评图、作品集和复试状态。"],
    public_service: ["考公考编", "大五阶段开放考公、考编和选调，读取岗位层级、行测题和能力门槛。"],
    overseas_study: ["出国留学", "大五阶段开放出国留学，读取作品集、语言考试、GPA、具体院校和院校档位。"],
    career_change: ["转行", "大五阶段开放转行投递，读取具体岗位、能力结构和特殊经历。"],
  }[id] ?? ["提示", "这里暂时没有更多内容。"];
  const contentIcon = id === "language" ? UI_ICON_PATHS.language : "";
  const contentTitle = contentIcon
    ? `<span class="modal-title-icon" aria-hidden="true">${renderUiIcon(contentIcon)}</span><span>${escapeHtml(content[0])}</span>`
    : escapeHtml(content[0]);

  const contentBody = id === "announcement"
    ? renderAnnouncementBody(content[1])
    : content[1] ? `<p>${escapeHtml(content[1])}</p>` : "";
  const languageOptions = id === "language" ? `
          <div class="language-options" role="group" aria-label="${escapeHtml(languageCopy.ariaLabel)}">
            ${UI_LANGUAGE_OPTIONS.map((option) => {
              const isActive = option.id === normalizedLanguage;
              return `<button class="pixel-button ${isActive ? "is-primary" : ""}" type="button" data-command="set-language" data-id="${escapeHtml(option.id)}" aria-pressed="${isActive ? "true" : "false"}">${escapeHtml(option.label)}</button>`;
            }).join("")}
          </div>
        ` : "";
  const languageNotice = id === "language"
    ? `<p class="language-notice">English语言模块尚未完善，请谅解。</p>`
    : "";
  const returnLabel = id === "language" ? languageCopy.returnLabel : "返回";
  const contentCardClass = [
    id === "announcement" ? "announcement-dialog" : "",
    id === "language" ? "language-dialog" : "",
  ].filter(Boolean).join(" ");

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card slim ${contentCardClass}" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy">
          <p class="kicker">SYSTEM PANEL</p>
          <h2 id="ui-dialog-title">${contentTitle}</h2>
          ${contentBody}
        </div>
        ${languageOptions}
        ${languageNotice}
        <button class="pixel-button is-primary" type="button" data-command="close-ui-dialog">${escapeHtml(returnLabel)}</button>
      </section>
    </div>
  `;
}

function renderAnnouncementBody(body) {
  const signatureMatch = String(body ?? "").match(/\n\n([^\n]+)\n(\d{4}年\d{1,2}月\d{1,2}日)$/u);
  if (!signatureMatch) return `<p class="announcement-copy">${escapeHtml(body)}</p>`;
  const copy = body.slice(0, signatureMatch.index);
  const signature = `${signatureMatch[1]}\n${signatureMatch[2]}`;
  return `<p class="announcement-copy">${escapeHtml(copy)}</p><p class="announcement-signature">${escapeHtml(signature)}</p>`;
}

function renderStartSettingsDialog(theme = "light") {
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card system-modal start-settings-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy">
          <p class="kicker">START SETTINGS</p>
          <h2 id="ui-dialog-title">设置</h2>
          <p>这里集中管理开场页与游戏内的常用入口。</p>
        </div>
        <div class="start-settings-grid">
          ${START_SETTINGS_ENTRIES.map((entry) => `
            <button class="mini-button start-settings-button" type="button" data-command="${entry.command}" data-id="${entry.id}">
              <span class="settings-entry-icon start-icon-${entry.icon}" aria-hidden="true">${renderUiIcon(entry.icon === "theme" ? themeIconPath(theme) : UI_ICON_PATHS[entry.icon])}</span>
              <strong>${escapeHtml(entry.title)}</strong>
              <em>${escapeHtml(entry.detail)}</em>
            </button>
          `).join("")}
        </div>
        <button class="pixel-button" type="button" data-command="close-ui-dialog">返回</button>
      </section>
    </div>
  `;
}

function renderAuthorSupportDialog() {
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card support-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="support-layout">
          <div class="support-qr-stack" aria-label="支付二维码">
            ${SUPPORT_QR_CODES.map((code) => {
            const src = publicAssetUrl(code.src ?? "");
            return `
              <article class="support-qr-card support-${escapeHtml(code.id)}">
                <figure>
                  <img class="support-qr-image" src="${src}" alt="${escapeHtml(code.label)}收款码" loading="eager" decoding="async" fetchpriority="high" data-command="zoom-support-qr" data-src="${src}" data-label="${escapeHtml(code.label)}收款码" />
                </figure>
              </article>
            `;
          }).join("")}
          </div>
          <div class="support-right-column">
            <div class="modal-copy support-copy">
              <p class="kicker">AUTHOR NOTE</p>
              <h2 id="ui-dialog-title">谢谢你们愿意玩我的游戏！</h2>
              <p>当你在熬夜赶图的时候，作者也在写代码、调 Bug。<br />如果这款游戏能让你回忆起曾经的某个美好瞬间，那些无比珍贵的过去，<br />我想，这就是我做这件事情的意义。</p>
            </div>
            <figure class="support-ending-card">
              <img src="${assetSrc(SUPPORT_ENDING_IMAGE)}" alt="创业人生结局图" loading="eager" decoding="async" />
            </figure>
            <p class="support-ending-note">五年很长对吗，长到你以为走不完。<br />五年似乎也很短，短到我写不完所有想让你看见的细节。<br />剩下的，就留给你的记忆去补吧。</p>
          </div>
        </div>
        <button class="pixel-button support-return-button" type="button" data-command="close-ui-dialog">返回</button>
      </section>
    </div>
  `;
}

function renderGuideDialog(canStartGuide = false, returnLabel = "") {
  const closeLabel = returnLabel || (canStartGuide ? "返回游戏" : "返回");
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card system-modal guide-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy">
          <p class="kicker">GUIDE</p>
          <h2 id="ui-dialog-title">介绍与引导</h2>
          <p>这是一款关于五年建筑学院生活的大学人生模拟游戏。<br>你会在这五年的建院生涯中，经历设计课、赶图、通宵、评图与毕业，<br>也会在有限的时间、精力和选择里，不断在现实与理想之间寻找自己的答案。</p>
          <p class="guide-quote">“黄色的树林里不止分出两条路。<br>少年，你的选择是什么呢？”</p>
        </div>
        <div class="guide-actions">
          <button class="pixel-button is-primary" type="button" data-command="start-new-player-guide" ${canStartGuide ? "" : "disabled"}>${canStartGuide ? "开始新手引导" : "进入游戏后开启"}</button>
          <button class="pixel-button" type="button" data-command="close-ui-dialog">${escapeHtml(closeLabel)}</button>
        </div>
      </section>
    </div>
  `;
}

function modalKicker(interaction) {
  if (interaction?.type === "random_event" && interaction?.trigger === "internship") {
    return "实习事件";
  }
  if (interaction?.type === "random_event") {
    const event = RANDOM_EVENTS.find((item) => item.id === interaction.eventId);
    if (event?.pool === "interactive") return "交互事件";
  }
  const type = interaction?.type ?? interaction;
  const labels = {
    fixed_event: "固定流程",
    mentor_select: "导师选择",
    course_select: "课程选择",
    course_exam_intro: "EXAMINATION",
    ielts_exam_intro: "IELTS EXAMINATION",
    route_exam_intro: "路线考试",
    model_material: "强制流程",
    random_event: "随机事件",
    wanli_road_event: "万里路事件",
    project_select: "项目选择",
    course_question: "QUESTION",
    ielts_question: "IELTS QUESTION",
    route_question: "路线题",
    course_result: "RESULT",
    ielts_exam_result: "IELTS RESULT",
    route_exam_result: "RESULT",
    mentor_task_result: "RESULT",
    report_strategy: "评图阶段",
    report_feedback: "汇报反馈",
    review_result: "RESULT",
    route_commit: "路线确认",
    route_contract: "路线契约",
    graduation_ceremony: "固定流程",
    ending_memory: "固定流程",
    summer_event: "固定流程",
    year_start: "学年开始",
    system_prompt: "系统开放",
    choice_result: "RESULT",
  };
  return labels[type] ?? "流程";
}

function formatDelta(delta = {}) {
  const parts = Object.entries(delta ?? {}).map(([key, value]) => `${DELTA_LABELS[key] ?? key} ${value > 0 ? "+" : ""}${value}`);
  return parts.length ? parts.join("，") : "";
}

function renderShopItem(item) {
  const disabled = item.state !== "available";
  const itemClass = `shop-item-${logSourceClass(item.id)}`;
  return `
    <article class="shop-item ${itemClass} ${disabled ? "is-disabled" : ""}">
      <div class="shop-icon" aria-hidden="true">${renderUiIcon(SHOP_ITEM_ICONS[item.id]) || escapeHtml(item.icon)}</div>
      <div class="shop-copy">
        <strong>${escapeHtml(item.name)}</strong>
        <p>${renderOptionBodyText(item.text)}</p>
        <p class="shop-effect-text">${renderOptionBodyText(item.effectText)}</p>
        <span class="shop-limit">${escapeHtml(item.limitText)}</span>
      </div>
      <div class="shop-buy">
        <span>¥${item.price}</span>
        <button class="mini-button" type="button" data-command="buy-shop-item" data-id="${escapeHtml(item.id)}" ${disabled ? "disabled" : ""}>${disabled ? escapeHtml(item.reason) : "购入"}</button>
      </div>
    </article>
  `;
}

function renderWanliRoadDialog(wanliRoad, requestedEventId = "") {
  const selectedNode = requestedEventId
    ? wanliRoad.nodes.find((node) => node.id === requestedEventId) ?? null
    : null;
  if (selectedNode) {
    return renderWanliRoadEventPage(wanliRoad, selectedNode);
  }
  const current = wanliRoad.current;
  const visitDisabled = !wanliRoad.canVisit;
  const preOpenBody = "同学，该系统入口大二学年正式开放。\n你现在出去，跟旅游没什么区别。\n等大二吧，到时候你至少能看懂密斯的玻璃盒子为什么能站着不倒。";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card system-modal academic-route-modal career-change-modal wanli-road-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy wanli-road-copy">
          <p class="kicker">WANLI ROAD</p>
          <h2 id="ui-dialog-title">
            建筑生的万里路
          </h2>
          ${wanliRoad.open ? "" : `<p class="wanli-road-preopen">${renderInlineBreakText(preOpenBody)}</p>`}
        </div>
        <div class="wanli-road-summary" aria-label="万里路状态">
          ${[
            ["进度", `${wanliRoad.visits} / ${wanliRoad.total}`],
            ["当前年级", wanliRoad.semesterLabel ?? wanliRoad.yearLabel ?? "未知"],
            ["余额", `¥${wanliRoad.money}`],
          ].map(([label, value]) => `
            <div class="wanli-road-stat">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join("")}
          <div class="wanli-road-stat">
            <span>行动限制</span>
            <strong>学年旅行次数：${escapeHtml(Math.max(0, wanliRoad.maxVisitsPerYear - wanliRoad.visitsThisYear))}/${escapeHtml(wanliRoad.maxVisitsPerYear)}</strong>
          </div>
        </div>
        <div class="wanli-road-map" aria-label="万里路地图">
          ${wanliRoad.nodes.map((node) => renderWanliRoadNode(node)).join("")}
        </div>
        <div class="wanli-road-lower">
          <section class="wanli-road-current" aria-labelledby="wanli-road-current-title">
            <div class="section-head compact">
              <h3 id="wanli-road-current-title">${current ? "当前地点" : "路线完成"}</h3>
              <span>${current ? `第 ${wanliRoad.visits + 1} 站` : "12 / 12"}</span>
            </div>
            ${current ? `
              <article class="wanli-road-current-card">
                <span class="wanli-road-current-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS[current.iconKey] ?? UI_ICON_PATHS.wanli_road, current.title)}</span>
                <div>
                  <em>${escapeHtml(wanliRoadEnglishTitle(current))}</em>
                  <strong>${escapeHtml(current.title)}</strong>
                </div>
                <p>${escapeHtml(wanliRoadBrief(current))}</p>
              </article>
              ${wanliRoad.moneyWarning ? `<p class="wanli-road-warning">${escapeHtml(wanliRoad.moneyWarning)}</p>` : ""}
              ${wanliRoad.blockReason ? `<p class="wanli-road-block">${escapeHtml(wanliRoad.blockReason)}</p>` : ""}
              <div class="wanli-road-actions">
                <button class="pixel-button" type="button" data-command="wanli-road-visit" data-id="${escapeHtml(current.id)}" ${visitDisabled ? "disabled" : ""}>
                  前往 ${escapeHtml(current.title)}
                </button>
                <span class="wanli-road-action-chip">花费：¥${escapeHtml(current.cost)}</span>
                <span class="wanli-road-action-chip">时间消耗：${escapeHtml(String(wanliRoad.actionsRequired))} 次行动</span>
                ${wanliRoad.moneyInsufficient ? `<span class="wanli-road-action-chip is-danger">余额不足</span>` : ""}
              </div>
            ` : `
              <article class="wanli-road-complete">
                <strong>建筑生的万里路完成</strong>
                <p>12 个地点都已经走过，这段经历会留在你的成长路径里。</p>
              </article>
            `}
          </section>
          <section class="wanli-road-records" aria-labelledby="wanli-road-record-title">
            <div class="section-head compact">
              <h3 id="wanli-road-record-title">旅行记录</h3>
              <span>${wanliRoad.records.length}</span>
            </div>
            <div class="wanli-road-record-list">
              ${wanliRoad.records.length ? wanliRoad.records.map((record, index) => `
                <article class="wanli-road-record">
                  <b>${escapeHtml(String(index + 1).padStart(2, "0"))}</b>
                  <div>
                    <strong>${escapeHtml(record.title)}</strong>
                    <span>${escapeHtml(yearLabelFromRecord(record))} · 第 ${escapeHtml(record.week)} 周 · ¥${escapeHtml(record.cost)}</span>
                  </div>
                </article>
              `).join("") : `
                <article class="wanli-road-empty">
                  <strong>暂时没有出发记录</strong>
                </article>
              `}
            </div>
          </section>
        </div>
        ${renderWanliRoadStageRewards(wanliRoad.stageRewards ?? [])}
        <button class="pixel-button wanli-road-return" type="button" data-command="close-ui-dialog">返回</button>
      </section>
    </div>
  `;
}

function renderWanliRoadStageRewards(rewards) {
  if (!rewards.length) return "";
  return `
    <section class="wanli-road-stage-rewards" aria-labelledby="wanli-road-stage-rewards-title">
      <div class="section-head compact">
        <h3 id="wanli-road-stage-rewards-title">阶段奖励</h3>
        <span>完成站点解锁</span>
      </div>
      <div class="wanli-road-stage-reward-list">
        ${rewards.map((reward) => `
          <article class="wanli-road-stage-reward is-${escapeHtml(reward.status)}">
            <strong>完成 ${escapeHtml(reward.visits)} 站</strong>
            <span>${escapeHtml(reward.deltaText)}</span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function wanliRoadEnglishTitle(node) {
  const titles = {
    church_of_light: "Church of the Light",
    ronchamp: "Ronchamp Chapel",
    villa_savoye: "Villa Savoye",
    farnsworth_house: "Farnsworth House",
    bauhaus: "Bauhaus Building",
    salk_institute: "Salk Institute",
    kimbell_art_museum: "Kimbell Art Museum",
    suzhou_museum: "Suzhou Museum",
    bank_of_china_tower: "Bank of China Tower",
    guangzhou_opera_house: "Guangzhou Opera House",
    fallingwater: "Fallingwater",
    harvard_gsd: "Harvard GSD",
  };
  return titles[node?.id] ?? node?.title ?? "";
}

function wanliRoadBrief(node) {
  const briefs = {
    church_of_light: "用一道光理解空间、材料和沉默的力量。",
    ronchamp: "厚墙与屋顶一起，把神圣感压进身体里。",
    villa_savoye: "现代主义五点原则从课本走进真实生活。",
    farnsworth_house: "透明玻璃盒子让住宅、自然和暴露感彼此拉扯。",
    bauhaus: "一座学校，也是一套关于设计教育的宣言。",
    salk_institute: "秩序、海面和水线共同完成一场克制的震撼。",
    kimbell_art_museum: "顶光被仔细修边，安静地落在艺术和结构上。",
    suzhou_museum: "传统被收得很轻，白墙灰瓦变得清晰而克制。",
    bank_of_china_tower: "锋利的高层轮廓，把结构和城市野心一起抬高。",
    guangzhou_opera_house: "流动的形体让屏幕里的曲线真正落到现场。",
    fallingwater: "房子压在瀑布上，像一次和自然的正面谈判。",
    harvard_gsd: "楼梯、讨论和偶遇组成一所设计学院的日常。",
  };
  return briefs[node?.id] ?? "把建筑从图纸带回现场，重新看懂一次空间。";
}

function renderWanliRoadNode(node) {
  return `
    <span class="wanli-road-node is-${escapeHtml(node.status)}" role="listitem" aria-label="${escapeHtml(`第 ${node.index} 站：${node.title}`)}">
      <span class="wanli-road-node-dot" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS[node.iconKey] ?? UI_ICON_PATHS.wanli_road, node.title)}</span>
      <strong>${escapeHtml(String(node.index).padStart(2, "0"))}</strong>
      <em>${escapeHtml(node.title)}</em>
    </span>
  `;
}

function renderWanliRoadEventPage(wanliRoad, node) {
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card event-card wanli-road-event-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy">
          <p class="kicker">WANLI ROAD EVENT</p>
          <h2 id="ui-dialog-title">
            <span class="modal-title-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS[node.iconKey] ?? UI_ICON_PATHS.wanli_road, node.title)}</span>
            <span>${escapeHtml(node.title)}</span>
          </h2>
          <p>${escapeHtml(node.body)}</p>
          ${renderDeltaChips(node.delta, "wanli-road-event-delta")}
        </div>
        <div class="modal-options">
          <button class="modal-option event-option" type="button" data-command="ui-dialog" data-id="wanli_road">
            <strong>返回万里路地图</strong>
            <span>第 ${escapeHtml(node.index)} / ${escapeHtml(wanliRoad.total)} 站 · ¥${escapeHtml(node.cost)}</span>
          </button>
        </div>
      </section>
    </div>
  `;
}

function yearLabelFromRecord(record) {
  const year = {
    1: "大一",
    2: "大二",
    3: "大三",
    4: "大四",
    5: "大五",
  }[Number(record.year)] ?? `第 ${record.year} 年`;
  return `${year}${Number(record.term) === 2 ? "下" : "上"}`;
}

function renderCompetitionDialog(competition, requestedView = "") {
  const records = competition.records ?? [];
  const cards = competition.cards ?? [];
  const viewParts = requestedView.split("::");
  const isSubmitConfirmView = viewParts[0] === "confirm";
  const requestedCardId = isSubmitConfirmView ? viewParts[1] ?? "" : viewParts[0] ?? "";
  const requestedWorkId = isSubmitConfirmView ? viewParts[2] ?? "" : viewParts[1] ?? "";
  const selectedCard = cards.find((card) => card.id === requestedCardId) ?? null;
  const selectedWork = selectedCard?.availableWorks?.find((work) => work.id === requestedWorkId) ?? null;
  if (isSubmitConfirmView && selectedCard && selectedWork) {
    return renderCompetitionSubmitConfirmDialog(selectedCard, selectedWork);
  }
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card system-modal competition-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy competition-copy">
          <p class="kicker">COMPETITION</p>
          <h2 id="ui-dialog-title">竞赛投稿</h2>
          ${competition.suggested ? `<p>${escapeHtml(competition.suggested)}</p>` : ""}
        </div>
        <div class="competition-summary-grid" aria-label="竞赛状态">
          ${[
            ["可投稿作品", competition.sourceCount],
            ["本局投稿", competition.submissionCount],
            ["最高获奖档位", competition.highestAward],
            ["累计获奖", `${competition.awardCount} 次`],
          ].map(([label, value]) => `
            <div class="competition-stat">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join("")}
        </div>
        <div class="competition-rule-strip" aria-label="竞赛规则">
          <span>课程设计作业来源</span>
          <span>每学期最多投稿 1 次</span>
          <span>同一作品只能投 1 次</span>
        </div>
        ${renderCompetitionModeTabs(selectedCard)}
        <div class="competition-layout">
          <section class="competition-card-section" aria-label="赛事目录">
            ${selectedCard ? renderCompetitionSelectedView(selectedCard, competition, records) : `
              <div class="competition-card-grid" role="tablist" aria-label="赛事目录">
                ${cards.map((card) => renderCompetitionCard(card, false)).join("")}
              </div>
            `}
          </section>
        </div>
        <button class="pixel-button competition-return-button" type="button" data-command="${selectedCard ? "ui-dialog" : "close-ui-dialog"}" ${selectedCard ? `data-id="competition"` : ""}>${selectedCard ? "返回赛事目录" : "返回"}</button>
      </section>
    </div>
  `;
}

function renderCompetitionCard(card, selected = false) {
  const availabilityClass = card.availableWorks?.length
    ? "is-available"
    : card.blockKind === "semester_limit"
      ? "is-unavailable is-danger is-semester-limit"
      : ["属性未达标", "年级不符合"].includes(card.availabilityLabel)
      ? "is-unavailable is-danger"
      : "is-unavailable";
  return `
    <button class="competition-card ${selected ? "is-selected" : ""}" type="button" role="tab" aria-selected="${selected ? "true" : "false"}" data-command="ui-dialog" data-id="competition::${escapeHtml(card.id)}">
      <span class="competition-card-icon" aria-hidden="true">${renderUiIcon(competitionEventIconPath(card.id), card.name)}</span>
      <span class="competition-card-content">
        <span class="competition-card-head">
          <strong>${escapeHtml(card.name)}</strong>
          <span class="competition-card-meta">
            <span>${escapeHtml(card.type)}</span>
            ${card.availabilityLabel ? `<span class="${availabilityClass}">${escapeHtml(card.availabilityLabel)}</span>` : ""}
            ${card.yearLimitLabel ? `<span>${escapeHtml(card.yearLimitLabel)}</span>` : ""}
          </span>
        </span>
        <span class="competition-card-copy">
          <span class="competition-requirement-list">
            ${card.requirementLabels.map((requirement) => `<i>${escapeHtml(requirement)}</i>`).join("")}
          </span>
        </span>
      </span>
    </button>
  `;
}

function renderCompetitionSelectedView(card, competition, records = []) {
  const works = card.availableWorks ?? [];
  const blockedWorks = works.length ? [] : (card.blockedWorks ?? []);
  const visibleWorks = works.length ? works : blockedWorks;
  const blockedReason = card.blockReason ?? "请先满足该赛事门槛。";
  const blockedByNonRequirementLimit = ["semester_limit", "year_limit", "work_year_limit"].includes(card.blockKind);
  const disabledWorkLabel = card.blockKind === "semester_limit" ? "本学期已投" : blockedByNonRequirementLimit ? "" : "待达标";
  return `
    <div class="competition-selected-view">
      <div class="competition-selected-left">
        <div class="competition-selected-card-slot">
          ${renderCompetitionCard(card, true)}
        </div>
        <section class="competition-selected-intro" aria-label="赛事简介">
          <p>${escapeHtml(card.brief)}</p>
        </section>
        ${renderCompetitionRecordsView(records)}
      </div>
      <section class="competition-selected-panel" aria-labelledby="competition-selected-title">
        <div class="section-head compact">
          <h3 id="competition-selected-title">可投稿作品</h3>
          ${works.length ? `<span>${works.length} 件可投</span>` : blockedWorks.length && !blockedByNonRequirementLimit ? `<span>${blockedWorks.length} 件待达标</span>` : ""}
        </div>
        <div class="competition-work-area ${blockedWorks.length ? "has-work-alert" : ""}">
          ${blockedWorks.length ? `
            <article class="competition-work-alert" role="status">
              <span class="competition-work-alert-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.risk_alert, blockedByNonRequirementLimit ? "暂不可投递" : "赛事门槛未达标")}</span>
              <div>
                ${blockedByNonRequirementLimit ? "" : "<strong>赛事门槛未达标</strong>"}
                <p>${escapeHtml(blockedReason)}</p>
              </div>
            </article>
          ` : ""}
          <div class="competition-work-list">
            ${visibleWorks.length ? visibleWorks.map((work) => renderCompetitionWork(card, work, !works.length, disabledWorkLabel, card.blockKind)).join("") : `
              <article class="competition-empty-record competition-no-work-empty">
                <strong>目前没有符合条件的投稿作品</strong>
                <p>同学，你需要有一份评图 C 及以上课设设计作品，并满足该赛事的角色属性门槛，才能参加竞赛。</p>
              </article>
            `}
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderCompetitionModeTabs(selectedCard) {
  return `
    <div class="competition-mode-tabs" aria-label="竞赛导航">
      <button class="competition-mode-tab ${selectedCard ? "" : "is-active"}" type="button" data-command="ui-dialog" data-id="competition">赛事目录</button>
    </div>
  `;
}

function renderCompetitionWork(card, work, disabled = false, disabledLabel = "待达标", blockKind = "") {
  const actionAttrs = disabled
    ? `disabled aria-disabled="true" title="${escapeHtml(work.unavailableReason ?? "暂不可投递")}"`
    : `data-command="ui-dialog" data-id="competition::confirm::${escapeHtml(card.id)}::${escapeHtml(work.id)}"`;
  return `
    <button class="competition-work ${disabled ? "is-disabled" : ""} ${blockKind === "semester_limit" ? "is-semester-limit" : ""}" type="button" ${actionAttrs}>
      <strong>${escapeHtml(work.label)}</strong>
      <span>${escapeHtml(work.courseStage)} · 评图 ${escapeHtml(work.finalGrade)} · 作品分 ${escapeHtml(work.finalScore)}</span>
      ${disabled && !disabledLabel ? "" : `<em>${disabled ? escapeHtml(disabledLabel) : "可投稿"}</em>`}
    </button>
  `;
}

function renderCompetitionSubmitConfirmDialog(card, work) {
  return `
    <div class="modal-backdrop modal-backdrop-competition_submit_confirm" role="presentation">
      <section class="modal-card event-card competition-submit-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="competition-submit-confirm-title">
        <div class="modal-copy">
          <p class="kicker">COMPETITION</p>
          <h2 id="competition-submit-confirm-title">
            <span class="modal-title-icon" aria-hidden="true">${renderUiIcon(competitionEventIconPath(card.id), card.name)}</span>
            <span>确认投递</span>
          </h2>
          <p>你准备将「${escapeHtml(work.label)}」投递到「${escapeHtml(card.name)}」。</p>
          <p>${escapeHtml(work.courseStage)} · 评图 ${escapeHtml(work.finalGrade)} · 作品分 ${escapeHtml(work.finalScore)}</p>
        </div>
        <div class="modal-options">
          <button class="modal-option event-option competition-submit-confirm-button" type="button" data-command="competition-submit" data-id="${escapeHtml(`${card.id}::${work.id}`)}">
            <strong>确认投递</strong>
          </button>
          <button class="modal-option event-option competition-submit-cancel-button" type="button" data-command="ui-dialog" data-id="competition::${escapeHtml(card.id)}">
            <strong>我再想想</strong>
          </button>
        </div>
      </section>
    </div>
  `;
}

function renderPortfolioDialog(portfolio, requestedWork = "") {
  const works = portfolio.reviews ?? [];
  const selected = works.find((work) => work.id === requestedWork) ?? null;
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card system-modal portfolio-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy portfolio-copy has-top-action">
          <p class="kicker">PORTFOLIO</p>
          <h2 id="ui-dialog-title">个人作品集</h2>
          <button class="pixel-button portfolio-top-action" type="button" data-command="${selected ? "ui-dialog" : "close-ui-dialog"}" ${selected ? `data-id="portfolio_resume"` : ""}>${selected ? "返回作品集目录" : "返回"}</button>
          <p>只有 C / B / A / S 评级的课程设计会写入作品集；点击目录查看对应展板。</p>
        </div>
        <div class="portfolio-summary-grid" aria-label="作品集状态">
          ${[
            ["作品集总分", portfolio.score],
            ["已入库作品", works.length],
          ].map(([label, value]) => `
            <div class="portfolio-stat">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join("")}
        </div>
        <div class="portfolio-layout ${selected ? "" : "is-directory-only"}">
          <section class="portfolio-directory" aria-label="作品集目录">
            <div class="section-head compact"><h3>作品集目录</h3><span>${works.length}</span></div>
            <div class="portfolio-work-list">
              ${works.length ? works.map((work) => renderPortfolioWorkButton(work, selected?.id === work.id)).join("") : `
                <article class="portfolio-empty">
                  <strong>还没有正式入库的课程设计</strong>
                  <p>C / B / A / S 评级作品会在评图后进入这里。</p>
                </article>
              `}
            </div>
          </section>
          ${selected ? `<section class="portfolio-board-panel" aria-label="作品展板">${renderPortfolioBoard(selected)}</section>` : ""}
        </div>
      </section>
    </div>
  `;
}

function renderPortfolioWorkButton(work, selected = false) {
  return `
    <button class="portfolio-work-button ${selected ? "is-selected" : ""}" type="button" data-command="ui-dialog" data-id="portfolio_resume::${escapeHtml(work.id)}" aria-pressed="${selected ? "true" : "false"}">
      <strong>${escapeHtml(work.semesterLabel)} · ${escapeHtml(work.topic)}</strong>
      <span>${escapeHtml(work.courseStage)} · ${escapeHtml(work.finalGrade)} · 作品分 ${escapeHtml(work.finalScore)}</span>
    </button>
  `;
}

function renderPortfolioBoard(work) {
  return `
    <figure class="portfolio-board-figure">
      <img src="${assetSrc(work.boardImage)}" alt="${escapeHtml(`${work.semesterLabel} ${work.topic} 展板`)}" loading="eager" decoding="sync" fetchpriority="high" />
      <figcaption>
        <strong>${escapeHtml(work.semesterLabel)} · ${escapeHtml(work.topic)}</strong>
        <span>${escapeHtml(work.courseStage)} · ${escapeHtml(work.finalGrade)} · 作品分 ${escapeHtml(work.finalScore)}</span>
      </figcaption>
    </figure>
  `;
}

function renderResumeDialog({ profile = {}, calendar = {}, portfolio = {}, route = {}, internship = {}, competition = {}, attributes = [] } = {}) {
  const ieltsTaken = Boolean(route.ieltsExam?.hasTaken);
  const completedInternshipCount = (internship.records ?? []).length;
  const hasActiveInternship = Boolean(internship.activeInternship);
  const internshipValue = Number(internship.internshipValue ?? 0);
  const competitionAwards = Number(competition.awardCount ?? 0);
  const ieltsScoreLabel = ieltsTaken ? formatIeltsFactScore(route) : "未参与考试";
  const gradeLabel = calendar.semester ? `${calendar.semester}学期` : (profile.education ?? "未选择");
  const internshipStatusLabel = hasActiveInternship
    ? "进行中"
    : completedInternshipCount
      ? `${completedInternshipCount} 段实习经验`
      : "暂无记录";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card system-modal resume-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="resume-hero">
          <span class="resume-hero-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.resume, "个人简历")}</span>
          <div class="modal-copy resume-copy">
            <p class="kicker">RESUME</p>
            <h2 id="ui-dialog-title">个人简历</h2>
            <p>这里记录着你五年的图纸、经历和走过的路。</p>
          </div>
        </div>

        <div class="resume-layout">
          <section class="resume-profile-panel" aria-label="学历与个人数值属性">
            <dl class="resume-profile-facts">
              <div><dt>姓名</dt><dd>${escapeHtml(profile.nickname ?? "未命名")}</dd></div>
              <div><dt>大学</dt><dd>${escapeHtml(profile.universityName ?? "未填写大学")}</dd></div>
              <div><dt>年级</dt><dd>${escapeHtml(gradeLabel)}</dd></div>
            </dl>

            <section class="resume-attribute-panel" aria-label="个人数值属性">
              <div class="section-head compact"><h3>个人数值属性</h3></div>
              <div class="resume-attribute-grid">
                ${attributes.map((item) => `
                  <div class="resume-attribute-item">
                    <span class="resume-attribute-icon" aria-hidden="true">${renderUiIcon(ATTRIBUTE_ICONS[item.id], item.label)}</span>
                    <span class="resume-attribute-copy">
                      <span>${escapeHtml(item.label)}</span>
                      <strong>${escapeHtml(item.value)}</strong>
                    </span>
                  </div>
                `).join("")}
              </div>
            </section>
          </section>

          <section class="resume-portfolio-panel" aria-label="作品集">
            <div class="resume-portfolio-main">
              <span class="resume-portfolio-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.portfolio_resume, "个人作品集")}</span>
              <div>
                <div class="resume-portfolio-head"><span>PORTFOLIO</span><h3>个人作品集 <strong class="resume-card-primary">${escapeHtml(portfolio.score ?? 0)}</strong></h3></div>
              </div>
            </div>
            <button class="pixel-button resume-portfolio-button" type="button" data-command="ui-dialog" data-id="portfolio_resume">查看个人作品集</button>
          </section>

          <article class="resume-side-card resume-ielts-card">
            <span class="resume-status-media">
              <span class="resume-status-icon">${renderUiIcon(UI_ICON_PATHS.ielts, "雅思成绩")}</span>
              <span class="resume-status-copy">
                <span class="kicker">IELTS</span>
                <strong>雅思成绩：${escapeHtml(ieltsScoreLabel)}</strong>
              </span>
            </span>
          </article>

          <section class="resume-status-grid" aria-label="简历经历状态">
            <article class="resume-status-card">
              <span class="resume-status-media">
                <span class="resume-status-icon">${renderUiIcon(UI_ICON_PATHS.internship_work, "实习经历")}</span>
                <span class="resume-status-copy">
                <span class="kicker">INTERNSHIP</span>
                <strong>实习经历 <span class="resume-inline-stat">累计实习价值 ${escapeHtml(internshipValue)}</span></strong>
              </span>
              <em>${escapeHtml(internshipStatusLabel)}</em>
            </span>
            ${renderResumeInternshipRecords(internship)}
          </article>

            <article class="resume-status-card">
              <span class="resume-status-media">
                <span class="resume-status-icon">${renderUiIcon(UI_ICON_PATHS.competition, "竞赛投稿")}</span>
                <span class="resume-status-copy">
                <span class="kicker">COMPETITION</span>
                <strong>竞赛投稿</strong>
              </span>
              <em>${escapeHtml(competitionAwards ? `获奖 ${competitionAwards} 次 · 最高 ${competition.highestAward ?? "暂无"}` : "暂无获奖记录")}</em>
            </span>
            ${renderResumeCompetitionRecords(competition)}
          </article>
          </section>
        </div>

        <button class="pixel-button is-primary resume-return-button" type="button" data-command="close-ui-dialog">返回</button>
      </section>
    </div>
  `;
}

function renderResumeInternshipRecords(internship) {
  const records = internshipRecordEntries(internship, Number(internship?.internshipValue ?? 0));
  if (!records.length) return "";
  return `
    <div class="resume-experience-list" aria-label="简历实习经历">
      ${records.map((record, index) => `<article><b>${escapeHtml(String(index + 1).padStart(2, "0"))}</b><span>${escapeHtml(record)}</span></article>`).join("")}
    </div>
  `;
}

function renderResumeCompetitionRecords(competition) {
  const awardedRecords = (competition?.records ?? []).filter((record) => record.award && record.award !== "none");
  if (!awardedRecords.length) return "";
  return `
    <div class="resume-experience-list" aria-label="简历竞赛获奖记录">
      ${awardedRecords.map((record, index) => `
        <article>
          <b>${escapeHtml(String(index + 1).padStart(2, "0"))}</b>
          <span>
            <strong>${escapeHtml(record.workName)}</strong>
            <span>${escapeHtml(record.competitionName)} · ${escapeHtml(record.awardLabel)}</span>
          </span>
        </article>
      `).join("")}
    </div>
  `;
}

function renderCompetitionRecordsView(records) {
  return `
    <section class="competition-record-panel" aria-label="投稿记录">
      <div class="section-head compact competition-record-count"><h3>投稿记录</h3><span>${records.length}</span></div>
      <div class="competition-record-list">
        ${records.length ? records.map(renderCompetitionRecord).join("") : `
          <article class="competition-empty-record">
            <strong>暂无投稿记录</strong>
            <p>完成投稿后，这里会显示已投稿作品、对应赛事和当前结果。</p>
          </article>
        `}
      </div>
    </section>
  `;
}

function renderCompetitionRecord(record) {
  return `
    <article class="competition-record">
      <strong>${escapeHtml(record.workName)}</strong>
      <span>${escapeHtml(record.competitionName)}</span>
      <em>${escapeHtml(record.awardLabel)}${record.prizeMoney > 0 ? ` · ￥${escapeHtml(record.prizeMoney)}` : ""}</em>
    </article>
  `;
}

const PUBLIC_SERVICE_ROUTES = ["考公", "考编", "选调"];

const PUBLIC_SERVICE_DETAILS = {
  civil_national: {
    role: "住建部、自然资源部",
    description: "上岸天花板，笔试面试都得往死里卷。[[br]]进去了不画图，专写红头文件，偶尔批批别人画的总图。",
  },
  civil_province: {
    role: "文旅厅、城管局",
    description: "省城或市里的单位，比部委好考一点。[[br]]城管局可能需要你审批占道施工图，也算专业对口——毕竟你学过规划。",
  },
  civil_grassroots: {
    role: "乡镇街道普通科员",
    description: "乡镇街道的普通科员，离图纸很远，离百姓很近。[[br]]你的建筑学在这里最有用的是看懂违建和画明白村道。[[br]]你画的不是总图，是村民家门口的那条水泥路。",
  },
  public_teacher: {
    role: "中小学美术或职校建筑老师",
    description: "中小学美术或职校建筑老师，寒暑假是真的。[[br]]备课时偶尔会怀念专教的味道，但看着学生画的歪扭线条，[[br]]你笑了：像极了当年的自己。",
  },
  public_institution: {
    role: "事业单位综合岗",
    description: "稳定，压力小，晋升慢。[[br]]适合不想卷设计院又舍不得扔建筑本子的人。[[br]]办公室里唯一的建筑学知识，大概是给同事解释啥是剪力墙。",
  },
  public_admin: {
    role: "行政管理岗",
    description: "不用画图只管流程，对社恐不太友好，对社牛来说简直是天堂。[[br]]每天的工作就是催别人交材料——从被催的人变成了催人的。",
  },
  selected_transfer: {
    role: "生源地选调生",
    description: "回老家当公务员，但是难度可一点不比国考简单。",
  },
};

function renderPublicServiceDialog(route, view = "考公") {
  const requestedOptionId = view.startsWith("option::") ? view.slice("option::".length) : "";
  const allOptions = route.groups
    .flatMap((group) => group.options)
    .filter((option) => PUBLIC_SERVICE_ROUTES.includes(option.route));
  const selectedOption = allOptions.find((option) => option.id === requestedOptionId) ?? null;
  const activeRoute = selectedOption?.route ?? (PUBLIC_SERVICE_ROUTES.includes(view) ? view : "考公");
  const routeOptions = allOptions.filter((option) => option.route === activeRoute);
  const preOpenCopy = Number(route.year) < 5
    ? "这位同学你好，考公考编系统入口大五学年才会开放。<br /><span class=\"is-nowrap\">如果你有意报考，建议利用此前的学年做好备考准备，祝你一切顺利！</span>"
    : "";
  const facts = [
    ["当前年级", route.yearLabel ?? formatYearName(route.year)],
    ["GPA", route.gpaLabel],
  ];
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card system-modal public-service-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy">
          <p class="kicker">PUBLIC SERVICE</p>
          <h2 id="ui-dialog-title">考公考编</h2>
          ${preOpenCopy ? `<p class="public-service-preopen-copy">${preOpenCopy}</p>` : ""}
        </div>
        <dl class="system-facts route-facts public-service-facts">
          ${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>
        <div class="public-service-tabs" role="tablist" aria-label="考公考编方向">
          ${PUBLIC_SERVICE_ROUTES.map((item) => `
            <button class="public-service-tab ${item === activeRoute ? "is-active" : ""}" type="button" role="tab" aria-selected="${item === activeRoute ? "true" : "false"}" data-command="ui-dialog" data-id="public_service::${encodeURIComponent(item)}">${escapeHtml(item)}</button>
          `).join("")}
        </div>
        ${selectedOption ? renderPublicServiceDetail(selectedOption, Number(route.year) < 5) : renderPublicServiceJobList(routeOptions)}
        ${selectedOption ? `<button class="pixel-button" type="button" data-command="ui-dialog" data-id="public_service::${encodeURIComponent(selectedOption.route)}">返回目录</button>` : `<button class="pixel-button" type="button" data-command="close-ui-dialog">返回</button>`}
      </section>
    </div>
  `;
}

function renderPublicServiceJobList(options) {
  return `
    <section class="public-service-jobs" aria-label="岗位列表">
      ${options.map((option) => {
        const detail = PUBLIC_SERVICE_DETAILS[option.id] ?? {};
        const hideSubtitle = publicServiceHideSubtitle(option.id);
        return `
          <button class="public-service-job-card ${hideSubtitle ? "has-no-subtitle" : ""}" type="button" data-command="ui-dialog" data-id="public_service::option::${escapeHtml(option.id)}">
            <span class="public-service-job-icon" aria-hidden="true">${renderUiIcon(routeOptionIconPath(option.id), option.target)}</span>
            <span class="public-service-job-copy">
              <strong>${escapeHtml(option.target)}</strong>
              ${hideSubtitle ? "" : `<em>${escapeHtml(detail.role ?? option.target)}</em>`}
            </span>
          </button>
        `;
      }).join("")}
    </section>
  `;
}

function renderPublicServiceDetail(option, preOpen = false) {
  const detail = PUBLIC_SERVICE_DETAILS[option.id] ?? {};
  const disabled = preOpen || option.state !== "available";
  const selected = option.state === "selected";
  const buttonLabel = preOpen ? "暂未开放" : selected ? "已报考" : option.route === "选调" ? "报考选调" : `报考${option.route}`;
  const hideSubtitle = publicServiceHideSubtitle(option.id);
  const disabledReason = publicServiceDisabledReason(option.reason);
  return `
    <section class="public-service-detail" aria-label="${escapeHtml(option.target)}">
      <div class="public-service-detail-head ${hideSubtitle ? "has-no-subtitle" : ""}">
        <span class="public-service-detail-icon" aria-hidden="true">${renderUiIcon(routeOptionIconPath(option.id), option.target)}</span>
        <div>
          <span>${escapeHtml(option.route)}</span>
          <h3>${escapeHtml(option.target)}</h3>
          ${hideSubtitle ? "" : `<p>${escapeHtml(detail.role ?? option.target)}</p>`}
        </div>
        <div class="public-service-apply-stack">
          <button class="pixel-button is-primary public-service-apply-button" type="button" data-command="route-select" data-id="${escapeHtml(option.id)}" ${disabled ? "disabled" : ""}>
            <span aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.route_commit, buttonLabel)}</span>
            ${escapeHtml(buttonLabel)}
          </button>
          ${disabled && disabledReason ? `<p class="public-service-disabled-reason">${escapeHtml(disabledReason)}</p>` : ""}
        </div>
      </div>
      <div class="public-service-detail-body">
        <article>
          <h4>简介</h4>
          <p>${renderPublicServiceDescription(detail.description ?? routeOptionDescription(option))}</p>
        </article>
        <article>
          <h4>具体门槛</h4>
          <div class="public-service-requirements">
            ${option.requirements.map((item) => `<i>${escapeHtml(item)}</i>`).join("")}
          </div>
        </article>
      </div>
    </section>
  `;
}

function publicServiceHideSubtitle(optionId) {
  return ["public_institution", "public_admin", "selected_transfer"].includes(optionId);
}

function publicServiceDisabledReason(reason = "") {
  return reason === "大五上第 1 周起开放正式参与" ? "" : reason;
}

function renderPublicServiceDescription(value) {
  return escapeHtml(value).replaceAll("[[br]]", "<br />");
}

function renderRouteDialog(route, focus = null) {
  const participation = route.participation;
  const optionsOnly = Boolean(focus?.optionsOnly);
  const routeParticipationBadge = renderRouteParticipationTitleBadge(participation, focus);
  const routeModalClasses = String(focus?.modalClass ?? "").split(/\s+/);
  const isOverseasRouteModal = routeModalClasses.includes("overseas-route-modal");
  const isCareerChangeRouteModal = routeModalClasses.includes("career-change-modal");
  const isAcademicRouteModal = routeModalClasses.includes("academic-route-modal") && !isOverseasRouteModal;
  const isStyledStudyRouteModal = isAcademicRouteModal || isOverseasRouteModal;
  const showPreOpenBody = isStyledStudyRouteModal && Number(route.year) < 5 && focus?.preOpenBody;
  const activeOverseasTier = isOverseasRouteModal ? normalizeOverseasTier(focus?.activeTier) : "";
  const groups = focus?.routes
    ? route.groups
        .map((group) => ({
          ...group,
          options: sortRouteOptionsForDisplay(group.options
            .filter((option) => focus.routes.includes(option.route))
            .filter((option) => !activeOverseasTier || overseasTierForOption(option) === activeOverseasTier)),
        }))
        .filter((group) => group.options.length > 0)
    : route.groups;
  const facts = [
    ["当前年级", route.yearLabel ?? formatYearName(route.year)],
    ["GPA", route.gpaLabel],
    ["作品集总分", route.portfolio],
    ...(isAcademicRouteModal ? [] : [
      ["雅思", formatIeltsFactScore(route)],
    ]),
    ...(isStyledStudyRouteModal ? [] : [
      ["竞赛获奖", route.competitionAwardCount],
    ]),
    ...(focus?.facts ?? []),
  ];
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card system-modal ${optionsOnly ? "route-options-only-modal" : ""} ${escapeHtml(focus?.modalClass ?? "")}" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        ${isCareerChangeRouteModal ? `<button class="pixel-button career-route-close-button" type="button" data-command="close-ui-dialog">返回</button>` : ""}
        ${optionsOnly ? `
          <div class="modal-copy route-options-only-copy">
            <p class="kicker">${escapeHtml(focus?.kicker ?? "ROUTE")}</p>
            <h2 id="ui-dialog-title">${escapeHtml(focus?.title ?? "毕业路线")}${routeParticipationBadge}</h2>
            ${showPreOpenBody ? `<p class="academic-route-preopen-copy">${renderInlineBreakText(focus.preOpenBody)}</p>` : ""}
          </div>
        ` : `
          <div class="modal-copy">
            <p class="kicker">${escapeHtml(focus?.kicker ?? "ROUTE")}</p>
            <h2 id="ui-dialog-title">${escapeHtml(focus?.title ?? "毕业路线")}${routeParticipationBadge}</h2>
            ${showPreOpenBody ? `<p class="academic-route-preopen-copy">${renderInlineBreakText(focus.preOpenBody)}</p>` : ""}
            ${!isStyledStudyRouteModal ? `<p>${participation ? `已正式参与「${escapeHtml(participation.label)}」，最终只读取该路线结果。` : escapeHtml(focus?.body ?? "大五上第 1 周起可正式参与 1 条后期路线；未正式参与时只按状态毕业结局读取。")}</p>` : ""}
          </div>
        `}
        ${!optionsOnly && isOverseasRouteModal ? renderIeltsRegistrationEntry(route) : ""}
        ${optionsOnly ? "" : `<dl class="system-facts route-facts">
          ${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>`}
        ${!optionsOnly && focus?.notes?.length ? `
          <div class="system-notes route-entry-notes">
            ${focus.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}
          </div>
        ` : ""}
        ${isOverseasRouteModal ? renderOverseasTierTabs(activeOverseasTier) : ""}
        <div class="route-groups ${optionsOnly ? "route-groups-options-only" : ""}">
          ${groups.map((group) => renderRouteGroup(group, {
            hideHead: optionsOnly,
            hideProcessNote: optionsOnly || isStyledStudyRouteModal,
            hideActionLabel: isStyledStudyRouteModal,
            inlineTitle: isStyledStudyRouteModal,
            hideRouteRequirements: isAcademicRouteModal ? academicHiddenRouteRequirement : null,
          })).join("")}
        </div>
        ${isCareerChangeRouteModal ? "" : `<button class="pixel-button" type="button" data-command="close-ui-dialog">返回</button>`}
      </section>
    </div>
  `;
}

function renderRouteParticipationTitleBadge(participation, focus = null) {
  if (!participation?.label || !focus?.routes?.length) return "";
  const supportedRoutes = ["考研", "保研", "留学", "转行"];
  if (!focus.routes.some((route) => supportedRoutes.includes(route))) return "";
  const isCurrentRoute = focus.routes.includes(participation.route);
  const badgeClass = isCurrentRoute ? "is-current" : "is-other";
  return `<span class="route-participation-title-badge ${badgeClass}">已正式参与${escapeHtml(participation.label)}</span>`;
}

function renderIeltsRegistrationEntry(route) {
  return `
    <button class="overseas-ielts-entry" type="button" data-command="ui-dialog" data-id="ielts_registration" aria-label="进入雅思报考页面">
      <span class="overseas-ielts-entry-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.ielts, "雅思报考")}</span>
      <span class="overseas-ielts-entry-copy">
        <strong>雅思报考入口</strong>
        <em>IELTS REGISTRATION</em>
      </span>
      <span class="inline-pixel-arrow" aria-hidden="true"></span>
    </button>
  `;
}

function renderIeltsRegistrationDialog(route) {
  const exam = route?.ieltsExam ?? {};
  const startDisabled = !exam.canTake;
  const reasonClass = exam.takenThisSemester ? " is-danger" : "";
  const actionReason = exam.takenThisSemester ? "本学期已经参加过雅思考试" : "";
  const scoreReadValue = exam.hasTaken ? formatIeltsRegistrationScore(route?.ieltsScore) : "保留最高分";
  const cards = [
    ...IELTS_REGISTRATION_CARDS,
    ["成绩读取", scoreReadValue, ""],
  ];

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card system-modal academic-route-modal ielts-registration-modal" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="ielts-registration-hero">
          <span class="ielts-registration-hero-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.ielts, "雅思报考")}</span>
          <div class="modal-copy">
            <p class="kicker">IELTS REGISTRATION</p>
            <h2 id="ui-dialog-title">雅思报考</h2>
            <p>如果你有出国留学的打算，建议尽早规划考试时间，预留充足的备考周期。<br />雅思成绩是海外院校申请的通行证，也是你走向世界的第一步。</p>
          </div>
        </div>

        <div class="ielts-registration-grid" aria-label="雅思报考规则">
          ${cards.map(([label, value, detail]) => `
            <article class="ielts-registration-card">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
              ${detail ? `<em>${escapeHtml(detail)}</em>` : ""}
            </article>
          `).join("")}
        </div>

        <div class="ielts-registration-actions">
          <button class="pixel-button is-primary" type="button" data-command="start-ielts-exam" ${startDisabled ? "disabled" : ""}>开始雅思考试</button>
          <button class="pixel-button" type="button" data-command="ui-dialog" data-id="overseas_study">返回出国留学目录</button>
          <button class="pixel-button" type="button" data-command="close-ui-dialog">关闭</button>
          ${actionReason ? `<em class="ielts-exam-action-reason${reasonClass}">${escapeHtml(actionReason)}</em>` : ""}
        </div>
      </section>
    </div>
  `;
}

function formatIeltsRegistrationScore(score) {
  const value = Number(score) || 0;
  return value > 0 ? `雅思${value.toFixed(1)}` : "雅思低于6.0";
}

function formatIeltsFactScore(route) {
  if (!route?.ieltsExam?.hasTaken) return "未参与考试";
  const value = Number(route?.ieltsScore) || 0;
  return value > 0 ? value.toFixed(1) : "低于6.0";
}

function renderInlineBreakText(value) {
  return String(value ?? "")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const noWrapClass = line.startsWith("如果你决定走这条路") || line.startsWith("如果你有意申请海外院校") || line.startsWith("无论答案是什么") ? " is-nowrap" : "";
      return `<span class="preopen-line${noWrapClass}">${escapeHtml(line)}</span>`;
    })
    .join("<br />");
}

function academicHiddenRouteRequirement(item) {
  return /雅思|竞赛获奖/u.test(String(item ?? ""));
}

function normalizeOverseasTier(value) {
  const tier = String(value ?? "s").toLowerCase();
  return ["s", "a", "b", "c"].includes(tier) ? tier : "s";
}

function overseasTierForOption(option) {
  return String(option?.overseas?.tier ?? option?.target ?? "").slice(0, 1).toLowerCase();
}

function renderOverseasTierTabs(activeTier) {
  const tiers = [
    ["s", "S档：全球殿堂"],
    ["a", "A档：顶尖强校"],
    ["b", "B档：稳妥名校"],
    ["c", "C档：成功保底"],
  ];
  return `
    <div class="overseas-tier-tabs" role="tablist" aria-label="留学档位">
      ${tiers.map(([tier, label]) => `
        <button class="overseas-tier-tab ${tier === activeTier ? "is-active" : ""}" type="button" role="tab" aria-selected="${tier === activeTier ? "true" : "false"}" data-command="ui-dialog" data-id="overseas_study::${tier}">
          ${escapeHtml(label)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderRouteGroup(group, options = {}) {
  return `
    <section class="route-group">
      ${options.hideHead ? "" : `<div class="section-head compact"><h3>${escapeHtml(group.name)}</h3><span>${group.options.length}</span></div>`}
      <div class="route-option-grid">
        ${group.options.map((option) => renderRouteOption(option, options)).join("")}
      </div>
    </section>
  `;
}

function renderSpecialSkillConfirmDialog(vm) {
  const skillTitle = vm.profile.skillName || vm.specialSkillAction.label.replace(/^专属技能：/u, "");
  const confirmLabel = specialSkillConfirmLabel(vm.profile.characterId);
  const icon = CHARACTER_SKILL_ICONS[vm.profile.characterId] ?? ACTION_ICONS.special_skill;
  const bornLuckyClass = vm.profile.characterId === "born_lucky" ? " is-born-lucky-skill" : "";
  const parentRescueClass = ["gene_rebel", "corbusier_heir"].includes(vm.profile.characterId) ? " is-parent-rescue-skill" : "";
  const skillDescription = [vm.profile.characterName, vm.profile.skillText || vm.specialSkillAction.preview || ""]
    .filter(Boolean)
    .join(" · ");
  return `
    <div class="modal-backdrop special-skill-backdrop" role="presentation">
      <section class="modal-card system-modal special-skill-confirm-modal${bornLuckyClass}${parentRescueClass}" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <button class="icon-button special-skill-close" type="button" data-command="close-ui-dialog" aria-label="取消释放专属技能">
          ${renderUiIcon(UI_ICON_PATHS.close, "关闭")}
        </button>
        <div class="special-skill-confirm-layout">
          <span class="special-skill-confirm-icon" aria-hidden="true">${renderUiIcon(icon, skillTitle)}</span>
          <div class="modal-copy">
            <p class="kicker">SPECIAL SKILL</p>
            <div class="special-skill-title-row">
              <h2 id="ui-dialog-title">${escapeHtml(skillTitle)}</h2>
              <small>技能使用后，冷却 10 周</small>
            </div>
            <p class="special-skill-confirm-desc">${renderOptionBodyText(skillDescription)}</p>
          </div>
        </div>
        <button class="pixel-button is-primary special-skill-confirm-button" type="button" data-command="confirm-special-skill">${escapeHtml(confirmLabel)}</button>
      </section>
    </div>
  `;
}

function specialSkillConfirmLabel(characterId) {
  return {
    ordinary_person: "别紧张，放松",
    mixed_in: "我开摆了",
    pressure_immune: "直接开睡",
    design_enabler: "柯布西耶，请赐予我力量！",
    poor_scholar: "我开挂了",
    full_pressure: "红眼模式，启动！",
    future_boss: "不就是钱吗？",
    born_lucky: "丫够燥的！",
    gene_rebel: "救命！",
    town_exam_ace: "我是学霸，懂吗？",
    corbusier_heir: "救命！",
  }[characterId] ?? "释放专属技能";
}

function renderInternshipWorkDialog(route, internship, view = "internship") {
  const [mode = "internship", selectedId = ""] = String(view || "internship").split("::");
  const activeMode = mode === "work" ? "work" : "internship";
  const workLocked = activeMode === "work" && Number(route.year) < 5;
  const internshipLocked = activeMode === "internship" && Number(route.year) < 2;
  const jobs = architectureJobOptions(route).map((option) => activeMode === "internship"
    ? internshipJobOption(option, internship, internshipLocked)
    : option);
  const selected = jobs.find((option) => option.id === selectedId) ?? null;
  const optionLocked = activeMode === "internship" ? internshipLocked : workLocked;
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card system-modal internship-work-modal ${selected ? "has-job-detail" : ""} ${workLocked ? "is-work-locked" : ""} ${internshipLocked ? "is-internship-locked" : ""}" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy internship-work-copy">
          <p class="kicker">INTERNSHIP / WORK</p>
          <h2 id="ui-dialog-title">实习与工作</h2>
          ${internshipLocked ? `<p class="internship-work-lock-copy">同学你好，实习入口大二学年才会开放。<br />在此之前，请好好上课、好好画图、好好睡觉——当然最后一条可能做不到。</p>` : ""}
          ${activeMode === "work" && workLocked ? `<p class="internship-work-lock-copy">这位同学你好，工作的系统入口大五学年才会开启。<br /><span class="is-nowrap">在此之前，你可以多多尝试相关的实习工作，祝你在专教的每一个夜晚都不被辜负！</span></p>` : ""}
        </div>
        <nav class="internship-work-tabs" aria-label="实习与工作导航">
          ${renderInternshipWorkTab("internship", "关于实习", activeMode)}
          ${renderInternshipWorkTab("work", "关于工作", activeMode)}
        </nav>
        <div class="internship-work-stage ${selected ? "has-detail" : ""} is-${escapeHtml(activeMode)}">
          <section class="internship-job-directory" aria-label="建筑相关岗位池">
            <div class="internship-job-grid">
              ${jobs.map((option) => renderInternshipJobCard(option, activeMode, selected?.id === option.id, optionLocked)).join("")}
            </div>
            ${activeMode === "work" && selected ? renderWorkReflectionPanel() : ""}
            ${activeMode === "internship" ? renderInternshipRecordPanel(internship) : ""}
          </section>
          ${selected ? renderInternshipJobDetail(selected, activeMode, optionLocked) : ""}
        </div>
        <button class="pixel-button" type="button" data-command="close-ui-dialog">返回</button>
      </section>
    </div>
  `;
}

function renderWorkReflectionPanel() {
  return `
    <article class="work-reflection-panel" aria-label="工作选择提醒">
      <p>你还记得那个站在建院门口晒着太阳，觉得自己能改变世界的自己吗？
现在你面前的工作选项，是为了让他不再失望，还是为了让他看清现实？
选之前，先问他一句：如果你是我，你会怎么选？</p>
    </article>
  `;
}

function renderInternshipWorkTab(mode, label, activeMode) {
  return `
    <button class="internship-work-tab ${activeMode === mode ? "is-active" : ""}" type="button" data-command="ui-dialog" data-id="internship_work::${mode}" aria-pressed="${activeMode === mode ? "true" : "false"}">
      ${escapeHtml(label)}
    </button>
  `;
}

function architectureJobOptions(route) {
  return (route.groups ?? [])
    .flatMap((group) => group.options ?? [])
    .filter((option) => option.route === "建筑工作");
}

function internshipJobOption(option, internship, locked = false) {
  const config = ARCHITECTURE_INTERNSHIP_OPTIONS[option.id];
  if (!config) {
    return {
      ...option,
      requirements: ["实习配置缺失"],
      state: "disabled",
      reason: "实习配置缺失",
    };
  }

  const missing = internshipMissingRequirements(internship, config, option);
  const tierLabel = INTERNSHIP_TIER_LABELS[config.tier] ?? config.tier;
  return {
    ...option,
    requirements: internshipRequirementLabels(config, internship),
    internshipTier: config.tier,
    internshipTierLabel: tierLabel,
    internshipValueLabel: `实习价值+${config.value}`,
    internshipDescription: config.description,
    internshipReward: internshipRewardLabel(config),
    state: locked || missing.length ? "disabled" : "available",
    reason: locked ? "大二学年开启实习入口" : missing.join("；"),
  };
}

function internshipRewardLabel(config) {
  const weeklyDelta = INTERNSHIP_WEEKLY_DELTAS[config.tier] ?? {};
  const completionDelta = INTERNSHIP_COMPLETION_DELTAS[config.tier] ?? {};
  const weekly = formatDelta(weeklyDelta);
  const completion = formatDelta({ ...completionDelta, internshipValue: config.value });
  return `每周：${weekly || "无数值变化"}。\n结束：${completion || "无数值变化"}。`;
}

function internshipRequirementLabels(config, internship) {
  const items = [];
  for (const [key, value] of Object.entries(config.requirements?.attributes ?? {})) {
    items.push(`${ATTRIBUTE_LABELS[key] ?? key} >= ${adjustedInternshipRequirementValue(value, internship)}`);
  }
  return items;
}

function internshipMissingRequirements(internship, config, option = {}) {
  const missing = [];
  const tierRule = INTERNSHIP_APPLICATION.tiers[config.tier];
  if (internship?.activeInternship) {
    missing.push("已有进行中的实习");
  }
  if ((internship?.energy ?? 100) < 30) {
    missing.push("精力高危，先恢复精力再申请实习");
  }
  if ((internship?.appliedSemesters ?? []).includes(internship?.semesterIndex)) {
    missing.push("本学期已申请过实习");
  }
  if (hasCompletedInternshipOption(internship, option)) {
    missing.push("已完成该单位实习");
  }
  if (tierRule) {
    if (internshipApplicationCountForTier(internship, config.tier) >= tierRule.maxAttempts) {
      missing.push("该档位申请次数已达上限");
    }
  }
  for (const [key, value] of Object.entries(config.requirements?.attributes ?? {})) {
    const threshold = adjustedInternshipRequirementValue(value, internship);
    if ((internship?.[key] ?? 0) < threshold) {
      missing.push(`${ATTRIBUTE_LABELS[key] ?? key}需要 ${threshold}`);
    }
  }
  return missing.filter(Boolean);
}

function adjustedInternshipRequirementValue(value, internship) {
  return Math.max(0, Number(value) + Number(internship?.thresholdAdjustment ?? 0));
}

function hasCompletedInternshipOption(internship, option) {
  const label = String(option?.target ?? option?.label ?? "").trim();
  return (internship?.records ?? []).some((record) => (
    record?.targetId === option?.id
    || String(record?.targetLabel ?? record?.target ?? "").trim() === label
  ));
}

function internshipApplicationCountForTier(internship, tier) {
  return (internship?.applications ?? []).filter((application) => application?.tier === tier).length;
}

function renderInternshipJobCard(option, mode, selected = false, locked = false) {
  return `
    <button class="internship-job-card ${selected ? "is-selected" : ""} ${locked ? "is-locked" : ""}" type="button" data-command="ui-dialog" data-id="internship_work::${mode}::${escapeHtml(option.id)}" aria-pressed="${selected ? "true" : "false"}" ${locked ? "disabled" : ""}>
      <span class="internship-job-icon" aria-hidden="true">${renderUiIcon(mode === "internship" ? routeOptionIconPath(option.id) : internshipWorkIconPath(option.id), option.target)}</span>
      <strong>${escapeHtml(option.target)}</strong>
      ${mode === "internship" && option.internshipTierLabel ? `<span class="internship-job-tier">${escapeHtml(option.internshipTierLabel)}</span>` : ""}
    </button>
  `;
}

function renderInternshipRecordPanel(internship) {
  const internshipValue = Number(internship?.internshipValue ?? 0);
  const active = internship?.activeInternship ?? null;
  const hasRecord = internshipValue > 0;
  const internshipValueLabel = hasRecord ? `+${internshipValue}` : "0";
  const body = hasRecord || active ? "" : "暂时没有实习记录。";
  const records = internshipRecordEntries(internship, internshipValue);

  return `
    <section class="internship-record-panel" aria-label="实习记录">
      <div class="internship-record-head">
        <span class="internship-record-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.internship_work, "实习记录")}</span>
        <div>
          <p class="kicker">INTERNSHIP LOG</p>
          <div class="internship-record-title-row">
            <h3>实习记录</h3>
            <strong>累计实习价值：${escapeHtml(internshipValueLabel)}</strong>
          </div>
        </div>
      </div>
      ${active ? `<div class="internship-record-list"><article class="is-active"><span>${escapeHtml(active.targetLabel ?? "建筑相关岗位")}实习，剩余 ${escapeHtml(String(active.remainingWeeks ?? 0))} 周</span><b>进行中</b></article></div>` : ""}
      ${records.length ? `<div class="internship-record-list">${records.map((record, index) => `<article><b>${index + 1}</b><span>${escapeHtml(record)}</span></article>`).join("")}</div>` : ""}
      ${body ? `<p class="${hasRecord ? "" : "internship-record-empty"}">${escapeHtml(body)}</p>` : ""}
      ${hasRecord || active ? "" : `<p class="internship-record-advice">建议先提升软件和设计能力，再申请实习。</p>`}
    </section>
  `;
}

function internshipRecordEntries(internship, internshipValue) {
  const records = Array.isArray(internship?.records) ? internship.records : [];
  if (!records.length && internshipValue > 0) {
    return ["在本局此前学期，参与建筑相关岗位的实习"];
  }
  return records.map((record) => {
    const semester = internshipSemesterLabel(record);
    const target = String(record?.target ?? "建筑相关岗位").trim().replace(/实习$/u, "") || "建筑相关岗位";
    return `在${semester}，参与${target}的实习`;
  });
}

function internshipSemesterLabel(record) {
  const year = Number(record?.year) || Math.ceil((Number(record?.semesterIndex) || 1) / 2);
  const term = Number(record?.term) || ((Number(record?.semesterIndex) || 1) % 2 === 1 ? 1 : 2);
  const labels = ["零", "一", "二", "三", "四", "五"];
  return `大${labels[year] ?? year}${term === 1 ? "上" : "下"}学期`;
}

function renderInternshipJobDetail(option, mode, locked = false) {
  const disabled = locked || option.state !== "available";
  const requirements = option.requirements.filter((item) => !String(item).includes("开放正式参与"));
  const description = mode === "internship"
    ? option.internshipDescription ?? routeOptionDescription(option)
    : routeOptionDescription(option);
  const reason = locked
    ? mode === "internship"
      ? "大二学年开启实习入口"
      : "大五学年开启工作投递"
    : option.reason;
  return `
    <section class="internship-job-detail ${mode === "internship" ? "is-internship-detail" : "is-work-detail"}" aria-label="岗位详情">
      <div class="internship-job-detail-head">
        <span class="internship-job-detail-icon" aria-hidden="true">${renderUiIcon(mode === "internship" ? routeOptionIconPath(option.id) : internshipWorkIconPath(option.id), option.target)}</span>
        <div>
          <p class="kicker">${mode === "work" ? "WORK POSITION" : "INTERNSHIP POSITION"}</p>
          <h3>${escapeHtml(option.target)}</h3>
          ${mode === "internship" && option.internshipTierLabel ? `
            <span class="internship-detail-tags">
              <span class="internship-detail-tier">${escapeHtml(option.internshipTierLabel)}</span>
              <span class="internship-detail-value">${escapeHtml(option.internshipValueLabel ?? "")}</span>
            </span>
          ` : ""}
        </div>
      </div>
      <p>${escapeHtml(description)}</p>
      <div class="internship-job-requirements">
        <strong>具体门槛</strong>
        <span class="route-requirements">${requirements.map((item) => `<i>${escapeHtml(item)}</i>`).join("")}</span>
      </div>
      ${mode === "internship" ? `
        <div class="internship-job-reward">
          <strong>回报</strong>
          <span>${renderOptionBodyText(option.internshipReward ?? "")}</span>
        </div>
      ` : ""}
      ${mode === "work" ? renderWorkSubmitButton(option, disabled, reason) : renderInternshipEligibilityStatus(option, disabled, reason)}
    </section>
  `;
}

function renderWorkSubmitButton(option, disabled, reason) {
  return `
    <button class="pixel-button internship-submit-button" type="button" data-command="route-select" data-id="${escapeHtml(option.id)}" ${disabled ? "disabled" : ""}>
      <span class="internship-submit-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.resume_submit_confirm, "简历投递确认")}</span>
      <span class="internship-submit-text">投递简历</span>
    </button>
    ${disabled && reason ? `<em class="internship-submit-reason">${escapeHtml(reason)}</em>` : ""}
  `;
}

function renderInternshipEligibilityStatus(option, disabled, reason) {
  const completed = disabled && String(reason ?? "").split("；").includes("已完成该单位实习");
  if (completed) {
    return `
      <div class="internship-submit-status internship-submit-button is-disabled" role="status">
        <span class="internship-submit-text">已完成该单位实习</span>
      </div>
    `;
  }
  return `
    <button class="pixel-button internship-submit-button internship-eligibility-button ${disabled ? "is-disabled" : "is-ready"}" type="button" ${disabled ? "disabled" : `data-command="internship-apply" data-id="${escapeHtml(option.id)}"`}>
      ${disabled ? "" : `<span class="internship-submit-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.internship_apply, "实习申请")}</span>`}
      <span class="internship-submit-text">${disabled ? "未达到实习门槛" : "申请实习"}</span>
    </button>
    ${disabled && reason ? `<em class="internship-submit-reason">${escapeHtml(reason)}</em>` : ""}
  `;
}

function sortRouteOptionsForDisplay(options) {
  const overseasOrder = new Map([
    "overseas_mit",
    "overseas_gsd",
    "overseas_eth",
    "overseas_ucl",
    "overseas_aa",
    "overseas_cornell",
    "overseas_columbia",
    "overseas_upenn",
    "overseas_tud",
    "overseas_nus",
    "overseas_hku",
    "overseas_risd",
    "overseas_melbourne",
    "overseas_sheffield",
    "overseas_msa",
    "overseas_polimi",
  ].map((id, index) => [id, index]));
  if (options.some((option) => overseasOrder.has(option.id))) {
    return [...options].sort((a, b) => (overseasOrder.get(a.id) ?? 999) - (overseasOrder.get(b.id) ?? 999));
  }
  const priority = new Map([
    ["梦中情校", 0],
    ["建筑老八校 / 其他 985", 1],
    ["建筑老八校 / 其他 985、211", 1],
    ["本校 / 211", 2],
    ["普通一本院校", 2],
    ["全球殿堂", 0],
    ["顶尖强校", 1],
    ["稳妥名校", 2],
    ["成功保底", 3],
  ]);
  return [...options].sort((a, b) => (priority.get(a.target) ?? 99) - (priority.get(b.target) ?? 99));
}

function renderRouteOption(option, options = {}) {
  const disabled = option.state !== "available";
  const selected = option.state === "selected";
  const label = selected ? "已正式参与" : disabled ? "不可选择" : "正式参与";
  const description = routeOptionDescription(option);
  const visibleRequirements = typeof options.hideRouteRequirements === "function"
    ? option.requirements.filter((item) => !options.hideRouteRequirements(item))
    : option.requirements;
  const iconLabel = option.route === "转行" ? option.target : `${option.route} · ${option.target}`;
  const iconMarkup = `<span class="route-option-icon" aria-hidden="true">${renderUiIcon(routeOptionIconPath(option.id), iconLabel)}</span>`;
  const titleMarkup = `<strong>${renderRouteOptionTitle(option, options.inlineTitle)}</strong>`;
  const descriptionMarkup = options.inlineTitle ? renderRouteOptionDescription(description, {
    preserveLeadPunctuation: option.route === "转行",
    breakDetailAtFirstComma: Boolean(option?.overseas),
  }) : escapeHtml(description);
  return `
    <button class="modal-option route-option option-${escapeHtml(option.state)}" type="button" data-command="route-select" data-id="${escapeHtml(option.id)}" ${disabled ? "disabled" : ""}>
      ${options.inlineTitle ? `<span class="route-option-title-row">${iconMarkup}${titleMarkup}</span>` : iconMarkup}
      <span class="route-option-copy">
        ${options.inlineTitle ? "" : titleMarkup}
        ${description ? `<span class="route-option-description">${descriptionMarkup}</span>` : ""}
        <span class="route-requirements">${visibleRequirements.map((item) => `<i>${escapeHtml(item)}</i>`).join("")}</span>
        ${options.hideProcessNote ? "" : `<span>${escapeHtml(option.processNote)}</span>`}
        ${options.hideActionLabel ? "" : `<em>${escapeHtml(option.reason || label)}</em>`}
      </span>
    </button>
  `;
}

function renderRouteOptionTitle(option, multiline = false) {
  if (option?.overseas) {
    const title = String(option.target ?? "");
    const match = title.match(/^(.+?)\s*\((.+)\)$/u);
    if (!match) {
      return escapeHtml(title);
    }
    return `${escapeHtml(match[1].trim())}<span class="route-option-title-translation">${escapeHtml(match[2].trim())}</span>`;
  }
  const title = `${option.route} · ${option.target}`;
  if (!multiline) {
    return escapeHtml(title);
  }
  if (option.route === "转行") {
    return escapeHtml(option.target);
  }
  return escapeHtml(title)
    .replace("建筑老八校 / 其他 985、211", "建筑老八校 /<br />其他 985、211")
    .replace("建筑老八校 / 其他 985", "建筑老八校 /<br />其他 985");
}

function renderRouteOptionDescription(description, options = {}) {
  const text = String(description ?? "");
  const splitAt = text.indexOf("。");
  if (splitAt < 0 || splitAt === text.length - 1) {
    return escapeHtml(text);
  }
  const lead = text.slice(0, options.preserveLeadPunctuation ? splitAt + 1 : splitAt);
  const detail = text.slice(splitAt + 1).trim();
  const commaAt = detail.indexOf("，");
  const detailMarkup = options.breakDetailAtFirstComma && commaAt >= 0 && commaAt < detail.length - 1
    ? `${escapeHtml(detail.slice(0, commaAt + 1))}<br />${escapeHtml(detail.slice(commaAt + 1).trim())}`
    : escapeHtml(detail);
  return `${escapeHtml(lead)}<br /><span class="route-option-description-detail">${detailMarkup}</span>`;
}

function routeOptionDescription(option) {
  if (option?.overseas) {
    const tierLabel = String(option.overseas.tierLabel ?? "").replace(/^[SABC]\s*档\s*/u, "");
    return `${tierLabel} / ${option.overseas.countryRegion}。${option.overseas.description}`;
  }
  const descriptions = {
    recommendation_dream: "清华 / 同济 / 东南。建筑学殿堂级院校，你不能有任何失误。",
    recommendation_old_eight: "建筑老八校 / 其他 985。过程很困难，但上岸了就是半个大师。",
    recommendation_local: "本校 / 211。画图不用太拼命，但也别想躺着过。",
    postgrad_dream: "清华 / 同济 / 东南 / 天大。建筑学殿堂级院校，你不能有任何失误。",
    postgrad_old_eight: "建筑老八校 / 其他 985、211。老八校的图纸厚得像砖头，985的分数线高得像悬挑。",
    postgrad_normal: "普通一本院校。没那么多光环，也没那么多压力。",
    architecture_master: "工位隔壁可能是某国留学生，项目动不动就上杂志。\n加班到凌晨是常态，但拿到的工资条和你的黑眼圈成正比。\n值不值？看你想不想在方案落款留下自己名字。",
    architecture_foreign: "工位在CBD写字楼的三十层，落地窗外是整座城市的天际线。\n图纸上标注从毫米换成英寸，你每天用三种语言的邮件沟通方案，\n时差让你习惯了凌晨两点和欧洲连线。",
    architecture_state: "天花板级别的上岸，笔试面试都得卷。\n福利好，活儿也重，画不完的施工图和改不完的节点。\n你问为什么叫“国企”？因为连加班都是体制内的味道。",
    architecture_local: "在家乡省份的画图工，项目不酷但能落地。\n工资够活，加班常态，优点是爸妈觉得你“进国企了”。",
    architecture_small: "老板可能就是你的学长，项目小而杂，住宅、民宿、小商店都接。\n累了没人管，赚了大家一起分——当然大部分时间是不赚的。",
    career_ai_pm: "你的设计对象从建筑变成了 AI Agent 的工作流，\n在 Vibe Coding 时代，你依然是设计师，\n只不过你的作品不再被甲方改七版，\n而是被用户和数据验证。",
    career_game_scene: "在虚拟世界里搭山盖海，不用考虑承重和排水。甲方从“您再改改”变成“这棵树穿模了”。\n加班依旧是老味道，但电脑配置终于能跑满帧了。",
    career_sales: "电话不停、饭局不断、微信好友全是甲方。你学会了在酒桌上谈合同，在厕所里改报价。\n提成到账的那一刻，你觉得被挂几次电话也值了。",
    career_content: "每天追热点、编标题、写“震惊体”。阅读量高了老板夸你，低了粉丝骂你。\n你以为逃离了改图，\n结果在排版和找封面图里循环往复。",
    career_illustrator: "丢掉尺规，拿起数位板，\n画城市速写、建筑画、甚至表情包。最受欢迎的作品是“通宵赶图猫猫头”。\n有人问“你学建筑的怎么来画画”，\n你说“因为画图不用算梁高”。",
    career_startup: "最困难之路，最孤独之路，也是风险与机遇并存之路。\n你像是在深夜拉一条没有端点的轴线。\n没有图纸，没有老师，\n没有人告诉你下一根线画在哪，\n你的对手只有一个：你自己。",
  };
  return descriptions[option.id] ?? "";
}

function renderSystemDialog(kicker, title, facts, notes, cardClass = "", returnButtonClass = "pixel-button is-primary", titleIcon = "") {
  const renderedTitle = titleIcon
    ? `<span class="modal-title-icon" aria-hidden="true">${renderUiIcon(titleIcon)}</span><span>${escapeHtml(title)}</span>`
    : escapeHtml(title);
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card slim ${escapeHtml(cardClass)}" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy">
          <p class="kicker">${escapeHtml(kicker)}</p>
          <h2 id="ui-dialog-title">${renderedTitle}</h2>
        </div>
        ${facts.length ? `<dl class="system-facts">
          ${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>` : ""}
        <div class="system-notes">
          ${notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}
        </div>
        <button class="${escapeHtml(returnButtonClass)}" type="button" data-command="close-ui-dialog">返回</button>
      </section>
    </div>
  `;
}

function renderLeaderboardDialog(vm) {
  const leaderboard = leaderboardRowsFor(vm);
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card slim leaderboard-dialog" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy">
          <p class="kicker">LEADERBOARD</p>
          <h2 id="ui-dialog-title"><span class="modal-title-icon" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.leaderboard)}</span><span>玩家排行榜</span></h2>
        </div>
        <div class="leaderboard-dialog-board">
          ${leaderboard.topRows.length ? `
            <ol class="leaderboard-dialog-list" aria-label="玩家排行榜前十名">
              ${leaderboard.topRows.map((row) => renderLeaderboardDialogRow(row)).join("")}
            </ol>
          ` : `<div class="leaderboard-dialog-empty" role="note">${LEADERBOARD_EMPTY_MESSAGE}</div>`}
          ${leaderboard.selfRow ? `<div class="leaderboard-dialog-self" aria-label="我的毕业档案">
            <span>我的毕业档案</span>
            <ul class="leaderboard-dialog-list">
              ${renderLeaderboardDialogRow(leaderboard.selfRow)}
            </ul>
          </div>` : ""}
        </div>
        <button class="pixel-button leaderboard-community-button" type="button" data-command="open-external-link" data-id="community">
          <span class="leaderboard-community-icon start-icon-community" aria-hidden="true">${renderUiIcon(UI_ICON_PATHS.community)}</span>
          <span>建院社区</span>
        </button>
        <button class="pixel-button" type="button" data-command="close-ui-dialog">返回</button>
      </section>
    </div>
  `;
}

function leaderboardRowsFor(vm) {
  const apiTopRows = (Array.isArray(vm?.leaderboard?.topRows) ? vm.leaderboard.topRows : [])
    .map(normalizeLeaderboardRow)
    .filter(Boolean)
    .slice(0, 10);
  const normalizedSelfRow = normalizeLeaderboardRow(vm?.leaderboard?.selfRow);
  const selfRow = normalizedSelfRow
    ? { ...normalizedSelfRow, isSelf: true }
    : apiTopRows.find((row) => row.isSelf) ?? null;
  const topRows = apiTopRows.length
    ? markLeaderboardSelfRows(apiTopRows, selfRow)
    : selfRow ? [selfRow] : [];
  const startTopRows = topRows.slice(0, 3);
  const startRows = startTopRows.some((row) => isLeaderboardSelfRow(row, selfRow))
    ? startTopRows
    : selfRow
      ? [...startTopRows, selfRow]
      : startTopRows;
  return { topRows, selfRow, startRows };
}

function markLeaderboardSelfRows(rows, selfRow) {
  if (!selfRow) return rows;
  return rows.map((row) => isLeaderboardSelfRow(row, selfRow) ? { ...row, isSelf: true } : row);
}

function isLeaderboardSelfRow(row, selfRow) {
  if (!row || !selfRow) return false;
  if (row.isSelf) return true;
  if (row.rankNumber && selfRow.rankNumber) return row.rankNumber === selfRow.rankNumber;
  return row.name === selfRow.name
    && row.university === selfRow.university
    && row.score === selfRow.score;
}

function normalizeLeaderboardRow(row) {
  if (!row) return null;
  const rawScore = Number(row.score);
  if (!Number.isFinite(rawScore) || rawScore < 0) return null;
  const rank = Number(row.rank);
  const rankNumber = Number.isInteger(rank) && rank > 0 ? rank : null;
  return {
    rank: rankNumber ? String(rank).padStart(2, "0") : "--",
    rankNumber,
    name: String(row.nickname ?? row.name ?? "").trim() || "当前玩家",
    university: String(row.universityName ?? row.university ?? "").trim() || "大学名称待同步",
    score: String(Math.round(rawScore)),
    isSelf: Boolean(row.isSelf),
  };
}

function renderLeaderboardDialogRow(row) {
  return `
    <li class="leaderboard-dialog-row ${row.isSelf ? "is-self" : ""}">
      ${renderLeaderboardRank(row)}
      <strong>${escapeHtml(row.name)}</strong>
      <em>${escapeHtml(row.university)}</em>
      <b>${escapeHtml(row.score)}</b>
    </li>
  `;
}

function renderLeaderboardRank(row) {
  const icon = LEADERBOARD_RANK_ICONS[row.rankNumber];
  if (!icon) return `<span>${escapeHtml(row.rank)}</span>`;
  const label = `第 ${row.rankNumber} 名`;
  return `<span class="leaderboard-rank-icon rank-${row.rankNumber}" aria-label="${label}" title="${label}">${renderUiIcon(icon, label)}</span>`;
}

function renderDeltaChips(delta = {}, className = "delta-chips") {
  const entries = Object.entries(delta ?? {});
  if (entries.length === 0) return "";
  return `
    <span class="delta-chips ${className}">
      ${entries.map(([key, value]) => renderDeltaChip(key, value)).join("")}
    </span>
  `;
}

function renderDeltaChip(key, value) {
  return `
    <span class="delta-chip ${deltaTone(key, value)}">
      ${DELTA_ICONS[key] ? `<i class="delta-chip-icon" aria-hidden="true">${renderUiIcon(DELTA_ICONS[key], DELTA_LABELS[key] ?? key)}</i>` : ""}
      <span>${escapeHtml(DELTA_LABELS[key] ?? key)}</span>
      <strong>${value > 0 ? "+" : ""}${escapeHtml(value)}</strong>
    </span>
  `;
}

function deltaTone(key, value) {
  if (value === 0) return "is-neutral";
  if (key === "pressure") return value > 0 ? "is-negative" : "is-positive";
  const positiveKeys = new Set([
    "energy",
    "money",
    "progress",
    "quality",
    "portfolio",
    "gpa",
    "gpaModifier",
    "design",
    "software",
    "aesthetic",
    "presentation",
    "social",
    "resilience",
    "achievementScore",
  ]);
  if (positiveKeys.has(key)) return value > 0 ? "is-positive" : "is-negative";
  return value > 0 ? "is-positive" : "is-negative";
}
