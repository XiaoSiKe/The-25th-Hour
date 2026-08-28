import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compositionRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(compositionRoot, "..", "..");

const sourcePath = path.join(projectRoot, "asset-work", "images", "ending-memory-carousel-and-ending-image-map.md");
const assetDirName = "web-app/optimized/assets/\u7ed3\u5c3e\u56de\u5fc6\u8d70\u9a6c\u706f\u56fe\u7247";
const publicAssetDir = "/optimized/assets/\u7ed3\u5c3e\u56de\u5fc6\u8d70\u9a6c\u706f\u56fe\u7247";
const assetDir = path.join(projectRoot, assetDirName);
const outputPath = path.join(compositionRoot, "scenes.generated.js");
const startupSourcesOutputPath = path.join(projectRoot, "web-app", "ui", "ending-memory-assets.generated.mjs");
const specialAssets = new Map([
  ["\u6bd5\u4e1a\u7b54\u8fa9.png", "web-app/optimized/assets/story-events/\u6bd5\u4e1a\u7b54\u8fa9.695fc28038b7.webp"],
  ["\u6bd5\u4e1a\u5178\u793c\uff08\u62a5\u544a\u5385\uff09.png", "web-app/optimized/assets/story-events/\u6bd5\u4e1a\u5178\u793c\uff08\u62a5\u544a\u5385\uff09.105762bd9c91.webp"],
  ["\u6bd5\u4e1a\u7167.png", "web-app/optimized/assets/story-events/\u6bd5\u4e1a\u7167.931d7f9990e9.webp"],
  ["\u519b\u8bad2.png", "web-app/optimized/assets/story-events/\u519b\u8bad2.b92fa54f3f49.webp"],
  ["\u5165\u5b66\u8bb2\u5ea7.png", "web-app/optimized/assets/story-events/\u5165\u5b66\u8bb2\u5ea7.1b3528ea3b6d.webp"],
  ["\u4e13\u6559\u751f\u6d3b.png", "web-app/optimized/assets/story-events/\u4e13\u6559\u751f\u6d3b.d8bd9e988386.webp"],
]);

const source = fs.readFileSync(sourcePath, "utf8");
const lines = source.split(/\r?\n/).filter((line) => /^\|\s*\d+\s*\|/.test(line));

function splitRow(line) {
  return line.split("|").slice(1, -1).map((cell) => cell.trim());
}

function cleanCodeCell(value) {
  return value.trim().replace(/^`|`$/g, "").trim();
}

function cleanCaptionText(value) {
  return value.replace(/<br\s*\/?>/giu, "\n");
}

function toWebpName(fileName) {
  return fileName.replace(/(?:\.png)+$/i, ".webp");
}

function encodedPublicUrl(publicPath) {
  return publicPath.split("/").map((part, index) => index === 0 ? part : encodeURIComponent(part)).join("/");
}

async function readImageSize(filePath) {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

function resolveAsset(fileName) {
  const specialPath = specialAssets.get(fileName);
  if (specialPath) {
    return {
      fileName: path.basename(specialPath),
      publicPath: `/${specialPath.replace(/^web-app\//u, "")}`,
      filePath: path.join(projectRoot, specialPath),
    };
  }
  const webpName = toWebpName(fileName);
  const relativePath = `${assetDirName}/${webpName}`;
  return {
    fileName: webpName,
    publicPath: `/${relativePath.replace(/^web-app\//u, "")}`,
    filePath: path.join(projectRoot, relativePath),
  };
}

const sceneRows = [];
const captionRows = [];

for (const line of lines) {
  const cols = splitRow(line);
  if (cols.length === 6 && /s$/.test(cols[4])) sceneRows.push(cols);
  if (cols.length === 5 && /s$/.test(cols[3])) captionRows.push(cols);
}

const captionsByOrder = new Map(
  captionRows.map(([order, image, text, hold, enter]) => [
    Number(order),
    {
      image: cleanCodeCell(image),
      text: cleanCaptionText(text),
      holdSeconds: Number(hold.replace("s", "")),
      enter,
    },
  ]),
);

const scenes = [];
for (const [order, image, event, level, duration, effect] of sceneRows) {
  const fileName = cleanCodeCell(image);
  const asset = resolveAsset(fileName);
  if (!fs.existsSync(asset.filePath)) {
    throw new Error(`Missing ending memory asset: ${fileName}`);
  }
  const size = await readImageSize(asset.filePath);
  const ratio = size.height ? size.width / size.height : 0;
  scenes.push({
    order: Number(order),
    image: asset.fileName,
    imageUrl: encodedPublicUrl(asset.publicPath),
    event,
    level,
    rawDurationSeconds: Number(duration.replace("s", "")),
    effect,
    width: size.width,
    height: size.height,
    fit: ratio > 1.45 ? "cover" : "card",
    caption: captionsByOrder.has(Number(order))
      ? { ...captionsByOrder.get(Number(order)), image: asset.fileName }
      : null,
  });
}

const usedFiles = new Set(scenes.map((scene) => scene.image));
const duplicatedFiles = [...usedFiles].filter((fileName) => scenes.filter((scene) => scene.image === fileName).length > 1);
const allowedDuplicates = new Set([...specialAssets.values()].map((filePath) => path.basename(filePath)));
const disallowedDuplicates = duplicatedFiles.filter((fileName) => !allowedDuplicates.has(fileName));
if (disallowedDuplicates.length > 0) {
  throw new Error(`Duplicate ending memory scene assets: ${disallowedDuplicates.join(", ")}`);
}

const assetFiles = new Set(fs.readdirSync(assetDir));
const unusedFiles = [...assetFiles].filter((fileName) => fileName.toLowerCase().endsWith(".webp") && !usedFiles.has(fileName)).sort();
if (unusedFiles.length > 0) {
  throw new Error(`Ending memory assets missing from animation: ${unusedFiles.join(", ")}`);
}

const rawDurationSeconds = scenes.reduce((sum, scene) => sum + scene.rawDurationSeconds, 0);
const exactDurationSeconds = Number(rawDurationSeconds.toFixed(3));

const payload = {
  generatedFrom: "asset-work/images/ending-memory-carousel-and-ending-image-map.md",
  assetDir: publicAssetDir,
  sceneCount: scenes.length,
  rawDurationSeconds: exactDurationSeconds,
  targetDurationSeconds: exactDurationSeconds,
  durationMode: "exact-source",
  scenes,
};

const output = `// Generated by tools/build-ending-memory-manifest.mjs. Do not edit by hand.\n` +
  `window.ENDING_MEMORY_DATA = ${JSON.stringify(payload, null, 2)};\n`;
const startupSources = [...new Set(scenes.map((scene) => decodeURI(scene.imageUrl)))];
const startupSourcesOutput = `// Generated by hyperframes/ending-memory/tools/build-ending-memory-manifest.mjs. Do not edit by hand.\n` +
  `export const ENDING_MEMORY_SCENE_IMAGE_SOURCES = ${JSON.stringify(startupSources, null, 2)};\n`;

fs.writeFileSync(outputPath, output, "utf8");
fs.writeFileSync(startupSourcesOutputPath, startupSourcesOutput, "utf8");
console.log(
  JSON.stringify(
    {
      output: path.relative(projectRoot, outputPath),
      startupSourcesOutput: path.relative(projectRoot, startupSourcesOutputPath),
      scenes: scenes.length,
      rawDurationSeconds: payload.rawDurationSeconds,
      targetDurationSeconds: payload.targetDurationSeconds,
      durationMode: payload.durationMode,
    },
    null,
    2,
  ),
);
