import {
  ACADEMIC_ROUTE_QUESTIONS,
  CIVIL_ROUTE_QUESTIONS,
  COURSE_QUESTIONS,
  COURSES,
  IELTS_QUESTIONS,
  MENTORS,
  REPORT_STRATEGIES,
} from "./game/data.mjs";
import { chooseReportStrategy, queueReviewResult } from "./game/commands.mjs";
import { createGame } from "./game/state.mjs";
import { renderModal } from "./ui/render.mjs";

const root = document.querySelector("[data-preview-root]");
if (!root) {
  throw new Error("Missing [data-preview-root].");
}

const mentorTaskPages = MENTORS.flatMap((mentor) => [
  createMentorTaskResultPreview(mentor, true),
  createMentorTaskResultPreview(mentor, false),
]);
const reportFeedbackPages = createReportFeedbackPreviews();
const reviewResultPages = createReviewResultPreviews();
const examQuestionPages = createExamQuestionPreviews();
const pages = [...mentorTaskPages, ...reportFeedbackPages, ...reviewResultPages, ...examQuestionPages];
const searchParams = new URLSearchParams(globalThis.location?.search ?? "");
const selectedPageId = searchParams.get("page");
const selectedPage = pages.find((page) => page.id === selectedPageId);

root.classList.toggle("is-single-preview", Boolean(selectedPage));
root.innerHTML = selectedPage ? renderPreviewPage(selectedPage) : renderPreviewGallery(pages);

function createMentorTaskResultPreview(mentor, succeeded) {
  const resultStatus = succeeded ? "成功" : "失败";
  return {
    id: `${mentor.id}-${succeeded ? "success" : "failure"}`,
    shortLabel: `${mentor.name}${resultStatus}`,
    group: "导师任务",
    interaction: {
      type: "mentor_task_result",
      title: `导师任务结算：${resultStatus}`,
      body: `${mentor.name}阶段任务「${mentor.task.name}」${succeeded ? "完成" : "未完成"}。\n${succeeded ? mentor.task.successText : mentor.task.failureText}`,
      mentorTaskSucceeded: succeeded,
      delta: succeeded ? mentor.task.reward : mentor.task.penalty,
      blocks: true,
      options: [{ id: "confirm", label: "选择汇报策略" }],
    },
  };
}

function createReviewResultPreviews() {
  return [
    reviewRecord("S", "S 封神", { finalScore: 100, semesterGpa: 4 }),
    reviewRecord("A", "A 优秀", { finalScore: 92, semesterGpa: 3.7 }),
    reviewRecord("B", "B 平庸", { finalScore: 82, semesterGpa: 3.3 }),
    reviewRecord("C", "C 勉强", { finalScore: 72, semesterGpa: 2.7 }),
    reviewRecord("D", "D 低空", { finalScore: 61, semesterGpa: 1 }),
    reviewRecord("F", "F 进度", { idSuffix: "f-progress", finalScore: 0, semesterGpa: 0, progress: 40, progressRequirement: 95 }),
    reviewRecord("F", "F 质量", { idSuffix: "f-quality", finalScore: 52, semesterGpa: 0, progress: 100, progressRequirement: 95 }),
  ].map((record) => {
    const state = { pendingInteraction: null, modalQueue: [], ending: null, pendingEnding: null };
    queueReviewResult(state, record);
    return {
      id: `review-${record.idSuffix ?? record.finalGrade.toLowerCase()}`,
      shortLabel: `评图${record.shortLabel}`,
      group: "评图结果",
      interaction: state.pendingInteraction,
    };
  });
}

function createReportFeedbackPreviews() {
  return REPORT_STRATEGIES.flatMap((strategy) => {
    const pages = [];
    if (strategy.successRate > 0) pages.push(createReportFeedbackPreview(strategy, true));
    if (strategy.successRate < 1) pages.push(createReportFeedbackPreview(strategy, false));
    return pages;
  });
}

function createReportFeedbackPreview(strategy, succeeded) {
  const state = createReportFeedbackPreviewState(strategy.id, succeeded);
  const result = chooseReportStrategy(state, strategy.id);
  if (!result.ok || state.pendingInteraction?.type !== "report_feedback") {
    throw new Error(`Failed to create report feedback preview: ${strategy.id}/${succeeded ? "success" : "failure"}`);
  }
  return {
    id: `report-${strategy.id}-${succeeded ? "success" : "failure"}`,
    shortLabel: `${strategy.name}${succeeded ? "成功" : "失败"}`,
    group: "汇报结果",
    interaction: state.pendingInteraction,
  };
}

function createReportFeedbackPreviewState(strategyId, succeeded) {
  const state = createGame({
    nickname: "预览同学",
    universityName: "第二十五小时测试大学",
    seed: 25,
  });
  state.profile.characterId = "ordinary_person";
  state.phase = "review";
  state.rngState = succeeded ? 1 : 15872;
  state.pendingInteraction = {
    type: "report_strategy",
    options: [{ id: strategyId, state: "available" }],
  };
  state.reviewDraft = {
    base: {
      baseGrade: "C",
      baseScore: 72,
      failureKind: "quality",
      progressGateFailed: false,
    },
  };
  return state;
}

function reviewRecord(finalGrade, shortLabel, overrides = {}) {
  return {
    semesterIndex: 1,
    finalGrade,
    shortLabel,
    finalScore: 80,
    semesterGpa: 3,
    progress: 100,
    progressRequirement: 95,
    ...overrides,
  };
}

function createExamQuestionPreviews() {
  return [
    ...createCourseQuestionPreviews(),
    ...createIeltsQuestionPreviews(),
    ...createRouteQuestionPreviews("academic", "考研/保研题", ACADEMIC_ROUTE_QUESTIONS),
    ...createRouteQuestionPreviews("civil", "行测题", CIVIL_ROUTE_QUESTIONS),
  ];
}

function createCourseQuestionPreviews() {
  return COURSES.flatMap((course) => {
    const questions = COURSE_QUESTIONS[course.id] ?? [];
    return questions.map((question, index) => createQuestionPreview({
      id: `question-course-${course.id}-${index + 1}`,
      shortLabel: `Q${index + 1}`,
      group: `课程题 · ${course.name}`,
      interaction: questionInteraction("course_question", `课程题 ${index + 1} / ${questions.length}`, question),
    }));
  });
}

function createIeltsQuestionPreviews() {
  return IELTS_QUESTIONS.map((question, index) => createQuestionPreview({
    id: `question-ielts-${index + 1}`,
    shortLabel: `Q${index + 1}`,
    group: "雅思题",
    interaction: questionInteraction("ielts_question", `雅思题 ${index + 1} / ${IELTS_QUESTIONS.length}`, question),
  }));
}

function createRouteQuestionPreviews(examType, group, questions) {
  return questions.map((question, index) => createQuestionPreview({
    id: `question-route-${examType}-${index + 1}`,
    shortLabel: `Q${index + 1}`,
    group: `路线题 · ${group}`,
    interaction: questionInteraction(
      "route_question",
      examType === "academic"
        ? `考研题 ${index + 1} / ${questions.length}`
        : `路线考试 ${index + 1} / ${questions.length}`,
      question,
      { examType },
    ),
  }));
}

function createQuestionPreview(page) {
  return {
    ...page,
    shortLabel: page.shortLabel,
  };
}

function questionInteraction(type, title, question, extra = {}) {
  return {
    type,
    title,
    body: question.q,
    blocks: true,
    options: Object.entries(question.options).map(([id, label]) => ({ id, label: `${id}. ${label}` })),
    ...extra,
  };
}

function renderPreviewPage(page) {
  return `
    <article id="${escapeHtml(page.id)}" class="result-preview-page">
      ${renderModal(page.interaction)}
    </article>
  `;
}

function renderPreviewGallery(previewPages) {
  return `
    <nav class="preview-nav" aria-label="游戏 UI 预览导航">
      <strong>游戏 UI 预览</strong>
      <span>真实 renderModal · ${previewPages.length} pages · 1710x991</span>
      <div>
        ${renderPreviewLinks(previewPages)}
      </div>
    </nav>
    <section class="preview-pages">
      ${previewPages.map((page) => renderPreviewPage(page)).join("")}
    </section>
  `;
}

function renderPreviewLinks(previewPages) {
  let currentGroup = "";
  return previewPages.map((page) => {
    const heading = page.group !== currentGroup
      ? `<span class="preview-nav-group">${escapeHtml(page.group)}</span>`
      : "";
    currentGroup = page.group;
    return `${heading}<a href="?page=${escapeHtml(page.id)}">${escapeHtml(page.shortLabel)}</a>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
