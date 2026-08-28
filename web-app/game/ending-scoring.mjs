export const ENDING_REPEAT_SCORE = 50;
export const ENDING_REPEAT_SCORE_LIMIT = 2;

export function endingRecordCounts(records = []) {
  const counts = {};
  for (const record of records) {
    const endingId = record?.endingId;
    if (!endingId) continue;
    counts[endingId] = (counts[endingId] ?? 0) + 1;
  }
  return counts;
}

export function scoreForEndingAchievement({ firstScore = 0, priorCount = 0 } = {}) {
  const count = Math.max(0, Math.floor(Number(priorCount) || 0));
  if (count === 0) {
    return Math.max(0, Math.round(Number(firstScore) || 0));
  }
  return count <= ENDING_REPEAT_SCORE_LIMIT ? ENDING_REPEAT_SCORE : 0;
}
