import { getPackageJsonChangesWithWorkspace } from "./get-changed-files.js";
import { getAffectedTestFiles } from "./get-affected-tests.js";
import { getRunAllTestsPackages } from "./config.js";
import { getInput, setFailed, setOutput } from "@actions/core";
import path from "node:path";

const run = async (
  tsconfig: string,
  token: string,
  runAllTestsPackages: string,
  runAllTestsConfig: string
) => {
  const { changedFiles, changedPackages } =
    await getPackageJsonChangesWithWorkspace(token, tsconfig);

  if (changedFiles.length === 0 && changedPackages.length === 0) {
    console.log("No changed files or packages found.");
    return {
      affectedTests: [],
      shouldRunAllTests: false,
    };
  }

  console.log("Changed files:", changedFiles);
  if (changedPackages.length > 0) {
    console.log("Changed packages:", changedPackages);
  }
  console.log("Using tsconfig:", path.resolve(tsconfig));

  // Get packages that should trigger running all tests
  const allTestsPackages = getRunAllTestsPackages(
    runAllTestsPackages,
    runAllTestsConfig
  );
  if (allTestsPackages.length > 0) {
    console.log("Packages configured to run all tests:", allTestsPackages);
  }

  const result = getAffectedTestFiles(
    changedFiles,
    path.resolve(tsconfig),
    changedPackages,
    allTestsPackages
  );

  console.log("Affected test files:", result.affectedTests);
  console.log("Should run all tests:", result.shouldRunAllTests);

  return result;
};

(async () => {
  try {
    const tsconfig = getInput("tsconfig");
    const token = getInput("token", { required: true });
    const runAllTestsPackages = getInput("run_all_tests_packages");
    const runAllTestsConfig = getInput("run_all_tests_config");

    const results = await run(
      tsconfig,
      token,
      runAllTestsPackages,
      runAllTestsConfig
    );

    // Set the run_all_tests flag
    setOutput("run_all_tests", results.shouldRunAllTests.toString());

    if (results.shouldRunAllTests) {
      console.log("All tests should be run due to package changes.");
      setOutput("affected_tests", "");
    } else if (results.affectedTests.length === 0) {
      console.log("No affected test files found.");
      setOutput("affected_tests", "");
    } else {
      setOutput("affected_tests", results.affectedTests.join(" "));
    }
  } catch (err) {
    if (err instanceof Error) setFailed(err.message);
  }
})();
