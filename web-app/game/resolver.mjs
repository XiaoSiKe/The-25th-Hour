import {
  ATTRIBUTE_KEYS,
  BASE_ACTIONS_PER_WEEK,
  GRADE_ORDER,
  GRADE_SCORE_RANGES,
  GRADE_TO_GPA,
  ARCHITECTURE_INTERNSHIP_OPTIONS,
  INTERNSHIP_APPLICATION,
  INTERNSHIP_COMPLETION_DELTAS,
  INTERNSHIP_SHORT_EVENTS,
  INTERNSHIP_WEEKLY_DELTAS,
  WEEKS_PER_SEMESTER,
  ROUTE_OPTIONS,
} from "./data.mjs";
import { getCharacter, getFamily, log, pushModal } from "./state.mjs";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function progressCap(state) {
  const base = state.semesterIndex >= 9 ? 250 : 100;
  const ease = activeReviewEase(state);
  return Math.max(0, base + (ease?.progressCap ?? 0));
}

export function qualityCap(state) {
  return state.semesterIndex >= 9 ? 250 : 100;
}

const GRADUATION_DESIGN_FINAL_PROGRESS_REQUIREMENT = 240;

export function currentRiskLevel(state) {
  if (state.energy < 30 || state.pressure > 80) {
    return "critical";
  }
  if ((state.energy >= 30 && state.energy < 60) || (state.pressure > 50 && state.pressure <= 80)) {
    return "warning";
  }
  return "stable";
}

export function currentRiskPenalty(state) {
  const level = currentRiskLevel(state);
  return level === "critical" ? 2 : level === "warning" ? 1 : 0;
}

export function applyPositiveYieldPenalty(value, penalty) {
  if (value <= 0 || penalty <= 0) {
    return value;
  }
  const reduced = value - penalty;
  if (reduced > 0) {
    return reduced;
  }
  return value;
}

export function previewDelta(state, rawDelta = {}, options = {}) {
  const delta = adjustDeltaForPassives(state, { ...rawDelta }, { ...options, preview: options.preview === true });
  return adjustAttributeGrowth(state, delta);
}

export function progressModifier(state) {
  const software = state.attributes.software;
  if (software >= 80) return 3;
  if (software >= 60) return 2;
  if (software >= 40) return 1;
  return 0;
}

export function qualityModifier(state) {
  const qualityUnderstanding = Math.floor((state.attributes.design + state.attributes.aesthetic) / 2);
  if (qualityUnderstanding >= 80) return 3;
  if (qualityUnderstanding >= 60) return 2;
  if (qualityUnderstanding >= 40) return 1;
  return 0;
}

export function applyDelta(state, source, label, rawDelta = {}, phase = state.phase, options = {}) {
  if (state.ending) {
    return {};
  }

  const adjusted = previewDelta(state, rawDelta, options);

  state.energy += adjusted.energy ?? 0;
  state.pressure += adjusted.pressure ?? 0;
  state.money += adjusted.money ?? 0;
  state.maxEnergy += adjusted.maxEnergy ?? 0;
  state.progress += adjusted.progress ?? 0;
  state.quality += adjusted.quality ?? 0;
  state.portfolio += adjusted.portfolio ?? 0;
  state.internshipValue += adjusted.internshipValue ?? 0;
  recordInternshipDelta(state, label, adjusted.internshipValue ?? 0);
  state.gpaModifier = normalizedNumber(state.gpaModifier) + (adjusted.gpaModifier ?? 0);
  if ((adjusted.gpa ?? 0) !== 0) {
    state.gpaDirectAdjustment = normalizedNumber(state.gpaDirectAdjustment) + adjusted.gpa;
    recalculateGpa(state);
  }

  for (const key of ATTRIBUTE_KEYS) {
    const amount = adjusted[key] ?? 0;
    state.attributes[key] += amount;
    state.attributes[key] = clamp(state.attributes[key], 0, 100);
    if (amount > 0) {
      state.semesterAttributeGrowth[key] += amount;
    }
  }

  state.pressure = clamp(state.pressure, 0, 100);
  state.energy = Math.min(state.energy, state.maxEnergy);
  state.progress = clamp(state.progress, 0, progressCap(state));
  state.quality = clamp(state.quality, 0, qualityCap(state));

  maybeTriggerRelaxedPassive(state);
  checkImmediateFailures(state);
  log(state, phase, source, label, adjusted);
  return adjusted;
}

function recordInternshipDelta(state, label, value) {
  if (!(value > 0)) return;
  state.internshipRecords = Array.isArray(state.internshipRecords) ? state.internshipRecords : [];
  const active = state.activeInternship;
  state.internshipRecords.push({
    semesterIndex: active?.startSemesterIndex ?? state.semesterIndex,
    year: active?.startYear ?? state.year,
    term: active?.startTerm ?? state.term,
    week: active?.startWeek ?? state.week,
    completedWeek: state.week,
    targetId: active?.targetId,
    targetLabel: active?.targetLabel,
    target: active?.targetLabel ?? internshipTargetFromLabel(label),
    tier: active?.tier,
    value,
    designAtOffer: active?.designAtOffer,
    softwareAtOffer: active?.softwareAtOffer,
    wageTotal: active?.wageTotal,
    weeksCompleted: active?.weeksCompleted,
    shortEventId: active?.shortEventTriggered ? active?.shortEventId : undefined,
    shortEventWeek: active?.shortEventTriggered ? active?.shortEventWeek : undefined,
  });
}

function internshipTargetFromLabel(label) {
  const normalized = String(label ?? "").split("：").pop().trim();
  return normalized.replace(/实习$/u, "") || "建筑相关岗位";
}

export function checkImmediateFailures(state) {
  if (state.ending) {
    return;
  }
  if (state.money < 0) {
    state.failureReason = "living_cost_break";
    state.ending = "living_cost_break";
    state.phase = "ending";
    log(state, "ending", "failure_check", "金钱小于 0，触发生活费断裂", {});
  }
  if (!state.ending && state.energy < 0) {
    state.failureReason = "forced_suspension";
    state.ending = "forced_suspension";
    state.phase = "ending";
    log(state, "ending", "failure_check", "精力小于 0，触发被迫停学", {});
  }
  if (!state.ending && state.pressure >= 100) {
    state.failureReason = "pressure_collapse";
    state.ending = "pressure_collapse";
    state.phase = "ending";
    log(state, "ending", "failure_check", "压力达到 100，触发压力失控", {});
  }
}

export function weeklyLivingCost(state) {
  return getFamily(state).weeklyLivingCost;
}

export function monthlyAllowance(state) {
  return getFamily(state).monthlyAllowance;
}

export function applyWeeklySettlement(state) {
  if (state.ending) {
    return;
  }

  applyDelta(state, "weekly_living_cost", "每周自动花费", { money: -weeklyLivingCost(state) }, "week_settlement");
  if (state.ending) return;

  const shopWeeklyDelta = shopWeeklyRecoveryDelta(state);
  if (Object.keys(shopWeeklyDelta).length > 0) {
    applyDelta(state, "shop_weekly_recovery", "商店长期恢复", shopWeeklyDelta, "week_settlement", { skipPassive: true });
  }
  if (state.ending) return;

  applyActiveInternshipWeek(state);
  if (state.ending) return;

  if (state.pressure > 90) {
    state.pressureOver90Weeks += 1;
  } else {
    state.pressureOver90Weeks = 0;
  }

  if (state.pressureOver90Weeks >= 2) {
    state.failureReason = "pressure_collapse";
    state.ending = "pressure_collapse";
    state.phase = "ending";
    log(state, "ending", "failure_check", "压力 > 90 连续 2 周", {});
    return;
  }

  applyDelta(state, "weekly_recovery", "每周基础恢复", { energy: 10, pressure: -5 }, "week_settlement");
  if (state.ending) return;

  if (state.pressure > 80) {
    state.pressureOver80Weeks = (state.pressureOver80Weeks ?? 0) + 1;
  } else {
    state.pressureOver80Weeks = 0;
  }

}

export function applyActiveInternshipWeek(state) {
  const active = state.activeInternship;
  if (!active || state.ending) {
    return;
  }

  const weeklyDelta = INTERNSHIP_WEEKLY_DELTAS[active.tier];
  if (!weeklyDelta) {
    return;
  }

  active.remainingWeeks = Math.max(0, Number(active.remainingWeeks ?? INTERNSHIP_APPLICATION.durationWeeks) - 1);
  active.weeksCompleted = Number(active.weeksCompleted ?? 0) + 1;
  active.wageTotal = Number(active.wageTotal ?? 0) + (weeklyDelta.money ?? 0);
  applyDelta(state, "internship_week", `实习进行：${active.targetLabel ?? "建筑相关岗位"}`, weeklyDelta, "week_settlement");
  if (state.ending) {
    return;
  }
  maybeTriggerInternshipShortEvent(state, active);
  if (state.ending || active.remainingWeeks > 0) {
    return;
  }

  completeActiveInternship(state, active);
}

function completeActiveInternship(state, active) {
  const completionDelta = INTERNSHIP_COMPLETION_DELTAS[active.tier] ?? {};
  if (active.tier === "named_firm") {
    state.namedFirmInternship = true;
  }
  const adjustedDelta = applyDelta(
    state,
    "internship_complete",
    `实习完成：${active.targetLabel ?? "建筑相关岗位"}`,
    { ...completionDelta, internshipValue: active.value ?? 0 },
    "week_settlement",
  );
  state.activeInternship = null;
  log(state, "week_settlement", "internship_resume", `实习经历写入简历：${active.targetLabel ?? "建筑相关岗位"}`, {});
  queueInternshipCompletionModal(state, active, adjustedDelta);
}

function queueInternshipCompletionModal(state, active, adjustedDelta) {
  pushModal(state, {
    type: "choice_result",
    internshipResult: "completed",
    internshipTier: active.tier,
    internshipOptionId: active.targetId,
    title: "实习结束",
    kicker: "结束流程",
    body: [
      `你完成了「${active.targetLabel ?? "建筑相关岗位"}」的 ${active.weeksCompleted ?? INTERNSHIP_APPLICATION.durationWeeks} 周实习。`,
      `累计薪资：￥${Number(active.wageTotal ?? 0)}。`,
      "这段经历已经写入个人简历。",
    ].join("\n"),
    delta: adjustedDelta,
    blocks: true,
    options: [{ id: "confirm", label: formatDeltaSummary(adjustedDelta), delta: adjustedDelta }],
  });
}

function formatDeltaSummary(delta = {}) {
  const labels = {
    internshipValue: "实习价值",
    design: "设计水平",
    software: "软件技术",
    presentation: "汇报表达",
    social: "人际交往",
    resilience: "抗压能力",
    money: "金钱",
    energy: "精力",
    pressure: "压力",
  };
  const parts = Object.entries(delta)
    .filter(([, value]) => Number(value) !== 0)
    .map(([key, value]) => `${labels[key] ?? key} ${value > 0 ? "+" : ""}${value}`);
  return parts.length ? parts.join("，") : "无数值变化";
}

export function internshipApplicationAvailability(state, optionId) {
  const option = ROUTE_OPTIONS.find((item) => item.id === optionId);
  const config = ARCHITECTURE_INTERNSHIP_OPTIONS[optionId];
  if (!option || !config) {
    return { state: "disabled", reason: "实习配置缺失" };
  }
  if (state.semesterIndex < INTERNSHIP_APPLICATION.earliestSemester) {
    return { state: "disabled", reason: "大二学年开启实习入口" };
  }
  if (state.activeInternship) {
    return { state: "disabled", reason: "已有进行中的实习" };
  }
  if (state.energy < 30) {
    return { state: "disabled", reason: "精力高危，先恢复精力再申请实习" };
  }
  if ((state.internshipAppliedSemesters ?? []).includes(state.semesterIndex)) {
    return { state: "disabled", reason: "本学期已申请过实习" };
  }
  if (hasCompletedInternshipTarget(state, option)) {
    return { state: "disabled", reason: "已完成该单位实习" };
  }

  const tierRule = INTERNSHIP_APPLICATION.tiers[config.tier];
  if (!tierRule) {
    return { state: "disabled", reason: "实习档位配置缺失" };
  }
  if (internshipApplicationCountForTier(state, config.tier) >= tierRule.maxAttempts) {
    return { state: "disabled", reason: "该档位申请次数已达上限" };
  }

  const missingAttributes = missingInternshipAttributes(state, config);
  if (missingAttributes.length) {
    return { state: "disabled", reason: missingAttributes.join("；") };
  }
  return { state: "available", reason: "" };
}

export function internshipApplicationChance(state, config) {
  const tierRule = INTERNSHIP_APPLICATION.tiers[config?.tier];
  if (!tierRule) {
    return 0;
  }
  const thresholds = effectiveInternshipAttributes(state, config.requirements?.attributes ?? {});
  const designExcess = Math.min(tierRule.excessCap, Math.max(0, (state.attributes?.design ?? 0) - (thresholds.design ?? 0)));
  const softwareExcess = Math.min(tierRule.excessCap, Math.max(0, (state.attributes?.software ?? 0) - (thresholds.software ?? 0)));
  const averageExcess = (designExcess + softwareExcess) / 2;
  return Math.min(tierRule.maxChance, Math.round(tierRule.baseChance + averageExcess * tierRule.excessMultiplier));
}

export function hasInternshipShortEventThisWeek(state) {
  const active = state.activeInternship;
  if (!active?.shortEventId || active.shortEventTriggered) {
    return false;
  }
  if (state.eventTally?.[active.shortEventId]) {
    return false;
  }
  return Number(active.shortEventWeek) === Number(active.weeksCompleted ?? 0) + 1;
}

function maybeTriggerInternshipShortEvent(state, active) {
  if (!shouldTriggerInternshipShortEventNow(state, active)) {
    return;
  }
  const event = (INTERNSHIP_SHORT_EVENTS[active.tier] ?? []).find((item) => item.id === active.shortEventId);
  if (!event) {
    return;
  }

  active.shortEventTriggered = true;
  state.eventHistory = Array.isArray(state.eventHistory) ? state.eventHistory : [];
  state.eventLastTriggeredWeek = state.eventLastTriggeredWeek ?? {};
  state.eventTally = state.eventTally ?? {};
  state.eventHistory.push({ id: event.id, week: state.week, semesterIndex: state.semesterIndex, optionId: null });
  state.eventLastTriggeredWeek[event.id] = state.week;
  state.eventTally[event.id] = (state.eventTally[event.id] ?? 0) + 1;
  const adjustedDelta = applyDelta(state, `event:${event.id}`, `实习短事件：${event.title}`, event.delta, "week_settlement");
  pushModal(state, {
    type: "random_event",
    eventId: event.id,
    title: event.title,
    body: event.body,
    trigger: "internship",
    delta: adjustedDelta,
    blocks: true,
    options: [{ id: "confirm", label: formatInternshipEventConfirmLabel(active, adjustedDelta), delta: adjustedDelta }],
  });
}

function formatInternshipEventConfirmLabel(active, delta = {}) {
  const targetLabel = active?.targetLabel ?? "建筑相关岗位";
  const week = Number(active?.shortEventWeek ?? active?.weeksCompleted ?? 1);
  return `${targetLabel}第${formatWeekNumber(week)}周实习：${formatCompactDeltaSummary(delta)}`;
}

function formatWeekNumber(week) {
  const labels = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return Number.isInteger(week) && labels[week] ? labels[week] : String(week || 1);
}

function formatCompactDeltaSummary(delta = {}) {
  return formatDeltaSummary(delta).replaceAll(" ", "");
}

function shouldTriggerInternshipShortEventNow(state, active) {
  if (!active?.shortEventId || active.shortEventTriggered) {
    return false;
  }
  if (state.eventTally?.[active.shortEventId]) {
    return false;
  }
  return Number(active.shortEventWeek) === Number(active.weeksCompleted ?? 0);
}

export function effectiveInternshipAttributes(state, attributes = {}) {
  const adjustment = internshipThresholdAdjustment(state);
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [key, Math.max(0, Number(value) + adjustment)]),
  );
}

export function internshipThresholdAdjustment(state) {
  switch (getCharacter(state)?.id) {
    case "corbusier_heir":
      return -7;
    case "gene_rebel":
      return -5;
    default:
      return 0;
  }
}

export function internshipApplicationCountForTier(state, tier) {
  return (state.internshipApplications ?? []).filter((application) => application.tier === tier).length;
}

export function completedInternshipTierValue(state) {
  return (state.internshipRecords ?? []).reduce((max, record) => Math.max(max, Number(record?.value) || 0), 0);
}

function missingInternshipAttributes(state, config) {
  const thresholds = effectiveInternshipAttributes(state, config.requirements?.attributes ?? {});
  return Object.entries(thresholds)
    .filter(([key, value]) => (state.attributes?.[key] ?? 0) < value)
    .map(([key, value]) => `${internshipAttributeLabel(key)}需要 ${value}`);
}

function internshipAttributeLabel(key) {
  return {
    design: "设计水平",
    software: "软件技术",
  }[key] ?? key;
}

function hasCompletedInternshipTarget(state, option) {
  const label = String(option?.target ?? option?.label ?? "").trim();
  return (state.internshipRecords ?? []).some((record) => (
    record?.targetId === option?.id
    || String(record?.targetLabel ?? record?.target ?? "").trim() === label
  ));
}

export function isMoneyHighRisk(state) {
  return state.money < weeklyLivingCost(state);
}

export function isGraduationSemester(state) {
  return state.semesterIndex >= 9;
}

export function reviewProgressRequirement(state) {
  const base = state.semesterIndex === 10
    ? GRADUATION_DESIGN_FINAL_PROGRESS_REQUIREMENT
    : state.semesterIndex >= 9
      ? GRADUATION_DESIGN_FINAL_PROGRESS_REQUIREMENT
      : 90;
  const ease = activeReviewEase(state);
  const progressGate = state.semesterIndex >= 9
    ? ease?.graduationProgressGate ?? ease?.progressGate
    : ease?.progressGate;
  if (progressGate !== undefined) {
    return Math.max(0, base + progressGate);
  }
  return base;
}

export function reviewQualityFGate(state) {
  return 60;
}

export function reviewQualityScore(state) {
  return state.semesterIndex >= 9
    ? Math.floor((state.quality / qualityCap(state)) * 100)
    : state.quality;
}

export function gradeFromQuality(state, qualityScore) {
  const fGate = reviewQualityFGate(state);
  if (qualityScore < fGate) return "F";
  if (qualityScore >= 100) return "S";
  if (qualityScore >= 90) return "A";
  if (qualityScore >= 80) return "B";
  if (qualityScore >= 70) return "C";
  return "D";
}

export function shiftGrade(grade, amount, maxGrade = "S") {
  const current = GRADE_ORDER.indexOf(grade);
  const max = GRADE_ORDER.indexOf(maxGrade);
  return GRADE_ORDER[clamp(current + amount, 0, max)];
}

export function clampScoreToGrade(score, grade) {
  const [min, max] = GRADE_SCORE_RANGES[grade];
  return clamp(score, min, max);
}

export function calculateReviewBase(state) {
  const progressRequirement = reviewProgressRequirement(state);
  const progressGateFailed = state.progress < progressRequirement;
  const qualityScore = reviewQualityScore(state);
  const baseGrade = progressGateFailed ? "F" : gradeFromQuality(state, qualityScore);
  const failureKind = progressGateFailed ? "progress" : baseGrade === "F" ? "quality" : null;
  const baseScore = progressGateFailed ? 0 : clampScoreToGrade(qualityScore, baseGrade);
  return {
    progressRequirement,
    progressGateFailed,
    qualityScore,
    baseGrade,
    failureKind,
    baseScore,
  };
}

export function finalizeReview(state, strategyResult, baseOverride = null) {
  const base = baseOverride ?? calculateReviewBase(state);
  const ease = activeReviewEase(state);
  let finalGrade = strategyResult?.finalGrade ?? base.baseGrade;
  if (ease?.maxGrade) {
    finalGrade = shiftGrade(finalGrade, 0, ease.maxGrade);
  }

  let finalScore = clampScoreToGrade(strategyResult?.finalScore ?? base.baseScore, finalGrade);
  const mixedInProgressRescue = mixedInProgressRescueResult(state, base);
  if (mixedInProgressRescue) {
    finalGrade = "D";
    finalScore = 60;
  }
  const designCourseGpa = GRADE_TO_GPA[finalGrade];
  const effectiveGpaModifier = finalGrade === "F" ? 0 : state.gpaModifier;
  const semesterGpa = finalGrade === "F" ? 0 : clamp(designCourseGpa + effectiveGpaModifier, 0, 4);
  const portfolioAdded = shouldAddPortfolio(state, finalGrade) ? finalScore : 0;

  const record = {
    semesterIndex: state.semesterIndex,
    year: state.year,
    term: state.term,
    progress: state.progress,
    quality: state.quality,
    qualityScore: base.qualityScore,
    progressRequirement: base.progressRequirement,
    baseGrade: base.baseGrade,
    finalGrade,
    finalScore,
    strategyId: strategyResult?.strategyId ?? null,
    strategySucceeded: strategyResult?.succeeded ?? null,
    mixedInProgressRescue,
    designCourseGpa,
    semesterGpa,
    portfolioAdded,
  };

  state.reviews.push(record);
  state.gpaHistory.push(semesterGpa);
  recalculateGpa(state);
  if (mixedInProgressRescue) {
    state.passiveState ??= {};
    state.passiveState.mixedInYear = state.year;
    log(state, "review", "passive:mixed_in", `浑水摸鱼触发：进度差距 ${mixedInProgressRescue.progressGap}，改判通过`, {
      progressGap: mixedInProgressRescue.progressGap,
    });
  }
  if (portfolioAdded > 0) {
    applyDelta(state, "review_portfolio", `作品集入库 +${portfolioAdded}`, { portfolio: portfolioAdded }, "review", { skipPassive: true });
  }

  if (finalGrade === "F") {
    state.consecutiveFailedReviews = (state.consecutiveFailedReviews ?? 0) + 1;
  } else {
    state.consecutiveFailedReviews = 0;
  }

  if (state.semesterIndex === 10) {
    state.completedGraduationDesign = finalGrade !== "F" && (state.progress >= base.progressRequirement || Boolean(mixedInProgressRescue));
  }

  log(state, "review", "review_final", `评图完成：${finalGrade}，作品分 ${finalScore}，本学期绩点 ${semesterGpa.toFixed(2)}`, {});

  if (state.semesterIndex === 10 && !state.completedGraduationDesign && !state.ending) {
    state.pendingEnding = "graduation_failed";
    state.failureReason = "graduation_failed";
  }

  const failedReviewCount = state.reviews.filter((review) => review.finalGrade === "F").length;
  if (failedReviewCount >= 2 && !state.ending && !state.pendingEnding) {
    state.failureReason = "two_failed_reviews";
    state.ending = "two_failed_reviews";
    state.phase = "ending";
    log(state, "ending", "failure_check", "累计 2 次最终评图为 F", {});
  }

  state.gpaModifier = 0;
  state.specialSkill.reviewEase = null;
  state.specialSkill.reviewEaseSemester = null;

  if (!isGraduationSemester(state)) {
    state.progress = 0;
    state.quality = 0;
  }

  return record;
}

function mixedInProgressRescueResult(state, base) {
  if (getCharacter(state)?.id !== "mixed_in" || base?.failureKind !== "progress") {
    return null;
  }
  if (state.passiveState?.mixedInYear === state.year) {
    return null;
  }
  const progressGap = Math.max(0, Number(base.progressRequirement) - Number(state.progress));
  if (progressGap <= 0 || progressGap > 20) {
    return null;
  }
  return { progressGap };
}

export function settleFinalEnding(state) {
  if (state.ending) {
    return;
  }
  if (state.pendingEnding) {
    state.ending = state.pendingEnding;
    state.pendingEnding = null;
  } else if (!state.completedGraduationDesign) {
    state.ending = "graduation_failed";
  } else {
    state.ending = resolveRouteEnding(state) ?? stateEnding(state);
  }
  state.phase = "ending";
  log(state, "ending", "ending_resolved", `结局读取：${state.ending}`, {});
}

export function prepareFinalEnding(state) {
  if (state.ending) return state.ending;
  if (state.pendingEnding) return state.pendingEnding;
  if (!state.completedGraduationDesign) {
    state.pendingEnding = "graduation_failed";
  } else {
    state.pendingEnding = resolveRouteEnding(state) ?? stateEnding(state);
  }
  return state.pendingEnding;
}

function stateEnding(state) {
  return state.energy < 35 || state.pressure > 75 ? "wounded_graduation" : "stable_graduation";
}

function resolveRouteEnding(state) {
  const participation = state.routeParticipation;
  if (!participation?.optionId) {
    return null;
  }
  const option = ROUTE_OPTIONS.find((item) => item.id === participation.optionId);
  if (!option) {
    return null;
  }
  if (participation.lockedEnding) {
    return participation.lockedEnding;
  }
  return routeFinalRequirementsMet(state, option) ? option.successEnding : option.fallbackEnding;
}

function routeFinalRequirementsMet(state, option) {
  if (option.route === "保研" || option.route === "考研") {
    return routeRequirementsMet(state, { academicCorrect: option.finalRequirements?.academicCorrect });
  }
  return routeRequirementsMet(state, option.finalRequirements ?? option.requirements);
}

export function routeOptionAvailability(state, option) {
  if (state.routeParticipation?.optionId) {
    return option.id === state.routeParticipation.optionId
      ? { state: "selected", reason: "已正式参与该路线" }
      : { state: "disabled", reason: `已正式参与${state.routeParticipation.label ?? "其他路线"}` };
  }
  if (state.year < 5) {
    return { state: "disabled", reason: "大五上第 1 周起开放正式参与" };
  }
  if (state.semesterIndex >= 10 && ["review", "graduation_ceremony", "ending_memory", "ending"].includes(state.phase)) {
    return { state: "disabled", reason: "毕业设计答辩开始后关闭路线入口" };
  }
  const missing = missingRouteRequirements(state, option.requirements);
  if (missing.length > 0) {
    return { state: "disabled", reason: missing.join("；") };
  }
  return { state: "available", reason: "" };
}

export function routeRequirementsMet(state, requirements = {}) {
  return missingRouteRequirements(state, requirements).length === 0;
}

export function missingRouteRequirements(state, requirements = {}) {
  const missing = [];
  const gpa = state.gpa ?? 0;
  const attributes = state.attributes ?? {};

  if (requirements.gpa !== undefined && gpa < requirements.gpa) {
    missing.push(`GPA 需要 ${requirements.gpa.toFixed(2)}`);
  }
  if (requirements.portfolio !== undefined && (state.portfolio ?? 0) < requirements.portfolio) {
    missing.push(`作品集需要 ${requirements.portfolio}`);
  }
  if (requirements.ielts !== undefined && (state.ieltsScore ?? 0) < requirements.ielts) {
    missing.push(`雅思需要 ${requirements.ielts}`);
  }
  if (requirements.internshipValue !== undefined && (state.internshipValue ?? 0) < requirements.internshipValue) {
    missing.push(`实习价值需要 ${requirements.internshipValue}`);
  }
  if (requirements.aiExperience !== undefined && (state.aiExperience ?? 0) < requirements.aiExperience) {
    missing.push(`AI 相关经历需要 ${requirements.aiExperience}`);
  }
  if (requirements.competitionAwards !== undefined && (state.competitionAwardCount ?? 0) < requirements.competitionAwards) {
    missing.push(`竞赛获奖需要 ${requirements.competitionAwards} 次`);
  }
  if (requirements.academicCorrect !== undefined && routeExamCorrect(state, "academic") < requirements.academicCorrect) {
    missing.push(`升学专业考试至少答对 ${requirements.academicCorrect} 题`);
  }
  if (requirements.civilCorrect !== undefined && routeExamCorrect(state, "civil") < requirements.civilCorrect) {
    missing.push(`行测至少答对 ${requirements.civilCorrect} 题`);
  }

  for (const [key, value] of Object.entries(requirements.attributes ?? {})) {
    if ((attributes[key] ?? 0) < value) {
      missing.push(`${attributeLabel(key)}需要 ${value}`);
    }
  }

  if (requirements.allAttributesAtLeast !== undefined) {
    for (const key of ATTRIBUTE_KEYS) {
      if ((attributes[key] ?? 0) < requirements.allAttributesAtLeast) {
        missing.push(`${attributeLabel(key)}需要 ${requirements.allAttributesAtLeast}`);
      }
    }
  }

  if (requirements.recentNoF && recentFailedReviews(state, requirements.recentNoF) > 0) {
    missing.push(`最近 ${requirements.recentNoF} 学期不能有 F`);
  }
  if (requirements.recentMaxF !== undefined && recentFailedReviews(state, requirements.recentTerms ?? 4) > requirements.recentMaxF) {
    missing.push(`最近 ${requirements.recentTerms ?? 4} 学期 F 不能超过 ${requirements.recentMaxF} 次`);
  }
  if (requirements.recentMinGrade) {
    const { grade, count, terms = 4 } = requirements.recentMinGrade;
    if (recentGradeAtLeast(state, grade, terms) < count) {
      missing.push(`最近 ${terms} 学期至少 ${count} 次 ${grade} 及以上`);
    }
  }

  return [...new Set(missing)];
}

function routeExamCorrect(state, type) {
  if (type === "academic") {
    return state.routeExamResults?.academicCorrect ?? state.routeExamCorrect ?? 0;
  }
  if (type === "civil") {
    return state.routeExamResults?.civilCorrect ?? state.civilExamCorrect ?? 0;
  }
  return 0;
}

function recentFailedReviews(state, terms = 4) {
  return recentReviews(state, terms).filter((review) => review.finalGrade === "F").length;
}

function recentGradeAtLeast(state, grade, terms = 4) {
  const target = GRADE_ORDER.indexOf(grade);
  return recentReviews(state, terms).filter((review) => GRADE_ORDER.indexOf(review.finalGrade) >= target).length;
}

function recentReviews(state, terms) {
  return (state.reviews ?? []).slice(-terms);
}

function shouldAddPortfolio(state, finalGrade) {
  return state.semesterIndex !== 9 && ["C", "B", "A", "S"].includes(finalGrade);
}

export function recalculateGpa(state) {
  const directAdjustment = state.gpaDirectAdjustment ?? 0;
  if ((state.gpaHistory?.length ?? 0) === 0 && directAdjustment === 0) {
    state.gpa = null;
    return state.gpa;
  }
  const baseGpa = (state.gpaHistory?.length ?? 0) > 0
    ? state.gpaHistory.reduce((sum, item) => sum + item, 0) / state.gpaHistory.length
    : 0;
  state.gpa = clamp(baseGpa + directAdjustment, 0, 4);
  return state.gpa;
}

function normalizedNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function adjustAttributeGrowth(state, delta) {
  const adjusted = { ...delta };
  for (const key of ATTRIBUTE_KEYS) {
    const amount = delta[key];
    if (!amount) {
      continue;
    }

    const current = state.attributes[key];
    if (amount > 0 && current >= 80) {
      adjusted[key] = amount / 2;
    } else if (amount < 0 && current <= 20) {
      adjusted[key] = amount / 2;
    }
  }
  return adjusted;
}

function attributeLabel(key) {
  return {
    design: "设计水平",
    software: "软件技术",
    aesthetic: "创意审美",
    presentation: "汇报表达",
    social: "人际交往",
    resilience: "抗压能力",
  }[key] ?? key;
}

function adjustDeltaForPassives(state, delta, options) {
  if (options.skipPassive) {
    return delta;
  }

  const character = getCharacter(state);
  if (!character) {
    return delta;
  }

  if (character.id === "pressure_immune" && delta.pressure > 0) {
    delta.pressure = Math.max(1, delta.pressure - 1);
  }

  if (character.id === "poor_scholar" && delta.pressure > 0) {
    delta.pressure += 1;
  }

  if (character.id === "poor_scholar" && options.positiveKind && ["learning", "progress"].includes(options.positiveKind)) {
    for (const key of ["progress", "quality", ...ATTRIBUTE_KEYS]) {
      if (delta[key] > 0) {
        delta[key] += 1;
      }
    }
  }

  if (character.id === "full_pressure" && state.pressure >= 70) {
    if (options.actionId === "normal_drawing" || options.actionId === "crunch_drawing") {
      delta.progress = (delta.progress ?? 0) + 2;
    }
    if (options.actionId === "design_iteration") {
      delta.quality = (delta.quality ?? 0) + 2;
    }
  }

  applyShopActionEffects(state, delta, options);

  return delta;
}

function applyShopActionEffects(state, delta, options) {
  const effects = state.shopEffects ?? {};

  if (options.actionId === "normal_drawing" || options.actionId === "crunch_drawing") {
    delta.progress = (delta.progress ?? 0) + (effects.drawingProgressBonus ?? 0);
    const drawingPressureBonus = activeMusicMembership(state)?.drawingPressureBonus ?? effects.drawingPressureBonus ?? 0;
    if ((delta.pressure ?? 0) > 0 && drawingPressureBonus) {
      delta.pressure = Math.max(0, delta.pressure + drawingPressureBonus);
    }
  }

  if (options.actionId === "rest") {
    mergeDelta(delta, effects.restDelta);
  }

  if (options.actionId === "exercise" && effects.exerciseYear?.year === state.year) {
    if ((delta.energy ?? 0) < 0) {
      delta.energy = Math.min(0, delta.energy - (effects.exerciseYear.energyCost ?? 0));
    }
    delta.pressure = (delta.pressure ?? 0) + (effects.exerciseYear.pressure ?? 0);
  }
}

function activeMusicMembership(state) {
  const membership = state.shopEffects?.musicMembership;
  if (!membership) return null;
  if (Number(membership.year) !== Number(state.year)) return null;
  const durationWeeks = Number(membership.durationWeeks) || 12;
  const purchasedWeek = Number(membership.purchasedWeek) || 0;
  return state.week - purchasedWeek < durationWeeks ? membership : null;
}

function shopWeeklyRecoveryDelta(state) {
  const effects = state.shopEffects ?? {};
  const delta = {};
  mergeDelta(delta, effects.weeklyPermanent);
  mergeDelta(delta, effects.weeklyBySemester?.[state.semesterIndex]);

  for (const [key, value] of Object.entries(delta)) {
    if (!value) {
      delete delta[key];
    }
  }
  return delta;
}

function mergeDelta(target, source = {}) {
  for (const [key, value] of Object.entries(source ?? {})) {
    target[key] = (target[key] ?? 0) + value;
  }
  return target;
}

function maybeTriggerRelaxedPassive(state) {
  const character = getCharacter(state);
  if (character?.id !== "born_lucky") {
    return;
  }
  if (state.pressure >= 80 && state.passiveState.relaxedTriggers < 3 && !state.ending) {
    state.passiveState.relaxedTriggers += 1;
    state.pressure = clamp(state.pressure - 10, 0, 100);
    log(state, state.phase, "passive:born_lucky", "松弛感触发，压力 -10", { pressure: -10 });
  }
}

function activeReviewEase(state) {
  if (state.specialSkill.reviewEaseSemester === state.semesterIndex) {
    return state.specialSkill.reviewEase;
  }
  if (state.semesterIndex === 9 && state.specialSkill.reviewEaseSemester === 10) {
    return state.specialSkill.reviewEase;
  }
  return null;
}

export function semesterWeekGlobalIndex(state) {
  return (state.semesterIndex - 1) * WEEKS_PER_SEMESTER + state.weekInSemester;
}

export function actionsForThisWeek(state) {
  return state.actionsPerWeek ?? BASE_ACTIONS_PER_WEEK;
}
