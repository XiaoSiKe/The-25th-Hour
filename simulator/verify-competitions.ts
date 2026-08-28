import { runBatch, runSimulation, summarize } from "./simulate.ts";

let failures = 0;

const first = summarize(runSimulation({ seed: 25, strategy: "normal", events: true }));
const second = summarize(runSimulation({ seed: 25, strategy: "normal", events: true }));

check("same seed reproduces competition submissions", first.competitionSubmissionCount === second.competitionSubmissionCount, {
  first,
  second,
});
check("same seed reproduces competition awards", sameAwards(first.competitionAwards, second.competitionAwards), {
  first,
  second,
});
check("submissions partition into shortlist and rejection", first.competitionSubmissionCount === first.competitionShortlistCount + first.competitionRejectionCount, first);
check("awards require shortlist", first.competitionAwardCount <= first.competitionShortlistCount, first);
check("competition records expose content ids", first.competitionResults.every((record) => record.competitionId && record.competitionName), first);
check("same run does not resubmit the same competition", new Set(first.competitionResults.map((record) => record.competitionId)).size === first.competitionResults.length, first);

const normalBatch = runBatch("normal", 50, 1, true);
const hasSubmissions = normalBatch.some((run) => run.competitionSubmissionCount > 0);
const hasRejections = normalBatch.some((run) => run.competitionRejectionCount > 0);
const hasAwards = normalBatch.some((run) => run.competitionAwardCount > 0);
const hasNamedCompetitions = normalBatch.some((run) => run.competitionResults.length > 0);
const partitioned = normalBatch.every((run) => run.competitionSubmissionCount === run.competitionShortlistCount + run.competitionRejectionCount);
check("normal batch can submit competitions", hasSubmissions, normalBatch);
check("normal batch includes non-awarded submissions", hasRejections, normalBatch);
check("normal batch can still win awards", hasAwards, normalBatch);
check("normal batch records named competitions", hasNamedCompetitions, normalBatch);
check("normal batch partitions submissions", partitioned, normalBatch);

const earlyFailure = summarize(runSimulation({ seed: 31, strategy: "bankrupt", events: true }));
check("early failure has no competition submissions", earlyFailure.competitionSubmissionCount === 0, earlyFailure);

if (failures > 0) {
  process.exitCode = 1;
}

function check(name: string, condition: boolean, detail: unknown): void {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}`);
  if (!condition) {
    console.log(JSON.stringify(detail, null, 2));
    failures += 1;
  }
}

function sameAwards(first: Record<string, number>, second: Record<string, number>): boolean {
  return Object.keys(first).every((key) => first[key] === second[key]);
}
