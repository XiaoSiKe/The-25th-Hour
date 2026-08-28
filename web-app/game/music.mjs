import { finalAlbumCoverSource } from "../ui/icon-source.mjs";

const FUTURE_YEAR_INITIAL_PRELOAD_COUNT = 2;

const ALBUM_COVERS = {
  year_1_1: albumCover("001", "草地"),
  year_1_2: albumCover("002", "唱片"),
  year_1_3: albumCover("003", "唱片"),
  year_1_4: albumCover("004", "唱片"),
  year_1_5: albumCover("005", "唱片"),
  year_1_6: albumCover("006", "唱片"),
  year_1_7: albumCover("007", "唱片"),
  year_1_8: albumCover("008", "唱片"),
  year_2_1: albumCover("009", "草地"),
  year_2_2: albumCover("012", "唱片"),
  year_2_3: albumCover("010", "唱片"),
  year_2_4: albumCover("011", "唱片"),
  year_2_5: albumCover("013", "唱片"),
  year_2_6: albumCover("014", "唱片"),
  year_2_7: albumCover("015", "唱片"),
  year_2_8: albumCover("016", "唱片"),
  year_2_9: albumCover("017", "唱片"),
  year_2_10: albumCover("018", "唱片"),
  year_2_11: albumCover("019", "唱片"),
  year_2_12: albumCover("020", "徽章"),
  year_3_1: albumCover("021", "唱片"),
  year_3_2: albumCover("022", "唱片"),
  year_3_3: albumCover("023", "唱片"),
  year_4_1: albumCover("025", "唱片"),
  year_4_2: albumCover("026", "唱片"),
  year_4_3: albumCover("027", "唱片"),
  year_4_4: albumCover("028", "唱片"),
  year_5_1: albumCover("029", "唱片"),
  year_5_2: albumCover("045", "唱片"),
  year_5_3: albumCover("046", "唱片"),
  year_5_4: albumCover("030", "唱片"),
  year_5_5: albumCover("031", "唱片"),
  old_boy: albumCover("031", "唱片"),
  into_the_sea: albumCover("032", "唱片"),
  cheers: albumCover("033", "唱片"),
  protagonist: albumCover("034", "唱片"),
  proud_youth: albumCover("035", "唱片"),
  remaining_summer: albumCover("036", "唱片"),
  our_tomorrow: albumCover("037", "唱片"),
  those_years: albumCover("038", "唱片"),
  here_after_us: albumCover("039", "唱片"),
  ending_graduation_failed: albumCover("040", "唱片"),
  ending_living_cost_break: albumCover("041", "唱片"),
  ending_pressure_collapse: albumCover("042", "唱片"),
  ending_two_failed_reviews: albumCover("043", "唱片"),
  ending_forced_suspension: albumCover("044", "唱片"),
};

const TRACK_DURATIONS = {
  year_1_1: 65.123,
  year_1_2: 86.57,
  year_1_3: 65.881,
  year_1_4: 106.475,
  year_1_5: 96,
  year_1_6: 98.612,
  year_1_7: 57.652,
  year_1_8: 101.512,
  year_2_1: 64.914,
  year_2_2: 91.585,
  year_2_3: 33.463,
  year_2_4: 30.38,
  year_2_5: 33.176,
  year_2_6: 34.743,
  year_2_7: 77.349,
  year_2_8: 60.996,
  year_2_9: 57.391,
  year_2_10: 74.632,
  year_2_11: 37.042,
  year_2_12: 82.312,
  year_3_1: 124.604,
  year_3_2: 132.728,
  year_3_3: 70.374,
  year_4_1: 127.896,
  year_4_2: 156.134,
  year_4_3: 97.202,
  year_4_4: 124.944,
  year_5_1: 147.357,
  year_5_2: 108.121,
  year_5_3: 115.775,
  year_5_4: 232.49,
  year_5_5: 94.041,
  old_boy: 295.732,
  into_the_sea: 359.053,
  cheers: 282.253,
  protagonist: 249.051,
  proud_youth: 260.284,
  remaining_summer: 250.096,
  our_tomorrow: 231.915,
  those_years: 364.774,
  here_after_us: 345.469,
  ending_graduation_failed: 33.776,
  ending_living_cost_break: 24.189,
  ending_pressure_collapse: 25.417,
  ending_two_failed_reviews: 26.331,
  ending_forced_suspension: 26.149,
};

const TRACK_VOLUMES = {
  year_1_1: 0.65,
  year_1_2: 0.47,
  year_1_3: 0.6,
  year_1_4: 0.5,
  year_1_5: 0.48,
  year_1_6: 0.65,
  year_1_7: 0.46,
  year_1_8: 0.68,
  year_2_1: 0.25,
  year_2_2: 0.88,
  year_2_3: 0.4,
  year_2_4: 0.55,
  year_2_5: 0.5,
  year_2_6: 0.6,
  year_2_7: 0.5,
  year_2_8: 0.4,
  year_2_9: 0.7,
  year_2_10: 0.4,
  year_2_11: 0.54,
  year_2_12: 0.35,
  year_3_1: 0.49,
  year_3_2: 0.8,
  year_3_3: 0.57,
  year_4_1: 0.76,
  year_4_2: 0.95,
  year_4_3: 1.02,
  year_4_4: 0.67,
  year_5_1: 0.77,
  year_5_2: 0.53,
  year_5_3: 0.91,
  year_5_4: 0.76,
  year_5_5: 1.5,
  old_boy: 1.65,
  into_the_sea: 3.27,
  cheers: 0.96,
  protagonist: 0.55,
  proud_youth: 0.91,
  remaining_summer: 0.71,
  our_tomorrow: 1.53,
  those_years: 0.98,
  here_after_us: 1.72,
  ending_graduation_failed: 0.45,
  ending_living_cost_break: 0.6,
  ending_pressure_collapse: 0.45,
  ending_two_failed_reviews: 0.6,
  ending_forced_suspension: 0.8,
};

const ENDING_TRACK_SOURCES = {
  old_boy: "/optimized/asset-work/assets/audio/ending-tracks/老男孩.c6a608f8f500.m4a",
  into_the_sea: "/optimized/asset-work/assets/audio/ending-tracks/入海.59cc6c3a2154.m4a",
  cheers: "/optimized/asset-work/assets/audio/ending-tracks/干杯.3ca89c3e253a.m4a",
  protagonist: "/optimized/asset-work/assets/audio/ending-tracks/主角.7cc41422a81e.m4a",
  proud_youth: "/optimized/asset-work/assets/audio/ending-tracks/骄傲的少年.cbc91430514d.m4a",
  remaining_summer: "/optimized/asset-work/assets/audio/ending-tracks/剩下的盛夏.10f852fca879.m4a",
  our_tomorrow: "/optimized/asset-work/assets/audio/ending-tracks/我们的明天.3f9a259e9a93.m4a",
  those_years: "/optimized/asset-work/assets/audio/ending-tracks/那些年.2575508aae6f.m4a",
  here_after_us: "/optimized/asset-work/assets/audio/ending-tracks/后来的我们.cb31bcf53093.m4a",
};

const FORCED_ENDING_TRACK_SOURCES = {
  ending_graduation_failed: "/optimized/asset-work/assets/audio/ending-tracks/超人强出场曲.e653df394649.m4a",
  ending_living_cost_break: "/optimized/asset-work/assets/audio/ending-tracks/哈基米南北绿豆.7cdd05d68e32.m4a",
  ending_pressure_collapse: "/optimized/asset-work/assets/audio/ending-tracks/流浪者之歌.b7ca68a7a558.m4a",
  ending_two_failed_reviews: "/optimized/asset-work/assets/audio/ending-tracks/Frolic.332089a1f4ee.m4a",
  ending_forced_suspension: "/optimized/asset-work/assets/audio/ending-tracks/风居住过的街道.6f33f2864369.m4a",
};

export const YEAR_BGM = [
  yearGroup(1, [
    track("year_1_1", "minecraft calm 1-main theme", "我的世界", "/optimized/asset-work/assets/audio/year-bgm/大一学年/minecraftcalm1–maintheme.10b4e665853c.m4a"),
    track("year_1_2", "sacred paly secret place", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大一学年/Sacred paly secret palce.29a275b8aac3.m4a"),
    track("year_1_3", "三葉のテーマ", "你的名字", "/optimized/asset-work/assets/audio/year-bgm/大一学年/三葉のテーマ-你的名字.193eaab62bf3.m4a"),
    track("year_1_4", "最初的记忆", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大一学年/最初的记忆.3f7c6db358cc.m4a"),
    track("year_1_5", "五月天", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大一学年/五月天.95a8efac6009.m4a"),
    track("year_1_6", "Where Memory Had Stayed", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大一学年/Where Memory Had Stayed.5f14b56fd6ad.m4a"),
    track("year_1_7", "Always with me", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大一学年/Always with me.bd6624ea04f2.m4a"),
    track("year_1_8", "知足", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大一学年/知足.b59b9a395791.m4a"),
  ]),
  yearGroup(2, [
    track("year_2_1", "over world day", "泰拉瑞亚", "/optimized/asset-work/assets/audio/year-bgm/大二学年/Overworld day.65d99ffb9a53.m4a"),
    track("year_2_2", "有点甜", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大二学年/有点甜.96fb74388ac6.m4a"),
    track("year_2_3", "家园", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大二学年/家园.3ab50bf06a8b.m4a"),
    track("year_2_4", "人鱼湾", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大二学年/人鱼湾.b78146ec70a6.m4a"),
    track("year_2_5", "宠物园", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大二学年/宠物园.1f13f1f6473f.m4a"),
    track("year_2_6", "雪人谷", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大二学年/雪人谷.c628eedee6ce.m4a"),
    track("year_2_7", "Winter Luv", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大二学年/Winter Luv.274f335f406b.m4a"),
    track("year_2_8", "夏日心动", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大二学年/夏日心动.3e0cf6682cc4.m4a"),
    track("year_2_9", "星茶会", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大二学年/星茶会.df55f551a192.m4a"),
    track("year_2_10", "宝可梦纯音乐", "宝可梦", "/optimized/asset-work/assets/audio/year-bgm/大二学年/宝可梦纯音乐.a1d5a17d8596.m4a"),
    track("year_2_11", "白落落村", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大二学年/白落落村.3907520ffcc2.m4a"),
    track("year_2_12", "战斗-通往胜利", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大二学年/战斗-通往胜利.a77d8e05c3db.m4a"),
  ]),
  yearGroup(3, [
    track("year_3_1", "爱的主题钢琴曲", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大三学年/爱的主题.df6224638c39.m4a"),
    track("year_3_2", "淡淡的爱意", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大三学年/淡淡的爱意.b7bd9c60f7b7.m4a"),
    track("year_3_3", "我的歌声里", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大三学年/我的歌声里.b098eb9ec6bc.m4a"),
  ]),
  yearGroup(4, [
    track("year_4_1", "退后钢琴曲", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大四学年/退后.4e38dca0c7ec.m4a"),
    track("year_4_2", "晴天", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大四学年/晴天.7aae293cad69.m4a"),
    track("year_4_3", "时光机", "五月天", "/optimized/asset-work/assets/audio/year-bgm/大四学年/时光机.f4624291e2a7.m4a"),
    track("year_4_4", "说了再见钢琴曲", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大四学年/说了再见.664c7afb574c.m4a"),
  ]),
  yearGroup(5, [
    track("year_5_1", "爱的回归线", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大五学年/爱的回归线.83120a457dfe.m4a"),
    track("year_5_2", "诺言", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大五学年/诺言.730979983f0f.m4a"),
    track("year_5_3", "蒲公英的约定", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大五学年/蒲公英的约定.825d15f772b1.m4a"),
    track("year_5_4", "The truth that you leave", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大五学年/The truth that you leave.d35ac2932a14.m4a"),
    track("year_5_5", "Never see me again", "纯音乐", "/optimized/asset-work/assets/audio/year-bgm/大五学年/Never see me again.0b045d3e9ad2.m4a"),
  ]),
];

export const OPENING_TRACK = YEAR_BGM[0].tracks[0];

export const ENDING_TRACKS = [
  endingTrack("old_boy", "老男孩", "筷子兄弟", 18, "青春像一条走远的河，回头时才发现还没好好道别。"),
  endingTrack("into_the_sea", "入海", "毛不易", 4, "成长和理想会在时间里互相作答，你要继续往人海里走。"),
  endingTrack("cheers", "干杯", "五月天", 18, "把回忆举起来碰一杯，哪怕时间不能真的倒退。"),
  endingTrack("protagonist", "主角", "马里奥", 26, "五年里真正留下的，是你遇见过的人和成为过的自己。"),
  endingTrack("proud_youth", "骄傲的少年", "南征北战", 4, "少年感不是没有害怕，而是害怕时仍然相信自己。"),
  endingTrack("remaining_summer", "剩下的盛夏", "TFBOYS", 18, "那个夏天被留在身后，却像还在操场边发亮。"),
  endingTrack("our_tomorrow", "我们的明天", "鹿晗", 4, "别被回头路拖住，明天在前面等你。"),
  endingTrack("those_years", "那些年", "胡夏", 4, "错过过雨，也错过过勇气，但你终于走到了今天。"),
  endingTrack("here_after_us", "后来的我们", "五月天", 4, "有些人不再并肩，却仍把彼此送向更远的人生。"),
];

const FORCED_ENDING_TRACKS = {
  graduation_failed: forcedEndingTrack("ending_graduation_failed", "超人强出场曲", "纯音乐", "毕业失败——你被延毕了！"),
  living_cost_break: forcedEndingTrack("ending_living_cost_break", "哈基米南北绿豆", "纯音乐", "你破产了——有感觉吗！？"),
  pressure_collapse: forcedEndingTrack("ending_pressure_collapse", "流浪者之歌", "纯音乐", "压力失控——好好休息，同学"),
  two_failed_reviews: forcedEndingTrack("ending_two_failed_reviews", "Frolic", "纯音乐", "挂科两次被劝退——也许你并不适合"),
  forced_suspension: forcedEndingTrack("ending_forced_suspension", "风居住过的街道", "纯音乐", "被迫停学——好好休息，同学"),
};

export function musicForState(state) {
  if (!state) {
    return withPlaylist(OPENING_TRACK, "year:1", YEAR_BGM[0].tracks, true);
  }
  if (isEndingMemoryAnimation(state)) {
    return endingMusicForState(state, state.pendingEnding);
  }
  if (state.ending) {
    return endingMusicForState(state, state.ending);
  }
  if (state.phase === "year_start") {
    const year = Math.min(5, Math.max(1, state.year || 1));
    const group = YEAR_BGM.find((item) => item.year === year);
    return withPlaylist(group?.tracks[0] ?? OPENING_TRACK, `year:${year}`, group?.tracks ?? [OPENING_TRACK], !canSwitchMusic(state));
  }
  if (!state.musicYearStarted) {
    if ((state.year || 1) > 1) {
      const previousYear = Math.min(5, Math.max(1, (state.year || 1) - 1));
      const previousGroup = YEAR_BGM.find((item) => item.year === previousYear);
      return withPlaylist(previousGroup?.tracks[0] ?? OPENING_TRACK, `year:${previousYear}`, previousGroup?.tracks ?? [OPENING_TRACK], !canSwitchMusic(state));
    }
    return withPlaylist(OPENING_TRACK, "year:1", YEAR_BGM[0].tracks, !canSwitchMusic(state));
  }
  const year = Math.min(5, Math.max(1, state.year || 1));
  const group = YEAR_BGM.find((item) => item.year === year);
  return withPlaylist(group?.tracks[0] ?? OPENING_TRACK, `year:${year}`, group?.tracks ?? [OPENING_TRACK], !canSwitchMusic(state));
}

function isEndingMemoryAnimation(state) {
  return state?.phase === "ending_memory"
    && state?.pendingInteraction?.type === "ending_memory"
    && state?.pendingInteraction?.memoryStep === "ending_animation";
}

function endingMusicForState(state, endingId) {
  const forcedTrack = FORCED_ENDING_TRACKS[endingId];
  if (forcedTrack) {
    return withPlaylist(forcedTrack, `ending:${endingId}`, [forcedTrack], true);
  }
  const track = endingTrackForState(state, endingId);
  return withPlaylist(track, "ending", [track], true);
}

export function endingTrackForState(state, endingId = state?.ending ?? state?.pendingEnding) {
  const forcedTrack = FORCED_ENDING_TRACKS[endingId];
  if (forcedTrack) return forcedTrack;
  const selectedTrack = ENDING_TRACKS.find((track) => track.id === state?.endingTrackId);
  if (selectedTrack) return selectedTrack;
  return pickEndingTrack(state?.seed, state?.endingTrackHistory?.playedTrackIds);
}

export function selectEndingTrackForRun(state) {
  const track = endingTrackForState(state);
  return isOrdinaryEndingTrackId(track?.id) ? track : null;
}

export function pickEndingTrack(seed, playedTrackIds = []) {
  const playedTrackIdSet = new Set(normalizeEndingTrackIds(playedTrackIds));
  const availableTracks = ENDING_TRACKS.filter((track) => !playedTrackIdSet.has(track.id));
  const trackPool = availableTracks.length > 0 ? availableTracks : ENDING_TRACKS;
  const total = trackPool.reduce((sum, track) => sum + track.weight, 0);
  let cursor = Math.abs(Number(seed) || 0) % total;
  for (const track of trackPool) {
    if (cursor < track.weight) return track;
    cursor -= track.weight;
  }
  return trackPool[0];
}

export function endingTrackHistoryAfterPlayback(playedTrackIds, trackId) {
  if (!isOrdinaryEndingTrackId(trackId)) return normalizeEndingTrackIds(playedTrackIds);
  const played = normalizeEndingTrackIds(playedTrackIds);
  const base = played.length >= ENDING_TRACKS.length ? [] : played;
  return [...new Set([...base, trackId])];
}

export function normalizeEndingTrackIds(trackIds) {
  const validTrackIds = new Set(ENDING_TRACKS.map((track) => track.id));
  return [...new Set((Array.isArray(trackIds) ? trackIds : []).filter((id) => validTrackIds.has(id)).map(String))];
}

export function isOrdinaryEndingTrackId(trackId) {
  return ENDING_TRACKS.some((track) => track.id === trackId);
}

function endingTrack(id, title, artist, weight, intro) {
  return {
    id,
    title,
    artist,
    cover: ALBUM_COVERS[id] ?? "",
    duration: TRACK_DURATIONS[id] ?? 0,
    weight,
    intro,
    kind: "结束曲",
    src: ENDING_TRACK_SOURCES[id],
    volume: volumeForTrack(id),
    lyricsSrc: `/optimized/asset-work/assets/audio/ending-tracks/${title}.lrc`,
    allowsLyrics: true,
    loop: true,
    placeholder: "毕业典礼结束曲",
  };
}

function forcedEndingTrack(id, title, artist, endingTitle) {
  return {
    id,
    title,
    artist,
    cover: ALBUM_COVERS[id] ?? "",
    duration: TRACK_DURATIONS[id] ?? 0,
    weight: 0,
    intro: `${endingTitle} 指定结束曲。`,
    kind: "结束曲",
    src: FORCED_ENDING_TRACK_SOURCES[id],
    volume: volumeForTrack(id),
    lyricsSrc: "",
    allowsLyrics: false,
    loop: true,
    placeholder: "指定失败结局结束曲",
  };
}

function withPlaylist(track, playlistId, playlist, locked = false) {
  return {
    ...track,
    playlistId,
    playlist,
    locked,
    lockedReason: locked ? (track.kind === "结束曲" ? "结局曲不可手动切换" : "购买音乐会员后可以手动切歌") : "",
  };
}

function canSwitchMusic(state) {
  return Boolean(activeMusicMembership(state));
}

function activeMusicMembership(state) {
  const membership = state?.shopEffects?.musicMembership;
  if (!membership) return null;
  if (Number(membership.year) !== Number(state?.year)) return null;
  const durationWeeks = Number(membership.durationWeeks) || 12;
  const purchasedWeek = Number(membership.purchasedWeek) || 0;
  return (state.week ?? 0) - purchasedWeek < durationWeeks ? membership : null;
}

function yearGroup(year, tracks) {
  return { year, tracks: tracks.map((item) => ({ ...item, kind: "学年 BGM" })) };
}

function track(id, title, artist, src, options = {}) {
  return {
    id,
    title,
    artist,
    cover: ALBUM_COVERS[id] ?? "",
    duration: TRACK_DURATIONS[id] ?? 0,
    kind: "学年 BGM",
    src,
    volume: volumeForTrack(id, options.volume),
    lyricsSrc: "",
    allowsLyrics: false,
    placeholder: "按学年曲单顺序播放",
  };
}

export function musicLibraryTracks() {
  return [
    ...YEAR_BGM.flatMap((group) => group.tracks.map((track) => ({ ...track, group: `大${group.year}学年` }))),
    ...ENDING_TRACKS.map((track) => ({ ...track, group: "普通结束曲" })),
    ...Object.values(FORCED_ENDING_TRACKS).map((track) => ({ ...track, group: "失败结局曲" })),
  ];
}

export function startupBgmTracks() {
  return YEAR_BGM.find((group) => group.year === 1)?.tracks ?? [];
}

export function forcedEndingBgmTracks() {
  return Object.values(FORCED_ENDING_TRACKS);
}

export function startupGateBgmTracks() {
  return startupBgmTracks().slice(0, 1);
}

export function deferredStartupBgmTracks() {
  return [
    ...startupBgmTracks().slice(1),
    ...forcedEndingBgmTracks(),
  ];
}

export function postStartPreloadTrackGroups() {
  return [
    ...[2, 3, 4, 5].map((year) => YEAR_BGM.find((group) => group.year === year)?.tracks ?? []),
    ENDING_TRACKS,
  ];
}

export function postStartGameBgmPreloadTrackGroups() {
  const deferredStartupTracks = deferredStartupBgmTracks();
  const yearGroups = [2, 3, 4, 5].map((year) => YEAR_BGM.find((group) => group.year === year)?.tracks ?? []);
  const [yearTwoTracks = [], ...laterYearGroups] = yearGroups;
  return [
    deferredStartupTracks,
    yearTwoTracks,
    laterYearGroups.flatMap((group) => group.slice(0, FUTURE_YEAR_INITIAL_PRELOAD_COUNT)),
    laterYearGroups.flatMap((group) => group.slice(FUTURE_YEAR_INITIAL_PRELOAD_COUNT)),
  ].filter((group) => group.length > 0);
}

function volumeForTrack(id, fallback = 1) {
  return TRACK_VOLUMES[id] ?? fallback;
}

function albumCover(number) {
  return finalAlbumCoverSource(number);
}
