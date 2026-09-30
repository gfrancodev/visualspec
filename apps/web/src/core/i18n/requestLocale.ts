import { DEFAULT_LOCALE } from "./catalogs";
import type { Locale } from "./types";

let activeLocale: Locale = DEFAULT_LOCALE;

export function setRequestLocale(locale: Locale): void {
  activeLocale = locale;
}

export function getRequestLocale(): Locale {
  return activeLocale;
}

export function resetRequestLocale(): void {
  activeLocale = DEFAULT_LOCALE;
}
