/** Ship non-English message catalogs for static-host client locale hydration. */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { en } from "../src/core/i18n/locales/en.ts";
import { es } from "../src/core/i18n/locales/es.ts";
import { ptBR } from "../src/core/i18n/locales/pt-BR.ts";

const publicDir = fileURLToPath(new URL("../public/i18n", import.meta.url));
mkdirSync(publicDir, { recursive: true });

for (const [locale, catalog] of [
  ["en", en],
  ["pt-BR", ptBR],
  ["es", es],
]) {
  writeFileSync(`${publicDir}/${locale}.json`, `${JSON.stringify(catalog)}\n`, "utf8");
}

console.log("Wrote client i18n catalogs to apps/web/public/i18n/");
