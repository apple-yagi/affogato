import { getPackageJsonChangesWithWorkspace } from "./get-changed-files.js";
import { getAffectedTestFiles } from "./get-affected-tests.js";
import { getInput, setFailed, setOutput } from "@actions/core";
import path from "node:path";

const run = async (tsconfig: string, token: string) => {
  const { changedFiles, changedPackages } = await getPackageJsonChangesWithWorkspace(token, tsconfig);

  if (changedFiles.length === 0 && changedPackages.length === 0) {
    console.log("No changed files or packages found.");
    return [];
  }

  console.log("Changed files:", changedFiles);
  if (changedPackages.length > 0) {
    console.log("Changed packages:", changedPackages);
  }
  console.log("Using tsconfig:", path.resolve(tsconfig));

  const affectedTestFiles = getAffectedTestFiles(
    changedFiles,
    path.resolve(tsconfig),
    changedPackages
  );

  console.log("Affected test files:", affectedTestFiles);

  return affectedTestFiles;
};;

(async () => {
  try {
    const tsconfig = getInput("tsconfig");
    const token = getInput("token", { required: true });
    const results = await run(tsconfig, token);

    if (results.length === 0) {
      console.log("No affected test files found.");
      return;
    }

    setOutput("affected_tests", results.join(" "));
  } catch (err) {
    if (err instanceof Error) setFailed(err.message);
  }
})();
