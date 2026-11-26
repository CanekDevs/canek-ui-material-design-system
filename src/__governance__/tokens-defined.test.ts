// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Tokens que existen: todo `var(--cn-…)` que usa un componente debe estar definido en `tokens.css`
 * (o en línea con `"--cn-x": …`). Un token que no existe nunca cambia con el tema: el navegador usa
 * siempre el respaldo y el modo oscuro queda con el color claro (así pasó con `--cn-color-text-primary`,
 * que pintaba los títulos de las gráficas casi negros sobre fondo oscuro).
 */
const ROOT = process.cwd();
const SCAN_DIRS = ["src/components", "src/theme", "src/utils"].map((dir) => join(ROOT, dir));
const TOKENS_CSS = join(ROOT, "src", "styles", "tokens.css");

/** Tokens que se pueden usar sin estar en `tokens.css`, con su motivo. */
const ALLOWED: Record<string, string> = {
  "--cn-timeline-sticky-bg":
    "gancho de personalización de `CnTimeline`: quien lo usa lo define; si no, cae a la superficie.",
  "--cn-color-background":
    "deuda heredada: tres respaldos distintos (#f6f7f9, #f4f6f9, #f8f9fa); pasar a `--cn-color-bg` cambia el modo claro y se decide aparte.",
  "--cn-color-danger-600":
    "deuda heredada: debería ser `--cn-color-error-600`; su respaldo (#c62828) no coincide y se decide aparte.",
};

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name) ? [full] : [];
  });

const toPosix = (path: string) => relative(ROOT, path).split("\\").join("/");

const defined = (): Set<string> => {
  const set = new Set(
    [...readFileSync(TOKENS_CSS, "utf8").matchAll(/(--cn-[\w-]+)\s*:/g)].map((m) => m[1]),
  );
  for (const file of SCAN_DIRS.flatMap(sourceFiles))
    for (const m of readFileSync(file, "utf8").matchAll(/["'](--cn-[\w-]+)["']\s*:/g))
      set.add(m[1]);
  return set;
};

/** Tokens usados con `var(` y dónde. Los nombres que terminan en `-` se arman en tiempo de ejecución. */
const used = (): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const file of SCAN_DIRS.flatMap(sourceFiles))
    for (const m of readFileSync(file, "utf8").matchAll(/var\(\s*(--cn-[\w-]*[\w])\b(?!-)/g)) {
      const list = map.get(m[1]) ?? [];
      if (!list.includes(toPosix(file))) list.push(toPosix(file));
      map.set(m[1], list);
    }
  return map;
};

describe("tokens que existen", () => {
  it("todo token usado está definido en tokens.css (o en la lista de permitidos con su motivo)", () => {
    const known = defined();
    const missing = [...used()]
      .filter(([token]) => !known.has(token) && !(token in ALLOWED))
      .map(([token, files]) => `${token} → ${files.join(", ")}`);
    expect(missing).toEqual([]);
  });

  it("la lista de permitidos no guarda tokens que ya no se usan o que ya existen", () => {
    const known = defined();
    const all = used();
    const stale = Object.keys(ALLOWED).filter((token) => !all.has(token) || known.has(token));
    expect(stale).toEqual([]);
  });
});
