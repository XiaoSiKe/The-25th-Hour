import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = resolve(dirname(scriptPath), "..");
const atlasRootUrl = "/optimized/asset-work/ui-icon-final/atlas";
const atlasMaxWidth = 4096;
const atlasPadding = 2;
const standaloneStartupClockPattern = "/00-non-atlas-ui/001_";

export async function buildUiIconAtlas({
  projectRoot = defaultProjectRoot,
  quiet = false,
} = {}) {
  const webRoot = resolve(projectRoot, "web-app");
  const iconRoot = resolve(webRoot, "optimized/asset-work/ui-icon-final");
  const atlasRoot = resolve(webRoot, atlasRootUrl.slice(1));
  const finalManifestPath = resolve(webRoot, "ui/ui-icon-final-manifest.mjs");
  const atlasManifestPath = resolve(webRoot, "ui/ui-icon-atlas-manifest.mjs");
  const sources = await readIconSources({ webRoot, iconRoot });

  rmSync(atlasRoot, { recursive: true, force: true });
  mkdirSync(atlasRoot, { recursive: true });

  const atlasSources = sources.filter((source) => !isStandaloneStartupClock(source.source));
  const groups = [{ id: "icons", entries: atlasSources }].filter((group) => group.entries.length);

  const atlasImages = [];
  const atlasEntries = {};

  for (const group of groups) {
    const packed = packEntries(group.entries);
    const atlasPixels = await renderAtlasPixels(packed);
    const atlasBuffer = await sharp(atlasPixels, {
      raw: {
        width: packed.width,
        height: packed.height,
        channels: 4,
      },
    })
      .webp({ quality: 98, alphaQuality: 100, smartSubsample: true, effort: 6 })
      .toBuffer();
    const hash = createHash("sha256").update(atlasBuffer).digest("hex").slice(0, 12);
    const atlasFileName = `ui-icon-atlas-${group.id}.${hash}.webp`;
    const atlasPath = resolve(atlasRoot, atlasFileName);
    const atlasSource = `${atlasRootUrl}/${atlasFileName}`;

    writeFileSync(atlasPath, atlasBuffer);

    atlasImages.push({
      src: atlasSource,
      width: packed.width,
      height: packed.height,
      entries: packed.entries.length,
    });

    for (const entry of packed.entries) {
      atlasEntries[entry.source] = {
        atlas: atlasSource,
        x: entry.x,
        y: entry.y,
        width: entry.width,
        height: entry.height,
        atlasWidth: packed.width,
        atlasHeight: packed.height,
      };
    }
  }

  writeGeneratedModule(
    finalManifestPath,
    `export const UI_ICON_FINAL_IMAGE_SOURCES = ${JSON.stringify(atlasSources.map((source) => source.source), null, 2)};\n`,
  );
  writeGeneratedModule(
    atlasManifestPath,
    [
      `export const UI_ICON_ATLAS_IMAGES = ${JSON.stringify(atlasImages, null, 2)};`,
      `export const UI_ICON_ATLAS_ENTRIES = ${JSON.stringify(sortObject(atlasEntries), null, 2)};`,
      "",
    ].join("\n"),
  );

  const summary = {
    sources: atlasSources.length,
    atlases: atlasImages.length,
    atlasImages,
  };
  if (!quiet) {
    console.log(`Built ${summary.atlases} UI icon atlases for ${summary.sources} sources.`);
    for (const atlas of atlasImages) {
      console.log(`${atlas.src} (${atlas.width}x${atlas.height}, ${atlas.entries} entries)`);
    }
  }
  return summary;
}

function isStandaloneStartupClock(source) {
  return source.includes(standaloneStartupClockPattern);
}

async function readIconSources({ webRoot, iconRoot }) {
  const files = [...walkFiles(iconRoot)]
    .filter((filePath) => extname(filePath).toLowerCase() === ".webp")
    .filter((filePath) => {
      const source = `/${relative(webRoot, filePath).replace(/\\/g, "/")}`;
      return source.includes("/confirmed-icons/") || source.includes("/unmapped-icons/");
    })
    .sort((a, b) => {
      const sourceA = `/${relative(webRoot, a).replace(/\\/g, "/")}`;
      const sourceB = `/${relative(webRoot, b).replace(/\\/g, "/")}`;
      return sourceA.localeCompare(sourceB, "zh-Hans-CN");
    });

  const sources = [];
  for (const filePath of files) {
    const metadata = await sharp(filePath).metadata();
    sources.push({
      filePath,
      source: `/${relative(webRoot, filePath).replace(/\\/g, "/")}`,
      width: metadata.width,
      height: metadata.height,
    });
  }
  return sources;
}

async function renderAtlasPixels(packed) {
  const channels = 4;
  const output = Buffer.alloc(packed.width * packed.height * channels);
  for (const entry of packed.entries) {
    const sourceImage = await sharp(entry.filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (sourceImage.info.width !== entry.width || sourceImage.info.height !== entry.height || sourceImage.info.channels !== channels) {
      throw new Error(`Unexpected source metadata for ${entry.source}`);
    }
    const sourceRowBytes = entry.width * channels;
    for (let row = 0; row < entry.height; row += 1) {
      const sourceStart = row * sourceRowBytes;
      const targetStart = ((entry.y + row) * packed.width + entry.x) * channels;
      sourceImage.data.copy(output, targetStart, sourceStart, sourceStart + sourceRowBytes);
    }
  }
  return output;
}

function packEntries(entries) {
  const sorted = [...entries].sort((a, b) => {
    if (b.height !== a.height) return b.height - a.height;
    if (b.width !== a.width) return b.width - a.width;
    return a.source.localeCompare(b.source, "zh-Hans-CN");
  });
  const packed = [];
  let x = atlasPadding;
  let y = atlasPadding;
  let shelfHeight = 0;
  let width = atlasPadding;

  for (const entry of sorted) {
    if (entry.width + atlasPadding * 2 > atlasMaxWidth) {
      throw new Error(`Icon is wider than atlas: ${entry.source}`);
    }

    if (x > atlasPadding && x + entry.width + atlasPadding > atlasMaxWidth) {
      x = atlasPadding;
      y += shelfHeight + atlasPadding;
      shelfHeight = 0;
    }

    packed.push({ ...entry, x, y });
    x += entry.width + atlasPadding;
    shelfHeight = Math.max(shelfHeight, entry.height);
    width = Math.max(width, x);
  }

  return {
    entries: packed.sort((a, b) => a.source.localeCompare(b.source, "zh-Hans-CN")),
    width: Math.min(atlasMaxWidth, Math.max(1, width)),
    height: Math.max(1, y + shelfHeight + atlasPadding),
  };
}

function writeGeneratedModule(filePath, contents) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function sortObject(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b, "zh-Hans-CN")));
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

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  await buildUiIconAtlas();
}
