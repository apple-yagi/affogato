import { expect, test } from "vitest";
import { getAffectedTestFiles } from "./get-affected-tests.ts";
import { Project } from "ts-morph";
import path from "node:path";

function loadProjectFromCase(): Project {
  const casePath = path.resolve("fixtures", "tsconfig.json");
  return new Project({
    tsConfigFilePath: casePath,
  });
}

test("basic case: only test file depending on changed file is returned", () => {
  const project = loadProjectFromCase();

  const changedFiles = [path.resolve("fixtures/src/foo.ts")];

  const result = getAffectedTestFiles(changedFiles, project);

  expect(result.sort()).toStrictEqual([
    "fixtures/src/foo.test.ts",
    "fixtures/src/hoge.test.ts",
  ]);
});

test("basic case: changing unrelated file returns nothing", () => {
  const project = loadProjectFromCase();

  const changedFiles = [path.resolve("fixtures/src/bar.ts")];

  const result = getAffectedTestFiles(changedFiles, project);

  expect(result).toStrictEqual([]);
});
