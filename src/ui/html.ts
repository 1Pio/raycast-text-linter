import { marked } from "marked";

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, {
    async: false,
    breaks: false,
    gfm: true,
  }) as string;
}
