import type { CnWeekday } from "../../utils/date-utils";
import {
  addDays,
  addMonths,
  isSameDay,
  pad2,
  parseIsoDate,
  startOfMonth,
  startOfWeek,
  toIsoDate,
} from "../../utils/date-utils";
import type {
  CnCalendarDateRange,
  CnCalendarEvent,
  CnCalendarHoliday,
  CnEventCalendarView,
  CnEventCategory,
  CnEventDateInput,
  CnEventOccurrence,
  CnEventRecurrence,
  CnEventTone,
} from "./CnEventCalendar.types";

export { addDays, addMonths, isSameDay, pad2, startOfMonth, startOfWeek, toIsoDate };

export const MINUTE = 60_000;
export const DAY_MS = 86_400_000;

// ─── Fechas ───────────────────────────────────────────────────────────

/** Convierte `Date` o ISO local (`YYYY-MM-DD`, `YYYY-MM-DDTHH:mm[:ss]`) a `Date`. */
export const toDate = (value: CnEventDateInput | null | undefined): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value);
  const local = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value);
  if (local) {
    const base = parseIsoDate(value.slice(0, 10));
    if (!base) return null;
    if (local[4]) base.setHours(Number(local[4]), Number(local[5]), Number(local[6] ?? 0), 0);
    return base;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * MINUTE);

/** Días de calendario entre dos fechas (ignora horas y cambios de horario). */
export const diffDays = (a: Date, b: Date): number =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS);

export const minutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();

export const formatTime = (date: Date): string =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

export const formatHour = (hour: number): string =>
  `${pad2(Math.floor(hour))}:${pad2(Math.round((hour % 1) * 60))}`;

const capitalize = (text: string): string => text.charAt(0).toLocaleUpperCase() + text.slice(1);

export const monthName = (date: Date, locale: string, style: "long" | "short" = "long") =>
  new Intl.DateTimeFormat(locale, { month: style }).format(date).replace(".", "");

export const weekdayName = (date: Date, locale: string, style: "long" | "short" = "short") =>
  new Intl.DateTimeFormat(locale, { weekday: style }).format(date).replace(".", "");

export const formatDayLong = (date: Date, locale: string): string =>
  capitalize(
    new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
  );

export const formatDayShort = (date: Date, locale: string): string =>
  `${capitalize(weekdayName(date, locale))} ${date.getDate()} ${monthName(date, locale, "short")}`;

/** Texto de horario de una ocurrencia ("Todo el día", "09:00 – 10:30", rangos de varios días). */
export const formatOccurrenceTime = (
  occ: Pick<CnEventOccurrence, "start" | "end" | "allDay">,
  locale: string,
): string => {
  const lastDay = occ.allDay ? addDays(occ.end, -1) : occ.end;
  const multiDay =
    !isSameDay(occ.start, lastDay) && !(occ.allDay && diffDays(occ.end, occ.start) <= 1);
  if (occ.allDay) {
    return multiDay
      ? `${formatDayShort(occ.start, locale)} – ${formatDayShort(lastDay, locale)} · Todo el día`
      : `${formatDayLong(occ.start, locale)} · Todo el día`;
  }
  if (multiDay) {
    return `${formatDayShort(occ.start, locale)} ${formatTime(occ.start)} – ${formatDayShort(occ.end, locale)} ${formatTime(occ.end)}`;
  }
  return `${formatDayLong(occ.start, locale)} · ${formatTime(occ.start)} – ${formatTime(occ.end)}`;
};

// ─── Rangos por vista ────────────────────────────────────────────────

export const startOfQuarter = (date: Date): Date =>
  new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);

/** Rango visible (fin exclusivo) de una vista. */
export const getVisibleRange = (
  view: CnEventCalendarView,
  date: Date,
  weekStart: CnWeekday = 1,
  agendaRange: "month" | number = "month",
): CnCalendarDateRange => {
  const day = startOfDay(date);
  switch (view) {
    case "month": {
      const first = startOfWeek(startOfMonth(day), weekStart);
      const nextMonth = addMonths(startOfMonth(day), 1);
      const weeks = Math.ceil(diffDays(nextMonth, first) / 7);
      return { start: first, end: addDays(first, weeks * 7) };
    }
    case "week": {
      const start = startOfWeek(day, weekStart);
      return { start, end: addDays(start, 7) };
    }
    case "day":
      return { start: day, end: addDays(day, 1) };
    case "agenda":
      return agendaRange === "month"
        ? { start: startOfMonth(day), end: addMonths(startOfMonth(day), 1) }
        : { start: day, end: addDays(day, Math.max(1, agendaRange)) };
    case "quarter": {
      const start = startOfQuarter(day);
      return { start, end: addMonths(start, 3) };
    }
    case "year": {
      const start = new Date(day.getFullYear(), 0, 1);
      return { start, end: new Date(day.getFullYear() + 1, 0, 1) };
    }
  }
};

/** Fecha tras avanzar/retroceder un periodo de la vista. */
export const shiftDate = (
  view: CnEventCalendarView,
  date: Date,
  direction: 1 | -1,
  agendaRange: "month" | number = "month",
): Date => {
  switch (view) {
    case "month":
      return addMonths(date, direction);
    case "week":
      return addDays(date, 7 * direction);
    case "day":
      return addDays(date, direction);
    case "agenda":
      return agendaRange === "month"
        ? addMonths(date, direction)
        : addDays(date, Math.max(1, agendaRange) * direction);
    case "quarter":
      return addMonths(date, 3 * direction);
    case "year":
      return addMonths(date, 12 * direction);
  }
};

/** Título de la barra para la vista y fecha. */
export const getViewTitle = (
  view: CnEventCalendarView,
  date: Date,
  locale = "es-MX",
  weekStart: CnWeekday = 1,
  agendaRange: "month" | number = "month",
): string => {
  const monthYear = (d: Date) => `${capitalize(monthName(d, locale))} ${d.getFullYear()}`;
  switch (view) {
    case "month":
      return monthYear(date);
    case "week":
    case "agenda": {
      if (view === "agenda" && agendaRange === "month") return monthYear(date);
      const range = getVisibleRange(view, date, weekStart, agendaRange);
      const last = addDays(range.end, -1);
      if (isSameDay(range.start, last)) return formatDayLong(last, locale);
      if (range.start.getMonth() === last.getMonth()) {
        return `${range.start.getDate()} – ${last.getDate()} ${monthName(last, locale, "short")} ${last.getFullYear()}`;
      }
      const sameYear = range.start.getFullYear() === last.getFullYear();
      return `${range.start.getDate()} ${monthName(range.start, locale, "short")}${sameYear ? "" : ` ${range.start.getFullYear()}`} – ${last.getDate()} ${monthName(last, locale, "short")} ${last.getFullYear()}`;
    }
    case "day":
      return formatDayLong(date, locale);
    case "quarter": {
      const start = startOfQuarter(date);
      const q = Math.floor(start.getMonth() / 3) + 1;
      return `T${q} ${start.getFullYear()} · ${capitalize(monthName(start, locale, "short"))} – ${capitalize(monthName(addMonths(start, 2), locale, "short"))}`;
    }
    case "year":
      return String(date.getFullYear());
  }
};

export const VIEW_LABELS: Record<CnEventCalendarView, string> = {
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  quarter: "Trimestre",
  year: "Año",
};

// ─── Colores ──────────────────────────────────────────────────────────

export const TONE_COLORS: Record<CnEventTone, string> = {
  primary: "#3562a6",
  accent: "#3d5afe",
  success: "#2e9e4f",
  warning: "#e0a020",
  error: "#d63c3c",
  info: "#2c7bc8",
  neutral: "#6e7682",
  purple: "#8e44ad",
  pink: "#d63384",
  teal: "#0f9b8e",
  orange: "#e8710a",
};

export const resolveColor = (color: string | undefined, fallback = TONE_COLORS.primary): string =>
  color ? (TONE_COLORS[color as CnEventTone] ?? color) : fallback;

/** Color con transparencia (hex → rgba; otros → color-mix). */
export const alpha = (color: string, opacity: number): string => {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
  }
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
};

export const eventColor = (event: CnCalendarEvent, categories?: Map<string, CnEventCategory>) =>
  resolveColor(
    event.color ?? (event.category ? categories?.get(event.category)?.color : undefined),
  );

// ─── Ocurrencias y recurrencia ──────────────────────────────────────

const DEFAULT_DURATION_MIN = 60;

/** Inicio/fin normalizados (fin exclusivo). */
export const normalizeSpan = (
  event: CnCalendarEvent,
): { start: Date; end: Date; allDay: boolean } | null => {
  const start = toDate(event.start);
  if (!start) return null;
  const rawEnd = toDate(event.end);
  const allDay = Boolean(event.allDay);
  if (allDay) {
    const first = startOfDay(start);
    const last = rawEnd && rawEnd >= first ? startOfDay(rawEnd) : first;
    return { start: first, end: addDays(last, 1), allDay };
  }
  const end =
    rawEnd && rawEnd > start ? rawEnd : addMinutes(start, rawEnd ? 15 : DEFAULT_DURATION_MIN);
  return { start, end, allDay };
};

const MAX_ITERATIONS = 5000;

/** Fechas de inicio de una regla de repetición que caen antes de `rangeEnd`. */
export const recurrenceStarts = (first: Date, rule: CnEventRecurrence, rangeEnd: Date): Date[] => {
  const interval = Math.max(1, Math.floor(rule.interval ?? 1));
  const until = toDate(rule.until);
  const untilEnd = until ? addDays(startOfDay(until), 1) : null;
  const excluded = new Set(
    (rule.exdates ?? [])
      .map((d) => toDate(d))
      .filter(Boolean)
      .map((d) => toIsoDate(d as Date)),
  );
  const limit = rule.count ?? Infinity;
  const result: Date[] = [];
  let produced = 0;
  const h = first.getHours();
  const m = first.getMinutes();
  const s = first.getSeconds();
  const at = (y: number, mo: number, d: number) => new Date(y, mo, d, h, m, s);

  const accept = (date: Date): boolean => {
    // Devuelve `false` para detener la iteración.
    if (date < first) return true;
    if (untilEnd && date >= untilEnd) return false;
    if (date >= rangeEnd) return false;
    if (produced >= limit) return false;
    produced += 1;
    if (!excluded.has(toIsoDate(date))) result.push(date);
    return true;
  };

  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    if (rule.freq === "daily") {
      if (!accept(at(first.getFullYear(), first.getMonth(), first.getDate() + i * interval))) break;
    } else if (rule.freq === "weekly") {
      const days = rule.byWeekday?.length
        ? [...rule.byWeekday].sort()
        : [first.getDay() as CnWeekday];
      // Semana (domingo) de referencia del ciclo.
      const weekBase = addDays(first, -first.getDay() + i * 7 * interval);
      let stop = false;
      for (const wd of days) {
        const d = addDays(weekBase, wd);
        if (!accept(at(d.getFullYear(), d.getMonth(), d.getDate()))) {
          stop = true;
          break;
        }
      }
      if (stop) break;
    } else if (rule.freq === "monthly") {
      const target = at(first.getFullYear(), first.getMonth() + i * interval, first.getDate());
      // Meses sin ese día (31, 30, 29 feb) se omiten.
      if (target.getDate() !== first.getDate()) continue;
      if (!accept(target)) break;
    } else {
      const target = at(first.getFullYear() + i * interval, first.getMonth(), first.getDate());
      if (target.getMonth() !== first.getMonth()) continue;
      if (!accept(target)) break;
    }
  }
  return result;
};

/** Ocurrencias de un evento que se cruzan con el rango (fin exclusivo). */
export const expandEvent = <TMeta>(
  event: CnCalendarEvent<TMeta>,
  range: CnCalendarDateRange,
  color: string = resolveColor(event.color),
): CnEventOccurrence<TMeta>[] => {
  const span = normalizeSpan(event as CnCalendarEvent);
  if (!span) return [];
  const duration = span.end.getTime() - span.start.getTime();
  const overlaps = (s: Date, e: Date) => s < range.end && e > range.start;
  if (!event.recurrence) {
    return overlaps(span.start, span.end)
      ? [
          {
            key: event.id,
            event,
            start: span.start,
            end: span.end,
            allDay: span.allDay,
            color,
            recurring: false,
          },
        ]
      : [];
  }
  return recurrenceStarts(span.start, event.recurrence, range.end)
    .map((start) => {
      const end = span.allDay
        ? addDays(start, diffDays(span.end, span.start))
        : new Date(start.getTime() + duration);
      return { start, end };
    })
    .filter(({ start, end }) => overlaps(start, end))
    .map(({ start, end }) => ({
      key: `${event.id}::${toIsoDate(start)}T${formatTime(start)}`,
      event,
      start,
      end,
      allDay: span.allDay,
      color,
      recurring: true,
    }));
};

export const compareOccurrences = (a: CnEventOccurrence, b: CnEventOccurrence): number =>
  Number(b.allDay) - Number(a.allDay) ||
  a.start.getTime() - b.start.getTime() ||
  b.end.getTime() - b.start.getTime() - (a.end.getTime() - a.start.getTime()) ||
  a.event.title.localeCompare(b.event.title);

/** Todas las ocurrencias del rango, ordenadas. */
export const getOccurrences = <TMeta>(
  events: CnCalendarEvent<TMeta>[],
  range: CnCalendarDateRange,
  categories?: CnEventCategory[],
): CnEventOccurrence<TMeta>[] => {
  const map = new Map((categories ?? []).map((c) => [c.id, c]));
  return events
    .flatMap((event) => expandEvent(event, range, eventColor(event as CnCalendarEvent, map)))
    .sort(
      compareOccurrences as (a: CnEventOccurrence<TMeta>, b: CnEventOccurrence<TMeta>) => number,
    );
};

/** ¿La ocurrencia toca ese día? */
export const occursOnDay = (occ: Pick<CnEventOccurrence, "start" | "end">, day: Date): boolean => {
  const start = startOfDay(day);
  return occ.start < addDays(start, 1) && occ.end > start;
};

// ─── Búsqueda y filtros ─────────────────────────────────────────────

export const normalizeText = (text: string): string =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase();

export const matchesSearch = (
  event: CnCalendarEvent,
  query: string,
  categories?: Map<string, CnEventCategory>,
): boolean => {
  const q = normalizeText(query.trim());
  if (!q) return true;
  const haystack = [
    event.title,
    event.description,
    event.location,
    event.category ? (categories?.get(event.category)?.label ?? event.category) : undefined,
    ...(event.attendees ?? []).map((a) => a.name),
  ]
    .filter(Boolean)
    .join(" ");
  return normalizeText(haystack).includes(q);
};

export const filterEvents = <TMeta>(
  events: CnCalendarEvent<TMeta>[],
  options: { search?: string; hiddenCategories?: string[]; categories?: CnEventCategory[] },
): CnCalendarEvent<TMeta>[] => {
  const hidden = new Set(options.hiddenCategories ?? []);
  const map = new Map((options.categories ?? []).map((c) => [c.id, c]));
  return events.filter(
    (event) =>
      !(event.category && hidden.has(event.category)) &&
      matchesSearch(event as CnCalendarEvent, options.search ?? "", map),
  );
};

// ─── Festivos y límites ──────────────────────────────────────────────

export const holidayMap = (holidays: CnCalendarHoliday[] = []): Map<string, CnCalendarHoliday> => {
  const map = new Map<string, CnCalendarHoliday>();
  for (const h of holidays) {
    const d = toDate(h.date);
    if (d) map.set(toIsoDate(d), h);
  }
  return map;
};

export const isOutOfBounds = (day: Date, min: Date | null, max: Date | null): boolean =>
  Boolean((min && startOfDay(day) < startOfDay(min)) || (max && startOfDay(day) > startOfDay(max)));

/** Días visibles de la vista semanal/diaria. */
export const getTimeGridDays = (
  view: "week" | "day",
  date: Date,
  weekStart: CnWeekday,
  showWeekends = true,
): Date[] => {
  if (view === "day") return [startOfDay(date)];
  const start = startOfWeek(startOfDay(date), weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i)).filter(
    (d) => showWeekends || (d.getDay() !== 0 && d.getDay() !== 6),
  );
};
