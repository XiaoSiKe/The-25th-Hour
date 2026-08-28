import { musicLibraryTracks } from "./game/music.mjs";

const LOUDNESS_SAMPLE_START_SECONDS = 20;
const LOUDNESS_SAMPLE_WINDOW_SECONDS = 6;
const tracks = musicLibraryTracks();
const state = {
  index: 0,
  masterVolume: 1,
  filtered: tracks,
};
let audioContext = null;
let audioGain = null;
let audioSource = null;

const audio = document.querySelector("[data-audio]");
const list = document.querySelector("[data-track-list]");
const search = document.querySelector("[data-search]");
const groupFilter = document.querySelector("[data-group-filter]");
const count = document.querySelector("[data-count]");
const cover = document.querySelector("[data-now-cover]");
const title = document.querySelector("[data-now-title]");
const meta = document.querySelector("[data-now-meta]");
const volume = document.querySelector("[data-now-volume]");
const status = document.querySelector("[data-status]");
const toggle = document.querySelector("[data-toggle]");
const prev = document.querySelector("[data-prev]");
const next = document.querySelector("[data-next]");
const progress = document.querySelector("[data-progress]");
const time = document.querySelector("[data-time]");
const masterVolume = document.querySelector("[data-master-volume]");
const masterVolumeText = document.querySelector("[data-master-volume-text]");
const audit = document.querySelector("[data-audit]");
const auditOutput = document.querySelector("[data-audit-output]");

init();

function init() {
  window.__musicPreviewTracks = tracks;
  window.__measureMusicLoudness = measureAllTracks;
  renderGroupFilter();
  applyFilters();
  selectTrack(0, { loadOnly: true });
}

function renderGroupFilter() {
  const groups = ["全部", ...new Set(tracks.map((track) => track.group))];
  groupFilter.innerHTML = groups.map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join("");
}

function applyFilters() {
  const keyword = search.value.trim().toLowerCase();
  const group = groupFilter.value;
  state.filtered = tracks.filter((track) => {
    const inGroup = !group || group === "全部" || track.group === group;
    const haystack = `${track.id} ${track.title} ${track.artist} ${track.group}`.toLowerCase();
    return inGroup && (!keyword || haystack.includes(keyword));
  });
  if (!state.filtered.length) {
    list.innerHTML = "";
    count.textContent = "没有匹配曲目";
    return;
  }
  const current = currentTrack();
  if (!state.filtered.includes(current)) {
    state.index = tracks.indexOf(state.filtered[0]);
  }
  renderList();
  renderNowPlaying();
}

function renderList() {
  const current = currentTrack();
  count.textContent = `${tracks.length} 首曲目，当前显示 ${state.filtered.length} 首`;
  list.innerHTML = state.filtered.map((track) => `
    <li>
      <button class="track-button ${track === current ? "is-active" : ""}" type="button" data-track-id="${escapeHtml(track.id)}">
        <img class="track-cover" src="${escapeHtml(track.cover)}" alt="" loading="lazy" />
        <span>
          <span class="track-name">${escapeHtml(track.title)}</span>
          <span class="track-meta">${escapeHtml(track.group)} / ${escapeHtml(track.artist)}</span>
        </span>
        <span class="track-volume">${Math.round((track.volume ?? 1) * 100)}%</span>
      </button>
    </li>
  `).join("");
}

function selectTrack(index, options = {}) {
  if (index < 0 || index >= tracks.length) return;
  const wasPlaying = !audio.paused && !audio.ended;
  state.index = index;
  const track = currentTrack();
  audio.src = track.src;
  applyAudioOutputVolume(track);
  audio.loop = Boolean(track.loop);
  audio.currentTime = 0;
  renderNowPlaying();
  renderList();
  updateProgress();
  status.textContent = options.loadOnly ? "已载入曲目" : "已切换曲目";
  if (wasPlaying && !options.loadOnly) {
    playAudio();
  }
}

function currentTrack() {
  return tracks[state.index] ?? tracks[0];
}

function currentFilteredIndex() {
  const current = currentTrack();
  const index = state.filtered.indexOf(current);
  return index >= 0 ? index : 0;
}

function stepTrack(delta) {
  if (!state.filtered.length) return;
  const nextFilteredIndex = (currentFilteredIndex() + delta + state.filtered.length) % state.filtered.length;
  selectTrack(tracks.indexOf(state.filtered[nextFilteredIndex]));
}

function renderNowPlaying() {
  const track = currentTrack();
  cover.src = track.cover;
  title.textContent = track.title;
  meta.textContent = `${track.group} / ${track.artist} / ${track.kind}`;
  volume.textContent = `归一化系数 ${Math.round((track.volume ?? 1) * 100)}%，监听输出 ${Math.round(effectiveVolume(track) * 100)}%`;
  toggle.textContent = audio.paused ? "播放" : "暂停";
  prev.disabled = state.filtered.length <= 1;
  next.disabled = state.filtered.length <= 1;
}

function effectiveVolume(track) {
  return Math.max(0, state.masterVolume * (track.volume ?? 1));
}

function playAudio() {
  applyAudioOutputVolume(currentTrack(), { allowGain: true });
  if (audioContext?.state === "suspended") audioContext.resume();
  audio.play().then(() => {
    status.textContent = "正在播放";
    renderNowPlaying();
  }).catch(() => {
    status.textContent = "浏览器拦截播放，点击播放按钮后重试";
  });
}

function applyAudioOutputVolume(track, options = {}) {
  const scale = track.volume ?? 1;
  if (scale <= 1 && !audioGain) {
    audio.volume = Math.min(1, effectiveVolume(track));
    return;
  }
  if (options.allowGain === true) {
    ensureAudioGain();
  }
  if (audioGain) {
    audio.volume = Math.min(1, state.masterVolume);
    audioGain.gain.value = scale;
  } else {
    audio.volume = Math.min(1, effectiveVolume(track));
  }
}

function ensureAudioGain() {
  if (audioGain) return;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;
  audioContext = audioContext ?? new AudioContextCtor();
  audioSource = audioSource ?? audioContext.createMediaElementSource(audio);
  audioGain = audioContext.createGain();
  audioSource.connect(audioGain);
  audioGain.connect(audioContext.destination);
}

function updateProgress() {
  const duration = Number(audio.duration);
  const currentTime = Number(audio.currentTime) || 0;
  progress.value = Number.isFinite(duration) && duration > 0
    ? String(Math.round((currentTime / duration) * Number(progress.max || 1000)))
    : "0";
  time.textContent = `${formatTime(currentTime)} / ${Number.isFinite(duration) && duration > 0 ? formatTime(duration) : "--:--"}`;
}

async function measureAllTracks() {
  audit.disabled = true;
  auditOutput.textContent = `measuring from ${LOUDNESS_SAMPLE_START_SECONDS}s...`;
  const rows = [];
  for (const track of tracks) {
    rows.push(await measureTrack(track));
    auditOutput.textContent = formatAuditRows(rows);
  }
  audit.disabled = false;
  auditOutput.textContent = formatAuditRows(rows);
  window.__musicLoudnessRows = rows;
  return rows;
}

async function measureTrack(track) {
  const response = await fetch(track.src);
  const arrayBuffer = await response.arrayBuffer();
  const context = new OfflineAudioContext(1, 1, 44100);
  const buffer = await context.decodeAudioData(arrayBuffer.slice(0));
  const sample = sampleRms(buffer, LOUDNESS_SAMPLE_START_SECONDS, LOUDNESS_SAMPLE_WINDOW_SECONDS);
  return {
    id: track.id,
    title: track.title,
    group: track.group,
    volume: track.volume ?? 1,
    sampleStart: round4(sample.start),
    sampleEnd: round4(sample.end),
    activeRms: round4(sample.rms),
    adjustedRms: round4(sample.rms * (track.volume ?? 1)),
    peak: round4(sample.peak),
    adjustedPeak: round4(sample.peak * (track.volume ?? 1)),
  };
}

function sampleRms(buffer, startSeconds, windowSeconds) {
  const start = Math.min(Math.max(0, buffer.duration - 0.1), Math.max(0, startSeconds));
  const end = Math.min(buffer.duration, start + windowSeconds);
  const startSample = Math.max(0, Math.floor(start * buffer.sampleRate));
  const endSample = Math.max(startSample + 1, Math.floor(end * buffer.sampleRate));
  let sumSquares = 0;
  let count = 0;
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = startSample; index < endSample; index += 1) {
      const value = Math.abs(data[index] ?? 0);
      peak = Math.max(peak, value);
      sumSquares += value * value;
      count += 1;
    }
  }
  return {
    start,
    end,
    rms: Math.sqrt(sumSquares / Math.max(1, count)),
    peak,
  };
}

function formatAuditRows(rows) {
  return rows
    .map((row) => `${row.id.padEnd(27)} ${String(row.volume).padStart(4)} ${String(row.sampleStart).padStart(5)}s rms ${String(row.activeRms).padStart(6)} -> ${String(row.adjustedRms).padStart(6)} peak ${String(row.adjustedPeak).padStart(6)}`)
    .join("\n");
}

function round4(value) {
  return Math.round((Number(value) || 0) * 10000) / 10000;
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(value % 60).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-track-id]");
  if (!button) return;
  const index = tracks.findIndex((track) => track.id === button.dataset.trackId);
  selectTrack(index);
});

search.addEventListener("input", applyFilters);
groupFilter.addEventListener("change", applyFilters);

toggle.addEventListener("click", () => {
  if (audio.paused) {
    playAudio();
  } else {
    audio.pause();
    status.textContent = "已暂停";
    renderNowPlaying();
  }
});

prev.addEventListener("click", () => stepTrack(-1));
next.addEventListener("click", () => stepTrack(1));
audit.addEventListener("click", measureAllTracks);

progress.addEventListener("input", () => {
  const duration = Number(audio.duration);
  if (!Number.isFinite(duration) || duration <= 0) return;
  audio.currentTime = duration * (Number(progress.value) / Number(progress.max || 1000));
  updateProgress();
});

masterVolume.addEventListener("input", () => {
  state.masterVolume = Number(masterVolume.value) / 100;
  masterVolumeText.textContent = `${Math.round(state.masterVolume * 100)}%`;
  applyAudioOutputVolume(currentTrack());
  renderNowPlaying();
});

audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("loadedmetadata", updateProgress);
audio.addEventListener("play", renderNowPlaying);
audio.addEventListener("pause", renderNowPlaying);
audio.addEventListener("ended", () => stepTrack(1));
