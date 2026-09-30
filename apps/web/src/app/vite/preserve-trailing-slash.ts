import { hasFileExtension, isInternalPath } from "@astrojs/internal-helpers/path";
import type { Plugin } from "vite";

/**
 * Astro dev inserts `devTrailingSlash`, which returns a generic 404 HTML page when
 * `trailingSlash: "always"` and the URL has no slash - before app middleware runs.
 * Patch it to 308 redirect instead (same intent as src/middleware.ts).
 */
export function preserveTrailingSlash(): Plugin {
  const redirectIfMissingSlash = (
    req: { url?: string },
    res: { writeHead: Function; end: Function },
  ): boolean => {
    const raw = req.url || "/";
    const q = raw.indexOf("?");
    const pathname = q === -1 ? raw : raw.slice(0, q);
    const search = q === -1 ? "" : raw.slice(q);
    if (pathname !== "/" && !pathname.endsWith("/") && !pathname.includes(".")) {
      res.writeHead(308, { Location: `${pathname}/${search}` });
      res.end();
      return true;
    }
    return false;
  };

  const prependSlashRedirect = (middlewares: any) => {
    middlewares.stack.unshift({
      route: "",
      handle: (
        req: { url?: string },
        res: { writeHead: Function; end: Function },
        next: Function,
      ) => {
        if (redirectIfMissingSlash(req, res)) return;
        next();
      },
    });
  };

  const patchStack = (middlewares: any) => {
    for (const layer of middlewares.stack) {
      const handle = layer.handle;
      if (typeof handle !== "function" || handle.name !== "devTrailingSlash") continue;

      const original = handle;
      layer.handle = function devTrailingSlashRedirect(
        req: { url?: string },
        res: { writeHead: Function; end: Function },
        next: Function,
      ) {
        let pathname: string;
        try {
          const url = new URL(`http://localhost${req.url}`);
          pathname = decodeURI(url.pathname);
        } catch (e) {
          return next(e);
        }
        if (isInternalPath(pathname)) {
          return original.call(this, req, res, next);
        }
        if (
          !pathname.endsWith("/") &&
          !hasFileExtension(pathname) &&
          redirectIfMissingSlash(req, res)
        ) {
          return;
        }
        return original.call(this, req, res, next);
      };
    }
  };

  return {
    name: "visualspec-patch-trailing-slash",
    enforce: "post",
    configureServer(server) {
      return () => {
        patchStack(server.middlewares);
        prependSlashRedirect(server.middlewares);
      };
    },
    configurePreviewServer(server) {
      return () => {
        patchStack(server.middlewares);
        prependSlashRedirect(server.middlewares);
      };
    },
  };
}
