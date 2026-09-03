<div align="center">
  <p><sub>THE 25TH HOUR</sub></p>
  <h1>第二十五小时：建筑生模拟器</h1>
  <p><strong>从第一张图纸，到毕业后的下一条路。</strong></p>
  <p>一款以建筑学院为舞台的五年制网页人生模拟器</p>
  <p>
    <a href="https://arch.25thgame.vip/game.html"><strong>在线试玩</strong></a>
    ·
    <a href="#快速开始">快速开始</a>
    ·
    <a href="docs/README.md">开发文档</a>
    ·
    <a href="#参与贡献">参与贡献</a>
  </p>
</div>

<br>

<p align="center">
  <img src="asset-work/images/readme-hero.webp" alt="第二十五小时：建筑生模拟器项目宣传图，建筑学院工作室中的学生、图纸与建筑模型" width="100%">
</p>

<p align="center"><sub>把有限的时间留给图纸、模型，也留给那些会改变未来的选择。</sub></p>

> 黄色的树林里不止分出两条路，少年，你的选择是什么呢？

## 关于游戏

《第二十五小时：建筑生模拟器》从开学典礼开始，把五年建院生活浓缩为一次次有代价的选择：赶图、做模型、准备评图、参加竞赛、寻找实习，也要面对关系、焦虑、偶然事件与毕业后的现实分岔。

这里没有无所不能的“天才建筑师”。真正需要经营的，是每周有限的行动机会，以及课题成果、个人状态和未来方向之间的取舍。你可以平稳毕业，也可能在一次次选择后走向完全不同的人生结局。

### 一局中，你会经历

| 维度 | 体验 |
| --- | --- |
| **五年时间线** | 按「周 → 学期 → 学年 → 五年」推进，从入学一直走到毕业。 |
| **课题与评图** | 在进度和作品质量之间分配行动，经历模型周、赶图周与评图。 |
| **个人状态** | 管理精力、压力、金钱、个人 GPA、作品集与个人简历。 |
| **校园选择** | 选择角色、导师和大学课程，参与商店、竞赛、实习、暑假写生与“建筑生的万里路”。 |
| **未来路线** | 在大五主动进入升学、体制内、建筑工作或转行方向，迎来相应结局。 |
| **长期收集** | 解锁人生结局与成长成就，体验学年音乐、毕业典礼和结尾回忆。 |

> [!NOTE]
> 正式游玩以桌面浏览器为主。移动端提供入口和信息页面；开始或读取游戏时会提示切换至电脑端。

## 快速开始

### 在线试玩

无需安装，直接前往 [arch.25thgame.vip/game.html](https://arch.25thgame.vip/game.html) 开始游戏。

### 本地运行

项目使用 Node.js `24.16.0`，版本记录在 [`.nvmrc`](.nvmrc) 中。

```sh
git clone https://github.com/XiaoSiKe/The-25th-Hour.git
cd The-25th-Hour
nvm use
npm ci
npm run env:check
npm run web
```

浏览器打开 `http://localhost:4173` 即可试玩。若端口已被占用，可以指定其他端口：

```sh
npm run web -- 4174
```

## 项目概览

本仓库保存《第二十五小时》的完整开发资料：当前可玩的网页应用、可复现的规则验证、产品与技术文档、UI 与素材交接，以及面向 Cloudflare 和阿里云的部署配置。它既是游戏源码仓库，也是保证玩法、数值、内容和实现保持一致的协作依据。

### 技术构成

- 当前网页应用由原生 HTML、CSS 与 ES Modules 构成。
- Node.js 脚本负责本地服务器、资源构建、规则校验和静态产物生成。
- 完整游戏进度存储在浏览器本地；排行榜服务使用 Cloudflare Workers 与 D1。
- 静态站点部署到阿里云，大体积媒体资源由 Cloudflare R2 与国内 CDN 分发。

### 仓库结构

| 目录 | 说明 |
| --- | --- |
| [`web-app/`](web-app/) | 当前可试玩的网页应用、UI、游戏状态和运行时资源加载。 |
| [`web-app/game/`](web-app/game/) | 当前可玩规则的实现基准：状态、事件、结局、随机数与视图模型。 |
| [`simulator/`](simulator/) | 基于固定 seed 的验证适配层，用于回归规则，不是第二套规则源。 |
| [`docs/`](docs/) | 产品、流程、数值、内容、技术和部署的权威文档入口。 |
| [`ui-work/`](ui-work/) | UI 接线规范、组件清单与玩家检测屏原型。 |
| [`asset-work/`](asset-work/) | 图片、音乐、字体和 UI 图标的素材说明与映射。 |
| [`cloudflare/monitor-api/`](cloudflare/monitor-api/) | 排行榜与匿名玩家检测相关的 Cloudflare Worker / D1 服务。 |
| [`deploy/`](deploy/README.md) | 中文运维入口、本机配置说明、阿里云发布配置和脚本。 |
| [`scripts/`](scripts/) | 环境检查、素材处理、生产资源核验和云效辅助命令。 |
| [`hyperframes/`](hyperframes/) | 结尾动画等媒体工程；与运行时页面的引用保持同步。 |

## 文档导航

README 只负责项目介绍与上手。规则、数值和内容各自维护在对应的权威文档中，避免出现多份相互矛盾的说明。

| 想了解 | 从这里开始 |
| --- | --- |
| 产品契约与系统范围 | [产品说明](docs/PRD.md) |
| 流程、状态机与系统职责 | [系统设计](docs/systems.md) |
| 数值、概率与路线门槛 | [数值设计](docs/numbers.md) |
| 角色、事件与结局 | [内容规划](docs/content-plan.md) |
| 技术架构、存档与部署 | [技术架构](docs/technical-architecture.md) |

完整文档入口及冲突处理规则见 [文档索引](docs/README.md)。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run ci:verify` | 运行完整校验集合。 |
| `npm run web:verify-flow` | 验证网页主流程。 |
| `npm run sim:verify` | 运行固定 seed 的模拟器校验。 |
| `npm run test:runtime-assets` | 检查运行时资源与图标图集。 |
| `npm run build:aliyun` | 构建阿里云静态产物。 |

模拟器的职责和专项验证命令见 [模拟器说明](simulator/README.md)。部署、环境变量和生产资源校验请从 [开发环境](docs/development-environment.md) 与 [技术架构](docs/technical-architecture.md) 开始。

## 本机配置与运维

日常运维请先阅读 [运维说明](deploy/README.md)，其中记录了私有配置、SSH / CLI 凭据位置、备份与删除项目后的恢复方式。

- [`.env.example`](.env.example) 是可提交的中文模板，不包含真实凭据。
- `.env.local` 是现有云效脚本的兼容入口。本机整理后，它指向项目目录之外的私有配置文件；不要提交该文件或链接。
- `node_modules/`、`.aliyun-output/` 是可重建的依赖与构建产物；`.tmp/` 留给工具的当前临时输出。
- 不要为了整理目录移动被代码引用的源码和素材。本机历史截图、旧部署包和杂项归档也不作为源码入库。

## 参与贡献

欢迎通过 Issue 或 Pull Request 反馈问题、补充内容和改进体验。提交前请运行与改动相关的验证命令；涉及玩法、数值、路线或结局的改动，请先确认其权威文档，避免让文档、模拟器与网页逻辑产生分歧。
