# View Model 契约

最后更新时间：`2026-06-25 +08:00`

## 目的

本文定义当前 UI 只能从 `toViewModel(GameState)` 读取的展示契约。UI 可以重做组件、布局和视觉，但不能直接读取或修改 `GameState`，也不能在 UI 内复制行动、商店、评图、路线、事件或结局规则判断。

运行边界固定为：

```text
GameState
-> toViewModel
-> app/ui 读取 view model
-> app/ui dispatch command
-> command 推进 GameState
```

## 与技术架构的边界对齐

本契约与 `../../docs/technical-architecture.md` 的分层一致：

- View Model 是 `GameState` 的只读展示投影，不是规则源、存储层或 API 层。
- `actions`、`pendingInteraction`、`interaction` 和 `systems.entries` 只告诉 UI 怎么展示、置灰和派发 command；规则判断仍来自 `game-core`。
- 开发调试字段可以暴露内部 ID、seed、RNG 和队列信息，但正式玩家 UI 必须转译或隐藏。
- IndexedDB 读写、排行榜请求、音频当前秒数、本地文件对象、真实外链 URL 和视觉 token 不进入 VM，由 `storage`、`api/leaderboard`、app shell、配置或设计系统承担。
- 专属技能确认层、主题弹窗、设置抽屉和播放器展开是 app shell 临时 UI 状态，不改写 `interaction.isBlocking`，也不走 `modal-option`。

## 字段总览

| 字段 | 玩家可见 | 开发调试 | 数据来源 | 用途 |
|---|---:|---:|---|---|
| `screen` | 是 | 否 | `state` 是否存在 | 区分开始页和游戏页。 |
| `phase` | 可转译展示 | 是 | `GameState.phase` | 当前流程阶段；玩家 UI 应用中文标题，不直接裸露内部 ID。 |
| `seed` | 否 | 是 | `GameState.seed` | 固定随机验证。 |
| `stateMeta` | 否 | 是 | `GameState` 元信息 | 存档版本、结局 ID、弹窗队列长度等调试信息。 |
| `music` | 是 | 可 | `musicForState(state)` | 当前阶段曲目、播放列表、歌词权限和结束曲锁定状态。 |
| `title` / `subtitle` | 是 | 否 | 阶段和结局派生 | 页面主标题和当前阶段说明。 |
| `profile` | 是 | 否 | 角色、学历、家庭、导师、课程配置映射 | 玩家档案、角色身份、专属技能展示、导师和课程展示。 |
| `calendar` | 是 | 可 | 学期、周次、课题、行动次数 | 当前日历、课题、剩余行动和评图进度要求。 |
| `meters` | 是 | 否 | `energy` / `pressure` | 状态仪表。 |
| `money` | 是 | 否 | 金钱与生活费解析 | 余额、每周花费和金钱高危状态。 |
| `courseProgress` | 是 | 否 | 进度 / 质量与上限解析 | 课题进度和作品质量。 |
| `metrics` | 是 | 否 | GPA、评图记录 | 顶部或摘要型指标。 |
| `attributes` | 是 | 否 | 六维属性配置映射 | 角色能力面板。 |
| `risk` | 是 | 否 | 风险解析器 | 高危状态、金钱风险和玩家提示文案。 |
| `actions` | 是 | 否 | `resolveActionAvailability(state)` | 分组后的行动按钮、可用性、置灰原因和收益预览。 |
| `interaction` | 是 | 可 | 当前阻塞交互派生 | 弹窗是否阻塞、类型、标题、选项数量和队列数量。 |
| `pendingInteraction` | 是 | 可 | `GameState.pendingInteraction` 规范化 | 弹窗标题、正文、选项、禁用状态、原因和 delta。 |
| `logs` | 是 | 可 | 最近日志 | 最近行动、事件、结算和 delta。 |
| `reviews` | 是 | 可 | 最近评图记录 | 评图记录面板和结局摘要。 |
| `achievements` | 是 | 否 | 成就配置 + 解锁记录 | 结局与成就图鉴。 |
| `systems` | 是 | 否 | 系统入口契约和派生摘要 | 商店购物、竞赛投稿、考研升学、申请保研、考公考编、出国留学、实习与工作、转行、结局与成就、个人作品集与简历、建筑生的万里路；真实规则状态只做展示映射。 |
| `debug` | 否 | 是 | `GameState` 派生 | seed、rng、phase、最近 delta、弹窗队列等。 |
| `characterCandidates` | 是 | 否 | 角色候选 ID 映射 | 角色选择卡。 |
| `canReroll` / `rerollsRemaining` | 是 | 否 | 角色抽取状态 | 重抽按钮状态。 |
| `ending` | 是 | 可 | 结局 ID 映射 | 结局页和结束曲选择；包含稳定 `id`、标题、正文和分数，结局插画由 UI 按 `ending.id` 映射到 `asset-work/assets/images/ending-illustrations/`。 |

## 玩家可见字段

精细 UI 可以直接展示以下字段，但展示文案和布局可重新设计：

| 组件 | 必须读取字段 | 说明 |
|---|---|---|
| 开始后主标题 | `title`, `subtitle`, `phase` | `phase` 只用于选择展示结构，不直接当中文文案。 |
| 当前状态 | `calendar`, `meters`, `money`, `metrics`, `courseProgress`, `risk` | 精力、压力、余额、GPA、评图次数、课题进度和作品质量都来自 VM。 |
| 角色与课程 | `profile`, `attributes`, `calendar.topic` | 中文展示名和专属技能展示来自 VM / 配置映射，不用内部 ID。 |
| 本周行动 | `actions` | 按钮状态、置灰原因、收益预览必须来自 `actions`。 |
| 弹窗系统 | `interaction`, `pendingInteraction` | 阻塞状态、选项状态、禁用原因和 delta 均来自 VM。 |
| 日志和最近变化 | `logs`, `reviews` | 最近日志和评图记录不直接遍历完整 `GameState`。 |
| 商店购物 | `systems.shop` | 商品可用性、价格、限购和禁用原因来自 VM。 |
| 个人作品集与简历 | `systems.portfolio` | 最小版只展示作品集总分、当前课题状态、最近评图和简历素材。 |
| 竞赛投稿 | `systems.competition` | 展示投稿建议、投稿/获奖摘要或接入状态；不在 UI 内生成赛事结算；`semester_limit` 状态显示“本学期已投”，文字和状态框使用红色。 |
| 实习与工作 | `systems.internship` | 展示能力摘要、推荐状态、申请/进行中/完成摘要、建筑工作开放说明；不在 UI 内生成申请结算。 |
| 考研升学 | `systems.route` | 大五前说明候选方向和开放条件；大五后展示可参与或已正式参与状态；正式参与后标题旁用 `route.participation.label` 显示 `已正式参与xxxx`，当前入口文字和边框蓝色、非当前入口文字和边框红色，不泄露内部成功率。 |
| 申请保研 | `systems.route` | 大五前说明候选方向和开放条件；大五后展示可参与或已正式参与状态；正式参与后标题旁用 `route.participation.label` 显示 `已正式参与xxxx`，当前入口文字和边框蓝色、非当前入口文字和边框红色，不泄露内部成功率。 |
| 考公考编 | `systems.route` | 大五前说明候选方向和开放条件；大五后展示选调、考公、考编子方向状态，不泄露内部成功率。 |
| 出国留学 | `systems.route` | 大五前说明候选方向和开放条件；大五后展示可参与或已正式参与状态；正式参与后标题旁用 `route.participation.label` 显示 `已正式参与xxxx`，当前入口文字和边框蓝色、非当前入口文字和边框红色，不泄露内部成功率。 |
| 转行 | `systems.route` | 大五前说明候选方向和开放条件；大五后展示候选岗位和正式参与状态；正式参与后标题旁用 `route.participation.label` 显示 `已正式参与xxxx`，当前入口文字和边框蓝色、非当前入口文字和边框红色，不泄露内部成功率。 |
| 建筑生的万里路 | `systems.entries` 中 `id="wanli_road"` 的入口 | 大二上开放；展示开放条件、当前地点和地点事件入口。 |
| 系统入口菜单 | `systems.entries` | 入口状态、占位要求和 command 来源统一从 VM 读取。 |
| 音乐播放器 | `music` | VM 只给曲目和播放列表；播放进度、音量和本地文件选择属于 app 层 UI 状态。 |
| 结局与成就 | `ending`, `achievements`, `music` | 结局文本、图鉴解锁和结束曲状态来自 VM；结局主页面插画只按 `ending.id` 读取素材映射，不用图片文件名反推规则。 |

## 开发调试字段

以下字段只能在开发模式、调试面板或日志导出里展示：

| 字段 | 内容 | 限制 |
|---|---|---|
| `seed` | 初始随机种子 | 正式玩家 UI 不默认展示。 |
| `stateMeta.phase` | 内部阶段 ID | 玩家侧必须转译为中文阶段或标题。 |
| `stateMeta.version` | 存档版本 | 只用于存档恢复、迁移和调试。 |
| `stateMeta.endingId` | 内部结局 ID | 玩家侧展示 `ending.title`。 |
| `stateMeta.modalQueueLength` | 弹窗队列长度 | 玩家侧不需要看到内部队列。 |
| `debug.rngState` | 当前 RNG 状态 | 不进入正式 UI。 |
| `debug.modalQueue` | 队列中的弹窗类型和标题 | 只用于排查阻塞流程。 |
| `debug.lastDelta` | 最近结构化 delta | 玩家侧可看日志文本，不看内部对象。 |
| `debug.lastSource` | 最近结算 source | 不作为玩家文案。 |

## 行动状态契约

`actions` 是行动区唯一数据源。每个行动项至少包含：

| 字段 | 含义 |
|---|---|
| `id` | 稳定行动 ID，只作为 command 参数。 |
| `label` | 玩家看到的行动名。 |
| `group` | 行动分组。 |
| `state` | `available`、`disabled` 或经 VM 过滤后的非隐藏状态。 |
| `reason` | 置灰原因；按钮禁用文案必须读取这里。 |
| `preview` | 收益预览文案。 |
| `delta` | 结构化收益预览，用于 delta chip。 |
| `canInspect` | 可检查但不可执行的行动仍可打开详情，例如项目门槛。 |

精细 UI 禁止在行动按钮里重新判断：

- 当前是否有阻塞弹窗。
- 当前阶段是否能行动。
- 行动次数是否用完。
- 精力、压力、金钱高危是否置灰。
- 专属技能冷却和门槛。
- 外包、兼职或项目门槛。

## 弹窗契约

`pendingInteraction` 是当前阻塞弹窗唯一数据源。精细 UI 必须支持：

| 字段 | 用途 |
|---|---|
| `type` | 选择弹窗模板和 kicker。 |
| `title` | 弹窗标题。 |
| `body` | 弹窗正文。 |
| `delta` | 本弹窗直接展示的结算变化。 |
| `options[].id` | `modal-option` command 参数。 |
| `options[].label` | 选项按钮文案。 |
| `options[].body` | 选项说明或原因。 |
| `options[].state` | 选项是否可用。 |
| `options[].reason` | 选项禁用原因。 |
| `options[].delta` | 选项预览 delta。 |

`interaction.isBlocking` 为 `true` 时，精细 UI 应明确阻止背景行动继续触发。这个阻塞语义来自 `GameState.pendingInteraction`，UI 不得自己创建额外规则流程状态。

app shell 可以拥有不推进规则的临时 UI 状态，例如主题弹窗、系统弹窗、播放器展开和专属技能确认层。这类状态必须和 `pendingInteraction` 明确分离：不能改写 `interaction.isBlocking`，不能走 `modal-option`，不能应用数值、冷却、行动次数、随机或日志变化。专属技能确认层只有在玩家确认后，才派发既有 `perform-action` / `special_skill` 命令。

## 系统入口契约

`systems.entries` 是精细 UI 渲染系统入口菜单的通用列表。每个入口包含：

| 字段 | 含义 |
|---|---|
| `id` | 入口 ID。 |
| `label` | 展示名。 |
| `launchStatus` | `must_complete`、`launch_must_complete`、`minimum`、`static`、`placeholder`。 |
| `statusLabel` | 中文状态。 |
| `command` | UI 应派发的 command。 |
| `surface` | `start_and_game` 或 `game`。 |
| `copyRequirement` | 占位或最小版展示要求。 |
| `availability.state` | `available`、`disabled`、`placeholder`。 |
| `availability.reason` | 禁用或占位说明。 |

入口状态只服务 UI 展示、验收和后续排期，不参与游戏规则结算。

## 当前已补齐字段

本模块已在 `web-app/game/view-model.mjs` 中补齐：

- `stateMeta`
- `interaction`
- `systems.entries`
- `debug`

同时 `web-app/ui/render.mjs` 已补回游戏内 `保存` 系统入口，使 `system-entry-status.md` 的“保存必须完成”在当前 UI 中有可点击入口。

## 仍不应由 View Model 承担的内容

| 内容 | 原因 | 正确归属 |
|---|---|---|
| IndexedDB 读写细节 | 属于存储层，不是规则展示层。 | `storage` / app 层。 |
| 排行榜 API 请求状态 | 属于云端接口和降级展示。 | `api/leaderboard` / app 层。 |
| 音频当前秒数、音量、本地文件对象 | 属于浏览器播放状态。 | app 层音乐播放器状态。 |
| 外链真实 URL | 必须由配置提供，不能硬编码进 VM。 | 配置 / assets 层。 |
| 视觉 token、布局密度、动效 | 属于设计系统。 | `DESIGN.md` / CSS。 |

## 验收

- UI 可以只读 `toViewModel(state)` 完成主界面、弹窗、行动区、系统入口和图鉴的首版渲染。
- 所有行动按钮禁用和原因都来自 `vm.actions`。
- 商店商品禁用和原因来自 `vm.systems.shop.items`。
- 系统入口的占位、最小版和必须完成状态来自 `vm.systems.entries`；`system-entry-status.md` 只作验收口径，不在 UI 组件中复制入口表。
- 开发调试字段与玩家字段分离，不把内部 ID、RNG 或弹窗队列误当成正式玩家信息。
