import { downloadText } from "../CnDataTable/export";
import { normalizeSpan, pad2, toDate } from "./calendar-utils";
import type { CnCalendarEvent, CnEventCategory, CnEventStatus } from "./CnEventCalendar.types";

/*
 * Constructor mínimo de iCalendar (RFC 5545): VCALENDAR con un VEVENT por
 * evento. Los eventos recurrentes se exportan con su RRULE (no expandidos).
 * Las horas van como hora local "flotante" (sin zona), igual que en la UI.
 */

export type CnIcsOptions = {
  calendarName?: string;
  prodId?: string;
  categories?: CnEventCategory[];
  /** Dominio para los UID (`id@dominio`). */
  uidDomain?: string;
  /** Marca de tiempo DTSTAMP (por defecto ahora). */
  now?: Date;
};

/** Escapa texto según RFC 5545 (\\ ; , y saltos de línea). */
export const escapeIcsText = (text: string): string =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Pliega líneas a 75 octetos (continuación con un espacio). */
export const foldIcsLine = (line: string): string => {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const max = parts.length === 0 ? 75 : 74;
    if (bytes + size > max) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
};

const icsDate = (d: Date) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
const icsDateTime = (d: Date) =>
  `${icsDate(d)}T${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
const icsUtc = (d: Date) =>
  `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;

const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const STATUS: Partial<Record<CnEventStatus, string>> = {
  confirmed: "CONFIRMED",
  tentative: "TENTATIVE",
  cancelled: "CANCELLED",
};

const buildRrule = (event: CnCalendarEvent, allDay: boolean): string | null => {
  const rule = event.recurrence;
  if (!rule) return null;
  const parts = [`FREQ=${rule.freq.toUpperCase()}`];
  if (rule.interval && rule.interval > 1) parts.push(`INTERVAL=${Math.floor(rule.interval)}`);
  if (rule.freq === "weekly" && rule.byWeekday?.length) {
    parts.push(
      `BYDAY=${[...rule.byWeekday]
        .sort()
        .map((d) => WEEKDAYS[d])
        .join(",")}`,
    );
  }
  if (rule.count) parts.push(`COUNT=${rule.count}`);
  else {
    const until = toDate(rule.until);
    if (until) {
      parts.push(
        `UNTIL=${allDay ? icsDate(until) : icsDateTime(new Date(until.getFullYear(), until.getMonth(), until.getDate(), 23, 59, 59))}`,
      );
    }
  }
  return `RRULE:${parts.join(";")}`;
};

/** Genera el texto `.ics` de los eventos. */
export const buildIcs = (events: CnCalendarEvent[], options: CnIcsOptions = {}): string => {
  const {
    calendarName,
    prodId = "-//Canek//CnEventCalendar//ES",
    categories = [],
    uidDomain = "canek.mx",
    now = new Date(),
  } = options;
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${prodId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  if (calendarName) lines.push(`X-WR-CALNAME:${escapeIcsText(calendarName)}`);

  for (const event of events) {
    const span = normalizeSpan(event);
    if (!span) continue;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeIcsText(event.id)}@${uidDomain}`);
    lines.push(`DTSTAMP:${icsUtc(now)}`);
    if (span.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(span.start)}`);
      lines.push(`DTEND;VALUE=DATE:${icsDate(span.end)}`);
    } else {
      lines.push(`DTSTART:${icsDateTime(span.start)}`);
      lines.push(`DTEND:${icsDateTime(span.end)}`);
    }
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    if (event.category) {
      lines.push(
        `CATEGORIES:${escapeIcsText(categoryMap.get(event.category)?.label ?? event.category)}`,
      );
    }
    const status = event.status ? STATUS[event.status] : undefined;
    if (status) lines.push(`STATUS:${status}`);
    const rrule = buildRrule(event, span.allDay);
    if (rrule) lines.push(rrule);
    for (const ex of event.recurrence?.exdates ?? []) {
      const d = toDate(ex);
      if (!d) continue;
      lines.push(
        span.allDay
          ? `EXDATE;VALUE=DATE:${icsDate(d)}`
          : `EXDATE:${icsDateTime(new Date(d.getFullYear(), d.getMonth(), d.getDate(), span.start.getHours(), span.start.getMinutes()))}`,
      );
    }
    for (const attendee of event.attendees ?? []) {
      if (!attendee.email) continue;
      const cn = attendee.name.replace(/["\\]/g, "");
      lines.push(`ATTENDEE;CN="${cn}":mailto:${attendee.email}`);
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
};

/** Descarga el `.ics`. */
export const downloadIcs = (
  events: CnCalendarEvent[],
  filename = "calendario",
  options: CnIcsOptions = {},
): void => {
  const name = /\.ics$/i.test(filename) ? filename : `${filename}.ics`;
  downloadText(buildIcs(events, options), name, "text/calendar;charset=utf-8");
};
