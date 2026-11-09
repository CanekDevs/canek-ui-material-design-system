/*
 * Utilidades de horas (`HH:mm`), duraciones y días de la semana compartidas por
 * `CnTimeRangeField`, `CnScheduleField`, `CnWeekdaysField` y `CnDurationField`.
 */

/** Minutos desde la medianoche de una hora `HH:mm` (o `null` si no es válida). */
export const parseTimeToMinutes = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

/** `HH:mm` a partir de minutos (se normaliza dentro de las 24 h). */
export const minutesToTime = (total: number): string => {
  const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/** Texto legible de una duración en minutos: `1 d 2 h 30 min`. */
export const formatMinutes = (total: number | null | undefined): string => {
  if (total === null || total === undefined || !Number.isFinite(total)) return "";
  const sign = total < 0 ? "-" : "";
  let rest = Math.abs(Math.round(total));
  if (rest === 0) return "0 min";
  const days = Math.floor(rest / 1440);
  rest -= days * 1440;
  const hours = Math.floor(rest / 60);
  const minutes = rest - hours * 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} d`);
  if (hours) parts.push(`${hours} h`);
  if (minutes) parts.push(`${minutes} min`);
  return sign + parts.join(" ");
};

export type CnWeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type CnWeekdayInfo = {
  /** 0 = domingo … 6 = sábado (igual que `Date#getDay`). */
  value: number;
  key: CnWeekdayKey;
  /** Inicial (`L`, `M`, `M`, `J`, `V`, `S`, `D`). */
  initial: string;
  /** Abreviatura (`Lun`, `Mar`…). */
  short: string;
  label: string;
};

export const WEEKDAYS: readonly CnWeekdayInfo[] = [
  { value: 0, key: "sun", initial: "D", short: "Dom", label: "Domingo" },
  { value: 1, key: "mon", initial: "L", short: "Lun", label: "Lunes" },
  { value: 2, key: "tue", initial: "M", short: "Mar", label: "Martes" },
  { value: 3, key: "wed", initial: "M", short: "Mié", label: "Miércoles" },
  { value: 4, key: "thu", initial: "J", short: "Jue", label: "Jueves" },
  { value: 5, key: "fri", initial: "V", short: "Vie", label: "Viernes" },
  { value: 6, key: "sat", initial: "S", short: "Sáb", label: "Sábado" },
];

/** Días de la semana ordenados empezando en `weekStart` (0 = domingo, 1 = lunes). */
export const orderedWeekdays = (weekStart: number = 1): CnWeekdayInfo[] => {
  const start = ((Math.trunc(weekStart) % 7) + 7) % 7;
  return Array.from({ length: 7 }, (_, i) => WEEKDAYS[(start + i) % 7]);
};
