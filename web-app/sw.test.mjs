import assert from "node:assert/strict";

globalThis.self = {
  addEventListener() {},
  clients: { claim: async () => undefined },
  skipWaiting: async () => undefined,
};

const { cacheFirst } = await import("./sw.mjs");

const opaqueCachedResponse = {
  type: "opaque",
  ok: false,
  status: 0,
};
const corsNetworkResponse = {
  type: "cors",
  ok: true,
  status: 200,
  clone() {
    return { ...this };
  },
};

function installRuntimeCacheMock(cachedResponse) {
  const calls = {
    fetch: 0,
    put: 0,
  };
  globalThis.caches = {
    open: async () => ({
      match: async () => cachedResponse,
      put: async () => {
        calls.put += 1;
      },
    }),
  };
  globalThis.fetch = async () => {
    calls.fetch += 1;
    return corsNetworkResponse;
  };
  return calls;
}

let calls = installRuntimeCacheMock(opaqueCachedResponse);
assert.equal(await cacheFirst({ url: "https://assets.test/track.m4a", mode: "cors" }), corsNetworkResponse);
assert.equal(calls.fetch, 1);
assert.equal(calls.put, 1);

calls = installRuntimeCacheMock(opaqueCachedResponse);
assert.equal(await cacheFirst({ url: "https://assets.test/track.m4a", mode: "no-cors" }), opaqueCachedResponse);
assert.equal(calls.fetch, 0);
assert.equal(calls.put, 0);

calls = installRuntimeCacheMock(corsNetworkResponse);
assert.equal(await cacheFirst({ url: "https://assets.test/track.m4a", mode: "cors" }), corsNetworkResponse);
assert.equal(calls.fetch, 0);
assert.equal(calls.put, 0);
