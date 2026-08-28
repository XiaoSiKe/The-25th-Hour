import ffmpeg from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import subsetFont from "subset-font";
import ttf2woff2 from "ttf2woff2";
import { GAME_REQUIRED_IMAGES } from "../web-app/game/data.mjs";
import { musicLibraryTracks } from "../web-app/game/music.mjs";
import {
  STARTUP_FONT_SUBSET_TEXT,
  gameplayBackgroundImageSources,
  criticalStartupImageSources,
} from "../web-app/ui/resource-preload.mjs";
import {
  ENDING_ILLUSTRATION_PATHS,
  START_SCENE_IMAGES,
  START_SCENE_MOBILE_IMAGES,
  SUPPORT_ENDING_IMAGE,
  SUPPORT_QR_CODES,
} from "../web-app/ui/icons.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const webRoot = resolve(projectRoot, "web-app");
const optimizedRoot = resolve(webRoot, "optimized");
const manifestPath = resolve(webRoot, "ui/optimized-assets-manifest.mjs");
const fontSource = "/asset-work/assets/fonts/aa-pixel/AaPingPingGuoGuoXiangSuTi-2-web.ttf";
const startupFontSource = "/asset-work/assets/fonts/aa-pixel/AaPingPingGuoGuoXiangSuTi-2-startup.ttf";
const fontInputSources = [
  "/asset-work/assets/fonts/aa-pixel/AaPingPingGuoGuoXiangSuTi-2-web.a18216ecc4d9.woff2",
  fontSource,
  "/asset-work/assets/fonts/aa-pixel/AaPingPingGuoGuoXiangSuTi-2.ttf",
];

const imageMinSavingsRatio = 0.1;
const audioMinSavingsRatio = 0.1;

const manifest = {};
const metadata = {};

mkdirSync(optimizedRoot, { recursive: true });

await optimizeFont();
await optimizeImages();
await optimizeAudio();
writeManifest();

console.log(`Optimized asset mappings: ${Object.keys(manifest).length}`);
console.log(`Wrote ${relative(projectRoot, manifestPath)}`);

async function optimizeFont() {
  const sourcePath = resolveFirstLocalAsset(fontInputSources);
  if (!sourcePath) return;

  const woff2 = /\.woff2$/iu.test(sourcePath)
    ? readFileSync(sourcePath)
    : ttf2woff2(readFileSync(sourcePath));
  const outputPath = /\.woff2$/iu.test(sourcePath)
    ? sourcePath
    : fontOutputPath("AaPingPingGuoGuoXiangSuTi-2-web", woff2);
  if (outputPath !== sourcePath) writeFileSync(outputPath, woff2);
  manifest[fontSource] = `/${relative(projectRoot, outputPath).replace(/\\/g, "/")}`;
  metadata[fontSource] = {
    kind: "font",
    originalSize: statSync(sourcePath).size,
    optimizedSize: woff2.length,
  };

  const startupWoff2 = await subsetFont(woff2, STARTUP_FONT_SUBSET_TEXT, { targetFormat: "woff2" });
  const startupOutputPath = fontOutputPath("AaPingPingGuoGuoXiangSuTi-2-startup", startupWoff2);
  writeFileSync(startupOutputPath, startupWoff2);
  manifest[startupFontSource] = `/${relative(projectRoot, startupOutputPath).replace(/\\/g, "/")}`;
  metadata[startupFontSource] = {
    kind: "font",
    originalSize: woff2.length,
    optimizedSize: startupWoff2.length,
    subsetCharacters: [...new Set(STARTUP_FONT_SUBSET_TEXT)].length,
  };
}

async function optimizeImages() {
  const sources = new Set([
    ...criticalStartupImageSources(),
    ...gameplayBackgroundImageSources(),
    ...Object.values(START_SCENE_IMAGES),
    ...Object.values(START_SCENE_MOBILE_IMAGES),
    ...Object.values(GAME_REQUIRED_IMAGES).map((image) => image.src),
    ...Object.values(ENDING_ILLUSTRATION_PATHS),
    ...SUPPORT_QR_CODES.map((code) => code.src),
    SUPPORT_ENDING_IMAGE,
  ]);

  for (const source of [...sources].sort()) {
    if (!isOptimizableImage(source)) continue;
    const sourcePath = resolveLocalAsset(source);
    if (!sourcePath || !existsSync(sourcePath)) continue;

    const originalSize = statSync(sourcePath).size;
    const image = sharp(sourcePath, { failOn: "none" });
    const info = await image.metadata();
    const isQr = source.startsWith("/assets/support/");
    const maxWidth = maxImageWidth(source);
    const pipeline = image.rotate();
    if (maxWidth && info.width && info.width > maxWidth) {
      pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }
    const buffer = await pipeline.webp(isQr
      ? { lossless: true, effort: 6 }
      : { quality: 88, effort: 5 }).toBuffer();

    if (buffer.length > originalSize * (1 - imageMinSavingsRatio)) continue;

    const outputPath = hashedOptimizedPath(source, ".webp", buffer);
    writeFileSync(outputPath, buffer);
    manifest[normalizeLogicalPath(source)] = publicOptimizedPath(outputPath);
    metadata[normalizeLogicalPath(source)] = {
      kind: "image",
      originalSize,
      optimizedSize: buffer.length,
      width: info.width ?? null,
      height: info.height ?? null,
    };
  }
}

async function optimizeAudio() {
  const sources = new Set();
  for (const track of musicLibraryTracks()) {
    if (track.src) sources.add(track.src);
  }

  for (const source of [...sources].sort()) {
    const sourcePath = resolveLocalAsset(source);
    if (!sourcePath || !existsSync(sourcePath) || !isOptimizableAudio(sourcePath)) continue;

    const original = await mediaInfo(sourcePath);
    const bitRate = Number(original.format?.bit_rate) || 0;
    const targetBitRate = audioTargetBitRate(source);
    if (/\.m4a$/iu.test(sourcePath) && bitRate > 0 && bitRate <= targetBitRate * 1.08) continue;

    const tmpPath = temporaryPath(sourcePath, ".m4a");
    await run(ffmpeg.path, [
      "-hide_banner",
      "-y",
      "-i",
      sourcePath,
      "-vn",
      "-codec:a",
      "aac",
      "-b:a",
      `${Math.round(targetBitRate / 1000)}k`,
      "-movflags",
      "+faststart",
      tmpPath,
    ]);

    const originalSize = statSync(sourcePath).size;
    const optimizedSize = statSync(tmpPath).size;
    const optimized = await mediaInfo(tmpPath);
    const durationDelta = Math.abs(Number(original.format?.duration) - Number(optimized.format?.duration));

    if (optimizedSize > originalSize * (1 - audioMinSavingsRatio) || durationDelta > 0.25) {
      rmSync(tmpPath, { force: true });
      continue;
    }

    const buffer = readFileSync(tmpPath);
    const outputPath = hashedOptimizedPath(source, ".m4a", buffer);
    renameSync(tmpPath, outputPath);
    manifest[normalizeLogicalPath(source)] = publicOptimizedPath(outputPath);
    metadata[normalizeLogicalPath(source)] = {
      kind: "audio",
      originalSize,
      optimizedSize,
      durationDelta,
    };
  }
}

function isOptimizableAudio(sourcePath) {
  return /\.(?:mp3|m4a|wav|aiff?|flac)$/iu.test(sourcePath);
}

function audioTargetBitRate(source) {
  if (source.includes("/ending-tracks/")) return 96000;
  return 128000;
}

function isOptimizableImage(source) {
  return typeof source === "string"
    && /\.(?:png|jpe?g)$/iu.test(source)
    && !source.includes("/ui-icon-final/");
}

function maxImageWidth(source) {
  if (source.startsWith("/assets/start/")) return null;
  if (source.startsWith("/assets/support/")) return null;
  return 1600;
}

function resolveFirstLocalAsset(sources) {
  for (const source of sources) {
    const sourcePath = resolveLocalAsset(source);
    if (sourcePath && existsSync(sourcePath)) return sourcePath;
  }
  return "";
}

function fontOutputPath(baseName, buffer) {
  const hash = contentHash(buffer);
  return resolve(projectRoot, `asset-work/assets/fonts/aa-pixel/${baseName}.${hash}.woff2`);
}

function resolveLocalAsset(source) {
  const logicalPath = normalizeLogicalPath(source).replace(/^\//u, "");
  if (!logicalPath || logicalPath.startsWith("optimized/")) return null;
  if (logicalPath.startsWith("assets/")) return resolve(webRoot, logicalPath);
  if (logicalPath.startsWith("asset-work/")) return resolve(projectRoot, logicalPath);
  return null;
}

function hashedOptimizedPath(source, targetExtension, buffer) {
  const logicalPath = normalizeLogicalPath(source).replace(/^\//u, "");
  const parsedExtension = extname(logicalPath);
  const relativeTarget = parsedExtension
    ? logicalPath.slice(0, -parsedExtension.length)
    : logicalPath;
  const hash = contentHash(buffer);
  const outputPath = resolve(optimizedRoot, `${relativeTarget}.${hash}${targetExtension}`);
  mkdirSync(dirname(outputPath), { recursive: true });
  return outputPath;
}

function publicOptimizedPath(outputPath) {
  return `/${relative(webRoot, outputPath).replace(/\\/g, "/")}`;
}

function temporaryPath(sourcePath, suffix) {
  const tmpPath = resolve(dirname(sourcePath), `${basename(sourcePath)}.${process.pid}${suffix}`);
  rmSync(tmpPath, { force: true });
  return tmpPath;
}

function normalizeLogicalPath(source) {
  if (!source || typeof source !== "string") return "";
  const trimmed = source.startsWith("./") ? source.slice(1) : source;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function contentHash(buffer) {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 12);
}

async function mediaInfo(filePath) {
  const result = await run(ffprobe.path, [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ], { capture: true });
  return JSON.parse(result.stdout || "{}");
}

function writeManifest() {
  const sortedManifest = sortObject(manifest);
  const sortedMetadata = sortObject(metadata);
  writeFileSync(manifestPath, [
    `export const OPTIMIZED_ASSET_PATHS = ${JSON.stringify(sortedManifest, null, 2)};`,
    "",
    `export const ASSET_OPTIMIZATION_META = ${JSON.stringify(sortedMetadata, null, 2)};`,
    "",
  ].join("\n"));
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b, "zh-Hans-CN")));
}

function run(command, args, { capture = false } = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: capture ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"],
    });
    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolveRun({ stdout, stderr });
      else reject(new Error(stderr.trim() || `${command} exited with ${code}`));
    });
  });
}
