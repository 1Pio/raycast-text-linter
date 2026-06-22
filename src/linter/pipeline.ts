import type { LinterSettings, LintResult } from "./types";
import { runRulePipeline } from "./rules";

export function lintText(input: string, settings: LinterSettings): LintResult {
  const output = runRulePipeline(input, settings);
  const stats = {
    inputCharacters: input.length,
    outputCharacters: output.text.length,
    changedCharacters: Math.abs(output.text.length - input.length),
    changedLines: countChangedLines(input, output.text),
    appliedRules: output.appliedRules,
  };

  return {
    text: output.text,
    stats,
  };
}

function countChangedLines(before: string, after: string): number {
  const beforeLines = before.replace(/\r\n?/g, "\n").split("\n");
  const afterLines = after.split("\n");
  const max = Math.max(beforeLines.length, afterLines.length);
  let changed = 0;

  for (let index = 0; index < max; index++) {
    if ((beforeLines[index] ?? "") !== (afterLines[index] ?? "")) {
      changed++;
    }
  }

  return changed;
}
