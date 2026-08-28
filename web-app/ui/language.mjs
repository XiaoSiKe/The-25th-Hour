export const DEFAULT_UI_LANGUAGE = "zh-CN";

export const UI_LANGUAGE_OPTIONS = [
  { id: "zh-CN", label: "简体中文" },
  { id: "en", label: "English" },
];

export function normalizeUiLanguage(language) {
  return language === "en" ? "en" : DEFAULT_UI_LANGUAGE;
}

export function languageDialogCopy(language) {
  return normalizeUiLanguage(language) === "en"
    ? {
      title: "Display Language",
      ariaLabel: "Display language",
      returnLabel: "Back",
    }
    : {
      title: "显示语言",
      ariaLabel: "显示语言",
      returnLabel: "返回",
    };
}
