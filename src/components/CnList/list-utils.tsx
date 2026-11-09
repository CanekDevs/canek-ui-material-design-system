import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import type { CnListColor, CnListDensity, CnListSize, CnListTone } from "./CnList.types";

// ─── Texto ────────────────────────────────────────────────────────────────

const DIACRITICS = /[̀-ͯ]/g;

/** Minúsculas y sin acentos (sin recortar espacios). */
const fold = (value: string) => value.normalize("NFD").replace(DIACRITICS, "").toLowerCase();

/** Texto normalizado para buscar (sin acentos, minúsculas, sin espacios extremos). */
export const normalizeListText = (value: string) => fold(value).trim();

/** Texto plano de un nodo (cadenas, números y arreglos; lo demás se ignora). */
export const nodeText = (node: ReactNode): string => {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join(" ");
  return "";
};

/**
 * Resalta las coincidencias de `query` en `text` sin distinguir acentos ni
 * mayúsculas (mapea cada carácter normalizado a su posición original).
 */
export const highlightText = (text: string, query: string): ReactNode => {
  const needle = normalizeListText(query);
  if (!needle) return text;
  let folded = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const piece = fold(text[i]);
    for (let j = 0; j < piece.length; j += 1) {
      folded += piece[j];
      map.push(i);
    }
  }
  const parts: ReactNode[] = [];
  let cursor = 0;
  let from = folded.indexOf(needle);
  while (from !== -1) {
    const start = map[from];
    const end = map[from + needle.length - 1] + 1;
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <Box
        component="mark"
        key={start}
        data-cn-list-highlight=""
        sx={{
          backgroundColor: "rgba(var(--cn-color-rgb-warning-500, 224, 160, 32), 0.28)",
          color: "inherit",
          borderRadius: "3px",
          px: "1px",
        }}
      >
        {text.slice(start, end)}
      </Box>,
    );
    cursor = end;
    from = folded.indexOf(needle, from + needle.length);
  }
  if (parts.length === 0) return text;
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};

// ─── Fechas ───────────────────────────────────────────────────────────────

const toDate = (value: Date | string | number) => (value instanceof Date ? value : new Date(value));

/** "ahora", "hace 5 min", "ayer", "hace 3 días" o "12 oct" / "12 oct 2023". */
export const formatRelativeTime = (value: Date | string | number, now = new Date()) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto", style: "short" });
  if (abs < 45) return "ahora";
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86400) return rtf.format(Math.round(seconds / 86400), "day");
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  }).format(date);
};

/** Fecha completa para el `title`/`dateTime`. */
export const formatFullDate = (value: Date | string | number) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return { label: "", iso: "" };
  return {
    label: new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" }).format(date),
    iso: date.toISOString(),
  };
};

// ─── Tokens ───────────────────────────────────────────────────────────────

export const COLOR_TOKENS: Record<CnListColor, { fg: string; bg: string; solid: string }> = {
  primary: {
    fg: "var(--cn-color-brand-600, #254d87)",
    bg: "rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.10)",
    solid: "var(--cn-color-brand-600, #254d87)",
  },
  secondary: {
    fg: "var(--cn-color-neutral-700, #363d45)",
    bg: "rgba(var(--cn-color-rgb-neutral-600, 78, 86, 96), 0.10)",
    solid: "var(--cn-color-neutral-700, #363d45)",
  },
  success: {
    fg: "var(--cn-color-success-600, #228740)",
    bg: "rgba(var(--cn-color-rgb-success-500, 46, 158, 79), 0.10)",
    solid: "var(--cn-color-success-600, #228740)",
  },
  warning: {
    fg: "var(--cn-color-warning-600, #b8831a)",
    bg: "rgba(var(--cn-color-rgb-warning-500, 224, 160, 32), 0.12)",
    solid: "var(--cn-color-warning-600, #b8831a)",
  },
  error: {
    fg: "var(--cn-color-error-600, #b52f2f)",
    bg: "rgba(var(--cn-color-rgb-error-500, 214, 60, 60), 0.10)",
    solid: "var(--cn-color-error-600, #b52f2f)",
  },
  info: {
    fg: "var(--cn-color-info-600, #2367a8)",
    bg: "rgba(var(--cn-color-rgb-info-500, 44, 123, 200), 0.10)",
    solid: "var(--cn-color-info-600, #2367a8)",
  },
  accent: {
    fg: "var(--cn-color-accent-500, #3d5afe)",
    bg: "rgba(var(--cn-color-rgb-accent-500, 61, 90, 254), 0.10)",
    solid: "var(--cn-color-accent-500, #3d5afe)",
  },
  neutral: {
    fg: "var(--cn-color-neutral-600, #4e5660)",
    bg: "rgba(var(--cn-color-rgb-neutral-500, 110, 118, 130), 0.10)",
    solid: "var(--cn-color-neutral-500, #6e7682)",
  },
};

export const isListColor = (value: string): value is CnListColor => value in COLOR_TOKENS;

/** Tinte de fondo y barra lateral por tono. */
export const TONE_TOKENS: Record<Exclude<CnListTone, "default">, { bar: string; bg: string }> = {
  primary: { bar: COLOR_TOKENS.primary.solid, bg: "rgba(37, 77, 135, 0.05)" },
  success: { bar: COLOR_TOKENS.success.solid, bg: "rgba(34, 135, 64, 0.06)" },
  warning: { bar: COLOR_TOKENS.warning.solid, bg: "rgba(196, 132, 16, 0.07)" },
  error: { bar: COLOR_TOKENS.error.solid, bg: "rgba(214, 60, 60, 0.06)" },
  info: { bar: COLOR_TOKENS.info.solid, bg: "rgba(34, 100, 159, 0.06)" },
  accent: { bar: COLOR_TOKENS.accent.solid, bg: "rgba(61, 90, 254, 0.06)" },
  neutral: { bar: COLOR_TOKENS.neutral.solid, bg: "rgba(110, 118, 130, 0.06)" },
};

/** Relleno vertical por densidad (igual que CnDataTable). */
export const DENSITY_PADDING: Record<CnListDensity, number> = {
  compact: 6,
  comfortable: 10,
  spacious: 16,
};

export type ListSizeTokens = {
  title: number;
  subtitle: number;
  description: number;
  meta: number;
  avatar: "sm" | "md" | "lg";
  avatarPx: number;
  iconBox: number;
  iconSize: number;
  padX: number;
  gap: number;
};

export const SIZE_TOKENS: Record<CnListSize, ListSizeTokens> = {
  sm: {
    title: 12,
    subtitle: 11,
    description: 11,
    meta: 11,
    avatar: "sm",
    avatarPx: 32,
    iconBox: 28,
    iconSize: 16,
    padX: 10,
    gap: 10,
  },
  md: {
    title: 13,
    subtitle: 12,
    description: 12,
    meta: 11,
    avatar: "md",
    avatarPx: 40,
    iconBox: 36,
    iconSize: 20,
    padX: 14,
    gap: 12,
  },
  lg: {
    title: 15,
    subtitle: 13,
    description: 13,
    meta: 12,
    avatar: "lg",
    avatarPx: 48,
    iconBox: 44,
    iconSize: 24,
    padX: 16,
    gap: 14,
  },
};

/** Alto estimado de una fila (para virtualizar y `visibleItems`). */
export const estimateRowHeight = (
  density: CnListDensity,
  size: CnListSize,
  options: { media?: boolean; subtitle?: boolean; description?: boolean; card?: boolean } = {},
) => {
  const tokens = SIZE_TOKENS[size];
  const text =
    Math.round(tokens.title * 1.4) +
    (options.subtitle ? Math.round(tokens.subtitle * 1.45) + 2 : 0) +
    (options.description ? Math.round(tokens.description * 1.5) * 2 + 2 : 0);
  const content = Math.max(text, options.media ? tokens.avatarPx : 24);
  return content + DENSITY_PADDING[density] * 2 + (options.card ? 2 : 0);
};
