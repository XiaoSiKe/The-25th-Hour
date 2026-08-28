import { runSimulation, summarize } from "./simulate.ts";
import { maybeTriggerWeeklyEvent } from "./events.ts";
import { createInitialState } from "./state.ts";

let failures = 0;

const first = runSimulation({ seed: 25, strategy: "normal", events: true });
const second = runSimulation({ seed: 25, strategy: "normal", events: true });
const firstSummary = summarize(first);
const secondSummary = summarize(second);

check(
  "same seed reproduces same event sequence",
  firstSummary.eventIds === secondSummary.eventIds &&
    firstSummary.ending === secondSummary.ending &&
    firstSummary.reviews === secondSummary.reviews,
  { first: firstSummary, second: secondSummary },
);

const modelWeekOk = first.eventRecords
  .filter((event) => event.pool === "model_week")
  .every((event) => ((event.week - 1) % 6) + 1 === 5 && event.semesterIndex !== 9);
check("model-week events only appear on week 5 outside semester 9", modelWeekOk, first.eventRecords);

const aiContextEventIds = new Set(["ai_rescue", "ai_trial"]);
const aiOk = first.eventRecords
  .filter((event) => aiContextEventIds.has(event.eventId))
  .every((event) => event.semesterIndex >= 2 && event.semesterIndex <= 6);
check("AI context events only appear from semester 2 to 6", aiOk, first.eventRecords);

check(
  "guaranteed early-stage events fire",
  first.eventTally.stage_lightly_holding === 1 && deskNoteGuaranteeFires(),
  first.eventTally,
);

check(
  "freshman random follow-up forces an interactive event",
  freshmanInteractiveFollowUpFires(),
  {},
);

const noRepeatOk = Object.values(first.eventTally).every((count) => count <= 1);
check("events do not repeat within one run", noRepeatOk, first.eventTally);

const batchNoRepeatOk = Array.from({ length: 30 }, (_, index) => runSimulation({ seed: index + 1, strategy: "normal", events: true }))
  .every((state) => Object.values(state.eventTally).every((count) => count <= 1));
check("events do not repeat across sampled runs", batchNoRepeatOk, {});

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

function deskNoteGuaranteeFires(): boolean {
  const state = createInitialState(25, "normal");
  state.semesterIndex = 4;
  state.year = 2;
  state.term = 2;
  state.week = 22;
  state.weekInSemester = 4;
  maybeTriggerWeeklyEvent(state, true);
  return state.eventTally.desk_note === 1
    && state.eventRecords.some((event) => event.eventId === "desk_note" && event.semesterIndex === 4);
}

function freshmanInteractiveFollowUpFires(): boolean {
  const state = createInitialState(25, "normal");
  state.year = 1;
  state.term = 1;
  state.semesterIndex = 1;
  state.week = 3;
  state.weekInSemester = 3;
  state.earlyRandomEventNeedsInteractive = true;
  maybeTriggerWeeklyEvent(state, true);
  return state.eventRecords.length === 1
    && state.eventRecords[0].pool === "interactive"
    && state.earlyRandomEventNeedsInteractive === false;
}
