# 音乐素材与结束曲表现

最后更新时间：`2026-07-03 +08:00`

本文只维护音乐资源的表现层口径。玩法流程、结束曲抽取和失败结局绑定逻辑以 `../../web-app/game/music.mjs` 与 `../../docs/systems.md` 为准。

## 当前资源位置

运行时音频和 LRC 已统一放在：

```text
../../web-app/optimized/asset-work/assets/audio/year-bgm/
../../web-app/optimized/asset-work/assets/audio/ending-tracks/
```

旧的 `asset-work/assets/audio/` 已删除。新增、替换或排查运行时音乐时，不要再引用旧源目录。

## 加载口径

- 启动门加载 `startupGateBgmTracks()`：仅大一学年首曲，共 1 个音频文件。
- 进入游戏后先加载 `deferredStartupBgmTracks()`：大一剩余 7 首 + 5 首强制失败结局绑定曲，共 12 个音频文件；这些音频仍走国内 CDN。
- `postStartPreloadTrackGroups()` 用于后续专辑图资源枚举：大二到大五 24 首 + 普通结束曲 M4A/LRC 共 18 个文件，共 42 个媒体文件。
- 全量音乐运行时引用来自 `musicLibraryTracks()`，当前共 46 首音频；普通结束曲另有 9 个 LRC 文件。
- 普通结束曲带 LRC；失败结局绑定曲不读 LRC，不显示底部歌词。

## 文件名口径

代码里写的是最终运行时路径，必须以 `/optimized/asset-work/assets/audio/...` 开头。

特别注意：

- `诺言` 使用 `/optimized/asset-work/assets/audio/year-bgm/大五学年/诺言.730979983f0f.m4a`
- `蒲公英的约定` 使用 `/optimized/asset-work/assets/audio/year-bgm/大五学年/蒲公英的约定.825d15f772b1.m4a`
- `Never see me again` 使用 `/optimized/asset-work/assets/audio/year-bgm/大五学年/Never see me again.0b045d3e9ad2.m4a`，位于大五学年 BGM 最后一首，专辑图复用 `031_old_boy 老男孩__UIATLAS_023_031_pxui_album_031_唱片.e0e916858d1a.webp`

运行时音频统一使用带内容 hash 的小写 `.m4a`，部署时必须按 `audio/mp4` 返回。

## 验收

音乐资源是否完整，以以下检查为准：

```bash
npm run web:verify-flow
npm run test:runtime-assets
```

若要直接核对文件存在性，展开 `musicLibraryTracks()`，并确认每个 `src` / `lyricsSrc` 都能在 `../../web-app/optimized/` 下找到。
