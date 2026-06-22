export type RuleSection = "YAML" | "Heading" | "Footnote" | "Content" | "Spacing" | "Paste";

export type RuleId =
  | "add-blank-line-after-yaml"
  | "dedupe-yaml-array-values"
  | "escape-yaml-special-characters"
  | "force-yaml-escape"
  | "format-tags-in-yaml"
  | "format-yaml-array"
  | "insert-yaml-attributes"
  | "move-tags-to-yaml"
  | "remove-yaml-keys"
  | "sort-yaml-array-values"
  | "yaml-key-sort"
  | "yaml-timestamp"
  | "yaml-title"
  | "yaml-title-alias"
  | "capitalize-headings"
  | "file-name-heading"
  | "header-increment"
  | "headings-start-line"
  | "remove-trailing-punctuation-in-heading"
  | "footnote-after-punctuation"
  | "move-footnotes-to-the-bottom"
  | "re-index-footnotes"
  | "auto-correct-common-misspellings"
  | "blockquote-style"
  | "convert-bullet-list-markers"
  | "default-language-for-code-fences"
  | "emphasis-style"
  | "no-bare-urls"
  | "ordered-list-style"
  | "proper-ellipsis"
  | "quote-style"
  | "remove-consecutive-list-markers"
  | "remove-empty-list-markers"
  | "remove-hyphenated-line-breaks"
  | "remove-multiple-spaces"
  | "strong-style"
  | "two-spaces-between-lines-with-content"
  | "unordered-list-style"
  | "compact-yaml"
  | "consecutive-blank-lines"
  | "convert-spaces-to-tabs"
  | "empty-line-around-blockquotes"
  | "empty-line-around-code-fences"
  | "empty-line-around-horizontal-rules"
  | "empty-line-around-math-blocks"
  | "empty-line-around-tables"
  | "heading-blank-lines"
  | "line-break-at-document-end"
  | "move-math-block-indicators-to-their-own-line"
  | "paragraph-blank-lines"
  | "remove-empty-lines-between-list-markers-and-checklists"
  | "remove-link-spacing"
  | "remove-space-around-characters"
  | "remove-space-before-or-after-characters"
  | "space-after-list-markers"
  | "space-between-chinese-japanese-or-korean-and-english-or-numbers"
  | "trailing-spaces"
  | "add-blockquote-indentation-on-paste"
  | "prevent-double-checklist-indicator-on-paste"
  | "prevent-double-list-item-indicator-on-paste"
  | "proper-ellipsis-on-paste"
  | "remove-hyphens-on-paste"
  | "remove-leading-or-trailing-whitespace-on-paste"
  | "remove-leftover-footnotes-from-quote-on-paste"
  | "remove-multiple-blank-lines-on-paste";

export type RuleConfig = {
  enabled: boolean;
  [key: string]: unknown;
};

export type LinterSettings = {
  ruleConfigs: Record<RuleId, RuleConfig>;
  commonStyles: {
    aliasArrayStyle: string;
    tagArrayStyle: string;
    minimumNumberOfDollarSignsToBeAMathBlock: number;
    escapeCharacter: string;
    removeUnnecessaryEscapeCharsForMultiLineArrays: boolean;
  };
  customRegexes: CustomRegexRule[];
  lintCommands: unknown[];
  lintOnSave: boolean;
  recordLintOnSaveLogs: boolean;
  displayChanged: boolean;
  suppressMessageWhenNoChange: boolean;
  lintOnFileChange: boolean;
  displayLintOnFileChangeNotice: boolean;
  settingsConvertedToConfigKeyValues: boolean;
  additionalFileExtensions: string[];
  foldersToIgnore: string[];
  filesToIgnore: unknown[];
  linterLocale: string;
  logLevel: string;
};

export type CustomRegexRule = {
  enabled: boolean;
  find: string;
  replace: string;
  flags?: string;
  label?: string;
};

export type OptionDefinition =
  | {
      kind: "boolean";
      key: string;
      title: string;
      description?: string;
    }
  | {
      kind: "text";
      key: string;
      title: string;
      description?: string;
      placeholder?: string;
    }
  | {
      kind: "dropdown";
      key: string;
      title: string;
      description?: string;
      values: string[];
    };

export type RuleMetadata = {
  id: RuleId;
  title: string;
  section: RuleSection;
  description: string;
  implemented: boolean;
  options?: OptionDefinition[];
};

export type LintStats = {
  inputCharacters: number;
  outputCharacters: number;
  changedCharacters: number;
  changedLines: number;
  appliedRules: RuleId[];
};

export type LintResult = {
  text: string;
  stats: LintStats;
};
