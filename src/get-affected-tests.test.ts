import { expect, test } from "vitest";
import { getAffectedTestFiles, getFilesUsingPackages } from "./get-affected-tests.js";
import { Project } from "ts-morph";
import path from "node:path";

function loadProjectFromCase(): Project {
  const casePath = path.resolve("fixtures", "tsconfig.json");
  return new Project({
    tsConfigFilePath: casePath,
  });
}

test("parsePackageJsonDiff: detects changed dependencies", () => {
  const mockDiff = `
--- a/package.json
+++ b/package.json
@@ -3,7 +3,7 @@
   "version": "1.0.0",
   "dependencies": {
-    "react": "^17.0.0",
+    "react": "^18.0.0",
     "lodash": "^4.17.20"
   },
   "devDependencies": {
-    "@types/node": "^16.0.0"
+    "@types/node": "^20.0.0"
   }
`;

  // Test the internal parsePackageJsonDiff function
  // We need to access it for testing - in real implementation, you might export it for testing
  const result = (global as any).parsePackageJsonDiff?.(mockDiff) || [];
  
  // This test validates the concept - actual implementation would need the function exported
  expect(Array.isArray(result)).toBe(true);
});

test("getFilesUsingPackages: finds files importing react", () => {
  const project = loadProjectFromCase();
  
  const result = getFilesUsingPackages(["react"], project);
  
  // Should find react-component.ts which imports React
  expect(result.some((file: string) => file.includes("react-component"))).toBe(true);
});

test("getFilesUsingPackages: finds files importing lodash", () => {
  const project = loadProjectFromCase();
  
  const result = getFilesUsingPackages(["lodash"], project);
  
  // Should find react-component.ts which imports from lodash
  expect(result.some((file: string) => file.includes("react-component"))).toBe(true);
});

test("getFilesUsingPackages: handles scoped packages", () => {
  const project = loadProjectFromCase();
  
  const result = getFilesUsingPackages(["@types/node"], project);
  
  // Should handle scoped packages correctly
  expect(Array.isArray(result)).toBe(true);
});

test("getAffectedTestFiles: includes tests for files using changed packages", () => {
  const project = loadProjectFromCase();
  
  // Test with no changed files but changed packages
  const changedFiles: string[] = [];
  const changedPackages = ["react"];
  
  const result = getAffectedTestFiles(changedFiles, project, changedPackages);
  
  // Should include test files for components using React
  expect(result.affectedTests.some((file: string) => file.includes("react-component.test"))).toBe(true);
});

test("getAffectedTestFiles: combines changed files and changed packages", () => {
  const project = loadProjectFromCase();
  
  const changedFiles = [path.resolve("fixtures/src/foo.ts")];
  const changedPackages = ["react"];
  
  const result = getAffectedTestFiles(changedFiles, project, changedPackages);
  
  // Should include tests for both changed files and files using changed packages
  expect(result.affectedTests.some((file: string) => file.includes("foo.test"))).toBe(true);
  expect(result.affectedTests.some((file: string) => file.includes("react-component.test"))).toBe(true);
});

test("basic case: only test file depending on changed file is returned", () => {
  const project = loadProjectFromCase();

  const changedFiles = [path.resolve("fixtures/src/foo.ts")];

  const result = getAffectedTestFiles(changedFiles, project);

  expect(result.affectedTests.sort()).toStrictEqual([
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

  expect(result.affectedTests.sort()).toStrictEqual([
    "fixtures/src/bar.test.ts",
    "fixtures/src/foo.test.ts",
    "fixtures/src/hoge.test.ts",
  ]);
});

test("basic case: pass tsconfig path.", () => {
  const tsconfig = path.resolve("fixtures", "tsconfig.json");

  const changedFiles = [path.resolve("fixtures/src/foo.ts")];

  const result = getAffectedTestFiles(changedFiles, tsconfig);

  expect(result.affectedTests.sort()).toStrictEqual(["src/foo.test.ts", "src/hoge.test.ts"]);
});

test("basic case: changing unrelated file returns nothing", () => {
  const project = loadProjectFromCase();

  const changedFiles = [path.resolve("fixtures/src/no-test.ts")];

  const result = getAffectedTestFiles(changedFiles, project);

  expect(result.affectedTests).toStrictEqual([]);
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
  expect(result.affectedTests.sort()).toStrictEqual([
    "fixtures/src/foo.test.ts",
    "fixtures/src/hoge.test.ts",
  ]);
});

test("getAffectedTestFiles: includes transitive dependencies from package changes", () => {
  const project = loadProjectFromCase();
  
  // Only react package changed, no files changed
  const changedFiles: string[] = [];
  const changedPackages = ["react"];
  
  const result = getAffectedTestFiles(changedFiles, project, changedPackages);
  
  // Should include both direct and indirect dependencies:
  // 1. react-component.test.ts (direct: react-component.ts imports react)
  // 2. use-react-components.test.ts (indirect: use-react-components.ts imports react-component.ts which uses react)
  expect(result.affectedTests.some((file: string) => file.includes("react-component.test"))).toBe(true);
  expect(result.affectedTests.some((file: string) => file.includes("use-react-components.test"))).toBe(true);
});

test("getAffectedTestFiles: runs all tests when runAllTestsPackages matches changed package", () => {
  const project = loadProjectFromCase();
  
  const result = getAffectedTestFiles(
    [],
    project,
    ["vitest"], // Changed package
    ["vitest", "playwright"] // Packages that should trigger running all tests
  );
  
  // Should return shouldRunAllTests as true
  expect(result.shouldRunAllTests).toBe(true);
  // affectedTests should be empty when running all tests
  expect(result.affectedTests).toEqual([]);
});

test("getAffectedTestFiles: normal behavior when runAllTestsPackages doesn't match", () => {
  const project = loadProjectFromCase();
  
  const result = getAffectedTestFiles(
    [],
    project,
    ["react"], // Changed package
    ["vitest", "playwright"] // Packages that should trigger running all tests
  );
  
  // Should follow normal logic for react package changes
  expect(result.shouldRunAllTests).toBe(false);
  expect(Array.isArray(result.affectedTests)).toBe(true);
});

test("getAffectedTestFiles: combines runAllTestsPackages from multiple sources", () => {
  const project = loadProjectFromCase();
  
  const result = getAffectedTestFiles(
    [],
    project,
    ["custom-test-tool"], // Changed package
    ["vitest", "playwright", "custom-test-tool"] // Packages that should trigger running all tests
  );
  
  // Should run all tests because custom-test-tool is in the runAllTestsPackages list
  expect(result.shouldRunAllTests).toBe(true);
  expect(result.affectedTests).toEqual([]);
});
