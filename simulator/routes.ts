import { randomInt } from "./rng.ts";
import { log } from "./resolver.ts";
import { ROUTE_TARGETS, ROUTE_THRESHOLDS, ROUTE_TIMING, meetsAttributes } from "./balance.ts";
import type {
  GameState,
  RouteFailureReason,
  RouteGroup,
  RouteId,
  RouteTargetId,
  RouteOutcome,
} from "./types.ts";

interface RouteDefinition {
  id: RouteId;
  group: RouteGroup;
  defaultTarget: RouteTargetId;
}

const ROUTES: Record<RouteId, RouteDefinition> = {
  postgrad_exam: {
    id: "postgrad_exam",
    group: "education",
    defaultTarget: "ordinary_postgrad_school",
  },
  overseas: {
    id: "overseas",
    group: "education",
    defaultTarget: "overseas_msa",
  },
  civil_service: {
    id: "civil_service",
    group: "civil",
    defaultTarget: "public_institution_general",
  },
  architecture_job: {
    id: "architecture_job",
    group: "architecture_job",
    defaultTarget: "local_design_institute",
  },
  career_change: {
    id: "career_change",
    group: "career_change",
    defaultTarget: "new_media_content",
  },
};

export function maybeSetRouteIntention(state: GameState): void {
  if (state.semesterIndex !== ROUTE_TIMING.intentionSemester || state.weekInSemester !== 1 || state.route.intention) {
    return;
  }

  const route = routeForStrategy(state.strategy);
  if (!route) {
    return;
  }

  state.route.intention = route;
  log(state, "week_start", "route_intention", `route intention: ${route}`, {});
}

export function maybeFormalizeRoute(state: GameState): void {
  if (state.semesterIndex !== ROUTE_TIMING.formalSemester || state.weekInSemester !== 1 || state.route.formal) {
    return;
  }

  const route = routeForStrategy(state.strategy);
  if (!route) {
    return;
  }

  const definition = ROUTES[route];
  const target = targetForRoute(state, route);
  state.route.formal = {
    route,
    group: definition.group,
    target,
    week: state.week,
  };

  log(state, "week_start", "route_formal", `formal route: ${route} -> ${target}`, {});
}

export function maybeResolveHiddenRouteResultAfterReview(state: GameState): void {
  if (state.ending) {
    return;
  }

  const formal = state.route.formal;
  if (!formal || state.route.hiddenResult || state.semesterIndex !== ROUTE_TIMING.hiddenResultSemester) {
    return;
  }

  switch (formal.route) {
    case "postgrad_exam":
      resolvePostgradExam(state);
      return;
    case "overseas":
      resolveOverseasApplication(state);
      return;
    case "civil_service":
      resolveCivilServiceExam(state);
      return;
    case "architecture_job":
      resolveArchitectureJob(state);
      return;
    case "career_change":
      resolveCareerChange(state);
      return;
  }
}

export function routeOutcomeForEnding(state: GameState): RouteOutcome | undefined {
  return state.route.hiddenResult?.outcome;
}

export function routeForStrategy(strategy: GameState["strategy"]): RouteId | undefined {
  switch (strategy) {
    case "postgrad":
      return "postgrad_exam";
    case "overseas":
      return "overseas";
    case "civil_service":
      return "civil_service";
    case "architecture_job":
      return "architecture_job";
    case "career_change":
      return "career_change";
    default:
      return undefined;
  }
}

function resolvePostgradExam(state: GameState): void {
  const target = currentRouteTarget(state, "postgrad_exam");
  const thresholds = target.thresholds;
  const failureReasons: RouteFailureReason[] = [];
  const gpa = knownGpa(state);
  addMinFailure(failureReasons, gpa, thresholds.gpa ?? 0, "gpa_below_threshold");
  addMinFailure(failureReasons, state.portfolio, thresholds.portfolio ?? 0, "portfolio_below_threshold");
  addMinFailure(failureReasons, state.attributes.design, thresholds.design ?? 0, "design_below_threshold");
  addMinFailure(failureReasons, state.attributes.software, thresholds.software ?? 0, "software_below_threshold");
  addMinFailure(failureReasons, state.attributes.resilience, thresholds.resilience ?? 0, "resilience_below_threshold");
  if (recentFailedReviews(state, 4) > (thresholds.recentFailedReviewsMax ?? 99)) {
    failureReasons.push("recent_failed_reviews_above_threshold");
  }
  const eligible =
    gpa >= (thresholds.gpa ?? 0) &&
    state.portfolio >= (thresholds.portfolio ?? 0) &&
    state.attributes.design >= (thresholds.design ?? 0) &&
    state.attributes.software >= (thresholds.software ?? 0) &&
    state.attributes.resilience >= (thresholds.resilience ?? 0) &&
    recentFailedReviews(state, 4) <= (thresholds.recentFailedReviewsMax ?? 99);

  const correct = drawExamCorrectCount(
    state,
    eligible ? target.examFloorEligible ?? 6 : target.examFloorIneligible ?? 4,
  );
  const passCorrect = target.passCorrect ?? 6;
  const passed = eligible && correct >= passCorrect;
  if (correct < passCorrect) {
    failureReasons.push("exam_score_below_threshold");
  }
  const outcome: RouteOutcome = passed ? postgradSuccessOutcome(target.id) : "postgrad_retry";
  cacheHiddenResult(state, passed, correctToPostgradScore(correct), outcome, failureReasons);
}

function resolveOverseasApplication(state: GameState): void {
  const target = currentRouteTarget(state, "overseas");
  const thresholds = target.thresholds;
  const chanceRules = target.overseasChance ?? {
    base: 0.76,
    cap: 0.98,
  };
  const failureReasons: RouteFailureReason[] = [];
  const gpa = knownGpa(state);
  addMinFailure(failureReasons, gpa, thresholds.gpa ?? 0, "gpa_below_threshold");
  addMinFailure(failureReasons, state.portfolio, thresholds.portfolio ?? 0, "portfolio_below_threshold");
  const eligible = gpa >= (thresholds.gpa ?? 0) && state.portfolio >= (thresholds.portfolio ?? 0);
  const chance = eligible
    ? Math.min(
        chanceRules.cap,
        chanceRules.base +
          Math.min(0.14, Math.max(0, state.portfolio - (thresholds.portfolio ?? 0)) * 0.0014) +
          Math.min(0.12, Math.max(0, gpa - (thresholds.gpa ?? 0)) * 0.2667),
      )
    : 0;
  const [rngState, roll] = randomInt(state.rngState, 1, 100);
  state.rngState = rngState;
  const passed = roll <= chance * 100;
  if (!passed && eligible) {
    failureReasons.push("overseas_probability_roll_failed");
  }
  const outcome: RouteOutcome = passed ? overseasSuccessOutcome(target.overseasTier) : "overseas_failed";
  cacheHiddenResult(state, passed, roll, outcome, failureReasons);
}

function resolveCivilServiceExam(state: GameState): void {
  const target = currentRouteTarget(state, "civil_service");
  const thresholds = target.thresholds;
  const failureReasons: RouteFailureReason[] = [];
  const gpa = knownGpa(state);
  addMinFailure(failureReasons, gpa, thresholds.gpa ?? 0, "gpa_below_threshold");
  addMinFailure(failureReasons, state.attributes.presentation, thresholds.presentation ?? 0, "presentation_below_threshold");
  addMinFailure(failureReasons, state.attributes.social, thresholds.social ?? 0, "social_below_threshold");
  addMinFailure(failureReasons, state.attributes.resilience, thresholds.resilience ?? 0, "resilience_below_threshold");
  addMinFailure(failureReasons, state.attributes.design, thresholds.design ?? 0, "design_below_threshold");
  if (recentFailedReviews(state, 4) > (thresholds.recentFailedReviewsMax ?? 99)) {
    failureReasons.push("recent_failed_reviews_above_threshold");
  }
  const eligible =
    gpa >= (thresholds.gpa ?? 0) &&
    state.attributes.presentation >= (thresholds.presentation ?? 0) &&
    state.attributes.social >= (thresholds.social ?? 0) &&
    state.attributes.resilience >= (thresholds.resilience ?? 0) &&
    state.attributes.design >= (thresholds.design ?? 0) &&
    recentFailedReviews(state, 4) <= (thresholds.recentFailedReviewsMax ?? 99);
  const correct = drawExamCorrectCount(
    state,
    eligible ? target.examFloorEligible ?? 6 : target.examFloorIneligible ?? 5,
  );
  const passCorrect = target.passCorrect ?? 7;
  const passed = eligible && correct >= passCorrect;
  if (correct < passCorrect) {
    failureReasons.push("exam_score_below_threshold");
  }
  const fallback =
    target.id !== "selection_home" &&
    state.attributes.presentation >= ROUTE_THRESHOLDS.civilService.fallback.presentation &&
    state.attributes.social >= ROUTE_THRESHOLDS.civilService.fallback.social &&
    state.attributes.resilience >= ROUTE_THRESHOLDS.civilService.fallback.resilience &&
    correct >= (target.fallbackCorrect ?? ROUTE_THRESHOLDS.civilService.fallbackCorrect);
  const outcome: RouteOutcome = passed ? civilServiceSuccessOutcome(target.id) : civilServiceFallbackOutcome(target.id);
  cacheHiddenResult(state, passed || fallback, correctToCivilServiceScore(correct), outcome, passed ? [] : failureReasons);
}

function resolveArchitectureJob(state: GameState): void {
  const target = currentRouteTarget(state, "architecture_job");
  const thresholds = target.thresholds;
  const failureReasons: RouteFailureReason[] = [];
  addMinFailure(failureReasons, state.attributes.design, thresholds.design ?? 0, "design_below_threshold");
  addMinFailure(failureReasons, state.attributes.software, thresholds.software ?? 0, "software_below_threshold");
  addMinFailure(failureReasons, state.portfolio, thresholds.portfolio ?? 0, "portfolio_below_threshold");
  if (state.internshipValue < (thresholds.internshipValue ?? 0) || (thresholds.namedFirmInternship && !state.namedFirmInternship)) {
    failureReasons.push("internship_below_threshold");
  }
  const passed =
    state.attributes.design >= (thresholds.design ?? 0) &&
    state.attributes.software >= (thresholds.software ?? 0) &&
    state.portfolio >= (thresholds.portfolio ?? 0) &&
    state.internshipValue >= (thresholds.internshipValue ?? 0) &&
    (!thresholds.namedFirmInternship || state.namedFirmInternship);
  const outcome: RouteOutcome = passed ? architectureJobSuccessOutcome(target.id) : "job_pending";
  cacheHiddenResult(state, passed, undefined, outcome, failureReasons);
}

function resolveCareerChange(state: GameState): void {
  const target = currentRouteTarget(state, "career_change");
  const thresholds = target.thresholds;
  const failureReasons: RouteFailureReason[] = [];

  if (target.id === "entrepreneurship") {
    resolveEntrepreneurship(state);
    return;
  }

  addMinFailure(failureReasons, state.attributes.presentation, thresholds.presentation ?? 0, "presentation_below_threshold");
  addMinFailure(failureReasons, state.attributes.aesthetic, thresholds.aesthetic ?? 0, "aesthetic_below_threshold");
  addMinFailure(failureReasons, state.attributes.software, thresholds.software ?? 0, "software_below_threshold");
  addMinFailure(failureReasons, state.attributes.social, thresholds.social ?? 0, "social_below_threshold");
  addMinFailure(failureReasons, state.attributes.resilience, thresholds.resilience ?? 0, "resilience_below_threshold");
  addMinFailure(failureReasons, state.portfolio, thresholds.portfolio ?? 0, "portfolio_below_threshold");
  addMinFailure(failureReasons, state.aiExperience, thresholds.aiExperience ?? 0, "ai_experience_below_threshold");
  const passed =
    state.attributes.presentation >= (thresholds.presentation ?? 0) &&
    state.attributes.aesthetic >= (thresholds.aesthetic ?? 0) &&
    state.attributes.software >= (thresholds.software ?? 0) &&
    state.attributes.social >= (thresholds.social ?? 0) &&
    state.attributes.resilience >= (thresholds.resilience ?? 0) &&
    state.portfolio >= (thresholds.portfolio ?? 0) &&
    state.aiExperience >= (thresholds.aiExperience ?? 0);
  const outcome: RouteOutcome = passed ? careerChangeSuccessOutcome(target.id) : "career_failed";
  cacheHiddenResult(state, passed, undefined, outcome, failureReasons);
}

function resolveEntrepreneurship(state: GameState): void {
  const thresholds = ROUTE_THRESHOLDS.entrepreneurship;
  const failureReasons: RouteFailureReason[] = [];
  addMinFailure(failureReasons, state.attributes.design, thresholds.design, "design_below_threshold");
  addMinFailure(failureReasons, state.attributes.software, thresholds.software, "software_below_threshold");
  addMinFailure(failureReasons, state.attributes.aesthetic, thresholds.aesthetic, "aesthetic_below_threshold");
  addMinFailure(failureReasons, state.attributes.presentation, thresholds.presentation, "presentation_below_threshold");
  addMinFailure(failureReasons, state.attributes.social, thresholds.social, "social_below_threshold");
  addMinFailure(failureReasons, state.attributes.resilience, thresholds.resilience, "resilience_below_threshold");

  const unlocked = meetsAttributes(state.attributes, thresholds);
  const contract = (state.route.entrepreneurshipContract ??= {
    unlocked: false,
    contractOffered: false,
  });
  contract.unlocked = unlocked;

  if (!unlocked) {
    cacheHiddenResult(state, false, undefined, "career_failed", failureReasons);
    return;
  }

  contract.contractOffered = true;
  contract.contractChoice ??= "signed";

  const signed = contract.contractChoice === "signed";
  cacheHiddenResult(
    state,
    signed,
    undefined,
    signed ? "career_startup" : "career_failed",
    signed ? [] : failureReasons,
  );
}

function postgradSuccessOutcome(targetId: RouteTargetId): RouteOutcome {
  return targetId === "ordinary_postgrad_school" ? "steady_postgrad" : "elite_exam_postgrad";
}

function overseasSuccessOutcome(tier: "s" | "a" | "b" | "c" | undefined): RouteOutcome {
  if (tier === "s") return "overseas_elite";
  if (tier === "a") return "overseas_strong";
  if (tier === "b") return "overseas_stable";
  return "overseas_safety";
}

function civilServiceSuccessOutcome(targetId: RouteTargetId): RouteOutcome {
  switch (targetId) {
    case "selection_home":
      return "selected_transfer_home";
    case "civil_service_ministry":
      return "civil_ministry";
    case "civil_service_provincial":
      return "civil_province";
    case "teacher_bianzhi":
      return "public_teacher";
    case "administration_bianzhi":
      return "public_admin";
    default:
      return "public_institution";
  }
}

function civilServiceFallbackOutcome(targetId: RouteTargetId): RouteOutcome {
  return targetId === "selection_home" ? "selected_transfer_wait" : "civil_retry";
}

function architectureJobSuccessOutcome(targetId: RouteTargetId): RouteOutcome {
  switch (targetId) {
    case "master_studio":
      return "architecture_master";
    case "foreign_firm":
      return "architecture_foreign";
    case "state_owned_design_institute":
      return "architecture_state";
    case "independent_studio":
      return "architecture_small";
    default:
      return "architecture_local";
  }
}

function careerChangeSuccessOutcome(targetId: RouteTargetId): RouteOutcome {
  switch (targetId) {
    case "ai_product_manager":
      return "career_ai_pm";
    case "game_scene_artist":
      return "career_game_scene";
    case "sales_business":
      return "career_sales";
    case "illustrator":
      return "career_illustrator";
    default:
      return "career_content";
  }
}

function cacheHiddenResult(
  state: GameState,
  passed: boolean,
  score: number | undefined,
  outcome: RouteOutcome,
  failureReasons: RouteFailureReason[],
): void {
  const formal = state.route.formal;
  if (!formal) {
    return;
  }

  state.route.hiddenResult = {
    route: formal.route,
    target: formal.target,
    passed,
    score,
    outcome,
    attributesAtDecision: { ...state.attributes },
    gpaAtDecision: Number(knownGpa(state).toFixed(2)),
    portfolioAtDecision: state.portfolio,
    internshipValueAtDecision: state.internshipValue,
    namedFirmInternshipAtDecision: state.namedFirmInternship,
    internshipTierAtDecision: state.internshipRecords[state.internshipRecords.length - 1]?.tier,
    recentFailedReviewsAtDecision: recentFailedReviews(state, 4),
    failureReasons,
  };

  log(
    state,
    "semester_settlement",
    "route_hidden_result",
    `hidden route result cached: ${formal.route} -> ${outcome}`,
    {},
  );
}

function drawExamCorrectCount(state: GameState, floor: number): number {
  const [rngState, roll] = randomInt(state.rngState, 0, 4);
  state.rngState = rngState;
  return Math.min(10, floor + roll);
}

function correctToPostgradScore(correct: number): number {
  if (correct >= 10) return 410;
  if (correct === 9) return 395;
  if (correct === 8) return 380;
  if (correct === 7) return 365;
  if (correct === 6) return 350;
  return 340;
}

function correctToCivilServiceScore(correct: number): number {
  if (correct >= 10) return 150;
  if (correct === 9) return 145;
  if (correct === 8) return 140;
  if (correct === 7) return 135;
  if (correct === 6) return 130;
  return 125;
}

function recentFailedReviews(state: GameState, count: number): number {
  return state.reviews.slice(-count).filter((review) => review.finalGrade === "F").length;
}

function addMinFailure(
  failureReasons: RouteFailureReason[],
  actual: number,
  required: number,
  reason: RouteFailureReason,
): void {
  if (actual < required) {
    failureReasons.push(reason);
  }
}

function knownGpa(state: GameState): number {
  return state.gpa ?? Number.NEGATIVE_INFINITY;
}

function targetForRoute(state: GameState, route: RouteId): RouteTargetId {
  const requested = state.route.targetOverride;
  if (requested) {
    const target = ROUTE_TARGETS[requested];
    if (target.route !== route) {
      throw new Error(`Route target ${requested} does not belong to route ${route}`);
    }
    return requested;
  }

  return ROUTES[route].defaultTarget;
}

function currentRouteTarget(state: GameState, expectedRoute: RouteId) {
  const targetId = state.route.formal?.target ?? targetForRoute(state, expectedRoute);
  const target = ROUTE_TARGETS[targetId];
  if (target.route !== expectedRoute) {
    throw new Error(`Route target ${targetId} does not belong to route ${expectedRoute}`);
  }
  return target;
}
