import { describe, it } from "node:test";
import { foo } from "./foo";

describe("foo", () => {
  it("should return 'foo'", (context) => {
    context.assert.equal(foo(), "foo");
  });
});
