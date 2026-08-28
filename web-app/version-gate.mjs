export const APP_VERSION = "V20-20260728";
export const VERSION_MANIFEST_PATH = "/version.json";
export const VERSION_GATE_UPDATE_MESSAGE = "检测到最新版本，正在更新游戏资源……";

const APP_VERSION_PATTERN = /^V(\d+)-(\d{8})$/u;

export function parseAppVersion(version) {
  const match = APP_VERSION_PATTERN.exec(String(version ?? "").trim());
  if (!match) return null;
  return {
    release: Number.parseInt(match[1], 10),
    date: Number.parseInt(match[2], 10),
  };
}

export function compareAppVersions(left, right) {
  const leftVersion = parseAppVersion(left);
  const rightVersion = parseAppVersion(right);
  if (!leftVersion || !rightVersion) return 0;
  if (leftVersion.release !== rightVersion.release) {
    return Math.sign(leftVersion.release - rightVersion.release);
  }
  return Math.sign(leftVersion.date - rightVersion.date);
}

export function versionGateStatus(manifest, currentVersion = APP_VERSION) {
  const latestVersion = String(manifest?.appVersion ?? currentVersion).trim();
  const minSupportedVersion = String(manifest?.minSupportedVersion ?? latestVersion).trim();
  if (!parseAppVersion(currentVersion) || !parseAppVersion(latestVersion) || !parseAppVersion(minSupportedVersion)) {
    return {
      ok: true,
      requiresUpdate: false,
      latestVersion: currentVersion,
      minSupportedVersion: currentVersion,
    };
  }

  const requiresUpdate = compareAppVersions(currentVersion, minSupportedVersion) < 0
    || compareAppVersions(currentVersion, latestVersion) < 0;
  return {
    ok: !requiresUpdate,
    requiresUpdate,
    latestVersion,
    minSupportedVersion,
  };
}

export function newestVersionManifest(manifests) {
  const items = Array.isArray(manifests) ? manifests.filter(Boolean) : [];
  return items.reduce((newest, manifest) => newerVersionManifest(newest, manifest), null);
}

function newerVersionManifest(left, right) {
  const leftRank = manifestVersionRank(left);
  const rightRank = manifestVersionRank(right);
  if (!leftRank) return right;
  if (!rightRank) return left;
  return compareAppVersions(rightRank, leftRank) > 0 ? right : left;
}

function manifestVersionRank(manifest) {
  const latestVersion = validVersionValue(manifest?.appVersion);
  const minSupportedVersion = validVersionValue(manifest?.minSupportedVersion);
  if (!latestVersion && !minSupportedVersion) return "";
  if (!latestVersion) return minSupportedVersion;
  if (!minSupportedVersion) return latestVersion;
  return compareAppVersions(minSupportedVersion, latestVersion) > 0
    ? minSupportedVersion
    : latestVersion;
}

function validVersionValue(version) {
  const value = String(version ?? "").trim();
  return parseAppVersion(value) ? value : "";
}
