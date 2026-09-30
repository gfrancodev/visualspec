import { componentsPath, tryReadJson } from "@core";

export interface ComponentEntry {
  kind: string;
  title: string;
  summary: string;
  anatomy?: Array<{ name: string; required?: boolean; description?: string }>;
  states?: unknown[];
  keyboard?: unknown[];
  accessibility?: unknown;
  motion?: unknown;
  mappings?: Record<string, string>;
}

export function loadComponents(): ComponentEntry[] {
  return tryReadJson<ComponentEntry[]>(componentsPath) || [];
}

export function getStaticPaths() {
  return loadComponents().map((component) => ({ params: { slug: component.kind } }));
}
