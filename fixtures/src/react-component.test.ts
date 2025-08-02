import { describe, it } from "node:test";
import { createComponent } from "./react-component";

describe("react-component", () => {
  it("should create component", (context) => {
    const component = createComponent();
    context.assert.ok(component);
  });
});