import { pad2 } from "./calendar-utils";

/*
 * Zonas horarias con `Intl` (sin dependencias). Las vistas trabajan con
 * "hora de pared": un `Date` local cuyos campos (año, mes, día, hora) son los
 * de la zona elegida. `toZonedWallTime` convierte un instante a hora de pared
 * y `fromZonedWallTime` hace lo inverso (para devolver cambios y selecciones
 * como instantes reales).
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

const partsFormatter = (timeZone: string): Intl.DateTimeFormat => {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, fmt);
  }
  return fmt;
};

/** ¿Es una zona IANA válida para este navegador? */
export const isValidTimeZone = (timeZone: string | undefined): timeZone is string => {
  if (!timeZone) return false;
  try {
    partsFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
};

type WallParts = { y: number; mo: number; d: number; h: number; mi: number; s: number };

const zonedParts = (date: Date, timeZone: string): WallParts => {
  const map: Record<string, number> = {};
  for (const part of partsFormatter(timeZone).formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = Number(part.value);
  }
  return {
    y: map.year,
    mo: map.month - 1,
    d: map.day,
    h: map.hour === 24 ? 0 : map.hour,
    mi: map.minute,
    s: map.second,
  };
};

/** Diferencia en minutos entre la hora de la zona y UTC en ese instante (CDMX = -360). */
export const timeZoneOffset = (date: Date, timeZone: string): number => {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.y, p.mo, p.d, p.h, p.mi, p.s);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60_000);
};

/** Instante → hora de pared de la zona (como `Date` local). */
export const toZonedWallTime = (date: Date, timeZone: string): Date => {
  const p = zonedParts(date, timeZone);
  return new Date(p.y, p.mo, p.d, p.h, p.mi, p.s, date.getMilliseconds());
};

/** Hora de pared de la zona (campos locales del `Date`) → instante real. */
export const fromZonedWallTime = (wall: Date, timeZone: string): Date => {
  const asUtc = Date.UTC(
    wall.getFullYear(),
    wall.getMonth(),
    wall.getDate(),
    wall.getHours(),
    wall.getMinutes(),
    wall.getSeconds(),
    wall.getMilliseconds(),
  );
  // Dos pasadas resuelven los cambios de horario de verano.
  let guess = asUtc - timeZoneOffset(new Date(asUtc), timeZone) * 60_000;
  guess = asUtc - timeZoneOffset(new Date(guess), timeZone) * 60_000;
  return new Date(guess);
};

/** "GMT-6", "GMT+5:30" para un instante. */
export const formatOffset = (minutes: number): string => {
  if (minutes === 0) return "GMT";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${pad2(m)}` : ""}`;
};

/** Etiqueta corta de la zona ("CST", "GMT-5"); con `long`, el nombre largo. */
export const timeZoneLabel = (
  timeZone: string,
  date: Date = new Date(),
  locale = "es-MX",
  style: "short" | "long" = "short",
): string => {
  try {
    const part = new Intl.DateTimeFormat(locale, {
      timeZone,
      timeZoneName: style === "long" ? "long" : "shortOffset",
    })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value;
    if (part) return part;
  } catch {
    // `shortOffset` no existe en navegadores viejos.
  }
  return formatOffset(timeZoneOffset(date, timeZone));
};

/** "HH:mm" de un instante en otra zona. */
export const formatTimeInZone = (date: Date, timeZone: string): string => {
  const p = zonedParts(date, timeZone);
  return `${pad2(p.h)}:${pad2(p.mi)}`;
};

/** Formatea un instante en una zona con `Intl` (opciones libres). */
export const formatInTimeZone = (
  date: Date,
  timeZone: string,
  locale = "es-MX",
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string => new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
