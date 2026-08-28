import type { ActionDefinition, ActionId, Attributes, ReviewGrade } from "./types.ts";

export const SEMESTER_COUNT = 10;
export const WEEKS_PER_SEMESTER = 6;
export const TOTAL_WEEKS = SEMESTER_COUNT * WEEKS_PER_SEMESTER;
export const ACTIONS_PER_WEEK = 3;
export const SEMESTER_BREAK_RECOVERY = {
  energy: 25,
  pressure: -20,
} as const;

export const INITIAL_ATTRIBUTES: Attributes = {
  design: 28,
  software: 26,
  aesthetic: 28,
  presentation: 26,
  social: 28,
  resilience: 28,
};

export const FAMILY_ECONOMY = {
  poor: { monthlyAllowance: 2000, initialMoney: 2000, weeklyLivingCost: 350 },
  ordinary: { monthlyAllowance: 3500, initialMoney: 3500, weeklyLivingCost: 600 },
  wealthy: { monthlyAllowance: 10000, initialMoney: 10000, weeklyLivingCost: 2500 },
  academic: { monthlyAllowance: 6000, initialMoney: 6000, weeklyLivingCost: 1500 },
} as const;

export const INITIAL_STATE = {
  energy: 100,
  maxEnergy: 100,
  pressure: 20,
  money: FAMILY_ECONOMY.ordinary.initialMoney,
  gpa: null,
};

export const MONTHLY_ALLOWANCE = FAMILY_ECONOMY.ordinary.monthlyAllowance;
export const WEEKLY_LIVING_COST = FAMILY_ECONOMY.ordinary.weeklyLivingCost;

export const ACTIONS: Record<ActionId, ActionDefinition> = {
  learn_ai_software: {
    id: "learn_ai_software",
    name: "learn_ai_software",
    baseDelta: { energy: -5, pressure: 5, software: 2 },
    pressureIncreasing: true,
  },
  read_exhibition: {
    id: "read_exhibition",
    name: "read_exhibition",
    baseDelta: { energy: -4, pressure: -1, money: -100, aesthetic: 1 },
    costsMoney: true,
  },
  design_iteration: {
    id: "design_iteration",
    name: "design_iteration",
    baseDelta: { energy: -10, pressure: 7, design: 0.5, aesthetic: 0.5 },
    progressBase: 1,
    qualityBase: 12,
    pressureIncreasing: true,
  },
  site_research: {
    id: "site_research",
    name: "site_research",
    baseDelta: { energy: -12, pressure: 2, money: -200, design: 0.5, aesthetic: 0.5, social: 0.5 },
    progressBase: 1,
    qualityBase: 10,
    costsMoney: true,
    pressureIncreasing: true,
  },
  normal_drawing: {
    id: "normal_drawing",
    name: "normal_drawing",
    baseDelta: { energy: -10, pressure: 10 },
    progressBase: 13,
    pressureIncreasing: true,
  },
  crunch_drawing: {
    id: "crunch_drawing",
    name: "crunch_drawing",
    baseDelta: { energy: -22, pressure: 20, resilience: 0.5 },
    progressBase: 20,
    highEnergyCost: true,
    pressureIncreasing: true,
  },
  exercise: {
    id: "exercise",
    name: "exercise",
    baseDelta: { energy: -5, pressure: -20, money: -300, resilience: 2 },
    costsMoney: true,
  },
  socialize: {
    id: "socialize",
    name: "socialize",
    baseDelta: { energy: -5, pressure: -35, money: -500, social: 2 },
    costsMoney: true,
  },
  rest: {
    id: "rest",
    name: "rest",
    baseDelta: { energy: 40, pressure: -15, resilience: 1 },
  },
  outsourcing: {
    id: "outsourcing",
    name: "outsourcing",
    baseDelta: { money: 1000, energy: -6, pressure: 4, design: 1, aesthetic: 1, resilience: 1 },
    maxPerWeek: 2,
    highEnergyCost: true,
    pressureIncreasing: true,
  },
  part_time: {
    id: "part_time",
    name: "part_time",
    baseDelta: { money: 500, pressure: 5, energy: -5 },
    maxPerWeek: 2,
    highEnergyCost: true,
    pressureIncreasing: true,
  },
  special_skill: {
    id: "special_skill",
    name: "special_skill",
    baseDelta: { progress: 8, quality: 6, energy: -8, pressure: 6 },
    pressureIncreasing: true,
  },
};

export const GRADE_ORDER: ReviewGrade[] = ["F", "D", "C", "B", "A", "S"];

export const GRADE_TO_GPA: Record<ReviewGrade, number> = {
  S: 4.0,
  A: 3.7,
  B: 3.2,
  C: 2.4,
  D: 1.3,
  F: 0.0,
};

export const GRADUATION_DESIGN_PROGRESS_REQUIREMENT = 240;
export const GRADUATION_DESIGN_FINAL_PROGRESS_REQUIREMENT = GRADUATION_DESIGN_PROGRESS_REQUIREMENT;

export function progressCapForSemester(semesterIndex: number): number {
  return semesterIndex >= 9 ? 250 : 100;
}

export function qualityCapForSemester(semesterIndex: number): number {
  return semesterIndex >= 9 ? 250 : 100;
}

export function isGraduationDesign(semesterIndex: number): boolean {
  return semesterIndex >= 9;
}
