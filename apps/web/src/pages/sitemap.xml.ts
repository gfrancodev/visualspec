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

const ORIGIN = "https://visualspec.dev";

function url(path: string) {
  const normalized = path.endsWith("/") || path.endsWith(".xml") ? path : `${path}/`;
  return `${ORIGIN}${normalized}`;
}

export const GET: APIRoute = () => {
  const paths = new Set<string>([
    "/",
    "/why/",
    "/learn/",
    "/specification/1.0/",
    "/reference/",
    "/schemas/",
    "/use-cases/",
    "/profiles/",
    "/components/",
    "/ecosystem/",
    "/rfcs/",
    "/reference-explorer/",
  ]);

  for (const doc of readJson<{ slug: string }[]>(docsPath)) {
    paths.add(doc.slug === "why" ? "/why/" : `/learn/${doc.slug}/`);
  }

  for (const p of readJson<{ id: string }[]>(profilesPath)) {
    paths.add(`/profiles/${p.id}/`);
  }

  for (const ex of readJson<{ file: string }[]>(examplesIndexPath)) {
    paths.add(`/use-cases/${ex.file.replace(/\.json$/, "")}/`);
  }

  for (const mod of readJson<{ modules: { name: string }[] }>(catalogPath).modules) {
    paths.add(`/reference/${mod.name}/`);
  }

  const components = tryReadJson<{ kind: string }[]>(componentsPath) || [];
  for (const c of components) {
    paths.add(`/components/${c.kind}/`);
  }

  if (existsSync(specificationDir)) {
    for (const file of readdirSync(specificationDir).filter(
      (n) => n.endsWith(".md") && n !== "index.md",
    )) {
      paths.add(`/specification/1.0/${file.replace(/\.md$/, "")}/`);
    }
  }

  if (existsSync(rfcsDir)) {
    for (const file of readdirSync(rfcsDir).filter((n) => n.endsWith(".md"))) {
      paths.add(`/rfcs/${file.replace(/\.md$/, "")}/`);
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
    ...paths,
  ]
    .sort()
    .map((p) => `  <url><loc>${url(p)}</loc></url>`)
    .join("\n")}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
