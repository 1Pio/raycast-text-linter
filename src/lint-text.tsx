import {
  Action,
  ActionPanel,
  Clipboard,
  Form,
  Icon,
  Toast,
  getPreferenceValues,
  openCommandPreferences,
  showToast,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SETTINGS } from "./config/default-settings";
import { lintText } from "./linter/pipeline";
import { loadSettings } from "./linter/settings";
import type { LinterSettings } from "./linter/types";
import { markdownToHtml } from "./ui/html";
import { saveTextWithDialog } from "./ui/save";

type Preferences = {
  prefillFromClipboard: boolean;
  defaultSaveFileName: string;
};

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [settings, setSettings] = useState<LinterSettings>(DEFAULT_SETTINGS);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);

      if (preferences.prefillFromClipboard) {
        const clipboardText = await Clipboard.readText();
        if (clipboardText) {
          setInput(clipboardText);
        }
      }

      setIsLoading(false);
    }

    void hydrate();
  }, [preferences.prefillFromClipboard]);

  const result = useMemo(() => lintText(input, settings), [input, settings]);
  const html = useMemo(() => markdownToHtml(result.text), [result.text]);
  const richContent = useMemo<Clipboard.Content>(() => ({ text: result.text, html }), [result.text, html]);
  const delta = result.stats.outputCharacters - result.stats.inputCharacters;
  const summary =
    input.length === 0
      ? "Paste text above to lint it."
      : `${result.stats.appliedRules.length} rule${result.stats.appliedRules.length === 1 ? "" : "s"} changed ${result.stats.changedLines} line${result.stats.changedLines === 1 ? "" : "s"} (${delta >= 0 ? "+" : ""}${delta} characters).`;

  async function copyText() {
    await Clipboard.copy(result.text);
    await showToast({ style: Toast.Style.Success, title: "Copied Linted Text" });
  }

  const actions = (
    <ActionPanel>
      <Action.Paste title="Paste Linted Text" icon={Icon.TextCursor} content={richContent} />
      <Action title="Copy Linted Text" icon={Icon.Clipboard} autoFocus onAction={copyText} />
      <ActionPanel.Submenu
        title="Paste as…"
        icon={Icon.ArrowRight}
        shortcut={{ modifiers: ["cmd", "opt"], key: "enter" }}
      >
        <Action.Paste title="HTML" icon={Icon.Code} content={richContent} />
        <Action.Paste title="Plain Text" icon={Icon.Text} content={result.text} />
      </ActionPanel.Submenu>
      <Action.Paste
        title="Paste Plain Text"
        icon={Icon.Text}
        shortcut={{ modifiers: ["cmd", "ctrl"], key: "enter" }}
        content={result.text}
      />
      <Action
        title="Save as File…"
        icon={Icon.Document}
        shortcut={{ modifiers: ["cmd"], key: "s" }}
        onAction={() => saveTextWithDialog(result.text, preferences.defaultSaveFileName)}
      />
      <Action.CopyToClipboard title="Copy HTML" icon={Icon.Code} content={html} />
      <Action title="Open Command Preferences" icon={Icon.Gear} onAction={openCommandPreferences} />
    </ActionPanel>
  );

  return (
    <Form isLoading={isLoading} actions={actions}>
      <Form.TextArea
        id="input"
        title="Text"
        placeholder="Paste Markdown or prose to clean up..."
        value={input}
        onChange={setInput}
      />
      <Form.Description title="Result" text={summary} />
      <Form.TextArea id="output" title="Linted Text" value={result.text} onChange={() => undefined} />
    </Form>
  );
}
