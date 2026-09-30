import { docsPath, readJson } from "@core";

export interface DocEntry {
  slug: string;
  title: string;
  description: string;
  category: string;
  body: string;
}

export function loadDocs(): DocEntry[] {
  return readJson<DocEntry[]>(docsPath);
}

export function hrefFor(slug: string): string {
  return slug === "why" ? "/why/" : `/learn/${slug}/`;
}

export function getStaticPaths() {
  return loadDocs().map((doc) => ({ params: { slug: doc.slug } }));
}
