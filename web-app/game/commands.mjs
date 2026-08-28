import {
  ACTIONS,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_KEYS,
  ARCHITECTURE_INTERNSHIP_OPTIONS,
  BASE_ACTIONS_PER_WEEK,
  ACADEMIC_ROUTE_QUESTIONS,
  CHARACTERS,
  CIVIL_ROUTE_QUESTIONS,
  COURSE_QUESTIONS,
  COURSES,
  FIXED_EVENTS,
  GAME_REQUIRED_IMAGES,
  IELTS_QUESTIONS,
  INTERNSHIP_APPLICATION,
  INTERNSHIP_SHORT_EVENTS,
  MENTORS,
  MODEL_MATERIALS,
  OUTSOURCING_PROJECTS,
  PART_TIME_PROJECTS,
  REPORT_STRATEGIES,
  ROUTE_OPTIONS,
  SEMESTER_TOPICS,
  SHOP_ITEMS,
  SUMMER_EVENTS,
  WANLI_ROAD_EVENTS,
  WANLI_ROAD_MAX_VISITS_PER_YEAR,
  WANLI_ROAD_OPEN_PROMPT,
  WANLI_ROAD_STAGE_REWARDS,
  WEEKS_PER_SEMESTER,
  routeExamParticipationLabel,
} from "./data.mjs";
import {
  checkAttributeAchievements,
  recordActionUse,
  recordArchitectureLifeStartComplete,
  recordCharacterSelection,
  recordCoffeeSupportClick,
  recordCourseExamResult,
  recordCourseSelection,
  recordFinalEnding,
  recordGraduationCeremonyStart,
  recordIeltsExam,
  recordMentorTaskResult,
  recordMentorSelection,
  recordProjectParticipation,
  recordCompetitionSubmission,
  recordReviewResult,
  recordReviewResultConfirmed,
  recordReviewStart,
  recordRouteParticipation,
  recordShopPurchase,
  recordSummerEventComplete,
  recordWanliRoadVisit,
  recordWeekStart,
  recordWeeklySettlement,
} from "./achievements.mjs";
import { queueWeeklyEvents, confirmEvent, maybeQueueMidweekEvent } from "./events.mjs";
import { randomFloat, randomInt, sampleMany } from "./rng.mjs";
import {
  actionsForThisWeek,
  applyDelta,
  applyPositiveYieldPenalty,
  applyWeeklySettlement,
  calculateReviewBase,
  clamp,
  currentRiskPenalty,
  finalizeReview,
  monthlyAllowance,
  prepareFinalEnding,
  previewDelta,
  progressCap,
  progressModifier,
  qualityModifier,
  reviewQualityScore,
  completedInternshipTierValue,
  effectiveInternshipAttributes,
  internshipApplicationAvailability,
  internshipApplicationChance,
  routeOptionAvailability,
  routeRequirementsMet,
  settleFinalEnding,
  shiftGrade,
  weeklyLivingCost,
} from "./resolver.mjs";
import {
  createGame,
  drawCharacterCandidates,
  emptyAttributes,
  getCharacter,
  getCourse,
  getFamily,
  log,
  pushModal,
  requireNoPending,
  resolvePendingInteraction,
  updateCalendarFromSemester,
  yearLabel,
} from "./state.mjs";

const PRESSURE_HIGH_RISK_DISABLED_ACTIONS = new Set([
  "design_iteration",
  "site_research",
  "normal_drawing",
  "crunch_drawing",
  "outsourcing",
  "part_time",
]);
const PAID_WORK_ACTION_IDS = ["outsourcing", "part_time"];
const PAID_WORK_WEEKLY_LIMIT = 2;
const SENIOR_PROGRESS_BONUS_ACTIONS = new Set(["normal_drawing", "crunch_drawing"]);
const SENIOR_QUALITY_BONUS_ACTIONS = new Set(["design_iteration", "site_research"]);

const IELTS_EXAM_PRICE = 1800;
const IELTS_EXAM_QUESTION_COUNT = 10;
const IELTS_EXAM_MAX_SCORE = 8;
const ROUTE_EXAM_EASY_QUESTION_COUNT = 6;
const ROUTE_EXAM_HARD_QUESTION_COUNT = 4;
const ROUTE_EXAM_QUESTION_COUNT = ROUTE_EXAM_EASY_QUESTION_COUNT + ROUTE_EXAM_HARD_QUESTION_COUNT;
const PROFILE_NICKNAME_MAX_LENGTH = 18;
const PROFILE_UNIVERSITY_MAX_LENGTH = 24;

export function startGameProfile(profile) {
  const nickname = String(profile?.nickname ?? "").trim();
  const universityName = String(profile?.universityName ?? "").trim();
  if (!nickname || !universityName) {
    return { ok: false, reason: "profile_required" };
  }
  if (nickname.length > PROFILE_NICKNAME_MAX_LENGTH || universityName.length > PROFILE_UNIVERSITY_MAX_LENGTH) {
    return { ok: false, reason: "profile_too_long" };
  }
  return {
    ok: true,
    state: createGame({
      nickname,
      universityName,
      seed: profile?.seed,
    }),
  };
}

export function recordCoffeeSupport(state) {
  recordCoffeeSupportClick(state);
  return { ok: true };
}

export function choosePendingInteractionOption(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction) {
    return { ok: false, reason: "no_pending_interaction" };
  }

  switch (interaction.type) {
    case "fixed_event":
      return chooseFixedEventOption(state, optionId);
    case "mentor_select":
      return selectMentor(state, optionId);
    case "course_select":
      return selectCourse(state, optionId);
    case "course_exam_intro":
      return beginCourseExam(state);
    case "ielts_exam_intro":
      return beginIeltsExam(state);
    case "route_exam_intro":
      return beginRouteExam(state);
    case "model_material":
      return chooseModelMaterial(state, optionId);
    case "random_event":
      return confirmRandomEvent(state, optionId);
    case "wanli_road_event":
      return confirmWanliRoadEvent(state, optionId);
    case "project_select":
      return chooseProject(state, optionId);
    case "course_question":
      return answerCourseQuestion(state, optionId);
    case "ielts_question":
      return answerIeltsQuestion(state, optionId);
    case "route_question":
      return answerRouteQuestion(state, optionId);
    case "course_result":
      return confirmCourseResult(state);
    case "ielts_exam_result":
      return confirmIeltsExamResult(state);
    case "mentor_task_result":
      return confirmMentorTaskResult(state);
    case "report_strategy":
      return chooseReportStrategy(state, optionId);
    case "report_feedback":
      return confirmReportFeedback(state);
    case "review_result":
      return confirmReviewResult(state);
    case "route_commit":
    case "route_contract":
      return confirmRouteCommit(state, optionId);
    case "route_exam_result":
      return confirmRouteExamResult(state);
    case "graduation_ceremony":
      return confirmGraduationCeremony(state);
    case "ending_memory":
      return confirmEndingMemory(state);
    case "summer_event":
      return chooseSummerEventOption(state, optionId);
    case "year_start":
      return confirmYearStart(state);
    case "system_prompt":
      return confirmSystemPrompt(state);
    case "choice_result":
      return confirmChoiceResult(state);
    default:
      return { ok: false, reason: "unsupported_interaction" };
  }
}

export function advanceGameFlow(state, maxSteps = 12) {
  if (!state) {
    return { ok: false, reason: "no_state" };
  }

  let steps = 0;
  while (!state.pendingInteraction && !state.ending && steps < maxSteps) {
    steps += 1;
    if (state.phase === "week_action" && state.actionsRemaining <= 0) {
      const result = finishWeek(state);
      if (!result.ok) return result;
      continue;
    }
    if (state.phase === "week_settlement") {
      const result = continueAfterWeeklyEvents(state);
      if (!result.ok) return result;
      continue;
    }
    if (state.phase === "summer_event") {
      const result = continueAfterSummerEvent(state);
      if (!result.ok) return result;
      continue;
    }
    return { ok: true, steps };
  }

  return { ok: true, steps };
}

export function rerollCharacters(state) {
  if (state.phase !== "character_select" || state.rerollsRemaining <= 0) {
    return { ok: false, reason: "reroll_unavailable" };
  }
  state.previousCharacterCandidates = [...state.characterCandidates];
  state.rngState = drawCharacterCandidates(state, state.previousCharacterCandidates);
  state.rerollsRemaining -= 1;
  log(state, "character_select", "character_reroll", "免费重抽角色", {});
  return { ok: true };
}

export function selectCharacter(state, characterId) {
  if (state.phase !== "character_select") {
    return { ok: false, reason: "not_character_phase" };
  }
  if (!state.characterCandidates.includes(characterId)) {
    return { ok: false, reason: "character_not_in_candidates" };
  }

  const character = CHARACTERS.find((item) => item.id === characterId);
  state.profile.characterId = character.id;
  state.energy = 100;
  state.maxEnergy = 100;
  state.pressure = character.pressure;
  state.attributes = { ...character.attributes };
  state.semesterAttributeGrowth = emptyAttributes();
  state.money = getFamily(state).initialMoney;
  log(state, "character_select", "character_selected", `选择角色：${character.name}`, {});
  recordCharacterSelection(state, character.id, {
    isInitialDrawSelection: state.rerollsRemaining === 2 && state.initialCharacterCandidateId === character.id,
  });
  state.phase = "fixed_event";
  queueFixedEvent(state);
  return { ok: true };
}

export function chooseFixedEventOption(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "fixed_event") {
    return { ok: false, reason: "no_fixed_event_pending" };
  }
  const event = FIXED_EVENTS.find((item) => item.id === interaction.eventId);
  const option = event?.options.find((item) => item.id === optionId) ?? event?.options[0];
  if (!event || !option) {
    return { ok: false, reason: "fixed_event_not_found" };
  }

  resolvePendingInteraction(state, () => {
    let adjustedDelta = {};
    if (Object.keys(option.delta ?? {}).length > 0) {
      adjustedDelta = applyDelta(state, `fixed:${event.id}`, `${event.title}：${option.label}`, option.delta, "fixed_event");
    } else {
      log(state, "fixed_event", `fixed:${event.id}`, `${event.title}：${option.label}`, {});
    }
    state.fixedEventIndex += 1;
    if (event.id === "architecture_life_start" && option.id === "continue") {
      recordArchitectureLifeStartComplete(state);
    }
    if (Object.keys(option.delta ?? {}).length > 0) {
      queueChoiceResult(state, option.label, option.body, adjustedDelta, {
        titleSuffix: false,
        confirmLabel: formatDelta(adjustedDelta),
        showDeltaOnConfirm: true,
      });
    }
    if (state.ending) return;
    if (state.fixedEventIndex < FIXED_EVENTS.length) {
      queueFixedEvent(state);
    } else {
      queueMentorSelection(state);
    }
  });
  return { ok: true };
}

export function selectMentor(state, mentorId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "mentor_select") {
    return { ok: false, reason: "no_mentor_pending" };
  }
  if (!interaction.options.some((option) => option.id === mentorId)) {
    return { ok: false, reason: "mentor_not_in_candidates" };
  }

  const mentor = MENTORS.find((item) => item.id === mentorId);
  resolvePendingInteraction(state, () => {
    state.profile.mentorId = mentor.id;
    log(state, "mentor_select", "mentor_selected", `选择导师：${mentor.name}`, {});
    recordMentorSelection(state, mentor.id);
    if (state.fixedEventIndex < FIXED_EVENTS.length) {
      queueFixedEvent(state);
    } else {
      queueCourseSelection(state);
    }
  });
  return { ok: true };
}

export function selectCourse(state, courseId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "course_select") {
    return { ok: false, reason: "no_course_pending" };
  }
  const selectedOption = interaction.options.find((option) => option.id === courseId);
  if (selectedOption?.state === "disabled") {
    return { ok: false, reason: selectedOption.reason || "course_unavailable" };
  }
  if (!COURSES.some((course) => course.id === courseId)) {
    return { ok: false, reason: "course_not_found" };
  }

  const course = COURSES.find((item) => item.id === courseId);
  resolvePendingInteraction(state, () => {
    state.courseId = course.id;
    state.courseYear = state.year;
    state.courseHistory = [...new Set([...(state.courseHistory ?? []), course.id])];
    log(state, "course_select", "course_selected", `选择${yearLabel(state.year)}学年课程：${course.name}`, {});
    recordCourseSelection(state);
    startWeek(state);
  });
  return { ok: true };
}

export function confirmYearStart(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "year_start") {
    return { ok: false, reason: "no_year_start_pending" };
  }
  resolvePendingInteraction(state, () => {
    state.musicYearStarted = true;
    continueAfterYearStart(state);
  });
  return { ok: true };
}

function continueAfterYearStart(state) {
  if (state.semesterIndex > 1 && state.term === 1) {
    if (state.modalQueue?.[0]?.type === "mentor_select") {
      state.phase = "mentor_select";
      return;
    }
    queueMentorSelection(state);
  } else {
    startWeek(state);
  }
}

function queueWanliRoadOpenPrompt(state) {
  state.systemFlags ??= {};
  if (state.year !== 2 || state.term !== 1 || state.weekInSemester !== 3) return false;
  if (state.systemFlags.wanliRoadOpenPromptShown === true) return false;
  state.systemFlags.wanliRoadOpenPromptShown = true;
  pushModal(state, {
    type: "system_prompt",
    promptId: "wanli_road_open",
    next: "start_week_after_week_settlement",
    title: WANLI_ROAD_OPEN_PROMPT.title,
    titleIcon: "wanli_road",
    kicker: "系统开放",
    body: WANLI_ROAD_OPEN_PROMPT.body,
    blocks: true,
    options: [{ id: "confirm", label: WANLI_ROAD_OPEN_PROMPT.optionLabel }],
  });
  return true;
}

export function chooseModelMaterial(state, materialId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "model_material") {
    return { ok: false, reason: "no_model_material_pending" };
  }
  const material = MODEL_MATERIALS.find((item) => item.id === materialId);
  if (!material) {
    return { ok: false, reason: "material_not_found" };
  }

  resolvePendingInteraction(state, () => {
    state.modelMaterialBySemester[state.semesterIndex] = material.id;
    state.currentModelMaterialId = material.id;
    applyDelta(state, `model_material:${material.id}`, `模型材料：${material.name}`, material.delta, "model_material");
    if (!state.ending) {
      state.phase = "week_action";
    }
  });
  return { ok: true };
}

export function performAction(state, actionId) {
  const availability = resolveActionAvailability(state).find((item) => item.id === actionId);
  if (!availability || (availability.state !== "available" && !availability.canInspect)) {
    return { ok: false, reason: availability?.reason ?? "action_unavailable" };
  }
  const action = ACTIONS.find((item) => item.id === actionId);

  if (action.projectType) {
    queueProjectSelection(state, action.projectType);
    return { ok: true };
  }

  consumeActionSlot(state, actionId);

  if (action.specialSkill) {
    const result = performSpecialSkill(state);
    if (result.ok) {
      maybeQueueMidweekEvent(state);
    }
    return result;
  }

  const delta = calculateActionDelta(state, action);
  applyDelta(state, `action:${action.id}`, action.label, delta, "week_action", {
    actionId: action.id,
    positiveKind: action.positiveKind,
  });
  recordActionUse(state, action.id);
  checkAttributeAchievements(state);
  maybeQueueMidweekEvent(state);
  return { ok: true };
}

export function chooseProject(state, projectId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "project_select") {
    return { ok: false, reason: "no_project_pending" };
  }
  if (projectId === "__back") {
    resolvePendingInteraction(state);
    return { ok: true };
  }

  const projects = interaction.projectType === "outsourcing" ? OUTSOURCING_PROJECTS : PART_TIME_PROJECTS;
  const project = projects.find((item) => item.id === projectId);
  if (!project) {
    return { ok: false, reason: "project_not_found" };
  }
  const availability = projectAvailability(state, project, interaction.projectType);
  if (availability.state !== "available") {
    const previous = interaction;
    state.pendingInteraction = {
      type: "choice_result",
      title: "暂时不能承接",
      body: `${project.name}\n${availability.reason || "条件不足，先把能力和状态补起来。"}`,
      blocks: true,
      options: [{ id: "confirm", label: "返回项目列表" }],
    };
    state.modalQueue.unshift(previous);
    return { ok: true };
  }

  resolvePendingInteraction(state, () => {
    consumeActionSlot(state, interaction.projectType, projectActionCost(project));
    const delta = calculateProjectDelta(state, project, interaction.projectType);
    applyDelta(state, `${interaction.projectType}:${project.id}`, project.name, delta, "week_action", {
      actionId: interaction.projectType,
    });
    recordProjectParticipation(state, interaction.projectType);
    checkAttributeAchievements(state);
    maybeQueueMidweekEvent(state);
  });
  return { ok: true };
}

export function purchaseShopItem(state, itemId) {
  const pending = requireNoPending(state);
  if (!pending.ok) return pending;
  if (state.ending || state.phase === "character_select" || state.phase === "profile") {
    return { ok: false, reason: "shop_unavailable" };
  }

  const item = SHOP_ITEMS.find((shopItem) => shopItem.id === itemId);
  if (!item) {
    return { ok: false, reason: "shop_item_not_found" };
  }

  const availability = shopItemAvailability(state, item);
  if (availability.state !== "available") {
    return { ok: false, reason: availability.reason || "shop_item_unavailable" };
  }

  const energyBefore = state.energy;
  const adjustedDelta = applyDelta(state, `shop:${item.id}`, `商店购买：${item.name}`, item.delta, "shop", { skipPassive: true });
  applyShopItemEffects(state, item);
  recordShopPurchase(state, item.id, { energyBefore });
  checkAttributeAchievements(state);
  state.achievementTally.shopPurchases.push({
    id: item.id,
    week: state.week,
    semesterIndex: state.semesterIndex,
    year: state.year,
  });
  pushModal(state, {
    type: "choice_result",
    title: item.name,
    shopItemId: item.id,
    body: item.resultBody ?? item.text,
    delta: adjustedDelta,
    showDeltaOnConfirm: true,
    blocks: true,
    options: [{ id: "confirm", label: shopResultConfirmLabel(item, adjustedDelta), delta: {} }],
  });
  return { ok: true };
}

export function confirmRandomEvent(state, optionId) {
  const result = confirmEvent(state, optionId);
  if (!result.ok) {
    return result;
  }
  resolvePendingInteraction(state, () => {
    if (result.isInteractive) {
      queueChoiceResult(state, result.selectedLabel, result.selectedBody, result.delta, {
        titleSuffix: false,
        showDeltaOnConfirm: true,
      });
    }
  });
  return { ok: true };
}

export function finishWeek(state) {
  const pending = requireNoPending(state);
  if (!pending.ok) return pending;
  if (state.phase !== "week_action") {
    return { ok: false, reason: "not_week_action_phase" };
  }

  state.phase = "week_settlement";
  state.weeklySettlementApplied = false;
  queueWeeklyEvents(state);
  if (state.pendingInteraction) {
    return { ok: true };
  }
  continueAfterWeeklyEvents(state);
  return { ok: true };
}

export function continueAfterWeeklyEvents(state) {
  if (state.pendingInteraction || state.ending) {
    return { ok: true };
  }
  if (state.phase !== "week_settlement") {
    return { ok: false, reason: "not_week_settlement_phase" };
  }
  if (!state.weeklySettlementApplied) {
    applyWeeklySettlement(state);
    state.weeklySettlementApplied = true;
    recordWeeklySettlement(state);
  }
  if (state.pendingInteraction || state.ending) {
    return { ok: true };
  }
  if (queueWanliRoadOpenPrompt(state)) {
    return { ok: true };
  }
  if (shouldStartYearlyCourseExam(state)) {
    startCourseExam(state);
  } else if (state.semesterIndex === 9 && state.weekInSemester >= WEEKS_PER_SEMESTER) {
    if (queueGraduationDesignReminder(state)) {
      return { ok: true };
    }
    advanceSemester(state);
  } else if (state.weekInSemester >= WEEKS_PER_SEMESTER) {
    startReview(state);
  } else {
    startWeek(state);
  }
  return { ok: true };
}

export function answerCourseQuestion(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "course_question") {
    return { ok: false, reason: "no_course_question_pending" };
  }

  const exam = state.courseExam;
  const current = exam.questions[exam.index];
  exam.answers.push(questionAnswerRecord(current, optionId));
  exam.index += 1;

  resolvePendingInteraction(state, () => {
    if (exam.index < exam.questions.length) {
      queueCourseQuestion(state);
    } else {
      resolveCourseExam(state);
    }
  });
  return { ok: true };
}

export function startIeltsExam(state) {
  if (!state) {
    return { ok: false, reason: "no_state" };
  }
  if (state.pendingInteraction) {
    return { ok: false, reason: "pending_interaction" };
  }
  if (ieltsExamTakenThisSemester(state)) {
    return { ok: false, reason: "ielts_exam_taken_this_semester" };
  }
  if ((state.money ?? 0) < IELTS_EXAM_PRICE) {
    return { ok: false, reason: "ielts_exam_money_not_enough" };
  }

  const returnPhase = state.phase;
  const [rngState, selected] = sampleMany(state.rngState, questionsWithIds("ielts", IELTS_QUESTIONS), IELTS_EXAM_QUESTION_COUNT);
  state.rngState = rngState;
  state.phase = "ielts_exam";
  state.ieltsExam = {
    index: 0,
    questions: selected,
    answers: [],
    semesterIndex: state.semesterIndex,
    year: state.year,
    term: state.term,
    week: state.week,
    returnPhase,
  };
  applyDelta(state, "ielts_exam", "雅思报名费", { money: -IELTS_EXAM_PRICE }, "ielts_exam", { skipPassive: true });
  pushModal(state, {
    type: "ielts_exam_intro",
    title: "雅思考试",
    body: `报名成功，考试费用 -${IELTS_EXAM_PRICE}¥。\n本场考试共有 ${IELTS_EXAM_QUESTION_COUNT} 道单选题，系统会根据答对数量折算雅思成绩。`,
    blocks: true,
    options: [{ id: "start", label: "开始考试" }],
  });
  return { ok: true };
}

export function beginIeltsExam(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "ielts_exam_intro") {
    return { ok: false, reason: "no_ielts_exam_intro_pending" };
  }
  resolvePendingInteraction(state, () => queueIeltsQuestion(state));
  return { ok: true };
}

export function answerIeltsQuestion(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "ielts_question") {
    return { ok: false, reason: "no_ielts_question_pending" };
  }

  const exam = state.ieltsExam;
  const current = exam?.questions?.[exam.index];
  if (!current) {
    return { ok: false, reason: "ielts_exam_missing_question" };
  }
  exam.answers.push(questionAnswerRecord(current, optionId));
  exam.index += 1;

  resolvePendingInteraction(state, () => {
    if (exam.index < exam.questions.length) {
      queueIeltsQuestion(state);
    } else {
      resolveIeltsExam(state);
    }
  });
  return { ok: true };
}

export function confirmIeltsExamResult(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "ielts_exam_result") {
    return { ok: false, reason: "no_ielts_exam_result_pending" };
  }
  const returnPhase = state.ieltsExam?.returnPhase ?? "week_action";
  resolvePendingInteraction(state, () => {
    state.ieltsExam = null;
    if (state.phase === "ielts_exam") {
      state.phase = returnPhase;
    }
  });
  return { ok: true };
}

function queueIeltsQuestion(state) {
  const exam = state.ieltsExam;
  const question = exam.questions[exam.index];
  pushModal(state, {
    type: "ielts_question",
    title: `雅思题 ${exam.index + 1} / ${exam.questions.length}`,
    body: question.q,
    blocks: true,
    options: Object.entries(question.options).map(([id, label]) => ({ id, label: `${id}. ${label}` })),
  });
}

function resolveIeltsExam(state) {
  const exam = state.ieltsExam;
  const correct = exam.answers.filter((answer) => answer.correct).length;
  const score = ieltsScoreForCorrect(correct);
  const previousScore = state.ieltsScore ?? 0;
  const bestScore = Math.min(IELTS_EXAM_MAX_SCORE, Math.max(previousScore, score));
  state.ieltsScore = bestScore;
  state.ieltsLastTakenSemester = exam.semesterIndex;
  recordIeltsExam(state);
  log(state, "ielts_exam", "ielts_exam_result", "雅思考试结算", { correct, score, bestScore });
  pushModal(state, {
    type: "ielts_exam_result",
    title: "雅思成绩",
    body: `本次雅思考试答对 ${correct} / ${exam.questions.length} 题。\n折算成绩 ${formatIeltsScore(score)}。`,
    blocks: true,
    options: [{ id: "confirm", label: "确认成绩" }],
  });
}

export function ieltsExamTakenThisSemester(state) {
  const currentSemester = Number(state?.semesterIndex);
  if (!Number.isFinite(currentSemester)) return false;
  return Number(state?.ieltsLastTakenSemester) === currentSemester;
}

function ieltsScoreForCorrect(correct) {
  if (correct >= 10) return IELTS_EXAM_MAX_SCORE;
  if (correct >= 9) return 7.5;
  if (correct >= 8) return 7;
  if (correct >= 7) return 6.5;
  if (correct >= 6) return 6;
  return 0;
}

function formatIeltsScore(score) {
  const value = Number(score) || 0;
  return value > 0 ? value.toFixed(1) : "低于 6.0";
}

function questionsWithIds(bankId, questions) {
  return questions.map((question) => ({
    ...question,
    id: question.id ?? `${bankId}_${questionContentHash(question)}`,
  }));
}

function questionContentHash(question) {
  const text = `${question.q}|${question.answer}|${Object.keys(question.options ?? {}).join(",")}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function questionAnswerRecord(question, selected) {
  return {
    questionId: question.id ?? null,
    question: question.q,
    selected,
    correct: selected === question.answer,
  };
}

export function beginRouteExam(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "route_exam_intro") {
    return { ok: false, reason: "no_route_exam_intro_pending" };
  }
  resolvePendingInteraction(state, () => queueRouteQuestion(state));
  return { ok: true };
}

export function submitCompetitionWork(state, submissionId) {
  if (!state || !submissionId) {
    return { ok: false, reason: "invalid_competition_submission" };
  }
  const [competitionId, workId] = submissionId.split("::");
  const card = COMPETITION_RULES.find((item) => item.id === competitionId);
  if (!card) {
    return { ok: false, reason: "competition_submission_not_found" };
  }
  if (competitionSubmittedThisSemester(state)) {
    return { ok: false, reason: "competition_semester_limit" };
  }
  const work = competitionSubmissionWorks(state).find((item) => item.id === workId);
  if (!work) {
    return { ok: false, reason: "competition_submission_not_found" };
  }
  if (!competitionRequirementsMet(state, card, work)) {
    return { ok: false, reason: "competition_requirements_unmet" };
  }

  const [rngState, roll] = randomFloat(state.rngState);
  state.rngState = rngState;
  const award = competitionAwardFor(work, roll);
  const prizeMoney = competitionPrizeMoney(card.id, award);
  state.competitionSubmissionCount = (state.competitionSubmissionCount ?? 0) + 1;
  state.competitionAwardCount = (state.competitionAwardCount ?? 0) + (award === "none" ? 0 : 1);
  state.competitionRecords = Array.isArray(state.competitionRecords) ? state.competitionRecords : [];
  state.competitionRecords.push({
    competitionId: card.id,
    competitionName: card.name,
    semesterIndex: work.semesterIndex,
    workName: work.label,
    topic: work.topic,
    finalGrade: work.finalGrade,
    finalScore: work.finalScore,
    award,
    prizeMoney,
    week: state.week,
    year: state.year,
    term: state.term,
    submittedSemesterIndex: state.semesterIndex,
    submittedYear: state.year,
    submittedTerm: state.term,
  });
  if (prizeMoney > 0) {
    applyDelta(state, "competition_prize", `竞赛奖金 ￥${prizeMoney}`, { money: prizeMoney }, "competition", { skipPassive: true });
  } else {
    log(state, "competition", "competition_submission", `竞赛投稿：${card.name}，${work.label}，未获奖`, {});
  }
  recordCompetitionSubmission(state, award);
  pushModal(state, {
    type: "choice_result",
    title: `竞赛结果：${competitionAwardLabel(award)}`,
    award,
    body: competitionAwardResultCopy(award),
    blocks: true,
    options: [{ id: "confirm", label: competitionAwardConfirmLabel(prizeMoney) }],
  });
  return { ok: true };
}

export function visitWanliRoadLocation(state, locationId) {
  if (!state) {
    return { ok: false, reason: "no_state" };
  }
  if (state.pendingInteraction) {
    return { ok: false, reason: "pending_interaction" };
  }
  if (state.phase !== "week_action") {
    return { ok: false, reason: "wanli_road_phase_unavailable" };
  }
  if (state.year < 2) {
    return { ok: false, reason: "wanli_road_not_open" };
  }
  if ((state.actionsRemaining ?? 0) < 0) {
    return { ok: false, reason: "wanli_road_actions_insufficient" };
  }
  if (wanliRoadVisitsThisYear(state) >= WANLI_ROAD_MAX_VISITS_PER_YEAR) {
    return { ok: false, reason: "wanli_road_year_limit_reached" };
  }
  const visitIndex = state.wanliRoadVisits ?? state.eventTally?.wanliRoadVisits ?? 0;
  const event = WANLI_ROAD_EVENTS[visitIndex];
  if (!event) {
    return { ok: false, reason: "wanli_road_complete" };
  }
  if ((state.money ?? 0) < event.cost) {
    return { ok: false, reason: "wanli_road_money_insufficient" };
  }
  if (locationId && locationId !== event.id) {
    return { ok: false, reason: "wanli_road_locked_location" };
  }

  const delta = wanliRoadPreviewDelta(state, event);
  pushModal(state, {
    type: "wanli_road_event",
    eventId: event.id,
    title: event.title,
    titleIcon: event.iconKey,
    body: event.body,
    blocks: true,
    options: [{ id: "confirm", label: formatDelta(delta), delta }],
  });
  return { ok: true };
}

function confirmWanliRoadEvent(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "wanli_road_event") {
    return { ok: false, reason: "no_wanli_road_event_pending" };
  }
  if (optionId !== "confirm") {
    return { ok: false, reason: "wanli_road_option_not_found" };
  }
  if (state.phase !== "week_action") {
    return { ok: false, reason: "wanli_road_phase_unavailable" };
  }
  if (state.year < 2) {
    return { ok: false, reason: "wanli_road_not_open" };
  }
  if ((state.actionsRemaining ?? 0) < 0) {
    return { ok: false, reason: "wanli_road_actions_insufficient" };
  }
  if (wanliRoadVisitsThisYear(state) >= WANLI_ROAD_MAX_VISITS_PER_YEAR) {
    return { ok: false, reason: "wanli_road_year_limit_reached" };
  }

  const visitIndex = state.wanliRoadVisits ?? state.eventTally?.wanliRoadVisits ?? 0;
  const event = WANLI_ROAD_EVENTS[visitIndex];
  if (!event) {
    return { ok: false, reason: "wanli_road_complete" };
  }
  if ((state.money ?? 0) < event.cost) {
    return { ok: false, reason: "wanli_road_money_insufficient" };
  }
  if (interaction.eventId !== event.id) {
    return { ok: false, reason: "wanli_road_locked_location" };
  }

  resolvePendingInteraction(state, () => settleWanliRoadEvent(state, event, visitIndex));
  return { ok: true };
}

function settleWanliRoadEvent(state, event, visitIndex) {
  const actionCost = wanliRoadActionCost(event);
  state.actionsRemaining -= actionCost;
  state.wanliRoadActionDebt = Math.max(0, -state.actionsRemaining);
  state.actionTally.wanli_road = (state.actionTally.wanli_road ?? 0) + 1;
  state.semesterActionTally.wanli_road = (state.semesterActionTally.wanli_road ?? 0) + 1;
  state.weeklyActionCounts.wanli_road = (state.weeklyActionCounts.wanli_road ?? 0) + 1;
  state.wanliRoadVisits = visitIndex + 1;
  state.eventTally.wanliRoadVisits = state.wanliRoadVisits;
  state.eventTally[event.id] = (state.eventTally[event.id] ?? 0) + 1;
  state.eventHistory.push({ id: event.id, week: state.week, semesterIndex: state.semesterIndex, optionId: "visit", pool: "travel" });
  state.eventLastTriggeredWeek[event.id] = state.week;
  state.wanliRoadRecords = Array.isArray(state.wanliRoadRecords) ? state.wanliRoadRecords : [];
  state.wanliRoadRecords.push({
    eventId: event.id,
    title: event.title,
    year: state.year,
    term: state.term,
    semesterIndex: state.semesterIndex,
    week: state.week,
    cost: event.cost,
    actionCost,
  });

  applyDelta(state, `wanli:${event.id}`, `万里路：${event.title}`, event.delta, "wanli_road", { sourceType: "event" });
  applyWanliRoadStageRewards(state);
  recordWanliRoadVisit(state);
}

function wanliRoadActionCost(event) {
  return Math.max(1, Number(event?.actionCost ?? 2) || 2);
}

function applyWanliRoadStageRewards(state) {
  state.wanliRoadStageRewardsClaimed = Array.isArray(state.wanliRoadStageRewardsClaimed)
    ? state.wanliRoadStageRewardsClaimed
    : [];
  const claimed = new Set(
    state.wanliRoadStageRewardsClaimed
      .map((visits) => Number(visits))
      .filter(Number.isFinite),
  );
  for (const reward of WANLI_ROAD_STAGE_REWARDS) {
    if ((state.wanliRoadVisits ?? 0) < reward.visits || claimed.has(reward.visits)) {
      continue;
    }
    applyDelta(
      state,
      `wanli_stage_reward:${reward.visits}`,
      `万里路阶段奖励：完成 ${reward.visits} 站`,
      reward.delta,
      "wanli_road",
    );
    state.wanliRoadStageRewardsClaimed.push(reward.visits);
    claimed.add(reward.visits);
  }
}

function wanliRoadPreviewDelta(state, event) {
  return previewDelta(state, event.delta, { sourceType: "event", preview: true });
}

function wanliRoadVisitsThisYear(state) {
  return (Array.isArray(state.wanliRoadRecords) ? state.wanliRoadRecords : [])
    .filter((record) => Number(record?.year) === Number(state.year)).length;
}

const COMPETITION_RULES = [
  {
    id: "campus_corner",
    name: "霍普杯国际大学生建筑设计竞赛",
    requirements: { design: 60, aesthetic: 58, presentation: 52 },
  },
  {
    id: "green_building",
    name: "台达杯国际太阳能建筑设计竞赛",
    requirements: { design: 58, software: 54, resilience: 48 },
  },
  {
    id: "public_space",
    name: "台湾国际学生创意设计大赛",
    requirements: { aesthetic: 50, presentation: 45, design: 50 },
  },
  {
    id: "old_street_micro",
    name: "东南·中国建筑新人赛",
    requirements: { design: 50, presentation: 48, aesthetic: 45 },
    maxParticipationYear: 3,
  },
];

function competitionSubmissionWorks(state) {
  if (competitionSubmittedThisSemester(state)) {
    return [];
  }
  const submittedSemesters = new Set(
    (state.competitionRecords ?? [])
      .map((record) => Number(record.semesterIndex))
      .filter((semesterIndex) => Number.isFinite(semesterIndex)),
  );
  return (state.reviews ?? [])
    .filter((review) => gradeAtLeast(review.finalGrade, "C"))
    .map((review) => {
      const semesterIndex = reviewSemesterIndex(review);
      return {
        id: `semester-${semesterIndex}`,
        label: `${semesterLabel(review)} · ${SEMESTER_TOPICS[semesterIndex - 1] ?? "课程设计"}`,
        topic: SEMESTER_TOPICS[semesterIndex - 1] ?? "课程设计",
        semesterIndex,
        finalGrade: review.finalGrade,
        finalScore: review.finalScore,
      };
    })
    .filter((work) => !submittedSemesters.has(work.semesterIndex));
}

function competitionRequirementsMet(state, card, work) {
  if (competitionSubmittedThisSemester(state)) return false;
  if (card.maxParticipationYear && state.year > card.maxParticipationYear) return false;
  if (card.id === "old_street_micro" && work.semesterIndex > 6) return false;
  return Object.entries(card.requirements ?? {}).every(([key, value]) => (state.attributes[key] ?? 0) >= value);
}

function competitionSubmittedThisSemester(state) {
  const currentSemester = Number(state.semesterIndex);
  if (!Number.isFinite(currentSemester)) return false;
  return (state.competitionRecords ?? []).some((record) => {
    const submittedSemester = Number(record.submittedSemesterIndex ?? record.submissionSemesterIndex);
    if (Number.isFinite(submittedSemester)) {
      return submittedSemester === currentSemester;
    }
    const submittedYear = Number(record.submittedYear ?? record.year);
    const submittedTerm = Number(record.submittedTerm ?? record.term);
    return submittedYear === Number(state.year) && submittedTerm === Number(state.term);
  });
}

function competitionAwardFor(work, roll) {
  if (work.finalGrade === "S") return "first";
  const score = Number(work.finalScore) || 0;
  if (score >= 90) return roll < 0.15 ? "first" : roll < 0.45 ? "second" : roll < 0.8 ? "third" : "none";
  if (score >= 85) return roll < 0.02 ? "first" : roll < 0.2 ? "second" : roll < 0.65 ? "third" : "none";
  if (score >= 80) return roll < 0.05 ? "second" : roll < 0.45 ? "third" : "none";
  if (score >= 75) return roll < 0.02 ? "second" : roll < 0.3 ? "third" : "none";
  return roll < 0.08 ? "third" : "none";
}

function competitionPrizeMoney(competitionId, award) {
  const prizes = {
    campus_corner: { third: 1500, second: 4000, first: 10000 },
    green_building: { third: 1200, second: 3500, first: 8000 },
    public_space: { third: 1000, second: 3000, first: 7000 },
    old_street_micro: { third: 800, second: 2000, first: 5000 },
  };
  return prizes[competitionId]?.[award] ?? 0;
}

function competitionAwardLabel(award) {
  return {
    none: "未获奖",
    third: "三等奖",
    second: "二等奖",
    first: "一等奖",
  }[award] ?? "未记录";
}

function competitionAwardResultCopy(award) {
  return {
    first: "同学恭喜你，这意味着你的设计语言开始被行业听见。你的方案在场地回应、体量生成和剖面叙事之间建立了高度自洽的系统。评委会认为该项目“触及了建筑学的基本命题”。",
    second: "方案整体成立，在概念切入和空间组织上有独到之处，但深化阶段略显仓促，某些构造节点的表达不够完整，光影关系的推敲还可更精准。",
    third: "方案功能合理、表达规范，评委会认为“设计没有明显错误，但也没有超出预期的亮点”。\n恭喜你，简历上能多一行字，值了。",
    none: "你等了两个月，收到的只是一句“谢谢参与”。\n评委会的反馈是：“方案有想法，但表达深度未达到入围线。”\n未获奖不是否定，而是告诉你：同等概念下，你需要更精准的图纸语言去说服别人。",
  }[award] ?? "竞赛结果已经公开。";
}

function competitionAwardConfirmLabel(prizeMoney) {
  return prizeMoney > 0 ? `恭喜你！荣获 ${prizeMoney}¥ 的竞赛奖金！` : "别灰心，下次会更好！";
}

function reviewSemesterIndex(review) {
  const explicit = Number(review.semesterIndex);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return (Number(review.year) - 1) * 2 + (Number(review.term) === 2 ? 2 : 1);
}

function semesterLabel(review) {
  return `${yearLabel(review.year)}${Number(review.term) === 1 ? "上" : "下"}`;
}

function gradeAtLeast(grade, target) {
  const order = ["F", "D", "C", "B", "A", "S"];
  return order.indexOf(grade) >= order.indexOf(target);
}

export function answerRouteQuestion(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "route_question") {
    return { ok: false, reason: "no_route_question_pending" };
  }

  const exam = state.routeExam;
  const current = exam.questions[exam.index];
  exam.answers.push(questionAnswerRecord(current, optionId));
  exam.index += 1;

  resolvePendingInteraction(state, () => {
    if (exam.index < exam.questions.length) {
      queueRouteQuestion(state);
    } else {
      resolveRouteExam(state);
    }
  });
  return { ok: true };
}

export function confirmRouteExamResult(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "route_exam_result") {
    return { ok: false, reason: "no_route_exam_result_pending" };
  }
  const returnAfter = state.routeExam?.returnAfter ?? null;
  const returnPhase = state.routeExam?.returnPhase ?? "week_action";
  resolvePendingInteraction(state, () => {
    state.routeExam = null;
    if (returnAfter === "review_result") {
      if (state.semesterIndex === 9 && queueGraduationDesignReminder(state)) {
        return;
      }
      continueAfterReviewResult(state);
    } else if (returnAfter === "start_week") {
      startWeek(state);
    } else if (state.phase === "route_exam") {
      state.phase = returnPhase;
    }
  });
  return { ok: true };
}

export function confirmCourseResult(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "course_result") {
    return { ok: false, reason: "no_course_result_pending" };
  }
  resolvePendingInteraction(state, () => {
    if (state.weekInSemester >= WEEKS_PER_SEMESTER) {
      startReview(state);
    } else {
      startWeek(state);
    }
  });
  return { ok: true };
}

export function chooseRouteOption(state, optionId) {
  const pending = requireNoPending(state);
  if (!pending.ok) return pending;

  const option = ROUTE_OPTIONS.find((item) => item.id === optionId);
  if (!option) {
    return { ok: false, reason: "route_option_not_found" };
  }
  const availability = routeOptionAvailability(state, option);
  if (availability.state !== "available") {
    return { ok: false, reason: availability.reason || "route_option_unavailable" };
  }

  if (option.id === "career_startup") {
    pushModal(state, {
      type: "route_contract",
      optionId: option.id,
      title: "恶魔的契约",
      body: "现在有一份恶魔契约摆在你的面前。\n如果签下，你可以拥有无限的心力与精力；\n但代价是，无论多痛苦你也无法停下脚步。\n你愿意吗？",
      blocks: true,
      options: [
        { id: "sign", label: "如果成长的代价是失去，那我无所谓。", state: "available" },
        { id: "cancel", label: "我放弃了。", state: "available" },
      ],
    });
    return { ok: true };
  }

  if (option.route === "建筑工作" || option.route === "转行") {
    pushModal(state, {
      type: "route_commit",
      optionId: option.id,
      title: "简历投递",
      body: `你准备正式参与「${option.label}」。[[br]]总图只能定一条轴线，在这里简历只能投一家公司。`,
      blocks: true,
      options: [
        { id: "confirm", label: "我决定了！", state: "available" },
        { id: "cancel", label: "再想想", state: "available" },
      ],
    });
    return { ok: true };
  }

  if (["保研", "考研", "留学", "选调", "考公", "考编"].includes(option.route)) {
    pushModal(state, createRouteCommitInteraction(option));
    return { ok: true };
  }

  commitRouteParticipation(state, option);
  queuePostRouteParticipation(state, option);
  return { ok: true };
}

export function createRouteCommitInteraction(option) {
  return {
    type: "route_commit",
    optionId: option.id,
    title: routeCommitTitle(option),
    body: routeCommitBody(option),
    blocks: true,
    options: [
      { id: "confirm", label: routeCommitConfirmLabel(option), state: "available" },
      { id: "cancel", label: "再想想", state: "available" },
    ],
  };
}

function routeCommitTitle(option) {
  if (option.route === "保研") return "申请保研";
  if (option.route === "留学") return "留学申请";
  return "确认报考";
}

function routeCommitConfirmLabel(option) {
  return option.route === "保研" || option.route === "留学" ? "确认申请" : "确认报考";
}

function routeCommitBody(option) {
  const introByRoute = {
    保研: "你早就不是那个需要老师告诉你“你行不行”的人了。[[br]]保研是你用五年的时间，替自己挣回了一个“我还可以继续”的机会。",
    考研: "那条路你已经走过一次了——高考那年，[[br]]你把所有答案写在一张答题卡上，然后等一个分数来决定你去哪里。[[br]]考研也是，只不过这次你要自己决定去哪里，再自己把答案写上去。[[br]]你确定吗？",
    留学: "如果你还没想好毕业去哪，留学是一个不错的选择。[[br]]适合那些想要换一个角度看待建筑、看待自己的人。[[br]]路很长，但值得走走看。",
    选调: "你选择了另一种成长方式——不是飞得更远，而是扎得更深。[[br]]你要把自己放回那个熟悉的地方，然后重新长大一次。[[br]]你确定吗？",
    考公: "高考那年你填志愿，选的是自己喜欢的专业。[[br]]考公这次选的是你想过的生活——稳定的作息、可预期的路、不用再为deadline掉头发的日子。[[br]]你确定吗？",
    考编: "这条路意味着你要告别专教，走进一间安静的办公室。[[br]]你不再画图了，但你会在另一张“图纸”上画出自己的轨道。[[br]]你确定吗？",
  };
  const verb = option.route === "保研" || option.route === "留学" ? "申请" : "报考";
  return `你准备正式${verb}「${routeExamParticipationLabel(option)}」。[[br]]${introByRoute[option.route] ?? "这条路线会读取对应方向的积累与结果。"}`;
}

export function applyForInternship(state, optionId) {
  const pending = requireNoPending(state);
  if (!pending.ok) return pending;

  const option = ROUTE_OPTIONS.find((item) => item.id === optionId);
  const config = ARCHITECTURE_INTERNSHIP_OPTIONS[optionId];
  if (!option || !config) {
    return { ok: false, reason: "internship_option_not_found" };
  }

  const availability = internshipApplicationAvailability(state, optionId);
  if (availability.state !== "available") {
    return { ok: false, reason: availability.reason || "internship_unavailable" };
  }

  state.internshipAppliedSemesters = Array.isArray(state.internshipAppliedSemesters) ? state.internshipAppliedSemesters : [];
  state.internshipApplications = Array.isArray(state.internshipApplications) ? state.internshipApplications : [];
  state.internshipAppliedSemesters.push(state.semesterIndex);

  const chance = internshipApplicationChance(state, config);
  const [rngState, roll] = randomInt(state.rngState, 1, 100);
  state.rngState = rngState;
  const accepted = roll <= chance;
  const effectiveThresholds = effectiveInternshipAttributes(state, config.requirements?.attributes ?? {});

  state.internshipApplications.push({
    semesterIndex: state.semesterIndex,
    week: state.week,
    targetId: option.id,
    targetLabel: option.target,
    tier: config.tier,
    chance,
    roll,
    accepted,
    designAtApplication: state.attributes.design,
    softwareAtApplication: state.attributes.software,
    designThreshold: effectiveThresholds.design,
    softwareThreshold: effectiveThresholds.software,
    priorInternshipValueAtApplication: completedInternshipTierValue(state),
  });

  if (accepted) {
    const passivePressure = internshipTriggerPressureDelta(state);
    if (passivePressure > 0) {
      applyDelta(state, "passive:internship_resource", "爸妈的资源：实习压力反弹", { pressure: passivePressure }, "internship_application");
    }
    const shortEvent = drawInternshipShortEvent(state, config.tier);
    state.activeInternship = {
      targetId: option.id,
      targetLabel: option.target,
      tier: config.tier,
      value: config.value,
      startSemesterIndex: state.semesterIndex,
      startYear: state.year,
      startTerm: state.term,
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
    log(state, "internship_application", `internship:${option.id}`, `实习录取：${option.target} roll=${roll} chance=${chance}`, {});
    queueInternshipApplicationResult(state, "accepted", config.tier, "实习录取", "你收到了一封实习录取邮件。");
    return { ok: true };
  }

  log(state, "internship_application", `internship:${option.id}`, `实习拒绝：${option.target} roll=${roll} chance=${chance}`, {});
  queueInternshipApplicationResult(state, "rejected", config.tier, "申请未通过", "你盯着那封拒绝信看了很久。");
  return { ok: true };
}

export function confirmRouteCommit(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || !["route_commit", "route_contract"].includes(interaction.type)) {
    return { ok: false, reason: "no_route_commit_pending" };
  }
  const option = ROUTE_OPTIONS.find((item) => item.id === interaction.optionId);
  if (!option) {
    return { ok: false, reason: "route_option_not_found" };
  }

  if (optionId === "cancel") {
    resolvePendingInteraction(state);
    return { ok: true };
  }
  if (interaction.type === "route_contract" && optionId !== "sign") {
    return { ok: false, reason: "route_contract_option_invalid" };
  }
  if (interaction.type === "route_commit" && optionId !== "confirm") {
    return { ok: false, reason: "route_commit_option_invalid" };
  }

  resolvePendingInteraction(state, () => {
    commitRouteParticipation(state, option);
    queuePostRouteParticipation(state, option);
  });
  return { ok: true };
}

function internshipTriggerPressureDelta(state) {
  switch (getCharacter(state)?.id) {
    case "corbusier_heir":
      return 10;
    case "gene_rebel":
      return 8;
    default:
      return 0;
  }
}

function drawInternshipShortEvent(state, tier) {
  const candidates = (INTERNSHIP_SHORT_EVENTS[tier] ?? []).filter((event) => !state.eventTally?.[event.id]);
  if (candidates.length === 0) {
    return null;
  }
  const [rngState, index] = randomInt(state.rngState, 0, candidates.length - 1);
  state.rngState = rngState;
  return candidates[index];
}

function queueInternshipApplicationResult(state, result, tier, title, body) {
  pushModal(state, {
    type: "choice_result",
    internshipResult: result,
    internshipTier: tier,
    title,
    body,
    kicker: "实习申请",
    blocks: true,
    options: [{ id: "confirm", label: "知道了" }],
  });
}

export function chooseReportStrategy(state, strategyId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "report_strategy") {
    return { ok: false, reason: "no_report_strategy_pending" };
  }
  const available = interaction.options.find((option) => option.id === strategyId && option.state === "available");
  if (!available) {
    return { ok: false, reason: "strategy_unavailable" };
  }

  const strategy = REPORT_STRATEGIES.find((item) => item.id === strategyId);
  const base = state.reviewDraft.base;
  const [rngState, roll] = randomFloat(state.rngState);
  state.rngState = rngState;
  const succeeded = roll <= strategy.successRate;
  const branch = succeeded ? strategy.success : strategy.failure;
  const strategyResult = applyReportStrategyResult(state, base, strategy, branch, succeeded);
  state.reviewDraft.strategyResult = strategyResult;

  resolvePendingInteraction(state, () => {
    pushModal(state, {
      type: "report_feedback",
      title: succeeded ? "汇报成功" : "汇报失败",
      body: branch.text,
      delta: strategyResult.delta,
      blocks: true,
      options: [{ id: "confirm", label: state.ending ? "查看结局" : "查看评图结果" }],
    });
  });
  return { ok: true };
}

export function confirmMentorTaskResult(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "mentor_task_result") {
    return { ok: false, reason: "no_mentor_task_result_pending" };
  }

  resolvePendingInteraction(state, () => queueReportStrategy(state));
  return { ok: true };
}

export function confirmReportFeedback(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "report_feedback") {
    return { ok: false, reason: "no_report_feedback_pending" };
  }

  resolvePendingInteraction(state, () => {
    if (state.ending) {
      state.reviewDraft = null;
      return;
    }
    const record = finalizeReview(state, state.reviewDraft?.strategyResult, state.reviewDraft?.base);
    recordReviewResult(state, record);
    state.reviewDraft = null;
    queueReviewResult(state, record);
    queueFirstPortfolioEntryPrompt(state, record);
  });
  return { ok: true };
}

export function confirmReviewResult(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "review_result") {
    return { ok: false, reason: "no_review_result_pending" };
  }
  recordReviewResultConfirmed(state, interaction);

  resolvePendingInteraction(state, () => {
    if (state.ending) {
      return;
    }
    if (isGraduationFailedEndingPending(state)) {
      settleFinalEnding(state);
      recordFinalEnding(state);
      return;
    }
    const routeOption = pendingRouteExamOption(state);
    if (state.semesterIndex === 9 && routeOption) {
      startRouteExam(state, routeOption, { returnAfter: "review_result" });
      return;
    }
    if (state.semesterIndex === 9 && queueGraduationDesignReminder(state)) {
      return;
    }
    continueAfterReviewResult(state);
  });
  return { ok: true };
}

function queueGraduationDesignReminder(state) {
  state.systemFlags ??= {};
  if (state.systemFlags.graduationDesignReminderShown === true) {
    return false;
  }
  state.systemFlags.graduationDesignReminderShown = true;
  pushModal(state, graduationDesignReminderInteraction());
  return true;
}

function graduationDesignReminderInteraction() {
  return {
    type: "system_prompt",
    title: "温馨提醒",
    kicker: "系统提醒",
    body: "同学，你即将步入大五下学期，也许你会忘记很多事，[[br]]但别在离开之前，忘记把你的毕业设计完成，这可是会要了你的命！",
    blocks: true,
    options: [{ id: "confirm", label: "我记住了" }],
  };
}

function continueAfterReviewResult(state) {
  if (state.ending) {
    return;
  }
  if (state.semesterIndex >= 10) {
    startGraduationFlow(state);
    return;
  }
  const summer = SUMMER_EVENTS.filter((event) => event.semesterAfter === state.semesterIndex);
  if (summer.length > 0) {
    state.summerQueue = summer.map((event) => event.id);
    queueSummerEvent(state);
  } else {
    advanceSemester(state);
  }
}

export function confirmGraduationCeremony(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "graduation_ceremony") {
    return { ok: false, reason: "no_graduation_ceremony_pending" };
  }
  resolvePendingInteraction(state, () => queueEndingMemory(state));
  return { ok: true };
}

export function confirmEndingMemory(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "ending_memory") {
    return { ok: false, reason: "no_ending_memory_pending" };
  }
  if (interaction.memoryStep === "first_photo") {
    resolvePendingInteraction(state, () => queueEndingMemorySecondPhoto(state));
    return { ok: true };
  }
  if (interaction.memoryStep === "second_photo") {
    prepareFinalEnding(state);
    resolvePendingInteraction(state, () => queueEndingMemoryAnimation(state));
    return { ok: true };
  }
  state.endingMemoryWatched = true;
  resolvePendingInteraction(state, () => {
    settleFinalEnding(state);
    recordFinalEnding(state);
  });
  return { ok: true };
}

export function confirmChoiceResult(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "choice_result") {
    return { ok: false, reason: "no_choice_result_pending" };
  }

  state.pendingInteraction = state.modalQueue.shift() ?? null;
  if (state.pendingInteraction) {
    return { ok: true };
  }
  if (interaction.next === "advance_semester") {
    advanceSemester(state);
    return { ok: true };
  }
  if (state.phase === "week_settlement") {
    return continueAfterWeeklyEvents(state);
  }
  return { ok: true };
}

export function confirmSystemPrompt(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "system_prompt") {
    return { ok: false, reason: "no_system_prompt_pending" };
  }
  resolvePendingInteraction(state, () => {
    if (isWanliRoadOpenPrompt(interaction)) {
      if (interaction.next === "start_week_after_week_settlement" || state.phase === "week_settlement") {
        startWeek(state);
      } else {
        continueAfterYearStart(state);
      }
      return;
    }
    if (interaction.title === "温馨提醒" && state.semesterIndex === 9) {
      continueAfterReviewResult(state);
    }
  });
  return { ok: true };
}

function isWanliRoadOpenPrompt(interaction) {
  return interaction?.promptId === "wanli_road_open"
    || interaction?.title === WANLI_ROAD_OPEN_PROMPT.title;
}

export function chooseSummerEventOption(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "summer_event") {
    return { ok: false, reason: "no_summer_event_pending" };
  }
  const event = SUMMER_EVENTS.find((item) => item.id === interaction.eventId);
  const option = event?.options.find((item) => item.id === optionId);
  if (!event || !option) {
    return { ok: false, reason: "summer_option_not_found" };
  }

  resolvePendingInteraction(state, () => {
    const delta = summerOptionDelta(state, option);
    const adjustedDelta = applyDelta(state, `summer:${event.id}`, `${event.title}：${option.label}`, delta, "summer_event");
    recordSummerEventComplete(state);
    state.summerQueue = (state.summerQueue ?? []).filter((id) => id !== event.id);
    if (state.summerQueue.length > 0) {
      queueChoiceResult(state, event.title, option.body, adjustedDelta, { next: "summer_event" });
      queueSummerEvent(state);
    } else {
      queueChoiceResult(state, event.title, option.body, adjustedDelta, { next: "advance_semester" });
    }
  });
  return { ok: true };
}

export function resolveActionAvailability(state) {
  return ACTIONS.map((action) => {
    if (state.pendingInteraction) {
      return actionAvailabilityResult(action, "disabled", "先处理当前弹窗", state);
    }
    if (state.phase !== "week_action") {
      return actionAvailabilityResult(action, "hidden", "当前阶段不能行动", state);
    }
    if (state.actionsRemaining <= 0) {
      return actionAvailabilityResult(action, "disabled", "本周行动次数已用完", state);
    }
    if (action.projectType && paidWorkWeeklyLimitReached(state)) {
      return actionAvailabilityResult(action, "disabled", "本周外包/兼职次数已达合计上限", state);
    }
    if (action.maxPerWeek !== undefined && (state.weeklyActionCounts[action.id] ?? 0) >= action.maxPerWeek) {
      return actionAvailabilityResult(action, "disabled", "本周次数已达上限", state);
    }
    if (state.energy < 30 && action.highEnergyCost) {
      return actionAvailabilityResult(action, "disabled", "精力高危，不能选择高消耗行动", state);
    }
    if (state.pressure > 80 && PRESSURE_HIGH_RISK_DISABLED_ACTIONS.has(action.id)) {
      return actionAvailabilityResult(action, "disabled", "压力高危，先避开方案、调研、画图和打工类行动", state);
    }
    if (action.specialSkill) {
      return specialSkillAvailability(state, action);
    }
    return actionAvailabilityResult(action, "available", "", state);
  });
}

export function availableProjects(state, projectType) {
  const projects = projectType === "outsourcing" ? OUTSOURCING_PROJECTS : PART_TIME_PROJECTS;
  return projects.map((project) => projectAvailability(state, project, projectType));
}

function queueFixedEvent(state) {
  const event = FIXED_EVENTS[state.fixedEventIndex];
  if (!event) return;
  state.phase = "fixed_event";
  pushModal(state, {
    type: "fixed_event",
    eventId: event.id,
    title: event.title,
    body: event.body,
    image: event.image,
    blocks: true,
    options: event.options.map((option) => ({
      id: option.id,
      label: option.label,
      body: option.body,
      delta: previewDelta(state, option.delta, { preview: true }),
    })),
  });
}

function queueMentorSelection(state) {
  state.phase = "mentor_select";
  const [rngState, candidates] = sampleMany(state.rngState, MENTORS, 3);
  state.rngState = rngState;
  state.mentorCandidates = candidates.map((mentor) => mentor.id);
  pushModal(state, {
    type: "mentor_select",
    title: "选择导师",
    body: `${state.year === 1 ? "军训结束后，" : ""}选择 1 位导师作为本学年的导师。导师会发布本学期阶段任务。`,
    blocks: true,
    options: candidates.map((mentor) => ({
      id: mentor.id,
      label: `${mentor.name}：${mentor.title}`,
      body: mentor.intro,
    })),
  });
}

function queueCourseSelection(state) {
  state.phase = "course_select";
  const learnedCourseIds = new Set(state.courseHistory ?? []);
  pushModal(state, {
    type: "course_select",
    title: `${yearLabel(state.year)}学年选课`,
    body: "每学年选择 1 门大学课程。课程不占周行动次数，在本学年下半学期第 5 周结束后进入期末考试，答题后结算属性收益和 GPA 修正。",
    blocks: true,
    options: COURSES.map((course) => ({
      id: course.id,
      label: course.name,
      body: `${formatDelta(previewDelta(state, course.delta, { preview: true }))}。${course.context}`,
      state: learnedCourseIds.has(course.id) ? "disabled" : "available",
      reason: learnedCourseIds.has(course.id) ? "已学过" : "",
    })),
  });
}

function startWeek(state) {
  state.phase = "week_action";
  state.weeklySettlementApplied = false;
  state.week += 1;
  state.weekInSemester += 1;
  state.weeklyActionCounts = {};
  state.actionsPerWeek = BASE_ACTIONS_PER_WEEK;
  const actionDebt = Math.min(0, Number(state.actionsRemaining ?? 0));
  state.actionsRemaining = actionsForThisWeek(state) + actionDebt;
  state.wanliRoadActionDebt = Math.max(0, -state.actionsRemaining);
  log(state, "week_start", "week_start", `进入第 ${state.week} 周`, {});
  recordWeekStart(state);

  if (state.weekInSemester === 4 || (state.weekInSemester === 1 && state.semesterIndex !== 1)) {
    applyDelta(state, "living_allowance", "本月生活费到账", { money: monthlyAllowance(state) }, "week_start");
  }

  if (state.weekInSemester === 1) {
    log(state, "semester_start", "mentor_task", currentMentorTaskText(state), {});
  }

  if (state.weekInSemester === 5 && state.semesterIndex !== 9 && !state.modelMaterialBySemester[state.semesterIndex]) {
    queueModelMaterial(state);
  }

  if (shouldQueueInternshipOpenPrompt(state)) {
    state.systemFlags.internshipOpenPromptShown = true;
    pushModal(state, {
      type: "system_prompt",
      title: "实习系统开放",
      body: "你还记得大一时对自己说的话吗？“我要成为建筑师。”\n实习系统开放了，去离梦想更近的地方看看吧！",
      blocks: true,
      options: [{ id: "confirm", label: "知道了" }],
    });
  }

  maybeQueueCompetitionSubmissionReminder(state);
}

function shouldQueueInternshipOpenPrompt(state) {
  return state.semesterIndex === 3
    && state.weekInSemester === 2
    && state.systemFlags?.internshipOpenPromptShown !== true
    && !state.pendingInteraction;
}

function maybeQueueCompetitionSubmissionReminder(state) {
  state.systemFlags ??= {};
  if (state.systemFlags.competitionSubmissionReminderShown === true) return;
  if (state.pendingInteraction) return;
  if ((state.competitionSubmissionCount ?? 0) > 0 || (state.competitionRecords?.length ?? 0) > 0) return;
  const dueWeek = competitionSubmissionReminderDueWeek(state);
  if (!Number.isFinite(dueWeek)) {
    return;
  }
  if (state.week < dueWeek) return;

  state.systemFlags.competitionSubmissionReminderShown = true;
  pushModal(state, {
    type: "system_prompt",
    title: "竞赛投稿提醒",
    body: "你熬了那么多个通宵，总不能让图纸只在硬盘里吃灰吧？\n试一下吧，输了不丢人，赢了能吹五年。\n反正最坏的结果，也不过是像图纸被风吹到楼下——起码有人捡起来看了一眼。\n竞赛投稿提醒：你的方案该出去见见世面了。",
    blocks: true,
    options: [{ id: "confirm", label: "知道了" }],
  });
}

function competitionSubmissionReminderDueWeek(state) {
  const rawExplicit = state.systemFlags?.competitionSubmissionReminderDueWeek;
  const explicit = Number(rawExplicit);
  if (rawExplicit != null && Number.isFinite(explicit)) return explicit;
  const rawStarted = state.systemFlags?.competitionSubmissionReminderStartedWeek;
  const started = Number(rawStarted);
  return rawStarted != null && Number.isFinite(started) ? started + 12 : NaN;
}

function hasCompetitionSubmissionReminderDueWeek(state) {
  const dueWeek = state.systemFlags?.competitionSubmissionReminderDueWeek;
  const dueWeekNumber = Number(dueWeek);
  return dueWeek != null && Number.isFinite(dueWeekNumber);
}

function hasCompetitionSubmissionReminderStartedWeek(state) {
  const startedWeek = state.systemFlags?.competitionSubmissionReminderStartedWeek;
  const startedWeekNumber = Number(startedWeek);
  return startedWeek != null && Number.isFinite(startedWeekNumber);
}

function setCompetitionSubmissionReminderDueWeek(state) {
  if (hasCompetitionSubmissionReminderDueWeek(state)) return;
  if (hasCompetitionSubmissionReminderStartedWeek(state)) {
    state.systemFlags.competitionSubmissionReminderDueWeek = Number(state.systemFlags.competitionSubmissionReminderStartedWeek) + 12;
    return;
  }
  state.systemFlags.competitionSubmissionReminderStartedWeek = state.week;
  state.systemFlags.competitionSubmissionReminderDueWeek = state.week + 12;
}

function queueModelMaterial(state) {
  state.phase = "model_material";
  pushModal(state, {
    type: "model_material",
    title: "模型周材料选择",
    body: "模型周开始时必须选择一种材料方案。",
    blocks: true,
    options: MODEL_MATERIALS.map((material) => ({
      id: material.id,
      label: `${material.name} ￥${material.price}`,
      body: material.text,
      delta: previewDelta(state, material.delta, { preview: true }),
      state: "available",
      reason: "",
      warning: state.money >= material.price ? "" : "余额不足，选择后会触发破产结局",
    })),
  });
}

function queueProjectSelection(state, projectType) {
  const title = projectType === "outsourcing" ? "选择设计外包项目" : "选择校外兼职项目";
  pushModal(state, {
    type: "project_select",
    projectType,
    title,
    body: "",
    blocks: true,
    options: [{ id: "__back", label: "返回", body: "不承接项目，回到本周行动。", state: "available" }, ...availableProjects(state, projectType)],
  });
}

function consumeActionSlot(state, actionId, actionCost = 1) {
  state.actionsRemaining -= actionCost;
  state.weeklyActionCounts[actionId] = (state.weeklyActionCounts[actionId] ?? 0) + 1;
  state.semesterActionTally[actionId] = (state.semesterActionTally[actionId] ?? 0) + 1;
  state.actionTally[actionId] = (state.actionTally[actionId] ?? 0) + 1;
}

function calculateActionDelta(state, action) {
  const penalty = currentRiskPenalty(state);
  const delta = { ...action.baseDelta };
  if (action.progressBase !== undefined) {
    delta.progress = applyPositiveYieldPenalty(action.progressBase + progressModifier(state) + seniorProgressBonus(state, action), penalty);
  }
  if (action.qualityBase !== undefined) {
    delta.quality = applyPositiveYieldPenalty(action.qualityBase + qualityModifier(state) + seniorQualityBonus(state, action), penalty);
  }
  for (const key of ATTRIBUTE_KEYS) {
    if (delta[key] !== undefined) {
      delta[key] = applyPositiveYieldPenalty(delta[key], penalty);
    }
  }
  return delta;
}

function calculatePreviewActionDelta(state, action) {
  const delta = calculateActionDelta(state, action);
  return previewDelta(state, delta, {
    actionId: action.id,
    positiveKind: action.positiveKind,
    preview: true,
  });
}

function seniorProgressBonus(state, action) {
  return state.year === 5 && SENIOR_PROGRESS_BONUS_ACTIONS.has(action.id) ? 4 : 0;
}

function seniorQualityBonus(state, action) {
  return state.year === 5 && SENIOR_QUALITY_BONUS_ACTIONS.has(action.id) ? 4 : 0;
}

function performSpecialSkill(state) {
  const character = getCharacter(state);
  const skill = character?.skill;
  if (!skill) {
    return { ok: false, reason: "skill_not_found" };
  }
  state.specialSkill.lastUsedWeek = state.week;

  if (skill.reviewEase) {
    state.specialSkill.reviewEaseSemester = state.semesterIndex === 9 ? 10 : state.semesterIndex;
    state.specialSkill.reviewEase = skill.reviewEase;
    state.progress = clamp(state.progress, 0, progressCap(state));
    log(state, "week_action", `skill:${character.id}`, `专属技能：${character.skillName}`, {});
    return { ok: true };
  }

  applyDelta(state, `skill:${character.id}`, `专属技能：${character.skillName}`, skill.delta, "week_action", {
    actionId: "special_skill",
  });
  return { ok: true };
}

function startCourseExam(state) {
  state.phase = "course_exam";
  const course = getCourse(state);
  const questions = COURSE_QUESTIONS[course?.id] ?? COURSE_QUESTIONS.architecture_history;
  const [rngState, selected] = sampleMany(state.rngState, questionsWithIds(`course_${course?.id ?? "architecture_history"}`, questions), 3);
  state.rngState = rngState;
  state.courseExam = {
    courseId: course?.id,
    index: 0,
    questions: selected,
    answers: [],
  };
  pushModal(state, {
    type: "course_exam_intro",
    title: "课程期末考试",
    body: `${yearLabel(state.year)}下第 5 周结束，年度课程「${course?.name ?? "建筑史论"}」进入期末考试。\n按下开始考试后，将连续回答 3 道课程题。`,
    blocks: true,
    options: [{ id: "start", label: "开始考试" }],
  });
}

export function beginCourseExam(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "course_exam_intro") {
    return { ok: false, reason: "no_course_exam_intro_pending" };
  }
  resolvePendingInteraction(state, () => queueCourseQuestion(state));
  return { ok: true };
}

function shouldStartYearlyCourseExam(state) {
  return state.term === 2 && state.weekInSemester >= 5 && state.courseId && state.courseExam?.resolved !== true;
}

function queueYearStartPrompt(state) {
  const prompt = YEAR_START_PROMPTS[state.year] ?? {
    title: `大${state.year}学年开始`,
    body: `新的学年开始了。接下来先确定本学年的导师和年度课程，再进入${yearLabel(state.year)}上第 1 周。`,
  };
  state.phase = "year_start";
  pushModal(state, {
    type: "year_start",
    title: prompt.title,
    body: prompt.body,
    blocks: true,
    options: [{ id: "confirm", label: `进入${yearLabel(state.year)}学年` }],
  });
}

export const YEAR_START_PROMPTS = {
  2: {
    title: "专教生活",
    body: "感觉怎么样？\n此时的你应该已经在专教找到了那个“你的”角落。\n椅子上有你的屁股印，桌角贴着你写的“别动”，\n抽屉里塞着半包饼干和一卷用了一半的硫酸纸。\n大一你忙着适应，大二你开始学会生活。",
  },
  3: {
    title: "大学倒计时",
    body: "大学生活将近过半，此时的你开始深切感受到时间的重量。[[br]]大一的事好像就在昨天，但一转眼你已经是学长学姐。不过你不再无忧无虑，你开始思考：画完图之后呢？[[br]]你思虑万千，犹豫不决，你看起来好像总是不太开心。",
  },
  4: {
    title: "人生的十字路口",
    body: "大四了，你不再是大一那个连丁字尺都拿反的新生。\n你开始思考人生，就像思考一条总图上偏了两米的轴线——改还是不改？\n是保研、考研？出国留学？考公、考编、考选调？建筑就业还是转行？\n哪个都不好走，但哪个都比大一第一次交图的前夜轻松一点。\n反正你连通宵都扛过来了，还怕做选择吗？\n记住：选错了也可以改，建筑学不是教会了你“Ctrl+Z”吗？",
  },
  5: {
    title: "画了五年，该交图了！",
    body: "转眼就到大五了，你还记得第一次走进建院的那天吗？\n现在，菜单栏里的所有毕业通道都已开放——申请保研、考研升学、出国留学、考公考编选调、建筑就业和转行，每一条都通向一个不同的明天。\n看来黄色的树林里不止分出两条路，少年，你的选择是什么呢？\n五年的建筑学教了你怎么给别人盖房子，最后一年，你该给自己选一块地了。\n祝你好运，未来的建筑师。",
  },
};

function queueCourseQuestion(state) {
  const exam = state.courseExam;
  const question = exam.questions[exam.index];
  pushModal(state, {
    type: "course_question",
    title: `课程题 ${exam.index + 1} / ${exam.questions.length}`,
    body: question.q,
    blocks: true,
    options: Object.entries(question.options).map(([id, label]) => ({ id, label: `${id}. ${label}` })),
  });
}

function resolveCourseExam(state) {
  const course = getCourse(state);
  const correct = state.courseExam.answers.filter((answer) => answer.correct).length;
  let gpaModifier = correct === 3 ? 0.1 : correct === 2 ? 0 : correct === 1 ? -0.2 : -0.3;
  if (getCharacter(state)?.id === "town_exam_ace") {
    if (gpaModifier > 0) {
      gpaModifier += 0.1;
    } else if (gpaModifier < 0) {
      gpaModifier += 0.1;
    }
    gpaModifier = Math.round(gpaModifier * 100) / 100;
  }
  state.courseExam.resolved = true;
  applyDelta(state, `course:${course.id}`, `课程结算：${course.name}`, { ...course.delta, gpaModifier }, "course_exam");
  recordCourseExamResult(state, correct);
  checkAttributeAchievements(state);
  pushModal(state, {
    type: "course_result",
    title: "课程结算",
    body: `本学年课程「${course.name}」答对 ${correct} / 3 题，GPA 学期修正 ${formatSigned(gpaModifier)}。\n课程属性收益同步结算。`,
    blocks: true,
    options: [{ id: "confirm", label: state.weekInSemester >= WEEKS_PER_SEMESTER ? "进入评图" : "进入下一周" }],
  });
}

export function startReview(state) {
  state.phase = "review";
  const mentorResult = resolveMentorTask(state);
  const base = calculateReviewBase(state);
  state.reviewDraft = { base, mentorResult, strategyResult: null };
  recordMentorTaskResult(state, mentorResult);

  if (mentorResult) {
    const mentorResultStatus = mentorResult.success ? "成功" : "失败";
    pushModal(state, {
      type: "mentor_task_result",
      title: `导师任务结算：${mentorResultStatus}`,
      body: `${mentorResult.mentorName}阶段任务「${mentorResult.taskName}」${mentorResult.success ? "完成" : "未完成"}。\n${mentorResult.body}`,
      mentorTaskSucceeded: mentorResult.success,
      delta: mentorResult.delta,
      blocks: true,
      options: [{ id: "confirm", label: "选择汇报策略" }],
    });
    return;
  }

  queueReportStrategy(state);
}

function resolveMentorTask(state) {
  const mentor = MENTORS.find((item) => item.id === state.profile.mentorId);
  if (!mentor) return null;
  const success = mentorTaskSucceeded(state, mentor.id);
  const delta = success ? mentor.task.reward : mentor.task.penalty;
  const adjustedDelta = applyDelta(
    state,
    `mentor_task:${mentor.id}`,
    `${mentor.name}阶段任务「${mentor.task.name}」${success ? "完成" : "未完成"}`,
    delta,
    "review",
  );
  return {
    mentorName: mentor.name,
    taskName: mentor.task.name,
    conditionText: mentor.task.conditionText,
    success,
    body: success ? mentor.task.successText : mentor.task.failureText,
    delta: adjustedDelta,
  };
}

function queueReportStrategy(state) {
  const base = state.reviewDraft?.base ?? calculateReviewBase(state);
  if (!state.reviewDraft) {
    state.reviewDraft = { base, mentorResult: null, strategyResult: null };
  }
  recordReviewStart(state);

  pushModal(state, {
    type: "report_strategy",
    title: state.semesterIndex === 10 ? "毕业答辩：选择汇报策略" : "选择汇报策略",
    body: "",
    image: state.semesterIndex === 10 ? GAME_REQUIRED_IMAGES.graduationDefense : undefined,
    blocks: true,
    options: REPORT_STRATEGIES.map((strategy) => strategyAvailability(state, strategy, base)),
  });
}

function mentorTaskSucceeded(state, mentorId) {
  const tally = state.semesterActionTally;
  switch (mentorId) {
    case "mentor_wang":
      return (tally.outsourcing ?? 0) >= 2 && (tally.site_research ?? 0) >= 3;
    case "mentor_ge":
      return (tally.design_iteration ?? 0) >= 3 && (tally.read_exhibition ?? 0) >= 3;
    case "mentor_lin":
      return state.quality >= 75 && (tally.design_iteration ?? 0) >= 5;
    case "mentor_chen":
      return (tally.site_research ?? 0) >= 3 && (tally.read_exhibition ?? 0) >= 2;
    case "mentor_zhou":
      return (tally.learn_ai_software ?? 0) >= 3 || state.semesterAttributeGrowth.software >= 15;
    case "mentor_xu":
      return state.progress >= 90 && state.pressure < 70;
    case "mentor_han":
      return state.quality >= 90 || (state.competitionSubmissionCount ?? 0) >= 1;
    default:
      return false;
  }
}

function strategyAvailability(state, strategy, base) {
  let available = true;
  let reason = "";
  const begPassAllowed = canBegPass(state, base);

  if (strategy.id === "beg_pass" && !begPassAllowed) {
    available = false;
    if (base.progressGateFailed) {
      reason = "进度未达标，直接触发 F";
    } else if (base.failureKind !== "quality") {
      reason = "只有质量导致的 F 可以求情";
    } else if (!begPassStateGate(state)) {
      reason = "需要质量 < 60 且精力 < 60，或质量 < 60 且压力 > 50";
    }
  }
  if (strategy.requirements) {
    const missing = Object.entries(strategy.requirements).find(([key, value]) => state.attributes[key] < value);
    if (missing) {
      available = false;
      reason = `${attributeLabel(missing[0])}不足 ${missing[1]}`;
    }
  }

  return {
    id: strategy.id,
    label: strategy.name,
    body: reportStrategyOptionBody(strategy),
    state: available ? "available" : "disabled",
    reason,
  };
}

function reportStrategyOptionBody(strategy) {
  return [
    `简介：${strategy.intro}`,
    `门槛：${reportStrategyRequirementText(strategy)}`,
    `概率：固定成功率 ${Math.round(strategy.successRate * 100)}%`,
    `成功：${reportStrategyOutcomeText(strategy, true)}`,
    `失败：${reportStrategyOutcomeText(strategy, false)}`,
  ].join("\n");
}

function reportStrategyRequirementText(strategy) {
  if (strategy.id === "beg_pass") {
    return "进度硬门槛已达成，基础评级因质量不足为 F，且质量评图分 < 60，\n并满足精力 < 60 或压力 > 50";
  }
  const entries = Object.entries(strategy.requirements ?? {});
  if (entries.length === 0) return "无门槛";
  return entries.map(([key, value]) => `${attributeLabel(key)} >= ${value}`).join("，");
}

function reportStrategyOutcomeText(strategy, succeeded) {
  if (strategy.id === "read_ppt") {
    return succeeded
      ? "基础评级为 S / A / B / C 时最终评级下降 1 档，D / F 不再降档；作品分 -4"
      : "同成功结算";
  }
  const branch = succeeded ? strategy.success : strategy.failure;
  if (strategy.id === "beg_pass") {
    return succeeded
      ? "最终图纸评级改为 D；最终作品分至少 60，最高不超过 69；压力 +8；精力 -4"
      : "维持 F；作品分 -2；压力 +10；精力 -6";
  }
  return succeeded
    ? `最终图纸评级上升 1 档，最高可升至 S；作品分 +${branch.score}；压力 +${branch.pressure}`
    : `最终图纸评级下降 1 档，最低降至 D；基础 F 时仍为 F；作品分 ${branch.score}；压力 +${branch.pressure}`;
}

function applyShopItemEffects(state, item) {
  const effects = item.effects ?? {};
  const shopEffects = state.shopEffects;

  if (effects.weeklySemester) {
    const current = shopEffects.weeklyBySemester[state.semesterIndex] ?? {};
    shopEffects.weeklyBySemester[state.semesterIndex] = mergeDelta(current, effects.weeklySemester);
  }
  if (effects.weeklyPermanent) {
    shopEffects.weeklyPermanent = mergeDelta(shopEffects.weeklyPermanent, effects.weeklyPermanent);
  }
  if (effects.drawingPressureBonus) {
    shopEffects.drawingPressureBonus += effects.drawingPressureBonus;
  }
  if (effects.musicMembership) {
    shopEffects.musicMembership = {
      ...effects.musicMembership,
      purchasedWeek: state.week,
      year: state.year,
    };
    shopEffects.musicSwitch = true;
  }
  if (effects.drawingProgress) {
    shopEffects.drawingProgressBonus += effects.drawingProgress;
  }
  if (effects.summerPositiveBonus) {
    shopEffects.summerPositiveBonus += effects.summerPositiveBonus;
  }
  if (effects.restDelta) {
    shopEffects.restDelta = mergeDelta(shopEffects.restDelta, effects.restDelta);
  }
  if (effects.exerciseYear) {
    shopEffects.exerciseYear = { ...effects.exerciseYear, year: state.year };
  }
  if (effects.excuseTokens) {
    shopEffects.excuseTokens += effects.excuseTokens;
  }
  if (effects.currentWeekActions) {
    state.actionsPerWeek += effects.currentWeekActions;
    state.actionsRemaining += effects.currentWeekActions;
  }
  if (effects.blockPluginEvents) {
    shopEffects.blockPluginEvents = true;
  }
  if (effects.modelNegativeLossReduction || effects.blockModelNegativeEvents) {
    shopEffects.modelNegativeLossReduction = true;
  }
  if (effects.blockComputerEvents) {
    shopEffects.blockComputerEvents = true;
  }
  if (effects.musicSwitch) {
    shopEffects.musicSwitch = true;
  }
}

function mergeDelta(target = {}, source = {}) {
  const merged = { ...target };
  for (const [key, value] of Object.entries(source ?? {})) {
    merged[key] = (merged[key] ?? 0) + value;
  }
  return merged;
}

export function availableShopItems(state) {
  return SHOP_ITEMS.map((item) => shopItemAvailability(state, item));
}

function canBegPass(state, base) {
  return !base.progressGateFailed && base.failureKind === "quality" && begPassStateGate(state, base);
}

function begPassStateGate(state, base = null) {
  const qualityScore = base?.qualityScore ?? reviewQualityScore(state);
  return qualityScore < 60 && (state.energy < 60 || state.pressure > 50);
}

function applyReportStrategyResult(state, base, strategy, branch, succeeded) {
  const character = getCharacter(state);
  const delta = {};
  if (branch.pressure) delta.pressure = branch.pressure;
  if (branch.energy) delta.energy = branch.energy;
  if (character?.id === "corbusier_heir") {
    delta.pressure = (delta.pressure ?? 0) + 3;
  }
  let adjustedDelta = {};
  if (Object.keys(delta).length > 0) {
    adjustedDelta = applyDelta(state, `report:${strategy.id}`, `${strategy.name}${succeeded ? "成功" : "失败"}`, delta, "review");
  }

  let finalGrade = base.baseGrade;
  let finalScore = base.baseScore;
  let scoreDelta = branch.score ?? 0;

  if (character?.id === "design_enabler") {
    if (succeeded) scoreDelta += 3;
    if (!succeeded && scoreDelta < 0) scoreDelta += 1;
  }

  if (branch.gradeShift) {
    finalGrade = branch.gradeShift < 0 && base.baseGrade === "D" ? "D" : shiftGrade(base.baseGrade, branch.gradeShift);
    if (succeeded && branch.gradeShift > 0 && base.baseGrade === "S") {
      scoreDelta += 5;
    }
  }
  if (succeeded && branch.rescueF && base.failureKind === "quality") {
    finalGrade = "D";
    finalScore = Math.max(60, finalScore);
  }
  if (succeeded && branch.readPpt && ["S", "A", "B", "C"].includes(base.baseGrade)) {
    finalGrade = shiftGrade(base.baseGrade, -1);
  }

  if (base.progressGateFailed) {
    finalGrade = "F";
    finalScore = 0;
  } else {
    finalScore = clamp(finalScore + scoreDelta, 0, 100);
  }
  return {
    strategyId: strategy.id,
    succeeded,
    finalGrade,
    finalScore,
    delta: adjustedDelta,
  };
}

export function queueReviewResult(state, record) {
  const copy = reviewResultCopy(record);
  pushModal(state, {
    type: "review_result",
    title: `评图等级 ${record.finalGrade}: ${copy.title}`,
    grade: record.finalGrade,
    semesterIndex: record.semesterIndex,
    body: `${copy.body}[[br]]作品分：${record.finalScore}，本学期 GPA：${record.semesterGpa.toFixed(2)}。`,
    blocks: true,
    options: [{ id: "confirm", label: reviewResultConfirmLabel(state) }],
  });
}

function reviewResultConfirmLabel(state) {
  if (isGraduationFailedEndingPending(state)) return "恭喜你同学，你被延毕了！";
  if (state.ending) return "查看结局";
  return "继续";
}

function isGraduationFailedEndingPending(state) {
  return state.pendingEnding === "graduation_failed";
}

function queueFirstPortfolioEntryPrompt(state, record) {
  if (!record || (record.portfolioAdded ?? 0) <= 0) return;
  state.systemFlags ??= {};
  setCompetitionSubmissionReminderDueWeek(state);
  if (state.systemFlags.portfolioFirstEntryPromptShown === true) return;
  state.systemFlags.portfolioFirstEntryPromptShown = true;
  pushModal(state, {
    type: "system_prompt",
    title: "恭喜你，作品集开始有了厚度",
    kicker: "系统提醒",
    body: "你的课程设计已经正式收入作品集。\n你可以去个人作品集的入口里看看它的展板和分数记录——\n那些通宵、修改和被老师追问的瞬间，现在终于有了一页能被翻到的证明。\n加油同学！继续坚持走下去！",
    blocks: true,
    options: [{ id: "confirm", label: "知道了" }],
  });
}

const REVIEW_RESULT_COPY = {
  S: {
    title: "封神之作",
    body: "该设计方案，建构逻辑自洽，[[br]]剖面诗学与技术图纸高度统一，已达到专业实践层面的完成度，是建筑学基础训练的优秀范例。",
  },
  A: {
    title: "优秀作品",
    body: "整体方案可圈可点，建构逻辑基本没有断裂。老师说：[[br]]“这张图离完美还差一步，但这一步我会等你。”",
  },
  B: {
    title: "平庸之辈",
    body: "这张图纸没有硬伤，但也没有亮点。[[br]]功能分区正确，空间体验平庸。[[br]]你只是完成了任务书，并没有完成设计。",
  },
  C: {
    title: "勉强完成",
    body: "图纸完成了任务书的基本要求，概念与表达之间出现了断层。[[br]]老师说：“图里根本没有一句你非说不可的话。”",
  },
  D: {
    title: "低空飞过",
    body: "图纸完全没有体现“场所精神”，你的方案像是可以放在任何一块地上的通用盒子。",
  },
  F_PROGRESS: {
    title: "回家吧孩子",
    body: "老师问：“你的总图呢？”[[br]]交图时，平立剖只凑了一半，排版空着。[[br]]你说“还来得及”，结果什么都没来得及。[[br]]这门课，你连交的资格都没有！",
  },
  F_QUALITY: {
    title: "挂科的沸物",
    body: "分析图画得像儿童画，平面上的窗到了立面人间蒸发，[[br]]你画图的时候脑子也跟着蒸发了？[[br]]这不是能力问题，是你根本没长记性。[[br]]同样的错误犯了一学期，你当老师是瞎子？[[br]]评语：“挂科！”",
  },
};

function reviewResultCopy(record) {
  if (record.finalGrade !== "F") return REVIEW_RESULT_COPY[record.finalGrade] ?? REVIEW_RESULT_COPY.C;
  return record.progress < record.progressRequirement ? REVIEW_RESULT_COPY.F_PROGRESS : REVIEW_RESULT_COPY.F_QUALITY;
}

function commitRouteParticipation(state, option) {
  const outcome = lockedRouteOutcome(state, option);
  state.routeParticipation = {
    optionId: option.id,
    group: option.group,
    route: option.route,
    target: option.target,
    label: option.label,
    lockedEnding: outcome?.ending ?? null,
    outcome,
    semesterIndex: state.semesterIndex,
    week: state.week,
  };
  log(state, "route", `route:${option.id}`, `路线正式参与：${option.label}`, {});
  recordRouteParticipation(state, option);
}

function queuePostRouteParticipation(state, option) {
  if (option.id === "career_startup") {
    return;
  }
  if (routeExamType(option)) {
    startRouteExam(state, option);
    return;
  }
  queueRouteWaitingResult(state, option);
}

function lockedRouteOutcome(state, option) {
  if (option.id === "career_startup") {
    return {
      kind: "contract",
      ending: option.successEnding,
      finalRequirementsMet: true,
      probability: 1,
      passed: true,
    };
  }
  if (!shouldLockRouteResult(option)) {
    return null;
  }

  const finalRequirementsMet = routeRequirementsMet(state, option.finalRequirements ?? option.requirements);
  if (!finalRequirementsMet) {
    return {
      kind: "probability",
      ending: option.fallbackEnding,
      finalRequirementsMet,
      probability: 0,
      roll: null,
      passed: false,
    };
  }

  const probability = routeOutcomeProbability(state, option);
  const [rngState, roll] = randomFloat(state.rngState);
  state.rngState = rngState;
  const passed = roll <= probability;
  return {
    kind: "probability",
    ending: passed ? option.successEnding : option.fallbackEnding,
    finalRequirementsMet,
    probability,
    roll,
    passed,
  };
}

function shouldLockRouteResult(option) {
  return option.route === "留学" || option.route === "建筑工作" || (option.route === "转行" && option.id !== "career_startup");
}

function routeOutcomeProbability(state, option) {
  if (option.route === "留学") {
    return overseasApplicationProbability(state, option);
  }
  return routeRequirementsFarExceeded(state, option) ? 1 : 0.8;
}

const OVERSEAS_PROBABILITY_BY_TIER = {
  s: { base: 0.58, cap: 0.94 },
  a: { base: 0.66, cap: 0.96 },
  b: { base: 0.76, cap: 0.98 },
  c: { base: 0.86, cap: 0.99 },
};

function overseasApplicationProbability(state, option) {
  const requirements = option.finalRequirements ?? option.requirements ?? {};
  if (!routeRequirementsMet(state, requirements)) {
    return 0;
  }
  const tier = String(option.overseas?.tier ?? "b").toLowerCase();
  const rule = OVERSEAS_PROBABILITY_BY_TIER[tier] ?? OVERSEAS_PROBABILITY_BY_TIER.b;
  const ieltsExcess = Math.max(0, (state.ieltsScore ?? 0) - (requirements.ielts ?? 0));
  const portfolioExcess = Math.max(0, (state.portfolio ?? 0) - (requirements.portfolio ?? 0));
  const gpaExcess = Math.max(0, (state.gpa ?? 0) - (requirements.gpa ?? 0));
  const ieltsBonus = Math.min(0.1, ieltsExcess * 0.1);
  const portfolioBonus = Math.min(0.14, portfolioExcess * 0.0014);
  const gpaBonus = Math.min(0.12, gpaExcess * 0.2667);
  const probability = Math.min(rule.cap, rule.base + ieltsBonus + portfolioBonus + gpaBonus);
  return Math.round(probability * 100) / 100;
}

function routeRequirementsFarExceeded(state, option) {
  const requirements = option.finalRequirements ?? option.requirements ?? {};
  let checks = 0;
  let exceeded = 0;
  const addCheck = (current, required, margin) => {
    if (required === undefined) return;
    checks += 1;
    if ((current ?? 0) >= required + margin) {
      exceeded += 1;
    }
  };

  addCheck(state.portfolio ?? 0, requirements.portfolio, 60);
  if (option.route === "建筑工作") {
    addCheck(state.internshipValue ?? 0, requirements.internshipValue, 1);
  }
  if (option.route === "转行") {
    addCheck(state.aiExperience ?? 0, requirements.aiExperience, 1);
  }

  for (const [key, value] of Object.entries(requirements.attributes ?? {})) {
    addCheck(state.attributes?.[key] ?? 0, value, 8);
  }
  if (requirements.allAttributesAtLeast !== undefined) {
    for (const key of ATTRIBUTE_KEYS) {
      addCheck(state.attributes?.[key] ?? 0, requirements.allAttributesAtLeast, 5);
    }
  }

  if (checks === 0) {
    return false;
  }
  return exceeded >= Math.min(2, checks);
}

function routeExamType(option) {
  if (option.route === "保研" || option.route === "考研") {
    return "academic";
  }
  if (option.route === "选调" || option.route === "考公" || option.route === "考编") {
    return "civil";
  }
  return null;
}

function pendingRouteExamOption(state) {
  const optionId = state.routeParticipation?.optionId;
  const option = ROUTE_OPTIONS.find((item) => item.id === optionId);
  const type = option ? routeExamType(option) : null;
  if (!type || routeExamRecorded(state, type)) {
    return null;
  }
  return option;
}

function routeExamRecorded(state, type) {
  if (type === "academic") {
    return Boolean(state.routeExamResults?.academicTaken);
  }
  if (type === "civil") {
    return Boolean(state.routeExamResults?.civilTaken);
  }
  return false;
}

function startRouteExam(state, option, { returnAfter = null } = {}) {
  const type = routeExamType(option);
  if (!type) {
    return;
  }
  const returnPhase = state.phase;
  state.phase = "route_exam";
  const bank = questionsWithIds(`route_${type}`, type === "academic" ? ACADEMIC_ROUTE_QUESTIONS : CIVIL_ROUTE_QUESTIONS);
  const [rngState, selected] = sampleRouteExamQuestions(state.rngState, bank);
  state.rngState = rngState;
  state.routeExam = {
    type,
    optionId: option.id,
    index: 0,
    questions: selected,
    answers: [],
    returnAfter,
    returnPhase,
  };
  pushModal(state, {
    type: "route_exam_intro",
    title: routeExamIntroTitle(option, type),
    body: `你已正式参与「${routeExamParticipationLabel(option)}」。[[br]]接下来请连续完成 10 道考试题。`,
    blocks: true,
    options: [{ id: "start", label: "开始考试" }],
  });
}

function routeExamIntroTitle(option, type) {
  if (type === "academic") {
    return option?.route === "保研" ? "保研笔试" : "考研笔试";
  }
  return "行测考试";
}

function routeQuestionTitle(exam, index, total) {
  if (exam.type === "academic") {
    const option = ROUTE_OPTIONS.find((item) => item.id === exam.optionId);
    const label = option?.route === "保研" ? "保研题" : "考研题";
    return `${label} ${index} / ${total}`;
  }
  return `路线考试 ${index} / ${total}`;
}

function sampleRouteExamQuestions(rngState, bank) {
  let nextRngState = rngState;
  const easyQuestions = bank.filter((question) => question.difficulty === "easy");
  const hardQuestions = bank.filter((question) => question.difficulty === "hard");
  const [afterEasy, selectedEasy] = sampleMany(nextRngState, easyQuestions, ROUTE_EXAM_EASY_QUESTION_COUNT);
  nextRngState = afterEasy;
  const [afterHard, selectedHard] = sampleMany(nextRngState, hardQuestions, ROUTE_EXAM_HARD_QUESTION_COUNT);
  nextRngState = afterHard;
  let selected = [...selectedEasy, ...selectedHard];

  if (selected.length < ROUTE_EXAM_QUESTION_COUNT) {
    const selectedSet = new Set(selected);
    const remaining = bank.filter((question) => !selectedSet.has(question));
    const [afterFill, selectedFill] = sampleMany(nextRngState, remaining, ROUTE_EXAM_QUESTION_COUNT - selected.length);
    nextRngState = afterFill;
    selected = [...selected, ...selectedFill];
  }

  return sampleMany(nextRngState, selected, selected.length);
}

function queueRouteQuestion(state) {
  const exam = state.routeExam;
  const question = exam.questions[exam.index];
  pushModal(state, {
    type: "route_question",
    examType: exam.type,
    title: routeQuestionTitle(exam, exam.index + 1, exam.questions.length),
    body: question.q,
    blocks: true,
    options: Object.entries(question.options).map(([id, label]) => ({ id, label: `${id}. ${label}` })),
  });
}

function resolveRouteExam(state) {
  const exam = state.routeExam;
  const correct = exam.answers.filter((answer) => answer.correct).length;
  if (exam.type === "academic") {
    state.routeExamResults.academicCorrect = correct;
    state.routeExamResults.academicTaken = true;
  } else if (exam.type === "civil") {
    state.routeExamResults.civilCorrect = correct;
    state.routeExamResults.civilTaken = true;
  }
  log(state, "route", `route_exam:${exam.type}`, "路线考试完成，结果已内部记录", {});
  pushModal(state, {
    type: "route_exam_result",
    title: "等待结果",
    body: "同学这段时间你辛苦了，请静候佳音！",
    blocks: true,
    options: [{ id: "confirm", label: "继续" }],
  });
}

function queueRouteWaitingResult(state, option) {
  queueChoiceResult(state, "等待结果", "同学这段时间你辛苦了，请静候佳音！", {}, {
    titleSuffix: false,
    confirmLabel: "继续",
  });
}

function startGraduationFlow(state) {
  state.phase = "graduation_ceremony";
  recordGraduationCeremonyStart(state);
  pushModal(state, {
    type: "graduation_ceremony",
    title: "毕业典礼",
    kicker: "固定流程",
    body: "答辩结束后，你坐进报告厅。[[br]]灯光落在学士服的肩线上，五年的课题、模型、图纸和争吵都安静下来。",
    image: GAME_REQUIRED_IMAGES.graduationCeremony,
    blocks: true,
    options: [{ id: "confirm", label: "走，拍毕业照去！" }],
  });
}

function queueEndingMemory(state) {
  state.phase = "ending_memory";
  pushModal(state, {
    type: "ending_memory",
    title: "毕业照",
    kicker: "固定流程",
    memoryStep: "first_photo",
    body: "学士服穿在身上有点大，帽子怎么也戴不正。[[br]]摄影师喊“三、二、一”，所有人同时把学士帽扔向天空。\n帽子落下来的那一秒，你忽然看见了五年前的自己——[[br]]站在校门口，拖着行李箱，仰头看建院的招牌。\n那时候你觉得五年很长，长得像画不完的剖面。现在它短得像一声快门。[[br]]你站在人群里，左右是熟悉的脸，有些人你甚至叫不全名字，[[br]]但你知道，你们共享过同一间教室的灯、同一卷硫酸纸的痕迹、同一把美工刀划破手指的疼。",
    image: GAME_REQUIRED_IMAGES.graduationPhoto,
    blocks: true,
    options: [{ id: "confirm", label: "再来一张" }],
  });
}

function queueEndingMemorySecondPhoto(state) {
  state.phase = "ending_memory";
  pushModal(state, {
    type: "ending_memory",
    title: "毕业照",
    kicker: "固定流程",
    memoryStep: "second_photo",
    body: "摄影师说“再来一张”，你把手搭在旁边同学肩上，他冲你比了个耶。[[br]]你想起某个凌晨，你们一起在专教改图，他分了你半罐红牛，[[br]]你说“谢了”，他说“别废话，快画”。\n那些夜晚回不去了。\n快门再次按下，这张照片里，你笑得比第一张自然。\n你知道，再过很多年，你翻到这张毕业照时，[[br]]会记得今天的风、阳光、还有身边这些人的声音。[[br]]身边的同学在自拍、在拥抱、在大喊“毕业了”，你也跟着笑了。[[br]]可你知道，你心里有一块地方，安静得像专教深夜的走廊。[[br]]你问自己：这五年，我到底变成了谁？没有答案。[[br]]但你知道，[[br]]你不再是那个会在图纸前哭的小孩了。[[br]]你对自己说：就这样吧，挺好的。[[br]]然后你弯腰，[[br]]捡起掉在地上的学士帽，拍了拍灰，走向下一个路口。",
    image: GAME_REQUIRED_IMAGES.graduationPhoto,
    blocks: true,
    options: [{ id: "confirm", label: "从前有个少年，他/她以为五年很长……" }],
  });
}

function queueEndingMemoryAnimation(state) {
  state.phase = "ending_memory";
  pushModal(state, {
    type: "ending_memory",
    title: "结尾回忆",
    kicker: "固定流程",
    memoryStep: "ending_animation",
    body: "结尾回忆动画播放中。",
    blocks: true,
    options: [{ id: "confirm", label: "同学，毕业快乐！" }],
  });
}

function queueSummerEvent(state) {
  const eventId = state.summerQueue[0];
  const event = SUMMER_EVENTS.find((item) => item.id === eventId);
  if (!event) {
    advanceSemester(state);
    return;
  }
  state.phase = "summer_event";
  pushModal(state, {
    type: "summer_event",
    eventId: event.id,
    title: event.title,
    body: event.body,
    blocks: true,
    options: event.options.map((option) => ({
      id: option.id,
      label: option.label,
      body: option.body,
      image: option.image,
      delta: previewDelta(state, summerOptionDelta(state, option), { preview: true }),
    })),
  });
}

function continueAfterSummerEvent(state) {
  if (state.pendingInteraction || state.ending) {
    return { ok: true };
  }
  if (state.phase !== "summer_event") {
    return { ok: false, reason: "not_summer_event_phase" };
  }

  state.summerQueue = Array.isArray(state.summerQueue)
    ? state.summerQueue.filter(Boolean)
    : [];

  if (state.summerQueue.length > 0) {
    queueSummerEvent(state);
  } else {
    advanceSemester(state);
  }
  return { ok: true };
}

function summerOptionDelta(state, option) {
  const bonus = state.shopEffects?.summerPositiveBonus ?? 0;
  if (!bonus) return { ...option.delta };
  const bonusKeys = new Set(["progress", "quality", ...ATTRIBUTE_KEYS]);
  return Object.fromEntries(
    Object.entries(option.delta ?? {}).map(([key, value]) => [
      key,
      bonusKeys.has(key) && value > 0 ? value + bonus : value,
    ]),
  );
}

function advanceSemester(state) {
  if (state.semesterIndex >= 10) {
    settleFinalEnding(state);
    recordFinalEnding(state);
    return;
  }
  const previousYear = state.year;
  const previousSemesterIndex = state.semesterIndex;
  if (previousSemesterIndex === 9) {
    state.gpaModifier = 0;
  }
  state.semesterIndex += 1;
  updateCalendarFromSemester(state);
  if (state.year !== previousYear) {
    state.maxEnergy = 100;
    state.energy = Math.min(state.energy, state.maxEnergy);
  }
  state.weekInSemester = 0;
  state.actionsRemaining = 0;
  state.weeklyActionCounts = {};
  state.semesterActionTally = {};
  state.semesterAttributeGrowth = emptyAttributes();
  state.courseExam = null;
  state.currentModelMaterialId = null;
  if (state.semesterIndex % 2 === 1) {
    state.musicYearStarted = false;
  }
  log(state, "semester_start", "semester_advance", `进入${yearLabel(state.year)}${state.term === 1 ? "上" : "下"}`, {});

  const routeOption = pendingRouteExamOption(state);
  if (state.semesterIndex === 10 && routeOption) {
    startRouteExam(state, routeOption, { returnAfter: "start_week" });
    return;
  }

  if (state.semesterIndex > 1 && state.semesterIndex % 2 === 1) {
    state.courseId = null;
    state.courseYear = null;
    queueYearStartPrompt(state);
  } else if (state.term === 2) {
    startWeek(state);
  } else {
    queueCourseSelection(state);
  }
}

function specialSkillAvailability(state, action) {
  const character = getCharacter(state);
  if (!character) {
    return actionAvailabilityResult(action, "disabled", "尚未选择角色", state);
  }
  if (state.specialSkill.lastUsedWeek !== null && state.week - state.specialSkill.lastUsedWeek < 10) {
    return actionAvailabilityResult(action, "disabled", "专属技能冷却中", state);
  }
  const skill = character.skill;
  if (skill.require?.pressureMin && state.pressure < skill.require.pressureMin) {
    return actionAvailabilityResult(action, "disabled", `压力需达到 ${skill.require.pressureMin}`, state);
  }
  const moneyDelta = skill.delta?.money ?? 0;
  if (moneyDelta < 0 && state.money + moneyDelta < 0) {
    return {
      ...actionAvailabilityResult(action, "available", "", state),
      warning: "余额不足，使用后会触发破产结局",
    };
  }
  return actionAvailabilityResult(action, "available", "", state);
}

function projectAvailability(state, project, projectType) {
  const delta = projectPreviewDelta(state, project, projectType);
  const actionCost = projectActionCost(project);
  const base = {
    id: project.id,
    label: project.name,
    body: project.text,
    delta,
    displayDelta: projectDisplayDelta(delta, actionCost),
    requirementText: projectRequirementText(project),
    actionCost,
  };
  if (paidWorkWeeklyLimitReached(state)) {
    return {
      ...base,
      state: "disabled",
      reason: "本周外包/兼职次数已达合计上限",
    };
  }
  if (projectType === "outsourcing" && !requirementsMet(state, project)) {
    return {
      ...base,
      state: "disabled",
      reason: "能力门槛未满足",
    };
  }
  if ((state.actionsRemaining ?? 0) < actionCost) {
    return {
      ...base,
      state: "disabled",
      reason: `剩余行动次数不足，需要 ${actionCost} 次行动`,
    };
  }
  return {
    ...base,
    state: "available",
    reason: "",
  };
}

function projectPreviewDelta(state, project, projectType) {
  return previewDelta(state, calculateProjectDelta(state, project, projectType), {
    actionId: projectType,
    preview: true,
  });
}

function calculateProjectDelta(state, project, projectType) {
  return applyProjectRiskPenalty(projectBaseDelta(state, project, projectType), currentRiskPenalty(state));
}

function projectBaseDelta(state, project, projectType) {
  const delta = { ...project.delta };
  const character = getCharacter(state);
  if (character?.id === "future_boss") {
    delta.money = (delta.money ?? 0) + (projectType === "outsourcing" ? 200 : 100);
  }
  return delta;
}

function applyProjectRiskPenalty(delta, penalty) {
  if (penalty <= 0) {
    return delta;
  }

  const adjusted = { ...delta };
  for (const key of ["progress", "quality", ...ATTRIBUTE_KEYS]) {
    if (adjusted[key] > 0) {
      adjusted[key] = applyPositiveYieldPenalty(adjusted[key], penalty);
    }
  }
  return adjusted;
}

function shopItemAvailability(state, item) {
  const limit = item.limit ?? { scope: "run", count: 1 };
  const purchases = state.achievementTally?.shopPurchases ?? [];
  const usedCount = purchases.filter((purchase) => shopPurchaseInScope(state, purchase, item.id, limit.scope)).length;
  if (usedCount >= limit.count) {
    return {
      ...shopItemView(state, item),
      state: "disabled",
      reason: `${item.limitText ?? "已达限购"}`,
    };
  }
  if (state.money < item.price) {
    return {
      ...shopItemView(state, item),
      state: "disabled",
      reason: "余额不足",
    };
  }
  return {
    ...shopItemView(state, item),
    state: "available",
    reason: "",
  };
}

function shopPurchaseInScope(state, purchase, itemId, scope) {
  if (purchase.id !== itemId) return false;
  if (scope === "week") return purchase.week === state.week;
  if (scope === "semester") return purchase.semesterIndex === state.semesterIndex;
  if (scope === "year") return purchase.year === state.year;
  return true;
}

function shopItemView(state, item) {
  const delta = previewDelta(state, item.previewDelta ?? item.delta, { skipPassive: true, preview: true });
  const effectText = shopEffectText(item, delta, { preserveLayout: true });
  return {
    id: item.id,
    name: item.name,
    label: item.name,
    category: item.category,
    icon: item.icon,
    price: item.price,
    text: item.text,
    effectText,
    limitText: item.limitText,
    body: `${item.text} ${effectText || formatDelta(delta)}`,
    delta,
  };
}

function shopResultConfirmLabel(item, delta = item.delta) {
  const money = delta?.money ?? item.delta?.money ?? -item.price;
  const moneyText = Number.isFinite(money) && money !== 0 ? formatDelta({ money }) : "";
  const effectText = shopEffectText(item, delta);
  return [moneyText, effectText].filter(Boolean).join("，") || formatDelta(delta);
}

function shopEffectText(item, delta = item.delta, options = {}) {
  const rawImmediate = deltaWithoutMoney(item.previewDelta ?? item.delta);
  const adjustedImmediate = deltaWithoutMoney(delta);
  if (item.effectText && sameDelta(rawImmediate, adjustedImmediate)) {
    return item.effectText;
  }
  if (options.preserveLayout && item.effectText?.includes("\n")) {
    const preserved = shopPreservedLayoutEffectText(item, adjustedImmediate);
    if (preserved) return preserved;
  }

  return [deltaText(adjustedImmediate), ...shopOngoingEffectParts(item.effects)]
    .filter(Boolean)
    .join("，");
}

function shopPreservedLayoutEffectText(item, adjustedImmediate) {
  const effects = item.effects ?? {};
  const byId = {
    music_membership: () => [
      `${effects.musicMembership?.durationWeeks ?? 12} 周内画图压力增加 ${formatSigned(effects.musicMembership?.drawingPressureBonus ?? 0)}`,
      [formatDeltaForKeys(adjustedImmediate, ["aesthetic"]), "可切换音乐"].filter(Boolean).join("，"),
    ],
    starbucks_week_card: () => [
      formatDeltaForKeys(adjustedImmediate, ["pressure", "energy"]),
      `当前周额外行动次数 +${effects.currentWeekActions ?? 0}`,
    ],
    gym_annual_card: () => [
      formatDeltaForKeys(adjustedImmediate, ["maxEnergy", "social"]),
      [`健身运动精力消耗 ${formatSigned(effects.exerciseYear?.energyCost ?? 0)}`, `压力额外 ${formatSigned(effects.exerciseYear?.pressure ?? 0)}`].join("，"),
    ],
    sketchbook: () => [
      formatDeltaForKeys(adjustedImmediate, ["design", "aesthetic"]),
      formatDeltaForKeys(adjustedImmediate, ["resilience", "pressure"]),
    ],
    marker_pen_set: () => [
      formatDeltaForKeys(adjustedImmediate, ["design", "aesthetic"]),
      `暑假写生正向数值全部 +${effects.summerPositiveBonus ?? 0}`,
    ],
    tracing_paper_pack: () => [
      formatDeltaForKeys(adjustedImmediate, ["design", "aesthetic"]),
      formatDeltaForKeys(adjustedImmediate, ["progress", "quality"]),
    ],
    form_space_order: () => [
      formatDeltaForKeys(adjustedImmediate, ["design", "aesthetic"]),
      formatDeltaForKeys(adjustedImmediate, ["presentation", "pressure"]),
    ],
    modern_architecture_history: () => [
      formatDeltaForKeys(adjustedImmediate, ["design", "aesthetic"]),
      formatDeltaForKeys(adjustedImmediate, ["pressure"]),
    ],
    modeling_plugin_membership: () => [
      formatDeltaForKeys(adjustedImmediate, ["software"]),
      "本局不再触发插件事故类型的随机事件",
    ],
    master_portfolio: () => [
      formatDeltaForKeys(adjustedImmediate, ["design", "aesthetic"]),
      formatDeltaForKeys(adjustedImmediate, ["presentation", "pressure"]),
    ],
    advanced_trace_board: () => [
      formatDeltaForKeys(adjustedImmediate, ["design", "software"]),
      `画图类行动进度额外 +${effects.drawingProgress ?? 0}`,
    ],
    advanced_model_toolkit: () => [
      formatDeltaForKeys(adjustedImmediate, ["design", "aesthetic"]),
      "模型周负面事件质量损失 -2、金钱损失 -100，单项最低 -1",
    ],
    ergonomic_mouse: () => [
      formatDeltaForKeys(adjustedImmediate, ["software"]),
      `每周固定${formatDelta(effects.weeklyPermanent ?? {})}`,
    ],
    alienware_laptop: () => [
      formatDeltaForKeys(adjustedImmediate, ["software"]),
      "本局电脑故障类负面事件无效",
    ],
  }[item.id];
  return byId?.().filter(Boolean).join("\n") ?? "";
}

function formatDeltaForKeys(delta = {}, keys = []) {
  const selected = {};
  for (const key of keys) {
    if ((delta[key] ?? 0) !== 0) selected[key] = delta[key];
  }
  return formatDelta(selected);
}

function shopOngoingEffectParts(effects = {}) {
  const parts = [];
  if (effects.weeklySemester) {
    parts.push(`每周固定${formatDelta(effects.weeklySemester)}`);
  }
  if (effects.weeklyPermanent) {
    parts.push(`每周固定${formatDelta(effects.weeklyPermanent)}`);
  }
  if (effects.musicMembership) {
    parts.push(`${effects.musicMembership.durationWeeks ?? 12} 周内画图压力增加 ${formatSigned(effects.musicMembership.drawingPressureBonus ?? 0)}`);
    parts.push("可切换音乐");
  }
  if (effects.currentWeekActions) {
    parts.push(`当前周额外行动次数 +${effects.currentWeekActions}`);
  }
  if (effects.restDelta) {
    parts.push(`休养生息额外${formatDelta(effects.restDelta)}`);
  }
  if (effects.exerciseYear) {
    parts.push(`健身运动精力消耗 ${formatSigned(effects.exerciseYear.energyCost ?? 0)}`);
    parts.push(`压力额外 ${formatSigned(effects.exerciseYear.pressure ?? 0)}`);
  }
  if (effects.excuseTokens) {
    parts.push(`抵消 ${effects.excuseTokens} 次点名/作业截止惩罚`);
  }
  if (effects.summerPositiveBonus) {
    parts.push(`暑假写生正向数值全部 +${effects.summerPositiveBonus}`);
  }
  if (effects.drawingProgress) {
    parts.push(`画图类行动进度额外 +${effects.drawingProgress}`);
  }
  if (effects.blockPluginEvents) {
    parts.push("本局不再触发插件事故类型的随机事件");
  }
  if (effects.modelNegativeLossReduction || effects.blockModelNegativeEvents) {
    parts.push("模型周负面事件质量损失 -2、金钱损失 -100，单项最低 -1");
  }
  if (effects.blockComputerEvents) {
    parts.push("本局电脑故障类负面事件无效");
  }
  if (effects.musicSwitch && !effects.musicMembership) {
    parts.push("可切换音乐");
  }
  return parts;
}

function deltaWithoutMoney(delta = {}) {
  const result = {};
  for (const [key, value] of Object.entries(delta ?? {})) {
    if (key !== "money" && value !== 0) {
      result[key] = value;
    }
  }
  return result;
}

function sameDelta(left = {}, right = {}) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => (left[key] ?? 0) === (right[key] ?? 0));
}

function deltaText(delta = {}) {
  return Object.keys(delta).length ? formatDelta(delta) : "";
}

function requirementsMet(state, project) {
  if (!project.requirements) return true;
  if (project.anyRequirement) {
    return project.requirements.some((group) => requirementGroupMet(state, group));
  }
  return project.requirements.every((group) => requirementGroupMet(state, group));
}

function projectRequirementText(project) {
  if (!project.requirements) return "";
  const groups = project.requirements.map((group) => Object.entries(group)
    .map(([key, value]) => `${ATTRIBUTE_LABELS[key] ?? key} >= ${value}`)
    .join("，"));
  return groups.join(project.anyRequirement ? " 或 " : "，");
}

function projectActionCost(project) {
  return Number(project.actionCost ?? 1);
}

function projectDisplayDelta(delta, actionCost) {
  return { actionSlots: -actionCost, ...delta };
}

function paidWorkWeeklyLimitReached(state) {
  return PAID_WORK_ACTION_IDS.reduce((total, actionId) => total + (state.weeklyActionCounts[actionId] ?? 0), 0) >= PAID_WORK_WEEKLY_LIMIT;
}

function requirementGroupMet(state, group) {
  return Object.entries(group).every(([key, value]) => state.attributes[key] >= value);
}

function actionAvailabilityResult(action, stateName, reason, gameState) {
  const delta = previewActionDelta(gameState, action);
  const preview = action.text ?? (delta
    ? formatDelta(delta)
    : action.projectType
      ? "选择具体项目后结算"
      : "按角色专属技能结算");
  return {
    id: action.id,
    label: action.label,
    group: action.group,
    state: stateName,
    reason,
    preview,
    delta,
  };
}

function previewActionDelta(state, action) {
  if (!state) return action.baseDelta ? { ...action.baseDelta } : null;
  if (action.specialSkill) {
    const skill = getCharacter(state)?.skill;
    return skill?.delta ? previewDelta(state, skill.delta, { actionId: "special_skill", preview: true }) : null;
  }
  if (action.projectType) {
    return null;
  }
  return calculatePreviewActionDelta(state, action);
}

function currentMentorTaskText(state) {
  const mentor = MENTORS.find((item) => item.id === state.profile.mentorId);
  if (!mentor) return "本学期没有导师任务";
  return `${mentor.name}阶段任务「${mentor.task.name}」：${mentor.task.conditionText}`;
}

function queueChoiceResult(state, title, body, delta, options = {}) {
  const deltaText = formatDelta(delta);
  const bodyText = body ?? "选择已确认。";
  const hasDelta = deltaText !== "无数值变化";
  const showDeltaOnConfirm = options.showDeltaOnConfirm === true && hasDelta;
  const confirmLabel = options.confirmLabel ?? (hasDelta ? deltaText : "继续");
  const modalTitle = options.titleSuffix === false ? title : `${title}结算`;
  pushModal(state, {
    type: "choice_result",
    title: modalTitle,
    body: options.includeDelta === true && hasDelta ? `${bodyText}\n${deltaText}` : bodyText,
    delta,
    showDeltaOnConfirm,
    next: options.next ?? null,
    blocks: true,
    options: [{ id: "confirm", label: confirmLabel, delta: hasDelta && options.hideConfirmDelta !== true ? delta : undefined }],
  });
}

function attributeLabel(key) {
  const labels = {
    design: "设计水平",
    software: "软件技术",
    aesthetic: "创意审美",
    presentation: "汇报表达",
    social: "人际交往",
    resilience: "抗压能力",
  };
  return labels[key] ?? key;
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : String(value);
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
    maxEnergy: "精力上限",
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
