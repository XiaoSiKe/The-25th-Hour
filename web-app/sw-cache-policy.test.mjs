import assert from "node:assert/strict";
import { APP_VERSION } from "./version-gate.mjs";
import {
  RUNTIME_CACHE_NAME,
  RUNTIME_CACHE_NAME_PREFIX,
  shouldCacheRequest,
  shouldServeCachedRangeRequest,
} from "./sw-cache-policy.mjs";

function request(url, { method = "GET", headers = {}, destination = "" } = {}) {
  return {
    url,
    method,
    destination,
    headers: {
      has: (name) => Object.keys(headers).some((key) => key.toLowerCase() === name.toLowerCase()),
    },
  };
}

assert.equal(RUNTIME_CACHE_NAME_PREFIX, "twenty-fifth-hour-runtime-");
assert.equal(RUNTIME_CACHE_NAME, `${RUNTIME_CACHE_NAME_PREFIX}${APP_VERSION.toLowerCase()}`);

assert.equal(shouldCacheRequest(request("https://game.test/build/app.abc123.js", { destination: "script" })), true);
assert.equal(shouldCacheRequest(request("https://game.test/assets/start/start.webp", { destination: "image" })), true);
assert.equal(shouldCacheRequest(request("https://game.test/track.mp3", { destination: "audio" })), true);
assert.equal(shouldCacheRequest(request("https://game.test/track.m4a", { destination: "audio" })), true);
assert.equal(shouldCacheRequest(request("https://game.test/font.woff2", { destination: "font" })), true);
assert.equal(shouldCacheRequest(request("http://localhost:4173/app.mjs", { destination: "script" })), false);
assert.equal(shouldCacheRequest(request("http://localhost:4173/styles.css", { destination: "style" })), false);
assert.equal(shouldCacheRequest(request("http://localhost:4173/optimized/assets/start/start.webp", { destination: "image" })), true);

assert.equal(shouldCacheRequest(request("https://game.test/index.html", { destination: "document" })), false);
assert.equal(shouldCacheRequest(request("https://game.test/sw.mjs", { destination: "script" })), false);
assert.equal(shouldCacheRequest(request("https://game.test/__ops/player-detection-u/app.js", { destination: "script" })), false);
assert.equal(shouldCacheRequest(request("https://game.test/api/leaderboard", { destination: "" })), false);
assert.equal(shouldCacheRequest(request("https://game.test/ending.mp4", { destination: "video" })), false);
assert.equal(shouldCacheRequest(request("https://game.test/ending.mp4", {
  destination: "video",
  headers: { Range: "bytes=0-1024" },
})), false);
assert.equal(shouldCacheRequest(request("https://game.test/track.m4a", {
  destination: "audio",
  headers: { Range: "bytes=0-1024" },
})), false);
assert.equal(shouldServeCachedRangeRequest(request("https://game.test/track.m4a", {
  destination: "audio",
  headers: { Range: "bytes=0-1024" },
})), true);
assert.equal(shouldServeCachedRangeRequest(request("https://game.test/ending.mp4", {
  destination: "video",
  headers: { Range: "bytes=0-1024" },
})), false);
assert.equal(shouldCacheRequest(request("https://game.test/build/app.abc123.js", { method: "POST" })), false);
