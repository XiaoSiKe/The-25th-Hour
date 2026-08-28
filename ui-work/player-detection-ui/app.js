const LIVE_MONITOR_ORIGINS = new Set([
  "https://arch.25thgame.vip",
]);
const MONITOR_API_BASE = LIVE_MONITOR_ORIGINS.has(window.location.origin)
  ? "https://25thgame-monitor-api.yangzi25thgame.workers.dev"
  : "";
const RANK_TROPHY_ICON = "/optimized/asset-work/ui-icon-final/confirmed-icons/01-runtime-ui-references/014_UIATLAS_003_007_pxui_system_007_奖杯__UIATLAS_003_007_pxui_system_007_奖杯.98f0835108e5.webp";
const emptyDashboard = {
  summary: {
    gamePlayerTotal: 0,
    averageStayMinutes: 0,
    completionTotal: 0,
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

async function applyRange(range) {
  activeRange = normalizeRange(range);
  updateRangeButtons(activeRange);
  renderDashboard(latestDashboardByRange.get(activeRange) ?? emptyDashboard);

  try {
    const dashboard = await fetchDashboard(activeRange);
    latestDashboardByRange.set(activeRange, dashboard);
    if (activeRange === normalizeRange(range)) renderDashboard(dashboard);
  } catch (error) {
    console.warn("Failed to load monitor dashboard", error);
    if (!latestDashboardByRange.has(activeRange)) {
      renderDashboard(emptyDashboard);
    }
  }
}

async function fetchDashboard(range) {
  if (!MONITOR_API_BASE) return emptyDashboard;
  const response = await fetch(`${MONITOR_API_BASE}/api/monitor/dashboard?range=${encodeURIComponent(range)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`dashboard_${response.status}`);
  return response.json();
}

function renderDashboard(dashboard) {
  const summary = dashboard?.summary ?? emptyDashboard.summary;
  setMetric("players", formatInteger(summary.gamePlayerTotal));
  setMetric("duration", `${formatInteger(Math.round(Number(summary.averageStayMinutes) || 0))} 分`);
  setMetric("endings", formatInteger(summary.completionTotal));
  if (currentDateTarget) currentDateTarget.textContent = summary.currentDate || formatCurrentDate();
  renderTrend(dashboard?.activityTrend?.points ?? emptyDashboard.activityTrend.points);
  renderLeaderboard(dashboard?.leaderboard?.players ?? []);
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
  const scalePoints = [
    [0, bottom],
    [50, 150],
    [100, 80],
    [500, top],
  ];
  const coordinates = values.map((value, index) => {
    const x = left + (width * index) / Math.max(1, values.length - 1);
    const y = trendYForValue(value, scalePoints);
    return `${roundCoord(x)},${roundCoord(y)}`;
  });
  trendLine.setAttribute("points", coordinates.join(" "));
  trendArea.setAttribute("d", coordinates.length
    ? `M${coordinates.join(" L")} L${right} ${bottom} L${left} ${bottom} Z`
    : "");
  if (trendChart) {
    const latest = values.at(-1) ?? 0;
    trendChart.setAttribute("aria-label", `玩家趋势图，最新窗口 ${latest} 人`);
  }
}

function trendYForValue(value, scalePoints) {
  const cappedValue = Math.min(500, Math.max(0, Number(value) || 0));
  for (let index = 1; index < scalePoints.length; index += 1) {
    const [fromValue, fromY] = scalePoints[index - 1];
    const [toValue, toY] = scalePoints[index];
    if (cappedValue <= toValue) {
      const ratio = (cappedValue - fromValue) / Math.max(1, toValue - fromValue);
      return fromY + (toY - fromY) * ratio;
    }
  }
  return scalePoints[scalePoints.length - 1][1];
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
  if (rankNumber && rankNumber <= 3) {
    const label = `第 ${rankNumber} 名`;
    return `<span class="rank-trophy" aria-label="${label}" title="${label}"><img src="${RANK_TROPHY_ICON}" alt="" aria-hidden="true" /></span>`;
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

root.dataset.theme = "dark";
themeScope.dataset.theme = "dark";
applyRange("today");
