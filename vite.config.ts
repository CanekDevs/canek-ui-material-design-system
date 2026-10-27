import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src"],
      exclude: ["src/**/*.stories.tsx", "src/**/*.test.tsx"],
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
  build: {
    lib: {
      entry: resolve(process.cwd(), "src/index.ts"),
      name: "CanekDesignSystem",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
      cssFileName: "tokens",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@mui/material",
        "@mui/material/styles",
        "@emotion/react",
        "@emotion/styled",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@mui/material": "MaterialUI",
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    minify: "esbuild",
  },
});
