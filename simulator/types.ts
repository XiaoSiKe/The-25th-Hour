export type AttributeKey =
  | "design"
  | "software"
  | "aesthetic"
  | "presentation"
  | "social"
  | "resilience";

export type ActionId =
  | "learn_ai_software"
  | "read_exhibition"
  | "design_iteration"
  | "site_research"
  | "normal_drawing"
  | "crunch_drawing"
  | "exercise"
  | "socialize"
  | "rest"
  | "outsourcing"
  | "part_time"
  | "special_skill";

export type StrategyId =
  | "normal"
  | "bankrupt"
  | "burnout"
  | "pressure"
  | "fail_reviews"
  | "balanced"
  | "postgrad"
  | "overseas"
  | "civil_service"
  | "architecture_job"
  | "career_change";

export type RouteId =
  | "postgrad_exam"
  | "overseas"
  | "civil_service"
  | "architecture_job"
  | "career_change";

export type RouteGroup = "education" | "civil" | "architecture_job" | "career_change";

export type RouteTargetId =
  | "dream_postgrad_school"
  | "strong_postgrad_school"
  | "ordinary_postgrad_school"
  | "overseas_gsd"
  | "overseas_aa"
  | "overseas_eth"
  | "overseas_mit"
  | "overseas_ucl"
  | "overseas_columbia"
  | "overseas_upenn"
  | "overseas_tud"
  | "overseas_cornell"
  | "overseas_nus"
  | "overseas_hku"
  | "overseas_sheffield"
  | "overseas_risd"
  | "overseas_melbourne"
  | "overseas_msa"
  | "overseas_polimi"
  | "selection_home"
  | "civil_service_ministry"
  | "civil_service_provincial"
  | "teacher_bianzhi"
  | "public_institution_general"
  | "administration_bianzhi"
  | "independent_studio"
  | "local_design_institute"
  | "state_owned_design_institute"
  | "foreign_firm"
  | "master_studio"
  | "ai_product_manager"
  | "game_scene_artist"
  | "sales_business"
  | "new_media_content"
  | "illustrator"
  | "entrepreneurship";

export type RouteOutcome =
  | "elite_exam_postgrad"
  | "steady_postgrad"
  | "postgrad_retry"
  | "overseas_elite"
  | "overseas_strong"
  | "overseas_stable"
  | "overseas_safety"
  | "overseas_failed"
  | "selected_transfer_home"
  | "selected_transfer_wait"
  | "civil_ministry"
  | "civil_province"
  | "public_teacher"
  | "public_institution"
  | "public_admin"
  | "civil_retry"
  | "architecture_master"
  | "architecture_foreign"
  | "architecture_state"
  | "architecture_local"
  | "architecture_small"
  | "job_pending"
  | "career_ai_pm"
  | "career_game_scene"
  | "career_sales"
  | "career_content"
  | "career_illustrator"
  | "career_startup"
  | "career_failed";

export type RouteFailureReason =
  | "gpa_below_threshold"
  | "portfolio_below_threshold"
  | "design_below_threshold"
  | "software_below_threshold"
  | "aesthetic_below_threshold"
  | "presentation_below_threshold"
  | "social_below_threshold"
  | "resilience_below_threshold"
  | "internship_below_threshold"
  | "recent_failed_reviews_above_threshold"
  | "exam_score_below_threshold"
  | "overseas_probability_roll_failed"
  | "ai_experience_below_threshold";

export type CourseId =
  | "architecture_history"
  | "building_technology"
  | "digital_planning"
  | "public_speaking"
  | "public_administration"
  | "media_studies"
  | "portfolio_workshop";

export type ReviewGrade = "S" | "A" | "B" | "C" | "D" | "F";

export type CompetitionAward = "none" | "third" | "second" | "first";

export type CompetitionId =
  | "campus_corner_renovation"
  | "old_block_micro_renewal"
  | "green_building_concept"
  | "young_architect_portfolio";

export type InternshipTier = "ordinary" | "strong" | "named_firm";
export type InternshipTargetId =
  | "independent_studio"
  | "local_design_institute"
  | "state_owned_design_institute"
  | "foreign_firm"
  | "master_studio";

export type EventPool = "regular" | "interactive" | "model_week" | "internship_short";

export type EventSentiment = "positive" | "neutral" | "negative";

export type FailureReason =
  | "living_cost_break"
  | "forced_suspension"
  | "pressure_collapse"
  | "two_failed_reviews";

export type EndingId =
  | "stable_graduation"
  | "wounded_graduation"
  | "graduation_failed"
  | RouteOutcome
  | "living_cost_break"
  | "forced_suspension"
  | "pressure_collapse"
  | "two_failed_reviews";

export type Phase =
  | "profile"
  | "character"
  | "fixed_event"
  | "semester_start"
  | "week_start"
  | "week_action"
  | "week_settlement"
  | "review"
  | "semester_settlement"
  | "year_transition"
  | "graduation"
  | "ending";

export type Delta = Partial<{
  energy: number;
  pressure: number;
  money: number;
  progress: number;
  quality: number;
  portfolio: number;
  internshipValue: number;
  gpaModifier: number;
} & Record<AttributeKey, number>>;

export interface Attributes {
  design: number;
  software: number;
  aesthetic: number;
  presentation: number;
  social: number;
  resilience: number;
}

export interface ReviewRecord {
  semesterIndex: number;
  year: number;
  term: 1 | 2;
  progress: number;
  quality: number;
  baseGrade: ReviewGrade;
  finalGrade: ReviewGrade;
  designCourseGpa: number;
  semesterGpa: number;
  portfolioAdded: number;
  isGraduationDesign: boolean;
}

export interface CompetitionRecord {
  competitionId: CompetitionId;
  competitionName: string;
  semesterIndex: number;
  year: number;
  term: 1 | 2;
  reviewGrade: ReviewGrade;
  portfolioAdded: number;
  performance: number;
  shortlistChance: number;
  shortlistRoll: number;
  shortlisted: boolean;
  award: CompetitionAward;
  prizeMoney: number;
}

export interface InternshipRecord {
  semesterIndex: number;
  week: number;
  completedWeek: number;
  targetId?: InternshipTargetId;
  targetLabel?: string;
  tier: InternshipTier;
  value: number;
  designAtOffer: number;
  softwareAtOffer: number;
  wageTotal: number;
  weeksCompleted: number;
  shortEventId?: string;
  shortEventWeek?: number;
}

export interface InternshipApplicationRecord {
  semesterIndex: number;
  week: number;
  targetId?: InternshipTargetId;
  targetLabel?: string;
  tier: InternshipTier;
  chance: number;
  roll: number;
  accepted: boolean;
  designAtApplication: number;
  softwareAtApplication: number;
}

export interface ActiveInternship {
  targetId?: InternshipTargetId;
  targetLabel?: string;
  tier: InternshipTier;
  value: number;
  startSemesterIndex: number;
  startWeek: number;
  remainingWeeks: number;
  weeksCompleted: number;
  wageTotal: number;
  designAtOffer: number;
  softwareAtOffer: number;
  shortEventId?: string;
  shortEventWeek?: number;
  shortEventTriggered?: boolean;
}

export interface LogEntry {
  index: number;
  week: number;
  year: number;
  term: 1 | 2;
  weekInSemester: number;
  phase: Phase;
  source: string;
  message: string;
  delta?: Delta;
  snapshot: StateSnapshot;
}

export interface EventDefinition {
  id: string;
  title: string;
  pool: EventPool;
  sentiment: EventSentiment;
  baseWeight: number;
  cooldownWeeks: number;
  repeatable: boolean;
  delta: Delta;
  tags?: string[];
  contextTags?: string[];
  aiExperienceDelta?: number;
  semesterMin?: number;
  semesterMax?: number;
  weekInSemester?: number;
}

export interface EventRecord {
  eventId: string;
  title: string;
  week: number;
  semesterIndex: number;
  pool: EventPool;
  sentiment: EventSentiment;
  aiExperienceDelta: number;
}

export interface RouteState {
  targetOverride?: RouteTargetId;
  intention?: RouteId;
  entrepreneurshipContract?: {
    unlocked: boolean;
    contractOffered: boolean;
    contractChoice?: "signed" | "abandoned";
  };
  formal?: {
    route: RouteId;
    group: RouteGroup;
    target: RouteTargetId;
    week: number;
  };
  hiddenResult?: {
    route: RouteId;
    target: RouteTargetId;
    passed: boolean;
    score?: number;
    outcome: RouteOutcome;
    attributesAtDecision: Attributes;
    gpaAtDecision: number;
    portfolioAtDecision: number;
    internshipValueAtDecision: number;
    namedFirmInternshipAtDecision: boolean;
    internshipTierAtDecision?: InternshipTier;
    recentFailedReviewsAtDecision: number;
    failureReasons: RouteFailureReason[];
  };
}

export interface CourseDefinition {
  id: CourseId;
  name: string;
  delta: Delta;
}

export interface CourseRecord {
  semesterIndex: number;
  course: CourseId;
  correctAnswers: number;
  gpaModifier: number;
}

export interface StateSnapshot {
  energy: number;
  pressure: number;
  money: number;
  progress: number;
  quality: number;
  gpa: number | null;
  portfolio: number;
  consecutiveFailedReviews: number;
  ending?: EndingId;
}

export interface GameState {
  seed: number;
  rngState: number;
  strategy: StrategyId;
  phase: Phase;
  week: number;
  year: number;
  term: 1 | 2;
  weekInSemester: number;
  semesterIndex: number;
  actionsRemaining: number;
  weeklyActionCounts: Partial<Record<ActionId, number>>;
  semesterActionTally: Partial<Record<ActionId, number>>;
  energy: number;
  maxEnergy: number;
  pressure: number;
  money: number;
  gpa: number | null;
  gpaHistory: number[];
  gpaModifier: number;
  selectedCourse?: CourseId;
  courseRecords: CourseRecord[];
  attributes: Attributes;
  progress: number;
  quality: number;
  portfolio: number;
  consecutiveFailedReviews: number;
  pressureOver90Weeks: number;
  reviews: ReviewRecord[];
  logs: LogEntry[];
  eventHistory: string[];
  eventRecords: EventRecord[];
  eventLastTriggeredWeek: Record<string, number>;
  eventTally: Record<string, number>;
  earlyRandomEventNeedsInteractive: boolean;
  aiExperience: number;
  route: RouteState;
  internshipValue: number;
  namedFirmInternship: boolean;
  activeInternship?: ActiveInternship;
  internshipApplications: InternshipApplicationRecord[];
  internshipAppliedSemesters: number[];
  internshipRecords: InternshipRecord[];
  competitionAwardCount: number;
  competitionSubmittedIds: CompetitionId[];
  competitionRecords: CompetitionRecord[];
  guaranteedEvents: {
    lightlyHolding: boolean;
    deskNote: boolean;
  };
  actionTally: Partial<Record<ActionId, number>>;
  ending?: EndingId;
  failureReason?: FailureReason;
  completedGraduationDesign: boolean;
}

export interface ActionDefinition {
  id: ActionId;
  name: string;
  baseDelta: Delta;
  progressBase?: number;
  qualityBase?: number;
  maxPerWeek?: number;
  costsMoney?: boolean;
  highEnergyCost?: boolean;
  pressureIncreasing?: boolean;
}

export interface RunOptions {
  seed: number;
  strategy: StrategyId;
  routeTarget?: RouteTargetId;
  maxWeeks?: number;
  verbose?: boolean;
  events?: boolean;
}
