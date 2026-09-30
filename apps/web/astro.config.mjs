import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { fileURLToPath } from "node:url";
import { preserveTrailingSlash } from "./src/app/vite/preserve-trailing-slash";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  site: "https://visualspec.dev",
  integrations: [react()],
  trailingSlash: "ignore",
  server: { port: 4321 },
  vite: {
    plugins: [preserveTrailingSlash()],
    resolve: {
      alias: {
        "@core": `${srcDir}/core`,
        "@feature": `${srcDir}/feature`,
        "@app": `${srcDir}/app`,
      },
    },
    server: {
      fs: { allow: ["../.."] },
      watch: {
        usePolling: true,
        interval: 1000,
        ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
      },
    },
  },
});
