import { execSync } from "node:child_process";
import { context } from "@actions/github";

export async function getChangedFiles(token: string): Promise<string[]> {
  const baseSHA = context.payload.pull_request?.base.sha;
  const headSHA = context.payload.pull_request?.head.sha;
  const repo = context.repo;

  // GitHub Compare API
  const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/compare/${baseSHA}...${headSHA}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  const data = await response.json();
  const mergeBaseSHA = data.merge_base_commit?.sha;

  if (!mergeBaseSHA || mergeBaseSHA === "null") {
    throw new Error("Could not retrieve merge base commit SHA.");
  }

  // git fetch the merge base
  execSync(`git fetch --depth=1 origin ${mergeBaseSHA} ${headSHA}`, {
    stdio: "inherit",
  });

  // Get the list of changed files between the merge base and head commit
  const changedFiles = execSync(
    `git diff --name-only ${mergeBaseSHA}..${headSHA}`,
    { encoding: "utf-8" }
  )
    .split("\n")
    .map((file) => file.trim())
    .filter((f) => /\.(ts|tsx)$/.test(f));

  return changedFiles;
}
