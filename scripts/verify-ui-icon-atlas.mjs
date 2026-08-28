import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import sharp from "sharp";
import { UI_ICON_FINAL_IMAGE_SOURCES } from "../web-app/ui/ui-icon-final-manifest.mjs";
import { UI_ICON_ATLAS_ENTRIES, UI_ICON_ATLAS_IMAGES } from "../web-app/ui/ui-icon-atlas-manifest.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const webRoot = resolve(projectRoot, "web-app");
const iconRoot = resolve(webRoot, "optimized/asset-work/ui-icon-final");
const failures = [];
const standaloneIconSourcePatterns = ["/00-non-atlas-ui/001_"];
const atlasHighDeltaThreshold = 24;
const atlasMeanDeltaLimit = 4;
const atlasHighDeltaRatioLimit = 0.02;

const sourceFiles = [...walkFiles(iconRoot)]
  .filter((filePath) => extname(filePath).toLowerCase() === ".webp")
  .filter((filePath) => {
    const source = publicSource(filePath);
    return source.includes("/confirmed-icons/") || source.includes("/unmapped-icons/");
  })
  .map(publicSource)
  .filter((source) => !isStandaloneIconSource(source))
  .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

checkManifestMatchesFiles();
checkReferencedIconFilesExist();
await checkAtlasPixels();

if (failures.length) {
  console.error("UI icon atlas verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Verified ${UI_ICON_FINAL_IMAGE_SOURCES.length} UI icon atlas entries across ${UI_ICON_ATLAS_IMAGES.length} atlases.`);

function checkManifestMatchesFiles() {
  const sourceSet = new Set(sourceFiles);
  const manifestSet = new Set(UI_ICON_FINAL_IMAGE_SOURCES);
  if (sourceSet.size !== sourceFiles.length) failures.push("source files contain duplicate public paths");
  if (manifestSet.size !== UI_ICON_FINAL_IMAGE_SOURCES.length) failures.push("UI icon manifest contains duplicate paths");

  for (const source of sourceFiles) {
    if (!manifestSet.has(source)) failures.push(`manifest omits ${source}`);
  }
  for (const source of UI_ICON_FINAL_IMAGE_SOURCES) {
    if (!sourceSet.has(source)) failures.push(`manifest contains stale source ${source}`);
    if (!UI_ICON_ATLAS_ENTRIES[source]) failures.push(`atlas manifest omits ${source}`);
  }
}

function checkReferencedIconFilesExist() {
  const references = new Set();
  for (const filePath of walkFiles(webRoot)) {
    if (filePath.endsWith("ui-icon-final-manifest.mjs") || filePath.endsWith("ui-icon-atlas-manifest.mjs")) continue;
    if (![".mjs", ".html", ".css"].includes(extname(filePath))) continue;
    const text = readFileSync(filePath, "utf8");
    for (const match of text.matchAll(/\/optimized\/asset-work\/ui-icon-final\/(?:confirmed-icons|unmapped-icons)\/[^"'`)\s]+\.webp/gu)) {
      references.add(match[0]);
    }
  }

  for (const source of references) {
    if (!existsSync(resolve(webRoot, source.slice(1)))) failures.push(`runtime reference points at missing file ${source}`);
    if (!isStandaloneIconSource(source) && !UI_ICON_ATLAS_ENTRIES[source]) failures.push(`runtime reference is not covered by atlas ${source}`);
  }
}

async function checkAtlasPixels() {
  const atlasBySource = new Map();
  for (const atlas of UI_ICON_ATLAS_IMAGES) {
    const atlasPath = resolve(webRoot, atlas.src.slice(1));
    if (!existsSync(atlasPath)) {
      failures.push(`missing atlas image ${atlas.src}`);
      continue;
    }
    const image = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    atlasBySource.set(atlas.src, image);
    if (image.info.width !== atlas.width || image.info.height !== atlas.height) {
      failures.push(`${atlas.src} metadata is ${image.info.width}x${image.info.height}, expected ${atlas.width}x${atlas.height}`);
    }
  }

  for (const source of UI_ICON_FINAL_IMAGE_SOURCES) {
    const entry = UI_ICON_ATLAS_ENTRIES[source];
    if (!entry) continue;

    const sourcePath = resolve(webRoot, source.slice(1));
    const sourceImage = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (sourceImage.info.width !== entry.width || sourceImage.info.height !== entry.height) {
      failures.push(`${source} metadata is ${sourceImage.info.width}x${sourceImage.info.height}, expected ${entry.width}x${entry.height}`);
      continue;
    }

    const atlasImage = atlasBySource.get(entry.atlas);
    if (!atlasImage) continue;
    const atlasSlice = sliceRawImage(atlasImage, entry);
    if (!visiblyEqualRgba(sourceImage.data, atlasSlice)) {
      failures.push(`${source} does not match atlas crop ${entry.atlas} @ ${entry.x},${entry.y}`);
    }
  }
}

function sliceRawImage(image, entry) {
  const channels = image.info.channels;
  assert.equal(channels, 4, "atlas image must be RGBA");
  const rowBytes = entry.width * channels;
  const output = Buffer.alloc(rowBytes * entry.height);
  for (let row = 0; row < entry.height; row += 1) {
    const sourceStart = ((entry.y + row) * image.info.width + entry.x) * channels;
    image.data.copy(output, row * rowBytes, sourceStart, sourceStart + rowBytes);
  }
  return output;
}

function visiblyEqualRgba(left, right) {
  if (left.length !== right.length) return false;
  let colorDeltaTotal = 0;
  let colorChannelCount = 0;
  let highDeltaCount = 0;
  for (let index = 0; index < left.length; index += 4) {
    const leftAlpha = left[index + 3];
    const rightAlpha = right[index + 3];
    if (leftAlpha !== rightAlpha) return false;
    if (leftAlpha === 0) continue;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = Math.abs(left[index + channel] - right[index + channel]);
      colorDeltaTotal += delta;
      colorChannelCount += 1;
      if (delta > atlasHighDeltaThreshold) highDeltaCount += 1;
    }
  }
  if (colorChannelCount === 0) return true;
  return (
    colorDeltaTotal / colorChannelCount <= atlasMeanDeltaLimit
    && highDeltaCount / colorChannelCount <= atlasHighDeltaRatioLimit
  );
}

function publicSource(filePath) {
  return `/${relative(webRoot, filePath).replace(/\\/g, "/")}`;
}

function isStandaloneIconSource(source) {
  return standaloneIconSourcePatterns.some((pattern) => source.includes(pattern));
}

function* walkFiles(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".DS_Store" || entry.name === "atlas") continue;
    const filePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(filePath);
    } else if (entry.isFile()) {
      yield filePath;
    }
  }
}
