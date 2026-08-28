import { EVENT_PHASE_OVERRIDES, INTERNSHIP_SHORT_EVENTS, MODEL_MATERIALS, RANDOM_EVENTS } from "./data.mjs";
import { recordAiEventEncounter, recordInteractiveEventChoice } from "./achievements.mjs";
import { drawWeighted, randomFloat } from "./rng.mjs";
import { applyDelta, hasInternshipShortEventThisWeek, previewDelta } from "./resolver.mjs";
import { log, pushModal } from "./state.mjs";

const MODEL_EVENT_SEMESTERS = new Set([1, 2, 3, 4, 6, 8]);
const EXCUSE_EVENT_IDS = new Set(["attendance_check", "chosen_attendance", "late_after_allnight"]);
const COMPUTER_EVENT_IDS = new Set([
  "windows_update",
  "cad_crash",
  "hard_drive_bad",
  "computer_noise",
  "rhino_crash",
  "virus_plugin",
  "forgot_charger",
  "computer_blue_screen",
]);
const PLUGIN_EVENT_IDS = new Set(["virus_plugin", "cracked_plugin", "software_update"]);
const MODEL_NEGATIVE_EVENT_IDS = new Set([
  "model_502",
  "model_expensive_material",
  "model_material_empty",
  "model_wrong_scale",
  "model_knife_cut",
  "model_door_hit",
]);
const PRESSURE_OPTION_WARNING = "压力高危：这个选择会继续增加压力。";
const RANDOM_EVENT_BY_ID = new Map(RANDOM_EVENTS.map((event) => [event.id, event]));
const RANDOM_EVENT_IDS = new Set(RANDOM_EVENTS.map((event) => event.id));
const INTERNSHIP_SHORT_EVENT_IDS = new Set(Object.values(INTERNSHIP_SHORT_EVENTS).flat().map((event) => event.id));
const GUARANTEED_TAG_MIN_GAP_WEEKS = 2;
const EARLY_INTERACTIVE_FOLLOW_UP_MAX_YEAR = 2;

export function queueWeeklyEvents(state) {
  if (state.ending) {
    return;
  }

  if (state.pendingInteraction || (state.modalQueue?.length ?? 0) > 0) {
    return;
  }

  if (hasAutomaticEventThisWeek(state)) {
    return;
  }

  if (hasInternshipShortEventThisWeek(state)) {
    return;
  }

  const guaranteed = guaranteedEvent(state);
  if (guaranteed) {
    queueEventModal(state, guaranteed, "guaranteed");
    return;
  }

  const modelEvent = state.weekInSemester === 5 ? maybeDrawModelEvent(state) : null;
  if (modelEvent) {
    queueEventModal(state, modelEvent, "model");
    return;
  }

  if (state.semesterIndex === 1 && state.weekInSemester === 1 && !state.eventTally.first_week_random) {
    const firstEvent = drawEvent(state, "normal", { avoidConsecutiveNormal: true });
    if (firstEvent) {
      state.eventTally.first_week_random = 1;
      queueEventModal(state, firstEvent, "first_week");
    }
    return;
  }

  if (automaticEventCheckedThisWeek(state)) {
    return;
  }

  if (shouldForceEarlyInteractiveFollowUp(state)) {
    const event = drawEvent(state, "interactive");
    if (event) {
      queueEventModal(state, event, "early_interactive_follow_up");
    }
    return;
  }

  const chance = eventChance(state);
  markAutomaticEventCheck(state);
  let rngState = state.rngState;
  const roll = randomFloat(rngState);
  rngState = roll[0];
  state.rngState = rngState;
  if (roll[1] > chance) {
    return;
  }

  const event = drawAutomaticRegularEvent(state);
  if (event) {
    queueEventModal(state, event, "normal");
  }
}

export function maybeQueueMidweekEvent(state) {
  if (!canQueueMidweekEvent(state)) {
    return false;
  }

  let event = null;
  if (shouldForceEarlyInteractiveFollowUp(state)) {
    event = drawEvent(state, "interactive");
  } else {
    markAutomaticEventCheck(state);
    const roll = randomFloat(state.rngState);
    state.rngState = roll[0];
    if (roll[1] > eventChance(state)) {
      return false;
    }
    event = drawEvent(state, "normal", { avoidConsecutiveNormal: true });
  }
  if (!event) {
    return false;
  }

  queueEventModal(state, event, "midweek");
  return true;
}

export function confirmEvent(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "random_event") {
    return { ok: false, reason: "no_random_event_pending" };
  }
  if (interaction.trigger === "internship") {
    return confirmInternshipShortEvent(interaction, optionId);
  }

  const event = RANDOM_EVENTS.find((item) => item.id === interaction.eventId);
  if (!event) {
    return { ok: false, reason: "event_not_found" };
  }

  let selectedOption = null;
  let delta = event.result ?? {};
  if (event.options) {
    selectedOption = event.options.find((option) => option.id === optionId) ?? event.options[0];
    delta = selectedOption.delta;
  }
  const absorbedByExcuse = canUseExcuseToken(state, event);
  if (absorbedByExcuse) {
    delta = {};
    state.shopEffects.excuseTokens -= 1;
  }
  delta = eventSettlementDelta(state, event, delta);

  const adjustedDelta = applyDelta(
    state,
    `event:${event.id}`,
    selectedOption ? `${event.title}：${selectedOption.label}` : event.title,
    delta,
    "random_event",
    { sourceType: "event" },
  );

  state.eventHistory.push({ id: event.id, week: state.week, semesterIndex: state.semesterIndex, optionId: selectedOption?.id ?? null });
  state.eventLastTriggeredWeek[event.id] = state.week;
  state.eventTally[event.id] = (state.eventTally[event.id] ?? 0) + 1;
  removeQueuedDuplicateEvents(state, event);

  if (event.id === "lightly_holding") {
    state.guaranteedEvents.lightlyHolding = true;
  }
  if (event.id === "desk_note") {
    state.guaranteedEvents.deskNote = true;
  }
  updateGuaranteedEventTally(state, event);
  recordAiEventEncounter(state, event.id);
  if (selectedOption?.aiExperienceDelta) {
    state.aiExperience += selectedOption.aiExperienceDelta;
    log(state, "random_event", `event:${event.id}:ai_experience`, "AI 相关经历 +1", {});
  }
  if (selectedOption) {
    recordInteractiveEventChoice(state, event.id, selectedOption.id);
  }
  updateEarlyInteractiveFollowUp(state, event);

  return {
    ok: true,
    title: event.title,
    selectedLabel: selectedOption?.label ?? event.title,
    selectedBody: selectedOption?.body ?? "",
    delta: adjustedDelta,
    isInteractive: Boolean(selectedOption),
  };
}

function confirmInternshipShortEvent(interaction, optionId) {
  const event = Object.values(INTERNSHIP_SHORT_EVENTS)
    .flat()
    .find((item) => item.id === interaction.eventId);
  const option = interaction.options?.find((item) => item.id === optionId) ?? interaction.options?.[0];
  if (!event || !option) {
    return { ok: false, reason: "internship_short_event_not_found" };
  }
  return {
    ok: true,
    title: event.title,
    selectedLabel: option.label ?? event.title,
    selectedBody: "",
    delta: interaction.delta ?? option.delta ?? {},
    isInteractive: false,
  };
}

function queueEventModal(state, event, trigger) {
  ({ event, trigger } = resolveLoveCrisisSchedule(state, event, trigger));
  const absorbedByExcuse = canUseExcuseToken(state, event);
  const defaultRawDelta = eventSettlementDelta(state, event, absorbedByExcuse ? {} : (event.result ?? {}));
  const defaultDelta = previewEventDelta(state, defaultRawDelta);
  const rawOptions = event.options ?? [{
    id: "confirm",
    label: absorbedByExcuse ? "请假条抵消" : formatDelta(defaultDelta),
    delta: defaultRawDelta,
  }];
  const options = rawOptions.map((option) => {
    const rawDelta = eventSettlementDelta(state, event, absorbedByExcuse ? {} : (option.delta ?? defaultRawDelta));
    return {
      ...option,
      delta: previewEventDelta(state, rawDelta),
    };
  });
  const resolvedOptions = event.options ? markPressureWarningOptions(state, options, defaultDelta) : options;
  pushModal(state, {
    type: "random_event",
    eventId: event.id,
    title: event.title,
    body: event.body,
    trigger,
    blocks: true,
    options: resolvedOptions.map((option) => ({
      id: option.id,
      label: option.label,
      body: option.body ?? "",
      delta: option.delta ?? defaultDelta,
      state: option.state ?? "available",
      reason: option.reason ?? "",
      warning: option.warning ?? "",
    })),
  });
}

function previewEventDelta(state, delta = {}) {
  return previewDelta(state, delta, { sourceType: "event", preview: true });
}

function resolveLoveCrisisSchedule(state, event, trigger) {
  const countdown = state.guaranteedEvents?.loveCrisisCountdown ?? 0;
  if (countdown <= 0) {
    return { event, trigger };
  }
  if (countdown > 1) {
    state.guaranteedEvents.loveCrisisCountdown = countdown - 1;
    return { event, trigger };
  }

  state.guaranteedEvents.loveCrisisCountdown = 0;
  if (!state.hasPartner) {
    return { event, trigger };
  }
  const loveCrisis = RANDOM_EVENTS.find((item) => item.id === "love_crisis");
  return loveCrisis ? { event: loveCrisis, trigger: "guaranteed" } : { event, trigger };
}

function markPressureWarningOptions(state, options, defaultDelta = {}) {
  if (state.pressure <= 80) {
    return options.map((option) => ({ ...option, state: option.state ?? "available" }));
  }

  return options.map((option) => {
    const pressureDelta = optionPressureDelta(option, defaultDelta);
    return {
      ...option,
      state: option.state ?? "available",
      warning: pressureDelta > 0 ? PRESSURE_OPTION_WARNING : (option.warning ?? ""),
    };
  });
}

function optionPressureDelta(option, defaultDelta = {}) {
  return (option.delta ?? defaultDelta).pressure ?? 0;
}

function formatDelta(delta = {}) {
  const labels = {
    energy: "精力",
    pressure: "压力",
    money: "金钱",
    progress: "进度",
    quality: "作品质量",
    portfolio: "作品集",
    gpa: "个人GPA",
    gpaModifier: "GPA修正",
    design: "设计水平",
    software: "软件技术",
    aesthetic: "创意审美",
    presentation: "汇报表达",
    social: "人际交往",
    resilience: "抗压能力",
  };
  const parts = Object.entries(delta).map(([key, value]) => `${labels[key] ?? key} ${value > 0 ? "+" : ""}${value}`);
  return parts.length ? parts.join("，") : "无数值变化";
}

function guaranteedEvent(state) {
  if (state.semesterIndex === 2 && state.weekInSemester >= 1 && !state.guaranteedEvents.lightlyHolding && !eventHasAppeared(state, "lightly_holding")) {
    const event = historicalCandidate(state, "lightly_holding");
    if (event) return event;
  }
  if (state.semesterIndex === 4 && state.weekInSemester >= 4 && !state.guaranteedEvents.deskNote && !eventHasAppeared(state, "desk_note")) {
    const event = historicalCandidate(state, "desk_note");
    if (event) return event;
  }
  if (state.semesterIndex >= 2 && state.semesterIndex <= 6 && (state.guaranteedEvents.aiEvents ?? 0) < 2) {
    const urgency = state.semesterIndex >= 5 || (state.semesterIndex === 4 && state.weekInSemester >= 4);
    if (urgency && !hasRecentEventMatching(state, isAiEvent, GUARANTEED_TAG_MIN_GAP_WEEKS)) {
      return drawGuaranteedTaggedEvent(state, (event) => isAiEvent(event));
    }
  }
  if (state.semesterIndex >= 2 && state.semesterIndex <= 4 && (state.guaranteedEvents.playInteractions ?? 0) < 2) {
    const urgency = state.semesterIndex >= 4 || state.week >= 18;
    if (urgency && !hasRecentEventMatching(state, isPlayEvent, GUARANTEED_TAG_MIN_GAP_WEEKS)) {
      return drawGuaranteedTaggedEvent(state, (event) => event.pool === "interactive" && isPlayEvent(event));
    }
  }
  if (
    state.semesterIndex === 2
    && !state.hasPartner
    && !state.guaranteedEvents.romanceInteraction
    && state.weekInSemester >= 4
  ) {
    return drawGuaranteedTaggedEvent(state, (event) => event.pool === "interactive" && isRomanceEvent(event) && event.id !== "love_crisis");
  }
  if (state.semesterIndex === 9 && state.weekInSemester === 5) {
    return drawGuaranteedTaggedEvent(state, (event) => isSentimentalEvent(event));
  }
  return null;
}

function canQueueMidweekEvent(state) {
  if (state.ending || state.pendingInteraction || state.phase !== "week_action") return false;
  if ((state.actionsRemaining ?? 0) <= 0) return false;
  if (state.semesterIndex === 1 && state.weekInSemester < 3) return false;
  if (state.weekInSemester === 5 && MODEL_EVENT_SEMESTERS.has(state.semesterIndex)) return false;
  if (hasAutomaticEventThisWeek(state)) return false;
  if (hasInternshipShortEventThisWeek(state)) return false;
  if (automaticEventCheckedThisWeek(state)) return false;
  if (hasGuaranteedEventDue(state)) return false;
  return true;
}

function hasGuaranteedEventDue(state) {
  if (
    state.semesterIndex === 2
    && state.weekInSemester >= 1
    && !state.guaranteedEvents.lightlyHolding
    && !eventHasAppeared(state, "lightly_holding")
    && historicalCandidate(state, "lightly_holding")
  ) {
    return true;
  }
  if (
    state.semesterIndex === 4
    && state.weekInSemester >= 4
    && !state.guaranteedEvents.deskNote
    && !eventHasAppeared(state, "desk_note")
    && historicalCandidate(state, "desk_note")
  ) {
    return true;
  }
  if (state.semesterIndex >= 2 && state.semesterIndex <= 6 && (state.guaranteedEvents.aiEvents ?? 0) < 2) {
    if (
      (state.semesterIndex >= 5 || (state.semesterIndex === 4 && state.weekInSemester >= 4))
      && !hasRecentEventMatching(state, isAiEvent, GUARANTEED_TAG_MIN_GAP_WEEKS)
      && hasGuaranteedTaggedCandidate(state, (event) => isAiEvent(event))
    ) {
      return true;
    }
  }
  if (state.semesterIndex >= 2 && state.semesterIndex <= 4 && (state.guaranteedEvents.playInteractions ?? 0) < 2) {
    if (
      (state.semesterIndex >= 4 || state.week >= 18)
      && !hasRecentEventMatching(state, isPlayEvent, GUARANTEED_TAG_MIN_GAP_WEEKS)
      && hasGuaranteedTaggedCandidate(state, (event) => event.pool === "interactive" && isPlayEvent(event))
    ) {
      return true;
    }
  }
  if (
    state.semesterIndex === 2
    && !state.hasPartner
    && !state.guaranteedEvents.romanceInteraction
    && state.weekInSemester >= 4
    && hasGuaranteedTaggedCandidate(state, (event) => event.pool === "interactive" && isRomanceEvent(event) && event.id !== "love_crisis")
  ) {
    return true;
  }
  return state.semesterIndex === 9
    && state.weekInSemester === 5
    && hasGuaranteedTaggedCandidate(state, (event) => isSentimentalEvent(event));
}

function hasAutomaticEventThisWeek(state) {
  return (state.eventHistory ?? []).some((entry) => {
    if (Number(entry?.week) !== Number(state.week)) return false;
    const eventId = eventIdFromHistory(entry);
    return RANDOM_EVENT_IDS.has(eventId) || INTERNSHIP_SHORT_EVENT_IDS.has(eventId);
  });
}

function automaticEventCheckedThisWeek(state) {
  return Number(state.systemFlags?.randomEventCheckWeek) === Number(state.week);
}

function markAutomaticEventCheck(state) {
  state.systemFlags ??= {};
  state.systemFlags.randomEventCheckWeek = state.week;
}

function eventChance(state) {
  if (state.year <= 3) return 0.88;
  if (state.year <= 5) return 0.5;
  return 0.25;
}

function drawAutomaticRegularEvent(state) {
  if (shouldForceEarlyInteractiveFollowUp(state)) {
    return drawEvent(state, "interactive");
  }
  return drawEvent(state, "normal", { avoidConsecutiveNormal: true });
}

function drawEvent(state, pool, options = {}) {
  const candidates = RANDOM_EVENTS.filter((event) => {
    if (event.pool !== pool && !(pool === "normal" && event.pool === "interactive")) return false;
    return eventIsEligible(state, event);
  });
  let drawPool = candidates;
  if (options.avoidConsecutiveNormal && isEarlyInteractiveFollowUpYear(state) && lastAutomaticEventPool(state) === "normal") {
    const nonNormalCandidates = candidates.filter((event) => event.pool !== "normal");
    if (hasHistoricallyFreshCandidate(state, nonNormalCandidates)) {
      drawPool = nonNormalCandidates;
    }
  }
  const drawCandidates = historicallyFreshCandidates(state, drawPool);
  const entries = drawCandidates.map((event) => ({
    item: event,
    weight: eventWeight(state, event),
  }));
  const [rngState, event] = drawWeighted(state.rngState, entries);
  state.rngState = rngState;
  return event;
}

function shouldForceEarlyInteractiveFollowUp(state) {
  return isEarlyInteractiveFollowUpYear(state)
    && (Boolean(state.systemFlags?.earlyRandomEventNeedsInteractive) || lastAutomaticEventPool(state) === "normal");
}

function isEarlyInteractiveFollowUpYear(state) {
  return Number(state.year) <= EARLY_INTERACTIVE_FOLLOW_UP_MAX_YEAR;
}

function updateEarlyInteractiveFollowUp(state, event) {
  state.systemFlags ??= {};
  if (!isEarlyInteractiveFollowUpYear(state)) {
    state.systemFlags.earlyRandomEventNeedsInteractive = false;
    return;
  }
  if (event.pool === "normal") {
    state.systemFlags.earlyRandomEventNeedsInteractive = true;
  } else if (event.pool === "interactive") {
    state.systemFlags.earlyRandomEventNeedsInteractive = false;
  }
}

function maybeDrawModelEvent(state) {
  if (!MODEL_EVENT_SEMESTERS.has(state.semesterIndex)) return null;
  const candidates = RANDOM_EVENTS.filter((event) => event.pool === "model" && eventIsEligible(state, event));
  const drawCandidates = historicallyFreshCandidates(state, candidates);
  const entries = drawCandidates.map((event) => ({
    item: event,
    weight: eventWeight(state, event) + modelMaterialBias(state, event),
  }));
  const [rngState, event] = drawWeighted(state.rngState, entries);
  state.rngState = rngState;
  return event;
}

function modelMaterialBias(state, event) {
  const material = MODEL_MATERIALS.find((item) => item.id === state.currentModelMaterialId);
  if (!material) {
    return 0;
  }
  if (event.sentiment === "negative") {
    return material.riskBias;
  }
  if (event.sentiment === "positive") {
    return -Math.floor(material.riskBias / 2);
  }
  return 0;
}

function eventIsEligible(state, event) {
  const [semesterMin, semesterMax] = phaseRange(event);
  if (semesterMin && state.semesterIndex < semesterMin) return false;
  if (semesterMax && state.semesterIndex > semesterMax) return false;
  if (event.id === "lucky_seat" && !(state.weekInSemester === 6 || (state.weekInSemester === 5 && state.semesterIndex !== 9))) return false;
  if (isRomanceEvent(event)) {
    if (event.id === "love_crisis") {
      if (!state.hasPartner) return false;
    } else if (state.hasPartner) {
      return false;
    } else if (state.semesterIndex === 2 && state.guaranteedEvents.romanceInteraction) {
      return false;
    }
  }
  if (isAiEvent(event) && (state.guaranteedEvents.aiEvents ?? 0) >= 3) return false;
  if (eventHasAppeared(state, event.id)) return false;
  if (eventIsQueued(state, event.id)) return false;
  if (eventTitleHasAppeared(state, event)) return false;
  if (eventTitleIsQueued(state, event)) return false;
  if (state.shopEffects?.blockComputerEvents && COMPUTER_EVENT_IDS.has(event.id)) return false;
  if (state.shopEffects?.blockPluginEvents && PLUGIN_EVENT_IDS.has(event.id)) return false;
  const lastWeek = state.eventLastTriggeredWeek[event.id];
  if (lastWeek !== undefined && state.week - lastWeek < (event.cooldownWeeks ?? 4)) return false;
  return true;
}

function eventSettlementDelta(state, event, rawDelta = {}) {
  if (!modelNegativeLossReductionEnabled(state) || !MODEL_NEGATIVE_EVENT_IDS.has(event.id)) {
    return rawDelta;
  }
  const adjusted = { ...rawDelta };
  if (adjusted.quality < 0) adjusted.quality = reduceLoss(adjusted.quality, 2);
  if (adjusted.money < 0) adjusted.money = reduceLoss(adjusted.money, 100);
  return adjusted;
}

function modelNegativeLossReductionEnabled(state) {
  return Boolean(state.shopEffects?.modelNegativeLossReduction || state.shopEffects?.blockModelNegativeEvents);
}

function reduceLoss(value, reduction) {
  if (!(value < 0)) return value;
  return Math.min(-1, value + reduction);
}

function lastAutomaticEventPool(state) {
  for (let index = (state.eventHistory?.length ?? 0) - 1; index >= 0; index -= 1) {
    const eventId = eventIdFromHistory(state.eventHistory[index]);
    const event = RANDOM_EVENT_BY_ID.get(eventId);
    if (event) return event.pool;
  }
  return null;
}

function eventIdFromHistory(entry) {
  if (typeof entry === "string") return entry;
  return entry?.id ?? entry?.eventId ?? "";
}

function eventHasAppeared(state, eventId) {
  // Eligibility is scoped to the current run; historical collection must not exhaust future runs.
  if (state.eventTally?.[eventId]) return true;
  return (state.eventHistory ?? []).some((entry) => {
    if (typeof entry === "string") return entry === eventId;
    return entry?.id === eventId || entry?.eventId === eventId;
  });
}

function eventIsQueued(state, eventId) {
  return queuedRandomEventInteractions(state).some((interaction) => interaction.eventId === eventId);
}

function eventTitleHasAppeared(state, event) {
  const title = normalizedEventTitle(event);
  if (!title) return false;
  return (state.eventHistory ?? []).some((entry) => {
    const eventId = eventIdFromHistory(entry);
    if (eventId === event.id) return false;
    const previous = RANDOM_EVENT_BY_ID.get(eventId);
    return previous && normalizedEventTitle(previous) === title;
  });
}

function eventTitleIsQueued(state, event) {
  const title = normalizedEventTitle(event);
  if (!title) return false;
  return queuedRandomEventInteractions(state).some((interaction) => {
    if (interaction.eventId === event.id) return false;
    const queuedEvent = RANDOM_EVENT_BY_ID.get(interaction.eventId);
    return queuedEvent && normalizedEventTitle(queuedEvent) === title;
  });
}

function queuedRandomEventInteractions(state) {
  return [state.pendingInteraction, ...(state.modalQueue ?? [])]
    .filter((interaction) => interaction?.type === "random_event" && interaction.eventId);
}

function removeQueuedDuplicateEvents(state, event) {
  const title = normalizedEventTitle(event);
  state.modalQueue = (state.modalQueue ?? []).filter((interaction) => {
    if (interaction?.type !== "random_event") return true;
    if (interaction.eventId === event.id) return false;
    const queuedEvent = RANDOM_EVENT_BY_ID.get(interaction.eventId);
    return !title || !queuedEvent || normalizedEventTitle(queuedEvent) !== title;
  });
}

function normalizedEventTitle(event) {
  return String(event?.title ?? "").replace(/\s+/g, " ").trim();
}

function canUseExcuseToken(state, event) {
  return (state.shopEffects?.excuseTokens ?? 0) > 0 && EXCUSE_EVENT_IDS.has(event.id);
}

function eventWeight(state, event) {
  let weight = event.baseWeight ?? 10;
  if (state.pressure > 80 && event.sentiment === "negative") {
    weight += 20;
  }
  const tags = event.tags ?? [];
  if (state.year <= 2 && tags.includes("play")) {
    weight += 12;
  }
  if (state.year === 2 && tags.includes("romance")) {
    weight += 16;
  }
  if (state.year === 3 && tags.includes("junior_help")) {
    weight += 20;
  }
  if (state.year === 4 && (tags.includes("anxiety") || event.sentiment === "negative")) {
    weight += tags.includes("anxiety") ? 32 : 12;
  }
  if (state.year === 5 && (tags.includes("sentimental") || event.sentiment === "positive")) {
    weight += tags.includes("sentimental") ? 32 : 12;
  }
  return Math.max(0, weight);
}

function drawGuaranteedTaggedEvent(state, predicate) {
  const candidates = RANDOM_EVENTS.filter((event) => {
    if (event.pool === "model") return false;
    if (!predicate(event)) return false;
    return eventIsEligible(state, event);
  });
  if (!candidates.length) return null;
  const drawCandidates = historicallyFreshCandidates(state, candidates);
  const entries = drawCandidates.map((event) => ({
    item: event,
    weight: eventWeight(state, event) + 40,
  }));
  const [rngState, event] = drawWeighted(state.rngState, entries);
  state.rngState = rngState;
  return event;
}

function hasGuaranteedTaggedCandidate(state, predicate) {
  const candidates = RANDOM_EVENTS.filter((event) => {
    if (event.pool === "model") return false;
    if (!predicate(event)) return false;
    return eventIsEligible(state, event);
  });
  return historicallyFreshCandidates(state, candidates).length > 0;
}

function historicalCandidate(state, eventId) {
  const event = RANDOM_EVENTS.find((item) => item.id === eventId);
  return historicallyFreshCandidates(state, event ? [event] : [])[0] ?? null;
}

function hasHistoricallyFreshCandidate(state, candidates) {
  if (!candidates.length) return false;
  const historicalIds = new Set(state.historicalSeenEventIds ?? []);
  return candidates.some((event) => !historicalIds.has(event.id));
}

function historicallyFreshCandidates(state, candidates) {
  const historicalIds = new Set(state.historicalSeenEventIds ?? []);
  if (!historicalIds.size) return candidates;

  const historicalCandidates = candidates.filter((event) => historicalIds.has(event.id));
  if (!historicalCandidates.length) return candidates;

  const freshCandidates = candidates.filter((event) => !historicalIds.has(event.id));
  if (freshCandidates.length > 0) {
    return freshCandidates;
  }

  // Cross-run history is only a preference: after a phase pool is exhausted,
  // reopen repeatable events while the current run still keeps strict no-repeat.
  return candidates.filter((event) => event.repeatable !== false);
}

function updateGuaranteedEventTally(state, event) {
  const tags = event.tags ?? [];
  if (tags.includes("play")) {
    state.guaranteedEvents.playInteractions = (state.guaranteedEvents.playInteractions ?? 0) + 1;
  }
  if (isRomanceEvent(event) && event.id !== "love_crisis") {
    state.guaranteedEvents.romanceInteraction = true;
  }
  if (isAiEvent(event)) {
    state.guaranteedEvents.aiEvents = (state.guaranteedEvents.aiEvents ?? 0) + 1;
  }
}

function phaseRange(event) {
  return EVENT_PHASE_OVERRIDES[event.id] ?? [event.semesterMin, event.semesterMax];
}

function isAiEvent(event) {
  const tags = event.tags ?? [];
  return tags.includes("ai");
}

function isPlayEvent(event) {
  return (event.tags ?? []).includes("play");
}

function isSentimentalEvent(event) {
  return (event.tags ?? []).includes("sentimental");
}

function isRomanceEvent(event) {
  return (event.tags ?? []).includes("romance");
}

function hasRecentEventMatching(state, predicate, minGapWeeks) {
  const currentWeek = Number(state.week);
  if (!Number.isFinite(currentWeek)) return false;

  return (state.eventHistory ?? []).some((entry) => {
    const eventId = eventIdFromHistory(entry);
    const event = RANDOM_EVENT_BY_ID.get(eventId);
    if (!event || !predicate(event)) return false;

    const week = Number(entry?.week);
    return Number.isFinite(week) && currentWeek - week >= 0 && currentWeek - week < minGapWeeks;
  });
}
