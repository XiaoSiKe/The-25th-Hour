# Ending Memory

结尾回忆运行时使用图片序列动画，不再播放 MP4。正式游戏从 `web-app/ui/render.mjs` 嵌入：

- `/hyperframes/ending-memory/index.html?embedded=1&play=1`

逐帧图片读取优化后的 WebP：普通走马灯图片在 `/optimized/assets/结尾回忆走马灯图片/`，毕业答辩、毕业典礼、毕业照、军训2、入学讲座和专教生活读取 `/optimized/assets/story-events/`。本目录保留 HyperFrames 预览页面、场景表、字体补丁和构建脚本，用于查看和再生成结尾回忆动画源工程。
