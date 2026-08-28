import { monitorApiBaseFor } from "../../monitoring/api-origin.mjs";

const MONITOR_API_BASE = monitorApiBaseFor(window.location);
const AUTO_REFRESH_INTERVAL_MS = 60000;
const SVG_NS = "http://www.w3.org/2000/svg";
const TODAY_X_AXIS_LABELS = ["00", "03", "06", "09", "12", "15", "18", "21", "24"];
const TODAY_X_AXIS_POSITIONS = [70, 250, 430, 610, 790, 970, 1150, 1330, 1508];
const NON_TODAY_X_AXIS_LEFT = 250;
const NON_TODAY_X_AXIS_RIGHT = 1484;
const LOCAL_PREVIEW_START_DATE = new Date(2026, 5, 14);
const LOCAL_PREVIEW_DAILY_PLAYER_PATTERN = [86, 97, 103, 111, 94, 122, 87];
const LOCAL_PREVIEW_HOURLY_WEIGHTS = [3, 5, 8, 14, 20, 23, 17, 10];
const RANK_TROPHY_ICONS = {
  1: "/optimized/asset-work/ui-icon-final/confirmed-icons/31-competition-award-states/007_一等奖__UIATLAS_010_007_pxui_competition_007_奖杯.1c3bcd147592.webp",
  2: "/optimized/asset-work/ui-icon-final/confirmed-icons/31-competition-award-states/008_二等奖__UIATLAS_010_008_pxui_competition_008_奖杯.bb64dd2971d6.webp",
  3: "/optimized/asset-work/ui-icon-final/confirmed-icons/31-competition-award-states/009_三等奖__UIATLAS_010_009_pxui_competition_009_奖杯.3e234c522f32.webp",
};
const emptyDashboard = {
  summary: {
    siteVisitorTotal: 0,
    gamePlayerTotal: 0,
    averageStayMinutes: 0,
    completionTotal: 0,
    coffeeSupporterTotal: 0,
    currentDate: "",
  },
  activityTrend: {
    points: [
      { hour: "00", siteUserCount: 0 },
      { hour: "03", siteUserCount: 0 },
      { hour: "06", siteUserCount: 0 },
      { hour: "09", siteUserCount: 0 },
      { hour: "12", siteUserCount: 0 },
      { hour: "15", siteUserCount: 0 },
      { hour: "18", siteUserCount: 0 },
      { hour: "21", siteUserCount: 0 },
    ],
  },
  leaderboard: {
    players: [],
  },
};

const root = document.documentElement;
const themeScope = document.body;
const rangeButtons = Array.from(document.querySelectorAll("[data-range]"));
const tableBody = document.querySelector("tbody");
const currentDateTarget = document.querySelector("[data-current-date]");
const trendChart = document.querySelector(".trend-chart");
const trendArea = document.querySelector(".trend-area");
const trendLine = document.querySelector(".trend-line");
let activeRange = "today";
let latestDashboardByRange = new Map();
let latestLeaderboardByRange = new Map();
let activeRequestId = 0;

async function applyRange(range, { background = false } = {}) {
  const requestedRange = normalizeRange(range);
  const requestId = activeRequestId + 1;
  activeRequestId = requestId;
  activeRange = requestedRange;
  updateRangeButtons(activeRange);
  if (!background) renderDashboard(
    latestDashboardByRange.get(activeRange) ?? emptyDashboard,
    latestLeaderboardByRange.get(activeRange) ?? emptyDashboard.leaderboard,
  );

  const [dashboardResult, leaderboardResult] = await Promise.allSettled([
    fetchDashboard(activeRange),
    fetchLeaderboard(activeRange),
  ]);
  if (requestId !== activeRequestId) return;

  if (dashboardResult.status === "fulfilled") {
    const dashboard = dashboardResult.value;
    latestDashboardByRange.set(activeRange, dashboard);
  } else {
    console.warn("Failed to load monitor dashboard", dashboardResult.reason);
  }

  if (leaderboardResult.status === "fulfilled") {
    latestLeaderboardByRange.set(activeRange, leaderboardResult.value?.leaderboard ?? emptyDashboard.leaderboard);
  } else {
    console.warn("Failed to load monitor leaderboard", leaderboardResult.reason);
  }

  const dashboard = latestDashboardByRange.get(activeRange) ?? emptyDashboard;
  const leaderboard = latestLeaderboardByRange.get(activeRange) ?? emptyDashboard.leaderboard;
  renderDashboard(dashboard, leaderboard);
}

async function fetchDashboard(range) {
  if (!MONITOR_API_BASE) return localPreviewDashboard(range);
  const response = await fetch(`${MONITOR_API_BASE}/api/monitor/dashboard?range=${encodeURIComponent(range)}&fresh=1`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`dashboard_${response.status}`);
  return response.json();
}

async function fetchLeaderboard(range) {
  if (!MONITOR_API_BASE) return { leaderboard: localPreviewLeaderboard(range) };
  const requestedRange = normalizeRange(range);
  const response = await fetch(`${MONITOR_API_BASE}/api/leaderboard?limit=all&range=${encodeURIComponent(requestedRange)}&fresh=1`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`leaderboard_${response.status}`);
  return response.json();
}

function renderDashboard(dashboard, leaderboard = latestLeaderboardByRange.get(activeRange) ?? emptyDashboard.leaderboard) {
  const summary = dashboard?.summary ?? emptyDashboard.summary;
  setMetric("visitors", formatInteger(summary.siteVisitorTotal));
  setMetric("players", formatInteger(summary.gamePlayerTotal));
  setMetric("duration", formatStayMinutes(summary.averageStayMinutes));
  setMetric("endings", formatInteger(summary.completionTotal));
  setMetric("supporters", formatInteger(summary.coffeeSupporterTotal));
  if (currentDateTarget) currentDateTarget.textContent = summary.currentDate || formatCurrentDate();
  renderTrend(dashboard?.activityTrend?.points ?? emptyDashboard.activityTrend.points);
  renderLeaderboard(leaderboard?.players ?? []);
}

function setMetric(key, value) {
  const target = document.querySelector(`[data-metric="${key}"], [data-signal="${key}"]`);
  if (target) target.textContent = value;
}

function updateRangeButtons(range) {
  rangeButtons.forEach((button) => {
    const isActive = button.dataset.range === range;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderTrend(points) {
  if (!trendArea || !trendLine) return;
  const values = points.map((point) => Math.max(0, Number(point.siteUserCount) || 0));
  const left = 70;
  const right = 1508;
  const top = 10;
  const bottom = 220;
  const width = right - left;
  const ticks = trendTicksFor(values);
  const maxValue = ticks.at(-1) ?? 0;
  updateTrendAxis(ticks, { top, bottom });
  updateTrendXAxis(points, { left, right });
  updateTrendGrid(points, { top, bottom });
  const coordinates = values.map((value, index) => {
    const x = left + (width * index) / Math.max(1, values.length - 1);
    const y = trendYForValue(value, maxValue, { top, bottom });
    return `${roundCoord(x)},${roundCoord(y)}`;
  });
  trendLine.setAttribute("points", coordinates.join(" "));
  trendArea.setAttribute("d", coordinates.length
    ? `M${coordinates.join(" L")} L${right} ${bottom} L${left} ${bottom} Z`
    : "");
  if (trendChart) {
    const latest = values.at(-1) ?? 0;
    trendChart.setAttribute("aria-label", `玩家趋势图，最新窗口 ${latest} 人，纵轴上限 ${maxValue} 人`);
  }
}

function trendTicksFor(values) {
  const maxDataValue = Math.max(0, ...values);
  if (maxDataValue <= 0) return [0, 1, 2, 3];
  const step = niceCeil(maxDataValue / 3);
  return [0, step, step * 2, step * 3];
}

function trendYForValue(value, maxValue, { top, bottom }) {
  if (maxValue <= 0) return bottom;
  const cappedValue = Math.min(maxValue, Math.max(0, Number(value) || 0));
  return bottom - ((bottom - top) * cappedValue) / maxValue;
}

function updateTrendAxis(ticks, { top, bottom }) {
  if (!trendChart) return;
  const labels = Array.from(trendChart.querySelectorAll(".y-axis-label"));
  const maxValue = ticks.at(-1) ?? 0;
  const labelValues = [...ticks].reverse();
  labels.forEach((label, index) => {
    const value = labelValues[index] ?? 0;
    const fallbackY = top + ((bottom - top) * index) / Math.max(1, labels.length - 1);
    const lineY = maxValue > 0 ? trendYForValue(value, maxValue, { top, bottom }) : fallbackY;
    label.textContent = formatInteger(value);
    label.setAttribute("y", String(roundCoord(lineY + 8)));
  });
}

function updateTrendXAxis(points, { left, right }) {
  if (!trendChart) return;
  const axis = trendChart.querySelector(".trend-axis");
  if (!axis) return;
  axis.querySelectorAll(".x-axis-label").forEach((label) => label.remove());
  const labels = trendXAxisLabels(points);
  labels.forEach((text, index) => {
    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", "x-axis-label");
    label.setAttribute("x", String(roundCoord(trendXAxisLabelX(index, labels.length, { left, right }))));
    label.setAttribute("y", "246");
    label.textContent = text;
    axis.append(label);
  });
}

function updateTrendGrid(points, { top, bottom }) {
  if (!trendChart) return;
  const verticalGrid = trendChart.querySelector(".trend-grid path:nth-child(2)");
  if (!verticalGrid) return;
  const labels = trendXAxisLabels(points);
  const positions = labels.map((_label, index) => trendXAxisLabelX(index, labels.length, {
    left: 70,
    right: 1508,
  }));
  verticalGrid.setAttribute("d", positions.map((x) => {
    const roundedX = roundCoord(x);
    return `M${roundedX} ${top}V${bottom}`;
  }).join(""));
}

function trendXAxisLabels(points) {
  if (points.every((point) => point?.hour !== undefined)) return TODAY_X_AXIS_LABELS;
  if (activeRange === "week") return points.slice(-7).map(trendPointLabel);
  return trendAllXAxisLabels(points);
}

function trendXAxisLabelX(index, count, { left, right }) {
  if (count === TODAY_X_AXIS_POSITIONS.length) return TODAY_X_AXIS_POSITIONS[index];
  return NON_TODAY_X_AXIS_LEFT
    + ((NON_TODAY_X_AXIS_RIGHT - NON_TODAY_X_AXIS_LEFT) * index) / Math.max(1, count - 1);
}

function trendPointLabel(point) {
  return String(point?.label ?? point?.hour ?? "").trim() || "--";
}

function trendAllXAxisLabels(points) {
  const labels = points.map(trendPointLabel).filter((label) => label && label !== "--");
  if (labels.length >= 4) return sampleLabels(labels, 4);
  const filled = interpolateMonthDayLabels(labels, 4);
  return filled.length ? filled : labels;
}

function sampleLabels(labels, count) {
  return Array.from({ length: count }, (_item, index) => {
    const sourceIndex = Math.round((labels.length - 1) * index / Math.max(1, count - 1));
    return labels[sourceIndex];
  });
}

function interpolateMonthDayLabels(labels, count) {
  if (labels.length < 2) return labels;
  const first = parseMonthDayLabel(labels[0]);
  const last = parseMonthDayLabel(labels.at(-1));
  if (!first || !last) return labels;
  const lastTime = last.date.getTime() <= first.date.getTime()
    ? addDays(last.date, 365).getTime()
    : last.date.getTime();
  return Array.from({ length: count }, (_item, index) => {
    const time = first.date.getTime() + ((lastTime - first.date.getTime()) * index) / Math.max(1, count - 1);
    return `${formatMonthDay(new Date(time))}${last.suffix}`;
  });
}

function parseMonthDayLabel(label) {
  const match = /^(\d{2})\.(\d{2})(周?)$/u.exec(label);
  if (!match) return null;
  return {
    date: new Date(new Date().getFullYear(), Number(match[1]) - 1, Number(match[2])),
    suffix: match[3] || "",
  };
}

function localPreviewDashboard(range) {
  const requestedRange = normalizeRange(range);
  const now = new Date();
  const days = localPreviewDaysForRange(requestedRange, now);
  const summary = localPreviewSummary(days, requestedRange);
  const points = requestedRange === "today"
    ? localPreviewHourlyTrend(days[0])
    : requestedRange === "week"
      ? days.map((day) => ({
        label: formatMonthDay(day),
        siteUserCount: localPreviewDailyPlayers(day),
      }))
      : localPreviewWeeklyTrend(days);

  return {
    range: requestedRange,
    generatedAt: now.toISOString(),
    summary: {
      ...summary,
      currentDate: formatCurrentDate(),
    },
    activityTrend: {
      metric: "siteUserCount",
      unit: "people",
      points,
    },
  };
}

function localPreviewLeaderboard() {
  const names = [
    ["图纸暴走", "华南建筑学院", 9860, "大师事务所"],
    ["熬夜剖面", "同济建筑系", 9720, "顶级名校留学"],
    ["模型不倒", "东南建筑学院", 9510, "国企设计院"],
    ["草图狂想", "清华建筑学院", 9340, "稳妥上岸"],
    ["节点猎人", "重大建筑城规", 9180, "独立小型工作室"],
    ["渲染加速", "西建大建筑", 9010, "省市厅局"],
    ["蓝图醒醒", "天大建筑学院", 8860, "外企事务所"],
    ["楼梯转角", "哈工大建筑", 8720, "教师编制"],
    ["总平面王", "浙大建工", 8580, "地方设计院"],
    ["咖啡封顶", "深大建筑", 8410, "AI 产品经理"],
  ];
  return {
    limit: "all",
    players: names.map(([nickname, school, score, endingTitle], index) => ({
      rank: index + 1,
      nickname,
      school,
      score,
      endingTitle,
    })),
  };
}

function localPreviewSummary(days, range) {
  const gamePlayerTotal = days.reduce((total, day) => total + localPreviewDailyPlayers(day), 0);
  if (range === "all") {
    return {
      siteVisitorTotal: 229300,
      gamePlayerTotal: 198000,
      averageStayMinutes: 78,
      completionTotal: 1230987,
      coffeeSupporterTotal: 3983,
    };
  }
  return {
    siteVisitorTotal: Math.round(gamePlayerTotal * 1.36),
    gamePlayerTotal,
    averageStayMinutes: 8.4,
    completionTotal: Math.round(gamePlayerTotal * 0.52),
    coffeeSupporterTotal: Math.round(gamePlayerTotal * 0.18),
  };
}

function localPreviewDaysForRange(range, now) {
  const today = startOfLocalDay(now);
  if (range === "today") return [today];
  if (range === "week") {
    return Array.from({ length: 7 }, (_item, index) => addDays(today, index - 6));
  }

  const totalDays = Math.max(1, daysBetween(LOCAL_PREVIEW_START_DATE, today) + 1);
  return Array.from({ length: totalDays }, (_item, index) => addDays(LOCAL_PREVIEW_START_DATE, index));
}

function localPreviewDailyPlayers(day) {
  const index = daysBetween(LOCAL_PREVIEW_START_DATE, startOfLocalDay(day));
  const patternIndex = ((index % LOCAL_PREVIEW_DAILY_PLAYER_PATTERN.length) + LOCAL_PREVIEW_DAILY_PLAYER_PATTERN.length)
    % LOCAL_PREVIEW_DAILY_PLAYER_PATTERN.length;
  return LOCAL_PREVIEW_DAILY_PLAYER_PATTERN[patternIndex];
}

function localPreviewHourlyTrend(day) {
  const players = localPreviewDailyPlayers(day);
  const values = distributeTotal(players, LOCAL_PREVIEW_HOURLY_WEIGHTS);
  return ["00", "03", "06", "09", "12", "15", "18", "21"].map((hour, index) => ({
    hour,
    siteUserCount: values[index],
  }));
}

function localPreviewWeeklyTrend(days) {
  const totalsByWeek = [];
  days.forEach((day) => {
    const bucketIndex = Math.floor(daysBetween(LOCAL_PREVIEW_START_DATE, day) / 7);
    totalsByWeek[bucketIndex] = (totalsByWeek[bucketIndex] ?? 0) + localPreviewDailyPlayers(day);
  });
  return totalsByWeek.map((siteUserCount, index) => {
    const weekStart = addDays(LOCAL_PREVIEW_START_DATE, index * 7);
    return {
      label: `${formatMonthDay(weekStart)}周`,
      siteUserCount,
    };
  });
}

function distributeTotal(total, weights) {
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const values = weights.map((weight) => Math.round((total * weight) / weightTotal));
  values[values.length - 1] += total - values.reduce((sum, value) => sum + value, 0);
  return values;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start, end) {
  return Math.round((startOfLocalDay(end).getTime() - startOfLocalDay(start).getTime()) / 86400000);
}

function formatMonthDay(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function niceCeil(value) {
  const number = Math.max(1, Number(value) || 1);
  const magnitude = 10 ** Math.floor(Math.log10(number));
  const normalized = number / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function renderLeaderboard(players) {
  if (!players.length) {
    tableBody.innerHTML = '<tr class="empty-row"><td colspan="4">暂无玩家游戏数据</td></tr>';
    return;
  }

  tableBody.innerHTML = players
    .map((player, index) => {
      const rankNumber = normalizeRank(player.rank ?? index + 1);
      const rank = renderRank(rankNumber);
      const selected = index === 0 ? ' class="is-selected" ' : " ";
      const nickname = escapeHtml(player.nickname || "匿名玩家");
      const school = escapeHtml(player.school || "未知建院");
      const score = formatInteger(player.score);
      const endingTitle = escapeHtml(player.endingTitle || "人生结局");
      return `<tr${selected}data-player-row tabindex="0" aria-label="选择第 ${rankNumber ?? index + 1} 名 ${nickname}">
                  <td data-label="名次">${rank}</td>
                  <td data-label="玩家"><strong>${nickname}</strong><span>${school}</span></td>
                  <td data-label="总分">${score}</td>
                  <td data-label="最近人生结局">${endingTitle}</td>
                </tr>`;
    })
    .join("");
  bindRows();
}

function normalizeRank(value) {
  const rank = Number(value);
  return Number.isInteger(rank) && rank > 0 ? rank : null;
}

function renderRank(rankNumber) {
  const trophyIcon = RANK_TROPHY_ICONS[rankNumber];
  if (trophyIcon) {
    const label = `第 ${rankNumber} 名`;
    return `<span class="rank-trophy" aria-label="${label}" title="${label}"><img src="${trophyIcon}" alt="" aria-hidden="true" /></span>`;
  }
  return `<span class="rank-number">${String(rankNumber ?? "--").padStart(2, "0")}</span>`;
}

function bindRows() {
  const rows = Array.from(document.querySelectorAll("tbody tr[data-player-row]"));
  rows.forEach((row) => {
    row.addEventListener("click", () => selectRow(row, rows));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectRow(row, rows);
      }
    });
  });
}

function selectRow(row, rows) {
  rows.forEach((item) => item.classList.toggle("is-selected", item === row));
}

function normalizeRange(range) {
  return range === "week" || range === "all" ? range : "today";
}

function formatCurrentDate() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replace(/\//g, ".");
}

function formatInteger(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("zh-CN").format(Math.max(0, Math.round(number)));
}

function formatStayMinutes(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "0 分";
  if (number < 1) return "<1 分";
  const rounded = Math.round(number * 10) / 10;
  return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(rounded)} 分`;
}

function roundCoord(value) {
  return Math.round(value * 10) / 10;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

rangeButtons.forEach((button) => {
  button.addEventListener("click", () => applyRange(button.dataset.range));
});

if (currentDateTarget) currentDateTarget.textContent = formatCurrentDate();
window.setInterval(() => {
  if (document.visibilityState === "hidden") return;
  applyRange(activeRange, { background: true });
}, AUTO_REFRESH_INTERVAL_MS);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") applyRange(activeRange, { background: true });
});

root.dataset.theme = "dark";
themeScope.dataset.theme = "dark";
applyRange(activeRange);
