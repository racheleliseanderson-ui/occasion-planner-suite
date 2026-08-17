import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

/**
 * Salty Menu Builder — CONFIG_VERSION: nitro-fluid-v1.2.1
 * TanStack Start + Nitro Vercel Fluid
 */
export default defineConfig(({ command }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    ...(command === "build"
      ? [
          nitro({
            preset: "vercel",
            serverDir: "server",
            imports: {},
            storage: {
              cache: {
                driver: "memory",
                base: "salty-menu-builder",
              },
            },
            devStorage: {
              cache: {
                driver: "fs",
                base: "./.data/cache",
              },
            },
            vercel: {
              functions: {
                runtime: "nodejs22.x",
                regions: ["iad1"],
                maxDuration: 15,
                memory: 512,
                supportsResponseStreaming: true,
              },
              functionRules: {
                "/api/**": {
                  maxDuration: 10,
                  memory: 256,
                },
              },
            },
            routeRules: {
              "/": { isr: 600 },
              "/api/health": {
                headers: {
                  "cache-control": "no-store",
                  "access-control-allow-origin": "*",
                },
              },
              "/api/version": {
                headers: {
                  "cache-control": "no-store",
                  "access-control-allow-origin": "*",
                },
              },
              "/assets/**": {
                headers: {
                  "cache-control": "public, max-age=31536000, immutable",
                },
              },
            },
          }),
        ]
      : []),
    viteReact(),
  ],
}));
