# Aliyun Flow Operations

中文运维入口、私有配置与本机恢复步骤见 [deploy/README.md](../deploy/README.md)。本文保留流水线及生产资源的专项操作说明。

This project deploys the domestic site through Aliyun Flow and the VMDeploy job in `deploy/aliyun-flow.yml`.

The source repository is `https://github.com/XiaoSiKe/The-25th-Hour`. It is public, so the pinned source archive remains readable without storing a GitHub credential on the deployment server. Account migrations must update the repository webhook and Flow's stored job definition as well as the local Git remote.

## Current Pipeline Shape

GitHub pushes call the Flow webhook registered on the repository. The job skips non-`main` refs before acquiring the deployment lock; only `main` pushes and manual runs without a ref proceed. The webhook only proves that Flow accepted the event; the actual build and VM deployment still happen inside Aliyun Flow.

The Flow job currently does this on every run:

1. Resolve the current `main` commit through GitHub's API, validate its full SHA, and download the official GitHub source archive pinned to that SHA. TLS verification remains enabled; no third-party mirror, fixed IP, or new credential is used.
2. Run `npm ci --prefer-offline --no-audit --no-fund`.
3. Run `npm run build:aliyun`, which first runs `ci:verify` (including deployment rollback tests), then builds and verifies asset URLs.
4. Copy `.aliyun-output/static` into a timestamped release under `/var/www/25thgame/releases`.
5. Validate Nginx configuration, flip `/var/www/25thgame/current`, reload Nginx, and verify the origin's `version.json` and `game.html` over HTTPS.

If configuration validation, reload, or the origin checks fail, the deploy script restores the previous release pointer and Nginx configuration. Old release cleanup runs only after these checks pass. The game entry is `arch.25thgame.vip`; `www.25thgame.vip` is retired and must not be recreated by deployment.

Flow needs to provision or enter the deployment job, install dependencies unless cache is warm, run the static build, probe production asset URLs, and then run VMDeploy over the machine group.

The source archive replaces Git's `info/refs` and clone transport because that endpoint repeatedly stalled from this ECS while `api.github.com` and `codeload.github.com` remained reachable. The downloaded archive was verified against the tracked file contents and modes of the same commit. The build does not require `.git`; `COMMIT_ID` comes from the validated source SHA. API errors, invalid SHAs, failed downloads, or invalid archives stop the job before deployment.

`deploy/aliyun-flow.yml` is the checked-in configuration. After changing its source-acquisition code, synchronize the same YAML to the existing Flow pipeline before relying on the fix; changing this file alone does not update Flow's stored job definition.

## Local Status Commands

The helper script does not store secrets in the repository. Put credentials in your shell or in ignored `.env.local`. On the organized local workspace, `.env.local` links to the private operations configuration outside the project directory; `.env.example` contains placeholders only:

```sh
YUNXIAO_TOKEN=pt-...
YUNXIAO_ORGANIZATION_ID=...
YUNXIAO_PIPELINE_ID=...
YUNXIAO_FLOW_DOMAIN=https://openapi-rdc.aliyuncs.com
```

For Region Edition, use:

```sh
YUNXIAO_REGION_MODE=1
```

Check whether the public Aliyun site has the latest startup-gate code:

```sh
npm run aliyun:flow:site
```

Verify that the domestic CDN allows the Aliyun site to read startup audio:

```sh
npm run verify:production-domestic-cors
```

`assets-cn.25thgame.vip` must return one of these headers for startup audio requests with `Origin: https://arch.25thgame.vip`:

```http
Access-Control-Allow-Origin: https://arch.25thgame.vip
```

or, for public static assets:

```http
Access-Control-Allow-Origin: *
```

Keep `GET` and `HEAD` enabled. After changing the CDN or OSS rule, refresh the CDN cache for:

```text
/assets/v1/optimized/asset-work/assets/audio/year-bgm/*
/assets/v1/optimized/asset-work/assets/audio/ending-tracks/*
```

The `ending-tracks` entries in the domestic startup set are only the five forced-failure startup BGM files. Ordinary ending songs and their `.lrc` lyrics stay on R2 at `https://assets-apac.25thgame.vip/assets/v1/optimized/asset-work/assets/audio/ending-tracks/...`.

If only one forced-failure startup BGM object is stale, refresh that exact domestic CDN URL. For example:

```text
https://assets-cn.25thgame.vip/assets/v1/optimized/asset-work/assets/audio/ending-tracks/%E8%B6%85%E4%BA%BA%E5%BC%BA%E5%87%BA%E5%9C%BA%E6%9B%B2.e653df394649.m4a
```

When a URL with `?cors_probe=...` returns the correct CORS header but the bare URL does not, the source rule is already fixed and the remaining issue is the CDN cached object.

Check the latest Flow run:

```sh
npm run aliyun:flow:status
```

List recent Flow runs:

```sh
npm run aliyun:flow:runs -- --per-page 10
```

Start a manual Flow run from `main` only with a token that has run permissions. The current five-year diagnostics token is read-only and cannot use this command:

```sh
npm run aliyun:flow:run
```

Pass extra runtime variables when needed:

```sh
npm run aliyun:flow -- run --branch main --env KEY=VALUE --comment "manual release check"
```

## Why A Push Can Look Slow

- GitHub webhook delivery can be fast while Flow run scheduling is still pending.
- The VMDeploy job serializes deploys with `/tmp/25thgame-flow/deploy.lock`; a previous deployment makes new triggers wait or fail fast.
- `npm ci` is repeated inside the Flow job. Flow cache must be configured in the Aliyun UI; the repository cannot guarantee it.
- `npm run build:aliyun` directly builds the Aliyun static output, copies startup domestic assets, and verifies production asset URLs.
- Nginx reload only happens after the release directory is fully staged and config validation succeeds.

## Fast-Follow Improvements

- Enable Flow cache for `/root/.npm` if it is not already enabled.
- Keep `npm ci --prefer-offline --no-audit --no-fund` in the job; it is cache-friendly.
- Consider moving public URL probes after the symlink flip when a transient R2 warning should not block domestic deploys.
- Add Flow notification hooks for failed, queued, and successful runs so status does not require console polling.
