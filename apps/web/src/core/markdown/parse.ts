import { marked } from "marked";
import { jsonToSpecCodeHtml, plainToSpecCodeHtml, wrapSpecWindow } from "./spec-code";

marked.setOptions({ gfm: true, breaks: false });

marked.use({
  renderer: {
    code({ text, lang }) {
      const language = (lang || "").toLowerCase();
      if (language === "json") {
        let formatted = text;
        try {
          formatted = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          /* keep source */
        }
        return wrapSpecWindow(jsonToSpecCodeHtml(formatted));
      }
      if (language === "sh" || language === "bash" || language === "shell" || language === "zsh") {
        return wrapSpecWindow(plainToSpecCodeHtml(text), {
          badge: "SHELL",
          caption: "Terminal",
        });
      }
      if (language) {
        return wrapSpecWindow(plainToSpecCodeHtml(text), {
          badge: language.toUpperCase(),
          caption: "Snippet",
        });
      }
      return wrapSpecWindow(plainToSpecCodeHtml(text), { badge: "CODE", caption: "Snippet" });
    },
  },
});

/** Parse trusted local markdown into HTML. */
export function renderMarkdown(source: string | null | undefined): string {
  return String(marked.parse(source ?? "", { async: false }));
}

/** Strip YAML frontmatter and return { meta, body }. */
export function parseFrontmatter(source?: string): { meta: Record<string, string>; body: string } {
  const text = String(source ?? "");
  if (!text.startsWith("---")) return { meta: {}, body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: text };
  const raw = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\n/, "");
  const meta: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { meta, body };
}
