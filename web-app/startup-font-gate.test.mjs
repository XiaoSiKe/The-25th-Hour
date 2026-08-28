import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const gameHtml = readFileSync(new URL("./game.html", import.meta.url), "utf8");
const stylesCss = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const appSource = readFileSync(new URL("./app.mjs", import.meta.url), "utf8");
const gameFontUrl = "/asset-work/assets/fonts/aa-pixel/AaPingPingGuoGuoXiangSuTi-2-web.a18216ecc4d9.woff2";

assert.ok(
  gameHtml.includes(`src: url("${gameFontUrl}") format("woff2");`),
  "game font face is declared inline before the async stylesheet can race it",
);

assert.ok(
  gameHtml.includes(`<link rel="preload" href="${gameFontUrl}" as="font" type="font/woff2" crossorigin />`),
  "game font is preloaded by the startup document",
);

assert.match(
  stylesCss,
  /font-family:\s*"Aa Pixel SC";[\s\S]*?font-display:\s*block;/u,
  "game font blocks fallback rendering instead of swapping after the start page appears",
);

assert.ok(
  appSource.indexOf("const gameFontLoadPromise = waitForGameFonts();")
    < appSource.indexOf("const versionGatePassed = await enforceStartupVersionGate();"),
  "game font warmup starts before version and startup asset gates",
);

assert.ok(
  appSource.indexOf("await waitWithinStartupGateBudget(gameFontLoadPromise, startupGateDeadlineAt);")
    < appSource.indexOf('markStartupTiming("startup-gate-complete");'),
  "startup gate waits for game font warmup before releasing the start page",
);
