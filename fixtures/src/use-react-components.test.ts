import { describe, it } from "node:test";
import { useReactComponents } from "./use-react-components";

describe("use-react-components", () => {
  it("should use React components", (context) => {
    const component = useReactComponents();
    context.assert.equal(typeof component, "object");
  });
});
