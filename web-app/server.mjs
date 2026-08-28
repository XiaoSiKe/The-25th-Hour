import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OPTIMIZED_ASSET_PATHS } from "./ui/optimized-assets-manifest.mjs";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const workspaceRoot = resolve(root, "..");
const requestedPort = Number(process.env.PORT ?? process.argv[2] ?? 4173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".lrc": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".json": "application/json; charset=utf-8",
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);
  const safePath = normalize(pathname).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");

  const assetRoot = safePath.startsWith("asset-work")
    || safePath.startsWith("hyperframes")
    || safePath.startsWith("ui-work")
    ? workspaceRoot
    : root;
  let filePath = resolve(join(assetRoot, safePath));

  const relativePath = relative(assetRoot, filePath);
  if (relativePath.startsWith("..") || relativePath === ".." || resolve(relativePath) === relativePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!existsSync(filePath) && extname(filePath)) {
    filePath = resolveOptimizedAssetFilePath(safePath) ?? filePath;
  }

  if (!existsSync(filePath) && extname(filePath)) {
    response.writeHead(404);
    response.end("Not Found");
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, "index.html");
  }

  const fileStats = statSync(filePath);
  const extension = extname(filePath).toLowerCase();
  const headers = {
    "Content-Type": mime[extension] ?? "application/octet-stream",
    "Cache-Control": "no-store",
    "Content-Length": fileStats.size,
  };

  if (supportsByteRanges(extension)) {
    headers["Accept-Ranges"] = "bytes";
    const range = parseByteRange(request.headers.range, fileStats.size);
    if (range === false) {
      response.writeHead(416, {
        ...headers,
        "Content-Range": `bytes */${fileStats.size}`,
        "Content-Length": 0,
      });
      response.end();
      return;
    }
    if (range) {
      headers["Content-Range"] = `bytes ${range.start}-${range.end}/${fileStats.size}`;
      headers["Content-Length"] = range.end - range.start + 1;
      response.writeHead(206, headers);
      if (request.method === "HEAD") {
        response.end();
        return;
      }
      createReadStream(filePath, range).pipe(response);
      return;
    }
  }

  response.writeHead(200, headers);
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

server.listen(requestedPort, () => {
  console.log(`第二十五小时试玩界面：http://localhost:${requestedPort}`);
});

function resolveOptimizedAssetFilePath(safePath) {
  const logicalPath = `/${safePath.replace(/\\/g, "/")}`;
  const optimizedPath = OPTIMIZED_ASSET_PATHS[logicalPath];
  if (!optimizedPath) return null;

  const optimizedSafePath = normalize(optimizedPath).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");
  if (!optimizedSafePath || optimizedSafePath.startsWith("..") || resolve(optimizedSafePath) === optimizedSafePath) return null;

  const optimizedRoot = optimizedSafePath.startsWith("asset-work")
    || optimizedSafePath.startsWith("hyperframes")
    || optimizedSafePath.startsWith("ui-work")
    ? workspaceRoot
    : root;
  const optimizedFilePath = resolve(join(optimizedRoot, optimizedSafePath));
  const relativeOptimizedPath = relative(optimizedRoot, optimizedFilePath);
  if (
    relativeOptimizedPath.startsWith("..")
    || relativeOptimizedPath === ".."
    || resolve(relativeOptimizedPath) === relativeOptimizedPath
  ) {
    return null;
  }

  return existsSync(optimizedFilePath) ? optimizedFilePath : null;
}

function supportsByteRanges(extension) {
  return [".mp3", ".m4a", ".ogg", ".wav", ".mp4", ".webm", ".mov"].includes(extension);
}

function parseByteRange(rangeHeader, size) {
  if (!rangeHeader) return null;
  const match = /^bytes=(\d*)-(\d*)$/u.exec(String(rangeHeader).trim());
  if (!match || size <= 0) return false;

  let start;
  let end;
  if (match[1] === "") {
    const suffixLength = Number(match[2]);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return false;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Number(match[2]);
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) return false;
  return { start, end: Math.min(end, size - 1) };
}
