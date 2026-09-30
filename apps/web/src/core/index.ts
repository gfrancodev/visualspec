export { default as Header } from "./components/Header.astro";
export { default as Footer } from "./components/Footer.astro";
export { default as Logo } from "./components/Logo.astro";
export { default as ThemeSwitch } from "./components/ThemeSwitch.astro";
export { default as PageHead } from "./components/PageHead.astro";
export { default as SpecWindow } from "./components/SpecWindow.astro";
export { default as DocAside } from "./components/DocAside.astro";
export { bindCopyButtons, copyText } from "./components/CopyButton";

export {
  DEFAULT_LOCALE,
  catalogs,
  locales,
  getLocale,
  getMessages,
  htmlLang,
  htmlLangAttr,
  t,
  mainNavItems,
  mobileExtraNavItems,
  siteNavItems,
} from "./i18n";
export type { Locale, MessageKey, Messages, SiteNavId } from "./i18n";

export {
  repoRoot,
  readJson,
  tryReadJson,
  tryReadText,
  listMarkdown,
  contentDir,
  docsPath,
  profilesPath,
  componentsPath,
  examplesIndexPath,
  examplesDir,
  catalogPath,
  rootSchemaPath,
  modulesDir,
  profilesSchemaDir,
  specificationDir,
  rfcsDir,
} from "./fs/repo-root";

export { renderMarkdown, parseFrontmatter } from "./markdown/parse";
export {
  escapeHtml,
  jsonToSpecCodeHtml,
  plainToSpecCodeHtml,
  wrapSpecWindow,
  formatJsonForSpecWindow,
} from "./markdown/spec-code";
