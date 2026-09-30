import { hasFileExtension, isInternalPath } from "@astrojs/internal-helpers/path";
import { defineMiddleware } from "astro:middleware";
import { resetRequestLocale, setRequestLocale } from "@core/i18n/requestLocale";
import { resolveLocale } from "@core/i18n/resolve";

export const onRequest = defineMiddleware(async (context, next) => {
  const locale = resolveLocale(
    context.request.headers.get("cookie"),
    context.request.headers.get("accept-language"),
  );
  context.locals.locale = locale;
  setRequestLocale(locale);

  try {
    const pathname = decodeURI(context.url.pathname);

    if (pathname.length > 1 && pathname.endsWith("/") && isInternalPath(pathname)) {
      const target = pathname.replace(/\/+$/, "") || "/";
      return context.redirect(`${target}${context.url.search}`, 308);
    }

    if (
      pathname !== "/" &&
      !pathname.endsWith("/") &&
      !isInternalPath(pathname) &&
      !hasFileExtension(pathname)
    ) {
      return context.redirect(`${pathname}/`, 308);
    }

    if (pathname === "/404/" || pathname === "/404") {
      return next();
    }

    const response = await next();
    if (response.status === 404) {
      const url = new URL("/404/", context.url);
      url.searchParams.set("path", pathname);
      return context.rewrite(`${url.pathname}${url.search}`);
    }

    return response;
  } finally {
    resetRequestLocale();
  }
});
