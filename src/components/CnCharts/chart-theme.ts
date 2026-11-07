/**
 * Tema, paleta y formatos compartidos por todas las gráficas de Canek.
 * No depende de `@mui/x-charts`: lo usan también los skeletons.
 */

export type CnChartTone =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "teal"
  | "violet"
  | "orange"
  | "pink"
  | "cyan"
  | "lime";

/** Valores de respaldo (los reales se leen de los tokens CSS en tiempo de ejecución). */
const TONE_FALLBACK: Record<CnChartTone, { token?: string; hex: string }> = {
  primary: { token: "--cn-color-brand-600", hex: "#254d87" },
  accent: { token: "--cn-color-accent-500", hex: "#3d5afe" },
  success: { token: "--cn-color-success-500", hex: "#2e9e4f" },
  warning: { token: "--cn-color-warning-500", hex: "#e0a020" },
  error: { token: "--cn-color-error-500", hex: "#d63c3c" },
  info: { token: "--cn-color-info-500", hex: "#2c7bc8" },
  neutral: { token: "--cn-color-neutral-500", hex: "#6e7682" },
  teal: { hex: "#14a3a0" },
  violet: { hex: "#7c4dff" },
  orange: { hex: "#f0752a" },
  pink: { hex: "#d6457f" },
  cyan: { hex: "#22b3d8" },
  lime: { hex: "#8bb32c" },
};

/** Orden categórico: colores con buen contraste entre vecinos. */
export const CN_CHART_TONE_ORDER: CnChartTone[] = [
  "primary",
  "accent",
  "teal",
  "warning",
  "violet",
  "error",
  "cyan",
  "orange",
  "success",
  "pink",
  "info",
  "lime",
];

const readToken = (token: string | undefined, fallback: string): string => {
  if (!token || typeof window === "undefined" || typeof document === "undefined") return fallback;
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    return value || fallback;
  } catch {
    return fallback;
  }
};

/** Color real (hex) de un tono. Los SVG no resuelven `var()` en atributos. */
export const resolveTone = (tone: CnChartTone | string | undefined, index = 0): string => {
  if (!tone) return resolveTone(CN_CHART_TONE_ORDER[index % CN_CHART_TONE_ORDER.length]);
  const config = TONE_FALLBACK[tone as CnChartTone];
  if (!config) return tone; // ya es un color CSS
  return readToken(config.token, config.hex);
};

/** Paleta categórica completa con los tokens del tema activo. */
export const getChartPalette = (): string[] => CN_CHART_TONE_ORDER.map((tone) => resolveTone(tone));

/** Paletas secuenciales y divergentes (heatmaps, escalas de color). */
export const CN_SEQUENTIAL_SCALES = {
  primary: ["#eef3fb", "#d4e0f4", "#a9c1e8", "#7c9fdc", "#3562a6", "#254d87", "#1c3d6d"],
  accent: ["#eef0ff", "#d6dcff", "#aab8ff", "#8c9eff", "#5d75fe", "#3d5afe", "#283ccf"],
  success: ["#eaf7ee", "#c9ebd3", "#97d6aa", "#5fbe7c", "#2e9e4f", "#228740", "#176a30"],
  warning: ["#fdf6e6", "#fae6b8", "#f5d07f", "#efb848", "#e0a020", "#b8831a", "#8a6213"],
  error: ["#fcecec", "#f7cfcf", "#efa0a0", "#e47070", "#d63c3c", "#b52f2f", "#8a2323"],
  heat: ["#fff5d6", "#fde08a", "#fbb848", "#f5862a", "#e0532a", "#bb2f3a", "#7d1d3f"],
} as const;

export const CN_DIVERGING_SCALE = [
  "#b52f2f",
  "#e47070",
  "#f7cfcf",
  "#f4f5f7",
  "#c9ebd3",
  "#5fbe7c",
  "#228740",
];

export type CnSequentialScale = keyof typeof CN_SEQUENTIAL_SCALES;

const hexToRgb = (hex: string): [number, number, number] | null => {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim());
  if (!match) return null;
  const value =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((c) => c + c)
          .join("")
      : match[1];
  const n = parseInt(value, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Interpola un color en una escala de colores hex (t de 0 a 1). */
export const interpolateScale = (scale: readonly string[], t: number): string => {
  if (scale.length === 0) return "#ccc";
  const clamped = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  const position = clamped * (scale.length - 1);
  const index = Math.min(scale.length - 2, Math.floor(position));
  if (scale.length === 1) return scale[0];
  const a = hexToRgb(scale[index]);
  const b = hexToRgb(scale[index + 1]);
  if (!a || !b) return scale[Math.round(position)];
  const local = position - index;
  const mix = a.map((channel, i) => Math.round(channel + (b[i] - channel) * local));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
};

/** Agrega transparencia a un color hex. */
export const withAlpha = (color: string, alpha: number): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
};

/** Texto legible (claro u oscuro) sobre un color de fondo. */
export const readableTextOn = (color: string): string => {
  const rgbMatch = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
  const rgb = rgbMatch
    ? [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])]
    : hexToRgb(color);
  if (!rgb) return "#111418";
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.6 ? "#111418" : "#ffffff";
};

// ─── Formatos ─────────────────────────────────────────────────────────

export type CnChartValueFormat =
  | "number"
  | "integer"
  | "currency"
  | "percent"
  | "compact"
  | "compactCurrency"
  | "bytes"
  | "duration"
  | ((value: number) => string);

export type CnChartFormatOptions = {
  locale?: string;
  currency?: string;
  decimals?: number;
  /** `percent`: los valores vienen de 0 a 100 (default) o de 0 a 1. */
  percentScale?: 100 | 1;
  prefix?: string;
  suffix?: string;
};

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"];

/** Crea un formateador de números con los formatos de Canek (es-MX por defecto). */
export const createValueFormatter = (
  format: CnChartValueFormat = "number",
  options: CnChartFormatOptions = {},
): ((value: number | null | undefined) => string) => {
  const { locale = "es-MX", currency = "MXN", decimals, percentScale = 100 } = options;
  const wrap = (text: string) => `${options.prefix ?? ""}${text}${options.suffix ?? ""}`;

  if (typeof format === "function") {
    return (value) => (value == null || Number.isNaN(value) ? "—" : wrap(format(value)));
  }

  const formatter = (() => {
    switch (format) {
      case "integer":
        return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
      case "currency":
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: decimals ?? 2,
          maximumFractionDigits: decimals ?? 2,
        });
      case "compactCurrency":
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          notation: "compact",
          maximumFractionDigits: decimals ?? 1,
        });
      case "percent":
        return new Intl.NumberFormat(locale, {
          style: "percent",
          maximumFractionDigits: decimals ?? 1,
        });
      case "compact":
        return new Intl.NumberFormat(locale, {
          notation: "compact",
          maximumFractionDigits: decimals ?? 1,
        });
      default:
        return new Intl.NumberFormat(locale, { maximumFractionDigits: decimals ?? 2 });
    }
  })();

  return (value) => {
    if (value == null || Number.isNaN(value)) return "—";
    if (format === "percent") return wrap(formatter.format(value / percentScale));
    if (format === "bytes") {
      let size = Math.abs(value);
      let unit = 0;
      while (size >= 1024 && unit < BYTE_UNITS.length - 1) {
        size /= 1024;
        unit += 1;
      }
      const text = new Intl.NumberFormat(locale, {
        maximumFractionDigits: unit === 0 ? 0 : (decimals ?? 1),
      }).format(size);
      return wrap(`${value < 0 ? "-" : ""}${text} ${BYTE_UNITS[unit]}`);
    }
    if (format === "duration") {
      const total = Math.round(Math.abs(value));
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      const parts = [h ? `${h} h` : "", m ? `${m} min` : "", !h && s ? `${s} s` : ""].filter(
        Boolean,
      );
      return wrap(parts.join(" ") || "0 s");
    }
    return wrap(formatter.format(value));
  };
};

/** Suma de una serie ignorando vacíos. */
export const sumValues = (values: ReadonlyArray<number | null | undefined>): number =>
  values.reduce<number>((acc, value) => acc + (typeof value === "number" ? value : 0), 0);

/** Variación porcentual entre dos valores (null si no se puede calcular). */
export const percentChange = (current: number, previous: number): number | null => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

/** Regresión lineal simple: pendiente e intercepto. */
export const linearRegression = (
  points: ReadonlyArray<{ x: number; y: number }>,
): { slope: number; intercept: number; r2: number } | null => {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const { x, y } of points) {
    sx += x;
    sy += y;
    sxy += x * y;
    sxx += x * x;
    syy += y * y;
  }
  const denominator = n * sxx - sx * sx;
  if (denominator === 0) return null;
  const slope = (n * sxy - sx * sy) / denominator;
  const intercept = (sy - slope * sx) / n;
  const r = (n * sxy - sx * sy) / Math.sqrt(denominator * (n * syy - sy * sy) || 1);
  return { slope, intercept, r2: r * r };
};

/** Media móvil simple. */
export const movingAverage = (
  values: ReadonlyArray<number | null>,
  window: number,
): (number | null)[] =>
  values.map((_, index) => {
    if (index < window - 1) return null;
    const slice = values.slice(index - window + 1, index + 1);
    if (slice.some((v) => v == null)) return null;
    return sumValues(slice) / window;
  });

/** Agrupa valores crudos en intervalos (histograma). */
export const binValues = (
  values: ReadonlyArray<number>,
  bins = 10,
): { start: number; end: number; count: number }[] => {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return [];
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const size = (max - min || 1) / bins;
  const result = Array.from({ length: bins }, (_, i) => ({
    start: min + i * size,
    end: min + (i + 1) * size,
    count: 0,
  }));
  for (const value of clean) {
    const index = Math.min(bins - 1, Math.floor((value - min) / size));
    result[index].count += 1;
  }
  return result;
};
