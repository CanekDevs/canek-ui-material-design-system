/**
 * Exportación de filas sin dependencias: XLSX real (Office Open XML), CSV
 * compatible con Excel, TSV, JSON, HTML, PDF (vista de impresión) y
 * portapapeles. El texto de los datos siempre se escapa.
 */

/** Tipo de dato de la columna: define el formato numérico en XLSX. */
export type CnExportKind =
  "text" | "number" | "integer" | "currency" | "percent" | "date" | "datetime";

export type CnExportColumn = {
  id: string;
  header: string;
  kind?: CnExportKind;
  /** Ancho aproximado en caracteres (XLSX). */
  width?: number;
};
export type CnExportRow = Record<string, unknown>;
/** `xls` se conserva como alias de `xlsx`. */
export type CnExportFormat = "xlsx" | "xls" | "csv" | "tsv" | "json" | "html" | "pdf";

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

const htmlDocument = (
  columns: CnExportColumn[],
  rows: CnExportRow[],
  title: string,
  extra = "",
): string => {
  const head = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((c) => {
            const numeric =
              c.kind && c.kind !== "text" && c.kind !== "date" && c.kind !== "datetime";
            return `<td${numeric ? ' class="n"' : ""}>${escapeHtml(toText(row[c.id]))}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("");
  const stamp = new Date().toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #222831; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { margin: 0 0 16px; color: #6e7682; font-size: 12px; }
  .wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #254d87; color: #fff; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #dde0e4; vertical-align: top; }
  td.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  tr:nth-child(even) td { background: #f7f8fa; }
  @page { size: landscape; margin: 12mm; }
  @media print { th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<h1>${escapeHtml(title)}</h1><p>${rows.length} ${rows.length === 1 ? "registro" : "registros"} · ${escapeHtml(stamp)}</p>
<div class="wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${extra}
</body></html>`;
};

/** Tabla HTML autocontenida (también la usa la vista de impresión). */
export const rowsToHtmlTable = (
  columns: CnExportColumn[],
  rows: CnExportRow[],
  title = "Tabla",
): string => htmlDocument(columns, rows, title);

// ─── XLSX (Office Open XML) sin dependencias ──────────────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

/** ZIP sin compresión (método "store"), suficiente para XLSX. */
export const zipStore = (files: { name: string; data: Uint8Array }[]): Uint8Array => {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8
    local.setUint16(8, 0, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, file.data.length, true);
    local.setUint32(22, file.data.length, true);
    local.setUint16(26, name.length, true);
    const localBytes = new Uint8Array(local.buffer);
    chunks.push(localBytes, name, file.data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, file.data.length, true);
    entry.setUint32(24, file.data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += localBytes.length + name.length + file.data.length;
  }
  const centralSize = central.reduce((sum, c) => sum + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((sum, c) => sum + c.length, 0));
  let pos = 0;
  for (const chunk of all) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
};

/** Quita caracteres de control que XML 1.0 no admite (salvo tab y saltos de línea). */
const stripControl = (text: string) =>
  Array.from(text)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join("");

const xmlEscape = (text: string) =>
  stripControl(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const columnLetter = (index: number): string => {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
};

const toSerialDate = (value: unknown): number | null => {
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value);
    if (m)
      date = new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        Number(m[4] ?? 0),
        Number(m[5] ?? 0),
      );
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  const utc = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  );
  return (utc - Date.UTC(1899, 11, 30)) / 86400000;
};

const STYLE_BY_KIND: Record<CnExportKind, number> = {
  text: 0,
  number: 6,
  integer: 7,
  currency: 2,
  percent: 3,
  date: 4,
  datetime: 5,
};

/**
 * Libro XLSX con encabezado estilizado, fila congelada, filtro automático,
 * anchos de columna y celdas numéricas/fecha reales. `raw` (opcional) aporta
 * los valores sin formato por fila para las columnas no textuales.
 */
export const rowsToXlsx = (
  columns: CnExportColumn[],
  rows: CnExportRow[],
  options: { sheetName?: string; raw?: CnExportRow[] } = {},
): Uint8Array => {
  const encoder = new TextEncoder();
  const sheetName = xmlEscape(
    (options.sheetName ?? "Datos").replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Datos",
  );
  const lastCol = columnLetter(Math.max(columns.length - 1, 0));
  const widths = columns.map((column) => {
    if (column.width) return column.width;
    const longest = rows
      .slice(0, 200)
      .reduce((max, row) => Math.max(max, toText(row[column.id]).length), column.header.length);
    return Math.min(Math.max(longest + 2, 8), 60);
  });

  const cell = (ref: string, column: CnExportColumn, text: unknown, raw: unknown): string => {
    const kind = column.kind ?? "text";
    if (kind === "date" || kind === "datetime") {
      const serial = toSerialDate(raw ?? text);
      if (serial !== null) return `<c r="${ref}" s="${STYLE_BY_KIND[kind]}"><v>${serial}</v></c>`;
    } else if (kind !== "text") {
      const source = raw ?? text;
      const n =
        typeof source === "number" ? source : Number(String(source ?? "").replace(/[^\d.-]/g, ""));
      if (source !== null && source !== undefined && source !== "" && Number.isFinite(n)) {
        const value = kind === "percent" ? n / 100 : n;
        return `<c r="${ref}" s="${STYLE_BY_KIND[kind]}"><v>${value}</v></c>`;
      }
    }
    const str = toText(text);
    if (!str) return "";
    return `<c r="${ref}" t="inlineStr" s="8"><is><t xml:space="preserve">${xmlEscape(str)}</t></is></c>`;
  };

  const header = `<row r="1" spans="1:${columns.length}">${columns
    .map(
      (c, i) =>
        `<c r="${columnLetter(i)}1" t="inlineStr" s="1"><is><t>${xmlEscape(c.header)}</t></is></c>`,
    )
    .join("")}</row>`;
  const body = rows
    .map((row, r) => {
      const raw = options.raw?.[r] ?? {};
      return `<row r="${r + 2}">${columns.map((c, i) => cell(`${columnLetter(i)}${r + 2}`, c, row[c.id], raw[c.id])).join("")}</row>`;
    })
    .join("");

  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="16"/><cols>${widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join(
      "",
    )}</cols><sheetData>${header}${body}</sheetData>${columns.length ? `<autoFilter ref="A1:${lastCol}${rows.length + 1}"/>` : ""}</worksheet>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/><numFmt numFmtId="165" formatCode="0.0%"/><numFmt numFmtId="166" formatCode="dd/mm/yyyy hh:mm"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF254D87"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFDDE0E4"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="9">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="14" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const files = [
    {
      name: "[Content_Types].xml",
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets>${columns.length ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${sheetName.replace(/'/g, "''")}'!$A$1:$${lastCol}$${rows.length + 1}</definedName></definedNames>` : ""}</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { name: "xl/styles.xml", xml: styles },
    { name: "xl/worksheets/sheet1.xml", xml: sheet },
  ];
  return zipStore(files.map((f) => ({ name: f.name, data: encoder.encode(f.xml) })));
};

// ─── Descarga / impresión ─────────────────────────────────────────────────

export const downloadBlob = (blob: Blob, filename: string): void => {
  if (typeof document === "undefined") return;
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

export const downloadText = (content: string, filename: string, mime: string): void => {
  // BOM para que Excel detecte UTF-8 (acentos y ñ).
  const needsBom = /csv|tab-separated/.test(mime);
  downloadBlob(new Blob([needsBom ? "﻿" : "", content], { type: mime }), filename);
};

const MIME: Record<Exclude<CnExportFormat, "pdf">, { mime: string; ext: string }> = {
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ext: "xlsx" },
  xls: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ext: "xlsx" },
  csv: { mime: "text/csv;charset=utf-8", ext: "csv" },
  tsv: { mime: "text/tab-separated-values;charset=utf-8", ext: "tsv" },
  json: { mime: "application/json;charset=utf-8", ext: "json" },
  html: { mime: "text/html;charset=utf-8", ext: "html" },
};

export const serializeRows = (
  format: Exclude<CnExportFormat, "xlsx" | "xls" | "pdf">,
  columns: CnExportColumn[],
  rows: CnExportRow[],
  title = "Tabla",
): string => {
  if (format === "json") return rowsToJson(columns, rows);
  if (format === "tsv") return rowsToDelimited(columns, rows, "\t");
  if (format === "html") return htmlDocument(columns, rows, title);
  return rowsToDelimited(columns, rows, ",");
};

/**
 * Abre una vista de impresión con la tabla (título, fecha y conteo); desde
 * ahí se imprime o se guarda como PDF.
 */
export const printRows = (
  columns: CnExportColumn[],
  rows: CnExportRow[],
  title = "Tabla",
): boolean => {
  if (typeof window === "undefined") return false;
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return false;
  win.document.write(
    htmlDocument(
      columns,
      rows,
      title,
      "<script>window.onload = function () { window.focus(); window.print(); };</script>",
    ),
  );
  win.document.close();
  return true;
};

const fileStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

/** Descarga las filas en el formato indicado (`pdf` abre la vista de impresión). */
export const exportRows = (
  format: CnExportFormat,
  columns: CnExportColumn[],
  rows: CnExportRow[],
  filename = "export",
  options: { title?: string; raw?: CnExportRow[] } = {},
): boolean => {
  const title = options.title ?? filename;
  if (format === "pdf") return printRows(columns, rows, title);
  const { mime, ext } = MIME[format];
  const name = /\.\w+$/.test(filename) ? filename : `${filename}_${fileStamp()}.${ext}`;
  if (format === "xlsx" || format === "xls") {
    const bytes = rowsToXlsx(columns, rows, { sheetName: title, raw: options.raw });
    downloadBlob(new Blob([bytes as unknown as BlobPart], { type: mime }), name);
    return true;
  }
  downloadText(serializeRows(format, columns, rows, title), name, mime);
  return true;
};

/** Copia al portapapeles (TSV se pega como tabla en Excel/Sheets). */
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
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
};
