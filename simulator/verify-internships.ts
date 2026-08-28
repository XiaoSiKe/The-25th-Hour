import { runBatch, runSimulation, summarize } from "./simulate.ts";
import { hasInternshipShortEventThisWeek, maybeApplyForInternship, maybeApplyInternshipWeek } from "./internships.ts";
import { createInitialState } from "./state.ts";
import type { InternshipTargetId, InternshipTier } from "./types.ts";

let failures = 0;

const firstState = runSimulation({ seed: 25, strategy: "normal", events: true });
const secondState = runSimulation({ seed: 25, strategy: "normal", events: true });
const first = summarize(firstState);
const second = summarize(secondState);

check("same seed reproduces internship application counts", first.internshipApplicationCount === second.internshipApplicationCount, { first, second });
check("same seed reproduces accepted internship counts", first.internshipAcceptedCount === second.internshipAcceptedCount, { first, second });
check("internship records never exceed accepted internships", first.internshipRecordCount <= first.internshipAcceptedCount, first);
check("unfinished active internship accounts for accepted-record gap", acceptedRecordGap(first) <= (first.activeInternshipTier ? 1 : 0), first);
check(
  "internship applications partition into accepted and rejected",
  first.internshipApplicationCount === first.internshipAcceptedCount + first.internshipRejectedCount,
  first,
);
check("active internship can remain only when a run ends early", first.activeInternshipTier === null || first.weeks < 60, first);

const shortEventHarness = runInternshipShortEventHarness();
check("internship short event is scheduled for exactly one of the three internship weeks", shortEventHarness.pendingByWeek.join(",") === "false,true,false", shortEventHarness);
check("completed internship triggers one short event during its three-week span", shortEventHarness.shortEvents.length === 1 && shortEventHarness.recordShortEventId === shortEventHarness.shortEvents[0]?.eventId, shortEventHarness);
check("completed internship leaves no active internship", shortEventHarness.activeInternshipTier === null, shortEventHarness);
check("internship short events do not repeat in a single run", shortEventHarness.afterRepeatAttemptCount === shortEventHarness.shortEvents.length, shortEventHarness);
check("internship short events count toward event total", shortEventHarness.summaryEventCount === shortEventHarness.shortEvents.length, shortEventHarness);

const chanceHarness = runInternshipChanceHarness();
check("strong internship chance follows documented probability table", chanceHarness.strong === 68, chanceHarness);
check("named-firm internship chance follows documented probability table", chanceHarness.namedFirm === 55, chanceHarness);

const highRiskHarness = runInternshipHighRiskHarness();
check("energy high-risk disables internship application without consuming the semester attempt", highRiskHarness.applicationCount === 0 && highRiskHarness.appliedSemesterCount === 0, highRiskHarness);

const normalBatch = runBatch("normal", 50, 1, true);
const survivorBatch = normalBatch.filter((run) => run.weeks === 60);
const namedFirmAttemptsWithinCap = normalBatch.every((run) => run.internshipNamedFirmApplicationCount <= 1);
check("normal batch has survivor samples", survivorBatch.length > 0, normalBatch);
check("normal batch limits named-firm attempts", namedFirmAttemptsWithinCap, normalBatch);

const earlyFailure = summarize(runSimulation({ seed: 31, strategy: "bankrupt", events: true }));
check("early failure has no internship applications", earlyFailure.internshipApplicationCount === 0, earlyFailure);

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

function acceptedRecordGap(summary: ReturnType<typeof summarize>): number {
  return summary.internshipAcceptedCount - summary.internshipRecordCount;
}

function runInternshipShortEventHarness() {
  const state = createInitialState(25, "normal");
  state.phase = "week_settlement";
  state.semesterIndex = 3;
  state.year = 2;
  state.term = 1;
  state.week = 12;
  state.weekInSemester = 0;
  state.activeInternship = {
    targetId: "independent_studio",
    targetLabel: "独立小型工作室",
    tier: "ordinary",
    value: 1,
    startSemesterIndex: 3,
    startWeek: 12,
    remainingWeeks: 3,
    weeksCompleted: 0,
    wageTotal: 0,
    designAtOffer: state.attributes.design,
    softwareAtOffer: state.attributes.software,
    shortEventId: "internship_ordinary_site",
    shortEventWeek: 2,
    shortEventTriggered: false,
  };

  const pendingByWeek: boolean[] = [];
  for (let internshipWeek = 1; internshipWeek <= 3; internshipWeek += 1) {
    state.week = 12 + internshipWeek;
    state.weekInSemester = internshipWeek;
    pendingByWeek.push(hasInternshipShortEventThisWeek(state));
    maybeApplyInternshipWeek(state, true);
  }

  const shortEvents = state.eventRecords.filter((event) => event.pool === "internship_short");
  const recordShortEventId = state.internshipRecords[0]?.shortEventId ?? null;
  const summaryEventCount = summarize(state).eventCount;

  state.activeInternship = {
    targetId: "independent_studio",
    targetLabel: "独立小型工作室",
    tier: "ordinary",
    value: 1,
    startSemesterIndex: 4,
    startWeek: 20,
    remainingWeeks: 1,
    weeksCompleted: 1,
    wageTotal: 0,
    designAtOffer: state.attributes.design,
    softwareAtOffer: state.attributes.software,
    shortEventId: "internship_ordinary_site",
    shortEventWeek: 2,
    shortEventTriggered: false,
  };
  state.week = 21;
  state.weekInSemester = 2;
  maybeApplyInternshipWeek(state, true);

  return {
    pendingByWeek,
    shortEvents,
    recordShortEventId,
    activeInternshipTier: state.activeInternship?.tier ?? null,
    afterRepeatAttemptCount: state.eventRecords.filter((event) => event.pool === "internship_short").length,
    summaryEventCount,
  };
}

function runInternshipChanceHarness() {
  return {
    strong: applicationChanceAtThreshold(
      { design: 48, software: 44 },
      [
        ["independent_studio", "独立小型工作室", "ordinary", 1],
        ["local_design_institute", "地方设计院", "ordinary", 1],
      ],
    ),
    namedFirm: applicationChanceAtThreshold(
      { design: 56, software: 52 },
      [
        ["independent_studio", "独立小型工作室", "ordinary", 1],
        ["local_design_institute", "地方设计院", "ordinary", 1],
        ["state_owned_design_institute", "国企设计院", "strong", 2],
      ],
    ),
  };
}

function applicationChanceAtThreshold(
  attributes: { design: number; software: number },
  completedTargets: [InternshipTargetId, string, InternshipTier, number][],
) {
  const state = createInitialState(25, "normal");
  state.semesterIndex = 3;
  state.year = 2;
  state.term = 1;
  state.week = 13;
  state.energy = 100;
  state.attributes.design = attributes.design;
  state.attributes.software = attributes.software;
  state.internshipRecords = completedTargets.map(([targetId, targetLabel, tier, value]) => ({
    semesterIndex: 3,
    week: 12,
    completedWeek: 12,
    targetId,
    targetLabel,
    tier,
    value,
    designAtOffer: attributes.design,
    softwareAtOffer: attributes.software,
    wageTotal: 0,
    weeksCompleted: 3,
  }));
  maybeApplyForInternship(state);
  return state.internshipApplications[0]?.chance ?? null;
}

function runInternshipHighRiskHarness() {
  const state = createInitialState(25, "normal");
  state.semesterIndex = 3;
  state.year = 2;
  state.term = 1;
  state.week = 13;
  state.energy = 29;
  state.attributes.design = 80;
  state.attributes.software = 80;
  maybeApplyForInternship(state);
  return {
    applicationCount: state.internshipApplications.length,
    appliedSemesterCount: state.internshipAppliedSemesters.length,
  };
}
