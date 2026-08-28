import { UI_ICON_FINAL_IMAGE_SOURCES } from "./ui-icon-final-manifest.mjs";

const ACHIEVEMENT_TITLE_ALIASES = new Map([
  ["大学毕业", "大学毕业之后"],
  ["通宵高手", "通宵三次"],
  ["三年没挂科", "两年没挂科"],
]);

const FINAL_UI_ICON_SOURCES = new Set(UI_ICON_FINAL_IMAGE_SOURCES);
const FINAL_ACHIEVEMENT_SOURCE_BY_TITLE = buildFinalAchievementSourcesByTitle();
const FINAL_ACHIEVEMENT_SOURCE_BY_NUMBER = buildFinalAchievementSourcesByNumber();
const FINAL_ALBUM_SOURCE_BY_NUMBER = buildFinalAlbumSourcesByNumber();

export { UI_ICON_FINAL_IMAGE_SOURCES };

export function finalUiIconSource(source) {
  if (!source || typeof source !== "string") return source;
  return FINAL_UI_ICON_SOURCES.has(source) ? source : source;
}

export function finalUiIconMap(iconMap) {
  return Object.fromEntries(
    Object.entries(iconMap).map(([key, source]) => [key, finalUiIconSource(source)]),
  );
}

export function finalUiIconItems(items) {
  return items.map((item) => ({
    ...item,
    icon: finalUiIconSource(item.icon),
  }));
}

export function finalAchievementIconSourceByTitle(title) {
  if (!title) return "";
  return FINAL_ACHIEVEMENT_SOURCE_BY_TITLE.get(title)
    ?? FINAL_ACHIEVEMENT_SOURCE_BY_TITLE.get(ACHIEVEMENT_TITLE_ALIASES.get(title))
    ?? "";
}

export function finalAchievementIconSourceByNumber(number) {
  const key = String(number ?? "").padStart(3, "0");
  return FINAL_ACHIEVEMENT_SOURCE_BY_NUMBER.get(key) ?? "";
}

export function finalAlbumCoverSource(number) {
  const key = String(number ?? "").padStart(3, "0");
  return FINAL_ALBUM_SOURCE_BY_NUMBER.get(key) ?? "";
}

function buildFinalAchievementSourcesByTitle() {
  const sources = new Map();
  for (const source of UI_ICON_FINAL_IMAGE_SOURCES) {
    const title = achievementTitleFor(source);
    if (title && !sources.has(title)) sources.set(title, source);
  }
  return sources;
}

function buildFinalAchievementSourcesByNumber() {
  const sources = new Map();
  for (const source of UI_ICON_FINAL_IMAGE_SOURCES) {
    const fileName = source.split("/").pop() ?? "";
    const match = fileName.match(/__UIATLAS_\d{3}_\d{3}_pxui_achievement_core_(\d{3})_.+\.[a-f0-9]{8,16}\.webp$/u);
    if (match && !sources.has(match[1])) sources.set(match[1], source);
  }
  return sources;
}

function buildFinalAlbumSourcesByNumber() {
  const sources = new Map();
  for (const source of UI_ICON_FINAL_IMAGE_SOURCES) {
    const match = source.match(/__UIATLAS_023_(\d{3})_pxui_album_\d{3}_.+\.[a-f0-9]{8,16}\.webp$/u);
    if (match && !sources.has(match[1])) sources.set(match[1], source);
  }
  return sources;
}

function achievementTitleFor(source) {
  const fileName = source.split("/").pop() ?? "";
  const match = fileName.match(/^\d{3}_(.+)__UIATLAS_\d{3}_\d{3}_pxui_achievement_core_\d{3}_.+\.[a-f0-9]{8,16}\.webp$/u);
  return match ? match[1] : "";
}
