/** Write /llms.txt and /llms-full.txt for crawlers and language models. */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://visualspec.dev";
const publicDir = join(root, "apps/web/public");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function link(title, path, note) {
  const url = path.startsWith("http") ? path : `${origin}${path}`;
  return note ? `- [${title}](${url}): ${note}` : `- [${title}](${url})`;
}

const docs = readJson(join(root, "content/docs.json"));
const profiles = readJson(join(root, "content/profiles.json"));
const examples = readJson(join(root, "packages/schema/examples/index.json"));
const specDir = join(root, "specification/1.0");
const specFiles = readdirSync(specDir)
  .filter((name) => name.endsWith(".md"))
  .sort((a, b) => {
    if (a === "index.md") return -1;
    if (b === "index.md") return 1;
    return a.localeCompare(b);
  });

const specLinks = specFiles.map((file) => {
  const slug = file.replace(/\.md$/, "");
  const path = slug === "index" ? "/specification/1.0/" : `/specification/1.0/${slug}/`;
  const label =
    slug === "index"
      ? "Visual Spec 1.0"
      : slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return link(label, path, slug === "index" ? "Normative specification" : undefined);
});

const learnLinks = docs.map((doc) => {
  const path = doc.slug === "why" ? "/why/" : `/learn/${doc.slug}/`;
  return link(doc.title, path, doc.description);
});

const profileLinks = profiles.map((profile) =>
  link(profile.title, `/profiles/${profile.id}/`, profile.description),
);

const useCaseLinks = examples.map((example) => {
  const slug = example.file.replace(/\.json$/, "");
  return link(example.title, `/use-cases/${slug}/`, example.profiles.join(", "));
});

const llms = `# Visual Spec

> Visual Spec is an open visual intermediate representation (Visual IR): a machine-readable JSON contract for visual intent, independent of tool, framework, or platform.

The document format is visualSpec 1.0 (release 1.0.0-rc.1). Canonical schema id: ${origin}/schema/1.0/schema.json. License: Apache-2.0. Maintainer: Gustavo Franco.

Visual Spec is not a UI library, renderer, game engine, or replacement for HTML, CSS, Figma, glTF, USD, Flutter, SwiftUI, Compose, Unity, or Unreal. It records what exists, how it appears, how it behaves, how it moves, and which evidence defines the expected result.

## Specification

${specLinks.join("\n")}

## Schema

${link("Root JSON Schema 1.0", "/schema/1.0/schema.json", "Canonical schema id")}
${link("Standalone schema bundle", "/schema/1.0/schema.bundle.json")}
${link("Semantic rules", "/schema/1.0/semantic-rules.json")}
${link("Schema catalog", "/schema/1.0/catalog.json")}
${link("Schema reference", "/reference/", "Generated module reference")}
${link("Schema downloads", "/schemas/")}

## Learn

${learnLinks.join("\n")}

## Profiles

${profileLinks.join("\n")}

## Use cases

${useCaseLinks.join("\n")}

## Optional

${link("Full text for language models", "/llms-full.txt")}
${link("GitHub repository", "https://github.com/gfrancodev/visualspec")}
${link("Apache License 2.0", "https://www.apache.org/licenses/LICENSE-2.0")}
`;

const specFull = specFiles
  .map((file) => {
    const body = readFileSync(join(specDir, file), "utf8").trim();
    const slug = file.replace(/\.md$/, "");
    const url =
      slug === "index" ? `${origin}/specification/1.0/` : `${origin}/specification/1.0/${slug}/`;
    return `URL: ${url}\n\n${body}`;
  })
  .join("\n\n---\n\n");

const llmsFull = `# Visual Spec

Canonical site: ${origin}
Schema id: ${origin}/schema/1.0/schema.json
Repository: https://github.com/gfrancodev/visualspec
Format: visualSpec 1.0
Release: 1.0.0-rc.1
License: Apache-2.0

For a compact index see ${origin}/llms.txt

---

${specFull}
`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, "llms.txt"), `${llms.trim()}\n`);
writeFileSync(join(publicDir, "llms-full.txt"), `${llmsFull.trim()}\n`);
console.log("Wrote apps/web/public/llms.txt and llms-full.txt");
