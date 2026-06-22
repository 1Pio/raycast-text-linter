type Segment = {
  text: string;
  protected: boolean;
};

const yamlFrontmatterRegex = /^---\n[\s\S]*?\n---(?=\n|$)/;
const fencedBlockStartRegex = /^([ \t]*)(`{3,}|~{3,})(.*)$/;
const mathFenceRegex = /^(\s*)\${2,}\s*$/;

export function mapUnprotectedBlocks(text: string, transform: (segment: string) => string): string {
  return splitProtectedBlocks(text)
    .map((segment) => (segment.protected ? segment.text : transform(segment.text)))
    .join("");
}

export function splitProtectedBlocks(text: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  const yaml = text.match(yamlFrontmatterRegex);
  if (yaml?.index === 0) {
    segments.push({ text: yaml[0], protected: true });
    cursor = yaml[0].length;
  }

  const lines = text.slice(cursor).split(/(\n)/);
  let current = "";
  let protectedBlock = "";
  let inFence = false;
  let inMath = false;
  let fenceMarker = "";

  function flushCurrent() {
    if (current) {
      segments.push({ text: current, protected: false });
      current = "";
    }
  }

  function flushProtected() {
    if (protectedBlock) {
      segments.push({ text: protectedBlock, protected: true });
      protectedBlock = "";
    }
  }

  for (let i = 0; i < lines.length; i += 2) {
    const line = lines[i] ?? "";
    const newline = lines[i + 1] ?? "";
    const fullLine = line + newline;

    if (inFence) {
      protectedBlock += fullLine;
      if (line.trimStart().startsWith(fenceMarker)) {
        inFence = false;
        fenceMarker = "";
        flushProtected();
      }
      continue;
    }

    if (inMath) {
      protectedBlock += fullLine;
      if (mathFenceRegex.test(line)) {
        inMath = false;
        flushProtected();
      }
      continue;
    }

    const fenceMatch = line.match(fencedBlockStartRegex);
    if (fenceMatch) {
      flushCurrent();
      inFence = true;
      fenceMarker = fenceMatch[2];
      protectedBlock += fullLine;
      if (line.trim().endsWith(fenceMarker) && line.trim() !== fenceMarker) {
        inFence = false;
        fenceMarker = "";
        flushProtected();
      }
      continue;
    }

    if (mathFenceRegex.test(line)) {
      flushCurrent();
      inMath = true;
      protectedBlock += fullLine;
      continue;
    }

    current += fullLine;
  }

  flushProtected();
  flushCurrent();
  return segments;
}

export function withInlineProtection(text: string, transform: (text: string) => string): string {
  const placeholders: string[] = [];
  const token = "\uE000TEXT_LINTER_PLACEHOLDER_";

  const protect = (value: string) => {
    const placeholder = `${token}${placeholders.length}\uE001`;
    placeholders.push(value);
    return placeholder;
  };

  const protectedText = text
    .replace(/`[^`\n]+`/g, protect)
    .replace(/!\[[^\]\n]*\]\([^)]+\)/g, protect)
    .replace(/\[[^\]\n]*\]\([^)]+\)/g, protect)
    .replace(/!?\[\[[^\]\n]+\]\]/g, protect)
    .replace(/<%[\s\S]*?%>/g, protect);

  return transform(protectedText).replace(
    new RegExp(`${token}(\\d+)\\uE001`, "g"),
    (_match, index: string) => {
      return placeholders[Number(index)] ?? "";
    },
  );
}
