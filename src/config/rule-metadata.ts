import type { RuleMetadata, RuleSection } from "../linter/types";

const sectionOrder: RuleSection[] = ["YAML", "Heading", "Footnote", "Content", "Spacing", "Paste"];

export const RULE_METADATA: RuleMetadata[] = [
  {
    id: "add-blank-line-after-yaml",
    title: "Add Blank Line After YAML",
    section: "YAML",
    description: "Ensures frontmatter is separated from following content.",
    implemented: true,
  },
  {
    id: "compact-yaml",
    title: "Compact YAML",
    section: "Spacing",
    description: "Removes extra blank lines at the start, inside, and end of frontmatter.",
    implemented: true,
    options: [{ kind: "boolean", key: "inner-new-lines", title: "Inner New Lines" }],
  },
  {
    id: "capitalize-headings",
    title: "Capitalize Headings",
    section: "Heading",
    description: "Applies title case, all caps, or first-letter casing to Markdown headings.",
    implemented: true,
    options: [
      { kind: "dropdown", key: "style", title: "Style", values: ["Title Case", "ALL CAPS", "First letter"] },
      { kind: "boolean", key: "ignore-case-words", title: "Ignore Cased Words" },
      { kind: "text", key: "ignore-words", title: "Ignore Words", placeholder: "macOS, iOS, JavaScript" },
      { kind: "text", key: "lowercase-words", title: "Lowercase Words" },
    ],
  },
  {
    id: "headings-start-line",
    title: "Headings Start Line",
    section: "Heading",
    description: "Removes indentation before Markdown headings.",
    implemented: true,
  },
  {
    id: "remove-trailing-punctuation-in-heading",
    title: "Remove Trailing Punctuation in Heading",
    section: "Heading",
    description: "Removes configured punctuation from the end of headings.",
    implemented: true,
    options: [{ kind: "text", key: "punctuation-to-remove", title: "Punctuation to Remove" }],
  },
  {
    id: "heading-blank-lines",
    title: "Heading Blank Lines",
    section: "Spacing",
    description: "Keeps headings separated from surrounding text.",
    implemented: true,
    options: [
      { kind: "boolean", key: "bottom", title: "Blank Line After Headings" },
      { kind: "boolean", key: "empty-line-after-yaml", title: "Empty Line After YAML" },
    ],
  },
  {
    id: "footnote-after-punctuation",
    title: "Footnote After Punctuation",
    section: "Footnote",
    description: "Moves footnote references after adjacent punctuation.",
    implemented: true,
  },
  {
    id: "move-footnotes-to-the-bottom",
    title: "Move Footnotes to the Bottom",
    section: "Footnote",
    description: "Moves footnote definitions after the body.",
    implemented: true,
    options: [
      { kind: "boolean", key: "include-blank-line-between-footnotes", title: "Blank Line Between Footnotes" },
    ],
  },
  {
    id: "re-index-footnotes",
    title: "Re-index Footnotes",
    section: "Footnote",
    description: "Renumbers footnote references and definitions in first-use order.",
    implemented: true,
  },
  {
    id: "auto-correct-common-misspellings",
    title: "Auto-correct Common Misspellings",
    section: "Content",
    description: "Corrects a curated set of common misspellings while preserving deliberate casing.",
    implemented: true,
    options: [
      { kind: "text", key: "ignore-words", title: "Ignore Words" },
      {
        kind: "boolean",
        key: "skip-words-with-multiple-capitals",
        title: "Skip Words With Multiple Capitals",
      },
    ],
  },
  {
    id: "blockquote-style",
    title: "Blockquote Style",
    section: "Content",
    description: "Normalizes spacing after blockquote markers.",
    implemented: true,
    options: [{ kind: "dropdown", key: "style", title: "Style", values: ["space", "no space"] }],
  },
  {
    id: "convert-bullet-list-markers",
    title: "Convert Bullet List Markers",
    section: "Content",
    description: "Converts common pasted bullet glyphs into Markdown list markers.",
    implemented: true,
  },
  {
    id: "emphasis-style",
    title: "Emphasis Style",
    section: "Content",
    description: "Uses a consistent marker for emphasis.",
    implemented: true,
    options: [
      { kind: "dropdown", key: "style", title: "Style", values: ["asterisk", "underscore", "consistent"] },
    ],
  },
  {
    id: "ordered-list-style",
    title: "Ordered List Style",
    section: "Content",
    description: "Renumbers ordered lists and normalizes the marker suffix.",
    implemented: true,
    options: [
      {
        kind: "dropdown",
        key: "number-style",
        title: "Number Style",
        values: ["ascending", "lazy", "preserve"],
      },
      { kind: "dropdown", key: "list-end-style", title: "List End Style", values: [".", ")"] },
      { kind: "boolean", key: "preserve-start", title: "Preserve Start" },
    ],
  },
  {
    id: "quote-style",
    title: "Quote Style",
    section: "Content",
    description: "Converts smart quotes to straight quotes or the reverse.",
    implemented: true,
    options: [
      { kind: "boolean", key: "single-quote-enabled", title: "Single Quotes" },
      { kind: "dropdown", key: "single-quote-style", title: "Single Quote Style", values: ["''", "‘’"] },
      { kind: "boolean", key: "double-quote-enabled", title: "Double Quotes" },
      { kind: "dropdown", key: "double-quote-style", title: "Double Quote Style", values: ['""', "“”"] },
    ],
  },
  {
    id: "remove-consecutive-list-markers",
    title: "Remove Consecutive List Markers",
    section: "Content",
    description: "Fixes pasted list lines such as '- - item'.",
    implemented: true,
  },
  {
    id: "remove-empty-list-markers",
    title: "Remove Empty List Markers",
    section: "Content",
    description: "Removes list marker lines with no content.",
    implemented: true,
  },
  {
    id: "remove-hyphenated-line-breaks",
    title: "Remove Hyphenated Line Breaks",
    section: "Content",
    description: "Joins words split by a hyphenated line break.",
    implemented: true,
  },
  {
    id: "strong-style",
    title: "Strong Style",
    section: "Content",
    description: "Uses a consistent marker for bold text.",
    implemented: true,
    options: [
      { kind: "dropdown", key: "style", title: "Style", values: ["asterisk", "underscore", "consistent"] },
    ],
  },
  {
    id: "unordered-list-style",
    title: "Unordered List Style",
    section: "Content",
    description: "Normalizes unordered list markers.",
    implemented: true,
    options: [
      { kind: "dropdown", key: "list-style", title: "List Style", values: ["-", "*", "+", "consistent"] },
    ],
  },
  {
    id: "consecutive-blank-lines",
    title: "Consecutive Blank Lines",
    section: "Spacing",
    description: "Collapses repeated blank lines.",
    implemented: true,
  },
  {
    id: "convert-spaces-to-tabs",
    title: "Convert Spaces to Tabs",
    section: "Spacing",
    description: "Converts leading indentation spaces to tabs.",
    implemented: true,
    options: [{ kind: "text", key: "tabsize", title: "Tab Size" }],
  },
  {
    id: "empty-line-around-blockquotes",
    title: "Empty Line Around Blockquotes",
    section: "Spacing",
    description: "Separates blockquotes from surrounding paragraphs.",
    implemented: true,
  },
  {
    id: "empty-line-around-code-fences",
    title: "Empty Line Around Code Fences",
    section: "Spacing",
    description: "Separates fenced code blocks from surrounding content.",
    implemented: true,
  },
  {
    id: "empty-line-around-horizontal-rules",
    title: "Empty Line Around Horizontal Rules",
    section: "Spacing",
    description: "Separates horizontal rules from surrounding content.",
    implemented: true,
  },
  {
    id: "empty-line-around-math-blocks",
    title: "Empty Line Around Math Blocks",
    section: "Spacing",
    description: "Separates display math blocks from surrounding content.",
    implemented: true,
  },
  {
    id: "empty-line-around-tables",
    title: "Empty Line Around Tables",
    section: "Spacing",
    description: "Separates Markdown tables from surrounding content.",
    implemented: true,
  },
  {
    id: "line-break-at-document-end",
    title: "Line Break at Document End",
    section: "Spacing",
    description: "Ensures exactly one trailing newline for non-empty text.",
    implemented: true,
  },
  {
    id: "move-math-block-indicators-to-their-own-line",
    title: "Move Math Block Indicators to Their Own Line",
    section: "Spacing",
    description: "Expands one-line display math fences to separate lines.",
    implemented: true,
  },
  {
    id: "remove-empty-lines-between-list-markers-and-checklists",
    title: "Remove Empty Lines Between List Markers and Checklists",
    section: "Spacing",
    description: "Removes blank lines between consecutive list items.",
    implemented: true,
  },
  {
    id: "remove-link-spacing",
    title: "Remove Link Spacing",
    section: "Spacing",
    description: "Trims spaces inside Markdown and wiki link labels.",
    implemented: true,
  },
  {
    id: "remove-space-before-or-after-characters",
    title: "Remove Space Before or After Characters",
    section: "Spacing",
    description: "Removes spaces before punctuation and after opening brackets.",
    implemented: true,
    options: [
      { kind: "text", key: "characters-to-remove-space-before", title: "Characters Before" },
      { kind: "text", key: "characters-to-remove-space-after", title: "Characters After" },
    ],
  },
  {
    id: "space-after-list-markers",
    title: "Space After List Markers",
    section: "Spacing",
    description: "Keeps one space after list and checklist markers.",
    implemented: true,
  },
  {
    id: "trailing-spaces",
    title: "Trailing Spaces",
    section: "Spacing",
    description: "Removes trailing spaces and tabs.",
    implemented: true,
    options: [{ kind: "boolean", key: "two-space-line-break", title: "Two Space Line Break" }],
  },
  {
    id: "remove-leading-or-trailing-whitespace-on-paste",
    title: "Remove Leading or Trailing Whitespace on Paste",
    section: "Paste",
    description: "Trims pasted text before linting.",
    implemented: true,
  },
  {
    id: "remove-leftover-footnotes-from-quote-on-paste",
    title: "Remove Leftover Footnotes From Quote on Paste",
    section: "Paste",
    description: "Removes citation-number leftovers from copied quoted text.",
    implemented: true,
  },
  {
    id: "remove-multiple-blank-lines-on-paste",
    title: "Remove Multiple Blank Lines on Paste",
    section: "Paste",
    description: "Condenses runs of three or more newlines in pasted text.",
    implemented: true,
  },
];

const definedIds = new Set(RULE_METADATA.map((rule) => rule.id));

export function getRuleMetadata(): RuleMetadata[] {
  return [...RULE_METADATA].sort((a, b) => {
    const sectionDiff = sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section);
    return sectionDiff || a.title.localeCompare(b.title);
  });
}

export function getFallbackRuleMetadata(id: string, section: RuleSection = "Content"): RuleMetadata {
  return {
    id: id as RuleMetadata["id"],
    title: titleize(id),
    section,
    description: "Rule configuration is preserved for compatibility.",
    implemented: false,
  };
}

export function isMetadataDefined(id: string): boolean {
  return definedIds.has(id as RuleMetadata["id"]);
}

export function titleize(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
