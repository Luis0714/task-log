import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths()],

  test: {
    environment: "node",

    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    globals: false,

    coverage: {
      provider: "v8",

      reporter: [
        "text",
        "html",
        "lcov",
      ],

      reportsDirectory: "./coverage",

      exclude: [
        "coverage/**",
        ".next/**",
        "node_modules/**",
        "**/*.d.ts",
        "**/__tests__/**",
      ],
    },
  },

  resolve: {
    alias: {
      "@": resolve(here, "src"),
      "server-only": resolve(here, "src/lib/test-shims/server-only.ts"),
    },
  },
});