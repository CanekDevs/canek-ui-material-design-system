/**
 * Paleta de tonos compartida por las tarjetas de contenido (secciones,
 * perfiles, carruseles y documentos). Usa los tokens `--cn-color-*` con
 * respaldo para funcionar sin la hoja de tokens.
 */
export type CnTone = "primary" | "info" | "success" | "warning" | "error" | "neutral" | "accent";

export type CnToneTokens = {
  /** Color principal (íconos, títulos con tono, bordes de acento). */
  main: string;
  /** Texto con tono sobre fondo suave. */
  text: string;
  /** Fondo suave. */
  soft: string;
  /** Fondo suave al pasar el cursor. */
  softHover: string;
  /** Borde con tono. */
  border: string;
  /** Fondo sólido (variante `filled`). */
  solid: string;
  /** Texto sobre el fondo sólido. */
  onSolid: string;
};

const rgba = (name: string, fallback: string, alpha: number) =>
  `rgba(var(--cn-color-rgb-${name}, ${fallback}), ${alpha})`;

const tone = (
  scale: string,
  rgbName: string,
  rgbFallback: string,
  main: string,
  text: string,
  solid: string,
): CnToneTokens => ({
  main: `var(--cn-color-${scale}-600, ${main})`,
  text: `var(--cn-color-${scale}-700, ${text})`,
  soft: rgba(rgbName, rgbFallback, 0.08),
  softHover: rgba(rgbName, rgbFallback, 0.14),
  border: rgba(rgbName, rgbFallback, 0.28),
  solid: `var(--cn-color-${scale}-${scale === "warning" ? 700 : 600}, ${solid})`,
  onSolid: "var(--cn-color-text-inverse, #ffffff)",
});

export const CN_TONES: Record<CnTone, CnToneTokens> = {
  primary: tone("brand", "brand-500", "53, 98, 166", "#254d87", "#1d3d6b", "#254d87"),
  info: tone("info", "info-500", "44, 123, 200", "#2367a8", "#1b5288", "#2367a8"),
  success: tone("success", "success-500", "46, 158, 79", "#228740", "#1a6a32", "#228740"),
  warning: tone("warning", "warning-500", "224, 160, 32", "#b8831a", "#8f6614", "#8f6614"),
  error: tone("error", "error-500", "214, 60, 60", "#b52f2f", "#8f2525", "#b52f2f"),
  neutral: {
    main: "var(--cn-color-neutral-600, #4e5660)",
    text: "var(--cn-color-neutral-800, #2b3138)",
    soft: "var(--cn-color-neutral-100, #f4f5f7)",
    softHover: "var(--cn-color-neutral-150, #e9ecef)",
    border: "var(--cn-color-border, #dde0e4)",
    solid: "var(--cn-color-neutral-700, #363d45)",
    onSolid: "var(--cn-color-text-inverse, #ffffff)",
  },
  accent: {
    main: "var(--cn-color-accent-600, #3349d6)",
    text: "var(--cn-color-accent-600, #3349d6)",
    soft: rgba("accent-500", "61, 90, 254", 0.08),
    softHover: rgba("accent-500", "61, 90, 254", 0.14),
    border: rgba("accent-500", "61, 90, 254", 0.28),
    solid: "var(--cn-color-accent-600, #3349d6)",
    onSolid: "var(--cn-color-text-inverse, #ffffff)",
  },
};

/** Ícono por defecto de cada tono (todos en `ICON_REGISTRY`). */
export const CN_TONE_ICONS: Record<CnTone, string> = {
  primary: "info",
  info: "info",
  success: "check_circle",
  warning: "warning",
  error: "error",
  neutral: "info",
  accent: "new_releases",
};

/** `prefers-reduced-motion: reduce` (falso en SSR / jsdom sin `matchMedia`). */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Texto solo para lectores de pantalla. */
export const visuallyHiddenSx = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;
