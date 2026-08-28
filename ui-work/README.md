# UI 工作区

本目录用于维护当前前端页面 UI 的设计规范、页面信息架构、组件颗粒度、VM/command 接线和 PNG 参考。旧粗 UI 交接文件与独立预览脚手架已经移除；真实页面只以 `../web-app/` 当前入口为准。

`docs/` 只保留游戏规则、内容源、早期架构和长期技术方案。UI 规范、PNG 参考和表现层接线不要混入 `docs/`。

## 当前实现入口

```text
web-app/index.html
web-app/game.html
web-app/stage.mjs
web-app/app.mjs
web-app/ui/render.mjs
web-app/styles.css
web-app/ui/icons.mjs
web-app/game/view-model.mjs
web-app/game/commands.mjs
```

`index.html` 只负责固定舞台缩放和承载 `game.html`；`game.html` 挂载真实游戏 UI；`app.mjs` 处理 app shell 状态、事件委派、存档过渡和音频；`render.mjs` 与 `styles.css` 是当前页面表现层主 Module。

## 文档入口

最短阅读路径：

1. 当前前端页面 UI 规范：`fine-ui/DESIGN.md`。
2. 总契约与硬边界：`fine-ui/development-contract.md`。
3. PNG 是否有效、哪些页面已覆盖：`fine-ui/png-reference-index.md`。
4. 页面信息顺序：`fine-ui/information-architecture.md`。
5. 组件数据来源、command 和状态：`fine-ui/component-inventory.md`。
6. 系统入口状态：`fine-ui/system-entry-status.md`。
7. VM 与 command 边界：`fine-ui/view-model-contract.md`、`shared/ui-command-mapping.md`。
8. 开发前最终检查：`fine-ui/development-contract.md` 的“开发前检查”；`fine-ui/fine-ui-implementation-readiness.md` 仅保留旧路径转发。

图标资产接入读取 `../asset-work/ui-icon-final/README.md`。未确认图标、补图和新增图标再读 `../asset-work/prompts/ui-icon-page-inventory.md`。

提示词入口只读 `fine-ui/fine-ui-prompt-pack.md`。提示词包不维护 PNG 覆盖状态；覆盖状态统一读 `fine-ui/png-reference-index.md`，开发前是否必须补图统一读 `fine-ui/development-contract.md`。

## 放置原则

- `fine-ui/`：当前 UI 规范、PNG 参考、信息架构、组件颗粒度、VM 合同、系统入口状态和开发前检查。
- `shared/`：当前 UI 和后续重构都必须遵守的 command 映射、入口链接和支持页说明。
- `player-detection-ui/`：外围玩家检测台原型，不是玩家游戏主流程入口。

主游戏界面普通周行动已经由 `fine-ui/png-references/游戏主要过程的浅色背景页面.png` 和 `fine-ui/png-references/游戏主要过程的深色背景页面.png` 锁定为视觉母版。后续补图、提示词和 UI 开发验收都必须按这两张图对齐，不能另做一套主流程布局。

## 清理口径

- 已删除旧粗 UI 交接文件。
- 已删除不参与真实游戏入口的旧预览脚手架。
- 保留 `web-app/senior-test-copy.html`，因为它仍是大五结尾回忆测试副本，且由 `web-app/game/test-senior-copy.mjs` 明确识别。

当前状态：只允许和当前 UI 规范一致的代码整理、明确 bug 修复和文档同步。任何会改变游戏逻辑、命令语义、数值、事件、路线、结局或现有页面布局的改动，都必须另行确认。
