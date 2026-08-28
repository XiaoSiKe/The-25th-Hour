import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const yaml = readFileSync("deploy/aliyun-flow.yml", "utf8");
const sourceFunction = yaml.match(/^            fetch_source_archive\(\) \{[\s\S]*?^            \}/m)?.[0]
  .replace(/^ {12}/gm, "");
assert.ok(sourceFunction, "Test the actual source-acquisition function from Flow YAML");
const triggerGuard = yaml.split("          run: |\n")[1].split("            export PATH=")[0]
  .replace(/^ {12}/gm, "");
const commit = "a".repeat(40);

const curlStub = [
  "#!/usr/bin/env node",
  "const fs = require('node:fs');",
  "const args = process.argv.slice(2);",
  "const url = args.find(x => x.startsWith('https://'));",
  "const output = args[args.indexOf('-o') + 1];",
  "const mode = process.env.FAIL_STAGE;",
  "fs.appendFileSync(process.env.CURL_CALLS, url + '\\n');",
  "if (url.endsWith('/commits/main')) {",
  "  if (mode === 'api') process.exit(22);",
  "  fs.writeFileSync(output, JSON.stringify({ sha: mode === 'invalid-sha' ? 'main;unexpected' : 'a'.repeat(40) }));",
  "} else {",
  "  if (!url.endsWith('/tarball/' + 'a'.repeat(40))) process.exit(64);",
  "  if (mode === 'archive') process.exit(22);",
  "  if (mode === 'corrupt') fs.writeFileSync(output, 'not an archive');",
  "  else fs.copyFileSync(process.env.FIXTURE_ARCHIVE, output);",
  "}",
].join("\n");

function exerciseSource(stage) {
  const root = mkdtempSync(join(tmpdir(), "25thgame-source-test-"));
  try {
    const content = join(root, "content", "github-prefix");
    mkdirSync(join(content, "deploy"), { recursive: true });
    writeFileSync(join(content, "package.json"), '{"name":"source-fixture"}');
    writeFileSync(join(content, "package-lock.json"), '{"lockfileVersion":3}');
    writeFileSync(join(content, "deploy/aliyun-flow-deploy.sh"), "#!/bin/sh\n");
    const archive = join(root, "fixture.tar.gz");
    const packed = spawnSync("tar", ["-czf", archive, "-C", join(root, "content"), "github-prefix"]);
    assert.equal(packed.status, 0);
    const bin = join(root, "bin");
    mkdirSync(bin);
    writeFileSync(join(bin, "curl"), curlStub);
    chmodSync(join(bin, "curl"), 0o755);
    const work = join(root, "work");
    mkdirSync(work);
    const calls = join(root, "curl-calls");
    const result = spawnSync("sh", ["-c", "set -eu\n" + sourceFunction + "\nfetch_source_archive\nprintf 'SOURCE_READY:%s\\n' \"$COMMIT_ID\""], {
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        PATH: bin + ":" + process.env.PATH,
        WORK_ROOT: work,
        REPO_DIR: join(work, "repo"),
        FIXTURE_ARCHIVE: archive,
        CURL_CALLS: calls,
        FAIL_STAGE: stage,
      },
    });
    return {
      ...result,
      calls: readFileSync(calls, "utf8").trim().split("\n"),
      packageText: stage === "success" ? readFileSync(join(work, "repo/package.json"), "utf8") : null,
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("source download pins the resolved main SHA and extracts the actual archive", () => {
  const result = exerciseSource("success");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(result.calls, [
    "https://api.github.com/repos/XiaoSiKe/The-25th-Hour/commits/main",
    "https://api.github.com/repos/XiaoSiKe/The-25th-Hour/tarball/" + commit,
  ]);
  assert.match(result.stdout, /SOURCE_READY:aaaaaaaaaaaa/);
  assert.equal(JSON.parse(result.packageText).name, "source-fixture");
});

for (const stage of ["api", "invalid-sha", "archive", "corrupt"]) {
  test("source acquisition stops before building after " + stage + " failure", () => {
    const result = exerciseSource(stage);
    assert.notEqual(result.status, 0);
    assert.ok(!result.stdout.includes("SOURCE_READY:"));
    if (stage === "api" || stage === "invalid-sha") assert.equal(result.calls.length, 1);
  });
}

test("a feature branch push skips production before source acquisition", () => {
  const result = spawnSync("sh", ["-c", triggerGuard + "\nprintf 'PRODUCTION_ALLOWED'"], {
    encoding: "utf8",
    env: { ...process.env, ref: "refs/heads/codex/example" },
  });
  assert.equal(result.status, 0);
  assert.ok(!result.stdout.includes("PRODUCTION_ALLOWED"));
});

test("main pushes and manual runs pass the trigger guard", () => {
  for (const ref of ["refs/heads/main", ""]) {
    const result = spawnSync("sh", ["-c", triggerGuard + "\nprintf 'PRODUCTION_ALLOWED'"], {
      encoding: "utf8",
      env: { ...process.env, ref },
    });
    assert.equal(result.status, 0);
    assert.ok(result.stdout.includes("PRODUCTION_ALLOWED"));
  }
});
