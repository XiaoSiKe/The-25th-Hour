import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { OPTIMIZED_ASSET_PATHS } from "../ui/optimized-assets-manifest.mjs";
import { STARTUP_DOMESTIC_ASSET_PATHS } from "../ui/startup-domestic-assets.mjs";
import { buildUiIconAtlas } from "../../scripts/build-ui-icon-atlas.mjs";
import { buildStartupDomesticAssets } from "../../scripts/build-startup-domestic-assets.mjs";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const webRoot = resolve(scriptDir, "..");
const workspaceRoot = resolve(webRoot, "..");
const outputBase = workspaceRoot;
const outputRoot = resolve(outputBase, ".aliyun-output");
const staticRoot = resolve(outputRoot, "static");
const buildRoot = resolve(staticRoot, "build");
const opsPageRoot = resolve(webRoot, "__ops/player-detection-u");
const r2BaseUrl = "https://assets-apac.25thgame.vip/assets/v1";
const loadingClockIconPath = "/optimized/asset-work/ui-icon-final/confirmed-icons/00-non-atlas-ui/001_开场 _ 开始界面时钟图1__时钟图1.36b6aac0df0b.webp";

rmSync(staticRoot, { recursive: true, force: true });
mkdirSync(staticRoot, { recursive: true });
await buildUiIconAtlas({ projectRoot: workspaceRoot, quiet: true });
buildStartupDomesticAssets();

copyDirectory(webRoot, staticRoot, {
  exclude: (absolutePath, entryName) => {
    if (isIgnoredStaticEntry(entryName)) return true;
    if (entryName.endsWith(".test.mjs")) return true;
    if (entryName === "verify-flow.mjs") return true;
    if (entryName === ".aliyun-output") return true;
    if (entryName === "__ops") return true;
    if (entryName === "assets") return true;
    if (entryName === "optimized") return true;
    if (entryName === "server.mjs") return true;
    if (entryName === "scripts") return true;
    return false;
  },
});

copySiteOwnedOptimizedAssets();
copyOpsMonitorPage();
copyEndingMemoryRuntimeFiles();
copyStartupDomesticAssets();

const bundledAssets = await writeBundledAssets();
rewriteHtmlFiles(bundledAssets);
rewriteCopiedAssetReferences();
rewriteEndingMemoryAssetReferences();

console.log(`Built Aliyun static output at ${staticRoot}`);

async function writeBundledAssets() {
  mkdirSync(buildRoot, { recursive: true });
  return {
    gameEntryJs: await bundleJavaScript("game-entry.mjs", "game-entry"),
    stageJs: await bundleJavaScript("stage.mjs", "stage"),
    musicPreviewJs: await bundleJavaScript("music-preview.mjs", "music-preview"),
    stylesCss: await bundleCss("styles.css", "styles"),
    stageCss: await bundleCss("stage.css", "stage"),
  };
}

async function bundleJavaScript(entryName, outputName) {
  const temporaryOutput = resolve(buildRoot, `${outputName}.tmp.js`);
  await esbuild({
    entryPoints: [resolve(webRoot, entryName)],
    bundle: true,
    charset: "utf8",
    format: "esm",
    legalComments: "none",
    minify: true,
    outfile: temporaryOutput,
    platform: "browser",
    target: "es2022",
  });
  return finalizeBundledAsset(temporaryOutput, outputName, ".js");
}

async function bundleCss(entryName, outputName) {
  const temporaryOutput = resolve(buildRoot, `${outputName}.tmp.css`);
  await esbuild({
    entryPoints: [resolve(webRoot, entryName)],
    bundle: true,
    charset: "utf8",
    external: ["/asset-work/*", "/assets/*", "/optimized/*", "https://*"],
    legalComments: "none",
    minify: true,
    outfile: temporaryOutput,
  });
  return finalizeBundledAsset(temporaryOutput, outputName, ".css");
}

function finalizeBundledAsset(temporaryOutput, outputName, extension) {
  const original = readFileSync(temporaryOutput, "utf8");
  const rewritten = rewriteOptimizedAssetReferences(original);
  const hash = createHash("sha256").update(rewritten).digest("hex").slice(0, 12);
  const relativeOutput = `build/${outputName}.${hash}${extension}`;
  const outputPath = resolve(staticRoot, relativeOutput);
  writeFileSync(outputPath, rewritten);
  rmSync(temporaryOutput, { force: true });
  return `/${relativeOutput}`;
}

function rewriteHtmlFiles(bundledAssets) {
  rewriteHtml("index.html", (html) => html
    .replace("./stage.css", bundledAssets.stageCss)
    .replace("./stage.mjs", bundledAssets.stageJs));
  rewriteHtml("senior-test-copy.html", (html) => html
    .replace("./stage.css", bundledAssets.stageCss)
    .replace("./stage.mjs", bundledAssets.stageJs));
  rewriteHtml("game.html", (html) => html
    .split("./styles.css").join(bundledAssets.stylesCss)
    .replace("./game-entry.mjs", bundledAssets.gameEntryJs)
    .replace('type="font/ttf"', 'type="font/woff2"'));
  rewriteHtml("music-preview.html", (html) => html
    .replace("./music-preview.mjs", bundledAssets.musicPreviewJs));
}

function rewriteHtml(fileName, transform) {
  const filePath = resolve(staticRoot, fileName);
  if (!existsSync(filePath)) return;
  const html = readFileSync(filePath, "utf8");
  writeFileSync(filePath, rewriteOptimizedAssetReferences(transform(html)));
}

function rewriteCopiedAssetReferences() {
  for (const filePath of walkFiles(staticRoot)) {
    if (![".css", ".html", ".js", ".mjs"].includes(extname(filePath).toLowerCase())) continue;
    const original = readFileSync(filePath, "utf8");
    const rewritten = rewriteOptimizedAssetReferences(original);
    if (rewritten !== original) writeFileSync(filePath, rewritten);
  }
}

function rewriteOptimizedAssetReferences(text) {
  let rewritten = text;
  for (const [logicalPath, optimizedPath] of Object.entries(OPTIMIZED_ASSET_PATHS)) {
    const replacements = [
      [logicalPath, optimizedPath],
      [logicalPath.slice(1), optimizedPath.slice(1)],
      [`${r2BaseUrl}${logicalPath}`, `${r2BaseUrl}${optimizedPath}`],
      [encodeURI(logicalPath), encodeURI(optimizedPath)],
      [encodeURI(`${r2BaseUrl}${logicalPath}`), encodeURI(`${r2BaseUrl}${optimizedPath}`)],
    ];
    for (const [from, to] of replacements) {
      rewritten = rewritten.split(from).join(to);
    }
  }
  rewritten = rewritten.split('format("truetype")').join('format("woff2")');
  return rewritten;
}

function rewriteEndingMemoryAssetReferences() {
  // Ending memory scene image URLs stay logical here. The animation runtime
  // resolves them per host so app preloads and iframe playback share one URL.
}

function copySiteOwnedOptimizedAssets() {
  copyPublicAssetPath(loadingClockIconPath);
  for (const [logicalPath, optimizedPath] of Object.entries(OPTIMIZED_ASSET_PATHS)) {
    if (!isSiteOwnedBuildAsset(logicalPath) && !isSiteOwnedBuildAsset(optimizedPath)) continue;
    copyPublicAssetPath(optimizedPath);
  }
}

function copyStartupDomesticAssets() {
  let copiedCount = 0;
  let copiedBytes = 0;
  for (const assetPath of STARTUP_DOMESTIC_ASSET_PATHS) {
    const sourcePath = resolve(webRoot, assetPath.slice(1));
    const targetPath = resolve(staticRoot, "assets/v1", assetPath.slice(1));
    if (!existsSync(sourcePath)) throw new Error(`Missing startup domestic asset: ${assetPath}`);
    mkdirSync(dirname(targetPath), { recursive: true });
    cpSync(sourcePath, targetPath);
    copiedCount += 1;
    copiedBytes += statSync(sourcePath).size;
  }
  writeFileSync(resolve(staticRoot, "assets/v1/startup-domestic-assets.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: copiedCount,
    bytes: copiedBytes,
    paths: STARTUP_DOMESTIC_ASSET_PATHS,
  }, null, 2));
  console.log(`Copied ${copiedCount} startup domestic assets (${formatMiB(copiedBytes)} MiB) under /assets/v1/.`);
}

function copyOpsMonitorPage() {
  if (!existsSync(opsPageRoot)) throw new Error("Missing player detection ops page.");
  const targetRoot = resolve(staticRoot, "__ops/player-detection-u");
  mkdirSync(dirname(targetRoot), { recursive: true });
  cpSync(opsPageRoot, targetRoot, { recursive: true });

  for (const filePath of walkFiles(targetRoot)) {
    if (![".css", ".html", ".js", ".mjs"].includes(extname(filePath).toLowerCase())) continue;
    const text = readFileSync(filePath, "utf8");
    for (const match of text.matchAll(/["'`](\/optimized\/[^"'`\s<>\\)]+)/gu)) {
      copyPublicAssetPath(match[1]);
    }
  }
}

function isSiteOwnedBuildAsset(path) {
  return path === loadingClockIconPath
    || path.startsWith("/asset-work/assets/fonts/aa-pixel/");
}

function copyEndingMemoryRuntimeFiles() {
  const files = [
    "index.html",
    "styles.css",
    "main.js",
    "scenes.generated.js",
    "fonts/ending-memory-manual-patch.ttf",
    "fonts/ending-memory-pixel-patch.ttf",
  ];
  for (const file of files) {
    copyWorkspacePath(`hyperframes/ending-memory/${file}`);
  }
}

function copyPublicAssetPath(publicPath) {
  const relativePath = normalizeUrlPath(publicPath);
  if (!relativePath) return;
  if (relativePath.startsWith("asset-work/")) {
    copyWorkspacePath(relativePath);
    return;
  }
  if (relativePath.startsWith("optimized/")) {
    const sourcePath = resolve(webRoot, relativePath);
    const destinationPath = resolve(staticRoot, relativePath);
    if (!isInside(webRoot, sourcePath) || !existsSync(sourcePath)) return;
    mkdirSync(dirname(destinationPath), { recursive: true });
    cpSync(sourcePath, destinationPath);
  }
}

function normalizeUrlPath(urlPath) {
  const decoded = decodeURI(String(urlPath).split(/[?#]/u)[0]);
  const normalized = normalize(decoded).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");
  if (!normalized || normalized.startsWith("..") || resolve(normalized) === normalized) return "";
  return normalized;
}

function copyWorkspacePath(workspaceRelativePath) {
  const relativePath = normalizeUrlPath(workspaceRelativePath);
  if (!relativePath) return;

  const sourcePath = resolve(workspaceRoot, relativePath);
  if (!isInside(workspaceRoot, sourcePath) || !existsSync(sourcePath)) return;

  const destinationPath = resolve(staticRoot, relativePath);
  if (!isInside(staticRoot, destinationPath)) return;
  if (statSync(sourcePath).isDirectory()) {
    copyDirectory(sourcePath, destinationPath, { exclude: (_absolutePath, entryName) => isIgnoredStaticEntry(entryName) });
    return;
  }

  mkdirSync(dirname(destinationPath), { recursive: true });
  cpSync(sourcePath, destinationPath);
}

function copyDirectory(sourceDir, destinationDir, { exclude = () => false } = {}) {
  mkdirSync(destinationDir, { recursive: true });
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = resolve(sourceDir, entry.name);
    if (exclude(sourcePath, entry.name)) continue;

    const destinationPath = resolve(destinationDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath, { exclude });
    } else if (entry.isFile()) {
      mkdirSync(dirname(destinationPath), { recursive: true });
      cpSync(sourcePath, destinationPath);
    }
  }
}

function isIgnoredStaticEntry(entryName) {
  return entryName.startsWith(".");
}

function* walkFiles(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filePath = resolve(directory, entry.name);
    if (entry.name === ".DS_Store") continue;
    if (entry.isDirectory()) {
      yield* walkFiles(filePath);
    } else if (entry.isFile() && statSync(filePath).isFile()) {
      yield filePath;
    }
  }
}

function isInside(root, target) {
  const path = relative(root, target);
  return path === "" || (!path.startsWith("..") && !resolve(path).startsWith(".."));
}

function formatMiB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}
