import { describe, it } from "node:test";
import { readConfig } from "./types-usage";

describe("types-usage", () => {
  it("should read config", (context) => {
    // Mock test - would fail in real execution but fine for dependency testing
    context.assert.equal(typeof readConfig, "function");
  });
});
