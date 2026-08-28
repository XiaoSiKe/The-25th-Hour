import { monitorApiBaseFor } from "./api-origin.mjs";

export const MONITOR_API_BASE = typeof window !== "undefined"
  ? monitorApiBaseFor(window.location)
  : "";
const ANONYMOUS_PLAYER_KEY = "twenty-fifth-hour-monitor-anonymous-player";
const SESSION_KEY = "twenty-fifth-hour-monitor-session";
const SESSION_RUN_KEY = "twenty-fifth-hour-monitor-session-run";
const ENDING_REPORTED_KEY_PREFIX = "twenty-fifth-hour-monitor-ending";
const PENDING_ENDING_REPORTS_KEY = "twenty-fifth-hour-monitor-pending-ending-reports";
const MAX_PENDING_ENDING_REPORTS = 20;
const HEARTBEAT_INTERVAL_MS = 300000;

let heartbeatTimer = null;
let lifecycleBound = false;
let pendingEndingFlushPromise = null;

export function reportSiteVisit({ surface = "" } = {}) {
  sendEvent("site_visit", {
    surface,
    eventId: uniqueEventId("site"),
  });
}

export function reportGameSessionStart(state, { surface = "" } = {}) {
  if (!state) return;
  ensureGameSession(state);
  sendEvent("game_session_start", {
    surface,
    sessionId: currentSessionId(),
    runId: state.runId,
    payload: {
      phase: state.phase,
      year: state.year,
      semesterIndex: state.semesterIndex,
      nickname: state.profile?.nickname,
      school: state.profile?.universityName,
    },
    nickname: state.profile?.nickname,
    school: state.profile?.universityName,
    eventId: uniqueEventId("session-start"),
  });
}

export function reportCoffeeSupportClick({ surface = "" } = {}) {
  sendEvent("coffee_support_click", {
    surface,
    sessionId: currentSessionId(),
    eventId: uniqueEventId("coffee-support"),
  });
}

export function reportEndingAndScore({ state, ending, score, surface = "" } = {}) {
  if (!state?.ending) return Promise.resolve(false);
  ensureGameSession(state);
  const key = `${ENDING_REPORTED_KEY_PREFIX}:${state.runId}:${state.ending}`;
  if (localStorage.getItem(key) === "sent") return Promise.resolve(false);

  const common = {
    surface,
    sessionId: currentSessionId(),
    runId: state.runId,
    endingId: state.ending,
    endingTitle: ending?.title,
    nickname: state.profile?.nickname,
    school: state.profile?.universityName,
    durationSeconds: currentSessionAgeSeconds(),
  };
  upsertPendingEndingReport({
    key,
    events: [
      monitorEventBody("game_session_end", {
        ...common,
        payload: {
          phase: state.phase,
          endingId: state.ending,
        },
        eventId: stableEventId("session-end", state.runId, state.ending),
      }),
      monitorEventBody("ending_submit", {
        ...common,
        eventId: stableEventId("ending", state.runId, state.ending),
      }),
      monitorEventBody("score_submit", {
        ...common,
        score,
        eventId: stableEventId("score", state.runId, state.ending),
      }),
    ],
  });

  return flushPendingEndingReports();
}

export function flushPendingEndingReports() {
  if (!MONITOR_API_BASE || typeof window === "undefined" || typeof window.fetch !== "function") {
    return Promise.resolve(false);
  }
  if (pendingEndingFlushPromise) return pendingEndingFlushPromise;
  pendingEndingFlushPromise = flushPendingEndingReportsOnce().finally(() => {
    pendingEndingFlushPromise = null;
  });
  return pendingEndingFlushPromise;
}

export function currentAnonymousPlayerId() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(ANONYMOUS_PLAYER_KEY) || "";
}

export function startMonitorHeartbeat(getState, { surface = "" } = {}) {
  if (heartbeatTimer) return;
  const readSurface = typeof surface === "function" ? surface : () => surface;
  heartbeatTimer = window.setInterval(() => {
    if (!isPageVisible()) return;
    const state = getState();
    if (!state || state.ending) return;
    ensureGameSession(state);
    sendEvent("game_heartbeat", {
      surface: readSurface(),
      sessionId: currentSessionId(),
      runId: state.runId,
      durationSeconds: currentSessionAgeSeconds(),
      payload: {
        phase: state.phase,
        year: state.year,
        semesterIndex: state.semesterIndex,
        week: state.week,
      },
      eventId: uniqueEventId("heartbeat"),
    });
  }, HEARTBEAT_INTERVAL_MS);

  if (!lifecycleBound) {
    lifecycleBound = true;
    document.addEventListener("visibilitychange", () => {
      const state = getState();
      if (document.visibilityState === "hidden") {
        reportCurrentGameSessionEnd(state, readSurface());
        flushPendingEndingReports();
        clearGameSession();
        return;
      }
      if (state && !state.ending && !currentSessionId()) {
        reportGameSessionStart(state, { surface: readSurface() });
      }
    });
    window.addEventListener("pagehide", () => {
      const state = getState();
      reportCurrentGameSessionEnd(state, readSurface());
      flushPendingEndingReports();
      clearGameSession();
    });
  }
}

function reportCurrentGameSessionEnd(state, surface) {
  const sessionId = currentSessionId();
  if (!state || !sessionId) return;
  sendEvent("game_session_end", {
    surface,
    sessionId,
    runId: state.runId,
    durationSeconds: currentSessionAgeSeconds(),
    payload: {
      phase: state.phase,
      endingId: state.ending,
    },
    eventId: uniqueEventId("session-end"),
  });
}

function sendEvent(eventType, payload = {}) {
  if (!MONITOR_API_BASE || typeof window === "undefined") return false;
  const body = JSON.stringify(monitorEventBody(eventType, payload));
  const url = `${MONITOR_API_BASE}/api/monitor/events`;

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }));
    if (sent) return true;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
    keepalive: true,
  }).catch(() => {});
  return true;
}

function monitorEventBody(eventType, payload = {}) {
  return {
    eventType,
    eventId: payload.eventId ?? uniqueEventId(eventType),
    anonymousPlayerId: anonymousPlayerId(),
    sessionId: payload.sessionId ?? null,
    occurredAt: new Date().toISOString(),
    clientBuild: "web-static",
    source: "web",
    surface: payload.surface,
    runId: payload.runId,
    pageUrl: `${window.location.origin}${window.location.pathname}`,
    referrer: document.referrer,
    endingId: payload.endingId,
    endingTitle: payload.endingTitle,
    score: payload.score,
    durationSeconds: payload.durationSeconds,
    nickname: payload.nickname,
    school: payload.school,
    payload: payload.payload,
  };
}

async function flushPendingEndingReportsOnce() {
  const reports = readPendingEndingReports();
  if (!reports.length) return false;

  const remaining = [];
  let sentAny = false;
  for (const report of reports) {
    const ok = await postPendingEndingReport(report);
    if (ok) {
      localStorage.setItem(report.key, "sent");
      sentAny = true;
    } else {
      remaining.push(report);
    }
  }
  writePendingEndingReports(remaining);
  return sentAny;
}

async function postPendingEndingReport(report) {
  if (!report?.key || !Array.isArray(report.events) || !report.events.length) return true;
  const url = `${MONITOR_API_BASE}/api/monitor/events`;
  try {
    for (const event of report.events) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(event),
        keepalive: true,
      });
      if (!response.ok) return false;
    }
  } catch {
    return false;
  }
  return true;
}

function upsertPendingEndingReport(report) {
  if (!report?.key || !Array.isArray(report.events) || !report.events.length) return;
  const reports = readPendingEndingReports().filter((item) => item.key !== report.key);
  reports.push(report);
  writePendingEndingReports(reports.slice(-MAX_PENDING_ENDING_REPORTS));
}

function readPendingEndingReports() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PENDING_ENDING_REPORTS_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((report) => report?.key && Array.isArray(report.events));
  } catch {
    return [];
  }
}

function writePendingEndingReports(reports) {
  if (!reports.length) {
    localStorage.removeItem(PENDING_ENDING_REPORTS_KEY);
    return;
  }
  localStorage.setItem(PENDING_ENDING_REPORTS_KEY, JSON.stringify(reports));
}

function anonymousPlayerId() {
  const existing = localStorage.getItem(ANONYMOUS_PLAYER_KEY);
  if (existing) return existing;
  const next = stableEventId("anon", cryptoRandom(), Date.now());
  localStorage.setItem(ANONYMOUS_PLAYER_KEY, next);
  return next;
}

function ensureGameSession(state) {
  const runId = String(state?.runId ?? "");
  const existingSession = sessionStorage.getItem(SESSION_KEY);
  const existingRunId = sessionStorage.getItem(SESSION_RUN_KEY);
  if (existingSession && existingRunId === runId) return existingSession;
  const nextSession = stableEventId("ses", runId || cryptoRandom(), Date.now());
  sessionStorage.setItem(SESSION_KEY, nextSession);
  sessionStorage.setItem(SESSION_RUN_KEY, runId);
  sessionStorage.setItem(`${SESSION_KEY}:started-at`, String(Date.now()));
  return nextSession;
}

function currentSessionId() {
  return sessionStorage.getItem(SESSION_KEY) || null;
}

function clearGameSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_RUN_KEY);
  sessionStorage.removeItem(`${SESSION_KEY}:started-at`);
}

function currentSessionAgeSeconds() {
  const startedAt = Number(sessionStorage.getItem(`${SESSION_KEY}:started-at`) || Date.now());
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}

function isPageVisible() {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

function uniqueEventId(prefix) {
  return stableEventId(prefix, Date.now(), cryptoRandom());
}

function stableEventId(...parts) {
  return `evt_${parts.map((part) => String(part ?? "").replace(/[^a-zA-Z0-9_-]+/g, "-")).filter(Boolean).join("_")}`.slice(0, 96);
}

function cryptoRandom() {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return `${values[0].toString(36)}${values[1].toString(36)}`;
}
