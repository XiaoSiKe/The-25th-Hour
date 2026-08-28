import type { RouteId, RouteTargetId, StrategyId } from "./types.ts";

export interface RouteTargetCase {
  strategy: StrategyId;
  route: RouteId;
  target: RouteTargetId;
  count: number;
  expectTargetSuccess?: boolean;
  expectRoutePass?: boolean;
  expectFailure?: boolean;
}

export const ROUTE_TARGET_CASES: RouteTargetCase[] = [
  { strategy: "postgrad", route: "postgrad_exam", target: "ordinary_postgrad_school", count: 30, expectTargetSuccess: true },
  { strategy: "postgrad", route: "postgrad_exam", target: "strong_postgrad_school", count: 30, expectFailure: true },
  { strategy: "postgrad", route: "postgrad_exam", target: "dream_postgrad_school", count: 30, expectFailure: true },
  { strategy: "overseas", route: "overseas", target: "overseas_polimi", count: 30, expectTargetSuccess: true },
  { strategy: "overseas", route: "overseas", target: "overseas_hku", count: 30, expectTargetSuccess: true },
  { strategy: "overseas", route: "overseas", target: "overseas_mit", count: 30, expectFailure: true },
  { strategy: "civil_service", route: "civil_service", target: "selection_home", count: 30, expectFailure: true },
  { strategy: "civil_service", route: "civil_service", target: "civil_service_ministry", count: 30, expectRoutePass: true, expectFailure: true },
  { strategy: "civil_service", route: "civil_service", target: "administration_bianzhi", count: 30, expectTargetSuccess: true },
  { strategy: "civil_service", route: "civil_service", target: "teacher_bianzhi", count: 30, expectRoutePass: true, expectFailure: true },
  { strategy: "civil_service", route: "civil_service", target: "public_institution_general", count: 30, expectTargetSuccess: true },
  { strategy: "civil_service", route: "civil_service", target: "civil_service_provincial", count: 30, expectRoutePass: true, expectFailure: true },
  { strategy: "architecture_job", route: "architecture_job", target: "independent_studio", count: 30, expectTargetSuccess: true },
  { strategy: "architecture_job", route: "architecture_job", target: "local_design_institute", count: 30, expectTargetSuccess: true },
  { strategy: "architecture_job", route: "architecture_job", target: "state_owned_design_institute", count: 30, expectFailure: true },
  { strategy: "architecture_job", route: "architecture_job", target: "foreign_firm", count: 30, expectFailure: true },
  { strategy: "architecture_job", route: "architecture_job", target: "master_studio", count: 30, expectFailure: true },
  { strategy: "career_change", route: "career_change", target: "new_media_content", count: 30, expectFailure: true },
  { strategy: "career_change", route: "career_change", target: "ai_product_manager", count: 30, expectFailure: true },
  { strategy: "career_change", route: "career_change", target: "game_scene_artist", count: 30, expectFailure: true },
  { strategy: "career_change", route: "career_change", target: "sales_business", count: 30, expectFailure: true },
  { strategy: "career_change", route: "career_change", target: "illustrator", count: 30, expectTargetSuccess: true },
];

export function isTargetSuccess(testCase: RouteTargetCase, outcome: string | null | undefined): boolean {
  switch (testCase.route) {
    case "postgrad_exam":
      return testCase.target === "ordinary_postgrad_school" ? outcome === "steady_postgrad" : outcome === "elite_exam_postgrad";
    case "overseas":
      if (testCase.target === "overseas_mit") return outcome === "overseas_elite";
      if (["overseas_columbia", "overseas_upenn", "overseas_tud", "overseas_cornell", "overseas_nus", "overseas_hku"].includes(testCase.target)) {
        return outcome === "overseas_strong";
      }
      if (["overseas_sheffield", "overseas_risd", "overseas_melbourne", "overseas_msa"].includes(testCase.target)) {
        return outcome === "overseas_stable";
      }
      return outcome === "overseas_safety";
    case "civil_service":
      return ["selected_transfer_home", "civil_ministry", "civil_province", "public_teacher", "public_institution", "public_admin"].includes(outcome ?? "");
    case "architecture_job":
      return ["architecture_master", "architecture_foreign", "architecture_state", "architecture_local", "architecture_small"].includes(outcome ?? "");
    case "career_change":
      return testCase.target === "entrepreneurship"
        ? outcome === "career_startup"
        : ["career_ai_pm", "career_game_scene", "career_sales", "career_content", "career_illustrator"].includes(outcome ?? "");
  }
}
