import { runSimulation, summarize } from "./simulate.ts";
import { canPerformAction } from "./actions.ts";
import { courseGpaModifier } from "./courses.ts";
import { resolveReview } from "./review.ts";
import { applyDelta, applyPositiveYieldPenalty } from "./resolver.ts";
import { createInitialState } from "./state.ts";
import type { EndingId, ReviewRecord, StrategyId } from "./types.ts";

interface Case {
  name: string;
  strategy: StrategyId;
  seed: number;
  expectedEnding: EndingId;
}

const cases: Case[] = [
  { name: "fixed seed baseline can graduate", strategy: "normal", seed: 3, expectedEnding: "stable_graduation" },
  { name: "money boundary can fail", strategy: "bankrupt", seed: 31, expectedEnding: "living_cost_break" },
  { name: "energy boundary can fail", strategy: "burnout", seed: 32, expectedEnding: "forced_suspension" },
  { name: "pressure boundary can fail", strategy: "pressure", seed: 33, expectedEnding: "pressure_collapse" },
  { name: "review boundary can fail", strategy: "fail_reviews", seed: 34, expectedEnding: "two_failed_reviews" },
];

let failures = 0;

for (const testCase of cases) {
  const result = summarize(runSimulation({ seed: testCase.seed, strategy: testCase.strategy }));
  const ok = result.ending === testCase.expectedEnding;
  console.log(`${ok ? "PASS" : "FAIL"} ${testCase.name}: expected ${testCase.expectedEnding}, got ${result.ending}`);
  console.log(JSON.stringify(result, null, 2));
  if (!ok) {
    failures += 1;
  }
}

for (const [correctAnswers, expected] of [
  [3, 0.1],
  [2, 0],
  [1, -0.2],
  [0, -0.3],
] as const) {
  const actual = courseGpaModifier(correctAnswers);
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"} course GPA modifier for ${correctAnswers}/3: expected ${expected}, got ${actual}`);
  if (!ok) {
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.progress = 96;
  state.quality = 97;
  applyDelta(state, "verify_cap", "ordinary course progress cap", { progress: 10, quality: 10 }, "week_action");
  const ok = state.progress === 100 && state.quality === 100;
  console.log(`${ok ? "PASS" : "FAIL"} ordinary course progress and quality cap at 100`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.phase = "week_action";
  state.actionsRemaining = 1;
  state.weeklyActionCounts = { outsourcing: 1, part_time: 1 };
  const result = canPerformAction(state, "outsourcing");
  const ok = result.ok === false && result.reason === "weekly_paid_work_limit_reached";
  console.log(`${ok ? "PASS" : "FAIL"} outsourcing and part-time share one weekly limit`);
  if (!ok) {
    console.log(JSON.stringify({ result, weeklyActionCounts: state.weeklyActionCounts }, null, 2));
    failures += 1;
  }
}

{
  const ok = applyPositiveYieldPenalty(0.5, 1) === 0.5;
  console.log(`${ok ? "PASS" : "FAIL"} risk penalty preserves small positive decimal yield`);
  if (!ok) {
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.pressure = 99;
  applyDelta(state, "verify_pressure_cap", "pressure reaches immediate collapse threshold", { pressure: 1 }, "week_action");
  const ok = state.ending === "pressure_collapse";
  console.log(`${ok ? "PASS" : "FAIL"} pressure 100 fails immediately: expected pressure_collapse, got ${state.ending}`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.pressure = 98;
  applyDelta(state, "verify_pressure_near_cap", "pressure stays below immediate collapse threshold", { pressure: 1 }, "week_action");
  const ok = state.pressure === 99 && !state.ending;
  console.log(`${ok ? "PASS" : "FAIL"} pressure below 100 does not fail immediately: expected pressure 99 without ending, got pressure ${state.pressure}, ending ${state.ending}`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.attributes.design = 80;
  applyDelta(state, "verify_attribute_decay", "attribute decay keeps decimals", { design: 0.5 }, "week_action");
  const ok = state.attributes.design === 80.25;
  console.log(`${ok ? "PASS" : "FAIL"} high attribute growth decay keeps decimal yield: expected 80.25, got ${state.attributes.design}`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.progress = 100;
  state.quality = 100;
  state.gpaModifier = 0.2;
  resolveReview(state);
  const ok = state.reviews.at(-1)?.semesterGpa === 4;
  console.log(`${ok ? "PASS" : "FAIL"} S review GPA clamps positive modifier to 4.0`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.progress = 100;
  state.quality = 40;
  state.gpaModifier = -0.3;
  resolveReview(state);
  const ok = state.reviews.at(-1)?.semesterGpa === 0 && state.gpa === 0;
  console.log(`${ok ? "PASS" : "FAIL"} F review ignores GPA modifiers and records 0.0`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const quality79 = createInitialState(35, "normal");
  quality79.progress = 100;
  quality79.quality = 79;
  resolveReview(quality79);

  const quality80 = createInitialState(35, "normal");
  quality80.progress = 100;
  quality80.quality = 80;
  resolveReview(quality80);

  const score79 = quality79.reviews.at(-1)?.quality ?? 0;
  const score80 = quality80.reviews.at(-1)?.quality ?? 0;
  const ok = score79 <= score80;
  console.log(`${ok ? "PASS" : "FAIL"} review support does not make quality 79 beat quality 80: ${score79} <= ${score80}`);
  if (!ok) {
    console.log(JSON.stringify({ quality79: summarize(quality79), quality80: summarize(quality80) }, null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.semesterIndex = 10;
  state.year = 5;
  state.term = 2;
  state.week = 60;
  state.weekInSemester = 6;
  state.progress = 240;
  state.quality = 148;
  resolveReview(state);
  const ok = state.completedGraduationDesign && (state.reviews.at(-1)?.finalGrade ?? "F") !== "F";
  console.log(`${ok ? "PASS" : "FAIL"} graduation design support uses 0-100 quality score, not raw 0-250 quality`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.semesterIndex = 10;
  state.year = 5;
  state.term = 2;
  state.progress = 246;
  state.quality = 248;
  applyDelta(state, "verify_cap", "graduation design progress cap", { progress: 10, quality: 10 }, "week_action");
  const ok = state.progress === 250 && state.quality === 250;
  console.log(`${ok ? "PASS" : "FAIL"} graduation design progress and quality cap at 250`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.semesterIndex = 10;
  state.year = 5;
  state.term = 2;
  state.week = 60;
  state.weekInSemester = 6;
  state.progress = 240;
  state.quality = 240;
  resolveReview(state);
  const ok = state.completedGraduationDesign;
  console.log(`${ok ? "PASS" : "FAIL"} graduation design completes at 240 progress`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.semesterIndex = 10;
  state.year = 5;
  state.term = 2;
  state.week = 60;
  state.weekInSemester = 6;
  state.progress = 239;
  state.quality = 240;
  resolveReview(state);
  const ok = !state.completedGraduationDesign;
  console.log(`${ok ? "PASS" : "FAIL"} graduation design does not complete at 239 progress`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.reviews.push(previousFailedReview(1, 1, 1));
  state.consecutiveFailedReviews = 0;
  state.semesterIndex = 3;
  state.year = 2;
  state.term = 1;
  state.week = 18;
  state.weekInSemester = 6;
  state.progress = 0;
  state.quality = 120;
  resolveReview(state);
  const ok = state.ending === "two_failed_reviews";
  console.log(`${ok ? "PASS" : "FAIL"} accumulated second F can fail: expected two_failed_reviews, got ${state.ending}`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

{
  const state = createInitialState(35, "normal");
  state.reviews.push(previousFailedReview(6, 3, 2));
  state.semesterIndex = 10;
  state.year = 5;
  state.term = 2;
  state.week = 60;
  state.weekInSemester = 6;
  state.consecutiveFailedReviews = 0;
  state.progress = 239;
  state.quality = 240;
  resolveReview(state);
  const ok = state.ending === "graduation_failed";
  console.log(`${ok ? "PASS" : "FAIL"} graduation design failure has priority over second F: expected graduation_failed, got ${state.ending}`);
  if (!ok) {
    console.log(JSON.stringify(summarize(state), null, 2));
    failures += 1;
  }
}

if (failures > 0) {
  process.exitCode = 1;
}

function previousFailedReview(semesterIndex: number, year: number, term: 1 | 2): ReviewRecord {
  return {
    semesterIndex,
    year,
    term,
    progress: 0,
    quality: 0,
    baseGrade: "F",
    finalGrade: "F",
    designCourseGpa: 0,
    semesterGpa: 0,
    portfolioAdded: 0,
    isGraduationDesign: false,
  };
}
