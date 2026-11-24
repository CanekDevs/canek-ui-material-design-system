import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ref, refVar } from "./ref";

const source = JSON.parse(
  readFileSync(resolve(process.cwd(), "tokens/base.tokens.json"), "utf8"),
) as { color: { tokens: { name: string }[] } };

describe("capa ref (marca)", () => {
  it("incluye todos los colores del JSON fuente", () => {
    expect(Object.keys(ref.color)).toHaveLength(source.color.tokens.length);
  });

  it("resuelve los alias de la marca a valores literales", () => {
    expect(ref.color["color-brand-primary"]).toBe("#4870b2");
    expect(ref.color["color-brand-primary-dark"]).toBe("#3b5391");
    expect(ref.color["color-action"]).toBe("#3d5afe");
    expect(ref.color["color-action-hover"]).toBe("#304ffe");
  });

  it("conserva los colores de estado de la marca", () => {
    expect(ref.color["color-status-success"]).toBe("#4caf50");
    expect(ref.color["color-status-warning"]).toBe("#ffa000");
    expect(ref.color["color-status-error"]).toBe("#f44336");
    expect(ref.color["color-status-info"]).toBe("#039be5");
  });

  it("usa Roboto y solo pesos permitidos", () => {
    expect(ref.font.sans.startsWith("Roboto")).toBe(true);
    const weights = new Set(Object.values(ref.type).map((style) => style.fontWeight));
    for (const weight of weights) expect([300, 400, 500, 700]).toContain(weight);
  });

  it("genera nombres de variable con el prefijo ref", () => {
    expect(refVar("color-action")).toBe("var(--cn-ref-color-action)");
  });
});
