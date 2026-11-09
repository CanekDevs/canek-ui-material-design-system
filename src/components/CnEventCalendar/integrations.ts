import { addDays, normalizeSpan, pad2, toIsoDate } from "./calendar-utils";
import type { CnCalendarEvent, CnEventOccurrence } from "./CnEventCalendar.types";
import { buildRrule } from "./ics";

/*
 * Integraciones sin dependencias: enlaces "Agregar a…" para Google Calendar,
 * Outlook.com, Office 365 y Yahoo; detección de videollamadas (Meet, Zoom,
 * Teams, Webex) y enlace a Google Maps.
 */

/** Datos mínimos para construir un enlace (instantes reales; fin exclusivo). */
export type CnCalendarLinkInput = {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  description?: string;
  location?: string;
  /** RRULE sin el prefijo (`FREQ=WEEKLY;BYDAY=MO`), solo Google la respeta. */
  rrule?: string;
};

export type CnCalendarProvider = "google" | "outlook" | "office365" | "yahoo";

/** Normaliza un evento u ocurrencia a la entrada de los constructores. */
export const toLinkInput = (
  source: CnCalendarEvent | CnEventOccurrence,
): CnCalendarLinkInput | null => {
  if ("event" in source) {
    const { event } = source;
    return {
      title: event.title,
      start: source.start,
      end: source.end,
      allDay: source.allDay,
      description: event.description,
      location: event.location,
    };
  }
  const span = normalizeSpan(source);
  if (!span) return null;
  const rrule = buildRrule(source, span.allDay);
  return {
    title: source.title,
    ...span,
    description: source.description,
    location: source.location,
    rrule: rrule ? rrule.replace(/^RRULE:/, "") : undefined,
  };
};

const compact = (d: Date) => toIsoDate(d).replace(/-/g, "");
const utcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
const isoUtc = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

const query = (params: Record<string, string | undefined>) =>
  Object.entries(params)
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

/** Enlace "Agregar a Google Calendar". */
export const googleCalendarUrl = (input: CnCalendarLinkInput): string => {
  const dates = input.allDay
    ? `${compact(input.start)}/${compact(input.end)}`
    : `${utcStamp(input.start)}/${utcStamp(input.end)}`;
  return `https://calendar.google.com/calendar/render?${query({
    action: "TEMPLATE",
    text: input.title,
    dates,
    details: input.description,
    location: input.location,
    recur: input.rrule ? `RRULE:${input.rrule}` : undefined,
  })}`;
};

const outlookLike = (base: string, input: CnCalendarLinkInput) =>
  `${base}?${query({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: input.title,
    startdt: input.allDay ? toIsoDate(input.start) : isoUtc(input.start),
    enddt: input.allDay ? toIsoDate(input.end) : isoUtc(input.end),
    allday: input.allDay ? "true" : "false",
    body: input.description,
    location: input.location,
  })}`;

/** Enlace "Agregar a Outlook.com" (cuentas personales). */
export const outlookCalendarUrl = (input: CnCalendarLinkInput): string =>
  outlookLike("https://outlook.live.com/calendar/0/action/compose", input);

/** Enlace "Agregar a Office 365" (cuentas de trabajo o escuela). */
export const office365CalendarUrl = (input: CnCalendarLinkInput): string =>
  outlookLike("https://outlook.office.com/calendar/0/action/compose", input);

/** Enlace "Agregar a Yahoo Calendar". */
export const yahooCalendarUrl = (input: CnCalendarLinkInput): string => {
  const params: Record<string, string | undefined> = {
    v: "60",
    title: input.title,
    desc: input.description,
    in_loc: input.location,
  };
  if (input.allDay) {
    params.st = compact(input.start);
    params.et = compact(addDays(input.end, -1));
    params.dur = "allday";
  } else {
    params.st = utcStamp(input.start);
    params.et = utcStamp(input.end);
  }
  return `https://calendar.yahoo.com/?${query(params)}`;
};

export const CALENDAR_PROVIDERS: { id: CnCalendarProvider; label: string }[] = [
  { id: "google", label: "Google Calendar" },
  { id: "outlook", label: "Outlook.com" },
  { id: "office365", label: "Office 365" },
  { id: "yahoo", label: "Yahoo Calendar" },
];

/** Enlace del proveedor indicado. */
export const calendarProviderUrl = (
  provider: CnCalendarProvider,
  input: CnCalendarLinkInput,
): string => {
  switch (provider) {
    case "google":
      return googleCalendarUrl(input);
    case "outlook":
      return outlookCalendarUrl(input);
    case "office365":
      return office365CalendarUrl(input);
    case "yahoo":
      return yahooCalendarUrl(input);
  }
};

// ─── Videollamadas ────────────────────────────────────────────────────

export type CnMeetingProvider = "meet" | "zoom" | "teams" | "webex" | "other";

export type CnMeetingLink = { provider: CnMeetingProvider; label: string; url: string };

const MEETING_PATTERNS: { provider: CnMeetingProvider; label: string; re: RegExp }[] = [
  {
    provider: "meet",
    label: "Google Meet",
    re: /https?:\/\/meet\.google\.com\/[a-z0-9-]+(?:\?[^\s<>"')]*)?/i,
  },
  {
    provider: "zoom",
    label: "Zoom",
    re: /https?:\/\/(?:[\w-]+\.)*zoom\.us\/(?:j|my|w|s)\/[^\s<>"')]+/i,
  },
  {
    provider: "teams",
    label: "Microsoft Teams",
    re: /https?:\/\/teams\.(?:microsoft|live)\.com\/(?:l\/meetup-join|meet)\/[^\s<>"')]+/i,
  },
  {
    provider: "webex",
    label: "Webex",
    re: /https?:\/\/(?:[\w-]+\.)*webex\.com\/[^\s<>"')]+/i,
  },
];

/** Detecta un enlace de videollamada en `meetingUrl`, lugar o descripción. */
export const detectMeetingLink = (
  event: Pick<CnCalendarEvent, "meetingUrl" | "location" | "description">,
): CnMeetingLink | null => {
  const texts = [event.meetingUrl, event.location, event.description].filter(Boolean) as string[];
  for (const text of texts) {
    for (const { provider, label, re } of MEETING_PATTERNS) {
      const match = re.exec(text);
      if (match) return { provider, label, url: match[0].replace(/[.,;]+$/, "") };
    }
  }
  if (event.meetingUrl && /^https?:\/\//i.test(event.meetingUrl)) {
    return { provider: "other", label: "Videollamada", url: event.meetingUrl };
  }
  return null;
};

const VIRTUAL_WORDS =
  /^(?:google meet|meet|zoom|teams|microsoft teams|webex|virtual|en l[ií]nea|online|remoto|videollamada|llamada)$/i;

/** ¿El lugar parece una dirección física (para "Ver en mapa")? */
export const isPhysicalLocation = (location: string | undefined): location is string =>
  Boolean(
    location &&
    location.trim() &&
    !/https?:\/\//i.test(location) &&
    !VIRTUAL_WORDS.test(location.trim()),
  );

/** Búsqueda del lugar en Google Maps. */
export const mapSearchUrl = (location: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
