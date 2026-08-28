# UI 组件清单

最后更新时间：`2026-06-27 +08:00`

## 目的

本文把当前 UI 拆成可独立维护的组件，并标注每个组件的数据来源、command、空状态、禁用/错误状态和手机端边界。组件可以重写视觉和 DOM 结构，但不能改变规则推进。

通用边界：

- 组件只读 `toViewModel(state)`、app shell 状态或存储/API 状态。
- 组件只派发表内 command，不直接修改 `GameState`。
- 禁用态、置灰原因、占位状态和收益预览优先来自 view model。
- 音乐、主题、菜单展开、表单输入、存档读写状态属于 app shell 或 storage 层，不进入游戏规则。

PNG 对齐边界：

- 组件视觉应延续像素体素建筑工作室、工程面板和高密度控制台语言。
- 主流程普通周组件必须按 `游戏主要过程的浅色背景页面.png` 和 `游戏主要过程的深色背景页面.png` 落位；行动区、状态仪表、日志、角色课程、系统入口和音乐播放器不能脱离 PNG 重新组合。
- 像素图标、角色头像、课程/系统图标是识别辅助，不替代文字状态、禁用原因或 delta 文本。
- 深浅主题下组件的 DOM 职责和命令边界不变，只切换 token、场景氛围和对比度。
- PNG 中的示例数值、排行榜、行动名和时间不作为真实数据源。

## 主组件清单

| 组件 | 数据来源 | 触发 command | 状态要求 | 手机端边界 |
|---|---|---|---|---|
| 开始界面 | `screen`，本地存档存在状态，`musicForState(null)`，主题偏好 | `show-start-form`, `load-save`, `ui-dialog`, `set-theme`/`toggle-theme` | 无存档时继续按钮禁用；读档失败显示可恢复提示；占位入口说明待开放；场景背景不承载规则。手机端点击开始或读档只显示电脑端提示。 | 手机端是独立入口浏览页，不进入主流程；只输出开始新游戏、作者/支持、排行榜、社区、公告和深浅主题，不输出结局与成就、继续读档、建档表单、音乐播放器或主流程组件。 |
| 新游戏表单 | 表单本地输入；创建结果来自 `startGameProfile` | `start-game`, `close-start-form` | 必填昵称和大学名；seed 默认由系统自动生成，只在高级/调试模式允许手动填写；提交失败不创建局；错误靠近字段。 | 手机端不展示正式建档表单；如果因横竖屏切换进入表单，提交时仍显示电脑端提示，不创建局。 |
| 角色选择卡 | `characterCandidates`, `profile`, `canReroll`, `rerollsRemaining` | `select-character`, `reroll`, `new-game` | 无候选时显示恢复提示；重抽次数为 0 时按钮禁用并显示剩余次数。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 阶段顶栏 | `title`, `subtitle`, `calendar`, `interaction`, app 保存状态 | `save`, `toggle-settings` 或系统菜单 command | `interaction.isBlocking` 时显示“先处理当前弹窗”；保存成功/失败有反馈。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 状态仪表 | `meters`, `money`, `metrics` | 无 | GPA 未生成前显示 `未知`；余额显示数值和每周花费，不做进度条。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 高危状态提示 | `risk.level`, `risk.money`, `risk.messages` | 无 | 无风险时不占主视觉；高危时说明影响，不只用颜色。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 行动区 | `actions`, `calendar.actionsRemaining`, `interaction` | 无，子组件派发 `perform-action` | 非 `week_action` 阶段可显示下一步提示；阻塞时整体置为只读。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 行动按钮 | `actions[].id/label/state/reason/preview/delta/canInspect` | `perform-action`；`action.id="special_skill"` 可先打开 app shell 确认层 | 显示像素图标、行动名、短说明或收益预览；`disabled` 显示 `reason`；`canInspect` 可打开项目门槛；收益预览来自 `delta` 或 `preview`。专属技能按钮第一次点击只打开确认层，确认后才派发 `perform-action`。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 行动不可用原因 | `actions[].reason` | 无 | 原因为空时不显示；不要在 UI 里重新判断原因。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 专属技能确认层 | `actions[]` 中 `id="special_skill"` 的可用状态与预览、当前角色技能展示字段、app shell 确认层状态 | 确认按钮派发 `perform-action` + `special_skill`；取消无游戏 command | 只作为 app shell 临时确认遮罩，不写 `GameState`、不写 `pendingInteraction`、不走 `modal-option`；取消、关闭或命令失败不播放数值反馈。当前有 `pendingInteraction` 时不打开。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 固定事件弹窗 | `pendingInteraction.type="fixed_event"` | `modal-option` | 选项 delta 可见；选择后由命令层进入结果或下一事件。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 普通事件弹窗 | `pendingInteraction.type="random_event"` | `modal-option` | 无选项事件按钮显示结算摘要；交互事件选项和禁用原因来自 VM。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 结果结算弹窗 | `pendingInteraction.type="choice_result"`, `course_result`, `report_feedback`, `review_result` | `modal-option` | 展示标题、正文、delta；delta 同时使用图标、符号、文字和颜色；按钮文案保留下一步语义，不统一写“确定”。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 成就提示 Toast | `achievements`、成就提示队列或 app shell 成就提示状态 | 无，自动显示和消失 | 右上角自动出现，显示成就标题、内容和分数；单条提示约停留 `3.9` 秒后自动消失，JS 队列定时清理为兜底，不依赖 `animationend`；提示框最终宽度为 `438px` 上限、相对上一版缩小 `10pt`，内容区同步收紧右侧留白；不阻塞行动、评图、结算或路线流程。 | 手机端不进入会触发该 Toast 的主流程；仅保留桌面端表现。 |
| 日志列表 | `logs` | 无 | 空状态显示“暂无日志”；每条显示周次、阶段、文本和 delta 摘要。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 角色属性面板 | `profile`, `attributes` | 无 | 未选择角色时显示等待选择，不显示假属性。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 课程信息面板 | `profile.course`, `profile.mentor`, `calendar.topic`, `courseProgress` | 无 | 未选课/导师时显示“未选择”；进度/质量来自 VM cap 后比例。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 评图记录 | `reviews`, `metrics.reviews` | 无 | 无记录时显示“还没有评图”；记录显示学期、评级、作品分、GPA、作品集入库。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 商店面板 | `systems.shop`, `money`, `systems.entries[]` 中 `id="shop"` 的入口 | `buy-shop-item`, `close-ui-dialog` | 商品显示价格、分类、效果、限购和禁用原因；有阻塞弹窗时不能购买。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 系统入口菜单 | `systems.entries`，开始页静态入口配置 | `ui-dialog`, `save`, `new-game`, `toggle-theme`, `close-ui-dialog` | 占位入口必须显示 copyRequirement/availability.reason；危险重开需明显区分；危险重开、主题背景、玩家排行榜和显示语言弹窗标题前必须显示对应图标；主题背景标题图标必须随当前背景同步切换；标题字号、图标尺寸和正文字号对齐随机事件弹窗规范。 | 手机端只保留作者/支持、社区、公告、排行榜和深浅主题入口；不暴露主流程入口。 |
| 音乐播放器 | `music` + app `musicState`、音频资源状态 | `music-toggle`, `music-next`；文件输入无游戏 command | 资源缺失显示可理解提示；未购买 `音乐会员` 时学年 BGM 下一首禁用；购买后仅切当前学年 BGM；结束曲始终禁用下一首；本地 MP3/LRC 标注测试用途。 | 手机端入口页隐藏播放器，不承诺主流程播放控件。 |
| 个人作品集与简历面板 | `systems.portfolio` | `close-ui-dialog` | 无评图记录时显示空状态；只汇总当前数据、评图入库和简历素材，不生成投稿或结算。作品集页面的返回按钮固定在弹窗右上角；点击作品查看展板后，右上角按钮返回作品集目录。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 竞赛投稿面板 | `systems.competition` | `close-ui-dialog` | 显示投稿建议、投稿/获奖摘要或接入状态；不在 UI 内模拟赛事结果。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 实习与工作面板 | `systems.internship` | `close-ui-dialog` | 显示软件、设计、汇报、申请/进行中/完成摘要、建筑工作开放说明；不在 UI 内模拟录取结果。大五学年从底部系统入口打开时默认进入“关于工作”，大五前默认进入“关于实习”。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 考研升学面板 | `systems.route` | `close-ui-dialog` | 大五前显示开放条件；大五后显示可参与或已正式参与状态；候选方向来自 VM，不泄露内部成功率。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 申请保研面板 | `systems.route` | `close-ui-dialog` | 大五前显示开放条件；大五后显示可参与或已正式参与状态；候选方向来自 VM，不泄露内部成功率。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 考公考编面板 | `systems.route` | `close-ui-dialog` | 大五前显示开放条件；大五后显示选调、考公、考编子方向状态；候选方向来自 VM，不泄露内部成功率。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 出国留学面板 | `systems.route` | `close-ui-dialog` | 大五前显示开放条件；大五后显示可参与或已正式参与状态；候选方向来自 VM，不泄露内部成功率。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 转行面板 | `systems.route` | `close-ui-dialog` | 大五前显示开放条件；大五后显示可参与或已正式参与状态；候选岗位来自 VM，不泄露内部成功率。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 建筑生的万里路面板 | `systems.entries` 中 `id="wanli_road"` 的入口 | `close-ui-dialog` | 大二上开放；展示当前地点和地点事件入口，不直接写入作品集分。 | 手机端不进入该组件；保留桌面端布局，不另做可玩手机布局。 |
| 成就与结局图鉴 | `achievements`, `ending`，后续图鉴存储/API 状态 | `ui-dialog`, `close-ui-dialog` | 未解锁显示空/锁定状态；已解锁显示标题、说明、分数；不伪造结局记录。 | 手机端允许浏览已解锁/占位信息，采用入口页或弹窗浏览，不进入行动主流程。 |
| 排行榜面板 | `systems.entries[]` 中 `id="leaderboard"` 的入口；正式首发前需接入 leaderboard API/app 层或降级状态 | `ui-dialog`, `close-ui-dialog` | 当前过渡阶段占位必须说明接口尚未接入；弹窗标题前显示排行榜图标；正式首发前必须接入真实榜单或可验收降级，接口失败不阻塞游戏。 | 手机端允许浏览真实榜单或可验收降级状态，不展示假排名，不进入行动主流程。 |
| 存档状态提示 | storage/app shell 状态，`../../docs/technical-architecture.md` | `save`, `load-save`, `new-game` | 保存成功、保存失败、读档失败、无存档都要有明确反馈和恢复路径；保存成功弹窗标题前显示存档图标，弹窗宽度在随机事件弹窗基础上略收窄，间距、标题字号、图标尺寸、正文字号和长返回按钮对齐随机事件弹窗规范。 | 手机端读档进入主流程只显示电脑端提示，不加载游戏局。 |
| 结局页面 | `ending`, `meters`, `money`, `metrics`, `reviews`, `achievements`, `music` | `new-game`, `ui-dialog`, `toggle-theme` | 保留结局插画、标题、正文、状态摘要、图鉴入口、重新开始和结束曲；插画按 `ending.id` 读取 `asset-work/assets/images/ending-illustrations/` 映射，不参与结局判定。 | 手机端不进入正式结局流程；后续分享预览只展示已完成结局内容。 |

竞赛投稿、实习与工作和五个未来方向面板的“最小版”只限制首批 UI 展示深度，不改变规则源。若需要投稿、申请、投递、考试或正式参与，必须先接入对应 command；组件不能在面板内部补一套流程或结果判定。

## 排行榜真实数据边界

排行榜 UI 只展示排行榜 API 或 app 层注入的真实排行榜 view model，不在 `web-app/ui/render.mjs` 中硬编码玩家数据。

数据库或排行榜 API 未接入时：

- 无本地已提交结局分数：开始界面和排行榜弹窗只显示空状态，不显示随机玩家、假排名、假总分、假大学名称或“测试玩家”。
- 有本地已提交结局分数：开始界面和排行榜弹窗可以显示当前玩家本地档案；如果只有本人一条记录，名次显示为 `#01`。

真实数据最小字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `rank` | number | 全服排名，从 1 开始。 |
| `nickname` | string | 玩家昵称。 |
| `universityName` | string | 玩家大学名称。 |
| `score` | number | 排行榜总分。 |
| `isSelf` | boolean | 是否为当前玩家。 |

展示规则：

- 开始界面默认展示真实榜单前三名；当前玩家不在前三名时，在前三名后追加本人条目。
- 排行榜弹窗展示真实 Top 10，并在底部保留“我的毕业档案”区域。
- 不在 UI 层计算排行榜分数，不把作品集总分计入排行榜总分，不让接口失败阻塞结局展示、继续游戏或本地记录。

## PNG 对齐组件骨架

| 视觉骨架 | 适用组件 | 规则 |
|---|---|---|
| 工程面板 | 开场入口卡、游戏介绍、状态仪表、日志、角色课程、系统面板 | 小圆角或直角，薄边线，清晰标题线；可以有轻结构阴影，不嵌套装饰卡。 |
| 像素图标按钮 | 行动按钮、系统入口、播放器按钮、设置按钮 | 图标帮助识别，文字说明不可省略；禁用态仍显示原因。 |
| 状态条 | 精力、压力、社交、属性、课程进度、作品质量 | 数值槽稳定；进度条只表达 VM 已给出的值，不在 UI 计算风险。 |
| delta chip | 行动预览、弹窗结果、日志摘要 | 正负变化必须带 `+`/`-`、字段名和颜色；压力增加按负向表达。 |
| 占位入口 | 社区、语言、接口失败或空榜状态等 | 虚线/弱边框或 muted 状态，明确写预留、待开放、链接待填写、暂无数据或接口失败。 |
| 危险操作 | 放弃学业重新开始、清空进度 | 与普通入口分组隔离，使用 danger 样式和确认文案。 |
| 背景遮罩 | 所有阻塞弹窗 | 背景可见但不可操作，遮罩后仍能看出来自主流程页。 |
| 主流程 PNG 母版 | 阶段顶栏、状态仪表、行动区、日志、角色课程、系统入口、音乐播放器 | 组件替换后必须仍能组成主流程 PNG 的整体构图；不能把单个组件做对了，却破坏页面级区域关系。 |

## 弹窗组件族

弹窗组件可以按视觉模板拆分，但提交逻辑必须统一：

| `pendingInteraction.type` | 组件模板 | command |
|---|---|---|
| `fixed_event` | 固定事件弹窗 | `modal-option` |
| `mentor_select` | 导师选择弹窗 | `modal-option` |
| `course_select` | 课程选择弹窗 | `modal-option` |
| `year_start` | 学年开始确认弹窗 | `modal-option` |
| `model_material` | 模型材料选择弹窗 | `modal-option` |
| `project_select` | 外包/兼职项目弹窗 | `modal-option` |
| `random_event` | 普通/交互事件弹窗 | `modal-option` |
| `course_exam_intro` | 课程考试介绍弹窗 | `modal-option` |
| `course_question` | 课程题弹窗 | `modal-option` |
| `course_result` | 课程结算弹窗 | `modal-option` |
| `report_strategy` | 汇报策略弹窗 | `modal-option` |
| `report_feedback` | 汇报反馈弹窗 | `modal-option` |
| `review_result` | 评图结果弹窗 | `modal-option` |
| `summer_event` | 暑假事件弹窗 | `modal-option` |
| `choice_result` | 通用结果弹窗 | `modal-option` |

禁止每个弹窗组件各自写一套规则路由；组件只把 `options[].id` 交给统一调度层。
成长成就不进入阻塞弹窗族；精细 UI 使用右上角自动消失的成就提示 Toast。
专属技能确认层也不进入阻塞弹窗族；它是 app shell 确认遮罩，确认后才派发 `perform-action` / `special_skill`。

弹窗视觉规则：

- 弹窗层级高于所有行动、系统入口和音乐控件。
- 标题区包含类型标签和标题；类型标签来自 `pendingInteraction.type` 的展示映射，不直接裸露内部 ID。
- 正文支持多段文本，但必须限制行长和滚动区域，避免主按钮被挤出可视区域。
- 选项按钮必须展示选项语义；有禁用状态时 `options[].reason` 靠近按钮显示。
- 结果弹窗的下一步按钮根据 VM/流程语义写成“回到本周行动”“继续下一事件”“查看评图结果”等，不写成通用“确定”。

## 系统入口组件族

系统入口菜单必须优先读取 `systems.entries`：

| 入口类型 | 数据来源 | command | 组件要求 |
|---|---|---|---|
| 必须完成 | `launchStatus="must_complete"` | `entry.command` | 可操作、可反馈、不可只占位。 |
| 首发必须完成 | `launchStatus="launch_must_complete"` | `entry.command` | 当前可占位，但首发实现不能漏。 |
| 最小版完成 | `launchStatus="minimum"` | `entry.command` | 只读摘要即可，不新增规则结算。 |
| 静态完成 | `launchStatus="static"` | `entry.command` | 展示静态文案或配置外链状态，不写 `GameState`。 |
| 可占位 | `launchStatus="placeholder"` | `entry.command` | 明确说明预留/待开放/链接待填写。 |

## 开工引用

组件替换顺序不在本文重复维护。开工时读取 `development-contract.md` 和 `DESIGN.md` 的维护基线，并执行 `development-contract.md` 的开发前检查。

本文只回答每个组件需要读取什么数据、派发什么 command、需要哪些状态和手机端边界。

## 验收

- 每个组件都有明确数据来源和 command。
- 替换组件不改变 `GameState` 推进、随机、结算、成就或存档语义。
- 行动、商店、弹窗和系统入口的禁用原因仍来自 VM 或 storage/API 状态。
- 主流程普通周组件组合后，与主流程深浅 PNG 的区域落位、密度、层级和视觉语言一致。
- 空状态不会伪造数据，占位状态不会伪装成完整功能。
- 手机端入口不依赖 hover，不出现横向滚动，主要按钮满足触控尺寸；正式主流程手机端布局不保留、不实现。
