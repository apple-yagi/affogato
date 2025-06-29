import { getChangedFiles } from "./get-changed-files.ts";
import { getAffectedTestFiles } from "./get-affected-tests.ts";
import { getInput, setFailed, setOutput } from "@actions/core";
import path from "node:path";

const run = async (tsconfig: string) => {
  const changedFiles = getChangedFiles(tsconfig);
  const affectedTestFiles = getAffectedTestFiles(
    changedFiles,
    path.resolve(tsconfig)
  );

  return affectedTestFiles;
};

(async () => {
  try {
    const tsconfig = getInput("tsconfig") || "tsconfig.json";
    const results = await run(tsconfig);

    if (results.length === 0) {
      console.log("No affected test files found.");
      return;
    }

    setOutput("affected_tests", results.join(" "));
  } catch (err) {
    if (err instanceof Error) setFailed(err.message);
  }
})();
