/** Utilidades de `CnChatThread`: días y agrupación de mensajes seguidos. */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

/** «Hoy», «Ayer», el día de la semana si fue esta semana o la fecha completa. */
export const dayLabel = (value: Date | string, now: Date = new Date()): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days > 1 && days < 7)
    return new Intl.DateTimeFormat("es-MX", { weekday: "long" })
      .format(date)
      .replace(/^./, (c) => c.toUpperCase());
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  }).format(date);
};

export const sameDay = (a: Date | string, b: Date | string) =>
  startOfDay(toDate(a)).getTime() === startOfDay(toDate(b)).getTime();

/** Un mensaje continúa al anterior si es del mismo autor, del mismo día y llegó dentro de la ventana. */
export const continuesPrevious = (
  previous: { authorId?: string; time: Date | string; variant?: string } | undefined,
  current: { authorId?: string; time: Date | string; variant?: string },
  windowMs: number,
) => {
  if (!previous) return false;
  return (
    previous.variant !== "system" &&
    current.variant !== "system" &&
    previous.authorId === current.authorId &&
    sameDay(previous.time, current.time) &&
    toDate(current.time).getTime() - toDate(previous.time).getTime() <= windowMs
  );
};
