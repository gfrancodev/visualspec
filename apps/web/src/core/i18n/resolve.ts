import { DEFAULT_LOCALE } from "./catalogs";
import type { Locale } from "./types";

export const LOCALE_COOKIE = "vs_locale";

const LOCALES: readonly Locale[] = ["en", "pt-BR", "es"];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function parseLocaleCookie(cookieHeader: string | null | undefined): Locale | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
  if (!match) return null;
  const raw = decodeURIComponent(match[1].trim());
  return isLocale(raw) ? raw : null;
}

/** Map Accept-Language tags to supported locales (first match wins). */
export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.split("=")[1] ?? "1") : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((c) => c.tag && c.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    if (tag === "pt-br" || tag === "pt") return "pt-BR";
    if (tag.startsWith("es")) return "es";
    if (tag.startsWith("en")) return "en";
  }

  return null;
}

/** Cookie overrides Accept-Language; both fall back to default. */
export function resolveLocale(
  cookieHeader: string | null | undefined,
  acceptLanguageHeader: string | null | undefined,
): Locale {
  return (
    parseLocaleCookie(cookieHeader) ?? parseAcceptLanguage(acceptLanguageHeader) ?? DEFAULT_LOCALE
  );
}

export function htmlLangAttr(locale: Locale): string {
  return locale;
}
