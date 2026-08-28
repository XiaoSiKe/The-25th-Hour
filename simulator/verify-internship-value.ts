import { ROUTE_TARGETS } from "./balance.ts";
import { maybeApplyInternshipWeek } from "./internships.ts";
import { maybeResolveHiddenRouteResultAfterReview } from "./routes.ts";
import { runBatch } from "./simulate.ts";
import { createInitialState } from "./state.ts";
import type { InternshipTargetId, InternshipTier, RouteTargetId } from "./types.ts";

let failures = 0;

const batch = runBatch("architecture_job", 100, 1, true);

check(
  "completed internship value is cumulative",
  batch.every((run) => run.internshipValue === run.internshipRecords.reduce((sum, record) => sum + record.value, 0)),
  batch.map((run) => ({
    seed: run.seed,
    internshipValue: run.internshipValue,
    recordValues: run.internshipRecords.map((record) => record.value),
  })),
);

check(
  "multi-internship records can exceed the highest single tier value",
  cumulativeHarness().internshipValue > Math.max(...cumulativeHarness().recordValues),
  cumulativeHarness(),
);

for (const target of ["independent_studio", "local_design_institute", "state_owned_design_institute", "foreign_firm", "master_studio"] as const) {
  const result = routeHarness(target);
  check(`${target} reads cumulative internship value at decision`, result.hiddenRouteInternshipValue === result.internshipValue, result);
  check(`${target} uses internship value rather than named-firm-only gate`, result.hiddenRouteFailureReasons?.includes("internship_below_threshold") === false, result);
}

if (failures > 0) {
  process.exitCode = 1;
}

function check(name: string, condition: boolean, detail: unknown): void {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}`);
  if (!condition) {
    console.log(JSON.stringify(detail, null, 2));
    failures += 1;
  }
}

function cumulativeHarness() {
  const state = createInitialState(25, "normal");
  state.phase = "week_settlement";
  completeOneWeekInternship(state, "independent_studio", "独立小型工作室", "ordinary", 12);
  completeOneWeekInternship(state, "local_design_institute", "地方设计院", "ordinary", 18);
  return {
    internshipValue: state.internshipValue,
    recordValues: state.internshipRecords.map((record) => record.value),
    records: state.internshipRecords.map((record) => ({
      targetId: record.targetId,
      targetLabel: record.targetLabel,
      tier: record.tier,
      value: record.value,
    })),
  };
}

function completeOneWeekInternship(
  state: ReturnType<typeof createInitialState>,
  targetId: InternshipTargetId,
  targetLabel: string,
  tier: InternshipTier,
  startWeek: number,
): void {
  state.week = startWeek;
  state.activeInternship = {
    targetId,
    targetLabel,
    tier,
    value: 1,
    startSemesterIndex: state.semesterIndex,
    startWeek,
    remainingWeeks: 1,
    weeksCompleted: 2,
    wageTotal: 600,
    designAtOffer: state.attributes.design,
    softwareAtOffer: state.attributes.software,
    shortEventTriggered: false,
  };
  maybeApplyInternshipWeek(state, false);
}

function routeHarness(target: RouteTargetId) {
  const state = createInitialState(25, "architecture_job");
  const thresholds = ROUTE_TARGETS[target].thresholds;
  state.semesterIndex = 10;
  state.week = 55;
  state.phase = "semester_settlement";
  state.route.formal = {
    route: "architecture_job",
    group: "architecture_job",
    target,
    week: 49,
  };
  state.attributes.design = thresholds.design ?? state.attributes.design;
  state.attributes.software = thresholds.software ?? state.attributes.software;
  state.portfolio = thresholds.portfolio ?? state.portfolio;
  state.internshipValue = thresholds.internshipValue ?? 0;
  state.namedFirmInternship = false;
  maybeResolveHiddenRouteResultAfterReview(state);
  return {
    routeTarget: target,
    hiddenRouteInternshipValue: state.route.hiddenResult?.internshipValueAtDecision ?? null,
    hiddenRouteFailureReasons: state.route.hiddenResult?.failureReasons ?? null,
    internshipValue: state.internshipValue,
    namedFirmInternship: state.namedFirmInternship,
  };
}
