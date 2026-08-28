import { escapeHtml } from "./html.mjs";
import { publicAssetUrl } from "./asset-url.mjs";
import { uiIconAtlasEntryFor } from "./ui-icon-atlas.mjs";
import {
  UI_ICON_FINAL_IMAGE_SOURCES,
  finalAchievementIconSourceByTitle,
  finalUiIconItems,
  finalUiIconMap,
  finalUiIconSource,
} from "./icon-source.mjs";

const THEME_LIGHT_ICON = "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/007_UIATLAS_003_024_pxui_system_024_太阳__UIATLAS_003_024_pxui_system_024_太阳.8664a5d77258.webp";
const THEME_DARK_ICON = "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/008_UIATLAS_003_023_pxui_system_023_月亮__UIATLAS_003_023_pxui_system_023_月亮.2cad5ef79c85.webp";
const LOADING_CLOCK_ICON = "/optimized/asset-work/ui-icon-final/confirmed-icons/00-non-atlas-ui/001_开场 _ 开始界面时钟图1__时钟图1.36b6aac0df0b.webp";
const START_CLOCK_ICON = LOADING_CLOCK_ICON;
const GAME_CLOCK_ICON = "/optimized/asset-work/ui-icon-final/confirmed-icons/00-non-atlas-ui/003_游戏主要过程界面时钟图2__时钟图2.414900d928ef.webp";
const UNMAPPED_BASE_020_CROSS_ICON = "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_001_基础操作按钮/UIATLAS_001_020_pxui_base_020_叉.d3ec4d59a5f9.webp";

const RANDOM_EVENT_ICON_CONFIG = {
  normal: { prefix: "normal" },
  interactive: { prefix: "interactive" },
  model: { prefix: "model" },
};

export const START_SECONDARY_ENTRIES = [
  { command: "open-external-link", id: "author", title: "作者的话", detail: "“这三年最大的收获，就是遇到了那些形形色色的人们......”", icon: "author" },
  { command: "ui-dialog", id: "coffee", title: "请作者喝咖啡续命", detail: "“谢谢你愿意玩我的游戏，谢谢！”", icon: "coffee" },
];

export const START_TOOLBAR_ENTRIES = [
  { command: "ui-dialog", id: "language", title: "语言", icon: "language" },
  { command: "open-external-link", id: "community", title: "建院社区", icon: "community" },
  { command: "ui-dialog", id: "announcement", title: "公告", icon: "note" },
  { command: "toggle-theme", id: "", title: "深浅色模式", icon: "theme" },
];

export const START_SETTINGS_ENTRIES = [
  { command: "ui-dialog", id: "theme", title: "主题背景", detail: "切换深浅主题", icon: "theme" },
  { command: "ui-dialog", id: "announcement", title: "公告", detail: "更新消息", icon: "note" },
  { command: "open-external-link", id: "author", title: "作者的话", detail: "飞书文档", icon: "author" },
  { command: "ui-dialog", id: "coffee", title: "请作者喝咖啡续命", detail: "支持作者", icon: "coffee" },
  { command: "open-external-link", id: "community", title: "建院社区", detail: "同好交流", icon: "community" },
  { command: "ui-dialog", id: "leaderboard", title: "玩家排行榜", detail: "结局后生成排名", icon: "leaderboard" },
  { command: "ui-dialog", id: "achievements", title: "结局与成就", detail: "收集图鉴", icon: "achievements" },
  { command: "ui-dialog", id: "language", title: "显示语言", detail: "语言偏好", icon: "language" },
];

export const START_SCENE_IMAGES = {
  light: "/optimized/assets/start/start-scene-light-2400.39db5b366316.webp",
  dark: "/optimized/assets/start/start-scene-dark-2400.aa47929096cf.webp",
};

export const START_SCENE_MOBILE_IMAGES = {
  light: "/optimized/assets/start/start-scene-mobile-1200-light.80b08948ffea.webp",
  dark: "/optimized/assets/start/start-scene-mobile-1200-dark.b39642d466bd.webp",
};

export const START_ACHIEVEMENT_ICONS = finalUiIconItems([
  { title: "成长成就", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/03-achievements/003_设计思考__UIATLAS_012_003_pxui_achievement_core_003_草图灯.99bbf4e30978.webp" },
  { title: "评图记录", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/03-achievements/013_第一次评图__UIATLAS_012_013_pxui_achievement_core_013_评图展.fa587fc9064c.webp" },
  { title: "路线收集", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/03-achievements/107_分岔成册__UIATLAS_014_007_pxui_achievement_core_107_分岔图.88646b33dc80.webp" },
  { title: "生活细节", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/03-achievements/056_五城游__UIATLAS_013_006_pxui_achievement_core_056_五城地.b5f792508fc2.webp" },
  { title: "大学毕业", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/03-achievements/007_大学毕业之后__UIATLAS_012_007_pxui_achievement_core_007_书.f7ab0d2cbead.webp" },
  { title: "细节成册", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/03-achievements/109_细节成册__UIATLAS_014_009_pxui_achievement_core_109_厚成就.d45fa83aa647.webp" },
  { title: "人生无限", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/03-achievements/108_人生无限__UIATLAS_014_008_pxui_achievement_core_108_全结局.d681de1e7427.webp" },
  { title: "顶尖水准", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/03-achievements/031_顶尖水准__UIATLAS_012_031_pxui_achievement_core_031_顶尖作.89d2195f00d3.webp" },
  { title: "完美封神", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/03-achievements/032_完美封神__UIATLAS_012_032_pxui_achievement_core_032_皇冠作.343d683f978e.webp" },
  { title: "第一桶金", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/03-achievements/074_第一桶金__UIATLAS_013_024_pxui_achievement_core_074_金币.9be61846b5f3.webp" },
  { title: "毕业结局", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/033_稳定毕业——平平淡淡才是真！__UIATLAS_015_033_pxui_ending_033_毕业证.e2aa42d2e3cf.webp" },
  { title: "创业结局", icon: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/031_没有退路的选择__UIATLAS_015_031_pxui_ending_031_火箭.88d1505c54d5.webp" },
]);

export const SUPPORT_ENDING_IMAGE = "/optimized/assets/ending-illustrations/没有退路的选择.5119d4a4a10a.webp";

export const UI_ICON_PATHS = finalUiIconMap({
  start_new: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/001_UIATLAS_003_001_pxui_system_001_草地__UIATLAS_003_001_pxui_system_001_草地.9640e714396a.webp",
  load_save: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/005_UIATLAS_003_010_pxui_system_010_存档__UIATLAS_003_010_pxui_system_010_存档.0c5d17544cba.webp",
  loading_clock: LOADING_CLOCK_ICON,
  clock: START_CLOCK_ICON,
  game_clock: GAME_CLOCK_ICON,
  folder: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/005_UIATLAS_003_010_pxui_system_010_存档__UIATLAS_003_010_pxui_system_010_存档.0c5d17544cba.webp",
  continue_arrow: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/002_UIATLAS_001_003_pxui_base_003_箭头__UIATLAS_001_003_pxui_base_003_箭头.1c2cab1d3e6a.webp",
  back: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/003_UIATLAS_001_009_pxui_base_009_左箭__UIATLAS_001_009_pxui_base_009_左箭.7abf583527bb.webp",
  close: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/004_UIATLAS_001_018_pxui_base_018_叉__UIATLAS_001_018_pxui_base_018_叉.13fea09b2f2c.webp",
  success_check: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/092_UIATLAS_001_019_pxui_base_019_勾__UIATLAS_001_019_pxui_base_019_勾.dae7dfddff60.webp",
  failure_cross: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/093_UIATLAS_001_020_pxui_base_020_叉__UIATLAS_001_020_pxui_base_020_叉.13fea09b2f2c.webp",
  report_success_check: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_002_状态数值与反馈/UIATLAS_002_033_pxui_stat_033_勾.5798e0e5a308.webp",
  report_failure_cross: UNMAPPED_BASE_020_CROSS_ICON,
  report_strategy_board: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_022_事件弹窗与徽章状态/UIATLAS_022_006_pxui_event_badge_006_展板.f483fae400e9.webp",
  mentor_success_check: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_002_状态数值与反馈/UIATLAS_002_023_pxui_stat_023_勾.613752816fca.webp",
  mentor_failure_warning: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_001_基础操作按钮/UIATLAS_001_047_pxui_base_047_警示.9e38578943e0.webp",
  review_low_grade: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_002_状态数值与反馈/UIATLAS_002_022_pxui_stat_022_图纸.96789f60ac3a.webp",
  review_high_grade: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_022_事件弹窗与徽章状态/UIATLAS_022_010_pxui_event_badge_010_奖章.66019d58f0b4.webp",
  save: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/005_UIATLAS_003_010_pxui_system_010_存档__UIATLAS_003_010_pxui_system_010_存档.0c5d17544cba.webp",
  share_to_moments: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_001_基础操作按钮/UIATLAS_001_025_pxui_base_025_手接信.f0af591ded0d.webp",
  gear: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/006_UIATLAS_003_011_pxui_system_011_齿轮__UIATLAS_003_011_pxui_system_011_齿轮.b7aa1af202c9.webp",
  theme: THEME_LIGHT_ICON,
  theme_light: THEME_LIGHT_ICON,
  theme_dark: THEME_DARK_ICON,
  note: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/009_UIATLAS_003_028_pxui_system_028_展板__UIATLAS_003_028_pxui_system_028_展板.15688b3158a3.webp",
  paper: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/010_UIATLAS_003_027_pxui_system_027_日记本__UIATLAS_003_027_pxui_system_027_日记本.241c02c96c7d.webp",
  guide: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/011_UIATLAS_003_008_pxui_system_008_书__UIATLAS_003_008_pxui_system_008_书.2985f47dbbfc.webp",
  avatar: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_003_系统入口图标/UIATLAS_003_003_pxui_system_003_头像.d4717d8e3616.webp",
  university: "/optimized/asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/008_建筑老八校 _ 其他 985__UIATLAS_011_008_pxui_route_008_名校校.a6d5e1191507.webp",
  blueprint: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/012_UIATLAS_003_013_pxui_system_013_图纸__UIATLAS_003_013_pxui_system_013_图纸.c0310166cbec.webp",
  leaderboard: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/013_UIATLAS_003_009_pxui_system_009_领奖台__UIATLAS_003_009_pxui_system_009_领奖台.254920290b1d.webp",
  trophy: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/014_UIATLAS_003_007_pxui_system_007_奖杯__UIATLAS_003_007_pxui_system_007_奖杯.98f0835108e5.webp",
  medal: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/015_UIATLAS_003_032_pxui_system_032_毕业穗__UIATLAS_003_032_pxui_system_032_毕业穗.09f0682b0bb3.webp",
  lamp: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/009_UIATLAS_003_028_pxui_system_028_展板__UIATLAS_003_028_pxui_system_028_展板.15688b3158a3.webp",
  cube: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/012_UIATLAS_003_013_pxui_system_013_图纸__UIATLAS_003_013_pxui_system_013_图纸.c0310166cbec.webp",
  crown: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/016_UIATLAS_003_031_pxui_system_031_毕业帽__UIATLAS_003_031_pxui_system_031_毕业帽.bd3bc92ac51b.webp",
  book: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/011_UIATLAS_003_008_pxui_system_008_书__UIATLAS_003_008_pxui_system_008_书.2985f47dbbfc.webp",
  ruler: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/017_UIATLAS_003_030_pxui_system_030_本子钢__UIATLAS_003_030_pxui_system_030_本子钢.f5d04459a49b.webp",
  system: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/018_UIATLAS_003_042_pxui_system_043_齿轮__UIATLAS_003_042_pxui_system_043_齿轮.8ffcdd313db2.webp",
  event: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/019_UIATLAS_003_039_pxui_system_040_事件记__UIATLAS_003_039_pxui_system_040_事件记.4825bee880fe.webp",
  think: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/020_UIATLAS_003_040_pxui_system_041_思想者__UIATLAS_003_040_pxui_system_041_思想者.ffd0fef6d25a.webp",
  school: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/021_UIATLAS_003_041_pxui_system_042_建筑学__UIATLAS_003_041_pxui_system_042_建筑学.f8c099653ac1.webp",
  achievements: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/014_UIATLAS_003_007_pxui_system_007_奖杯__UIATLAS_003_007_pxui_system_007_奖杯.98f0835108e5.webp",
  "new-game": "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/022_UIATLAS_003_022_pxui_system_022_箭头__UIATLAS_003_022_pxui_system_022_箭头.65f1b5c6bd4d.webp",
  author: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_002_状态数值与反馈/UIATLAS_002_012_pxui_stat_012_试卷铅.f37fdd7a5a63.webp",
  coffee: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/023_UIATLAS_003_021_pxui_system_021_咖啡__UIATLAS_003_021_pxui_system_021_咖啡.5e95a6135065.webp",
  community: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/024_UIATLAS_003_020_pxui_system_020_建筑学__UIATLAS_003_020_pxui_system_020_建筑学.d48b2fe2a796.webp",
  language: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/025_UIATLAS_003_025_pxui_system_025_地球__UIATLAS_003_025_pxui_system_025_地球.78c584906114.webp",
  mail: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_022_事件弹窗与徽章状态/UIATLAS_022_008_pxui_event_badge_008_邮箱.45fa77f5279b.webp",
  competition_submission_reminder: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_022_事件弹窗与徽章状态/UIATLAS_022_014_pxui_event_badge_014_邮箱.d234bf68a975.webp",
  year_2_prompt: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_001_基础操作按钮/UIATLAS_001_004_pxui_base_004_草地.6f24d846ddd3.webp",
  year_3_prompt: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_001_基础操作按钮/UIATLAS_001_045_pxui_base_045_救生圈.a6c6a52c2eab.webp",
  year_4_prompt: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_003_系统入口图标/UIATLAS_003_018_pxui_system_018_指路牌.ba22d541ae38.webp",
  year_5_prompt: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_022_事件弹窗与徽章状态/UIATLAS_022_007_pxui_event_badge_007_合同.20586bdc0699.webp",
  internship_open: "/optimized/asset-work/ui-icon-final/confirmed-icons/36-route-internship/027_实习申请__UIATLAS_011_027_pxui_route_027_邮箱.de81afdefd3b.webp",
  internship_apply: "/optimized/asset-work/ui-icon-final/confirmed-icons/36-route-internship/027_实习申请__UIATLAS_011_027_pxui_route_027_邮箱.de81afdefd3b.webp",
  internship_result_rejected: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/093_UIATLAS_001_020_pxui_base_020_叉__UIATLAS_001_020_pxui_base_020_叉.13fea09b2f2c.webp",
  internship_result_ordinary: "/optimized/asset-work/ui-icon-final/confirmed-icons/10-internship-short-events/007_名企实习 1：忙忙碌碌__UIATLAS_011_024_pxui_route_024_普通工.a96d24685336.webp",
  internship_result_strong: "/optimized/asset-work/ui-icon-final/confirmed-icons/36-route-internship/025_强所实习__UIATLAS_011_025_pxui_route_025_模型.46ebf4c95b9d.webp",
  internship_result_named_firm: "/optimized/asset-work/ui-icon-final/confirmed-icons/36-route-internship/026_名企实习__UIATLAS_011_026_pxui_route_026_金色工.2410efa8bfac.webp",
  course_result: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_002_状态数值与反馈/UIATLAS_002_029_pxui_stat_029_勾.0369f5b7818d.webp",
  course_question: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_002_状态数值与反馈/UIATLAS_002_030_pxui_stat_030_空清单.1d044745ca25.webp",
  course_exam_intro: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_002_状态数值与反馈/UIATLAS_002_012_pxui_stat_012_试卷铅.f37fdd7a5a63.webp",
  ielts: "/optimized/asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/006_雅思__UIATLAS_011_006_pxui_route_006_英文试.68bea11e6e08.webp",
  postgrad_written_exam: "/optimized/asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/004_升学专业题__UIATLAS_011_004_pxui_route_004_建筑题.8d4b52f599c7.webp",
  route_waiting_result: "/optimized/asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/002_等待结果__UIATLAS_011_002_pxui_route_002_信封沙.15de7afc502b.webp",
  graduation_design_reminder: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_003_系统入口图标/UIATLAS_003_026_pxui_system_026_辅助圆.331db21786b7.webp",
  graduation_design: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_002_状态数值与反馈/UIATLAS_002_008_pxui_stat_008_图纸.b33c0c8f83ac.webp",
  route_commit: "/optimized/asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/001_正式参与__UIATLAS_011_001_pxui_route_001_报名表.cced8856a577.webp",
  route_civil_exam: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/055_UIATLAS_011_005_pxui_route_005_答题卡__UIATLAS_011_005_pxui_route_005_答题卡.5446477a80c8.webp",
  route_contract: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_022_事件弹窗与徽章状态/UIATLAS_022_015_pxui_event_badge_015_红黑契.f07081958e8f.webp",
  portfolio_entry: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_022_事件弹窗与徽章状态/UIATLAS_022_013_pxui_event_badge_013_文件.4d2162585be5.webp",
  summer_result: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_002_状态数值与反馈/UIATLAS_002_015_pxui_stat_015_星光.2d6e324d691d.webp",
  log_calendar: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_003_系统入口图标/UIATLAS_003_005_pxui_system_005_周历格.96181a73ef58.webp",
  resume_submit_confirm: "/optimized/asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/003_简历投递确认__UIATLAS_011_003_pxui_route_003_简历纸.42d3dedd03d1.webp",
  energy_risk: "/optimized/asset-work/ui-icon-final/confirmed-icons/13-risk-states/002_精力高危：精力 _ 30__UIATLAS_002_020_pxui_stat_020_电池.254e0dd18708.webp",
  pressure_risk: "/optimized/asset-work/ui-icon-final/confirmed-icons/13-risk-states/005_压力高危：压力 _ 80__UIATLAS_002_021_pxui_stat_021_爆表压.dbaf41b800c0.webp",
  risk_alert: "/optimized/asset-work/ui-icon-final/confirmed-icons/13-risk-states/006_首次高危弹窗__UIATLAS_022_009_pxui_event_badge_009_红色警.5f0544b01135.webp",
  risk_lock: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_001_基础操作按钮/UIATLAS_001_039_pxui_base_039_锁.fec1e6ce09e2.webp",
  software_cad: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/026_UIATLAS_003_036_pxui_system_037_纯蓝色__UIATLAS_003_036_pxui_system_037_纯蓝色.6dc6037b2ff6.webp",
  software_su: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/027_UIATLAS_003_037_pxui_system_038_纯蓝色__UIATLAS_003_037_pxui_system_038_纯蓝色.544df5c1c16d.webp",
  software_ps: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/028_UIATLAS_003_038_pxui_system_039_纯蓝色__UIATLAS_003_038_pxui_system_039_纯蓝色.6a19d76f03e3.webp",
  shop: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/029_UIATLAS_003_006_pxui_system_006_超市手__UIATLAS_003_006_pxui_system_006_超市手.4f62677debf7.webp",
  competition: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_022_事件弹窗与徽章状态/UIATLAS_022_008_pxui_event_badge_008_邮箱.45fa77f5279b.webp",
  postgrad_exam: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/016_UIATLAS_003_031_pxui_system_031_毕业帽__UIATLAS_003_031_pxui_system_031_毕业帽.bd3bc92ac51b.webp",
  recommendation: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/015_UIATLAS_003_032_pxui_system_032_毕业穗__UIATLAS_003_032_pxui_system_032_毕业穗.09f0682b0bb3.webp",
  public_service: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/030_UIATLAS_003_033_pxui_system_033_红旗公__UIATLAS_003_033_pxui_system_033_红旗公.c61920d89853.webp",
  overseas_study: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/031_UIATLAS_003_034_pxui_system_034_护照飞__UIATLAS_003_034_pxui_system_034_护照飞.2b0580f7353a.webp",
  internship_work: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/032_UIATLAS_003_014_pxui_system_014_工牌__UIATLAS_003_014_pxui_system_014_工牌.15694e31f36d.webp",
  portfolio_resume: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/033_UIATLAS_003_012_pxui_system_012_作品册__UIATLAS_003_012_pxui_system_012_作品册.b0e5b6b7427d.webp",
  resume: "/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_003_系统入口图标/UIATLAS_003_029_pxui_system_029_简历纸.4412c1e30092.webp",
  wanli_road: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/034_UIATLAS_003_015_pxui_system_015_地图远__UIATLAS_003_015_pxui_system_015_地图远.678b664076d9.webp",
  wanli_light: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/001_光之教堂__UIATLAS_016_001_pxui_wanli_001_光十字.847a53334741.webp",
  wanli_church: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/002_朗香教堂__UIATLAS_016_002_pxui_wanli_002_弯顶白.3340323a90d2.webp",
  wanli_villa: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/003_萨伏伊别墅__UIATLAS_016_003_pxui_wanli_003_白色现.32d2104b50b6.webp",
  wanli_glass: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/004_范斯沃斯住宅__UIATLAS_016_004_pxui_wanli_004_玻璃小.eac1b59b90e6.webp",
  wanli_school: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/005_包豪斯校舍__UIATLAS_016_005_pxui_wanli_005_包豪斯.cc829fdd14f3.webp",
  wanli_water: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/006_萨尔克生物研究所__UIATLAS_016_006_pxui_wanli_006_海边研.528332ae71d0.webp",
  wanli_museum: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/007_金贝尔美术馆__UIATLAS_016_007_pxui_wanli_007_拱顶美.9e1fe0e0ac38.webp",
  wanli_suzhou: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/008_苏州博物馆__UIATLAS_016_008_pxui_wanli_008_白墙灰.929bafb9eb24.webp",
  wanli_tower: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/009_香港中银大厦__UIATLAS_016_009_pxui_wanli_009_三角高.36227ca9c93d.webp",
  wanli_opera: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/010_流水别墅__UIATLAS_016_010_pxui_wanli_010_双石块.7a6b480542ba.webp",
  wanli_house: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/011_东京代官山茑屋书店__UIATLAS_016_011_pxui_wanli_011_瀑布别.9325fbc175b7.webp",
  wanli_gsd: "/optimized/asset-work/ui-icon-final/confirmed-icons/09-wanli-road-events/012_柏林犹太博物馆__UIATLAS_016_012_pxui_wanli_012_阶梯学.2a73e6a8485c.webp",
  career_change: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/035_UIATLAS_003_035_pxui_system_035_岔路牌__UIATLAS_003_035_pxui_system_035_岔路牌.08da73c8f9ea.webp",
});

export const ACTION_ICONS = finalUiIconMap({
  learn_ai_software: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/036_UIATLAS_004_001_pxui_action_001_电脑__UIATLAS_004_001_pxui_action_001_电脑.1f88af27a234.webp",
  read_exhibition: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/037_UIATLAS_004_002_pxui_action_002_书__UIATLAS_004_002_pxui_action_002_书.0506d8f7c8b8.webp",
  design_iteration: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/038_UIATLAS_004_003_pxui_action_003_图纸__UIATLAS_004_003_pxui_action_003_图纸.a97552ad8a29.webp",
  site_research: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/039_UIATLAS_004_004_pxui_action_004_地图__UIATLAS_004_004_pxui_action_004_地图.18df50db40ea.webp",
  normal_drawing: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/040_UIATLAS_004_005_pxui_action_005_图板丁__UIATLAS_004_005_pxui_action_005_图板丁.c7911cf69727.webp",
  crunch_drawing: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/041_UIATLAS_004_006_pxui_action_006_夜灯__UIATLAS_004_006_pxui_action_006_夜灯.4f5e0f60df52.webp",
  exercise: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/042_UIATLAS_004_007_pxui_action_007_哑铃__UIATLAS_004_007_pxui_action_007_哑铃.b3626d1cbdd9.webp",
  socialize: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/043_UIATLAS_004_008_pxui_action_008_饭碗饮__UIATLAS_004_008_pxui_action_008_饭碗饮.ffca5d9845f2.webp",
  rest: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/044_UIATLAS_004_009_pxui_action_009_床__UIATLAS_004_009_pxui_action_009_床.8dbce67454a1.webp",
  outsourcing: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/045_UIATLAS_004_010_pxui_action_010_合同__UIATLAS_004_010_pxui_action_010_合同.2430d1a774e0.webp",
  part_time: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/046_UIATLAS_004_011_pxui_action_011_工牌零__UIATLAS_004_011_pxui_action_011_工牌零.5b6f99b13685.webp",
  special_skill: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/047_UIATLAS_004_012_pxui_action_012_发光技__UIATLAS_004_012_pxui_action_012_发光技.10aaeb0fa5d5.webp",
});

export const PROJECT_ICONS = finalUiIconMap({
  marker_rendering: "/optimized/asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/013_钢笔、马克笔代画__UIATLAS_004_013_pxui_action_013_钢笔.d088f522cd9e.webp",
  cad_trace: "/optimized/asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/014_描CAD底图__UIATLAS_004_014_pxui_action_014_制图软.d8c1efbf2edf.webp",
  manual_model: "/optimized/asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/015_手工模型代做__UIATLAS_004_015_pxui_action_015_模型.2f8ad2bd568e.webp",
  simple_su_mass: "/optimized/asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/016_SU拉体块【简单】__UIATLAS_004_016_pxui_action_016_体块建.5b4dc3ae367b.webp",
  rendering: "/optimized/asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/017_效果图渲染__UIATLAS_004_017_pxui_action_017_太阳.e4291b948760.webp",
  rhino_surface: "/optimized/asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/018_Rhino曲面建模【精细】__UIATLAS_004_018_pxui_action_018_曲面网.defee4d99c9b.webp",
  full_scheme: "/optimized/asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/019_一条龙方案代工__UIATLAS_004_019_pxui_action_019_图纸.425396364be4.webp",
  leaflets: "/optimized/asset-work/ui-icon-final/confirmed-icons/22-part-time-project-options/020_发传单__UIATLAS_004_020_pxui_action_020_箭头.836c5f767d33.webp",
  library_assistant: "/optimized/asset-work/ui-icon-final/confirmed-icons/22-part-time-project-options/021_图书馆管理员__UIATLAS_004_021_pxui_action_021_书.b85852848cf0.webp",
  delivery: "/optimized/asset-work/ui-icon-final/confirmed-icons/22-part-time-project-options/022_外卖小哥__UIATLAS_004_022_pxui_action_022_外卖箱.764fe373de62.webp",
  tutor: "/optimized/asset-work/ui-icon-final/confirmed-icons/22-part-time-project-options/023_家教__UIATLAS_004_023_pxui_action_023_黑板.7cd7cb742164.webp",
});

export function projectIconPath(projectId, projectType = "") {
  return PROJECT_ICONS[projectId] ?? ACTION_ICONS[projectType] ?? UI_ICON_PATHS.blueprint;
}

export const MODEL_MATERIAL_ICONS = finalUiIconMap({
  hand_cut: "/optimized/asset-work/ui-icon-final/confirmed-icons/24-model-week-materials/028_手工切割__UIATLAS_004_028_pxui_action_028_美工刀.33780714be74.webp",
  laser_cut: "/optimized/asset-work/ui-icon-final/confirmed-icons/24-model-week-materials/029_激光切割__UIATLAS_004_029_pxui_action_029_激光头.98d81d937481.webp",
  print_3d: "/optimized/asset-work/ui-icon-final/confirmed-icons/24-model-week-materials/030_3D打印__UIATLAS_004_030_pxui_action_030_模型.201f2d32b176.webp",
});

export function modelMaterialIconPath(materialId) {
  return MODEL_MATERIAL_ICONS[materialId] ?? ACTION_ICONS.normal_drawing;
}

export const REPORT_STRATEGY_ICONS = finalUiIconMap({
  master_talk: "/optimized/asset-work/ui-icon-final/confirmed-icons/23-review-report-strategies/024_我就是大师__UIATLAS_004_024_pxui_action_024_聚光灯.2fc3c7c5d67c.webp",
  tech_flow: "/optimized/asset-work/ui-icon-final/confirmed-icons/23-review-report-strategies/025_高级技术流__UIATLAS_004_025_pxui_action_025_参数节.24dd67c04b9a.webp",
  beg_pass: "/optimized/asset-work/ui-icon-final/confirmed-icons/23-review-report-strategies/026_求求你别挂我__UIATLAS_004_026_pxui_action_026_双手合.2f66c1d6dbd3.webp",
  read_ppt: "/optimized/asset-work/ui-icon-final/confirmed-icons/23-review-report-strategies/027_直接念 PPT__UIATLAS_004_027_pxui_action_027_箭头.0641eb632de8.webp",
});

export function reportStrategyIconPath(strategyId) {
  return REPORT_STRATEGY_ICONS[strategyId] ?? UI_ICON_PATHS.blueprint;
}

export const COMPETITION_EVENT_ICONS = finalUiIconMap({
  campus_corner: "/optimized/asset-work/ui-icon-final/confirmed-icons/29-competition-events/001_校园角落更新__UIATLAS_010_001_pxui_competition_001_图纸.f5b03043e4c3.webp",
  old_street_micro: "/optimized/asset-work/ui-icon-final/confirmed-icons/29-competition-events/002_老街区微更新__UIATLAS_010_002_pxui_competition_002_模型.e2eb906c5ae1.webp",
  green_building: "/optimized/asset-work/ui-icon-final/confirmed-icons/29-competition-events/003_绿色建筑概念__UIATLAS_010_003_pxui_competition_003_绿色建.893efee0ab1f.webp",
  public_space: "/optimized/asset-work/ui-icon-final/confirmed-icons/29-competition-events/004_公共空间提案__UIATLAS_010_004_pxui_competition_004_青年建.5e618382a701.webp",
});

export function competitionEventIconPath(competitionId) {
  return COMPETITION_EVENT_ICONS[competitionId] ?? UI_ICON_PATHS.competition;
}

export const COMPETITION_AWARD_ICONS = finalUiIconMap({
  none: UNMAPPED_BASE_020_CROSS_ICON,
  third: "/optimized/asset-work/ui-icon-final/confirmed-icons/31-competition-award-states/009_三等奖__UIATLAS_010_009_pxui_competition_009_奖杯.3e234c522f32.webp",
  second: "/optimized/asset-work/ui-icon-final/confirmed-icons/31-competition-award-states/008_二等奖__UIATLAS_010_008_pxui_competition_008_奖杯.bb64dd2971d6.webp",
  first: "/optimized/asset-work/ui-icon-final/confirmed-icons/31-competition-award-states/007_一等奖__UIATLAS_010_007_pxui_competition_007_奖杯.1c3bcd147592.webp",
});

export function competitionAwardIconPath(award) {
  return COMPETITION_AWARD_ICONS[award] ?? COMPETITION_AWARD_ICONS.none;
}

export const COURSE_ICONS = finalUiIconMap({
  architecture_history: "/optimized/asset-work/ui-icon-final/confirmed-icons/28-course-icons/001_建筑史论__UIATLAS_007_001_pxui_role_026_书.e71521285579.webp",
  building_construction: "/optimized/asset-work/ui-icon-final/confirmed-icons/28-course-icons/002_建筑构造__UIATLAS_007_002_pxui_role_027_墙身剖.ffb66f7ceae2.webp",
  digital_planning: "/optimized/asset-work/ui-icon-final/confirmed-icons/28-course-icons/003_数字规划__UIATLAS_007_003_pxui_role_028_网格地.4a4fbb662c46.webp",
  cad: "/optimized/asset-work/ui-icon-final/confirmed-icons/28-course-icons/004_计算机辅助设计__UIATLAS_007_004_pxui_role_029_制图软.1a3fc382689b.webp",
  mechanics: "/optimized/asset-work/ui-icon-final/confirmed-icons/28-course-icons/005_建筑力学__UIATLAS_007_005_pxui_role_030_箭头.a26852ca8c02.webp",
  representation: "/optimized/asset-work/ui-icon-final/confirmed-icons/28-course-icons/006_建筑表现基础__UIATLAS_007_006_pxui_role_031_画笔.b8040da1b2b8.webp",
  drafting: "/optimized/asset-work/ui-icon-final/confirmed-icons/28-course-icons/007_建筑制图__UIATLAS_007_007_pxui_role_032_丁字尺.e3b338362a23.webp",
  presentation: "/optimized/asset-work/ui-icon-final/confirmed-icons/28-course-icons/008_表达与汇报__UIATLAS_007_008_pxui_role_033_麦克风.7784cd0e28d3.webp",
  aesthetics: "/optimized/asset-work/ui-icon-final/confirmed-icons/28-course-icons/009_建筑美学__UIATLAS_007_009_pxui_role_034_构图框.af0128a20265.webp",
  garden_history: "/optimized/asset-work/ui-icon-final/confirmed-icons/28-course-icons/010_园林史论__UIATLAS_007_010_pxui_role_035_园林窗.247079900ca5.webp",
});

export function courseIconPath(courseId) {
  return COURSE_ICONS[courseId] ?? UI_ICON_PATHS.book;
}

export const CHARACTER_AVATAR_ICONS = finalUiIconMap({
  ordinary_person: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/001_普通人__UIATLAS_005_001_pxui_role_001_图纸.b1a07af5357c.webp",
  mixed_in: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/002_混的入__UIATLAS_005_002_pxui_role_002_头像.06d532bcdf7b.webp",
  pressure_immune: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/003_不吃压力之人__UIATLAS_005_003_pxui_role_003_图纸.4107ce266ebb.webp",
  design_enabler: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/004_设计赋能哥__UIATLAS_005_004_pxui_role_004_头像.ae5be1a2e260.webp",
  poor_scholar: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/005_寒门贵子__UIATLAS_005_005_pxui_role_005_书.6c83c8dd713d.webp",
  full_pressure: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/006_吃满压力之人__UIATLAS_005_006_pxui_role_006_头像.a50fc092491d.webp",
  future_boss: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/007_未来的老板__UIATLAS_005_007_pxui_role_007_头像.55523a8aff40.webp",
  born_lucky: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/008_投胎专家__UIATLAS_005_008_pxui_role_008_头像.f4b959ae49a7.webp",
  gene_rebel: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/009_基因叛逆者__UIATLAS_005_009_pxui_role_009_头像.e6e5208ffc4c.webp",
  town_exam_ace: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/010_小镇做题家__UIATLAS_005_010_pxui_role_010_头像.99921e4ce62e.webp",
  corbusier_heir: "/optimized/asset-work/ui-icon-final/confirmed-icons/25-character-avatars/011_柯布西耶继承者__UIATLAS_005_011_pxui_role_011_头像.7ea8b2f383ce.webp",
});

export const MENTOR_AVATAR_ICONS = finalUiIconMap({
  mentor_wang: "/optimized/asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/012_王老师_景观实践大师__UIATLAS_005_012_pxui_role_012_头像.c3e548dcd4d1.webp",
  mentor_ge: "/optimized/asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/013_戈老师_高级学院派__UIATLAS_005_013_pxui_role_013_书.e33c3a384f07.webp",
  mentor_lin: "/optimized/asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/014_林老师_高压审美者__UIATLAS_005_014_pxui_role_014_头像.2efce23abb42.webp",
  mentor_chen: "/optimized/asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/015_陈老师_理想主义者__UIATLAS_005_015_pxui_role_015_头像.f2ec2024e092.webp",
  mentor_zhou: "/optimized/asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/016_周老师_软件技术大神__UIATLAS_005_016_pxui_role_016_头像.b56cffe9081e.webp",
  mentor_xu: "/optimized/asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/017_许老师_佛系放养家__UIATLAS_005_017_pxui_role_017_头像.21654da60f63.webp",
  mentor_han: "/optimized/asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/018_韩老师_竞赛压力怪__UIATLAS_005_018_pxui_role_018_奖杯.4a1ef8312f02.webp",
});

export const MENTOR_STAGE_TASK_ICONS = finalUiIconMap({
  mentor_wang: "/optimized/asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/001_走向实践__UIATLAS_006_001_pxui_role_019_合同.ba2eb56ce867.webp",
  mentor_ge: "/optimized/asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/002_理论支撑__UIATLAS_006_002_pxui_role_020_书.3370085a8a3e.webp",
  mentor_lin: "/optimized/asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/003_磨到能看__UIATLAS_006_003_pxui_role_021_图纸.79bcf66356e6.webp",
  mentor_chen: "/optimized/asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/004_以人为本__UIATLAS_006_004_pxui_role_022_人形尺.a3c4497bc516.webp",
  mentor_zhou: "/optimized/asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/005_技术爆炸__UIATLAS_006_005_pxui_role_023_齿轮.63ed6e08ac10.webp",
  mentor_xu: "/optimized/asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/006_稳住节奏__UIATLAS_006_006_pxui_role_024_节拍器.3b59943b681e.webp",
  mentor_han: "/optimized/asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/007_竞赛狂魔__UIATLAS_006_007_pxui_role_025_奖杯.692e7682c073.webp",
});

export const CHARACTER_SKILL_ICONS = finalUiIconMap({
  ordinary_person: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/048_UIATLAS_002_038_pxui_stat_038_平静笑__UIATLAS_002_038_pxui_stat_038_平静笑.00d4d3956c38.webp",
  mixed_in: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/049_UIATLAS_017_044_pxui_random_normal_044_游戏手__UIATLAS_017_044_pxui_random_normal_044_游戏手.e2098c5aa576.webp",
  pressure_immune: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/044_UIATLAS_004_009_pxui_action_009_床__UIATLAS_004_009_pxui_action_009_床.8dbce67454a1.webp",
  design_enabler: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/050_UIATLAS_012_003_pxui_achievement_core_003_草图灯__UIATLAS_012_003_pxui_achievement_core_003_草图灯.99bbf4e30978.webp",
  poor_scholar: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/051_UIATLAS_012_010_pxui_achievement_core_010_王冠夜__UIATLAS_012_010_pxui_achievement_core_010_王冠夜.d51755818a15.webp",
  full_pressure: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/052_UIATLAS_002_018_pxui_stat_018_盾牌压__UIATLAS_002_018_pxui_stat_018_盾牌压.8e73863e8c56.webp",
  future_boss: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/053_UIATLAS_002_004_pxui_stat_004_钱袋__UIATLAS_002_004_pxui_stat_004_钱袋.c7da0a487937.webp",
  born_lucky: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/053_UIATLAS_002_004_pxui_stat_004_钱袋__UIATLAS_002_004_pxui_stat_004_钱袋.c7da0a487937.webp",
  gene_rebel: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/054_UIATLAS_019_008_pxui_random_normal_108_学弟取__UIATLAS_019_008_pxui_random_normal_108_学弟取.da5e188ab049.webp",
  town_exam_ace: "/optimized/asset-work/ui-icon-final/confirmed-icons/11-character-skills/010_小镇做题家：回到高中__UIATLAS_011_005_pxui_route_005_答题卡.5446477a80c8.webp",
  corbusier_heir: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/054_UIATLAS_019_008_pxui_random_normal_108_学弟取__UIATLAS_019_008_pxui_random_normal_108_学弟取.da5e188ab049.webp",
});

export const METER_ICONS = finalUiIconMap({
  energy: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/056_UIATLAS_002_001_pxui_stat_001_电池__UIATLAS_002_001_pxui_stat_001_电池.3a82af020e8f.webp",
  energyRisk: UI_ICON_PATHS.energy_risk,
  maxEnergy: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/057_UIATLAS_002_006_pxui_stat_006_电池__UIATLAS_002_006_pxui_stat_006_电池.16d45552a6af.webp",
  pressure: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/058_UIATLAS_002_002_pxui_stat_002_压力表__UIATLAS_002_002_pxui_stat_002_压力表.fd2b71e49d6f.webp",
  pressureRisk: UI_ICON_PATHS.pressure_risk,
  money: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/059_UIATLAS_002_003_pxui_stat_003_金币__UIATLAS_002_003_pxui_stat_003_金币.3baf39255508.webp",
  mental: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/048_UIATLAS_002_038_pxui_stat_038_平静笑__UIATLAS_002_038_pxui_stat_038_平静笑.00d4d3956c38.webp",
  riskAlert: UI_ICON_PATHS.risk_alert,
  riskLock: UI_ICON_PATHS.risk_lock,
  gpa: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/055_UIATLAS_011_005_pxui_route_005_答题卡__UIATLAS_011_005_pxui_route_005_答题卡.5446477a80c8.webp",
  progress: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/060_UIATLAS_002_007_pxui_stat_007_蓝图进__UIATLAS_002_007_pxui_stat_007_蓝图进.327947f5975c.webp",
  quality: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/061_UIATLAS_002_009_pxui_stat_009_奖章__UIATLAS_002_009_pxui_stat_009_奖章.4365c14796d5.webp",
});

export const ATTRIBUTE_ICONS = finalUiIconMap({
  design: "/optimized/asset-work/ui-icon-final/confirmed-icons/12-role-attributes/001_设计水平__UIATLAS_008_001_pxui_role_036_模型.7daf5bfc7b0a.webp",
  software: "/optimized/asset-work/ui-icon-final/confirmed-icons/12-role-attributes/002_软件技术__UIATLAS_008_002_pxui_role_037_芯片.e4477f2aa6b0.webp",
  aesthetic: "/optimized/asset-work/ui-icon-final/confirmed-icons/12-role-attributes/003_创意审美__UIATLAS_008_003_pxui_role_038_调色盘.d0dc11116144.webp",
  presentation: "/optimized/asset-work/ui-icon-final/confirmed-icons/12-role-attributes/004_汇报表达__UIATLAS_008_004_pxui_role_039_麦克风.7e0f84c697b8.webp",
  social: "/optimized/asset-work/ui-icon-final/confirmed-icons/12-role-attributes/005_人际交往__UIATLAS_008_005_pxui_role_040_头像.2e32508cec30.webp",
  resilience: "/optimized/asset-work/ui-icon-final/confirmed-icons/12-role-attributes/006_抗压能力__UIATLAS_008_006_pxui_role_041_盾牌.73a1bc1dd4da.webp",
});

export const DELTA_ICONS = finalUiIconMap({
  energy: METER_ICONS.energy,
  pressure: METER_ICONS.pressure,
  money: METER_ICONS.money,
  progress: METER_ICONS.progress,
  quality: METER_ICONS.quality,
  portfolio: UI_ICON_PATHS.portfolio_resume,
  gpa: METER_ICONS.gpa,
  gpaModifier: METER_ICONS.gpa,
  maxEnergy: METER_ICONS.maxEnergy,
  achievementScore: UI_ICON_PATHS.achievements,
  ...ATTRIBUTE_ICONS,
});

export const ENDING_ROUTE_ICON_PATHS = finalUiIconMap({
  local_postgrad: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/001_留校读研——专教续费成功__UIATLAS_015_001_pxui_ending_001_本校录.206f9f8e4537.webp",
  recommendation_failed: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/002_保研失败__UIATLAS_015_002_pxui_ending_002_落选名.3e625170eeb0.webp",
  elite_recommendation_postgrad: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/003_强校上岸——最强研究生__UIATLAS_015_003_pxui_ending_003_名校校.25548b3f6bc8.webp",
  elite_exam_postgrad: "/optimized/asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/009_梦中情校__UIATLAS_011_009_pxui_route_009_殿堂校.7c093f401a88.webp",
  steady_postgrad: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/004_稳妥上岸——高级研究生__UIATLAS_015_004_pxui_ending_004_研究生.0cd138061a1c.webp",
  postgrad_retry: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/005_再考一年__UIATLAS_015_005_pxui_ending_005_书.9e0151507821.webp",
  overseas_elite: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/006_顶级名校留学__UIATLAS_015_006_pxui_ending_006_护照.79333d8b3029.webp",
  overseas_strong: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/007_海外强校来信__UIATLAS_015_007_pxui_ending_007_海外录.185469e103a5.webp",
  overseas_stable: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/008_稳妥录取__UIATLAS_015_008_pxui_ending_008_护照飞.7c9943c39423.webp",
  overseas_safety: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/009_成功保底__UIATLAS_015_009_pxui_ending_009_保底录.c8334b54043a.webp",
  overseas_failed: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/010_出国申请落空__UIATLAS_015_010_pxui_ending_010_拒信.3e1b04ab734a.webp",
  selected_transfer_home: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/011_选调回乡——最初的起点__UIATLAS_015_011_pxui_ending_011_乡镇路.fb8770ca4227.webp",
  civil_ministry: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/012_国家部委——人民的建筑师__UIATLAS_015_012_pxui_ending_012_国徽感.2fd775e3c7b5.webp",
  civil_province: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/013_省市厅局__UIATLAS_015_013_pxui_ending_013_城市办.cf36df240b47.webp",
  public_teacher: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/014_教师编制——建筑叫兽__UIATLAS_015_014_pxui_ending_014_黑板.e2fcacbb7e53.webp",
  public_institution: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/015_事业单位__UIATLAS_015_015_pxui_ending_015_规划馆.bc392e747569.webp",
  public_admin: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/016_行政岗位__UIATLAS_015_016_pxui_ending_016_文件.e1da0d30d815.webp",
  civil_grassroots: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/017_基础服务——为人民服务__UIATLAS_015_017_pxui_ending_017_基层小.dafecd89657f.webp",
  civil_retry: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/018_继续备考__UIATLAS_015_018_pxui_ending_018_书.ed641197e72b.webp",
  selected_transfer_wait: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/019_回乡待招录__UIATLAS_015_019_pxui_ending_019_行李箱.245fdc9e53e1.webp",
  architecture_master: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/020_大师事务所——时代的先锋__UIATLAS_015_020_pxui_ending_020_大师事.59fb8c6099e8.webp",
  architecture_foreign: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/021_外企事务所——英文可不简单哦__UIATLAS_015_021_pxui_ending_021_英文工.cead7170e646.webp",
  architecture_state: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/022_国企设计院__UIATLAS_015_022_pxui_ending_022_国企设.d31b4ad96125.webp",
  architecture_local: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/023_地方设计院__UIATLAS_015_023_pxui_ending_023_图纸.4f3e42a0e03a.webp",
  architecture_small: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/024_独立小型工作室__UIATLAS_015_024_pxui_ending_024_小工作.9b2daea07949.webp",
  job_pending: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/025_求职待定——回去等通知吧__UIATLAS_015_025_pxui_ending_025_等待邮.647f9d31270b.webp",
  career_ai_pm: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/026_AI 产品经理——加入光荣的进化吧！__UIATLAS_015_026_pxui_ending_026_头像.bef12ddf958f.webp",
  career_game_scene: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/027_游戏场景建模师——有感觉吗__UIATLAS_015_027_pxui_ending_027_游戏场.8e8d2c47507f.webp",
  career_sales: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/028_销售——商业世界欢迎你！__UIATLAS_015_028_pxui_ending_028_商务名.d1ebc3ea5948.webp",
  career_content: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/029_内容编辑——还不错的工作__UIATLAS_015_029_pxui_ending_029_文章页.a619d83c6420.webp",
  career_illustrator: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/030_插画师——理想主义也不错__UIATLAS_015_030_pxui_ending_030_画笔.7a587fd37d5c.webp",
  career_startup: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/031_没有退路的选择__UIATLAS_015_031_pxui_ending_031_火箭.88d1505c54d5.webp",
  career_failed: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/032_转行失败——转行可不是那么容易的！__UIATLAS_015_032_pxui_ending_032_被退回.99436a2609f7.webp",
  stable_graduation: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/033_稳定毕业——平平淡淡才是真！__UIATLAS_015_033_pxui_ending_033_毕业证.e2aa42d2e3cf.webp",
  wounded_graduation: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/034_带伤毕业——看起来有点糟__UIATLAS_015_034_pxui_ending_034_毕业证.f05e92e64bca.webp",
  graduation_failed: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/035_毕业失败——延毕__UIATLAS_015_035_pxui_ending_035_延毕通.e81011631fcb.webp",
  living_cost_break: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/036_你破产了——有感觉吗__UIATLAS_015_036_pxui_ending_036_空钱包.50597978d965.webp",
  forced_suspension: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/037_被迫停学——好好休息，同学__UIATLAS_015_037_pxui_ending_037_红色压.5ce23a2597df.webp",
  pressure_collapse: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/038_压力失控——好好休息，同学__UIATLAS_015_038_pxui_ending_038_低分成.90dc56c0184d.webp",
  two_failed_reviews: "/optimized/asset-work/ui-icon-final/confirmed-icons/04-endings/039_连续挂科被劝退——也许你并不适合__UIATLAS_015_039_pxui_ending_039_电池.3cdb8b1130ef.webp",
});

export const ENDING_ILLUSTRATION_PATHS = {
  local_postgrad: "/optimized/assets/ending-illustrations/留校保研.6f7aa861080c.webp",
  recommendation_failed: "/optimized/assets/ending-illustrations/保研失败.3c2e60fecaf2.webp",
  elite_recommendation_postgrad: "/optimized/assets/ending-illustrations/所有成功考上研究生.6424b93eaca5.webp",
  elite_exam_postgrad: "/optimized/assets/ending-illustrations/所有成功考上研究生.6424b93eaca5.webp",
  steady_postgrad: "/optimized/assets/ending-illustrations/所有成功考上研究生.6424b93eaca5.webp",
  postgrad_retry: "/optimized/assets/ending-illustrations/再考一年（考研）.03e6248c35b3.webp",
  overseas_elite: "/optimized/assets/ending-illustrations/所有成功留学.0e1842173918.webp",
  overseas_strong: "/optimized/assets/ending-illustrations/所有成功留学.0e1842173918.webp",
  overseas_stable: "/optimized/assets/ending-illustrations/所有成功留学.0e1842173918.webp",
  overseas_safety: "/optimized/assets/ending-illustrations/所有成功留学.0e1842173918.webp",
  overseas_failed: "/optimized/assets/ending-illustrations/出国申请落空.4b5f883e6bb3.webp",
  selected_transfer_home: "/optimized/assets/ending-illustrations/选调回乡——最初的起点和基础服务——为人民服务.148dc2d2acd4.webp",
  civil_ministry: "/optimized/assets/ending-illustrations/考公上岸的结局.47be2fef9647.webp",
  civil_province: "/optimized/assets/ending-illustrations/考公上岸的结局.47be2fef9647.webp",
  public_teacher: "/optimized/assets/ending-illustrations/教师编制——建筑叫兽.54a8b17ba5b8.webp",
  public_institution: "/optimized/assets/ending-illustrations/事业单位.de1a28d1ceb0.webp",
  public_admin: "/optimized/assets/ending-illustrations/行政岗位.8e35b0998968.webp",
  civil_grassroots: "/optimized/assets/ending-illustrations/选调回乡——最初的起点和基础服务——为人民服务.148dc2d2acd4.webp",
  civil_retry: "/optimized/assets/ending-illustrations/继续备考的结局.ecf1067fecb6.webp",
  selected_transfer_wait: "/optimized/assets/ending-illustrations/回乡待招录.d5379ce71f62.webp",
  architecture_master: "/optimized/assets/ending-illustrations/外企事务所——英文可不简单哦和大师事务所——时代的先锋.7c09c0ee6a24.webp",
  architecture_foreign: "/optimized/assets/ending-illustrations/外企事务所——英文可不简单哦和大师事务所——时代的先锋.7c09c0ee6a24.webp",
  architecture_state: "/optimized/assets/ending-illustrations/国企设计院、地方设计院.6de971c37cee.webp",
  architecture_local: "/optimized/assets/ending-illustrations/国企设计院、地方设计院.6de971c37cee.webp",
  architecture_small: "/optimized/assets/ending-illustrations/独立小型工作室.4b37d8c75e43.webp",
  job_pending: "/optimized/assets/ending-illustrations/求职待定——回去等通知吧.05ea5496cfc3.webp",
  career_ai_pm: "/optimized/assets/ending-illustrations/AI 产品经理——加入光荣的进化吧！.3cc56cd1bc22.webp",
  career_game_scene: "/optimized/assets/ending-illustrations/游戏场景建模师——有感觉吗.d03bc6ed79a4.webp",
  career_sales: "/optimized/assets/ending-illustrations/销售——商业世界欢迎你！.3d55bded5db3.webp",
  career_content: "/optimized/assets/ending-illustrations/内容编辑——还不错的工作.d6d804e6f763.webp",
  career_illustrator: "/optimized/assets/ending-illustrations/插画师.66d25a8d3e5e.webp",
  career_startup: "/optimized/assets/ending-illustrations/没有退路的选择.5119d4a4a10a.webp",
  career_failed: "/optimized/assets/ending-illustrations/转行失败——转行可不是那么容易的！.e0027bd1cb12.webp",
  stable_graduation: "/optimized/assets/ending-illustrations/稳定毕业——平平淡淡才是真！.2fce7cfc2908.webp",
  wounded_graduation: "/optimized/assets/ending-illustrations/带伤毕业——看起来有点糟.4e2a9f4f649b.webp",
  graduation_failed: "/optimized/assets/ending-illustrations/毕业失败——延毕.047788b0d1f6.webp",
  living_cost_break: "/optimized/assets/ending-illustrations/你破产了——有感觉吗.247e40c5fbd3.webp",
  forced_suspension: "/optimized/assets/ending-illustrations/被迫停学——好好休息，同学.676cb713db83.webp",
  pressure_collapse: "/optimized/assets/ending-illustrations/压力失控——好好休息，同学.3f74dd0738f7.webp",
  two_failed_reviews: "/optimized/assets/ending-illustrations/连续挂科被劝退——也许你并不适合.197e05864f84.webp",
};

export const ROUTE_OPTION_ICONS = finalUiIconMap({
  recommendation_local: "/optimized/asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/007_本校 _ 211__UIATLAS_011_007_pxui_route_007_本校校.a424606da75a.webp",
  recommendation_old_eight: "/optimized/asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/008_建筑老八校 _ 其他 985__UIATLAS_011_008_pxui_route_008_名校校.a6d5e1191507.webp",
  recommendation_dream: "/optimized/asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/009_梦中情校__UIATLAS_011_009_pxui_route_009_殿堂校.7c093f401a88.webp",
  postgrad_normal: "/optimized/asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/010_普通一本院校__UIATLAS_011_010_pxui_route_010_书.adef5d6794a2.webp",
  postgrad_old_eight: "/optimized/asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/011_建筑老八校 _ 其他 985、211__UIATLAS_011_011_pxui_route_011_书.269cd1cac5d0.webp",
  postgrad_dream: "/optimized/asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/012_梦中情校__UIATLAS_011_012_pxui_route_012_书.8e921ba61340.webp",
  overseas_gsd: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/01-overseas-gsd.3e135617b32d.webp",
  overseas_aa: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/02-overseas-aa.c2498148f0d1.webp",
  overseas_eth: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/03-overseas-eth.ef7139bb215d.webp",
  overseas_mit: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/04-overseas-mit.521f9d966071.webp",
  overseas_ucl: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/05-overseas-ucl.f9926c58b0a2.webp",
  overseas_columbia: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/06-overseas-columbia.292b21429e5b.webp",
  overseas_upenn: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/07-overseas-upenn.9b1fb99c62d6.webp",
  overseas_tud: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/08-overseas-tud.c822438b1a51.webp",
  overseas_cornell: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/09-overseas-cornell.2676c70cb239.webp",
  overseas_nus: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/10-overseas-nus.1c2a947cecbe.webp",
  overseas_hku: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/11-overseas-hku.f7aed8fbaefc.webp",
  overseas_sheffield: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/12-overseas-sheffield.686283ee7186.webp",
  overseas_risd: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/13-overseas-risd.ec5f19e2176b.webp",
  overseas_melbourne: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/14-overseas-melbourne.08e86d640850.webp",
  overseas_msa: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/15-overseas-msa.b55853959cdd.webp",
  overseas_polimi: "/optimized/asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/16-overseas-polimi.b5731a4bf604.webp",
  selected_transfer: "/optimized/asset-work/ui-icon-final/confirmed-icons/35-route-public-service/017_生源地选调生__UIATLAS_011_017_pxui_route_017_家乡路.30a035872d1f.webp",
  civil_national: "/optimized/asset-work/ui-icon-final/confirmed-icons/35-route-public-service/018_国家部委层__UIATLAS_011_018_pxui_route_018_国徽感.4364eda7b541.webp",
  civil_province: "/optimized/asset-work/ui-icon-final/confirmed-icons/35-route-public-service/019_省市厅局层__UIATLAS_011_019_pxui_route_019_城市办.770b41d69f60.webp",
  civil_grassroots: "/optimized/asset-work/ui-icon-final/confirmed-icons/35-route-public-service/020_基层公务员__UIATLAS_011_020_pxui_route_020_乡镇街.7865bbfb30bf.webp",
  public_teacher: "/optimized/asset-work/ui-icon-final/confirmed-icons/35-route-public-service/021_教师岗__UIATLAS_011_021_pxui_route_021_讲台.78368c6a600d.webp",
  public_institution: "/optimized/asset-work/ui-icon-final/confirmed-icons/35-route-public-service/022_事业单位综合岗__UIATLAS_011_022_pxui_route_022_规划馆.9e0a5c12fc34.webp",
  public_admin: "/optimized/asset-work/ui-icon-final/confirmed-icons/35-route-public-service/023_行政管理岗__UIATLAS_011_023_pxui_route_023_文件.2e0d048a3152.webp",
  architecture_master: "/optimized/asset-work/ui-icon-final/confirmed-icons/37-route-architecture-jobs/028_大师建筑事务所__UIATLAS_011_028_pxui_route_028_模型.62e07ee6532b.webp",
  architecture_foreign: "/optimized/asset-work/ui-icon-final/confirmed-icons/10-internship-short-events/008_名企实习 2：英文缩写__UIATLAS_011_029_pxui_route_029_英文邮.bdc2f5c26f77.webp",
  architecture_state: "/optimized/asset-work/ui-icon-final/confirmed-icons/10-internship-short-events/001_普通实习 1：第一张施工图__UIATLAS_011_030_pxui_route_030_施工图.53fe1e26d50a.webp",
  architecture_local: "/optimized/asset-work/ui-icon-final/confirmed-icons/37-route-architecture-jobs/031_地方设计院__UIATLAS_011_031_pxui_route_031_地方项.4d80978daee4.webp",
  architecture_small: "/optimized/asset-work/ui-icon-final/confirmed-icons/37-route-architecture-jobs/032_独立小型工作室__UIATLAS_011_032_pxui_route_032_模型.f9873976388c.webp",
  career_ai_pm: "/optimized/asset-work/ui-icon-final/confirmed-icons/38-route-career-change/033_AI产品经理__UIATLAS_011_033_pxui_route_033_产品看.2246847d6812.webp",
  career_game_scene: "/optimized/asset-work/ui-icon-final/confirmed-icons/38-route-career-change/034_游戏场景建模师__UIATLAS_011_034_pxui_route_034_游戏场.e48c252f3048.webp",
  career_sales: "/optimized/asset-work/ui-icon-final/confirmed-icons/38-route-career-change/035_销售_商务__UIATLAS_011_035_pxui_route_035_户型图.f6ccb1da4664.webp",
  career_content: "/optimized/asset-work/ui-icon-final/confirmed-icons/38-route-career-change/036_新媒体内容__UIATLAS_011_036_pxui_route_036_推文编.aa42590f45c9.webp",
  career_illustrator: "/optimized/asset-work/ui-icon-final/confirmed-icons/38-route-career-change/037_插画师__UIATLAS_011_037_pxui_route_037_画笔.14ebdc14c5a3.webp",
  career_startup: "/optimized/asset-work/ui-icon-final/confirmed-icons/38-route-career-change/038_创业__UIATLAS_011_038_pxui_route_038_火苗契.029578847730.webp",
});

export const SHOP_ITEM_ICONS = finalUiIconMap({
  crazy_thursday: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/068_UIATLAS_009_001_pxui_shop_001_炸鸡桶__UIATLAS_009_001_pxui_shop_001_炸鸡桶.41f4476225dc.webp",
  red_bull: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/069_UIATLAS_009_002_pxui_shop_002_能量饮__UIATLAS_009_002_pxui_shop_002_能量饮.7c128719c6c3.webp",
  eye_drops: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/070_UIATLAS_009_003_pxui_shop_003_眼药水__UIATLAS_009_003_pxui_shop_003_眼药水.9aa71ce2c9c7.webp",
  music_membership: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/071_UIATLAS_009_004_pxui_shop_004_唱片__UIATLAS_009_004_pxui_shop_004_唱片.c7aa8ccea8a5.webp",
  neck_massager: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/072_UIATLAS_009_005_pxui_shop_005_肩颈按__UIATLAS_009_005_pxui_shop_005_肩颈按.2281324c04a7.webp",
  starbucks_week_card: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/073_UIATLAS_009_006_pxui_shop_006_咖啡__UIATLAS_009_006_pxui_shop_006_咖啡.748f7605cb41.webp",
  folding_bed: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/074_UIATLAS_009_007_pxui_shop_007_折叠床__UIATLAS_009_007_pxui_shop_007_折叠床.86970d7c6a88.webp",
  counseling_hour: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/075_UIATLAS_009_008_pxui_shop_008_对话气__UIATLAS_009_008_pxui_shop_008_对话气.b02853826852.webp",
  gym_annual_card: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/076_UIATLAS_009_009_pxui_shop_009_健身会__UIATLAS_009_009_pxui_shop_009_健身会.de4db6efb2d2.webp",
  leave_note: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/077_UIATLAS_009_010_pxui_shop_010_请假纸__UIATLAS_009_010_pxui_shop_010_请假纸.fee2e27327d5.webp",
  sketchbook: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/078_UIATLAS_009_011_pxui_shop_011_速写本__UIATLAS_009_011_pxui_shop_011_速写本.849419fd1758.webp",
  marker_pen_set: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/079_UIATLAS_009_012_pxui_shop_012_马克笔__UIATLAS_009_012_pxui_shop_012_马克笔.0968abb92dbe.webp",
  tracing_paper_pack: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/080_UIATLAS_009_013_pxui_shop_013_图纸__UIATLAS_009_013_pxui_shop_013_图纸.46e15f83affb.webp",
  form_space_order: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/081_UIATLAS_009_014_pxui_shop_014_书__UIATLAS_009_014_pxui_shop_014_书.ed37148ee2f0.webp",
  modern_architecture_history: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/082_UIATLAS_009_015_pxui_shop_015_书__UIATLAS_009_015_pxui_shop_015_书.c9c52393d861.webp",
  modeling_plugin_membership: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/083_UIATLAS_009_016_pxui_shop_016_齿轮__UIATLAS_009_016_pxui_shop_016_齿轮.733eaba59c3c.webp",
  art_philosophy: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/084_UIATLAS_009_017_pxui_shop_017_书__UIATLAS_009_017_pxui_shop_017_书.1eeefe20ee95.webp",
  master_portfolio: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/085_UIATLAS_009_018_pxui_shop_018_作品集__UIATLAS_009_018_pxui_shop_018_作品集.b952d554e18d.webp",
  advanced_trace_board: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/086_UIATLAS_009_019_pxui_shop_019_数位板__UIATLAS_009_019_pxui_shop_019_数位板.f6f1b58d5962.webp",
  advanced_model_toolkit: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/087_UIATLAS_009_020_pxui_shop_020_模型__UIATLAS_009_020_pxui_shop_020_模型.27da14701825.webp",
  noise_canceling_headphones: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/088_UIATLAS_009_021_pxui_shop_021_头戴耳__UIATLAS_009_021_pxui_shop_021_头戴耳.50feed93ae29.webp",
  ergonomic_chair: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/089_UIATLAS_009_022_pxui_shop_022_人体工__UIATLAS_009_022_pxui_shop_022_人体工.20d42c993a05.webp",
  ergonomic_mouse: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/090_UIATLAS_009_023_pxui_shop_023_人体工__UIATLAS_009_023_pxui_shop_023_人体工.f0ae6f2a2400.webp",
  alienware_laptop: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/091_UIATLAS_009_024_pxui_shop_024_高性能__UIATLAS_009_024_pxui_shop_024_高性能.8ea164119836.webp",
});

export const SUPPORT_QR_CODES = [
  { id: "wechat", label: "微信支付", src: "/optimized/assets/support/wechat-qr.2bb4ae167272.webp" },
  { id: "alipay", label: "支付宝支付", src: "/optimized/assets/support/alipay-qr.cbb791d31a6d.webp" },
];

export function renderUiIcon(src, alt = "") {
  if (!src) return "";
  const atlasEntry = uiIconAtlasEntryFor(src);
  if (atlasEntry) {
    const aria = alt
      ? `role="img" aria-label="${escapeHtml(alt)}"`
      : `aria-hidden="true"`;
    return `<svg class="ui-icon-atlas" ${aria} focusable="false" viewBox="${atlasEntry.x} ${atlasEntry.y} ${atlasEntry.width} ${atlasEntry.height}" width="${atlasEntry.width}" height="${atlasEntry.height}" preserveAspectRatio="xMidYMid meet"><image href="${escapeHtml(publicAssetUrl(atlasEntry.atlas))}" width="${atlasEntry.atlasWidth}" height="${atlasEntry.atlasHeight}" decoding="async" /></svg>`;
  }
  return `<img src="${escapeHtml(publicAssetUrl(src))}" alt="${escapeHtml(alt)}" loading="eager" decoding="async" />`;
}

export function achievementIconPath(achievement) {
  if (achievement && typeof achievement === "object" && achievement.icon) return finalUiIconSource(achievement.icon);
  const title = typeof achievement === "string" ? achievement : achievement?.title;
  return title ? finalAchievementIconSourceByTitle(title) || UI_ICON_PATHS.achievements : UI_ICON_PATHS.achievements;
}

export function endingRouteIconPath(endingId, ending = null) {
  if (["overseas_elite", "overseas_strong", "overseas_stable", "overseas_safety"].includes(endingId)) {
    const routeIcon = ROUTE_OPTION_ICONS[ending?.routeOptionId];
    if (routeIcon) return routeIcon;
  }
  return ENDING_ROUTE_ICON_PATHS[endingId] ?? UI_ICON_PATHS.achievements;
}

export function endingIllustrationPath(endingId) {
  return ENDING_ILLUSTRATION_PATHS[endingId] ?? "";
}

export function routeOptionIconPath(optionId) {
  return ROUTE_OPTION_ICONS[optionId] ?? UI_ICON_PATHS.career_change;
}

export function internshipWorkIconPath(optionId) {
  return ENDING_ROUTE_ICON_PATHS[optionId] ?? routeOptionIconPath(optionId);
}

export function internshipShortEventIconPath(eventId) {
  const icons = {
    internship_ordinary_blueprint: "/optimized/asset-work/ui-icon-final/confirmed-icons/10-internship-short-events/001_普通实习 1：第一张施工图__UIATLAS_011_030_pxui_route_030_施工图.53fe1e26d50a.webp",
    internship_ordinary_site: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/039_UIATLAS_004_004_pxui_action_004_地图__UIATLAS_004_004_pxui_action_004_地图.18df50db40ea.webp",
    internship_ordinary_dinner_money: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/053_UIATLAS_002_004_pxui_stat_004_钱袋__UIATLAS_002_004_pxui_stat_004_钱袋.c7da0a487937.webp",
    internship_strong_meeting_room: "/optimized/asset-work/ui-icon-final/confirmed-icons/10-internship-short-events/004_强所实习 1：会议室__UIATLAS_011_021_pxui_route_021_讲台.78368c6a600d.webp",
    internship_strong_redlines: "/optimized/asset-work/ui-icon-final/confirmed-icons/05-normal-random-events/090_学姐的笔记__UIATLAS_018_040_pxui_random_normal_090_标注笔.aaddb13a7def.webp",
    internship_strong_all_nighter: "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/041_UIATLAS_004_006_pxui_action_006_夜灯__UIATLAS_004_006_pxui_action_006_夜灯.4f5e0f60df52.webp",
    internship_named_firm_busy: "/optimized/asset-work/ui-icon-final/confirmed-icons/10-internship-short-events/007_名企实习 1：忙忙碌碌__UIATLAS_011_024_pxui_route_024_普通工.a96d24685336.webp",
    internship_named_firm_abbreviations: "/optimized/asset-work/ui-icon-final/confirmed-icons/10-internship-short-events/008_名企实习 2：英文缩写__UIATLAS_011_029_pxui_route_029_英文邮.bdc2f5c26f77.webp",
    internship_named_firm_remembered: "/optimized/asset-work/ui-icon-final/confirmed-icons/10-internship-short-events/009_名企实习 3：铭记__UIATLAS_022_019_pxui_event_badge_019_徽章.7f519945bfc8.webp",
  };
  return icons[eventId] ?? "";
}

export function randomEventIconPath(event, eventNumber) {
  const pool = randomEventIconPool(event);
  const config = RANDOM_EVENT_ICON_CONFIG[pool];
  if (!config || !Number.isInteger(eventNumber) || eventNumber < 1) return UI_ICON_PATHS.event;

  const confirmedPath = RANDOM_EVENT_ICON_PATHS.get(`${pool}:${eventNumber}`);
  return confirmedPath ?? UI_ICON_PATHS.event;
}

export function themeIconPath(theme) {
  return theme === "dark" ? UI_ICON_PATHS.theme_dark : UI_ICON_PATHS.theme_light;
}

const RANDOM_EVENT_ICON_PATHS = buildRandomEventIconPathMap();

function randomEventIconPool(event) {
  for (const value of [event?.pool, event?.kind, event?.trigger]) {
    if (value in RANDOM_EVENT_ICON_CONFIG) return value;
  }
  return "";
}

function buildRandomEventIconPathMap() {
  const paths = new Map();
  for (const source of UI_ICON_FINAL_IMAGE_SOURCES) {
    const match = source.match(/pxui_random_(normal|interactive|model)_(\d{3})_/u);
    if (!match) continue;
    const pool = poolForRandomIconPrefix(match[1]);
    if (!pool) continue;
    paths.set(`${pool}:${Number(match[2])}`, source);
  }
  return paths;
}

function poolForRandomIconPrefix(prefix) {
  for (const [pool, config] of Object.entries(RANDOM_EVENT_ICON_CONFIG)) {
    if (config.prefix === prefix) return pool;
  }
  return "";
}
