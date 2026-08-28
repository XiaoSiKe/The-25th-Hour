import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const bucket = process.env.R2_BUCKET ?? "25thgame-assets-apac";
const prefix = process.env.R2_PREFIX ?? "assets/v1";
const immutableCacheControl = "public, max-age=31536000, immutable";
const shortCacheControl = "no-cache";
const concurrency = Number(process.env.R2_UPLOAD_CONCURRENCY ?? 1);
const maxAttempts = Number(process.env.R2_UPLOAD_ATTEMPTS ?? 4);
const retryDelayMs = Number(process.env.R2_UPLOAD_RETRY_DELAY_MS ?? 1500);
const dryRun = process.argv.includes("--dry-run");
const dryRunLimit = Number(process.env.R2_DRY_RUN_LIMIT ?? 40);

const uploads = new Map();

addDirectory(resolve(projectRoot, "web-app/optimized"), "optimized");

const entries = [...uploads.values()];
console.log(`R2 upload plan: ${entries.length} objects -> ${bucket}/${prefix}`);
if (dryRun) {
  const visibleEntries = dryRunLimit > 0 ? entries.slice(0, dryRunLimit) : entries;
  for (const entry of visibleEntries) console.log(`${entry.key} <- ${entry.file}`);
  if (dryRunLimit > 0 && entries.length > dryRunLimit) console.log(`... ${entries.length - dryRunLimit} more`);
  process.exit(0);
}

let nextIndex = 0;
let completed = 0;
let failed = 0;

await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));

if (failed > 0) {
  console.error(`R2 upload failed for ${failed} objects.`);
  process.exit(1);
}

console.log(`R2 upload complete: ${completed} objects.`);

async function worker() {
  while (nextIndex < entries.length) {
    const entry = entries[nextIndex++];
    try {
      await uploadWithRetry(entry);
      completed += 1;
      if (completed % 50 === 0 || completed === entries.length) {
        console.log(`Uploaded ${completed}/${entries.length}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`Upload failed: ${entry.key}\n${error?.message ?? error}`);
    }
  }
}

function addDirectory(root, targetRoot) {
  if (!existsSync(root)) return;
  for (const file of walkFiles(root)) {
    const key = joinKey(targetRoot, relative(root, file));
    addFile(file, key);
  }
}

function addFile(file, key) {
  if (!existsSync(file) || !statSync(file).isFile()) return;
  uploads.set(key, { file, key });
}

function joinKey(...parts) {
  return parts
    .filter(Boolean)
    .join("/")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}

function* walkFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(path);
    } else if (entry.isFile()) {
      yield path;
    }
  }
}

async function uploadWithRetry(entry) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await upload(entry);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      const delayMs = retryDelayMs * attempt;
      console.warn(`Retrying ${entry.key} (${attempt + 1}/${maxAttempts}) after ${delayMs}ms`);
      await delay(delayMs);
    }
  }
  throw lastError;
}

function upload({ file, key }) {
  const objectPath = `${bucket}/${prefix}/${key}`;
  const args = [
    "r2",
    "object",
    "put",
    objectPath,
    "--file",
    file,
    "--content-type",
    contentType(file),
    "--cache-control",
    cacheControlForKey(key),
    "--remote",
    "--force",
  ];
  return run("wrangler", args);
}

function cacheControlForKey(key) {
  return /\.[a-f0-9]{12}\.[^/.]+$/iu.test(key) ? immutableCacheControl : shortCacheControl;
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(stderr.trim() || `${command} exited with ${code}`));
    });
  });
}

function contentType(file) {
  switch (extname(file).toLowerCase()) {
    case ".html": return "text/html; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".js":
    case ".mjs": return "text/javascript; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".svg": return "image/svg+xml";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".mp3": return "audio/mpeg";
    case ".m4a": return "audio/mp4";
    case ".ogg": return "audio/ogg";
    case ".wav": return "audio/wav";
    case ".lrc": return "text/plain; charset=utf-8";
    case ".ttf": return "font/ttf";
    case ".woff": return "font/woff";
    case ".woff2": return "font/woff2";
    default: return "application/octet-stream";
  }
}
