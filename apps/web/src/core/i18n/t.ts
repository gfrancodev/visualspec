import { catalogs, DEFAULT_LOCALE } from "./catalogs";
import { getRequestLocale } from "./requestLocale";
import { htmlLangAttr, isLocale, parseLocaleCookie } from "./resolve";
import type { Locale, MessageKey, Messages } from "./types";

export { htmlLangAttr, isLocale, LOCALE_COOKIE, parseLocaleCookie, resolveLocale } from "./resolve";
export { resetRequestLocale, setRequestLocale } from "./requestLocale";

export function getLocale(hint?: Locale): Locale {
  if (hint) return hint;

  if (typeof document !== "undefined") {
    const fromCookie = parseLocaleCookie(document.cookie);
    if (fromCookie) return fromCookie;
    const lang = document.documentElement.getAttribute("lang");
    if (lang && isLocale(lang)) return lang;
  }

  return getRequestLocale();
}

export function getMessages(locale: Locale = getLocale()): Messages {
  return catalogs[locale] as Messages;
}

function resolvePath(tree: Record<string, unknown>, path: string): unknown {
  let current: unknown = tree;
  for (const segment of path.split(".")) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function t(
  key: MessageKey,
  params?: Record<string, string | number>,
  locale: Locale = getLocale(),
): string {
  const value = resolvePath(catalogs[locale] as unknown as Record<string, unknown>, key);
  if (typeof value !== "string") {
    throw new Error(`Missing i18n string for key: ${key}`);
  }
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, name: string) => {
    const replacement = params[name];
    return replacement !== undefined ? String(replacement) : `{${name}}`;
  });
}

/** @deprecated Use htmlLangAttr(getLocale()) in layouts. Kept for importers expecting a string at module load. */
export const htmlLang = htmlLangAttr(DEFAULT_LOCALE);
