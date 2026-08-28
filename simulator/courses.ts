import { randomInt } from "./rng.ts";
import { applyDelta, log } from "./resolver.ts";
import type { CourseDefinition, CourseId, GameState, StrategyId } from "./types.ts";

const COURSES: Record<CourseId, CourseDefinition> = {
  architecture_history: {
    id: "architecture_history",
    name: "architecture_history",
    delta: { aesthetic: 2 },
  },
  building_technology: {
    id: "building_technology",
    name: "building_technology",
    delta: { design: 2 },
  },
  digital_planning: {
    id: "digital_planning",
    name: "digital_planning",
    delta: { software: 2, design: 1 },
  },
  public_speaking: {
    id: "public_speaking",
    name: "public_speaking",
    delta: { presentation: 3, social: 1 },
  },
  public_administration: {
    id: "public_administration",
    name: "public_administration",
    delta: { presentation: 2, social: 2, resilience: 1 },
  },
  media_studies: {
    id: "media_studies",
    name: "media_studies",
    delta: { presentation: 2, aesthetic: 2 },
  },
  portfolio_workshop: {
    id: "portfolio_workshop",
    name: "portfolio_workshop",
    delta: { aesthetic: 2, design: 1, presentation: 1 },
  },
};

export function selectCourseForSemester(state: GameState): void {
  const course = chooseCourse(state.strategy, state.semesterIndex);
  state.selectedCourse = course;
  log(state, "semester_start", "course_select", `course selected: ${course}`, {});
}

export function resolveCourseForSemester(state: GameState): void {
  if (!state.selectedCourse) {
    return;
  }

  const course = COURSES[state.selectedCourse];
  const correctAnswers = drawCourseAnswers(state, state.strategy);
  const gpaModifier = courseGpaModifier(correctAnswers);

  applyDelta(
    state,
    `course:${course.id}`,
    `course resolved: ${course.id}, correct=${correctAnswers}`,
    { ...course.delta, gpaModifier },
    "semester_settlement",
  );

  state.courseRecords.push({
    semesterIndex: state.semesterIndex,
    course: course.id,
    correctAnswers,
    gpaModifier,
  });
}

export function courseGpaModifier(correctAnswers: number): number {
  if (correctAnswers === 3) return 0.1;
  if (correctAnswers === 2) return 0;
  if (correctAnswers === 1) return -0.2;
  return -0.3;
}

function chooseCourse(strategy: StrategyId, semesterIndex: number): CourseId {
  switch (strategy) {
    case "civil_service":
      return semesterIndex % 2 === 1 ? "public_administration" : "public_speaking";
    case "career_change":
      return semesterIndex % 2 === 1 ? "media_studies" : "portfolio_workshop";
    case "overseas":
      return semesterIndex % 2 === 1 ? "portfolio_workshop" : "architecture_history";
    case "postgrad":
      return semesterIndex % 2 === 1 ? "building_technology" : "digital_planning";
    case "architecture_job":
      return semesterIndex % 2 === 1 ? "digital_planning" : "building_technology";
    case "balanced":
      return semesterIndex % 3 === 0 ? "portfolio_workshop" : "digital_planning";
    default:
      return semesterIndex % 2 === 1 ? "architecture_history" : "building_technology";
  }
}

function drawCourseAnswers(state: GameState, strategy: StrategyId): number {
  const base = strategy === "fail_reviews" ? 0 : strategy === "normal" ? 1 : 2;
  const [rngState, bonus] = randomInt(state.rngState, 0, 1);
  state.rngState = rngState;
  return Math.min(3, base + bonus);
}
