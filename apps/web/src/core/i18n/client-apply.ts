import { formatMessage, resolveMessagePath } from "./client-path";
import type { Locale } from "./types";

type Catalog = Record<string, unknown>;

function applyToElement(
  el: Element,
  key: string,
  catalog: Catalog,
  params?: Record<string, string | number>,
) {
  const value = resolveMessagePath(catalog, key);
  const splitIdx = el.getAttribute("data-i18n-split");
  if (splitIdx != null && typeof value === "string") {
    const line = value.split("\n")[Number.parseInt(splitIdx, 10)];
    if (line !== undefined) el.textContent = line;
    return;
  }
  const formatted = formatMessage(value, params);
  if (formatted == null) return;
  if (el.hasAttribute("data-i18n-html")) {
    el.innerHTML = formatted;
  } else {
    el.textContent = formatted;
  }
}

export function applyClientLocale(root: ParentNode, catalog: Catalog) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const paramsRaw = el.getAttribute("data-i18n-params");
    let params: Record<string, string | number> | undefined;
    if (paramsRaw) {
      try {
        params = JSON.parse(paramsRaw) as Record<string, string | number>;
      } catch {
        params = undefined;
      }
    }
    applyToElement(el, key, catalog, params);
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    if (!key) return;
    const formatted = formatMessage(resolveMessagePath(catalog, key));
    if (formatted != null) el.setAttribute("aria-label", formatted);
  });

  root.querySelectorAll("[data-i18n-content]").forEach((el) => {
    const key = el.getAttribute("data-i18n-content");
    if (!key) return;
    const formatted = formatMessage(resolveMessagePath(catalog, key));
    if (formatted != null) el.setAttribute("content", formatted);
  });

  const titleEl = document.querySelector("title[data-i18n]");
  if (titleEl) {
    const key = titleEl.getAttribute("data-i18n");
    if (key) {
      const formatted = formatMessage(resolveMessagePath(catalog, key));
      if (formatted != null) titleEl.textContent = formatted;
    }
  }

  const metaDesc = document.querySelector('meta[name="description"][data-i18n-content]');
  if (metaDesc) {
    const key = metaDesc.getAttribute("data-i18n-content");
    if (key) {
      const formatted = formatMessage(resolveMessagePath(catalog, key));
      if (formatted != null) metaDesc.setAttribute("content", formatted);
    }
  }
}

const catalogCache = new Map<Locale, Catalog>();

export async function loadClientCatalog(locale: Locale): Promise<Catalog> {
  const cached = catalogCache.get(locale);
  if (cached) return cached;
  const response = await fetch(`/i18n/${encodeURIComponent(locale)}.json`, {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(`Failed to load i18n catalog: ${locale}`);
  const catalog = (await response.json()) as Catalog;
  catalogCache.set(locale, catalog);
  return catalog;
}

export function setDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dataset.clientLocale = locale;
}
