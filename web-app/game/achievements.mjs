import { ACHIEVEMENTS, ATTRIBUTE_KEYS, CHARACTERS, ENDINGS, MENTORS, RANDOM_EVENTS, SHOP_ITEMS, WEEKS_PER_SEMESTER } from "./data.mjs";
import { scoreForEndingAchievement } from "./ending-scoring.mjs";
import { weeklyLivingCost } from "./resolver.mjs";
import { log } from "./state.mjs";

const SOCIAL_REFUSAL_EVENT_IDS = new Set([
  "friend_party",
  "late_night_food",
  "cross_exchange",
  "junior_scheme_help",
  "senior_share",
  "billiards",
  "moba",
  "choir",
  "script_murder",
  "movie",
  "concert",
  "badminton",
  "run_together",
  "cycling",
]);

const SOCIAL_REFUSAL_OPTION_IDS = new Set([
  "work",
  "hold",
  "stay",
  "busy",
  "skip",
]);

const GRADE_ORDER = ["F", "D", "C", "B", "A", "S"];
const ACHIEVEMENT_COLLECTION_IDS = new Set([
  "achievement_collection_25",
  "achievement_collection_50",
  "achievement_collection_all",
]);
const FAILURE_ENDING_IDS = new Set([
  "living_cost_break",
  "forced_suspension",
  "pressure_collapse",
  "two_failed_reviews",
  "graduation_failed",
]);
export function dismissAchievementToasts(state, toastIds = null) {
  if (!Array.isArray(toastIds) || toastIds.length === 0) {
    state.achievementToasts = (state.achievementToasts ?? []).slice(1);
    return { ok: true };
  }

  const dismissed = new Set(toastIds);
  state.achievementToasts = (state.achievementToasts ?? []).filter((toast) => {
    const id = toast.id ?? toast.achievementId;
    return !dismissed.has(id);
  });
  return { ok: true };
}

export function recordActionUse(state, actionId) {
  recordSameWeekStreak(state, actionId);

  if (actionId === "normal_drawing") unlockAchievement(state, "first_normal_drawing");

  if (actionId === "crunch_drawing") {
    unlockAchievement(state, "first_all_nighter");
  }
}

export function recordArchitectureLifeStartComplete(state) {
  unlockAchievement(state, "first_week_done");
}

export function recordGraduationCeremonyStart(state) {
  if (state.completedGraduationDesign && !state.ending && !state.pendingEnding) {
    unlockAchievement(state, "university_graduation");
  }
}

export function recordCharacterSelection(state, characterId, context = {}) {
  const tally = ensureAchievementTally(state);
  addUnique(tally.characterIds, characterId);
  if (characterId === "corbusier_heir" && context.isInitialDrawSelection) {
    unlockAchievement(state, "destiny_character");
  }
  if (tally.characterIds.length >= CHARACTERS.length) unlockAchievement(state, "all_characters_seen");
}

export function recordMentorSelection(state, mentorId) {
  const tally = ensureAchievementTally(state);
  addUnique(tally.mentorIds, mentorId);
  if (tally.mentorIds.length >= MENTORS.length) unlockAchievement(state, "all_mentors_seen");
}

export function recordWeekStart(state) {
  const tally = ensureAchievementTally(state);
  if (state.weekInSemester === 6 && state.progress < 20) {
    tally.crunchStartedUnder20SemesterIndex = state.semesterIndex;
  }
}

export function recordProjectParticipation(state, projectType) {
  if (projectType === "outsourcing" || projectType === "part_time") {
    recordActionUse(state, projectType);
    unlockAchievement(state, "first_bucket_of_gold");
  }
}

export function recordShopPurchase(state, shopItemId, context = {}) {
  ensureAchievementTally(state);
  if (!SHOP_ITEMS.some((item) => item.id === shopItemId)) {
    return;
  }

  const purchased = new Set(state.achievementTally.purchasedShopItemIds ?? []);
  purchased.add(shopItemId);
  state.achievementTally.purchasedShopItemIds = [...purchased];

  if (SHOP_ITEMS.every((item) => purchased.has(item.id))) {
    unlockAchievement(state, "shopaholic");
  }

  const runPurchaseCount = runShopPurchaseCount(state, shopItemId) + 1;
  const totalPurchaseCount = totalShopPurchaseCount(state, shopItemId) + 1;
  if (shopItemId === "starbucks_week_card") {
    if (totalPurchaseCount >= 30) unlockAchievement(state, "coffee_unit_01");
    if (totalPurchaseCount >= 60) unlockAchievement(state, "starbucks_spokesperson");
    if (totalPurchaseCount >= 100) unlockAchievement(state, "coffee_blood");
  }
  if (shopItemId === "crazy_thursday") {
    if (runPurchaseCount >= 3) unlockAchievement(state, "fried_chicken_king");
    if (runPurchaseCount >= 6) unlockAchievement(state, "fried_chicken_emperor");
    if (runPurchaseCount >= 9) unlockAchievement(state, "gourmet");
  }
  if (shopItemId === "ergonomic_chair") unlockAchievement(state, "noble_chair");
  if (shopItemId === "music_membership") unlockAchievement(state, "musician");
  if (shopItemId === "alienware_laptop") unlockAchievement(state, "alienware_owner");
  if ((context.energyBefore ?? state.energy) < 30 && state.energy >= 30) {
    unlockAchievement(state, "timely_supply");
  }
}

export function recordCoffeeSupportClick(state) {
  ensureAchievementTally(state);
  state.achievementTally.coffeeSupportClicks = (state.achievementTally.coffeeSupportClicks ?? 0) + 1;
  if (totalCoffeeSupportClicks(state) >= 1) {
    unlockAchievement(state, "honorary_shareholder");
  }
}

export function recordInteractiveEventChoice(state, eventId, optionId) {
  ensureAchievementTally(state);
  if (eventId === "help_classmate" && optionId === "help") {
    unlockAchievement(state, "timely_rain");
  }

  if (eventId === "love_crisis" && optionId === "break_up") {
    state.hasPartner = false;
    state.guaranteedEvents.loveCrisisCountdown = 0;
    unlockAchievement(state, "happy_breakup");
  }

  recordAiEventEncounter(state, eventId);

  if (
    !state.hasPartner
    && ((eventId === "chat_up" && optionId === "talk") || (eventId === "ambiguous" && optionId === "closer"))
    && (state.attributes?.social ?? 0) >= 40
    && state.energy >= 45
    && state.pressure <= 70
    && (state.attributes?.aesthetic ?? 0) >= 40
  ) {
    state.hasPartner = true;
    state.guaranteedEvents.loveCrisisCountdown = 2;
    unlockAchievement(state, "mutual_love");
  }

  if (isSocialRefusal(eventId, optionId)) {
    state.achievementTally.socialRefusals = (state.achievementTally.socialRefusals ?? 0) + 1;
    if (state.achievementTally.socialRefusals > 2) {
      unlockAchievement(state, "socially_anxious");
    }
  }
}

export function recordAiEventEncounter(state, eventId) {
  ensureAchievementTally(state);
  const event = RANDOM_EVENTS.find((item) => item.id === eventId);
  if (event?.tags?.includes("ai") || eventId.includes("ai_")) {
    unlockAchievement(state, "ai_hello");
  }
}

export function recordCourseSelection(state) {
  unlockAchievement(state, "course_selected");
}

export function recordCourseExamResult(state, correctCount) {
  if (correctCount >= 3) unlockAchievement(state, "perfect_course_exam");
}

export function recordReviewStart(state) {
  unlockAchievement(state, "first_review");
}

export function recordMentorTaskResult(state, mentorResult) {
  if (!mentorResult) return;
  const tally = ensureAchievementTally(state);
  if (mentorResult.success) {
    tally.mentorTaskSuccessStreak = (tally.mentorTaskSuccessStreak ?? 0) + 1;
    unlockAchievement(state, "mentor_approval");
    if (tally.mentorTaskSuccessStreak >= 6) unlockAchievement(state, "mentor_streak");
  } else {
    tally.mentorTaskSuccessStreak = 0;
  }
}

export function recordReviewResult(state, record) {
  if (!record) return;
  ensureAchievementTally(state);

  if (record.baseGrade === "F" && record.finalGrade !== "F") unlockAchievement(state, "survivor");
  if (record.baseGrade === "D" && record.strategySucceeded && gradeAtLeast(record.finalGrade, "C")) unlockAchievement(state, "eloquent_report");
  if (state.achievementTally.crunchStartedUnder20SemesterIndex === record.semesterIndex && gradeAtLeast(record.finalGrade, "A")) {
    unlockAchievement(state, "crunch_week_comeback");
  }
  if (record.finalGrade === "B") unlockAchievement(state, "good_drawing");
  if (record.finalGrade === "A") unlockAchievement(state, "craft_piece");
  if (record.finalGrade === "S") unlockAchievement(state, "young_talent");
  if (record.finalGrade === "F") unlockAchievement(state, "first_fail_review");

  const previous = state.reviews?.at(-2);
  if (previous?.finalGrade === "F" && gradeAtLeast(record.finalGrade, "A")) unlockAchievement(state, "comeback_after_fail");
  if (record.finalGrade === "D" && record.qualityScore === 60) unlockAchievement(state, "lucky_pass");

  const lastFour = state.reviews?.slice(-4) ?? [];
  const lastTwo = lastFour.slice(-2);
  const lastThree = state.reviews?.slice(-3) ?? [];
  const lastFive = state.reviews?.slice(-5) ?? [];
  const lastSix = state.reviews?.slice(-6) ?? [];
  if (lastFive.length === 5 && lastFive.every((item) => gradeAtLeast(item.finalGrade, "B"))) unlockAchievement(state, "stable_grade");
  if (lastThree.length === 3 && lastThree.every((item) => item.finalGrade === "S")) unlockAchievement(state, "next_master");
  if (lastTwo.length === 2 && lastTwo.every((item) => item.finalGrade !== "F")) unlockAchievement(state, "no_fail_one_year");
  if (lastSix.length === 6 && lastSix.every((item) => item.finalGrade !== "F")) unlockAchievement(state, "no_fail_two_years");

  if ((state.portfolio ?? 0) >= 480) unlockAchievement(state, "portfolio_start");
  if ((state.portfolio ?? 0) >= 580) unlockAchievement(state, "portfolio_top");
  if ((state.portfolio ?? 0) >= 680) unlockAchievement(state, "portfolio_perfect");
  checkResumeAchievements(state);
  checkAttributeAchievements(state);
}

export function recordReviewResultConfirmed(state, reviewResult) {
  const semesterIndex = Number(reviewResult?.semesterIndex ?? state.reviews?.at(-1)?.semesterIndex);
  if (semesterIndex === 1) unlockAchievement(state, "first_semester");
  if (semesterIndex === 2) unlockAchievement(state, "first_year_done");
}

export function recordWeeklySettlement(state) {
  const tally = ensureAchievementTally(state);
  checkActionAchievementWindows(state);
  if (isModelWeekAchievementWindow(state) && state.energy >= 30 && state.pressure <= 80) unlockAchievement(state, "model_week_clear");
  if (state.pressure > 90) unlockAchievement(state, "alexander");
  if (state.energy <= 20) unlockAchievement(state, "nearly_drained");
  if (state.energy === 0) unlockAchievement(state, "burned_out");
  if (!state.ending && (state.pressureOver80Weeks ?? 0) >= 2) unlockAchievement(state, "pressure_king");
  recordInternship(state);
  if (state.money >= weeklyLivingCost(state)) {
    tally.moneySafeWeekStreak = (tally.moneySafeWeekStreak ?? 0) + 1;
  } else {
    tally.moneySafeWeekStreak = 0;
  }
  if (tally.moneySafeWeekStreak >= WEEKS_PER_SEMESTER * 2) unlockAchievement(state, "money_manager");
  checkAttributeAchievements(state);
}

export function recordSummerEventComplete(state) {
  unlockAchievement(state, "summer_sketch");
  checkAttributeAchievements(state);
}

export function recordRouteParticipation(state, option) {
  if (!option) return;
  if (option.route === "保研") unlockAchievement(state, "route_recommendation");
  if (option.route === "考研") unlockAchievement(state, "route_postgrad");
  if (option.route === "留学") {
    unlockAchievement(state, "route_overseas");
    if ((state.ieltsScore ?? 0) > 0) unlockAchievement(state, "first_ielts");
  }
  if (option.route === "选调") unlockAchievement(state, "route_public_service");
  if (option.route === "考公") unlockAchievement(state, "route_civil_service");
  if (option.route === "考编") unlockAchievement(state, "route_public_institution");
  if (option.route === "建筑工作") {
    unlockAchievement(state, "route_architecture");
    if (option.target?.includes("大师") || option.target?.includes("外企")) unlockAchievement(state, "brave_one");
  }
  if (option.route === "转行") {
    unlockAchievement(state, "route_career_change");
    if (option.target === "AI产品经理") unlockAchievement(state, "ai_career_line");
  }
}

export function recordCompetitionSubmission(state, awardLevel = null) {
  unlockAchievement(state, "first_competition_submission");
  if (awardLevel === "third") unlockAchievement(state, "competition_third_prize");
  if (awardLevel === "second") unlockAchievement(state, "competition_second_prize");
  if (awardLevel === "first") unlockAchievement(state, "competition_first_prize");
  if (totalCompetitionAwardCount(state) >= 2) unlockAchievement(state, "competition_awards_two");
  checkResumeAchievements(state);
}

export function recordInternship(state) {
  if ((state.internshipValue ?? 0) > 0) unlockAchievement(state, "first_internship");
  checkResumeAchievements(state);
}

export function recordIeltsExam(state) {
  unlockAchievement(state, "first_ielts");
  checkResumeAchievements(state);
}

export function recordWanliRoadVisit(state) {
  const visits = state.eventTally?.wanliRoadVisits ?? 0;
  if (visits >= 1) unlockAchievement(state, "first_wanli_road");
  if (isModelOrCrunchAchievementWindow(state)) unlockAchievement(state, "wanli_busy_break");
  if (visits >= 5) unlockAchievement(state, "wanli_five_cities");
  if (visits >= 10) unlockAchievement(state, "wanli_long_march");
  checkResumeAchievements(state);
}

function isModelWeekAchievementWindow(state) {
  return state.weekInSemester === 5 && state.semesterIndex !== 9;
}

function isModelOrCrunchAchievementWindow(state) {
  return (state.weekInSemester === 5 || state.weekInSemester === 6) && state.semesterIndex !== 9;
}

export function recordFinalEnding(state) {
  const tally = ensureAchievementTally(state);
  if (state.ending) {
    recordEndingScore(state, tally, state.ending);
    addUnique(tally.endingIds, state.ending);
  }

  if (state.completedGraduationDesign && state.ending && !FAILURE_ENDING_IDS.has(state.ending)) {
    unlockAchievement(state, "university_graduation");
  }
  if (tally.endingIds.length >= 10) unlockAchievement(state, "ending_collection_10");
  if (tally.endingIds.length >= 20) unlockAchievement(state, "ending_collection_20");
  if (tally.endingIds.length >= Object.keys(ENDINGS).length) unlockAchievement(state, "ending_collection_all");
  checkResumeAchievements(state);
}

export function checkAttributeAchievements(state) {
  const achievementByAttribute = {
    design: "design_master",
    software: "software_master",
    aesthetic: "artist",
    presentation: "presentation_master",
    social: "social_butterfly",
    resilience: "pressure_proof",
  };

  for (const [key, achievementId] of Object.entries(achievementByAttribute)) {
    if ((state.attributes?.[key] ?? 0) >= 80) unlockAchievement(state, achievementId);
  }
  if (ATTRIBUTE_KEYS.every((key) => (state.attributes?.[key] ?? 0) >= 100)) {
    unlockAchievement(state, "hexagon_warrior");
  }
  if (["design", "software", "aesthetic", "presentation"].every((key) => (state.attributes?.[key] ?? 0) >= 100)) {
    unlockAchievement(state, "strong_player");
  }
}

export function unlockAchievement(state, achievementId) {
  const achievement = ACHIEVEMENTS[achievementId];
  state.unlockedAchievements = Array.isArray(state.unlockedAchievements)
    ? [...new Set(state.unlockedAchievements)]
    : [];
  const historicalAchievements = new Set(state.achievementTally?.historicalAchievementIds ?? []);
  if (!achievement || historicalAchievements.has(achievementId) || state.unlockedAchievements.includes(achievementId)) {
    return false;
  }

  state.unlockedAchievements.push(achievementId);
  state.achievementScore = (state.achievementScore ?? 0) + achievement.score;
  log(state, "achievement", `achievement:${achievementId}`, `成就解锁：${achievement.title}`, { achievementScore: achievement.score });
  queueAchievementToast(state, {
    id: achievementId,
    achievementId,
    title: achievement.title,
    body: achievement.body,
    score: achievement.score,
  });
  if (!ACHIEVEMENT_COLLECTION_IDS.has(achievementId)) {
    checkAchievementCollectionAchievements(state);
  }
  return true;
}

function checkActionAchievementWindows(state) {
  if (totalActionCount(state, "crunch_drawing") >= 75) unlockAchievement(state, "three_all_nighters");
  if (totalActionCount(state, "crunch_drawing") >= 150) unlockAchievement(state, "all_night_champion");

  const streak = state.achievementTally?.weekActionStreak;
  if (streak?.week === state.week) {
    const maxCountsByAction = streak.maxCountsByAction ?? (streak.actionId
      ? { [streak.actionId]: streak.maxCount ?? streak.count ?? 0 }
      : {});
    for (const [actionId, count] of Object.entries(maxCountsByAction)) {
      for (const [requiredCount, achievementId] of sameWeekStreakUnlocks(actionId)) {
        if (count >= requiredCount) unlockAchievement(state, achievementId);
      }
    }
  }

  for (const actionId of Object.keys(state.actionTally ?? {})) {
    const runCount = state.actionTally?.[actionId] ?? 0;
    const totalCount = totalActionCount(state, actionId);
    for (const [count, achievementId, scope = "run"] of actionUnlocks(actionId)) {
      const countToRead = scope === "total" ? totalCount : runCount;
      if (countToRead >= count) unlockAchievement(state, achievementId);
    }
  }
}

function checkAchievementCollectionAchievements(state) {
  const unlockedCount = new Set([
    ...(state.achievementTally?.historicalAchievementIds ?? []),
    ...(state.unlockedAchievements ?? []),
  ]).size;
  if (unlockedCount >= 25) unlockAchievement(state, "achievement_collection_25");
  if (unlockedCount >= 50) unlockAchievement(state, "achievement_collection_50");
  if (unlockedCount >= Object.keys(ACHIEVEMENTS).length - 1) unlockAchievement(state, "achievement_collection_all");
}

function sameWeekStreakUnlocks(actionId) {
  return {
    learn_ai_software: [[2, "ai_fan"]],
    read_exhibition: [[2, "art_influence"]],
    design_iteration: [[3, "brainstorm"]],
    rest: [[2, "total_slack"]],
  }[actionId] ?? [];
}

function actionUnlocks(actionId) {
  return {
    design_iteration: [[150, "design_thinking", "total"]],
    site_research: [[10, "fresh_air"], [20, "muddy_legs", "total"], [50, "worn_shoes", "total"]],
    exercise: [[20, "fitness_fan", "total"], [50, "iron_person", "total"]],
    socialize: [[50, "team_building", "total"], [100, "social_extreme", "total"]],
    rest: [[15, "lying_flat"]],
    outsourcing: [[6, "grind_king"], [10, "money_printer"]],
    part_time: [[6, "work_study"], [10, "special_forces"]],
  }[actionId] ?? [];
}

function totalActionCount(state, actionId) {
  return (state.achievementTally?.historicalActionTally?.[actionId] ?? 0)
    + (state.actionTally?.[actionId] ?? 0);
}

function totalShopPurchaseCount(state, shopItemId) {
  return (state.achievementTally?.historicalShopPurchaseCounts?.[shopItemId] ?? 0)
    + runShopPurchaseCount(state, shopItemId);
}

function runShopPurchaseCount(state, shopItemId) {
  return (state.achievementTally?.shopPurchases ?? []).filter((purchase) => purchase.id === shopItemId).length;
}

function totalCompetitionAwardCount(state) {
  return (state.achievementTally?.historicalCompetitionAwardCount ?? 0)
    + (state.competitionAwardCount ?? 0);
}

function totalCoffeeSupportClicks(state) {
  return (state.achievementTally?.historicalCoffeeSupportClicks ?? 0)
    + (state.achievementTally?.coffeeSupportClicks ?? 0);
}

function checkResumeAchievements(state) {
  const hasIeltsScore = (state.ieltsScore ?? 0) > 0;
  const hasCompetitionAward = (state.competitionAwardCount ?? 0) > 0
    || (state.competitionRecords ?? []).some((record) => record?.award && record.award !== "none");
  const hasInternshipExperience = (state.internshipValue ?? 0) > 0
    || (state.internshipRecords ?? []).length > 0;
  if (hasIeltsScore && hasCompetitionAward && hasInternshipExperience) unlockAchievement(state, "resume_ready");
}

function recordSameWeekStreak(state, actionId) {
  const tally = ensureAchievementTally(state);
  const previous = tally.weekActionStreak ?? {};
  const sameWeek = previous.week === state.week;
  const count = sameWeek && previous.actionId === actionId
    ? previous.count + 1
    : 1;
  const previousMaxCounts = previous.maxCountsByAction ?? (sameWeek && previous.actionId
    ? { [previous.actionId]: previous.maxCount ?? previous.count ?? 0 }
    : {});
  const maxCountsByAction = sameWeek
    ? { ...previousMaxCounts }
    : {};
  maxCountsByAction[actionId] = Math.max(maxCountsByAction[actionId] ?? 0, count);
  tally.weekActionStreak = previous.week === state.week && previous.actionId === actionId
    ? {
      week: state.week,
      actionId,
      count,
      maxCount: maxCountsByAction[actionId],
      maxCountsByAction,
    }
    : { week: state.week, actionId, count, maxCount: maxCountsByAction[actionId], maxCountsByAction };
}

function gradeAtLeast(grade, target) {
  return GRADE_ORDER.indexOf(grade) >= GRADE_ORDER.indexOf(target);
}

function isSocialRefusal(eventId, optionId) {
  const event = RANDOM_EVENTS.find((item) => item.id === eventId);
  const tags = event?.tags ?? [];
  return (tags.includes("play") || SOCIAL_REFUSAL_EVENT_IDS.has(eventId)) && SOCIAL_REFUSAL_OPTION_IDS.has(optionId);
}

function ensureAchievementTally(state) {
  state.achievementTally = state.achievementTally ?? {};
  state.achievementTally.socialRefusals = state.achievementTally.socialRefusals ?? 0;
  state.achievementTally.purchasedShopItemIds = Array.isArray(state.achievementTally.purchasedShopItemIds)
    ? state.achievementTally.purchasedShopItemIds
    : [];
  state.achievementTally.shopPurchases = Array.isArray(state.achievementTally.shopPurchases)
    ? state.achievementTally.shopPurchases
    : [];
  state.achievementTally.historicalAchievementIds = Array.isArray(state.achievementTally.historicalAchievementIds)
    ? state.achievementTally.historicalAchievementIds
    : [];
  state.achievementTally.historicalActionTally = state.achievementTally.historicalActionTally
    && typeof state.achievementTally.historicalActionTally === "object"
      ? state.achievementTally.historicalActionTally
      : {};
  state.achievementTally.historicalShopPurchaseCounts = state.achievementTally.historicalShopPurchaseCounts
    && typeof state.achievementTally.historicalShopPurchaseCounts === "object"
      ? state.achievementTally.historicalShopPurchaseCounts
      : {};
  state.achievementTally.historicalCompetitionAwardCount = state.achievementTally.historicalCompetitionAwardCount ?? 0;
  state.achievementTally.historicalCoffeeSupportClicks = state.achievementTally.historicalCoffeeSupportClicks ?? 0;
  state.achievementTally.historicalEndingCounts = state.achievementTally.historicalEndingCounts
    && typeof state.achievementTally.historicalEndingCounts === "object"
      ? state.achievementTally.historicalEndingCounts
      : {};
  state.achievementTally.coffeeSupportClicks = state.achievementTally.coffeeSupportClicks ?? 0;
  state.achievementTally.actionHistory = Array.isArray(state.achievementTally.actionHistory)
    ? state.achievementTally.actionHistory
    : [];
  state.achievementTally.weekActionStreak = state.achievementTally.weekActionStreak ?? null;
  state.achievementTally.mentorTaskSuccessStreak = state.achievementTally.mentorTaskSuccessStreak ?? 0;
  state.achievementTally.moneySafeWeekStreak = state.achievementTally.moneySafeWeekStreak ?? 0;
  state.achievementTally.crunchStartedUnder20SemesterIndex = state.achievementTally.crunchStartedUnder20SemesterIndex
    ?? state.achievementTally.crunchStartedUnder60SemesterIndex
    ?? null;
  delete state.achievementTally.crunchStartedUnder60SemesterIndex;
  state.achievementTally.endingIds = Array.isArray(state.achievementTally.endingIds)
    ? state.achievementTally.endingIds
    : [];
  state.achievementTally.scoredEndingId = state.achievementTally.scoredEndingId ?? null;
  state.achievementTally.characterIds = Array.isArray(state.achievementTally.characterIds)
    ? state.achievementTally.characterIds
    : [];
  state.achievementTally.mentorIds = Array.isArray(state.achievementTally.mentorIds)
    ? state.achievementTally.mentorIds
    : [];
  return state.achievementTally;
}

function recordEndingScore(state, tally, endingId) {
  if (tally.scoredEndingId === endingId) return;

  const wasUnlocked = tally.endingIds.includes(endingId);
  const priorCount = Math.max(
    Number(tally.historicalEndingCounts?.[endingId]) || 0,
    wasUnlocked ? 1 : 0,
  );
  const score = scoreForEndingAchievement({
    firstScore: ENDINGS[endingId]?.score ?? 0,
    priorCount,
  });
  if (wasUnlocked) {
    state.endingRepeatScore = (state.endingRepeatScore ?? 0) + score;
  } else {
    state.endingScore = (state.endingScore ?? 0) + score;
    queueEndingToast(state, endingId, score);
  }
  tally.historicalEndingCounts[endingId] = priorCount + 1;
  tally.scoredEndingId = endingId;
}

function queueEndingToast(state, endingId, score) {
  const ending = ENDINGS[endingId];
  if (!ending) return;
  const toastId = `ending-${endingId}`;
  queueAchievementToast(state, {
    id: toastId,
    achievementId: toastId,
    title: ending.title,
    body: "人生结局已收录至结局图鉴。",
    score,
    prefix: "结局达成！",
    kind: "ending",
  });
}

function queueAchievementToast(state, toast) {
  const toastId = toast?.id ?? toast?.achievementId;
  if (!toastId) return false;
  const queuedToasts = state.achievementToasts ?? [];
  if (queuedToasts.some((queued) => (queued.id ?? queued.achievementId) === toastId)) return false;
  state.achievementToasts = [
    {
      ...toast,
      id: toast.id ?? toastId,
      achievementId: toast.achievementId ?? toastId,
      shownAt: toast.shownAt ?? Date.now(),
      slot: 0,
    },
    ...queuedToasts.map((queued, index) => ({ ...queued, slot: index + 1 })),
  ];
  return true;
}

function addUnique(list, value) {
  if (!value || list.includes(value)) return list;
  list.push(value);
  return list;
}
