#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const DEFAULT_FLOW_DOMAIN = "https://openapi-rdc.aliyuncs.com";
const DEFAULT_ALIYUN_SITE_URL = "https://arch.25thgame.vip";
const NEW_STARTUP_MARKERS = [
  "STARTUP_GATE_MAX_WAIT_MS = 30000",
  "runtimeRetryAssetUrl",
];
const OLD_STARTUP_MARKERS = [
  "queueStartupGateR2FallbackImagePreloads",
  "STARTUP_MEDIA_AFTER_IMAGE_PROGRESS_RATIO",
];

loadLocalEnv();

const args = parseArgs(process.argv.slice(2));
const command = args._[0] || "help";

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(error?.exitCode || 1);
});

async function main() {
  if (command === "help" || args.help) {
    printHelp();
    return;
  }

  if (command === "site") {
    await checkLiveSite();
    return;
  }

  const config = readFlowConfig();
  switch (command) {
    case "latest":
    case "status":
      await showLatestRun(config);
      break;
    case "runs":
      await listRuns(config);
      break;
    case "get":
      await getRun(config);
      break;
    case "run":
    case "start":
      await startRun(config);
      break;
    default:
      throw usageError(`Unknown command: ${command}`);
  }
}

async function showLatestRun(config) {
  const { data } = await flowRequest(config, "GET", "/runs/latestPipelineRun");
  if (args.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  printRun(data, { title: "Latest Aliyun Flow run" });
}

async function listRuns(config) {
  const query = {
    page: stringOption("page", "1"),
    perPage: stringOption("per-page", stringOption("perPage", "10")),
  };
  const status = stringOption("status");
  const triggerMode = stringOption("trigger-mode", stringOption("triggerMode"));
  if (status) query.status = status;
  if (triggerMode) query.triggerMode = triggerMode;

  const { data, headers } = await flowRequest(config, "GET", "/runs", { query });
  if (args.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const total = headers.get("x-total");
  const page = headers.get("x-page");
  const totalPages = headers.get("x-total-pages");
  console.log(`Aliyun Flow runs${total ? `: ${total} total` : ""}${page ? `, page ${page}${totalPages ? `/${totalPages}` : ""}` : ""}`);
  for (const run of asArray(data)) {
    printRun(run, { compact: true });
  }
}

async function getRun(config) {
  const runId = stringOption("run-id", stringOption("runId", args._[1]));
  if (!runId) throw usageError("Missing run id. Use: npm run aliyun:flow -- get --run-id <id>");
  const { data } = await flowRequest(config, "GET", `/runs/${encodeURIComponent(runId)}`);
  if (args.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  printRun(data, { title: `Aliyun Flow run ${runId}` });
}

async function startRun(config) {
  const branch = stringOption("branch", "main");
  const repo = stringOption("repo", env("YUNXIAO_REPO_URL") || gitOriginUrl());
  const comment = stringOption("comment", `Manual run from local aliyun-flow.mjs on ${new Date().toISOString()}`);
  const envs = parseEnvOptions();
  const params = {};

  if (branch) {
    params.branchModeBranchs = [branch];
    if (repo) {
      params.runningBranchs = { [repo]: branch };
    }
  }
  if (Object.keys(envs).length > 0) params.envs = envs;
  if (comment) params.comment = comment;

  const body = Object.keys(params).length > 0
    ? { params: JSON.stringify(params) }
    : {};
  const { data } = await flowRequest(config, "POST", "/runs", { body });
  if (args.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  const runId = data?.pipelineRunId || data?.id || data?.runId || "";
  console.log(`Started Aliyun Flow pipeline${runId ? ` run ${runId}` : ""}.`);
  if (branch) console.log(`Branch: ${branch}`);
  if (repo) console.log(`Repo: ${repo}`);
  if (data && typeof data === "object") {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function checkLiveSite() {
  const siteUrl = normalizeBaseUrl(stringOption("url", env("ALIYUN_SITE_URL") || DEFAULT_ALIYUN_SITE_URL));
  const appUrl = `${siteUrl}/app.mjs?codex_verify=${Date.now()}`;
  const versionUrl = `${siteUrl}/version.json?codex_verify=${Date.now()}`;

  const [appResponse, versionResponse] = await Promise.all([
    fetch(appUrl, { headers: { "Cache-Control": "no-cache" } }),
    fetch(versionUrl, { headers: { "Cache-Control": "no-cache" } }).catch(() => null),
  ]);
  const appText = await appResponse.text();
  const versionText = versionResponse?.ok ? await versionResponse.text() : "";
  const newMarkers = NEW_STARTUP_MARKERS.map((marker) => [marker, appText.includes(marker)]);
  const oldMarkers = OLD_STARTUP_MARKERS.map((marker) => [marker, appText.includes(marker)]);

  console.log(`Aliyun site: ${siteUrl}`);
  console.log(`app.mjs: HTTP ${appResponse.status}, ${appText.length} bytes`);
  console.log(`last-modified: ${appResponse.headers.get("last-modified") || "(none)"}`);
  console.log(`etag: ${appResponse.headers.get("etag") || "(none)"}`);
  if (versionText) {
    console.log(`version.json: ${oneLine(versionText)}`);
  }
  for (const [marker, present] of newMarkers) {
    console.log(`${present ? "OK" : "MISSING"} new marker: ${marker}`);
  }
  for (const [marker, present] of oldMarkers) {
    console.log(`${present ? "STILL_PRESENT" : "OK"} old marker: ${marker}`);
  }

  const hasNewCode = newMarkers.every(([, present]) => present)
    && oldMarkers.every(([, present]) => !present);
  if (!hasNewCode) {
    process.exitCode = 1;
  }
}

async function flowRequest(config, method, endpoint, { query = {}, body } = {}) {
  const url = new URL(flowEndpoint(config, endpoint));
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-yunxiao-token": config.token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const data = parseJsonResponse(text);
  if (!response.ok) {
    const message = data?.message || data?.errorMessage || data?.error || text || response.statusText;
    const error = new Error(`Aliyun Flow API ${method} ${url.pathname} failed: HTTP ${response.status} ${message}`);
    error.exitCode = response.status === 401 || response.status === 403 ? 3 : 1;
    throw error;
  }
  return { data, headers: response.headers };
}

function flowEndpoint(config, endpoint) {
  const base = config.regionMode
    ? `/oapi/v1/flow/pipelines/${encodeURIComponent(config.pipelineId)}`
    : `/oapi/v1/flow/organizations/${encodeURIComponent(config.organizationId)}/pipelines/${encodeURIComponent(config.pipelineId)}`;
  return `${config.domain}${base}${endpoint}`;
}

function readFlowConfig() {
  const token = env("YUNXIAO_TOKEN") || env("ALIYUN_FLOW_TOKEN");
  const pipelineId = env("YUNXIAO_PIPELINE_ID") || env("ALIYUN_FLOW_PIPELINE_ID");
  const organizationId = env("YUNXIAO_ORGANIZATION_ID") || env("ALIYUN_FLOW_ORGANIZATION_ID");
  const regionMode = truthy(env("YUNXIAO_REGION_MODE") || env("ALIYUN_FLOW_REGION_MODE"));
  const missing = [];
  if (!token) missing.push("YUNXIAO_TOKEN");
  if (!pipelineId) missing.push("YUNXIAO_PIPELINE_ID");
  if (!regionMode && !organizationId) missing.push("YUNXIAO_ORGANIZATION_ID");
  if (missing.length) {
    throw usageError(`Missing Aliyun Flow config: ${missing.join(", ")}

Set them in your shell or ignored .env.local:
YUNXIAO_TOKEN=pt-...
YUNXIAO_ORGANIZATION_ID=...
YUNXIAO_PIPELINE_ID=...

For Region Edition, set YUNXIAO_REGION_MODE=1 and omit YUNXIAO_ORGANIZATION_ID.
Optional: YUNXIAO_FLOW_DOMAIN=${DEFAULT_FLOW_DOMAIN}`);
  }
  return {
    domain: normalizeBaseUrl(env("YUNXIAO_FLOW_DOMAIN") || env("ALIYUN_FLOW_DOMAIN") || DEFAULT_FLOW_DOMAIN),
    token,
    organizationId,
    pipelineId,
    regionMode,
  };
}

function printRun(run, { title = "", compact = false } = {}) {
  if (title) console.log(title);
  if (!run || typeof run !== "object") {
    console.log("(empty run response)");
    return;
  }
  const runId = run.pipelineRunId || run.id || run.runId || run.pipelineRunInstId || "(unknown)";
  const status = run.status || run.state || run.result || run.stageInfo?.status || "(unknown)";
  const trigger = triggerLabel(run.triggerMode);
  const start = run.startTime || run.createTime || run.createdAt || run.stageInfo?.startTime;
  const end = run.endTime || run.updateTime || run.updatedAt || run.stageInfo?.endTime;
  const duration = start && end ? `${Math.round((Number(end) - Number(start)) / 1000)}s` : "";
  const branch = firstBranch(run);
  const summary = [
    `run=${runId}`,
    `status=${status}`,
    trigger ? `trigger=${trigger}` : "",
    branch ? `branch=${branch}` : "",
    start ? `start=${formatTime(start)}` : "",
    end ? `end=${formatTime(end)}` : "",
    duration ? `duration=${duration}` : "",
  ].filter(Boolean).join(" ");
  console.log(summary);

  if (compact) return;
  const jobs = collectJobs(run);
  if (jobs.length) {
    console.log("jobs:");
    for (const job of jobs) {
      const jobName = job.name || job.displayName || job.id || "(unnamed)";
      const jobStatus = job.status || job.state || job.result || job.stageInfo?.status || "(unknown)";
      console.log(`- ${jobName}: ${jobStatus}`);
    }
  }
}

function collectJobs(run) {
  const jobs = [];
  for (const stage of asArray(run.stages || run.groups || run.stageGroup)) {
    jobs.push(...asArray(stage.jobs || stage.children || stage.stageInfo?.jobs));
  }
  return jobs;
}

function firstBranch(run) {
  for (const source of asArray(run.sources)) {
    const branch = source?.data?.branch || source?.branch || source?.runningBranch;
    if (branch) return branch;
  }
  return "";
}

function triggerLabel(value) {
  const labels = {
    1: "manual",
    2: "scheduled",
    3: "code",
    5: "pipeline",
    6: "webhook",
  };
  return labels[value] || (value ? String(value) : "");
}

function parseEnvOptions() {
  const envs = {};
  const values = [...asArray(args.env), ...asArray(args.e)];
  for (const value of values) {
    const index = String(value).indexOf("=");
    if (index <= 0) throw usageError(`Invalid --env value: ${value}. Expected KEY=VALUE.`);
    envs[String(value).slice(0, index)] = String(value).slice(index + 1);
  }
  return envs;
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      result._.push(item);
      continue;
    }
    const raw = item.slice(2);
    const equalIndex = raw.indexOf("=");
    const key = equalIndex >= 0 ? raw.slice(0, equalIndex) : raw;
    const normalizedKey = key.replace(/-([a-z])/gu, (_, char) => char.toUpperCase());
    const value = equalIndex >= 0
      ? raw.slice(equalIndex + 1)
      : (argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true);
    if (result[key] === undefined && result[normalizedKey] === undefined) {
      result[key] = value;
      result[normalizedKey] = value;
    } else {
      const previous = result[key] ?? result[normalizedKey];
      const next = [...asArray(previous), value];
      result[key] = next;
      result[normalizedKey] = next;
    }
  }
  return result;
}

function stringOption(name, fallback = "") {
  const value = args[name];
  if (Array.isArray(value)) return String(value[value.length - 1]);
  if (value === true || value === undefined || value === null) return fallback;
  return String(value);
}

function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/u)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = unquote(rawValue.trim());
    }
  }
}

function unquote(value) {
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function gitOriginUrl() {
  try {
    return execSync("git remote get-url origin", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function parseJsonResponse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function oneLine(text) {
  return text.replace(/\s+/gu, " ").trim();
}

function formatTime(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return new Date(numeric).toISOString();
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/u, "");
}

function env(name) {
  return process.env[name] || "";
}

function truthy(value) {
  return /^(1|true|yes|on)$/iu.test(String(value || ""));
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

function usageError(message) {
  const error = new Error(`${message}\n\nRun npm run aliyun:flow -- help for usage.`);
  error.exitCode = 2;
  return error;
}

function printHelp() {
  console.log(`Aliyun Flow helper

Usage:
  npm run aliyun:flow -- site [--url https://arch.25thgame.vip]
  npm run aliyun:flow -- latest
  npm run aliyun:flow -- runs [--page 1] [--per-page 10] [--status RUNNING] [--trigger-mode 6]
  npm run aliyun:flow -- get --run-id <id>
  npm run aliyun:flow -- run [--branch main] [--repo <git-url>] [--comment <text>] [--env KEY=VALUE]

Required for Flow API commands:
  YUNXIAO_TOKEN
  YUNXIAO_PIPELINE_ID
  YUNXIAO_ORGANIZATION_ID   (Central Edition only)

Optional:
  YUNXIAO_FLOW_DOMAIN=${DEFAULT_FLOW_DOMAIN}
  YUNXIAO_REGION_MODE=1     (Region Edition path)
  YUNXIAO_REPO_URL=<git-url>
  ALIYUN_SITE_URL=${DEFAULT_ALIYUN_SITE_URL}

Secrets may live in ignored .env.local.`);
}
