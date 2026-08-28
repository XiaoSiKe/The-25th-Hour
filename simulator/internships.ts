import { INTERNSHIP_APPLICATION, INTERNSHIP_TARGET_ORDER, INTERNSHIP_TARGETS, INTERNSHIP_THRESHOLDS } from "./balance.ts";
import { randomInt } from "./rng.ts";
import { applyDelta, log } from "./resolver.ts";
import type { Delta, GameState, InternshipTargetId, InternshipTier } from "./types.ts";

const INTERNSHIP_WEEKLY_DELTAS = {
  ordinary: { money: 300, energy: -3, pressure: 2 },
  strong: { money: 500, energy: -4, pressure: 3 },
  named_firm: { money: 800, energy: -5, pressure: 4 },
} as const;

const INTERNSHIP_COMPLETION_DELTAS = {
  ordinary: { design: 1 },
  strong: { design: 1, software: 1 },
  named_firm: { design: 1, software: 1, presentation: 1 },
} as const;

const INTERNSHIP_SHORT_EVENTS: Record<InternshipTier, {
  id: string;
  title: string;
  week: number;
  delta: Delta;
}[]> = {
  ordinary: [
    { id: "internship_ordinary_blueprint", title: "第一张施工图", week: 1, delta: { software: 1 } },
    { id: "internship_ordinary_site", title: "现场", week: 2, delta: { design: 1 } },
    { id: "internship_ordinary_dinner_money", title: "晚饭钱", week: 3, delta: { resilience: 1 } },
  ],
  strong: [
    { id: "internship_strong_meeting_room", title: "会议室", week: 1, delta: { presentation: 1 } },
    { id: "internship_strong_redlines", title: "红线", week: 2, delta: { design: 1 } },
    { id: "internship_strong_all_nighter", title: "疯狂熬夜", week: 3, delta: { resilience: 1 } },
  ],
  named_firm: [
    { id: "internship_named_firm_busy", title: "忙忙碌碌", week: 1, delta: { social: 1 } },
    { id: "internship_named_firm_abbreviations", title: "英文缩写", week: 2, delta: { presentation: 1 } },
    { id: "internship_named_firm_remembered", title: "铭记", week: 3, delta: { resilience: 1 } },
  ],
};

export function hasInternshipShortEventThisWeek(state: GameState): boolean {
  const active = state.activeInternship;
  if (!active?.shortEventId || active.shortEventTriggered) {
    return false;
  }
  if (state.eventTally[active.shortEventId]) {
    return false;
  }
  return active.shortEventWeek === active.weeksCompleted + 1;
}

export function maybeApplyInternshipWeek(state: GameState, eventsEnabled = true): void {
  const active = state.activeInternship;
  if (!active || state.ending) {
    return;
  }

  const delta = INTERNSHIP_WEEKLY_DELTAS[active.tier];
  active.remainingWeeks -= 1;
  active.weeksCompleted += 1;
  active.wageTotal += delta.money;
  applyDelta(state, "internship_week", `internship week: ${active.tier}`, delta, "week_settlement");
  if (eventsEnabled) {
    maybeTriggerInternshipShortEvent(state, active);
  }

  if (active.remainingWeeks <= 0 && !state.ending) {
    completeInternship(state);
  }
}

export function maybeApplyForInternship(state: GameState): void {
  if (state.semesterIndex < INTERNSHIP_APPLICATION.earliestSemester || state.ending || state.activeInternship) {
    return;
  }
  if (state.energy < 30) {
    return;
  }

  if (state.internshipAppliedSemesters.includes(state.semesterIndex)) {
    return;
  }

  const target = desiredInternshipTarget(state);
  if (!target) {
    return;
  }
  const tier = target.tier;

  state.internshipAppliedSemesters.push(state.semesterIndex);
  const chance = internshipChance(state, target);
  const [rngState, roll] = randomInt(state.rngState, 1, 100);
  state.rngState = rngState;
  const accepted = roll <= chance;

  state.internshipApplications.push({
    semesterIndex: state.semesterIndex,
    week: state.week,
    targetId: target.id,
    targetLabel: target.label,
    tier,
    chance,
    roll,
    accepted,
    designAtApplication: state.attributes.design,
    softwareAtApplication: state.attributes.software,
  });

  if (!accepted) {
    log(state, state.phase, "internship_application", `internship rejected: ${target.label} ${tier} roll=${roll} chance=${chance}`, {});
    return;
  }

  const shortEvent = drawInternshipShortEvent(state, tier);
  state.activeInternship = {
    targetId: target.id,
    targetLabel: target.label,
    tier,
    value: internshipValue(tier),
    startSemesterIndex: state.semesterIndex,
    startWeek: state.week,
    remainingWeeks: INTERNSHIP_APPLICATION.durationWeeks,
    weeksCompleted: 0,
    wageTotal: 0,
    designAtOffer: state.attributes.design,
    softwareAtOffer: state.attributes.software,
    shortEventId: shortEvent?.id,
    shortEventWeek: shortEvent?.week,
    shortEventTriggered: false,
  };

  log(state, state.phase, "internship_application", `internship accepted: ${target.label} ${tier} roll=${roll} chance=${chance}`, {});
}

function drawInternshipShortEvent(state: GameState, tier: InternshipTier) {
  const candidates = INTERNSHIP_SHORT_EVENTS[tier].filter((event) => !state.eventTally[event.id]);
  if (candidates.length === 0) {
    return undefined;
  }
  const [rngState, index] = randomInt(state.rngState, 0, candidates.length - 1);
  state.rngState = rngState;
  return candidates[index];
}

function maybeTriggerInternshipShortEvent(
  state: GameState,
  active: NonNullable<GameState["activeInternship"]>,
): void {
  if (!shouldTriggerInternshipShortEventNow(state, active)) {
    return;
  }

  const event = INTERNSHIP_SHORT_EVENTS[active.tier].find((item) => item.id === active.shortEventId);
  if (!event) {
    return;
  }

  active.shortEventTriggered = true;
  state.eventHistory.push(event.id);
  state.eventLastTriggeredWeek[event.id] = state.week;
  state.eventTally[event.id] = (state.eventTally[event.id] ?? 0) + 1;
  state.eventRecords.push({
    eventId: event.id,
    title: event.title,
    week: state.week,
    semesterIndex: state.semesterIndex,
    pool: "internship_short",
    sentiment: "positive",
    aiExperienceDelta: 0,
  });
  applyDelta(state, `event:${event.id}`, `internship short event: ${event.title}`, event.delta, "week_settlement");
}

function shouldTriggerInternshipShortEventNow(
  state: GameState,
  active: NonNullable<GameState["activeInternship"]>,
): boolean {
  if (!active.shortEventId || active.shortEventTriggered) {
    return false;
  }
  if (state.eventTally[active.shortEventId]) {
    return false;
  }
  return active.shortEventWeek === active.weeksCompleted;
}

function completeInternship(state: GameState): void {
  const active = state.activeInternship;
  if (!active) {
    return;
  }

  applyDelta(
    state,
    "internship_complete",
    `internship completed: ${active.tier}`,
    {
      ...INTERNSHIP_COMPLETION_DELTAS[active.tier],
      internshipValue: active.value,
    },
    "week_settlement",
  );

  state.namedFirmInternship ||= active.tier === "named_firm";
  state.internshipRecords.push({
    semesterIndex: active.startSemesterIndex,
    week: active.startWeek,
    completedWeek: state.week,
    targetId: active.targetId,
    targetLabel: active.targetLabel,
    tier: active.tier,
    value: active.value,
    designAtOffer: active.designAtOffer,
    softwareAtOffer: active.softwareAtOffer,
    wageTotal: active.wageTotal,
    weeksCompleted: active.weeksCompleted,
    shortEventId: active.shortEventTriggered ? active.shortEventId : undefined,
    shortEventWeek: active.shortEventTriggered ? active.shortEventWeek : undefined,
  });
  state.activeInternship = undefined;
  log(state, "week_settlement", "internship_resume", `internship resume value recorded: ${active.targetLabel ?? active.tier}`, {});
}

function desiredInternshipTarget(state: GameState): typeof INTERNSHIP_TARGETS[InternshipTargetId] | undefined {
  for (const targetId of INTERNSHIP_TARGET_ORDER) {
    const target = INTERNSHIP_TARGETS[targetId];
    if (!hasCompletedTarget(state, target.id) && isEligibleForTarget(state, target)) {
      return target;
    }
  }
  return undefined;
}

function isEligibleForTarget(
  state: GameState,
  target: typeof INTERNSHIP_TARGETS[InternshipTargetId],
): boolean {
  const application = INTERNSHIP_APPLICATION.tiers[target.tier];
  return (
    applicationCountForTier(state, target.tier) < application.maxAttempts &&
    state.energy >= 30 &&
    state.attributes.design >= target.thresholds.design &&
    state.attributes.software >= target.thresholds.software
  );
}

function internshipChance(state: GameState, target: typeof INTERNSHIP_TARGETS[InternshipTargetId]): number {
  const application = INTERNSHIP_APPLICATION.tiers[target.tier];
  const designExcess = Math.min(application.excessCap, Math.max(0, state.attributes.design - target.thresholds.design));
  const softwareExcess = Math.min(application.excessCap, Math.max(0, state.attributes.software - target.thresholds.software));
  const averageExcess = (designExcess + softwareExcess) / 2;
  return Math.min(application.maxChance, Math.round(application.baseChance + averageExcess * application.excessMultiplier));
}

function thresholdsForTier(tier: InternshipTier): { design: number; software: number; value: number } {
  switch (tier) {
    case "named_firm":
      return INTERNSHIP_THRESHOLDS.namedFirm;
    case "strong":
      return INTERNSHIP_THRESHOLDS.strong;
    case "ordinary":
      return INTERNSHIP_THRESHOLDS.ordinary;
  }
}

function internshipValue(tier: InternshipTier): number {
  return thresholdsForTier(tier).value;
}

function applicationCountForTier(state: GameState, tier: InternshipTier): number {
  return state.internshipApplications.filter((application) => application.tier === tier).length;
}

function hasCompletedTarget(state: GameState, targetId: InternshipTargetId): boolean {
  return state.internshipRecords.some((record) => record.targetId === targetId);
}
