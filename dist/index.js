import { getChangedFiles } from "./get-changed-files.js";
import { getAffectedTestFiles } from "./get-affected-tests.js";
const changedFiles = getChangedFiles("origin/main");
const testFiles = getAffectedTestFiles(changedFiles);
console.log(testFiles.join("\n"));
//# sourceMappingURL=index.js.map