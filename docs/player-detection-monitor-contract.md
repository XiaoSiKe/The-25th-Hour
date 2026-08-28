# 玩家检测屏数据契约

最后更新时间：`2026-07-04 +08:00`

## 目的

本文定义 `ui-work/player-detection-ui` 后续接入数据库和真实游戏监测时的数据规则。它只约束监测屏读取的数据形状、统计口径和前后端边界，不绑定具体部署方案、数据库或后端框架。

监测屏保持轻量：只观察总览指标、近 24 小时趋势、排行榜和当前日期；不扩展成玩家生命周期、转化漏斗、运营画像或复杂后台。

## 总原则

- 页面只读聚合数据，不直接读取原始玩家行为明细。
- 前端不直接连数据库，只调用一个数据适配层或 HTTP 接口。
- 所有接口返回数字原值，单位和中文格式由前端展示层处理。
- 所有时间统一使用 `Asia/Shanghai` 口径，接口时间戳使用 ISO 8601。
- 所有玩家标识必须匿名化，不返回真实身份、联系方式或支付信息。
- 字段名使用稳定英文 camelCase；中文只作为展示文案，不作为程序主键。
- 游戏规则、结局判定、分数计算仍以游戏内规则层为准；监测屏只展示结果摘要。

## 时间范围

监测屏只使用 3 个范围 ID：

| 范围 ID | UI 文案 | 统计窗口 |
|---|---|---|
| `today` | 今日 | `Asia/Shanghai` 当日 `00:00:00` 到当前生成时间 |
| `week` | 7 日 | 含今日在内的最近 7 个自然日，到当前生成时间 |
| `all` | 全部 | 不设开始时间，到当前生成时间 |

接口请求必须使用范围 ID，不使用中文文案。

## 事件粒度

后续真实接入时，游戏端只需要上报最少事件。事件是原始层，监测屏接口读取的是聚合层。

| 事件名 | 触发时机 | 必填字段 |
|---|---|---|
| `site_visit` | 玩家打开网站或进入游戏入口 | `eventId`, `anonymousPlayerId`, `occurredAt` |
| `game_session_start` | 正式开始或继续一局游戏 | `eventId`, `anonymousPlayerId`, `sessionId`, `occurredAt` |
| `game_heartbeat` | 游戏页面可见且游戏进行中每 300 秒心跳一次 | `eventId`, `anonymousPlayerId`, `sessionId`, `occurredAt` |
| `game_session_end` | 正常退出、结局完成、显式结束或页面进入后台 | `eventId`, `anonymousPlayerId`, `sessionId`, `occurredAt` |
| `ending_submit` | 产生并提交结局摘要 | `eventId`, `anonymousPlayerId`, `sessionId`, `endingId`, `endingTitle`, `occurredAt` |
| `score_submit` | 提交排行榜分数 | `eventId`, `anonymousPlayerId`, `sessionId`, `score`, `occurredAt` |

事件公共字段：

```json
{
  "eventId": "evt_01J...",
  "anonymousPlayerId": "anon_01J...",
  "sessionId": "ses_01J...",
  "occurredAt": "2026-06-25T18:42:00+08:00",
  "clientBuild": "2026.06.25",
  "source": "web"
}
```

禁止上传真实姓名、手机号、邮箱、微信、精确 IP、身份证明或任何可直接识别个人身份的信息。

## 指标口径

| UI 指标 | 字段名 | 粒度 | 计算规则 |
|---|---|---|---|
| 当前游戏玩家总数 | `gamePlayerTotal` | 所选范围去重玩家 | 有效进入游戏后触发过 `game_session_start`、`game_heartbeat`、`ending_submit` 或 `score_submit` 的匿名玩家去重数 |
| 游戏平均停留时间 | `averageStayMinutes` | 所选范围去重玩家 | 每位匿名玩家在所选范围内的有效游戏总分钟数的平均值；先按 session 估算时长，再累加为玩家总游玩时间 |
| 当前玩家通关总次数 | `completionTotal` | 所选范围通关次数 | 以 `runId + endingId` 去重后的有效 `ending_submit` 次数；旧数据缺少 `ending_submit` 时允许用带分数的 `score_submit` 兜底 |
| 当前日期 | `currentDate` | 生成时间 | `Asia/Shanghai` 当前日期，格式 `YYYY.MM.DD` |
| 近24小时 | `activityTrend.points[].siteUserCount` | 3 小时窗口 | 每个时间窗口内触发过监测事件的匿名玩家去重数 |
| 玩家排行榜 | `leaderboard.players[]` | 每位匿名玩家一行 | 所选范围内每个玩家取最高有效分，按分数降序 |

停留时间规则：

- `averageStayMinutes` 表示玩家总游玩时间的平均值，不表示单局或单个 session 的平均时长。
- 先按 `anonymousPlayerId + sessionId` 清洗有效 session，再把同一匿名玩家在所选范围内的有效 session 分钟数求和。
- 最终指标对这些玩家总游玩分钟数取平均。
- 游戏页面可见且未进入结局时，每 300 秒发送一次 `game_heartbeat`。
- 页面进入后台或被隐藏时，游戏端必须结束当前监测 session；后台期间不得继续发送 `game_heartbeat`。
- 页面重新回到前台后，若仍在游戏中，则重新创建新的监测 session；后台挂页时间不计入停留时间。
- 无 `game_session_end` 时，可用最后一条 `game_heartbeat` 估算。
- 单个 session 低于 `1` 分钟可视为无效。
- 单个 session 高于 `360` 分钟进入异常池，不计入该玩家的总游玩时间。

排行榜规则：

- 同一匿名玩家在同一范围内只保留最高分。
- 分数相同时，较早提交者排名更高。
- 仍相同时，使用匿名玩家 ID 的稳定哈希排序，保证结果可复现。
- 新数据只由有效 `score_submit` 写入排行榜表；历史 `ending_submit` 事件仍可作为只读兜底，避免旧数据消失。
- 如果生产环境配置了 `LEADERBOARD_WRITE_TOKEN`，公开 `score_submit` 只记录监测事件，不直接写入排行榜表；只有可信服务端通道携带 `X-Leaderboard-Write-Token` 时才写入排行榜表。这个 token 不得写进前端代码。
- 排行榜不展示停留时间列。
- `today` 没有有效数据时，前端显示 `暂无玩家游戏数据`。

近 24 小时趋势规则：

- 横轴固定为 `00 / 03 / 06 / 09 / 12 / 15 / 18 / 21 / 24`。
- 每个点表示该 3 小时窗口内使用过网站的人数。
- 同一匿名玩家在同一窗口只计 `1` 次。
- 同一匿名玩家跨多个窗口活跃，可以在多个窗口分别计入。
- 纵轴当前展示刻度为 `0 / 50 / 100 / 500`，仅作为视觉刻度；真实值不得为了贴合刻度而改写。

## 推荐接口

监测 API 使用 Cloudflare Workers；下列接口是固定契约，后续实现调整必须返回同一结构。

```http
GET /api/monitor/dashboard?range=today
GET /api/monitor/dashboard?range=week
GET /api/monitor/dashboard?range=all
```

监测页需要展示全量玩家排行榜时，单独请求：

```http
GET /api/leaderboard?range=today&limit=all
```

响应：

```json
{
  "version": "monitor.v1",
  "range": "today",
  "timeZone": "Asia/Shanghai",
  "generatedAt": "2026-06-25T18:42:00+08:00",
  "summary": {
    "gamePlayerTotal": 0,
    "averageStayMinutes": 38,
    "completionTotal": 0,
    "currentDate": "2026.06.25"
  },
  "activityTrend": {
    "window": "24h",
    "bucketHours": 3,
    "metric": "siteUserCount",
    "unit": "people",
    "points": [
      { "hour": "00", "siteUserCount": 0 },
      { "hour": "03", "siteUserCount": 50 },
      { "hour": "06", "siteUserCount": 100 },
      { "hour": "09", "siteUserCount": 180 },
      { "hour": "12", "siteUserCount": 260 },
      { "hour": "15", "siteUserCount": 340 },
      { "hour": "18", "siteUserCount": 420 },
      { "hour": "21", "siteUserCount": 470 },
      { "hour": "24", "siteUserCount": 500 }
    ]
  },
  "leaderboard": {
    "limit": 20,
    "players": [
      {
        "rank": 1,
        "nickname": "林北遥",
        "school": "南湖建院",
        "score": 9820,
        "endingTitle": "没有退路的选择——一条最孤独之路"
      }
    ]
  }
}
```

## 字段校验

| 字段 | 类型 | 规则 |
|---|---|---|
| `version` | string | 当前固定为 `monitor.v1` |
| `range` | string | 只能是 `today`, `week`, `all` |
| `generatedAt` | string | ISO 8601 时间戳 |
| `gamePlayerTotal` | integer | `>= 0` |
| `averageStayMinutes` | number | `>= 0`，玩家有效总游玩分钟数的平均值；前端展示时四舍五入为分钟 |
| `completionTotal` | integer | `>= 0` |
| `currentDate` | string | `YYYY.MM.DD` |
| `hour` | string | 固定两位字符串：`00`, `03`, `06`, `09`, `12`, `15`, `18`, `21`, `24` |
| `siteUserCount` | integer | `>= 0` |
| `leaderboard.limit` | integer \| string | 常规排行榜为数字；监测页可请求 `"all"` 返回全量玩家 |
| `rank` | integer | 从 `1` 开始连续递增 |
| `nickname` | string | 匿名昵称，最长 16 个中文字符或 32 个英文字符 |
| `school` | string | 可为空，最长 32 个中文字符或 64 个英文字符 |
| `score` | integer | `>= 0` |
| `endingTitle` | string | 来自结局配置或后端白名单 |

## 前端接线规则

- 当前静态数据可以继续存在，但字段结构必须向本文靠拢。
- 后续真实接入时，只新增 `fetchDashboard(range)` 这一类适配函数。
- UI 组件不得直接拼 SQL、直接读数据库 SDK、直接持有鉴权密钥。
- 接口失败时保留最后一次成功快照；首次失败时显示空态，不改变页面结构。
- 前端只做单位格式化和空态展示，不重新计算排行榜、平均停留或趋势人数。
- 范围切换只改变 `range` 参数，不改变字段口径。

建议的前端适配边界：

```text
range button
-> fetchDashboard(range)
-> normalizeMonitorDashboard(response)
-> render summary / trend / leaderboard
```

## 后端聚合规则

后端或数据层至少维护 3 类逻辑数据，不要求现在建表：

| 逻辑数据 | 用途 |
|---|---|
| `monitor_event_log` | 保存匿名事件流，作为聚合来源 |
| `monitor_session_summary` | 保存清洗后的 session 时长和状态，供玩家总游玩时间聚合 |
| `monitor_score_summary` | 保存排行榜分数、结局摘要和排名来源 |

聚合任务可以按请求实时计算，也可以每 `30-60` 秒缓存一次。监测屏不需要秒级实时。

推荐刷新频率：

| 数据 | 推荐刷新 |
|---|---|
| `summary` | 30 秒 |
| `activityTrend` | 60 秒 |
| `leaderboard` | 60 秒 |

## 隐私与安全边界

- 监测屏只展示匿名摘要。
- 不展示单个玩家行为时间线。
- 不展示真实身份。
- 不把学校字段作为实名身份判断依据。
- 不允许前端请求原始事件列表。
- 生产接口需要只读权限；写入事件的接口和监测读取接口分开。
- 排行榜提交必须做基础校验：分数范围、结局 ID 合法、session 存在、重复提交幂等。
- `fresh=1` 只用于运维排查和最新数据刷新，后端必须限流；普通公开读取应走默认缓存。
- 可信排行榜不能只依赖浏览器上报字段；如果排名需要对外承诺真实性，必须增加服务端可验证的完成证明、签名分数或同等级别的反作弊流程。
- 生产页面必须请求同源 `/api`，由阿里云 Nginx 反向代理到绑定在 `world.25thgame.vip` 的监测 Worker；玩家浏览器不直接依赖 `workers.dev` 或其他海外入口。

## 出界内容

本契约不覆盖：

- 游戏规则与结局判定。
- 玩家存档结构。
- 登录、账号、权限后台。
- 复杂运营分析、转化漏斗、玩家生命周期。
- 数据库选型和部署供应商。

如果后续需要新增监测项，先在本文补字段口径，再改接口和前端。
