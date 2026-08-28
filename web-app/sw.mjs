import { RUNTIME_CACHE_NAME, RUNTIME_CACHE_NAME_PREFIX, shouldCacheRequest, shouldServeCachedRangeRequest } from "./sw-cache-policy.mjs";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(RUNTIME_CACHE_NAME_PREFIX) && name !== RUNTIME_CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (shouldServeCachedRangeRequest(event.request)) {
    event.respondWith(cacheFirstRange(event.request));
    return;
  }
  if (!shouldCacheRequest(event.request)) return;
  event.respondWith(cacheFirst(event.request));
});

export async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached && !(request.mode === "cors" && cached.type === "opaque")) return cached;

  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone());
  }
  return response;
}

async function cacheFirstRange(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cached = await cache.match(request.url, { ignoreVary: true });
  if (!cached) return fetch(request);

  const response = await rangeResponse(cached, request.headers.get("range"));
  return response ?? fetch(request);
}

async function rangeResponse(response, rangeHeader) {
  const range = parseRangeHeader(rangeHeader, Number(response.headers.get("content-length")));
  if (!range) return null;
  if (!range.ok) {
    return new Response(null, {
      status: 416,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes */${range.size}`,
      },
    });
  }

  const body = await response.blob();
  const headers = new Headers(response.headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${range.size}`);
  headers.set("Content-Length", String(range.end - range.start + 1));
  headers.delete("Content-Encoding");

  return new Response(body.slice(range.start, range.end + 1, response.headers.get("content-type") || body.type), {
    status: 206,
    statusText: "Partial Content",
    headers,
  });
}

function parseRangeHeader(rangeHeader, size) {
  if (!Number.isFinite(size) || size <= 0) return null;
  const match = String(rangeHeader || "").match(/^bytes=(\d*)-(\d*)$/u);
  if (!match) return null;

  let start = match[1] ? Number(match[1]) : null;
  let end = match[2] ? Number(match[2]) : null;
  if (start === null && end === null) return null;

  if (start === null) {
    const suffixLength = Math.max(0, Math.min(size, end));
    start = size - suffixLength;
    end = size - 1;
  } else if (end === null || end >= size) {
    end = size - 1;
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) {
    return { ok: false, size };
  }
  return { ok: true, start, end, size };
}
