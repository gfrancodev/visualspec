import { applyClientLocale, loadClientCatalog, setDocumentLocale } from "./client-apply";
import { LOCALE_COOKIE, parseLocaleCookie } from "./resolve";
import type { Locale } from "./types";

const LOCALES = new Set<Locale>(["en", "pt-BR", "es"]);

function readStoredLocale(): Locale {
  const fromCookie = parseLocaleCookie(document.cookie);
  if (fromCookie) return fromCookie;
  try {
    const stored = localStorage.getItem(LOCALE_COOKIE);
    if (stored && LOCALES.has(stored as Locale)) return stored as Locale;
  } catch {
    /* ignore */
  }
  const lang = document.documentElement.lang;
  if (lang && LOCALES.has(lang as Locale)) return lang as Locale;
  return "en";
}

let applyPromise: Promise<void> | null = null;

export async function applyLocale(locale: Locale): Promise<void> {
  if (!LOCALES.has(locale)) return;
  setDocumentLocale(locale);
  const catalog = await loadClientCatalog(locale);
  applyClientLocale(document, catalog);
  window.dispatchEvent(new CustomEvent("visualspec-locale", { detail: locale }));
}

export function persistLocale(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  try {
    localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    /* ignore */
  }
}

export async function setLocale(locale: Locale): Promise<void> {
  if (locale === readStoredLocale()) return;
  persistLocale(locale);
  applyPromise = applyLocale(locale);
  await applyPromise;
}

export function getClientLocale(): Locale {
  return readStoredLocale();
}

declare global {
  interface Window {
    visualspecLocale?: {
      getLocale: () => Locale;
      setLocale: (locale: Locale) => Promise<void>;
      applyLocale: (locale: Locale) => Promise<void>;
    };
  }
}

window.visualspecLocale = {
  getLocale: readStoredLocale,
  setLocale,
  applyLocale,
};

function bootstrap() {
  const locale = readStoredLocale();
  setDocumentLocale(locale);
  if (locale === "en") return;
  applyPromise = applyLocale(locale).catch(() => {
    /* keep English fallback if catalog fetch fails */
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
