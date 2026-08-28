import {
  ACHIEVEMENTS,
  ATTRIBUTE_LABELS,
  CHARACTERS,
  COURSES,
  EDUCATION_BACKGROUNDS,
  ENDINGS,
  FAMILY_BACKGROUNDS,
  MENTORS,
  ROUTE_OPTIONS,
  SEMESTER_TOPICS,
  STAT_LABELS,
  WANLI_ROAD_EVENTS,
  WANLI_ROAD_MAX_VISITS_PER_YEAR,
  WANLI_ROAD_STAGE_REWARDS,
} from "./data.mjs";
import { availableProjects, availableShopItems, ieltsExamTakenThisSemester, resolveActionAvailability } from "./commands.mjs";
import { endingRecordCounts } from "./ending-scoring.mjs";
import { hasExternalLink, isExternalLinkEntry } from "./external-links.mjs";
import { currentRiskLevel, internshipThresholdAdjustment, isMoneyHighRisk, progressCap, qualityCap, reviewProgressRequirement, routeOptionAvailability, weeklyLivingCost } from "./resolver.mjs";
import { currentSemesterLabel, getCharacter, yearLabel } from "./state.mjs";
import { musicForState } from "./music.mjs";
import { finalAchievementIconSourceByNumber, finalAchievementIconSourceByTitle } from "../ui/icon-source.mjs";

const POSTGRAD_ENDING_TITLES_BY_OPTION = {
  recommendation_dream: "强校保研上岸——清华/同济/东南",
  recommendation_old_eight: "强校保研上岸——建筑老八校/其他985",
  postgrad_dream: "强校考研上岸——清华/同济/东南/天大",
  postgrad_old_eight: "强校考研上岸——建筑老八校 / 其他 985、211",
  postgrad_normal: "稳妥考研上岸——普通一本院校",
};

const OVERSEAS_ENDING_TITLE_PREFIX = {
  overseas_elite: "顶级名校留学",
  overseas_strong: "海外强校来信",
  overseas_stable: "稳妥录取",
  overseas_safety: "成功保底",
};

export function toViewModel(state, collection = null) {
  if (!state) {
    return { screen: "start" };
  }

  const character = getCharacter(state);
  const mentor = MENTORS.find((item) => item.id === state.profile.mentorId);
  const course = COURSES.find((item) => item.id === state.courseId);
  const riskLevel = currentRiskLevel(state);
  const ending = state.ending ? endingViewForState(state, state.ending) : null;
  const gpaLabel = formatGpa(state.gpa);
  const meters = [
    meter("energy", state.energy, state.maxEnergy),
    meter("pressure", state.pressure, 100, true),
  ];
  const money = {
    id: "money",
    label: "余额",
    value: Math.round(state.money),
    weeklyCost: weeklyLivingCost(state),
    highRisk: isMoneyHighRisk(state),
  };
  const metrics = [
    { id: "gpa", label: STAT_LABELS.gpa, value: gpaLabel },
    { id: "reviews", label: "评图次数", value: state.reviews.length },
  ];
  const risk = {
    level: riskLevel,
    money: money.highRisk,
    messages: riskMessages(state, riskLevel),
  };
  const systemsEntries = systemEntries(state);
  const actionViews = resolveActionAvailability(state).map((action) => {
    if (action.id !== "special_skill") return action;
    return {
      ...action,
      label: character?.skillName ? `专属技能：${character.skillName}` : action.label,
      preview: character?.skillText ?? action.preview,
    };
  });
  const specialSkillAction = actionViews.find((action) => action.id === "special_skill" && action.state !== "hidden") ?? null;
  const achievementLogs = recentVisibleLogs(state.logs.filter(isAchievementLogEntry));
  const purchaseLogs = recentVisibleLogs(state.logs.filter(isPurchaseLogEntry));
  const eventLogs = recentVisibleLogs(state.logs.filter(isEventLogEntry));
  const actionLogs = recentVisibleLogs(state.logs.filter((log) => !isEventLogEntry(log) && !isAchievementLogEntry(log) && !isPurchaseLogEntry(log)));
  const achievementCollection = achievementCollectionFor(state, collection);
  const leaderboardScore = achievementCollection.leaderboardScore;
  const endingMemoryCanSkip = state.phase === "ending_memory"
    && state.pendingInteraction?.type === "ending_memory"
    && state.pendingInteraction.memoryStep === "ending_animation";
  const competitionRecords = normalizedCompetitionRecords(state);
  const competitionSubmissionCount = Math.max(state.competitionSubmissionCount ?? 0, competitionRecords.length);
  const competitionSources = competitionSourceWorks(state);

  return {
    screen: "game",
    phase: state.phase,
    seed: state.seed,
    stateMeta: {
      version: state.version,
      phase: state.phase,
      endingId: state.ending,
      hasPendingInteraction: Boolean(state.pendingInteraction),
      modalQueueLength: state.modalQueue?.length ?? 0,
    },
    music: musicForState(state),
    title: ending?.title ?? titleForState(state),
    subtitle: subtitleForState(state),
    profile: {
      nickname: state.profile.nickname,
      universityName: state.profile.universityName,
      characterId: character?.id ?? "",
      characterName: character?.name ?? "未选择",
      characterIntro: character?.intro ?? "",
      skillName: character?.skillName ?? "",
      skillText: character?.skillText ?? "",
      education: character ? EDUCATION_BACKGROUNDS[character.educationId].label : "",
      family: character ? FAMILY_BACKGROUNDS[character.familyId].label : "",
      mentorId: mentor?.id ?? "",
      mentorName: mentor?.name ?? "未选择",
      mentorTitle: mentor?.title ?? "设计导师",
      mentorIntro: mentor?.intro ?? "",
      mentorTaskName: mentor?.task?.name ?? "",
      mentorTaskCondition: mentor?.task?.conditionText ?? "",
      mentorTaskProgressText: mentorTaskProgressText(state, mentor),
      mentor: mentor ? `${mentor.name}：${mentor.title}` : "未选择",
      courseId: course?.id ?? "",
      course: course?.name ?? "未选课",
    },
    calendar: {
      semester: currentSemesterLabel(state),
      week: state.week,
      weekInSemester: state.weekInSemester,
      topic: courseTopicForSemester(state.semesterIndex),
      courseStage: courseStageForSemester(state.semesterIndex),
      actionsRemaining: state.actionsRemaining,
      actionsPerWeek: state.actionsPerWeek,
      progressRequirement: reviewProgressRequirement(state),
    },
    meters,
    money,
    statusTiles: statusTilesFor({ meters, money, metrics, risk }),
    courseProgress: [
      meter("progress", state.progress, progressCap(state)),
      meter("quality", state.quality, qualityCap(state)),
    ],
    metrics,
    attributes: Object.entries(ATTRIBUTE_LABELS).map(([id, label]) => ({
      id,
      label,
      value: state.attributes[id],
    })),
    risk,
    actions: groupedActions(actionViews.filter((action) => action.id !== "special_skill")),
    specialSkillAction,
    interaction: interactionStatus(state),
    pendingInteraction: normalizeInteraction(state.pendingInteraction),
    endingMemory: {
      canSkip: endingMemoryCanSkip,
    },
    achievementToasts: visibleAchievementToasts(state).map((toast) => ({
      id: toast.id ?? toast.achievementId,
      title: toast.title,
      body: toast.body,
      score: toast.score,
      shownAt: toast.shownAt,
      slot: toast.slot,
      icon: toast.icon ?? achievementIconPath(toast.id ?? toast.achievementId),
      prefix: toast.prefix,
      kind: toast.kind,
    })),
    logs: state.logs.slice(-10).reverse(),
    actionLogs,
    eventLogs,
    achievementLogs,
    purchaseLogs,
    reviews: state.reviews.slice(-5).reverse(),
    leaderboard: leaderboardViewFor(),
    achievements: {
      score: achievementCollection.achievementScore,
      endingScore: achievementCollection.endingScore,
      endingRepeatScore: achievementCollection.endingRepeatScore,
      leaderboardScore,
      pendingScore: playerLeaderboardScore(state),
      unlockedCount: achievementCollection.unlockedAchievementIds.length,
      totalCount: Object.keys(ACHIEVEMENTS).length,
      endingIds: achievementCollection.unlockedEndingIds,
      endingCounts: achievementCollection.endingCounts,
      items: Object.entries(ACHIEVEMENTS).map(([id, achievement]) => ({
        id,
        title: achievement.title,
        body: achievement.body,
        conditionText: achievement.conditionText,
        score: achievement.score,
        icon: achievementIconPath(id),
        unlocked: achievementCollection.unlockedAchievementIds.includes(id),
      })),
    },
    systems: {
      entries: systemsEntries,
      entryGroups: systemEntryGroups(systemsEntries),
      shop: {
        money: state.money,
        purchasedCount: state.achievementTally?.purchasedShopItemIds?.length ?? 0,
        totalCount: availableShopItems(state).length,
        items: availableShopItems(state),
      },
      portfolio: {
        score: Math.round(state.portfolio),
        reviews: portfolioReviews(state),
        currentProgress: state.progress,
        currentQuality: state.quality,
        currentTopic: SEMESTER_TOPICS[state.semesterIndex - 1] ?? "课程设计",
        progressRequirement: reviewProgressRequirement(state),
        resumeNotes: resumeNotes(state),
      },
      competition: {
        currentQuality: state.quality,
        currentPortfolio: Math.round(state.portfolio),
        attributes: { ...state.attributes },
        submissionCount: competitionSubmissionCount,
        awardCount: state.competitionAwardCount ?? 0,
        highestAward: highestCompetitionAward(competitionRecords, state.competitionAwardCount ?? 0),
        sourceCount: competitionSources.length,
        sources: competitionSources,
        cards: competitionCardsFor(state, competitionSources),
        records: competitionRecords,
        suggested: competitionSuggestion(state),
      },
      wanliRoad: wanliRoadStateFor(state),
      internship: {
        energy: state.energy,
        software: state.attributes.software,
        design: state.attributes.design,
        presentation: state.attributes.presentation,
        internshipValue: state.internshipValue ?? 0,
        namedFirmInternship: Boolean(state.namedFirmInternship),
        activeInternship: state.activeInternship ?? null,
        applications: Array.isArray(state.internshipApplications) ? state.internshipApplications : [],
        appliedSemesters: Array.isArray(state.internshipAppliedSemesters) ? state.internshipAppliedSemesters : [],
        records: Array.isArray(state.internshipRecords) ? state.internshipRecords : [],
        semesterIndex: state.semesterIndex,
        thresholdAdjustment: internshipThresholdAdjustment(state),
        openState: isInternshipSystemOpen(state) ? "实习建议可查看" : `${yearLabel(2)}学年开放实习申请`,
        suggested: internshipSuggestion(state),
      },
      route: {
        year: state.year,
        yearLabel: yearLabel(state.year),
        gpa: state.gpa,
        gpaLabel,
        portfolio: Math.round(state.portfolio),
        participation: state.routeParticipation,
        ieltsScore: state.ieltsScore ?? 0,
        ieltsExam: ieltsExamStateFor(state),
        internshipValue: state.internshipValue ?? 0,
        aiExperience: state.aiExperience ?? 0,
        competitionAwardCount: state.competitionAwardCount ?? 0,
        routeExamResults: {
          academicTaken: Boolean(state.routeExamResults?.academicTaken),
          civilTaken: Boolean(state.routeExamResults?.civilTaken),
        },
        suggested: routeSuggestions(state),
        groups: routeOptionGroups(state),
      },
    },
    debug: debugInfo(state),
    characterCandidates: state.characterCandidates.map((id) => {
      const item = CHARACTERS.find((characterItem) => characterItem.id === id);
      return {
        id: item.id,
        name: item.name,
        cardLevel: item.cardLevel ?? "",
        intro: item.intro,
        education: EDUCATION_BACKGROUNDS[item.educationId].label,
        family: FAMILY_BACKGROUNDS[item.familyId].label,
        passive: `${item.passiveName}：${item.passiveText}`,
        skill: `${item.skillName}：${item.skillText}`,
        pressure: item.pressure,
        attributes: item.attributes,
      };
    }),
    canReroll: state.phase === "character_select" && state.rerollsRemaining > 0,
    rerollsRemaining: state.rerollsRemaining,
    ending,
  };
}

function endingViewForState(state, endingId) {
  const ending = ENDINGS[endingId];
  if (!ending) return null;
  const option = routeParticipationOption(state);
  const title = endingTitleForRouteOption(endingId, ending.title, option);
  return {
    ...ending,
    id: endingId,
    title,
    baseTitle: ending.title,
    routeOptionId: option?.id ?? state.routeParticipation?.optionId ?? "",
    routeTarget: option?.target ?? state.routeParticipation?.target ?? "",
  };
}

function routeParticipationOption(state) {
  const optionId = state.routeParticipation?.optionId;
  return optionId ? ROUTE_OPTIONS.find((item) => item.id === optionId) ?? null : null;
}

function endingTitleForRouteOption(endingId, fallbackTitle, option) {
  if (endingId === "elite_recommendation_postgrad" || endingId === "elite_exam_postgrad" || endingId === "steady_postgrad") {
    return POSTGRAD_ENDING_TITLES_BY_OPTION[option?.id] ?? fallbackTitle;
  }
  const overseasPrefix = OVERSEAS_ENDING_TITLE_PREFIX[endingId];
  if (overseasPrefix) {
    const schoolName = overseasChineseSchoolName(option);
    return schoolName ? `${overseasPrefix}——${schoolName}` : fallbackTitle;
  }
  return fallbackTitle;
}

function overseasChineseSchoolName(option) {
  const target = option?.overseas?.target ?? option?.target ?? "";
  const match = String(target).match(/[（(]([^（）()]+)[）)]/u);
  const schoolName = match?.[1]?.trim();
  if (schoolName) {
    return schoolName;
  }
  const trimmedTarget = String(target).trim();
  return /[\u4e00-\u9fff]/u.test(trimmedTarget) && !/[A-Za-z]/u.test(trimmedTarget) ? trimmedTarget : "";
}

// Runtime source for vm.systems.entries; UI docs are acceptance criteria, not a second entry list.
const SYSTEM_ENTRY_DEFINITIONS = [
  entry("guide", "介绍与引导", "minimum", "ui-dialog", "game", "用短提示解释开局、每周行动、评图和关键系统。"),
  entry("shop", "商店购物", "must_complete", "ui-dialog", "game", "可查看商品、价格、限购、禁用原因，并通过命令购买。"),
  entry("save", "保存", "must_complete", "save", "game", "手动保存当前本地进度，失败时必须给出可理解提示。"),
  entry("theme", "主题背景", "must_complete", "ui-dialog", "start_and_game", "可切换深浅主题，偏好写入轻量本地设置。"),
  entry("leaderboard", "玩家排行榜", "launch_must_complete", "ui-dialog", "start_and_game", "结局后查看排行榜记录。"),
  entry("achievements", "结局与成就", "launch_must_complete", "ui-dialog", "start_and_game", "展示结局图鉴、成长成就、解锁状态和排行榜总分。"),
  entry("portfolio_resume", "个人作品集", "minimum", "ui-dialog", "game", "汇总课程设计、C/B/A/S 入库作品、作品集总分和最近评图。"),
  entry("resume", "个人简历", "minimum", "ui-dialog", "game", "汇总竞赛获奖、实习经历、考试经历和附属记录。"),
  entry("wanli_road", "建筑生的万里路", "minimum", "ui-dialog", "game", "展示万里路开放条件、当前地点和地点事件入口。"),
  entry("competition", "竞赛投稿", "minimum", "ui-dialog", "game", "展示当前作品投稿建议和后续赛事记录入口。"),
  entry("postgrad_exam", "考研升学", "minimum", "ui-dialog", "game", "展示考研升学开放条件、院校档位和考试入口状态。"),
  entry("recommendation", "申请保研", "minimum", "ui-dialog", "game", "展示保研申请开放条件、院校档位和复试入口状态。"),
  entry("public_service", "考公考编", "minimum", "ui-dialog", "game", "展示考公、考编开放条件和考试入口状态。"),
  entry("overseas_study", "出国留学", "minimum", "ui-dialog", "game", "展示留学申请开放条件、具体院校、院校档位和语言考试入口状态。"),
  entry("internship_work", "实习与工作", "minimum", "ui-dialog", "game", "展示实习能力建议、建筑工作投递和后续记录入口。"),
  entry("career_change", "转行", "minimum", "ui-dialog", "game", "展示转行开放条件、岗位方向和投递入口状态。"),
  entry("author", "作者的话", "read", "open-external-link", "start_and_game", "打开作者说明。"),
  entry("coffee", "请作者喝咖啡续命", "support", "ui-dialog", "start_and_game", "打开游戏内支持页。"),
  entry("community", "建院社区", "community", "open-external-link", "start_and_game", "进入建院社区。"),
  entry("language", "显示语言", "settings", "ui-dialog", "start_and_game", "查看显示语言。"),
  entry("announcement", "公告", "read", "ui-dialog", "start_and_game", "展示更新消息。"),
  entry("new-game", "放弃学业重新开始", "must_complete", "new-game", "game", "只清空当前局进度并返回游戏开始页。"),
];

const SYSTEM_ENTRY_GROUP_DEFINITIONS = {
  main: [
    "shop",
    "competition",
    "postgrad_exam",
    "recommendation",
    "public_service",
    "overseas_study",
    "internship_work",
    "career_change",
    "achievements",
  ],
  course: [],
  rightRail: ["portfolio_resume", "resume", "wanli_road"],
  settings: [
    "save",
    "theme",
    "guide",
    "leaderboard",
    "new-game",
    "author",
    "coffee",
    "community",
    "language",
  ],
};

function entry(id, label, launchStatus, command, surface, copyRequirement) {
  return {
    id,
    label,
    launchStatus,
    statusLabel: systemStatusLabel(launchStatus),
    command,
    surface,
    copyRequirement,
  };
}

const FUTURE_CHOICE_ENTRY_IDS = new Set([
  "postgrad_exam",
  "recommendation",
  "public_service",
  "overseas_study",
  "career_change",
]);

function systemEntries(state) {
  return SYSTEM_ENTRY_DEFINITIONS.map((definition) => ({
    ...definition,
    availability: systemEntryAvailability(state, definition),
  }));
}

function systemEntryGroups(entries) {
  return Object.fromEntries(
    Object.entries(SYSTEM_ENTRY_GROUP_DEFINITIONS).map(([groupId, priority]) => [
      groupId,
      priority.map((id) => entries.find((entryItem) => entryItem.id === id)).filter(Boolean),
    ]),
  );
}

function systemEntryAvailability(state, definition) {
  const { id, launchStatus, command } = definition;
  if (command === "open-external-link" && isExternalLinkEntry(id) && !hasExternalLink(id)) {
    return {
      state: "disabled",
      reason: "链接待填写。",
    };
  }
  if (id === "leaderboard") {
    return {
      state: "available",
      reason: "查看玩家总分榜和本地毕业档案。",
    };
  }
  if (command === "open-external-link" && isExternalLinkEntry(id) && hasExternalLink(id)) {
    return {
      state: "available",
      reason: "可打开已配置外链。",
    };
  }
  if (launchStatus === "placeholder") {
    return {
      state: "available",
      reason: "可查看说明。",
    };
  }
  if (id === "shop" && state.pendingInteraction) {
    return {
      state: "available",
      reason: "先处理当前弹窗，再进行购买。",
    };
  }
  if (id === "shop" && (state.ending || state.phase === "character_select" || state.phase === "profile")) {
    return {
      state: "disabled",
      reason: "当前阶段不能购买商品。",
    };
  }
  if (id === "new-game") {
    return {
      state: "available",
      reason: "危险操作：只会清空当前局进度并返回开始页。",
    };
  }
  if (FUTURE_CHOICE_ENTRY_IDS.has(id) && state.year < 5) {
    return {
      state: "available",
      reason: futureEntryPreYearReason(id),
    };
  }
  if (FUTURE_CHOICE_ENTRY_IDS.has(id) && routeClosedByGraduation(state)) {
    return {
      state: "disabled",
      reason: "毕业设计答辩开始后关闭路线入口。",
    };
  }
  if (FUTURE_CHOICE_ENTRY_IDS.has(id) && state.routeParticipation?.label) {
    return {
      state: "available",
      reason: `已正式参与「${state.routeParticipation.label}」。`,
    };
  }
  if (id === "internship_work" && !isInternshipSystemOpen(state)) {
    return {
      state: "available",
      reason: `${yearLabel(2)}学年开放实习系统，当前可查看开放说明。`,
    };
  }
  if (id === "internship_work" && state.year < 5) {
    return {
      state: "available",
      reason: "可查看实习建议；建筑工作大五开放。",
    };
  }
  if (id === "internship_work" && routeClosedByGraduation(state)) {
    return {
      state: "available",
      reason: "建筑工作入口已关闭，实习记录仍可查看。",
    };
  }
  if (id === "wanli_road" && state.year < 2) {
    return {
      state: "available",
      reason: "大二上开放地点事件入口。",
    };
  }
  if (id === "wanli_road" && (state.wanliRoadVisits ?? state.eventTally?.wanliRoadVisits ?? 0) >= WANLI_ROAD_EVENTS.length) {
    return {
      state: "available",
      reason: "12 个地点已完成，可回看旅行记录。",
    };
  }
  return {
    state: "available",
    reason: defaultEntryReason(id),
  };
}

function defaultEntryReason(id) {
  return {
    guide: "可重看核心循环说明。",
    shop: "可查看商品、价格、效果、限购和禁用原因。",
    save: "可手动保存当前本地进度。",
    theme: "可切换深浅主题。",
    achievements: "可查看本地结局与成就图鉴。",
    portfolio_resume: "可查看作品集、课题进度和入库作品。",
    resume: "可查看简历素材和经历标签。",
    wanli_road: "可查看开放条件和地点事件说明。",
    competition: "可查看当前作品投稿建议。",
    postgrad_exam: "大五可正式参与考研升学。",
    recommendation: "大五可正式参与申请保研。",
    public_service: "大五可正式参与考公考编。",
    overseas_study: "大五可正式提交留学申请。",
    internship_work: "可查看实习建议和建筑工作入口。",
    career_change: "大五可正式参与转行。",
    author: "可打开作者说明。",
    coffee: "可打开游戏内支持页。",
    leaderboard: "可查看排行与总分说明。",
    community: "可进入社区。",
    language: "可选择显示语言。",
    announcement: "可查看公告。",
    "new-game": "危险操作：只会清空当前局进度并返回开始页。",
  }[id] ?? "可打开入口。";
}

function wanliRoadStateFor(state) {
  const visits = Math.min(state.wanliRoadVisits ?? state.eventTally?.wanliRoadVisits ?? 0, WANLI_ROAD_EVENTS.length);
  const current = WANLI_ROAD_EVENTS[visits] ?? null;
  const records = Array.isArray(state.wanliRoadRecords) ? state.wanliRoadRecords : [];
  const open = state.year >= 2;
  const complete = visits >= WANLI_ROAD_EVENTS.length;
  const visitsThisYear = wanliRoadVisitsThisYear(state);
  const withinYearLimit = visitsThisYear < WANLI_ROAD_MAX_VISITS_PER_YEAR;
  const canBorrowActions = (state.actionsRemaining ?? 0) >= 0;
  const hasMoney = !current || (state.money ?? 0) >= current.cost;
  const canVisit = open && !complete && withinYearLimit && canBorrowActions && hasMoney && state.phase === "week_action" && !state.pendingInteraction;
  const blockReason = complete
    ? "12 个地点已完成"
    : !open
      ? ""
      : state.phase !== "week_action" || state.pendingInteraction
        ? "当前流程中暂不可前往"
        : !withinYearLimit
          ? "本学年万里路次数已达上限"
          : !canBorrowActions
            ? "已借用下周行动次数"
            : "";
  return {
    title: "建筑生的万里路",
    open,
    complete,
    visits,
    total: WANLI_ROAD_EVENTS.length,
    actionsRequired: current ? wanliRoadActionCost(current) : 0,
    yearLabel: yearLabel(state.year),
    semesterLabel: `${currentSemesterLabel(state)}学期`,
    money: Math.round(state.money ?? 0),
    current,
    canVisit,
    blockReason,
    visitsThisYear,
    maxVisitsPerYear: WANLI_ROAD_MAX_VISITS_PER_YEAR,
    moneyInsufficient: Boolean(current && !hasMoney),
    moneyWarning: "",
    records: records.slice().reverse(),
    stageRewards: WANLI_ROAD_STAGE_REWARDS.map((reward) => ({
      ...reward,
      status: visits >= reward.visits ? "done" : "locked",
      deltaText: formatDeltaText(reward.delta),
    })),
    nodes: WANLI_ROAD_EVENTS.map((event, index) => ({
      ...event,
      index: index + 1,
      status: index < visits ? "done" : index === visits && open && !complete ? "current" : "locked",
      deltaText: formatDeltaText(event.delta),
    })),
  };
}

function wanliRoadActionCost(event) {
  return Math.max(1, Number(event?.actionCost ?? 2) || 2);
}

function wanliRoadVisitsThisYear(state) {
  return (Array.isArray(state.wanliRoadRecords) ? state.wanliRoadRecords : [])
    .filter((record) => Number(record?.year) === Number(state.year)).length;
}

function formatDeltaText(delta = {}) {
  const labels = {
    money: "金钱",
    energy: "精力",
    pressure: "压力",
    progress: "进度",
    quality: "作品质量",
    ...ATTRIBUTE_LABELS,
  };
  return Object.entries(delta)
    .map(([key, value]) => `${labels[key] ?? key} ${value > 0 ? "+" : ""}${value}`)
    .join("，");
}

function futureEntryPreYearReason(id) {
  return {
    postgrad_exam: "大五开放考研升学。",
    recommendation: "大五开放申请保研。",
    public_service: "大五开放考公考编。",
    overseas_study: "大五开放出国留学。",
    career_change: "大五开放转行。",
  }[id] ?? "大五前只展示开放条件和候选方向。";
}

function routeClosedByGraduation(state) {
  return state.semesterIndex >= 10 && ["review", "graduation_ceremony", "ending_memory", "ending"].includes(state.phase);
}

function systemStatusLabel(status) {
  return {
    must_complete: "可使用",
    launch_must_complete: "可查看",
    minimum: "可查看",
    static: "可阅读",
    placeholder: "可查看",
    collection: "可查看",
    read: "可阅读",
    support: "可支持",
    community: "可进入",
    settings: "可设置",
  }[status] ?? status;
}

function interactionStatus(state) {
  const interaction = normalizeInteraction(state.pendingInteraction);
  return {
    isBlocking: Boolean(interaction?.blocks),
    type: interaction?.type ?? null,
    title: interaction?.title ?? "",
    optionCount: interaction?.options?.length ?? 0,
    queueCount: state.modalQueue?.length ?? 0,
  };
}

function statusTilesFor({ meters, money, metrics }) {
  const energy = meters.find((item) => item.id === "energy");
  const pressure = meters.find((item) => item.id === "pressure");
  const gpa = metrics.find((item) => item.id === "gpa");

  return [
    {
      id: "energy",
      label: energy?.label ?? "精力",
      kind: "meter",
      value: `${energy?.value ?? 0}/${energy?.max ?? 100}`,
      max: energy?.max ?? 100,
      ratio: energy?.ratio ?? 0,
      tone: (energy?.value ?? 0) < 30 ? "risk" : "",
    },
    {
      id: "pressure",
      label: pressure?.label ?? "压力",
      kind: "meter",
      value: `${pressure?.value ?? 0}/${pressure?.max ?? 100}`,
      max: pressure?.max ?? 100,
      ratio: pressure?.ratio ?? 0,
      tone: (pressure?.value ?? 0) > 80 ? "risk" : "",
    },
    {
      id: "money",
      label: "金钱",
      kind: "plain",
      value: `¥ ${money?.value ?? 0}`,
      detail: `（-${money?.weeklyCost ?? 0}/周）`,
      tone: money?.highRisk ? "risk" : "",
    },
    {
      id: "gpa",
      label: "GPA",
      kind: "plain",
      value: gpa?.value ?? "未知",
    },
  ];
}

function leaderboardViewFor() {
  return {
    topRows: [],
    selfRow: null,
  };
}

function achievementCollectionFor(state, collection) {
  const unlockedAchievementIds = new Set([
    ...(collection?.unlockedAchievementIds ?? []),
    ...(state.achievementTally?.historicalAchievementIds ?? []),
    ...(state.unlockedAchievements ?? []),
  ]);
  const unlockedEndingIds = new Set([
    ...(collection?.unlockedEndingIds ?? []),
    ...(state.achievementTally?.endingIds ?? []),
  ]);
  const achievementScore = collection
    ? collection.achievementScore ?? 0
    : state.achievementScore ?? 0;
  const endingScore = collection
    ? collection.endingScore ?? 0
    : state.endingScore ?? 0;
  const endingRepeatScore = collection
    ? collection.endingRepeatScore ?? 0
    : state.endingRepeatScore ?? 0;
  const leaderboardScore = collection
    ? Math.max(0, Math.round(achievementScore + endingScore + endingRepeatScore))
    : playerLeaderboardScore(state);
  const endingCounts = collection
    ? endingCountsForCollection(collection)
    : { ...(state.achievementTally?.historicalEndingCounts ?? {}) };
  for (const endingId of state.achievementTally?.endingIds ?? []) {
    endingCounts[endingId] = Math.max(endingCounts[endingId] ?? 0, 1);
  }

  return {
    achievementScore,
    endingScore,
    endingRepeatScore,
    leaderboardScore,
    unlockedAchievementIds: [...unlockedAchievementIds],
    unlockedEndingIds: [...unlockedEndingIds],
    endingCounts,
  };
}

function endingCountsForCollection(collection) {
  const counts = endingRecordCounts(collection?.endingRecords);
  for (const endingId of collection?.unlockedEndingIds ?? []) {
    counts[endingId] = Math.max(counts[endingId] ?? 0, 1);
  }
  return counts;
}

function playerLeaderboardScore(state) {
  return Math.max(0, Math.round(
    (state.achievementScore ?? 0)
    + (state.endingScore ?? 0)
    + (state.endingRepeatScore ?? 0),
  ));
}

function visibleAchievementToasts(state) {
  return state.achievementToasts ?? [];
}

function recentVisibleLogs(logs) {
  return logs.slice(-10).reverse();
}

function isEventLogEntry(log) {
  const phase = String(log?.phase ?? "");
  const source = String(log?.source ?? "");
  return /event|summer|model_material|year_start/.test(phase)
    || /^fixed:|^event:|^summer:|^model_material:/.test(source);
}

function isAchievementLogEntry(log) {
  const phase = String(log?.phase ?? "");
  const source = String(log?.source ?? "");
  return phase === "achievement" || source.startsWith("achievement:");
}

function isPurchaseLogEntry(log) {
  const phase = String(log?.phase ?? "");
  const source = String(log?.source ?? "");
  return phase === "shop" || source.startsWith("shop:");
}

function achievementIconPath(id) {
  if (id === "three_all_nighters") return finalAchievementIconSourceByNumber("009");
  if (id === "no_fail_two_years") return finalAchievementIconSourceByNumber("021");
  const title = ACHIEVEMENTS[id]?.title;
  return title ? finalAchievementIconSourceByTitle(title) : finalAchievementIconSourceByNumber("001");
}

function debugInfo(state) {
  const lastLog = state.logs.at(-1);
  return {
    seed: state.seed,
    rngState: state.rngState,
    phase: state.phase,
    semesterIndex: state.semesterIndex,
    week: state.week,
    pendingInteractionType: state.pendingInteraction?.type ?? null,
    modalQueue: (state.modalQueue ?? []).map((interaction) => ({
      type: interaction.type,
      title: interaction.title,
    })),
    lastDelta: lastLog?.delta ?? {},
    lastSource: lastLog?.source ?? "",
  };
}

function competitionSuggestion(state) {
  if (state.quality >= 90) return "当前作品质量适合冲击正式竞赛投稿。";
  if (state.quality >= 70) return "当前作品可准备校内展评，继续打磨图面和叙事。";
  return "";
}

function competitionSourceWorks(state) {
  const submittedSemesters = new Set(
    (state.competitionRecords ?? [])
      .map((record) => Number(record.semesterIndex))
      .filter((semesterIndex) => Number.isFinite(semesterIndex)),
  );
  return (state.reviews ?? [])
    .filter((review) => gradeAtLeast(review.finalGrade, "C"))
    .map((review) => ({
      id: `semester-${reviewSemesterIndex(review)}`,
      label: `${semesterLabel(review)} · ${semesterTopic(review)}`,
      semesterLabel: semesterLabel(review),
      topic: semesterTopic(review),
      courseStage: courseStageForSemester(reviewSemesterIndex(review)),
      semesterIndex: reviewSemesterIndex(review),
      finalGrade: review.finalGrade,
      finalScore: review.finalScore,
      portfolioAdded: review.portfolioAdded,
      used: submittedSemesters.has(reviewSemesterIndex(review)),
    }))
    .filter((work) => !work.used)
    .reverse();
}

function portfolioReviews(state) {
  return (state.reviews ?? [])
    .filter((review) => review.portfolioAdded > 0)
    .map((review) => {
      const semesterIndex = reviewSemesterIndex(review);
      return {
        ...review,
        id: `semester-${semesterIndex}`,
        semesterIndex,
        semesterLabel: semesterLabel(review),
        topic: semesterTopic(review),
        courseStage: courseStageForSemester(semesterIndex),
        boardImage: portfolioBoardImage(semesterIndex),
      };
    })
    .filter((review) => review.boardImage)
    .reverse();
}

function reviewSemesterIndex(review) {
  const explicit = Number(review.semesterIndex);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return (Number(review.year) - 1) * 2 + (Number(review.term) === 2 ? 2 : 1);
}

function semesterLabel(review) {
  return `${yearLabel(review.year)}${Number(review.term) === 1 ? "上" : "下"}`;
}

function semesterTopic(review) {
  return SEMESTER_TOPICS[reviewSemesterIndex(review) - 1] ?? "课程设计";
}

function portfolioBoardImage(semesterIndex) {
  const images = {
    1: "/optimized/assets/portfolio-boards/大一上.b7ff21ec4434.webp",
    2: "/optimized/assets/portfolio-boards/大一下.92d7a385a9b3.webp",
    3: "/optimized/assets/portfolio-boards/大二上.694e1d50ad62.webp",
    4: "/optimized/assets/portfolio-boards/大二下.b6617b395afe.webp",
    5: "/optimized/assets/portfolio-boards/大三上.814776465122.webp",
    6: "/optimized/assets/portfolio-boards/大三下.6f816b1f33e5.webp",
    7: "/optimized/assets/portfolio-boards/大四上.56eb8298ece3.webp",
    8: "/optimized/assets/portfolio-boards/大四下.1a7e3009bb97.webp",
  };
  return images[semesterIndex] ?? "";
}

const COMPETITION_CARD_DEFINITIONS = [
  {
    id: "campus_corner",
    name: "霍普杯国际大学生建筑设计竞赛",
    type: "顶级概念竞赛",
    brief: "国际建协盖章的赛事，评委席上随便抽一个都是教科书里的名字。\n题目越来越像哲学考题，你得用平立剖回答建筑存在的意义。\n入围了能吹四年，没入围也能在竞赛记录里写曾尝试过。",
    requirements: { design: 60, aesthetic: 58, presentation: 52 },
    requirementLabels: ["评图 C/B/A/S", "设计 >= 60", "审美 >= 58", "汇报 >= 52"],
  },
  {
    id: "green_building",
    name: "台达杯国际太阳能建筑设计竞赛",
    type: "绿色技术顶级竞赛",
    brief: "讲究绿色低碳和技术落地。方案不仅要好看，还得算清楚能耗。\n适合喜欢搞参数化、又怕别人说你只会画皮的同学。\n记得把光伏板画好看点，评委既看发电量也看颜值。",
    requirements: { design: 58, software: 54, resilience: 48 },
    requirementLabels: ["评图 C/B/A/S", "设计 >= 58", "软件 >= 54", "抗压 >= 48"],
  },
  {
    id: "public_space",
    name: "台湾国际学生创意设计大赛",
    type: "跨界创意强竞赛",
    brief: "不限主题，不限建筑，纯拼脑洞。\n你可以设计漂浮城市、末日避难所，或者一个会呼吸的厕所。\n拿奖靠想象力，输赢无所谓，唯一要注意的是别把指导老师吓着。",
    requirements: { aesthetic: 50, presentation: 45, design: 50 },
    requirementLabels: ["评图 C/B/A/S", "审美 >= 50", "汇报 >= 45", "设计 >= 50"],
  },
  {
    id: "old_street_micro",
    name: "东南·中国建筑新人赛",
    type: "建筑专业综合强竞赛",
    brief: "低年级专属舞台，大一就能报名。\n评图现场像公开处刑，但也是最快成长的方式。\n拿不拿奖不重要，重要的是你学会在被骂时微笑；\n别等到大四被学弟学妹碾压。",
    requirements: { design: 50, presentation: 48, aesthetic: 45 },
    yearLimitLabel: "只允许大一至大三参加",
    maxParticipationYear: 3,
    requirementLabels: ["评图 C/B/A/S", "设计 >= 50", "汇报 >= 48", "审美 >= 45"],
  },
];

function competitionCardsFor(state, sources) {
  return COMPETITION_CARD_DEFINITIONS.map((card) => {
    const availableWorks = competitionAvailableWorks(state, card, sources);
    const block = availableWorks.length > 0 ? { reason: "", kind: "" } : competitionBlock(state, card, sources);
    return {
      ...card,
      availableWorks,
      blockedWorks: block.reason ? competitionBlockedWorks(card, sources, block.reason) : [],
      blockReason: block.reason,
      blockKind: block.kind,
      availabilityLabel: competitionAvailabilityLabel(state, card, sources, availableWorks),
    };
  });
}

function competitionAvailableWorks(state, card, sources) {
  if (competitionSubmittedThisSemester(state)) return [];
  const attributesMet = Object.entries(card.requirements ?? {}).every(([key, value]) => (state.attributes[key] ?? 0) >= value);
  if (!attributesMet) return [];
  if (card.maxParticipationYear && state.year > card.maxParticipationYear) return [];
  return sources.filter((work) => card.id !== "old_street_micro" || work.semesterIndex <= 6);
}

function competitionAvailabilityLabel(state, card, sources, availableWorks) {
  if (availableWorks.length > 0) return `${availableWorks.length} 件可投`;
  if (competitionSubmittedThisSemester(state)) return "本学期已投";
  if (sources.length === 0) return "暂无可投作品";
  if (card.maxParticipationYear && state.year > card.maxParticipationYear) return "年级不符合";
  const missing = Object.entries(card.requirements ?? {}).find(([key, value]) => (state.attributes[key] ?? 0) < value);
  if (missing) return "属性未达标";
  if (card.id === "old_street_micro" && sources.some((work) => work.semesterIndex > 6)) return "仅收低年级作品";
  return "暂无可投作品";
}

function competitionBlock(state, card, sources) {
  if (competitionSubmittedThisSemester(state)) return { reason: "本学期已经投稿 1 次，下学期再投。", kind: "semester_limit" };
  if (sources.length === 0) return { reason: "", kind: "" };
  if (card.maxParticipationYear && state.year > card.maxParticipationYear) {
    return { reason: "该赛事只允许大一至大三参加。", kind: "year_limit" };
  }
  const missing = competitionMissingRequirements(state, card);
  if (missing.length > 0) return { reason: missing.join("、"), kind: "requirements" };
  if (card.id === "old_street_micro" && sources.some((work) => work.semesterIndex > 6)) {
    return { reason: "该赛事只接收大一至大三完成的课程设计作品。", kind: "work_year_limit" };
  }
  return { reason: "", kind: "" };
}

function competitionMissingRequirements(state, card) {
  return Object.entries(card.requirements ?? {})
    .filter(([key, value]) => (state.attributes[key] ?? 0) < value)
    .map(([key, value]) => `${ATTRIBUTE_LABELS[key] ?? key} ${formatRequirementValue(state.attributes[key] ?? 0)}/${formatRequirementValue(value)}`);
}

function formatRequirementValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1).replace(/\.0$/, "");
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

function competitionBlockedWorks(card, sources, reason) {
  return sources
    .filter((work) => card.id !== "old_street_micro" || work.semesterIndex <= 6)
    .map((work) => ({
      ...work,
      unavailableReason: reason,
    }));
}

function gradeAtLeast(grade, target) {
  const order = ["F", "D", "C", "B", "A", "S"];
  return order.indexOf(grade) >= order.indexOf(target);
}

function mentorTaskProgressText(state, mentor) {
  if (!mentor) return "";
  const tally = state.semesterActionTally ?? {};
  const growth = state.semesterAttributeGrowth ?? {};
  const taskCounts = {
    outsourcing: tally.outsourcing ?? 0,
    site_research: tally.site_research ?? 0,
    design_iteration: tally.design_iteration ?? 0,
    read_exhibition: tally.read_exhibition ?? 0,
    learn_ai_software: tally.learn_ai_software ?? 0,
    competition_submission: state.competitionSubmissionCount ?? 0,
  };
  const progressRows = {
    mentor_wang: [
      countProgress("设计外包", taskCounts.outsourcing, 2),
      countProgress("场地调研", taskCounts.site_research, 3),
    ],
    mentor_ge: [
      countProgress("方案推敲", taskCounts.design_iteration, 3),
      countProgress("阅读/展览/讲座", taskCounts.read_exhibition, 3),
    ],
    mentor_lin: [
      valueProgress("作品质量", state.quality, 75),
      countProgress("方案推敲", taskCounts.design_iteration, 5),
    ],
    mentor_chen: [
      countProgress("场地调研", taskCounts.site_research, 3),
      countProgress("阅读/展览/讲座", taskCounts.read_exhibition, 2),
    ],
    mentor_zhou: [
      countProgress("学习 AI 和设计软件", taskCounts.learn_ai_software, 3),
      valueProgress("本学期软件技术成长", growth.software ?? 0, 15),
    ],
    mentor_xu: [
      valueProgress("第 5 周前进度", state.progress, 90),
      `评图时压力 < 70（当前 ${Math.round(state.pressure)}）`,
    ],
    mentor_han: [
      valueProgress("作品质量", state.quality, 90),
      countProgress("竞赛投稿", taskCounts.competition_submission, 1),
    ],
  };
  const rows = progressRows[mentor.id];
  if (!rows) return mentor.task?.conditionText ?? "";
  return rows.join(["mentor_han", "mentor_zhou"].includes(mentor.id) ? "\n或 " : "\n");
}

function countProgress(label, current, target) {
  return `完成 ${boundedProgress(current, target)}/${target}次 ${label}`;
}

function valueProgress(label, current, target) {
  return `${label} ${boundedProgress(current, target)}/${target}`;
}

function boundedProgress(current, target) {
  return Math.min(Math.max(Math.round(current ?? 0), 0), target);
}

function normalizedCompetitionRecords(state) {
  const records = Array.isArray(state.competitionRecords) ? state.competitionRecords : [];
  return records.slice().reverse().map((record, index) => ({
    workName: record.workName ?? record.projectName ?? record.topic ?? record.reviewTitle ?? `投稿作品 ${records.length - index}`,
    competitionName: record.competitionName ?? record.name ?? "未记录赛事",
    award: record.award ?? "none",
    awardLabel: competitionAwardLabel(record.award),
    prizeMoney: Math.round(record.prizeMoney ?? 0),
  }));
}

function highestCompetitionAward(records, fallbackAwardCount) {
  const order = { none: 0, third: 1, second: 2, first: 3 };
  let highest = "none";
  for (const record of records) {
    if ((order[record.award] ?? 0) > order[highest]) highest = record.award;
  }
  if (highest !== "none") return competitionAwardLabel(highest);
  return fallbackAwardCount > 0 ? "已获奖（旧存档未记录档位）" : "暂无";
}

function competitionAwardLabel(award) {
  return {
    none: "未获奖",
    third: "三等奖",
    second: "二等奖",
    first: "一等奖",
  }[award] ?? "未记录";
}

function internshipSuggestion(state) {
  if (!isInternshipSystemOpen(state)) return `实习申请${yearLabel(2)}学年开放，当前先提升软件和设计能力。`;
  const average = Math.round((state.attributes.software + state.attributes.design) / 2);
  if (average >= 54) return "能力组合已接近名企实习门槛。";
  if (average >= 46) return "可以尝试强事务所或规范设计院实习。";
  if (average >= 33) return "可以尝试低门槛工作室或地方设计院实习。";
  return "建议先提升软件和设计能力，再申请实习。";
}

function isInternshipSystemOpen(state) {
  return Number(state.year) >= 2;
}

function routeSuggestions(state) {
  const suggestions = [];
  if (state.gpa !== null && state.gpa >= 3.1) suggestions.push("保研");
  if (state.portfolio >= 420) suggestions.push("作品集申请");
  if (state.attributes.software >= 75) suggestions.push("数字设计/转行技术岗");
  if (state.attributes.resilience >= 70) suggestions.push("考研/考公长期备考");
  if (state.year < 5) suggestions.push("大五开放正式未来选择");
  return suggestions.slice(0, 4);
}

function routeOptionGroups(state) {
  const groups = [];
  for (const option of ROUTE_OPTIONS) {
    let group = groups.find((item) => item.name === option.group);
    if (!group) {
      group = { name: option.group, options: [] };
      groups.push(group);
    }
    const availability = routeOptionAvailability(state, option);
    group.options.push({
      id: option.id,
      route: option.route,
      target: option.target,
      label: option.label,
      overseas: option.overseas ?? null,
      requirements: summarizeRequirements(option.requirements),
      processNote: routeProcessNote(option),
      state: availability.state,
      reason: availability.reason,
    });
  }
  return groups;
}

function summarizeRequirements(requirements = {}) {
  const items = [];
  if (requirements.gpa !== undefined) items.push(`GPA >= ${requirements.gpa.toFixed(2)}`);
  if (requirements.portfolio !== undefined) items.push(`作品集 >= ${requirements.portfolio}`);
  if (requirements.ielts !== undefined) items.push(`雅思 >= ${requirements.ielts}`);
  if (requirements.internshipValue !== undefined) items.push(`实习价值 >= ${requirements.internshipValue}`);
  if (requirements.aiExperience !== undefined) items.push(`AI 相关经历 >= ${requirements.aiExperience}`);
  if (requirements.competitionAwards !== undefined) items.push(`竞赛获奖 >= ${requirements.competitionAwards} 次`);

  for (const [key, value] of Object.entries(requirements.attributes ?? {})) {
    items.push(`${ATTRIBUTE_LABELS[key] ?? key} >= ${value}`);
  }
  if (requirements.allAttributesAtLeast !== undefined) {
    items.push(`六项角色属性均 >= ${requirements.allAttributesAtLeast}`);
  }
  if (requirements.recentNoF) {
    items.push(`最近 ${requirements.recentNoF} 学期无 F`);
  }
  if (requirements.recentMaxF !== undefined) {
    items.push(`最近 ${requirements.recentTerms ?? 4} 学期 F 不超过 ${requirements.recentMaxF} 次`);
  }
  if (requirements.recentMinGrade) {
    const { grade, count, terms = 4 } = requirements.recentMinGrade;
    items.push(`最近 ${terms} 学期至少 ${count} 次 ${grade} 及以上`);
  }
  return items.length ? items : ["无额外入口门槛"];
}

function routeProcessNote(option) {
  if (option.id === "career_startup") {
    return "满足后进入创业契约确认，签下契约即锁定创业结局。";
  }
  if (option.route === "保研" || option.route === "考研") {
    return "正式参与后进入升学专业题，答题结果只做内部记录。";
  }
  if (option.route === "选调" || option.route === "考公" || option.route === "考编") {
    return "正式参与后进入行测题，答题结果只做内部记录。";
  }
  if (option.route === "留学") {
    return "提交申请时锁定内部判定，录取结果到最终结局再揭示。";
  }
  if (option.route === "建筑工作" || option.route === "转行") {
    return "投递前会确认；投递后锁定内部判定，结果到最终结局再揭示。";
  }
  return "正式参与后本局只读取该方向结果。";
}

function resumeNotes(state) {
  const notes = [];
  if ((state.competitionAwardCount ?? 0) > 0) {
    notes.push(`竞赛获奖经历 ${state.competitionAwardCount} 次`);
  }
  if ((state.internshipValue ?? 0) > 0) {
    notes.push(`累计实习价值 ${state.internshipValue}`);
  }
  if ((state.aiExperience ?? 0) > 0) {
    notes.push(`AI 相关经历 ${state.aiExperience}`);
  }
  if ((state.wanliRoadVisits ?? state.eventTally?.wanliRoadVisits ?? 0) >= WANLI_ROAD_EVENTS.length) {
    notes.push("建筑生的万里路完成");
  }
  if (state.routeParticipation?.label) {
    notes.push(`已正式参与路线：${state.routeParticipation.label}`);
  }
  return notes;
}

function formatGpa(value) {
  return value === null ? "未知" : value.toFixed(2);
}

function courseStageForSemester(semesterIndex) {
  const stages = [
    "建筑初步设计Ⅰ",
    "建筑初步设计Ⅱ",
    "建筑设计Ⅰ",
    "建筑设计Ⅱ",
    "建筑设计Ⅲ",
    "建筑设计Ⅳ",
    "建筑设计Ⅴ",
    "建筑设计Ⅵ",
    "毕业设计",
    "毕业设计",
  ];
  return stages[semesterIndex - 1] ?? "建筑初步设计Ⅰ";
}

function courseTopicForSemester(semesterIndex) {
  return Number(semesterIndex) >= 9 ? "毕业设计" : SEMESTER_TOPICS[semesterIndex - 1] ?? "课程设计";
}

function titleForState(state) {
  if (state.phase === "character_select") return "请选择属于你的建筑生角色";
  if (state.phase === "fixed_event") return "开学固定流程";
  if (state.phase === "mentor_select") return "选择导师";
  if (state.phase === "course_select") return "选择本学年课程";
  if (state.phase === "model_material") return "模型周";
  if (state.phase === "course_exam") return "课程题";
  if (state.phase === "route_exam") return "路线考试";
  if (state.phase === "year_start") return `${yearLabel(state.year)}学年开始`;
  if (state.phase === "review") return "评图阶段";
  if (state.phase === "summer_event") return "暑假写生";
  return `${currentSemesterLabel(state)} 第 ${state.weekInSemester || 1} 周`;
}

function subtitleForState(state) {
  const topic = SEMESTER_TOPICS[state.semesterIndex - 1] ?? "课程设计";
  if (state.ending) return ENDINGS[state.ending]?.body ?? "";
  if (state.phase === "character_select") return "点击抽取 1 张角色卡，可免费重抽 2 次。";
  if (state.phase === "week_action") return `${topic}。本周剩余 ${state.actionsRemaining} 次行动。`;
  return topic;
}

function meter(id, value, max, inverse = false) {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  return {
    id,
    label: STAT_LABELS[id],
    value: Math.round(value),
    max: Math.round(max),
    ratio,
    inverse,
  };
}

function groupedActions(actions) {
  const groups = [];
  for (const action of actions.filter((item) => item.state !== "hidden")) {
    let group = groups.find((item) => item.name === action.group);
    if (!group) {
      group = { name: action.group, actions: [] };
      groups.push(group);
    }
    group.actions.push(action);
  }
  return groups;
}

function riskMessages(state, riskLevel) {
  const messages = [];
  if (riskLevel === "critical") {
    messages.push("你正在崩溃边缘，别画图了，快去休息！");
  } else if (riskLevel === "warning") {
    messages.push("状态进入轻度风险，行动收益会被削弱。");
  }
  if (isMoneyHighRisk(state)) {
    messages.push("你快要饿死了，省着点花！");
  }
  return messages;
}

function ieltsExamStateFor(state) {
  const takenThisSemester = ieltsExamTakenThisSemester(state);
  const inProgress = state.phase === "ielts_exam" || state.ieltsExam;
  const moneyEnough = (state.money ?? 0) >= 1800;
  let reason = "";
  if (takenThisSemester) {
    reason = "本学期已经参加过雅思考试";
  } else if (inProgress) {
    reason = "雅思考试正在进行中";
  } else if (!moneyEnough) {
    reason = "金钱不足，报名费用需要 1800¥";
  }
  return {
    price: 1800,
    takenThisSemester,
    hasTaken: state.ieltsLastTakenSemester != null,
    inProgress: Boolean(inProgress),
    canTake: !takenThisSemester && !inProgress && moneyEnough,
    reason,
  };
}

function normalizeInteraction(interaction) {
  if (!interaction) return null;
  return {
    ...interaction,
    options: (interaction.options ?? []).map((option) => ({
      id: option.id,
      label: option.label,
      body: option.body ?? option.reason ?? "",
      state: option.state ?? "available",
      reason: option.reason ?? "",
      warning: option.warning ?? "",
      image: option.image ?? null,
      delta: option.delta,
      displayDelta: option.displayDelta,
      requirementText: option.requirementText ?? "",
    })),
  };
}

export function projectPreviewForDebug(state, projectType) {
  return {
    outsourcing: availableProjects(state, "outsourcing"),
    part_time: availableProjects(state, "part_time"),
  }[projectType];
}
