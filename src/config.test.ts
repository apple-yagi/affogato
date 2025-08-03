import { expect, test } from "vitest";
import { loadConfig, getRunAllTestsPackages } from "./config.js";
import * as fs from "fs";
import * as path from "path";

test("loadConfig: returns empty object when file doesn't exist", () => {
  const result = loadConfig("non-existent-config.json");
  expect(result).toEqual({});
});

test("loadConfig: parses valid JSON config file", () => {
  const configPath = path.join(__dirname, "../fixtures/test-config.json");
  const testConfig = {
    runAllTestsPackages: ["vitest", "playwright", "@testing-library/react"],
  };

  // Create test config file
  fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

  const result = loadConfig(configPath);
  expect(result).toEqual(testConfig);

  // Clean up
  fs.unlinkSync(configPath);
});

test("loadConfig: handles invalid JSON gracefully", () => {
  const configPath = path.join(__dirname, "../fixtures/invalid-config.json");

  // Create invalid JSON file
  fs.writeFileSync(configPath, "{ invalid json }");

  const result = loadConfig(configPath);
  expect(result).toEqual({});

  // Clean up
  fs.unlinkSync(configPath);
});

test("getRunAllTestsPackages: combines input and config file packages", () => {
  const configPath = path.join(__dirname, "../fixtures/combined-config.json");
  const testConfig = {
    runAllTestsPackages: ["vitest", "playwright"],
  };

  // Create test config file
  fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

  const result = getRunAllTestsPackages("jest,cypress", configPath);
  expect(result.sort()).toEqual(["cypress", "jest", "playwright", "vitest"]);

  // Clean up
  fs.unlinkSync(configPath);
});

test("getRunAllTestsPackages: handles only input packages", () => {
  const result = getRunAllTestsPackages(
    "jest,cypress,@testing-library/react",
    ""
  );
  expect(result.sort()).toEqual(["@testing-library/react", "cypress", "jest"]);
});

test("getRunAllTestsPackages: handles only config file packages", () => {
  const configPath = path.join(__dirname, "../fixtures/config-only.json");
  const testConfig = {
    runAllTestsPackages: ["vitest", "playwright"],
  };

  // Create test config file
  fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

  const result = getRunAllTestsPackages("", configPath);
  expect(result.sort()).toEqual(["playwright", "vitest"]);

  // Clean up
  fs.unlinkSync(configPath);
});

test("getRunAllTestsPackages: removes duplicates", () => {
  const configPath = path.join(__dirname, "../fixtures/duplicate-config.json");
  const testConfig = {
    runAllTestsPackages: ["vitest", "jest"],
  };

  // Create test config file
  fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

  const result = getRunAllTestsPackages("jest,vitest,cypress", configPath);
  expect(result.sort()).toEqual(["cypress", "jest", "vitest"]);

  // Clean up
  fs.unlinkSync(configPath);
});

test("getRunAllTestsPackages: handles empty input and config", () => {
  const result = getRunAllTestsPackages("", "");
  expect(result).toEqual([]);
});
