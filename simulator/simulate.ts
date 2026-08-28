import { performAction } from "./actions.ts";
import { ROUTE_TARGETS } from "./balance.ts";
import { maybeRecordCompetitionAfterReview } from "./competitions.ts";
import { resolveCourseForSemester, selectCourseForSemester } from "./courses.ts";
import { maybeTriggerWeeklyEvent } from "./events.ts";
import { hasInternshipShortEventThisWeek, maybeApplyForInternship, maybeApplyInternshipWeek } from "./internships.ts";
import { applyDelta, applyWeeklySettlement, log } from "./resolver.ts";
import {
  ACTIONS_PER_WEEK,
  MONTHLY_ALLOWANCE,
  SEMESTER_BREAK_RECOVERY,
  SEMESTER_COUNT,
  TOTAL_WEEKS,
  WEEKS_PER_SEMESTER,
  isGraduationDesign,
} from "./rules.ts";
import { resolveReview } from "./review.ts";
import {
  maybeFormalizeRoute,
  maybeResolveHiddenRouteResultAfterReview,
  maybeSetRouteIntention,
  routeForStrategy,
  routeOutcomeForEnding,
} from "./routes.ts";
import { createInitialState } from "./state.ts";
import { chooseAction } from "./strategies.ts";
import type {
  Attributes,
  CompetitionAward,
  EndingId,
  GameState,
  InternshipTier,
  RouteFailureReason,
  RunOptions,
} from "./types.ts";

export function runSimulation(options: RunOptions): GameState {
  validateRouteTargetForStrategy(options);
  const state = createInitialState(options.seed, options.strategy);
  state.route.targetOverride = options.routeTarget;
  applyStrategyHarness(state);
  runOpening(state);

  while (!state.ending && state.semesterIndex <= SEMESTER_COUNT) {
    runSemester(state, options.events ?? false);
  }

  if (!state.ending) {
    state.phase = "graduation";
    log(state, "graduation", "graduation_ceremony", "Graduation ceremony completed", {});
    resolveEnding(state);
  }

  state.phase = "ending";
  log(state, "ending", "ending", `Ending resolved: ${state.ending}`, {});
  return state;
}

function validateRouteTargetForStrategy(options: RunOptions): void {
  const requested = options.routeTarget;
  if (!requested) {
    return;
  }

  const target = ROUTE_TARGETS[requested];
  const route = routeForStrategy(options.strategy);
  if (!target || !route || target.route !== route) {
    throw new Error(`Route target ${requested} does not belong to strategy ${options.strategy}`);
  }
}

function runOpening(state: GameState): void {
  state.phase = "profile";
  log(state, "profile", "profile", "Profile completed", {});

  state.phase = "character";
  log(state, "character", "character", "Character selected: ordinary student", {});

  state.phase = "fixed_event";
  applyDelta(
    state,
    "opening_ceremony",
    "Opening ceremony: listened carefully",
    { energy: -3, pressure: 2, presentation: 1, design: 1 },
    "fixed_event",
  );
  applyDelta(
    state,
    "military_training",
    "Military training: got through it",
    { energy: -2, pressure: -2, social: 1 },
    "fixed_event",
  );
  log(state, "fixed_event", "mentor", "Default mentor selected", {});
}

function runSemester(state: GameState, eventsEnabled: boolean): void {
  state.phase = "semester_start";
  state.weekInSemester = 0;
  state.weeklyActionCounts = {};
  state.semesterActionTally = {};
  log(state, "semester_start", "semester", `Semester ${state.semesterIndex} started`, {});
  selectCourseForSemester(state);

  for (let weekInSemester = 1; weekInSemester <= WEEKS_PER_SEMESTER; weekInSemester += 1) {
    if (state.ending) {
      return;
    }
    runWeek(state, weekInSemester, eventsEnabled);
  }

  if (state.ending) {
    return;
  }

  resolveCourseForSemester(state);
  if (state.semesterIndex !== 9) {
    resolveReview(state);
    if (state.ending) {
      return;
    }
    maybeRecordCompetitionAfterReview(state);
    maybeResolveHiddenRouteResultAfterReview(state);
  } else {
    state.gpaModifier = 0;
  }
  if (state.ending) {
    return;
  }

  advanceSemester(state);
}

function runWeek(state: GameState, weekInSemester: number, eventsEnabled: boolean): void {
  state.phase = "week_start";
  state.week += 1;
  state.weekInSemester = weekInSemester;
  state.actionsRemaining = ACTIONS_PER_WEEK;
  state.weeklyActionCounts = {};
  log(state, "week_start", "week", `Week ${state.week} started`, {});

  if (weekInSemester === 4 || (weekInSemester === 1 && state.semesterIndex !== 1)) {
    applyDelta(
      state,
      "monthly_allowance",
      "Ordinary-family allowance paid",
      { money: MONTHLY_ALLOWANCE },
      "week_start",
    );
  }

  maybeSetRouteIntention(state);
  maybeFormalizeRoute(state);
  maybeApplyForInternship(state);
  maybeSelectModelMaterial(state);
  if (!hasInternshipShortEventThisWeek(state)) {
    maybeTriggerWeeklyEvent(state, eventsEnabled);
  }

  state.phase = "week_action";
  while (state.actionsRemaining > 0 && !state.ending) {
    const action = chooseAction(state, state.strategy);
    const performed = performAction(state, action);
    if (!performed && action !== "rest") {
      performAction(state, "rest");
    }
  }

  state.phase = "week_settlement";
  if (state.strategy === "pressure") {
    applyDelta(
      state,
      "pressure_boundary_stressor",
      "Pressure boundary stressor placeholder",
      { pressure: 18 },
      "week_settlement",
    );
  }
  maybeApplyInternshipWeek(state, eventsEnabled);
  applyWeeklySettlement(state);
}

function advanceSemester(state: GameState): void {
  state.phase = "semester_settlement";
  log(state, "semester_settlement", "semester", `Semester ${state.semesterIndex} settled`, {});

  if (state.semesterIndex >= SEMESTER_COUNT) {
    state.semesterIndex += 1;
    return;
  }

  state.semesterIndex += 1;
  state.year = Math.ceil(state.semesterIndex / 2);
  state.term = state.semesterIndex % 2 === 1 ? 1 : 2;
  applyDelta(state, "semester_break", "Short break before next semester", SEMESTER_BREAK_RECOVERY, "semester_settlement");

  if (state.semesterIndex <= SEMESTER_COUNT && !isGraduationDesign(state.semesterIndex)) {
    state.progress = 0;
    state.quality = 0;
  }

  state.phase = "year_transition";
  log(state, "year_transition", "calendar", `Entered year ${state.year}, term ${state.term}`, {});
}

function maybeSelectModelMaterial(state: GameState): void {
  if (state.weekInSemester !== 5 || state.semesterIndex === 9) {
    return;
  }

  if (state.money >= 5000) {
    applyDelta(state, "model_material:print_3d", "Model material selected: 3D print", { money: -2200, quality: 5, software: 1 }, "week_start");
    return;
  }

  if (state.money >= 900) {
    applyDelta(state, "model_material:laser_cut", "Model material selected: laser cut", { money: -900, quality: 3, progress: 1 }, "week_start");
    return;
  }

  applyDelta(state, "model_material:hand_cut", "Model material selected: hand cut", { money: -300, quality: 1, aesthetic: 1 }, "week_start");
}

function resolveEnding(state: GameState): EndingId {
  if (state.ending) {
    return state.ending;
  }

  if (!state.completedGraduationDesign) {
    state.ending = "graduation_failed";
    return state.ending;
  }

  const routeOutcome = routeOutcomeForEnding(state);
  if (routeOutcome) {
    state.ending = routeOutcome;
    return state.ending;
  }

  state.ending = state.energy < 35 || state.pressure > 75 ? "wounded_graduation" : "stable_graduation";
  return state.ending;
}

function applyStrategyHarness(state: GameState): void {
  if (state.strategy === "burnout") {
    state.energy = 32;
    state.pressure = 25;
    state.money = 20000;
  }

  if (state.strategy === "pressure") {
    state.energy = 100;
    state.pressure = 79;
    state.money = 20000;
  }
}

export function summarize(state: GameState) {
  return {
    seed: state.seed,
    strategy: state.strategy,
    ending: state.ending,
    failureReason: state.failureReason ?? null,
    weeks: state.week,
    gpa: state.gpa === null ? null : Number(state.gpa.toFixed(2)),
    portfolio: state.portfolio,
    eventCount: state.eventRecords.length,
    aiExperience: state.aiExperience,
    routeIntention: state.route.intention ?? null,
    formalRoute: state.route.formal?.route ?? null,
    routeTarget: state.route.formal?.target ?? null,
    routeTargetOverride: state.route.targetOverride ?? null,
    hiddenRouteOutcome: state.route.hiddenResult?.outcome ?? null,
    hiddenRoutePassed: state.route.hiddenResult?.passed ?? null,
    hiddenRouteScore: state.route.hiddenResult?.score ?? null,
    hiddenRouteAttributes: state.route.hiddenResult?.attributesAtDecision ?? null,
    hiddenRouteGpa: state.route.hiddenResult?.gpaAtDecision ?? null,
    hiddenRoutePortfolio: state.route.hiddenResult?.portfolioAtDecision ?? null,
    hiddenRouteInternshipValue: state.route.hiddenResult?.internshipValueAtDecision ?? null,
    hiddenRouteNamedFirmInternship: state.route.hiddenResult?.namedFirmInternshipAtDecision ?? null,
    hiddenRouteInternshipTier: state.route.hiddenResult?.internshipTierAtDecision ?? null,
    hiddenRouteRecentFailedReviews: state.route.hiddenResult?.recentFailedReviewsAtDecision ?? null,
    hiddenRouteFailureReasons: state.route.hiddenResult?.failureReasons ?? null,
    entrepreneurshipContractUnlocked: state.route.entrepreneurshipContract?.unlocked ?? null,
    entrepreneurshipContractOffered: state.route.entrepreneurshipContract?.contractOffered ?? null,
    entrepreneurshipContractChoice: state.route.entrepreneurshipContract?.contractChoice ?? null,
    selectedCourse: state.selectedCourse ?? null,
    courseCount: state.courseRecords.length,
    attributes: { ...state.attributes },
    internshipValue: state.internshipValue,
    namedFirmInternship: state.namedFirmInternship,
    internshipTier: state.internshipRecords[state.internshipRecords.length - 1]?.tier ?? null,
    internshipRecords: state.internshipRecords.map((record) => ({
      targetId: record.targetId ?? null,
      targetLabel: record.targetLabel ?? null,
      tier: record.tier,
      value: record.value,
      semesterIndex: record.semesterIndex,
      completedWeek: record.completedWeek,
    })),
    internshipRecordCount: state.internshipRecords.length,
    internshipApplicationCount: state.internshipApplications.length,
    internshipAcceptedCount: state.internshipApplications.filter((application) => application.accepted).length,
    internshipRejectedCount: state.internshipApplications.filter((application) => !application.accepted).length,
    internshipOrdinaryApplicationCount: state.internshipApplications.filter((application) => application.tier === "ordinary").length,
    internshipStrongApplicationCount: state.internshipApplications.filter((application) => application.tier === "strong").length,
    internshipNamedFirmApplicationCount: state.internshipApplications.filter((application) => application.tier === "named_firm").length,
    activeInternshipTier: state.activeInternship?.tier ?? null,
    competitionSubmissionCount: state.competitionRecords.length,
    competitionShortlistCount: state.competitionRecords.filter((record) => record.shortlisted).length,
    competitionRejectionCount: state.competitionRecords.filter((record) => !record.shortlisted).length,
    competitionAwardCount: state.competitionAwardCount,
    competitionAwards: awardCounts(state.competitionRecords.map((record) => record.award)),
    competitionResults: state.competitionRecords.map((record) => ({
      competitionId: record.competitionId,
      competitionName: record.competitionName,
      award: record.award,
      shortlisted: record.shortlisted,
      prizeMoney: record.prizeMoney,
    })),
    competitionPrizeMoney: state.competitionRecords.reduce((sum, record) => sum + record.prizeMoney, 0),
    completedGraduationDesign: state.completedGraduationDesign,
    energy: state.energy,
    pressure: state.pressure,
    money: state.money,
    reviews: state.reviews.map((review) => review.finalGrade).join(""),
    actions: state.actionTally,
    logEntries: state.logs.length,
    eventIds: state.eventRecords.map((event) => event.eventId).join(","),
  };
}

export function runBatch(
  strategy: RunOptions["strategy"],
  count: number,
  seedStart = 1,
  events = false,
  routeTarget?: RunOptions["routeTarget"],
): ReturnType<typeof summarize>[] {
  const results = [];
  for (let i = 0; i < count; i += 1) {
    results.push(summarize(runSimulation({ seed: seedStart + i, strategy, events, routeTarget })));
  }
  return results;
}

export function aggregate(results: ReturnType<typeof summarize>[]) {
  const endings: Record<string, number> = {};
  let totalGpa = 0;
  let gpaCount = 0;
  let totalPortfolio = 0;
  let totalWeeks = 0;
  let totalEvents = 0;
  let totalAiExperience = 0;
  let hiddenRouteCount = 0;
  let hiddenRouteGpaTotal = 0;
  let hiddenRoutePortfolioTotal = 0;
  let hiddenRouteInternshipValueTotal = 0;
  let hiddenRouteNamedFirmInternshipCount = 0;
  let hiddenRouteScoreTotal = 0;
  let hiddenRouteScoreCount = 0;
  let totalCompetitionPrizeMoney = 0;
  let totalCompetitionSubmissions = 0;
  let totalCompetitionShortlists = 0;
  let totalCompetitionRejections = 0;
  const hiddenRouteAttributeTotals: Attributes = {
    design: 0,
    software: 0,
    aesthetic: 0,
    presentation: 0,
    social: 0,
    resilience: 0,
  };
  const competitionAwardTotals: Record<CompetitionAward, number> = emptyAwardCounts();
  const competitionById: Record<
    string,
    {
      submissions: number;
      shortlists: number;
      rejections: number;
      prizeMoney: number;
      awards: Record<CompetitionAward, number>;
    }
  > = {};
  const routeFailureReasons: Record<RouteFailureReason, number> = emptyRouteFailureCounts();
  const routeTargetDistribution: Record<string, number> = {};
  const internshipTierDistribution: Record<InternshipTier | "none", number> = {
    none: 0,
    ordinary: 0,
    strong: 0,
    named_firm: 0,
  };
  const hiddenRouteInternshipTierDistribution: Record<InternshipTier | "none", number> = {
    none: 0,
    ordinary: 0,
    strong: 0,
    named_firm: 0,
  };
  let totalInternshipApplications = 0;
  let totalInternshipAccepted = 0;
  let totalInternshipRejected = 0;
  const anomalySeeds: number[] = [];

  for (const result of results) {
    endings[result.ending ?? "unknown"] = (endings[result.ending ?? "unknown"] ?? 0) + 1;
    if (result.gpa !== null) {
      totalGpa += result.gpa;
      gpaCount += 1;
    }
    totalPortfolio += result.portfolio;
    totalWeeks += result.weeks;
    totalEvents += result.eventCount;
    totalAiExperience += result.aiExperience;
    totalCompetitionPrizeMoney += result.competitionPrizeMoney;
    totalCompetitionSubmissions += result.competitionSubmissionCount;
    totalCompetitionShortlists += result.competitionShortlistCount;
    totalCompetitionRejections += result.competitionRejectionCount;
    totalInternshipApplications += result.internshipApplicationCount;
    totalInternshipAccepted += result.internshipAcceptedCount;
    totalInternshipRejected += result.internshipRejectedCount;
    if (result.routeTarget) {
      routeTargetDistribution[result.routeTarget] = (routeTargetDistribution[result.routeTarget] ?? 0) + 1;
    }

    internshipTierDistribution[result.internshipTier ?? "none"] += 1;
    for (const award of Object.keys(competitionAwardTotals) as CompetitionAward[]) {
      competitionAwardTotals[award] += result.competitionAwards[award];
    }
    for (const competition of result.competitionResults) {
      competitionById[competition.competitionId] ??= {
        submissions: 0,
        shortlists: 0,
        rejections: 0,
        prizeMoney: 0,
        awards: emptyAwardCounts(),
      };
      competitionById[competition.competitionId].submissions += 1;
      competitionById[competition.competitionId].shortlists += competition.shortlisted ? 1 : 0;
      competitionById[competition.competitionId].rejections += competition.shortlisted ? 0 : 1;
      competitionById[competition.competitionId].prizeMoney += competition.prizeMoney;
      competitionById[competition.competitionId].awards[competition.award] += 1;
    }
    for (const reason of result.hiddenRouteFailureReasons ?? []) {
      routeFailureReasons[reason] = (routeFailureReasons[reason] ?? 0) + 1;
    }

    if (result.hiddenRouteAttributes) {
      hiddenRouteCount += 1;
      hiddenRouteGpaTotal += result.hiddenRouteGpa ?? 0;
      hiddenRoutePortfolioTotal += result.hiddenRoutePortfolio ?? 0;
      hiddenRouteInternshipValueTotal += result.hiddenRouteInternshipValue ?? 0;
      if (result.hiddenRouteNamedFirmInternship) {
        hiddenRouteNamedFirmInternshipCount += 1;
      }
      hiddenRouteInternshipTierDistribution[result.hiddenRouteInternshipTier ?? "none"] += 1;
      for (const key of Object.keys(hiddenRouteAttributeTotals) as (keyof Attributes)[]) {
        hiddenRouteAttributeTotals[key] += result.hiddenRouteAttributes[key];
      }
    }

    if (typeof result.hiddenRouteScore === "number") {
      hiddenRouteScoreCount += 1;
      hiddenRouteScoreTotal += result.hiddenRouteScore;
    }

    if (result.weeks < TOTAL_WEEKS || result.ending === "graduation_failed") {
      anomalySeeds.push(result.seed);
    }
  }

  return {
    count: results.length,
    endings,
    averageGpa: gpaCount > 0 ? Number((totalGpa / gpaCount).toFixed(2)) : null,
    averagePortfolio: Number((totalPortfolio / results.length).toFixed(2)),
    averageWeeks: Number((totalWeeks / results.length).toFixed(2)),
    averageEvents: Number((totalEvents / results.length).toFixed(2)),
    averageAiExperience: Number((totalAiExperience / results.length).toFixed(2)),
    averageCompetitionAwards: Number(
      (
        results.reduce((sum, result) => sum + result.competitionAwardCount, 0) /
        results.length
      ).toFixed(2),
    ),
    averageCompetitionAwardsByLevel: averageAwardCounts(competitionAwardTotals, results.length),
    averageCompetitionPrizeMoney: Number((totalCompetitionPrizeMoney / results.length).toFixed(2)),
    averageCompetitionSubmissions: Number((totalCompetitionSubmissions / results.length).toFixed(2)),
    averageCompetitionShortlists: Number((totalCompetitionShortlists / results.length).toFixed(2)),
    averageCompetitionRejections: Number((totalCompetitionRejections / results.length).toFixed(2)),
    competitionById: averageCompetitionById(competitionById, results.length),
    awardRuns: results.filter((result) => result.competitionAwardCount > 0).length,
    averageInternshipApplications: Number((totalInternshipApplications / results.length).toFixed(2)),
    averageInternshipAccepted: Number((totalInternshipAccepted / results.length).toFixed(2)),
    averageInternshipRejected: Number((totalInternshipRejected / results.length).toFixed(2)),
    internshipTierDistribution,
    routeTargetDistribution,
    routeFailureReasons: compactCounts(routeFailureReasons),
    hiddenRouteDecision:
      hiddenRouteCount > 0
        ? {
            count: hiddenRouteCount,
            averageGpa: Number((hiddenRouteGpaTotal / hiddenRouteCount).toFixed(2)),
            averagePortfolio: Number((hiddenRoutePortfolioTotal / hiddenRouteCount).toFixed(2)),
            averageInternshipValue: Number((hiddenRouteInternshipValueTotal / hiddenRouteCount).toFixed(2)),
            namedFirmInternshipRate: Number((hiddenRouteNamedFirmInternshipCount / hiddenRouteCount).toFixed(2)),
            internshipTierDistribution: hiddenRouteInternshipTierDistribution,
            averageScore:
              hiddenRouteScoreCount > 0
                ? Number((hiddenRouteScoreTotal / hiddenRouteScoreCount).toFixed(2))
                : null,
            averageAttributes: averageAttributes(hiddenRouteAttributeTotals, hiddenRouteCount),
          }
        : null,
    anomalySeeds: anomalySeeds.slice(0, 20),
  };
}

function averageCompetitionById(
  totals: Record<
    string,
    {
      submissions: number;
      shortlists: number;
      rejections: number;
      prizeMoney: number;
      awards: Record<CompetitionAward, number>;
    }
  >,
  count: number,
) {
  return Object.fromEntries(
    Object.entries(totals).map(([competitionId, total]) => [
      competitionId,
      {
        submissions: total.submissions,
        averageSubmissions: Number((total.submissions / count).toFixed(2)),
        shortlists: total.shortlists,
        rejections: total.rejections,
        averagePrizeMoney: Number((total.prizeMoney / count).toFixed(2)),
        awards: total.awards,
      },
    ]),
  );
}

function awardCounts(awards: CompetitionAward[]): Record<CompetitionAward, number> {
  const counts = emptyAwardCounts();
  for (const award of awards) {
    counts[award] += 1;
  }
  return counts;
}

function emptyAwardCounts(): Record<CompetitionAward, number> {
  return {
    none: 0,
    third: 0,
    second: 0,
    first: 0,
  };
}

function averageAwardCounts(
  totals: Record<CompetitionAward, number>,
  count: number,
): Record<CompetitionAward, number> {
  return {
    none: Number((totals.none / count).toFixed(2)),
    third: Number((totals.third / count).toFixed(2)),
    second: Number((totals.second / count).toFixed(2)),
    first: Number((totals.first / count).toFixed(2)),
  };
}

function emptyRouteFailureCounts(): Record<RouteFailureReason, number> {
  return {
    gpa_below_threshold: 0,
    portfolio_below_threshold: 0,
    design_below_threshold: 0,
    software_below_threshold: 0,
    aesthetic_below_threshold: 0,
    presentation_below_threshold: 0,
    social_below_threshold: 0,
    resilience_below_threshold: 0,
    internship_below_threshold: 0,
    recent_failed_reviews_above_threshold: 0,
    exam_score_below_threshold: 0,
    overseas_probability_roll_failed: 0,
    ai_experience_below_threshold: 0,
  };
}

function compactCounts<T extends string>(counts: Record<T, number>): Partial<Record<T, number>> {
  const compact: Partial<Record<T, number>> = {};
  for (const [key, value] of Object.entries(counts) as [T, number][]) {
    if (value > 0) {
      compact[key] = value;
    }
  }
  return compact;
}

function averageAttributes(totals: Attributes, count: number): Attributes {
  return {
    design: Number((totals.design / count).toFixed(2)),
    software: Number((totals.software / count).toFixed(2)),
    aesthetic: Number((totals.aesthetic / count).toFixed(2)),
    presentation: Number((totals.presentation / count).toFixed(2)),
    social: Number((totals.social / count).toFixed(2)),
    resilience: Number((totals.resilience / count).toFixed(2)),
  };
}
