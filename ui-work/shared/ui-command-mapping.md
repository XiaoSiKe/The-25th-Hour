# UI 到 Command 映射

最后更新时间：`2026-07-02 +08:00`

## 结论

当前 UI 的主游戏操作基本通过 `app.mjs` 的统一事件委派进入命令层：`render.mjs` 输出 `data-command` 和 view model 展示，`app.mjs` 读取 `data-command` 后分发，`commands.mjs` 执行规则判断和 `GameState` 推进。

已收口的命令边界：

- 开局资料提交按钮已使用 `data-command="start-game"`，submit handler 只采集表单字段并调用 `startGameProfile`。
- 咖啡支持成就统计已通过 `recordCoffeeSupport` 命令包装进入命令层。
- 音乐本地 MP3 / LRC、进度拖动和浏览器音频事件属于播放器壳层状态，不进入游戏规则命令；精细 UI 可以继续作为壳层控制，但不能影响 `GameState`。

## 与技术架构的边界对齐

本映射与 `../../docs/technical-architecture.md` 的 UI 接线边界一致：

- 游戏命令负责推进 `GameState`，包括开局、角色选择、周行动、商店购买、阻塞弹窗选项、课程、评图、暑假和结局相关流程。
- 存档/会话命令负责保存、读档和重新开始；当前 UI 的 `localStorage` 读写只是过渡实现，正式首版迁移到 `IndexedDB` 时仍保持 UI 不直接改规则状态。
- UI 壳层命令只影响 `startMode`、`uiDialog`、主题、播放器和专属技能确认层等 app shell 状态；这些状态不能写入 `GameState`，也不能进入存档恢复语义。
- `modal-option` 继续由 `pendingInteraction.type` 集中路由；精细 UI 不能为每个弹窗组件各写一套流程推进。
- 如果新增 UI 操作会改变数值、流程、随机、成就、路线、结局或存档语义，先补命令层或调度层，再接 UI，不在组件内部直接写规则。

## 当前 `data-command` 清单

| `data-command` | 当前发出位置 | 当前处理位置 | 类型 | 状态 |
|---|---|---|---|---|
| `show-start-form` | 开始菜单 | `app.mjs` click handler | UI 壳层命令 | 已映射 |
| `close-start-form` | 新游戏表单返回按钮 | `app.mjs` click handler | UI 壳层命令 | 已映射 |
| `start-game` | 新游戏资料表单提交按钮 | `app.mjs` submit handler -> `startGameProfile` | 游戏会话创建命令 | 已映射 |
| `load-save` | 开始菜单 | `app.mjs` -> `loadSave` -> `reviveState` | 存档命令 | 已映射 |
| `new-game` | 角色选择、结局、设置菜单 | `app.mjs` 清空当前局和当下该局的本地存档 | 存档/重开命令 | 已映射 |
| `save` | 游戏内系统菜单 | `app.mjs` -> `saveState` | 存档命令 | 已映射 |
| `ui-dialog` | 开始菜单、系统菜单、结局图鉴入口 | `app.mjs` 设置 `uiDialog`，咖啡入口调用 `recordCoffeeSupport` | UI 壳层命令，咖啡点击通过命令层记录 | 已映射 |
| `close-ui-dialog` | 系统弹窗返回按钮 | `app.mjs` 清空 `uiDialog` | UI 壳层命令 | 已映射 |
| `toggle-settings` | 设置按钮 | `app.mjs` 切换 `uiDialog="game_settings"` | UI 壳层命令 | 已映射 |
| `set-theme` | 主题弹窗按钮 | `app.mjs` 写入主题偏好 | 偏好命令 | 已映射 |
| `toggle-theme` | 主题切换按钮 | `app.mjs` 写入主题偏好 | 偏好命令 | 已映射 |
| `choose-startup-theme` | 开局课程后主题确认弹窗 | `app.mjs` 写入主题偏好并返回引导流程 | 偏好命令 | 已映射 |
| `set-language` | 显示语言弹窗按钮 | `app.mjs` 写入语言偏好 | 偏好命令 | 已映射 |
| `music-toggle` | 音乐播放器按钮 | `app.mjs` -> `toggleMusic` | 播放器壳层命令 | 已映射 |
| `music-next` / `music-prev` | 音乐播放器按钮 | `app.mjs` -> `playTrackOffset` | 播放器壳层命令 | 已映射；正式精细 UI 中只在购买 `音乐会员` 后允许切当前学年 BGM，结束曲始终禁用。 |
| `open-external-link` | 作者、社区等外部入口 | `app.mjs` -> `externalLinkForEntry` | UI 壳层命令 | 已映射；链接缺失时只提示不可用，不改 `GameState`。 |
| `save-ending-page-screenshot` | 结局页截图按钮 | `app.mjs` -> `captureEndingPageScreenshotBlob` | UI 壳层命令 | 已映射；保存当前结局页渲染截图，不改 `GameState`。 |
| `zoom-support-qr` / `close-support-qr-preview` | 支持页二维码 | `app.mjs` 放大或关闭二维码预览 | UI 壳层命令 | 已映射；只影响临时预览 DOM。 |
| `start-new-player-guide` / `new-player-guide-next` / `new-player-guide-prev` / `new-player-guide-end` / `graduation-design-guide-end` | 新手引导和毕业设计提示 | `app.mjs` 引导遮罩状态 | UI 壳层命令 | 已映射；只影响引导遮罩，不写规则状态。 |
| `reroll` | 角色抽取页 | `commands.mjs` -> `rerollCharacters` | 游戏命令 | 已映射 |
| `select-character` | 角色卡按钮 | `commands.mjs` -> `selectCharacter` | 游戏命令 | 已映射 |
| `perform-action` | 本周行动按钮 | `commands.mjs` -> `performAction` | 游戏命令 | 已映射；`action.id="special_skill"` 在精细 UI 中可先打开 app shell 确认层，确认后仍派发本命令。 |
| `confirm-special-skill` | 专属技能确认层按钮 | `app.mjs` -> `performAction(state, "special_skill")` | 游戏命令调度 | 已映射；确认层本身不写 `pendingInteraction`。 |
| `buy-shop-item` | 商店商品按钮 | `commands.mjs` -> `purchaseShopItem` | 游戏命令 | 已映射 |
| `route-select` | 后期路线候选按钮 | `commands.mjs` -> `chooseRouteOption` | 游戏命令 | 已映射；所有路线正式参与前都会进入对应阻塞确认弹窗。 |
| `internship-apply` | 实习申请按钮 | `commands.mjs` -> `applyForInternship` | 游戏命令 | 已映射 |
| `competition-submit` | 竞赛投稿确认按钮 | `commands.mjs` -> `submitCompetitionWork` | 游戏命令 | 已映射 |
| `wanli-road-visit` | 万里路地点访问按钮 | `commands.mjs` -> `visitWanliRoadLocation` | 游戏命令 | 已映射 |
| `start-ielts-exam` | 雅思报考弹窗按钮 | `commands.mjs` -> `startIeltsExam` | 游戏命令 | 已映射 |
| `modal-option` | 所有阻塞弹窗选项 | `app.mjs` -> `choosePendingInteractionOption` -> 对应游戏命令 | 游戏命令路由 | 已映射 |

## UI 操作 -> command -> 状态变化来源

| UI 操作 | UI 标记 | 分发入口 | 状态变化来源 | 备注 |
|---|---|---|---|---|
| 打开新游戏表单 | `data-command="show-start-form"` | `app.mjs` | `startMode = "profile"` | 只影响开始页壳层状态。 |
| 关闭新游戏表单 | `data-command="close-start-form"` | `app.mjs` | `startMode = "menu"` | 只影响开始页壳层状态。 |
| 提交新游戏资料 | 提交按钮 `data-command="start-game"` + 表单 `data-form="start"` | `app.mjs` submit handler | `startGameProfile` -> `createGame` 初始化 `GameState` | 表单只采集字段，创建游戏走命令层。 |
| 读档 | `data-command="load-save"` | `app.mjs` | `loadSave` -> `reviveState` | 当前使用 `localStorage` 临时存档。 |
| 放弃当前局/重新开始 | `data-command="new-game"` | `app.mjs` | 游戏内未确认时先打开 `confirm_new_game`；确认后清空 `state`、只删除当下该局的本地存档、不删除之前的存档、重置音乐状态并返回开始页 | 属于存档/会话命令，不做规则结算；当下该局的所有记录都会删除且不写入跨局记录，本局未随人生结局提交的成长成就、累计次数和排行榜分数作废，之前已提交到图鉴的跨局记录不会被删除。 |
| 保存 | `data-command="save"` | `app.mjs` | `saveState` 序列化当前 `GameState` | 当前使用 `localStorage` 临时存档。 |
| 选择角色 | `data-command="select-character"` + `data-id=characterId` | `app.mjs` click handler | `selectCharacter` | 设置角色、初始属性和经济状态，推进固定开学流程。 |
| 免费重抽角色 | `data-command="reroll"` | `app.mjs` click handler | `rerollCharacters` | 校验阶段和剩余次数，更新候选角色和 RNG。 |
| 执行周行动 | `data-command="perform-action"` + `data-id=actionId` | `app.mjs` click handler | `performAction` | 可用性、行动次数、收益、特殊技能和项目弹窗都由命令层处理。 |
| 专属技能确认层（精细 UI 特例） | 第一次点击 `action.id="special_skill"` 只打开 app shell 确认层；确认按钮再派发 `data-command="perform-action"` + `data-id="special_skill"` | app shell 确认层 -> `app.mjs` click handler | 打开/关闭确认层只影响 app shell；真正执行仍是 `performAction` | 不写 `GameState`，不写日志，不进入冷却，不消耗行动次数，不写 `pendingInteraction`，不走 `modal-option`；确认后命令失败时只展示命令层原因。 |
| 承接外包/兼职项目 | `data-command="modal-option"` + `interaction.type="project_select"` | `choosePendingInteractionOption` | `chooseProject` | 项目门槛、返回项目列表、消耗行动次数和收益都在命令层。 |
| 购买商店商品 | `data-command="buy-shop-item"` + `data-id=itemId` | `app.mjs` click handler | `purchaseShopItem` | 金钱、限购、商品效果、购买记录和结果弹窗都在命令层。 |
| 正式选择后期路线 | `data-command="route-select"` + `data-id=optionId` | `app.mjs` click handler | `chooseRouteOption` | 可用性、二次确认、路线正式参与和后续考试/等待弹窗都在命令层。 |
| 处理固定开学事件选项 | `data-command="modal-option"` + `fixed_event` | `choosePendingInteractionOption` | `chooseFixedEventOption` | 固定流程推进和选项 delta 来自命令层。 |
| 选择导师 | `data-command="modal-option"` + `mentor_select` | `choosePendingInteractionOption` | `selectMentor` | 候选导师由命令层抽取，UI 只展示。 |
| 选课 | `data-command="modal-option"` + `course_select` | `choosePendingInteractionOption` | `selectCourse` | 年度课程写入和学年开始弹窗由命令层处理。 |
| 确认学年开始 | `data-command="modal-option"` + `year_start` | `choosePendingInteractionOption` | `confirmYearStart` | 推进到本学年第一周或后续强制流程。 |
| 选模型材料 | `data-command="modal-option"` + `model_material` | `choosePendingInteractionOption` | `chooseModelMaterial` | 材料价格、置灰原因和材料收益来自命令层。 |
| 处理随机事件 | `data-command="modal-option"` + `random_event` | `choosePendingInteractionOption` | `confirmRandomEvent` | 随机事件确认、交互分支和结果弹窗由事件/命令层处理。 |
| 开始课程考试 | `data-command="modal-option"` + `course_exam_intro` | `choosePendingInteractionOption` | `beginCourseExam` | UI 不决定题目，只触发命令。 |
| 回答课程题 | `data-command="modal-option"` + `course_question` | `choosePendingInteractionOption` | `answerCourseQuestion` | 正误、题目推进和课程结算由命令层处理。 |
| 确认课程结算 | `data-command="modal-option"` + `course_result` | `choosePendingInteractionOption` | `confirmCourseResult` | 进入下一周或评图由命令层判断。 |
| 选择评图汇报策略 | `data-command="modal-option"` + `report_strategy` | `choosePendingInteractionOption` | `chooseReportStrategy` | 策略可用性、成功率、随机掷骰和评图草稿由命令层处理。 |
| 确认汇报反馈 | `data-command="modal-option"` + `report_feedback` | `choosePendingInteractionOption` | `confirmReportFeedback` | 最终评图记录由命令层结算。 |
| 确认评图结果 | `data-command="modal-option"` + `review_result` | `choosePendingInteractionOption` | `confirmReviewResult` | 暑假事件、升学期或结局推进由命令层处理。 |
| 处理暑假事件 | `data-command="modal-option"` + `summer_event` | `choosePendingInteractionOption` | `chooseSummerEventOption` | 暑假队列、加成和升学期由命令层处理。 |
| 确认普通选择结果 | `data-command="modal-option"` + `choice_result` | `choosePendingInteractionOption` | `confirmChoiceResult` | 弹窗队列、继续周结算或升学期。 |
| 打开/关闭系统入口弹窗 | `ui-dialog` / `close-ui-dialog` | `app.mjs` | `uiDialog` 壳层状态；咖啡点击走 `recordCoffeeSupport` | 商店购买按钮另走 `buy-shop-item`。 |
| 切换主题 | `set-theme` / `toggle-theme` | `app.mjs` | `theme` 和 `localStorage` 偏好 | 不改 `GameState`。 |
| 打开/关闭游戏设置 | `toggle-settings` | `app.mjs` | `uiDialog="game_settings"` 壳层状态 | 不改 `GameState`。 |
| 播放/暂停/切歌 | `music-toggle` / `music-next` / `music-prev` | `app.mjs` | `musicState` 和 `<audio>` | 不改 `GameState`；切歌只在音乐规则允许时可用。 |
| 导入本地 MP3/LRC | `data-music="audio"` / `data-music="lrc"` | `app.mjs` change handler | `musicState`、歌词缓存和 `<audio>` | 无 `data-command`，但属于播放器壳层，不是游戏规则操作。 |
| 拖动音乐进度 | `data-music-progress` | `app.mjs` input handler | `<audio>.currentTime` 和歌词进度 | 无 `data-command`，但不改 `GameState`。 |

## `modal-option` 路由表

| `pendingInteraction.type` | 对应命令 | 状态变化来源 |
|---|---|---|
| `fixed_event` | `chooseFixedEventOption` | 固定开学事件推进、选项 delta、后续导师/课程流程 |
| `mentor_select` | `selectMentor` | 导师写入和后续课程选择 |
| `course_select` | `selectCourse` | 年度课程写入和学年开始弹窗 |
| `course_exam_intro` | `beginCourseExam` | 课程题队列 |
| `ielts_exam_intro` | `beginIeltsExam` | 雅思题队列 |
| `route_exam_intro` | `beginRouteExam` | 路线考试题队列 |
| `model_material` | `chooseModelMaterial` | 模型材料写入、材料收益、进入周行动 |
| `random_event` | `confirmRandomEvent` | 随机事件分支、delta 和结果弹窗 |
| `wanli_road_event` | `confirmWanliRoadEvent` | 万里路地点事件确认、delta 和结果弹窗 |
| `project_select` | `chooseProject` | 项目门槛、行动次数、项目收益、项目记录 |
| `course_question` | `answerCourseQuestion` | 课程题正误、题目推进、课程结算 |
| `ielts_question` | `answerIeltsQuestion` | 雅思题正误、题目推进、考试结果 |
| `route_question` | `answerRouteQuestion` | 路线考试正误、题目推进、考试结果缓存 |
| `course_result` | `confirmCourseResult` | 下一周或评图推进 |
| `ielts_exam_result` | `confirmIeltsExamResult` | 雅思成绩确认和后续流程恢复 |
| `report_strategy` | `chooseReportStrategy` | 评图策略随机、成功/失败分支、评图草稿 |
| `report_feedback` | `confirmReportFeedback` | 最终评图记录 |
| `review_result` | `confirmReviewResult` | 暑假事件、升学期或结局 |
| `mentor_task_result` | `confirmMentorTaskResult` | 导师阶段任务结果确认 |
| `route_commit` | `confirmRouteCommit` | 路线正式参与二次确认 |
| `route_contract` | `confirmRouteCommit` | 创业契约确认 |
| `route_exam_result` | `confirmRouteExamResult` | 路线考试结果确认和后续等待 |
| `summer_event` | `chooseSummerEventOption` | 暑假事件收益、暑假队列、升学期 |
| `year_start` | `confirmYearStart` | 学年音乐状态和第一周开始 |
| `system_prompt` | `confirmSystemPrompt` | 系统开放提示确认 |
| `graduation_ceremony` | `confirmGraduationCeremony` | 毕业典礼确认 |
| `ending_memory` | `confirmEndingMemory` | 结尾回忆确认 |
| `choice_result` | `confirmChoiceResult` | 弹窗队列、周结算继续、升学期 |

## 当前没有完整游戏 command 映射的 UI 操作

结论：玩家核心游戏操作已具备 command 映射。以下操作没有进入游戏命令层，是因为它们只属于播放器壳层，不改变 `GameState`。

精细 UI 的专属技能确认层也是 app shell 预备交互：打开、关闭或取消确认层不进入游戏命令层；只有确认按钮会继续派发既有 `perform-action` / `special_skill`。

| 操作 | 当前位置 | 风险 | 收口要求 |
|---|---|---|---|
| 本地 MP3/LRC 导入 | `data-music` change handler | 没有进入命令层，但只影响播放器 | 可继续作为壳层操作；不得改变音乐规则、结局曲选择或 `GameState`。 |
| 音乐进度拖动和音频事件 | `data-music-progress`、`data-audio-player` 事件 | 没有进入命令层，但只影响播放器 | 可继续作为壳层操作；不得被精细 UI 当作游戏规则输入。 |

## UI 是否直接改状态

| 文件 | 当前行为 | 是否允许 | 精细 UI 要求 |
|---|---|---|---|
| `web-app/ui/render.mjs` | 只生成 HTML、展示 view model、输出 `data-command` | 允许 | 继续保持只读 view model，不引入 `GameState`。 |
| `web-app/app.mjs` | 持有 `state` 引用并把命令结果保存、重渲染 | 过渡期允许 | 精细 UI 组件不能直接持有或改 `GameState`；事件统一交给调度层。 |
| `web-app/app.mjs` | `startGameProfile`、`loadSave`、`new-game` 替换当前 `state` | 过渡期允许 | 表单和按钮必须通过命令/调度入口，不在组件内部改状态。 |
| `web-app/app.mjs` | `uiDialog`、`startMode`、`theme`、`musicState` 壳层状态 | 允许 | 这些不是游戏规则状态，但应和 `GameState` 明确分离。 |
| `web-app/app.mjs` | `advanceGameFlow` 在命令成功后收束自动阶段推进 | 过渡期允许 | 精细 UI 不复制这段判断；后续可迁入统一游戏调度器。 |
| `web-app/game/commands.mjs` | `recordCoffeeSupport(state)` 包装咖啡支持成就统计 | 允许 | 成就相关状态变更保留在命令层入口后面。 |

## UI 不允许直接处理的规则判断

| 规则判断 | 当前唯一来源 | UI 允许做什么 | UI 禁止做什么 |
|---|---|---|---|
| 行动是否可用、隐藏、置灰和原因 | `resolveActionAvailability` | 读取 `vm.actions[].state/reason/canInspect/preview` 展示 | 在组件里重新判断阶段、行动次数、精力、压力、金钱或周次数。 |
| 行动收益预览 | `resolveActionAvailability` -> `previewActionDelta` | 展示 `delta` 或 `preview` | 用 UI 自己计算收益、风险惩罚或角色被动。 |
| 外包/兼职项目门槛 | `availableProjects` -> `projectAvailability`、`chooseProject` | 展示项目列表、置灰原因、返回项 | 在 UI 判断能力门槛或项目是否可承接。 |
| 商店商品可购买性 | `availableShopItems` -> `shopItemAvailability`、`purchaseShopItem` | 展示价格、限购、置灰原因，派发购买命令 | 在 UI 判断余额、限购、阶段可用性或直接扣钱。 |
| 商店商品效果 | `purchaseShopItem` -> `applyShopItemEffects` | 展示效果文案和结果弹窗 | 在 UI 改 `shopEffects`、行动次数、事件屏蔽或购买记录。 |
| 固定事件选项 delta | `chooseFixedEventOption` 和固定事件配置 | 展示选项 | 在 UI 应用 delta 或推进固定事件索引。 |
| 导师候选和导师任务 | `queueMentorSelection`、`selectMentor`、`resolveMentorTask` | 展示候选和任务文本 | 在 UI 抽导师、判断导师任务成功或发奖惩。 |
| 年度课程选择和课程结算 | `selectCourse`、`beginCourseExam`、`answerCourseQuestion`、`resolveCourseExam` | 展示题目、选项、结算文本 | 在 UI 抽题、判题、算 GPA 修正或决定下一阶段。 |
| 模型周材料可用性 | `queueModelMaterial`、`chooseModelMaterial` | 展示材料、价格、置灰原因 | 在 UI 判断余额、扣钱或写入材料选择。 |
| 随机事件分支 | `confirmRandomEvent` -> `confirmEvent` | 展示事件和选项 | 在 UI 抽事件、确认互动分支或应用事件 delta。 |
| 周结算和自动推进 | `finishWeek`、`continueAfterWeeklyEvents`、`startWeek` | 展示结果；由 `advanceGameFlow` 在命令成功后自动收束 | 在 UI 直接调用结算函数以外的内部规则，或自己判断考试/评图/暑假。 |
| 评图策略可用性和成功率 | `startReview` -> `strategyAvailability`、`chooseReportStrategy` | 展示策略、成功率、置灰原因 | 在 UI 判断求情门槛、属性门槛、基础评级或掷骰结果。 |
| 评图最终成绩 | `confirmReportFeedback` -> `finalizeReview` | 展示最终记录 | 在 UI 改 `reviews`、GPA、作品集或结局。 |
| 暑假事件收益 | `chooseSummerEventOption` -> `summerOptionDelta` | 展示选项和收益 | 在 UI 计算商店加成或推进暑假队列。 |
| 学期/学年推进 | `advanceSemester`、`queueCourseSelection`、`queueMentorSelection` | 展示当前阶段 | 在 UI 改 `semesterIndex/year/term/courseId/mentorId`。 |
| 风险状态 | `currentRiskLevel`、`isMoneyHighRisk`、`riskMessages` | 读取 `vm.risk` 展示 | 在 UI 自己判定高危阈值或惩罚。 |
| 结局和成就 | `settleFinalEnding`、成就模块 | 展示 `vm.ending` 和 `vm.achievements` | 在 UI 判断结局、解锁成就或计算成就分。 |

## 精细 UI 接线规则

- 新组件只能接收 view model 字段和本表中的 command 名称。
- 结局页的“返回主菜单”继续派发 `new-game` + `confirmed`：它只清空当前局存档并回到开始页，不改变已提交的结局/成就集合；音频清理不能阻塞开始页渲染。
- 结局页的“我要发朋友圈”继续派发 `save-ending-page-screenshot`：保存当前 `.ending-shell` 的实际渲染截图，不再拼接独立分享海报。
- 组件内部只能组装表单数据、设置 `data-id`、显示禁用态和原因，不读取或修改 `GameState`。
- 新增按钮时先查本表：如果没有对应 command，先补命令层或调度层，不在 UI 里直接写规则。
- `action.id="special_skill"` 是行动按钮的已知交互例外：第一次点击可以打开 app shell 确认层，确认按钮再派发 `perform-action`。确认层不写 `pendingInteraction`，不走 `modal-option`，也不复制专属技能可用性、冷却或消耗判断。
- `modal-option` 必须继续由 `pendingInteraction.type` 集中路由；不要在每个弹窗组件里各写一套提交逻辑。
- 壳层状态要和游戏状态分离：主题、设置抽屉、系统弹窗、播放器可以留在 app shell；凡是会影响数值、流程、随机、成就、结局、存档语义的操作都必须进入命令层。
