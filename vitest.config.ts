import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  esbuild: {
    jsx: "automatic" as unknown as undefined,
  } as Record<string, unknown>,
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
})
