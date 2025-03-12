/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: [
      "node_modules/**",
      "dist/**",
      "lib/**",
      "**/.{idea,git,cache,output,temp,github,.vscode,.devcontainer}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
    ],
    clearMocks: true,
    passWithNoTests: true,
    globals: true,
    watch: false,
    coverage: {
      provider: "v8",
      reporter: ["text"],
      exclude: [
        "src/executable/markdown.ts", // this is not used
        "**/index.ts",
        "**/*.js",
        "node_modules/**",
        "dist/**",
        "lib/**",
        "**/.{idea,git,cache,output,temp,github,.vscode,.devcontainer}/**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      ],
    },
  },
});
