import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, symlinkSync, readFileSync, readlinkSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const deployScript = resolve("deploy/aliyun-flow-deploy.sh");

// Stub only service/network commands and GNU find. The actual deployment shell,
// file copies, version comparison and rollback run in an isolated directory.
const stub = [
  "#!/usr/bin/env node",
  "const fs = require('node:fs');",
  "const path = require('node:path');",
  "const tool = path.basename(process.argv[1]);",
  "const args = process.argv.slice(2);",
  "const root = process.env.FIXTURE_ROOT;",
  "const mode = process.env.FAIL_STAGE;",
  "const site = path.join(root, 'site');",
  "const config = path.join(root, 'nginx/conf.d/000-25thgame.conf');",
  "const current = fs.readlinkSync(path.join(site, 'current'));",
  "fs.appendFileSync(path.join(root, 'calls'), tool + ':' + path.basename(current) + '\\n');",
  "if (tool === 'rsync') fs.cpSync(args.at(-2), args.at(-1), { recursive: true });",
  "if (tool === 'nginx' && mode === 'nginx' && fs.readFileSync(config, 'utf8') === 'new-config') process.exit(1);",
  "if (tool === 'systemctl' && mode === 'reload' && !fs.existsSync(path.join(root, 'reload-failed'))) {",
  "  fs.writeFileSync(path.join(root, 'reload-failed'), '1'); process.exit(1);",
  "}",
  "if (tool === 'curl') {",
  "  if (mode === 'health') process.exit(22);",
  "  const output = args[args.indexOf('-o') + 1];",
  "  if (output !== '/dev/null') fs.writeFileSync(output, mode === 'version' ? 'stale' : fs.readFileSync(path.join(current, 'version.json')));",
  "}",
].join("\n");

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "25thgame-deploy-test-"));
  const previous = join(root, "site/releases/20260101000000-old");
  const artifact = join(root, "artifact");
  for (const dir of [previous, join(artifact, "static"), join(artifact, "deploy"), join(root, "bin"), join(root, "nginx/conf.d"), join(root, "nginx/sites-enabled")]) {
    mkdirSync(dir, { recursive: true });
  }
  for (const name of ["index.html", "game.html", "version.json"]) {
    writeFileSync(join(previous, name), name === "version.json" ? '{"version":"old"}' : "old");
    writeFileSync(join(artifact, "static", name), name === "version.json" ? '{"version":"new"}' : "new");
  }
  writeFileSync(join(root, "nginx/conf.d/000-25thgame.conf"), "old-config");
  writeFileSync(join(root, "nginx/sites-enabled/beian"), "old-redirect");
  writeFileSync(join(artifact, "deploy/aliyun-nginx-25thgame.conf"), "new-config");
  writeFileSync(join(artifact, "deploy/aliyun-nginx-legacy-http-redirect.conf"), "new-redirect");
  symlinkSync(previous, join(root, "site/current"));
  const stubPath = join(root, "stub.cjs");
  writeFileSync(stubPath, stub);
  chmodSync(stubPath, 0o755);
  for (const tool of ["nginx", "systemctl", "curl", "rsync", "find"]) symlinkSync(stubPath, join(root, "bin", tool));
  return { root, previous, artifact };
}

for (const stage of ["success", "nginx", "reload", "health", "version"]) {
  test("deployment " + stage + " preserves the correct release and configuration", () => {
    const f = fixture();
    try {
      const result = spawnSync("bash", [deployScript, f.artifact], {
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: join(f.root, "bin") + ":" + process.env.PATH,
          FIXTURE_ROOT: f.root,
          GAME_DEPLOY_ROOT: join(f.root, "site"),
          GAME_NGINX_ROOT: join(f.root, "nginx"),
          FAIL_STAGE: stage,
          COMMIT_ID: "testcommit",
        },
        timeout: 15000,
      });
      assert.equal(result.status === 0, stage === "success", result.stdout + result.stderr);
      const current = readlinkSync(join(f.root, "site/current"));
      assert.equal(current === f.previous, stage !== "success");
      assert.equal(readFileSync(join(f.root, "nginx/conf.d/000-25thgame.conf"), "utf8"), stage === "success" ? "new-config" : "old-config");
      assert.equal(readFileSync(join(f.root, "nginx/sites-enabled/beian"), "utf8"), stage === "success" ? "new-redirect" : "old-redirect");
      const calls = readFileSync(join(f.root, "calls"), "utf8");
      assert.ok(calls.includes("nginx:20260101000000-old"), "Validate Nginx before changing the release");
      assert.ok(!readdirSync(join(f.root, "site/releases")).some((name) => name.endsWith(".tmp") || name.endsWith(".health.json")));
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });
}

