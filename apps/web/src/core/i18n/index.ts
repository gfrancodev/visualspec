/**
 * Internationalization for @visualspec/web (`en`, `pt-BR`, `es`).
 * See apps/web/I18N.md for locale resolution and content scope.
 */
export { DEFAULT_LOCALE, catalogs, locales } from "./catalogs";
export {
  MAIN_NAV,
  MOBILE_EXTRA_NAV,
  SITE_NAV,
  mainNavItems,
  mobileExtraNavItems,
  siteNavItems,
} from "./nav";
export { getLocale, getMessages, htmlLang, htmlLangAttr, t } from "./t";
export { LOCALE_COOKIE, resolveLocale } from "./resolve";
export type { Locale, MessageKey, Messages, SiteNavId } from "./types";
