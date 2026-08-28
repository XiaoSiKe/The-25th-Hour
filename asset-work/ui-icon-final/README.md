# UI 图标最终对应

最后更新时间：`2026-07-01 +08:00`

本目录只保留最终 UI 图标的映射说明和 CSV。运行时图标实体文件已经统一放在：

```text
../../web-app/optimized/asset-work/ui-icon-final/
```

旧的 `asset-work/ui-icon-final/confirmed-icons/`、`generated-atlases/`、`unmapped-icons/` 源目录已删除；不要再从 `asset-work/ui-icon-final/` 读取图标实体文件。

## 当前索引

- `confirmed-mapping.csv`：旧版全量映射索引，保留用于追溯。
- `confirmed-ui-rules.md`：本轮确认后的人工可读规则索引。
- `confirmed-ui-rules.csv`：本轮确认后的机读规则索引。
- `../../web-app/ui/ui-icon-final-manifest.mjs`：运行时最终 WebP 源图清单，当前 `728` 个。
- `../../web-app/ui/ui-icon-atlas-manifest.mjs`：运行时 atlas 坐标清单，当前 `1` 张高质量 WebP atlas 覆盖上述 `728` 个源图。

## 开发接入

- UI 运行时只读 `/optimized/asset-work/ui-icon-final/...`；图标渲染走 atlas 坐标，不能重新直连旧 PNG 源路径。
- `renderUiIcon()` 命中 atlas 时输出 `.ui-icon-atlas` SVG。新增图标容器时，尺寸、滤镜和对齐规则必须同时覆盖 `img` 与 `.ui-icon-atlas`，否则会出现图标偏小、错位或看起来像裁到旁边图标。
- 需要查稳定 ID 或确认状态时，读取 `confirmed-ui-rules.csv` / `confirmed-ui-rules.md`。
- 新增或补图需求先回到 `../prompts/ui-icon-page-inventory.md` 和 `../prompts/ui-icon-atlas-prompt-groups.md`，不要临时拼旧 PNG 路径。
