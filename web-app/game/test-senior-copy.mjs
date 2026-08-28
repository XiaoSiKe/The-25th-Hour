import {
  ATTRIBUTE_KEYS,
  BASE_ACTIONS_PER_WEEK,
  COURSES,
  FIXED_EVENTS,
  ROUTE_OPTIONS,
  SAVE_VERSION,
  WEEKS_PER_SEMESTER,
} from "./data.mjs";
import { generateSeed } from "./rng.mjs";
import { createGame, emptyAttributes, log, updateCalendarFromSemester } from "./state.mjs";

export const SENIOR_TEST_COPY_SAVE_KEY = "twenty-fifth-hour-senior-test-copy-v2";
export const SENIOR_TEST_COPY_EVENT_HISTORY_KEY = "twenty-fifth-hour-senior-test-copy-seen-events-v1";

export function isSeniorTestCopyUrl(locationLike = globalThis.location) {
  const pathname = String(locationLike?.pathname ?? "");
  const search = new URLSearchParams(String(locationLike?.search ?? ""));
  return pathname.endsWith("/senior-test-copy.html")
    || pathname.endsWith("senior-test-copy.html")
    || search.get("copy") === "senior-test";
}

export function createSeniorTestCopyState() {
  const state = createGame({
    nickname: "测试同学",
    universityName: "第二十五小时测试大学",
    seed: "senior-test-copy-v1",
  });

  Object.assign(state, {
    version: SAVE_VERSION,
    seed: generateSeed(),
    runId: `senior-test-copy-${Date.now().toString(36)}`,
    phase: "week_action",
    year: 5,
    term: 1,
    semesterIndex: 9,
    week: (9 - 1) * WEEKS_PER_SEMESTER + 6,
    weekInSemester: 6,
    actionsRemaining: BASE_ACTIONS_PER_WEEK,
    actionsPerWeek: BASE_ACTIONS_PER_WEEK,
    weeklyActionCounts: {},
    semesterActionTally: {},
    semesterAttributeGrowth: emptyAttributes(),
    pendingInteraction: null,
    modalQueue: [],
    fixedEventIndex: FIXED_EVENTS.length,
    energy: 100,
    maxEnergy: 100,
    pressure: 12,
    money: 99999,
    gpa: 3.95,
    gpaHistory: [3.9, 4, 3.85, 4, 3.9, 4, 3.95, 4],
    gpaDirectAdjustment: 0,
    gpaModifier: 0,
    attributes: emptyAttributes(100),
    progress: 200,
    quality: 0,
    portfolio: maxRouteRequirement("portfolio") + 80,
    courseId: "digital_planning",
    courseYear: 5,
    courseHistory: COURSES.slice(0, 8).map((course) => course.id),
    courseExam: { resolved: true },
    musicYearStarted: true,
    reviews: createHighReviewHistory(),
    eventHistory: [],
    eventLastTriggeredWeek: {},
    eventTally: {},
    achievementToasts: [],
    pressureOver90Weeks: 0,
    pressureOver80Weeks: 0,
    completedGraduationDesign: false,
    pendingEnding: null,
    routeParticipation: null,
    routeExam: null,
    routeExamResults: {
      academicCorrect: 0,
      civilCorrect: 0,
      academicTaken: false,
      civilTaken: false,
    },
    internshipValue: maxRouteRequirement("internshipValue") + 2,
    namedFirmInternship: true,
    activeInternship: null,
    internshipApplications: [],
    internshipAppliedSemesters: [],
    internshipRecords: createInternshipRecords(),
    ieltsScore: Math.max(8, maxRouteRequirement("ielts")),
    ieltsExam: null,
    ieltsLastTakenSemester: 8,
    competitionSubmissionCount: 2,
    competitionAwardCount: maxRouteRequirement("competitionAwards") + 1,
    aiExperience: maxRouteRequirement("aiExperience") + 1,
    wanliRoadVisits: 0,
    wanliRoadRecords: [],
    wanliRoadActionDebt: 0,
    ending: null,
    failureReason: null,
  });

  state.profile.characterId = "corbusier_heir";
  state.profile.mentorId = "mentor_zhou";
  state.mentorCandidates = ["mentor_zhou", "mentor_lin", "mentor_xu"];
  state.characterCandidates = ["corbusier_heir", "future_boss", "town_exam_ace"];
  state.achievementTally = {
    ...state.achievementTally,
    characterIds: ["corbusier_heir"],
    mentorIds: ["mentor_zhou"],
    endingIds: [],
    scoredEndingId: null,
  };
  state.systemFlags = {
    ...state.systemFlags,
    internshipOpenPromptShown: true,
    portfolioFirstEntryPromptShown: true,
    graduationDesignReminderShown: false,
    wanliRoadOpenPromptShown: true,
  };

  updateCalendarFromSemester(state);
  log(state, "test_copy", "senior_test_copy", "大五上第 6 周测试副本：路线条件与最终路线读取条件已预置满足", {});
  return state;
}

function createHighReviewHistory() {
  return Array.from({ length: 8 }, (_, index) => {
    const semesterIndex = index + 1;
    const year = Math.ceil(semesterIndex / 2);
    const term = semesterIndex % 2 === 1 ? 1 : 2;
    const finalGrade = index % 3 === 0 ? "S" : "A";
    const finalScore = finalGrade === "S" ? 100 : 94;
    return {
      semesterIndex,
      year,
      term,
      progress: 100,
      quality: finalScore,
      qualityScore: finalScore,
      progressRequirement: 90,
      baseGrade: finalGrade,
      finalGrade,
      finalScore,
      strategyId: "read_ppt",
      strategySucceeded: true,
      designCourseGpa: finalGrade === "S" ? 4 : 3.7,
      semesterGpa: finalGrade === "S" ? 4 : 3.9,
      portfolioAdded: finalScore,
    };
  });
}

function createInternshipRecords() {
  return [
    {
      semesterIndex: 6,
      year: 3,
      term: 2,
      week: 36,
      completedWeek: 38,
      targetId: "architecture_master",
      targetLabel: "大师建筑事务所",
      target: "大师建筑事务所",
      tier: "named_firm",
      value: maxRouteRequirement("internshipValue") + 2,
      designAtOffer: 100,
      softwareAtOffer: 100,
      wageTotal: 2400,
      weeksCompleted: 3,
    },
  ];
}

function maxRouteRequirement(key) {
  return ROUTE_OPTIONS.reduce((max, option) => {
    const requirements = option.finalRequirements ?? option.requirements ?? {};
    return Math.max(max, Number(requirements[key]) || 0);
  }, 0);
}
