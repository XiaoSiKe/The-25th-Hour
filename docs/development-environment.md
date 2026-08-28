# Mac 开发环境

最后更新时间：`2026-08-28 +08:00`

本文记录当前 Mac 本地开发、试玩和后续部署前的环境口径。

## 当前定案

- 本地开发使用 `zsh`。
- Node.js 使用 `nvm` 管理，项目版本锁定在根目录 `.nvmrc`。
- 当前 Node.js 版本：`24.16.0`。
- 当前 npm 版本：`11.13.0`。
- 本地试玩命令：`npm run web`。
- 部署 CLI 已准备：`gh`、`wrangler`；阿里云 Flow 通过 `scripts/aliyun-flow.mjs` 调用 OpenAPI，密钥只放在本地环境变量或 `.env.local`。
- Safari 不作为验收浏览器。

本机私有配置、凭据索引和目录恢复方式统一见 [中文运维说明](../deploy/README.md)。实际密钥不写入本文或 `.env.example`；`.env.local` 可作为指向项目外私有配置的兼容链接。

## 常用命令

进入项目后先切换 Node 版本：

```sh
nvm use
```

检查 Mac 开发环境和关键资源：

```sh
npm run env:check
```

一次性跑完当前模拟器校验：

```sh
npm run verify:all
```

启动本地试玩服务器：

```sh
npm run web
```

默认地址：

```text
http://localhost:4173
```

如果端口被占用：

```sh
npm run web -- 4174
```

## 当前已安装工具

| 工具 | 状态 | 用途 |
|---|---|---|
| `git` | 已有 | 版本管理 |
| `nvm` | 已安装 | Node 版本管理 |
| `node` | 已安装，`24.16.0` | 本地开发和脚本运行 |
| `npm` | 已安装，`11.13.0` | npm 脚本和 CLI 安装 |
| `gh` | 已安装，`2.94.0` | GitHub 登录、仓库、PR 和自动化 |
| `wrangler` | 已安装，`4.100.0` | 后续 Cloudflare Workers / R2 / D1 |

## 阿里云 Flow 辅助命令

查看阿里云公开站点是否已切到最新启动门代码：

```sh
npm run aliyun:flow:site
```

配置 `YUNXIAO_TOKEN`、`YUNXIAO_ORGANIZATION_ID` 和 `YUNXIAO_PIPELINE_ID` 后，可查询 Flow。当前五年令牌只有读取权限：

```sh
npm run aliyun:flow:status
npm run aliyun:flow:runs
```

`npm run aliyun:flow:run` 会触发发布，需要另行具备相应运行权限，不能使用当前只读令牌。日常自动发布仍由 GitHub 推送触发。

详细说明见 `docs/aliyun-flow-ops.md`。

## Git 身份

当前全局 Git 身份已配置：

```text
XiaoSiKe <293472279+XiaoSiKe@users.noreply.github.com>
```

仓库远端为 `https://github.com/XiaoSiKe/The-25th-Hour.git`。GitHub CLI 登录也应使用 `XiaoSiKe`；修改 Git 提交身份不会自动切换 CLI 认证。

## 迁移检查重点

- `npm run env:check` 必须通过 Node、npm、Git、核心目录和音乐资源检查。
- `npm run verify:all` 目标是全部通过；当前脚本已通过。路线目标样本只作为模拟覆盖限制记录，后续开发不再以模拟目标达成率作为阻塞项。
- 运行时音乐统一使用带内容 hash 的小写 `.m4a`，部署时必须按 `audio/mp4` 返回。
- 推送前使用 `gh auth status` 确认当前账号为 `XiaoSiKe`；GitHub 凭据仍由 `gh` 管理，不写入项目环境文件。
