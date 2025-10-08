import { expect, test } from "vitest";
import { getAffectedTestFiles } from "./get-affected-tests.js";
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

test("basic case: multiple changed files return all affected tests", () => {
  const project = loadProjectFromCase();

  const changedFiles = [
    path.resolve("fixtures/src/foo.ts"),
    path.resolve("fixtures/src/bar.ts"),
  ];

  const result = getAffectedTestFiles(changedFiles, project);

  expect(result.sort()).toStrictEqual([
    "fixtures/src/bar.test.ts",
    "fixtures/src/foo.test.ts",
    "fixtures/src/hoge.test.ts",
  ]);
});

test("basic case: pass tsconfig path.", () => {
  const tsconfig = path.resolve("fixtures", "tsconfig.json");

  const changedFiles = [path.resolve("fixtures/src/foo.ts")];

  const result = getAffectedTestFiles(changedFiles, tsconfig);

  expect(result.sort()).toStrictEqual(["src/foo.test.ts", "src/hoge.test.ts"]);
});

test("basic case: changing unrelated file returns nothing", () => {
  const project = loadProjectFromCase();

  const changedFiles = [path.resolve("fixtures/src/no-test.ts")];

  const result = getAffectedTestFiles(changedFiles, project);

  expect(result).toStrictEqual([]);
});

test("deleted test files are filtered out from affected tests", () => {
  const project = loadProjectFromCase();

  // Include a non-existent test file in the changed files list
  const changedFiles = [
    path.resolve("fixtures/src/foo.ts"),
    path.resolve("fixtures/src/deleted.test.ts"), // This file doesn't exist
  ];

  const result = getAffectedTestFiles(changedFiles, project);

  // Should only return existing test files affected by foo.ts
  expect(result.sort()).toStrictEqual([
    "fixtures/src/foo.test.ts",
    "fixtures/src/hoge.test.ts",
  ]);
});

test("test pattern filtering: uses default test,spec patterns", () => {
  const project = loadProjectFromCase();

  const changedFiles = [path.resolve("fixtures/src/foo.ts")];

  // When no test patterns specified, should use default "test,spec"
  const result = getAffectedTestFiles(changedFiles, project);

  expect(result.sort()).toStrictEqual([
    "fixtures/src/foo.test.ts",
    "fixtures/src/hoge.test.ts",
  ]);
});

test("test pattern filtering: filters by single pattern (stories)", () => {
  const project = loadProjectFromCase();

  // Create a mock for stories files
  const changedFiles = [path.resolve("fixtures/src/foo.ts")];

  const result = getAffectedTestFiles(changedFiles, project, "stories");

  // Since we don't have .stories.ts files in fixtures, expect empty result
  expect(result).toStrictEqual([]);
});

test("test pattern filtering: filters by multiple patterns", () => {
  const project = loadProjectFromCase();

  const changedFiles = [
    path.resolve("fixtures/src/foo.ts"),
    path.resolve("fixtures/src/bar.ts"),
  ];

  // Should find files matching test or spec pattern
  const result = getAffectedTestFiles(
    changedFiles,
    project,
    "test,spec,stories"
  );

  expect(result.sort()).toStrictEqual([
    "fixtures/src/bar.test.ts",
    "fixtures/src/foo.test.ts",
    "fixtures/src/hoge.test.ts",
  ]);
});

test("test pattern filtering: handles spaces in pattern list", () => {
  const project = loadProjectFromCase();

  const changedFiles = [path.resolve("fixtures/src/foo.ts")];

  const result = getAffectedTestFiles(changedFiles, project, "test , spec ");

  expect(result.sort()).toStrictEqual([
    "fixtures/src/foo.test.ts",
    "fixtures/src/hoge.test.ts",
  ]);
});
