import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ASSET_OPTIMIZATION_META,
  OPTIMIZED_ASSET_PATHS,
} from "../web-app/ui/optimized-assets-manifest.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const webRoot = resolve(projectRoot, "web-app");
const failures = [];

for (const [logicalPath, optimizedPath] of Object.entries(OPTIMIZED_ASSET_PATHS)) {
  const filePath = resolveOptimizedPath(optimizedPath);
  if (!filePath || !existsSync(filePath)) {
    failures.push(`${logicalPath} -> missing ${optimizedPath}`);
    continue;
  }

  const hash = embeddedHash(optimizedPath);
  if (hash && !contentHash(readFileSync(filePath)).startsWith(hash)) {
    failures.push(`${logicalPath} -> hash mismatch ${optimizedPath}`);
  }

  const meta = ASSET_OPTIMIZATION_META[logicalPath];
  if (!meta) {
    failures.push(`${logicalPath} -> missing optimization metadata`);
    continue;
  }

  const actualSize = statSync(filePath).size;
  if (Number(meta.optimizedSize) !== actualSize) {
    failures.push(`${logicalPath} -> metadata size ${meta.optimizedSize} does not match ${actualSize}`);
  }

  if (meta.kind === "video") verifyVideo(logicalPath, meta);
  if (meta.kind === "audio" && Number(meta.durationDelta) > 0.25) {
    failures.push(`${logicalPath} -> audio duration delta ${meta.durationDelta}s exceeds 0.25s`);
  }
}

if (failures.length > 0) {
  console.error("Asset verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Verified ${Object.keys(OPTIMIZED_ASSET_PATHS).length} optimized asset mappings.`);

function verifyVideo(logicalPath, meta) {
  if (Number(meta.durationDelta) > 0.5) {
    failures.push(`${logicalPath} -> video duration delta ${meta.durationDelta}s exceeds 0.5s`);
  }
  if (meta.strategy === "reencoded") {
    const savingsRatio = 1 - (Number(meta.optimizedSize) / Number(meta.originalSize));
    if (savingsRatio < 0.25) failures.push(`${logicalPath} -> video savings below 25%`);
    if (Number(meta.ssim) < 0.99) failures.push(`${logicalPath} -> SSIM below 0.990`);
    if (Number(meta.psnr) < 38) failures.push(`${logicalPath} -> PSNR below 38dB`);
  }
}

function resolveOptimizedPath(optimizedPath) {
  if (optimizedPath.startsWith("/optimized/")) return resolve(webRoot, optimizedPath.slice(1));
  if (optimizedPath.startsWith("/assets/")) return resolve(webRoot, optimizedPath.slice(1));
  if (optimizedPath.startsWith("/asset-work/")) return resolve(projectRoot, optimizedPath.slice(1));
  return null;
}

function embeddedHash(path) {
  const name = basename(path, extname(path));
  const match = name.match(/\.([a-f0-9]{12})$/u);
  return match ? match[1] : "";
}

function contentHash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}
