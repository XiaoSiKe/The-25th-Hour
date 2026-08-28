import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ENDING_TRACKS, musicForState } from "../web-app/game/music.mjs";
import { OPTIMIZED_ASSET_PATHS } from "../web-app/ui/optimized-assets-manifest.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const checks = [];

function pass(label, detail = "") {
  checks.push({ ok: true, label, detail });
}

function warn(label, detail = "") {
  checks.push({ ok: false, label, detail });
}

function command(commandName, args = []) {
  try {
    return execFileSync(commandName, args, {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

async function canBindPort(port) {
  return new Promise((resolvePort) => {
    const server = createServer();
    server.once("error", () => resolvePort(false));
    server.once("listening", () => {
      server.close(() => resolvePort(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

function checkCommand(label, commandName, args = [], expectedPrefix = "") {
  const output = command(commandName, args);
  if (!output) {
    warn(label, `${commandName} not found`);
    return "";
  }
  if (expectedPrefix && !output.startsWith(expectedPrefix)) {
    warn(label, `${output}; expected ${expectedPrefix}`);
    return output;
  }
  pass(label, output);
  return output;
}

function checkPath(path, label = path) {
  if (existsSync(resolve(projectRoot, path))) pass(label);
  else warn(label, "missing");
}

function checkMusicAssets() {
  const source = readFileSync(resolve(projectRoot, "web-app/game/music.mjs"), "utf8");
  const bgmPaths = [...source.matchAll(/track\([^\n]*?["']([^"']+\.(?:m4a|mp3))["'][^\n]*\)/gi)].map((match) => match[1]);
  const endingPaths = ENDING_TRACKS.flatMap((track) => [track.src, track.lyricsSrc]);
  const forcedEndingPaths = [
    "graduation_failed",
    "living_cost_break",
    "pressure_collapse",
    "two_failed_reviews",
    "forced_suspension",
  ].map((ending) => musicForState({ ending, seed: 25 }).src);
  const paths = [...new Set([...bgmPaths, ...endingPaths, ...forcedEndingPaths].filter(Boolean))];
  const missing = paths.filter((path) => !assetExists(path));

  if (missing.length === 0) pass("music assets", `${paths.length} files found`);
  else warn("music assets", `${missing.length} missing:\n${missing.join("\n")}`);
}

function assetExists(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (existsSync(resolve(projectRoot, normalizeLocalAssetPath(normalized)))) return true;
  const optimizedPath = OPTIMIZED_ASSET_PATHS[normalized];
  return optimizedPath ? existsSync(resolve(projectRoot, normalizeLocalAssetPath(optimizedPath))) : false;
}

function normalizeLocalAssetPath(path) {
  const normalized = path.replace(/^\//u, "");
  return normalized.startsWith("optimized/") ? `web-app/${normalized}` : normalized;
}

function checkGitIdentity() {
  const name = command("git", ["config", "--global", "user.name"]);
  const email = command("git", ["config", "--global", "user.email"]);
  if (name && email) pass("git identity", `${name} <${email}>`);
  else warn("git identity", "set with: git config --global user.name \"Your Name\" && git config --global user.email \"you@example.com\"");
}

function checkOptionalCli(commandName, installHint) {
  const found = command("which", [commandName]);
  if (found) pass(`${commandName} cli`, found);
  else warn(`${commandName} cli`, installHint);
}

checkCommand("node", "node", ["--version"], `v${readFileSync(resolve(projectRoot, ".nvmrc"), "utf8").trim()}`);
checkCommand("npm", "npm", ["--version"]);
checkCommand("git", "git", ["--version"]);
checkGitIdentity();

checkPath("package.json");
checkPath("web-app/index.html");
checkPath("web-app/server.mjs");
checkPath("web-app/game/music.mjs");
checkPath("web-app/optimized/asset-work/assets/audio/year-bgm");
checkPath("web-app/optimized/asset-work/assets/audio/ending-tracks");
checkPath("asset-work/assets/fonts/aa-pixel/AaPingPingGuoGuoXiangSuTi-2-web.a18216ecc4d9.woff2", "aa-pixel font");
checkMusicAssets();

if (await canBindPort(4173)) pass("local port 4173", "available");
else warn("local port 4173", "already in use; run npm run web with another port, e.g. npm run web -- 4174");

checkOptionalCli("gh", "optional for GitHub automation");
checkOptionalCli("wrangler", "optional for Cloudflare Workers/R2/D1 later");

for (const check of checks) {
  const prefix = check.ok ? "PASS" : "WARN";
  console.log(`${prefix} ${check.label}${check.detail ? `: ${check.detail}` : ""}`);
}

const blockingFailures = checks.filter((check) => !check.ok && !check.label.endsWith("cli") && check.label !== "git identity");
if (blockingFailures.length > 0) {
  process.exitCode = 1;
}
