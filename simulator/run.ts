import { aggregate, runBatch, runSimulation, summarize } from "./simulate.ts";
import type { RouteTargetId, StrategyId } from "./types.ts";

const args = parseArgs(process.argv.slice(2));
const strategy = (args.strategy ?? "normal") as StrategyId;
const seed = Number(args.seed ?? 25);
const count = args.count === undefined ? undefined : Number(args.count);
const verbose = args.verbose === "true" || args.verbose === "1";
const events = args.events === "true" || args.events === "1";
const routeTarget = args.routeTarget as RouteTargetId | undefined;

if (count !== undefined && Number.isFinite(count) && count > 0) {
  const results = runBatch(strategy, count, seed, events, routeTarget);
  console.log(JSON.stringify(aggregate(results), null, 2));
} else {
  const state = runSimulation({ seed, strategy, verbose, events, routeTarget });
  console.log(JSON.stringify(summarize(state), null, 2));
  if (verbose) {
    console.log(JSON.stringify(state.logs, null, 2));
  }
}

function parseArgs(argv: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}
