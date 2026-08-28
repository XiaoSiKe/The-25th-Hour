# 已确认 UI 图标规则

本文件记录本轮已经确认的 UIATLAS 图标映射。旧源切片目录已清理；本目录下的 `confirmed-icons/20-*` 到 `confirmed-icons/46-*` 是按实际 UI 语义归档后的确定图标。

本文件是确认规则明细，不维护工作状态、补图顺序或 UI 开发计划。目录入口读取 `README.md`，UI 使用入口读取 `../../ui-work/README.md`。

## 收束范围

- `UIATLAS_004`：周行动、接设计外包、校外兼职、评图汇报策略、模型周材料。
- `UIATLAS_005`：11 个角色头像与 7 个导师头像。
- `UIATLAS_006`：7 个导师阶段任务。
- `UIATLAS_007`：10 门课程图标。
- `UIATLAS_010`：竞赛赛事、投稿状态与奖项状态。
- `UIATLAS_011`：未来方向、岗位、实习、考试与回落状态。
- `UIATLAS_023`：学年 BGM、普通结束曲、失败绑定曲圆形专辑图。

## 颗粒度规则

- 文件夹按 UI 使用语义划分，而不是只按 atlas 原图划分。
- 一个文件夹只承载同一类 UI 控件或同一阶段的状态图标。
- 文件名保留 `稳定ID + 原始切片文件名`，便于从规则追溯到源图。
- 本规则文件中的条目状态均为 `confirmed`；已确认 atlas 的重复副本已从 `unmapped-icons/` 清理。

## 模块明细

### 20-week-actions

本周行动入口：基础周行动、外包/兼职入口和专属技能入口。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 001 | 学习AI和设计软件 | `pxui_action_001` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/001_学习AI和设计软件__UIATLAS_004_001_pxui_action_001_电脑.png |
| 002 | 阅读_展览_讲座 | `pxui_action_002` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/002_阅读_展览_讲座__UIATLAS_004_002_pxui_action_002_书.png |
| 003 | 方案推敲 | `pxui_action_003` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/003_方案推敲__UIATLAS_004_003_pxui_action_003_图纸.png |
| 004 | 场地调研 | `pxui_action_004` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/004_场地调研__UIATLAS_004_004_pxui_action_004_地图.png |
| 005 | 正常速度画图 | `pxui_action_005` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/005_正常速度画图__UIATLAS_004_005_pxui_action_005_图板丁.png |
| 006 | 爆肝通宵赶图 | `pxui_action_006` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/006_爆肝通宵赶图__UIATLAS_004_006_pxui_action_006_夜灯.png |
| 007 | 健身运动 | `pxui_action_007` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/007_健身运动__UIATLAS_004_007_pxui_action_007_哑铃.png |
| 008 | 社交聚餐娱乐 | `pxui_action_008` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/008_社交聚餐娱乐__UIATLAS_004_008_pxui_action_008_饭碗饮.png |
| 009 | 休养生息 | `pxui_action_009` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/009_休养生息__UIATLAS_004_009_pxui_action_009_床.png |
| 010 | 接设计外包 | `pxui_action_010` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/010_接设计外包__UIATLAS_004_010_pxui_action_010_合同.png |
| 011 | 校外兼职 | `pxui_action_011` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/011_校外兼职__UIATLAS_004_011_pxui_action_011_工牌零.png |
| 012 | 专属技能 | `pxui_action_012` | asset-work/ui-icon-final/confirmed-icons/20-week-actions/012_专属技能__UIATLAS_004_012_pxui_action_012_发光技.png |

### 21-outsourcing-project-options

接设计外包的项目选项，进入外包项目选择弹窗后使用。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 013 | 钢笔、马克笔代画 | `pxui_action_013` | asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/013_钢笔、马克笔代画__UIATLAS_004_013_pxui_action_013_钢笔.png |
| 014 | 描CAD底图 | `pxui_action_014` | asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/014_描CAD底图__UIATLAS_004_014_pxui_action_014_制图软.png |
| 015 | 手工模型代做 | `pxui_action_015` | asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/015_手工模型代做__UIATLAS_004_015_pxui_action_015_模型.png |
| 016 | SU拉体块【简单】 | `pxui_action_016` | asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/016_SU拉体块【简单】__UIATLAS_004_016_pxui_action_016_体块建.png |
| 017 | 效果图渲染 | `pxui_action_017` | asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/017_效果图渲染__UIATLAS_004_017_pxui_action_017_太阳.png |
| 018 | Rhino曲面建模【精细】 | `pxui_action_018` | asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/018_Rhino曲面建模【精细】__UIATLAS_004_018_pxui_action_018_曲面网.png |
| 019 | 一条龙方案代工 | `pxui_action_019` | asset-work/ui-icon-final/confirmed-icons/21-outsourcing-project-options/019_一条龙方案代工__UIATLAS_004_019_pxui_action_019_图纸.png |

### 22-part-time-project-options

校外兼职的项目选项，位于外包选项之后、评图策略之前。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 020 | 发传单 | `pxui_action_020` | asset-work/ui-icon-final/confirmed-icons/22-part-time-project-options/020_发传单__UIATLAS_004_020_pxui_action_020_箭头.png |
| 021 | 图书馆管理员 | `pxui_action_021` | asset-work/ui-icon-final/confirmed-icons/22-part-time-project-options/021_图书馆管理员__UIATLAS_004_021_pxui_action_021_书.png |
| 022 | 外卖小哥 | `pxui_action_022` | asset-work/ui-icon-final/confirmed-icons/22-part-time-project-options/022_外卖小哥__UIATLAS_004_022_pxui_action_022_外卖箱.png |
| 023 | 家教 | `pxui_action_023` | asset-work/ui-icon-final/confirmed-icons/22-part-time-project-options/023_家教__UIATLAS_004_023_pxui_action_023_黑板.png |

### 23-review-report-strategies

评图阶段汇报策略按钮。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 024 | 我就是大师 | `pxui_action_024` | asset-work/ui-icon-final/confirmed-icons/23-review-report-strategies/024_我就是大师__UIATLAS_004_024_pxui_action_024_聚光灯.png |
| 025 | 高级技术流 | `pxui_action_025` | asset-work/ui-icon-final/confirmed-icons/23-review-report-strategies/025_高级技术流__UIATLAS_004_025_pxui_action_025_参数节.png |
| 026 | 求求你别挂我 | `pxui_action_026` | asset-work/ui-icon-final/confirmed-icons/23-review-report-strategies/026_求求你别挂我__UIATLAS_004_026_pxui_action_026_双手合.png |
| 027 | 直接念 PPT | `pxui_action_027` | asset-work/ui-icon-final/confirmed-icons/23-review-report-strategies/027_直接念 PPT__UIATLAS_004_027_pxui_action_027_箭头.png |

### 24-model-week-materials

模型周材料/工艺购买选项。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 028 | 手工切割 | `pxui_action_028` | asset-work/ui-icon-final/confirmed-icons/24-model-week-materials/028_手工切割__UIATLAS_004_028_pxui_action_028_美工刀.png |
| 029 | 激光切割 | `pxui_action_029` | asset-work/ui-icon-final/confirmed-icons/24-model-week-materials/029_激光切割__UIATLAS_004_029_pxui_action_029_激光头.png |
| 030 | 3D打印 | `pxui_action_030` | asset-work/ui-icon-final/confirmed-icons/24-model-week-materials/030_3D打印__UIATLAS_004_030_pxui_action_030_模型.png |

### 25-character-avatars

11 个玩家角色头像，只用于角色选择、角色卡和当前角色头像。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 001 | 普通人 | `pxui_role_001` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/001_普通人__UIATLAS_005_001_pxui_role_001_图纸.png |
| 002 | 混的入 | `pxui_role_002` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/002_混的入__UIATLAS_005_002_pxui_role_002_头像.png |
| 003 | 不吃压力之人 | `pxui_role_003` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/003_不吃压力之人__UIATLAS_005_003_pxui_role_003_图纸.png |
| 004 | 设计赋能哥 | `pxui_role_004` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/004_设计赋能哥__UIATLAS_005_004_pxui_role_004_头像.png |
| 005 | 寒门贵子 | `pxui_role_005` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/005_寒门贵子__UIATLAS_005_005_pxui_role_005_书.png |
| 006 | 吃满压力之人 | `pxui_role_006` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/006_吃满压力之人__UIATLAS_005_006_pxui_role_006_头像.png |
| 007 | 未来的老板 | `pxui_role_007` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/007_未来的老板__UIATLAS_005_007_pxui_role_007_头像.png |
| 008 | 投胎专家 | `pxui_role_008` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/008_投胎专家__UIATLAS_005_008_pxui_role_008_头像.png |
| 009 | 基因叛逆者 | `pxui_role_009` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/009_基因叛逆者__UIATLAS_005_009_pxui_role_009_头像.png |
| 010 | 小镇做题家 | `pxui_role_010` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/010_小镇做题家__UIATLAS_005_010_pxui_role_010_头像.png |
| 011 | 柯布西耶继承者 | `pxui_role_011` | asset-work/ui-icon-final/confirmed-icons/25-character-avatars/011_柯布西耶继承者__UIATLAS_005_011_pxui_role_011_头像.png |

### 26-mentor-avatars

7 位导师头像，只用于导师选择和导师卡。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 012 | 王老师_景观实践大师 | `pxui_role_012` | asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/012_王老师_景观实践大师__UIATLAS_005_012_pxui_role_012_头像.png |
| 013 | 戈老师_高级学院派 | `pxui_role_013` | asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/013_戈老师_高级学院派__UIATLAS_005_013_pxui_role_013_书.png |
| 014 | 林老师_高压审美者 | `pxui_role_014` | asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/014_林老师_高压审美者__UIATLAS_005_014_pxui_role_014_头像.png |
| 015 | 陈老师_理想主义者 | `pxui_role_015` | asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/015_陈老师_理想主义者__UIATLAS_005_015_pxui_role_015_头像.png |
| 016 | 周老师_软件技术大神 | `pxui_role_016` | asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/016_周老师_软件技术大神__UIATLAS_005_016_pxui_role_016_头像.png |
| 017 | 许老师_佛系放养家 | `pxui_role_017` | asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/017_许老师_佛系放养家__UIATLAS_005_017_pxui_role_017_头像.png |
| 018 | 韩老师_竞赛压力怪 | `pxui_role_018` | asset-work/ui-icon-final/confirmed-icons/26-mentor-avatars/018_韩老师_竞赛压力怪__UIATLAS_005_018_pxui_role_018_奖杯.png |

### 27-mentor-stage-tasks

7 个导师阶段任务图标，对应导师任务完成/未完成反馈。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 001 | 走向实践 | `pxui_role_019` | asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/001_走向实践__UIATLAS_006_001_pxui_role_019_合同.png |
| 002 | 理论支撑 | `pxui_role_020` | asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/002_理论支撑__UIATLAS_006_002_pxui_role_020_书.png |
| 003 | 磨到能看 | `pxui_role_021` | asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/003_磨到能看__UIATLAS_006_003_pxui_role_021_图纸.png |
| 004 | 以人为本 | `pxui_role_022` | asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/004_以人为本__UIATLAS_006_004_pxui_role_022_人形尺.png |
| 005 | 技术爆炸 | `pxui_role_023` | asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/005_技术爆炸__UIATLAS_006_005_pxui_role_023_齿轮.png |
| 006 | 稳住节奏 | `pxui_role_024` | asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/006_稳住节奏__UIATLAS_006_006_pxui_role_024_节拍器.png |
| 007 | 竞赛狂魔 | `pxui_role_025` | asset-work/ui-icon-final/confirmed-icons/27-mentor-stage-tasks/007_竞赛狂魔__UIATLAS_006_007_pxui_role_025_奖杯.png |

### 28-course-icons

10 门大学课程选择与课程题图标。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 001 | 建筑史论 | `pxui_role_026` | asset-work/ui-icon-final/confirmed-icons/28-course-icons/001_建筑史论__UIATLAS_007_001_pxui_role_026_书.png |
| 002 | 建筑构造 | `pxui_role_027` | asset-work/ui-icon-final/confirmed-icons/28-course-icons/002_建筑构造__UIATLAS_007_002_pxui_role_027_墙身剖.png |
| 003 | 数字规划 | `pxui_role_028` | asset-work/ui-icon-final/confirmed-icons/28-course-icons/003_数字规划__UIATLAS_007_003_pxui_role_028_网格地.png |
| 004 | 计算机辅助设计 | `pxui_role_029` | asset-work/ui-icon-final/confirmed-icons/28-course-icons/004_计算机辅助设计__UIATLAS_007_004_pxui_role_029_制图软.png |
| 005 | 建筑力学 | `pxui_role_030` | asset-work/ui-icon-final/confirmed-icons/28-course-icons/005_建筑力学__UIATLAS_007_005_pxui_role_030_箭头.png |
| 006 | 建筑表现基础 | `pxui_role_031` | asset-work/ui-icon-final/confirmed-icons/28-course-icons/006_建筑表现基础__UIATLAS_007_006_pxui_role_031_画笔.png |
| 007 | 建筑制图 | `pxui_role_032` | asset-work/ui-icon-final/confirmed-icons/28-course-icons/007_建筑制图__UIATLAS_007_007_pxui_role_032_丁字尺.png |
| 008 | 表达与汇报 | `pxui_role_033` | asset-work/ui-icon-final/confirmed-icons/28-course-icons/008_表达与汇报__UIATLAS_007_008_pxui_role_033_麦克风.png |
| 009 | 建筑美学 | `pxui_role_034` | asset-work/ui-icon-final/confirmed-icons/28-course-icons/009_建筑美学__UIATLAS_007_009_pxui_role_034_构图框.png |
| 010 | 园林史论 | `pxui_role_035` | asset-work/ui-icon-final/confirmed-icons/28-course-icons/010_园林史论__UIATLAS_007_010_pxui_role_035_园林窗.png |

### 29-competition-events

竞赛投稿界面的赛事卡图标。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 001 | 校园角落更新 | `pxui_competition_001` | asset-work/ui-icon-final/confirmed-icons/29-competition-events/001_校园角落更新__UIATLAS_010_001_pxui_competition_001_图纸.png |
| 002 | 老街区微更新 | `pxui_competition_002` | asset-work/ui-icon-final/confirmed-icons/29-competition-events/002_老街区微更新__UIATLAS_010_002_pxui_competition_002_模型.png |
| 003 | 绿色建筑概念 | `pxui_competition_003` | asset-work/ui-icon-final/confirmed-icons/29-competition-events/003_绿色建筑概念__UIATLAS_010_003_pxui_competition_003_绿色建.png |
| 004 | 公共空间提案 | `pxui_competition_004` | asset-work/ui-icon-final/confirmed-icons/29-competition-events/004_公共空间提案__UIATLAS_010_004_pxui_competition_004_青年建.png |

### 30-competition-submit-states

竞赛投稿按钮状态：可投稿 / 未达门槛。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 005 | 可投稿 | `pxui_competition_005` | asset-work/ui-icon-final/confirmed-icons/30-competition-submit-states/005_可投稿__UIATLAS_010_005_pxui_competition_005_上箭.png |
| 006 | 未达门槛 | `pxui_competition_006` | asset-work/ui-icon-final/confirmed-icons/30-competition-submit-states/006_未达门槛__UIATLAS_010_006_pxui_competition_006_入围名.png |

### 31-competition-award-states

竞赛结果奖项状态：一等奖、二等奖、三等奖、未获奖。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 007 | 一等奖 | `pxui_competition_007` | asset-work/ui-icon-final/confirmed-icons/31-competition-award-states/007_一等奖__UIATLAS_010_007_pxui_competition_007_奖杯.png |
| 008 | 二等奖 | `pxui_competition_008` | asset-work/ui-icon-final/confirmed-icons/31-competition-award-states/008_二等奖__UIATLAS_010_008_pxui_competition_008_奖杯.png |
| 009 | 三等奖 | `pxui_competition_009` | asset-work/ui-icon-final/confirmed-icons/31-competition-award-states/009_三等奖__UIATLAS_010_009_pxui_competition_009_奖杯.png |
| 010 | 未获奖 | `pxui_base_020` | web-app/optimized/asset-work/ui-icon-final/unmapped-icons/UIATLAS_001_基础操作按钮/UIATLAS_001_020_pxui_base_020_叉.d3ec4d59a5f9.webp |

### 32-route-common-exam-status

后期方向通用状态、报名/等待/投递确认与考试题型图标。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 001 | 正式参与 | `pxui_route_001` | asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/001_正式参与__UIATLAS_011_001_pxui_route_001_报名表.png |
| 002 | 等待结果 | `pxui_route_002` | asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/002_等待结果__UIATLAS_011_002_pxui_route_002_信封沙.png |
| 003 | 简历投递确认 | `pxui_route_003` | asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/003_简历投递确认__UIATLAS_011_003_pxui_route_003_简历纸.png |
| 004 | 升学专业题 | `pxui_route_004` | asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/004_升学专业题__UIATLAS_011_004_pxui_route_004_建筑题.png |
| 005 | 行测题 | `pxui_route_005` | asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/005_行测题__UIATLAS_011_005_pxui_route_005_答题卡.png |
| 006 | 雅思 | `pxui_route_006` | asset-work/ui-icon-final/confirmed-icons/32-route-common-exam-status/006_雅思__UIATLAS_011_006_pxui_route_006_英文试.png |

### 33-route-postgrad-recommendation

申请保研与考研升学档位图标。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 007 | 本校 _ 211 | `pxui_route_007` | asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/007_本校 _ 211__UIATLAS_011_007_pxui_route_007_本校校.png |
| 008 | 建筑老八校 _ 其他 985 | `pxui_route_008` | asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/008_建筑老八校 _ 其他 985__UIATLAS_011_008_pxui_route_008_名校校.png |
| 009 | 梦中情校 | `pxui_route_009` | asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/009_梦中情校__UIATLAS_011_009_pxui_route_009_殿堂校.png |
| 010 | 普通一本院校 | `pxui_route_010` | asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/010_普通一本院校__UIATLAS_011_010_pxui_route_010_书.png |
| 011 | 建筑老八校 _ 其他 985、211 | `pxui_route_011` | asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/011_建筑老八校 _ 其他 985、211__UIATLAS_011_011_pxui_route_011_书.png |
| 012 | 梦中情校 | `pxui_route_012` | asset-work/ui-icon-final/confirmed-icons/33-route-postgrad-recommendation/012_梦中情校__UIATLAS_011_012_pxui_route_012_书.png |

### 34-route-overseas-study

出国留学具体海外学校按钮图标。源 atlas 为 `asset-work/ui-icon-final/generated-atlases/overseas-university-atlas-source.png`，按 4x4 从左到右、从上到下对应 16 所学校，并已抠成透明 PNG。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 013 | Harvard GSD (哈佛大学设计研究生院) | `overseas_gsd` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/01-overseas-gsd.png |
| 014 | AA School (建筑联盟学院) | `overseas_aa` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/02-overseas-aa.png |
| 015 | ETH Zurich (苏黎世联邦理工学院) | `overseas_eth` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/03-overseas-eth.png |
| 016 | MIT Architecture (麻省理工学院建筑系) | `overseas_mit` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/04-overseas-mit.png |
| 017 | UCL Bartlett (伦敦大学学院) | `overseas_ucl` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/05-overseas-ucl.png |
| 018 | Columbia GSAPP (哥伦比亚大学) | `overseas_columbia` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/06-overseas-columbia.png |
| 019 | UPenn Weitzman (宾夕法尼亚大学) | `overseas_upenn` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/07-overseas-upenn.png |
| 020 | TU Delft (代尔夫特理工大学) | `overseas_tud` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/08-overseas-tud.png |
| 021 | Cornell AAP (康奈尔大学) | `overseas_cornell` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/09-overseas-cornell.png |
| 022 | NUS (新加坡国立大学建筑系) | `overseas_nus` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/10-overseas-nus.png |
| 023 | HKU (香港大学建筑学院) | `overseas_hku` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/11-overseas-hku.png |
| 024 | University of Sheffield (谢菲尔德大学) | `overseas_sheffield` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/12-overseas-sheffield.png |
| 025 | RISD (罗德岛设计学院) | `overseas_risd` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/13-overseas-risd.png |
| 026 | University of Melbourne (墨尔本大学) | `overseas_melbourne` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/14-overseas-melbourne.png |
| 027 | MSA (曼彻斯特建筑学院) | `overseas_msa` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/15-overseas-msa.png |
| 028 | Polimi (米兰理工大学) | `overseas_polimi` | asset-work/ui-icon-final/confirmed-icons/34-route-overseas-study/universities/16-overseas-polimi.png |

### 35-route-public-service

选调、考公、考编的岗位或岗位层级图标。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 017 | 生源地选调生 | `pxui_route_017` | asset-work/ui-icon-final/confirmed-icons/35-route-public-service/017_生源地选调生__UIATLAS_011_017_pxui_route_017_家乡路.png |
| 018 | 国家部委层 | `pxui_route_018` | asset-work/ui-icon-final/confirmed-icons/35-route-public-service/018_国家部委层__UIATLAS_011_018_pxui_route_018_国徽感.png |
| 019 | 省市厅局层 | `pxui_route_019` | asset-work/ui-icon-final/confirmed-icons/35-route-public-service/019_省市厅局层__UIATLAS_011_019_pxui_route_019_城市办.png |
| 020 | 基层公务员 | `pxui_route_020` | asset-work/ui-icon-final/confirmed-icons/35-route-public-service/020_基层公务员__UIATLAS_011_020_pxui_route_020_乡镇街.png |
| 021 | 教师岗 | `pxui_route_021` | asset-work/ui-icon-final/confirmed-icons/35-route-public-service/021_教师岗__UIATLAS_011_021_pxui_route_021_讲台.png |
| 022 | 事业单位综合岗 | `pxui_route_022` | asset-work/ui-icon-final/confirmed-icons/35-route-public-service/022_事业单位综合岗__UIATLAS_011_022_pxui_route_022_规划馆.png |
| 023 | 行政管理岗 | `pxui_route_023` | asset-work/ui-icon-final/confirmed-icons/35-route-public-service/023_行政管理岗__UIATLAS_011_023_pxui_route_023_文件.png |

### 36-route-internship

实习层级与实习申请入口图标。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 024 | 普通实习 | `pxui_route_024` | asset-work/ui-icon-final/confirmed-icons/36-route-internship/024_普通实习__UIATLAS_011_024_pxui_route_024_普通工.png |
| 025 | 强所实习 | `pxui_route_025` | asset-work/ui-icon-final/confirmed-icons/36-route-internship/025_强所实习__UIATLAS_011_025_pxui_route_025_模型.png |
| 026 | 名企实习 | `pxui_route_026` | asset-work/ui-icon-final/confirmed-icons/36-route-internship/026_名企实习__UIATLAS_011_026_pxui_route_026_金色工.png |
| 027 | 实习申请 | `pxui_route_027` | asset-work/ui-icon-final/confirmed-icons/36-route-internship/027_实习申请__UIATLAS_011_027_pxui_route_027_邮箱.png |

### 37-route-architecture-jobs

建筑工作路线岗位图标。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 028 | 大师建筑事务所 | `pxui_route_028` | asset-work/ui-icon-final/confirmed-icons/37-route-architecture-jobs/028_大师建筑事务所__UIATLAS_011_028_pxui_route_028_模型.png |
| 029 | 外企事务所 | `pxui_route_029` | asset-work/ui-icon-final/confirmed-icons/37-route-architecture-jobs/029_外企事务所__UIATLAS_011_029_pxui_route_029_英文邮.png |
| 030 | 国企设计院 | `pxui_route_030` | asset-work/ui-icon-final/confirmed-icons/37-route-architecture-jobs/030_国企设计院__UIATLAS_011_030_pxui_route_030_施工图.png |
| 031 | 地方设计院 | `pxui_route_031` | asset-work/ui-icon-final/confirmed-icons/37-route-architecture-jobs/031_地方设计院__UIATLAS_011_031_pxui_route_031_地方项.png |
| 032 | 独立小型工作室 | `pxui_route_032` | asset-work/ui-icon-final/confirmed-icons/37-route-architecture-jobs/032_独立小型工作室__UIATLAS_011_032_pxui_route_032_模型.png |

### 38-route-career-change

转行路线岗位图标。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 033 | AI产品经理 | `pxui_route_033` | asset-work/ui-icon-final/confirmed-icons/38-route-career-change/033_AI产品经理__UIATLAS_011_033_pxui_route_033_产品看.png |
| 034 | 游戏场景建模师 | `pxui_route_034` | asset-work/ui-icon-final/confirmed-icons/38-route-career-change/034_游戏场景建模师__UIATLAS_011_034_pxui_route_034_游戏场.png |
| 035 | 销售_商务 | `pxui_route_035` | asset-work/ui-icon-final/confirmed-icons/38-route-career-change/035_销售_商务__UIATLAS_011_035_pxui_route_035_户型图.png |
| 036 | 新媒体内容 | `pxui_route_036` | asset-work/ui-icon-final/confirmed-icons/38-route-career-change/036_新媒体内容__UIATLAS_011_036_pxui_route_036_推文编.png |
| 037 | 插画师 | `pxui_route_037` | asset-work/ui-icon-final/confirmed-icons/38-route-career-change/037_插画师__UIATLAS_011_037_pxui_route_037_画笔.png |
| 038 | 创业 | `pxui_route_038` | asset-work/ui-icon-final/confirmed-icons/38-route-career-change/038_创业__UIATLAS_011_038_pxui_route_038_火苗契.png |

### 39-route-fallback-statuses

后期路线失败/回落状态图标。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 039 | 再考一年 | `pxui_route_039` | asset-work/ui-icon-final/confirmed-icons/39-route-fallback-statuses/039_再考一年__UIATLAS_011_039_pxui_route_039_书.png |
| 040 | 继续备考 | `pxui_route_040` | asset-work/ui-icon-final/confirmed-icons/39-route-fallback-statuses/040_继续备考__UIATLAS_011_040_pxui_route_040_书.png |
| 041 | 回乡待招录 | `pxui_route_041` | asset-work/ui-icon-final/confirmed-icons/39-route-fallback-statuses/041_回乡待招录__UIATLAS_011_041_pxui_route_041_行李箱.png |
| 042 | 求职待定 | `pxui_route_042` | asset-work/ui-icon-final/confirmed-icons/39-route-fallback-statuses/042_求职待定__UIATLAS_011_042_pxui_route_042_等待邮.png |

### 40-album-year-1

大一/开头曲学年 BGM 圆形专辑图。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 001 | 开头曲_大一第 1 首 | `pxui_album_001` | asset-work/ui-icon-final/confirmed-icons/40-album-year-1/001_开头曲_大一第 1 首__UIATLAS_023_001_pxui_album_001_草地.png |
| 002 | year_1_2 sacred paly secret place | `pxui_album_002` | asset-work/ui-icon-final/confirmed-icons/40-album-year-1/002_year_1_2 sacred paly secret place__UIATLAS_023_002_pxui_album_002_唱片.png |
| 003 | year_1_3 三葉のテーマ（你的名字） | `pxui_album_003` | asset-work/ui-icon-final/confirmed-icons/40-album-year-1/003_year_1_3 三葉のテーマ（你的名字）__UIATLAS_023_003_pxui_album_003_唱片.png |
| 004 | year_1_4 最初的记忆 | `pxui_album_004` | asset-work/ui-icon-final/confirmed-icons/40-album-year-1/004_year_1_4 最初的记忆__UIATLAS_023_004_pxui_album_004_唱片.png |
| 005 | year_1_5 五月天 | `pxui_album_005` | asset-work/ui-icon-final/confirmed-icons/40-album-year-1/005_year_1_5 五月天__UIATLAS_023_005_pxui_album_005_唱片.png |
| 006 | year_1_6 Where Memory Had Stayed | `pxui_album_006` | asset-work/ui-icon-final/confirmed-icons/40-album-year-1/006_year_1_6 Where Memory Had Stayed__UIATLAS_023_006_pxui_album_006_唱片.png |
| 007 | year_1_7 Always with me | `pxui_album_007` | asset-work/ui-icon-final/confirmed-icons/40-album-year-1/007_year_1_7 Always with me__UIATLAS_023_007_pxui_album_007_唱片.png |
| 008 | year_1_8 知足 | `pxui_album_008` | asset-work/ui-icon-final/confirmed-icons/40-album-year-1/008_year_1_8 知足__UIATLAS_023_008_pxui_album_008_唱片.png |

### 41-album-year-2

大二学年 BGM 圆形专辑图。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 009 | year_2_1 over world day（泰拉瑞亚） | `pxui_album_009` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/009_year_2_1 over world day（泰拉瑞亚）__UIATLAS_023_009_pxui_album_009_草地.png |
| 010 | year_2_2 家园 | `pxui_album_010` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/010_year_2_2 家园__UIATLAS_023_010_pxui_album_010_唱片.png |
| 011 | year_2_3 人鱼湾 | `pxui_album_011` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/011_year_2_3 人鱼湾__UIATLAS_023_011_pxui_album_011_唱片.png |
| 012 | year_2_4 有点甜 | `pxui_album_012` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/012_year_2_4 有点甜__UIATLAS_023_012_pxui_album_012_唱片.png |
| 013 | year_2_5 宠物园 | `pxui_album_013` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/013_year_2_5 宠物园__UIATLAS_023_013_pxui_album_013_唱片.png |
| 014 | year_2_6 雪人谷 | `pxui_album_014` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/014_year_2_6 雪人谷__UIATLAS_023_014_pxui_album_014_唱片.png |
| 015 | year_2_7 Winter Luv | `pxui_album_015` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/015_year_2_7 Winter Luv__UIATLAS_023_015_pxui_album_015_唱片.png |
| 016 | year_2_8 夏日心动 | `pxui_album_016` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/016_year_2_8 夏日心动__UIATLAS_023_016_pxui_album_016_唱片.png |
| 017 | year_2_9 星茶会 | `pxui_album_017` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/017_year_2_9 星茶会__UIATLAS_023_017_pxui_album_017_唱片.png |
| 018 | year_2_10 宝可梦纯音乐 | `pxui_album_018` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/018_year_2_10 宝可梦纯音乐__UIATLAS_023_018_pxui_album_018_唱片.png |
| 019 | year_2_11 白落落村 | `pxui_album_019` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/019_year_2_11 白落落村__UIATLAS_023_019_pxui_album_019_唱片.png |
| 020 | year_2_12 战斗-通往胜利 | `pxui_album_020` | asset-work/ui-icon-final/confirmed-icons/41-album-year-2/020_year_2_12 战斗-通往胜利__UIATLAS_023_020_pxui_album_020_徽章.png |

### 42-album-year-3

大三学年 BGM 圆形专辑图。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 021 | year_3_1 爱的主题钢琴曲 | `pxui_album_021` | asset-work/ui-icon-final/confirmed-icons/42-album-year-3/021_year_3_1 爱的主题钢琴曲__UIATLAS_023_021_pxui_album_021_唱片.png |
| 022 | year_3_2 淡淡的爱意 | `pxui_album_022` | asset-work/ui-icon-final/confirmed-icons/42-album-year-3/022_year_3_2 淡淡的爱意__UIATLAS_023_022_pxui_album_022_唱片.png |
| 023 | year_3_3 我的歌声里 | `pxui_album_023` | asset-work/ui-icon-final/confirmed-icons/42-album-year-3/023_year_3_3 我的歌声里__UIATLAS_023_023_pxui_album_023_唱片.png |

### 43-album-year-4

大四学年 BGM 圆形专辑图。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 025 | year_4_1 退后钢琴曲 | `pxui_album_025` | asset-work/ui-icon-final/confirmed-icons/43-album-year-4/025_year_4_1 退后钢琴曲__UIATLAS_023_025_pxui_album_025_唱片.png |
| 026 | year_4_2 晴天 | `pxui_album_026` | asset-work/ui-icon-final/confirmed-icons/43-album-year-4/026_year_4_2 晴天__UIATLAS_023_026_pxui_album_026_唱片.png |
| 027 | year_4_3 时光机（五月天） | `pxui_album_027` | asset-work/ui-icon-final/confirmed-icons/43-album-year-4/027_year_4_3 时光机（五月天）__UIATLAS_023_027_pxui_album_027_唱片.png |
| 028 | year_4_4 说了再见钢琴曲 | `pxui_album_028` | asset-work/ui-icon-final/confirmed-icons/43-album-year-4/028_year_4_4 说了再见钢琴曲__UIATLAS_023_028_pxui_album_028_唱片.png |

### 44-album-year-5

大五学年 BGM 圆形专辑图。
新增 `045` 与 `046` 来自 `asset-work/ui-icon-final/generated-atlases/UIATLAS_023_album-year-5-extra-source.png`，按图集内左右两张圆形专辑图切割并抠去棋盘格背景：`045 = (73,30,778,781)`，`046 = (920,30,779,781)`。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 029 | year_5_1 爱的回归线 | `pxui_album_029` | asset-work/ui-icon-final/confirmed-icons/44-album-year-5/029_year_5_1 爱的回归线__UIATLAS_023_029_pxui_album_029_唱片.png |
| 045 | year_5_2 诺言 | `pxui_album_045` | asset-work/ui-icon-final/confirmed-icons/44-album-year-5/045_year_5_2 诺言__UIATLAS_023_045_pxui_album_045_唱片.png |
| 046 | year_5_3 蒲公英的约定 | `pxui_album_046` | asset-work/ui-icon-final/confirmed-icons/44-album-year-5/046_year_5_3 蒲公英的约定__UIATLAS_023_046_pxui_album_046_唱片.png |
| 030 | year_5_4 The truth that you leave | `pxui_album_030` | asset-work/ui-icon-final/confirmed-icons/44-album-year-5/030_year_5_4 The truth that you leave__UIATLAS_023_030_pxui_album_030_唱片.png |
| 031 | year_5_5 Never see me again | `pxui_album_031` | asset-work/ui-icon-final/confirmed-icons/45-album-normal-endings/031_old_boy 老男孩__UIATLAS_023_031_pxui_album_031_唱片.png |

### 45-album-normal-endings

普通结束曲圆形专辑图。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 031 | old_boy 老男孩 | `pxui_album_031` | asset-work/ui-icon-final/confirmed-icons/45-album-normal-endings/031_old_boy 老男孩__UIATLAS_023_031_pxui_album_031_唱片.png |
| 032 | into_the_sea 入海 | `pxui_album_032` | asset-work/ui-icon-final/confirmed-icons/45-album-normal-endings/032_into_the_sea 入海__UIATLAS_023_032_pxui_album_032_唱片.png |
| 033 | cheers 干杯 | `pxui_album_033` | asset-work/ui-icon-final/confirmed-icons/45-album-normal-endings/033_cheers 干杯__UIATLAS_023_033_pxui_album_033_唱片.png |
| 034 | protagonist 主角 | `pxui_album_034` | asset-work/ui-icon-final/confirmed-icons/45-album-normal-endings/034_protagonist 主角__UIATLAS_023_034_pxui_album_034_唱片.png |
| 035 | proud_youth 骄傲的少年 | `pxui_album_035` | asset-work/ui-icon-final/confirmed-icons/45-album-normal-endings/035_proud_youth 骄傲的少年__UIATLAS_023_035_pxui_album_035_唱片.png |
| 036 | remaining_summer 剩下的盛夏 | `pxui_album_036` | asset-work/ui-icon-final/confirmed-icons/45-album-normal-endings/036_remaining_summer 剩下的盛夏__UIATLAS_023_036_pxui_album_036_唱片.png |
| 037 | our_tomorrow 我们的明天 | `pxui_album_037` | asset-work/ui-icon-final/confirmed-icons/45-album-normal-endings/037_our_tomorrow 我们的明天__UIATLAS_023_037_pxui_album_037_唱片.png |
| 038 | those_years 那些年 | `pxui_album_038` | asset-work/ui-icon-final/confirmed-icons/45-album-normal-endings/038_those_years 那些年__UIATLAS_023_038_pxui_album_038_唱片.png |
| 039 | here_after_us 后来的我们 | `pxui_album_039` | asset-work/ui-icon-final/confirmed-icons/45-album-normal-endings/039_here_after_us 后来的我们__UIATLAS_023_039_pxui_album_039_唱片.png |

### 46-album-failure-endings

失败结局绑定曲圆形专辑图。

| 顺序 | 目标 UI | 稳定 ID | 确定文件 |
|---:|---|---|---|
| 040 | ending_graduation_failed 毕业失败——你被延毕了！ _ 超人强出场曲 | `pxui_album_040` | asset-work/ui-icon-final/confirmed-icons/46-album-failure-endings/040_ending_graduation_failed 毕业失败——延毕 _ 超人强出场曲__UIATLAS_023_040_pxui_album_040_唱片.png |
| 041 | ending_living_cost_break 你破产了——有感觉吗！？ _ 哈基米南北绿豆 | `pxui_album_041` | asset-work/ui-icon-final/confirmed-icons/46-album-failure-endings/041_ending_living_cost_break 你破产了——有感觉吗 _ 哈基米南北绿豆__UIATLAS_023_041_pxui_album_041_唱片.png |
| 042 | ending_pressure_collapse 压力失控——好好休息，同学 _ 流浪者之歌 | `pxui_album_042` | asset-work/ui-icon-final/confirmed-icons/46-album-failure-endings/042_ending_pressure_collapse 压力失控——好好休息，同学 _ 流浪者之歌__UIATLAS_023_042_pxui_album_042_唱片.png |
| 043 | ending_two_failed_reviews 挂科两次被劝退——也许你并不适合 _ Frolic | `pxui_album_043` | asset-work/ui-icon-final/confirmed-icons/46-album-failure-endings/043_ending_two_failed_reviews 连续挂科被劝退——也许你并不适合 _ Frolic__UIATLAS_023_043_pxui_album_043_唱片.png |
| 044 | ending_forced_suspension 被迫停学——好好休息，同学 _ 风居住过的街道 | `pxui_album_044` | asset-work/ui-icon-final/confirmed-icons/46-album-failure-endings/044_ending_forced_suspension 被迫停学——好好休息，同学 _ 风居住过的街道__UIATLAS_023_044_pxui_album_044_唱片.png |
