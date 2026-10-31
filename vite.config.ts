import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

const EXTERNAL_IDS = new Set([
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
]);

const isExternal = (id: string): boolean => {
  if (EXTERNAL_IDS.has(id)) return true;
  if (id.startsWith("@mui/")) return true;
  if (id.startsWith("@emotion/")) return true;
  if (id.startsWith("@tiptap/")) return true;
  return false;
};

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src"],
      exclude: [
        "src/**/*.stories.tsx",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
      ],
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
      // `rich-text` es una entrada aparte: depende de tiptap (peer opcional).
      entry: {
        index: resolve(process.cwd(), "src/index.ts"),
        "rich-text": resolve(process.cwd(), "src/rich-text.tsx"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "js" : "cjs"}`,
      cssFileName: "tokens",
    },
    rollupOptions: {
      external: isExternal,
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    minify: "esbuild",
  },
});
