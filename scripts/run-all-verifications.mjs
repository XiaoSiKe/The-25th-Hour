import { spawnSync } from "node:child_process";

const scripts = [
  "test:runtime-assets",
  "web:verify-flow",
  "sim:verify",
  "sim:verify:routes",
  "sim:verify:route-targets",
  "sim:verify:events",
  "sim:verify:competitions",
  "sim:verify:internships",
  "sim:verify:internship-value",
  "sim:verify:entrepreneurship",
];

for (const script of scripts) {
  console.log(`\n> npm run ${script}`);
  const result = spawnSync("npm", ["run", script], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
