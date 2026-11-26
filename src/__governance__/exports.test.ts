/// <reference types="vite/client" />
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as charts from "../charts";
import * as main from "../index";
import * as richText from "../rich-text";

/*
 * API pública: todo lo que exporta la carpeta de un componente debe llegar a una entrada del
 * paquete, las entradas de `package.json` deben coincidir con las de Vite y la entrada principal
 * no debe arrastrar peers opcionales (tiptap, @mui/x-charts).
 */
const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const COMPONENTS_DIR = join(SRC, "components");

const folderIndexes = import.meta.glob<Record<string, unknown>>("../components/*/index.ts", {
  eager: true,
});
const chartsIndex = import.meta.glob<Record<string, unknown>>(
  "../components/CnCharts/charts-index.ts",
  { eager: true },
);

/** Carpeta → entrada pública donde deben estar sus exports (por defecto, la principal). */
// Carpetas que viven en la entrada `/rich-text` porque usan el editor (tiptap, peer opcional).
const RICH_TEXT_FOLDERS = ["CnRichTextField", "CnEmailComposer"];
const RICH_TEXT_ENTRIES = [
  { label: "rich-text", keys: new Set(Object.keys(richText)) },
  { label: "index", keys: new Set(Object.keys(main)) },
];
const ENTRY_OF_FOLDER: Record<string, { label: string; keys: Set<string> }[]> = Object.fromEntries(
  RICH_TEXT_FOLDERS.map((folder) => [folder, RICH_TEXT_ENTRIES]),
);
const MAIN = [{ label: "index", keys: new Set(Object.keys(main)) }];

/**
 * Exports de carpeta que se comparten entre componentes pero NO son API pública. Cada uno lleva
 * su motivo; agregar uno nuevo requiere justificarlo en el PR.
 */
const INTERNAL_EXPORTS: Record<string, string> = {
  "CnSkeleton.CnSkeletonPartContext":
    "Contexto interno del kit; los skeletons usan `useSkeletonGroup`.",
  "CnTimeline.dayKey": "Utilidad de fechas compartida con `CnNotificationCenter`.",
  "CnTimeline.formatAbsolute": "Utilidad de fechas compartida con `CnNotificationCenter`.",
  "CnTimeline.formatClock": "Utilidad de fechas compartida con `CnNotificationCenter`.",
  "CnTimeline.formatDayLabel": "Utilidad de fechas compartida con `CnNotificationCenter`.",
  "CnTimeline.formatRelative":
    "Choca con `formatRelative` público de `CnDataTable`; uso interno con `CnNotificationCenter`.",
  "CnTimeline.groupByDay": "Utilidad de fechas compartida con `CnNotificationCenter`.",
  "CnTimeline.toValidDate": "Utilidad de fechas compartida con `CnNotificationCenter`.",
  "CnTimeline.CnDateInput": "Tipo de las utilidades internas de fechas.",
  "CnTimeline.CnDayGroup": "Tipo de las utilidades internas de fechas.",
  "CnDataTable.zipStore": "Serializador de bajo nivel; lo público es `exportRows`/`rowsToXlsx`.",
  "CnDataTable.rowsToDelimited":
    "Serializador de bajo nivel; lo público es `exportRows`/`serializeRows`.",
  "CnDataTable.rowsToHtmlTable":
    "Serializador de bajo nivel; lo público es `exportRows`/`serializeRows`.",
  "CnDataTable.rowsToJson":
    "Serializador de bajo nivel; lo público es `exportRows`/`serializeRows`.",
};

const folderOf = (path: string) => path.split("/").slice(-2, -1)[0];

const ENTRY_FILES = {
  index: join(SRC, "index.ts"),
  charts: join(SRC, "charts.ts"),
  "rich-text": join(SRC, "rich-text.tsx"),
};

/** Nombres de `export type { A, B as C }` de un archivo. */
const typeExportNames = (text: string): string[] =>
  [...text.matchAll(/export\s+type\s*\{([^}]*)\}/g)].flatMap((match) =>
    match[1]
      .split(",")
      .map((part) =>
        part
          .trim()
          .split(/\s+as\s+/)
          .pop()!
          .trim(),
      )
      .filter(Boolean),
  );

describe("exports públicos", () => {
  it("cada export de valor de una carpeta llega a su entrada pública", () => {
    const missing: string[] = [];
    for (const [path, mod] of Object.entries(folderIndexes)) {
      const folder = folderOf(path);
      const entries = ENTRY_OF_FOLDER[folder] ?? MAIN;
      for (const name of Object.keys(mod)) {
        if (`${folder}.${name}` in INTERNAL_EXPORTS) continue;
        if (!entries.some((entry) => entry.keys.has(name))) {
          missing.push(`${folder}.${name} → ${entries.map((e) => e.label).join(" | ")}`);
        }
      }
    }
    for (const mod of Object.values(chartsIndex)) {
      for (const name of Object.keys(mod)) {
        if (!(name in charts)) missing.push(`CnCharts/charts-index.${name} → charts`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("cada export de tipo de una carpeta aparece en su entrada pública", () => {
    const entryText = Object.fromEntries(
      Object.entries(ENTRY_FILES).map(([label, file]) => [label, readFileSync(file, "utf8")]),
    ) as Record<keyof typeof ENTRY_FILES, string>;
    const missing: string[] = [];
    for (const folder of readdirSync(COMPONENTS_DIR)) {
      const indexFile = join(COMPONENTS_DIR, folder, "index.ts");
      if (!existsSync(indexFile)) continue;
      const labels: (keyof typeof ENTRY_FILES)[] = RICH_TEXT_FOLDERS.includes(folder)
        ? ["rich-text", "index"]
        : ["index"];
      const wildcard = labels.some((label) =>
        entryText[label].includes(`export * from "./components/${folder}"`),
      );
      if (wildcard) continue;
      for (const name of typeExportNames(readFileSync(indexFile, "utf8"))) {
        if (`${folder}.${name}` in INTERNAL_EXPORTS) continue;
        const word = new RegExp(`\\b${name}\\b`);
        if (!labels.some((label) => word.test(entryText[label]))) {
          missing.push(`${folder}: type ${name}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("las excepciones internas siguen existiendo en su carpeta", () => {
    const stale = Object.keys(INTERNAL_EXPORTS).filter((key) => {
      const [folder, name] = key.split(".");
      const indexFile = join(COMPONENTS_DIR, folder, "index.ts");
      return (
        !existsSync(indexFile) || !new RegExp(`\\b${name}\\b`).test(readFileSync(indexFile, "utf8"))
      );
    });
    expect(stale).toEqual([]);
  });

  it("la entrada principal no expone el editor ni las gráficas de @mui/x-charts", () => {
    expect("CnRichTextField" in main).toBe(false);
    expect("CnBarChart" in main).toBe(false);
    expect("CnBarChart" in charts).toBe(true);
    expect("CnRichTextField" in richText).toBe(true);
  });

  it("package.json exports coincide con las entradas de vite.config.ts", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      exports: Record<string, string | Record<string, string>>;
      main: string;
      module: string;
      types: string;
    };
    const vite = readFileSync(join(ROOT, "vite.config.ts"), "utf8");
    const entryBlock = vite.match(/entry:\s*\{([\s\S]*?)\n\s*\},/)?.[1] ?? "";
    const viteEntries = [...entryBlock.matchAll(/^\s*"?([\w-]+)"?\s*:\s*resolve\(/gm)]
      .map((match) => match[1])
      .sort();
    const cssName = vite.match(/cssFileName:\s*"([\w-]+)"/)?.[1];

    const jsExports = Object.entries(pkg.exports).filter(([, value]) => typeof value !== "string");
    const pkgEntries = jsExports.map(([key]) => (key === "." ? "index" : key.slice(2))).sort();
    expect(pkgEntries).toEqual(viteEntries);

    for (const [key, value] of jsExports) {
      const name = key === "." ? "index" : key.slice(2);
      expect(value).toEqual({
        types: `./dist/${name}.d.ts`,
        import: `./dist/${name}.js`,
        require: `./dist/${name}.cjs`,
      });
    }
    expect(pkg.main).toBe("./dist/index.cjs");
    expect(pkg.module).toBe("./dist/index.js");
    expect(pkg.types).toBe("./dist/index.d.ts");
    expect(pkg.exports["./styles.css"]).toBe(`./dist/${cssName}.css`);
    expect(Object.keys(ENTRY_FILES).sort()).toEqual(viteEntries);
  });

  it("la entrada principal no importa peers opcionales (tiptap, @mui/x-charts)", () => {
    const OPTIONAL_PEER = /from\s+"(@tiptap\/[^"]+|@mui\/x-charts[^"]*)"/;
    const SPECIFIER =
      /(?:import|export)\s[^;]*?from\s+"(\.{1,2}\/[^"]+)"|import\s+"(\.{1,2}\/[^"]+)"/g;
    const resolveFile = (from: string, spec: string): string | null => {
      const base = resolve(dirname(from), spec);
      for (const candidate of [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        join(base, "index.ts"),
        join(base, "index.tsx"),
      ]) {
        if (existsSync(candidate) && /\.tsx?$/.test(candidate)) return candidate;
      }
      return null;
    };
    const seen = new Set<string>();
    const offenders: string[] = [];
    const queue = [ENTRY_FILES.index];
    while (queue.length) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      const text = readFileSync(file, "utf8");
      const peer = text.match(OPTIONAL_PEER);
      if (peer) offenders.push(`${file.slice(ROOT.length + 1)} → ${peer[1]}`);
      for (const match of text.matchAll(SPECIFIER)) {
        const next = resolveFile(file, match[1] ?? match[2]);
        if (next) queue.push(next);
      }
    }
    expect(offenders).toEqual([]);
  });
});
