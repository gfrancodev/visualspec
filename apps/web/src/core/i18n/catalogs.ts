import { en } from "./locales/en";
import { es } from "./locales/es";
import { ptBR } from "./locales/pt-BR";
import type { Locale } from "./types";

export const DEFAULT_LOCALE: Locale = "en";

export const locales = ["en", "pt-BR", "es"] as const satisfies readonly Locale[];

export const catalogs = {
  en,
  "pt-BR": ptBR,
  es,
} as const;
