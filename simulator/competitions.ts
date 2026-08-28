import { COMPETITION_APPLICATION, COMPETITION_AWARD_TIERS, COMPETITION_POOL } from "./balance.ts";
import { randomInt } from "./rng.ts";
import { applyDelta } from "./resolver.ts";
import type { CompetitionAward, CompetitionId, GameState } from "./types.ts";

export function maybeRecordCompetitionAfterReview(state: GameState): void {
  const latest = state.reviews[state.reviews.length - 1];
  if (
    !latest ||
    latest.finalGrade === "F" ||
    state.semesterIndex > COMPETITION_APPLICATION.latestSemesterMax
  ) {
    return;
  }

  const competition = chooseCompetitionForSubmission(state);
  if (!competition) {
    return;
  }

  const performance = competitionPerformance(
    latest.portfolioAdded,
    state.attributes.design,
    state.attributes.aesthetic,
    competition.portfolioAdded,
    competition.design,
    competition.aesthetic,
  );
  const chance = competitionShortlistChance(performance, competition.shortlistChanceModifier);
  const [rngState, roll] = randomInt(state.rngState, 1, 100);
  state.rngState = rngState;
  const shortlisted = roll <= chance;
  const award = shortlisted ? competitionAwardFromPerformance(performance) : "none";
  const prizeMoney = Math.round(COMPETITION_AWARD_TIERS[award].prizeMoney * competition.prizeMoneyMultiplier);

  state.competitionSubmittedIds.push(competition.id);
  state.competitionRecords.push({
    competitionId: competition.id,
    competitionName: competition.name,
    semesterIndex: latest.semesterIndex,
    year: latest.year,
    term: latest.term,
    reviewGrade: latest.finalGrade,
    portfolioAdded: latest.portfolioAdded,
    performance,
    shortlistChance: chance,
    shortlistRoll: roll,
    shortlisted,
    award,
    prizeMoney,
  });
  state.competitionAwardCount += award === "none" ? 0 : 1;
  applyDelta(state, "competition_submission", `${competition.name} ${award} recorded`, {
    money: prizeMoney,
  }, "semester_settlement");
}

function chooseCompetitionForSubmission(state: GameState): (typeof COMPETITION_POOL)[CompetitionId] | undefined {
  const latest = state.reviews[state.reviews.length - 1];
  if (!latest) {
    return undefined;
  }

  return Object.values(COMPETITION_POOL).find((competition) => {
    return (
      !state.competitionSubmittedIds.includes(competition.id) &&
      state.semesterIndex >= competition.semesterMin &&
      state.semesterIndex <= competition.semesterMax &&
      latest.portfolioAdded >= competition.portfolioAdded &&
      state.attributes.design >= competition.design &&
      state.attributes.aesthetic >= competition.aesthetic &&
      state.attributes.presentation >= (competition.presentation ?? 0)
    );
  });
}

function competitionPerformance(
  portfolioAdded: number,
  design: number,
  aesthetic: number,
  portfolioThreshold: number,
  designThreshold: number,
  aestheticThreshold: number,
): number {
  const portfolioBonus = Math.max(0, portfolioAdded - portfolioThreshold);
  const designBonus = Math.max(0, design - designThreshold);
  const aestheticBonus = Math.max(0, aesthetic - aestheticThreshold);
  return Math.min(99, Math.floor(portfolioBonus * 0.9 + designBonus * 1.1 + aestheticBonus * 1.1));
}

function competitionShortlistChance(performance: number, modifier: number): number {
  return Math.max(
    5,
    Math.min(
    COMPETITION_APPLICATION.maxShortlistChance,
      Math.round(
        COMPETITION_APPLICATION.baseShortlistChance +
          modifier +
          performance / COMPETITION_APPLICATION.performanceDivisor,
      ),
    ),
  );
}

function competitionAwardFromPerformance(performance: number): CompetitionAward {
  if (performance >= COMPETITION_AWARD_TIERS.first.minPerformance) return "first";
  if (performance >= COMPETITION_AWARD_TIERS.second.minPerformance) return "second";
  return "third";
}
