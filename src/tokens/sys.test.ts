import { sys, sysVar, typeAlias } from "./sys";
import { ref } from "./ref";

const luminance = (hex: string) => {
  const channels = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

const textPairs: [string, string][] = [
  ["on-primary", "primary"],
  ["on-brand", "brand"],
  ["on-success", "success-fill"],
  ["on-warning", "warning-fill"],
  ["on-error", "error-fill"],
  ["on-info", "info-fill"],
  ["on-surface", "surface"],
  ["on-surface", "background"],
  ["on-surface-variant", "surface"],
  ["text-title", "surface"],
  ["text-muted", "surface"],
  ["success-text", "surface"],
  ["warning-text", "surface"],
  ["error-text", "surface"],
  ["info-text", "surface"],
  ["link", "surface"],
  ["on-navbar", "navbar"],
];

describe("capa sys", () => {
  describe.each(["light", "dark"] as const)("modo %s", (mode) => {
    const colors = sys.color[mode] as Record<string, string>;

    it.each(textPairs)("%s sobre %s cumple WCAG AA (4.5:1)", (fg, bg) => {
      expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
    });

    it("primary y focus-ring se distinguen de surface (3:1)", () => {
      expect(contrast(colors.primary, colors.surface)).toBeGreaterThanOrEqual(3);
      expect(contrast(colors["focus-ring"], colors.surface)).toBeGreaterThanOrEqual(3);
    });

    it("define todos los roles", () => {
      expect(Object.keys(colors).sort()).toEqual(Object.keys(sys.color.light).sort());
    });
  });

  it("primary claro es el action de la marca", () => {
    expect(sys.color.light.primary).toBe(ref.color["color-action"]);
    expect(sys.color.light.brand).toBe(ref.color["color-brand-primary"]);
  });

  it("los colores de estado originales de la marca se conservan para íconos y bordes", () => {
    expect(sys.color.light.success).toBe(ref.color["color-status-success"]);
    expect(sys.color.light.error).toBe(ref.color["color-status-error"]);
    expect(sys.color.light.info).toBe(ref.color["color-status-info"]);
  });

  it("label-large es el botón de marca: 14 Medium en mayúsculas", () => {
    expect(sys.type["label-large"]).toMatchObject({
      fontSize: "14px",
      fontWeight: 500,
      textTransform: "uppercase",
    });
  });

  it("los alias de origen apuntan a un rol", () => {
    expect(typeAlias["card-title"]).toBe("headline-small");
    expect(typeAlias["helper-text"]).toBe("body-small");
    expect(typeAlias.button).toBe("label-large");
  });

  it("genera nombres de variable con el prefijo sys", () => {
    expect(sysVar("color-primary")).toBe("var(--cn-sys-color-primary)");
  });
});
