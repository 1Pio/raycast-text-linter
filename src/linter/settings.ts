import { LocalStorage } from "@raycast/api";
import { cloneDefaultSettings } from "../config/default-settings";
import { getFallbackRuleMetadata, getRuleMetadata, isMetadataDefined } from "../config/rule-metadata";
import type { LinterSettings, RuleConfig, RuleId, RuleMetadata } from "./types";

const SETTINGS_KEY = "text-linter-settings-v1";

export async function loadSettings(): Promise<LinterSettings> {
  const stored = await LocalStorage.getItem<string>(SETTINGS_KEY);
  if (!stored) {
    return cloneDefaultSettings();
  }

  try {
    return mergeSettings(cloneDefaultSettings(), JSON.parse(stored) as Partial<LinterSettings>);
  } catch {
    return cloneDefaultSettings();
  }
}

export async function saveSettings(settings: LinterSettings): Promise<void> {
  await LocalStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function resetSettings(): Promise<LinterSettings> {
  const defaults = cloneDefaultSettings();
  await saveSettings(defaults);
  return defaults;
}

export function mergeSettings(defaults: LinterSettings, overrides: Partial<LinterSettings>): LinterSettings {
  const merged = structuredClone(defaults);
  merged.commonStyles = { ...merged.commonStyles, ...overrides.commonStyles };
  merged.customRegexes = overrides.customRegexes ?? merged.customRegexes;

  if (overrides.ruleConfigs) {
    for (const [id, override] of Object.entries(overrides.ruleConfigs)) {
      merged.ruleConfigs[id as RuleId] = {
        ...(merged.ruleConfigs[id as RuleId] ?? { enabled: false }),
        ...(override as RuleConfig),
      };
    }
  }

  return merged;
}

export function getAllRuleMetadata(settings: LinterSettings): RuleMetadata[] {
  const metadata = getRuleMetadata();
  const sectionById = new Map(metadata.map((rule) => [rule.id, rule.section]));
  const missing = Object.keys(settings.ruleConfigs)
    .filter((id) => !isMetadataDefined(id))
    .map((id) => getFallbackRuleMetadata(id, sectionById.get(id as RuleId) ?? "Content"));

  return [...metadata, ...missing];
}

export function getRuleConfig(settings: LinterSettings, id: RuleId): RuleConfig {
  return settings.ruleConfigs[id] ?? { enabled: false };
}

export function isRuleEnabled(settings: LinterSettings, id: RuleId): boolean {
  return Boolean(getRuleConfig(settings, id).enabled);
}

export function updateRuleConfig(
  settings: LinterSettings,
  id: RuleId,
  updater: (config: RuleConfig) => RuleConfig,
) {
  settings.ruleConfigs[id] = updater(getRuleConfig(settings, id));
}
