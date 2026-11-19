import type { ReactNode } from "react";
import { parseIsoDate } from "../../utils/date-utils";
import type { CnTone } from "../../utils/tones";

export type CnPersonEventType =
  "birthday" | "anniversary" | "new-hire" | "leave" | "vacation" | "promotion" | "custom";

export type CnPersonEvent = {
  type: CnPersonEventType;
  /**
   * Fecha del evento. Cumpleaños y aniversarios: fecha original (nacimiento,
   * ingreso); se calcula la ocurrencia más cercana. Ausencias: inicio.
   * Acepta `Date` o ISO `YYYY-MM-DD` (fecha local, sin desfase de zona).
   */
  date?: Date | string;
  /** Fin del periodo (ausencias, vacaciones). */
  endDate?: Date | string;
  /** Años cumplidos (aniversario); por defecto se calculan. */
  years?: number;
  /** Etiqueta del evento (por defecto según el tipo: "Cumpleaños", "Nuevo ingreso"…). */
  label?: ReactNode;
  /** Texto de detalle propio (sustituye la fecha calculada). */
  description?: ReactNode;
  icon?: string | ReactNode;
  tone?: CnTone;
  /** Muestra la cuenta regresiva ("Hoy", "En 3 días"). Por defecto `true`. */
  countdown?: boolean;
  /** Muestra la edad en cumpleaños (solo si el año de `date` es real). */
  showAge?: boolean;
};

export const EVENT_DEFAULTS: Record<
  CnPersonEventType,
  { label: string; icon: string; tone: CnTone }
> = {
  birthday: { label: "Cumpleaños", icon: "cake", tone: "warning" },
  anniversary: { label: "Aniversario", icon: "workspace_premium", tone: "accent" },
  "new-hire": { label: "Nuevo ingreso", icon: "waving_hand", tone: "info" },
  leave: { label: "Ausencia", icon: "event_busy", tone: "neutral" },
  vacation: { label: "Vacaciones", icon: "beach_access", tone: "success" },
  promotion: { label: "Promoción", icon: "trending_up", tone: "success" },
  custom: { label: "Evento", icon: "event", tone: "primary" },
};

const DAY_MS = 86_400_000;

export const toLocalDate = (value: Date | string | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const iso = parseIsoDate(value);
  if (iso) return iso;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Días de `from` a `to` (positivo = futuro). */
export const daysBetween = (from: Date, to: Date): number =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);

/** Ocurrencia anual (mismo día y mes) más cercana a `today`. */
export const nearestOccurrence = (date: Date, today: Date): Date => {
  const year = today.getFullYear();
  const candidates = [year - 1, year, year + 1].map(
    (y) => new Date(y, date.getMonth(), date.getDate()),
  );
  return candidates.reduce((best, candidate) =>
    Math.abs(daysBetween(today, candidate)) < Math.abs(daysBetween(today, best)) ? candidate : best,
  );
};

const dayMonth = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long" });
const dayMonthShort = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

export const formatDayMonth = (date: Date, short = false): string =>
  (short ? dayMonthShort : dayMonth).format(date).replace(/\./g, "");

const formatRange = (start: Date, end: Date): string => {
  const formatter = dayMonthShort as Intl.DateTimeFormat & {
    formatRange?: (a: Date, b: Date) => string;
  };
  if (typeof formatter.formatRange === "function") {
    return formatter.formatRange(start, end).replace(/\./g, "");
  }
  return `${formatDayMonth(start, true)} – ${formatDayMonth(end, true)}`;
};

/** "Hoy", "Mañana", "Ayer", "En 3 días", "Hace 2 días". */
export const relativeDays = (days: number): string => {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days === -1) return "Ayer";
  return days > 0 ? `En ${days} días` : `Hace ${-days} días`;
};

export type ResolvedPersonEvent = {
  label: ReactNode;
  icon: string | ReactNode;
  tone: CnTone;
  /** Fecha de la ocurrencia (para ordenar). */
  when: Date | null;
  /** Días hasta la ocurrencia (negativo = pasada). */
  days: number | null;
  /** Texto de detalle ("15 de marzo", "3 – 10 dic"). */
  detail: ReactNode;
  /** Insignia ("5 años", "32 años"). */
  badge?: string;
  /** Cuenta regresiva ("Hoy", "Regresa en 4 días"). */
  countdown?: string;
  isToday: boolean;
};

/** Calcula etiqueta, fecha, cuenta regresiva e insignia del evento. */
export const resolvePersonEvent = (
  event: CnPersonEvent,
  today: Date = new Date(),
): ResolvedPersonEvent => {
  const defaults = EVENT_DEFAULTS[event.type];
  const date = toLocalDate(event.date);
  const end = toLocalDate(event.endDate);
  const base = {
    label: event.label ?? defaults.label,
    icon: event.icon ?? defaults.icon,
    tone: event.tone ?? defaults.tone,
  };
  const showCountdown = event.countdown !== false;

  if (!date) {
    return { ...base, when: null, days: null, detail: event.description ?? null, isToday: false };
  }

  switch (event.type) {
    case "birthday":
    case "anniversary": {
      const occurrence = nearestOccurrence(date, today);
      const days = daysBetween(today, occurrence);
      const years = event.years ?? occurrence.getFullYear() - date.getFullYear();
      let badge: string | undefined;
      if (event.type === "anniversary" && years > 0)
        badge = `${years} ${years === 1 ? "año" : "años"}`;
      if (event.type === "birthday" && event.showAge && years > 0) badge = `${years} años`;
      return {
        ...base,
        when: occurrence,
        days,
        detail: event.description ?? formatDayMonth(occurrence),
        badge,
        countdown: showCountdown ? (days === 0 ? "¡Hoy!" : relativeDays(days)) : undefined,
        isToday: days === 0,
      };
    }
    case "new-hire": {
      const days = daysBetween(today, date);
      const countdown =
        days === 0
          ? "Hoy es su primer día"
          : days > 0
            ? days === 1
              ? "Ingresa mañana"
              : `Ingresa en ${days} días`
            : `Ingresó ${relativeDays(days).toLowerCase()}`;
      return {
        ...base,
        when: date,
        days,
        detail: event.description ?? `Ingreso: ${formatDayMonth(date)}`,
        countdown: showCountdown ? countdown : undefined,
        isToday: days === 0,
      };
    }
    case "leave":
    case "vacation": {
      const days = daysBetween(today, date);
      const untilEnd = end ? daysBetween(today, end) : null;
      let countdown: string;
      if (days > 0) countdown = days === 1 ? "Sale mañana" : `Sale en ${days} días`;
      else if (untilEnd !== null && untilEnd >= 0)
        countdown = untilEnd === 0 ? "Regresa mañana" : `Regresa en ${untilEnd + 1} días`;
      else if (untilEnd !== null) countdown = "Ya regresó";
      else countdown = days === 0 ? "Desde hoy" : `Desde ${relativeDays(days).toLowerCase()}`;
      return {
        ...base,
        when: date,
        days,
        detail:
          event.description ?? (end ? formatRange(date, end) : `Desde ${formatDayMonth(date)}`),
        countdown: showCountdown ? countdown : undefined,
        isToday: days <= 0 && (untilEnd === null || untilEnd >= 0),
      };
    }
    default: {
      const days = daysBetween(today, date);
      return {
        ...base,
        when: date,
        days,
        detail: event.description ?? formatDayMonth(date),
        countdown: showCountdown ? relativeDays(days) : undefined,
        isToday: days === 0,
      };
    }
  }
};
