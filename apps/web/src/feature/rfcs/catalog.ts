import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter, renderMarkdown, rfcsDir } from "@core";

export interface RfcEntry {
  slug: string;
  id: string;
  title: string;
  status: string;
}

export function loadRfcs(): RfcEntry[] {
  if (!existsSync(rfcsDir)) return [];
  const rfcs: RfcEntry[] = [];
  for (const file of readdirSync(rfcsDir)
    .filter((name) => name.endsWith(".md"))
    .sort()) {
    const raw = readFileSync(join(rfcsDir, file), "utf8");
    const { meta } = parseFrontmatter(raw);
    const slug = file.replace(/\.md$/, "");
    rfcs.push({
      slug,
      id: meta.id || slug,
      title: meta.title || slug,
      status: meta.status || "unknown",
    });
  }
  return rfcs;
}

export function loadRfc(slug: string) {
  const filePath = join(rfcsDir, `${slug}.md`);
  const raw = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  const { meta, body } = parseFrontmatter(raw);
  return {
    slug,
    html: renderMarkdown(body),
    title: meta.title || slug,
    id: meta.id || slug,
    status: meta.status || "unknown",
  };
}

export function getStaticPaths() {
  if (!existsSync(rfcsDir)) return [];
  return readdirSync(rfcsDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => ({ params: { slug: name.replace(/\.md$/, "") } }));
}
