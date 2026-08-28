# 技术架构与首版实现路径

最后更新时间：`2026-07-02 +08:00`

## 目的

本文只定义首版的技术实现边界、分层契约、存档方案、排行榜方案和部署方案。它是后续 UI 与游戏逻辑实现的工程依据。

- 不定义玩法流程、数值和内容文案。
- 不重复维护 UI 组件清单、系统入口状态或当前 UI 设计规范；这些读取 `../ui-work/README.md`。
- 玩法规则冲突时，仍按 `PRD.md -> systems.md -> numbers.md -> 内容文档` 处理。
- 技术实现冲突时，以本文为准。
- 当前可玩规则以 `web-app/game/*` 为标准；`simulator` 是迁移前的验证适配层，不是第二套规则源。若模拟器与 `web-app/game/*` 不一致，先记录问题，再按 `web-app/game/*` 对齐颗粒度。
- 首发部署约束以 `阿里云 ECS + Cloudflare 免费层` 为目标；除静态资源加载和排行榜外，正常游玩不依赖云端请求。
- 技术架构优先级固定为：`GitHub 联动自动化 > 低成本 > 玩家加载体验 > 环境分层演进`。当低成本与体验冲突时，首版优先选择不增加持续费用的性能优化。

## 当前定案

- 首版是网页游戏，桌面浏览器体验优先。
- 移动端浏览器可以打开网站，但不承载正式可玩主流程；手机端只渲染独立入口页，保留开场标题、作者/支持、排行榜、社区、公告和深浅主题入口，不输出结局与成就、读档、建档表单、音乐播放器、行动区、状态仪表、日志或角色课程。开始新游戏或读档进入游戏时提示玩家移步电脑端。
- 排行榜必须首发。
- 不做原生 App，不走 Unity / Godot / Phaser。
- 不做登录、账号、云存档、身份找回。
- 游戏主逻辑离线可运行。
- 浏览器本地保存完整游戏数据。
- 云端只保存排行榜最小摘要数据。
- 静态网站只部署在阿里云 ECS；图片、音乐、视频等大文件放在 `Cloudflare R2`，启动门国内段镜像到国内 CDN；排行榜 API 使用 `Cloudflare Workers`；排行榜数据使用 `Cloudflare D1`。
- 代码发布必须尽量通过 `GitHub` 联动自动化完成，避免手动部署成为常规流程。
- 当前阶段只维护 `main` 分支直接部署上线；`dev / staging / production` 三环境隔离是后续工程目标，不作为当前阶段阻塞项。
- 当前 `web-app` 承载已确定的玩家 UI 和当前可玩规则；`web-app/game/*` 是当前可玩规则标准，未来 `game-core` 必须从这套标准中抽取，而不是另起一套规则。
- 当前 `web-app` 与推荐的 `Vite + React + TypeScript` 正式栈是过渡关系：当前 UI 规范可以指导后续重构，但重构必须保持 `web-app/game/*` 已定规则颗粒度和现有页面语义。

## 当前阶段目标

当前阶段的目标是在已确定的玩家 UI 和可玩规则基础上，继续把可复用的规则内核、数据配置、存档和部署链路收口，保证后续架构迁移时现有工作不浪费。

阶段目标按优先级固定为：

1. 收口技术文档和规则边界。
2. 抽出可复用的 `game-core`。
3. 抽出稳定 ID 驱动的 `game-data`。
4. 用最小测试验证固定 seed、状态机、结算器和结局解析。
5. 保持当前已确定 UI 的完整可玩闭环。
6. 将临时存储迁移到正式 `IndexedDB`。
7. 接入排行榜与部署。

旧粗 UI 交接材料和独立预览脚手架不再作为维护入口。当前 UI 仍不承担规则定义；规则、结算、随机、路线和存档语义继续由 `web-app/game/*` 与后续正式 `game-core` 承担。

## 最佳实现路径

基于当前仓库，最佳路径不是继续维护一个“文档 + 模拟器 + 前端各一套逻辑”的结构，而是把可执行规则逐步收口到一套正式内核：

1. 从当前 `web-app/game/*` 中抽出可复用规则，形成正式 `game-core`；`simulator` 只保留验证适配层角色。
2. 把行动、事件、课程、路线、结局等内容收口为稳定 ID 驱动的 `game-data`。
3. 用 `Vite + React + TypeScript` 做单页 `web-app`，只通过视图模型和命令层连接规则。
4. 用 `IndexedDB` 做完整本地存档，`localStorage` 只保存轻量偏好。
5. 用 `Cloudflare Workers + D1` 只做排行榜接口与排行榜摘要存储。
6. 用 `Cloudflare R2` 托管图片、音乐、视频等大文件资源。

当前仓库里的 `simulator` 不能直接整块删除。它仍承担固定 seed 和路线目标验证，但不是当前可玩规则的权威来源。

迁移原则：

- 先保留当前 `web-app/game/*` 可执行规则和 `simulator` 验证能力，不能为了“整理结构”让可玩闭环或跑局能力断掉。
- 抽出 `game-core` 后，网页、测试和模拟脚本都必须读取同一套规则。
- 纯报告和研究型调参入口已删除；等网页正式接入 `game-core` 后，再删除不再需要的模拟壳。

## 推荐技术栈

- 语言：`TypeScript`
- 前端构建：`Vite`
- UI：`React`
- 动效：`GSAP`
- 本地存储：`IndexedDB`
- 轻量偏好：`localStorage`
- 静态网站：`阿里云 ECS + Nginx`，由阿里云 Flow 从 `main` 自动部署游戏主程序
- 大文件存储：`Cloudflare R2`，托管图片、音乐、视频
- 排行榜 API：`Cloudflare Workers`
- 排行榜数据库：`Cloudflare D1`，使用 SQLite 数据模型保存分数
- 备用排行榜数据库：若后续需要更复杂的后台查询、审计或统计，再评估 `Neon / Supabase Postgres`

## 环境与发布

当前阶段发布口径：

- 只维护 `main` 分支。
- `main` 触发阿里云 Flow，构建完成后自动部署正式站点。
- 当前不单独搭建 `dev`、`staging` 和 `production` 三套完整环境。
- 本地开发仍使用本地 dev server；本地测试不得手动写入生产排行榜数据。

后续目标环境分为三类：

- `dev`：本地开发环境，运行本地 Vite dev server，默认连接本地或测试用 Worker / D1，不写生产数据。
- `staging`：后续如需测试环境，使用独立阿里云站点和 Worker / D1 / R2 前缀。
- `production`：由 `main` 触发阿里云 Flow 部署，连接 production Worker、production D1 和 production R2 前缀。

发布原则：

- 静态主程序通过 `GitHub main -> 阿里云 Flow -> ECS` 自动部署；日常不手动上传 HTML / JS / CSS。
- Cloudflare Workers 首版允许用 Wrangler 手动发布，但正式流程应逐步沉淀为 GitHub Actions 自动发布。
- D1 schema 迁移必须使用版本化 migration 文件，避免只在控制台手改生产表结构。
- R2 资源使用版本化路径或内容哈希文件名；生产已发布资源原则上不做同名覆盖。
- 前端通过环境变量读取 Worker API 地址、R2 public base URL、构建环境和资源版本，不在 UI 组件中硬编码生产地址。
- 三环境建立后，`dev / staging / production` 的 `playerId`、排行榜和测试数据互不打通。

## 工程边界

推荐结构和职责：

- `game-core`：状态机、命令层、结算器、随机数、行动可用性、路线与结局解析。
- `game-data`：行动、事件、课程、角色、导师、商品、竞赛、实习、路线目标、结局和成就配置。
- `app/view-model`：把 `GameState` 转成 UI 可直接展示的数据结构。
- `app/ui`：页面、组件、弹窗和动画，只读视图模型，只 dispatch 命令。
- `storage`：本地存档读写、版本迁移、本地 `playerId` 和轻量偏好。
- `assets`：R2 托管资源的清单、版本号和加载策略。
- `api/leaderboard`：Workers 排行榜读取和提交接口。

运行时主链路固定为：

```text
玩家操作
-> app/ui dispatch 命令
-> game-core 校验命令并推进 GameState
-> game-core 产出新 GameState、delta 和日志
-> app/view-model 把 GameState 转成 UI 展示数据
-> app/ui 重新渲染
-> storage 在固定存档点写入 IndexedDB
```

排行榜链路固定为：

```text
结局结算完成
-> 本地计算排行榜总分
-> 玩家进入排行榜或提交分数
-> api/leaderboard 调用 Cloudflare Workers
-> Workers 校验并读写 D1
-> UI 展示榜单或降级提示
```

媒体资源链路固定为：

```text
app/ui 读取 assets 资源清单
-> 按 critical / lazy / ending 等等级加载 R2 资源
-> 加载失败时显示降级内容，不影响 GameState
```

如果首版不拆多包，也要在同一个前端工程里保持目录边界清楚，例如：

```text
src/
  game/
    core/
    data/
  app/
    view-model/
    ui/
  storage/
  assets/
api/
  leaderboard/
```

## 硬规则

- `GameState` 是唯一真相源。
- UI 不直接修改 `GameState`。
- `game-core` 不得依赖 React、DOM、浏览器事件、`localStorage`、`IndexedDB`、R2 资源地址或排行榜 API；这些只能在 `app / storage / assets / api` 层出现。
- UI 可以整体替换；替换 UI 不应导致规则、结算、事件抽取、路线判定或存档结构重写。
- 所有游戏推进操作都必须经过统一命令层。
- 所有数值变化都必须走统一结算器，并产出结构化 `delta` 与日志。
- 所有行动入口都必须由可用性解析器返回 `可用 / 置灰 / 隐藏`，UI 不复制条件判断。
- 所有随机事件、交互事件、模型周事件和路线相关弹窗都必须通过 `GameState` 中的阻塞交互或弹窗队列表达。
- 实习期间短事件虽然由实习周结算读取，也必须进入 `GameState.pendingInteraction / modalQueue`；不能只写入事件日志或数值日志。
- 弹窗处于阻塞状态时，游戏时间不得继续推进；玩家确认或选择后才允许进入下一步。
- 角色选择结果必须写入 `GameState`，至少包括 `selectedCharacterId`、学历背景、家庭背景、被动触发状态、专属技能冷却状态。
- 非数值状态变化，例如布尔标记、次数、冷却、限购、路线正式参与、成就解锁，也必须经过统一命令层并产生日志；成就解锁日志在 UI 中归入 `成就日志`，常驻商店购买日志归入 `购买日志`，均不混入 `行动日志` 或 `事件日志`；这些状态不强行伪装成数值 `delta`。
- 随机结果必须来自统一 seed 和 RNG。
- 行动、事件、路线、结局、成就等 ID 发布后保持稳定。
- 角色、背景、行动、事件、商品、模型材料、路线、结局等规则对象都使用稳定内部 ID；中文展示名不得作为存档键、统计键或规则判断键。
- 正式 `game-core` 中，保研路线 ID 使用 `recommendation`，考研路线 ID 使用 `postgrad_exam`；二者在结局组上同属升学路线组。
- 当前 `simulator` 仍是迁移前内核，升学考试验证主要落在 `postgrad_exam`；抽取正式 `game-core` 时必须补齐 `recommendation` 与 `postgrad_exam` 的拆分映射，不能把模拟器旧覆盖范围当成最终路线覆盖。
- 留学路线配置必须显式标记 `examType: none`。
- 正式游戏 UI 必须展示中文角色名、中文学历背景和中文家庭背景；内部 ID 只用于存档、配置、统计和规则判断。
- 展示文案不作为程序主键。
- 排行榜、R2 媒体资源和部署环境变量都不能参与规则判定；它们只服务展示、提交和发布。

推荐命令层至少包括：

- `startGame`
- `startWeek`
- `performAction`
- `chooseRouteTarget`
- `chooseContract`
- `resolveReview`
- `advancePhase`

## UI 接线边界

UI 是规则和流程的展示层，不是规则源。当前 `web-app` 已承载确定的玩家页面；后续正式工程化仍必须逐步迁移为读取 `game-core / game-data` 的 UI 层。
在迁移前，当前 UI 规范只约束展示、接线和维护顺序；若当前实现与目标技术栈不同，仍以“只读 VM、只派发 command、不改规则源”为判断标准。

UI 接线固定要求：

- UI 只读 view model，只 dispatch 命令。
- UI 不直接写 `GameState`，不复制行动、事件、路线或结局判定。
- 阻塞弹窗、弹窗队列和行动可用性都来自规则层产出的状态或 view model。
- UI 设计规范、命令映射、view model 合同、入口状态和开发前检查统一从 `../ui-work/README.md` 进入对应文档。
- UI 文档只约束展示、接线和维护顺序，不覆盖本文的工程边界，也不覆盖规则源文档。

## 边界检查结论

本轮检查本文本地存档章节、`../ui-work/fine-ui/development-contract.md` 和 `../ui-work/shared/ui-command-mapping.md` 后，当前架构口径一致：

- 状态机边界一致：`GameState.phase`、`pendingInteraction`、`modalQueue`、`weeklySettlementApplied`、`seed` 和 `rngState` 属于规则状态；主题、设置抽屉、系统弹窗展开、播放器进度和专属技能确认层属于 app shell 状态。
- 存档边界一致：正式存档保存完整 `GameState` 和只读 `summary`；`summary` 只服务存档列表、继续游戏和调试展示，不参与规则判定。
- View Model 边界一致：`toViewModel(GameState)` 是展示投影，可以暴露 `systems.entries`、行动可用性、弹窗数据和开发调试字段，但不能承担读写 IndexedDB、请求排行榜、控制音频秒数或定义视觉 token。
- UI command 边界一致：会改变数值、流程、随机、成就、路线、结局或存档语义的操作必须进入命令层；只影响壳层的操作可以留在 app shell，但不能写入 `GameState`。
- 过渡状态已明确：当前 `web-app` 中 `localStorage` 整局保存、`app.mjs` 持有 `state`、`advanceGameFlow` 自动收束阶段等做法只允许作为正式存档和正式 `game-core` 抽取前的过渡实现；正式实现必须收口到 `game-core / game-data / app/view-model / storage`。

## 本地存档

本节现在作为存档字段、版本、迁移、恢复阶段和失败提示的唯一技术来源。

本节只定义从当前临时 `localStorage` 整局保存迁移到正式 `IndexedDB` 本地存档的字段、版本、迁移和 UI 提示口径。

### 结论

- 正式首版完整存档使用 `IndexedDB`，不再把整局 `GameState` 扩展保存在 `localStorage`。
- `GameState` 仍是单局游戏唯一真相源；存储层只保存和恢复它，不新增第二套规则状态。
- `localStorage` 只保存轻量偏好和最近存档索引，例如主题、音量、动效偏好和 `lastSaveId`。
- 存档版本分三层：`GameState.version`、存档包版本、IndexedDB 数据库结构版本，三者不能混用。
- 读档必须恢复到可解释阶段：当前阶段、当前阻塞弹窗、弹窗队列和 RNG 状态必须一起恢复。

当前 `web-app/app.mjs` 使用 `SAVE_KEY = "twenty-fifth-hour-docs-core-v1"` 将整局状态写入 `localStorage`，这只保留为迁移输入和试玩壳过渡方案。轻量维护可以继续通过现有 `saveState()` / `loadSave()` 读写这个过渡键，但不得新增第二个完整 `GameState` 的 `localStorage` key。

### 与技术架构的边界对齐

本方案与 `technical-architecture.md` 的状态机和 UI 接线边界一致：

- 存储层只负责保存、迁移、校验和恢复 `GameState`，不新增第二套规则状态，也不猜测缺失流程。
- `phase`、`pendingInteraction`、`modalQueue`、`seed` 和 `rngState` 必须随 `state` 一起恢复；读档不能恢复到 UI 半开或命令执行一半的状态。
- `summary` 是从 `state` 派生的只读摘要，只服务存档列表、继续游戏按钮和调试定位；不能反向覆盖 `GameState`。
- 系统入口弹窗、设置面板、播放器展开、保存按钮 loading 等属于 app shell 或 storage UI 状态，不写入 `GameState`。
- 排行榜待提交、本地排行榜总分、跨局图鉴和本地匿名 `playerId` 属于 IndexedDB 的跨局/玩家记录；`localStorage` 只保留轻量偏好和最近存档索引。

### 存储分工

| 数据 | 正式存储 | 原因 |
|---|---|---|
| 当前 `GameState` | `IndexedDB.saves.state` | 单局完整真相源，体积会增长，必须支持版本迁移。 |
| 当前阶段 `phase` | `GameState.phase`，并冗余到 `saves.summary.phase` | 恢复规则读 `GameState`；列表展示读摘要。 |
| 当前阻塞弹窗 | `GameState.pendingInteraction` | 弹窗是规则阻塞状态，不能只存在 UI 内存。 |
| 弹窗队列 | `GameState.modalQueue` | 保证多弹窗恢复顺序不丢失。 |
| 周结算防重入状态 | `GameState.weeklySettlementApplied` | 周结算中弹出的实习短事件或实习完成弹窗恢复后，不能重复扣生活费、重复结算实习或重复写日志。 |
| RNG 状态 | `GameState.rngState` 和 `GameState.seed` | 保证固定 seed 和读档后随机可复现。 |
| 商店购买记录 | `GameState.achievementTally.purchasedShopItemIds`、`shopPurchases`、`shopEffects` | 限购只约束当前单局，但必须随当前存档恢复。 |
| 单局成就与结局计分状态 | `GameState.unlockedAchievements`、`achievementScore`、`endingScore`、`endingRepeatScore`、`achievementTally` | 本局弹窗和结局页需要恢复；未达成人生结局前只作为本局暂计，不写入跨局排行榜。 |
| 跨局成就图鉴 | `IndexedDB.collection.unlockedAchievementIds` | 新游戏后仍保留的成长成就收录。 |
| 人生结局记录 | `IndexedDB.collection.endingRecords` | 支持首次计分和重复达成记录。 |
| 本地排行榜总分 | `IndexedDB.collection.totalScore` | 只由已提交的成长成就分、人生结局分、重复结局折算分组成；作品集总分不计入；中途放弃的本局暂计不提交。 |
| 本地匿名玩家 ID | `IndexedDB.player.playerId` | 排行榜最小身份，不做登录和云存档。 |
| 玩家昵称、大学名称 | `GameState.profile`，并冗余到 `saves.summary` 和 `player.latestProfile` | 单局剧情读 `GameState`；存档列表和排行榜提交读摘要。 |
| 存档版本号 | `GameState.version`、`saves.envelopeVersion`、`dbVersion` | 分别处理规则迁移、存档包迁移和对象仓库迁移。 |
| 主题、音量、动效偏好 | `localStorage` | 轻量设置，不影响规则恢复。 |
| 最近存档索引 | `localStorage.lastSaveId` | 启动页快速判断继续哪一个存档。 |

### IndexedDB 结构

数据库名：`twenty-fifth-hour`

数据库结构版本：`1`

| object store | key | 用途 |
|---|---|---|
| `saves` | `saveId` | 自动存档和手动存档的完整单局存档包。 |
| `collection` | 固定键 `global` | 跨局结局、成就、本地排行榜总分和重复达成记录。 |
| `player` | 固定键 `local` | 本地匿名 `playerId` 和最近一次玩家展示资料。 |
| `migrationLog` | 自增键 | 记录从旧 `localStorage` 或旧版本 IndexedDB 迁移的结果。 |

`saves` 建议索引：

| index | 字段 | 用途 |
|---|---|---|
| `updatedAt` | `updatedAt` | 读取最近存档。 |
| `kind` | `kind` | 区分 `auto` 和 `manual`。 |
| `phase` | `summary.phase` | 调试和恢复检查。 |

### 存档包字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `saveId` | string | 是 | 稳定存档 ID。默认自动档可用 `auto-main`，手动档可用 `manual-{timestamp}`。 |
| `kind` | `"auto" \| "manual" \| "migrated"` | 是 | 写入来源。 |
| `envelopeVersion` | string | 是 | 存档包版本，首版为 `save-envelope-v1`。 |
| `gameSaveVersion` | string | 是 | 来自 `GameState.version`，当前 `web-app` 为 `docs-core-v2`。 |
| `runId` | string | 是 | 当前单局 ID，用于跨局 collection 提交幂等，防止同一局重复加分。 |
| `createdAt` | ISO string | 是 | 存档创建时间。 |
| `updatedAt` | ISO string | 是 | 最近写入时间。 |
| `writeReason` | string | 是 | 写入点，例如 `manual_save`、`week_start`、`week_end`、`before_review`、`after_review`、`route_joined`、`before_ending`。 |
| `state` | `GameState` | 是 | 完整游戏状态。 |
| `summary` | object | 是 | 存档列表和继续游戏按钮使用的只读摘要。 |

`summary` 只服务 UI 展示，不参与规则判定：

| 字段 | 来源 |
|---|---|
| `nickname` | `state.profile.nickname` |
| `universityName` | `state.profile.universityName` |
| `phase` | `state.phase` |
| `year`、`term`、`semesterIndex`、`week`、`weekInSemester` | `GameState` 同名字段 |
| `actionsRemaining` | `state.actionsRemaining` |
| `pendingInteractionType` | `state.pendingInteraction?.type ?? null` |
| `modalQueueLength` | `state.modalQueue.length` |
| `ending` | `state.ending` |
| `energy`、`pressure`、`money`、`gpa`、`progress`、`quality`、`portfolio` | `GameState` 同名字段 |
| `lastLogMessage` | `state.logs.at(-1)?.message ?? ""` |

### 跨局记录字段

`collection/global`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `collectionVersion` | string | 首版为 `collection-v1`。 |
| `unlockedEndingIds` | string[] | 首次解锁的人生结局 ID。 |
| `endingRecords` | object[] | 每次达成人生结局的记录，包含 `endingId`、`runId`、`scoreAwarded`、`finishedAt`；同一人生结局第 `3` 次及以后重复达成仍记录，但 `scoreAwarded = 0`。 |
| `unlockedAchievementIds` | string[] | 已收录成长成就 ID。 |
| `achievementRecords` | object[] | 成就首次解锁记录，包含 `achievementId`、`runId`、`scoreAwarded`、`unlockedAt`。 |
| `achievementScore` | number | 已提交的成长成就分，同一成长成就只累计一次。 |
| `endingScore` | number | 首次解锁的人生结局分。 |
| `endingRepeatScore` | number | 重复达成人生结局的 `50` 分折算累计；同一人生结局最多只有前 `2` 次重复达成计分。 |
| `totalScore` | number | 本地排行榜总分，公式为已解锁成长成就分 + 已解锁人生结局分 + 重复达成人生结局折算分。 |
| `scoreVersion` | string | 排行榜提交口径版本，和结局计分规则一起升级。 |
| `actionTally` | object | 已达成人生结局的历史局行动次数累计；供未写 `单局累计` 的行动类成长成就读取。 |
| `shopPurchaseCounts` | object | 已达成人生结局的历史局商店购买次数累计；供 `游戏中累计购买` 类成长成就读取。 |
| `committedRunIds` | string[] | 已提交到 collection 的单局 ID，防止读档或重复保存导致同一局重复加分。 |
| `updatedAt` | ISO string | 最近更新。 |

`player/local`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `playerId` | string | 首次启动时本地生成；不含真实身份。 |
| `createdAt` | ISO string | 生成时间。 |
| `latestProfile` | object | 最近一次开局昵称和大学名称，用于排行榜提交预填展示资料；不反向作为新开局默认值。 |

### localStorage 只保留

| key | 内容 |
|---|---|
| `twenty-fifth-hour-theme` | `light` 或 `dark`。 |
| `twenty-fifth-hour-volume` | 主音量、音乐音量、音效音量、静音。 |
| `twenty-fifth-hour-motion` | 动效减弱偏好。 |
| `twenty-fifth-hour-last-save-id` | 最近一次成功写入 IndexedDB 的 `saveId`。 |
| `twenty-fifth-hour-privacy-seen` | 是否看过隐私提示。 |

禁止新增 `localStorage` key 保存完整 `GameState`、结局图鉴、本地排行榜总分、排行榜待提交数据或规则状态。

### 版本与迁移

| 版本 | 示例 | 升级时机 | 处理者 |
|---|---|---|---|
| IndexedDB `dbVersion` | `1` | 新增或修改 object store、index | `storage` 层 `onupgradeneeded`。 |
| `envelopeVersion` | `save-envelope-v1` | 存档包外层字段变化 | `storage` 层迁移函数。 |
| `GameState.version` | `docs-core-v2` | 规则状态字段、稳定 ID 或配置迁移 | `game-core` 的 `reviveState` 和专用迁移表。 |
| `scoreVersion` | `score-v3` | 结局和成就计分口径变化 | 图鉴/排行榜提交层。 |

迁移顺序固定：

1. 打开 IndexedDB，完成数据库结构升级。
2. 若存在旧 `localStorage` 整局存档 `twenty-fifth-hour-docs-core-v1`，读取但不立即删除。
3. `JSON.parse` 成功后调用 `reviveState(raw)`，让规则层补齐缺省字段。
4. 写入 `saves`，`kind = "migrated"`，`writeReason = "localStorage_migration"`。
5. 写入成功后设置 `twenty-fifth-hour-last-save-id`。
6. 迁移成功并经过一次 IndexedDB 读回校验后，才允许删除旧整局 `localStorage` key。
7. 任一步失败都写入 `migrationLog`，旧 `localStorage` 存档保留，启动页显示迁移失败提示。

迁移不负责修正规则冲突；如果 `reviveState` 无法恢复为合法状态，迁移层只能报告失败，不能猜测阶段或重建弹窗。

### 写入点

正式自动存档写入点沿用技术架构：

| 写入点 | `writeReason` | 最低要求 |
|---|---|---|
| 每周开始 | `week_start` | `phase` 已进入 `week_action`，行动次数和周数已确定。 |
| 每周结束 | `week_end` | 周结算已完成或进入可解释阻塞弹窗。 |
| 评图前 | `before_review` | 进入评图命令前，避免评图链路失败丢进度。 |
| 评图后 | `after_review` | 评图结果、GPA、作品集和日志已写入。 |
| 路线正式参与后 | `route_joined` | 路线选择状态已进入 `GameState`。 |
| 结局结算前 | `before_ending` | 结局前最后可恢复点，排行榜失败不得影响本地结局。 |
| 玩家手动保存 | `manual_save` | 保存当前完整 `GameState`，不推进规则。 |

当前 `web-app` 的 `saveState()` 可以先迁移为手动保存和命令后保存；正式 `game-core` 落地后再收窄到固定自动存档点。

### 读档恢复阶段

读档流程：

1. 读取 `lastSaveId`；若不存在，读取 `saves.updatedAt` 最新记录。
2. 校验存档包必填字段。
3. 按 `envelopeVersion` 迁移存档包。
4. 调用 `reviveState(save.state)` 恢复 `GameState`。
5. 校验 `phase`、`pendingInteraction`、`modalQueue` 和 `rngState` 是否可解释。
6. 用恢复后的 `GameState` 生成 view model，再渲染 UI。

允许恢复的关键阶段：

| 阶段 | 恢复要求 |
|---|---|
| `character_select` | 角色候选、重抽次数、玩家档案存在。 |
| `fixed_event` | `pendingInteraction.type = "fixed_event"` 或能由当前固定事件索引恢复。 |
| `mentor_select` | 候选导师 ID 存在，弹窗仍阻塞。 |
| `course_select` | 当前学年课程候选存在，弹窗仍阻塞。 |
| `year_start` | 大二起的学年开始提示仍阻塞；确认后进入后续流程。学年开始确认按钮显示对应学年，例如 `进入大二学年`。 |
| `week_action` | 行动次数、周数、可用性和 RNG 状态完整。 |
| `wanli_road_event` | 玩家已从万里路地图点击前往地点，但尚未确认事件结算；恢复后仍显示该地点事件弹窗。 |
| `model_material` | `pendingInteraction.type = "model_material"`，本学期材料选择状态完整。 |
| `week_settlement` | 仍处于周结算或其阻塞弹窗，不能跳过未确认事件；大二上第 `3` 周结算完成后、进入第 `4` 周前可阻塞万里路开放提醒。 |
| `course_exam` | 当前题目、已答题记录和课程状态完整。 |
| `review` | 汇报策略、反馈弹窗或评图结果弹窗完整。 |
| `summer_event` | 暑假事件弹窗和后续选择完整。 |
| `ending` | `ending` ID 存在，结局展示和本地计分可继续。 |

禁止恢复为“UI 半开但 `GameState.pendingInteraction` 为空”的状态。系统入口弹窗、设置面板和支持页面属于 UI 状态，不写入 `GameState`；读档后默认关闭。

### UI 状态与提示文案

精细 UI 需要区分保存、读档、恢复和失败：

| 场景 | UI 状态 | 文案 |
|---|---|---|
| 正在保存 | 保存按钮禁用，显示轻量进度 | `正在保存本地进度...` |
| 保存成功 | 弹窗反馈；标题前显示存档图标；弹窗宽度在随机事件弹窗基础上略收窄，间距、标题字号、标题图标尺寸和正文字号对齐随机事件弹窗规范；正文框占满弹窗内容宽度并保留稳定左右留白；返回按钮使用长按钮并与正文框同宽；第二句必须单行展示，且两句字号一致 | `游戏存档会自动存储于浏览器缓存中，无需手动保存。` / `为避免存档丢失，请勿清除本网站的浏览器缓存的数据文件。` |
| 自动保存成功 | 低优先级提示 | `自动保存完成。` |
| 保存失败，内存状态仍在 | 保留当前页面，提供重试 | `这次没有写入本地存档，但当前进度还在页面中。请先不要关闭浏览器，可以重试保存。` |
| 浏览器禁用 IndexedDB | 阻塞提示，允许继续试玩但标明风险 | `浏览器当前无法使用本地存档。你可以继续试玩，但关闭页面后可能丢失进度。` |
| 正在读档 | 启动页或按钮 loading | `正在读取本机存档...` |
| 读档成功 | 进入游戏后轻提示 | `已恢复上次进度。` |
| 没有存档 | 继续按钮置灰 | `本机还没有可继续的存档。` |
| 读档失败 | 不覆盖当前内存状态，提供新游戏和重试 | `这个存档暂时无法读取。当前页面进度没有被覆盖，可以重试或开始新游戏。` |
| 旧 localStorage 迁移成功 | 只提示一次 | `已把旧存档迁移到新的本地存档。` |
| 旧 localStorage 迁移失败 | 保留旧 key，提示恢复路径 | `旧存档迁移失败，原始存档仍保留在浏览器中。请不要清理站点数据，稍后重试。` |

提示必须用 `aria-live="polite"` 或等价方式被读屏软件感知；失败提示需要可见文本，不能只依赖颜色。

### 验收清单

- `localStorage` 不再新增整局状态字段。
- 启动页继续游戏读取 IndexedDB，而不是读取旧 `SAVE_KEY`。
- 从旧 `SAVE_KEY` 迁移成功后，能读回同一个 `phase`、`pendingInteraction`、`modalQueue` 和 `rngState`。
- 读档后角色选择、周行动、模型材料、课程题、评图、暑假事件和结局阶段均可继续。
- 商店限购、已购记录、成就解锁记录、待展示成就提示、结局记录和本地排行榜总分不会因新游戏或读档丢失语义。
- IndexedDB 写入失败时不清空当前内存 `GameState`，并给玩家明确重试提示。
- 排行榜接口失败不影响 IndexedDB 本地结局、成就和排行榜总分记录。

## 排行榜

排行榜首发只做总分榜。

展示：

- 榜单列表：当前 Worker 上限 `20`，游戏端预览请求 `10`；若首发确认需要 `Top 100`，先同步 Worker 上限、接口契约和 UI 容器。
- 我的当前排名
- `昵称 / 大学名称 / 总分`

总分口径读取 `endings.md`：已解锁成长成就分 + 已解锁人生结局分 + 重复达成人生结局折算分，不包含作品集总分。

提交规则：

- 每个本地匿名 `playerId` 只保留一个历史最高总分
- 只有本地排行榜总分更高时才更新
- 失败局也允许提交排行榜分数；排行榜读取的是本地累计的排行榜总分，不只读取成功通关局
- 中途放弃学业重新开始时，只删除当下该局的本地存档，不删除之前的存档或已提交到图鉴的跨局记录；当下该局的所有记录不提交 collection，不写入跨局记录，该局触发过但未随人生结局提交的成长成就、累计次数和排行榜分数不计入排行榜
- 提交失败不阻塞游戏
- 可在本地记录待提交状态，联网后重试
- 首版接受轻度作弊风险，只做最小字段校验、分数版本校验和限流，不做复杂反作弊。

云端最小字段：

- `playerId`
- `nickname`
- `universityName`
- `totalScore`
- `scoreVersion`
- `createdAt`
- `updatedAt`

接口固定为：

- `GET /leaderboard/top`
- `GET /leaderboard/me?playerId=...`
- `POST /leaderboard/score`

## 为什么仍然需要一点“后端”

虽然这不是传统后端项目，但只要排行榜首发，就不能让前端直接连数据库。

正确形态是：

- 前端只请求排行榜接口
- `Cloudflare Workers` 做最小校验、限流和写库
- `Cloudflare D1` 只存排行榜摘要

这层很薄，但必须存在。

## 部署

- `阿里云 ECS + Nginx`：静态网站，承载 HTML / JS / CSS、启动字体子集、加载页壳层和少量站点源高优先资源
- `Cloudflare R2`：优化后的图片、音乐、视频、剧情大图、作品集大图和结局图等版本化资源
- `Cloudflare Workers`：排行榜 API，负责提交和获取分数
- `Cloudflare D1`：排行榜数据，保存分数摘要

数据流固定为：

```text
玩家访问 `arch.25thgame.vip`
-> 加载 HTML / JS / CSS 游戏主程序
-> 完成启动页 WOFF2 字体子集门槛
-> 显示加载页并完成启动门槛图片图标和启动门 BGM 预热
-> 进入开始页或游戏页面
-> 游戏页面先重试启动门剩余失败资源
-> 游戏页面后台连续预热后续音乐、普通结束曲、歌词、结尾动画页和动画运行时依赖
-> 游戏代码按阶段从国内 CDN 或 R2 拉取尚未命中的媒体资源
-> 游戏结束或查看榜单时调用 Workers API
-> Workers 读写 D1 数据库
```

部署约束：

- 游戏主循环、行动结算、事件抽取、路线判定和结局读取必须在浏览器本地完成。
- 正常游玩过程中不得每周请求云端；排行榜只在读取榜单、结局提交分数或重试待提交分数时请求。
- 排行榜接口失败不影响继续游戏、读档、结局展示或本地分数累计。
- 免费部署优先，不能引入必须常驻运行的服务端进程。
- R2 资源加载失败不得破坏游戏主流程；关键文案、规则和结局判定不能依赖远程媒体资源。

加载体验约束：

- 页面刚打开时立即显示加载页；启动页 WOFF2 字体子集和加载页小图允许在有界时间内准备，完整游戏字体在加载页出现后后台排队。
- 加载页必须等待核心启动门资源：开始页背景、最终 UI 图标 atlas `1` 张、支持二维码 `2` 张、角色卡背面、开局固定事件图、失败结局插图 `5` 张、创业结局插图 `1` 张、大一上/大一下作品集展板 `2` 张、暑假写生图，以及大一学年首曲 `1` 首 BGM。其余大一曲目 `7` 首和失败结局绑定曲 `5` 首进入游戏后按低优先级队列预热，但仍走国内 CDN。UI atlas 覆盖 `confirmed-icons` 与 `unmapped-icons` 下的 `728` 个最终 UI 源图，源图到 atlas 坐标必须由 manifest 校验。
- 本地存在“启动门已完成”标记时，仍必须复用同一份启动门清单做一次本次会话解码/可播校验；该标记只能缩短等待，不能跳过本次首屏视觉校验。
- 启动门资源使用有界重试；首次启动以 `12` 秒为目标等待预算，`30` 秒是不可突破的最终上限。失败或超时项不能让加载页永久卡住，且不能写入启动门完成标记，进入游戏后优先后台重试。阿里云国内 CDN 资源失败时重试同一国内 CDN URL，不切换到 R2；原本走 R2 的资源则重试 R2 URL。
- 玩家进入游戏页面后，后台立即连续预热后续学年音乐、结尾动画页和可枚举后台图片；本局普通结束曲和歌词在结局曲选定后预热，不等玩家临近系统才首次请求。
- 加载页壳层和启动字体子集留在阿里云站点源；阿里云生产入口中，启动门国内段和启动门 BGM 走国内 CDN 镜像，其中包含支持二维码、失败结局插图、创业结局插图和大一上/大一下作品集展板；其他普通/路线结局插图和结尾回忆场景图仍走 R2。远程资源变慢时加载页必须稳定展示并持续反馈进度。
- R2 媒体资源必须经过压缩和格式选择；图片优先使用 `webp / avif`，音频优先使用适合网页播放的压缩格式。
- 资源清单必须区分 `font-gate`、`startup-gate`、`background-all`、`current`、`next`、`ending` 和 `optional` 等加载等级。
- 运行时资源缓存、音频预热和结尾动画预取策略读取 `runtime-resource-cache-strategy.md`；其目标是保证玩家体验丝滑、不卡顿，不改变规则结算和排行榜边界。
- 排行榜请求不得阻塞结局展示；榜单可以延迟加载或失败降级。
- IndexedDB 读写失败时必须给出可理解提示，并尽量保留当前内存中的游戏进度。

成本约束：

- 首版不得引入需要常驻服务器进程的服务。
- 首版不得引入会随玩家在线时长线性增长的云端请求；游戏主循环必须本地完成。
- 大文件走 R2，阿里云启动门国内段可镜像到国内 CDN，启动字体子集和加载页壳层留在阿里云站点源，避免把媒体资源塞进主站构建包导致部署和加载不可控。
- Workers 和 D1 只承载排行榜最小读写，不承载每周结算、事件抽取或存档同步。

首版不需要更重的服务端框架。

## 开发顺序

1. 固化 `GameState`、命令层、结算器、RNG、日志和存档版本边界。
2. 从当前 `web-app/game/*` 抽出正式 `game-core`，并保持固定 seed 跑局能力不断。
3. 把配置抽成 `game-data`，用稳定 ID 对齐文档，不再让展示文案承担规则键。
4. 建立 `Vitest` 或等价脚本验证：固定 seed、状态机、结算器、结局解析和阻塞弹窗。
5. 起 `Vite + React + TypeScript` 网页壳，只通过视图模型和命令层连接规则。
6. 保持当前已确定 UI 的完整可玩闭环，不把表现层改动带入规则层。
7. 接入 `IndexedDB` 存档与版本迁移，并验证读档恢复关键阶段。
8. 整理图片、音乐、视频资源清单，并接入 `Cloudflare R2`。
9. 建立当前 `main -> production` 所需环境变量、D1 migration、R2 资源路径和 Worker 发布脚本。
10. 接入排行榜 `Cloudflare Workers + D1`。
11. 最后做 UI 打磨、动画、移动端入口降级、加载性能和错误降级检查。

## 最小测试策略

首版不追求大而全的测试矩阵，但核心逻辑必须先能被脚本验证。

必须覆盖：

- 固定 seed 从开局稳定推进到结局。
- 同一 seed 下随机事件、考试抽题、实习录取、留学申请和岗位投递结果可复现。
- 所有数值变化都经过统一结算器并产生日志。
- UI 可用性解析器能返回 `可用 / 置灰 / 隐藏` 和原因。
- 随机事件弹窗未确认时，周推进和行动入口被阻塞。
- 结局只能由统一结局解析器读取。
- 存档写入后读档，关键阶段能恢复到合法 `GameState`。
- 排行榜接口失败时，结局展示和本地分数累计不受影响。

测试文件可以先服务迁移和 smoke test，不要求首版形成复杂测试框架；但不能只靠手点 UI 验证规则。

## 首版验收清单

- 固定 seed 可以从开局稳定跑到结局。
- 推送 `main` 后能通过 GitHub 联动自动部署生产站点，生产发布不依赖手动上传静态文件。
- 后续建立三环境后，`dev / staging / production` 分别连接隔离的排行榜数据源，测试数据不会污染生产榜单。
- UI 的所有推进操作都经由命令层；UI 不直接写 `GameState`，不复制规则判断。
- 存档使用 `IndexedDB` 保存完整 `GameState`，读档后能恢复周行动、弹窗、评图和结局前等关键阶段。
- R2 媒体资源加载失败时，游戏主流程、规则判定和结局展示不被破坏。
- 排行榜接口失败时，结局展示、本地累计分和继续游戏不被阻塞。
- 随机事件、后期路线、考试、模型周、商店、高危状态和结局读取等玩法验收读取 `systems.md / numbers.md / endings.md`，本文不重复维护。

## 当前仓库的处理建议

- 保留：规则内核、固定 seed 验证、最小 smoke test
- 可逐步删除：网页接入 `game-core` 后剩余的模拟壳和调参策略
- 不要删除：当前 `web-app/game/*` 可执行规则实现，以及抽核前仍有验证价值的模拟适配层
- 当前 `web-app`：保留为玩家页面和交互验证入口，但不能扩成第二套规则源；后续应迁移为读取正式 `game-core / game-data` 的 UI 层。

## 非目标

首版不做：

- 登录与账号系统
- 复杂反作弊
- 好友榜、赛季榜、多榜单
- 后台管理系统
- 原生 App
- 云存档

## 一句话结论

这款游戏的首版最佳实践是：

**一个部署在阿里云 ECS 的离线优先网页游戏，一个本地 `IndexedDB` 存档层，一组托管在 `Cloudflare R2` 的大文件资源，一个极薄的 `Cloudflare Workers + D1` 排行榜接口，以及一套从当前 `web-app/game/*` 抽出来的正式规则内核。**
