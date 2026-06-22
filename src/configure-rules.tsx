import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import {
  getAllRuleMetadata,
  getRuleConfig,
  loadSettings,
  resetSettings,
  saveSettings,
  updateRuleConfig,
} from "./linter/settings";
import type { LinterSettings, OptionDefinition, RuleConfig, RuleId, RuleMetadata } from "./linter/types";

export default function Command() {
  const [settings, setSettings] = useState<LinterSettings>();

  useEffect(() => {
    void loadSettings().then(setSettings);
  }, []);

  async function persist(next: LinterSettings) {
    setSettings(structuredClone(next));
    await saveSettings(next);
  }

  async function toggleRule(rule: RuleMetadata) {
    if (!settings) {
      return;
    }

    const next = structuredClone(settings);
    updateRuleConfig(next, rule.id, (config) => ({ ...config, enabled: !config.enabled }));
    await persist(next);
    await showToast({
      style: Toast.Style.Success,
      title: getRuleConfig(next, rule.id).enabled ? "Rule Enabled" : "Rule Disabled",
      message: rule.title,
    });
  }

  async function restoreDefaults() {
    const confirmed = await confirmAlert({
      title: "Restore Bundled Defaults?",
      message: "This replaces local rule changes.",
      primaryAction: { title: "Restore", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) {
      return;
    }
    const defaults = await resetSettings();
    setSettings(defaults);
    await showToast({ style: Toast.Style.Success, title: "Defaults Restored" });
  }

  const metadata = useMemo(() => (settings ? getAllRuleMetadata(settings) : []), [settings]);
  const sections = [...new Set(metadata.map((rule) => rule.section))];

  return (
    <List isLoading={!settings} searchBarPlaceholder="Search rules...">
      {settings &&
        sections.map((section) => (
          <List.Section key={section} title={section}>
            {metadata
              .filter((rule) => rule.section === section)
              .map((rule) => {
                const config = getRuleConfig(settings, rule.id);
                return (
                  <List.Item
                    key={rule.id}
                    title={rule.title}
                    subtitle={rule.description}
                    accessories={[
                      {
                        text: config.enabled ? "On" : "Off",
                        icon: config.enabled ? Icon.CheckCircle : Icon.Circle,
                      },
                      ...(rule.implemented ? [] : [{ text: "Stored" }]),
                    ]}
                    actions={
                      <ActionPanel>
                        {rule.options?.length ? (
                          <Action.Push
                            title="Configure Rule"
                            icon={Icon.Gear}
                            target={
                              <RuleForm rule={rule} config={config} settings={settings} onSave={persist} />
                            }
                          />
                        ) : null}
                        <Action
                          title={config.enabled ? "Disable Rule" : "Enable Rule"}
                          icon={config.enabled ? Icon.XMarkCircle : Icon.CheckCircle}
                          onAction={() => toggleRule(rule)}
                        />
                        <Action
                          title="Restore Bundled Defaults"
                          icon={Icon.ArrowClockwise}
                          onAction={restoreDefaults}
                        />
                      </ActionPanel>
                    }
                  />
                );
              })}
          </List.Section>
        ))}
    </List>
  );
}

function RuleForm(props: {
  rule: RuleMetadata;
  config: RuleConfig;
  settings: LinterSettings;
  onSave: (settings: LinterSettings) => Promise<void>;
}) {
  const { pop } = useNavigation();

  async function onSubmit(values: Record<string, boolean | string>) {
    const next = structuredClone(props.settings);
    updateRuleConfig(next, props.rule.id, (config) => ({ ...config, ...values }));
    await props.onSave(next);
    await showToast({ style: Toast.Style.Success, title: "Rule Saved", message: props.rule.title });
    pop();
  }

  return (
    <Form
      navigationTitle={props.rule.title}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Rule" icon={Icon.Check} onSubmit={onSubmit} />
        </ActionPanel>
      }
    >
      <Form.Checkbox
        id="enabled"
        title="Enabled"
        label="Run this rule"
        defaultValue={Boolean(props.config.enabled)}
      />
      {props.rule.options?.map((option) => renderOption(option, props.config, props.rule.id))}
    </Form>
  );
}

function renderOption(option: OptionDefinition, config: RuleConfig, ruleId: RuleId) {
  const value = config[option.key];
  const key = `${ruleId}-${option.key}`;

  if (option.kind === "boolean") {
    return (
      <Form.Checkbox
        key={key}
        id={option.key}
        title={option.title}
        label={option.description ?? option.title}
        defaultValue={Boolean(value)}
      />
    );
  }

  if (option.kind === "dropdown") {
    return (
      <Form.Dropdown
        key={key}
        id={option.key}
        title={option.title}
        defaultValue={String(value ?? option.values[0])}
      >
        {option.values.map((item) => (
          <Form.Dropdown.Item key={item} title={item} value={item} />
        ))}
      </Form.Dropdown>
    );
  }

  return (
    <Form.TextArea
      key={key}
      id={option.key}
      title={option.title}
      placeholder={option.placeholder}
      defaultValue={typeof value === "string" ? value : ""}
    />
  );
}
