# 文档入口

本文是文档权威入口和冲突处理索引，不维护规则正文。

`docs/` 只放游戏规则、内容源和长期技术方案。UI 交接、PNG 生成、素材清单和图片映射分别放在 `../ui-work/` 与 `../asset-work/`。

## 权威入口

| 领域 | 权威入口 | 职责 |
|---|---|---|
| 产品登记 | `../PRODUCT.md` | 根目录产品登记入口；不维护规则正文。 |
| 术语 | `../CONTEXT.md` | 领域词汇、推荐用语和弃用叫法；不记录数值、实现或内容清单。 |
| PRD | `PRD.md` | 产品定义、目标玩家、气质、系统边界、界面原则和开发冻结口径。 |
| 系统 | `systems.md` | 流程、状态机、系统关系、入口开放、结局读取顺序和简历写入边界。 |
| 数值 | `numbers.md` | 值域、行动收益、评图、竞赛、路线门槛、概率、结算表和调参目标。 |
| 内容 | `content-plan.md`、`events.md`、`endings.md`、`question-banks.md` | 角色、导师、课程、院校、岗位、事件、结局、成就、题库和展示文案。 |
| 技术 | `technical-architecture.md`、`development-environment.md`、`runtime-resource-cache-strategy.md` | 工程结构、开发环境、存档、排行榜、部署、接口、运行时资源缓存、媒体播放、测试边界和专项技术方案。 |
| 运维 | `../deploy/README.md`、`aliyun-flow-ops.md` | 本机私有配置入口、凭据保管、恢复步骤和云效发布操作；不保存真实密钥。 |
| 监测屏 | `player-detection-monitor-contract.md`、`../ui-work/player-detection-ui/README.md` | 玩家检测屏的数据口径、接口契约、聚合粒度、前端接线边界和 UI 原型说明。 |
| UI | `../ui-work/README.md` | 当前 UI 设计规范、VM/command 映射、PNG 参考、组件颗粒度和开发前检查。 |
| 素材 | `../asset-work/README.md` | 音乐、图片、字幕、作品集展板、结局图、UI 图标、像素图提示词和素材映射。 |
| 校验 | `../simulator/README.md` | 模拟器用途、命令和最近校验结论；只记录待审核调参问题。 |
| 历史 | `decisions.md` | 仍有解释价值的历史背景；不替代当前权威入口。 |

## 维护规则

- 改动应落到对应权威入口；其他文档只引用入口，不复制整段规则、数值表、内容正文或素材清单。
- PRD 只写产品口径和冻结边界；系统流程写入 `systems.md`；数值、概率、门槛和结算写入 `numbers.md`。
- 事件、结局、题库和展示文案写入对应内容文档。
- 技术实现、部署、存档和接口写入 `technical-architecture.md` 或对应专项技术方案。
- 玩家检测屏的数据口径和接口契约写入 `player-detection-monitor-contract.md`，页面结构与视觉说明写入 `../ui-work/player-detection-ui/README.md`。
- UI 和素材交接不写入 `docs/`；如会改变玩法规则、数值、路线门槛或结算，先回到对应规则源确认。
- 已拍板的事件标题、结局标题、属性名、路线名和正文内容不直接改写；若发现冲突，先集中确认。
- 例外：导师阶段任务表的判定条件、奖励和处罚随导师文本维护在 `content-plan.md`，并由 `numbers.md` 引用。

## 冲突处理

玩法、数值和内容冲突按以下顺序处理：

1. `PRD.md`
2. `systems.md`
3. `numbers.md`
4. 内容文档

技术实现冲突按以下顺序处理：

1. `technical-architecture.md`
2. 当前实现与校验记录

表现交接冲突按以下顺序处理：

1. `../ui-work/README.md` 或 `../asset-work/README.md`
2. 对应专项交接文档、映射表或素材 manifest
3. 当前文件资产

技术、UI、素材、模拟器和当前实现都不得覆盖 `PRD.md / systems.md / numbers.md` 已确定的玩法规则。`decisions.md` 只作历史解释；若与当前权威入口冲突，以当前权威入口为准。
