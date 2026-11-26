// @vitest-environment node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Contraste (regla de diseño R2), medido sobre los tokens de `src/styles/tokens.css` en claro y en
 * oscuro (`[data-cn-theme="dark"]`):
 * - Texto (`text`, `text-muted`) sobre cada fondo: 4.5:1.
 * - Texto tenue (`text-subtle`, solo íconos y texto grande) sobre cada fondo: 3:1.
 * - Borde en reposo de los campos (el token que usa `src/utils/field-styles.ts`) sobre la superficie: 3:1.
 * - Roles de tono de `CN_TONES` (`tone-<tono>-text` y `tone-<tono>-main`): texto 4.5:1 sobre cada
 *   fondo; color principal (íconos, bordes, barras) 3:1 sobre la superficie.
 * - Frente de controles (`control-<color>-fg`, texto de botones y chips sin relleno): 4.5:1 sobre la
 *   superficie.
 *
 * Hoy hay pares heredados que no llegan, así que la regla es un trinquete: un par que no está en
 * `contrast.baseline.json` debe pasar, y uno que está no puede bajar de su razón actual.
 * `npm run docs:catalog` quita de la línea base los pares que ya pasan y sube las razones que
 * mejoraron; nunca agrega pares.
 */
const ROOT = process.cwd();
const TOKENS_CSS = join(ROOT, "src", "styles", "tokens.css");
const FIELD_STYLES = join(ROOT, "src", "utils", "field-styles.ts");
const BASELINE_FILE = join(ROOT, "src", "__governance__", "contrast.baseline.json");
const WRITE = process.env.CN_GOVERNANCE_WRITE === "1";

const TEXT_AA = 4.5;
const NON_TEXT_AA = 3;
const BACKGROUNDS = ["bg", "surface", "surface-elevated", "surface-sunken"];
const CONTROLS = [
  "primary",
  "secondary",
  "success",
  "warning",
  "info",
  "error",
  "accent",
  "neutral",
];
const TONES = ["primary", "info", "success", "warning", "error", "accent", "neutral"];

type Mode = "claro" | "oscuro";
type Rgba = [number, number, number, number];

const block = (css: string, selector: string): Record<string, string> => {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return {};
  const body = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries(
    [...body.matchAll(/(--cn-[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  );
};

const resolve = (vars: Record<string, string>, value: string, depth = 0): string => {
  if (depth > 20) throw new Error(`Alias circular en ${value}`);
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (_, name, fallback) => {
    const next = vars[name] ?? fallback;
    if (next === undefined) throw new Error(`Token inexistente: ${name}`);
    return resolve(vars, next, depth + 1);
  });
};

const parseColor = (value: string): Rgba => {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const full = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).concat(1) as Rgba;
  }
  const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const [r, g, b, a = "1"] = rgb[1].split(",").map((part) => part.trim());
    return [Number(r), Number(g), Number(b), Number(a)];
  }
  throw new Error(`Color no reconocido: ${value}`);
};

const over = ([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba => [
  r * a + br * (1 - a),
  g * a + bg * (1 - a),
  b * a + bb * (1 - a),
  1,
];

const luminance = ([r, g, b]: Rgba) => {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const ratio = (fg: Rgba, bg: Rgba) => {
  const [hi, lo] = [luminance(over(fg, bg)), luminance(bg)].sort((x, y) => y - x);
  return Math.floor(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};

const fieldBorderToken = (): string => {
  const match = readFileSync(FIELD_STYLES, "utf8").match(
    /borderColor:\s*"var\(--cn-color-([\w-]+)/,
  );
  if (!match) throw new Error("No se encontró el borde en reposo de los campos en field-styles.ts");
  return match[1];
};

/** `base`: superficie debajo de un fondo translúcido (p. ej. `tone-*-soft` en oscuro). */
type Pair = { fg: string; bg: string; min: number; base?: string };

const pairs = (): Pair[] => [
  ...["text", "text-muted"].flatMap((fg) => BACKGROUNDS.map((bg) => ({ fg, bg, min: TEXT_AA }))),
  ...BACKGROUNDS.map((bg) => ({ fg: "text-subtle", bg, min: NON_TEXT_AA })),
  { fg: fieldBorderToken(), bg: "surface", min: NON_TEXT_AA },
  ...[
    "field-accent",
    "field-error",
    "field-focus-outline",
    "focus-outline",
    "indicator-active",
  ].map((fg) => ({
    fg,
    bg: "surface",
    min: NON_TEXT_AA,
  })),
  ...TONES.flatMap((tone) => [
    ...BACKGROUNDS.map((bg) => ({ fg: `tone-${tone}-text`, bg, min: TEXT_AA })),
    { fg: `tone-${tone}-main`, bg: "surface", min: NON_TEXT_AA },
    { fg: `tone-${tone}-text`, bg: `tone-${tone}-soft`, base: "surface", min: TEXT_AA },
  ]),
  ...CONTROLS.map((control) => ({ fg: `control-${control}-fg`, bg: "surface", min: TEXT_AA })),
];

const measure = (): Record<string, { ratio: number; min: number }> => {
  const css = readFileSync(TOKENS_CSS, "utf8");
  const light = block(css, ":root");
  const modes: Record<Mode, Record<string, string>> = {
    claro: light,
    oscuro: { ...light, ...block(css, '[data-cn-theme="dark"]') },
  };
  const result: Record<string, { ratio: number; min: number }> = {};
  for (const [mode, vars] of Object.entries(modes)) {
    const color = (role: string) => parseColor(resolve(vars, `var(--cn-color-${role})`));
    for (const { fg, bg, min, base } of pairs()) {
      const back = base ? over(color(bg), color(base)) : color(bg);
      result[`${mode}: ${fg} / ${bg}`] = { ratio: ratio(color(fg), back), min };
    }
  }
  return result;
};

const readBaseline = (): Record<string, number> =>
  existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, "utf8")) : {};

describe("contraste de tokens (R2)", () => {
  it("calcula la razón de contraste WCAG", () => {
    expect(ratio(parseColor("#000000"), parseColor("#ffffff"))).toBe(21);
    expect(ratio(parseColor("#6e7682"), parseColor("#fafbfc"))).toBe(4.42);
    expect(ratio(parseColor("rgba(0, 0, 0, 0)"), parseColor("#ffffff"))).toBe(1);
  });

  it("ningún par baja de AA ni de su razón en la línea base (trinquete)", () => {
    const measured = measure();
    const baseline = readBaseline();
    if (WRITE) {
      const kept = Object.fromEntries(
        Object.entries(baseline)
          .filter(([key]) => measured[key] && measured[key].ratio < measured[key].min)
          .map(([key, value]) => [key, Math.max(value, measured[key].ratio)]),
      );
      writeFileSync(BASELINE_FILE, `${JSON.stringify(kept, null, 2)}\n`);
    }
    const failures = Object.entries(measured)
      .filter(([key, { ratio: value, min }]) => value < Math.min(min, baseline[key] ?? min))
      .map(([key, { ratio: value, min }]) => `${key}: ${value}:1 (mínimo ${min}:1)`);
    expect(failures).toEqual([]);
  });
});
