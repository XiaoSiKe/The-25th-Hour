# Simulator

这是迁移到正式 `game-core` 前的验证适配层，不是第二套规则源。当前可玩规则永远以 `web-app/game/*` 为标准；模拟器若与其不一致，按 `web-app/game/*` 对齐颗粒度。

最后更新时间：`2026-07-02 +08:00`

## 用途

- 验证固定 seed 能从开局跑到结局。
- 验证四类中途失败边界。
- 验证路线正式参与、隐藏结果缓存和毕业后统一揭示。
- 验证竞赛、实习、创业契约等规则没有断。

## 当前校验记录

最近运行：

- `npm run sim:verify`：通过。当前基础校验重点覆盖固定 seed 基线毕业、失败边界、GPA 修正、评图、压力即时失败、属性小数收益、毕业设计门槛和结局优先级。
- `npm run sim:verify:events`：通过。
- `npm run sim:verify:competitions`：通过。
- `npm run sim:verify:internships`：通过。
- `npm run sim:verify:internship-value`：通过。
- `npm run sim:verify:entrepreneurship`：通过。
- `npm run sim:verify:routes`：通过。固定 seed `25` 开启事件后，所有基础路线都能走到毕业后统一结局解析，并缓存隐藏路线结果。
- `npm run sim:verify:route-targets`：通过。跨路线目标拒绝通过；已确认可达目标继续要求成功；强目标、部分中强目标和策略样本保留为模拟覆盖限制，不再作为阻塞开发的调参待办。

本轮已修正验证口径：

- `sim:verify` 已覆盖小数收益保留、属性轻衰减保留小数、评图支持不倒挂、毕业设计评图支持先折算质量评图分。
- 路线验证脚本已按 `systems.md` 的结局读取优先级处理 `graduation_failed`，不再把“毕业设计未完成优先于路线结局”误判为路线解析错误。
- 路线目标覆盖脚本已覆盖跨路线目标拒绝，避免提前失败掩盖错误输入。

已接受的模拟覆盖限制：

以下结果只说明当前策略脚本难以稳定覆盖对应高门槛目标，不再作为后续开发的模拟阻塞项；除非后续明确要重开调参，否则不据此修改毕业设计门槛、行动收益、事件扰动、路线门槛、属性成长、AI 相关经历获取或策略脚本。

- 压力风险：压力达到 `100` 的即时失败边界已由 `pressure` 策略和单元断言覆盖；本轮路线目标批量样本未再集中出现 `pressure_collapse`。
- 建筑工作单例绑定：`independent_studio`、`local_design_institute` 的固定 seed 单例已按目标进入建筑工作正式路线；高档位目标仍保留诊断样本。
- 建筑工作可达性：`state_owned_design_institute` 批量目标成功为 `1/30`；`foreign_firm`、`master_studio` 为 `0/30`，主要原因是 `software_below_threshold`，`master_studio` 还叠加少量 `internship_below_threshold`。
- 升学目标可达性：`strong_postgrad_school` 批量目标成功为 `8/30`，`dream_postgrad_school` 为 `2/30`，主要原因是 `software_below_threshold` 与 `exam_score_below_threshold`。
- 留学高档位：`overseas_mit` 批量目标成功为 `0/30`，主要原因是 `gpa_below_threshold`。
- 体制内高档位：`selection_home` 为 `0/30`；`civil_service_ministry`、`civil_service_provincial` 均为目标成功 `0/30` 但多数进入 fallback；`teacher_bianzhi` 目标成功 `18/30`，另有 `6/30` 进入 fallback、`6/30` 早退，主要原因包含 `presentation_below_threshold`、`resilience_below_threshold`、`exam_score_below_threshold` 和部分 `gpa_below_threshold`。
- 转行目标可达性：`new_media_content`、`game_scene_artist`、`sales_business`、`ai_product_manager` 批量目标成功为 `0/30`，主要原因集中在 `presentation_below_threshold`、`software_below_threshold`、`resilience_below_threshold` 和少量 `ai_experience_below_threshold`。
历史背景：

- 早期连续 `F` / 早退率曾由用户确认接受；路线目标失败样本不再自动升级为调参问题。
- 强路线门槛曾按用户确认小幅下调，并同步到 `simulator/balance.ts`、`docs/numbers.md`、`docs/endings.md` 和 `web-app/game/data.mjs`；当前模拟器未完整覆盖商店、万里路、全部事件成长和保研拆分，因此强目标保留诊断失败空间。
- 模拟器会按 `strategy` 自动在大五阶段形成路线正式参与，用于批量验证；正式 UI 仍按 `systems.md` 口径，只在玩家主动报名、申请、投递、考试或确认后写入路线正式参与记录。

## 命令

```bash
npm run sim -- --seed 25 --strategy normal
npm run sim:verify
npm run sim:verify:routes
npm run sim:verify:route-targets
```

细查专项时再运行：

```bash
npm run sim:verify:events
npm run sim:verify:competitions
npm run sim:verify:internships
npm run sim:verify:internship-value
npm run sim:verify:entrepreneurship
```

## 边界

- 保留规则内核、固定 seed 验证和最小 smoke test。
- 不再保留批量报告、纯调参脚本和研究型模拟入口。
- 等网页正式接入 `game-core` 后，再迁移可复用规则并删除剩余模拟壳。
