import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { en } from "./locales/en.ts";

const dir = fileURLToPath(new URL(".", import.meta.url));

/** Parse paths like `home.principles[0].title` or `home.sources[0][1]`. */
function parsePath(path) {
  const segments = [];
  const re = /([^.\[\]]+)|\[(\d+)\]/g;
  let m;
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) segments.push(m[1]);
    else if (m[2] !== undefined) segments.push(Number(m[2]));
  }
  return segments;
}

function setByPath(root, path, value) {
  const segments = parsePath(path);
  if (segments.length === 0) return;
  let cur = root;
  for (let i = 0; i < segments.length - 1; i++) {
    cur = cur[segments[i]];
  }
  cur[segments[segments.length - 1]] = value;
}

function applyFlat(tree, flat) {
  for (const [path, value] of Object.entries(flat)) {
    setByPath(tree, path, value);
  }
}

const locale = process.argv[2];
if (!locale || !["pt-BR", "es"].includes(locale)) {
  console.error("Usage: node build-locale-file.mjs <pt-BR|es>");
  process.exit(1);
}

const flat = JSON.parse(
  readFileSync(`${dir}/locale-flat/${locale}.json`, "utf8"),
);
const clone = structuredClone(en);
applyFlat(clone, flat);

const exportName = locale === "pt-BR" ? "ptBR" : "es";
const outPath = `${dir}/locales/${locale}.ts`;
writeFileSync(
  outPath,
  `export const ${exportName} = ${JSON.stringify(clone, null, 2)} as const;\n`,
  "utf8",
);

console.log(`Wrote ${outPath}`);
