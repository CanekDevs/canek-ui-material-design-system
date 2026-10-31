/**
 * Utilidades de fecha sin dependencias. Los valores viajan siempre como cadenas
 * ISO locales (sin zona horaria) para que sean serializables y comparables:
 * `YYYY-MM-DD`, `HH:mm`, `YYYY-MM-DDTHH:mm`, `YYYY-MM`.
 */

export type CnDateKind = "date" | "time" | "datetime" | "month";
export type CnDateDisplayFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type CnWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const pad2 = (n: number): string => String(n).padStart(2, "0");

export const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const toIsoMonth = (date: Date): string => toIsoDate(date).slice(0, 7);

/** Fecha local estricta desde `YYYY-MM-DD` (rechaza 2024-02-30). */
export const parseIsoDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
};

export const parseIsoTime = (
  value: string | null | undefined,
): { hours: number; minutes: number } | null => {
  if (!value) return null;
  const match = /(?:^|T)(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
};

/** ¿La cadena es un valor ISO válido para el tipo indicado? */
export const isValidIsoValue = (value: string, kind: CnDateKind): boolean => {
  switch (kind) {
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && parseIsoDate(value) !== null;
    case "month":
      return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
    case "time":
      return /^\d{2}:\d{2}$/.test(value) && parseIsoTime(value) !== null;
    case "datetime":
      return (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
        parseIsoDate(value) !== null &&
        parseIsoTime(value) !== null
      );
  }
};

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Suma meses conservando el día cuando existe (31 ene + 1 mes → 29 feb). */
export const addMonths = (date: Date, months: number): Date => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
};

export const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
export const endOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const isSameDay = (a: Date | null | undefined, b: Date | null | undefined): boolean =>
  Boolean(a && b) &&
  a!.getFullYear() === b!.getFullYear() &&
  a!.getMonth() === b!.getMonth() &&
  a!.getDate() === b!.getDate();

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const startOfWeek = (date: Date, weekStartsOn: CnWeekday): Date =>
  addDays(date, -((date.getDay() - weekStartsOn + 7) % 7));

/** Matriz de 6 semanas que cubre el mes (incluye días de meses vecinos). */
export const getCalendarWeeks = (month: Date, weekStartsOn: CnWeekday = 1): Date[][] => {
  const first = startOfWeek(startOfMonth(month), weekStartsOn);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(first, week * 7 + day)),
  );
};

const capitalize = (text: string): string => text.charAt(0).toLocaleUpperCase() + text.slice(1);

export const getWeekdayNames = (
  locale: string,
  weekStartsOn: CnWeekday,
  style: "narrow" | "short" | "long" = "short",
): string[] => {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: style });
  // 2023-01-01 fue domingo.
  return Array.from({ length: 7 }, (_, i) =>
    capitalize(formatter.format(new Date(2023, 0, 1 + ((weekStartsOn + i) % 7)))).replace(".", ""),
  );
};

export const getMonthNames = (locale: string, style: "long" | "short" = "long"): string[] => {
  const formatter = new Intl.DateTimeFormat(locale, { month: style });
  return Array.from({ length: 12 }, (_, i) =>
    capitalize(formatter.format(new Date(2023, i, 1))).replace(".", ""),
  );
};

export const formatMonthYear = (date: Date, locale: string): string =>
  capitalize(new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date));

export const formatLongDate = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

// ─── Máscaras de captura ───────────────────────────────────────────────

const DATE_PATTERNS: Record<CnDateDisplayFormat, string> = {
  "DD/MM/YYYY": "DD/MM/YYYY",
  "MM/DD/YYYY": "MM/DD/YYYY",
  "YYYY-MM-DD": "YYYY-MM-DD",
};

/** Patrón visible (y placeholder) para el tipo y formato. */
export const getInputPattern = (
  kind: CnDateKind,
  format: CnDateDisplayFormat = "DD/MM/YYYY",
  ampm = false,
): string => {
  const time = ampm ? "hh:mm aa" : "HH:mm";
  switch (kind) {
    case "time":
      return time;
    case "month":
      return format === "YYYY-MM-DD" ? "YYYY-MM" : "MM/YYYY";
    case "datetime":
      return `${DATE_PATTERNS[format]} ${time}`;
    default:
      return DATE_PATTERNS[format];
  }
};

/** Placeholder en español (AAAA en lugar de YYYY). */
export const patternToPlaceholder = (pattern: string): string =>
  pattern.replace(/YYYY/g, "AAAA").replace(/aa/g, "a. m.");

const isTokenChar = (char: string) => /[DMYHhm]/.test(char);

/**
 * Aplica la máscara a lo que escribe el usuario: solo acepta dígitos (y a/p en
 * 12 h) e inserta los separadores automáticamente.
 */
export const applyDateMask = (raw: string, pattern: string): string => {
  const hasMeridiem = pattern.endsWith("aa");
  const core = hasMeridiem ? pattern.slice(0, -3) : pattern;
  const digits = raw.replace(/\D/g, "");
  let result = "";
  let index = 0;
  for (const char of core) {
    if (index >= digits.length) break;
    if (isTokenChar(char)) {
      result += digits[index];
      index += 1;
    } else {
      result += char;
    }
  }
  if (hasMeridiem && result.length === core.length) {
    const meridiem = /p/i.test(raw.replace(/[^ap]/gi, "").slice(-1))
      ? "p. m."
      : /a/i.test(raw)
        ? "a. m."
        : "";
    if (meridiem) result += ` ${meridiem}`;
  }
  return result;
};

const extract = (text: string, pattern: string, token: string): number | null => {
  const start = pattern.indexOf(token);
  if (start === -1) return null;
  const slice = text.slice(start, start + token.length);
  return /^\d+$/.test(slice) && slice.length === token.length ? Number(slice) : null;
};

/** Convierte el texto enmascarado a ISO; `null` si está incompleto o no es válido. */
export const parseMaskedInput = (
  text: string,
  kind: CnDateKind,
  format: CnDateDisplayFormat = "DD/MM/YYYY",
  ampm = false,
): string | null => {
  const pattern = getInputPattern(kind, format, ampm);
  const core = ampm ? pattern.replace(" aa", "") : pattern;
  if (text.length < core.length) return null;

  let datePart = "";
  if (kind !== "time") {
    const year = extract(text, core, "YYYY");
    const month = extract(text, core, "MM");
    const day = kind === "month" ? 1 : extract(text, core, "DD");
    if (year === null || month === null || day === null) return null;
    datePart = `${year}-${pad2(month)}-${pad2(day)}`;
    if (!parseIsoDate(datePart)) return null;
    if (kind === "month") return datePart.slice(0, 7);
  }

  let timePart = "";
  if (kind === "time" || kind === "datetime") {
    const hourToken = ampm ? "hh" : "HH";
    let hours = extract(text, core, hourToken);
    const minutes = extract(text, core, "mm");
    if (hours === null || minutes === null || minutes > 59) return null;
    if (ampm) {
      if (hours < 1 || hours > 12) return null;
      const isPm = /p/i.test(text.slice(core.length));
      const isAm = /a/i.test(text.slice(core.length));
      if (!isPm && !isAm) return null;
      hours = (hours % 12) + (isPm ? 12 : 0);
    } else if (hours > 23) {
      return null;
    }
    timePart = `${pad2(hours)}:${pad2(minutes)}`;
  }

  return kind === "time" ? timePart : kind === "datetime" ? `${datePart}T${timePart}` : datePart;
};

/** Texto a mostrar en el input para un valor ISO. */
export const formatIsoForInput = (
  value: string,
  kind: CnDateKind,
  format: CnDateDisplayFormat = "DD/MM/YYYY",
  ampm = false,
): string => {
  if (!value || !isValidIsoValue(value, kind)) return value ?? "";
  const pattern = getInputPattern(kind, format, ampm);
  const date = kind === "time" ? null : parseIsoDate(kind === "month" ? `${value}-01` : value);
  const time = kind === "time" || kind === "datetime" ? parseIsoTime(value) : null;
  let output = pattern;
  if (date) {
    output = output
      .replace("YYYY", String(date.getFullYear()))
      .replace("MM", pad2(date.getMonth() + 1))
      .replace("DD", pad2(date.getDate()));
  }
  if (time) {
    if (ampm) {
      const hours12 = time.hours % 12 || 12;
      output = output
        .replace("hh", pad2(hours12))
        .replace("mm", pad2(time.minutes))
        .replace("aa", time.hours >= 12 ? "p. m." : "a. m.");
    } else {
      output = output.replace("HH", pad2(time.hours)).replace("mm", pad2(time.minutes));
    }
  }
  return output;
};

export const defaultFormatForLocale = (locale: string): CnDateDisplayFormat =>
  /^en-US$/i.test(locale) ? "MM/DD/YYYY" : "DD/MM/YYYY";
