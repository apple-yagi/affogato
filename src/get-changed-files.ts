import { execSync } from "node:child_process";
import { context } from "@actions/github";

export async function getChangedFiles(token: string): Promise<string[]> {
  const repo = context.repo;
  const isPR = !!context.payload.pull_request;
  const headSHA = context.sha;
  let baseSHA: string | undefined;
  let mergeBaseSHA: string | undefined;

  if (isPR) {
    baseSHA = context.payload.pull_request!.base.sha;

    // GitHub Compare API
    const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/compare/${baseSHA}...${headSHA}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    const data = await response.json();
    mergeBaseSHA = data.merge_base_commit?.sha;
  }

  // Fallback if merge base is unavailable (e.g., direct push)
  if (!mergeBaseSHA || mergeBaseSHA === "null") {
    console.warn("⚠️ Could not retrieve merge base. Falling back to HEAD^");
    mergeBaseSHA = execSync("git rev-parse HEAD^", {
      encoding: "utf-8",
    }).trim();
  }

  // Ensure both SHAs are available
  if (!mergeBaseSHA || !headSHA) {
    throw new Error("Could not determine base or head commit SHA.");
  }

  // Fetch both commits in case they aren't in the shallow clone
  execSync(`git fetch --depth=1 origin ${mergeBaseSHA} ${headSHA}`, {
    stdio: "inherit",
  });

  // Get changed files
  const changedFiles = execSync(
    `git diff --name-only ${mergeBaseSHA}..${headSHA}`,
    { encoding: "utf-8" }
  )
    .split("\n")
    .map((file) => file.trim())
    .filter((f) => /\.(ts|tsx)$/.test(f));

  return changedFiles;
}
