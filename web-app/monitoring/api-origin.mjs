const LIVE_MONITOR_ORIGINS = new Set([
  "https://arch.25thgame.vip",
]);

export function monitorApiBaseFor(location) {
  if (!isLiveMonitorOrigin(location)) return "";
  const origin = String(location?.origin ?? "");
  return origin;
}

export function isLiveMonitorOrigin(location) {
  const origin = String(location?.origin ?? "");
  return LIVE_MONITOR_ORIGINS.has(origin);
}
