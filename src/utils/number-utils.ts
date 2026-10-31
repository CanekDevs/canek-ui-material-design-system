export type SanitizeNumberOptions = {
  allowNegative?: boolean;
  /** Máximo de decimales permitidos; `0` acepta solo enteros. */
  decimals?: number;
};

/**
 * Limpia lo que el usuario escribe en un campo numérico: deja dígitos, un único
 * separador decimal (acepta `.` o `,`) y un signo negativo inicial opcional.
 * Conserva estados intermedios válidos como `"-"`, `"12."`.
 */
export const sanitizeNumericInput = (
  raw: string,
  { allowNegative = true, decimals }: SanitizeNumberOptions = {},
): string => {
  if (!raw) return "";
  const negative = allowNegative && raw.trim().startsWith("-");
  const normalized = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const allowDecimal = decimals === undefined || decimals > 0;
  const dotIndex = normalized.indexOf(".");
  let integerPart = dotIndex === -1 ? normalized : normalized.slice(0, dotIndex);
  let decimalPart = dotIndex === -1 ? "" : normalized.slice(dotIndex + 1).replace(/\./g, "");

  integerPart = integerPart.replace(/^0+(?=\d)/, "");
  if (decimals !== undefined) decimalPart = decimalPart.slice(0, decimals);

  let result = integerPart;
  if (allowDecimal && dotIndex !== -1) {
    result = `${integerPart || "0"}.${decimalPart}`;
  }
  return negative ? `-${result}` : result;
};

/** Convierte el texto del campo a número; devuelve `null` si está vacío o es inválido. */
export const parseNumericInput = (raw: string): number | null => {
  if (raw === "" || raw === "-" || raw === "." || raw === "-.") return null;
  const num = Number(raw.replace(/,/g, "."));
  return Number.isFinite(num) ? num : null;
};

export const clampNumber = (value: number, min?: number, max?: number): number => {
  let next = value;
  if (min !== undefined && next < min) next = min;
  if (max !== undefined && next > max) next = max;
  return next;
};

/** Redondea evitando errores de coma flotante (0.1 + 0.2). */
export const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const countDecimals = (value: number): number => {
  if (!Number.isFinite(value) || Number.isInteger(value)) return 0;
  const [, fraction = ""] = String(value).split(".");
  return fraction.length;
};

export const formatNumber = (
  value: number | null | undefined,
  {
    locale = "es-MX",
    decimals,
    grouping = true,
  }: { locale?: string; decimals?: number; grouping?: boolean } = {},
): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat(locale, {
    useGrouping: grouping,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals ?? 20,
  }).format(value);
};

export const formatCurrency = (
  value: number | null | undefined,
  currency: string,
  locale = "es-MX",
  decimals = 2,
): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return formatNumber(value, { locale, decimals });
  }
};

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};
