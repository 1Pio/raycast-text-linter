import { describe, expect, it } from "vitest";
import { cloneDefaultSettings } from "../src/config/default-settings";
import { lintText } from "../src/linter/pipeline";
import type { LinterSettings, RuleId } from "../src/linter/types";

function settingsWith(enabledRules: RuleId[]): LinterSettings {
  const settings = cloneDefaultSettings();
  for (const [id, config] of Object.entries(settings.ruleConfigs)) {
    config.enabled = enabledRules.includes(id as RuleId);
  }
  return settings;
}

describe("lintText", () => {
  it("cleans the motivating pasted list example", () => {
    const settings = settingsWith([
      "remove-leading-or-trailing-whitespace-on-paste",
      "remove-multiple-blank-lines-on-paste",
      "remove-empty-lines-between-list-markers-and-checklists",
      "capitalize-headings",
      "line-break-at-document-end",
    ]);

    const input = `



2. A team uploads raw video files to Google Drive/OneDrive. Agent detects file, creates a Cutwright video project, delegates editing/judge agents, routes to assistant/coworker agent for review, iterates, asks original user before publishing, uploads to YouTube with title/thumbnail/description/chapters/tags/schedule, verifies live URL, promotes if appropriate.







3. User forwards last month's expense email. Agent validates trust, downloads/processes in sandbox, compares with prior months, updates a versioned HTML dashboard under the same stable link while preserving old versions, reviews responsive UI, publishes, and returns the updated link.







Please give a deep memo with these sections:







1. Sharp reframing: what the architecture actually is (and what earlier thinking misses).



2. Tenant/agent identity model: clients, users, employees, assistants, subagents, shared capabilities, memory namespaces, secrets, artifact namespaces, audit trails.
`;

    expect(lintText(input, settings).text).toBe(
      [
        "2. A team uploads raw video files to Google Drive/OneDrive. Agent detects file, creates a Cutwright video project, delegates editing/judge agents, routes to assistant/coworker agent for review, iterates, asks original user before publishing, uploads to YouTube with title/thumbnail/description/chapters/tags/schedule, verifies live URL, promotes if appropriate.",
        "3. User forwards last month's expense email. Agent validates trust, downloads/processes in sandbox, compares with prior months, updates a versioned HTML dashboard under the same stable link while preserving old versions, reviews responsive UI, publishes, and returns the updated link.",
        "",
        "Please give a deep memo with these sections:",
        "",
        "1. Sharp reframing: what the architecture actually is (and what earlier thinking misses).",
        "2. Tenant/agent identity model: clients, users, employees, assistants, subagents, shared capabilities, memory namespaces, secrets, artifact namespaces, audit trails.",
        "",
      ].join("\n"),
    );
  });

  it("title-cases headings with configured lowercase words and protected brand words", () => {
    const settings = settingsWith(["capitalize-headings"]);
    settings.ruleConfigs["capitalize-headings"]["ignore-case-words"] = false;

    expect(lintText("# Hello this is A hEAding\n## JavaScript and macOS on iPhone", settings).text).toBe(
      "# Hello This is a Heading\n## JavaScript and macOS on iPhone",
    );
  });

  it("does not rewrite headings inside code fences", () => {
    const settings = settingsWith(["capitalize-headings", "heading-blank-lines"]);
    const input = "```md\n# should stay lowercase\n```\n# should change";

    expect(lintText(input, settings).text).toBe("```md\n# should stay lowercase\n```\n# Should Change");
  });

  it("normalizes headings, punctuation, blockquotes, list markers, and spacing", () => {
    const settings = settingsWith([
      "headings-start-line",
      "remove-trailing-punctuation-in-heading",
      "blockquote-style",
      "convert-bullet-list-markers",
      "space-after-list-markers",
      "unordered-list-style",
      "trailing-spaces",
      "line-break-at-document-end",
    ]);

    const input = "  ## hello world:\n>quote\n•   item  \n*   item 2   ";

    expect(lintText(input, settings).text).toBe("## hello world\n> quote\n- item\n- item 2\n");
  });

  it("preserves markdown separators while normalizing real unordered list markers", () => {
    const settings = settingsWith(["space-after-list-markers", "unordered-list-style"]);
    const input = ["---", "* * *", "___", "+++", "-item", "*item", "- [ ]todo"].join("\n");

    expect(lintText(input, settings).text).toBe(
      ["---", "* * *", "___", "+++", "- item", "- item", "- [ ] todo"].join("\n"),
    );
  });

  it("keeps horizontal rules intact with the bundled defaults", () => {
    const settings = cloneDefaultSettings();
    const input = "Intro\n---\nOutro";

    expect(lintText(input, settings).text).toBe("Intro\n\n---\n\nOutro\n");
  });

  it("keeps checklist markers valid with the bundled defaults", () => {
    const settings = cloneDefaultSettings();
    const input = "- [ ]todo\n- [x]done";

    expect(lintText(input, settings).text).toBe("- [ ] todo\n- [x] done\n");
  });

  it("keeps fenced code contents intact while adding spacing around the block", () => {
    const settings = settingsWith(["empty-line-around-code-fences"]);
    const input = "# Heading\n```ts\nconst value = 1;\n```\nNext";

    expect(lintText(input, settings).text).toBe("# Heading\n\n```ts\nconst value = 1;\n```\n\nNext");
  });

  it("handles footnote punctuation, re-indexing, and moving definitions", () => {
    const settings = settingsWith([
      "footnote-after-punctuation",
      "re-index-footnotes",
      "move-footnotes-to-the-bottom",
    ]);
    const input = "Alpha[^3]. Beta[^5]\n\n[^5]: second\nMiddle\n[^3]: first";

    expect(lintText(input, settings).text).toBe("Alpha.[^1] Beta[^2]\n\nMiddle\n\n[^1]: first\n[^2]: second");
  });

  it("applies common spelling corrections without touching inline code or links", () => {
    const settings = settingsWith(["auto-correct-common-misspellings"]);
    const input =
      "This implimentation is definately useful, but `implimentation` and [implimentation](x) stay.";

    expect(lintText(input, settings).text).toBe(
      "This implementation is definitely useful, but `implimentation` and [implimentation](x) stay.",
    );
  });
});
