const VERSION = "monitor.v1";
const TIME_ZONE = "Asia/Shanghai";
const ALLOWED_EVENT_TYPES = new Set([
  "site_visit",
  "coffee_support_click",
  "game_session_start",
  "game_heartbeat",
  "game_session_end",
  "ending_submit",
  "score_submit",
]);
const SCORE_MAX = 10000000;
const MAX_BODY_BYTES = 16 * 1024;
const EVENT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const EVENT_RATE_LIMIT_MAX = 90;
const FRESH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const FRESH_RATE_LIMIT_MAX = 30;
const API_CACHE_SECONDS = 15;
const DEFAULT_LEADERBOARD_LIMIT = 20;
const MAX_LEADERBOARD_LIMIT = 20;
const LEADERBOARD_WRITE_TOKEN_HEADER = "X-Leaderboard-Write-Token";
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;
const TREND_BUCKET_START_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];
const TREND_EVENT_TYPES = "('site_visit', 'game_session_start', 'game_heartbeat', 'game_session_end', 'ending_submit', 'score_submit')";
const FALLBACK_ALLOWED_ORIGIN_HOSTS = new Set([
  "arch.25thgame.vip",
]);
const eventRateBuckets = new Map();
const freshRateBuckets = new Map();
const textEncoder = new TextEncoder();

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors.headers });
    }

    if (!cors.allowed) {
      return json({ error: "origin_not_allowed" }, { status: 403, headers: cors.headers });
    }

    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, version: VERSION }, { headers: cors.headers });
      }

      if (request.method === "POST" && url.pathname === "/api/monitor/events") {
        return recordEvent(request, env, cors.headers);
      }

      if (request.method === "GET" && url.pathname === "/api/monitor/dashboard") {
        const limited = freshBypassRateLimitResponse(request, cors.headers, url);
        if (limited) return limited;
        return cachedJson(request, cors.headers, ctx, () => dashboardPayload(url, env), {
          bypassCache: url.searchParams.get("fresh") === "1",
        });
      }

      if (request.method === "GET" && url.pathname === "/api/leaderboard") {
        const limited = freshBypassRateLimitResponse(request, cors.headers, url);
        if (limited) return limited;
        return cachedJson(request, cors.headers, ctx, () => leaderboardPayload(url, env), {
          bypassCache: url.searchParams.get("fresh") === "1",
        });
      }

      return json({ error: "not_found" }, { status: 404, headers: cors.headers });
    } catch (error) {
      console.error("monitor_api_error", error);
      return json({ error: "internal_error" }, { status: 500, headers: cors.headers });
    }
  },
};

async function recordEvent(request, env, headers) {
  if (!consumeEventQuota(request)) {
    return json({ error: "rate_limited" }, {
      status: 429,
      headers: { ...headers, "Retry-After": String(EVENT_RATE_LIMIT_WINDOW_MS / 1000) },
    });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, { status: 413, headers });
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return json({ error: body.reason }, { status: body.status, headers });
  }
  const event = normalizeEvent(body.value);
  if (!event.ok) {
    return json({ error: event.reason }, { status: 400, headers });
  }

  const item = event.value;
  const eventInsert = await env.DB.prepare(`
    INSERT OR IGNORE INTO monitor_events (
      event_id,
      event_type,
      anonymous_player_id,
      session_id,
      occurred_at,
      client_build,
      source,
      surface,
      run_id,
      page_url,
      referrer,
      ending_id,
      ending_title,
      score,
      duration_seconds,
      payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    item.eventId,
    item.eventType,
    item.anonymousPlayerId,
    item.sessionId,
    item.occurredAt,
    item.clientBuild,
    item.source,
    item.surface,
    item.runId,
    item.pageUrl,
    item.referrer,
    item.endingId,
    item.endingTitle,
    item.score,
    item.durationSeconds,
    item.payloadJson,
  ).run();

  const shouldWritePlayerScore = item.sessionId
    && item.eventType === "score_submit"
    && item.score !== null
    && canWriteLeaderboardScore(request, env);
  if (shouldWritePlayerScore) {
    const eventWasRecorded = Number(eventInsert?.meta?.changes ?? 0) > 0
      || await existingMonitorEvent(env, item.eventId, item.eventType);
    if (eventWasRecorded) await insertPlayerScore(env, {
      ...item,
      score: item.score ?? 0,
    });
  }

  return new Response(null, { status: 204, headers });
}

function canWriteLeaderboardScore(request, env) {
  const requiredToken = leaderboardWriteToken(env);
  if (!requiredToken) return true;
  return request.headers.get(LEADERBOARD_WRITE_TOKEN_HEADER) === requiredToken;
}

function leaderboardWriteToken(env) {
  return String(env.LEADERBOARD_WRITE_TOKEN || "").trim();
}

async function existingMonitorEvent(env, eventId, eventType) {
  const row = await env.DB.prepare(`
    SELECT event_type
    FROM monitor_events
    WHERE event_id = ?
    LIMIT 1
  `).bind(eventId).first();
  return row?.event_type === eventType;
}

async function insertPlayerScore(env, item) {
  await env.DB.prepare(`
    INSERT OR IGNORE INTO player_scores (
      event_id,
      anonymous_player_id,
      session_id,
      run_id,
      nickname,
      school,
      score,
      ending_id,
      ending_title,
      occurred_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    item.eventId,
    item.anonymousPlayerId,
    item.sessionId,
    item.runId,
    item.nickname,
    item.school,
    item.score,
    item.endingId,
    item.endingTitle,
    item.occurredAt,
  ).run();
}

async function dashboardPayload(url, env) {
  const range = normalizeRange(url.searchParams.get("range"));
  const now = new Date();
  const start = rangeStart(range, now);
  const leaderboardLimit = normalizeLeaderboardLimit(url.searchParams.get("limit"));
  const end = now.toISOString();
  const rangeFilter = start ? "AND occurred_at >= ? AND occurred_at <= ?" : "AND occurred_at <= ?";
  const scoreRangeFilter = start ? "WHERE occurred_at >= ? AND occurred_at <= ?" : "WHERE occurred_at <= ?";
  const rangeArgs = start ? [start.toISOString(), end] : [end];
  const includeMonitorScoreSubmits = !leaderboardWriteToken(env);

  const [
    siteVisitors,
    players,
    completions,
    coffeeSupporters,
    averageStay,
    trendPoints,
    leaderboardPlayers,
  ] = await Promise.all([
    countSiteVisitors(env, rangeFilter, rangeArgs),
    countPlayers(env, rangeFilter, rangeArgs),
    countCompletions(env, rangeFilter, rangeArgs),
    countCoffeeSupporters(env, rangeFilter, rangeArgs),
    averageStayMinutes(env, rangeFilter, rangeArgs),
    activityTrend(env, now, range),
    leaderboard(env, scoreRangeFilter, rangeArgs, leaderboardLimit, { includeMonitorScoreSubmits }),
  ]);

  return {
    version: VERSION,
    range,
    timeZone: TIME_ZONE,
    generatedAt: now.toISOString(),
    summary: {
      siteVisitorTotal: siteVisitors,
      gamePlayerTotal: players,
      averageStayMinutes: averageStay,
      completionTotal: completions,
      coffeeSupporterTotal: coffeeSupporters,
      currentDate: formatShanghaiDate(now),
    },
    activityTrend: {
      window: trendPoints.window,
      bucketHours: trendPoints.bucketHours,
      bucketDays: trendPoints.bucketDays,
      metric: "siteUserCount",
      unit: "people",
      points: trendPoints.points,
    },
    leaderboard: {
      limit: leaderboardLimit,
      players: leaderboardPlayers,
    },
  };
}

async function leaderboardPayload(url, env) {
  const range = normalizeRange(url.searchParams.get("range") || "all");
  const now = new Date();
  const start = rangeStart(range, now);
  const limit = normalizeLeaderboardLimit(url.searchParams.get("limit"));
  const playerId = cleanString(url.searchParams.get("playerId"), 96);
  const end = now.toISOString();
  const scoreRangeFilter = start ? "WHERE occurred_at >= ? AND occurred_at <= ?" : "WHERE occurred_at <= ?";
  const rangeArgs = start ? [start.toISOString(), end] : [end];
  const includeMonitorScoreSubmits = !leaderboardWriteToken(env);
  const [players, currentPlayer] = await Promise.all([
    leaderboard(env, scoreRangeFilter, rangeArgs, limit, { includeMonitorScoreSubmits }),
    playerId ? leaderboardCurrentPlayer(env, scoreRangeFilter, rangeArgs, playerId, { includeMonitorScoreSubmits }) : null,
  ]);
  return {
    version: VERSION,
    range,
    timeZone: TIME_ZONE,
    generatedAt: now.toISOString(),
    leaderboard: {
      limit,
      players,
      currentPlayer,
    },
  };
}

async function countSiteVisitors(env, rangeFilter, args) {
  const row = await env.DB.prepare(`
    SELECT COUNT(DISTINCT anonymous_player_id) AS total
    FROM monitor_events
    WHERE event_type = 'site_visit'
    ${rangeFilter}
  `).bind(...args).first();
  return Number(row?.total ?? 0);
}

async function countPlayers(env, rangeFilter, args) {
  const row = await env.DB.prepare(`
    SELECT COUNT(DISTINCT anonymous_player_id) AS total
    FROM monitor_events
    WHERE event_type IN ('game_session_start', 'game_heartbeat', 'ending_submit', 'score_submit')
    ${rangeFilter}
  `).bind(...args).first();
  return Number(row?.total ?? 0);
}

async function countCompletions(env, rangeFilter, args) {
  const row = await env.DB.prepare(`
    WITH completion_rows AS (
      SELECT
        COALESCE(NULLIF(run_id, ''), anonymous_player_id || ':' || COALESCE(NULLIF(session_id, ''), event_id)) AS run_key,
        COALESCE(NULLIF(ending_id, ''), 'unknown_ending') AS ending_key
      FROM monitor_events
      WHERE (event_type = 'ending_submit' OR (event_type = 'score_submit' AND score IS NOT NULL))
      ${rangeFilter}
    )
    SELECT COUNT(DISTINCT run_key || ':' || ending_key) AS total
    FROM completion_rows
  `).bind(...args).first();
  return Number(row?.total ?? 0);
}

async function countCoffeeSupporters(env, rangeFilter, args) {
  const row = await env.DB.prepare(`
    SELECT COUNT(DISTINCT anonymous_player_id) AS total
    FROM monitor_events
    WHERE event_type = 'coffee_support_click'
    ${rangeFilter}
  `).bind(...args).first();
  return Number(row?.total ?? 0);
}

async function averageStayMinutes(env, rangeFilter, args) {
  const row = await env.DB.prepare(`
    WITH session_rows AS (
      SELECT
        anonymous_player_id,
        session_id,
        (julianday(MAX(occurred_at)) - julianday(MIN(occurred_at))) * 24 * 60 AS event_span_minutes,
        COALESCE(MAX(duration_seconds), 0) / 60.0 AS reported_minutes
      FROM monitor_events
      WHERE session_id IS NOT NULL
        AND event_type IN ('game_session_start', 'game_heartbeat', 'game_session_end', 'ending_submit', 'score_submit')
        ${rangeFilter}
      GROUP BY anonymous_player_id, session_id
    ),
    duration_rows AS (
      SELECT
        anonymous_player_id,
        session_id,
        CASE
          WHEN event_span_minutes > reported_minutes THEN event_span_minutes
          ELSE reported_minutes
        END AS duration_minutes
      FROM session_rows
    )
    SELECT AVG(total_minutes) AS average_minutes
    FROM (
      SELECT anonymous_player_id, SUM(duration_minutes) AS total_minutes
      FROM duration_rows
      WHERE duration_minutes >= 1 AND duration_minutes <= 360
      GROUP BY anonymous_player_id
    )
  `).bind(...args).first();
  return roundOne(row?.average_minutes ?? 0);
}

async function activityTrend(env, now, range) {
  if (range === "week") return dailyActivityTrend(env, now);
  if (range === "all") return weeklyActivityTrend(env, now);
  return hourlyActivityTrend(env, now);
}

async function hourlyActivityTrend(env, now) {
  const dayStart = startOfShanghaiDay(now);
  const statements = TREND_BUCKET_START_HOURS.map((hour) => {
    const bucketStart = new Date(dayStart.getTime() + hour * 60 * 60 * 1000);
    const bucketEnd = new Date(bucketStart.getTime() + 3 * 60 * 60 * 1000);
    const cappedBucketEnd = new Date(Math.min(bucketEnd.getTime(), now.getTime()));
    return env.DB.prepare(`
      SELECT COUNT(DISTINCT anonymous_player_id) AS total
      FROM monitor_events
      WHERE event_type IN ${TREND_EVENT_TYPES}
        AND occurred_at >= ?
        AND occurred_at < ?
    `).bind(bucketStart.toISOString(), cappedBucketEnd.toISOString());
  });
  const rows = await env.DB.batch(statements);
  return {
    window: "24h",
    bucketHours: 3,
    points: TREND_BUCKET_START_HOURS.map((hour, index) => ({
      hour: String(hour).padStart(2, "0"),
      siteUserCount: Number(rows[index]?.results?.[0]?.total ?? 0),
    })),
  };
}

async function dailyActivityTrend(env, now) {
  const todayStart = startOfShanghaiDay(now);
  const days = Array.from({ length: 7 }, (_item, index) => {
    return new Date(todayStart.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
  });
  const rows = await countTrendBuckets(env, days, 24 * 60 * 60 * 1000, now);
  return {
    window: "7d",
    bucketDays: 1,
    points: days.map((dayStart, index) => ({
      label: formatShanghaiMonthDay(dayStart),
      siteUserCount: Number(rows[index]?.results?.[0]?.total ?? 0),
    })),
  };
}

async function weeklyActivityTrend(env, now) {
  const firstRow = await env.DB.prepare(`
    SELECT MIN(occurred_at) AS first_occurred_at
    FROM monitor_events
    WHERE event_type IN ${TREND_EVENT_TYPES}
      AND occurred_at <= ?
  `).bind(now.toISOString()).first();
  const currentWeekStart = startOfShanghaiDay(now);
  const firstWeekStart = firstRow?.first_occurred_at
    ? startOfShanghaiDay(new Date(firstRow.first_occurred_at))
    : currentWeekStart;
  const weeks = [];
  for (
    let weekStart = firstWeekStart;
    weekStart.getTime() <= currentWeekStart.getTime();
    weekStart = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  ) {
    weeks.push(weekStart);
  }
  const rows = await countTrendBuckets(env, weeks, 7 * 24 * 60 * 60 * 1000, now);
  return {
    window: "all",
    bucketDays: 7,
    points: weeks.map((weekStart, index) => ({
      label: `${formatShanghaiMonthDay(weekStart)}周`,
      siteUserCount: Number(rows[index]?.results?.[0]?.total ?? 0),
    })),
  };
}

async function countTrendBuckets(env, starts, bucketMs, now) {
  const statements = starts.map((bucketStart) => {
    const bucketEnd = new Date(bucketStart.getTime() + bucketMs);
    const cappedBucketEnd = new Date(Math.min(bucketEnd.getTime(), now.getTime()));
    return env.DB.prepare(`
      SELECT COUNT(DISTINCT anonymous_player_id) AS total
      FROM monitor_events
      WHERE event_type IN ${TREND_EVENT_TYPES}
        AND occurred_at >= ?
        AND occurred_at < ?
    `).bind(bucketStart.toISOString(), cappedBucketEnd.toISOString());
  });
  return env.DB.batch(statements);
}

async function leaderboard(env, scoreRangeFilter, args, limit, { includeMonitorScoreSubmits = true } = {}) {
  return leaderboardRowsToPayload(await leaderboardRows(env, scoreRangeFilter, args, {
    limit,
    includeMonitorScoreSubmits,
  }));
}

async function leaderboardCurrentPlayer(env, scoreRangeFilter, args, playerId, { includeMonitorScoreSubmits = true } = {}) {
  const rows = await leaderboardRows(env, scoreRangeFilter, args, {
    playerId,
    includeMonitorScoreSubmits,
  });
  return leaderboardRowsToPayload(rows)[0] ?? null;
}

async function leaderboardRows(
  env,
  scoreRangeFilter,
  args,
  { limit = 0, playerId = "", includeMonitorScoreSubmits = true } = {},
) {
  const shouldLimit = limit !== "all";
  const monitorScoreEventFilter = includeMonitorScoreSubmits
    ? "event_type IN ('score_submit', 'ending_submit') AND score IS NOT NULL"
    : "0 = 1";
  const resultFilter = playerId
    ? "WHERE leaderboard_ranked.anonymous_player_id = ?"
    : `ORDER BY leaderboard_ranked.leaderboard_rank ASC${shouldLimit ? " LIMIT ?" : ""}`;
  const bindings = playerId ? [...args, playerId] : shouldLimit ? [...args, limit] : args;
  const result = await env.DB.prepare(`
    WITH raw_score_events AS (
      SELECT
        event_id,
        anonymous_player_id,
        session_id,
        run_id,
        nickname,
        school,
        score,
        ending_id,
        ending_title,
        occurred_at
      FROM player_scores
      UNION ALL
      SELECT
        event_id,
        anonymous_player_id,
        session_id,
        run_id,
        NULL AS nickname,
        NULL AS school,
        score,
        ending_id,
        ending_title,
        occurred_at
      FROM monitor_events
      WHERE ${monitorScoreEventFilter}
    ),
    score_events AS (
      SELECT
        event_id,
        anonymous_player_id,
        session_id,
        run_id,
        nickname,
        school,
        score,
        ending_id,
        ending_title,
        occurred_at
      FROM (
        SELECT
          raw_score_events.*,
          ROW_NUMBER() OVER (
            PARTITION BY event_id
            ORDER BY
              CASE
                WHEN NULLIF(TRIM(COALESCE(nickname, '')), '') IS NOT NULL
                  OR NULLIF(TRIM(COALESCE(school, '')), '') IS NOT NULL
                THEN 0
                ELSE 1
              END,
              occurred_at DESC
          ) AS event_rank
        FROM raw_score_events
      )
      WHERE event_rank = 1
    ),
    score_events_in_range AS (
      SELECT *
      FROM score_events
      ${scoreRangeFilter}
    ),
    ranked_scores AS (
      SELECT
        *,
        ROW_NUMBER() OVER (
          PARTITION BY anonymous_player_id
          ORDER BY score DESC, occurred_at ASC, event_id ASC
        ) AS player_rank
      FROM score_events_in_range
    ),
    profile_rows AS (
      SELECT
        anonymous_player_id,
        nickname,
        school,
        ROW_NUMBER() OVER (
          PARTITION BY anonymous_player_id
          ORDER BY
            CASE
              WHEN NULLIF(TRIM(COALESCE(nickname, '')), '') IS NOT NULL
                AND NULLIF(TRIM(COALESCE(school, '')), '') IS NOT NULL
              THEN 0
              WHEN NULLIF(TRIM(COALESCE(nickname, '')), '') IS NOT NULL THEN 1
              WHEN NULLIF(TRIM(COALESCE(school, '')), '') IS NOT NULL THEN 2
              ELSE 3
            END,
            occurred_at DESC,
            event_id DESC
        ) AS profile_rank
      FROM score_events
      WHERE NULLIF(TRIM(COALESCE(nickname, '')), '') IS NOT NULL
         OR NULLIF(TRIM(COALESCE(school, '')), '') IS NOT NULL
    ),
    latest_ending_rows AS (
      SELECT
        anonymous_player_id,
        ending_title,
        ROW_NUMBER() OVER (
          PARTITION BY anonymous_player_id
          ORDER BY occurred_at DESC, event_id DESC
        ) AS ending_rank
      FROM score_events_in_range
      WHERE NULLIF(TRIM(COALESCE(ending_title, '')), '') IS NOT NULL
    ),
    player_best_scores AS (
      SELECT
        ranked_scores.anonymous_player_id,
        COALESCE(NULLIF(TRIM(profile_rows.nickname), ''), NULLIF(TRIM(ranked_scores.nickname), ''), '匿名玩家') AS nickname,
        COALESCE(NULLIF(TRIM(profile_rows.school), ''), NULLIF(TRIM(ranked_scores.school), ''), '未知建院') AS school,
        ranked_scores.score,
        COALESCE(NULLIF(TRIM(latest_ending_rows.ending_title), ''), NULLIF(TRIM(ranked_scores.ending_title), ''), '人生结局') AS ending_title,
        ranked_scores.occurred_at
      FROM ranked_scores
      LEFT JOIN profile_rows
        ON profile_rows.anonymous_player_id = ranked_scores.anonymous_player_id
        AND profile_rows.profile_rank = 1
      LEFT JOIN latest_ending_rows
        ON latest_ending_rows.anonymous_player_id = ranked_scores.anonymous_player_id
        AND latest_ending_rows.ending_rank = 1
      WHERE ranked_scores.player_rank = 1
    ),
    leaderboard_ranked AS (
      SELECT
        player_best_scores.*,
        ROW_NUMBER() OVER (
          ORDER BY player_best_scores.score DESC, player_best_scores.occurred_at ASC, player_best_scores.anonymous_player_id ASC
        ) AS leaderboard_rank
      FROM player_best_scores
    )
    SELECT
      leaderboard_ranked.anonymous_player_id,
      leaderboard_ranked.leaderboard_rank,
      leaderboard_ranked.nickname,
      leaderboard_ranked.school,
      leaderboard_ranked.score,
      leaderboard_ranked.ending_title,
      leaderboard_ranked.occurred_at
    FROM leaderboard_ranked
    ${resultFilter}
  `).bind(...bindings).all();

  return result.results ?? [];
}

function leaderboardRowsToPayload(rows) {
  return (rows ?? []).map((row, index) => {
    const rank = Number(row.leaderboard_rank ?? row.rank);
    return {
      rank: Number.isInteger(rank) && rank > 0 ? rank : index + 1,
      nickname: cleanString(row.nickname, 32) || "匿名玩家",
      school: cleanString(row.school, 64) || "未知建院",
      score: Number(row.score ?? 0),
      endingTitle: cleanString(row.ending_title, 160) || "人生结局",
    };
  });
}

async function readJsonBody(request) {
  const text = await request.text();
  if (textEncoder.encode(text).byteLength > MAX_BODY_BYTES) {
    return { ok: false, reason: "payload_too_large", status: 413 };
  }
  if (!text.trim()) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: true, value: null };
  }
}

function normalizeEvent(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, reason: "invalid_body" };
  }

  const eventType = cleanString(body.eventType, 40);
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return { ok: false, reason: "invalid_event_type" };
  }

  const eventId = cleanString(body.eventId, 96);
  const anonymousPlayerId = cleanString(body.anonymousPlayerId, 96);
  if (!eventId || !anonymousPlayerId) {
    return { ok: false, reason: "missing_required_id" };
  }

  const occurredAt = normalizeIsoTime(body.occurredAt);
  const sessionId = cleanString(body.sessionId, 96);
  if (eventType !== "site_visit" && eventType !== "coffee_support_click" && !sessionId) {
    return { ok: false, reason: "missing_session_id" };
  }

  const score = normalizeScore(body.score);
  if (eventType === "score_submit" && score === null) {
    return { ok: false, reason: "invalid_score" };
  }

  return {
    ok: true,
    value: {
      eventId,
      eventType,
      anonymousPlayerId,
      sessionId: sessionId || null,
      occurredAt,
      clientBuild: cleanString(body.clientBuild, 60) || null,
      source: cleanString(body.source, 30) || "web",
      surface: cleanString(body.surface, 20) || null,
      runId: cleanString(body.runId, 96) || null,
      pageUrl: cleanString(body.pageUrl, 300) || null,
      referrer: cleanString(body.referrer, 300) || null,
      endingId: cleanString(body.endingId, 96) || null,
      endingTitle: cleanString(body.endingTitle, 160) || null,
      nickname: cleanString(body.nickname, 32) || null,
      school: cleanString(body.school, 64) || null,
      score,
      durationSeconds: normalizeInteger(body.durationSeconds, 0, 24 * 60 * 60),
      payloadJson: JSON.stringify(safePayload(body.payload)),
    },
  };
}

function normalizeRange(value) {
  return value === "week" || value === "all" ? value : "today";
}

function normalizeLeaderboardLimit(value) {
  const rawValue = String(value ?? "").trim().toLowerCase();
  if (rawValue === "all") return "all";
  const number = Number(rawValue || DEFAULT_LEADERBOARD_LIMIT);
  if (!Number.isFinite(number)) return DEFAULT_LEADERBOARD_LIMIT;
  return Math.min(MAX_LEADERBOARD_LIMIT, Math.max(1, Math.round(number)));
}

function rangeStart(range, now) {
  if (range === "all") return null;
  const today = startOfShanghaiDay(now);
  if (range === "week") return new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  return today;
}

function startOfShanghaiDay(date) {
  const shifted = new Date(date.getTime() + SHANGHAI_OFFSET_MS);
  const utcDayStart = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  return new Date(utcDayStart - SHANGHAI_OFFSET_MS);
}

function formatShanghaiDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date).replace(/\//g, ".");
}

function formatShanghaiMonthDay(date) {
  const shifted = new Date(date.getTime() + SHANGHAI_OFFSET_MS);
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${month}.${day}`;
}

function normalizeIsoTime(value) {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function normalizeScore(value) {
  if (value === undefined || value === null || value === "") return null;
  return normalizeInteger(value, 0, SCORE_MAX);
}

function normalizeInteger(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const rounded = Math.round(number);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

function cleanString(value, maxLength) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  const result = {};
  for (const [key, value] of Object.entries(payload).slice(0, 20)) {
    if (!/^[a-zA-Z0-9_:-]{1,40}$/.test(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      result[key] = typeof value === "string" ? value.slice(0, 200) : value;
    }
  }
  return result;
}

function consumeEventQuota(request) {
  return consumeQuota(eventRateBuckets, request, EVENT_RATE_LIMIT_WINDOW_MS, EVENT_RATE_LIMIT_MAX);
}

function freshBypassRateLimitResponse(request, headers, url) {
  if (url.searchParams.get("fresh") !== "1") return null;
  if (consumeQuota(freshRateBuckets, request, FRESH_RATE_LIMIT_WINDOW_MS, FRESH_RATE_LIMIT_MAX)) {
    return null;
  }
  return json({ error: "rate_limited" }, {
    status: 429,
    headers: { ...headers, "Retry-After": String(FRESH_RATE_LIMIT_WINDOW_MS / 1000) },
  });
}

function consumeQuota(buckets, request, windowMs, maxCount) {
  const key = eventRateLimitKey(request);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    pruneRateBuckets(buckets, now);
    return true;
  }
  if (bucket.count >= maxCount) return false;
  bucket.count += 1;
  return true;
}

function eventRateLimitKey(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const origin = request.headers.get("Origin") || "originless";
  return `${ip}|${origin}`;
}

function pruneRateBuckets(buckets, now) {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function roundOne(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number * 10) / 10;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowed = !origin || isAllowedOrigin(origin, allowedOrigins);
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (allowed && origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return { allowed, headers };
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (allowedOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && FALLBACK_ALLOWED_ORIGIN_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function json(value, init = {}) {
  const { cacheSeconds = 0, headers = {}, ...responseInit } = init;
  return Response.json(value, {
    ...responseInit,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheSeconds > 0
        ? `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`
        : "no-store",
    },
  });
}

async function cachedJson(request, headers, ctx, buildValue, { bypassCache = false } = {}) {
  if (bypassCache || !globalThis.caches?.default) {
    return withCacheStatus(json(await buildValue(), { headers }), "BYPASS");
  }

  const cache = caches.default;
  const cacheKey = cacheRequestFor(request);
  const cached = await cache.match(cacheKey);
  if (cached) return withCacheStatus(cached, "HIT");

  const response = withCacheStatus(json(await buildValue(), { headers, cacheSeconds: API_CACHE_SECONDS }), "MISS");
  ctx?.waitUntil?.(cache.put(cacheKey, response.clone()).catch(() => {}));
  return response;
}

function cacheRequestFor(request) {
  const url = new URL(request.url);
  url.searchParams.delete("fresh");
  const origin = request.headers.get("Origin") || "";
  if (origin) url.searchParams.set("__origin", origin);
  return new Request(url.toString(), { method: "GET" });
}

function withCacheStatus(response, status) {
  const headers = new Headers(response.headers);
  headers.set("X-Monitor-Cache", status);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
