import type {
  AttributeKey,
  Attributes,
  CompetitionAward,
  CompetitionId,
  InternshipTargetId,
  RouteGroup,
  RouteId,
  RouteTargetId,
} from "./types.ts";

export const ROUTE_TIMING = {
  intentionSemester: 7,
  formalSemester: 9,
  hiddenResultSemester: 10,
  prepSemesterMin: 7,
  prepSemesterMax: 9,
} as const;

export const INTERNSHIP_THRESHOLDS = {
  ordinary: { design: 34, software: 32, value: 1 },
  strong: { design: 48, software: 44, value: 2 },
  namedFirm: { design: 56, software: 52, value: 3 },
} as const;

export const INTERNSHIP_TIER_LABELS = {
  ordinary: "普通实习",
  strong: "强事务所实习",
  named_firm: "名企实习",
} as const;

export const INTERNSHIP_TARGET_ORDER = [
  "independent_studio",
  "local_design_institute",
  "state_owned_design_institute",
  "foreign_firm",
  "master_studio",
] as const satisfies readonly InternshipTargetId[];

export const INTERNSHIP_TARGETS: Record<InternshipTargetId, {
  id: InternshipTargetId;
  label: string;
  tier: keyof typeof INTERNSHIP_TIER_LABELS;
  thresholds: { design: number; software: number };
}> = {
  independent_studio: {
    id: "independent_studio",
    label: "独立小型工作室",
    tier: "ordinary",
    thresholds: { design: 34, software: 32 },
  },
  local_design_institute: {
    id: "local_design_institute",
    label: "地方设计院",
    tier: "ordinary",
    thresholds: { design: 38, software: 36 },
  },
  state_owned_design_institute: {
    id: "state_owned_design_institute",
    label: "国企设计院",
    tier: "strong",
    thresholds: { design: 48, software: 44 },
  },
  foreign_firm: {
    id: "foreign_firm",
    label: "外企事务所",
    tier: "named_firm",
    thresholds: { design: 56, software: 52 },
  },
  master_studio: {
    id: "master_studio",
    label: "大师建筑事务所",
    tier: "named_firm",
    thresholds: { design: 62, software: 58 },
  },
};

export const INTERNSHIP_APPLICATION = {
  earliestSemester: 3,
  durationWeeks: 3,
  tiers: {
    ordinary: {
      maxAttempts: 4,
      baseChance: 72,
      maxChance: 96,
      excessCap: 20,
      excessMultiplier: 1.2,
    },
    strong: {
      maxAttempts: 2,
      baseChance: 68,
      maxChance: 96,
      excessCap: 20,
      excessMultiplier: 1.4,
    },
    named_firm: {
      maxAttempts: 1,
      baseChance: 55,
      maxChance: 88,
      excessCap: 20,
      excessMultiplier: 1.65,
    },
  },
} as const;

export const COMPETITION_APPLICATION = {
  latestPortfolioAdded: 64,
  design: 45,
  aesthetic: 45,
  latestSemesterMax: 8,
  baseShortlistChance: 45,
  maxShortlistChance: 92,
  performanceDivisor: 2.8,
} as const;

export const COMPETITION_AWARD_TIERS: Record<CompetitionAward, { minPerformance: number; prizeMoney: number }> = {
  none: { minPerformance: 0, prizeMoney: 0 },
  third: { minPerformance: 0, prizeMoney: 300 },
  second: { minPerformance: 65, prizeMoney: 800 },
  first: { minPerformance: 90, prizeMoney: 1500 },
} as const;

export const COMPETITION_POOL: Record<
  CompetitionId,
  {
    id: CompetitionId;
    name: string;
    semesterMin: number;
    semesterMax: number;
    portfolioAdded: number;
    design: number;
    aesthetic: number;
    presentation?: number;
    shortlistChanceModifier: number;
    prizeMoneyMultiplier: number;
  }
> = {
  campus_corner_renovation: {
    id: "campus_corner_renovation",
    name: "霍普杯国际大学生建筑设计竞赛",
    semesterMin: 3,
    semesterMax: 4,
    portfolioAdded: 60,
    design: 41,
    aesthetic: 41,
    shortlistChanceModifier: 12,
    prizeMoneyMultiplier: 0.8,
  },
  old_block_micro_renewal: {
    id: "old_block_micro_renewal",
    name: "东南·中国建筑新人赛",
    semesterMin: 5,
    semesterMax: 6,
    portfolioAdded: 64,
    design: 50,
    aesthetic: 45,
    presentation: 48,
    shortlistChanceModifier: 4,
    prizeMoneyMultiplier: 1,
  },
  green_building_concept: {
    id: "green_building_concept",
    name: "台达杯国际太阳能建筑设计竞赛",
    semesterMin: 7,
    semesterMax: 8,
    portfolioAdded: 68,
    design: 49,
    aesthetic: 47,
    shortlistChanceModifier: -2,
    prizeMoneyMultiplier: 1.2,
  },
  young_architect_portfolio: {
    id: "young_architect_portfolio",
    name: "台湾国际学生创意设计大赛",
    semesterMin: 8,
    semesterMax: 8,
    portfolioAdded: 74,
    design: 50,
    aesthetic: 50,
    presentation: 45,
    shortlistChanceModifier: -8,
    prizeMoneyMultiplier: 1.5,
  },
} as const;

export const ROUTE_THRESHOLDS = {
  postgradExam: {
    gpa: 1.9,
    portfolio: 375,
    design: 62,
    software: 46,
    resilience: 48,
    recentFailedReviewsMax: 1,
    examFloorEligible: 6,
    examFloorIneligible: 4,
    passCorrect: 6,
  },
  overseas: {
    gpa: 2.3,
    portfolio: 380,
  },
  civilService: {
    eligible: {
      gpa: 1.9,
      presentation: 46,
      social: 58,
      resilience: 48,
    },
    fallback: {
      presentation: 46,
      social: 58,
      resilience: 48,
    },
    examFloorEligible: 6,
    examFloorIneligible: 5,
    passCorrect: 6,
    fallbackCorrect: 6,
  },
  architectureJob: {
    design: 56,
    software: 45,
    internshipValue: 1,
    portfolioTarget: 410,
  },
  careerChange: {
    presentation: 55,
    aesthetic: 65,
  },
  entrepreneurship: {
    design: 80,
    software: 80,
    aesthetic: 80,
    presentation: 80,
    social: 80,
    resilience: 80,
  },
} as const;

export type RouteTargetDefinition = {
  id: RouteTargetId;
  route: RouteId;
  group: RouteGroup;
  label: string;
  thresholds: Partial<Record<AttributeKey, number>> & {
    gpa?: number;
    portfolio?: number;
    internshipValue?: number;
    namedFirmInternship?: boolean;
    aiExperience?: number;
    recentFailedReviewsMax?: number;
  };
  examFloorEligible?: number;
  examFloorIneligible?: number;
  passCorrect?: number;
  fallbackCorrect?: number;
  overseasTier?: "s" | "a" | "b" | "c";
  overseasChance?: {
    base: number;
    cap: number;
  };
};

function overseasTarget(
  id: RouteTargetId,
  overseasTier: "s" | "a" | "b" | "c",
  label: string,
  gpa: number,
  portfolio: number,
): RouteTargetDefinition {
  const chance = {
    s: { base: 0.58, cap: 0.94 },
    a: { base: 0.66, cap: 0.96 },
    b: { base: 0.76, cap: 0.98 },
    c: { base: 0.86, cap: 0.99 },
  }[overseasTier];
  return {
    id,
    route: "overseas",
    group: "education",
    label,
    overseasTier,
    thresholds: { gpa, portfolio },
    overseasChance: chance,
  };
}

export const ROUTE_TARGETS: Record<RouteTargetId, RouteTargetDefinition> = {
  dream_postgrad_school: {
    id: "dream_postgrad_school",
    route: "postgrad_exam",
    group: "education",
    label: "dream postgrad school",
    thresholds: {
      gpa: 2.5,
      portfolio: 560,
      design: 74,
      software: 58,
      resilience: 53,
      recentFailedReviewsMax: 1,
    },
    examFloorEligible: 6,
    examFloorIneligible: 4,
    passCorrect: 8,
  },
  strong_postgrad_school: {
    id: "strong_postgrad_school",
    route: "postgrad_exam",
    group: "education",
    label: "strong postgrad school",
    thresholds: {
      gpa: 2.2,
      portfolio: 465,
      design: 70,
      software: 56,
      resilience: 50,
      recentFailedReviewsMax: 1,
    },
    examFloorEligible: 6,
    examFloorIneligible: 4,
    passCorrect: 7,
  },
  ordinary_postgrad_school: {
    id: "ordinary_postgrad_school",
    route: "postgrad_exam",
    group: "education",
    label: "ordinary postgrad school",
    thresholds: {
      gpa: ROUTE_THRESHOLDS.postgradExam.gpa,
      portfolio: ROUTE_THRESHOLDS.postgradExam.portfolio,
      design: ROUTE_THRESHOLDS.postgradExam.design,
      software: ROUTE_THRESHOLDS.postgradExam.software,
      resilience: ROUTE_THRESHOLDS.postgradExam.resilience,
      recentFailedReviewsMax: ROUTE_THRESHOLDS.postgradExam.recentFailedReviewsMax,
    },
    examFloorEligible: ROUTE_THRESHOLDS.postgradExam.examFloorEligible,
    examFloorIneligible: ROUTE_THRESHOLDS.postgradExam.examFloorIneligible,
    passCorrect: ROUTE_THRESHOLDS.postgradExam.passCorrect,
  },
  overseas_gsd: overseasTarget("overseas_gsd", "s", "Harvard GSD", 3.6, 650),
  overseas_aa: overseasTarget("overseas_aa", "s", "AA School", 3.35, 605),
  overseas_eth: overseasTarget("overseas_eth", "s", "ETH Zurich", 3.55, 625),
  overseas_mit: overseasTarget("overseas_mit", "s", "MIT Architecture", 3.7, 670),
  overseas_ucl: overseasTarget("overseas_ucl", "s", "UCL Bartlett", 3.45, 610),
  overseas_columbia: overseasTarget("overseas_columbia", "a", "Columbia GSAPP", 3.25, 555),
  overseas_upenn: overseasTarget("overseas_upenn", "a", "UPenn Weitzman", 3.2, 545),
  overseas_tud: overseasTarget("overseas_tud", "a", "TU Delft", 3.15, 540),
  overseas_cornell: overseasTarget("overseas_cornell", "a", "Cornell AAP", 3.35, 570),
  overseas_nus: overseasTarget("overseas_nus", "a", "NUS Architecture", 3.15, 530),
  overseas_hku: overseasTarget("overseas_hku", "a", "HKU Architecture", 3.1, 520),
  overseas_sheffield: overseasTarget("overseas_sheffield", "b", "Sheffield Architecture", 2.8, 485),
  overseas_risd: overseasTarget("overseas_risd", "b", "RISD Architecture", 2.9, 510),
  overseas_melbourne: overseasTarget("overseas_melbourne", "b", "Melbourne Architecture", 2.85, 500),
  overseas_msa: overseasTarget("overseas_msa", "b", "Manchester School of Architecture", 2.75, 475),
  overseas_polimi: overseasTarget("overseas_polimi", "c", "Polimi Milan", 2.5, 440),
  selection_home: {
    id: "selection_home",
    route: "civil_service",
    group: "civil",
    label: "home province selection",
    thresholds: { gpa: 3.05, presentation: 63, social: 63, resilience: 64, recentFailedReviewsMax: 1 },
    examFloorEligible: 7,
    examFloorIneligible: 5,
    passCorrect: 8,
  },
  civil_service_ministry: {
    id: "civil_service_ministry",
    route: "civil_service",
    group: "civil",
    label: "national ministry civil service",
    thresholds: { gpa: 3.2, presentation: 68, social: 64, resilience: 64, recentFailedReviewsMax: 1 },
    examFloorEligible: 7,
    examFloorIneligible: 5,
    passCorrect: 8,
    fallbackCorrect: 6,
  },
  civil_service_provincial: {
    id: "civil_service_provincial",
    route: "civil_service",
    group: "civil",
    label: "provincial bureau civil service",
    thresholds: { gpa: 2.65, presentation: 58, social: 53, resilience: 58 },
    examFloorEligible: 6,
    examFloorIneligible: 5,
    passCorrect: 7,
    fallbackCorrect: 6,
  },
  teacher_bianzhi: {
    id: "teacher_bianzhi",
    route: "civil_service",
    group: "civil",
    label: "teacher bianzhi",
    thresholds: { gpa: 2.25, presentation: 46, design: 63, recentFailedReviewsMax: 1 },
    examFloorEligible: 6,
    examFloorIneligible: 5,
    passCorrect: 7,
    fallbackCorrect: 6,
  },
  public_institution_general: {
    id: "public_institution_general",
    route: "civil_service",
    group: "civil",
    label: "general public institution",
    thresholds: {
      gpa: ROUTE_THRESHOLDS.civilService.eligible.gpa,
      presentation: ROUTE_THRESHOLDS.civilService.eligible.presentation,
      social: ROUTE_THRESHOLDS.civilService.eligible.social,
      resilience: ROUTE_THRESHOLDS.civilService.eligible.resilience,
    },
    examFloorEligible: ROUTE_THRESHOLDS.civilService.examFloorEligible,
    examFloorIneligible: ROUTE_THRESHOLDS.civilService.examFloorIneligible,
    passCorrect: ROUTE_THRESHOLDS.civilService.passCorrect,
    fallbackCorrect: ROUTE_THRESHOLDS.civilService.fallbackCorrect,
  },
  administration_bianzhi: {
    id: "administration_bianzhi",
    route: "civil_service",
    group: "civil",
    label: "administrative bianzhi",
    thresholds: { gpa: 2.05, presentation: 46, social: 66 },
    examFloorEligible: 6,
    examFloorIneligible: 5,
    passCorrect: 6,
    fallbackCorrect: 6,
  },
  independent_studio: {
    id: "independent_studio",
    route: "architecture_job",
    group: "architecture_job",
    label: "independent studio",
    thresholds: { design: 54, software: 42, internshipValue: 1 },
  },
  local_design_institute: {
    id: "local_design_institute",
    route: "architecture_job",
    group: "architecture_job",
    label: "local design institute",
    thresholds: {
      design: ROUTE_THRESHOLDS.architectureJob.design,
      software: ROUTE_THRESHOLDS.architectureJob.software,
      internshipValue: ROUTE_THRESHOLDS.architectureJob.internshipValue,
    },
  },
  state_owned_design_institute: {
    id: "state_owned_design_institute",
    route: "architecture_job",
    group: "architecture_job",
    label: "state-owned design institute",
    thresholds: { design: 64, software: 58, portfolio: 590, internshipValue: 2 },
  },
  foreign_firm: {
    id: "foreign_firm",
    route: "architecture_job",
    group: "architecture_job",
    label: "foreign architecture firm",
    thresholds: { design: 72, software: 66, portfolio: 600, internshipValue: 2 },
  },
  master_studio: {
    id: "master_studio",
    route: "architecture_job",
    group: "architecture_job",
    label: "master architecture studio",
    thresholds: { design: 78, software: 70, portfolio: 680, internshipValue: 3 },
  },
  ai_product_manager: {
    id: "ai_product_manager",
    route: "career_change",
    group: "career_change",
    label: "AI product manager",
    thresholds: { software: 70, presentation: 65, social: 65, aiExperience: 1 },
  },
  game_scene_artist: {
    id: "game_scene_artist",
    route: "career_change",
    group: "career_change",
    label: "game scene artist",
    thresholds: { software: 65, aesthetic: 68, portfolio: 520 },
  },
  sales_business: {
    id: "sales_business",
    route: "career_change",
    group: "career_change",
    label: "sales and business",
    thresholds: { presentation: 55, social: 65, resilience: 60 },
  },
  new_media_content: {
    id: "new_media_content",
    route: "career_change",
    group: "career_change",
    label: "new media content",
    thresholds: {
      presentation: ROUTE_THRESHOLDS.careerChange.presentation,
      aesthetic: ROUTE_THRESHOLDS.careerChange.aesthetic,
    },
  },
  illustrator: {
    id: "illustrator",
    route: "career_change",
    group: "career_change",
    label: "illustrator",
    thresholds: { aesthetic: 60, portfolio: 490 },
  },
  entrepreneurship: {
    id: "entrepreneurship",
    route: "career_change",
    group: "career_change",
    label: "entrepreneurship",
    thresholds: { ...ROUTE_THRESHOLDS.entrepreneurship },
  },
} as const;

export const STRATEGY_TUNING = {
  routePrepEnergyMin: 45,
  routePrepPressureMax: 72,
  routeActionEnergyMin: 45,
  routeActionPressureMax: 72,
  routePartTimeMoneyFloor: 1400,
  courseworkUrgencyActionsPerWeekLeft: 2,
  courseworkQualityBuffer: {
    default: 8,
    postgrad: 16,
    architectureJob: 16,
    careerChange: 2,
  },
} as const;

export function meetsAttributes(
  attributes: Attributes,
  thresholds: Partial<Record<keyof Attributes, number>>,
): boolean {
  return Object.entries(thresholds).every(([key, value]) => {
    return attributes[key as keyof Attributes] >= (value ?? 0);
  });
}
