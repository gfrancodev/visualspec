import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (pathname !== "/" && !pathname.endsWith("/") && !pathname.includes(".")) {
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
});
