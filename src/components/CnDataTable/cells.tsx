import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import type { MouseEvent, ReactNode } from "react";
import { Fragment, createElement, useCallback, useEffect, useRef, useState } from "react";
import { formatIsoDisplay } from "../../utils/date-utils";
import { getInitials } from "../../utils/option-media";
import { CnCalendar } from "../CnCalendar";
import { getSafeUrl } from "../CnFileField/file-utils";
import { CnFlagIcon } from "../CnFlagIcon";
import { CnSparkline } from "../CnMetricCard/CnMetricCard";
import { normalizeDateValue } from "../CnForm/CnForm.engine";
import { CnIcon } from "../CnIcon";
import { ICON_ALIASES, ICON_REGISTRY } from "../CnIcon/icons";
import type {
  CnCellThresholds,
  CnPriorityOption,
  CnRichFormat,
  CnStageOption,
} from "./cell-formats";
import {
  WEEKDAY_LETTERS,
  WEEKDAY_NAMES,
  ageFrom,
  asReference,
  compareVersions,
  computeDelta,
  describeDeadline,
  detectRichFormat,
  isUuid,
  minutesText,
  normalizeStages,
  parseIp,
  parseNumericRange,
  parseSteps,
  parseTimeRange,
  parseVersion,
  parseWeekdays,
  resolvePriority,
  resolveSentiment,
  stripRichText,
  truncateMiddle,
  weekdaysText,
} from "./cell-formats";

// ─── Tipos ──────────────────────────────────────────────────────────────

/** Tipos de celda integrados. */
export type CnCellType =
  | "text"
  | "id"
  | "code"
  | "rfc"
  | "curp"
  | "number"
  | "currency"
  | "percent"
  | "progress"
  | "date"
  | "datetime"
  | "time"
  | "duration"
  | "boolean"
  | "status"
  | "tags"
  | "avatar"
  | "contact"
  | "email"
  | "phone"
  | "link"
  | "location"
  | "image"
  | "rating"
  | "file"
  | "color"
  | "country"
  | "json"
  | "daterange"
  | "bytes"
  | "sparkline"
  | "list"
  | "coordinates"
  | "masked"
  | "delta"
  | "priority"
  | "deadline"
  | "ip"
  | "uuid"
  | "version"
  | "richtext"
  | "icon"
  | "toggle"
  | "steps"
  | "stage"
  | "weekdays"
  | "timerange"
  | "age"
  | "range"
  | "sentiment"
  | "score"
  | "reference"
  | "counter";

export type CnCellTone =
  "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral";

export type CnStatusOption = {
  label?: ReactNode;
  color?: CnCellTone | "secondary";
  icon?: string;
  description?: string;
};

/** Opciones de formato por tipo de celda. */
export type CnCellOptions = {
  locale?: string;
  /** number / currency / percent: decimales. */
  decimals?: number;
  /** currency: código ISO (MXN, USD…); puede depender de la fila. */
  currency?: string | ((row: unknown) => string | undefined);
  /** percent: el valor viene en 0–100 (por defecto) o en 0–1 (`fraction`). */
  percentScale?: "hundred" | "fraction";
  /** date / datetime: muestra "hace 3 días" bajo la fecha. Por defecto `true`. */
  relative?: boolean;
  /** status / boolean: mapa valor → etiqueta, color, ícono. */
  statusMap?: Record<string, CnStatusOption>;
  trueLabel?: ReactNode;
  falseLabel?: ReactNode;
  /** Subtítulo bajo el valor (avatar, email, text, code…). */
  subtitle?: (row: unknown) => ReactNode;
  /** avatar: imagen. */
  image?: (row: unknown) => string | undefined;
  /** link: URL (por defecto el valor). */
  href?: (row: unknown) => string | undefined;
  /** tags: máximo visible antes de "+N". */
  maxTags?: number;
  /** progress / rating: máximo. */
  max?: number;
  /** number / currency / percent: valor anterior para mostrar tendencia. */
  previous?: (row: unknown) => number | undefined;
  /** text: ícono antes del texto; code: ícono de la píldora. */
  icon?: string;
  /** id: prefijo (`#`, `EMP-`…). */
  prefix?: string;
  /** Color de la píldora (id, code, text con `pill`). */
  tone?: CnCellTone;
  /** text: muestra el texto como píldora. */
  pill?: boolean;
  /** text: líneas antes de truncar. */
  lines?: number;
  /** Texto cuando no hay valor (por defecto según el tipo: "Sin correo"…). */
  emptyText?: string;
  /** Botón para copiar el valor. Por defecto según el tipo. */
  copyable?: boolean;
  /** phone: acceso directo a WhatsApp. */
  whatsapp?: boolean;
  /** date / datetime / time: formato propio (`"D [de] MMMM YYYY"`, `"HH:mm"`…). */
  dateFormat?: string;
  /** text / code: transformación del texto. */
  transform?: "uppercase" | "lowercase" | "capitalize";
  /** text: en negritas. */
  bold?: boolean;
  /** id: sufijo; number: unidad (`"kg"`, `"pzas"`, `"hrs"`). */
  suffix?: string;
  /** text / code: caracteres visibles (el texto completo queda en el tooltip). */
  maxLength?: number;
  /** duration: unidad del valor. Por defecto minutos. */
  durationUnit?: "seconds" | "minutes" | "hours";
  /** Contexto del vacío: `not_assigned`, `pending`, `not_applicable`… */
  emptyContext?: CnEmptyContext;
  /** number / currency / percent: sin píldora (solo el número). */
  plain?: boolean;
  /** percent: barra de avance junto al valor. */
  bar?: boolean;
  /** avatar / contact: forma del avatar. */
  avatarShape?: "circle" | "rounded" | "square";
  /** avatar: insignia junto al nombre (rol, estado…). */
  badge?: (row: unknown) => { label: ReactNode; tone?: CnCellTone } | undefined;
  /** location: enlace para abrir la dirección en Google Maps. */
  mapLink?: boolean;
  /** link: texto del enlace (por defecto el dominio). */
  linkLabel?: (row: unknown) => string | undefined;
  /** contact / image: máximo de elementos visibles. */
  maxItems?: number;
  /** currency: muestra el importe con letra en el detalle (MXN por defecto). */
  amountInWords?: boolean;
  /** masked: caracteres visibles al final (por defecto 4). */
  visibleChars?: number;
  /** location / coordinates: vista previa del mapa en el detalle. Por defecto `true`. */
  mapPreview?: boolean;
  /** text: largo a partir del cual se ofrece "Ver completo". Por defecto 80. */
  expandAfter?: number;
  /** Desactiva la ficha de detalle al hacer clic (fechas, dinero, RFC…). */
  detail?: boolean;
  /** Acción al hacer clic en la celda (avatar, contact, tags, text, code, id, reference). */
  onClick?: (value: unknown, row: unknown) => void;

  // ─── Tipos adicionales ───────────────────────────────────────────────
  /** delta: formato del cambio. Por defecto `percent`. */
  deltaFormat?: "percent" | "number" | "currency";
  /** delta: invierte los colores (bajar es bueno: costos, tiempos, errores). */
  invertTrend?: boolean;
  /** priority: mapa valor → etiqueta, tono, nivel (1–4) e ícono. */
  priorityMap?: Record<string, CnPriorityOption>;
  /** priority: barras de nivel (por defecto), bandera o ícono. */
  priorityStyle?: "bars" | "flag" | "icon";
  /**
   * Umbrales de tono. deadline: horas restantes (`danger` 24, `warning` 72).
   * score: valores mínimos (`success` 80 % y `warning` 50 % de `max`).
   */
  thresholds?: CnCellThresholds;
  /** deadline: la tarea ya se cumplió (muestra "Cumplido" en lugar de la cuenta). */
  done?: (row: unknown) => boolean;
  /** version: última versión disponible (marca "Última" o "Desactualizada"). */
  latestVersion?: string | ((row: unknown) => string | undefined);
  /** richtext: formato del contenido. Por defecto lo detecta (`auto`). */
  richFormat?: CnRichFormat;
  /** icon: solo el ícono (la etiqueta queda en el tooltip). */
  iconOnly?: boolean;
  /** toggle: cambio del interruptor; sin él queda deshabilitado. */
  onChange?: (row: unknown, next: boolean) => void;
  /** steps: etiquetas de cada paso (definen el total). */
  stepLabels?: string[];
  /** steps: puntos o barra segmentada (por defecto). */
  stepsStyle?: "dots" | "bar";
  /** stage: etapas en orden. */
  stages?: readonly (string | CnStageOption)[];
  /** stage: flechas (por defecto) o puntos. */
  stageStyle?: "chevrons" | "dots";
  /** timerange: muestra la duración bajo el horario. Por defecto `true`. */
  showDuration?: boolean;
  /** range: formato de los extremos. Por defecto `number`. */
  rangeFormat?: "number" | "currency" | "percent";
  /** sentiment: escala de la puntuación numérica. Por defecto `auto`. */
  sentimentScale?: "auto" | "unit" | "five";
  /** counter: no muestra nada cuando el conteo es cero. */
  hideZero?: boolean;
};

/** Contacto para celdas `contact` (uno o una lista). */
export type CnContact = {
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  position?: string;
};

export type CnEmptyContext =
  | "empty"
  | "not_assigned"
  | "not_available"
  | "not_applicable"
  | "pending"
  | "none"
  | "no_data"
  | "not_found"
  | "inactive"
  | "deleted"
  | "success"
  | "active"
  | "cancelled"
  | "expired"
  | "draft"
  | "archived"
  | "no_value"
  | "null";

// ─── Paleta ─────────────────────────────────────────────────────────────

const TONE: Record<CnCellTone | "secondary", { rgb: string; dark: string }> = {
  primary: { rgb: "37, 77, 135", dark: "var(--cn-color-brand-700, #1c3d6d)" },
  accent: { rgb: "61, 90, 254", dark: "var(--cn-color-accent-700, #2a3cb8)" },
  success: { rgb: "34, 135, 64", dark: "var(--cn-color-success-700, #1b6b33)" },
  warning: { rgb: "196, 132, 16", dark: "var(--cn-color-warning-700, #8f6614)" },
  error: { rgb: "214, 60, 60", dark: "var(--cn-color-error-700, #922626)" },
  info: { rgb: "34, 100, 159", dark: "var(--cn-color-info-700, #1b4f7e)" },
  neutral: { rgb: "78, 86, 96", dark: "var(--cn-color-neutral-800, #2d333a)" },
  secondary: { rgb: "78, 86, 96", dark: "var(--cn-color-neutral-800, #2d333a)" },
};

const MONO = "var(--cn-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)";

// ─── Utilidades ─────────────────────────────────────────────────────────

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const toDate = (value: unknown, kind: "date" | "datetime" | "time"): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const iso = normalizeDateValue(value, kind === "time" ? "time" : "datetime");
  if (!iso) return null;
  if (kind === "time") {
    const [h, m] = iso.split(":").map(Number);
    return Number.isFinite(h) ? new Date(2000, 0, 1, h, m || 0) : null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso);
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
  );
};

const pad = (n: number) => String(n).padStart(2, "0");

/** "hace 3 días", "en 2 meses". */
export const formatRelative = (date: Date, now = new Date()): string => {
  const diff = (date.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    if (abs >= seconds) return rtf.format(Math.trunc(diff / seconds), unit);
  }
  return "justo ahora";
};

const formatPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  const plus = raw.trim().startsWith("+");
  if (digits.length === 10) return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  if (digits.length === 12 && plus) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  }
  return raw;
};

const AVATAR_COLORS = [
  "#254d87",
  "#2f7dc4",
  "#228740",
  "#b8831a",
  "#8e44ad",
  "#c0392b",
  "#16a085",
  "#5b6b7f",
];

/** Color estable por nombre (mismo nombre, mismo color). */
export const colorFromText = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const applyTransform = (text: string, transform?: CnCellOptions["transform"]) => {
  if (transform === "uppercase") return text.toLocaleUpperCase("es");
  if (transform === "lowercase") return text.toLocaleLowerCase("es");
  if (transform === "capitalize") {
    return text
      .toLocaleLowerCase("es")
      .replace(
        /(^|\s|-)(\p{L})/gu,
        (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("es"),
      );
  }
  return text;
};

const truncate = (text: string, max?: number) =>
  max && text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;

const asContacts = (value: unknown): CnContact[] => {
  const list = Array.isArray(value) ? value : [value];
  return list
    .filter(Boolean)
    .map((item) =>
      typeof item === "string"
        ? { name: item }
        : {
            name: String(
              (item as Record<string, unknown>).name ??
                (item as Record<string, unknown>).label ??
                "",
            ),
            email: (item as CnContact).email,
            phone: (item as CnContact).phone,
            avatar: (item as CnContact).avatar,
            position: (item as CnContact).position,
          },
    )
    .filter((c) => c.name);
};

const toImageList = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value])
    .map((item) =>
      typeof item === "string"
        ? item
        : String(
            (item as Record<string, unknown>)?.url ?? (item as Record<string, unknown>)?.src ?? "",
          ),
    )
    .filter(Boolean);

type CnFileLike = { name: string; url?: string; size?: number; type?: string };

const asFiles = (value: unknown): CnFileLike[] =>
  (Array.isArray(value) ? value : [value]).filter(Boolean).map((item) => {
    if (typeof item === "string") {
      const clean = item.split(/[?#]/)[0];
      return { name: decodeURIComponent(clean.split("/").pop() || "archivo"), url: item };
    }
    const obj = item as Record<string, unknown>;
    return {
      name: String(obj.name ?? obj.filename ?? obj.label ?? "archivo"),
      url: (obj.url ?? obj.href ?? obj.src) as string | undefined,
      size: typeof obj.size === "number" ? obj.size : undefined,
      type: (obj.type ?? obj.mime) as string | undefined,
    };
  });

const FILE_ICONS: [RegExp, string, CnCellTone][] = [
  [/\.(pdf)$/i, "picture_as_pdf", "error"],
  [/\.(xlsx?|csv|ods)$/i, "table_chart", "success"],
  [/\.(docx?|odt|rtf|txt|md)$/i, "description", "info"],
  [/\.(pptx?|odp|key)$/i, "slideshow", "warning"],
  [/\.(png|jpe?g|gif|webp|svg|bmp|heic)$/i, "image", "accent"],
  [/\.(mp4|mov|avi|mkv|webm)$/i, "movie", "accent"],
  [/\.(mp3|wav|ogg|m4a|flac)$/i, "audio_file", "warning"],
  [/\.(zip|rar|7z|tar|gz)$/i, "folder_zip", "neutral"],
  [/\.(xml|json|ya?ml)$/i, "data_object", "neutral"],
];

const fileVisual = (name: string): { icon: string; tone: CnCellTone } => {
  const found = FILE_ICONS.find(([re]) => re.test(name));
  return found
    ? { icon: found[1], tone: found[2] }
    : { icon: "insert_drive_file", tone: "neutral" };
};

/** "1.2 MB", "350 KB". */
export const formatBytesText = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toLocaleString("es-MX", { maximumFractionDigits: value < 10 ? 1 : 0 })} ${units[unit]}`;
};

const countryName = (code: string, locale = "es-MX"): string | undefined => {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? undefined;
  } catch {
    return undefined;
  }
};

const asRange = (value: unknown): [unknown, unknown] => {
  if (Array.isArray(value)) return [value[0], value[1]];
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return [obj.start ?? obj.from, obj.end ?? obj.to];
  }
  return [value, undefined];
};

const asPoint = (value: unknown): { lat: number; lng: number } | null => {
  let lat: number | undefined;
  let lng: number | undefined;
  if (Array.isArray(value)) [lat, lng] = value.map(Number);
  else if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    lat = Number(obj.lat ?? obj.latitude);
    lng = Number(obj.lng ?? obj.lon ?? obj.longitude);
  } else if (typeof value === "string" && value.includes(",")) {
    [lat, lng] = value.split(",").map(Number);
  }
  return lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng }
    : null;
};

const UNITS = [
  "",
  "UN",
  "DOS",
  "TRES",
  "CUATRO",
  "CINCO",
  "SEIS",
  "SIETE",
  "OCHO",
  "NUEVE",
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISÉIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
  "VEINTE",
  "VEINTIÚN",
  "VEINTIDÓS",
  "VEINTITRÉS",
  "VEINTICUATRO",
  "VEINTICINCO",
  "VEINTISÉIS",
  "VEINTISIETE",
  "VEINTIOCHO",
  "VEINTINUEVE",
];
const TENS = [
  "",
  "",
  "",
  "TREINTA",
  "CUARENTA",
  "CINCUENTA",
  "SESENTA",
  "SETENTA",
  "OCHENTA",
  "NOVENTA",
];
const HUNDREDS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

const hundredsToWords = (n: number): string => {
  if (n === 100) return "CIEN";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let words = HUNDREDS[h];
  if (rest > 0) {
    let part: string;
    if (rest < 30) part = UNITS[rest];
    else part = TENS[Math.floor(rest / 10)] + (rest % 10 ? ` Y ${UNITS[rest % 10]}` : "");
    words = words ? `${words} ${part}` : part;
  }
  return words;
};

/** Entero en letras (español, mayúsculas): 1250 → "MIL DOSCIENTOS CINCUENTA". */
export const numberToSpanishWords = (value: number): string => {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "CERO";
  const parts: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  if (millions) {
    parts.push(millions === 1 ? "UN MILLÓN" : `${numberToSpanishWords(millions)} MILLONES`);
  }
  if (thousands) parts.push(thousands === 1 ? "MIL" : `${hundredsToWords(thousands)} MIL`);
  if (rest) parts.push(hundredsToWords(rest));
  return parts.join(" ").replace(/\s+/g, " ").trim();
};

/** Importe con letra para facturas y cheques: "MIL PESOS 50/100 M.N.". */
export const amountInWords = (value: number, currency = "MXN"): string => {
  const cents = Math.round((Math.abs(value) % 1) * 100);
  const integer = Math.floor(Math.abs(value));
  const words = numberToSpanishWords(integer);
  const names: Record<string, [string, string, string]> = {
    MXN: ["PESO", "PESOS", "M.N."],
    USD: ["DÓLAR", "DÓLARES", "USD"],
    EUR: ["EURO", "EUROS", "EUR"],
  };
  const [one, many, suffix] = names[currency] ?? [currency, currency, currency];
  const noun = integer === 1 ? one : many;
  const de = /(MILLÓN|MILLONES)$/.test(words) ? " DE" : "";
  return `${value < 0 ? "MENOS " : ""}${words}${de} ${noun} ${String(cents).padStart(2, "0")}/100 ${suffix}`;
};

const CURP_STATES: Record<string, string> = {
  AS: "Aguascalientes",
  BC: "Baja California",
  BS: "Baja California Sur",
  CC: "Campeche",
  CL: "Coahuila",
  CM: "Colima",
  CS: "Chiapas",
  CH: "Chihuahua",
  DF: "Ciudad de México",
  DG: "Durango",
  GT: "Guanajuato",
  GR: "Guerrero",
  HG: "Hidalgo",
  JC: "Jalisco",
  MC: "Estado de México",
  MN: "Michoacán",
  MS: "Morelos",
  NT: "Nayarit",
  NL: "Nuevo León",
  OC: "Oaxaca",
  PL: "Puebla",
  QT: "Querétaro",
  QR: "Quintana Roo",
  SP: "San Luis Potosí",
  SL: "Sinaloa",
  SR: "Sonora",
  TC: "Tabasco",
  TS: "Tamaulipas",
  TL: "Tlaxcala",
  VZ: "Veracruz",
  YN: "Yucatán",
  ZS: "Zacatecas",
  NE: "Nacido en el extranjero",
};

const yymmddToDate = (yymmdd: string, curpCentury?: string): string | undefined => {
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  if (!mm || mm > 12 || !dd || dd > 31) return undefined;
  const now = new Date().getFullYear() % 100;
  const century =
    curpCentury !== undefined ? (/\d/.test(curpCentury) ? 1900 : 2000) : yy > now ? 1900 : 2000;
  const date = new Date(century + yy, mm - 1, dd);
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(date);
};

const RFC_RE = /^([A-ZÑ&]{3,4})(\d{6})([A-Z\d]{3})$/;
const CURP_RE = /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;

/**
 * Texto plano de una celda (búsqueda, orden y exportación). Usa los mismos
 * formatos que la vista.
 */
export const formatCellText = (
  type: CnCellType,
  value: unknown,
  row: unknown,
  options: CnCellOptions = {},
): string => {
  if (isEmpty(value)) return "";
  const locale = options.locale ?? "es-MX";
  switch (type) {
    case "id":
      return `${options.prefix ?? ""}${String(value)}${options.suffix ?? ""}`;
    case "contact":
      return asContacts(value)
        .map((c) => c.name)
        .join(", ");
    case "image":
      return toImageList(value).join(", ");
    case "file":
      return asFiles(value)
        .map((f) => f.name)
        .join(", ");
    case "color":
      return String(value).toUpperCase();
    case "country": {
      const code = String(value).toUpperCase();
      return countryName(code, locale) ?? code;
    }
    case "json":
      return typeof value === "string" ? value : JSON.stringify(value);
    case "daterange": {
      const [from, to] = asRange(value);
      const a = from
        ? formatCellText("date", from, row, { ...options, dateFormat: undefined })
        : "…";
      const b = to ? formatCellText("date", to, row, { ...options, dateFormat: undefined }) : "…";
      return `${a} – ${b}`;
    }
    case "bytes": {
      const n = toNumber(value);
      return n === null ? String(value) : formatBytesText(n);
    }
    case "sparkline":
      return Array.isArray(value) ? value.join(", ") : String(value);
    case "list":
      return (Array.isArray(value) ? value : [value]).map(String).join(", ");
    case "coordinates": {
      const point = asPoint(value);
      return point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : String(value);
    }
    case "masked": {
      const raw = String(value);
      const visible = options.visibleChars ?? 4;
      return `•••• ${raw.slice(-visible)}`;
    }
    case "delta": {
      const n = toNumber(value);
      if (n === null) return String(value);
      const format = options.deltaFormat ?? "percent";
      const raw = format === "percent" && options.percentScale === "fraction" ? n * 100 : n;
      const { change } = computeDelta(raw, options.previous?.(row), format);
      const sign = change > 0 ? "+" : change < 0 ? "-" : "";
      const abs = Math.abs(change);
      if (format === "percent") {
        return `${sign}${abs.toLocaleString(locale, { maximumFractionDigits: options.decimals ?? 1 })}%`;
      }
      return `${sign}${formatCellText(format, abs, row, { ...options, prefix: undefined, suffix: undefined })}`;
    }
    case "priority":
      return resolvePriority(value, options.priorityMap).label;
    case "deadline":
      return formatCellText("datetime", value, row, options);
    case "ip":
    case "uuid":
      return String(value).trim();
    case "version":
      return parseVersion(value).text;
    case "richtext":
      return stripRichText(value, options.richFormat);
    case "icon": {
      if (value && typeof value === "object") {
        const obj = value as Record<string, unknown>;
        return String(obj.label ?? obj.name ?? obj.icon ?? "");
      }
      const entry = options.statusMap?.[String(value)];
      return typeof entry?.label === "string" ? entry.label : String(value);
    }
    case "toggle":
      return value
        ? String(options.trueLabel ?? "Activado")
        : String(options.falseLabel ?? "Desactivado");
    case "steps": {
      const steps = parseSteps(value, options.stepLabels, options.max);
      return `${steps.current}/${steps.total}`;
    }
    case "stage": {
      const stage = normalizeStages(options.stages).find((s) => s.value === String(value));
      return stage?.label ?? String(value);
    }
    case "weekdays":
      return weekdaysText(parseWeekdays(value));
    case "timerange": {
      const range = parseTimeRange(value);
      return `${range.start ?? "…"} – ${range.end ?? "…"}`;
    }
    case "age": {
      const n = toNumber(value);
      if (n !== null && n < 200) return ageFrom(n).text;
      const birth = toDate(value, "date");
      return birth ? ageFrom(birth).text : String(value);
    }
    case "range": {
      const [min, max] = parseNumericRange(value);
      const format = options.rangeFormat ?? "number";
      const integers = Number.isInteger(min ?? 0) && Number.isInteger(max ?? 0);
      const part = (n: number | null) =>
        n === null
          ? "…"
          : formatCellText(format, n, row, {
              ...options,
              decimals: options.decimals ?? (integers ? 0 : undefined),
            });
      return `${part(min)} – ${part(max)}`;
    }
    case "sentiment":
      return resolveSentiment(value, options.sentimentScale)?.label ?? String(value);
    case "score": {
      const n = toNumber(value);
      return n === null
        ? String(value)
        : n.toLocaleString(locale, { maximumFractionDigits: options.decimals ?? 0 });
    }
    case "reference": {
      const ref = asReference(value);
      return ref.id !== undefined && String(ref.id) !== ref.label
        ? `${ref.label} · ${options.prefix ?? ""}${ref.id}`
        : ref.label;
    }
    case "counter": {
      const n = toNumber(value);
      return n === null ? String(value) : String(Math.trunc(n));
    }
    case "number": {
      const n = toNumber(value);
      if (n === null) return String(value);
      const formatted = n.toLocaleString(locale, {
        minimumFractionDigits: options.decimals,
        maximumFractionDigits: options.decimals ?? 2,
      });
      return `${options.prefix ?? ""}${formatted}${options.suffix ? ` ${options.suffix}` : ""}`;
    }
    case "currency": {
      const n = toNumber(value);
      const currency =
        (typeof options.currency === "function" ? options.currency(row) : options.currency) ??
        "MXN";
      return n === null
        ? String(value)
        : n.toLocaleString(locale, {
            style: "currency",
            currency,
            minimumFractionDigits: options.decimals ?? 2,
            maximumFractionDigits: options.decimals ?? 2,
          });
    }
    case "percent":
    case "progress": {
      const n = toNumber(value);
      if (n === null) return String(value);
      if (type === "progress") return `${Math.round((n / (options.max ?? 100)) * 100)}%`;
      const pct = options.percentScale === "fraction" ? n * 100 : n;
      return `${pct.toLocaleString(locale, { maximumFractionDigits: options.decimals ?? 1 })}%`;
    }
    case "date":
    case "datetime":
    case "time": {
      const date = toDate(value, type);
      if (!date) return String(value);
      if (options.dateFormat) {
        const iso =
          type === "time"
            ? `${pad(date.getHours())}:${pad(date.getMinutes())}`
            : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        return formatIsoDisplay(
          iso,
          type === "time" ? "time" : "datetime",
          options.dateFormat,
          locale,
        );
      }
      const day = `${pad(date.getDate())}/${MONTHS[date.getMonth()]}/${date.getFullYear()}`;
      const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      return type === "date" ? day : type === "time" ? time : `${day} ${time}`;
    }
    case "duration": {
      const raw = toNumber(value);
      if (raw === null) return String(value);
      const unit = options.durationUnit ?? "minutes";
      const totalMinutes = unit === "seconds" ? raw / 60 : unit === "hours" ? raw * 60 : raw;
      const d = Math.floor(totalMinutes / 1440);
      const h = Math.floor((totalMinutes % 1440) / 60);
      const m = Math.round(totalMinutes % 60);
      if (unit === "seconds" && totalMinutes < 1) return `${Math.round(raw)} s`;
      const parts = [
        d ? `${d} d` : "",
        h ? `${h} h` : "",
        m || (!d && !h) ? `${m} min` : "",
      ].filter(Boolean);
      return parts.join(" ");
    }
    case "boolean":
      return value ? String(options.trueLabel ?? "Sí") : String(options.falseLabel ?? "No");
    case "status": {
      const entry = options.statusMap?.[String(value)];
      return typeof entry?.label === "string" ? entry.label : String(value);
    }
    case "phone":
      return formatPhone(String(value));
    case "tags":
      return Array.isArray(value) ? value.map(String).join(", ") : String(value);
    case "rating": {
      const n = toNumber(value);
      return n === null ? String(value) : `${n}/${options.max ?? 5}`;
    }
    case "location":
      if (value && typeof value === "object") {
        const loc = value as Record<string, unknown>;
        return [loc.street, loc.city, loc.state, loc.postalCode, loc.country]
          .filter(Boolean)
          .join(", ");
      }
      return String(value);
    default: {
      let text: string;
      if (Array.isArray(value)) text = value.join(", ");
      else if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        text = String(obj.label ?? obj.name ?? obj.value ?? JSON.stringify(value));
      } else text = String(value);
      return applyTransform(text, options.transform);
    }
  }
};

// ─── Piezas visuales ────────────────────────────────────────────────────

/** Botón de copiar: tenue, se ilumina al pasar sobre la fila o enfocarlo. */
export const CnCopyButton = ({ text, label = "Copiar" }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  if (!text) return null;
  const copy = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Tooltip title={copied ? "¡Copiado!" : label} arrow placement="top">
      <Box
        component="button"
        type="button"
        aria-label={`${label}: ${text}`}
        className="cn-cell-copy"
        onClick={copy}
        onMouseDown={(event: MouseEvent) => event.stopPropagation()}
        sx={{
          all: "unset",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: "50%",
          cursor: "pointer",
          opacity: copied ? 1 : 0.4,
          color: copied
            ? "var(--cn-color-success-600, #228740)"
            : "var(--cn-color-neutral-600, #4e5660)",
          transition: "opacity 160ms ease, background-color 160ms ease, transform 160ms ease",
          "&:hover, &:focus-visible": {
            opacity: 1,
            backgroundColor: "rgba(110, 118, 130, 0.12)",
          },
          "&:focus-visible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
          "&:active": { transform: "scale(0.92)" },
        }}
      >
        <CnIcon name={copied ? "check" : "content_copy"} size={13} />
      </Box>
    </Tooltip>
  );
};

type PillProps = {
  label: ReactNode;
  subtitle?: ReactNode;
  icon?: string | ReactNode;
  tone?: CnCellTone | "secondary";
  mono?: boolean;
  chevron?: boolean;
  onClick?: (event: MouseEvent) => void;
  href?: string;
  title?: string;
  maxWidth?: number;
  strong?: boolean;
};

/** Píldora de celda: fondo tintado, ícono en recuadro y subtítulo opcional. */
export const CnCellPill = ({
  label,
  subtitle,
  icon,
  tone = "primary",
  mono = false,
  chevron = false,
  onClick,
  href,
  title,
  maxWidth = 260,
  strong = false,
}: PillProps) => {
  const colors = TONE[tone];
  const interactive = Boolean(onClick || href);
  const external = Boolean(href && /^https?:/.test(href));
  return (
    <Box
      component={href ? "a" : onClick ? "button" : "span"}
      type={onClick && !href ? "button" : undefined}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      title={title}
      onClick={(event: MouseEvent) => {
        if (interactive) event.stopPropagation();
        onClick?.(event);
      }}
      sx={{
        ...(onClick && !href ? { all: "unset" } : {}),
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        minHeight: 28,
        maxWidth,
        minWidth: 0,
        pl: icon ? "5px" : "12px",
        pr: chevron ? "6px" : "12px",
        py: "3px",
        borderRadius: "999px",
        backgroundColor: `rgba(${colors.rgb}, 0.08)`,
        color: colors.dark,
        fontSize: "0.72rem",
        fontWeight: strong ? 700 : 600,
        letterSpacing: "0.2px",
        fontFamily: mono ? MONO : "inherit",
        textDecoration: "none",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
        cursor: interactive ? "pointer" : "default",
        transition: "background-color 160ms ease, transform 160ms ease",
        "&:hover": interactive
          ? { backgroundColor: `rgba(${colors.rgb}, 0.15)`, transform: "translateY(-1px)" }
          : undefined,
        "&:focus-visible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
      }}
    >
      {icon && (
        <Box
          component="span"
          aria-hidden
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            flexShrink: 0,
            borderRadius: "50%",
            backgroundColor: `rgba(${colors.rgb}, 0.12)`,
          }}
        >
          {typeof icon === "string" ? <CnIcon name={icon} size={13} /> : icon}
        </Box>
      )}
      <Box
        component="span"
        sx={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.3 }}
      >
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </Box>
        {subtitle && (
          <Box
            component="span"
            sx={{
              fontSize: "0.6rem",
              fontWeight: 400,
              opacity: 0.7,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle}
          </Box>
        )}
      </Box>
      {chevron && <CnIcon name="chevron_right" size={12} sx={{ opacity: 0.45 }} />}
    </Box>
  );
};

const EMPTY_BY_TYPE: Partial<Record<CnCellType, { text: string; icon: string; tone: CnCellTone }>> =
  {
    email: { text: "Sin correo", icon: "unsubscribe", tone: "error" },
    phone: { text: "Sin teléfono", icon: "phone_disabled", tone: "error" },
    link: { text: "Sin enlace", icon: "link_off", tone: "error" },
    date: { text: "Sin fecha", icon: "event_busy", tone: "neutral" },
    datetime: { text: "Sin fecha", icon: "event_busy", tone: "neutral" },
    time: { text: "Sin hora", icon: "schedule", tone: "neutral" },
    image: { text: "Sin imagen", icon: "hide_image", tone: "neutral" },
    location: { text: "Sin dirección", icon: "location_off", tone: "neutral" },
    rfc: { text: "Sin RFC", icon: "badge", tone: "neutral" },
    curp: { text: "Sin CURP", icon: "badge", tone: "neutral" },
    avatar: { text: "Sin asignar", icon: "person_off", tone: "neutral" },
    contact: { text: "Sin contacto", icon: "person_off", tone: "neutral" },
    tags: { text: "Sin etiquetas", icon: "label_off", tone: "neutral" },
    priority: { text: "Sin prioridad", icon: "low_priority", tone: "neutral" },
    deadline: { text: "Sin vencimiento", icon: "event_busy", tone: "neutral" },
    ip: { text: "Sin IP", icon: "wifi_off", tone: "neutral" },
    version: { text: "Sin versión", icon: "new_releases", tone: "neutral" },
    richtext: { text: "Sin contenido", icon: "notes", tone: "neutral" },
    stage: { text: "Sin etapa", icon: "timeline", tone: "neutral" },
    weekdays: { text: "Sin días", icon: "event_busy", tone: "neutral" },
    timerange: { text: "Sin horario", icon: "schedule", tone: "neutral" },
    age: { text: "Sin fecha de nacimiento", icon: "cake", tone: "neutral" },
    reference: { text: "Sin vincular", icon: "link_off", tone: "neutral" },
    sentiment: { text: "Sin evaluar", icon: "face", tone: "neutral" },
  };

const EMPTY_CONTEXTS: Record<CnEmptyContext, { text: string; icon: string; tone: CnCellTone }> = {
  empty: { text: "Sin datos", icon: "inbox", tone: "accent" },
  not_assigned: { text: "Sin asignar", icon: "person_off", tone: "warning" },
  not_available: { text: "No disponible", icon: "not_interested", tone: "error" },
  not_applicable: { text: "N/A", icon: "block", tone: "accent" },
  pending: { text: "Pendiente", icon: "pending", tone: "warning" },
  none: { text: "Ninguno", icon: "do_not_disturb_on", tone: "neutral" },
  no_data: { text: "Sin datos", icon: "cloud_off", tone: "neutral" },
  not_found: { text: "No encontrado", icon: "search_off", tone: "error" },
  inactive: { text: "Inactivo", icon: "pause_circle", tone: "neutral" },
  deleted: { text: "Eliminado", icon: "delete", tone: "error" },
  success: { text: "Completado", icon: "check_circle", tone: "success" },
  active: { text: "Activo", icon: "check_circle", tone: "success" },
  cancelled: { text: "Cancelado", icon: "cancel", tone: "error" },
  expired: { text: "Expirado", icon: "timer_off", tone: "warning" },
  draft: { text: "Borrador", icon: "edit_note", tone: "neutral" },
  archived: { text: "Archivado", icon: "archive", tone: "neutral" },
  no_value: { text: "Sin valor", icon: "remove", tone: "neutral" },
  null: { text: "Nulo", icon: "block", tone: "neutral" },
};

/** Celda vacía con contexto ("Sin teléfono", "Sin asignar", "N/A"…). */
export const CnEmptyCell = ({
  type,
  text,
  context,
}: {
  type: CnCellType;
  text?: string;
  context?: CnEmptyContext;
}) => {
  const preset = context ? EMPTY_CONTEXTS[context] : EMPTY_BY_TYPE[type];
  if (!preset && !text) {
    return (
      <Box
        component="span"
        aria-label="Sin dato"
        sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)" }}
      >
        —
      </Box>
    );
  }
  return (
    <CnCellPill
      label={text ?? preset?.text}
      icon={preset?.icon ?? "remove"}
      tone={preset?.tone ?? "neutral"}
    />
  );
};

const withCopy = (node: ReactNode, text: string, enabled: boolean) =>
  enabled && text ? (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      {node}
      <CnCopyButton text={text} />
    </Box>
  ) : (
    node
  );

const STATUS_FALLBACK: Record<string, CnStatusOption> = {
  active: { label: "Activo", color: "success", icon: "check_circle" },
  activo: { label: "Activo", color: "success", icon: "check_circle" },
  inactive: { label: "Inactivo", color: "error", icon: "cancel" },
  inactivo: { label: "Inactivo", color: "error", icon: "cancel" },
  approved: { label: "Aprobado", color: "success", icon: "task_alt" },
  aprobado: { label: "Aprobado", color: "success", icon: "task_alt" },
  pending: { label: "Pendiente", color: "warning", icon: "schedule" },
  pendiente: { label: "Pendiente", color: "warning", icon: "schedule" },
  rejected: { label: "Rechazado", color: "error", icon: "block" },
  rechazado: { label: "Rechazado", color: "error", icon: "block" },
  cancelled: { label: "Cancelado", color: "error", icon: "block" },
  cancelado: { label: "Cancelado", color: "error", icon: "block" },
  draft: { label: "Borrador", color: "neutral", icon: "edit_note" },
  borrador: { label: "Borrador", color: "neutral", icon: "edit_note" },
  completed: { label: "Completado", color: "success", icon: "task_alt" },
  completado: { label: "Completado", color: "success", icon: "task_alt" },
  true: { label: "Sí", color: "success", icon: "check_circle" },
  false: { label: "No", color: "error", icon: "cancel" },
};

const TagsCell = ({ tags, max }: { tags: string[]; max: number }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const visible = tags.slice(0, max);
  const rest = tags.length - visible.length;
  return (
    <Box sx={{ display: "inline-flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
      {visible.map((tag) => (
        <CnCellPill key={tag} label={tag} tone="neutral" icon="sell" />
      ))}
      {rest > 0 && (
        <>
          <CnCellPill
            label={`+${rest}`}
            tone="primary"
            onClick={(event) => setAnchor(event.currentTarget as HTMLElement)}
            title="Ver todas"
          />
          <Popover
            open={Boolean(anchor)}
            anchorEl={anchor}
            onClose={() => setAnchor(null)}
            onClick={(event) => event.stopPropagation()}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            slotProps={{ paper: { sx: { p: "10px", maxWidth: 320, borderRadius: "10px" } } }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {tags.map((tag) => (
                <CnCellPill key={tag} label={tag} tone="neutral" icon="sell" />
              ))}
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
};

const ContactAvatar = ({
  contact,
  shape,
  ring = false,
}: {
  contact: CnContact;
  shape?: CnCellOptions["avatarShape"];
  ring?: boolean;
}) => {
  const safe = contact.avatar ? getSafeUrl(contact.avatar) : undefined;
  return (
    <Box
      aria-hidden
      title={contact.name}
      sx={{
        width: 32,
        height: 32,
        flexShrink: 0,
        borderRadius: shape === "square" ? "6px" : shape === "rounded" ? "10px" : "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        color: "#fff",
        backgroundColor: colorFromText(contact.name),
        boxShadow: ring ? "0 0 0 2px var(--cn-color-surface, #fff)" : undefined,
      }}
    >
      {safe ? (
        <Box
          component="img"
          src={safe}
          alt=""
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        getInitials(contact.name)
      )}
    </Box>
  );
};

/** Al hacer clic muestra la ficha de contacto(s) con correo y teléfono. */
const ContactPopover = ({
  contacts,
  shape,
  children,
}: {
  contacts: CnContact[];
  shape?: CnCellOptions["avatarShape"];
  children: ReactNode;
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={`Ver ${contacts.length === 1 ? "contacto" : `${contacts.length} contactos`}`}
        onClick={(event: MouseEvent) => {
          event.stopPropagation();
          setAnchor(event.currentTarget as HTMLElement);
        }}
        sx={{
          all: "unset",
          cursor: "pointer",
          maxWidth: "100%",
          borderRadius: "999px",
          "&:focus-visible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
        }}
      >
        {children}
      </Box>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: { p: "8px", minWidth: 260, maxWidth: 340, maxHeight: 360, borderRadius: "12px" },
          },
        }}
      >
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {contacts.map((contact, i) => (
            <Box
              component="li"
              key={`${contact.name}-${i}`}
              sx={{
                display: "flex",
                gap: "10px",
                p: "8px",
                borderRadius: "8px",
                "&:hover": { backgroundColor: "var(--cn-color-neutral-50, #fafbfc)" },
              }}
            >
              <ContactAvatar contact={contact} shape={shape} />
              <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                <Box>
                  <Box sx={{ fontSize: "0.82rem", fontWeight: 700 }}>{contact.name}</Box>
                  {contact.position && (
                    <Box sx={{ fontSize: "0.7rem", color: "var(--cn-color-text-muted, #6e7682)" }}>
                      {contact.position}
                    </Box>
                  )}
                </Box>
                {contact.email && (
                  <CnCellPill
                    label={contact.email}
                    icon="mail"
                    tone="accent"
                    mono
                    href={`mailto:${contact.email}`}
                    maxWidth={250}
                  />
                )}
                {contact.phone && (
                  <CnCellPill
                    label={formatPhone(contact.phone)}
                    icon="call"
                    tone="info"
                    mono
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
};

const ImageGallery = ({ images, max }: { images: string[]; max: number }) => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={images.length === 1 ? "Ver imagen" : `Ver ${images.length} imágenes`}
        onClick={(event: MouseEvent) => {
          event.stopPropagation();
          setOpen(0);
        }}
        sx={{
          all: "unset",
          cursor: "zoom-in",
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "10px",
          "&:focus-visible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
          "&:hover img": { transform: "translateY(-1px)" },
        }}
      >
        {images.slice(0, max).map((src, i) => (
          <Box
            key={src}
            component="img"
            src={src}
            alt=""
            loading="lazy"
            sx={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: "10px",
              ml: i === 0 ? 0 : "-12px",
              border: "2px solid var(--cn-color-surface, #fff)",
              boxShadow: "0 1px 3px rgba(17,20,24,0.18)",
              transition: "transform 140ms ease",
            }}
          />
        ))}
        {images.length > max && (
          <Box
            component="span"
            sx={{
              ml: "6px",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            +{images.length - max}
          </Box>
        )}
      </Box>
      <CnImageViewer images={images} index={open} onClose={() => setOpen(null)} />
    </>
  );
};

export type CnCellDetailRow = DetailRow;
export type CnCellDetailAction = DetailAction;

type DetailRow = { label: string; value: ReactNode; copy?: string; mono?: boolean };
type DetailAction = {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
};

/**
 * Píldora que al hacer clic abre una ficha con el detalle completo, botones
 * de copiar y acciones. Accesible con teclado y Escape.
 */
export const CnCellDetail = ({
  pill,
  title,
  icon,
  tone = "primary",
  rows = [],
  actions = [],
  children,
  width = 320,
}: {
  pill: Omit<PillProps, "onClick" | "href" | "chevron">;
  title: ReactNode;
  icon?: string;
  tone?: CnCellTone;
  rows?: DetailRow[];
  actions?: DetailAction[];
  children?: ReactNode;
  width?: number;
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const colors = TONE[tone];
  return (
    <>
      <CnCellPill
        {...pill}
        chevron
        onClick={(event) => setAnchor(event.currentTarget as HTMLElement)}
      />
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": typeof title === "string" ? title : "Detalle",
            sx: {
              width,
              maxWidth: "calc(100vw - 24px)",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 16px 40px rgba(17,20,24,0.18)",
            },
          } as Record<string, unknown>,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            px: "14px",
            py: "12px",
            backgroundColor: `rgba(${colors.rgb}, 0.07)`,
            borderBottom: "1px solid var(--cn-color-border-subtle, #eceef1)",
          }}
        >
          {icon && (
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "10px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.dark,
                backgroundColor: `rgba(${colors.rgb}, 0.14)`,
                flexShrink: 0,
              }}
            >
              <CnIcon name={icon} size={18} />
            </Box>
          )}
          <Box
            sx={{
              minWidth: 0,
              flex: 1,
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--cn-color-text, #222831)",
              overflowWrap: "anywhere",
            }}
          >
            {title}
          </Box>
          <IconButton size="small" aria-label="Cerrar" onClick={() => setAnchor(null)}>
            <CnIcon name="close" size={16} />
          </IconButton>
        </Box>
        {children && <Box sx={{ px: "14px", pt: "12px" }}>{children}</Box>}
        {rows.length > 0 && (
          <Box
            component="dl"
            sx={{
              m: 0,
              px: "14px",
              py: "10px",
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              columnGap: "10px",
              rowGap: "6px",
            }}
          >
            {rows.map((row) => (
              <Box key={row.label} sx={{ display: "contents" }}>
                <Box
                  component="dt"
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--cn-color-text-muted, #6e7682)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.label}
                </Box>
                <Box
                  component="dd"
                  sx={{
                    m: 0,
                    minWidth: 0,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    fontFamily: row.mono ? MONO : "inherit",
                    overflowWrap: "anywhere",
                  }}
                >
                  {row.value}
                </Box>
                <Box>{row.copy ? <CnCopyButton text={row.copy} /> : null}</Box>
              </Box>
            ))}
          </Box>
        )}
        {actions.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              px: "14px",
              pb: "12px",
              pt: rows.length ? 0 : "12px",
            }}
          >
            {actions.map((action) => (
              <Box
                key={action.label}
                component={action.href ? "a" : "button"}
                type={action.href ? undefined : "button"}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noopener noreferrer" : undefined}
                onClick={() => action.onClick?.()}
                sx={{
                  ...(action.href ? {} : { all: "unset" }),
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  px: "10px",
                  py: "6px",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "var(--cn-color-accent-700, #2a3cb8)",
                  border: "1px solid rgba(61, 90, 254, 0.35)",
                  "&:hover": { backgroundColor: "rgba(61, 90, 254, 0.08)" },
                  "&:focus-visible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
                }}
              >
                <CnIcon name={action.icon} size={15} />
                {action.label}
              </Box>
            ))}
          </Box>
        )}
      </Popover>
    </>
  );
};

/** Visor de imágenes a pantalla completa con flechas, teclado y miniaturas. */
export const CnImageViewer = ({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number | null;
  onClose: () => void;
}) => {
  const [active, setActive] = useState(index ?? 0);
  useEffect(() => {
    if (index !== null) setActive(index);
  }, [index]);
  const go = useCallback(
    (delta: number) => setActive((prev) => (prev + delta + images.length) % images.length),
    [images.length],
  );
  return (
    <Dialog
      open={index !== null}
      onClose={onClose}
      fullScreen
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(1);
        if (event.key === "ArrowLeft") go(-1);
      }}
      aria-label="Visor de imágenes"
      slotProps={{ paper: { sx: { backgroundColor: "rgba(10, 12, 16, 0.96)", color: "#fff" } } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", px: "16px", py: "10px" }}>
        <Box sx={{ flex: 1, fontSize: "0.85rem", fontWeight: 600 }}>
          {active + 1} / {images.length}
        </Box>
        <IconButton
          component="a"
          href={images[active]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir original"
          sx={{ color: "#fff" }}
        >
          <CnIcon name="open_in_new" size={20} />
        </IconButton>
        <IconButton
          component="a"
          href={images[active]}
          download
          aria-label="Descargar"
          sx={{ color: "#fff" }}
        >
          <CnIcon name="download" size={20} />
        </IconButton>
        <IconButton aria-label="Cerrar visor" onClick={onClose} sx={{ color: "#fff" }}>
          <CnIcon name="close" size={22} />
        </IconButton>
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          px: { xs: "8px", md: "72px" },
        }}
      >
        {images.length > 1 && (
          <IconButton
            aria-label="Imagen anterior"
            onClick={() => go(-1)}
            sx={{
              position: "absolute",
              left: 12,
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.1)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
            }}
          >
            <CnIcon name="chevron_left" size={28} />
          </IconButton>
        )}
        <Box
          component="img"
          src={images[active]}
          alt={`Imagen ${active + 1} de ${images.length}`}
          sx={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: "8px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        />
        {images.length > 1 && (
          <IconButton
            aria-label="Imagen siguiente"
            onClick={() => go(1)}
            sx={{
              position: "absolute",
              right: 12,
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.1)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
            }}
          >
            <CnIcon name="chevron_right" size={28} />
          </IconButton>
        )}
      </Box>
      {images.length > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            p: "12px",
            overflowX: "auto",
          }}
        >
          {images.map((src, i) => (
            <Box
              key={src}
              component="button"
              type="button"
              aria-label={`Imagen ${i + 1}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              sx={{
                all: "unset",
                cursor: "pointer",
                borderRadius: "8px",
                flexShrink: 0,
                opacity: i === active ? 1 : 0.55,
                outline: i === active ? "2px solid #fff" : "none",
                "&:hover": { opacity: 1 },
                "&:focus-visible": { outline: "2px solid #8fb3ff" },
              }}
            >
              <Box
                component="img"
                src={src}
                alt=""
                sx={{
                  display: "block",
                  width: 64,
                  height: 48,
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Dialog>
  );
};

const MaskedValue = ({
  raw,
  masked,
  copyEnabled,
}: {
  raw: string;
  masked: string;
  copyEnabled: boolean;
}) => {
  const [shown, setShown] = useState(false);
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <CnCellPill
        label={shown ? raw : masked}
        icon={shown ? "lock_open" : "lock"}
        tone="neutral"
        mono
      />
      <Tooltip title={shown ? "Ocultar" : "Mostrar"} arrow>
        <IconButton
          size="small"
          aria-label={shown ? "Ocultar valor" : "Mostrar valor"}
          aria-pressed={shown}
          onClick={(event) => {
            event.stopPropagation();
            setShown((prev) => !prev);
          }}
          sx={{ p: "3px", color: "var(--cn-color-neutral-500, #6e7682)" }}
        >
          <CnIcon name={shown ? "visibility_off" : "visibility"} size={15} />
        </IconButton>
      </Tooltip>
      {copyEnabled && <CnCopyButton text={raw} label="Copiar valor" />}
    </Box>
  );
};

const JsonView = ({ data }: { data: unknown }) => {
  let pretty: string;
  try {
    pretty = JSON.stringify(typeof data === "string" ? JSON.parse(data) : data, null, 2);
  } catch {
    pretty = String(data);
  }
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        maxHeight: 280,
        overflow: "auto",
        p: "10px",
        borderRadius: "8px",
        fontFamily: MONO,
        fontSize: "0.72rem",
        lineHeight: 1.5,
        color: "#e6edf3",
        backgroundColor: "#161b22",
      }}
    >
      {pretty}
    </Box>
  );
};

const trendOf = (current: number, previous: number | undefined) => {
  if (previous === undefined) return null;
  if (current > previous) return { icon: "trending_up", tone: "success" as const };
  if (current < previous) return { icon: "trending_down", tone: "error" as const };
  return { icon: "trending_flat", tone: "neutral" as const };
};

// ─── Piezas de los tipos adicionales ────────────────────────────────────

const isRegisteredIcon = (name: string) => Boolean(ICON_REGISTRY[ICON_ALIASES[name] ?? name]);

/** Usa el ícono preferido si ya está registrado; si no, el de respaldo. */
const pickIcon = (preferred: string, fallback: string) =>
  isRegisteredIcon(preferred) ? preferred : fallback;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const longDate = (date: Date, withTime = false) =>
  capitalize(
    new Intl.DateTimeFormat("es-MX", {
      dateStyle: "full",
      timeStyle: withTime ? "short" : undefined,
    }).format(date),
  );

/** Etiqueta pequeña junto a una píldora ("IPv4", "Última", "beta"). */
const MiniTag = ({ label, tone = "neutral" }: { label: ReactNode; tone?: CnCellTone }) => (
  <Box
    component="span"
    sx={{
      flexShrink: 0,
      px: "6px",
      py: "1px",
      borderRadius: "999px",
      fontSize: "0.6rem",
      fontWeight: 700,
      letterSpacing: "0.3px",
      whiteSpace: "nowrap",
      color: TONE[tone].dark,
      backgroundColor: `rgba(${TONE[tone].rgb}, 0.1)`,
      border: `1px solid rgba(${TONE[tone].rgb}, 0.18)`,
    }}
  >
    {label}
  </Box>
);

const Inline = ({ children, gap = "6px" }: { children: ReactNode; gap?: string }) => (
  <Box
    component="span"
    sx={{ display: "inline-flex", alignItems: "center", gap, minWidth: 0, maxWidth: "100%" }}
  >
    {children}
  </Box>
);

/** Barras de nivel (prioridad). */
const LevelBars = ({
  level,
  tone,
  total = 4,
}: {
  level: number;
  tone: CnCellTone;
  total?: number;
}) => (
  <Box
    component="span"
    aria-hidden
    sx={{ display: "inline-flex", alignItems: "flex-end", gap: "1.5px", height: 12 }}
  >
    {Array.from({ length: total }, (_, i) => (
      <Box
        key={i}
        component="span"
        sx={{
          width: 3,
          height: 4 + i * 2.6,
          borderRadius: "1px",
          backgroundColor: i < level ? `rgb(${TONE[tone].rgb})` : `rgba(${TONE[tone].rgb}, 0.22)`,
        }}
      />
    ))}
  </Box>
);

const stop = (event: { stopPropagation: () => void }) => event.stopPropagation();

/** Interruptor en línea; el clic no llega a la fila. */
const ToggleCell = ({
  checked,
  row,
  onChange,
  trueLabel,
  falseLabel,
}: {
  checked: boolean;
  row: unknown;
  onChange?: (row: unknown, next: boolean) => void;
  trueLabel: ReactNode;
  falseLabel: ReactNode;
}) => {
  const [on, setOn] = useState(checked);
  useEffect(() => setOn(checked), [checked]);
  const label = on ? trueLabel : falseLabel;
  return (
    <Box
      component="span"
      onClick={stop}
      onMouseDown={stop}
      onKeyDown={stop}
      sx={{ display: "inline-flex", alignItems: "center", gap: "2px", ml: "-6px" }}
    >
      <Switch
        size="small"
        checked={on}
        disabled={!onChange}
        onChange={(_, next) => {
          setOn(next);
          onChange?.(row, next);
        }}
        slotProps={{
          input: { "aria-label": typeof label === "string" ? label : "Cambiar" },
        }}
      />
      <Box
        component="span"
        sx={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: on ? TONE.success.dark : "var(--cn-color-text-muted, #6e7682)",
          opacity: onChange ? 1 : 0.7,
        }}
      >
        {label}
      </Box>
    </Box>
  );
};

/** Avance por pasos: barra segmentada o puntos, con las etiquetas en el tooltip. */
const StepsCell = ({
  current,
  total,
  labels,
  style,
}: {
  current: number;
  total: number;
  labels: string[];
  style: "dots" | "bar";
}) => {
  const done = current >= total;
  const tone: CnCellTone = done ? "success" : current === 0 ? "neutral" : "primary";
  const tip = labels.length ? (
    <Box component="ol" sx={{ m: 0, pl: "18px", fontSize: "0.72rem", lineHeight: 1.6 }}>
      {labels.map((label, i) => (
        <li key={`${label}-${i}`} style={{ opacity: i < current ? 1 : 0.65 }}>
          {i < current ? "✓ " : i === current ? "● " : ""}
          {label}
        </li>
      ))}
    </Box>
  ) : (
    `Paso ${current} de ${total}`
  );
  return (
    <Tooltip title={tip} arrow placement="top">
      <Box
        component="span"
        role="img"
        aria-label={`${current} de ${total} pasos${labels[current - 1] ? `: ${labels[current - 1]}` : ""}`}
        sx={{ display: "inline-flex", flexDirection: "column", gap: "3px", minWidth: 90 }}
      >
        <Box component="span" sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Box
            component="span"
            sx={{ display: "flex", gap: style === "dots" ? "4px" : "2px", flex: 1, minWidth: 0 }}
          >
            {Array.from({ length: total }, (_, i) => (
              <Box
                key={i}
                component="span"
                sx={{
                  flex: style === "dots" ? "0 0 auto" : 1,
                  width: style === "dots" ? 8 : undefined,
                  height: style === "dots" ? 8 : 6,
                  borderRadius: style === "dots" ? "50%" : "2px",
                  backgroundColor:
                    i < current ? `rgb(${TONE[tone].rgb})` : `rgba(${TONE[tone].rgb}, 0.18)`,
                  boxShadow:
                    i === current && !done
                      ? `0 0 0 1.5px rgba(${TONE.primary.rgb}, 0.55) inset`
                      : undefined,
                }}
              />
            ))}
          </Box>
          <Box
            component="span"
            sx={{ fontFamily: MONO, fontSize: "0.7rem", fontWeight: 700, color: TONE[tone].dark }}
          >
            {current}/{total}
          </Box>
        </Box>
        {labels.length > 0 && (
          <Box
            component="span"
            sx={{
              fontSize: "0.65rem",
              color: "var(--cn-color-text-muted, #6e7682)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {done ? "Completado" : (labels[current] ?? labels[current - 1])}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

/** Etapa actual dentro de un embudo (flechas o puntos). */
const StageCell = ({
  stages,
  index,
  style,
}: {
  stages: { value: string; label: string; tone?: CnCellTone }[];
  index: number;
  style: "chevrons" | "dots";
}) => {
  const current = stages[index];
  const tone: CnCellTone =
    current.tone ?? (index === stages.length - 1 ? "success" : index === 0 ? "neutral" : "primary");
  return (
    <Box
      component="span"
      role="img"
      aria-label={`Etapa ${index + 1} de ${stages.length}: ${current.label}`}
      sx={{ display: "inline-flex", flexDirection: "column", gap: "4px", minWidth: 0 }}
    >
      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
        {stages.map((stage, i) => (
          <Tooltip
            key={stage.value}
            title={`${i + 1}. ${stage.label}${i === index ? " (actual)" : ""}`}
            arrow
          >
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: style === "dots" ? 9 : 20,
                height: style === "dots" ? 9 : 12,
                ml: style === "dots" || i === 0 ? 0 : "-3px",
                borderRadius: style === "dots" ? "50%" : 0,
                clipPath:
                  style === "dots"
                    ? undefined
                    : i === 0
                      ? "polygon(0 0, 75% 0, 100% 50%, 75% 100%, 0 100%)"
                      : "polygon(0 0, 75% 0, 100% 50%, 75% 100%, 0 100%, 25% 50%)",
                backgroundColor:
                  i < index
                    ? `rgba(${TONE[tone].rgb}, 0.55)`
                    : i === index
                      ? `rgb(${TONE[tone].rgb})`
                      : "rgba(110, 118, 130, 0.2)",
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Box
        component="span"
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: TONE[tone].dark,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {current.label}
        <Box component="span" sx={{ fontWeight: 400, opacity: 0.65, ml: "6px" }}>
          {index + 1}/{stages.length}
        </Box>
      </Box>
    </Box>
  );
};

/** Días de la semana L M M J V S D con los elegidos resaltados. */
const WeekdaysCell = ({ days, tone }: { days: number[]; tone: CnCellTone }) => (
  <Box
    component="span"
    role="img"
    aria-label={weekdaysText(days)}
    sx={{ display: "inline-flex", gap: "3px" }}
  >
    {WEEKDAY_LETTERS.map((letter, i) => {
      const on = days.includes(i + 1);
      return (
        <Tooltip key={i} title={`${WEEKDAY_NAMES[i]}${on ? "" : " (no)"}`} arrow>
          <Box
            component="span"
            sx={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.6rem",
              fontWeight: 700,
              color: on ? "#fff" : "var(--cn-color-text-subtle, #9aa1aa)",
              backgroundColor: on ? `rgb(${TONE[tone].rgb})` : "rgba(110, 118, 130, 0.1)",
            }}
          >
            {letter}
          </Box>
        </Tooltip>
      );
    })}
  </Box>
);

/** Anillo de puntuación con el valor al centro. */
const ScoreRing = ({
  value,
  max,
  text,
  tone,
  size = 34,
}: {
  value: number;
  max: number;
  text: string;
  tone: CnCellTone;
  size?: number;
}) => {
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <Box
      component="span"
      role="img"
      aria-label={`Puntuación ${text} de ${max}`}
      title={`${text} de ${max}`}
      sx={{
        position: "relative",
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`rgba(${TONE[tone].rgb}, 0.15)`}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`rgb(${TONE[tone].rgb})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Box
        component="span"
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: MONO,
          fontSize: text.length > 3 ? "0.55rem" : "0.65rem",
          fontWeight: 700,
          color: TONE[tone].dark,
        }}
      >
        {text}
      </Box>
    </Box>
  );
};

// Contenido enriquecido seguro: nunca se inyecta HTML; se reconstruye con React
// solo a partir de etiquetas permitidas y sin atributos (salvo enlaces seguros).
const SAFE_TAGS = new Set([
  "p",
  "br",
  "hr",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "code",
  "pre",
  "a",
]);
const DROP_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "template",
  "noscript",
  "svg",
  "math",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "link",
  "meta",
]);
const TAG_ALIAS: Record<string, string> = { b: "strong", i: "em", strike: "s", del: "s" };

const htmlNodeToReact = (node: Node, key: number): ReactNode => {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const element = node as Element;
  const raw = element.tagName.toLowerCase();
  if (DROP_TAGS.has(raw)) return null;
  const tag = TAG_ALIAS[raw] ?? raw;
  const children = Array.from(element.childNodes).map((child, i) => htmlNodeToReact(child, i));
  if (!SAFE_TAGS.has(tag)) return <Fragment key={key}>{children}</Fragment>;
  if (tag === "br" || tag === "hr") return createElement(tag, { key });
  if (tag === "a") {
    const href = getSafeUrl(element.getAttribute("href") ?? undefined);
    return href ? (
      <a key={key} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <Fragment key={key}>{children}</Fragment>
    );
  }
  return createElement(tag, { key }, ...children);
};

const markdownInline = (text: string): ReactNode[] =>
  text
    .split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g)
    .filter(Boolean)
    .map((part, i) => {
      if (/^(\*\*|__)/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (/^`/.test(part)) return <code key={i}>{part.slice(1, -1)}</code>;
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
      if (link) {
        const href = getSafeUrl(link[2]);
        return href ? (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer">
            {link[1]}
          </a>
        ) : (
          link[1]
        );
      }
      if (/^[*_].+[*_]$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
      return part;
    });

const markdownToReact = (source: string): ReactNode[] => {
  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[(i += 1) - 1]);
      blocks.push(
        <pre key={blocks.length}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      i += 1;
      continue;
    }
    const heading = /^\s{0,3}(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push(
        createElement(
          `h${Math.min(6, heading[1].length + 2)}`,
          { key: blocks.length },
          ...markdownInline(heading[2]),
        ),
      );
      i += 1;
      continue;
    }
    const listMatch = /^\s*([-*+]|\d+[.)])\s+/.exec(line);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        items.push(
          <li key={items.length}>
            {markdownInline(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, ""))}
          </li>,
        );
        i += 1;
      }
      blocks.push(createElement(ordered ? "ol" : "ul", { key: blocks.length }, ...items));
      continue;
    }
    if (/^\s{0,3}>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s{0,3}>\s?/, ""));
        i += 1;
      }
      blocks.push(<blockquote key={blocks.length}>{markdownInline(quote.join(" "))}</blockquote>);
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*([-*+]|\d+[.)])\s+|^\s{0,3}(#{1,6}\s|>|```)/.test(lines[i])
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push(<p key={blocks.length}>{markdownInline(paragraph.join(" "))}</p>);
  }
  return blocks;
};

/** Muestra HTML o Markdown con un subconjunto seguro (sin `dangerouslySetInnerHTML`). */
export const CnSafeRichText = ({
  source,
  format = "auto",
}: {
  source: string;
  format?: CnRichFormat;
}) => {
  let content: ReactNode;
  if (detectRichFormat(source, format) === "html") {
    if (typeof DOMParser === "undefined") content = stripRichText(source, "html");
    else {
      // DOMParser crea un documento inerte: no ejecuta scripts ni carga recursos.
      const doc = new DOMParser().parseFromString(source, "text/html");
      content = Array.from(doc.body.childNodes).map((node, i) => htmlNodeToReact(node, i));
    }
  } else content = markdownToReact(source);
  return (
    <Box
      data-cn-rich-text
      sx={{
        fontSize: "0.82rem",
        lineHeight: 1.6,
        overflowWrap: "anywhere",
        "& > :first-of-type": { mt: 0 },
        "& p": { my: "6px" },
        "& h1, & h2, & h3, & h4, & h5, & h6": { my: "8px", lineHeight: 1.3 },
        "& h3": { fontSize: "1rem" },
        "& h4": { fontSize: "0.92rem" },
        "& h5, & h6": { fontSize: "0.85rem" },
        "& ul, & ol": { my: "6px", pl: "20px" },
        "& blockquote": {
          my: "6px",
          mx: 0,
          pl: "10px",
          borderLeft: "3px solid var(--cn-color-border, #dde0e4)",
          color: "var(--cn-color-text-muted, #6e7682)",
        },
        "& code": {
          fontFamily: MONO,
          fontSize: "0.75rem",
          px: "4px",
          borderRadius: "4px",
          backgroundColor: "rgba(110, 118, 130, 0.12)",
        },
        "& pre": {
          p: "8px",
          borderRadius: "8px",
          overflow: "auto",
          backgroundColor: "rgba(110, 118, 130, 0.1)",
        },
        "& pre code": { p: 0, backgroundColor: "transparent" },
        "& a": { color: "var(--cn-color-accent-700, #2a3cb8)" },
      }}
    >
      {content}
    </Box>
  );
};

/** Valor ordenable de una celda (prioridad por nivel, versión semver, etapa…). */
export const cellSortValue = (
  type: CnCellType,
  value: unknown,
  row: unknown,
  options: CnCellOptions = {},
): unknown => {
  if (isEmpty(value)) return value;
  switch (type) {
    case "priority":
      return resolvePriority(value, options.priorityMap).level;
    case "deadline":
    case "age": {
      const n = toNumber(value);
      if (type === "age" && n !== null && n < 200) return n;
      const date = toDate(value, "datetime");
      if (!date) return value;
      return type === "age" ? ageFrom(date).years + ageFrom(date).months / 12 : date.getTime();
    }
    case "delta": {
      const n = toNumber(value);
      return n === null
        ? value
        : computeDelta(n, options.previous?.(row), options.deltaFormat ?? "percent").change;
    }
    case "version": {
      const v = parseVersion(value);
      if (!v.valid) return String(value);
      const pad6 = (n: number) => String(n).padStart(6, "0");
      return `${pad6(v.major)}.${pad6(v.minor)}.${pad6(v.patch)}${v.prerelease ? `-${v.prerelease}` : "~"}`;
    }
    case "ip": {
      const ip = parseIp(value);
      return ip.version === 4 && ip.valid
        ? ip.address
            .split(".")
            .map((part) => part.padStart(3, "0"))
            .join(".")
        : String(value);
    }
    case "steps":
      return parseSteps(value, options.stepLabels, options.max).current;
    case "stage": {
      const index = normalizeStages(options.stages).findIndex((s) => s.value === String(value));
      return index === -1 ? String(value) : index;
    }
    case "weekdays":
      return parseWeekdays(value).length;
    case "timerange": {
      const start = parseTimeRange(value).start;
      return start ?? String(value);
    }
    case "range":
      return parseNumericRange(value)[0] ?? String(value);
    case "sentiment":
      return resolveSentiment(value, options.sentimentScale)?.level ?? String(value);
    case "reference":
    case "icon":
    case "richtext":
      return formatCellText(type, value, row, options);
    default:
      return value;
  }
};

const renderExtraCell = (
  type: CnCellType,
  value: unknown,
  row: unknown,
  options: CnCellOptions,
  ctx: {
    text: string;
    subtitle: ReactNode;
    copy?: boolean;
    handleClick?: (event: MouseEvent) => void;
  },
): ReactNode => {
  const { text, subtitle, copy, handleClick } = ctx;
  switch (type) {
    case "delta": {
      const n = toNumber(value);
      if (n === null) return <CnCellPill label={String(value)} tone="neutral" />;
      const format = options.deltaFormat ?? "percent";
      const raw = format === "percent" && options.percentScale === "fraction" ? n * 100 : n;
      const previous = options.previous?.(row);
      const info = computeDelta(raw, previous, format);
      const good = options.invertTrend ? info.direction === "down" : info.direction === "up";
      const tone: CnCellTone = info.direction === "flat" ? "neutral" : good ? "success" : "error";
      const icon =
        info.direction === "up"
          ? "arrow_upward"
          : info.direction === "down"
            ? "arrow_downward"
            : "trending_flat";
      const base = format === "currency" ? "currency" : "number";
      const prevText =
        previous !== undefined ? formatCellText(base, previous, row, options) : undefined;
      const pill = {
        label: text,
        icon,
        tone,
        mono: true,
        strong: true,
        subtitle: subtitle ?? (prevText ? `vs. ${prevText}` : undefined),
        title:
          info.direction === "flat"
            ? "Sin cambio"
            : `${info.direction === "up" ? "Subió" : "Bajó"} ${text}`,
      };
      if (previous === undefined || options.detail === false) {
        return withCopy(<CnCellPill {...pill} />, text, copy ?? false);
      }
      const diff = raw - previous;
      return withCopy(
        <CnCellDetail
          pill={pill}
          title="Variación"
          icon={icon}
          tone={tone}
          rows={[
            { label: "Actual", value: formatCellText(base, raw, row, options), mono: true },
            { label: "Anterior", value: prevText, mono: true },
            {
              label: "Cambio",
              value: `${diff > 0 ? "+" : diff < 0 ? "-" : ""}${formatCellText(base, Math.abs(diff), row, options)}`,
              mono: true,
            },
            ...(info.percent !== undefined
              ? [
                  {
                    label: "Cambio %",
                    value: `${info.percent > 0 ? "+" : ""}${info.percent.toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`,
                    mono: true,
                  },
                ]
              : []),
          ]}
        />,
        text,
        copy ?? false,
      );
    }
    case "priority": {
      const p = resolvePriority(value, options.priorityMap);
      const style = options.priorityStyle ?? "bars";
      return (
        <CnCellPill
          label={p.label}
          tone={p.tone}
          strong
          subtitle={subtitle}
          title={`Prioridad ${p.label.toLowerCase()}${p.level ? ` (${p.level} de 4)` : ""}`}
          icon={
            style === "bars" ? (
              <LevelBars level={p.level} tone={p.tone} />
            ) : style === "flag" ? (
              "flag"
            ) : (
              p.icon
            )
          }
        />
      );
    }
    case "deadline": {
      const due = toDate(value, "datetime");
      if (!due) return <CnEmptyCell type={type} text={String(value)} />;
      const dateText = formatCellText("datetime", value, row, options);
      if (options.done?.(row)) {
        return (
          <CnCellPill
            label="Cumplido"
            subtitle={dateText}
            icon="task_alt"
            tone="success"
            strong
            title={longDate(due, true)}
          />
        );
      }
      const info = describeDeadline(due, new Date(), options.thresholds);
      const state = info.overdue
        ? "Vencido"
        : info.tone === "error"
          ? "Urgente"
          : info.tone === "warning"
            ? "Próximo a vencer"
            : "A tiempo";
      const pill = {
        label: capitalize(info.label),
        subtitle: subtitle ?? dateText,
        icon: info.icon,
        tone: info.tone,
        strong: true,
        title: `${state} · ${longDate(due, true)}`,
      };
      if (options.detail === false) return <CnCellPill {...pill} />;
      const iso = `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}T${pad(due.getHours())}:${pad(due.getMinutes())}`;
      return (
        <CnCellDetail
          pill={pill}
          title="Vencimiento"
          icon={info.icon}
          tone={info.tone}
          rows={[
            { label: "Vence", value: longDate(due, true), copy: dateText },
            { label: info.overdue ? "Vencido" : "Restante", value: capitalize(info.label) },
            { label: "Estado", value: state },
            { label: "ISO", value: iso, copy: iso, mono: true },
          ]}
        />
      );
    }
    case "ip": {
      const ip = parseIp(value);
      const display = ip.prefix !== undefined ? `${ip.address}/${ip.prefix}` : ip.address;
      return withCopy(
        <Inline>
          <CnCellPill
            label={display}
            icon={ip.valid ? (ip.version === 6 ? "public" : "dns") : "error_outline"}
            tone={ip.valid ? "info" : "warning"}
            mono
            subtitle={subtitle}
            title={
              ip.valid ? `IPv${ip.version} ${ip.scope ?? ""}`.trim() : "Dirección IP no válida"
            }
          />
          <MiniTag
            label={ip.valid ? `IPv${ip.version}` : "No válida"}
            tone={ip.valid ? (ip.scope === "pública" ? "accent" : "neutral") : "warning"}
          />
        </Inline>,
        display,
        copy ?? true,
      );
    }
    case "uuid": {
      const full = text;
      const head = options.visibleChars ?? 8;
      const uuid = isUuid(full);
      return withCopy(
        <Tooltip
          arrow
          placement="top"
          title={
            <Box sx={{ fontFamily: MONO, fontSize: "0.7rem" }}>
              {full}
              {uuid && (
                <Box component="span" sx={{ display: "block", opacity: 0.75 }}>
                  UUID v{full[14]}
                </Box>
              )}
            </Box>
          }
        >
          <Box component="span" sx={{ display: "inline-flex", minWidth: 0 }} aria-label={full}>
            <CnCellPill
              label={truncateMiddle(full, head, 4)}
              icon="fingerprint"
              tone={options.tone ?? "neutral"}
              mono
              subtitle={subtitle}
            />
          </Box>
        </Tooltip>,
        full,
        copy ?? true,
      );
    }
    case "version": {
      const v = parseVersion(value);
      const latestRaw =
        typeof options.latestVersion === "function"
          ? options.latestVersion(row)
          : options.latestVersion;
      const latest = latestRaw && v.valid ? parseVersion(latestRaw) : undefined;
      const cmp = latest?.valid ? compareVersions(v.text, latest.text) : undefined;
      const marker = v.prerelease
        ? { label: v.prerelease.split(".")[0], tone: "warning" as const }
        : cmp === undefined
          ? undefined
          : cmp >= 0
            ? { label: "Última", tone: "success" as const }
            : { label: "Desactualizada", tone: "warning" as const };
      const tone: CnCellTone = !v.valid
        ? "neutral"
        : v.prerelease
          ? "warning"
          : cmp !== undefined && cmp >= 0
            ? "success"
            : (options.tone ?? "primary");
      return withCopy(
        <Inline>
          <CnCellPill
            label={v.text}
            icon={
              v.prerelease ? "science" : cmp !== undefined && cmp >= 0 ? "new_releases" : "sell"
            }
            tone={tone}
            mono
            strong
            subtitle={subtitle}
            title={
              latest?.valid && cmp !== undefined && cmp < 0
                ? `Disponible: ${latest.text}`
                : v.prerelease
                  ? "Versión preliminar"
                  : v.valid
                    ? `Versión ${v.major}.${v.minor}.${v.patch}`
                    : "Versión sin formato semver"
            }
          />
          {marker && <MiniTag label={marker.label} tone={marker.tone} />}
        </Inline>,
        v.text,
        copy ?? false,
      );
    }
    case "richtext": {
      const source = String(value);
      const lines = options.lines ?? 2;
      const structured = text !== source.trim();
      const showMore =
        options.detail !== false && (text.length > (options.expandAfter ?? 80) || structured);
      return (
        <Box component="span" sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Box
            component="span"
            title={text.length > 40 ? text : undefined}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: lines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              overflowWrap: "anywhere",
              whiteSpace: "pre-line",
              fontSize: "0.8rem",
            }}
          >
            {text}
          </Box>
          {showMore && (
            <Box sx={{ mt: "2px" }}>
              <CnCellDetail
                pill={{ label: "Ver completo", tone: "primary", icon: "article" }}
                title="Contenido"
                icon="article"
                width={420}
                actions={[
                  {
                    label: "Copiar texto",
                    icon: "content_copy",
                    onClick: () => void navigator.clipboard?.writeText(text),
                  },
                ]}
              >
                <Box sx={{ pb: "12px", maxHeight: 320, overflow: "auto" }}>
                  <CnSafeRichText source={source} format={options.richFormat} />
                </Box>
              </CnCellDetail>
            </Box>
          )}
        </Box>
      );
    }
    case "icon": {
      const obj =
        value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
      const key = obj ? String(obj.value ?? obj.icon ?? "") : String(value);
      const entry = options.statusMap?.[key];
      const iconName = String(
        obj?.icon ?? entry?.icon ?? options.icon ?? (isRegisteredIcon(key) ? key : "help_outline"),
      );
      const label: ReactNode =
        (obj?.label as ReactNode) ??
        entry?.label ??
        (isRegisteredIcon(key) && !options.icon ? capitalize(key.replace(/_/g, " ")) : key);
      const tone = ((obj?.tone as CnCellTone) ?? entry?.color ?? options.tone ?? "primary") as
        CnCellTone | "secondary";
      const badge = (
        <Box
          component="span"
          aria-hidden={!options.iconOnly}
          role={options.iconOnly ? "img" : undefined}
          aria-label={options.iconOnly && typeof label === "string" ? label : undefined}
          sx={{
            width: 26,
            height: 26,
            flexShrink: 0,
            borderRadius: "8px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: TONE[tone].dark,
            backgroundColor: `rgba(${TONE[tone].rgb}, 0.12)`,
          }}
        >
          <CnIcon name={iconName} size={16} />
        </Box>
      );
      if (options.iconOnly) {
        return (
          <Tooltip title={label} arrow>
            {badge}
          </Tooltip>
        );
      }
      return (
        <Box
          component="span"
          title={entry?.description}
          sx={{ display: "inline-flex", alignItems: "center", gap: "8px", minWidth: 0 }}
        >
          {badge}
          <Box component="span" sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Box
              component="span"
              sx={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: TONE[tone].dark,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Box>
            {subtitle && (
              <Box
                component="span"
                sx={{ fontSize: "0.68rem", color: "var(--cn-color-text-muted, #6e7682)" }}
              >
                {subtitle}
              </Box>
            )}
          </Box>
        </Box>
      );
    }
    case "toggle":
      return (
        <ToggleCell
          checked={Boolean(value)}
          row={row}
          onChange={options.onChange}
          trueLabel={options.trueLabel ?? "Activado"}
          falseLabel={options.falseLabel ?? "Desactivado"}
        />
      );
    case "steps": {
      const steps = parseSteps(value, options.stepLabels, options.max);
      return (
        <StepsCell
          current={steps.current}
          total={steps.total}
          labels={steps.labels}
          style={options.stepsStyle ?? "bar"}
        />
      );
    }
    case "stage": {
      const stages = normalizeStages(options.stages);
      const index = stages.findIndex((s) => s.value === String(value));
      if (index === -1) {
        return <CnCellPill label={text} icon="timeline" tone={options.tone ?? "neutral"} strong />;
      }
      return <StageCell stages={stages} index={index} style={options.stageStyle ?? "chevrons"} />;
    }
    case "weekdays": {
      const days = parseWeekdays(value);
      if (!days.length) return <CnEmptyCell type={type} text={options.emptyText} />;
      return (
        <Box component="span" sx={{ display: "inline-flex", flexDirection: "column", gap: "3px" }}>
          <WeekdaysCell days={days} tone={options.tone ?? "primary"} />
          {subtitle !== undefined ? (
            subtitle
          ) : (
            <Box
              component="span"
              sx={{ fontSize: "0.65rem", color: "var(--cn-color-text-muted, #6e7682)" }}
            >
              {text}
            </Box>
          )}
        </Box>
      );
    }
    case "timerange": {
      const range = parseTimeRange(value);
      const duration =
        options.showDuration !== false && range.minutes !== undefined
          ? `${minutesText(range.minutes)}${range.overnight ? " · cruza medianoche" : ""}`
          : undefined;
      return (
        <CnCellPill
          label={text}
          subtitle={subtitle ?? duration}
          icon={range.overnight ? pickIcon("bedtime", "schedule") : "schedule"}
          tone={options.tone ?? "info"}
          mono
          strong
          title={duration ? `Duración: ${duration}` : undefined}
        />
      );
    }
    case "age": {
      const n = toNumber(value);
      if (n !== null && n < 200) {
        return <CnCellPill label={text} icon="cake" tone={options.tone ?? "neutral"} strong />;
      }
      const birth = toDate(value, "date");
      if (!birth) return <CnEmptyCell type={type} text={String(value)} />;
      const age = ageFrom(birth);
      const today = age.nextBirthdayIn === 0;
      const pill = {
        label: text,
        subtitle: subtitle ?? (today ? "¡Hoy cumple años!" : formatCellText("date", value, row)),
        icon: "cake",
        tone: (today ? "accent" : (options.tone ?? "neutral")) as CnCellTone,
        strong: true,
        title: longDate(birth),
      };
      if (options.detail === false) return <CnCellPill {...pill} />;
      const exact =
        age.years >= 1
          ? `${age.years} ${age.years === 1 ? "año" : "años"}${age.months ? ` y ${age.months} ${age.months === 1 ? "mes" : "meses"}` : ""}`
          : `${age.months} ${age.months === 1 ? "mes" : "meses"}`;
      return (
        <CnCellDetail
          pill={pill}
          title="Edad"
          icon="cake"
          tone={pill.tone}
          rows={[
            { label: "Nacimiento", value: longDate(birth) },
            { label: "Edad exacta", value: exact },
            {
              label: "Cumpleaños",
              value: today
                ? "¡Hoy!"
                : `En ${age.nextBirthdayIn} ${age.nextBirthdayIn === 1 ? "día" : "días"} (cumplirá ${age.years + 1})`,
            },
          ]}
        />
      );
    }
    case "range": {
      const [min, max] = parseNumericRange(value);
      const domain = options.max;
      const pill = (
        <CnCellPill
          label={text}
          icon={options.rangeFormat === "currency" ? "attach_money" : "sync_alt"}
          tone={options.tone ?? "primary"}
          mono
          strong
          subtitle={subtitle}
          title={
            min !== null && max !== null
              ? `Amplitud: ${formatCellText(options.rangeFormat ?? "number", max - min, row, options)}`
              : undefined
          }
        />
      );
      if (!options.bar || !domain || min === null || max === null) {
        return withCopy(pill, text, copy ?? false);
      }
      const left = Math.max(0, Math.min(100, (min / domain) * 100));
      const right = Math.max(left, Math.min(100, (max / domain) * 100));
      const tone = options.tone ?? "primary";
      return (
        <Box sx={{ display: "inline-flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
          {pill}
          <Box
            role="img"
            aria-label={`Rango ${text} sobre ${formatCellText(options.rangeFormat ?? "number", domain, row, options)}`}
            sx={{
              position: "relative",
              height: 5,
              mx: "6px",
              borderRadius: 4,
              backgroundColor: `rgba(${TONE[tone].rgb}, 0.12)`,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${left}%`,
                width: `${Math.max(2, right - left)}%`,
                borderRadius: 4,
                backgroundColor: `rgb(${TONE[tone].rgb})`,
              }}
            />
          </Box>
        </Box>
      );
    }
    case "sentiment": {
      const info = resolveSentiment(value, options.sentimentScale);
      if (!info) return <CnCellPill label={text} icon="help_outline" tone="neutral" />;
      const preferred = {
        2: "sentiment_very_satisfied",
        1: "sentiment_satisfied",
        0: "sentiment_neutral",
        [-1]: "sentiment_dissatisfied",
        [-2]: "sentiment_very_dissatisfied",
      }[info.level];
      return (
        <CnCellPill
          label={info.label}
          icon={pickIcon(preferred, "face")}
          tone={info.tone}
          strong
          subtitle={subtitle}
          title={
            info.score !== undefined
              ? `Puntuación: ${info.score.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`
              : info.label
          }
        />
      );
    }
    case "score": {
      const n = toNumber(value);
      if (n === null) return <CnCellPill label={text} tone="neutral" />;
      const max = options.max ?? 100;
      const success = options.thresholds?.success ?? max * 0.8;
      const warning = options.thresholds?.warning ?? max * 0.5;
      const tone: CnCellTone = n >= success ? "success" : n >= warning ? "warning" : "error";
      return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <ScoreRing value={n} max={max} text={text} tone={tone} />
          {subtitle && (
            <Box
              component="span"
              sx={{ fontSize: "0.72rem", color: "var(--cn-color-text-muted, #6e7682)" }}
            >
              {subtitle}
            </Box>
          )}
        </Box>
      );
    }
    case "reference": {
      const ref = asReference(value);
      const href = getSafeUrl(options.href?.(row) ?? ref.href);
      const idText = ref.id !== undefined ? `${options.prefix ?? "#"}${ref.id}` : undefined;
      const sub = [idText !== ref.label ? idText : undefined, ref.subtitle]
        .filter(Boolean)
        .join(" · ");
      return withCopy(
        <CnCellPill
          label={
            <Box
              component="span"
              sx={{
                textDecoration: "underline",
                textDecorationColor: "rgba(61, 90, 254, 0.35)",
                textUnderlineOffset: "2px",
              }}
            >
              {ref.label}
            </Box>
          }
          subtitle={subtitle ?? (sub || undefined)}
          icon={options.icon ?? "link"}
          tone={options.tone ?? "accent"}
          href={handleClick ? undefined : href}
          onClick={handleClick}
          chevron={Boolean(handleClick || href)}
          title={href ?? ref.label}
        />,
        idText ?? "",
        copy ?? Boolean(idText),
      );
    }
    case "counter": {
      const n = Math.trunc(toNumber(value) ?? 0);
      if (n === 0 && options.hideZero) return null;
      const label =
        options.max !== undefined && n > options.max
          ? `${options.max}+`
          : n.toLocaleString("es-MX");
      const tone: CnCellTone = n === 0 ? "neutral" : (options.tone ?? "error");
      const badge = (
        <Box
          component="span"
          role="status"
          aria-label={`${n.toLocaleString("es-MX")}`}
          title={n.toLocaleString("es-MX")}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            minWidth: options.icon ? 18 : 24,
            height: options.icon ? 18 : 24,
            px: options.icon ? "5px" : "8px",
            borderRadius: "999px",
            fontFamily: MONO,
            fontSize: options.icon ? "0.6rem" : "0.72rem",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: n === 0 ? TONE.neutral.dark : "#fff",
            backgroundColor: n === 0 ? `rgba(${TONE.neutral.rgb}, 0.1)` : `rgb(${TONE[tone].rgb})`,
            boxShadow: options.icon ? "0 0 0 2px var(--cn-color-surface, #fff)" : undefined,
          }}
        >
          {label}
        </Box>
      );
      if (!options.icon) return badge;
      return (
        <Box
          component="span"
          sx={{ position: "relative", display: "inline-flex", pr: "10px", pt: "6px" }}
        >
          <CnIcon
            name={options.icon}
            size={22}
            sx={{ color: "var(--cn-color-neutral-600, #4e5660)" }}
          />
          <Box component="span" sx={{ position: "absolute", top: -2, left: 12 }}>
            {badge}
          </Box>
        </Box>
      );
    }
    default:
      return null;
  }
};

/** Contenido visual de una celda tipada. */
export const renderTypedCell = (
  type: CnCellType,
  value: unknown,
  row: unknown,
  options: CnCellOptions = {},
): ReactNode => {
  if (isEmpty(value) && type !== "boolean" && type !== "rating" && type !== "toggle") {
    return <CnEmptyCell type={type} text={options.emptyText} context={options.emptyContext} />;
  }
  const handleClick = options.onClick
    ? (event: MouseEvent) => {
        event.stopPropagation();
        options.onClick?.(value, row);
      }
    : undefined;
  const text = formatCellText(type, value, row, options);
  const subtitle = options.subtitle?.(row);
  const copy = options.copyable;

  switch (type) {
    case "id":
      return withCopy(
        <CnCellPill
          label={text}
          icon="tag"
          tone={options.tone ?? "primary"}
          mono
          onClick={handleClick}
        />,
        text,
        copy ?? true,
      );
    case "code":
      return withCopy(
        <CnCellPill
          label={truncate(applyTransform(text, options.transform), options.maxLength)}
          icon={options.icon ?? "qr_code_2"}
          tone={options.tone ?? "neutral"}
          mono
          subtitle={subtitle}
          title={options.maxLength && text.length > options.maxLength ? text : undefined}
          onClick={handleClick}
        />,
        text,
        copy ?? true,
      );
    case "rfc":
    case "curp": {
      const upper = text.toUpperCase();
      const valid = type === "rfc" ? RFC_RE.test(upper) : CURP_RE.test(upper);
      if (options.detail !== false && valid) {
        const rows: DetailRow[] =
          type === "rfc"
            ? (() => {
                const moral = upper.length === 12;
                const match = RFC_RE.exec(upper) as RegExpExecArray;
                return [
                  { label: "RFC", value: upper, copy: upper, mono: true },
                  { label: "Persona", value: moral ? "Moral (empresa)" : "Física" },
                  {
                    label: moral ? "Constitución" : "Nacimiento",
                    value: yymmddToDate(match[2]) ?? match[2],
                  },
                  { label: "Homoclave", value: match[3], mono: true },
                ];
              })()
            : [
                { label: "CURP", value: upper, copy: upper, mono: true },
                {
                  label: "Nacimiento",
                  value: yymmddToDate(upper.slice(4, 10), upper[16]) ?? upper.slice(4, 10),
                },
                {
                  label: "Sexo",
                  value: upper[10] === "H" ? "Hombre" : upper[10] === "M" ? "Mujer" : "No binario",
                },
                {
                  label: "Entidad",
                  value: CURP_STATES[upper.slice(11, 13)] ?? upper.slice(11, 13),
                },
              ];
        return withCopy(
          <CnCellDetail
            pill={{
              label: upper,
              icon: "verified",
              tone: type === "rfc" ? "primary" : "success",
              mono: true,
              title: `${type.toUpperCase()} con formato válido`,
              subtitle,
            }}
            title={`${type.toUpperCase()} · formato válido`}
            icon="verified"
            tone={type === "rfc" ? "primary" : "success"}
            rows={rows}
          />,
          upper,
          copy ?? true,
        );
      }
      return withCopy(
        <CnCellPill
          label={upper}
          icon={valid ? "verified" : "error_outline"}
          tone={valid ? (type === "rfc" ? "primary" : "success") : "warning"}
          mono
          title={
            valid
              ? `${type.toUpperCase()} con formato válido`
              : `${type.toUpperCase()} con formato no reconocido`
          }
          subtitle={subtitle}
        />,
        upper,
        copy ?? true,
      );
    }
    case "number":
    case "percent": {
      const n = toNumber(value) ?? 0;
      const trend = trendOf(n, options.previous?.(row));
      const scaled = type === "percent" && options.percentScale === "fraction" ? n * 100 : n;
      const auto =
        type === "percent" && !trend
          ? scaled >= 80
            ? { icon: "trending_up", tone: "success" as const }
            : scaled >= 50
              ? { icon: "trending_flat", tone: "warning" as const }
              : { icon: "trending_down", tone: "error" as const }
          : null;
      const indicator = options.plain ? null : (trend ?? auto);
      if (type === "percent" && options.bar) {
        const pct = Math.max(0, Math.min(100, scaled));
        const tone: CnCellTone =
          indicator?.tone ?? (pct >= 80 ? "success" : pct >= 50 ? "warning" : "error");
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 110 }}>
            <Box
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 6,
                backgroundColor: `rgba(${TONE[tone].rgb}, 0.15)`,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 6,
                  backgroundColor: `rgb(${TONE[tone].rgb})`,
                }}
              />
            </Box>
            <Box
              component="span"
              sx={{
                fontFamily: MONO,
                fontSize: "0.72rem",
                fontWeight: 700,
                color: TONE[tone].dark,
              }}
            >
              {text}
            </Box>
          </Box>
        );
      }
      if (!indicator) {
        return withCopy(
          <Box
            component="span"
            sx={{
              fontFamily: MONO,
              fontSize: "0.78rem",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {text}
          </Box>,
          text,
          copy ?? false,
        );
      }
      return withCopy(
        <CnCellPill label={text} icon={indicator.icon} tone={indicator.tone} mono strong />,
        text,
        copy ?? true,
      );
    }
    case "currency": {
      const n = toNumber(value) ?? 0;
      const trend = trendOf(n, options.previous?.(row));
      if (options.plain) {
        return withCopy(
          <Box
            component="span"
            sx={{
              fontFamily: MONO,
              fontSize: "0.8rem",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: n < 0 ? TONE.error.dark : "inherit",
            }}
          >
            {text}
          </Box>,
          text,
          copy ?? false,
        );
      }
      const pillProps = {
        label: text,
        icon: trend ? trend.icon : "attach_money",
        tone: (trend ? trend.tone : n < 0 ? "error" : "primary") as CnCellTone,
        mono: true,
        strong: true,
        subtitle,
      };
      if (options.detail === false) {
        return withCopy(<CnCellPill {...pillProps} />, text, copy ?? true);
      }
      const currency =
        (typeof options.currency === "function" ? options.currency(row) : options.currency) ??
        "MXN";
      const previous = options.previous?.(row);
      const rows: DetailRow[] = [
        { label: "Importe", value: text, copy: String(n), mono: true },
        { label: "Moneda", value: currency },
      ];
      if (previous !== undefined) {
        const diff = n - previous;
        const pct = previous ? (diff / Math.abs(previous)) * 100 : 0;
        rows.push(
          {
            label: "Anterior",
            value: formatCellText("currency", previous, row, options),
            mono: true,
          },
          {
            label: "Variación",
            value: (
              <Box component="span" sx={{ color: diff >= 0 ? TONE.success.dark : TONE.error.dark }}>
                {diff >= 0 ? "+" : ""}
                {formatCellText("currency", diff, row, options)} ({pct >= 0 ? "+" : ""}
                {pct.toLocaleString("es-MX", { maximumFractionDigits: 1 })}%)
              </Box>
            ),
            mono: true,
          },
        );
      }
      if (options.amountInWords !== false) {
        const words = amountInWords(n, currency);
        rows.push({
          label: "Con letra",
          value: (
            <Box component="span" sx={{ fontSize: "0.72rem" }}>
              {words}
            </Box>
          ),
          copy: words,
        });
      }
      return withCopy(
        <CnCellDetail
          pill={pillProps}
          title="Detalle del importe"
          icon="payments"
          tone={pillProps.tone}
          rows={rows}
          width={360}
        />,
        text,
        copy ?? true,
      );
    }
    case "progress": {
      const n = toNumber(value) ?? 0;
      const pct = Math.max(0, Math.min(100, (n / (options.max ?? 100)) * 100));
      const tone: CnCellTone = pct >= 80 ? "success" : pct >= 50 ? "warning" : "error";
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 120 }}>
          <Box
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 6,
              backgroundColor: `rgba(${TONE[tone].rgb}, 0.15)`,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${pct}%`,
                height: "100%",
                borderRadius: 6,
                backgroundColor: `rgb(${TONE[tone].rgb})`,
              }}
            />
          </Box>
          <Box
            component="span"
            sx={{
              fontFamily: MONO,
              fontSize: "0.72rem",
              fontWeight: 700,
              color: TONE[tone].dark,
              minWidth: 34,
              textAlign: "right",
            }}
          >
            {Math.round(pct)}%
          </Box>
        </Box>
      );
    }
    case "date":
    case "datetime":
    case "time": {
      const date = toDate(value, type);
      if (!date) return <CnEmptyCell type={type} text={String(value)} />;
      const relative =
        type !== "time" && options.relative !== false ? formatRelative(date) : undefined;
      const full = new Intl.DateTimeFormat("es-MX", {
        dateStyle: type === "time" ? undefined : "full",
        timeStyle: type === "date" ? undefined : "short",
      }).format(date);
      const pill = {
        label: text,
        subtitle: relative,
        icon:
          type === "time" ? "schedule" : type === "datetime" ? "event_available" : "calendar_month",
        tone: "primary" as const,
        mono: true,
        title: full.charAt(0).toUpperCase() + full.slice(1),
      };
      if (options.detail === false || type === "time") {
        return withCopy(<CnCellPill {...pill} />, text, copy ?? true);
      }
      const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      const isoFull =
        type === "datetime" ? `${iso}T${pad(date.getHours())}:${pad(date.getMinutes())}` : iso;
      const longDate = new Intl.DateTimeFormat("es-MX", { dateStyle: "full" }).format(date);
      const start = new Date(date.getFullYear(), 0, 1);
      const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000) + 1;
      const thursday = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 3 - ((date.getDay() + 6) % 7),
      );
      const week =
        1 +
        Math.round(
          ((thursday.getTime() - new Date(thursday.getFullYear(), 0, 4).getTime()) / 86400000 -
            3 +
            ((new Date(thursday.getFullYear(), 0, 4).getDay() + 6) % 7)) /
            7,
        );
      const rows: DetailRow[] = [
        { label: "Fecha", value: longDate.charAt(0).toUpperCase() + longDate.slice(1), copy: text },
        ...(type === "datetime"
          ? [
              {
                label: "Hora",
                value: new Intl.DateTimeFormat("es-MX", {
                  timeStyle: "short",
                  hour12: true,
                }).format(date),
                mono: true,
              },
            ]
          : []),
        ...(relative
          ? [{ label: "Relativo", value: relative.charAt(0).toUpperCase() + relative.slice(1) }]
          : []),
        {
          label: "Semana",
          value: `${week} · día ${dayOfYear} del año · T${Math.floor(date.getMonth() / 3) + 1}`,
        },
        { label: "ISO", value: isoFull, copy: isoFull, mono: true },
      ];
      return withCopy(
        <CnCellDetail pill={pill} title={pill.title} icon={pill.icon} rows={rows} width={330}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              "& [data-cn-calendar]": { minWidth: 0, p: 0 },
            }}
          >
            <CnCalendar value={iso} readOnly views={["day"]} defaultMonth={iso} />
          </Box>
        </CnCellDetail>,
        text,
        copy ?? true,
      );
    }
    case "duration":
      return <CnCellPill label={text} icon="timer" tone="info" mono />;
    case "boolean": {
      const on = Boolean(value);
      const entry = options.statusMap?.[String(on)];
      return (
        <CnCellPill
          label={entry?.label ?? (on ? (options.trueLabel ?? "Sí") : (options.falseLabel ?? "No"))}
          icon={entry?.icon ?? (on ? "check_circle" : "cancel")}
          tone={(entry?.color as CnCellTone) ?? (on ? "success" : "neutral")}
          strong
        />
      );
    }
    case "status": {
      const key = String(value);
      const entry = options.statusMap?.[key] ?? STATUS_FALLBACK[key.toLowerCase()];
      return withCopy(
        <CnCellPill
          label={entry?.label ?? key}
          icon={entry?.icon ?? "help_outline"}
          tone={(entry?.color as CnCellTone) ?? "neutral"}
          strong
          title={entry?.description}
        />,
        typeof entry?.label === "string" ? entry.label : key,
        copy ?? false,
      );
    }
    case "tags": {
      const list = (Array.isArray(value) ? value : String(value).split(","))
        .map((tag) => String(tag).trim())
        .filter(Boolean);
      return <TagsCell tags={list} max={options.maxTags ?? 2} />;
    }
    case "avatar": {
      const src = options.image?.(row);
      const safe = src ? getSafeUrl(src) : undefined;
      const badge = options.badge?.(row);
      const radius =
        options.avatarShape === "square"
          ? "6px"
          : options.avatarShape === "rounded"
            ? "10px"
            : "50%";
      return withCopy(
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: radius,
              overflow: "hidden",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              backgroundColor: colorFromText(text),
              boxShadow:
                "0 0 0 2px var(--cn-color-surface, #fff), 0 0 0 3px rgba(37, 77, 135, 0.18)",
            }}
          >
            {safe ? (
              <Box
                component="img"
                src={safe}
                alt=""
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              getInitials(text)
            )}
          </Box>
          <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
            <Box
              component="span"
              sx={{ display: "inline-flex", alignItems: "center", gap: "6px", minWidth: 0 }}
            >
              <Box
                component={handleClick ? "button" : "span"}
                type={handleClick ? "button" : undefined}
                onClick={handleClick}
                sx={{
                  ...(handleClick && {
                    all: "unset",
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }),
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--cn-color-text, #222831)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {text}
              </Box>
              {badge && (
                <Box
                  component="span"
                  sx={{
                    flexShrink: 0,
                    px: "6px",
                    borderRadius: "999px",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: TONE[badge.tone ?? "primary"].dark,
                    backgroundColor: `rgba(${TONE[badge.tone ?? "primary"].rgb}, 0.1)`,
                  }}
                >
                  {badge.label}
                </Box>
              )}
            </Box>
            {subtitle && (
              <Box
                component="span"
                sx={{
                  fontSize: "0.68rem",
                  color: "var(--cn-color-text-muted, #6e7682)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {subtitle}
              </Box>
            )}
          </Box>
        </Box>,
        text,
        copy ?? false,
      );
    }
    case "contact": {
      const contacts = asContacts(value);
      if (contacts.length === 0)
        return (
          <CnEmptyCell type="contact" text={options.emptyText} context={options.emptyContext} />
        );
      if (contacts.length === 1) {
        const contact = contacts[0];
        return (
          <ContactPopover contacts={contacts} shape={options.avatarShape}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <ContactAvatar contact={contact} shape={options.avatarShape} />
              <Box
                sx={{
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1.3,
                  textAlign: "left",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--cn-color-text, #222831)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {contact.name}
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontSize: "0.68rem",
                    color: "var(--cn-color-text-muted, #6e7682)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {contact.position ?? contact.email ?? contact.phone ?? ""}
                </Box>
              </Box>
            </Box>
          </ContactPopover>
        );
      }
      const max = options.maxItems ?? 4;
      return (
        <ContactPopover contacts={contacts} shape={options.avatarShape}>
          <Box sx={{ display: "inline-flex", alignItems: "center" }}>
            {contacts.slice(0, max).map((contact, i) => (
              <Box key={`${contact.name}-${i}`} sx={{ ml: i === 0 ? 0 : "-8px", zIndex: max - i }}>
                <ContactAvatar contact={contact} shape={options.avatarShape} ring />
              </Box>
            ))}
            {contacts.length > max && (
              <Box
                sx={{
                  ml: "-8px",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--cn-color-neutral-700, #3a4048)",
                  backgroundColor: "var(--cn-color-neutral-150, #e9ecef)",
                  boxShadow: "0 0 0 2px var(--cn-color-surface, #fff)",
                }}
              >
                +{contacts.length - max}
              </Box>
            )}
          </Box>
        </ContactPopover>
      );
    }
    case "email": {
      const domain = text.split("@")[1] ?? "";
      const pill = {
        label: text,
        subtitle: subtitle ?? (domain || undefined),
        icon: "mail",
        tone: "accent" as const,
        mono: true,
        maxWidth: 240,
        title: `Escribir a ${text}`,
      };
      if (options.detail === false) {
        return withCopy(<CnCellPill {...pill} href={`mailto:${text}`} />, text, copy ?? true);
      }
      return withCopy(
        <CnCellDetail
          pill={pill}
          title={text}
          icon="mail"
          tone="accent"
          rows={[
            { label: "Correo", value: text, copy: text, mono: true },
            { label: "Dominio", value: domain, copy: domain },
          ]}
          actions={[
            { label: "Escribir correo", icon: "send", href: `mailto:${text}` },
            ...(domain
              ? [
                  {
                    label: "Visitar dominio",
                    icon: "language",
                    href: `https://${domain}`,
                    external: true,
                  },
                ]
              : []),
          ]}
        />,
        text,
        copy ?? true,
      );
    }
    case "phone": {
      const digits = String(value).replace(/[^\d+]/g, "");
      const wa =
        digits.replace(/^\+/, "").length === 10 ? `52${digits}` : digits.replace(/^\+/, "");
      return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          {options.detail === false ? (
            <CnCellPill
              label={text}
              icon="call"
              tone="info"
              mono
              href={`tel:${digits}`}
              title={`Llamar a ${text}`}
            />
          ) : (
            <CnCellDetail
              pill={{
                label: text,
                icon: "call",
                tone: "info",
                mono: true,
                title: `Llamar a ${text}`,
              }}
              title={text}
              icon="call"
              tone="info"
              rows={[
                { label: "Número", value: text, copy: digits, mono: true },
                {
                  label: "Internacional",
                  value: digits.startsWith("+") ? digits : `+${wa}`,
                  copy: digits.startsWith("+") ? digits : `+${wa}`,
                  mono: true,
                },
              ]}
              actions={[
                { label: "Llamar", icon: "call", href: `tel:${digits}` },
                { label: "WhatsApp", icon: "chat", href: `https://wa.me/${wa}`, external: true },
                { label: "SMS", icon: "sms", href: `sms:${digits}` },
              ]}
            />
          )}
          {options.whatsapp && (
            <Tooltip title="Abrir WhatsApp">
              <Box
                component="a"
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event: MouseEvent) => event.stopPropagation()}
                aria-label={`WhatsApp ${text}`}
                sx={{
                  display: "inline-flex",
                  color: "#25a244",
                  p: "3px",
                  borderRadius: "50%",
                  "&:hover": { backgroundColor: "rgba(37,162,68,0.12)" },
                }}
              >
                <CnIcon name="chat" size={14} />
              </Box>
            </Tooltip>
          )}
          {(copy ?? true) && <CnCopyButton text={digits} />}
        </Box>
      );
    }
    case "link": {
      const raw = options.href?.(row) ?? String(value);
      const safe = getSafeUrl(raw);
      if (!safe) return <CnEmptyCell type="link" />;
      let host = text;
      try {
        host = new URL(safe, "https://x.invalid").hostname.replace(/^www\./, "");
        if (host === "x.invalid") host = text;
      } catch {
        // URL relativa: se muestra tal cual.
      }
      return withCopy(
        <CnCellPill
          label={options.linkLabel?.(row) ?? (options.href ? text : host)}
          icon="link"
          tone="accent"
          href={safe}
          chevron
          title={safe}
        />,
        safe,
        copy ?? true,
      );
    }
    case "location":
    case "coordinates": {
      const point = type === "coordinates" ? asPoint(value) : null;
      const query = point ? `${point.lat},${point.lng}` : text;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      const pill = {
        label: text,
        icon: type === "coordinates" ? "my_location" : "location_on",
        tone: "error" as const,
        maxWidth: 240,
        title: text,
        subtitle,
        mono: type === "coordinates",
      };
      if (options.detail === false) {
        return withCopy(
          <CnCellPill
            {...pill}
            href={options.mapLink ? mapsUrl : undefined}
            chevron={options.mapLink}
          />,
          text,
          copy ?? true,
        );
      }
      const loc =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : null;
      const rows: DetailRow[] =
        loc && !point
          ? [
              ["Calle", loc.street],
              ["Colonia", loc.neighborhood ?? loc.colonia],
              ["Ciudad", loc.city],
              ["Estado", loc.state],
              ["C.P.", loc.postalCode ?? loc.zip],
              ["País", loc.country],
            ]
              .filter(([, v]) => v)
              .map(([label, v]) => ({ label: String(label), value: String(v) }))
          : [
              {
                label: point ? "Coordenadas" : "Dirección",
                value: text,
                copy: text,
                mono: Boolean(point),
              },
            ];
      return withCopy(
        <CnCellDetail
          pill={pill}
          title={point ? "Ubicación" : text}
          icon="location_on"
          tone="error"
          rows={rows}
          width={360}
          actions={[
            { label: "Abrir en Google Maps", icon: "map", href: mapsUrl, external: true },
            {
              label: "Cómo llegar",
              icon: "directions",
              href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`,
              external: true,
            },
          ]}
        >
          {options.mapPreview !== false && (
            <Box
              component="iframe"
              title="Mapa"
              loading="lazy"
              referrerPolicy="no-referrer"
              src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
              sx={{
                display: "block",
                width: "100%",
                height: 170,
                border: 0,
                borderRadius: "10px",
                backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
              }}
            />
          )}
        </CnCellDetail>,
        text,
        copy ?? true,
      );
    }
    case "image": {
      const images = toImageList(value)
        .map((url) => getSafeUrl(url))
        .filter(Boolean) as string[];
      return images.length ? (
        <ImageGallery images={images} max={options.maxItems ?? 3} />
      ) : (
        <CnEmptyCell type="image" />
      );
    }
    case "rating": {
      const n = toNumber(value) ?? 0;
      const max = options.max ?? 5;
      const tone: CnCellTone = n / max >= 0.7 ? "success" : n / max >= 0.5 ? "warning" : "error";
      return (
        <CnCellPill
          label={n.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
          subtitle={
            <Box component="span" aria-hidden sx={{ letterSpacing: "1px", fontSize: "0.62rem" }}>
              {"★".repeat(Math.round(n))}
              {"☆".repeat(Math.max(0, max - Math.round(n)))}
            </Box>
          }
          icon="star"
          tone={tone}
          mono
          strong
          title={`${n} de ${max}`}
        />
      );
    }
    case "file": {
      const files = asFiles(value);
      const first = files[0];
      const visual = fileVisual(first.name);
      const fileRows = files.map((file) => ({
        label:
          fileVisual(file.name).icon === "picture_as_pdf"
            ? "PDF"
            : (file.name.split(".").pop() ?? "").toUpperCase() || "Archivo",
        value: (
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            {file.url && getSafeUrl(file.url) ? (
              <Box
                component="a"
                href={getSafeUrl(file.url)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "var(--cn-color-accent-700, #2a3cb8)" }}
              >
                {file.name}
              </Box>
            ) : (
              file.name
            )}
            {file.size !== undefined && (
              <Box
                component="span"
                sx={{ fontWeight: 400, color: "var(--cn-color-text-muted, #6e7682)" }}
              >
                {formatBytesText(file.size)}
              </Box>
            )}
          </Box>
        ),
      }));
      const pill = {
        label: files.length > 1 ? `${first.name} +${files.length - 1}` : first.name,
        subtitle: first.size !== undefined ? formatBytesText(first.size) : subtitle,
        icon: visual.icon,
        tone: visual.tone,
        maxWidth: 240,
        title: files.map((f) => f.name).join(", "),
      };
      const safe = first.url ? getSafeUrl(first.url) : undefined;
      return (
        <CnCellDetail
          pill={pill}
          title={files.length > 1 ? `${files.length} archivos` : first.name}
          icon={visual.icon}
          tone={visual.tone}
          rows={fileRows}
          actions={
            safe && files.length === 1
              ? [
                  { label: "Abrir", icon: "open_in_new", href: safe, external: true },
                  { label: "Descargar", icon: "download", href: safe },
                ]
              : []
          }
        />
      );
    }
    case "color": {
      const hex = String(value);
      const safeColor = /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))$/i.test(hex)
        ? hex
        : "transparent";
      return withCopy(
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <Box
            component="span"
            aria-hidden
            sx={{
              width: 22,
              height: 22,
              borderRadius: "6px",
              backgroundColor: safeColor,
              boxShadow: "inset 0 0 0 1px rgba(17,20,24,0.15)",
            }}
          />
          <Box component="span" sx={{ fontFamily: MONO, fontSize: "0.75rem", fontWeight: 600 }}>
            {text}
          </Box>
        </Box>,
        text,
        copy ?? true,
      );
    }
    case "country": {
      const code = String(value).toUpperCase();
      return (
        <Box
          component="span"
          sx={{ display: "inline-flex", alignItems: "center", gap: "8px", minWidth: 0 }}
        >
          <CnFlagIcon code={code} size={20} />
          <Box
            component="span"
            sx={{
              fontSize: "0.8rem",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </Box>
          <Box
            component="span"
            sx={{
              fontFamily: MONO,
              fontSize: "0.65rem",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {code}
          </Box>
        </Box>
      );
    }
    case "json": {
      let summary = "JSON";
      try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        summary = Array.isArray(parsed)
          ? `[${parsed.length} elementos]`
          : parsed && typeof parsed === "object"
            ? `{${Object.keys(parsed).length} campos}`
            : String(parsed);
      } catch {
        summary = truncate(String(value), 24);
      }
      return (
        <CnCellDetail
          pill={{ label: summary, icon: "data_object", tone: "neutral", mono: true }}
          title="Datos"
          icon="data_object"
          tone="neutral"
          width={420}
          actions={[
            {
              label: "Copiar JSON",
              icon: "content_copy",
              onClick: () =>
                void navigator.clipboard?.writeText(
                  typeof value === "string" ? value : JSON.stringify(value, null, 2),
                ),
            },
          ]}
        >
          <Box sx={{ pb: "12px" }}>
            <JsonView data={value} />
          </Box>
        </CnCellDetail>
      );
    }
    case "daterange": {
      const [from, to] = asRange(value);
      const a = from ? toDate(from, "date") : null;
      const b = to ? toDate(to, "date") : null;
      const days = a && b ? Math.round((b.getTime() - a.getTime()) / 86400000) + 1 : undefined;
      const now = new Date();
      const state =
        a && b
          ? now < a
            ? { label: "Próximo", tone: "info" as const }
            : now > b
              ? { label: "Concluido", tone: "neutral" as const }
              : { label: "En curso", tone: "success" as const }
          : undefined;
      return (
        <CnCellDetail
          pill={{
            label: text,
            subtitle: days ? `${days} ${days === 1 ? "día" : "días"}` : undefined,
            icon: "date_range",
            tone: state?.tone ?? "primary",
            mono: true,
          }}
          title="Periodo"
          icon="date_range"
          tone={state?.tone ?? "primary"}
          rows={[
            ...(a
              ? [
                  {
                    label: "Inicio",
                    value: new Intl.DateTimeFormat("es-MX", { dateStyle: "full" }).format(a),
                  },
                ]
              : []),
            ...(b
              ? [
                  {
                    label: "Fin",
                    value: new Intl.DateTimeFormat("es-MX", { dateStyle: "full" }).format(b),
                  },
                ]
              : []),
            ...(days
              ? [{ label: "Duración", value: `${days} ${days === 1 ? "día" : "días"}` }]
              : []),
            ...(state ? [{ label: "Estado", value: state.label }] : []),
          ]}
        />
      );
    }
    case "bytes":
      return (
        <CnCellPill
          label={text}
          icon="sd_storage"
          tone="neutral"
          mono
          title={`${toNumber(value)?.toLocaleString("es-MX")} bytes`}
        />
      );
    case "sparkline": {
      const series = (Array.isArray(value) ? value : [])
        .map(Number)
        .filter((n) => Number.isFinite(n));
      if (series.length < 2)
        return <CnEmptyCell type={type} text={options.emptyText} context={options.emptyContext} />;
      const last = series[series.length - 1];
      const trend = trendOf(last, series[series.length - 2]);
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: `rgb(${TONE[trend?.tone ?? "primary"].rgb})`,
          }}
        >
          <Box sx={{ width: 90, flexShrink: 0 }}>
            <CnSparkline
              data={series}
              type="area"
              height={28}
              label={`Tendencia: ${series.join(", ")}`}
            />
          </Box>
          <Box component="span" sx={{ fontFamily: MONO, fontSize: "0.75rem", fontWeight: 700 }}>
            {last.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
          </Box>
        </Box>
      );
    }
    case "list": {
      const items = (Array.isArray(value) ? value : [value]).map(String).filter(Boolean);
      const max = options.maxItems ?? 2;
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
          {items.slice(0, max).map((item, i) => (
            <Box
              key={`${item}-${i}`}
              component="span"
              sx={{
                display: "flex",
                gap: "6px",
                fontSize: "0.78rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <Box component="span" sx={{ color: "var(--cn-color-brand-500, #3562a6)" }}>
                •
              </Box>
              {item}
            </Box>
          ))}
          {items.length > max && (
            <Box>
              <CnCellDetail
                pill={{ label: `+${items.length - max} más`, tone: "primary" }}
                title={`${items.length} elementos`}
                icon="list"
                rows={items.map((item, i) => ({ label: String(i + 1), value: item }))}
              />
            </Box>
          )}
        </Box>
      );
    }
    case "delta":
    case "priority":
    case "deadline":
    case "ip":
    case "uuid":
    case "version":
    case "richtext":
    case "icon":
    case "toggle":
    case "steps":
    case "stage":
    case "weekdays":
    case "timerange":
    case "age":
    case "range":
    case "sentiment":
    case "score":
    case "reference":
    case "counter":
      return renderExtraCell(type, value, row, options, { text, subtitle, copy, handleClick });
    case "masked": {
      const raw = String(value);
      return <MaskedValue raw={raw} masked={text} copyEnabled={copy ?? true} />;
    }
    default: {
      if (options.pill) {
        return withCopy(
          <CnCellPill
            label={truncate(text, options.maxLength)}
            icon={options.icon}
            tone={options.tone ?? "neutral"}
            subtitle={subtitle}
            title={options.maxLength && text.length > options.maxLength ? text : undefined}
            onClick={handleClick}
          />,
          text,
          copy ?? true,
        );
      }
      const lines = options.lines ?? 2;
      return withCopy(
        <Box
          component="span"
          sx={{ display: "inline-flex", alignItems: "center", gap: "6px", minWidth: 0 }}
        >
          {options.icon && (
            <CnIcon
              name={options.icon}
              size={14}
              sx={{ color: "var(--cn-color-brand-500, #3562a6)", flexShrink: 0 }}
            />
          )}
          <Box component="span" sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Box
              component={handleClick ? "button" : "span"}
              type={handleClick ? "button" : undefined}
              onClick={handleClick}
              title={
                text.length > 40 || (options.maxLength && text.length > options.maxLength)
                  ? text
                  : undefined
              }
              sx={{
                ...(handleClick && {
                  all: "unset",
                  cursor: "pointer",
                  color: "var(--cn-color-brand-700, #1c3d6d)",
                  "&:hover": { textDecoration: "underline" },
                }),
                display: "-webkit-box",
                WebkitLineClamp: lines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                overflowWrap: "anywhere",
                fontSize: "0.8rem",
                fontWeight: options.bold ? 700 : options.icon ? 600 : 400,
              }}
            >
              {truncate(text, options.maxLength)}
            </Box>
            {options.detail !== false && text.length > (options.expandAfter ?? 80) && (
              <Box sx={{ mt: "2px" }}>
                <CnCellDetail
                  pill={{ label: "Ver completo", tone: "primary" }}
                  title="Texto completo"
                  icon="notes"
                  width={380}
                  actions={[
                    {
                      label: "Copiar texto",
                      icon: "content_copy",
                      onClick: () => void navigator.clipboard?.writeText(text),
                    },
                  ]}
                >
                  <Box
                    sx={{
                      pb: "12px",
                      maxHeight: 280,
                      overflow: "auto",
                      fontSize: "0.82rem",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {text}
                  </Box>
                </CnCellDetail>
              </Box>
            )}
            {subtitle && (
              <Box
                component="span"
                sx={{ fontSize: "0.68rem", color: "var(--cn-color-text-muted, #6e7682)" }}
              >
                {subtitle}
              </Box>
            )}
          </Box>
        </Box>,
        text,
        copy ?? false,
      );
    }
  }
};

export type CnCellProps = CnCellOptions & {
  type?: CnCellType;
  value: unknown;
  /** Fila completa (para subtítulos, imágenes, insignias…). */
  row?: unknown;
};

/**
 * Celda tipada independiente: úsala en `column.cell` para combinar formatos
 * (`<CnCell type="currency" value={row.total} />`) o fuera de la tabla.
 */
export const CnCell = ({ type = "text", value, row, ...options }: CnCellProps) => (
  <>{renderTypedCell(type, value, row ?? {}, options)}</>
);
