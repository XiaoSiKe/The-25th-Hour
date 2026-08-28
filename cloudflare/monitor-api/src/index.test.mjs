import assert from "node:assert/strict";
import test from "node:test";
import worker from "./index.js";

const EVENT_URL = "https://25thgame-monitor-api.test/api/monitor/events";
const ORIGIN = "https://arch.25thgame.vip";

test("public score_submit records telemetry and writes leaderboard when no token is configured", async () => {
  const env = createEnv();
  const response = await worker.fetch(eventRequest(scoreEvent(), { ip: "203.0.113.10" }), env, {});

  assert.equal(response.status, 204);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO monitor_events"), 1);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO player_scores"), 1);
});

test("untrusted score_submit records telemetry without leaderboard when token is configured", async () => {
  const env = createEnv({ LEADERBOARD_WRITE_TOKEN: "secret-token" });
  const response = await worker.fetch(
    eventRequest(scoreEvent({ eventId: "evt_score_untrusted" }), { ip: "203.0.113.18" }),
    env,
    {},
  );

  assert.equal(response.status, 204);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO monitor_events"), 1);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO player_scores"), 0);
});

test("trusted score_submit can write leaderboard", async () => {
  const env = createEnv({ LEADERBOARD_WRITE_TOKEN: "secret-token" });
  const response = await worker.fetch(
    eventRequest(scoreEvent({ eventId: "evt_score_trusted" }), {
      ip: "203.0.113.11",
      headers: { "X-Leaderboard-Write-Token": "secret-token" },
    }),
    env,
    {},
  );

  assert.equal(response.status, 204);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO monitor_events"), 1);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO player_scores"), 1);
});

test("score_submit writes leaderboard even when the nickname already exists", async () => {
  const env = createEnv({
    firstResults: [{ anonymous_player_id: "anon_owner" }],
  });
  const response = await worker.fetch(
    eventRequest(scoreEvent({
      eventId: "evt_score_duplicate_name",
      anonymousPlayerId: "anon_other",
      nickname: "Taken Name",
    }), { ip: "203.0.113.20" }),
    env,
    {},
  );

  assert.equal(response.status, 204);
  assert.equal(countSql(env.calls, "LOWER(TRIM(nickname)) = ?"), 0);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO player_scores"), 1);
});

test("duplicate score_submit only writes leaderboard after matching telemetry exists", async () => {
  const duplicateEnv = createEnv({
    firstResults: [{ event_type: "score_submit" }],
    runResults: [{ meta: { changes: 0 } }, { meta: { changes: 1 } }],
  });
  const duplicateResponse = await worker.fetch(
    eventRequest(scoreEvent({ eventId: "evt_duplicate_score" }), { ip: "203.0.113.16" }),
    duplicateEnv,
    {},
  );

  assert.equal(duplicateResponse.status, 204);
  assert.equal(countSql(duplicateEnv.calls, "SELECT event_type"), 1);
  assert.equal(countSql(duplicateEnv.calls, "INSERT OR IGNORE INTO player_scores"), 1);

  const conflictingEnv = createEnv({
    firstResults: [{ event_type: "ending_submit" }],
    runResults: [{ meta: { changes: 0 } }],
  });
  const conflictingResponse = await worker.fetch(
    eventRequest(scoreEvent({ eventId: "evt_duplicate_ending" }), { ip: "203.0.113.17" }),
    conflictingEnv,
    {},
  );

  assert.equal(conflictingResponse.status, 204);
  assert.equal(countSql(conflictingEnv.calls, "SELECT event_type"), 1);
  assert.equal(countSql(conflictingEnv.calls, "INSERT OR IGNORE INTO player_scores"), 0);
});

test("ending_submit records completion telemetry without duplicating leaderboard rows", async () => {
  const env = createEnv();
  const response = await worker.fetch(
    eventRequest(endingEvent(), { ip: "203.0.113.14" }),
    env,
    {},
  );

  assert.equal(response.status, 204);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO monitor_events"), 1);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO player_scores"), 0);
});

test("coffee support click records telemetry without a game session", async () => {
  const env = createEnv();
  const response = await worker.fetch(
    eventRequest({
      eventType: "coffee_support_click",
      eventId: "evt_coffee_public",
      anonymousPlayerId: "anon_coffee",
      occurredAt: "2026-06-27T00:00:00.000Z",
      source: "web",
    }, { ip: "203.0.113.15" }),
    env,
    {},
  );

  assert.equal(response.status, 204);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO monitor_events"), 1);
  assert.equal(countSql(env.calls, "INSERT OR IGNORE INTO player_scores"), 0);
});

test("body size is enforced after reading requests without content-length", async () => {
  const env = createEnv();
  const response = await worker.fetch(new Request(EVENT_URL, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "CF-Connecting-IP": "203.0.113.12",
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({ padding: "x".repeat(17 * 1024) }),
  }), env, {});

  assert.equal(response.status, 413);
  assert.equal(env.calls.length, 0);
});

test("monitor event writes are rate limited per client bucket", async () => {
  const env = createEnv();
  for (let index = 0; index < 90; index += 1) {
    const response = await worker.fetch(
      eventRequest(scoreEvent({ eventId: `evt_rate_${index}` }), { ip: "203.0.113.13" }),
      env,
      {},
    );
    assert.equal(response.status, 204);
  }

  const response = await worker.fetch(
    eventRequest(scoreEvent({ eventId: "evt_rate_blocked" }), { ip: "203.0.113.13" }),
    env,
    {},
  );
  assert.equal(response.status, 429);
});

test("fresh monitor reads are rate limited per client bucket", async () => {
  const env = createEnv();
  for (let index = 0; index < 30; index += 1) {
    const response = await worker.fetch(
      new Request("https://25thgame-monitor-api.test/api/leaderboard?limit=10&fresh=1", {
        headers: {
          Origin: ORIGIN,
          "CF-Connecting-IP": "203.0.113.19",
        },
      }),
      env,
      {},
    );
    assert.equal(response.status, 200);
  }

  const response = await worker.fetch(
    new Request("https://25thgame-monitor-api.test/api/leaderboard?limit=10&fresh=1", {
      headers: {
        Origin: ORIGIN,
        "CF-Connecting-IP": "203.0.113.19",
      },
    }),
    env,
    {},
  );
  assert.equal(response.status, 429);
});

test("leaderboard query includes only scored historical public completion events", async () => {
  const env = createEnv({ allResults: [] });
  const response = await worker.fetch(new Request("https://25thgame-monitor-api.test/api/leaderboard?limit=10&fresh=1"), env, {});

  assert.equal(response.status, 200);
  const leaderboardCall = env.calls.find((call) => call.kind === "all");
  assert.ok(leaderboardCall?.sql.includes("FROM monitor_events"));
  assert.ok(leaderboardCall?.sql.includes("event_type IN ('score_submit', 'ending_submit')"));
  assert.ok(leaderboardCall?.sql.includes("score IS NOT NULL"));
  assert.ok(!leaderboardCall?.sql.includes("COALESCE(score, 0)"));
});

test("leaderboard ignores monitor telemetry score fallback when write token is configured", async () => {
  const env = createEnv({ LEADERBOARD_WRITE_TOKEN: "secret-token", allResults: [] });
  const response = await worker.fetch(new Request("https://25thgame-monitor-api.test/api/leaderboard?limit=10&fresh=1"), env, {});

  assert.equal(response.status, 200);
  const leaderboardCall = env.calls.find((call) => call.kind === "all");
  assert.ok(leaderboardCall?.sql.includes("FROM player_scores"));
  assert.ok(leaderboardCall?.sql.includes("0 = 1"));
  assert.ok(!leaderboardCall?.sql.includes("event_type = 'score_submit' AND score IS NOT NULL"));
  assert.ok(!leaderboardCall?.sql.includes("event_type = 'ending_submit'"));
});

test("leaderboard can return every ranked player for monitor views", async () => {
  const env = createEnv({
    allResults: [
      {
        anonymous_player_id: "anon_one",
        leaderboard_rank: 1,
        nickname: "One Player",
        school: "One School",
        score: 2000,
        ending_title: "One Ending",
        occurred_at: "2026-06-27T00:00:00.000Z",
      },
      {
        anonymous_player_id: "anon_two",
        leaderboard_rank: 2,
        nickname: "Two Player",
        school: "Two School",
        score: 1900,
        ending_title: "Two Ending",
        occurred_at: "2026-06-27T00:00:00.000Z",
      },
    ],
  });
  const response = await worker.fetch(new Request("https://25thgame-monitor-api.test/api/leaderboard?limit=all&fresh=1"), env, {});
  const body = await response.json();
  const leaderboardCall = env.calls.find((call) => call.kind === "all");

  assert.equal(response.status, 200);
  assert.equal(body.leaderboard.limit, "all");
  assert.equal(body.leaderboard.players.length, 2);
  assert.equal(leaderboardCall?.args.length, 1);
  assert.ok(!leaderboardCall?.sql.includes("LIMIT ?"));
  assert.ok(leaderboardCall?.sql.includes("score_events_in_range"));
  assert.ok(leaderboardCall?.sql.includes("WHERE occurred_at <= ?"));
});

test("leaderboard response fills empty player names", async () => {
  const env = createEnv({
    allResults: [
      {
        anonymous_player_id: "anon_blank",
        nickname: "   ",
        school: "",
        score: 900,
        ending_title: "",
        occurred_at: "2026-06-27T00:00:00.000Z",
      },
    ],
  });
  const response = await worker.fetch(new Request("https://25thgame-monitor-api.test/api/leaderboard?limit=10&fresh=1"), env, {});
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.leaderboard.players[0].nickname, "匿名玩家");
  assert.equal(body.leaderboard.players[0].school, "未知建院");
  assert.equal(body.leaderboard.players[0].endingTitle, "人生结局");
});

test("leaderboard currentPlayer keeps true global rank", async () => {
  const env = createEnv({
    allResultsQueue: [
      [
        {
          anonymous_player_id: "anon_top",
          leaderboard_rank: 1,
          nickname: "Top Player",
          school: "Top School",
          score: 2000,
          ending_title: "Top Ending",
          occurred_at: "2026-06-27T00:00:00.000Z",
        },
      ],
      [
        {
          anonymous_player_id: "anon_self",
          leaderboard_rank: 42,
          nickname: "Self Player",
          school: "Self School",
          score: 1200,
          ending_title: "Self Ending",
          occurred_at: "2026-06-27T00:00:00.000Z",
        },
      ],
    ],
  });
  const response = await worker.fetch(new Request("https://25thgame-monitor-api.test/api/leaderboard?limit=10&playerId=anon_self&fresh=1"), env, {});
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.leaderboard.players[0].rank, 1);
  assert.equal(body.leaderboard.currentPlayer.rank, 42);
  assert.equal(body.leaderboard.currentPlayer.nickname, "Self Player");

  const currentPlayerCall = env.calls.filter((call) => call.kind === "all")[1];
  assert.equal(currentPlayerCall.args.at(-1), "anon_self");
  assert.ok(currentPlayerCall.sql.includes("WHERE leaderboard_ranked.anonymous_player_id = ?"));
});

test("dashboard uses score_submit fallback for completions and stay time", async () => {
  const env = createEnv({
    firstResults: [
      { total: 5 },
      { total: 2 },
      { total: 1 },
      { total: 4 },
      { average_minutes: 3.4 },
    ],
    batchResults: Array.from({ length: 8 }, () => ({ results: [{ total: 0 }] })),
    allResults: [],
  });
  const response = await worker.fetch(new Request("https://25thgame-monitor-api.test/api/monitor/dashboard?range=all&fresh=1"), env, {});
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.summary.siteVisitorTotal, 5);
  assert.equal(body.summary.gamePlayerTotal, 2);
  assert.equal(body.summary.completionTotal, 1);
  assert.equal(body.summary.coffeeSupporterTotal, 4);
  assert.equal(body.summary.averageStayMinutes, 3.4);

  const firstSql = env.calls.filter((call) => call.kind === "first").map((call) => call.sql);
  assert.ok(firstSql[0].includes("event_type = 'site_visit'"));
  assert.ok(firstSql[1].includes("'score_submit'"));
  assert.ok(firstSql[2].includes("COUNT(DISTINCT"));
  assert.ok(firstSql[2].includes("score_submit"));
  assert.ok(firstSql[3].includes("event_type = 'coffee_support_click'"));
  assert.ok(firstSql[4].includes("duration_seconds"));
  assert.ok(firstSql[4].includes("duration_minutes >= 1"));
  assert.ok(firstSql.slice(0, 5).every((sql) => sql.includes("occurred_at <= ?")));
  assert.ok(env.calls.filter((call) => call.kind === "first").slice(0, 5).every((call) => call.args.length === 1));

  const batchCall = env.calls.find((call) => call.kind === "batch");
  assert.ok(batchCall?.statements.every((statement) => statement.sql.includes("game_heartbeat")));
  assert.ok(batchCall?.statements.every((statement) => statement.sql.includes("score_submit")));
});

test("dashboard trend buckets follow the selected range", async () => {
  const weekEnv = createEnv({
    firstResults: [
      { total: 0 },
      { total: 0 },
      { total: 0 },
      { total: 0 },
      { average_minutes: 0 },
    ],
    batchResults: Array.from({ length: 7 }, (_item, index) => ({ results: [{ total: index + 1 }] })),
    allResults: [],
  });
  const weekResponse = await worker.fetch(new Request("https://25thgame-monitor-api.test/api/monitor/dashboard?range=week&fresh=1"), weekEnv, {});
  const weekBody = await weekResponse.json();

  assert.equal(weekResponse.status, 200);
  assert.equal(weekBody.activityTrend.window, "7d");
  assert.equal(weekBody.activityTrend.bucketDays, 1);
  assert.equal(weekBody.activityTrend.points.length, 7);
  assert.match(weekBody.activityTrend.points[0].label, /^\d{2}\.\d{2}$/u);
  assert.equal(weekBody.activityTrend.points[6].siteUserCount, 7);
  assert.equal(weekEnv.calls.find((call) => call.kind === "batch")?.statements.length, 7);

  const allEnv = createEnv({
    firstResults: [
      { total: 0 },
      { total: 0 },
      { total: 0 },
      { total: 0 },
      { average_minutes: 0 },
      { first_occurred_at: "2026-06-01T00:00:00.000Z" },
    ],
    batchResults: Array.from({ length: 12 }, (_item, index) => ({ results: [{ total: index + 1 }] })),
    allResults: [],
  });
  const allResponse = await worker.fetch(new Request("https://25thgame-monitor-api.test/api/monitor/dashboard?range=all&fresh=1"), allEnv, {});
  const allBody = await allResponse.json();
  const allBatchCall = allEnv.calls.find((call) => call.kind === "batch");

  assert.equal(allResponse.status, 200);
  assert.equal(allBody.activityTrend.window, "all");
  assert.equal(allBody.activityTrend.bucketDays, 7);
  assert.ok(allBody.activityTrend.points.length >= 1);
  assert.match(allBody.activityTrend.points[0].label, /^\d{2}\.\d{2}周$/u);
  assert.equal(allBatchCall?.statements.length, allBody.activityTrend.points.length);
});

function eventRequest(body, { ip, headers = {} }) {
  return new Request(EVENT_URL, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "CF-Connecting-IP": ip,
      "Content-Type": "text/plain",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function scoreEvent(overrides = {}) {
  return {
    eventType: "score_submit",
    eventId: "evt_score_public",
    anonymousPlayerId: "anon_test",
    sessionId: "session_test",
    occurredAt: "2026-06-27T00:00:00.000Z",
    source: "web",
    runId: "run_test",
    endingId: "ending_test",
    endingTitle: "Test Ending",
    nickname: "Test Player",
    school: "Test School",
    score: 1234,
    ...overrides,
  };
}

function endingEvent(overrides = {}) {
  const { score, ...event } = scoreEvent({
    eventType: "ending_submit",
    eventId: "evt_ending_public",
    endingId: "failure_test",
    endingTitle: "Failure Ending",
    ...overrides,
  });
  return event;
}

function createEnv(extra = {}) {
  const calls = [];
  const { allResults = [], allResultsQueue = null, batchResults = [], firstResults = [], runResults = [], ...envExtra } = extra;
  const firstResultQueue = [...firstResults];
  const allResultQueue = Array.isArray(allResultsQueue) ? [...allResultsQueue] : null;
  const runResultQueue = [...runResults];
  return {
    ...envExtra,
    calls,
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            const statement = {
              sql,
              args,
              async run() {
                calls.push({ kind: "run", sql, args });
                return runResultQueue.length ? runResultQueue.shift() : { meta: { changes: 1 } };
              },
              async first() {
                calls.push({ kind: "first", sql, args });
                return firstResultQueue.length ? firstResultQueue.shift() : null;
              },
              async all() {
                calls.push({ kind: "all", sql, args });
                return { results: allResultQueue?.length ? allResultQueue.shift() : allResults };
              },
            };
            return statement;
          },
        };
      },
      async batch(statements) {
        calls.push({
          kind: "batch",
          statements: statements.map((statement) => ({ sql: statement.sql, args: statement.args })),
        });
        if (batchResults.length) return batchResults;
        return statements.map(() => ({ results: [{ total: 0 }] }));
      },
    },
  };
}

function countSql(calls, needle) {
  return calls.filter((call) => call.sql.includes(needle)).length;
}
