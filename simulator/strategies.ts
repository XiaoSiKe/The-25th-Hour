import { canPerformAction } from "./actions.ts";
import { ROUTE_TARGETS, ROUTE_THRESHOLDS, ROUTE_TIMING, STRATEGY_TUNING } from "./balance.ts";
import { GRADUATION_DESIGN_PROGRESS_REQUIREMENT, isGraduationDesign, progressCapForSemester } from "./rules.ts";
import type { ActionId, AttributeKey, GameState, RouteId, StrategyId } from "./types.ts";

export function chooseAction(state: GameState, strategy: StrategyId): ActionId {
  switch (strategy) {
    case "bankrupt":
      return firstAvailable(state, ["socialize", "exercise", "read_exhibition", "rest"]);
    case "burnout":
      return firstAvailable(state, ["crunch_drawing", "normal_drawing", "design_iteration", "rest"]);
    case "pressure":
      return firstAvailable(state, ["crunch_drawing", "design_iteration", "normal_drawing", "learn_ai_software", "rest"]);
    case "fail_reviews":
      return firstAvailable(state, ["rest", "socialize", "read_exhibition", "exercise"]);
    case "balanced":
      return balancedAction(state);
    case "postgrad":
    case "overseas":
    case "civil_service":
    case "architecture_job":
    case "career_change":
      return routeAction(state, strategy);
    case "normal":
    default:
      return normalAction(state);
  }
}

function normalAction(state: GameState): ActionId {
  if (state.energy < 35) {
    return "rest";
  }

  const requiredProgress = requiredProgressForCurrentReview(state);
  const targetQuality = targetQualityForCurrentReview(state);
  const deadlineCourseworkNeeded =
    state.weekInSemester >= 6 &&
    state.pressure <= 80 &&
    (state.progress < requiredProgress || state.quality < targetQuality);

  if (state.pressure > 80 && !deadlineCourseworkNeeded) {
    return recoveryAction(state);
  }

  const lastReview = state.reviews[state.reviews.length - 1];
  const recoveryMode = lastReview?.finalGrade === "F" || state.consecutiveFailedReviews > 0;
  const weeksLeft = Math.max(0, 6 - state.weekInSemester + 1);
  const projectedProgressActions = Math.ceil(Math.max(0, requiredProgress - state.progress) / 18);
  const projectedQualityActions = Math.ceil(Math.max(0, targetQuality - state.quality) / 10);
  const urgentCoursework = recoveryMode || projectedProgressActions + projectedQualityActions >= weeksLeft * 2;

  if (!urgentCoursework && state.weekInSemester < 6 && state.money < 900 && canPerformAction(state, "part_time").ok) {
    return "part_time";
  }

  const courseworkAction = courseworkNeed(state, 0, { protectHighPressureGraduation: true });
  if (courseworkAction) {
    return courseworkAction;
  }

  if (state.pressure > 55) {
    return recoveryAction(state);
  }

  if (state.money < 900 && canPerformAction(state, "part_time").ok) {
    return "part_time";
  }

  if (state.attributes.software < 50 && state.semesterIndex <= 6) {
    return "learn_ai_software";
  }

  if (state.attributes.aesthetic < 48 && state.money >= 1200) {
    return "read_exhibition";
  }

  return recoveryAction(state);
}

function balancedAction(state: GameState): ActionId {
  if (state.energy < 45 || state.pressure > 70) {
    return "rest";
  }

  const requiredProgress = requiredProgressForCurrentReview(state);
  const targetQuality = targetQualityForCurrentReview(state) + 12;

  if (state.progress < requiredProgress) {
    return state.weekInSemester >= 5 ? firstAvailable(state, ["crunch_drawing", "normal_drawing"]) : "normal_drawing";
  }

  if (state.quality < targetQuality) {
    return firstAvailable(state, ["site_research", "design_iteration"]);
  }

  if (state.money < 1800) {
    return firstAvailable(state, ["outsourcing", "part_time", "rest"]);
  }

  return firstAvailable(state, ["learn_ai_software", "read_exhibition", "exercise", "rest"]);
}

function routeAction(state: GameState, strategy: StrategyId): ActionId {
  const cashAction = routeCashNeed(state);
  if (cashAction) {
    return cashAction;
  }

  const prepAction = earlyRoutePrepNeed(state, strategy);
  if (prepAction) {
    return prepAction;
  }

  const qualityBuffer = state.semesterIndex >= ROUTE_TIMING.prepSemesterMin ? courseworkQualityBuffer(strategy) : 0;
  const courseworkAction = courseworkNeed(state, qualityBuffer, { protectHighPressureGraduation: true });
  if (courseworkAction) {
    return courseworkAction;
  }

  if (state.energy < STRATEGY_TUNING.routeActionEnergyMin || state.pressure > STRATEGY_TUNING.routeActionPressureMax) {
    return "rest";
  }

  if (state.money < STRATEGY_TUNING.routePartTimeMoneyFloor && canPerformAction(state, "part_time").ok) {
    return "part_time";
  }

  switch (strategy) {
    case "postgrad":
      return postgradAction(state);
    case "overseas":
      return overseasAction(state);
    case "civil_service":
      return civilServiceAction(state);
    case "architecture_job":
      return architectureJobAction(state);
    case "career_change":
      return careerChangeAction(state);
    default:
      return balancedAction(state);
  }
}

function postgradAction(state: GameState): ActionId {
  const thresholds = routeTargetThresholds(state, "postgrad_exam");
  const gpaTarget = thresholds.gpa ?? ROUTE_THRESHOLDS.postgradExam.gpa;
  const portfolioTarget = thresholds.portfolio ?? ROUTE_THRESHOLDS.postgradExam.portfolio;

  if (state.attributes.software < (thresholds.software ?? ROUTE_THRESHOLDS.postgradExam.software)) {
    return "learn_ai_software";
  }

  if ((state.gpa ?? 0) < gpaTarget - 0.15 || state.portfolio < portfolioTarget) {
    return firstAvailable(state, ["design_iteration", "site_research", "normal_drawing", "rest"]);
  }

  if (state.attributes.design < (thresholds.design ?? ROUTE_THRESHOLDS.postgradExam.design)) {
    return firstAvailable(state, ["design_iteration", "site_research", "rest"]);
  }

  if (state.attributes.resilience < (thresholds.resilience ?? ROUTE_THRESHOLDS.postgradExam.resilience)) {
    return "exercise";
  }

  return firstAvailable(state, ["design_iteration", "learn_ai_software", "exercise", "rest"]);
}

function overseasAction(state: GameState): ActionId {
  const thresholds = routeTargetThresholds(state, "overseas");
  const portfolioTarget = thresholds.portfolio ?? ROUTE_THRESHOLDS.overseas.portfolio;
  const gpaTarget = thresholds.gpa ?? ROUTE_THRESHOLDS.overseas.gpa;

  if (state.portfolio < portfolioTarget || (state.gpa ?? 0) < gpaTarget - 0.1) {
    return firstAvailable(state, ["design_iteration", "site_research", "normal_drawing", "rest"]);
  }

  if (state.attributes.aesthetic < 70) {
    return firstAvailable(state, ["read_exhibition", "site_research", "rest"]);
  }

  return firstAvailable(state, ["read_exhibition", "design_iteration", "exercise", "rest"]);
}

function civilServiceAction(state: GameState): ActionId {
  const thresholds = routeTargetThresholds(state, "civil_service");
  const weakest = weakestAttributeNeed(state, thresholds, ["presentation", "social", "resilience", "design"]);
  if (weakest === "social") return firstAvailable(state, ["socialize", "rest"]);
  if (weakest === "resilience") return firstAvailable(state, ["exercise", "rest"]);
  if (weakest === "design") return firstAvailable(state, ["design_iteration", "site_research", "rest"]);
  return firstAvailable(state, ["socialize", "read_exhibition", "exercise", "rest"]);
}

function architectureJobAction(state: GameState): ActionId {
  const thresholds = routeTargetThresholds(state, "architecture_job");

  if (state.attributes.software < (thresholds.software ?? ROUTE_THRESHOLDS.architectureJob.software)) {
    return "learn_ai_software";
  }

  if (state.portfolio < (thresholds.portfolio ?? ROUTE_THRESHOLDS.architectureJob.portfolioTarget)) {
    return firstAvailable(state, ["design_iteration", "site_research", "normal_drawing", "rest"]);
  }

  if (state.attributes.design < (thresholds.design ?? ROUTE_THRESHOLDS.architectureJob.design)) {
    return firstAvailable(state, ["design_iteration", "site_research", "rest"]);
  }

  return firstAvailable(state, ["outsourcing", "learn_ai_software", "design_iteration", "rest"]);
}

function careerChangeAction(state: GameState): ActionId {
  const targetId = state.route.targetOverride ?? "new_media_content";
  const thresholds = routeTargetThresholds(state, "career_change");
  const entrepreneurshipNeeds = targetId === "entrepreneurship"
    ? weakestAttributeNeed(state, thresholds, ["design", "software", "aesthetic", "presentation", "social", "resilience"])
    : undefined;

  if (entrepreneurshipNeeds === "design") {
    return firstAvailable(state, ["design_iteration", "site_research", "normal_drawing", "rest"]);
  }

  if (entrepreneurshipNeeds === "software") {
    return "learn_ai_software";
  }

  if (entrepreneurshipNeeds === "aesthetic") {
    return firstAvailable(state, ["read_exhibition", "design_iteration", "rest"]);
  }

  if (entrepreneurshipNeeds === "presentation") {
    return firstAvailable(state, ["socialize", "read_exhibition", "rest"]);
  }

  if (entrepreneurshipNeeds === "social") {
    return firstAvailable(state, ["socialize", "rest"]);
  }

  if (entrepreneurshipNeeds === "resilience") {
    return firstAvailable(state, ["exercise", "rest"]);
  }

  if (state.portfolio < (thresholds.portfolio ?? 0)) {
    return firstAvailable(state, ["design_iteration", "site_research", "rest"]);
  }

  if (state.attributes.software < (thresholds.software ?? 0)) {
    return "learn_ai_software";
  }

  if (state.attributes.presentation < (thresholds.presentation ?? 0)) {
    return firstAvailable(state, ["socialize", "read_exhibition", "rest"]);
  }

  if (state.attributes.social < (thresholds.social ?? 0)) {
    return firstAvailable(state, ["socialize", "rest"]);
  }

  if (state.attributes.resilience < (thresholds.resilience ?? 0)) {
    return firstAvailable(state, ["exercise", "rest"]);
  }

  if (state.attributes.aesthetic < (thresholds.aesthetic ?? 0)) {
    return firstAvailable(state, ["read_exhibition", "design_iteration", "site_research", "rest"]);
  }

  if (targetId === "illustrator" || targetId === "game_scene_artist") {
    return firstAvailable(state, ["read_exhibition", "design_iteration", "site_research", "rest"]);
  }

  return firstAvailable(state, ["socialize", "read_exhibition", "exercise", "rest"]);
}

function routeCashNeed(state: GameState): ActionId | undefined {
  if (state.money < STRATEGY_TUNING.routePartTimeMoneyFloor && canPerformAction(state, "part_time").ok) {
    return "part_time";
  }
  return undefined;
}

function earlyRoutePrepNeed(state: GameState, strategy: StrategyId): ActionId | undefined {
  if (state.semesterIndex < ROUTE_TIMING.prepSemesterMin || state.semesterIndex > ROUTE_TIMING.prepSemesterMax) {
    return undefined;
  }

  const courseworkAction = courseworkNeed(state, 0);
  const weeksLeft = Math.max(0, 6 - state.weekInSemester + 1);
  const requiredProgress = requiredProgressForCurrentReview(state);
  const targetQuality = targetQualityForCurrentReview(state);
  const progressActions = Math.ceil(Math.max(0, requiredProgress - state.progress) / 18);
  const qualityActions = Math.ceil(Math.max(0, targetQuality - state.quality) / 11);
  const courseworkIsUrgent =
    !!courseworkAction &&
    progressActions + qualityActions >= weeksLeft * STRATEGY_TUNING.courseworkUrgencyActionsPerWeekLeft;

  if (
    courseworkIsUrgent ||
    state.energy < STRATEGY_TUNING.routePrepEnergyMin ||
    state.pressure > STRATEGY_TUNING.routePrepPressureMax
  ) {
    return undefined;
  }

  switch (strategy) {
    case "civil_service":
      return earlyCivilServicePrep(state);
    case "career_change":
      return earlyCareerChangePrep(state);
    default:
      return undefined;
  }
}

function earlyCivilServicePrep(state: GameState): ActionId | undefined {
  const thresholds = routeTargetThresholds(state, "civil_service");
  const weakest = weakestAttributeNeed(state, thresholds, ["presentation", "social", "resilience", "design"]);
  if (weakest === "social") return firstAvailable(state, ["socialize", "rest"]);
  if (weakest === "resilience") return firstAvailable(state, ["exercise", "rest"]);
  if (weakest === "design") return firstAvailable(state, ["design_iteration", "site_research", "rest"]);
  if (weakest === "presentation") return firstAvailable(state, ["socialize", "read_exhibition", "rest"]);
  return undefined;
}

function earlyCareerChangePrep(state: GameState): ActionId | undefined {
  const thresholds = routeTargetThresholds(state, "career_change");
  const targetId = state.route.targetOverride ?? "new_media_content";
  const entrepreneurshipNeeds = targetId === "entrepreneurship"
    ? weakestAttributeNeed(state, thresholds, ["design", "software", "aesthetic", "presentation", "social", "resilience"])
    : undefined;

  if (entrepreneurshipNeeds === "design") {
    return firstAvailable(state, ["design_iteration", "site_research", "normal_drawing", "rest"]);
  }
  if (entrepreneurshipNeeds === "software") {
    return "learn_ai_software";
  }
  if (entrepreneurshipNeeds === "aesthetic") {
    return firstAvailable(state, ["read_exhibition", "design_iteration", "rest"]);
  }
  if (entrepreneurshipNeeds === "presentation") {
    return firstAvailable(state, ["socialize", "read_exhibition", "rest"]);
  }
  if (entrepreneurshipNeeds === "social") {
    return firstAvailable(state, ["socialize", "rest"]);
  }
  if (entrepreneurshipNeeds === "resilience") {
    return firstAvailable(state, ["exercise", "rest"]);
  }

  if (state.attributes.software < (thresholds.software ?? 0)) {
    return "learn_ai_software";
  }
  if (state.attributes.presentation < (thresholds.presentation ?? 0)) {
    return firstAvailable(state, ["socialize", "read_exhibition", "rest"]);
  }
  if (state.attributes.social < (thresholds.social ?? 0)) {
    return firstAvailable(state, ["socialize", "rest"]);
  }
  if (state.attributes.resilience < (thresholds.resilience ?? 0)) {
    return firstAvailable(state, ["exercise", "rest"]);
  }
  if (state.attributes.aesthetic < (thresholds.aesthetic ?? 0)) {
    return firstAvailable(state, ["read_exhibition", "design_iteration", "rest"]);
  }
  return undefined;
}

function courseworkQualityBuffer(strategy: StrategyId): number {
  switch (strategy) {
    case "postgrad":
      return STRATEGY_TUNING.courseworkQualityBuffer.postgrad;
    case "architecture_job":
      return STRATEGY_TUNING.courseworkQualityBuffer.architectureJob;
    case "career_change":
      return STRATEGY_TUNING.courseworkQualityBuffer.careerChange;
    default:
      return STRATEGY_TUNING.courseworkQualityBuffer.default;
  }
}

function courseworkNeed(
  state: GameState,
  extraQualityTarget: number,
  options: { protectHighPressureGraduation?: boolean } = {},
): ActionId | undefined {
  const graduation = isGraduationDesign(state.semesterIndex);
  const requiredProgress = requiredProgressForCurrentReview(state);
  const targetQuality = targetQualityForCurrentReview(state) + extraQualityTarget;
  const passingProgress = graduation ? requiredProgress : 95;
  const deadlineCourseworkNeeded =
    state.weekInSemester >= 6 &&
    state.energy >= 35 &&
    state.pressure <= 80 &&
    (state.progress < requiredProgress || state.quality < targetQuality);

  if (!deadlineCourseworkNeeded) {
    if (state.energy < 35) {
      return "rest";
    }
    if (state.pressure > 80) {
      return recoveryAction(state);
    }
  }

  const actionsLeft = state.actionsRemaining + Math.max(0, 6 - state.weekInSemester) * 3;
  const progressActions = Math.ceil(Math.max(0, requiredProgress - state.progress) / 12);
  const qualityActions = Math.ceil(Math.max(0, targetQuality - state.quality) / 10);
  const slotsAfterProgress = Math.max(0, actionsLeft - progressActions);
  const progressCanBeClosedWithOneAction = state.progress >= requiredProgress - 12;
  const graduationProgressIsCritical =
    graduation &&
    state.progress < requiredProgress &&
    (state.weekInSemester >= 5 ||
      state.quality >= targetQuality ||
      progressActions >= Math.max(1, actionsLeft - 2));

  if (graduationProgressIsCritical) {
    const canUseCrunch =
      state.progress < requiredProgress - 28 &&
      (!options.protectHighPressureGraduation || state.pressure <= 70) &&
      canPerformAction(state, "crunch_drawing").ok;
    if (canUseCrunch) {
      return "crunch_drawing";
    }
    return "normal_drawing";
  }

  if (!graduation && state.weekInSemester >= 6 && state.progress < passingProgress) {
    return "normal_drawing";
  }

  const shouldPrioritizeQuality =
    state.quality < targetQuality &&
    (state.progress >= requiredProgress ||
      qualityActions > slotsAfterProgress ||
      (progressCanBeClosedWithOneAction && qualityActions >= Math.max(1, slotsAfterProgress - 2)));

  if (!shouldPrioritizeQuality && state.progress < requiredProgress - 28 && state.weekInSemester >= 5 && canPerformAction(state, "crunch_drawing").ok) {
    return "crunch_drawing";
  }

  if (!shouldPrioritizeQuality && state.progress < requiredProgress) {
    return "normal_drawing";
  }

  if (state.quality < targetQuality) {
    return qualityCourseworkAction(state);
  }

  if (state.progress < requiredProgress) {
    return "normal_drawing";
  }

  return undefined;
}

function qualityCourseworkAction(state: GameState): ActionId {
  if (state.pressure > 65 && canPerformAction(state, "site_research").ok) {
    return "site_research";
  }
  return firstAvailable(state, ["design_iteration", "site_research", "rest"]);
}

function recoveryAction(state: GameState): ActionId {
  return state.money > 2500
    ? firstAvailable(state, ["socialize", "exercise", "rest"])
    : firstAvailable(state, ["exercise", "rest"]);
}

function firstAvailable(state: GameState, actions: ActionId[]): ActionId {
  for (const action of actions) {
    if (canPerformAction(state, action).ok) {
      return action;
    }
  }
  return "rest";
}

function routeTargetThresholds(state: GameState, route: RouteId) {
  const targetId = state.route.targetOverride ?? defaultRouteTarget(route);
  const target = ROUTE_TARGETS[targetId];
  if (target.route !== route) {
    throw new Error(`Route target ${targetId} does not belong to route ${route}`);
  }
  return target.thresholds;
}

function defaultRouteTarget(route: RouteId) {
  switch (route) {
    case "postgrad_exam":
      return "ordinary_postgrad_school";
    case "overseas":
      return "overseas_msa";
    case "civil_service":
      return "public_institution_general";
    case "architecture_job":
      return "local_design_institute";
    case "career_change":
      return "new_media_content";
  }
}

function weakestAttributeNeed(
  state: GameState,
  thresholds: Partial<Record<AttributeKey, number>>,
  keys: AttributeKey[],
): AttributeKey | undefined {
  let weakest: AttributeKey | undefined;
  let largestGap = 0;

  for (const key of keys) {
    const required = thresholds[key] ?? 0;
    const gap = required - state.attributes[key];
    if (gap > largestGap) {
      largestGap = gap;
      weakest = key;
    }
  }

  return weakest;
}

function requiredProgressForCurrentReview(state: GameState): number {
  if (!isGraduationDesign(state.semesterIndex)) {
    return progressCapForSemester(state.semesterIndex);
  }
  return GRADUATION_DESIGN_PROGRESS_REQUIREMENT;
}

function targetQualityForCurrentReview(state: GameState): number {
  if (isGraduationDesign(state.semesterIndex)) {
    return 200;
  }
  return 60;
}
