import React from "react";
import { debounce } from "lodash";

export function createComponent() {
  const _debouncedFn = debounce(() => {
    console.log("debounced");
  }, 300);
  
  return React.createElement("div", {}, "Hello");
}