import { ACHIEVEMENTS, ENDINGS, RANDOM_EVENTS } from "./data.mjs";
import { endingRecordCounts, scoreForEndingAchievement } from "./ending-scoring.mjs";
import {
  endingTrackForState,
  endingTrackHistoryAfterPlayback,
  isOrdinaryEndingTrackId,
  normalizeEndingTrackIds,
} from "./music.mjs";

export const SCORE_VERSION = "score-v3";
export const COLLECTION_VERSION = "collection-v1";
const START_ACHIEVEMENT_SHOWCASE_SIZE = 12;
const INITIAL_START_ACHIEVEMENT_SHOWCASE_IDS = [
  "design_thinking",
  "first_review",
  "ending_collection_20",
  "wanli_five_cities",
  "university_graduation",
  "achievement_collection_25",
  "ending_collection_all",
  "portfolio_top",
  "portfolio_perfect",
  "first_bucket_of_gold",
  "ending_collection_10",
  "brave_one",
];

const DB_NAME = "twenty-fifth-hour";
const DB_VERSION = 1;
const STORE_NAME = "collection";
const COLLECTION_KEY = "global";
const HISTORICAL_EVENT_IDS = new Set(RANDOM_EVENTS.filter((event) => event.pool !== "model").map((event) => event.id));
const LEGACY_ENDING_ID_ALIASES = {
  elite_postgrad: "elite_recommendation_postgrad",
};

export function createEmptyCollection() {
  return normalizeCollection(null);
}

export async function loadCollection() {
  if (typeof indexedDB === "undefined") {
    return createEmptyCollection();
  }
  const db = await openCollectionDb();
  const stored = await requestToPromise(db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(COLLECTION_KEY));
  db.close();
  return normalizeCollection(stored);
}

export async function saveCollection(collection) {
  if (typeof indexedDB === "undefined") {
    return { ok: false, reason: "indexeddb_unavailable" };
  }
  const db = await openCollectionDb();
  const normalized = normalizeCollection(collection);
  await requestToPromise(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(normalized));
  db.close();
  return { ok: true };
}

export function hydrateStateFromCollection(state, collection) {
  if (!state) return state;
  const normalized = normalizeCollection(collection);
  state.achievementTally ??= {};
  state.achievementTally.historicalAchievementIds = normalized.unlockedAchievementIds;
  state.achievementTally.historicalActionTally = { ...normalized.actionTally };
  state.achievementTally.historicalShopPurchaseCounts = { ...normalized.shopPurchaseCounts };
  state.achievementTally.historicalCompetitionAwardCount = normalized.competitionAwardCount;
  state.achievementTally.historicalCoffeeSupportClicks = normalized.coffeeSupportClicks;
  state.achievementTally.historicalEndingCounts = collectionEndingCounts(normalized);
  state.historicalSeenEventIds = unique([
    ...(Array.isArray(state.historicalSeenEventIds) ? state.historicalSeenEventIds : []),
    ...normalized.seenEventIds,
  ]).filter((id) => HISTORICAL_EVENT_IDS.has(id));
  state.endingTrackHistory = {
    playedTrackIds: [...normalized.playedEndingTrackIds],
  };
  state.achievementTally.endingIds = unique([
    ...normalized.unlockedEndingIds,
    ...(Array.isArray(state.achievementTally.endingIds) ? state.achievementTally.endingIds : []),
  ]);
  state.achievementTally.characterIds = unique([
    ...normalized.characterIds,
    ...(Array.isArray(state.achievementTally.characterIds) ? state.achievementTally.characterIds : []),
  ]);
  state.achievementTally.mentorIds = unique([
    ...normalized.mentorIds,
    ...(Array.isArray(state.achievementTally.mentorIds) ? state.achievementTally.mentorIds : []),
  ]);
  return state;
}

export function commitRunToCollection(collection, state) {
  const next = normalizeCollection(collection);
  if (!state?.ending) {
    return { collection: next, changed: false };
  }

  const runId = ensureRunId(state);
  if (next.committedRunIds.includes(runId)) {
    return { collection: next, changed: false };
  }

  let changed = false;

  for (const achievementId of state.unlockedAchievements ?? []) {
    if (!ACHIEVEMENTS[achievementId] || next.unlockedAchievementIds.includes(achievementId)) continue;
    const score = ACHIEVEMENTS[achievementId].score ?? 0;
    next.unlockedAchievementIds.push(achievementId);
    next.showcasedAchievementIds = applyAchievementToShowcase(
      next.showcasedAchievementIds,
      achievementId,
      next.unlockedAchievementIds,
    );
    next.achievementRecords.push({
      achievementId,
      runId,
      scoreAwarded: score,
      unlockedAt: new Date().toISOString(),
    });
    next.achievementScore += score;
    changed = true;
  }

  const endingId = normalizeEndingId(state.ending);
  if (ENDINGS[endingId]) {
    const alreadyUnlocked = next.unlockedEndingIds.includes(endingId);
    const priorCount = Math.max(
      endingRecordCounts(next.endingRecords)[endingId] ?? 0,
      alreadyUnlocked ? 1 : 0,
    );
    const scoreAwarded = scoreForEndingAchievement({
      firstScore: ENDINGS[endingId].score ?? 0,
      priorCount,
    });
    if (!alreadyUnlocked) {
      next.unlockedEndingIds.push(endingId);
      next.endingScore += scoreAwarded;
    } else if (scoreAwarded > 0) {
      next.endingRepeatScore += scoreAwarded;
    }
    next.endingRecords.push({
      endingId,
      runId,
      scoreAwarded,
      finishedAt: new Date().toISOString(),
    });
    recordEndingTrackPlayback(next, state, endingId);
    changed = true;
  }

  mergeCounts(next.actionTally, state.actionTally);
  mergeShopPurchaseCounts(next.shopPurchaseCounts, state.achievementTally?.shopPurchases);
  next.seenEventIds = historicalSeenEventIdsForRun(next, state);
  next.competitionAwardCount += Math.max(0, Number(state.competitionAwardCount) || 0);
  next.coffeeSupportClicks += Math.max(0, Number(state.achievementTally?.coffeeSupportClicks) || 0);
  next.hasSeenEndingMemory = next.hasSeenEndingMemory || Boolean(state.endingMemoryWatched);
  next.latestProfile = normalizeLatestProfile(state.profile);
  next.characterIds = unique([...(next.characterIds ?? []), ...(state.achievementTally?.characterIds ?? [])]);
  next.mentorIds = unique([...(next.mentorIds ?? []), ...(state.achievementTally?.mentorIds ?? [])]);
  next.committedRunIds.push(runId);
  next.totalScore = collectionTotalScore(next);
  next.updatedAt = new Date().toISOString();

  return { collection: next, changed: true };
}

export function recordCollectionCoffeeSupportClick(collection) {
  const next = normalizeCollection(collection);
  next.coffeeSupportClicks += 1;
  let unlockedAchievementId = "";
  if (next.coffeeSupportClicks >= 1) {
    const unlocked = unlockCollectionAchievement(next, "honorary_shareholder", "coffee-support");
    unlockedAchievementId = unlocked ? "honorary_shareholder" : "";
  }
  next.totalScore = collectionTotalScore(next);
  next.updatedAt = new Date().toISOString();
  return { collection: next, changed: true, unlockedAchievementId };
}

export function collectionHasSubmittedEndingScore(collection) {
  return hasSubmittedEndingScore(normalizeCollection(collection));
}

export function latestProfileForNewGame(collection) {
  const latestProfile = normalizeCollection(collection).latestProfile;
  if (!latestProfile.nickname || !latestProfile.universityName) return null;
  return latestProfile;
}

export function updateCollectionLatestProfile(collection, profile) {
  const next = normalizeCollection(collection);
  const latestProfile = normalizeLatestProfile(profile);
  if (!latestProfile.nickname || !latestProfile.universityName) {
    return { collection: next, changed: false };
  }
  const changed = next.latestProfile.nickname !== latestProfile.nickname
    || next.latestProfile.universityName !== latestProfile.universityName;
  next.latestProfile = latestProfile;
  if (changed) next.updatedAt = new Date().toISOString();
  return { collection: next, changed };
}

export function collectionViewModel(collection) {
  const normalized = normalizeCollection(collection);
  return {
    leaderboard: {
      topRows: [],
      selfRow: null,
    },
    achievements: {
      score: normalized.achievementScore,
      endingScore: normalized.endingScore,
      endingRepeatScore: normalized.endingRepeatScore,
      leaderboardScore: normalized.totalScore,
      unlockedCount: normalized.unlockedAchievementIds.length,
      totalCount: Object.keys(ACHIEVEMENTS).length,
      endingIds: normalized.unlockedEndingIds,
      endingCounts: collectionEndingCounts(normalized),
      showcaseItems: normalized.showcasedAchievementIds.map((id) => ({
        id,
        title: ACHIEVEMENTS[id].title,
        body: ACHIEVEMENTS[id].body,
        conditionText: ACHIEVEMENTS[id].conditionText,
        score: ACHIEVEMENTS[id].score,
        unlocked: normalized.unlockedAchievementIds.includes(id),
      })),
      items: Object.entries(ACHIEVEMENTS).map(([id, achievement]) => ({
        id,
        title: achievement.title,
        body: achievement.body,
        conditionText: achievement.conditionText,
        score: achievement.score,
        unlocked: normalized.unlockedAchievementIds.includes(id),
      })),
    },
  };
}

export function normalizeCollection(raw) {
  const collection = raw && typeof raw === "object" ? raw : {};
  const endingRecords = normalizeEndingRecords(collection.endingRecords);
  const unlockedEndingIds = normalizeEndingIds([
    ...(Array.isArray(collection.unlockedEndingIds) ? collection.unlockedEndingIds : []),
    ...endingRecords.map((record) => record.endingId),
  ]);
  const endingScoreState = scoreEndingRecords(endingRecords, unlockedEndingIds);
  const normalized = {
    id: COLLECTION_KEY,
    collectionVersion: COLLECTION_VERSION,
    scoreVersion: SCORE_VERSION,
    latestProfile: normalizeLatestProfile(collection.latestProfile),
    unlockedAchievementIds: unique(collection.unlockedAchievementIds),
    achievementRecords: Array.isArray(collection.achievementRecords) ? collection.achievementRecords : [],
    unlockedEndingIds,
    endingRecords: endingScoreState.records,
    achievementScore: finiteNumber(collection.achievementScore),
    endingScore: endingScoreState.endingScore,
    endingRepeatScore: endingScoreState.endingRepeatScore,
    totalScore: finiteNumber(collection.totalScore),
    actionTally: normalizeCounts(collection.actionTally),
    shopPurchaseCounts: normalizeCounts(collection.shopPurchaseCounts),
    competitionAwardCount: finiteNumber(collection.competitionAwardCount),
    coffeeSupportClicks: finiteNumber(collection.coffeeSupportClicks),
    hasSeenEndingMemory: Boolean(collection.hasSeenEndingMemory),
    playedEndingTrackIds: normalizeEndingTrackIds(collection.playedEndingTrackIds),
    seenEventIds: normalizeHistoricalEventIds(collection.seenEventIds),
    characterIds: unique(collection.characterIds),
    mentorIds: unique(collection.mentorIds),
    committedRunIds: unique(collection.committedRunIds),
    updatedAt: collection.updatedAt ?? null,
  };
  normalized.showcasedAchievementIds = normalizeShowcasedAchievementIds(
    collection.showcasedAchievementIds,
    normalized.unlockedAchievementIds,
    normalized.achievementRecords,
  );
  normalized.totalScore = collectionTotalScore(normalized);
  return normalized;
}

function openCollectionDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function ensureRunId(state) {
  if (state.runId) return state.runId;
  state.runId = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return state.runId;
}

function collectionTotalScore(collection) {
  return Math.max(0, Math.round(
    finiteNumber(collection.achievementScore)
    + finiteNumber(collection.endingScore)
    + finiteNumber(collection.endingRepeatScore),
  ));
}

function hasSubmittedEndingScore(collection) {
  return (collection?.endingRecords ?? []).length > 0
    || (collection?.unlockedEndingIds ?? []).length > 0;
}

function collectionEndingCounts(collection) {
  const counts = endingRecordCounts(collection?.endingRecords);
  for (const endingId of collection?.unlockedEndingIds ?? []) {
    counts[endingId] = Math.max(counts[endingId] ?? 0, 1);
  }
  return counts;
}

function recordEndingTrackPlayback(collection, state, endingId) {
  const selectedTrack = endingTrackForState({
    ...state,
    endingTrackHistory: { playedTrackIds: collection.playedEndingTrackIds },
  }, endingId);
  if (!isOrdinaryEndingTrackId(selectedTrack?.id)) return;
  state.endingTrackId = selectedTrack.id;
  collection.playedEndingTrackIds = endingTrackHistoryAfterPlayback(collection.playedEndingTrackIds, selectedTrack.id);
}

function scoreEndingRecords(records, unlockedEndingIds) {
  const counts = {};
  let endingScore = 0;
  let endingRepeatScore = 0;
  const rescoredRecords = records.map((record) => {
    const endingId = record.endingId;
    const priorCount = counts[endingId] ?? 0;
    const scoreAwarded = scoreForEndingAchievement({
      firstScore: ENDINGS[endingId]?.score ?? 0,
      priorCount,
    });
    counts[endingId] = priorCount + 1;
    if (priorCount === 0) {
      endingScore += scoreAwarded;
    } else {
      endingRepeatScore += scoreAwarded;
    }
    return { ...record, scoreAwarded };
  });

  for (const endingId of unlockedEndingIds) {
    if (counts[endingId]) continue;
    endingScore += ENDINGS[endingId]?.score ?? 0;
    counts[endingId] = 1;
  }

  return { records: rescoredRecords, endingScore, endingRepeatScore };
}

function mergeCounts(target, source) {
  for (const [key, value] of Object.entries(source ?? {})) {
    const count = Math.max(0, Number(value) || 0);
    if (count > 0) target[key] = (target[key] ?? 0) + count;
  }
}

function mergeShopPurchaseCounts(target, purchases) {
  for (const purchase of purchases ?? []) {
    const id = purchase?.id;
    if (!id) continue;
    target[id] = (target[id] ?? 0) + 1;
  }
}

function normalizeEndingId(endingId) {
  return LEGACY_ENDING_ID_ALIASES[endingId] ?? endingId;
}

function normalizeEndingIds(endingIds) {
  return unique(Array.isArray(endingIds) ? endingIds.map(normalizeEndingId).filter((endingId) => ENDINGS[endingId]) : []);
}

function normalizeEndingRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map((record) => ({
    ...record,
    endingId: normalizeEndingId(record?.endingId),
  }));
}

function unlockCollectionAchievement(collection, achievementId, runId) {
  if (!ACHIEVEMENTS[achievementId] || collection.unlockedAchievementIds.includes(achievementId)) return false;
  const score = ACHIEVEMENTS[achievementId].score ?? 0;
  collection.unlockedAchievementIds.push(achievementId);
  collection.showcasedAchievementIds = applyAchievementToShowcase(
    collection.showcasedAchievementIds,
    achievementId,
    collection.unlockedAchievementIds,
  );
  collection.achievementRecords.push({
    achievementId,
    runId,
    scoreAwarded: score,
    unlockedAt: new Date().toISOString(),
  });
  collection.achievementScore += score;
  return true;
}

function normalizeShowcasedAchievementIds(raw, unlockedAchievementIds, achievementRecords = []) {
  const hasStoredShowcase = Array.isArray(raw) && raw.some((id) => ACHIEVEMENTS[id]);
  let ids = padAchievementShowcase(hasStoredShowcase ? raw : INITIAL_START_ACHIEVEMENT_SHOWCASE_IDS);
  if (hasStoredShowcase) return orderShowcase(ids, new Set(unlockedAchievementIds));

  const appliedIds = new Set();
  for (const record of achievementRecords) {
    const achievementId = record?.achievementId;
    if (!unlockedAchievementIds.includes(achievementId) || appliedIds.has(achievementId)) continue;
    ids = applyAchievementToShowcase(ids, achievementId, unlockedAchievementIds);
    appliedIds.add(achievementId);
  }
  for (const achievementId of unlockedAchievementIds) {
    if (appliedIds.has(achievementId)) continue;
    ids = applyAchievementToShowcase(ids, achievementId, unlockedAchievementIds);
  }
  return ids;
}

function applyAchievementToShowcase(showcaseIds, achievementId, unlockedAchievementIds) {
  if (!ACHIEVEMENTS[achievementId]) return padAchievementShowcase(showcaseIds);

  const unlocked = new Set(unlockedAchievementIds);
  const ids = padAchievementShowcase(showcaseIds);
  if (!ids.includes(achievementId)) {
    const isFullOfUnlockedAchievements = ids.every((id) => unlocked.has(id));
    if (isFullOfUnlockedAchievements) return ids;

    const replaceIndex = ids.findIndex((id) => !unlocked.has(id));
    if (replaceIndex >= 0) ids[replaceIndex] = achievementId;
  }

  return orderShowcase(ids, unlocked);
}

function orderShowcase(showcaseIds, unlockedAchievementIds) {
  const ids = padAchievementShowcase(showcaseIds);
  return [
    ...ids.filter((id) => unlockedAchievementIds.has(id)),
    ...ids.filter((id) => !unlockedAchievementIds.has(id)),
  ].slice(0, START_ACHIEVEMENT_SHOWCASE_SIZE);
}

function padAchievementShowcase(showcaseIds) {
  const ids = unique(showcaseIds).filter((id) => ACHIEVEMENTS[id]).slice(0, START_ACHIEVEMENT_SHOWCASE_SIZE);
  for (const achievementId of INITIAL_START_ACHIEVEMENT_SHOWCASE_IDS) {
    if (ids.length >= START_ACHIEVEMENT_SHOWCASE_SIZE) break;
    if (!ids.includes(achievementId) && ACHIEVEMENTS[achievementId]) ids.push(achievementId);
  }
  for (const achievementId of Object.keys(ACHIEVEMENTS)) {
    if (ids.length >= START_ACHIEVEMENT_SHOWCASE_SIZE) break;
    if (!ids.includes(achievementId)) ids.push(achievementId);
  }
  return ids;
}

function normalizeCounts(raw) {
  return Object.fromEntries(
    Object.entries(raw ?? {})
      .map(([key, value]) => [key, Math.max(0, Number(value) || 0)])
      .filter(([, value]) => value > 0),
  );
}

function normalizeHistoricalEventIds(ids) {
  return unique(Array.isArray(ids) ? ids : []).filter((id) => HISTORICAL_EVENT_IDS.has(id));
}

function historicalSeenEventIdsForRun(collection, state) {
  const baseIds = Array.isArray(state?.historicalSeenEventIds)
    ? state.historicalSeenEventIds
    : collection.seenEventIds;
  const ids = new Set(normalizeHistoricalEventIds(baseIds));
  for (const entry of state?.eventHistory ?? []) {
    const id = typeof entry === "string" ? entry : entry?.id ?? entry?.eventId;
    if (HISTORICAL_EVENT_IDS.has(id)) ids.add(id);
  }
  return [...ids].sort();
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function normalizeLatestProfile(raw) {
  const profile = raw && typeof raw === "object" ? raw : {};
  return {
    nickname: String(profile.nickname ?? "").trim(),
    universityName: String(profile.universityName ?? "").trim(),
  };
}

function unique(list) {
  return [...new Set((Array.isArray(list) ? list : []).filter(Boolean).map(String))];
}
