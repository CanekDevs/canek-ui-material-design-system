/**
 * Exportación de filas sin dependencias: CSV (compatible con Excel), TSV,
 * JSON y portapapeles. Los valores se toman ya formateados para exportar.
 */

export type CnExportColumn = { id: string; header: string };
export type CnExportRow = Record<string, unknown>;
export type CnExportFormat = "csv" | "tsv" | "json" | "xls";

const toText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toText).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/**
 * Evita la inyección de fórmulas al abrir el archivo en Excel/Sheets: las
 * celdas que empiezan con `= + - @` (y tab/CR) se prefijan con un apóstrofo.
 */
export const neutralizeFormula = (text: string): string =>
  /^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text) ? `'${text}` : text;

const escapeDelimited = (text: string, delimiter: string): string => {
  const safe = neutralizeFormula(text);
  return /["\n\r]/.test(safe) || safe.includes(delimiter) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const rowsToDelimited = (
  columns: CnExportColumn[],
  rows: CnExportRow[],
  delimiter = ",",
): string => {
  const header = columns.map((c) => escapeDelimited(c.header, delimiter)).join(delimiter);
  const body = rows.map((row) =>
    columns.map((c) => escapeDelimited(toText(row[c.id]), delimiter)).join(delimiter),
  );
  return [header, ...body].join("\r\n");
};

export const rowsToJson = (columns: CnExportColumn[], rows: CnExportRow[]): string =>
  JSON.stringify(
    rows.map((row) => Object.fromEntries(columns.map((c) => [c.header, row[c.id] ?? null]))),
    null,
    2,
  );

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** Tabla HTML que Excel abre como hoja (`.xls`), conservando acentos. */
export const rowsToHtmlTable = (columns: CnExportColumn[], rows: CnExportRow[]): string => {
  const head = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(toText(row[c.id]))}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<html><head><meta charset="utf-8"></head><body><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
};

export const downloadText = (content: string, filename: string, mime: string): void => {
  if (typeof document === "undefined") return;
  // BOM para que Excel detecte UTF-8 (acentos y ñ).
  const needsBom = /csv|tab-separated|excel/.test(mime);
  const blob = new Blob([needsBom ? "﻿" : "", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const MIME: Record<CnExportFormat, { mime: string; ext: string }> = {
  csv: { mime: "text/csv;charset=utf-8", ext: "csv" },
  tsv: { mime: "text/tab-separated-values;charset=utf-8", ext: "tsv" },
  json: { mime: "application/json;charset=utf-8", ext: "json" },
  xls: { mime: "application/vnd.ms-excel;charset=utf-8", ext: "xls" },
};

export const serializeRows = (
  format: CnExportFormat,
  columns: CnExportColumn[],
  rows: CnExportRow[],
): string => {
  if (format === "json") return rowsToJson(columns, rows);
  if (format === "tsv") return rowsToDelimited(columns, rows, "\t");
  if (format === "xls") return rowsToHtmlTable(columns, rows);
  return rowsToDelimited(columns, rows, ",");
};

export const exportRows = (
  format: CnExportFormat,
  columns: CnExportColumn[],
  rows: CnExportRow[],
  filename = "export",
): void => {
  const { mime, ext } = MIME[format];
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const name = /\.\w+$/.test(filename) ? filename : `${filename}-${stamp}.${ext}`;
  downloadText(serializeRows(format, columns, rows), name, mime);
};

/** Copia como TSV (se pega como tabla en Excel/Sheets). Devuelve `true` si funcionó. */
export const copyRows = async (
  columns: CnExportColumn[],
  rows: CnExportRow[],
  format: "tsv" | "json" | "markdown" = "tsv",
): Promise<boolean> => {
  let text: string;
  if (format === "json") text = rowsToJson(columns, rows);
  else if (format === "markdown") {
    const cell = (v: unknown) => toText(v).replace(/\|/g, "\\|").replace(/\n/g, " ");
    text = [
      `| ${columns.map((c) => cell(c.header)).join(" | ")} |`,
      `| ${columns.map(() => "---").join(" | ")} |`,
      ...rows.map((row) => `| ${columns.map((c) => cell(row[c.id])).join(" | ")} |`),
    ].join("\n");
  } else {
    text = rowsToDelimited(columns, rows, "\t");
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
