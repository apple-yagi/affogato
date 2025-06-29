import { getChangedFiles } from "./get-changed-files.ts";
import { getAffectedTestFiles } from "./get-affected-tests.ts";
import { getInput, setFailed, setOutput } from "@actions/core";
import path from "node:path";

const run = async (tsconfig: string, token: string) => {
  const changedFiles = await getChangedFiles(token);

  if (changedFiles.length === 0) {
    console.log("No changed files found.");
    return [];
  }

  console.log("Changed files:", changedFiles);
  console.log("Using tsconfig:", path.resolve(tsconfig));

  const affectedTestFiles = getAffectedTestFiles(
    changedFiles,
    path.resolve(tsconfig)
  );

  console.log("Affected test files:", affectedTestFiles);

  return affectedTestFiles;
};

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
