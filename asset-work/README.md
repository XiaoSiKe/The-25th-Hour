# 素材工作区

本目录用于存放字体、素材说明、映射索引和像素图提示词等资源交接材料。

运行时图片、图标、音频和字幕的实体文件已经统一收束到 `../web-app/optimized/`。不要再把游戏运行时资源挂到 `asset-work/assets/audio/`、`asset-work/assets/images/` 或 `web-app/assets/`。

这些材料服务表现层和资源挂载，不放在 `docs/`。`docs/` 只保留游戏规则、内容源、早期架构和长期技术方案。

## 目录

```text
asset-work/assets/fonts/aa-pixel/
asset-work/music/README.md
asset-work/images/README.md
asset-work/ui-icon-final/README.md
asset-work/prompts/ui-icon-page-inventory.md
asset-work/prompts/ui-icon-atlas-prompt-groups.md
web-app/optimized/
```

## 放置原则

- `assets/fonts/`：像素字体实体文件；当前只保留 `aa-pixel/` 的 AaPingPingGuoGuoXiangSuTi 字体。
- `../web-app/optimized/assets/`：剧情图、结局图、作品集展板、支持图、启动图和结尾回忆 WebP 场景图等运行时图片。
- `../web-app/optimized/asset-work/assets/audio/`：开头曲、学年 BGM、结束曲和 LRC 字幕等运行时音频。
- `../web-app/optimized/asset-work/ui-icon-final/`：最终 UI 图标运行时 WebP。
- `music/README.md`：音乐素材清单、顺播表、结束曲池、歌词字幕和失败结局绑定曲的唯一说明入口。
- `images/README.md`：结尾回忆动画口径、结局图片映射、作品集展板图片挂载规则的唯一说明入口。
- `ui-icon-final/`：最终 UI 图标映射说明和 CSV；实体图标在 `../web-app/optimized/asset-work/ui-icon-final/`。
- `prompts/`：生成前页面级 UI 图标需求、图集提示词和后续素材生成提示词；大文件可以保留生产细节，不写入玩法规则。

如果某份文件会改变玩法规则、数值、路线门槛或结算，应回到 `docs/` 的对应规则源确认，不在本目录直接覆盖规则。

## 常用入口

- 音乐接入、结束曲、字幕和失败结局绑定读取 `music/README.md`。
- 结尾回忆动画口径、结局图片和作品集展板读取 `images/README.md`。
- 最终 UI 图标读取 `ui-icon-final/README.md`；确认后的详细规则读取 `ui-icon-final/confirmed-ui-rules.md`，可机读索引读取 `ui-icon-final/confirmed-ui-rules.csv`。
- 补图、新增图标和生成提示词读取 `prompts/ui-icon-page-inventory.md`、`prompts/ui-icon-atlas-prompt-groups.md`。
- 原始图集、旧切片、校对图、源 PNG 和重复音频已清理；来源追溯以 `web-app/optimized` 的物理文件名、`ui-icon-final` 的索引字段和运行时代码为准。

本 README 不重复维护确认图标清单、UI 状态表或提示词正文；这些分别由 `ui-icon-final/`、`ui-work/` 和 `prompts/` 下的文件负责。
