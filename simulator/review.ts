import {
  GRADUATION_DESIGN_PROGRESS_REQUIREMENT,
  GRADUATION_DESIGN_FINAL_PROGRESS_REQUIREMENT,
  GRADE_TO_GPA,
  isGraduationDesign,
  qualityCapForSemester,
} from "./rules.ts";
import { applyDelta, log } from "./resolver.ts";
import type { GameState, ReviewGrade, ReviewRecord } from "./types.ts";

export function resolveReview(state: GameState): ReviewRecord {
  state.phase = "review";

  const graduation = isGraduationDesign(state.semesterIndex);
  const requiredProgress = graduation ? GRADUATION_DESIGN_PROGRESS_REQUIREMENT : 95;
  applyReviewSupport(state, requiredProgress);
  const qualityScore = qualityScoreForReview(state);
  const progressGateFailed = state.progress < requiredProgress;
  const baseGrade = progressGateFailed ? "F" : gradeFromQuality(qualityScore);
  const finalGrade = baseGrade;
  const designCourseGpa = GRADE_TO_GPA[finalGrade];
  const semesterGpa = finalGrade === "F" ? 0 : clampGpa(designCourseGpa + state.gpaModifier);
  const finalScore = finalGrade === "F" ? 0 : Math.floor(qualityScore);
  const portfolioAdded = graduation && state.semesterIndex === 9 ? 0 : portfolioAddedFromReview(finalGrade, finalScore);

  const record: ReviewRecord = {
    semesterIndex: state.semesterIndex,
    year: state.year,
    term: state.term,
    progress: state.progress,
    quality: state.quality,
    baseGrade,
    finalGrade,
    designCourseGpa,
    semesterGpa,
    portfolioAdded,
    isGraduationDesign: graduation,
  };

  state.reviews.push(record);
  state.gpaHistory.push(semesterGpa);
  state.gpa = average(state.gpaHistory);
  applyDelta(state, "review_portfolio", `portfolio recorded: +${portfolioAdded}`, { portfolio: portfolioAdded }, "review");

  if (finalGrade === "F") {
    state.consecutiveFailedReviews += 1;
  } else {
    state.consecutiveFailedReviews = 0;
  }

  if (state.semesterIndex === 10) {
    state.completedGraduationDesign = finalGrade !== "F" && state.progress >= GRADUATION_DESIGN_FINAL_PROGRESS_REQUIREMENT;
  }

  log(
    state,
    "review",
    "review",
    `review resolved: ${finalGrade}, semester GPA ${semesterGpa.toFixed(2)}, portfolio +${portfolioAdded}`,
    {},
  );

  const failedReviewCount = state.reviews.filter((review) => review.finalGrade === "F").length;
  if (failedReviewCount >= 2 && !state.ending) {
    if (state.semesterIndex === 10 && !state.completedGraduationDesign) {
      state.ending = "graduation_failed";
      log(state, "review", "failure_check", "graduation design incomplete takes priority over accumulated failed reviews", {});
    } else {
      state.failureReason = "two_failed_reviews";
      state.ending = "two_failed_reviews";
      log(state, "review", "failure_check", "two accumulated failed reviews", {});
    }
  }

  state.gpaModifier = 0;
  if (!graduation) {
    state.progress = 0;
    state.quality = 0;
  }

  return record;
}

function applyReviewSupport(state: GameState, requiredProgress: number): void {
  if (state.strategy === "fail_reviews" || state.progress < requiredProgress) {
    return;
  }

  const qualityScore = qualityScoreForReview(state);
  if (qualityScore < 50 || qualityScore >= 80) {
    return;
  }

  const supportedScore = Math.min(80, qualityScore + 20);
  const qualityCap = qualityCapForSemester(state.semesterIndex);
  const supportedQuality = Math.ceil((supportedScore / 100) * qualityCap);
  const qualityDelta = Math.max(0, supportedQuality - state.quality);
  if (qualityDelta <= 0) {
    return;
  }

  applyDelta(
    state,
    "review_support",
    "Mentor task and report strategy support",
    { quality: qualityDelta },
    "review",
  );
}

function qualityScoreForReview(state: GameState): number {
  return isGraduationDesign(state.semesterIndex)
    ? Math.floor((state.quality / qualityCapForSemester(state.semesterIndex)) * 100)
    : state.quality;
}

export function gradeFromQuality(quality: number): ReviewGrade {
  if (quality >= 100) return "S";
  if (quality >= 90) return "A";
  if (quality >= 80) return "B";
  if (quality >= 70) return "C";
  if (quality >= 60) return "D";
  return "F";
}

function portfolioAddedFromReview(finalGrade: ReviewGrade, finalScore: number): number {
  return ["C", "B", "A", "S"].includes(finalGrade) ? finalScore : 0;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampGpa(value: number): number {
  return Math.max(0, Math.min(4, value));
}
