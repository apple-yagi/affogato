import { describe, it } from "node:test";
import { hoge } from "./hoge";

describe("hoge", () => {
  it("should return 'hogefoo'", (context) => {
    context.assert.equal(hoge(), "hogefoo");
  });
});
