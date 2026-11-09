import { describe, expect, it } from "vitest";
import { buildChartSvg, toFilename } from "./chart-export";

describe("chart export", () => {
  it("builds a self-contained SVG without foreignObject, with title and legend", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <svg width="300" height="200">
        <circle cx="10" cy="10" r="5" fill="#ff0000"></circle>
        <foreignObject x="0" y="0" width="100" height="40"><div><div>255</div><div>Total</div></div></foreignObject>
      </svg>
      <button data-cn-legend-item data-color="#00ff00">Ventas</button>
      <button data-cn-legend-item data-color="#0000ff" data-hidden="true">Oculta</button>`;
    document.body.appendChild(container);
    const built = buildChartSvg(container, { title: "Ventas por mes", subtitle: "2026" });
    expect(built).not.toBeNull();
    const svg = built?.svg ?? "";
    expect(svg).not.toContain("foreignObject");
    expect(svg).toContain(">255<");
    expect(svg).toContain(">Total<");
    expect(svg).toContain("Ventas por mes");
    expect(svg).toContain("#00ff00");
    expect(svg).not.toContain("Oculta");
    expect(built?.height).toBeGreaterThan(200);
    container.remove();
  });

  it("creates safe filenames", () => {
    expect(toFilename("Gasto por categoría 2026")).toBe("gasto_por_categoria_2026");
    expect(toFilename(undefined)).toBe("grafica");
  });
});
