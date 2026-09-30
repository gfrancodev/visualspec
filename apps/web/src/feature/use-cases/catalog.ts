import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { examplesDir, examplesIndexPath, readJson, repoRoot } from "@core/fs/repo-root";

export interface UseCaseArtifact {
  slug: string;
  kind: string;
  preview: string;
  download: string;
}

export interface UseCaseTarget {
  file: string;
  slug: string;
  title: string;
  profiles: string[];
  model: string;
}

export interface UseCaseExample {
  file: string;
  title: string;
  profiles: string[];
}

export interface UseCaseEntry {
  file: string;
  title: string;
  profiles: string[];
  slug: string;
  preview: string;
  download: string;
  artifactKind: string;
  modelLabel: string | null;
  ready: boolean;
  target: UseCaseTarget | null;
  artifact: UseCaseArtifact | undefined;
}

const here = dirname(fileURLToPath(import.meta.url));
export const useCaseArtifactsCatalogPath = join(here, "artifacts.json");
export const useCaseTargetsPath = join(here, "targets.json");

function readCatalogFile<T>(absolutePath: string): T[] {
  if (!existsSync(absolutePath)) return [];
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T[];
}

export function readUseCaseArtifactsCatalog(): UseCaseArtifact[] {
  return readCatalogFile<UseCaseArtifact>(useCaseArtifactsCatalogPath);
}

export function readUseCaseTargets(): UseCaseTarget[] {
  return readCatalogFile<UseCaseTarget>(useCaseTargetsPath);
}

export function getUseCaseArtifact(slug: string): UseCaseArtifact | undefined {
  return readUseCaseArtifactsCatalog().find((item) => item.slug === slug);
}

export function useCaseArtifactReady(slug: string): boolean {
  return existsSync(join(repoRoot, "apps/web/public/targets", slug, "index.html"));
}

export function listUseCases(): UseCaseEntry[] {
  const targetsBySlug = new Map(readUseCaseTargets().map((item) => [item.slug, item]));
  const examples = readJson<UseCaseExample[]>(examplesIndexPath);
  return examples.map((example) => {
    const slug = example.file.replace(/\.json$/, "");
    const target = targetsBySlug.get(slug) ?? null;
    const artifact = getUseCaseArtifact(slug);
    const preview = artifact?.preview ?? `/targets/${slug}/index.html`;
    return {
      ...example,
      slug,
      preview,
      download: artifact?.download ?? preview,
      artifactKind: artifact?.kind ?? "html",
      modelLabel: target ? `${target.model} · xhigh` : null,
      ready: useCaseArtifactReady(slug),
      target,
      artifact,
    };
  });
}

export function getUseCase(slug: string): UseCaseEntry | undefined {
  return listUseCases().find((item) => item.slug === slug);
}

export function getStaticPaths() {
  return listUseCases().map((item) => ({ params: { slug: item.slug } }));
}

export function readUseCaseDocument(file: string): unknown {
  return readJson(join(examplesDir, file));
}
