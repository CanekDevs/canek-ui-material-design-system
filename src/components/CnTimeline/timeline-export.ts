import type { CnTimelineExportFormat, CnTimelineItem } from "./CnTimeline.types";
import { toPlainText, toValidDate } from "./timeline-utils";

/*
 * Exportación de la bitácora (CSV para hojas de cálculo, JSON para sistemas).
 * Todo el contenido JSX se reduce a texto plano.
 */

export type CnTimelineExportRow = {
  id: string;
  fecha: string;
  tipo: string;
  titulo: string;
  autor: string;
  estado: string;
  descripcion: string;
  cambios: { campo: string; antes: string; despues: string }[];
  etiquetas: string[];
};

export const timelineToRows = (items: readonly CnTimelineItem[]): CnTimelineExportRow[] =>
  items.map((item) => ({
    id: item.id,
    fecha: toValidDate(item.time)?.toISOString() ?? toPlainText(item.timeLabel),
    tipo: item.type ?? "",
    titulo: toPlainText(item.title),
    autor: toPlainText(item.actor),
    estado: item.status ?? "",
    descripcion: toPlainText(item.description),
    cambios: (item.changes ?? []).map((c) => ({
      campo: toPlainText(c.field),
      antes: toPlainText(c.before),
      despues: toPlainText(c.after),
    })),
    etiquetas: (item.tags ?? []).map((t) => (typeof t === "string" ? t : t.label)),
  }));

const CSV_HEADERS = [
  "id",
  "fecha",
  "tipo",
  "titulo",
  "autor",
  "estado",
  "descripcion",
  "cambios",
  "etiquetas",
];

/** Celda CSV escapada; neutraliza fórmulas (`=`, `+`, `-`, `@`) al abrirse en Excel. */
const csvCell = (value: string): string => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const timelineToCsv = (items: readonly CnTimelineItem[]): string => {
  const lines = timelineToRows(items).map((row) =>
    [
      row.id,
      row.fecha,
      row.tipo,
      row.titulo,
      row.autor,
      row.estado,
      row.descripcion,
      row.cambios.map((c) => `${c.campo}: ${c.antes} → ${c.despues}`).join(" | "),
      row.etiquetas.join(", "),
    ]
      .map(csvCell)
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...lines].join("\r\n");
};

export const timelineToJson = (items: readonly CnTimelineItem[]): string =>
  JSON.stringify(timelineToRows(items), null, 2);

/** Descarga la bitácora en el formato pedido (CSV con BOM para que Excel respete los acentos). */
export const downloadTimeline = (
  items: readonly CnTimelineItem[],
  format: CnTimelineExportFormat,
  fileName = "historial",
): void => {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return;
  const blob =
    format === "csv"
      ? new Blob(["﻿", timelineToCsv(items)], { type: "text/csv;charset=utf-8" })
      : new Blob([timelineToJson(items)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL?.(url), 0);
};
