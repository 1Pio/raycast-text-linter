import personalDefaults from "./personal-defaults.json";
import type { LinterSettings } from "../linter/types";

export const DEFAULT_SETTINGS = personalDefaults as LinterSettings;

export function cloneDefaultSettings(): LinterSettings {
  return structuredClone(DEFAULT_SETTINGS);
}
