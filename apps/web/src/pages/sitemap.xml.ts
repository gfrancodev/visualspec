import { existsSync, readdirSync } from "node:fs";
import type { APIRoute } from "astro";
import {
  catalogPath,
  componentsPath,
  docsPath,
  examplesIndexPath,
  profilesPath,
  readJson,
  rfcsDir,
  specificationDir,
  tryReadJson,
} from "@core";
import { SITE } from "@core/seo";

const ORIGIN = SITE.origin;
const LASTMOD = new Date().toISOString().slice(0, 10);

function loc(path: string) {
  if (path.startsWith("http")) return path;
  const normalized = path.endsWith("/") || /\.[a-z0-9]+$/i.test(path) ? path : `${path}/`;
  return `${ORIGIN}${normalized}`;
}

function entry(path: string, changefreq: string, priority: string) {
  return `  <url><loc>${loc(path)}</loc><lastmod>${LASTMOD}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export const GET: APIRoute = () => {
  const pages: [string, string, string][] = [
    ["/", "weekly", "1.0"],
    ["/why/", "monthly", "0.8"],
    ["/learn/", "weekly", "0.8"],
    ["/specification/1.0/", "weekly", "0.9"],
    ["/reference/", "weekly", "0.8"],
    ["/schemas/", "weekly", "0.8"],
    ["/use-cases/", "weekly", "0.8"],
    ["/profiles/", "weekly", "0.8"],
    ["/components/", "monthly", "0.6"],
    ["/ecosystem/", "monthly", "0.5"],
    ["/rfcs/", "monthly", "0.5"],
    ["/reference-explorer/", "monthly", "0.4"],
    ["/llms.txt", "weekly", "0.7"],
    ["/schema/1.0/schema.json", "weekly", "0.9"],
    ["/schema/1.0/schema.bundle.json", "weekly", "0.7"],
    ["/schema/1.0/semantic-rules.json", "weekly", "0.7"],
    ["/schema/1.0/catalog.json", "weekly", "0.6"],
  ];

  for (const doc of readJson<{ slug: string }[]>(docsPath)) {
    pages.push([doc.slug === "why" ? "/why/" : `/learn/${doc.slug}/`, "monthly", "0.7"]);
  }

  for (const p of readJson<{ id: string }[]>(profilesPath)) {
    pages.push([`/profiles/${p.id}/`, "monthly", "0.7"]);
  }

  for (const ex of readJson<{ file: string }[]>(examplesIndexPath)) {
    pages.push([`/use-cases/${ex.file.replace(/\.json$/, "")}/`, "monthly", "0.6"]);
  }

  for (const mod of readJson<{ modules: { name: string }[] }>(catalogPath).modules) {
    pages.push([`/reference/${mod.name}/`, "monthly", "0.6"]);
  }

  const components = tryReadJson<{ kind: string }[]>(componentsPath) || [];
  for (const c of components) {
    pages.push([`/components/${c.kind}/`, "monthly", "0.5"]);
  }

  if (existsSync(specificationDir)) {
    for (const file of readdirSync(specificationDir).filter(
      (n) => n.endsWith(".md") && n !== "index.md",
    )) {
      pages.push([`/specification/1.0/${file.replace(/\.md$/, "")}/`, "monthly", "0.8"]);
    }
  }

  if (existsSync(rfcsDir)) {
    for (const file of readdirSync(rfcsDir).filter((n) => n.endsWith(".md"))) {
      pages.push([`/rfcs/${file.replace(/\.md$/, "")}/`, "monthly", "0.4"]);
    }
  }

  const seen = new Set<string>();
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .filter(([path]) => {
      const key = loc(path);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(([path, changefreq, priority]) => entry(path, changefreq, priority))
    .join("\n")}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
