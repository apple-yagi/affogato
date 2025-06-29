import { execSync } from "node:child_process";

export function getChangedFiles(baseRef = "origin/main"): string[] {
  const diffOutput = execSync(`git diff --name-only ${baseRef}`, {
    encoding: "utf-8",
  });

  return diffOutput
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => /\.(ts|tsx)$/.test(f));
}
