import {
  ATTRIBUTE_KEYS,
  BASE_ACTIONS_PER_WEEK,
  CHARACTERS,
  COURSES,
  ENDINGS,
  FAMILY_BACKGROUNDS,
  FIXED_EVENTS,
  SAVE_VERSION,
} from "./data.mjs";
import { drawWeighted, generateSeed, normalizeSeed } from "./rng.mjs";

export function createGame({ nickname, universityName, seed }) {
  const normalizedSeed = seed === undefined || seed === null || String(seed).trim() === ""
    ? generateSeed()
    : normalizeSeed(seed);
  const state = {
    version: SAVE_VERSION,
    runId: createRunId(),
    seed: normalizedSeed,
    rngState: normalizedSeed,
    phase: "profile",
    profile: {
      nickname: String(nickname ?? "").trim(),
      universityName: String(universityName ?? "").trim(),
      characterId: null,
      mentorId: null,
    },
    year: 1,
    term: 1,
    semesterIndex: 1,
    week: 0,
    weekInSemester: 0,
    actionsRemaining: 0,
    actionsPerWeek: BASE_ACTIONS_PER_WEEK,
    weeklyActionCounts: {},
    semesterActionTally: {},
    semesterAttributeGrowth: emptyAttributes(),
    actionTally: {},
    energy: 100,
    maxEnergy: 100,
    pressure: 20,
    money: 2000,
    gpa: null,
    gpaHistory: [],
    gpaDirectAdjustment: 0,
    gpaModifier: 0,
    attributes: emptyAttributes(28),
    progress: 0,
    quality: 0,
    portfolio: 0,
    courseId: null,
    courseYear: null,
    courseHistory: [],
    courseExam: null,
    musicYearStarted: false,
    mentorCandidates: [],
    characterCandidates: [],
    initialCharacterCandidateId: null,
    previousCharacterCandidates: [],
    rerollsRemaining: 2,
    fixedEventIndex: 0,
    modelMaterialBySemester: {},
    currentModelMaterialId: null,
    pendingInteraction: null,
    modalQueue: [],
    weeklySettlementApplied: false,
    logs: [],
    reviews: [],
    eventHistory: [],
    eventLastTriggeredWeek: {},
    eventTally: {},
    unlockedAchievements: [],
    achievementToasts: [],
    achievementScore: 0,
    endingScore: 0,
    endingRepeatScore: 0,
    achievementTally: {
      socialRefusals: 0,
      purchasedShopItemIds: [],
      shopPurchases: [],
      historicalAchievementIds: [],
      historicalActionTally: {},
      historicalShopPurchaseCounts: {},
      historicalCompetitionAwardCount: 0,
      historicalCoffeeSupportClicks: 0,
      coffeeSupportClicks: 0,
      actionHistory: [],
      weekActionStreak: null,
      mentorTaskSuccessStreak: 0,
      moneySafeWeekStreak: 0,
      crunchStartedUnder20SemesterIndex: null,
      endingIds: [],
      scoredEndingId: null,
      characterIds: [],
      mentorIds: [],
    },
    shopEffects: emptyShopEffects(),
    guaranteedEvents: {
      lightlyHolding: false,
      deskNote: false,
      playInteractions: 0,
      romanceInteraction: false,
      loveCrisisCountdown: 0,
      aiEvents: 0,
    },
    systemFlags: {
      internshipOpenPromptShown: false,
      portfolioFirstEntryPromptShown: false,
      graduationDesignReminderShown: false,
      wanliRoadOpenPromptShown: false,
      competitionSubmissionReminderStartedWeek: null,
      competitionSubmissionReminderDueWeek: null,
      competitionSubmissionReminderShown: false,
      randomEventCheckWeek: null,
      earlyRandomEventNeedsInteractive: false,
    },
    aiExperience: 0,
    hasPartner: false,
    specialSkill: {
      lastUsedWeek: null,
      reviewEaseSemester: null,
      reviewEase: null,
    },
    passiveState: {
      relaxedTriggers: 0,
      mixedInYear: null,
    },
    pressureOver90Weeks: 0,
    pressureOver80Weeks: 0,
    completedGraduationDesign: false,
    pendingEnding: null,
    endingTrackId: null,
    endingTrackHistory: { playedTrackIds: [] },
    endingMemoryWatched: false,
    routeParticipation: null,
    routeExam: null,
    routeExamResults: {
      academicCorrect: 0,
      civilCorrect: 0,
      academicTaken: false,
      civilTaken: false,
    },
    internshipValue: 0,
    namedFirmInternship: false,
    activeInternship: null,
    internshipApplications: [],
    internshipAppliedSemesters: [],
    internshipRecords: [],
    ieltsScore: 0,
    ieltsExam: null,
    ieltsLastTakenSemester: null,
    competitionSubmissionCount: 0,
    competitionAwardCount: 0,
    wanliRoadVisits: 0,
    wanliRoadRecords: [],
    wanliRoadStageRewardsClaimed: [],
    wanliRoadActionDebt: 0,
    ending: null,
    failureReason: null,
  };

  state.rngState = drawCharacterCandidates(state, [], { recordInitial: true });
  state.phase = "character_select";
  log(state, "system", "profile_created", "开局档案已建立", {});
  return state;
}

export function reviveState(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const state = structuredClone(raw);
  state.version = state.version ?? SAVE_VERSION;
  state.runId = state.runId ?? createRunId();
  state.modalQueue = Array.isArray(state.modalQueue) ? state.modalQueue : [];
  state.pendingInteraction = state.pendingInteraction ?? null;
  state.weeklySettlementApplied = state.phase === "week_settlement" && Boolean(state.weeklySettlementApplied);
  state.profile = state.profile ?? {};
  state.courseYear = state.courseYear ?? (state.courseId ? state.year : null);
  state.courseHistory = Array.isArray(state.courseHistory)
    ? [...new Set(state.courseHistory)]
    : courseHistoryFromLogs(state);
  if (state.courseId && !state.courseHistory.includes(state.courseId)) {
    state.courseHistory.push(state.courseId);
  }
  state.musicYearStarted = "musicYearStarted" in state ? Boolean(state.musicYearStarted) : state.weekInSemester > 0;
  state.attributes = { ...emptyAttributes(), ...(state.attributes ?? {}) };
  state.semesterAttributeGrowth = { ...emptyAttributes(), ...(state.semesterAttributeGrowth ?? {}) };
  state.progress = normalizeCourseProgressValue(state.progress, courseProgressCap(state));
  state.quality = normalizeCourseProgressValue(state.quality, courseQualityCap(state));
  state.weeklyActionCounts = state.weeklyActionCounts ?? {};
  state.semesterActionTally = state.semesterActionTally ?? {};
  state.actionTally = state.actionTally ?? {};
  state.characterCandidates = Array.isArray(state.characterCandidates) ? state.characterCandidates : [];
  state.previousCharacterCandidates = Array.isArray(state.previousCharacterCandidates) ? state.previousCharacterCandidates : [];
  state.initialCharacterCandidateId = state.initialCharacterCandidateId
    ?? (state.phase === "character_select" && state.rerollsRemaining === 2
      ? state.characterCandidates[0] ?? null
      : null);
  state.eventHistory = state.eventHistory ?? [];
  state.eventLastTriggeredWeek = state.eventLastTriggeredWeek ?? {};
  state.eventTally = state.eventTally ?? {};
  state.unlockedAchievements = Array.isArray(state.unlockedAchievements) ? [...new Set(state.unlockedAchievements)] : [];
  state.achievementToasts = Array.isArray(state.achievementToasts) ? dedupeAchievementToasts(state.achievementToasts) : [];
  state.achievementScore = state.achievementScore ?? 0;
  state.endingScore = state.endingScore ?? endingScoreFromIds(state.achievementTally?.endingIds);
  state.endingRepeatScore = state.endingRepeatScore ?? 0;
  state.achievementTally = {
    socialRefusals: state.achievementTally?.socialRefusals ?? 0,
    purchasedShopItemIds: Array.isArray(state.achievementTally?.purchasedShopItemIds)
      ? state.achievementTally.purchasedShopItemIds
      : [],
    shopPurchases: Array.isArray(state.achievementTally?.shopPurchases)
      ? state.achievementTally.shopPurchases
      : [],
    historicalAchievementIds: Array.isArray(state.achievementTally?.historicalAchievementIds)
      ? state.achievementTally.historicalAchievementIds
      : [],
    historicalActionTally: state.achievementTally?.historicalActionTally
      && typeof state.achievementTally.historicalActionTally === "object"
      ? state.achievementTally.historicalActionTally
      : {},
    historicalShopPurchaseCounts: state.achievementTally?.historicalShopPurchaseCounts
      && typeof state.achievementTally.historicalShopPurchaseCounts === "object"
      ? state.achievementTally.historicalShopPurchaseCounts
      : {},
    historicalCompetitionAwardCount: state.achievementTally?.historicalCompetitionAwardCount ?? 0,
    historicalCoffeeSupportClicks: state.achievementTally?.historicalCoffeeSupportClicks ?? 0,
    historicalEndingCounts: state.achievementTally?.historicalEndingCounts
      && typeof state.achievementTally.historicalEndingCounts === "object"
      ? state.achievementTally.historicalEndingCounts
      : {},
    coffeeSupportClicks: state.achievementTally?.coffeeSupportClicks ?? 0,
    actionHistory: Array.isArray(state.achievementTally?.actionHistory)
      ? state.achievementTally.actionHistory
      : [],
    weekActionStreak: state.achievementTally?.weekActionStreak ?? null,
    mentorTaskSuccessStreak: state.achievementTally?.mentorTaskSuccessStreak ?? 0,
    moneySafeWeekStreak: state.achievementTally?.moneySafeWeekStreak ?? 0,
    crunchStartedUnder20SemesterIndex: state.achievementTally?.crunchStartedUnder20SemesterIndex
      ?? state.achievementTally?.crunchStartedUnder60SemesterIndex
      ?? null,
    endingIds: Array.isArray(state.achievementTally?.endingIds)
      ? state.achievementTally.endingIds
      : [],
    scoredEndingId: state.achievementTally?.scoredEndingId
      ?? (state.ending && state.achievementTally?.endingIds?.includes(state.ending) ? state.ending : null),
    characterIds: Array.isArray(state.achievementTally?.characterIds)
      ? state.achievementTally.characterIds
      : [],
    mentorIds: Array.isArray(state.achievementTally?.mentorIds)
      ? state.achievementTally.mentorIds
      : [],
  };
  if (state.achievementTally.shopPurchases.length === 0 && state.achievementTally.purchasedShopItemIds.length > 0) {
    state.achievementTally.shopPurchases = state.achievementTally.purchasedShopItemIds.map((id) => ({
      id,
      week: state.week,
      semesterIndex: state.semesterIndex,
      year: state.year,
    }));
  }
  state.shopEffects = normalizeShopEffects(state.shopEffects);
  state.logs = state.logs ?? [];
  state.reviews = state.reviews ?? [];
  state.gpaHistory = Array.isArray(state.gpaHistory) ? state.gpaHistory : [];
  state.gpaModifier = Number.isFinite(Number(state.gpaModifier))
    ? Number(state.gpaModifier)
    : 0;
  state.gpaDirectAdjustment = Number.isFinite(Number(state.gpaDirectAdjustment))
    ? Number(state.gpaDirectAdjustment)
    : 0;
  if (state.gpaHistory.length === 0 && state.gpaDirectAdjustment === 0) {
    state.gpa = null;
  } else {
    const baseGpa = state.gpaHistory.length > 0
      ? state.gpaHistory.reduce((sum, item) => sum + item, 0) / state.gpaHistory.length
      : 0;
    state.gpa = clampGpa(baseGpa + state.gpaDirectAdjustment);
  }
  state.guaranteedEvents = {
    lightlyHolding: Boolean(state.guaranteedEvents?.lightlyHolding),
    deskNote: Boolean(state.guaranteedEvents?.deskNote),
    playInteractions: state.guaranteedEvents?.playInteractions ?? 0,
    romanceInteraction: Boolean(state.guaranteedEvents?.romanceInteraction),
    loveCrisisCountdown: Number(state.guaranteedEvents?.loveCrisisCountdown) || 0,
    aiEvents: state.guaranteedEvents?.aiEvents ?? 0,
  };
  const resetBuggedGraduationDesignReminderFlag =
    Number(state.semesterIndex) <= 9
    && state.systemFlags?.graduationDesignReminderShown === true
    && !hasPendingGraduationDesignReminder(state);
  state.systemFlags = {
    internshipOpenPromptShown: Boolean(state.systemFlags?.internshipOpenPromptShown),
    portfolioFirstEntryPromptShown: Boolean(state.systemFlags?.portfolioFirstEntryPromptShown),
    graduationDesignReminderShown: resetBuggedGraduationDesignReminderFlag
      ? false
      : Boolean(state.systemFlags?.graduationDesignReminderShown),
    wanliRoadOpenPromptShown: Boolean(state.systemFlags?.wanliRoadOpenPromptShown),
    competitionSubmissionReminderStartedWeek: state.systemFlags?.competitionSubmissionReminderStartedWeek != null
      && Number.isFinite(Number(state.systemFlags.competitionSubmissionReminderStartedWeek))
      ? Number(state.systemFlags.competitionSubmissionReminderStartedWeek)
      : null,
    competitionSubmissionReminderDueWeek: state.systemFlags?.competitionSubmissionReminderDueWeek != null
      && Number.isFinite(Number(state.systemFlags.competitionSubmissionReminderDueWeek))
      ? Number(state.systemFlags.competitionSubmissionReminderDueWeek)
      : state.systemFlags?.competitionSubmissionReminderStartedWeek != null
        && Number.isFinite(Number(state.systemFlags.competitionSubmissionReminderStartedWeek))
        ? Number(state.systemFlags.competitionSubmissionReminderStartedWeek) + 12
        : null,
    competitionSubmissionReminderShown: Boolean(state.systemFlags?.competitionSubmissionReminderShown),
    randomEventCheckWeek: state.systemFlags?.randomEventCheckWeek != null
      && Number.isFinite(Number(state.systemFlags.randomEventCheckWeek))
      ? Number(state.systemFlags.randomEventCheckWeek)
      : null,
    earlyRandomEventNeedsInteractive: Boolean(state.systemFlags?.earlyRandomEventNeedsInteractive),
  };
  state.hasPartner = Boolean(state.hasPartner);
  state.passiveState = {
    relaxedTriggers: state.passiveState?.relaxedTriggers ?? 0,
    mixedInYear: state.passiveState?.mixedInYear ?? null,
  };
  state.specialSkill = {
    lastUsedWeek: state.specialSkill?.lastUsedWeek ?? null,
    reviewEaseSemester: state.specialSkill?.reviewEaseSemester ?? null,
    reviewEase: state.specialSkill?.reviewEase ?? null,
  };
  state.pendingEnding = state.pendingEnding ?? null;
  state.endingTrackId = typeof state.endingTrackId === "string" ? state.endingTrackId : null;
  state.endingTrackHistory = {
    playedTrackIds: Array.isArray(state.endingTrackHistory?.playedTrackIds)
      ? [...new Set(state.endingTrackHistory.playedTrackIds.filter((id) => typeof id === "string"))]
      : [],
  };
  state.endingMemoryWatched = Boolean(state.endingMemoryWatched);
  state.routeParticipation = state.routeParticipation ?? null;
  state.routeExam = state.routeExam ?? null;
  state.routeExamResults = {
    academicCorrect: state.routeExamResults?.academicCorrect ?? state.routeExamCorrect ?? 0,
    civilCorrect: state.routeExamResults?.civilCorrect ?? state.civilExamCorrect ?? 0,
    academicTaken: Boolean(state.routeExamResults?.academicTaken),
    civilTaken: Boolean(state.routeExamResults?.civilTaken),
  };
  state.internshipValue = state.internshipValue ?? 0;
  state.activeInternship = state.activeInternship ?? null;
  state.internshipApplications = Array.isArray(state.internshipApplications) ? state.internshipApplications : [];
  state.internshipAppliedSemesters = Array.isArray(state.internshipAppliedSemesters)
    ? state.internshipAppliedSemesters.map((item) => Number(item)).filter(Number.isFinite)
    : [];
  state.internshipRecords = Array.isArray(state.internshipRecords) ? state.internshipRecords : [];
  state.namedFirmInternship = Boolean(state.namedFirmInternship)
    || state.internshipRecords.some((record) => record?.tier === "named_firm" || Number(record?.value) >= 3);
  state.ieltsScore = clampIeltsScore(Number(state.ieltsScore) || 0);
  state.ieltsExam = state.ieltsExam ?? null;
  state.ieltsLastTakenSemester = state.ieltsLastTakenSemester ?? latestIeltsTakenSemester(state.ieltsExamRecords);
  delete state.ieltsExamRecords;
  state.competitionSubmissionCount = state.competitionSubmissionCount ?? 0;
  state.competitionAwardCount = state.competitionAwardCount ?? 0;
  state.wanliRoadVisits = state.wanliRoadVisits ?? state.eventTally?.wanliRoadVisits ?? 0;
  state.wanliRoadRecords = Array.isArray(state.wanliRoadRecords) ? state.wanliRoadRecords : [];
  state.wanliRoadStageRewardsClaimed = Array.isArray(state.wanliRoadStageRewardsClaimed)
    ? state.wanliRoadStageRewardsClaimed.map((visits) => Number(visits)).filter(Number.isFinite)
    : [];
  state.wanliRoadActionDebt = Number.isFinite(Number(state.wanliRoadActionDebt)) ? Number(state.wanliRoadActionDebt) : 0;
  state.pressureOver90Weeks = state.pressureOver90Weeks ?? 0;
  state.pressureOver80Weeks = state.pressureOver80Weeks ?? 0;
  state.aiExperience = state.aiExperience ?? 0;
  delete state.aiPracticeAwardedSemesters;
  state.pendingInteraction = normalizeInteraction(state.pendingInteraction);
  state.modalQueue = state.modalQueue.map(normalizeInteraction).filter(Boolean);
  return state;
}

function dedupeAchievementToasts(toasts) {
  const seen = new Set();
  return toasts.filter((toast) => {
    const id = toast?.id ?? toast?.achievementId;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function endingScoreFromIds(endingIds) {
  if (!Array.isArray(endingIds)) return 0;
  return endingIds.reduce((sum, endingId) => sum + (ENDINGS[endingId]?.score ?? 0), 0);
}

function clampGpa(value) {
  return Math.max(0, Math.min(4, value));
}

function clampIeltsScore(value) {
  return Math.max(0, Math.min(8, value));
}

function latestIeltsTakenSemester(records) {
  if (!Array.isArray(records)) return null;
  const semesters = records
    .map((record) => Number(record?.semesterIndex))
    .filter(Number.isFinite);
  return semesters.length ? Math.max(...semesters) : null;
}

function normalizeInteraction(interaction) {
  if (!interaction || typeof interaction !== "object") {
    return interaction ?? null;
  }
  if (interaction.type !== "project_select") {
    return interaction;
  }

  const options = Array.isArray(interaction.options) ? interaction.options : [];
  if (options.some((option) => option?.id === "__back")) {
    return interaction;
  }

  return {
    ...interaction,
    options: [
      {
        id: "__back",
        label: "返回",
        body: "不承接项目，回到本周行动。",
        state: "available",
      },
      ...options,
    ],
  };
}

function courseProgressCap(state) {
  const base = Number(state?.semesterIndex) >= 9 ? 250 : 100;
  return Math.max(0, base + (activeReviewEase(state)?.progressCap ?? 0));
}

function courseQualityCap(state) {
  return Number(state?.semesterIndex) >= 9 ? 250 : 100;
}

function normalizeCourseProgressValue(value, cap) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(cap, numeric)) : 0;
}

function activeReviewEase(state) {
  if (state?.specialSkill?.reviewEaseSemester === state?.semesterIndex) {
    return state.specialSkill.reviewEase;
  }
  if (state?.semesterIndex === 9 && state?.specialSkill?.reviewEaseSemester === 10) {
    return state.specialSkill.reviewEase;
  }
  return null;
}

export function drawCharacterCandidates(state, excludedIds, options = {}) {
  const excluded = new Set(excludedIds);
  const pool = CHARACTERS.filter((character) => !excluded.has(character.id));
  const [rngState, candidate] = drawWeighted(
    state.rngState,
    pool.map((character) => ({ item: character, weight: characterDrawWeight(character) })),
  );
  state.characterCandidates = candidate ? [candidate.id] : [];
  if (options.recordInitial) {
    state.initialCharacterCandidateId = candidate?.id ?? null;
  }
  return rngState;
}

function characterDrawWeight(character) {
  return Number(character.drawWeight) > 0 ? Number(character.drawWeight) : 1;
}

export function getCharacter(state) {
  return CHARACTERS.find((character) => character.id === state.profile.characterId);
}

export function getFamily(state) {
  const character = getCharacter(state);
  return FAMILY_BACKGROUNDS[character?.familyId ?? "ordinary"];
}

export function getCourse(state) {
  return COURSES.find((course) => course.id === state.courseId);
}

function courseHistoryFromLogs(state) {
  const messages = Array.isArray(state.logs) ? state.logs.map((logItem) => String(logItem.message ?? "")) : [];
  return COURSES
    .filter((course) => messages.some((message) => message.includes(`课程：${course.name}`)))
    .map((course) => course.id);
}

export function emptyShopEffects() {
  return {
    weeklyBySemester: {},
    weeklyPermanent: {},
    drawingPressureBonus: 0,
    drawingProgressBonus: 0,
    summerPositiveBonus: 0,
    restDelta: {},
    exerciseYear: null,
    excuseTokens: 0,
    blockPluginEvents: false,
    modelNegativeLossReduction: false,
    blockModelNegativeEvents: false,
    blockComputerEvents: false,
    musicSwitch: false,
    musicMembership: null,
  };
}

function normalizeShopEffects(raw) {
  const fallback = emptyShopEffects();
  const effects = raw && typeof raw === "object" ? raw : {};
  return {
    weeklyBySemester: effects.weeklyBySemester ?? fallback.weeklyBySemester,
    weeklyPermanent: effects.weeklyPermanent ?? fallback.weeklyPermanent,
    drawingPressureBonus: effects.drawingPressureBonus ?? fallback.drawingPressureBonus,
    drawingProgressBonus: effects.drawingProgressBonus ?? fallback.drawingProgressBonus,
    summerPositiveBonus: effects.summerPositiveBonus ?? fallback.summerPositiveBonus,
    restDelta: effects.restDelta ?? fallback.restDelta,
    exerciseYear: effects.exerciseYear ?? fallback.exerciseYear,
    excuseTokens: effects.excuseTokens ?? fallback.excuseTokens,
    blockPluginEvents: Boolean(effects.blockPluginEvents),
    modelNegativeLossReduction: Boolean(effects.modelNegativeLossReduction || effects.blockModelNegativeEvents),
    blockModelNegativeEvents: Boolean(effects.blockModelNegativeEvents),
    blockComputerEvents: Boolean(effects.blockComputerEvents),
    musicSwitch: Boolean(effects.musicSwitch),
    musicMembership: effects.musicMembership && typeof effects.musicMembership === "object"
      ? {
          purchasedWeek: Number(effects.musicMembership.purchasedWeek) || 0,
          year: Number(effects.musicMembership.year) || 0,
          durationWeeks: Number(effects.musicMembership.durationWeeks) || 12,
          drawingPressureBonus: Number(effects.musicMembership.drawingPressureBonus) || 0,
        }
      : fallback.musicMembership,
  };
}

function createRunId() {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function pushModal(state, interaction) {
  if (state.pendingInteraction) {
    state.modalQueue.push(interaction);
  } else {
    state.pendingInteraction = interaction;
  }
}

export function popModal(state) {
  state.pendingInteraction = state.modalQueue.shift() ?? null;
}

export function resolvePendingInteraction(state, continuation) {
  state.pendingInteraction = null;
  continuation?.();
  if (!state.pendingInteraction) {
    popModal(state);
  }
}

export function requireNoPending(state) {
  if (state.pendingInteraction) {
    return { ok: false, reason: "pending_interaction" };
  }
  return { ok: true };
}

export function currentSemesterLabel(state) {
  return `${yearLabel(state.year)}${state.term === 1 ? "上" : "下"}`;
}

export function yearLabel(year) {
  const labels = ["零", "一", "二", "三", "四", "五"];
  const normalized = Number(year);
  return `大${labels[normalized] ?? normalized}`;
}

export function updateCalendarFromSemester(state) {
  state.year = Math.ceil(state.semesterIndex / 2);
  state.term = state.semesterIndex % 2 === 1 ? 1 : 2;
}

export function emptyAttributes(value = 0) {
  return ATTRIBUTE_KEYS.reduce((shape, key) => {
    shape[key] = value;
    return shape;
  }, {});
}

export function snapshot(state) {
  return {
    energy: state.energy,
    pressure: state.pressure,
    money: state.money,
    progress: state.progress,
    quality: state.quality,
    gpa: state.gpa === null ? null : round(state.gpa, 2),
    portfolio: state.portfolio,
    ending: state.ending,
    pendingEnding: state.pendingEnding,
  };
}

export function log(state, phase, source, message, delta = {}) {
  state.logs.push({
    index: state.logs.length + 1,
    week: state.week,
    semesterIndex: state.semesterIndex,
    year: state.year,
    term: state.term,
    weekInSemester: state.weekInSemester,
    phase,
    source,
    message,
    delta,
    snapshot: snapshot(state),
  });
}

export function nextFixedEvent() {
  return FIXED_EVENTS[0];
}

export function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function hasPendingGraduationDesignReminder(state) {
  const isReminder = (interaction) =>
    interaction?.type === "system_prompt" && interaction?.title === "温馨提醒";
  return isReminder(state.pendingInteraction)
    || (Array.isArray(state.modalQueue) && state.modalQueue.some(isReminder));
}
