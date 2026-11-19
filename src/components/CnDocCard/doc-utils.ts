import { extensionOf, getFileKind } from "../CnFileField/file-utils";
import type { CnFileKind } from "../CnFileField/file-utils";

/** Tipos de documento: los de `CnFileField` más código fuente. */
export type CnDocKind = CnFileKind | "code";

const CODE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".py",
  ".java",
  ".kt",
  ".cs",
  ".go",
  ".rb",
  ".php",
  ".rs",
  ".swift",
  ".c",
  ".h",
  ".cpp",
  ".hpp",
  ".sql",
  ".sh",
  ".ps1",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".yml",
  ".yaml",
  ".xml",
]);

const CODE_MIMES = [
  "application/json",
  "application/javascript",
  "application/typescript",
  "application/xml",
  "application/x-sh",
  "text/javascript",
  "text/html",
  "text/css",
  "text/x-python",
];

/** Determina el tipo por MIME o extensión (reutiliza la lógica de `CnFileField`). */
export const getDocKind = (name: string, mime?: string): CnDocKind => {
  const lowerMime = (mime ?? "").toLowerCase();
  if (CODE_EXTENSIONS.has(extensionOf(name)) || CODE_MIMES.includes(lowerMime)) return "code";
  return getFileKind({ id: name, url: "", name, mime });
};

/** Ícono (`ICON_REGISTRY`) y color de cada tipo, alineados con `CnFileField`. */
export const DOC_KIND_META: Record<CnDocKind, { icon: string; color: string; label: string }> = {
  image: { icon: "image", color: "var(--cn-color-info-500, #2f7dc4)", label: "Imagen" },
  video: { icon: "movie", color: "var(--cn-color-accent-500, #3d5afe)", label: "Video" },
  audio: { icon: "audio_file", color: "var(--cn-color-warning-600, #b8831a)", label: "Audio" },
  pdf: { icon: "picture_as_pdf", color: "var(--cn-color-error-500, #d63c3c)", label: "PDF" },
  document: {
    icon: "description",
    color: "var(--cn-color-brand-500, #3562a6)",
    label: "Documento",
  },
  spreadsheet: {
    icon: "table_chart",
    color: "var(--cn-color-success-600, #228740)",
    label: "Hoja de cálculo",
  },
  presentation: {
    icon: "slideshow",
    color: "var(--cn-color-warning-600, #b8831a)",
    label: "Presentación",
  },
  archive: {
    icon: "folder_zip",
    color: "var(--cn-color-neutral-600, #4e5660)",
    label: "Comprimido",
  },
  text: { icon: "article", color: "var(--cn-color-neutral-600, #4e5660)", label: "Texto" },
  code: { icon: "code", color: "var(--cn-color-accent-600, #3349d6)", label: "Código" },
  other: {
    icon: "insert_drive_file",
    color: "var(--cn-color-neutral-500, #6e7682)",
    label: "Archivo",
  },
};

/** Extensión en mayúsculas sin punto ("PDF", "XLSX"), o cadena vacía. */
export const extensionLabel = (name: string): string => extensionOf(name).slice(1).toUpperCase();

const toDate = (value: Date | string | number): Date | null => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Fecha relativa en español: "hace 5 min", "hace 3 h", "ayer", "hace 4 días";
 * a partir de una semana, fecha corta ("12 mar 2026").
 */
export const formatDocDate = (value: Date | string | number, now: Date = new Date()): string => {
  const date = toDate(value);
  if (!date) return "";
  const diff = now.getTime() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (diff >= 0) {
    if (minutes < 1) return "justo ahora";
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.round(hours / 24);
    if (days === 1) return "ayer";
    if (days < 7) return `hace ${days} días`;
  }
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" })
    .format(date)
    .replace(/\./g, "");
};
