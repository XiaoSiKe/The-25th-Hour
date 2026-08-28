import { nextRng } from "./rng.ts";
import { applyDelta } from "./resolver.ts";
import type { EventDefinition, GameState } from "./types.ts";

const MODEL_EVENT_SEMESTERS = new Set([1, 2, 3, 4, 6, 8]);
const EARLY_INTERACTIVE_FOLLOW_UP_MAX_YEAR = 2;

const EVENT_DEFINITIONS: EventDefinition[] = [
  {
    id: "stage_lightly_holding",
    title: "lightly_holding",
    pool: "regular",
    sentiment: "positive",
    baseWeight: 0,
    cooldownWeeks: 999,
    repeatable: false,
    semesterMin: 2,
    semesterMax: 2,
    delta: { pressure: -5, resilience: 1 },
  },
  {
    id: "desk_note",
    title: "desk_note",
    pool: "regular",
    sentiment: "positive",
    baseWeight: 0,
    cooldownWeeks: 999,
    repeatable: false,
    delta: { pressure: -8, resilience: 1 },
  },
  {
    id: "forgot_save",
    title: "forgot_save",
    pool: "regular",
    sentiment: "negative",
    baseWeight: 18,
    cooldownWeeks: 4,
    repeatable: true,
    delta: { progress: -5, pressure: 5 },
    tags: ["progress_loss"],
  },
  {
    id: "cad_crash",
    title: "cad_crash",
    pool: "regular",
    sentiment: "negative",
    baseWeight: 16,
    cooldownWeeks: 4,
    repeatable: true,
    delta: { progress: -5, pressure: 6, software: -1 },
    tags: ["progress_loss", "software"],
  },
  {
    id: "hard_drive_bad",
    title: "hard_drive_bad",
    pool: "regular",
    sentiment: "negative",
    baseWeight: 8,
    cooldownWeeks: 8,
    repeatable: true,
    delta: { progress: -6, pressure: 7, money: -300 },
    tags: ["progress_loss", "money"],
  },
  {
    id: "team_trouble",
    title: "team_trouble",
    pool: "regular",
    sentiment: "negative",
    baseWeight: 14,
    cooldownWeeks: 4,
    repeatable: true,
    delta: { quality: -2, pressure: 5 },
    tags: ["quality_loss"],
  },
  {
    id: "inspiration",
    title: "inspiration",
    pool: "regular",
    sentiment: "positive",
    baseWeight: 18,
    cooldownWeeks: 3,
    repeatable: true,
    delta: { quality: 4, pressure: -2 },
    tags: ["quality_gain"],
  },
  {
    id: "senior_notes",
    title: "senior_notes",
    pool: "regular",
    sentiment: "positive",
    baseWeight: 12,
    cooldownWeeks: 6,
    repeatable: false,
    delta: { design: 1, aesthetic: 1, pressure: -2 },
    tags: ["growth"],
  },
  {
    id: "teacher_praise",
    title: "teacher_praise",
    pool: "regular",
    sentiment: "positive",
    baseWeight: 14,
    cooldownWeeks: 4,
    repeatable: true,
    delta: { quality: 3, pressure: -4 },
    tags: ["quality_gain"],
  },
  {
    id: "red_packet",
    title: "red_packet",
    pool: "interactive",
    sentiment: "positive",
    baseWeight: 9,
    cooldownWeeks: 8,
    repeatable: true,
    delta: { money: 200, pressure: -1 },
    tags: ["money"],
  },
  {
    id: "cross_workshop",
    title: "cross_workshop",
    pool: "interactive",
    sentiment: "neutral",
    baseWeight: 10,
    cooldownWeeks: 6,
    repeatable: true,
    delta: { energy: -4, money: -100, aesthetic: 2 },
    tags: ["growth"],
  },
  {
    id: "help_classmate",
    title: "help_classmate",
    pool: "interactive",
    sentiment: "neutral",
    baseWeight: 10,
    cooldownWeeks: 6,
    repeatable: true,
    delta: { energy: -5, pressure: 4, social: 2 },
    tags: ["social"],
  },
  {
    id: "ai_rescue",
    title: "ai_rescue",
    pool: "regular",
    sentiment: "positive",
    baseWeight: 10,
    cooldownWeeks: 8,
    repeatable: false,
    semesterMin: 2,
    semesterMax: 6,
    delta: { progress: 4, pressure: -1 },
    tags: ["ai"],
    contextTags: ["ai"],
  },
  {
    id: "ai_trial",
    title: "ai_trial",
    pool: "interactive",
    sentiment: "neutral",
    baseWeight: 10,
    cooldownWeeks: 8,
    repeatable: false,
    semesterMin: 2,
    semesterMax: 6,
    delta: { quality: 3, software: 1, pressure: 2 },
    aiExperienceDelta: 1,
    tags: ["ai"],
    contextTags: ["ai"],
  },
  {
    id: "model_good_cut",
    title: "model_good_cut",
    pool: "model_week",
    sentiment: "positive",
    baseWeight: 18,
    cooldownWeeks: 4,
    repeatable: true,
    weekInSemester: 5,
    delta: { quality: 6, pressure: -2 },
    tags: ["model_week", "quality_gain"],
  },
  {
    id: "model_bad_material",
    title: "model_bad_material",
    pool: "model_week",
    sentiment: "negative",
    baseWeight: 18,
    cooldownWeeks: 4,
    repeatable: true,
    weekInSemester: 5,
    delta: { quality: -4, energy: -3, pressure: 6 },
    tags: ["model_week", "quality_loss"],
  },
  {
    id: "senior_peer_pressure",
    title: "senior_peer_pressure",
    pool: "regular",
    sentiment: "negative",
    baseWeight: 14,
    cooldownWeeks: 4,
    repeatable: true,
    semesterMin: 7,
    semesterMax: 8,
    delta: { pressure: 6 },
    tags: ["route_anxiety"],
  },
  {
    id: "senior_portfolio_collision",
    title: "senior_portfolio_collision",
    pool: "regular",
    sentiment: "negative",
    baseWeight: 10,
    cooldownWeeks: 6,
    repeatable: true,
    semesterMin: 7,
    semesterMax: 8,
    delta: { quality: -2, pressure: 5 },
    tags: ["route_anxiety", "quality_loss"],
  },
  {
    id: "graduation_old_sketch",
    title: "graduation_old_sketch",
    pool: "regular",
    sentiment: "positive",
    baseWeight: 12,
    cooldownWeeks: 4,
    repeatable: true,
    semesterMin: 9,
    semesterMax: 10,
    delta: { pressure: -2, aesthetic: 1 },
    tags: ["graduation_memory"],
  },
  {
    id: "graduation_growth",
    title: "graduation_growth",
    pool: "regular",
    sentiment: "positive",
    baseWeight: 12,
    cooldownWeeks: 4,
    repeatable: true,
    semesterMin: 9,
    semesterMax: 10,
    delta: { quality: 2, pressure: -3 },
    tags: ["graduation_memory", "quality_gain"],
  },
];

export function maybeTriggerWeeklyEvent(state: GameState, enabled: boolean): void {
  if (!enabled || state.ending) {
    return;
  }

  const guaranteed = guaranteedEventForWeek(state);
  if (guaranteed) {
    triggerEvent(state, guaranteed, "guaranteed");
    return;
  }

  if (shouldForceEarlyInteractiveFollowUp(state)) {
    const candidates = EVENT_DEFINITIONS.filter((event) => event.pool === "interactive" && isEligible(state, event));
    if (candidates.length > 0) {
      triggerEvent(state, chooseWeighted(state, candidates), "random");
    }
    return;
  }

  if (roll(state) > eventChance(state)) {
    return;
  }

  const candidates = EVENT_DEFINITIONS.filter((event) => isEligible(state, event));
  if (candidates.length === 0) {
    return;
  }

  const event = chooseWeighted(state, candidates);
  triggerEvent(state, event, "random");
}

export function eventDefinitions(): EventDefinition[] {
  return [...EVENT_DEFINITIONS];
}

function guaranteedEventForWeek(state: GameState): EventDefinition | undefined {
  if (state.semesterIndex === 2 && state.weekInSemester === 1 && !state.guaranteedEvents.lightlyHolding) {
    state.guaranteedEvents.lightlyHolding = true;
    return mustFind("stage_lightly_holding");
  }

  if (state.semesterIndex === 4 && state.weekInSemester >= 4 && !state.guaranteedEvents.deskNote) {
    state.guaranteedEvents.deskNote = true;
    return mustFind("desk_note");
  }

  if (state.semesterIndex === 9 && state.weekInSemester === 5) {
    const candidates = EVENT_DEFINITIONS.filter((event) => isEligible(state, event) && (event.tags ?? []).includes("graduation_memory"));
    return candidates.length > 0 ? chooseWeighted(state, candidates) : undefined;
  }

  return undefined;
}

function isEligible(state: GameState, event: EventDefinition): boolean {
  if (event.baseWeight <= 0) {
    return false;
  }

  if (state.eventTally[event.id]) {
    return false;
  }

  if (event.semesterMin !== undefined && state.semesterIndex < event.semesterMin) {
    return false;
  }

  if (event.semesterMax !== undefined && state.semesterIndex > event.semesterMax) {
    return false;
  }

  if (event.weekInSemester !== undefined && state.weekInSemester !== event.weekInSemester) {
    return false;
  }

  if (event.pool === "model_week" && (state.weekInSemester !== 5 || !MODEL_EVENT_SEMESTERS.has(state.semesterIndex))) {
    return false;
  }

  if (event.pool !== "model_week" && state.weekInSemester === 5 && MODEL_EVENT_SEMESTERS.has(state.semesterIndex)) {
    // Model week has its own small pool when events are enabled.
    return false;
  }

  const lastWeek = state.eventLastTriggeredWeek[event.id];
  if (lastWeek !== undefined && state.week - lastWeek <= event.cooldownWeeks) {
    return false;
  }

  return true;
}

function triggerEvent(state: GameState, event: EventDefinition, mode: "guaranteed" | "random"): void {
  state.eventHistory.push(event.id);
  state.eventLastTriggeredWeek[event.id] = state.week;
  state.eventTally[event.id] = (state.eventTally[event.id] ?? 0) + 1;
  if (event.pool === "interactive" && (event.aiExperienceDelta ?? 0) > 0) {
    state.aiExperience += event.aiExperienceDelta ?? 0;
  }
  updateEarlyInteractiveFollowUp(state, event);
  state.eventRecords.push({
    eventId: event.id,
    title: event.title,
    week: state.week,
    semesterIndex: state.semesterIndex,
    pool: event.pool,
    sentiment: event.sentiment,
    aiExperienceDelta: event.aiExperienceDelta ?? 0,
  });

  applyDelta(state, `event:${event.id}`, `event ${mode}: ${event.title}`, event.delta, state.phase);
}

function shouldForceEarlyInteractiveFollowUp(state: GameState): boolean {
  return state.year <= EARLY_INTERACTIVE_FOLLOW_UP_MAX_YEAR
    && state.earlyRandomEventNeedsInteractive;
}

function updateEarlyInteractiveFollowUp(state: GameState, event: EventDefinition): void {
  if (state.year > EARLY_INTERACTIVE_FOLLOW_UP_MAX_YEAR) {
    state.earlyRandomEventNeedsInteractive = false;
    return;
  }
  if (event.pool === "regular") {
    state.earlyRandomEventNeedsInteractive = true;
  } else if (event.pool === "interactive") {
    state.earlyRandomEventNeedsInteractive = false;
  }
}

function eventChance(state: GameState): number {
  if (state.weekInSemester === 5) {
    return 0.55;
  }
  if (state.semesterIndex <= 4) {
    return 0.38;
  }
  if (state.semesterIndex <= 8) {
    return 0.32;
  }
  return 0.28;
}

function chooseWeighted(state: GameState, candidates: EventDefinition[]): EventDefinition {
  const total = candidates.reduce((sum, event) => sum + event.baseWeight, 0);
  const value = roll(state) * total;
  let cursor = 0;

  for (const event of candidates) {
    cursor += event.baseWeight;
    if (value <= cursor) {
      return event;
    }
  }

  return candidates[candidates.length - 1];
}

function roll(state: GameState): number {
  const [nextState, value] = nextRng(state.rngState);
  state.rngState = nextState;
  return value;
}

function mustFind(id: string): EventDefinition {
  const event = EVENT_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!event) {
    throw new Error(`Missing event definition: ${id}`);
  }
  return event;
}
