import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { context } from "@actions/github";

export async function getChangedFilesWithPackages(
  token: string
): Promise<{ changedPackages: string[]; changedFiles: string[] }> {
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

  // Fallback if merge base is unavailable
  if (!mergeBaseSHA || mergeBaseSHA === "null") {
    console.warn("⚠️ Could not retrieve merge base. Falling back to HEAD^");
    mergeBaseSHA = execFileSync("git", ["rev-parse", "HEAD^"], {
      encoding: "utf-8",
    }).trim();
  }

  if (!mergeBaseSHA || !headSHA) {
    throw new Error("Could not determine base or head commit SHA.");
  }

  // Fetch commits
  execFileSync("git", ["fetch", "--depth=1", "origin", mergeBaseSHA, headSHA], {
    stdio: "inherit",
  });

  // Get all changed files
  const diffOutput = execFileSync(
    "git",
    ["diff", "--name-only", `${mergeBaseSHA}..${headSHA}`],
    { encoding: "utf-8" }
  );

  const allChangedFiles = diffOutput
    .split("\n")
    .map((file) => file.trim())
    .filter((f) => f.length > 0);

  // Filter TypeScript files
  const changedFiles = allChangedFiles.filter((f) => /\.(ts|tsx)$/.test(f));

  // Filter package.json files
  const packageJsonFiles = allChangedFiles.filter((f) =>
    f.endsWith("package.json")
  );

  if (packageJsonFiles.length === 0) {
    return { changedPackages: [], changedFiles };
  }

  // Analyze package.json changes to detect library version changes
  const changedPackages: string[] = [];

  for (const packageFile of packageJsonFiles) {
    try {
      // Get diff for this specific package.json
      const packageDiff = execFileSync(
        "git",
        ["diff", `${mergeBaseSHA}..${headSHA}`, packageFile],
        { encoding: "utf-8" }
      );

      // Parse the diff to find changed dependencies
      const changedDeps = parsePackageJsonDiff(packageDiff);
      changedPackages.push(...changedDeps);
    } catch (error) {
      console.warn(`Failed to analyze ${packageFile}:`, error);
    }
  }

  return {
    changedPackages: [...new Set(changedPackages)],
    changedFiles,
  };
}

function parsePackageJsonDiff(diff: string): string[] {
  const changedPackages: string[] = [];
  const lines = diff.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Look for lines that show dependency changes
    // Example: -    "react": "^17.0.0"
    //          +    "react": "^18.0.0"
    if (line.startsWith("-") || line.startsWith("+")) {
      const match = line.match(/[+-]\s*"([^"]+)":\s*"[^"]+"/);
      if (match && match[1]) {
        const packageName = match[1];
        // Only include if it's in dependencies/devDependencies section
        if (isInDependenciesSection(lines, i)) {
          changedPackages.push(packageName);
        }
      }
    }
  }

  return [...new Set(changedPackages)];
}

function isInDependenciesSection(lines: string[], lineIndex: number): boolean {
  // Look backwards to find the section header
  for (let i = lineIndex; i >= 0; i--) {
    const line = lines[i];
    if (!line) continue;

    const trimmedLine = line.trim();
    if (
      trimmedLine.includes('"dependencies":') ||
      trimmedLine.includes('"devDependencies":') ||
      trimmedLine.includes('"peerDependencies":') ||
      trimmedLine.includes('"optionalDependencies":')
    ) {
      return true;
    }
    // If we hit another section or closing brace, we're not in dependencies
    if (
      trimmedLine.startsWith('"') &&
      trimmedLine.includes('":') &&
      !trimmedLine.includes("dependencies")
    ) {
      return false;
    }
  }
  return false;
}

function findWorkspaceRoot(startPath: string = process.cwd()): string | null {
  let currentPath = path.resolve(startPath);
  const root = path.parse(currentPath).root;

  while (currentPath !== root) {
    const packageJsonPath = path.join(currentPath, "package.json");

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );

        // Check if it's a workspace root
        if (packageJson.workspaces || packageJson.pnpm?.workspace) {
          return currentPath;
        }
      } catch {
        // Ignore parsing errors and continue searching
      }
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) break;
    currentPath = parentPath;
  }

  return null;
}

export async function getPackageJsonChangesWithWorkspace(
  token: string,
  tsConfigPath: string = "tsconfig.json"
): Promise<{ changedPackages: string[]; changedFiles: string[] }> {
  const result = await getChangedFilesWithPackages(token);

  // If no package changes found, check workspace root
  if (result.changedPackages.length === 0) {
    const projectRoot = path.dirname(path.resolve(tsConfigPath));
    const workspaceRoot = findWorkspaceRoot(projectRoot);

    if (workspaceRoot && workspaceRoot !== projectRoot) {
      // Check if workspace root package.json has changes
      const workspaceResult = await getWorkspaceRootChanges(
        token,
        workspaceRoot
      );
      result.changedPackages.push(...workspaceResult.changedPackages);
    }
  }

  return result;
}

async function getWorkspaceRootChanges(
  token: string,
  workspaceRoot: string
): Promise<{ changedPackages: string[] }> {
  try {
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

      if (response.ok) {
        const data = await response.json();
        mergeBaseSHA = data.merge_base_commit?.sha;
      }
    }

    // Fallback: try to use GitHub API to get parent commit
    if (!mergeBaseSHA || mergeBaseSHA === "null") {
      try {
        const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/commits/${headSHA}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github+json",
          },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.parents && data.parents.length > 0) {
            mergeBaseSHA = data.parents[0].sha;
          }
        }
      } catch (apiError) {
        console.warn(
          "Failed to get parent commit via API for workspace root:",
          apiError
        );
      }
    }

    // Final fallback: try git command only if we have more than one commit
    if (!mergeBaseSHA || mergeBaseSHA === "null") {
      try {
        // Check if we have any commits at all
        const commitCount = execFileSync(
          "git",
          ["rev-list", "--count", "HEAD"],
          {
            encoding: "utf-8",
          }
        ).trim();

        if (parseInt(commitCount) > 1) {
          mergeBaseSHA = execFileSync("git", ["rev-parse", "HEAD^"], {
            encoding: "utf-8",
          }).trim();
        } else {
          console.warn(
            "Only one commit found, skipping workspace root package analysis"
          );
          return { changedPackages: [] };
        }
      } catch (gitError) {
        console.warn("Git fallback failed for workspace root:", gitError);
        return { changedPackages: [] };
      }
    }

    if (!mergeBaseSHA || !headSHA) {
      console.warn("Could not determine comparison commits for workspace root");
      return { changedPackages: [] };
    }

    const workspacePackageJson = path.relative(
      process.cwd(),
      path.join(workspaceRoot, "package.json")
    );

    try {
      const packageDiff = execFileSync(
        "git",
        ["diff", `${mergeBaseSHA}..${headSHA}`, workspacePackageJson],
        { encoding: "utf-8" }
      );

      if (packageDiff.trim()) {
        const changedDeps = parsePackageJsonDiff(packageDiff);
        return { changedPackages: changedDeps };
      }
    } catch (diffError) {
      console.warn(
        `Failed to get diff for workspace package.json, trying alternative approach:`,
        diffError
      );

      // Alternative: check if the file exists and analyze current content
      try {
        const currentContent = execFileSync(
          "git",
          ["show", `${headSHA}:${workspacePackageJson}`],
          { encoding: "utf-8" }
        );

        const packageJson = JSON.parse(currentContent);
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
          ...packageJson.peerDependencies,
        };

        // Add all dependencies as potentially changed
        const allDepNames = Object.keys(allDeps);
        console.warn(
          `Added all ${allDepNames.length} dependencies from workspace root as potentially changed`
        );
        return { changedPackages: allDepNames };
      } catch (showError) {
        console.warn(
          `Could not analyze workspace root package.json:`,
          showError
        );
      }
    }
  } catch (error) {
    console.warn("Failed to check workspace root package.json:", error);
  }

  return { changedPackages: [] };
}
