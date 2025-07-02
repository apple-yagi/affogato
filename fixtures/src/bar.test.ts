import { describe, it } from "node:test";
import { bar } from "./bar";

describe("bar", () => {
  it("should return 'bar'", (context) => {
    context.assert.equal(bar(), "foo");
  });
});
