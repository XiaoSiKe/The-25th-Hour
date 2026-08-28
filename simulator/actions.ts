import { ACTIONS } from "./rules.ts";
import {
  applyDelta,
  applyPositiveYieldPenalty,
  currentRiskPenalty,
  log,
} from "./resolver.ts";
import type { ActionId, Delta, GameState } from "./types.ts";

const PRESSURE_HIGH_RISK_DISABLED_ACTIONS = new Set<ActionId>([
  "design_iteration",
  "site_research",
  "normal_drawing",
  "crunch_drawing",
  "outsourcing",
  "part_time",
]);
const PAID_WORK_ACTION_IDS: ActionId[] = ["outsourcing", "part_time"];
const PAID_WORK_WEEKLY_LIMIT = 2;
const SENIOR_PROGRESS_BONUS_ACTIONS = new Set<ActionId>(["normal_drawing", "crunch_drawing"]);
const SENIOR_QUALITY_BONUS_ACTIONS = new Set<ActionId>(["design_iteration", "site_research"]);

export function canPerformAction(state: GameState, actionId: ActionId): { ok: boolean; reason?: string } {
  const action = ACTIONS[actionId];
  const count = state.weeklyActionCounts[actionId] ?? 0;

  if (state.actionsRemaining <= 0) {
    return { ok: false, reason: "no_weekly_actions_remaining" };
  }

  if (PAID_WORK_ACTION_IDS.includes(actionId) && paidWorkWeeklyLimitReached(state)) {
    return { ok: false, reason: "weekly_paid_work_limit_reached" };
  }

  if (action.maxPerWeek !== undefined && count >= action.maxPerWeek) {
    return { ok: false, reason: "weekly_action_limit_reached" };
  }

  if (state.energy < 30 && action.highEnergyCost) {
    return { ok: false, reason: "energy_high_risk" };
  }

  if (state.pressure > 80 && PRESSURE_HIGH_RISK_DISABLED_ACTIONS.has(actionId)) {
    return { ok: false, reason: "pressure_high_risk" };
  }

  return { ok: true };
}

function paidWorkWeeklyLimitReached(state: GameState): boolean {
  return PAID_WORK_ACTION_IDS.reduce((total, actionId) => total + (state.weeklyActionCounts[actionId] ?? 0), 0) >= PAID_WORK_WEEKLY_LIMIT;
}

export function performAction(state: GameState, actionId: ActionId): boolean {
  const availability = canPerformAction(state, actionId);
  const action = ACTIONS[actionId];

  if (!availability.ok) {
    log(state, "week_action", action.id, `action unavailable: ${action.name}: ${availability.reason}`, {});
    return false;
  }

  const penalty = currentRiskPenalty(state);
  const delta: Delta = { ...action.baseDelta };

  if (action.progressBase !== undefined) {
    delta.progress = applyPositiveYieldPenalty(action.progressBase + progressModifier(state) + seniorProgressBonus(state, actionId), penalty);
  }

  if (action.qualityBase !== undefined) {
    delta.quality = applyPositiveYieldPenalty(action.qualityBase + qualityModifier(state) + seniorQualityBonus(state, actionId), penalty);
  }

  for (const key of ["design", "software", "aesthetic", "presentation", "social", "resilience"] as const) {
    if (delta[key] !== undefined) {
      delta[key] = applyPositiveYieldPenalty(delta[key] ?? 0, penalty);
    }
  }

  state.actionsRemaining -= 1;
  state.weeklyActionCounts[actionId] = (state.weeklyActionCounts[actionId] ?? 0) + 1;
  state.semesterActionTally[actionId] = (state.semesterActionTally[actionId] ?? 0) + 1;
  state.actionTally[actionId] = (state.actionTally[actionId] ?? 0) + 1;

  applyDelta(state, action.id, action.name, delta, "week_action");
  return true;
}

export function progressModifier(state: GameState): number {
  const software = state.attributes.software;
  if (software >= 80) return 3;
  if (software >= 60) return 2;
  if (software >= 40) return 1;
  return 0;
}

export function qualityModifier(state: GameState): number {
  const qualityUnderstanding = Math.floor((state.attributes.design + state.attributes.aesthetic) / 2);
  if (qualityUnderstanding >= 80) return 3;
  if (qualityUnderstanding >= 60) return 2;
  if (qualityUnderstanding >= 40) return 1;
  return 0;
}

function seniorProgressBonus(state: GameState, actionId: ActionId): number {
  return state.year === 5 && SENIOR_PROGRESS_BONUS_ACTIONS.has(actionId) ? 4 : 0;
}

function seniorQualityBonus(state: GameState, actionId: ActionId): number {
  return state.year === 5 && SENIOR_QUALITY_BONUS_ACTIONS.has(actionId) ? 4 : 0;
}
