# 图片素材映射

最后更新时间：`2026-07-05 +08:00`

本文只维护图片、图标和结尾回忆动画资源的表现层口径。运行时实体文件已经统一收束到 `../../web-app/optimized/`。

旧目录 `asset-work/assets/images/` 和 `web-app/assets/` 已删除；不要再从这些目录拼路径。

## 当前资源位置

```text
../../web-app/optimized/assets/start/
../../web-app/optimized/assets/story-events/
../../web-app/optimized/assets/ending-illustrations/
../../web-app/optimized/assets/portfolio-boards/
../../web-app/optimized/assets/support/
../../web-app/optimized/assets/characters/
../../web-app/optimized/asset-work/ui-icon-final/
../../hyperframes/ending-memory/
```

## 代码入口

- 启动背景、支持图、结局图和 UI 图标：`../../web-app/ui/icons.mjs`
- 固定剧情图：`../../web-app/game/data.mjs`
- 作品集展板图：`../../web-app/game/view-model.mjs`
- 预加载队列：`../../web-app/ui/resource-preload.mjs`
- 结尾回忆动画：`../../web-app/ui/render.mjs`、`../../hyperframes/ending-memory/`
- 最终图标清单：`../../web-app/ui/ui-icon-final-manifest.mjs`

## 加载口径

- 桌面启动门图片：156 个，包含完整桌面游戏图片、结尾回忆动画 108 张 WebP 场景图和 1 张运行时 UI atlas。
- 手机启动门图片：8 个，包含手机入口图、首个游戏界面所需图片和 1 张运行时 UI atlas。
- 桌面启动门之后补充图片：0 个；桌面完整图片清单当前已收进启动门。
- 桌面完整图片目录：156 个。
- `web-app/optimized` 中 WebP 总数：886 个，其中 1 个是运行时高质量 WebP atlas。
- 结尾回忆动画：108 张 WebP 场景图，由 `../../hyperframes/ending-memory/scenes.generated.js` 读取。

## 路径规则

运行时代码必须直接写最终物理路径：

```text
/optimized/assets/...
/optimized/asset-work/ui-icon-final/...
```

生产环境由 `publicAssetUrl()` 统一解析 `/optimized/...`：阿里云生产入口命中的启动门国内段、作品集展板机会性预热段和创业结局插图走 `https://assets-cn.25thgame.vip/assets/v1`；其他普通/路线结局插图、结尾回忆场景图和其他优化资源走 R2 `https://assets-apac.25thgame.vip/assets/v1`；本地开发从 `web-app/optimized/` 读取同一份文件。

启动加载壳时钟和运维页少量图标 / 插图会在构建时复制到阿里云静态输出；这是站点源高优先级小资源，不是旧 PNG，也不是源目录回退。站点源指 `arch.25thgame.vip` 自己的静态文件来源；国内 CDN 指 `https://assets-cn.25thgame.vip/assets/v1`，R2 指 `https://assets-apac.25thgame.vip/assets/v1`。

## 验收

图片和动画资源是否完整，以以下检查为准：

```bash
npm run web:verify-flow
npm run test:runtime-assets
npm run build:aliyun
```
