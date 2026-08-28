import { existsSync, rmSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ASSET_OPTIMIZATION_META,
  OPTIMIZED_ASSET_PATHS,
} from "../web-app/ui/optimized-assets-manifest.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const webRoot = resolve(projectRoot, "web-app");
const dryRun = process.argv.includes("--dry-run");
const deletions = [];

for (const [logicalPath, optimizedPath] of Object.entries(OPTIMIZED_ASSET_PATHS)) {
  const originalFile = resolveOriginalPath(logicalPath);
  const optimizedFile = resolveAssetPath(optimizedPath);
  if (!originalFile || !optimizedFile) continue;
  if (originalFile === optimizedFile) continue;
  if (!existsSync(originalFile) || !existsSync(optimizedFile)) continue;
  if (!statSync(originalFile).isFile() || !statSync(optimizedFile).isFile()) continue;
  deletions.push({
    kind: ASSET_OPTIMIZATION_META[logicalPath]?.kind ?? "unknown",
    logicalPath,
    file: originalFile,
  });
}

const byFile = new Map();
for (const deletion of deletions) {
  if (!byFile.has(deletion.file)) byFile.set(deletion.file, deletion);
}

const uniqueDeletions = [...byFile.values()].sort((a, b) => a.file.localeCompare(b.file, "zh-Hans-CN"));
const counts = {};
for (const deletion of uniqueDeletions) {
  counts[deletion.kind] = (counts[deletion.kind] ?? 0) + 1;
}

for (const deletion of uniqueDeletions) {
  const relativeFile = relative(projectRoot, deletion.file);
  console.log(`${dryRun ? "would delete" : "delete"} ${deletion.kind} ${relativeFile}`);
  if (!dryRun) rmSync(deletion.file);
}

console.log(`${dryRun ? "Dry run" : "Pruned"} ${uniqueDeletions.length} optimized original files.`);
console.log(JSON.stringify(counts, null, 2));

function resolveOriginalPath(publicPath) {
  const key = normalizePublicPath(publicPath);
  if (!key || key.startsWith("optimized/")) return "";
  if (key.startsWith("assets/")) return resolve(webRoot, key);
  if (key.startsWith("asset-work/")) return resolve(projectRoot, key);
  return "";
}

function resolveAssetPath(publicPath) {
  const key = normalizePublicPath(publicPath);
  if (!key) return "";
  if (key.startsWith("optimized/")) return resolve(webRoot, key);
  if (key.startsWith("assets/")) return resolve(webRoot, key);
  if (key.startsWith("asset-work/")) return resolve(projectRoot, key);
  return "";
}

function normalizePublicPath(publicPath) {
  return String(publicPath).split(/[?#]/u)[0].replace(/^\/+/, "").replace(/\\/g, "/");
}
