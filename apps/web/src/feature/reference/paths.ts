import { catalogPath, readJson } from "@core";

interface CatalogModule {
  name: string;
  title: string;
  description: string;
  definitions?: string[];
}

export function getStaticPaths() {
  const catalog = readJson<{ modules: CatalogModule[] }>(catalogPath);
  return catalog.modules.map((mod) => ({ params: { module: mod.name } }));
}
