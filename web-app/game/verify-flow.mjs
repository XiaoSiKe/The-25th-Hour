import { readFileSync } from "node:fs";
import {
  advanceGameFlow,
  answerCourseQuestion,
  answerIeltsQuestion,
  answerRouteQuestion,
  applyForInternship,
  availableProjects,
  availableShopItems,
  beginIeltsExam,
  beginRouteExam,
  choosePendingInteractionOption,
  chooseProject,
  chooseReportStrategy,
  chooseRouteOption,
  chooseSummerEventOption,
  confirmRouteExamResult,
  confirmReviewResult,
  confirmChoiceResult,
  finishWeek,
  performAction,
  queueReviewResult,
  resolveActionAvailability,
  selectCharacter,
  startGameProfile,
  startIeltsExam,
  visitWanliRoadLocation,
} from "./commands.mjs";
import {
  ACADEMIC_ROUTE_QUESTIONS,
  CIVIL_ROUTE_QUESTIONS,
  COURSE_QUESTIONS,
  EVENT_PHASE_OVERRIDES,
  GAME_REQUIRED_IMAGES,
  IELTS_QUESTIONS,
  RANDOM_EVENTS,
  SUMMER_EVENTS,
  WANLI_ROAD_EVENTS,
  WANLI_ROAD_MAX_VISITS_PER_YEAR,
  WANLI_ROAD_STAGE_REWARDS,
} from "./data.mjs";
import { confirmEvent, maybeQueueMidweekEvent, queueWeeklyEvents } from "./events.mjs";
import {
  applyDelta,
  applyWeeklySettlement,
  effectiveInternshipAttributes,
  finalizeReview,
  progressCap,
  reviewProgressRequirement,
  settleFinalEnding,
} from "./resolver.mjs";
import {
  collectionHasSubmittedEndingScore,
  commitRunToCollection,
  createEmptyCollection,
  hydrateStateFromCollection,
  latestProfileForNewGame,
  recordCollectionCoffeeSupportClick,
  updateCollectionLatestProfile,
} from "./collection.mjs";
import { recordWanliRoadVisit, recordWeeklySettlement } from "./achievements.mjs";
import {
  ENDING_TRACKS,
  deferredStartupBgmTracks,
  forcedEndingBgmTracks,
  musicForState,
  musicLibraryTracks,
  postStartGameBgmPreloadTrackGroups,
  postStartPreloadTrackGroups,
  selectEndingTrackForRun,
  startupBgmTracks,
  startupGateBgmTracks,
} from "./music.mjs";
import { createSeniorTestCopyState } from "./test-senior-copy.mjs";
import { ENDING_MEMORY_SCENE_IMAGE_SOURCES } from "../ui/ending-memory-assets.generated.mjs";
import * as iconSources from "../ui/icons.mjs";
import { randomEventIconPath, themeIconPath } from "../ui/icons.mjs";
import {
  baselineEndingIllustrationSources,
  criticalStartupImageSources,
  endingIllustrationSources,
  gameplayBackgroundImageSources,
  opportunisticStartupImageSources,
  portfolioBoardImageSources,
  postStartupGameplayImageSources,
  routeEndingIllustrationSources,
  startupFailureEndingIllustrationSources,
  startupLoadingShellImageSources,
  startupPortfolioBoardImageSources,
  startupRouteEndingIllustrationSources,
  startupSupportQrImageSources,
} from "../ui/resource-preload.mjs";
import { UI_ICON_FINAL_IMAGE_SOURCES } from "../ui/icon-source.mjs";
import { uiIconAtlasEntryFor, uiIconAtlasImageSources } from "../ui/ui-icon-atlas.mjs";
import { ENDING_MEMORY_ASSET_VERSION, modalCommandKey, renderGame, renderModal } from "../ui/render.mjs";
import { toViewModel } from "./view-model.mjs";

let failures = 0;

function assertFlow(name, condition, details = {}) {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}`);
  if (!condition) {
    console.log(JSON.stringify(details, null, 2));
    failures += 1;
  }
}

function hasUnlocked(state, achievementId) {
  return (state.unlockedAchievements ?? []).includes(achievementId);
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

function questionBanks() {
  return [
    ...Object.entries(COURSE_QUESTIONS).map(([id, questions]) => [`course:${id}`, questions]),
    ["ielts", IELTS_QUESTIONS],
    ["route:academic", ACADEMIC_ROUTE_QUESTIONS],
    ["route:civil", CIVIL_ROUTE_QUESTIONS],
  ];
}

function answerDistribution(questions) {
  const distribution = Object.fromEntries(OPTION_LETTERS.map((letter) => [letter, 0]));
  for (const question of questions) {
    if (Object.hasOwn(distribution, question.answer)) {
      distribution[question.answer] += 1;
    }
  }
  return distribution;
}

function distributionSpread(distribution) {
  const values = OPTION_LETTERS.map((letter) => distribution[letter]);
  return Math.max(...values) - Math.min(...values);
}

function duplicateOptionQuestionIndexes(questions) {
  return questions.flatMap((question, index) => {
    const labels = OPTION_LETTERS.map((letter) => String(question.options?.[letter] ?? "").trim());
    return new Set(labels).size === labels.length ? [] : [index + 1];
  });
}

function invalidAnswerQuestionIndexes(questions) {
  return questions.flatMap((question, index) => {
    const answer = question.answer;
    return OPTION_LETTERS.includes(answer) && typeof question.options?.[answer] === "string" ? [] : [index + 1];
  });
}

function difficultyDistribution(questions) {
  return questions.reduce((distribution, question) => {
    distribution[question.difficulty] = (distribution[question.difficulty] ?? 0) + 1;
    return distribution;
  }, {});
}

function collectRuntimeIconSources(value, sources, seen = new Set()) {
  if (typeof value === "string") {
    sources.add(value);
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const item of Object.values(value)) {
    collectRuntimeIconSources(item, sources, seen);
  }
}

function isLegacyIconSource(source) {
  return source.startsWith("/ui-icons/")
    || source.startsWith("/achievement-icons/")
    || source.startsWith("/assets/")
    || source.startsWith("/asset-work/assets/images/ui-common/");
}

function finalIconSourceContaining(fragment) {
  return UI_ICON_FINAL_IMAGE_SOURCES.find((source) => source.includes(fragment)) ?? "";
}

{
  const blankProfile = startGameProfile({ nickname: "   ", universityName: "测试大学", seed: 25 });
  const longNickname = startGameProfile({ nickname: "测".repeat(19), universityName: "测试大学", seed: 25 });
  const longUniversity = startGameProfile({ nickname: "测试", universityName: "建".repeat(25), seed: 25 });
  const maxLengthProfile = startGameProfile({ nickname: "测".repeat(18), universityName: "建".repeat(24), seed: 25 });

  assertFlow(
    "profile command rejects blank and overlong fields",
    !blankProfile.ok
      && blankProfile.reason === "profile_required"
      && !longNickname.ok
      && longNickname.reason === "profile_too_long"
      && !longUniversity.ok
      && longUniversity.reason === "profile_too_long"
      && maxLengthProfile.ok,
    {
      blankProfile,
      longNickname,
      longUniversity,
      maxLengthProfileOk: maxLengthProfile.ok,
    },
  );
}

function createSummerState() {
  const result = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const state = result.state;
  selectCharacter(state, state.characterCandidates[0]);
  state.pendingInteraction = null;
  state.modalQueue = [];
  state.phase = "summer_event";
  state.semesterIndex = 4;
  state.year = 2;
  state.term = 2;
  state.week = 24;
  state.weekInSemester = 6;
  state.actionsRemaining = 0;
  state.progress = 0;
  state.quality = 0;
  state.summerQueue = ["summer_sketch_location"];
  return state;
}

function createWeekActionState(seed = 25) {
  const result = startGameProfile({ nickname: "测试", universityName: "测试大学", seed });
  const state = result.state;
  selectCharacter(state, state.characterCandidates[0]);
  state.pendingInteraction = null;
  state.modalQueue = [];
  state.phase = "week_action";
  state.year = 5;
  state.term = 1;
  state.semesterIndex = 9;
  state.week = 49;
  state.weekInSemester = 1;
  state.actionsRemaining = 1;
  state.energy = 100;
  state.maxEnergy = 100;
  state.pressure = 0;
  state.progress = 0;
  state.quality = 0;
  state.attributes = {
    ...state.attributes,
    design: 0,
    software: 0,
    aesthetic: 0,
  };
  return state;
}

function createCharacterWeekActionState(characterId, seed = 25) {
  const state = createWeekActionState(seed);
  state.profile.characterId = characterId;
  return state;
}

function createReadPptReportState(characterId) {
  const state = createCharacterWeekActionState(characterId);
  state.phase = "review";
  state.pendingInteraction = {
    type: "report_strategy",
    options: [{ id: "read_ppt", state: "available" }],
  };
  state.reviewDraft = {
    base: {
      progressRequirement: 80,
      progressGateFailed: false,
      qualityScore: 80,
      baseGrade: "B",
      failureKind: null,
      baseScore: 80,
    },
    mentorResult: null,
    strategyResult: null,
  };
  return state;
}

function createAcceptedInternshipState(characterId) {
  const state = createCharacterWeekActionState(characterId);
  state.year = 2;
  state.term = 1;
  state.semesterIndex = 3;
  state.rngState = 1;
  state.pressure = 0;
  state.attributes.design = 100;
  state.attributes.software = 100;
  return state;
}

function createOneCorrectCourseState(characterId, questions) {
  const state = createCharacterWeekActionState(characterId);
  state.phase = "course_exam";
  state.courseId = "architecture_history";
  state.courseExam = { courseId: "architecture_history", index: 0, questions, answers: [] };
  state.pendingInteraction = { type: "course_question" };
  answerCourseQuestion(state, "A");
  answerCourseQuestion(state, "B");
  answerCourseQuestion(state, "B");
  return state;
}

function queueSummerPrompt(state) {
  const event = SUMMER_EVENTS.find((item) => item.id === "summer_sketch_location");
  state.pendingInteraction = {
    type: "summer_event",
    eventId: event.id,
    title: event.title,
    options: event.options.map((option) => ({ id: option.id })),
  };
}

function flowSnapshot(state) {
  return {
    phase: state.phase,
    ending: state.ending ?? null,
    pendingEnding: state.pendingEnding ?? null,
    endingMemoryWatched: Boolean(state.endingMemoryWatched),
    semesterIndex: state.semesterIndex,
    year: state.year,
    term: state.term,
    week: state.week,
    weekInSemester: state.weekInSemester,
    actionsRemaining: state.actionsRemaining,
    pendingType: state.pendingInteraction?.type ?? null,
    pendingTitle: state.pendingInteraction?.title ?? null,
    memoryStep: state.pendingInteraction?.memoryStep ?? null,
    summerQueue: state.summerQueue ?? null,
  };
}

function firstAvailableOptionId(interaction) {
  return interaction?.options?.find((option) => option.state !== "disabled")?.id
    ?? interaction?.options?.[0]?.id
    ?? "confirm";
}

function testPhaseRange(event) {
  return EVENT_PHASE_OVERRIDES[event.id] ?? [event.semesterMin, event.semesterMax];
}

function resolveAllPending(state, maxSteps = 12) {
  let steps = 0;
  while (state.pendingInteraction && steps < maxSteps) {
    steps += 1;
    choosePendingInteractionOption(state, firstAvailableOptionId(state.pendingInteraction));
    advanceGameFlow(state);
  }
}

{
  const state = createWeekActionState();
  state.money = 10000;
  state.attributes.design = 80;
  state.attributes.aesthetic = 80;
  state.attributes.resilience = 80;
  const sketchbook = availableShopItems(state).find((item) => item.id === "sketchbook");

  assertFlow(
    "senior sketchbook shop preview preserves two-line layout after attribute scaling",
    sketchbook?.effectText === "设计水平 +0.5，创意审美 +1\n抗压能力 +0.5，压力 -5",
    { effectText: sketchbook?.effectText, delta: sketchbook?.delta },
  );
}

{
  const state = createSummerState();
  queueSummerPrompt(state);

  chooseSummerEventOption(state, "wuyuan_marker");
  confirmChoiceResult(state);
  advanceGameFlow(state);

  assertFlow(
    "summer sketch result advances to junior year start",
    state.semesterIndex === 5
      && state.year === 3
      && state.term === 1
      && state.weekInSemester === 0
      && state.pendingInteraction?.type === "year_start",
    flowSnapshot(state),
  );
}

{
  const state = createSummerState();
  state.summerQueue = [];
  state.pendingInteraction = null;

  advanceGameFlow(state);

  assertFlow(
    "stuck completed summer phase recovers by advancing semester",
    state.semesterIndex === 5
      && state.phase === "year_start"
      && state.pendingInteraction?.type === "year_start",
    flowSnapshot(state),
  );
}

{
  const state = createWeekActionState();
  state.year = 2;
  state.term = 1;
  state.semesterIndex = 3;
  state.week = 13;
  state.weekInSemester = 0;
  state.phase = "year_start";
  state.musicYearStarted = false;
  state.pendingInteraction = {
    type: "year_start",
    title: "专教生活",
    blocks: true,
    options: [{ id: "confirm", label: "进入大二学年" }],
  };

  const beforeConfirm = musicForState(state);
  const result = choosePendingInteractionOption(state, "confirm");
  const afterConfirm = musicForState(state);

  assertFlow(
    "sophomore year music stays on the sophomore playlist across year start confirmation",
    beforeConfirm.playlistId === "year:2"
      && beforeConfirm.id === "year_2_1"
      && result.ok === true
      && state.musicYearStarted === true
      && afterConfirm.playlistId === "year:2"
      && afterConfirm.id === "year_2_1",
    {
      beforeConfirm: { playlistId: beforeConfirm.playlistId, id: beforeConfirm.id },
      result,
      afterConfirm: { playlistId: afterConfirm.playlistId, id: afterConfirm.id },
      pendingInteraction: state.pendingInteraction?.type,
    },
  );
}

{
  const state = createSummerState();
  state.pendingInteraction = null;

  advanceGameFlow(state);

  assertFlow(
    "stuck queued summer phase restores summer prompt",
    state.semesterIndex === 4
      && state.phase === "summer_event"
      && state.pendingInteraction?.type === "summer_event",
    flowSnapshot(state),
  );
}

{
  const state = createSeniorTestCopyState();
  state.year = 5;
  state.term = 1;
  state.semesterIndex = 9;
  state.week = 48;
  state.weekInSemester = 0;
  state.phase = "year_start";
  state.pendingInteraction = {
    type: "year_start",
    title: "画了五年，该交图了！",
    body: "",
    blocks: true,
    options: [{ id: "confirm", label: "进入大五学年" }],
  };
  state.modalQueue = [];

  const yearStartResult = choosePendingInteractionOption(state, "confirm");
  const mentorType = state.pendingInteraction?.type;
  const mentorResult = choosePendingInteractionOption(state, state.pendingInteraction?.options?.[0]?.id);

  assertFlow(
    "senior test copy skips freshman fixed events after entering fifth year",
    yearStartResult.ok === true
      && mentorType === "mentor_select"
      && mentorResult.ok === true
      && state.phase === "course_select"
      && state.pendingInteraction?.type === "course_select",
    {
      yearStartResult,
      mentorType,
      mentorResult,
      phase: state.phase,
      pendingType: state.pendingInteraction?.type,
      fixedEventIndex: state.fixedEventIndex,
    },
  );
}

{
  const result = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const state = result.state;
  selectCharacter(state, state.characterCandidates[0]);
  state.pendingInteraction = null;
  state.modalQueue = [];
  state.phase = "week_action";
  state.year = 2;
  state.term = 1;
  state.semesterIndex = 3;
  state.week = 16;
  state.weekInSemester = 4;
  state.actionsRemaining = 3;
  state.money = 0;

  const current = WANLI_ROAD_EVENTS[0];
  const blocked = visitWanliRoadLocation(state, current.id);
  state.money = current.cost;
  const queued = visitWanliRoadLocation(state, current.id);
  state.money = 0;
  const staleConfirm = choosePendingInteractionOption(state, "confirm");

  assertFlow(
    "wanli road command rejects insufficient money before visit and confirm",
    blocked.ok === false
      && blocked.reason === "wanli_road_money_insufficient"
      && queued.ok === true
      && staleConfirm.ok === false
      && staleConfirm.reason === "wanli_road_money_insufficient"
      && state.wanliRoadVisits === 0
      && state.pendingInteraction?.type === "wanli_road_event",
    {
      blocked,
      queued,
      staleConfirm,
      wanliRoadVisits: state.wanliRoadVisits,
      pendingType: state.pendingInteraction?.type,
    },
  );
}

{
  const early = WANLI_ROAD_EVENTS.slice(0, 6);
  const late = WANLI_ROAD_EVENTS.slice(6);

  const earlyResult = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const earlyState = earlyResult.state;
  selectCharacter(earlyState, earlyState.characterCandidates[0]);
  earlyState.pendingInteraction = null;
  earlyState.modalQueue = [];
  earlyState.phase = "week_action";
  earlyState.year = 2;
  earlyState.term = 1;
  earlyState.semesterIndex = 3;
  earlyState.week = 16;
  earlyState.weekInSemester = 4;
  earlyState.actionsRemaining = 3;
  earlyState.money = early[0].cost;
  const earlyVisit = visitWanliRoadLocation(earlyState, early[0].id);
  const earlyConfirm = choosePendingInteractionOption(earlyState, "confirm");

  const lateResult = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const lateState = lateResult.state;
  selectCharacter(lateState, lateState.characterCandidates[0]);
  lateState.pendingInteraction = null;
  lateState.modalQueue = [];
  lateState.phase = "week_action";
  lateState.year = 3;
  lateState.term = 1;
  lateState.semesterIndex = 5;
  lateState.week = 28;
  lateState.weekInSemester = 4;
  lateState.actionsRemaining = 3;
  lateState.wanliRoadVisits = 6;
  lateState.eventTally.wanliRoadVisits = 6;
  lateState.wanliRoadStageRewardsClaimed = [3];
  lateState.money = late[0].cost;
  const lateVisit = visitWanliRoadLocation(lateState, late[0].id);
  const lateConfirm = choosePendingInteractionOption(lateState, "confirm");

  const stageRewardResult = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const stageRewardState = stageRewardResult.state;
  selectCharacter(stageRewardState, stageRewardState.characterCandidates[0]);
  stageRewardState.pendingInteraction = null;
  stageRewardState.modalQueue = [];
  stageRewardState.phase = "week_action";
  stageRewardState.year = 2;
  stageRewardState.term = 1;
  stageRewardState.semesterIndex = 3;
  stageRewardState.week = 16;
  stageRewardState.weekInSemester = 4;
  stageRewardState.actionsRemaining = 3;
  stageRewardState.wanliRoadVisits = 2;
  stageRewardState.eventTally.wanliRoadVisits = 2;
  stageRewardState.money = early[2].cost;
  const stageRewardBefore = { ...stageRewardState.attributes };
  const stageRewardVisit = visitWanliRoadLocation(stageRewardState, early[2].id);
  const stageRewardConfirm = choosePendingInteractionOption(stageRewardState, "confirm");
  const stageRewardLog = stageRewardState.logs.find((log) => log.source === "wanli_stage_reward:3");

  assertFlow(
    "wanli road early locations cost one action and late locations remain two actions",
    WANLI_ROAD_MAX_VISITS_PER_YEAR === 6
      && early.every((event) => event.cost === 2500 && event.actionCost === 1)
      && late.every((event) => event.cost === 4000 && event.actionCost === 2)
      && WANLI_ROAD_STAGE_REWARDS.every((reward) => !Object.hasOwn(reward.delta, "presentation"))
      && earlyVisit.ok === true
      && earlyConfirm.ok === true
      && earlyState.actionsRemaining === 2
      && earlyState.wanliRoadRecords.at(-1)?.actionCost === 1
      && lateVisit.ok === true
      && lateConfirm.ok === true
      && lateState.actionsRemaining === 1
      && lateState.wanliRoadRecords.at(-1)?.actionCost === 2
      && lateState.wanliRoadStageRewardsClaimed.join(",") === "3,6"
      && stageRewardVisit.ok === true
      && stageRewardConfirm.ok === true
      && stageRewardState.wanliRoadStageRewardsClaimed.join(",") === "3"
      && stageRewardState.attributes.aesthetic === stageRewardBefore.aesthetic + early[2].delta.aesthetic + WANLI_ROAD_STAGE_REWARDS[0].delta.aesthetic
      && stageRewardState.attributes.design === stageRewardBefore.design + early[2].delta.design + WANLI_ROAD_STAGE_REWARDS[0].delta.design
      && stageRewardLog?.delta?.aesthetic === WANLI_ROAD_STAGE_REWARDS[0].delta.aesthetic
      && stageRewardLog?.delta?.design === WANLI_ROAD_STAGE_REWARDS[0].delta.design,
    {
      maxVisitsPerYear: WANLI_ROAD_MAX_VISITS_PER_YEAR,
      earlyCosts: early.map((event) => [event.cost, event.actionCost]),
      lateCosts: late.map((event) => [event.cost, event.actionCost]),
      stageRewards: WANLI_ROAD_STAGE_REWARDS,
      earlyVisit,
      earlyConfirm,
      earlyActionsRemaining: earlyState.actionsRemaining,
      lateVisit,
      lateConfirm,
      lateActionsRemaining: lateState.actionsRemaining,
      lateClaimed: lateState.wanliRoadStageRewardsClaimed,
      stageRewardVisit,
      stageRewardConfirm,
      stageRewardBefore,
      stageRewardAfter: stageRewardState.attributes,
      stageRewardClaimed: stageRewardState.wanliRoadStageRewardsClaimed,
      stageRewardLog,
    },
  );
}

{
  const result = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const state = result.state;
  selectCharacter(state, state.characterCandidates[0]);
  state.pendingInteraction = null;
  state.modalQueue = [];
  state.phase = "week_action";
  state.year = 5;
  state.term = 1;
  state.semesterIndex = 9;
  state.week = 49;
  state.weekInSemester = 1;
  state.actionsRemaining = 3;
  state.gpa = 3;
  state.portfolio = 420;
  state.attributes = {
    ...state.attributes,
    design: 70,
    software: 55,
    resilience: 60,
  };
  state.reviews = Array.from({ length: 4 }, (_, index) => ({
    semesterIndex: index + 5,
    year: Math.ceil((index + 5) / 2),
    term: (index + 5) % 2 === 1 ? 1 : 2,
    finalGrade: "B",
    finalScore: 84,
  }));

  const chooseResult = chooseRouteOption(state, "postgrad_normal");
  const commitResult = choosePendingInteractionOption(state, "confirm");
  const introResult = beginRouteExam(state);
  const routeDifficulty = difficultyDistribution(state.routeExam?.questions ?? []);
  const firstQuestionId = state.routeExam?.questions?.[0]?.id ?? null;
  const firstAnswer = state.routeExam?.questions?.[0]?.answer ?? "A";
  const answerResult = answerRouteQuestion(state, firstAnswer);

  assertFlow(
    "senior route registration starts route exam immediately in senior fall",
    chooseResult.ok === true
      && commitResult.ok === true
      && introResult.ok === true
      && answerResult.ok === true
      && state.phase === "route_exam"
      && state.routeExam?.type === "academic"
      && state.routeExam?.questions?.length === 10
      && routeDifficulty.easy === 6
      && routeDifficulty.hard === 4
      && state.routeExam?.returnPhase === "week_action"
      && state.pendingInteraction?.type === "route_question"
      && state.routeExam?.answers?.[0]?.questionId === firstQuestionId,
    {
      chooseResult,
      commitResult,
      introResult,
      answerResult,
      routeExam: state.routeExam,
      routeDifficulty,
      pendingType: state.pendingInteraction?.type,
      phase: state.phase,
    },
  );

  while (state.pendingInteraction?.type === "route_question") {
    const question = state.routeExam.questions[state.routeExam.index];
    answerRouteQuestion(state, question.answer);
  }
  const resultBeforeConfirm = state.pendingInteraction?.type;
  const confirmResult = confirmRouteExamResult(state);

  assertFlow(
    "senior route exam records result once and returns to route registration phase",
    resultBeforeConfirm === "route_exam_result"
      && confirmResult.ok === true
      && state.phase === "week_action"
      && state.routeExam === null
      && state.routeExamResults.academicTaken === true,
    {
      resultBeforeConfirm,
      confirmResult,
      phase: state.phase,
      routeExam: state.routeExam,
      routeExamResults: state.routeExamResults,
    },
  );
}

{
  const result = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const state = result.state;
  selectCharacter(state, state.characterCandidates[0]);
  state.pendingInteraction = null;
  state.modalQueue = [];
  state.phase = "week_action";
  state.year = 5;
  state.term = 1;
  state.semesterIndex = 9;
  state.week = 49;
  state.weekInSemester = 1;
  state.gpa = 1.9;
  state.portfolio = 375;
  state.attributes = {
    ...state.attributes,
    design: 62,
    software: 46,
    resilience: 48,
  };
  state.reviews = Array.from({ length: 4 }, (_, index) => ({
    semesterIndex: index + 5,
    year: Math.ceil((index + 5) / 2),
    term: (index + 5) % 2 === 1 ? 1 : 2,
    finalGrade: "B",
    finalScore: 84,
  }));

  const chooseResult = chooseRouteOption(state, "postgrad_normal");
  const commitResult = choosePendingInteractionOption(state, "confirm");
  state.pendingInteraction = null;
  state.modalQueue = [];
  state.routeExam = null;
  state.routeExamResults = {
    ...state.routeExamResults,
    academicTaken: true,
    academicCorrect: 6,
  };
  state.completedGraduationDesign = true;
  state.attributes.software = 45;
  settleFinalEnding(state);

  assertFlow(
    "academic route final reveal reads exam line without rechecking locked registration stats",
    chooseResult.ok === true
      && commitResult.ok === true
      && state.ending === "steady_postgrad",
    {
      chooseResult,
      commitResult,
      ending: state.ending,
      routeParticipation: state.routeParticipation,
      routeExamResults: state.routeExamResults,
      attributes: state.attributes,
    },
  );
}

{
  const result = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const state = result.state;
  selectCharacter(state, state.characterCandidates[0]);
  state.pendingInteraction = null;
  state.modalQueue = [];
  state.phase = "week_action";
  state.year = 5;
  state.term = 1;
  state.semesterIndex = 9;
  state.week = 49;
  state.weekInSemester = 1;
  state.ieltsScore = 7;
  state.portfolio = 600;
  state.internshipValue = 2;
  state.attributes = {
    ...state.attributes,
    design: 80,
    software: 66,
  };

  const chooseResult = chooseRouteOption(state, "architecture_foreign");
  const commitResult = choosePendingInteractionOption(state, "confirm");

  assertFlow(
    "architecture far-exceeded probability ignores IELTS and follows job core metrics",
    chooseResult.ok === true
      && commitResult.ok === true
      && state.routeParticipation?.outcome?.finalRequirementsMet === true
      && state.routeParticipation?.outcome?.probability === 0.8,
    {
      chooseResult,
      commitResult,
      outcome: state.routeParticipation?.outcome,
      ieltsScore: state.ieltsScore,
      portfolio: state.portfolio,
      internshipValue: state.internshipValue,
      attributes: state.attributes,
    },
  );
}

{
  const skewedBanks = [];
  const duplicateOptionBanks = [];
  const invalidAnswerBanks = [];

  for (const [bankId, questions] of questionBanks()) {
    const distribution = answerDistribution(questions);
    const spread = distributionSpread(distribution);
    if (spread > 1) {
      skewedBanks.push({ bankId, distribution, spread });
    }

    const duplicateIndexes = duplicateOptionQuestionIndexes(questions);
    if (duplicateIndexes.length > 0) {
      duplicateOptionBanks.push({ bankId, duplicateIndexes });
    }

    const invalidIndexes = invalidAnswerQuestionIndexes(questions);
    if (invalidIndexes.length > 0) {
      invalidAnswerBanks.push({ bankId, invalidIndexes });
    }
  }

  assertFlow(
    "question banks keep answer positions balanced and options valid",
    skewedBanks.length === 0 && duplicateOptionBanks.length === 0 && invalidAnswerBanks.length === 0,
    { skewedBanks, duplicateOptionBanks, invalidAnswerBanks },
  );
}

{
  const academicDifficulty = difficultyDistribution(ACADEMIC_ROUTE_QUESTIONS);
  const civilDifficulty = difficultyDistribution(CIVIL_ROUTE_QUESTIONS);

  assertFlow(
    "route question banks keep 6 easy / 4 hard drawable granularity",
    academicDifficulty.easy >= 6
      && academicDifficulty.hard >= 4
      && civilDifficulty.easy >= 6
      && civilDifficulty.hard >= 4,
    { academicDifficulty, civilDifficulty },
  );
}

{
  const gameClockAtlasEntry = uiIconAtlasEntryFor(iconSources.UI_ICON_PATHS.game_clock);
  const routeRendered = renderModal({
    type: "route_question",
    examType: "academic",
    title: "考研题 1 / 10",
    body: "测试题干",
    blocks: true,
    options: [{ id: "A", label: "A. 测试选项" }],
  });
  const ieltsRendered = renderModal({
    type: "ielts_question",
    title: "雅思题 1 / 10",
    body: "测试题干",
    blocks: true,
    options: [{ id: "A", label: "A. 测试选项" }],
  });
  const courseRendered = renderModal({
    type: "course_question",
    title: "课程题 1 / 10",
    body: "测试题干",
    blocks: true,
    options: [{ id: "A", label: "A. 测试选项" }],
  });

  assertFlow(
    "question modals render route and IELTS countdown overrides with gameplay clock icon",
    routeRendered.includes('data-question-countdown-seconds="60"')
      && ieltsRendered.includes('data-question-countdown-seconds="60"')
      && courseRendered.includes('data-question-countdown-seconds="30"')
      && routeRendered.includes("question-countdown")
      && routeRendered.includes(gameClockAtlasEntry?.atlas ?? "")
      && routeRendered.includes(`viewBox="${gameClockAtlasEntry?.x} ${gameClockAtlasEntry?.y} ${gameClockAtlasEntry?.width} ${gameClockAtlasEntry?.height}"`),
    { gameClockAtlasEntry, routeRendered, ieltsRendered, courseRendered },
  );
}

{
  const result = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const state = result.state;
  selectCharacter(state, state.characterCandidates[0]);
  state.pendingInteraction = null;
  state.modalQueue = [];
  state.phase = "week_action";
  state.money = 3000;

  startIeltsExam(state);
  beginIeltsExam(state);
  const firstQuestionId = state.ieltsExam?.questions?.[0]?.id ?? null;
  const timeoutResult = choosePendingInteractionOption(state, "__question_timeout");

  assertFlow(
    "question timeout records a wrong answer and advances the exam",
    timeoutResult.ok === true
      && state.ieltsExam?.answers?.[0]?.questionId === firstQuestionId
      && state.ieltsExam?.answers?.[0]?.selected === "__question_timeout"
      && state.ieltsExam?.answers?.[0]?.correct === false
      && state.ieltsExam?.index === 1
      && state.pendingInteraction?.type === "ielts_question",
    {
      timeoutResult,
      firstQuestionId,
      answer: state.ieltsExam?.answers?.[0] ?? null,
      index: state.ieltsExam?.index,
      pendingType: state.pendingInteraction?.type,
    },
  );
}

{
  const result = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const state = result.state;
  selectCharacter(state, state.characterCandidates[0]);
  state.pendingInteraction = null;
  state.modalQueue = [];
  state.phase = "week_action";
  state.money = 3000;

  startIeltsExam(state);
  beginIeltsExam(state);
  const firstQuestionId = state.ieltsExam?.questions?.[0]?.id ?? null;
  answerIeltsQuestion(state, "A");

  assertFlow(
    "exam answer records keep stable question id with text snapshot",
    Boolean(firstQuestionId)
      && state.ieltsExam?.answers?.[0]?.questionId === firstQuestionId
      && typeof state.ieltsExam?.answers?.[0]?.question === "string",
    {
      firstQuestionId,
      answer: state.ieltsExam?.answers?.[0] ?? null,
    },
  );
}

{
  const result = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const state = result.state;
  selectCharacter(state, state.characterCandidates[0]);
  state.pendingInteraction = null;
  state.modalQueue = [];
  state.phase = "review";
  state.semesterIndex = 10;
  state.year = 5;
  state.term = 2;
  state.pendingEnding = "graduation_failed";
  state.completedGraduationDesign = false;

  queueReviewResult(state, {
    finalGrade: "F",
    finalScore: 0,
    semesterGpa: 0,
    semesterIndex: 10,
  });

  assertFlow(
    "graduation failed review result uses direct delayed-graduation button",
    state.pendingInteraction?.options?.[0]?.label === "恭喜你同学，你被延毕了！",
    flowSnapshot(state),
  );

  confirmReviewResult(state);
  advanceGameFlow(state);

  assertFlow(
    "graduation failed skips graduation memory and opens ending",
    state.phase === "ending"
      && state.ending === "graduation_failed"
      && !state.pendingInteraction
      && state.endingMemoryWatched === false,
    flowSnapshot(state),
  );
}

{
  const result = startGameProfile({ nickname: "测试", universityName: "测试大学", seed: 25 });
  const state = result.state;
  selectCharacter(state, state.characterCandidates[0]);
  state.pendingInteraction = {
    type: "graduation_ceremony",
    title: "毕业典礼",
    options: [{ id: "confirm", label: "走，拍毕业照去！" }],
  };
  state.modalQueue = [];
  state.phase = "graduation_ceremony";
  state.semesterIndex = 10;
  state.year = 5;
  state.term = 2;
  state.energy = 80;
  state.pressure = 20;
  state.completedGraduationDesign = true;
  state.pendingEnding = null;
  state.ending = null;

  const ceremonyResult = choosePendingInteractionOption(state, "confirm");

  assertFlow(
    "graduation ceremony opens first graduation photo",
    ceremonyResult.ok === true
      && state.phase === "ending_memory"
      && state.pendingInteraction?.type === "ending_memory"
      && state.pendingInteraction?.memoryStep === "first_photo"
      && state.pendingEnding === null
      && state.ending === null,
    { ceremonyResult, ...flowSnapshot(state) },
  );

  const firstPhotoResult = choosePendingInteractionOption(state, "confirm");

  assertFlow(
    "first graduation photo opens second graduation photo",
    firstPhotoResult.ok === true
      && state.phase === "ending_memory"
      && state.pendingInteraction?.type === "ending_memory"
      && state.pendingInteraction?.memoryStep === "second_photo"
      && state.pendingEnding === null
      && state.ending === null,
    { firstPhotoResult, ...flowSnapshot(state) },
  );

  const secondPhotoResult = choosePendingInteractionOption(state, "confirm");

  assertFlow(
    "second graduation photo opens ending memory animation",
    secondPhotoResult.ok === true
      && state.phase === "ending_memory"
      && state.pendingInteraction?.type === "ending_memory"
      && state.pendingInteraction?.memoryStep === "ending_animation"
      && state.pendingEnding === "stable_graduation"
      && state.ending === null,
    { secondPhotoResult, ...flowSnapshot(state) },
  );

  const firstRunCollection = createEmptyCollection();
  const endingMemoryVm = toViewModel(state, firstRunCollection);
  const endingMemoryMarkup = renderGame(endingMemoryVm, { theme: "light", uiDialog: null });

  assertFlow(
    "first ending memory animation renders skip button",
    firstRunCollection.hasSeenEndingMemory === false
      && endingMemoryVm.endingMemory?.canSkip === true
      && endingMemoryMarkup.includes('data-id="skip"')
      && endingMemoryMarkup.includes("跳过结尾回忆动画"),
    {
      hasSeenEndingMemory: firstRunCollection.hasSeenEndingMemory,
      canSkip: endingMemoryVm.endingMemory?.canSkip,
      hasSkipButton: endingMemoryMarkup.includes('data-id="skip"'),
    },
  );

  assertFlow(
    "ending memory animation still renders the independent lyric line",
    endingMemoryMarkup.includes("data-ending-memory-lyric"),
    { hasEndingMemoryLyric: endingMemoryMarkup.includes("data-ending-memory-lyric") },
  );

  const memoryResult = choosePendingInteractionOption(state, "confirm");

  assertFlow(
    "ending memory animation confirmation resolves final ending",
    memoryResult.ok === true
      && state.phase === "ending"
      && state.ending === "stable_graduation"
      && state.pendingEnding === null
      && state.endingMemoryWatched === true,
    { memoryResult, ...flowSnapshot(state) },
  );

  const finalEndingMarkup = renderGame(toViewModel(state), { theme: "light", uiDialog: null });
  const finalEndingAudioMarkup = finalEndingMarkup.match(/<audio[^>]+data-audio-player[^>]+>/u)?.[0] ?? "";

  assertFlow(
    "final ending music dock renders without lyrics",
    finalEndingMarkup.includes("game-music-dock")
      && !finalEndingMarkup.includes("data-current-lyric")
      && finalEndingAudioMarkup.includes('data-lyrics-src=""')
      && finalEndingAudioMarkup.includes('data-allows-lyrics="false"'),
    {
      hasMusicDock: finalEndingMarkup.includes("game-music-dock"),
      hasCurrentLyric: finalEndingMarkup.includes("data-current-lyric"),
      audio: finalEndingAudioMarkup,
    },
  );
}

{
  const firstTrack = musicForState({
    ending: "stable_graduation",
    seed: 25,
    endingTrackHistory: { playedTrackIds: [] },
  });
  const nextTrack = musicForState({
    ending: "stable_graduation",
    seed: 25,
    endingTrackHistory: { playedTrackIds: [firstTrack.id] },
  });
  const resetTrack = musicForState({
    ending: "stable_graduation",
    seed: 25,
    endingTrackHistory: { playedTrackIds: ENDING_TRACKS.map((track) => track.id) },
  });

  assertFlow(
    "ordinary ending music excludes played tracks and loops the selected track",
    firstTrack.id !== nextTrack.id
      && firstTrack.playlist.length === 1
      && firstTrack.loop === true
      && nextTrack.playlist.length === 1
      && nextTrack.loop === true
      && resetTrack.id === firstTrack.id,
    {
      firstTrack: firstTrack.id,
      nextTrack: nextTrack.id,
      resetTrack: resetTrack.id,
    },
  );
}

{
  const state = {
    seed: 25,
    endingTrackHistory: { playedTrackIds: [] },
  };
  const selectedTrack = selectEndingTrackForRun(state);
  state.endingTrackId = selectedTrack?.id ?? null;
  const renderedTrack = musicForState({
    ...state,
    ending: "stable_graduation",
  });

  assertFlow(
    "ordinary ending music can be selected at run start and reused at ending",
    selectedTrack?.id
      && state.endingTrackId === selectedTrack.id
      && renderedTrack.id === selectedTrack.id
      && renderedTrack.playlist.length === 1
      && renderedTrack.src === selectedTrack.src
      && renderedTrack.lyricsSrc === selectedTrack.lyricsSrc,
    {
      selectedTrackId: selectedTrack?.id,
      endingTrackId: state.endingTrackId,
      renderedTrackId: renderedTrack.id,
    },
  );
}

{
  const pendingDialogTrack = musicForState({
    ending: "stable_graduation",
    pendingInteraction: { type: "system_prompt", title: "结局提示" },
    seed: 25,
    endingTrackHistory: { playedTrackIds: [] },
  });

  assertFlow(
    "ending music keeps playing while an ending dialog is pending",
    pendingDialogTrack.src
      && pendingDialogTrack.playlistId === "ending"
      && pendingDialogTrack.id !== "ending_pending_silence",
    {
      trackId: pendingDialogTrack.id,
      playlistId: pendingDialogTrack.playlistId,
      src: pendingDialogTrack.src,
    },
  );
}

{
  const forcedTrackA = musicForState({
    ending: "graduation_failed",
    seed: 25,
    endingTrackHistory: { playedTrackIds: ENDING_TRACKS.map((track) => track.id) },
  });
  const forcedTrackB = musicForState({
    ending: "graduation_failed",
    seed: 26,
    endingTrackHistory: { playedTrackIds: [] },
  });

  assertFlow(
    "forced failure ending music ignores seed and ordinary played history",
    forcedTrackA.id === "ending_graduation_failed"
      && forcedTrackB.id === forcedTrackA.id
      && forcedTrackA.playlist.length === 1
      && forcedTrackA.loop === true
      && forcedTrackA.allowsLyrics === false,
    {
      forcedTrackA: forcedTrackA.id,
      forcedTrackB: forcedTrackB.id,
    },
  );
}

{
  const interactiveIcon = randomEventIconPath({ pool: "interactive" }, 9);
  const normalIcon = randomEventIconPath({ pool: "normal" }, 80);
  const modelIcon = randomEventIconPath({ pool: "model" }, 10);
  const compatibleKindIcon = randomEventIconPath({ kind: "interactive" }, 9);

  assertFlow(
    "random event icons resolve to confirmed asset paths instead of guessed aliases",
    interactiveIcon.includes("/optimized/asset-work/ui-icon-final/confirmed-icons/06-interactive-events/")
      && interactiveIcon.endsWith(".webp")
      && normalIcon.includes("/optimized/asset-work/ui-icon-final/confirmed-icons/05-normal-random-events/")
      && modelIcon.includes("/optimized/asset-work/ui-icon-final/confirmed-icons/07-model-week-events/")
      && compatibleKindIcon === interactiveIcon,
    { interactiveIcon, normalIcon, modelIcon, compatibleKindIcon },
  );
}

{
  const lightThemeIcon = themeIconPath("light");
  const darkThemeIcon = themeIconPath("dark");

  assertFlow(
    "theme icons use confirmed manifest paths for stable runtime loading",
    lightThemeIcon.includes("/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/")
      && darkThemeIcon.includes("/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/")
      && UI_ICON_FINAL_IMAGE_SOURCES.includes(lightThemeIcon)
      && UI_ICON_FINAL_IMAGE_SOURCES.includes(darkThemeIcon),
    { lightThemeIcon, darkThemeIcon },
  );
}

{
  const loadingShellSources = startupLoadingShellImageSources();
  const loadingClockAtlas = uiIconAtlasEntryFor(iconSources.UI_ICON_PATHS.loading_clock)?.atlas;

  assertFlow(
    "startup loading shell preloads the standalone clock image before first render",
    loadingShellSources.length === 1
      && loadingShellSources[0] === iconSources.UI_ICON_PATHS.loading_clock
      && !loadingClockAtlas,
    { loadingShellSources, loadingClockAtlas },
  );
}

{
  const startupSources = criticalStartupImageSources({ isMobileStartSurface: false });
  const startupSourceSet = new Set(startupSources);
  const opportunisticStartupSources = opportunisticStartupImageSources({ isMobileStartSurface: false });
  const opportunisticStartupSourceSet = new Set(opportunisticStartupSources);
  const gameplaySources = gameplayBackgroundImageSources({ isMobileStartSurface: false });
  const postStartupSources = postStartupGameplayImageSources({ isMobileStartSurface: false });
  const postStartupSourceSet = new Set(postStartupSources);
  const portfolioBoards = portfolioBoardImageSources();
  const startupPortfolioBoards = startupPortfolioBoardImageSources();
  const startupSupportQrImages = startupSupportQrImageSources();
  const atlasSources = uiIconAtlasImageSources();
  const startupClockSource = iconSources.UI_ICON_PATHS.loading_clock;
  const gameClockAtlas = uiIconAtlasEntryFor(iconSources.UI_ICON_PATHS.game_clock)?.atlas;
  const startupCoverAtlas = uiIconAtlasEntryFor(startupBgmTracks()[0]?.cover)?.atlas;
  const firstGameplaySources = [
    "/optimized/assets/characters/role-card-back.57c9bfd03c0b.webp",
    GAME_REQUIRED_IMAGES.openingCeremony.src,
    GAME_REQUIRED_IMAGES.militaryTraining.src,
    GAME_REQUIRED_IMAGES.architectureLifeStart.src,
  ];
  const summerSketchSources = [
    GAME_REQUIRED_IMAGES.summerSketchWuyuan.src,
    GAME_REQUIRED_IMAGES.summerSketchHongcun.src,
  ];
  const missingFirstGameplaySources = firstGameplaySources.filter((source) => !startupSourceSet.has(source));
  const missingSummerSketchSources = summerSketchSources.filter((source) => !startupSourceSet.has(source));
  const missingFinalIconAtlasEntries = UI_ICON_FINAL_IMAGE_SOURCES.filter((source) => !uiIconAtlasEntryFor(source));
  const directFinalIconRequests = startupSources.filter((source) => source.includes("/optimized/asset-work/ui-icon-final/confirmed-icons/")
    || source.includes("/optimized/asset-work/ui-icon-final/unmapped-icons/"))
    .filter((source) => source !== startupClockSource);
  const missingVisibleStartupIcons = [
    ...Object.values(iconSources.CHARACTER_AVATAR_ICONS),
    ...Object.values(iconSources.CHARACTER_SKILL_ICONS),
    ...Object.values(iconSources.MENTOR_AVATAR_ICONS),
    ...Object.values(iconSources.MENTOR_STAGE_TASK_ICONS),
  ].filter((source) => !startupSourceSet.has(uiIconAtlasEntryFor(source)?.atlas));
  const startSceneIndexes = Object.values(iconSources.START_SCENE_IMAGES).map((source) => startupSources.indexOf(source));
  const atlasIndexes = atlasSources.map((source) => startupSources.indexOf(source));
  const fixedEventIndexes = firstGameplaySources.map((source) => startupSources.indexOf(source));
  const summerSketchIndexes = summerSketchSources.map((source) => startupSources.indexOf(source));
  const expectedAllEndingIllustrations = [...new Set(Object.values(iconSources.ENDING_ILLUSTRATION_PATHS))];
  const allEndingIllustrations = endingIllustrationSources();
  const baselineEndingIllustrations = baselineEndingIllustrationSources();
  const startupFailureEndingIllustrations = startupFailureEndingIllustrationSources();
  const startupRouteEndingIllustrations = startupRouteEndingIllustrationSources();
  const expectedStartupEndingIllustrations = [
    ...startupFailureEndingIllustrations,
    ...startupRouteEndingIllustrations,
  ];
  const startupEndingIllustrations = allEndingIllustrations.filter((source) => startupSourceSet.has(source));
  const missingStartupFailureEndingIllustrations = startupFailureEndingIllustrations
    .filter((source) => !startupSourceSet.has(source));
  const missingStartupRouteEndingIllustrations = startupRouteEndingIllustrations
    .filter((source) => !startupSourceSet.has(source));
  const unexpectedStartupEndingIllustrations = startupEndingIllustrations
    .filter((source) => !expectedStartupEndingIllustrations.includes(source));
  const missingStartupSupportQrImages = startupSupportQrImages
    .filter((source) => !startupSourceSet.has(source));
  const missingStartupPortfolioBoards = startupPortfolioBoards
    .filter((source) => !startupSourceSet.has(source));
  const opportunisticStartupEndingIllustrations = baselineEndingIllustrations
    .filter((source) => opportunisticStartupSourceSet.has(source));
  const opportunisticStartupPortfolioBoards = portfolioBoards
    .filter((source) => opportunisticStartupSourceSet.has(source));
  const opportunisticStartupEndingMemorySceneImages = ENDING_MEMORY_SCENE_IMAGE_SOURCES
    .filter((source) => opportunisticStartupSourceSet.has(source));
  const duplicateOpportunisticStartupSources = opportunisticStartupSources
    .filter((source) => startupSourceSet.has(source));
  const missingBaselineEndingIllustrations = baselineEndingIllustrations.filter((source) => !postStartupSourceSet.has(source));
  const unexpectedPostStartupEndingIllustrations = allEndingIllustrations
    .filter((source) => postStartupSourceSet.has(source) && !baselineEndingIllustrations.includes(source));
  const startupEndingMemorySceneImages = ENDING_MEMORY_SCENE_IMAGE_SOURCES.filter((source) => startupSourceSet.has(source));
  const unexpectedStartupEndingMemorySceneImages = startupEndingMemorySceneImages
    .filter((source) => !firstGameplaySources.includes(source));
  const missingCoveredEndingMemorySceneImages = ENDING_MEMORY_SCENE_IMAGE_SOURCES
    .filter((source) => !startupSourceSet.has(source) && !postStartupSourceSet.has(source));

  assertFlow(
    "startup gate blocks on critical desktop icons, early story images, support assets, first portfolio boards, and entrepreneurship ending art",
    startupSources.length === 20
      && gameplaySources.length === startupSources.length + postStartupSources.length
      && postStartupSources.length > 0
      && ENDING_MEMORY_SCENE_IMAGE_SOURCES.length === 108
      && startupEndingMemorySceneImages.length === 3
      && unexpectedStartupEndingMemorySceneImages.length === 0
      && missingCoveredEndingMemorySceneImages.length === 0
      && startupEndingIllustrations.length === expectedStartupEndingIllustrations.length
      && allEndingIllustrations.length === expectedAllEndingIllustrations.length
      && expectedAllEndingIllustrations.every((source) => allEndingIllustrations.includes(source))
      && missingStartupFailureEndingIllustrations.length === 0
      && missingStartupRouteEndingIllustrations.length === 0
      && unexpectedStartupEndingIllustrations.length === 0
      && missingStartupSupportQrImages.length === 0
      && missingStartupPortfolioBoards.length === 0
      && opportunisticStartupSources.length === 14
      && duplicateOpportunisticStartupSources.length === 0
      && opportunisticStartupPortfolioBoards.length === 0
      && opportunisticStartupEndingIllustrations.length === baselineEndingIllustrations.length
      && opportunisticStartupEndingMemorySceneImages.length === 12
      && baselineEndingIllustrations.length === 2
      && missingBaselineEndingIllustrations.length === 0
      && unexpectedPostStartupEndingIllustrations.length === 0
      && UI_ICON_FINAL_IMAGE_SOURCES.length === 728
      && atlasSources.length === 1
      && missingFinalIconAtlasEntries.length === 0
      && directFinalIconRequests.length === 0
      && startupSourceSet.has(startupClockSource)
      && missingFirstGameplaySources.length === 0
      && missingSummerSketchSources.length === 0
      && gameClockAtlas === atlasSources[0]
      && startupCoverAtlas === atlasSources[0]
      && !atlasSources.some((source) => source.includes("ui-icon-atlas-large"))
      && atlasSources.every((source) => startupSourceSet.has(source))
      && missingVisibleStartupIcons.length === 0
      && startupPortfolioBoards.length === 2
      && portfolioBoards.every((source) => postStartupSourceSet.has(source) || startupSourceSet.has(source))
      && startSceneIndexes.every((index) => index >= 0)
      && atlasIndexes.every((index) => index >= 0)
      && fixedEventIndexes.every((index) => index >= 0)
      && summerSketchIndexes.every((index) => index >= 0)
      && Math.max(...startSceneIndexes) < Math.min(...atlasIndexes)
      && Math.max(...atlasIndexes) < Math.min(...fixedEventIndexes)
      && Math.max(...fixedEventIndexes) < Math.min(...summerSketchIndexes),
    {
      startupCount: startupSources.length,
      gameplayCount: gameplaySources.length,
      postStartupCount: postStartupSources.length,
      endingMemorySceneCount: ENDING_MEMORY_SCENE_IMAGE_SOURCES.length,
      startupEndingMemorySceneImages,
      unexpectedStartupEndingMemorySceneImages,
      missingCoveredEndingMemorySceneImages,
      atlasSources,
      expectedFinalIconCount: UI_ICON_FINAL_IMAGE_SOURCES.length,
      missingFinalIconAtlasEntries,
      directFinalIconRequests,
      startupClockSource,
      gameClockAtlas,
      startupCoverAtlas,
      missingFirstGameplaySources,
      missingSummerSketchSources,
      missingVisibleStartupIcons,
      portfolioBoards,
      startSceneIndexes,
      atlasIndexes,
      fixedEventIndexes,
      summerSketchIndexes,
      opportunisticStartupCount: opportunisticStartupSources.length,
      duplicateOpportunisticStartupSources,
      opportunisticStartupPortfolioBoards,
      opportunisticStartupEndingIllustrations,
      opportunisticStartupEndingMemorySceneImages,
      baselineEndingIllustrations,
      startupFailureEndingIllustrations,
      startupRouteEndingIllustrations,
      expectedAllEndingIllustrations,
      allEndingIllustrations,
      startupEndingIllustrations,
      missingStartupFailureEndingIllustrations,
      missingStartupRouteEndingIllustrations,
      unexpectedStartupEndingIllustrations,
      missingStartupSupportQrImages,
      missingStartupPortfolioBoards,
      missingBaselineEndingIllustrations,
      unexpectedPostStartupEndingIllustrations,
    },
  );
}

{
  const appRuntimeSource = readFileSync(new URL("../app.mjs", import.meta.url), "utf8");
  const endingMemoryRuntimeSource = readFileSync(new URL("../../hyperframes/ending-memory/main.js", import.meta.url), "utf8");
  const endingMemoryIndexSource = readFileSync(new URL("../../hyperframes/ending-memory/index.html", import.meta.url), "utf8");
  const endingMemoryBuildSource = readFileSync(new URL("../scripts/build-aliyun-static.mjs", import.meta.url), "utf8");
  const expectedVersionRefs = [
    `styles.css?v=${ENDING_MEMORY_ASSET_VERSION}`,
    `scenes.generated.js?v=${ENDING_MEMORY_ASSET_VERSION}`,
    `main.js?v=${ENDING_MEMORY_ASSET_VERSION}`,
  ];

  assertFlow(
    "ending memory runtime keeps bounded initial eager loading and matching asset versions",
    endingMemoryRuntimeSource.includes("const IMAGE_DECODE_BATCH_SIZE = 8;")
      && endingMemoryRuntimeSource.includes("const EAGER_IMAGE_COUNT = 24;")
      && endingMemoryRuntimeSource.includes("const HIGH_PRIORITY_IMAGE_COUNT = 16;")
      && endingMemoryRuntimeSource.includes('img.loading = scene.index < EAGER_IMAGE_COUNT ? "eager" : "lazy";')
      && endingMemoryRuntimeSource.includes('img.fetchPriority = scene.index < HIGH_PRIORITY_IMAGE_COUNT ? "high" : "auto";')
      && endingMemoryRuntimeSource.includes("function promoteImagesForPreload(images)")
      && endingMemoryRuntimeSource.includes("function endingMemoryImageUrl(source)")
      && endingMemoryRuntimeSource.includes("R2_ASSET_ORIGIN")
      && endingMemoryRuntimeSource.includes("ASSET_PATH_PREFIX")
      && endingMemoryRuntimeSource.includes("DOMESTIC_STARTUP_STORY_EVENT_IMAGE_PATHS")
      && endingMemoryRuntimeSource.includes("img.src = imageUrl;")
      && appRuntimeSource.includes("const ENDING_ASSET_SPRINT_PRELOAD_SEMESTER_INDEX = 6;")
      && appRuntimeSource.includes("function maybeQueueEndingAssetSprintWarmup()")
      && appRuntimeSource.includes("function shouldSprintEndingAssetWarmup(sourceState)")
      && appRuntimeSource.includes("queueEndingIllustrationPreloads();")
      && appRuntimeSource.includes("const ENDING_MEMORY_ENTRY_INITIAL_IMAGE_COUNT = 36;")
      && appRuntimeSource.includes("const ENDING_MEMORY_SCENE_IMAGE_PRELOAD_CONCURRENCY = 16;")
      && appRuntimeSource.includes("queueEndingMemoryAnimationWarmup({ includeSceneImages: true });")
      && expectedVersionRefs.every((ref) => endingMemoryIndexSource.includes(ref)),
    {
      expectedVersion: ENDING_MEMORY_ASSET_VERSION,
      missingVersionRefs: expectedVersionRefs.filter((ref) => !endingMemoryIndexSource.includes(ref)),
    },
  );

  assertFlow(
    "selected ending music is warmed before ending memory entry",
    appRuntimeSource.includes("function queueSelectedEndingMusicPreload()")
      && appRuntimeSource.includes("const audioUrl = track?.src ? assetUrl(track.src) : \"\";")
      && appRuntimeSource.includes("const lyricsUrl = track?.lyricsSrc ? assetUrl(track.lyricsSrc) : \"\";")
      && appRuntimeSource.includes("function selectedEndingMusicPreloadKey(trackId, audioUrl, lyricsUrl)")
      && appRuntimeSource.includes("preloadPlayableAudioForGate([audioUrl]")
      && appRuntimeSource.includes("preloadMediaForGate([lyricsUrl]")
      && appRuntimeSource.includes("queueSelectedEndingMusicPreload();\n  queueEndingIllustrationPreloads();")
      && appRuntimeSource.includes("selectedEndingMusicPreloadKeys.add(preloadKey);")
      && !appRuntimeSource.includes("function preloadSelectedEndingMusicForEntry")
      && !appRuntimeSource.includes("preloadSelectedEndingMusicForEntry(),"),
    {
      hasSelectedEndingPreload: appRuntimeSource.includes("function queueSelectedEndingMusicPreload()"),
      hasEntryPreloadFunction: appRuntimeSource.includes("function preloadSelectedEndingMusicForEntry"),
      hasEntryPreloadCall: appRuntimeSource.includes("preloadSelectedEndingMusicForEntry(),"),
    },
  );

  assertFlow(
    "R2 audio stays on one CORS-readable resource path",
    appRuntimeSource.includes("function isCorsReadableAudioResourceUrl(url)")
      && appRuntimeSource.includes("return source.startsWith(R2_ASSET_BASE_URL)")
      && appRuntimeSource.includes("|| (source.startsWith(DOMESTIC_ASSET_BASE_URL) && window.location.origin === \"https://arch.25thgame.vip\");")
      && !appRuntimeSource.includes("function retryLyricUrl")
      && !appRuntimeSource.includes("lyrics-retry")
      && !appRuntimeSource.includes("forceNoCrossOrigin")
      && !appRuntimeSource.includes("forceNoCors")
      && !appRuntimeSource.includes("function shouldRetryCorsReadableAudioWithoutCors"),
    {
      hasCorsReadableAudioCheck: appRuntimeSource.includes("function isCorsReadableAudioResourceUrl(url)"),
      hasR2AudioCors: appRuntimeSource.includes("source.startsWith(R2_ASSET_BASE_URL)"),
    },
  );

  assertFlow(
    "ending memory lyrics keep an independent reveal cursor without seeking audio",
    appRuntimeSource.includes("let currentEndingMemoryLyricIndex = -2;")
      && appRuntimeSource.includes("currentEndingMemoryLyricIndex === index")
      && !appRuntimeSource.includes("seekEndingMemoryAudioToLyricStart")
      && !appRuntimeSource.includes("maybeSeekEndingMemoryAudioToFirstLyric"),
    {
      hasEndingMemoryLyricCursor: appRuntimeSource.includes("let currentEndingMemoryLyricIndex = -2;"),
      hasAudioSeek: appRuntimeSource.includes("seekEndingMemoryAudioToLyricStart")
        || appRuntimeSource.includes("maybeSeekEndingMemoryAudioToFirstLyric"),
    },
  );

  assertFlow(
    "ending memory build keeps scene URLs logical for runtime host routing",
    endingMemoryBuildSource.includes("Ending memory scene image URLs stay logical")
      && endingMemoryBuildSource.includes("resolves them per host"),
    {},
  );
}

{
  const startupSourceSet = new Set(criticalStartupImageSources({ isMobileStartSurface: false }));
  const postStartupSources = postStartupGameplayImageSources({ isMobileStartSurface: false });
  const duplicateStartupSources = postStartupSources.filter((source) => startupSourceSet.has(source));
  const baselineEndingIllustrations = baselineEndingIllustrationSources();
  const routePostgradDreamIllustrations = routeEndingIllustrationSources("postgrad_dream");
  const portfolioBoards = portfolioBoardImageSources();
  const startupPortfolioBoards = startupPortfolioBoardImageSources();
  const postStartupPortfolioBoards = portfolioBoards
    .filter((source) => postStartupSources.includes(source));
  const missingPortfolioBoards = portfolioBoards
    .filter((source) => !startupSourceSet.has(source) && !postStartupSources.includes(source));
  const portfolioIndexes = postStartupPortfolioBoards.map((source) => postStartupSources.indexOf(source));
  const baselineEndingIndexes = baselineEndingIllustrations.map((source) => postStartupSources.indexOf(source));
  const routePostgradDreamInPostStartup = routePostgradDreamIllustrations
    .filter((source) => postStartupSources.includes(source));

  assertFlow(
    "post-start desktop image preloads remaining portfolio boards before baseline endings",
    postStartupSources.length > 0
      && duplicateStartupSources.length === 0
      && startupPortfolioBoards.length === 2
      && startupPortfolioBoards.every((source) => startupSourceSet.has(source))
      && postStartupPortfolioBoards.length === portfolioBoards.length - startupPortfolioBoards.length
      && missingPortfolioBoards.length === 0
      && portfolioIndexes.every((index) => index >= 0)
      && baselineEndingIndexes.every((index) => index >= 0)
      && Math.max(...portfolioIndexes) < Math.min(...baselineEndingIndexes)
      && routePostgradDreamIllustrations.includes(iconSources.ENDING_ILLUSTRATION_PATHS.elite_exam_postgrad)
      && routePostgradDreamIllustrations.includes(iconSources.ENDING_ILLUSTRATION_PATHS.postgrad_retry)
      && routePostgradDreamInPostStartup.length === 0
      && ENDING_MEMORY_SCENE_IMAGE_SOURCES
        .every((source) => postStartupSources.includes(source) || startupSourceSet.has(source)),
    {
      postStartupCount: postStartupSources.length,
      duplicateStartupSources: duplicateStartupSources.slice(0, 20),
      duplicateStartupCount: duplicateStartupSources.length,
      startupPortfolioBoards,
      postStartupPortfolioBoards,
      missingPortfolioBoards,
      portfolioIndexes,
      baselineEndingIndexes,
      baselineEndingIllustrations,
      routePostgradDreamIllustrations,
      routePostgradDreamInPostStartup,
    },
  );
}

{
  const mobileStartupSources = criticalStartupImageSources({ isMobileStartSurface: true });
  const mobileStartupSourceSet = new Set(mobileStartupSources);
  const atlasSources = uiIconAtlasImageSources();
  const startupClockSource = iconSources.UI_ICON_PATHS.loading_clock;
  const firstGameplaySources = [
    "/optimized/assets/characters/role-card-back.57c9bfd03c0b.webp",
    GAME_REQUIRED_IMAGES.openingCeremony.src,
    GAME_REQUIRED_IMAGES.militaryTraining.src,
    GAME_REQUIRED_IMAGES.architectureLifeStart.src,
  ];
  const summerSketchSources = [
    GAME_REQUIRED_IMAGES.summerSketchWuyuan.src,
    GAME_REQUIRED_IMAGES.summerSketchHongcun.src,
  ];
  const missingFirstGameplaySources = firstGameplaySources.filter((source) => !mobileStartupSourceSet.has(source));
  const missingSummerSketchSources = summerSketchSources.filter((source) => !mobileStartupSourceSet.has(source));
  const directFinalIconRequests = mobileStartupSources.filter((source) => source.includes("/optimized/asset-work/ui-icon-final/confirmed-icons/")
    || source.includes("/optimized/asset-work/ui-icon-final/unmapped-icons/"))
    .filter((source) => source !== startupClockSource);

  assertFlow(
    "mobile startup gate includes first gameplay and summer sketch images",
    mobileStartupSources.length === 10
      && mobileStartupSourceSet.has(startupClockSource)
      && missingFirstGameplaySources.length === 0
      && missingSummerSketchSources.length === 0
      && atlasSources.length === 1
      && atlasSources.every((source) => mobileStartupSourceSet.has(source))
      && directFinalIconRequests.length === 0,
    {
      mobileStartupCount: mobileStartupSources.length,
      mobileStartupSources,
      startupClockSource,
      missingFirstGameplaySources,
      missingSummerSketchSources,
      directFinalIconRequests,
    },
  );
}

{
  const startupGateTracks = startupGateBgmTracks();
  const startupGateTrackSources = new Set(startupGateTracks.map((track) => track.src));
  const expectedGateTrackSources = new Set(startupBgmTracks().slice(0, 1).map((track) => track.src));
  const deferredTrackSources = new Set(deferredStartupBgmTracks().map((track) => track.src));
  const expectedDeferredTrackSources = new Set(
    [...startupBgmTracks().slice(1), ...forcedEndingBgmTracks()].map((track) => track.src),
  );
  const duplicateSources = [...startupGateTrackSources].filter((source) => deferredTrackSources.has(source));

  assertFlow(
    "startup gate only loads the first year-one BGM; remaining startup BGM is deferred",
    startupGateTracks.length === expectedGateTrackSources.size
      && [...expectedGateTrackSources].every((source) => startupGateTrackSources.has(source))
      && deferredTrackSources.size === 12
      && deferredTrackSources.size === expectedDeferredTrackSources.size
      && [...expectedDeferredTrackSources].every((source) => deferredTrackSources.has(source))
      && duplicateSources.length === 0,
    {
      startupGateTrackCount: startupGateTracks.length,
      expectedGateTrackCount: expectedGateTrackSources.size,
      deferredTrackCount: deferredTrackSources.size,
      duplicateSources,
    },
  );
}

{
  const [yearTwoTracks, yearThreeTracks, yearFourTracks, yearFiveTracks, endingTracks] = postStartPreloadTrackGroups();
  const deferredStartupTracks = deferredStartupBgmTracks();
  const actualGroups = postStartGameBgmPreloadTrackGroups().map((group) => group.map((track) => track.id));
  const expectedGroups = [
    deferredStartupTracks,
    yearTwoTracks,
    [
      ...yearThreeTracks.slice(0, 2),
      ...yearFourTracks.slice(0, 2),
      ...yearFiveTracks.slice(0, 2),
    ],
    [
      ...yearThreeTracks.slice(2),
      ...yearFourTracks.slice(2),
      ...yearFiveTracks.slice(2),
    ],
  ].filter((group) => group.length > 0).map((group) => group.map((track) => track.id));
  const actualPreloadSources = new Set(postStartGameBgmPreloadTrackGroups().flatMap((group) => group.map((track) => track.src)));
  const endingSources = endingTracks.map((track) => track.src).filter(Boolean);
  const preloadedEndingSources = endingSources.filter((source) => actualPreloadSources.has(source));

  assertFlow(
    "post-start game BGM first preloads deferred year-one and forced-ending tracks",
    JSON.stringify(actualGroups) === JSON.stringify(expectedGroups)
      && preloadedEndingSources.length === 0,
    {
      actualGroups,
      expectedGroups,
      preloadedEndingSources,
    },
  );
}

{
  const runtimeSources = new Set();
  collectRuntimeIconSources(iconSources, runtimeSources);
  for (const track of musicLibraryTracks()) {
    if (track.cover) runtimeSources.add(track.cover);
  }
  for (const source of criticalStartupImageSources({ isMobileStartSurface: false })) {
    runtimeSources.add(source);
  }
  const legacySources = [...runtimeSources].filter((source) => isLegacyIconSource(source));

  assertFlow(
    "runtime icon sources use final icon manifest paths instead of legacy aliases",
    legacySources.length === 0,
    { legacySources: legacySources.slice(0, 40), legacyCount: legacySources.length },
  );
}

{
  const expectedConfirmedMappings = [
    [
      "PROJECT_ICONS.delivery",
      iconSources.PROJECT_ICONS.delivery,
      finalIconSourceContaining("/22-part-time-project-options/022_外卖小哥"),
    ],
    [
      "MODEL_MATERIAL_ICONS.hand_cut",
      iconSources.MODEL_MATERIAL_ICONS.hand_cut,
      finalIconSourceContaining("/24-model-week-materials/028_手工切割"),
    ],
    [
      "MODEL_MATERIAL_ICONS.laser_cut",
      iconSources.MODEL_MATERIAL_ICONS.laser_cut,
      finalIconSourceContaining("/24-model-week-materials/029_激光切割"),
    ],
    [
      "MODEL_MATERIAL_ICONS.print_3d",
      iconSources.MODEL_MATERIAL_ICONS.print_3d,
      finalIconSourceContaining("/24-model-week-materials/030_3D打印"),
    ],
    [
      "CHARACTER_SKILL_ICONS.town_exam_ace",
      iconSources.CHARACTER_SKILL_ICONS.town_exam_ace,
      finalIconSourceContaining("/11-character-skills/010_小镇做题家"),
    ],
    [
      "ATTRIBUTE_ICONS.design",
      iconSources.ATTRIBUTE_ICONS.design,
      finalIconSourceContaining("/12-role-attributes/001_设计水平"),
    ],
    [
      "ATTRIBUTE_ICONS.software",
      iconSources.ATTRIBUTE_ICONS.software,
      finalIconSourceContaining("/12-role-attributes/002_软件技术"),
    ],
    [
      "ATTRIBUTE_ICONS.aesthetic",
      iconSources.ATTRIBUTE_ICONS.aesthetic,
      finalIconSourceContaining("/12-role-attributes/003_创意审美"),
    ],
    [
      "ATTRIBUTE_ICONS.presentation",
      iconSources.ATTRIBUTE_ICONS.presentation,
      finalIconSourceContaining("/12-role-attributes/004_汇报表达"),
    ],
    [
      "ATTRIBUTE_ICONS.social",
      iconSources.ATTRIBUTE_ICONS.social,
      finalIconSourceContaining("/12-role-attributes/005_人际交往"),
    ],
    [
      "ATTRIBUTE_ICONS.resilience",
      iconSources.ATTRIBUTE_ICONS.resilience,
      finalIconSourceContaining("/12-role-attributes/006_抗压能力"),
    ],
    [
      "METER_ICONS.progress",
      iconSources.METER_ICONS.progress,
      finalIconSourceContaining("/01-runtime-ui-references/060_UIATLAS_002_007_pxui_stat_007_蓝图进"),
    ],
    [
      "METER_ICONS.quality",
      iconSources.METER_ICONS.quality,
      finalIconSourceContaining("/01-runtime-ui-references/061_UIATLAS_002_009_pxui_stat_009_奖章"),
    ],
    [
      "ROUTE_OPTION_ICONS.public_teacher",
      iconSources.ROUTE_OPTION_ICONS.public_teacher,
      finalIconSourceContaining("/35-route-public-service/021_教师岗"),
    ],
  ];
  const mismatches = expectedConfirmedMappings
    .filter(([, actual, expected]) => actual !== expected)
    .map(([key, actual, expected]) => ({ key, actual, expected }));

  assertFlow(
    "runtime icon mappings use confirmed UI rules for project, model, skill, attribute, course, and route icons",
    mismatches.length === 0,
    { mismatches },
  );
}

{
  const collection = createEmptyCollection();
  const result = recordCollectionCoffeeSupportClick(collection);

  assertFlow(
    "coffee support unlocks before any submitted ending score",
    !collectionHasSubmittedEndingScore(result.collection)
      && result.unlockedAchievementId === "honorary_shareholder"
      && result.collection.unlockedAchievementIds.includes("honorary_shareholder")
      && result.collection.coffeeSupportClicks === 1,
    {
      unlockedAchievementId: result.unlockedAchievementId,
      submittedEndingScore: collectionHasSubmittedEndingScore(result.collection),
      unlockedAchievementIds: result.collection.unlockedAchievementIds,
      coffeeSupportClicks: result.collection.coffeeSupportClicks,
    },
  );
}

{
  const emptyCollection = createEmptyCollection();
  const updated = updateCollectionLatestProfile(emptyCollection, {
    nickname: "  测试同学  ",
    universityName: "  第二十五小时测试大学  ",
  });
  const latestProfile = latestProfileForNewGame(updated.collection);

  assertFlow(
    "latest profile can be reused for a new game after registration",
    latestProfileForNewGame(emptyCollection) === null
      && latestProfile?.nickname === "测试同学"
      && latestProfile?.universityName === "第二十五小时测试大学",
    {
      emptyProfile: latestProfileForNewGame(emptyCollection),
      latestProfile,
    },
  );
}

{
  const collection = createEmptyCollection();
  const state = {
    runId: "verify-ending-music-track",
    ending: "stable_graduation",
    seed: 25,
    unlockedAchievements: [],
    actionTally: {},
    achievementTally: {},
    competitionAwardCount: 0,
  };
  hydrateStateFromCollection(state, collection);
  const selectedTrackId = musicForState(state).id;
  const result = commitRunToCollection(collection, state);
  hydrateStateFromCollection(state, result.collection);

  assertFlow(
    "committed ordinary ending music is recorded and remains fixed after hydrate",
    result.collection.playedEndingTrackIds.includes(selectedTrackId)
      && state.endingTrackId === selectedTrackId
      && musicForState(state).id === selectedTrackId,
    {
      selectedTrackId,
      endingTrackId: state.endingTrackId,
      playedEndingTrackIds: result.collection.playedEndingTrackIds,
      renderedTrackId: musicForState(state).id,
    },
  );
}

{
  const collection = createEmptyCollection();
  const state = {
    runId: "verify-seen-events",
    ending: "stable_graduation",
    seed: 25,
    unlockedAchievements: [],
    actionTally: {},
    achievementTally: {},
    competitionAwardCount: 0,
    eventHistory: [
      { id: "wrong_axis", week: 3, semesterIndex: 1, optionId: "redo" },
      { id: "roommate_snore", week: 4, semesterIndex: 1, optionId: "wake" },
      { id: "model_delivery_early", week: 5, semesterIndex: 1, optionId: null },
    ],
  };
  hydrateStateFromCollection(state, collection);
  const result = commitRunToCollection(collection, state);
  const nextState = { achievementTally: {}, eventHistory: [] };
  hydrateStateFromCollection(nextState, result.collection);

  assertFlow(
    "committed run stores normal and interactive event history for the next game",
    result.collection.seenEventIds.includes("wrong_axis")
      && result.collection.seenEventIds.includes("roommate_snore")
      && !result.collection.seenEventIds.includes("model_delivery_early")
      && nextState.historicalSeenEventIds.includes("wrong_axis")
      && nextState.historicalSeenEventIds.includes("roommate_snore"),
    {
      seenEventIds: result.collection.seenEventIds,
      hydratedHistoricalSeenEventIds: nextState.historicalSeenEventIds,
    },
  );
}

{
  const playInteractions = RANDOM_EVENTS.filter((event) => event.pool === "interactive" && (event.tags ?? []).includes("play"));
  const staleSeenIds = playInteractions.map((event) => event.id);
  const collection = { ...createEmptyCollection(), seenEventIds: staleSeenIds };
  const state = {
    runId: "verify-seen-events-reset",
    ending: "stable_graduation",
    seed: 26,
    unlockedAchievements: [],
    actionTally: {},
    achievementTally: {},
    competitionAwardCount: 0,
    historicalSeenEventIds: ["script_murder"],
    eventHistory: [{ id: "script_murder", week: 22, semesterIndex: 4, optionId: "go" }],
  };
  const result = commitRunToCollection(collection, state);

  assertFlow(
    "committed event history uses the run's historical event scope",
    result.collection.seenEventIds.includes("script_murder")
      && staleSeenIds
        .filter((id) => id !== "script_murder")
        .every((id) => !result.collection.seenEventIds.includes(id)),
    {
      staleSeenIds,
      committedSeenEventIds: result.collection.seenEventIds,
    },
  );
}

{
  const cases = [
    ["normal_drawing", "progress", 17],
    ["crunch_drawing", "progress", 24],
    ["design_iteration", "quality", 16],
    ["site_research", "quality", 14],
  ];

  for (const [actionId, key, expected] of cases) {
    const state = createWeekActionState();
    const result = performAction(state, actionId);

    assertFlow(
      `senior action bonus applies to ${actionId}`,
      result.ok === true && state[key] === expected,
      {
        actionId,
        key,
        expected,
        actual: state[key],
        result,
      },
    );
  }
}

{
  const normalState = createWeekActionState();
  normalState.year = 4;
  normalState.term = 2;
  normalState.semesterIndex = 8;
  normalState.profile.characterId = "mixed_in";
  const normalSkillResult = performAction(normalState, "special_skill");

  const graduationState = createWeekActionState();
  graduationState.term = 2;
  graduationState.semesterIndex = 10;
  graduationState.profile.characterId = "mixed_in";
  const graduationSkillResult = performAction(graduationState, "special_skill");

  assertFlow(
    "mixed in idle skill lowers normal and graduation progress gates correctly",
    normalSkillResult.ok === true
      && progressCap(normalState) === 90
      && reviewProgressRequirement(normalState) === 80
      && graduationSkillResult.ok === true
      && progressCap(graduationState) === 240
      && reviewProgressRequirement(graduationState) === 230,
    {
      normalSkillResult,
      normalProgressCap: progressCap(normalState),
      normalRequirement: reviewProgressRequirement(normalState),
      graduationSkillResult,
      graduationProgressCap: progressCap(graduationState),
      graduationRequirement: reviewProgressRequirement(graduationState),
    },
  );
}

{
  const missingTags = RANDOM_EVENTS.filter((event) => !Array.isArray(event.tags)).map((event) => event.id);
  const aiEventIds = [
    "software_gap",
    "ai_flavored_sheet",
    "ai_too_strong",
    "image2_model",
    "ai_blend_in",
    "ai_rescue",
    "ai_saves_team",
    "ai_inspiration_source",
    "ai_trial",
    "junior_praise",
    "who_designs",
    "ai_sketch",
  ];
  const aiEventsMissingTag = aiEventIds.filter((id) => !RANDOM_EVENTS.find((event) => event.id === id)?.tags?.includes("ai"));

  assertFlow(
    "random event data declares tags for every event and AI events use the ai tag",
    missingTags.length === 0 && aiEventsMissingTag.length === 0,
    { missingTags, aiEventsMissingTag },
  );
}

{
  const state = createWeekActionState();
  state.year = 1;
  state.term = 1;
  state.semesterIndex = 1;
  state.week = 3;
  state.weekInSemester = 3;
  state.phase = "week_action";
  state.actionsRemaining = 2;
  state.rngState = 1;

  const actionResult = performAction(state, "rest");
  const midweekEventId = state.pendingInteraction?.eventId;
  const midweekTrigger = state.pendingInteraction?.trigger;
  resolveAllPending(state);
  const eventCountAfterMidweek = state.eventHistory.length;
  state.actionsRemaining = 0;
  const finishResult = finishWeek(state);

  assertFlow(
    "midweek random event uses the weekly automatic event slot",
    actionResult.ok === true
      && midweekTrigger === "midweek"
      && midweekEventId
      && finishResult.ok === true
      && state.eventHistory.length === eventCountAfterMidweek,
    {
      actionResult,
      midweekEventId,
      midweekTrigger,
      eventHistory: state.eventHistory,
      randomEventCheckWeek: state.systemFlags?.randomEventCheckWeek,
    },
  );
}

{
  const state = createWeekActionState();
  const freshTarget = RANDOM_EVENTS.find((event) => event.id === "roommate_snore");
  const eligibleInteractiveIds = RANDOM_EVENTS.filter((event) => {
    if (event.pool !== "interactive") return false;
    const [semesterMin, semesterMax] = testPhaseRange(event);
    return (!semesterMin || semesterMin <= 1) && (!semesterMax || semesterMax >= 1);
  }).map((event) => event.id);
  state.year = 1;
  state.term = 1;
  state.semesterIndex = 1;
  state.week = 3;
  state.weekInSemester = 3;
  state.phase = "week_action";
  state.actionsRemaining = 2;
  state.rngState = 1;
  state.eventHistory.push({ id: "forgot_save", week: 2, semesterIndex: 1, optionId: null });
  state.historicalSeenEventIds = eligibleInteractiveIds.filter((id) => id !== freshTarget.id);

  const queued = maybeQueueMidweekEvent(state);
  const event = RANDOM_EVENTS.find((item) => item.id === state.pendingInteraction?.eventId);

  assertFlow(
    "midweek forced interactive follow-up prefers an unplayed interaction",
    queued === true
      && state.pendingInteraction?.type === "random_event"
      && state.pendingInteraction.eventId === freshTarget.id
      && state.pendingInteraction.trigger === "midweek"
      && event?.pool === "interactive",
    {
      expected: freshTarget.id,
      actual: state.pendingInteraction?.eventId,
      pendingInteraction: state.pendingInteraction,
      eventPool: event?.pool,
      historicalSeenEventIds: state.historicalSeenEventIds,
    },
  );
}

{
  const state = createWeekActionState();
  state.year = 2;
  state.term = 2;
  state.semesterIndex = 4;
  state.week = 22;
  state.weekInSemester = 4;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.guaranteedEvents.lightlyHolding = true;
  state.guaranteedEvents.deskNote = true;
  state.guaranteedEvents.aiEvents = 2;
  state.guaranteedEvents.playInteractions = 0;
  state.guaranteedEvents.romanceInteraction = true;

  queueWeeklyEvents(state);
  const firstEventId = state.pendingInteraction?.eventId;
  queueWeeklyEvents(state);

  assertFlow(
    "queued weekly interaction is not enqueued a second time before confirmation",
    Boolean(firstEventId)
      && state.pendingInteraction?.eventId === firstEventId
      && state.modalQueue.filter((interaction) => interaction?.type === "random_event" && interaction.eventId === firstEventId).length === 0,
    {
      firstEventId,
      pendingInteraction: state.pendingInteraction,
      modalQueue: state.modalQueue,
    },
  );
}

{
  const state = createWeekActionState();
  const event = RANDOM_EVENTS.find((item) => item.id === "moba");
  state.pendingInteraction = {
    type: "random_event",
    eventId: event.id,
    title: event.title,
    trigger: "normal",
    blocks: true,
    options: event.options.map((option) => ({ id: option.id, label: option.label })),
  };
  state.modalQueue = [
    {
      type: "random_event",
      eventId: event.id,
      title: event.title,
      trigger: "normal",
      blocks: true,
      options: event.options.map((option) => ({ id: option.id, label: option.label })),
    },
  ];

  const result = choosePendingInteractionOption(state, event.options[0].id);

  assertFlow(
    "confirming a random interaction clears stale duplicate event modals",
    result.ok === true
      && state.pendingInteraction?.type === "choice_result"
      && state.eventHistory.at(-1)?.id === event.id
      && state.modalQueue.every((interaction) => interaction.eventId !== event.id),
    {
      result,
      pendingInteraction: state.pendingInteraction,
      modalQueue: state.modalQueue,
      eventHistory: state.eventHistory,
    },
  );
}

{
  const state = createWeekActionState();
  const event = RANDOM_EVENTS.find((item) => item.id === "moba");
  state.pendingInteraction = {
    type: "random_event",
    eventId: event.id,
    title: event.title,
    body: event.body,
    trigger: "normal",
    blocks: true,
    options: event.options.map((option) => ({ id: option.id, label: option.label })),
  };
  const randomEventKey = modalCommandKey(state.pendingInteraction);
  const rendered = renderModal(state.pendingInteraction);

  const result = choosePendingInteractionOption(state, event.options[0].id);
  const choiceResultKey = modalCommandKey(state.pendingInteraction);

  assertFlow(
    "random event modal commands carry a stale-click guard key",
    result.ok === true
      && rendered.includes(`data-modal-type="random_event"`)
      && rendered.includes(`data-modal-key="${randomEventKey}"`)
      && state.pendingInteraction?.type === "choice_result"
      && randomEventKey !== choiceResultKey,
    {
      result,
      randomEventKey,
      choiceResultKey,
      pendingInteraction: state.pendingInteraction,
      rendered,
    },
  );
}

{
  const state = createWeekActionState();
  state.year = 4;
  state.term = 1;
  state.semesterIndex = 7;
  state.week = 37;
  state.weekInSemester = 1;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.rngState = 14336;

  queueWeeklyEvents(state);
  const rngStateAfterFailedRoll = state.rngState;
  queueWeeklyEvents(state);

  assertFlow(
    "failed weekly random event check is only rolled once per week",
    !state.pendingInteraction
      && state.systemFlags?.randomEventCheckWeek === state.week
      && rngStateAfterFailedRoll !== 14336
      && state.rngState === rngStateAfterFailedRoll,
    {
      pendingInteraction: state.pendingInteraction,
      randomEventCheckWeek: state.systemFlags?.randomEventCheckWeek,
      rngStateAfterFailedRoll,
      rngState: state.rngState,
    },
  );
}

{
  const state = createWeekActionState();
  state.year = 1;
  state.term = 1;
  state.semesterIndex = 1;
  state.week = 3;
  state.weekInSemester = 3;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.rngState = 1;
  state.eventHistory.push({ id: "forgot_save", week: 2, semesterIndex: 1, optionId: null });

  queueWeeklyEvents(state);
  const event = RANDOM_EVENTS.find((item) => item.id === state.pendingInteraction?.eventId);

  assertFlow(
    "freshman random follow-up forces an interactive event",
    state.pendingInteraction?.type === "random_event"
      && state.pendingInteraction.trigger === "early_interactive_follow_up"
      && event?.pool === "interactive",
    {
      pendingInteraction: state.pendingInteraction,
      eventPool: event?.pool,
      eventHistory: state.eventHistory,
    },
  );
}

{
  const state = createWeekActionState();
  const freshTarget = RANDOM_EVENTS.find((event) => event.id === "wrong_axis");
  const eligibleInteractiveIds = RANDOM_EVENTS.filter((event) => {
    if (event.pool !== "interactive") return false;
    const [semesterMin, semesterMax] = testPhaseRange(event);
    return (!semesterMin || semesterMin <= 1) && (!semesterMax || semesterMax >= 1);
  }).map((event) => event.id);
  state.year = 1;
  state.term = 1;
  state.semesterIndex = 1;
  state.week = 3;
  state.weekInSemester = 3;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.rngState = 1;
  state.eventHistory.push({ id: "forgot_save", week: 2, semesterIndex: 1, optionId: null });
  state.historicalSeenEventIds = eligibleInteractiveIds.filter((id) => id !== freshTarget.id);

  queueWeeklyEvents(state);
  const event = RANDOM_EVENTS.find((item) => item.id === state.pendingInteraction?.eventId);

  assertFlow(
    "freshman interactive follow-up prefers an unplayed interaction",
    state.pendingInteraction?.type === "random_event"
      && state.pendingInteraction.eventId === freshTarget.id
      && event?.pool === "interactive",
    {
      expected: freshTarget.id,
      actual: state.pendingInteraction?.eventId,
      pendingInteraction: state.pendingInteraction,
      eventPool: event?.pool,
      historicalSeenEventIds: state.historicalSeenEventIds,
    },
  );
}

{
  const state = createWeekActionState();
  const eligibleInteractiveIds = RANDOM_EVENTS.filter((event) => {
    if (event.pool !== "interactive") return false;
    const [semesterMin, semesterMax] = testPhaseRange(event);
    return (!semesterMin || semesterMin <= 1) && (!semesterMax || semesterMax >= 1);
  }).map((event) => event.id);
  const repeatableInteractiveIds = new Set(RANDOM_EVENTS
    .filter((event) => eligibleInteractiveIds.includes(event.id) && event.repeatable !== false)
    .map((event) => event.id));
  state.year = 1;
  state.term = 1;
  state.semesterIndex = 1;
  state.week = 3;
  state.weekInSemester = 3;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.rngState = 1;
  state.eventHistory.push({ id: "forgot_save", week: 2, semesterIndex: 1, optionId: null });
  state.historicalSeenEventIds = eligibleInteractiveIds;

  queueWeeklyEvents(state);
  const event = RANDOM_EVENTS.find((item) => item.id === state.pendingInteraction?.eventId);

  assertFlow(
    "freshman interactive follow-up reopens repeatable interactions after exhaustion",
    state.pendingInteraction?.type === "random_event"
      && event?.pool === "interactive"
      && repeatableInteractiveIds.has(state.pendingInteraction.eventId),
    {
      pendingInteraction: state.pendingInteraction,
      eventPool: event?.pool,
      historicalSeenEventIds: state.historicalSeenEventIds,
    },
  );
}

{
  const state = createWeekActionState();
  const modelEvents = RANDOM_EVENTS.filter((event) => event.pool === "model");
  state.year = 1;
  state.term = 1;
  state.semesterIndex = 1;
  state.week = 5;
  state.weekInSemester = 5;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.systemFlags.randomEventCheckWeek = state.week;
  state.eventHistory.push({ id: "delivery_early_normal", week: 1, semesterIndex: 1, optionId: null });
  for (const event of modelEvents) {
    if (event.id !== "model_delivery_early") {
      state.eventTally[event.id] = 1;
    }
  }

  queueWeeklyEvents(state);

  assertFlow(
    "same-title events do not repeat within one run across event ids",
    !state.pendingInteraction,
    {
      pendingInteraction: state.pendingInteraction,
      eventHistory: state.eventHistory,
      modelEventTally: Object.fromEntries(modelEvents.map((event) => [event.id, state.eventTally[event.id] ?? 0])),
    },
  );
}

{
  const state = createWeekActionState();
  const freshTarget = RANDOM_EVENTS.find((event) => event.id === "teacher_praise");
  const semesterOneCandidates = RANDOM_EVENTS.filter((event) => {
    if (event.pool === "model") return false;
    const [semesterMin, semesterMax] = testPhaseRange(event);
    return (!semesterMin || semesterMin <= 1) && (!semesterMax || semesterMax >= 1);
  });
  state.year = 1;
  state.term = 1;
  state.semesterIndex = 1;
  state.week = 4;
  state.weekInSemester = 4;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.rngState = 1;
  state.historicalSeenEventIds = semesterOneCandidates
    .map((event) => event.id)
    .filter((id) => id !== freshTarget.id);

  queueWeeklyEvents(state);

  assertFlow(
    "historical event filter prefers an unplayed normal event",
    state.pendingInteraction?.eventId === freshTarget.id,
    {
      expected: freshTarget.id,
      actual: state.pendingInteraction?.eventId,
      historicalSeenEventIds: state.historicalSeenEventIds,
    },
  );
}

{
  const state = createWeekActionState();
  state.year = 2;
  state.term = 2;
  state.semesterIndex = 4;
  state.week = 24;
  state.weekInSemester = 6;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.systemFlags.randomEventCheckWeek = state.week;
  state.guaranteedEvents.lightlyHolding = true;
  state.guaranteedEvents.deskNote = true;
  state.guaranteedEvents.aiEvents = 1;
  state.guaranteedEvents.playInteractions = 2;
  state.guaranteedEvents.romanceInteraction = true;
  state.eventHistory.push({ id: "ai_too_strong", week: 23, semesterIndex: 4, optionId: null });
  state.eventTally.ai_too_strong = 1;

  queueWeeklyEvents(state);

  assertFlow(
    "AI guarantee waits after a recent AI event",
    !state.pendingInteraction,
    {
      pendingInteraction: state.pendingInteraction,
      eventHistory: state.eventHistory,
      randomEventCheckWeek: state.systemFlags?.randomEventCheckWeek,
    },
  );
}

{
  const playInteractions = RANDOM_EVENTS.filter((event) => event.pool === "interactive" && (event.tags ?? []).includes("play"));
  const freshTarget = playInteractions.find((event) => event.id === "script_murder");
  const state = createWeekActionState();
  state.year = 2;
  state.term = 2;
  state.semesterIndex = 4;
  state.week = 22;
  state.weekInSemester = 4;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.guaranteedEvents.lightlyHolding = true;
  state.guaranteedEvents.deskNote = true;
  state.guaranteedEvents.aiEvents = 2;
  state.guaranteedEvents.playInteractions = 0;
  state.guaranteedEvents.romanceInteraction = true;
  state.historicalSeenEventIds = playInteractions
    .map((event) => event.id)
    .filter((id) => id !== freshTarget.id);

  queueWeeklyEvents(state);

  assertFlow(
    "historical interactive event filter prefers an unplayed interaction",
    state.pendingInteraction?.eventId === freshTarget.id,
    {
      expected: freshTarget.id,
      actual: state.pendingInteraction?.eventId,
      historicalSeenEventIds: state.historicalSeenEventIds,
    },
  );
}

{
  const playInteractions = RANDOM_EVENTS.filter((event) => event.pool === "interactive" && (event.tags ?? []).includes("play"));
  const state = createWeekActionState(26);
  const historicalSeenEventIds = playInteractions.map((event) => event.id);
  const repeatableInteractionIds = new Set(playInteractions.filter((event) => event.repeatable !== false).map((event) => event.id));
  state.year = 2;
  state.term = 2;
  state.semesterIndex = 4;
  state.week = 22;
  state.weekInSemester = 4;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.guaranteedEvents.lightlyHolding = true;
  state.guaranteedEvents.deskNote = true;
  state.guaranteedEvents.aiEvents = 2;
  state.guaranteedEvents.playInteractions = 0;
  state.guaranteedEvents.romanceInteraction = true;
  state.historicalSeenEventIds = [...historicalSeenEventIds];
  state.systemFlags.randomEventCheckWeek = state.week;

  queueWeeklyEvents(state);

  assertFlow(
    "historical interactive guarantee reopens repeatable interactions after exhaustion",
    state.pendingInteraction?.type === "random_event"
      && state.pendingInteraction.eventId === "script_murder"
      && repeatableInteractionIds.has(state.pendingInteraction.eventId)
      && state.historicalSeenEventIds.includes(state.pendingInteraction.eventId),
    {
      pendingInteraction: state.pendingInteraction,
      historicalSeenEventIds: state.historicalSeenEventIds,
    },
  );
}

{
  const legacyFallbackIds = [
    "allnight_champion",
    "teacher_case_weapon",
    "still_case_study",
    "cad_crash",
    "read_no_reply",
    "dawn_company",
    "studio_sunrise",
  ];
  const state = createWeekActionState(26);
  const eligibleEvents = RANDOM_EVENTS.filter((event) => {
    if (event.pool === "model") return false;
    const [semesterMin, semesterMax] = testPhaseRange(event);
    return (!semesterMin || semesterMin <= 1) && (!semesterMax || semesterMax >= 1);
  });
  const eligibleIds = eligibleEvents.map((event) => event.id);
  const repeatableIds = new Set(eligibleEvents.filter((event) => event.repeatable !== false).map((event) => event.id));
  state.year = 1;
  state.term = 1;
  state.semesterIndex = 1;
  state.week = 4;
  state.weekInSemester = 4;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.rngState = 1;
  state.historicalSeenEventIds = eligibleIds;

  queueWeeklyEvents(state);

  assertFlow(
    "historical event fallback reopens the repeatable event pool",
    state.pendingInteraction?.type === "random_event"
      && state.pendingInteraction.eventId === "forgot_save"
      && repeatableIds.has(state.pendingInteraction.eventId)
      && !legacyFallbackIds.includes(state.pendingInteraction.eventId)
      && state.historicalSeenEventIds.includes(state.pendingInteraction.eventId),
    {
      actual: state.pendingInteraction?.eventId,
      legacyFallbackIds,
      historicalSeenEventIds: state.historicalSeenEventIds,
    },
  );
}

{
  const state = createWeekActionState();
  state.year = 1;
  state.term = 2;
  state.semesterIndex = 2;
  state.week = 7;
  state.weekInSemester = 1;
  state.phase = "week_settlement";
  state.actionsRemaining = 0;
  state.historicalSeenEventIds = ["lightly_holding"];
  state.systemFlags.randomEventCheckWeek = state.week;

  queueWeeklyEvents(state);

  assertFlow(
    "historical non-repeatable guaranteed event is not forced again",
    !state.pendingInteraction,
    {
      pendingInteraction: state.pendingInteraction,
      historicalSeenEventIds: state.historicalSeenEventIds,
    },
  );
}

{
  const state = createWeekActionState();
  state.year = 2;
  state.term = 1;
  state.semesterIndex = 3;
  state.week = 13;
  state.weekInSemester = 2;
  state.phase = "week_action";
  state.actionsRemaining = 0;
  state.money = 5000;
  state.activeInternship = {
    targetId: "architecture_local",
    targetLabel: "地方设计院",
    tier: "ordinary",
    value: 1,
    startSemesterIndex: state.semesterIndex,
    startYear: state.year,
    startTerm: state.term,
    startWeek: state.week,
    remainingWeeks: 3,
    weeksCompleted: 0,
    wageTotal: 0,
    shortEventId: "internship_ordinary_blueprint",
    shortEventWeek: 1,
    shortEventTriggered: false,
  };

  const finishResult = finishWeek(state);
  const settlementLogsAfterFinish = state.logs.filter((log) => log.source === "weekly_living_cost").length;

  assertFlow(
    "internship short event appears as a blocking event modal",
    finishResult.ok === true
      && state.pendingInteraction?.type === "random_event"
      && state.pendingInteraction?.trigger === "internship"
      && state.pendingInteraction?.eventId === "internship_ordinary_blueprint"
      && state.activeInternship?.shortEventTriggered === true
      && settlementLogsAfterFinish === 1,
    {
      finishResult,
      pendingInteraction: state.pendingInteraction,
      activeInternship: state.activeInternship,
      settlementLogsAfterFinish,
    },
  );

  choosePendingInteractionOption(state, "confirm");
  advanceGameFlow(state);

  assertFlow(
    "confirming internship short event resumes without repeating weekly settlement",
    state.phase === "week_action"
      && state.week === 14
      && state.weeklySettlementApplied === false
      && state.logs.filter((log) => log.source === "weekly_living_cost").length === 1,
    {
      phase: state.phase,
      week: state.week,
      weekInSemester: state.weekInSemester,
      weeklySettlementApplied: state.weeklySettlementApplied,
      livingCostLogs: state.logs.filter((log) => log.source === "weekly_living_cost"),
    },
  );
}

{
  const modelToolkitState = createWeekActionState();
  modelToolkitState.money = 1000;
  modelToolkitState.quality = 10;
  modelToolkitState.shopEffects.modelNegativeLossReduction = true;
  modelToolkitState.pendingInteraction = {
    type: "random_event",
    eventId: "model_expensive_material",
    trigger: "model",
  };

  const modelToolkitResult = choosePendingInteractionOption(modelToolkitState, "confirm");

  assertFlow(
    "advanced model toolkit reduces model-week quality and money losses without blocking pressure",
    modelToolkitResult.ok === true
      && modelToolkitState.money === 850
      && modelToolkitState.quality === 9
      && modelToolkitState.pressure === 3
      && modelToolkitState.eventHistory.at(-1)?.id === "model_expensive_material",
    {
      modelToolkitResult,
      money: modelToolkitState.money,
      quality: modelToolkitState.quality,
      pressure: modelToolkitState.pressure,
      eventHistory: modelToolkitState.eventHistory,
    },
  );
}

{
  const markOnlyVirusFresh = (state) => {
    for (const event of RANDOM_EVENTS) {
      if (event.id === "virus_plugin") continue;
      if (event.pool !== "normal" && event.pool !== "interactive") continue;
      const [semesterMin, semesterMax] = testPhaseRange(event);
      if (semesterMin && state.semesterIndex < semesterMin) continue;
      if (semesterMax && state.semesterIndex > semesterMax) continue;
      state.eventTally[event.id] = 1;
    }
  };
  const allowedState = createWeekActionState(1);
  allowedState.year = 3;
  allowedState.term = 1;
  allowedState.semesterIndex = 5;
  allowedState.week = 25;
  allowedState.weekInSemester = 1;
  allowedState.phase = "week_settlement";
  allowedState.actionsRemaining = 0;
  allowedState.guaranteedEvents.aiEvents = 2;
  markOnlyVirusFresh(allowedState);

  const blockedState = createWeekActionState(1);
  blockedState.year = allowedState.year;
  blockedState.term = allowedState.term;
  blockedState.semesterIndex = allowedState.semesterIndex;
  blockedState.week = allowedState.week;
  blockedState.weekInSemester = allowedState.weekInSemester;
  blockedState.phase = allowedState.phase;
  blockedState.actionsRemaining = 0;
  blockedState.guaranteedEvents.aiEvents = allowedState.guaranteedEvents.aiEvents;
  blockedState.shopEffects.blockComputerEvents = true;
  markOnlyVirusFresh(blockedState);

  queueWeeklyEvents(allowedState);
  queueWeeklyEvents(blockedState);

  assertFlow(
    "alienware computer protection blocks virus plugin event",
    allowedState.pendingInteraction?.eventId === "virus_plugin"
      && !blockedState.pendingInteraction,
    {
      allowedEvent: allowedState.pendingInteraction,
      blockedEvent: blockedState.pendingInteraction,
    },
  );
}

{
  const pressureImmuneState = createCharacterWeekActionState("pressure_immune");
  pressureImmuneState.pressure = 10;
  const pressureImmuneDelta = applyDelta(
    pressureImmuneState,
    "test:pressure",
    "测试压力增量",
    { pressure: 10 },
    "week_action",
  );

  const poorScholarState = createCharacterWeekActionState("poor_scholar");
  const poorScholarResult = performAction(poorScholarState, "learn_ai_software");

  const fullPressureState = createCharacterWeekActionState("full_pressure");
  fullPressureState.pressure = 70;
  const fullPressureResult = performAction(fullPressureState, "normal_drawing");

  const futureBossState = createCharacterWeekActionState("future_boss");
  futureBossState.money = 0;
  const futureBossAction = performAction(futureBossState, "part_time");
  futureBossState.pressure = 85;
  const futureBossProject = chooseProject(futureBossState, "leaflets");

  assertFlow(
    "character passives adjust pressure, action yields, and high-risk part-time income",
    pressureImmuneDelta.pressure === 9
      && pressureImmuneState.pressure === 19
      && poorScholarResult.ok === true
      && poorScholarState.pressure === 6
      && poorScholarState.attributes.software === 3
      && fullPressureResult.ok === true
      && fullPressureState.progress === 18
      && futureBossAction.ok === true
      && futureBossProject.ok === true
      && futureBossState.money === 300,
    {
      pressureImmuneDelta,
      pressureImmunePressure: pressureImmuneState.pressure,
      poorScholarResult,
      poorScholarPressure: poorScholarState.pressure,
      poorScholarSoftware: poorScholarState.attributes.software,
      fullPressureResult,
      fullPressureProgress: fullPressureState.progress,
      futureBossAction,
      futureBossProject,
      futureBossMoney: futureBossState.money,
    },
  );
}

{
  const partTimeState = createCharacterWeekActionState("future_boss");
  const partTimePresentationBefore = partTimeState.attributes.presentation;
  const partTimeSocialBefore = partTimeState.attributes.social;
  const partTimeAction = performAction(partTimeState, "part_time");
  partTimeState.pressure = 85;
  const partTimeProject = chooseProject(partTimeState, "leaflets");

  const outsourcingState = createWeekActionState();
  outsourcingState.attributes.design = 33;
  const outsourcingDesignBefore = outsourcingState.attributes.design;
  const outsourcingAestheticBefore = outsourcingState.attributes.aesthetic;
  const outsourcingResilienceBefore = outsourcingState.attributes.resilience;
  const outsourcingAction = performAction(outsourcingState, "outsourcing");
  outsourcingState.pressure = 85;
  const outsourcingProject = chooseProject(outsourcingState, "marker_rendering");

  assertFlow(
    "high-risk project penalties keep positive attribute rewards above zero",
    partTimeAction.ok === true
      && partTimeProject.ok === true
      && partTimeState.attributes.presentation - partTimePresentationBefore >= 0.5
      && partTimeState.attributes.social - partTimeSocialBefore >= 0.5
      && outsourcingAction.ok === true
      && outsourcingProject.ok === true
      && outsourcingState.attributes.design - outsourcingDesignBefore >= 0.5
      && outsourcingState.attributes.aesthetic - outsourcingAestheticBefore >= 0.5
      && outsourcingState.attributes.resilience - outsourcingResilienceBefore >= 0.5,
    {
      partTimeAction,
      partTimeProject,
      partTimePresentationBefore,
      partTimeSocialBefore,
      partTimeAttributes: partTimeState.attributes,
      outsourcingAction,
      outsourcingProject,
      outsourcingDesignBefore,
      outsourcingAestheticBefore,
      outsourcingResilienceBefore,
      outsourcingAttributes: outsourcingState.attributes,
    },
  );
}

{
  const state = createWeekActionState();
  state.actionsRemaining = 3;
  state.weeklyActionCounts = { part_time: 2 };
  const actions = resolveActionAvailability(state);
  const outsourcingAvailability = actions.find((action) => action.id === "outsourcing");
  const partTimeAvailability = actions.find((action) => action.id === "part_time");
  const partTimeProjects = availableProjects(state, "part_time");

  assertFlow(
    "outsourcing and part-time share one weekly limit",
    outsourcingAvailability?.state === "disabled"
      && partTimeAvailability?.state === "disabled"
      && outsourcingAvailability.reason === "本周外包/兼职次数已达合计上限"
      && partTimeAvailability.reason === "本周外包/兼职次数已达合计上限"
      && partTimeProjects.every((project) => project.state === "disabled" && project.reason === "本周外包/兼职次数已达合计上限"),
    {
      outsourcingAvailability,
      partTimeAvailability,
      partTimeProjects,
    },
  );
}

{
  const mixedInState = createCharacterWeekActionState("mixed_in");
  mixedInState.year = 2;
  mixedInState.term = 1;
  mixedInState.semesterIndex = 3;
  mixedInState.phase = "review";
  mixedInState.progress = 75;
  mixedInState.quality = 100;
  const mixedInRecord = finalizeReview(mixedInState, null);

  const relaxedState = createCharacterWeekActionState("born_lucky");
  relaxedState.pressure = 78;
  applyDelta(relaxedState, "test:relaxed_1", "压力越线", { pressure: 2 }, "week_action");
  applyDelta(relaxedState, "test:relaxed_2", "压力再次越线", { pressure: 10 }, "week_action");
  applyDelta(relaxedState, "test:relaxed_3", "压力第三次越线", { pressure: 10 }, "week_action");
  applyDelta(relaxedState, "test:relaxed_4", "压力第四次越线", { pressure: 10 }, "week_action");

  const exactPressureState = createCharacterWeekActionState("born_lucky");
  exactPressureState.pressure = 99;
  applyDelta(exactPressureState, "test:relaxed_exact", "压力刚好满值", { pressure: 1 }, "week_action");

  assertFlow(
    "mixed in rescues near progress failure and born lucky relaxes only three times",
    mixedInRecord.finalGrade === "D"
      && mixedInRecord.finalScore === 60
      && mixedInRecord.mixedInProgressRescue?.progressGap === 15
      && mixedInState.passiveState.mixedInYear === 2
      && relaxedState.passiveState.relaxedTriggers === 3
      && relaxedState.pressure === 80
      && exactPressureState.passiveState.relaxedTriggers === 1
      && exactPressureState.pressure === 90
      && !exactPressureState.ending,
    {
      mixedInRecord,
      mixedInPassiveState: mixedInState.passiveState,
      relaxedPassiveState: relaxedState.passiveState,
      relaxedPressure: relaxedState.pressure,
      exactPressurePassiveState: exactPressureState.passiveState,
      exactPressure: exactPressureState.pressure,
      exactPressureEnding: exactPressureState.ending,
    },
  );
}

{
  const corbusierThresholdState = createCharacterWeekActionState("corbusier_heir");
  const corbusierThresholds = effectiveInternshipAttributes(corbusierThresholdState, { design: 50, software: 40 });

  const geneRebelThresholdState = createCharacterWeekActionState("gene_rebel");
  const geneRebelThresholds = effectiveInternshipAttributes(geneRebelThresholdState, { design: 50, software: 40 });

  const corbusierInternshipState = createAcceptedInternshipState("corbusier_heir");
  const corbusierInternshipResult = applyForInternship(corbusierInternshipState, "architecture_small");

  const geneRebelInternshipState = createAcceptedInternshipState("gene_rebel");
  const geneRebelInternshipResult = applyForInternship(geneRebelInternshipState, "architecture_small");

  const corbusierReportState = createReadPptReportState("corbusier_heir");
  const corbusierReportResult = chooseReportStrategy(corbusierReportState, "read_ppt");

  const designEnablerReportState = createReadPptReportState("design_enabler");
  const designEnablerReportResult = chooseReportStrategy(designEnablerReportState, "read_ppt");

  assertFlow(
    "resource and report passives apply their numeric adjustments",
    corbusierThresholds.design === 43
      && corbusierThresholds.software === 33
      && geneRebelThresholds.design === 45
      && geneRebelThresholds.software === 35
      && corbusierInternshipResult.ok === true
      && corbusierInternshipState.internshipApplications.at(-1)?.accepted === true
      && corbusierInternshipState.pressure === 10
      && geneRebelInternshipResult.ok === true
      && geneRebelInternshipState.internshipApplications.at(-1)?.accepted === true
      && geneRebelInternshipState.pressure === 8
      && corbusierReportResult.ok === true
      && corbusierReportState.pressure === 3
      && corbusierReportState.reviewDraft.strategyResult.delta.pressure === 3
      && designEnablerReportResult.ok === true
      && designEnablerReportState.reviewDraft.strategyResult.finalScore === 79,
    {
      corbusierThresholds,
      geneRebelThresholds,
      corbusierInternshipResult,
      corbusierInternshipPressure: corbusierInternshipState.pressure,
      corbusierInternshipApplications: corbusierInternshipState.internshipApplications,
      geneRebelInternshipResult,
      geneRebelInternshipPressure: geneRebelInternshipState.pressure,
      geneRebelInternshipApplications: geneRebelInternshipState.internshipApplications,
      corbusierReportResult,
      corbusierPressure: corbusierReportState.pressure,
      corbusierStrategyResult: corbusierReportState.reviewDraft.strategyResult,
      designEnablerReportResult,
      designEnablerStrategyResult: designEnablerReportState.reviewDraft.strategyResult,
    },
  );
}

{
  const questions = [
    { id: "passive_course_1", q: "1", options: { A: "对", B: "错" }, answer: "A" },
    { id: "passive_course_2", q: "2", options: { A: "对", B: "错" }, answer: "A" },
    { id: "passive_course_3", q: "3", options: { A: "对", B: "错" }, answer: "A" },
  ];

  const ordinaryCourseState = createOneCorrectCourseState("ordinary_person", questions);
  const townExamState = createOneCorrectCourseState("town_exam_ace", questions);
  const townExamPerfectState = createCharacterWeekActionState("town_exam_ace");
  townExamPerfectState.phase = "course_exam";
  townExamPerfectState.courseId = "architecture_history";
  townExamPerfectState.courseExam = { courseId: "architecture_history", index: 0, questions, answers: [] };
  townExamPerfectState.pendingInteraction = { type: "course_question" };
  answerCourseQuestion(townExamPerfectState, "A");
  answerCourseQuestion(townExamPerfectState, "A");
  answerCourseQuestion(townExamPerfectState, "A");

  assertFlow(
    "town exam ace improves positive and negative course GPA modifiers",
    ordinaryCourseState.gpaModifier === -0.2
      && townExamState.gpaModifier === -0.1
      && townExamState.courseExam.resolved === true
      && townExamPerfectState.gpaModifier === 0.2,
    {
      ordinaryGpaModifier: ordinaryCourseState.gpaModifier,
      townExamGpaModifier: townExamState.gpaModifier,
      townExamAnswers: townExamState.courseExam.answers,
      townExamPerfectGpaModifier: townExamPerfectState.gpaModifier,
    },
  );
}

{
  const state = createWeekActionState();
  state.semesterIndex = 2;
  state.week = 7;
  state.weekInSemester = 1;
  state.pendingInteraction = { type: "random_event", eventId: "software_gap", trigger: "normal" };

  const result = confirmEvent(state);

  assertFlow(
    "normal AI random events unlock AI hello achievement",
    result.ok === true
      && result.isInteractive === false
      && hasUnlocked(state, "ai_hello"),
    {
      result,
      unlockedAchievements: state.unlockedAchievements,
      pendingInteraction: state.pendingInteraction,
    },
  );
}

{
  const state = createWeekActionState();
  state.money = 10000;
  state.activeInternship = {
    targetId: "architecture_small",
    targetLabel: "独立小型工作室",
    tier: "ordinary",
    value: 1,
    remainingWeeks: 1,
    weeksCompleted: 0,
    wageTotal: 0,
  };

  applyWeeklySettlement(state);
  recordWeeklySettlement(state);

  assertFlow(
    "completed internship unlocks first internship achievement during weekly settlement",
    state.activeInternship === null
      && (state.internshipValue ?? 0) >= 1
      && hasUnlocked(state, "first_internship"),
    {
      internshipValue: state.internshipValue,
      activeInternship: state.activeInternship,
      unlockedAchievements: state.unlockedAchievements,
    },
  );
}

{
  const seniorFallModelState = createWeekActionState();
  seniorFallModelState.semesterIndex = 9;
  seniorFallModelState.weekInSemester = 5;
  seniorFallModelState.energy = 80;
  seniorFallModelState.pressure = 40;
  seniorFallModelState.money = 10000;
  recordWeeklySettlement(seniorFallModelState);

  const normalModelState = createWeekActionState();
  normalModelState.semesterIndex = 8;
  normalModelState.weekInSemester = 5;
  normalModelState.energy = 80;
  normalModelState.pressure = 40;
  normalModelState.money = 10000;
  recordWeeklySettlement(normalModelState);

  assertFlow(
    "model week achievement excludes senior fall week 5",
    !hasUnlocked(seniorFallModelState, "model_week_clear")
      && hasUnlocked(normalModelState, "model_week_clear"),
    {
      seniorFallAchievements: seniorFallModelState.unlockedAchievements,
      normalAchievements: normalModelState.unlockedAchievements,
    },
  );
}

{
  const seniorFallWanliState = createWeekActionState();
  seniorFallWanliState.semesterIndex = 9;
  seniorFallWanliState.weekInSemester = 6;
  seniorFallWanliState.eventTally.wanliRoadVisits = 1;
  recordWanliRoadVisit(seniorFallWanliState);

  const normalWanliState = createWeekActionState();
  normalWanliState.semesterIndex = 8;
  normalWanliState.weekInSemester = 6;
  normalWanliState.eventTally.wanliRoadVisits = 1;
  recordWanliRoadVisit(normalWanliState);

  assertFlow(
    "wanli busy break achievement excludes senior fall week 5 and 6",
    hasUnlocked(seniorFallWanliState, "first_wanli_road")
      && !hasUnlocked(seniorFallWanliState, "wanli_busy_break")
      && hasUnlocked(normalWanliState, "wanli_busy_break"),
    {
      seniorFallAchievements: seniorFallWanliState.unlockedAchievements,
      normalAchievements: normalWanliState.unlockedAchievements,
    },
  );
}

{
  const negativeEnergyState = createWeekActionState();
  negativeEnergyState.energy = -1;
  negativeEnergyState.money = 10000;
  recordWeeklySettlement(negativeEnergyState);

  const zeroEnergyState = createWeekActionState();
  zeroEnergyState.energy = 0;
  zeroEnergyState.money = 10000;
  recordWeeklySettlement(zeroEnergyState);

  assertFlow(
    "burned out achievement requires energy exactly zero",
    !hasUnlocked(negativeEnergyState, "burned_out")
      && hasUnlocked(zeroEnergyState, "burned_out"),
    {
      negativeEnergyAchievements: negativeEnergyState.unlockedAchievements,
      zeroEnergyAchievements: zeroEnergyState.unlockedAchievements,
    },
  );
}

{
  const pressureAt80State = createWeekActionState();
  pressureAt80State.money = 10000;
  pressureAt80State.pressure = 85;
  pressureAt80State.pressureOver80Weeks = 1;
  applyWeeklySettlement(pressureAt80State);
  recordWeeklySettlement(pressureAt80State);

  const pressureOver80State = createWeekActionState();
  pressureOver80State.money = 10000;
  pressureOver80State.pressure = 86;
  pressureOver80State.pressureOver80Weeks = 1;
  applyWeeklySettlement(pressureOver80State);
  recordWeeklySettlement(pressureOver80State);

  assertFlow(
    "pressure king achievement counts pressure strictly greater than 80",
    pressureAt80State.pressure === 80
      && pressureAt80State.pressureOver80Weeks === 0
      && !hasUnlocked(pressureAt80State, "pressure_king")
      && pressureOver80State.pressure === 81
      && pressureOver80State.pressureOver80Weeks === 2
      && hasUnlocked(pressureOver80State, "pressure_king"),
    {
      pressureAt80: {
        pressure: pressureAt80State.pressure,
        pressureOver80Weeks: pressureAt80State.pressureOver80Weeks,
        unlockedAchievements: pressureAt80State.unlockedAchievements,
      },
      pressureOver80: {
        pressure: pressureOver80State.pressure,
        pressureOver80Weeks: pressureOver80State.pressureOver80Weeks,
        unlockedAchievements: pressureOver80State.unlockedAchievements,
      },
    },
  );
}

if (failures > 0) {
  process.exit(1);
}
