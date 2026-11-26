// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Modo oscuro: las escalas de color (`--cn-color-brand-600`, `--cn-color-error-700`…) valen lo mismo
 * en claro y en oscuro, así que un texto o un ícono pintado con ellas queda oscuro sobre fondo oscuro.
 * Para un color con significado se usan roles que sí cambian en oscuro: `CN_TONES` o
 * `--cn-color-tone-<tono>-main|text` (y los semánticos `--cn-color-text`, `--cn-color-border`…).
 *
 * Se cuenta, por archivo, cada `var(--cn-color-<escala>-<n>` usado directo. Un respaldo dentro de otro
 * token (`var(--cn-color-tone-error-text, var(--cn-color-error-700, #8e2424))`) no cuenta. Hoy
 * hay usos heredados, así que la regla es un trinquete: ningún archivo puede subir su conteo de
 * `dark-mode.baseline.json` y un archivo nuevo no puede tener ninguno. `npm run docs:catalog` baja la
 * línea base al corregir; nunca la sube.
 */
const ROOT = process.cwd();
const SCAN_DIRS = ["src/components", "src/theme", "src/utils"].map((dir) => join(ROOT, dir));
const BASELINE_FILE = join(ROOT, "src", "__governance__", "dark-mode.baseline.json");
const WRITE = process.env.CN_GOVERNANCE_WRITE === "1";

const SCALE_USE =
  /(?<!var\(\s*--cn-[\w-]+,\s*)var\(\s*--cn-color-(?:brand|info|success|warning|error|neutral|accent)-\d+\b/g;

export const countScaleUses = (text: string): number => text.match(SCALE_USE)?.length ?? 0;

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name) ? [full] : [];
  });

const toPosix = (path: string) => relative(ROOT, path).split("\\").join("/");

const current = (): Record<string, number> =>
  Object.fromEntries(
    SCAN_DIRS.flatMap(sourceFiles)
      .map((file): [string, number] => [toPosix(file), countScaleUses(readFileSync(file, "utf8"))])
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => a.localeCompare(b)),
  );

const readBaseline = (): Record<string, number> =>
  existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, "utf8")) : {};

describe("colores que no cambian en modo oscuro", () => {
  it("cuenta usos directos de escalas y no los respaldos de otro token", () => {
    expect(countScaleUses('color: "var(--cn-color-error-700, #8e2424)"')).toBe(1);
    expect(countScaleUses("var(--cn-color-neutral-0) var(--cn-color-brand-50)")).toBe(2);
    expect(
      countScaleUses(
        'color: "var(--cn-color-tone-error-text, var(--cn-color-error-700, #8e2424))"',
      ),
    ).toBe(0);
    expect(
      countScaleUses('color: "var(--cn-color-control-error-fg, var(--cn-color-error-600))"'),
    ).toBe(0);
    expect(countScaleUses('color: "var(--cn-color-text-muted, #6e7682)"')).toBe(0);
    expect(countScaleUses("rgba(var(--cn-color-rgb-brand-500), 0.08)")).toBe(0);
  });

  it("no aumentan los usos directos de escalas (trinquete sobre la línea base)", () => {
    const counts = current();
    const baseline = readBaseline();
    if (WRITE) {
      const lowered = Object.fromEntries(
        Object.entries(counts)
          .filter(([file]) => file in baseline)
          .map(([file, count]) => [file, Math.min(count, baseline[file])]),
      );
      writeFileSync(BASELINE_FILE, `${JSON.stringify(lowered, null, 2)}\n`);
    }
    const regressions = Object.entries(counts)
      .filter(([file, count]) => count > (baseline[file] ?? 0))
      .map(([file, count]) => `${file}: ${count} (línea base ${baseline[file] ?? 0})`);
    expect(regressions).toEqual([]);
  });
});
