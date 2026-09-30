import { getLocale, t } from "./t";
import type { Locale, MessageKey, SiteNavId } from "./types";

const MAIN_NAV = [
  { labelKey: "nav.learn", href: "/learn/" },
  { labelKey: "nav.specification", href: "/specification/1.0/" },
  { labelKey: "nav.reference", href: "/reference/" },
  { labelKey: "nav.useCases", href: "/use-cases/" },
] as const satisfies ReadonlyArray<{ labelKey: MessageKey; href: string }>;

const MOBILE_EXTRA_NAV = [
  { labelKey: "nav.schemas", href: "/schemas/" },
  { labelKey: "nav.referenceExplorer", href: "/reference-explorer/" },
  { labelKey: "nav.ecosystem", href: "/ecosystem/" },
  { labelKey: "nav.rfcs", href: "/rfcs/" },
] as const satisfies ReadonlyArray<{ labelKey: MessageKey; href: string }>;

const SITE_NAV = [
  { labelKey: "nav.reference", href: "/reference/", id: "reference" },
  { labelKey: "nav.schemas", href: "/schemas/", id: "schemas" },
  { labelKey: "nav.components", href: "/components/", id: "components" },
  { labelKey: "nav.ecosystem", href: "/ecosystem/", id: "ecosystem" },
  { labelKey: "nav.rfcs", href: "/rfcs/", id: "rfcs" },
  { labelKey: "nav.contributing", href: "/learn/contributing/", id: "contributing" },
] as const satisfies ReadonlyArray<{ labelKey: MessageKey; href: string; id: SiteNavId }>;

export function mainNavItems(locale: Locale = getLocale()) {
  return MAIN_NAV.map(({ labelKey, href }) => ({
    label: t(labelKey, undefined, locale),
    href,
  }));
}

export function mobileExtraNavItems(locale: Locale = getLocale()) {
  return MOBILE_EXTRA_NAV.map(({ labelKey, href }) => ({
    label: t(labelKey, undefined, locale),
    href,
  }));
}

export function siteNavItems(locale: Locale = getLocale()) {
  return SITE_NAV.map(({ labelKey, href, id }) => ({
    label: t(labelKey, undefined, locale),
    href,
    id,
  }));
}
