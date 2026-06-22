import { COMMON_MISSPELLINGS, preserveCase } from "./misspellings";
import { mapUnprotectedBlocks, withInlineProtection } from "./protection";
import type { LinterSettings, RuleId } from "./types";

const allHeadersRegex = /^([ \t]*)(#{1,6})([ \t]+)([^\n\r]*?)([ \t]+#+)?$/gm;
const yamlRegex = /^---\n([\s\S]*?)\n---(?=\n|$)/;
const markdownLinkRegex = /(!?)\[([^\]\n]*)\]\(([^)]+)\)/g;
const wikiLinkRegex = /(!?)\[\[([^\]\n|]+)(\|([^\]\n|]+))?(\|([^\]\n|]+))?\]\]/g;
const horizontalRuleRegex = /^([ \t]{0,3})([-*_])(?:[ \t]*\2){2,}[ \t]*$/;
const repeatedMarkerOnlyLineRegex = /^[ \t]*([-+*])(?:[ \t]*\1)+[ \t]*$/;
const quoteWrapperLineRegex = /^[ \t]*(["'“”‘’]{3,})[ \t]*$/;

export type RuleContext = {
  appliedRules: RuleId[];
};

type RuleFn = (text: string, settings: LinterSettings, context: RuleContext) => string;

export const RULE_PIPELINE: Array<[RuleId, RuleFn]> = [
  ["remove-leading-or-trailing-whitespace-on-paste", removeLeadingOrTrailingWhitespaceOnPaste],
  ["remove-multiple-blank-lines-on-paste", removeMultipleBlankLinesOnPaste],
  ["remove-leftover-footnotes-from-quote-on-paste", removeLeftoverFootnotesFromQuoteOnPaste],
  ["move-math-block-indicators-to-their-own-line", moveMathBlockIndicatorsToOwnLine],
  ["auto-correct-common-misspellings", autoCorrectCommonMisspellings],
  ["compact-yaml", compactYaml],
  ["headings-start-line", headingsStartLine],
  ["remove-trailing-punctuation-in-heading", removeTrailingPunctuationInHeading],
  ["footnote-after-punctuation", footnoteAfterPunctuation],
  ["move-footnotes-to-the-bottom", moveFootnotesToBottom],
  ["re-index-footnotes", reIndexFootnotes],
  ["convert-bullet-list-markers", convertBulletListMarkers],
  ["remove-consecutive-list-markers", removeConsecutiveListMarkers],
  ["remove-empty-list-markers", removeEmptyListMarkers],
  ["space-after-list-markers", spaceAfterListMarkers],
  ["remove-empty-lines-between-list-markers-and-checklists", removeEmptyLinesBetweenListMarkersAndChecklists],
  ["unordered-list-style", unorderedListStyle],
  ["ordered-list-style", orderedListStyle],
  ["remove-hyphenated-line-breaks", removeHyphenatedLineBreaks],
  ["quote-style", quoteStyle],
  ["emphasis-style", emphasisStyle],
  ["strong-style", strongStyle],
  ["remove-link-spacing", removeLinkSpacing],
  ["remove-space-before-or-after-characters", removeSpaceBeforeOrAfterCharacters],
  ["convert-spaces-to-tabs", convertSpacesToTabs],
  ["empty-line-around-code-fences", emptyLineAroundCodeFences],
  ["empty-line-around-math-blocks", emptyLineAroundMathBlocks],
  ["empty-line-around-blockquotes", emptyLineAroundBlockquotes],
  ["empty-line-around-horizontal-rules", emptyLineAroundHorizontalRules],
  ["empty-line-around-tables", emptyLineAroundTables],
  ["heading-blank-lines", headingBlankLines],
  ["capitalize-headings", capitalizeHeadings],
  ["blockquote-style", blockquoteStyle],
  ["trailing-spaces", trailingSpaces],
  ["consecutive-blank-lines", consecutiveBlankLines],
  ["add-blank-line-after-yaml", addBlankLineAfterYaml],
  ["line-break-at-document-end", lineBreakAtDocumentEnd],
];

export function runRulePipeline(
  text: string,
  settings: LinterSettings,
): { text: string; appliedRules: RuleId[] } {
  const context: RuleContext = { appliedRules: [] };
  let current = text.replace(/\r\n?/g, "\n");

  for (const [id, rule] of RULE_PIPELINE) {
    if (!isEnabled(settings, id)) {
      continue;
    }

    const before = current;
    current = rule(current, settings, context);
    if (current !== before) {
      context.appliedRules.push(id);
    }
  }

  current = applyCustomRegexes(current, settings);
  return { text: current, appliedRules: context.appliedRules };
}

function isEnabled(settings: LinterSettings, id: RuleId): boolean {
  return Boolean(settings.ruleConfigs[id]?.enabled);
}

function ruleConfig<T extends Record<string, unknown>>(settings: LinterSettings, id: RuleId): T {
  return (settings.ruleConfigs[id] ?? {}) as unknown as T;
}

function removeLeadingOrTrailingWhitespaceOnPaste(text: string): string {
  return text.replace(/^[\n ]+|\s+$/g, "");
}

function removeMultipleBlankLinesOnPaste(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n");
}

function removeLeftoverFootnotesFromQuoteOnPaste(text: string): string {
  return mapUnprotectedBlocks(text, (segment) =>
    withInlineProtection(segment, (value) => value.replace(/(\D)[.,]\d+/g, "$1")),
  );
}

function moveMathBlockIndicatorsToOwnLine(text: string): string {
  return mapUnprotectedBlocks(text, (segment) =>
    segment.replace(/^(\s*)\$\$(.+?)\$\$\s*$/gm, (_match, indent: string, body: string) => {
      return `${indent}$$\n${indent}${body.trim()}\n${indent}$$`;
    }),
  );
}

function autoCorrectCommonMisspellings(text: string, settings: LinterSettings): string {
  const config = ruleConfig<{
    "ignore-words"?: string;
    "skip-words-with-multiple-capitals"?: boolean;
  }>(settings, "auto-correct-common-misspellings");
  const ignored = new Set(splitCsv(config["ignore-words"] ?? "").map((word) => word.toLowerCase()));
  const skipMultipleCaps = config["skip-words-with-multiple-capitals"] !== false;

  return mapUnprotectedBlocks(text, (segment) =>
    withInlineProtection(segment, (value) =>
      value.replace(/\b[\p{L}][\p{L}'-]*\b/gu, (word) => {
        if (skipMultipleCaps && (word.match(/[A-Z]/g) ?? []).length > 1) {
          return word;
        }

        const lower = word.toLowerCase();
        if (ignored.has(lower)) {
          return word;
        }

        const replacement = COMMON_MISSPELLINGS.get(lower);
        return replacement ? preserveCase(word, replacement) : word;
      }),
    ),
  );
}

function compactYaml(text: string, settings: LinterSettings): string {
  const config = ruleConfig<{ "inner-new-lines"?: boolean }>(settings, "compact-yaml");
  return text.replace(yamlRegex, (_match, body: string) => {
    let compacted = body.replace(/^\n+|\n+$/g, "");
    if (config["inner-new-lines"]) {
      compacted = compacted.replace(/\n{2,}/g, "\n");
    }
    return `---\n${compacted}\n---`;
  });
}

function headingsStartLine(text: string): string {
  return mapUnprotectedBlocks(text, (segment) =>
    segment.replace(
      allHeadersRegex,
      (_m, _space, hashes, gap, body, closing = "") => `${hashes}${gap}${body}${closing}`,
    ),
  );
}

function removeTrailingPunctuationInHeading(text: string, settings: LinterSettings): string {
  const config = ruleConfig<{ "punctuation-to-remove"?: string }>(
    settings,
    "remove-trailing-punctuation-in-heading",
  );
  const punctuation = config["punctuation-to-remove"] || ".,;:。，；：";

  return mapUnprotectedBlocks(text, (segment) =>
    segment.replace(
      allHeadersRegex,
      (heading, space = "", hashes = "", gap = "", body = "", closing = "") => {
        const trimmed = body.trimEnd();
        if (!trimmed || /&[^\s]+;$/i.test(trimmed)) {
          return heading;
        }

        const last = trimmed.charAt(trimmed.length - 1);
        if (!punctuation.includes(last)) {
          return heading;
        }

        return `${space}${hashes}${gap}${body.slice(0, trimmed.length - 1)}${body.slice(trimmed.length)}${closing}`;
      },
    ),
  );
}

function footnoteAfterPunctuation(text: string): string {
  return mapUnprotectedBlocks(text, (segment) =>
    withInlineProtection(segment, (value) => value.replace(/(\[\^[^\]]+\])(?!:) ?([,.;!:?])/gm, "$2$1")),
  );
}

function moveFootnotesToBottom(text: string, settings: LinterSettings): string {
  const config = ruleConfig<{ "include-blank-line-between-footnotes"?: boolean }>(
    settings,
    "move-footnotes-to-the-bottom",
  );
  const lines = text.split("\n");
  const footnotes: string[] = [];
  const body: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (/^\[\^[^\]]+\]:/.test(line)) {
      footnotes.push(line);
      continue;
    }
    body.push(line);
  }

  if (!footnotes.length) {
    return text;
  }

  const separator = config["include-blank-line-between-footnotes"] ? "\n\n" : "\n";
  return `${body.join("\n").replace(/\n+$/g, "")}\n\n${footnotes.join(separator)}`;
}

function reIndexFootnotes(text: string): string {
  const definitions = new Map<string, string>();
  for (const match of text.matchAll(/^\[\^([^\]]+)\]:([^\n]*)$/gm)) {
    definitions.set(match[1], match[2]);
  }

  if (!definitions.size) {
    return text;
  }

  const mapping = new Map<string, string>();
  let next = 1;
  const withoutDefinitions = text.replace(/^\[\^[^\]]+\]:[^\n]*\n?/gm, "");
  const body = withoutDefinitions.replace(/\[\^([^\]]+)\]/g, (full, key: string) => {
    if (!definitions.has(key)) {
      return full;
    }
    if (!mapping.has(key)) {
      mapping.set(key, String(next++));
    }
    return `[^${mapping.get(key)}]`;
  });

  const newDefinitions: string[] = [];
  for (const [oldKey, newKey] of mapping) {
    const definition = definitions.get(oldKey);
    if (definition !== undefined) {
      newDefinitions.push(`[^${newKey}]:${definition}`);
    }
  }

  return `${body.replace(/\n+$/g, "")}\n\n${newDefinitions.join("\n")}`;
}

function convertBulletListMarkers(text: string): string {
  return mapUnprotectedBlocks(text, (segment) => segment.replace(/^([^\S\n]*)([•§‣◦])([^\S\n]*)/gm, "$1-$3"));
}

function removeConsecutiveListMarkers(text: string): string {
  return mapUnprotectedBlocks(text, (segment) => segment.replace(/^([ |\t]*)- - (\p{L})/gmu, "$1- $2"));
}

function removeEmptyListMarkers(text: string): string {
  return mapUnprotectedBlocks(text, (segment) => {
    const marker = /^([ \t]*)(?:[-*+]|\d+[.)]|- \[[^\n]\])[ \t]*$/gm;
    return segment.replace(new RegExp(`${marker.source}\\n`, "gm"), "").replace(marker, "");
  });
}

function spaceAfterListMarkers(text: string): string {
  return mapUnprotectedBlocks(text, (segment) =>
    mapLines(segment, (line) => {
      if (isSeparatorLikeLine(line)) {
        return line;
      }

      return line
        .replace(/^([ \t]*\d+[.)]|[ \t]*[-+*])([^\S\r\n]*)/, "$1 ")
        .replace(/^([ \t]*[-+*]\s+\[[ xX]\])([^\S\r\n]*)/, "$1 ");
    }),
  );
}

function removeEmptyLinesBetweenListMarkersAndChecklists(text: string): string {
  return mapUnprotectedBlocks(text, (segment) => {
    let next = segment;
    const patterns = [
      "(( |\\t)*- \\[.\\]( |\\t)+.+)",
      "(( |\\t)*\\d+\\.( |\\t)+.+)",
      "(( |\\t)*\\+( |\\t)+.+)",
      "(( |\\t)*-(?! \\[.\\])( |\\t)+.+)",
      "(( |\\t)*\\*( |\\t)+.+)",
    ];

    for (const pattern of patterns) {
      const regex = new RegExp(
        `^${pattern}\\n(?:(?:[\\t\\v\\f\\r \\u00a0-\\u200b\\u2028-\\u2029\\u3000]+)?\\n){1,}${pattern}$`,
        "gm",
      );
      let matched = false;
      do {
        matched = regex.test(next);
        regex.lastIndex = 0;
        next = next.replace(regex, "$1\n$4");
      } while (matched);
    }

    return next;
  });
}

function unorderedListStyle(text: string, settings: LinterSettings): string {
  const config = ruleConfig<{ "list-style"?: string }>(settings, "unordered-list-style");
  const style = config["list-style"] === "consistent" ? "-" : config["list-style"] || "-";
  return mapUnprotectedBlocks(text, (segment) =>
    mapLines(segment, (line) =>
      isSeparatorLikeLine(line)
        ? line
        : line.replace(
            /^([ \t]*)([-+*])(\s+(?!\[[^\n]\]\s).+)$/,
            (_match, indent, _marker, rest) => `${indent}${style}${rest}`,
          ),
    ),
  );
}

function orderedListStyle(text: string, settings: LinterSettings): string {
  const config = ruleConfig<{
    "number-style"?: string;
    "list-end-style"?: string;
    "preserve-start"?: boolean;
  }>(settings, "ordered-list-style");
  const listEnd = config["list-end-style"] === ")" ? ")" : ".";
  const numberStyle = config["number-style"] || "ascending";
  const preserveStart = config["preserve-start"] !== false;

  return mapUnprotectedBlocks(text, (segment) => {
    const lines = segment.split("\n");
    const counters = new Map<string, number>();
    let previousWasList = false;

    return lines
      .map((line) => {
        const match = line.match(/^(\s*)(\d+)[.)](\s+.+)$/);
        if (!match) {
          previousWasList = false;
          return line;
        }

        const [, indent, rawNumber, rest] = match;
        const key = indent.replace(/ {4}/g, "\t").length.toString();
        if (!previousWasList || !counters.has(key)) {
          counters.set(key, preserveStart ? Number(rawNumber) : 1);
        }

        const number =
          numberStyle === "lazy"
            ? 1
            : numberStyle === "preserve"
              ? Number(rawNumber)
              : (counters.get(key) ?? 1);
        counters.set(key, number + 1);
        previousWasList = true;
        return `${indent}${number}${listEnd}${rest}`;
      })
      .join("\n");
  });
}

function removeHyphenatedLineBreaks(text: string): string {
  return mapUnprotectedBlocks(text, (segment) =>
    segment.replace(/(\p{L})[-‐][ \t]*\n[ \t]*(\p{L})/gu, "$1$2").replace(/\b[-‐] \b/g, ""),
  );
}

function quoteStyle(text: string, settings: LinterSettings): string {
  const config = ruleConfig<{
    "single-quote-enabled"?: boolean;
    "single-quote-style"?: string;
    "double-quote-enabled"?: boolean;
    "double-quote-style"?: string;
  }>(settings, "quote-style");

  return mapUnprotectedBlocks(text, (segment) =>
    withInlineProtection(segment, (value) => {
      let next = value;
      if (config["double-quote-enabled"] !== false) {
        next =
          config["double-quote-style"] === "“”"
            ? smartenQuotes(next, '"', "“", "”", false)
            : next.replace(/[“”„«»]/g, '"');
      }
      if (config["single-quote-enabled"] !== false) {
        next =
          config["single-quote-style"] === "‘’"
            ? smartenQuotes(next, "'", "‘", "’", true)
            : next.replace(/[‘’‚‹›]/g, "'");
      }
      return next;
    }),
  );
}

function smartenQuotes(
  text: string,
  straight: string,
  open: string,
  close: string,
  contractions: boolean,
): string {
  let previousWasOpen = false;
  return text.replace(new RegExp(escapeRegExp(straight), "g"), (quote, offset: number) => {
    const before = text.charAt(offset - 1);
    const after = text.charAt(offset + 1);
    if (contractions && /\p{L}/u.test(before) && /\p{L}/u.test(after)) {
      return close;
    }
    if (!before || /\s|[([{]/.test(before)) {
      previousWasOpen = true;
      return open;
    }
    if (!after || /\s|[.,;:!?)}\]]/.test(after)) {
      previousWasOpen = false;
      return close;
    }
    previousWasOpen = !previousWasOpen;
    return previousWasOpen ? open : close;
  });
}

function emphasisStyle(text: string, settings: LinterSettings): string {
  const style = String(ruleConfig<{ style?: string }>(settings, "emphasis-style").style || "asterisk");
  if (style === "consistent") {
    return text;
  }
  return mapUnprotectedBlocks(text, (segment) =>
    withInlineProtection(segment, (value) =>
      style === "asterisk"
        ? value.replace(/(^|[^\w])_([^_\n][^_\n]*?[^_\n])_([^\w]|$)/g, "$1*$2*$3")
        : value.replace(/(^|[^\w])\*([^*\n][^*\n]*?[^*\n])\*([^\w]|$)/g, "$1_$2_$3"),
    ),
  );
}

function strongStyle(text: string, settings: LinterSettings): string {
  const style = String(ruleConfig<{ style?: string }>(settings, "strong-style").style || "asterisk");
  if (style === "consistent") {
    return text;
  }
  return mapUnprotectedBlocks(text, (segment) =>
    withInlineProtection(segment, (value) =>
      style === "asterisk"
        ? value.replace(/__([^_\n].*?[^_\n])__/g, "**$1**")
        : value.replace(/\*\*([^*\n].*?[^*\n])\*\*/g, "__$1__"),
    ),
  );
}

function removeLinkSpacing(text: string): string {
  return text
    .replace(
      markdownLinkRegex,
      (full, image: string, label: string, url: string) => `${image}[${label.trim()}](${url})`,
    )
    .replace(
      wikiLinkRegex,
      (full, image: string, target: string, aliasSep = "", alias = "", secondSep = "", second = "") => {
        if (!aliasSep) {
          return full;
        }
        const tail = secondSep ? `${secondSep}${String(second).trim()}` : "";
        return `${image}[[${target}|${String(alias).trim()}${tail}]]`;
      },
    );
}

function removeSpaceBeforeOrAfterCharacters(text: string, settings: LinterSettings): string {
  const config = ruleConfig<{
    "characters-to-remove-space-before"?: string;
    "characters-to-remove-space-after"?: string;
  }>(settings, "remove-space-before-or-after-characters");
  const before = escapeRegExp(config["characters-to-remove-space-before"] || ",!?;:).’”]");
  const after = escapeRegExp(config["characters-to-remove-space-after"] || "¿¡‘“([");

  return mapUnprotectedBlocks(text, (segment) =>
    withInlineProtection(segment, (value) =>
      value
        .replace(new RegExp(`[ \\t]+([${before}])`, "g"), "$1")
        .replace(new RegExp(`([${after}])[ \\t]+`, "g"), "$1"),
    ),
  );
}

function convertSpacesToTabs(text: string, settings: LinterSettings): string {
  const tabSize = Number(ruleConfig<{ tabsize?: string }>(settings, "convert-spaces-to-tabs").tabsize || 4);
  if (!Number.isFinite(tabSize) || tabSize <= 0) {
    return text;
  }

  return mapUnprotectedBlocks(text, (segment) =>
    segment.replace(
      /^( +)/gm,
      (spaces) => "\t".repeat(Math.floor(spaces.length / tabSize)) + " ".repeat(spaces.length % tabSize),
    ),
  );
}

function emptyLineAroundCodeFences(text: string): string {
  return ensureBlankLineAroundDelimitedBlocks(
    text,
    (line) => line.match(/^([ \t]*)(`{3,}|~{3,})/),
    (line, marker) => line.trimStart().startsWith(marker),
  );
}

function emptyLineAroundMathBlocks(text: string): string {
  return ensureBlankLineAroundDelimitedBlocks(
    text,
    (line) => line.match(/^(\s*)(\${2,})\s*$/),
    (line) => /^\s*\${2,}\s*$/.test(line),
  );
}

function emptyLineAroundBlockquotes(text: string): string {
  return ensureBlankLineAroundRuns(text, (line) => /^(\s*>)/.test(line));
}

function emptyLineAroundHorizontalRules(text: string): string {
  return mapUnprotectedBlocks(text, (segment) =>
    ensureBlankLineAroundMatchingLines(segment, (line) => horizontalRuleRegex.test(line)),
  );
}

function emptyLineAroundTables(text: string): string {
  return mapUnprotectedBlocks(text, (segment) =>
    ensureBlankLineAroundRuns(
      segment,
      (line) => /^\s*\|.*\|\s*$/.test(line) || /^\s*:?-{2,}:?\s*\|/.test(line),
    ),
  );
}

function headingBlankLines(text: string, settings: LinterSettings): string {
  const config = ruleConfig<{ bottom?: boolean; "empty-line-after-yaml"?: boolean }>(
    settings,
    "heading-blank-lines",
  );
  return mapUnprotectedBlocks(text, (segment) => {
    let next = segment;
    if (config.bottom !== false) {
      next = next.replace(/^(#{1,6}\s.*)$/gm, "\n\n$1\n\n");
      next = next.replace(/\n+(#{1,6}\s.*)/g, "\n\n$1");
      next = next.replace(/(#{1,6}\s.*)\n+/g, "$1\n\n");
    } else {
      next = next.replace(/^([^#\n][^\n]+)\n+(#{1,6}\s.*)/gm, "$1\n\n$2");
    }
    next = next.replace(/^\n+(#{1,6}\s.*)/, "$1").replace(/(#{1,6}\s.*)\n+$/, "$1");
    return next;
  });
}

function capitalizeHeadings(text: string, settings: LinterSettings): string {
  const config = ruleConfig<{
    style?: string;
    "ignore-case-words"?: boolean;
    "ignore-words"?: string;
    "lowercase-words"?: string;
  }>(settings, "capitalize-headings");
  const ignoreWords = splitCsv(config["ignore-words"] ?? "");
  const lowercaseWords = splitCsv(config["lowercase-words"] ?? "");
  const ignoreCased = config["ignore-case-words"] === true;
  const style = config.style || "Title Case";

  return mapUnprotectedBlocks(text, (segment) =>
    segment.replace(
      allHeadersRegex,
      (_heading, space = "", hashes = "", gap = "", body = "", closing = "") => {
        if (style === "ALL CAPS") {
          return `${space}${hashes}${gap}${body.toUpperCase()}${closing}`;
        }

        const firstLetterOnly = style === "First letter";
        const words = body.match(/\S+/g);
        if (!words) {
          return `${space}${hashes}${gap}${body}${closing}`;
        }

        let firstWord = true;
        const converted = words.map((word: string) => {
          if (!/^[\p{L}'-]{1,}[.?!,:;\d]*$/u.test(word) || word === "-" || word === "'") {
            return word;
          }

          if (ignoreCased && word !== word.toLowerCase()) {
            firstWord = false;
            return word;
          }

          if (ignoreWords.includes(word)) {
            firstWord = false;
            return word;
          }

          const lower = word.toLowerCase();
          const shouldLowercase = lowercaseWords.includes(lower);
          const shouldCapitalize = firstWord || (!shouldLowercase && !firstLetterOnly);
          firstWord = false;
          return shouldCapitalize ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
        });

        return `${space}${hashes}${gap}${converted.join(" ")}${closing}`;
      },
    ),
  );
}

function blockquoteStyle(text: string, settings: LinterSettings): string {
  const style = String(ruleConfig<{ style?: string }>(settings, "blockquote-style").style || "space");
  return mapUnprotectedBlocks(text, (segment) =>
    segment.replace(/^(\s*(?:>\s*)+)(.*)$/gm, (_line, markers: string, rest: string) => {
      const normalized =
        style === "space" ? markers.replace(/>\s*/g, "> ").trimEnd() : markers.replace(/>\s*/g, ">");
      return `${normalized}${style === "space" && rest ? " " : ""}${rest.trimStart()}`;
    }),
  );
}

function trailingSpaces(text: string, settings: LinterSettings): string {
  const keepTwoSpaceBreak =
    ruleConfig<{ "two-space-line-break"?: boolean }>(settings, "trailing-spaces")["two-space-line-break"] ===
    true;
  return mapUnprotectedBlocks(text, (segment) => {
    if (!keepTwoSpaceBreak) {
      return segment.replace(/[ \t]+$/gm, "");
    }
    return segment
      .replace(/(\S)[ \t]$/gm, "$1")
      .replace(/(\S)[ \t]{3,}$/gm, "$1")
      .replace(/(\S)( ?\t\t? ?)$/gm, "$1");
  });
}

function consecutiveBlankLines(text: string): string {
  return trimBlankPaddingInsideQuoteWrappers(
    text.replace(/(\n([\t\v\f\r \u00a0-\u200b\u2028-\u2029\u3000]+)?){2,}\n/g, "\n\n"),
  );
}

function addBlankLineAfterYaml(text: string): string {
  return text.replace(yamlRegex, (yaml, body, offset: number) => {
    const end = offset + yaml.length;
    if (end >= text.length || text.charAt(end) !== "\n" || text.charAt(end + 1) === "\n") {
      return yaml;
    }
    return `${yaml}\n`;
  });
}

function lineBreakAtDocumentEnd(text: string): string {
  if (!text.length) {
    return text;
  }
  return `${text.replace(/\n+$/g, "")}\n`;
}

function applyCustomRegexes(text: string, settings: LinterSettings): string {
  let next = text;
  for (const regex of settings.customRegexes ?? []) {
    if (!regex.enabled || !regex.find || regex.replace === undefined) {
      continue;
    }
    next = next.replace(new RegExp(regex.find, regex.flags), regex.replace);
  }
  return next;
}

function ensureBlankLineAroundMatchingLines(text: string, predicate: (line: string) => boolean): string {
  return ensureBlankLineAroundRuns(text, predicate);
}

function ensureBlankLineAroundDelimitedBlocks(
  text: string,
  startMatch: (line: string) => RegExpMatchArray | null,
  isEnd: (line: string, marker: string) => boolean,
): string {
  const lines = text.split("\n");
  const output: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const match = startMatch(line);
    if (!match) {
      output.push(line);
      continue;
    }

    if (output.length > 0 && output[output.length - 1] !== "") {
      output.push("");
    }

    const marker = match[2] ?? match[0].trim();
    const blockLines = [line];
    let closed = false;
    index++;

    while (index < lines.length) {
      blockLines.push(lines[index]);
      if (isEnd(lines[index], marker)) {
        closed = true;
        break;
      }
      index++;
    }

    output.push(...trimBlankPaddingInsideBlockEdges(blockLines, closed));

    if (index < lines.length - 1 && lines[index + 1] !== "") {
      output.push("");
    }
  }

  return output.join("\n");
}

function trimBlankPaddingInsideQuoteWrappers(text: string): string {
  return trimBlankPaddingInsideDelimitedBlocks(
    text,
    (line) => {
      const match = line.match(quoteWrapperLineRegex);
      if (!match || !quoteWrapperFamily(match[1])) {
        return null;
      }
      return match;
    },
    (line, marker) => {
      const match = line.match(quoteWrapperLineRegex);
      return Boolean(match && quoteWrapperFamily(match[1]) === quoteWrapperFamily(marker));
    },
  );
}

function trimBlankPaddingInsideDelimitedBlocks(
  text: string,
  startMatch: (line: string) => RegExpMatchArray | null,
  isEnd: (line: string, marker: string) => boolean,
): string {
  const lines = text.split("\n");
  const output: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const match = startMatch(line);
    if (!match) {
      output.push(line);
      continue;
    }

    const marker = match[1] ?? match[0].trim();
    const blockLines = [line];
    let closed = false;
    index++;

    while (index < lines.length) {
      blockLines.push(lines[index]);
      if (isEnd(lines[index], marker)) {
        closed = true;
        break;
      }
      index++;
    }

    output.push(...trimBlankPaddingInsideBlockEdges(blockLines, closed));
  }

  return output.join("\n");
}

function trimBlankPaddingInsideBlockEdges(blockLines: string[], closed: boolean): string[] {
  if (!closed || blockLines.length < 3) {
    return blockLines;
  }

  let firstContentIndex = 1;
  let lastContentIndex = blockLines.length - 2;

  while (firstContentIndex <= lastContentIndex && blockLines[firstContentIndex].trim() === "") {
    firstContentIndex++;
  }

  while (lastContentIndex >= firstContentIndex && blockLines[lastContentIndex].trim() === "") {
    lastContentIndex--;
  }

  return [
    blockLines[0],
    ...blockLines.slice(firstContentIndex, lastContentIndex + 1),
    blockLines[blockLines.length - 1],
  ];
}

function quoteWrapperFamily(marker: string): "single" | "double" | null {
  if (/^["“”]+$/.test(marker)) {
    return "double";
  }
  if (/^['‘’]+$/.test(marker)) {
    return "single";
  }
  return null;
}

function ensureBlankLineAroundRuns(text: string, predicate: (line: string) => boolean): string {
  const lines = text.split("\n");
  const output: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTarget = predicate(line);
    const previous = output[output.length - 1];

    if (isTarget && output.length > 0 && previous !== "" && !predicate(previous)) {
      output.push("");
    }

    output.push(line);

    const next = lines[i + 1];
    if (isTarget && next !== undefined && next !== "" && !predicate(next)) {
      output.push("");
    }
  }

  return output.join("\n");
}

function splitCsv(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function mapLines(text: string, transform: (line: string) => string): string {
  return text
    .split("\n")
    .map((line) => transform(line))
    .join("\n");
}

function isSeparatorLikeLine(line: string): boolean {
  return horizontalRuleRegex.test(line) || repeatedMarkerOnlyLineRegex.test(line);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
