import {
  WEEKLY_LIVING_COST,
  isGraduationDesign,
  progressCapForSemester,
  qualityCapForSemester,
} from "./rules.ts";
import { snapshot } from "./state.ts";
import type { AttributeKey, Delta, GameState, Phase } from "./types.ts";

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "design",
  "software",
  "aesthetic",
  "presentation",
  "social",
  "resilience",
];

export function applyDelta(
  state: GameState,
  source: string,
  message: string,
  delta: Delta,
  phase: Phase = state.phase,
): void {
  if (state.ending) {
    return;
  }

  const adjusted = adjustAttributeGrowth(state, delta);

  state.energy += adjusted.energy ?? 0;
  state.pressure += adjusted.pressure ?? 0;
  state.money += adjusted.money ?? 0;
  state.progress += adjusted.progress ?? 0;
  state.quality += adjusted.quality ?? 0;
  state.portfolio += adjusted.portfolio ?? 0;
  state.internshipValue += adjusted.internshipValue ?? 0;
  state.gpaModifier += adjusted.gpaModifier ?? 0;

  for (const key of ATTRIBUTE_KEYS) {
    state.attributes[key] += adjusted[key] ?? 0;
    state.attributes[key] = clamp(state.attributes[key], 0, 100);
  }

  state.pressure = clamp(state.pressure, 0, 100);
  state.energy = Math.min(state.energy, state.maxEnergy);
  state.progress = clamp(state.progress, 0, progressCapForSemester(state.semesterIndex));
  state.quality = clamp(state.quality, 0, qualityCapForSemester(state.semesterIndex));

  if (state.money < 0) {
    state.failureReason = "living_cost_break";
    state.ending = "living_cost_break";
  }

  if (state.energy < 0) {
    state.failureReason = "forced_suspension";
    state.ending = "forced_suspension";
  }

  if (!state.ending && state.pressure >= 100) {
    state.failureReason = "pressure_collapse";
    state.ending = "pressure_collapse";
  }

  log(state, phase, source, message, adjusted);
}

export function applyWeeklySettlement(state: GameState): void {
  if (state.ending) {
    return;
  }

  applyDelta(
    state,
    "weekly_living_cost",
    "weekly living cost",
    { money: -weeklyLivingCostForState(state) },
    "week_settlement",
  );
  if (state.ending) {
    return;
  }

  if (state.pressure > 90) {
    state.pressureOver90Weeks += 1;
  } else {
    state.pressureOver90Weeks = 0;
  }

  if (state.pressureOver90Weeks >= 2 && !state.ending) {
    state.failureReason = "pressure_collapse";
    state.ending = "pressure_collapse";
    log(state, "week_settlement", "failure_check", "pressure over 90 for 2 consecutive weeks", {});
  }

  if (state.ending) {
    return;
  }

  applyDelta(
    state,
    "weekly_recovery",
    "weekly recovery",
    { energy: 10, pressure: -5 },
    "week_settlement",
  );
}

export function log(
  state: GameState,
  phase: Phase,
  source: string,
  message: string,
  delta?: Delta,
): void {
  state.logs.push({
    index: state.logs.length + 1,
    week: state.week,
    year: state.year,
    term: state.term,
    weekInSemester: state.weekInSemester,
    phase,
    source,
    message,
    delta,
    snapshot: snapshot(state),
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function currentRiskPenalty(state: GameState): number {
  if (state.energy < 30 || state.pressure > 80) {
    return 2;
  }
  if ((state.energy >= 30 && state.energy < 60) || (state.pressure > 50 && state.pressure <= 80)) {
    return 1;
  }
  return 0;
}

export function applyPositiveYieldPenalty(value: number, penalty: number): number {
  if (value <= 0 || penalty <= 0) {
    return value;
  }
  const reduced = value - penalty;
  return reduced > 0 ? reduced : value;
}

export function weeklyLivingCostForState(state: GameState): number {
  // Core simulator uses one ordinary-family baseline until character backgrounds are modeled.
  return isGraduationDesign(state.semesterIndex) ? WEEKLY_LIVING_COST : WEEKLY_LIVING_COST;
}

function adjustAttributeGrowth(state: GameState, delta: Delta): Delta {
  const adjusted: Delta = { ...delta };

  for (const key of ATTRIBUTE_KEYS) {
    const amount = delta[key];
    if (!amount) {
      continue;
    }

    const current = state.attributes[key];
    if (amount > 0 && current >= 80) {
      adjusted[key] = amount / 2;
    } else if (amount < 0 && current <= 20) {
      adjusted[key] = amount / 2;
    }
  }

  return adjusted;
}
