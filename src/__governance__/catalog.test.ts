import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CN_CATALOG } from "../catalog";

/*
 * Cada componente debe documentar para qué sirve, cuándo NO usarlo y su relación con los
 * vecinos, en el catálogo (src/catalog/entries), y sus historias deben mostrarlo con
 * `catalogDocs(...)`. Así la documentación vive en un solo lugar y no se desactualiza.
 */
const COMPONENTS_DIR = join(process.cwd(), "src", "components");
const folders = readdirSync(COMPONENTS_DIR).filter((name) =>
  statSync(join(COMPONENTS_DIR, name)).isDirectory(),
);
const folderOf = (entry: (typeof CN_CATALOG)[number]) => entry.folder ?? entry.name;

describe("catálogo de componentes", () => {
  it("tiene al menos una entrada por carpeta de componente", () => {
    const covered = new Set(CN_CATALOG.map(folderOf));
    expect(folders.filter((folder) => !covered.has(folder))).toEqual([]);
  });

  it("no tiene entradas duplicadas ni carpetas inexistentes", () => {
    const names = CN_CATALOG.map((entry) => entry.name);
    expect(names.filter((name, i) => names.indexOf(name) !== i)).toEqual([]);
    expect(CN_CATALOG.map(folderOf).filter((folder) => !folders.includes(folder))).toEqual([]);
  });

  it("documenta las tres secciones con contenido real", () => {
    const weak = CN_CATALOG.filter(
      (entry) =>
        entry.summary.trim().length < 15 ||
        entry.purpose.trim().length < 60 ||
        entry.whenNot.trim().length < 40 ||
        entry.neighbors.trim().length < 40 ||
        // "Cuándo NO" y "vecinos" deben nombrar al menos un componente alternativo.
        !/`Cn[A-Z]/.test(entry.whenNot) ||
        !/`Cn[A-Z]/.test(entry.neighbors),
    ).map((entry) => entry.name);
    expect(weak).toEqual([]);
  });

  it("solo menciona componentes que existen en el catálogo", () => {
    const known = new Set(CN_CATALOG.flatMap((entry) => [entry.name, ...(entry.related ?? [])]));
    const unknown: string[] = [];
    for (const entry of CN_CATALOG) {
      for (const match of `${entry.whenNot} ${entry.neighbors}`.matchAll(/`(Cn[A-Za-z]+)`/g)) {
        if (!known.has(match[1])) unknown.push(`${entry.name} → ${match[1]}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("cada archivo de historias toma su descripción del catálogo", () => {
    const missing: string[] = [];
    for (const folder of folders) {
      const dir = join(COMPONENTS_DIR, folder);
      for (const file of readdirSync(dir).filter((f) => f.endsWith(".stories.tsx"))) {
        const text = readFileSync(join(dir, file), "utf8");
        if (!text.includes("catalogDocs(")) missing.push(`${folder}/${file}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
