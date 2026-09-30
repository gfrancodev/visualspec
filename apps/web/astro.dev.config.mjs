import vercel from "@astrojs/vercel";
import { mergeConfig } from "astro/config";
import base from "./astro.config.mjs";

/**
 * Dev-only: SSR so middleware receives cookies (`vs_locale`).
 * Vercel adapter silences the “no adapter” warning in dev; `pnpm build` uses astro.config.mjs (static, no adapter).
 */
export default mergeConfig(base, {
  output: "server",
  adapter: vercel(),
});
