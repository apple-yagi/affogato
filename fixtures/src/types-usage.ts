// This would use @types/node and @types/react in a real scenario
import { readFileSync } from "node:fs";

export function readConfig(): string {
  return readFileSync("config.json", "utf-8");
}