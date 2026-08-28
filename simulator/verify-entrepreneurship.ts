import { createInitialState } from "./state.ts";
import { maybeResolveHiddenRouteResultAfterReview, routeOutcomeForEnding } from "./routes.ts";
import type { GameState } from "./types.ts";

let failures = 0;

const inaccessible = resolveEntrepreneurshipHarness("signed", 79);
check("entrepreneurship target binds career-change route", inaccessible.route.formal?.route === "career_change", inaccessible);
check("entrepreneurship is locked before six attributes reach 80", inaccessible.route.hiddenResult?.outcome === "career_failed", inaccessible);
check("locked entrepreneurship does not offer contract", inaccessible.route.entrepreneurshipContract?.contractOffered === false, inaccessible);

const signed = resolveEntrepreneurshipHarness("signed");
check("eligible entrepreneurship offers contract", signed.route.entrepreneurshipContract?.contractOffered === true, signed);
check("signed contract resolves hidden route", signed.route.hiddenResult?.outcome === "career_startup", signed);
check("signed contract reaches final parser", routeOutcomeForEnding(signed) === "career_startup", signed);

const abandoned = resolveEntrepreneurshipHarness("abandoned");
check("abandoned contract does not resolve special ending", abandoned.route.hiddenResult?.outcome === "career_failed", abandoned);
check("abandoned contract stores player choice", abandoned.route.entrepreneurshipContract?.contractChoice === "abandoned", abandoned);

if (failures > 0) {
  process.exitCode = 1;
}

function resolveEntrepreneurshipHarness(contractChoice: "signed" | "abandoned", attributeValue = 80): GameState {
  const state = createInitialState(25, "career_change");
  state.semesterIndex = 10;
  state.week = 60;
  state.weekInSemester = 6;
  state.completedGraduationDesign = true;
  state.route.targetOverride = "entrepreneurship";
  state.route.formal = {
    route: "career_change",
    group: "career_change",
    target: "entrepreneurship",
    week: 49,
  };
  state.route.entrepreneurshipContract = {
    unlocked: true,
    contractOffered: false,
    contractChoice,
  };
  state.attributes = {
    design: attributeValue,
    software: attributeValue,
    aesthetic: attributeValue,
    presentation: attributeValue,
    social: attributeValue,
    resilience: attributeValue,
  };

  maybeResolveHiddenRouteResultAfterReview(state);
  return state;
}

function check(name: string, condition: boolean, detail: unknown): void {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}`);
  if (!condition) {
    console.log(JSON.stringify(detail, null, 2));
    failures += 1;
  }
}
