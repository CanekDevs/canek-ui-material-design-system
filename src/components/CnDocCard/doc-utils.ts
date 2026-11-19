const toDate = (value: Date | string | number): Date | null => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Fecha relativa en español: "hace 5 min", "hace 3 h", "ayer", "hace 4 días";
 * a partir de una semana, fecha corta ("12 mar 2026").
 */
export const formatDocDate = (value: Date | string | number, now: Date = new Date()): string => {
  const date = toDate(value);
  if (!date) return "";
  const diff = now.getTime() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (diff >= 0) {
    if (minutes < 1) return "justo ahora";
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.round(hours / 24);
    if (days === 1) return "ayer";
    if (days < 7) return `hace ${days} días`;
  }
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" })
    .format(date)
    .replace(/\./g, "");
};
