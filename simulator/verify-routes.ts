import { createInitialState } from "./state.ts";
import { maybeResolveHiddenRouteResultAfterReview } from "./routes.ts";
import { runSimulation, summarize } from "./simulate.ts";
import type { EndingId, RouteId, StrategyId } from "./types.ts";

interface Case {
  strategy: StrategyId;
  expectedRoute: RouteId | null;
  expectedEndings: EndingId[];
}

const cases: Case[] = [
  { strategy: "normal", expectedRoute: null, expectedEndings: ["stable_graduation"] },
  { strategy: "postgrad", expectedRoute: "postgrad_exam", expectedEndings: ["steady_postgrad"] },
  { strategy: "overseas", expectedRoute: "overseas", expectedEndings: ["overseas_stable"] },
  {
    strategy: "civil_service",
    expectedRoute: "civil_service",
    expectedEndings: ["public_institution", "civil_retry"],
  },
  { strategy: "architecture_job", expectedRoute: "architecture_job", expectedEndings: ["architecture_local"] },
  { strategy: "career_change", expectedRoute: "career_change", expectedEndings: ["career_content", "career_failed"] },
];

let failures = 0;

for (const testCase of cases) {
  const state = runSimulation({ seed: 25, strategy: testCase.strategy, events: true });
  const result = summarize(state);
  const routeOk = result.formalRoute === testCase.expectedRoute;
  const fullLoopOk = result.weeks === 60;
  const expectedEndingOk = expectedEndingRespectsPriority(result, testCase.expectedEndings);
  const endingOk = finalEndingRespectsPriority(result, testCase.expectedRoute);
  const hiddenStateOk =
    result.ending === "graduation_failed" && result.completedGraduationDesign === false
      ? true
      : testCase.expectedRoute === null
      ? result.hiddenRouteAttributes === null
      : result.hiddenRouteAttributes !== null && result.hiddenRoutePortfolio !== null;

  check(`${testCase.strategy} completes full 60-week loop`, fullLoopOk, result);
  check(`${testCase.strategy} formal route`, routeOk, result);
  check(`${testCase.strategy} expected ending`, expectedEndingOk, result);
  check(`${testCase.strategy} hidden route state is cached`, hiddenStateOk, result);
  check(`${testCase.strategy} route ending is read at final parser`, endingOk, result);
}

{
  const state = createInitialState(3200, "civil_service");
  state.semesterIndex = 10;
  state.route.formal = {
    route: "civil_service",
    group: "civil",
    target: "civil_service_ministry",
    week: 49,
  };
  state.gpa = 0;
  state.attributes.presentation = 58;
  state.attributes.social = 60;
  state.attributes.resilience = 58;
  maybeResolveHiddenRouteResultAfterReview(state);
  check(
    "civil-service fallback is read before failed exam fallback",
    state.route.hiddenResult?.outcome === "civil_retry",
    state.route.hiddenResult,
  );
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

function finalEndingRespectsPriority(result: ReturnType<typeof summarize>, expectedRoute: RouteId | null): boolean {
  if (result.ending === "graduation_failed") {
    return result.completedGraduationDesign === false;
  }

  if (expectedRoute === null) {
    return result.hiddenRouteOutcome === null;
  }

  return result.hiddenRouteOutcome === result.ending;
}

function expectedEndingRespectsPriority(result: ReturnType<typeof summarize>, expectedEndings: EndingId[]): boolean {
  if (result.ending === "graduation_failed") {
    return result.completedGraduationDesign === false;
  }
  return expectedEndings.includes(result.ending);
}
