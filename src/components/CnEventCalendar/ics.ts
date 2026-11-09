import { downloadText } from "../CnDataTable/export";
import { addDays, normalizeSpan, normalizeText, pad2, toDate, toIsoDate } from "./calendar-utils";
import type {
  CnCalendarEvent,
  CnEventAttendee,
  CnEventCategory,
  CnEventRecurrence,
  CnEventStatus,
  CnWeekday,
} from "./CnEventCalendar.types";
import { fromZonedWallTime, isValidTimeZone } from "./timezone";

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

/** Línea `RRULE:` de la repetición del evento (o `null`). */
export const buildRrule = (event: CnCalendarEvent, allDay: boolean): string | null => {
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
  if (rule.freq === "monthly" || rule.freq === "yearly") {
    const hasBy = Boolean(rule.byNthWeekday?.length || rule.byMonthDay?.length);
    const first = toDate(event.start);
    if (hasBy && rule.freq === "yearly" && first) parts.push(`BYMONTH=${first.getMonth() + 1}`);
    if (rule.byNthWeekday?.length) {
      parts.push(
        `BYDAY=${rule.byNthWeekday.map((n) => `${n.nth || ""}${WEEKDAYS[n.weekday]}`).join(",")}`,
      );
    }
    if (rule.byMonthDay?.length) parts.push(`BYMONTHDAY=${rule.byMonthDay.join(",")}`);
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
    if (event.url) lines.push(`URL:${event.url}`);
    if (event.meetingUrl) lines.push(`X-CN-MEETING-URL:${event.meetingUrl}`);
    for (const minutes of event.reminders ?? []) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeIcsText(event.title)}`,
        `TRIGGER:${formatIcsDuration(-minutes)}`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
};

/** Nombre de archivo seguro a partir de un título. */
export const slugify = (text: string): string =>
  normalizeText(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "evento";

/** Duración RFC 5545 (`-PT15M`, `-P1D`, `PT1H30M`) a partir de minutos. */
export const formatIcsDuration = (minutes: number): string => {
  const sign = minutes < 0 ? "-" : "";
  let rest = Math.abs(Math.round(minutes));
  if (rest === 0) return "PT0M";
  if (rest % 1440 === 0) return `${sign}P${rest / 1440}D`;
  const days = Math.floor(rest / 1440);
  rest -= days * 1440;
  const h = Math.floor(rest / 60);
  const m = rest % 60;
  return `${sign}P${days ? `${days}D` : ""}T${h ? `${h}H` : ""}${m ? `${m}M` : ""}`;
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

/** Descarga un solo evento como `.ics`. */
export const downloadEventIcs = (event: CnCalendarEvent, options: CnIcsOptions = {}): void =>
  downloadIcs([event], slugify(event.title), options);

// ─── Importación ──────────────────────────────────────────────────────

export type CnIcsParseOptions = {
  /** Categorías para relacionar `CATEGORIES` por etiqueta o id. */
  categories?: CnEventCategory[];
  /** Dominio que se quita de los UID (por defecto `canek.mx`, el de la exportación). */
  uidDomain?: string;
};

/** Revierte el escape de texto RFC 5545. */
export const unescapeIcsText = (text: string): string =>
  text.replace(/\\([\\;,nN])/g, (_, c: string) => (c === "n" || c === "N" ? "\n" : c));

/** Minutos de una duración RFC 5545 (`-PT15M` → -15). `null` si no es válida. */
export const parseIcsDuration = (value: string): number | null => {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    value.trim(),
  );
  if (!m || value.trim() === "P" || value.trim().endsWith("T")) return null;
  const [, sign, w, d, h, min, sec] = m;
  const total =
    Number(w ?? 0) * 10080 +
    Number(d ?? 0) * 1440 +
    Number(h ?? 0) * 60 +
    Number(min ?? 0) +
    Math.round(Number(sec ?? 0) / 60);
  return sign === "-" ? -total : total;
};

type IcsProp = { name: string; params: Record<string, string>; value: string };

const parseLine = (line: string): IcsProp | null => {
  let inQuotes = false;
  let colon = -1;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ":" && !inQuotes) {
      colon = i;
      break;
    }
  }
  if (colon < 0) return null;
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const segments = head.match(/(?:[^;"]|"[^"]*")+/g) ?? [head];
  const params: Record<string, string> = {};
  for (const seg of segments.slice(1)) {
    const eq = seg.indexOf("=");
    if (eq > 0) params[seg.slice(0, eq).toUpperCase()] = seg.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return { name: segments[0].toUpperCase(), params, value };
};

type IcsDate = { date: Date; allDay: boolean };

const parseIcsDate = (value: string, params: Record<string, string>): IcsDate | null => {
  const v = value.trim();
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
  if (dateOnly || params.VALUE === "DATE") {
    const m = dateOnly ?? /^(\d{4})(\d{2})(\d{2})/.exec(v);
    if (!m) return null;
    return { date: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])), allDay: true };
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(v);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = [m[1], m[2], m[3], m[4], m[5], m[6] ?? "0"].map(Number);
  if (m[7]) return { date: new Date(Date.UTC(y, mo - 1, d, h, mi, s)), allDay: false };
  const wall = new Date(y, mo - 1, d, h, mi, s);
  const tz = params.TZID?.replace(/^\//, "");
  return { date: isValidTimeZone(tz) ? fromZonedWallTime(wall, tz) : wall, allDay: false };
};

const localIso = (date: Date, allDay: boolean): string => {
  const day = toIsoDate(date);
  if (allDay) return day;
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  return `${day}T${time}${date.getSeconds() ? `:${pad2(date.getSeconds())}` : ""}`;
};

const WEEKDAY_INDEX: Record<string, CnWeekday> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

const STATUS_FROM_ICS: Record<string, CnEventStatus> = {
  CONFIRMED: "confirmed",
  TENTATIVE: "tentative",
  CANCELLED: "cancelled",
};

/** RRULE (sin prefijo) → repetición. Subconjunto: FREQ, INTERVAL, COUNT, UNTIL, BYDAY, BYMONTHDAY. */
export const parseRrule = (value: string): CnEventRecurrence | null => {
  const parts = Object.fromEntries(
    value
      .replace(/^RRULE:/i, "")
      .split(";")
      .map((p) => p.split("="))
      .filter((p) => p.length === 2)
      .map(([k, v]) => [k.toUpperCase(), v]),
  );
  const freq = (parts.FREQ ?? "").toLowerCase();
  if (!["daily", "weekly", "monthly", "yearly"].includes(freq)) return null;
  const rule: CnEventRecurrence = { freq: freq as CnEventRecurrence["freq"] };
  if (parts.INTERVAL && Number(parts.INTERVAL) > 1) rule.interval = Number(parts.INTERVAL);
  if (parts.COUNT) rule.count = Number(parts.COUNT);
  if (parts.UNTIL) {
    const until = parseIcsDate(parts.UNTIL, {});
    if (until) rule.until = toIsoDate(until.date);
  }
  if (parts.BYDAY) {
    const days = parts.BYDAY.split(",")
      .map((t: string) => /^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/i.exec(t.trim()))
      .filter(Boolean) as RegExpExecArray[];
    if (rule.freq === "weekly" || rule.freq === "daily") {
      if (rule.freq === "weekly")
        rule.byWeekday = days.map((m) => WEEKDAY_INDEX[m[2].toUpperCase()]);
    } else {
      rule.byNthWeekday = days.map((m) => ({
        weekday: WEEKDAY_INDEX[m[2].toUpperCase()],
        nth: m[1] ? Number(m[1]) : 0,
      }));
    }
  }
  if (parts.BYMONTHDAY && rule.freq !== "weekly" && rule.freq !== "daily") {
    rule.byMonthDay = parts.BYMONTHDAY.split(",").map(Number).filter(Boolean);
  }
  return rule;
};

/**
 * Lee VEVENTs de un `.ics` (RFC 5545, mejor esfuerzo): DTSTART/DTEND con
 * `VALUE=DATE`, UTC o `TZID`, DURATION, SUMMARY, DESCRIPTION, LOCATION, URL,
 * STATUS, CATEGORIES, ATTENDEE, RRULE (subconjunto), EXDATE, VALARM y
 * RECURRENCE-ID (las excepciones quedan como eventos sueltos y la serie las
 * excluye). Las horas se devuelven como ISO local del navegador.
 */
export const parseIcs = (text: string, options: CnIcsParseOptions = {}): CnCalendarEvent[] => {
  const { categories = [], uidDomain = "canek.mx" } = options;
  const lines = text
    .replace(/\r\n[ \t]/g, "")
    .replace(/\n[ \t]/g, "")
    .split(/\r?\n/);
  const events: CnCalendarEvent[] = [];
  const overrides: { uid: string; recurrenceId: string }[] = [];
  let current: IcsProp[] | null = null;
  let alarms: IcsProp[][] = [];
  let alarm: IcsProp[] | null = null;
  let depth = 0;

  const categoryFor = (raw: string): string => {
    const first = unescapeIcsText(raw.split(/(?<!\\),/)[0] ?? "").trim();
    const key = normalizeText(first);
    return (
      categories.find((c) => normalizeText(c.label) === key || normalizeText(c.id) === key)?.id ??
      first
    );
  };

  const finish = (props: IcsProp[], valarms: IcsProp[][], index: number) => {
    const get = (name: string) => props.find((p) => p.name === name);
    const startProp = get("DTSTART");
    const start = startProp ? parseIcsDate(startProp.value, startProp.params) : null;
    if (!start) return;
    const endProp = get("DTEND");
    let end = endProp ? parseIcsDate(endProp.value, endProp.params) : null;
    const duration = get("DURATION") ? parseIcsDuration(get("DURATION")!.value) : null;
    if (!end && duration !== null) {
      end = { date: new Date(start.date.getTime() + duration * 60_000), allDay: start.allDay };
    }
    let uid = get("UID")?.value.trim() || `ics-${index + 1}`;
    if (uidDomain && uid.endsWith(`@${uidDomain}`)) uid = uid.slice(0, -uidDomain.length - 1);
    uid = unescapeIcsText(uid);

    const event: CnCalendarEvent = {
      id: uid,
      title: unescapeIcsText(get("SUMMARY")?.value ?? "") || "(Sin título)",
      start: localIso(start.date, start.allDay),
    };
    if (start.allDay) {
      event.allDay = true;
      // DTEND de todo el día es exclusivo: se guarda el último día (inclusive).
      if (end && end.date > addDays(start.date, 1)) {
        event.end = localIso(addDays(end.date, -1), true);
      }
    } else if (end) {
      event.end = localIso(end.date, false);
    }
    const description = get("DESCRIPTION");
    if (description) event.description = unescapeIcsText(description.value);
    const location = get("LOCATION");
    if (location?.value) event.location = unescapeIcsText(location.value);
    const url = get("URL");
    if (url?.value) event.url = url.value.trim();
    const meeting =
      get("X-CN-MEETING-URL") ??
      get("X-GOOGLE-CONFERENCE") ??
      get("X-MICROSOFT-SKYPETEAMSMEETINGURL");
    if (meeting?.value) event.meetingUrl = meeting.value.trim();
    const status = STATUS_FROM_ICS[get("STATUS")?.value.trim().toUpperCase() ?? ""];
    if (status) event.status = status;
    const category = get("CATEGORIES");
    if (category?.value) event.category = categoryFor(category.value);

    const attendees: CnEventAttendee[] = props
      .filter((p) => p.name === "ATTENDEE")
      .map((p) => {
        const email = p.value.replace(/^mailto:/i, "").trim();
        const partstat = p.params.PARTSTAT?.toUpperCase();
        return {
          name: p.params.CN || email,
          ...(email && { email }),
          ...(partstat === "ACCEPTED" && { status: "accepted" as const }),
          ...(partstat === "DECLINED" && { status: "declined" as const }),
          ...(partstat === "NEEDS-ACTION" && { status: "pending" as const }),
        };
      });
    if (attendees.length) event.attendees = attendees;

    const rrule = get("RRULE");
    const recurrence = rrule ? parseRrule(rrule.value) : null;
    if (recurrence) {
      const exdates = props
        .filter((p) => p.name === "EXDATE")
        .flatMap((p) => p.value.split(",").map((v) => parseIcsDate(v, p.params)))
        .filter((x): x is IcsDate => Boolean(x))
        .map((x) => toIsoDate(x.date));
      if (exdates.length) recurrence.exdates = exdates;
      event.recurrence = recurrence;
    }

    const reminders = valarms
      .map((a) => a.find((p) => p.name === "TRIGGER"))
      .filter((t): t is IcsProp => Boolean(t) && t?.params.VALUE !== "DATE-TIME")
      .map((t) => parseIcsDuration(t.value))
      .filter((m): m is number => m !== null && m <= 0)
      .map((m) => -m);
    if (reminders.length) event.reminders = reminders;

    const recurrenceId = get("RECURRENCE-ID");
    if (recurrenceId) {
      const rid = parseIcsDate(recurrenceId.value, recurrenceId.params);
      if (rid) {
        const iso = toIsoDate(rid.date);
        overrides.push({ uid, recurrenceId: iso });
        event.id = `${uid}::${iso}`;
      }
    }
    events.push(event);
  };

  let index = 0;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    const upper = line.toUpperCase();
    if (upper === "BEGIN:VEVENT") {
      current = [];
      alarms = [];
      depth = 0;
      continue;
    }
    if (!current) continue;
    if (upper === "END:VEVENT") {
      finish(current, alarms, index);
      index += 1;
      current = null;
      continue;
    }
    if (upper === "BEGIN:VALARM") {
      alarm = [];
      continue;
    }
    if (upper === "END:VALARM") {
      if (alarm) alarms.push(alarm);
      alarm = null;
      continue;
    }
    if (upper.startsWith("BEGIN:")) {
      depth += 1;
      continue;
    }
    if (upper.startsWith("END:")) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 0) continue;
    const prop = parseLine(line);
    if (!prop) continue;
    if (alarm) alarm.push(prop);
    else current.push(prop);
  }

  // Las excepciones (RECURRENCE-ID) se quitan de su serie.
  for (const { uid, recurrenceId } of overrides) {
    const master = events.find((e) => e.id === uid && e.recurrence);
    if (master?.recurrence) {
      master.recurrence.exdates = [...(master.recurrence.exdates ?? []), recurrenceId];
    }
  }
  return events;
};

/** Lee un archivo `.ics` (File/Blob). */
export const readIcsFile = async (
  file: Blob,
  options: CnIcsParseOptions = {},
): Promise<CnCalendarEvent[]> => {
  const text =
    typeof file.text === "function"
      ? await file.text()
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result ?? ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });
  return parseIcs(text, options);
};
