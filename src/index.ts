import { getChangedFiles } from "./get-changed-files.ts";
import { getAffectedTestFiles } from "./get-affected-tests.ts";

const changedFiles = getChangedFiles("origin/main");
const testFiles = getAffectedTestFiles(changedFiles);

console.log(testFiles.join("\n"));
