import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderMarkdown, specificationDir } from "@core";

export interface SpecPage {
  name: string;
  href: string;
  label: string;
}

export function listSpecFiles(): string[] {
  if (!existsSync(specificationDir)) return [];
  return readdirSync(specificationDir)
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => {
      if (a === "index.md") return -1;
      if (b === "index.md") return 1;
      return a.localeCompare(b);
    });
}

export function sidebarPages(): SpecPage[] {
  return listSpecFiles()
    .filter((name) => name !== "index.md")
    .map((name) => {
      const slug = name.replace(/\.md$/, "");
      return { name: slug, href: `/specification/1.0/${slug}/`, label: slug.replace(/-/g, " ") };
    });
}

export function readSpecMarkdown(fileName: string): string | null {
  const filePath = join(specificationDir, fileName);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf8");
}

export function renderSpecFile(fileName: string): string | null {
  const source = readSpecMarkdown(fileName);
  return source ? renderMarkdown(source) : null;
}

export function getStaticPaths() {
  return listSpecFiles()
    .filter((name) => name !== "index.md")
    .map((name) => ({ params: { slug: name.replace(/\.md$/, "") } }));
}
