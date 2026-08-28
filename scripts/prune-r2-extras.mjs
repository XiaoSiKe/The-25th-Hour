import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const bucket = process.env.R2_BUCKET ?? "25thgame-assets-apac";
const prefix = process.env.R2_PREFIX ?? "assets/v1";
const concurrency = Number(process.env.R2_PRUNE_CONCURRENCY ?? 8);
const reportPath = resolve(projectRoot, ".tmp/runtime-r2-prune-report.json");
const apply = process.argv.includes("--apply");

if (!existsSync(reportPath)) {
  throw new Error(`Missing prune report: ${reportPath}. Run npm run verify:runtime-r2-assets:remote first.`);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const extras = validateExtraKeys(report.extra ?? []);

console.log(`R2 prune plan: ${extras.length} extra objects from ${bucket}/${prefix}`);
for (const key of extras) console.log(key);

if (!apply) {
  console.log("Dry run only. Re-run with --apply to delete these objects.");
  process.exit(0);
}

let nextIndex = 0;
let completed = 0;
let failed = 0;

await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));

if (failed > 0) {
  console.error(`R2 prune failed for ${failed} objects.`);
  process.exit(1);
}

console.log(`R2 prune complete: ${completed} objects deleted.`);

async function worker() {
  while (nextIndex < extras.length) {
    const key = extras[nextIndex++];
    try {
      await deleteObject(key);
      completed += 1;
      if (completed % 20 === 0 || completed === extras.length) {
        console.log(`Deleted ${completed}/${extras.length}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`Delete failed: ${key}\n${error?.message ?? error}`);
    }
  }
}

function validateExtraKeys(keys) {
  if (!Array.isArray(keys)) throw new Error("Prune report extra field must be an array.");
  return keys.map(String).sort().map((key) => {
    if (!key.startsWith(`${prefix}/`)) throw new Error(`Refusing to delete key outside ${prefix}/: ${key}`);
    if (key.includes("..")) throw new Error(`Refusing to delete suspicious key: ${key}`);
    if (key.startsWith(`${prefix}/optimized/`)) throw new Error(`Refusing to delete optimized runtime asset: ${key}`);
    return key;
  });
}

function deleteObject(key) {
  return run("wrangler", [
    "r2",
    "object",
    "delete",
    `${bucket}/${key}`,
    "--remote",
    "--force",
  ]);
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
