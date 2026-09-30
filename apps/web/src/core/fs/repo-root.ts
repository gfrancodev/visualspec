import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function findRepoRoot(start: string): string {
  let dir = start;
  while (true) {
    if (existsSync(join(dir, "packages/schema")) && existsSync(join(dir, "apps/web"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error("Could not find visualspec repo root from core/fs");
    }
    dir = parent;
  }
}

export const repoRoot = findRepoRoot(dirname(fileURLToPath(import.meta.url)));

export function readJson<T = any>(absolutePath: string): T {
  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

export function tryReadJson<T = any>(absolutePath: string): T | null {
  if (!existsSync(absolutePath)) return null;
  return readJson<T>(absolutePath);
}

export function tryReadText(absolutePath: string): string | null {
  if (!existsSync(absolutePath)) return null;
  return readFileSync(absolutePath, "utf8");
}

export function listMarkdown(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));
}

export const contentDir = join(repoRoot, "content");
export const docsPath = join(contentDir, "docs.json");
export const profilesPath = join(contentDir, "profiles.json");
export const componentsPath = join(contentDir, "components.json");
export const examplesIndexPath = join(repoRoot, "packages/schema/examples/index.json");
export const examplesDir = join(repoRoot, "packages/schema/examples");
export const catalogPath = join(repoRoot, "packages/schema/schema/1.0/catalog.json");
export const rootSchemaPath = join(repoRoot, "packages/schema/schema/1.0/schema.json");
export const modulesDir = join(repoRoot, "packages/schema/schema/1.0/modules");
export const profilesSchemaDir = join(repoRoot, "packages/schema/schema/1.0/profiles");
export const specificationDir = join(repoRoot, "specification/1.0");
export const rfcsDir = join(repoRoot, "rfcs");
