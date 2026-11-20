// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Estructura mínima de cada carpeta de `src/components` (definición de terminado, ver AGENTS.md):
 * index.ts, skeleton propio, pruebas, historias y prop `skeleton` en el componente principal.
 * Las excepciones viven aquí, cada una con su motivo. Agregar una excepción requiere justificarla
 * en el PR.
 */
const COMPONENTS_DIR = join(process.cwd(), "src", "components");
const folders = readdirSync(COMPONENTS_DIR).filter((name) =>
  statSync(join(COMPONENTS_DIR, name)).isDirectory(),
);
const filesOf = (folder: string) => readdirSync(join(COMPONENTS_DIR, folder));

/** Carpetas sin `*Skeleton.tsx` propio. */
const SKELETON_FILE_EXCEPTIONS: Record<string, string> = {
  CnForm:
    "Su skeleton es `CnFormSkeleton`, que vive en su propia carpeta y se reutiliza fuera del formulario.",
};

/** Carpetas cuyo componente principal no recibe la prop `skeleton`. */
const SKELETON_PROP_EXCEPTIONS: Record<string, string> = {
  CnSkeleton: "Es el propio kit de skeletons.",
  CnFormSkeleton: "Es un skeleton; no tiene estado cargado.",
  CnForm: "Usa `loadingStates` y `CnFormSkeleton` para la carga inicial.",
  CnCharts:
    "Carpeta de varias gráficas sin componente homónimo; cada gráfica y `CnChartCard` aceptan `loading`.",
  CnDataTable: "Usa `loading` (filas skeleton dentro de la tabla) y `CnDataTableSkeleton`.",
  CnEventCalendar: "Usa `loading` y `CnEventCalendarSkeleton`.",
  CnList: "Usa `loading` (filas skeleton) y `CnListSkeleton`.",
};

const mainFileOf = (folder: string): string | null => {
  const file = join(COMPONENTS_DIR, folder, `${folder}.tsx`);
  return existsSync(file) ? file : null;
};

describe("estructura de componentes", () => {
  it("cada carpeta tiene index.ts", () => {
    expect(folders.filter((folder) => !filesOf(folder).includes("index.ts"))).toEqual([]);
  });

  it("cada carpeta tiene su *Skeleton.tsx (o una excepción justificada)", () => {
    const missing = folders.filter(
      (folder) =>
        !(folder in SKELETON_FILE_EXCEPTIONS) &&
        !filesOf(folder).some((file) => /Skeleton\.tsx$/.test(file)),
    );
    expect(missing).toEqual([]);
  });

  it("el componente principal acepta la prop `skeleton` (o una excepción justificada)", () => {
    const missing = folders.filter((folder) => {
      if (folder in SKELETON_PROP_EXCEPTIONS) return false;
      const main = mainFileOf(folder);
      return !main || !/\bskeleton\b\s*(\??:|=)/.test(readFileSync(main, "utf8"));
    });
    expect(missing).toEqual([]);
  });

  it("cada carpeta tiene al menos un *.test.tsx y un *.stories.tsx", () => {
    const missing: string[] = [];
    for (const folder of folders) {
      const files = filesOf(folder);
      if (!files.some((file) => /\.test\.tsx?$/.test(file))) missing.push(`${folder}: sin pruebas`);
      if (!files.some((file) => file.endsWith(".stories.tsx")))
        missing.push(`${folder}: sin historias`);
    }
    expect(missing).toEqual([]);
  });

  it("las excepciones apuntan a carpetas que existen", () => {
    const stale = [
      ...Object.keys(SKELETON_FILE_EXCEPTIONS),
      ...Object.keys(SKELETON_PROP_EXCEPTIONS),
    ].filter((folder) => !folders.includes(folder));
    expect(stale).toEqual([]);
  });

  it("las carpetas usan el prefijo Cn en PascalCase", () => {
    expect(folders.filter((folder) => !/^Cn[A-Z][A-Za-z0-9]+$/.test(folder))).toEqual([]);
  });
});
