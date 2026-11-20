// @vitest-environment node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { format, resolveConfig } from "prettier";

/*
 * Colores: los componentes usan tokens (`var(--cn-color-*)`, `theme.palette.*`, `CN_TONES`), no
 * hex sueltos. Un hex como respaldo de un token (`var(--cn-color-border, #dde0e4)`) sí se permite.
 *
 * Hoy existen hex heredados, así que la regla es un trinquete (ratchet):
 * - Archivos de la lista `ALLOWED_FILES`: permitidos por naturaleza (con motivo).
 * - El resto: no puede superar su conteo en `hardcoded-colors.baseline.json`, y un archivo que no
 *   está en la línea base no puede tener ninguno.
 * - `npm run docs:catalog` (modo escritura) baja la línea base cuando se corrigen archivos y genera
 *   el reporte `docs/governance/colores-hardcodeados.md`. Nunca la sube: subirla es un cambio
 *   manual que se justifica en el PR.
 */
const ROOT = process.cwd();
const COMPONENTS_DIR = join(ROOT, "src", "components");
const BASELINE_FILE = join(ROOT, "src", "__governance__", "hardcoded-colors.baseline.json");
const REPORT_FILE = join(ROOT, "docs", "governance", "colores-hardcodeados.md");
const WRITE = process.env.CN_GOVERNANCE_WRITE === "1";

/** Archivos donde los colores literales son el dato, no el estilo. */
const ALLOWED_FILES: Record<string, string> = {
  "src/components/CnMap/map-styles.ts":
    "Estilos de mapa de Google: el proveedor exige colores literales.",
  "src/components/CnFlagIcon/CnFlagIcon.tsx": "Arte de banderas: colores oficiales de cada país.",
  "src/components/CnColorField/CnColorField.tsx":
    "Paleta sugerida del selector: son valores del usuario.",
  "src/components/CnCharts/chart-theme.ts":
    "Paleta de gráficas con respaldo para exportar PNG/SVG fuera del DOM (sin CSS variables).",
  "src/components/CnCharts/chart-export.ts":
    "Exportación a imagen: el canvas no resuelve CSS variables.",
  "src/components/CnDataTable/export.ts":
    "Exportación XLSX/HTML/PDF: los archivos no leen CSS variables.",
};

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const TOKEN_FALLBACK = /var\(\s*--[\w-]+\s*,\s*#[0-9a-fA-F]{3,8}\s*\)/g;

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name) ? [full] : [];
  });

const countHardcoded = (text: string): number => {
  let stripped = text;
  let previous = "";
  // Respaldos anidados: var(--a, var(--b, #fff)) se limpian de adentro hacia afuera.
  while (stripped !== previous) {
    previous = stripped;
    stripped = stripped.replace(TOKEN_FALLBACK, "var()");
  }
  return stripped.match(HEX)?.length ?? 0;
};

const toPosix = (path: string) => relative(ROOT, path).split("\\").join("/");

const current = (): Record<string, number> =>
  Object.fromEntries(
    sourceFiles(COMPONENTS_DIR)
      .map((file) => [toPosix(file), countHardcoded(readFileSync(file, "utf8"))] as const)
      .filter(([file, count]) => count > 0 && !(file in ALLOWED_FILES))
      .sort(([a], [b]) => a.localeCompare(b)),
  );

const readBaseline = (): Record<string, number> =>
  existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, "utf8")) : {};

const writeReport = async (counts: Record<string, number>) => {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const lines = [
    "# Colores hardcodeados en componentes",
    "",
    "Archivo generado por `npm run docs:catalog` (`src/__governance__/colors.test.ts`). No editar a mano.",
    "",
    "Los componentes deben usar tokens (`var(--cn-color-*)`, `theme.palette.*`, `CN_TONES`). Un hex",
    "como respaldo de un token (`var(--cn-color-border, #dde0e4)`) no cuenta. La línea base solo puede",
    "bajar: al corregir un archivo, regenera este reporte.",
    "",
    `Total pendiente: **${total}** en **${Object.keys(counts).length}** archivos.`,
    "",
    "| Archivo | Hex sin token |",
    "| --- | --- |",
    ...Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([file, count]) => `| \`${file}\` | ${count} |`),
    "",
    "## Permitidos por naturaleza",
    "",
    "| Archivo | Motivo |",
    "| --- | --- |",
    ...Object.entries(ALLOWED_FILES).map(([file, reason]) => `| \`${file}\` | ${reason} |`),
    "",
  ];
  mkdirSync(dirname(REPORT_FILE), { recursive: true });
  const options = (await resolveConfig(REPORT_FILE)) ?? {};
  writeFileSync(REPORT_FILE, await format(lines.join("\n"), { ...options, filepath: REPORT_FILE }));
};

describe("colores con tokens", () => {
  it("los archivos permitidos existen", () => {
    expect(Object.keys(ALLOWED_FILES).filter((file) => !existsSync(join(ROOT, file)))).toEqual([]);
  });

  it("no aumentan los hex sin token (trinquete sobre la línea base)", async () => {
    const counts = current();
    const baseline = readBaseline();
    if (WRITE) {
      const lowered = Object.fromEntries(
        Object.entries(counts)
          .filter(([file]) => file in baseline)
          .map(([file, count]) => [file, Math.min(count, baseline[file])]),
      );
      writeFileSync(BASELINE_FILE, `${JSON.stringify(lowered, null, 2)}\n`);
      await writeReport(counts);
    }
    const regressions = Object.entries(counts)
      .filter(([file, count]) => count > (baseline[file] ?? 0))
      .map(([file, count]) => `${file}: ${count} (línea base ${baseline[file] ?? 0})`);
    expect(regressions).toEqual([]);
  });
});
