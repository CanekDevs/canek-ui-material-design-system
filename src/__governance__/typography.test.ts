// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Tipografía (regla de diseño R3): una sola familia (Roboto), solo los tamaños de la escala y solo
 * los pesos 300, 400, 500 y 700. Los botones van en 14 Medium en mayúsculas.
 *
 * Se cuentan, por archivo, los valores tipográficos escritos a mano que se salen de la escala:
 * - `fontSize` / `font-size` con un tamaño que no está en `TYPE_SCALE_PX`.
 * - `fontWeight` / `font-weight` con un peso fuera de `ALLOWED_WEIGHTS` (600, 800, 900…).
 * - `fontFamily` / `font-family` con una familia literal en lugar de `var(--cn-font-*)` o `inherit`.
 * - En `src/styles/tokens.css`: los tokens `--cn-font-size-*` y `--cn-font-weight-*` fuera de la
 *   escala y un `--cn-font-sans` que no empiece por Roboto.
 *
 * Hoy existen valores heredados, así que la regla es un trinquete igual al de colores: ningún
 * archivo puede subir su conteo de `typography.baseline.json`, y un archivo que no está en la línea
 * base no puede tener ninguno. `npm run docs:catalog` baja la línea base al corregir; nunca la sube.
 */
const ROOT = process.cwd();
const SCAN_DIRS = ["src/components", "src/theme", "src/utils"].map((dir) => join(ROOT, dir));
const TOKENS_CSS = "src/styles/tokens.css";
const BASELINE_FILE = join(ROOT, "src", "__governance__", "typography.baseline.json");
const WRITE = process.env.CN_GOVERNANCE_WRITE === "1";

/** Escala tipográfica de la marca, en px. */
const TYPE_SCALE_PX = [10, 12, 13, 14, 16, 18, 22, 26, 28, 32, 36];
/** Pesos permitidos. */
const ALLOWED_WEIGHTS = [300, 400, 500, 700];
/** Primera familia que debe declarar `--cn-font-sans`. */
const BRAND_FONT = "Roboto";

const ROOT_FONT_PX = 16;

const SIZE = /\bfont(?:Size|-size)\s*:\s*(["'`]?)(\d+(?:\.\d+)?)(px|rem|em)?\1/g;
const WEIGHT = /\bfont(?:Weight|-weight)\s*:\s*(["'`]?)(\d{3})\1/g;
const FAMILY = /\bfont(?:Family|-family)\s*:\s*(["'`])([^"'`]+)\1/g;

const toPx = (value: number, unit: string | undefined): number | null => {
  if (unit === "em") return null;
  return unit === "rem" ? value * ROOT_FONT_PX : value;
};

const onScale = (px: number) => TYPE_SCALE_PX.some((size) => Math.abs(size - px) < 0.01);

const countOffScale = (text: string): number => {
  let count = 0;
  for (const [, , raw, unit] of text.matchAll(SIZE)) {
    const px = toPx(Number(raw), unit);
    if (px !== null && px > 1 && !onScale(px)) count += 1;
  }
  for (const [, , raw] of text.matchAll(WEIGHT)) {
    if (!ALLOWED_WEIGHTS.includes(Number(raw))) count += 1;
  }
  for (const [, , value] of text.matchAll(FAMILY)) {
    const family = value.trim();
    if (!family.startsWith("var(") && !["inherit", "monospace"].includes(family)) count += 1;
  }
  return count;
};

const countTokenViolations = (css: string): number => {
  let count = 0;
  for (const [, raw] of css.matchAll(/--cn-font-size-[\w-]+\s*:\s*(\d+(?:\.\d+)?)px/g)) {
    if (!onScale(Number(raw))) count += 1;
  }
  for (const [, raw] of css.matchAll(/--cn-font-weight-[\w-]+\s*:\s*(\d{3})/g)) {
    if (!ALLOWED_WEIGHTS.includes(Number(raw))) count += 1;
  }
  const sans = css.match(/--cn-font-sans\s*:\s*["']?([^"',;]+)/);
  if (sans && sans[1].trim() !== BRAND_FONT) count += 1;
  return count;
};

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name) ? [full] : [];
  });

const toPosix = (path: string) => relative(ROOT, path).split("\\").join("/");

const current = (): Record<string, number> => {
  const counts: [string, number][] = SCAN_DIRS.flatMap(sourceFiles).map((file) => [
    toPosix(file),
    countOffScale(readFileSync(file, "utf8")),
  ]);
  counts.push([TOKENS_CSS, countTokenViolations(readFileSync(join(ROOT, TOKENS_CSS), "utf8"))]);
  return Object.fromEntries(
    counts.filter(([, count]) => count > 0).sort(([a], [b]) => a.localeCompare(b)),
  );
};

const readBaseline = (): Record<string, number> =>
  existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, "utf8")) : {};

describe("tipografía de la escala (R3)", () => {
  it("detecta tamaños, pesos y familias fuera de la escala", () => {
    expect(countOffScale('fontSize: 14, fontWeight: 500, fontFamily: "inherit"')).toBe(0);
    expect(countOffScale('fontSize: "0.875rem", fontWeight: "700"')).toBe(0);
    expect(countOffScale('fontSize: 15, fontWeight: 600, fontFamily: "Inter"')).toBe(3);
    expect(countOffScale("font-size: 11px; font-weight: 800;")).toBe(2);
    expect(countOffScale('fontFamily: "var(--cn-font-sans)"')).toBe(0);
  });

  it("detecta tokens tipográficos fuera de la escala", () => {
    expect(countTokenViolations('--cn-font-sans: "Roboto", sans-serif;')).toBe(0);
    expect(countTokenViolations('--cn-font-sans: "Inter", Roboto;')).toBe(1);
    expect(countTokenViolations("--cn-font-size-xs: 11px; --cn-font-weight-bold: 700;")).toBe(1);
  });

  it("no aumentan los valores fuera de la escala (trinquete sobre la línea base)", () => {
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
