import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/*
 * Política del proyecto: el design system no menciona sistemas externos de los que se toman
 * ideas. Los patrones se arman por partes para que este archivo no los contenga literalmente.
 */
const FORBIDDEN: { label: string; pattern: RegExp }[] = [
  { label: "nombre de sistema externo", pattern: new RegExp(["tab", "antaj"].join(""), "i") },
  { label: "prefijo de componentes externos", pattern: new RegExp(["\\bT", "b[A-Z][a-z]"].join("")) },
  { label: "nombre de organización externa", pattern: new RegExp(["S4", "B[A-Z]"].join("")) },
];

const TEXT_FILE = /\.(tsx?|jsx?|mjs|cjs|json|md|mdx|ya?ml|css|html|txt)$/i;
const IGNORED = /(^|\/)(package-lock\.json|node_modules\/|dist\/|storybook-static\/)/;

const trackedFiles = (): string[] =>
  execSync("git ls-files", { encoding: "utf8" })
    .split("\n")
    .map((file) => file.trim())
    .filter((file) => file && TEXT_FILE.test(file) && !IGNORED.test(file));

describe("gobierno del repositorio", () => {
  it("no menciona sistemas externos de referencia", () => {
    const hits: string[] = [];
    for (const file of trackedFiles()) {
      let text: string;
      try {
        text = readFileSync(file, "utf8");
      } catch {
        continue;
      }
      text.split("\n").forEach((line, index) => {
        for (const { label, pattern } of FORBIDDEN) {
          if (pattern.test(line)) hits.push(`${file}:${index + 1} (${label})`);
        }
      });
    }
    expect(hits).toEqual([]);
  });
});
