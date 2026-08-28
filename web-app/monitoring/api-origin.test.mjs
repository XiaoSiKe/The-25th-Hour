import assert from "node:assert/strict";
import { isLiveMonitorOrigin, monitorApiBaseFor } from "./api-origin.mjs";

assert.equal(
  monitorApiBaseFor(new URL("https://arch.25thgame.vip/__ops/player-detection-u/")),
  "https://arch.25thgame.vip",
  "domestic deployment keeps API requests same-origin for the Aliyun reverse proxy",
);

assert.equal(
  monitorApiBaseFor(new URL("http://localhost:4173/game.html")),
  "",
  "local preview keeps the offline monitor fallback",
);

assert.equal(isLiveMonitorOrigin(new URL("https://example.com/")), false);
