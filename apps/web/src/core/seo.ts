import { getMessages } from "./i18n";

const meta = getMessages().meta;

export const SITE = {
  origin: "https://visualspec.dev",
  name: meta.siteName,
  description: meta.siteDescription,
  schemaId: "https://visualspec.dev/schema/1.0/schema.json",
  github: "https://github.com/gfrancodev/visualspec",
  license: "https://www.apache.org/licenses/LICENSE-2.0",
  author: "Gustavo Franco",
  authorUrl: "https://github.com/gfrancodev",
  locale: "en_US",
  ogImage: "https://visualspec.dev/og.png",
  ogImageAlt: meta.ogImageAlt,
  version: "1.0.0-rc.1",
  format: "visualSpec 1.0",
} as const;

export function canonicalPath(pathname: string): string {
  const raw = pathname.split("?")[0] || "/";
  if (raw === "/") return "/";
  if (/\.[a-z0-9]+$/i.test(raw)) return raw;
  return raw.endsWith("/") ? raw : `${raw}/`;
}

export function canonicalUrl(pathname: string): string {
  return new URL(canonicalPath(pathname), SITE.origin).href;
}

export function documentTitle(title: string): string {
  if (title === SITE.name || title === "Visual Spec") {
    return meta.defaultDocumentTitle;
  }
  if (title.includes(SITE.name)) return title;
  return meta.documentTitleSuffix.replace("{title}", title);
}

export function siteJsonLd(options: {
  title: string;
  description: string;
  url: string;
  pageType: "website" | "article";
}) {
  const pageType = options.pageType === "article" ? "TechArticle" : "WebPage";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.origin}/#organization`,
        name: SITE.name,
        url: `${SITE.origin}/`,
        logo: {
          "@type": "ImageObject",
          url: `${SITE.origin}/favicon.svg`,
        },
        sameAs: [SITE.github, SITE.authorUrl],
      },
      {
        "@type": "Person",
        "@id": `${SITE.origin}/#author`,
        name: SITE.author,
        url: SITE.authorUrl,
        sameAs: [SITE.authorUrl],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.origin}/#website`,
        url: `${SITE.origin}/`,
        name: SITE.name,
        alternateName: ["visualspec", "Visual IR", "visualSpec"],
        description: SITE.description,
        inLanguage: "en",
        publisher: { "@id": `${SITE.origin}/#organization` },
        license: SITE.license,
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": `${SITE.origin}/#format`,
        name: SITE.name,
        alternateName: ["Visual IR", "visualSpec", "visualspec"],
        description: SITE.description,
        url: `${SITE.origin}/`,
        codeRepository: SITE.github,
        license: SITE.license,
        programmingLanguage: "JSON",
        runtimePlatform: "JSON Schema Draft 2020-12",
        version: SITE.version,
        creator: { "@id": `${SITE.origin}/#author` },
        identifier: SITE.schemaId,
        keywords: [
          "Visual Spec",
          "Visual IR",
          "visual intermediate representation",
          "JSON Schema",
          "visual intent",
          "visualSpec",
        ],
      },
      {
        "@type": "Dataset",
        "@id": SITE.schemaId,
        name: "Visual Spec 1.0 JSON Schema",
        description:
          "JSON Schema Draft 2020-12 distribution for visualSpec 1.0 documents, including semantic rules and profile specializations.",
        url: SITE.schemaId,
        license: SITE.license,
        isAccessibleForFree: true,
        creator: { "@id": `${SITE.origin}/#author` },
        identifier: SITE.schemaId,
        encodingFormat: "application/schema+json",
      },
      {
        "@type": pageType,
        "@id": `${options.url}#webpage`,
        url: options.url,
        name: options.title,
        headline: options.title,
        description: options.description,
        isPartOf: { "@id": `${SITE.origin}/#website` },
        about: { "@id": `${SITE.origin}/#format` },
        inLanguage: "en",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: SITE.ogImage,
        },
        author: { "@id": `${SITE.origin}/#author` },
        publisher: { "@id": `${SITE.origin}/#organization` },
        license: SITE.license,
      },
    ],
  };
}
