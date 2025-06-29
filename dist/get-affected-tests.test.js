import { test } from "node:test";
import assert from "node:assert/strict";
import { getAffectedTestFiles } from "./get-affected-tests.js";
import { Project } from "ts-morph";
import path from "node:path";
function loadProjectFromCase() {
    const casePath = path.resolve("fixtures", "tsconfig.json");
    return new Project({
        tsConfigFilePath: casePath,
    });
}
test("basic case: only test file depending on changed file is returned", () => {
    const project = loadProjectFromCase();
    const changedFiles = [path.resolve("fixtures/src/foo.ts")];
    const result = getAffectedTestFiles(changedFiles, project);
    assert.deepEqual(result.sort(), [
        path.resolve("fixtures/src/foo.test.ts"),
        path.resolve("fixtures/src/hoge.test.ts"),
    ]);
});
test("basic case: changing unrelated file returns nothing", () => {
    const project = loadProjectFromCase();
    const changedFiles = [path.resolve("fixtures/src/bar.ts")];
    const result = getAffectedTestFiles(changedFiles, project);
    assert.deepEqual(result, []);
});
//# sourceMappingURL=get-affected-tests.test.js.map