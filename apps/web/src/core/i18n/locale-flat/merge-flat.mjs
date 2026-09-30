import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL(".", import.meta.url));
const locale = process.argv[2];
const patchName = process.argv[3];
if (!locale || !patchName) {
  console.error("Usage: node merge-flat.mjs <pt-BR|es> <patch.json>");
  process.exit(1);
}

const base = JSON.parse(readFileSync(`${dir}/${locale}.json`, "utf8"));
const patch = JSON.parse(readFileSync(`${dir}/${patchName}`, "utf8"));
writeFileSync(`${dir}/${locale}.json`, JSON.stringify({ ...base, ...patch }, null, 2) + "\n");
