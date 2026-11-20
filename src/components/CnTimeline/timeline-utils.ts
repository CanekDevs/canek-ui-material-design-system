import type { ReactNode } from "react";
import { isValidElement, useEffect, useState } from "react";
import { formatRelativeTime, normalizeListText } from "../CnList/list-utils";

/*
 * Fechas para historiales: agrupación por día ("Hoy", "Ayer", fecha) y
 * formatos relativo/absoluto. Compartido con `CnNotificationCenter`.
 */

export type CnDateInput = Date | string | number;

const LOCALE = "es-MX";

/** `Date` válida o `null`. */
export const toValidDate = (value: CnDateInput | null | undefined): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Clave local del día (`YYYY-MM-DD`). */
export const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Hoy", "Ayer", "Mañana" o "Lunes, 17 de noviembre" (con año si no es el actual). */
export const formatDayLabel = (date: Date, now: Date = new Date()): string => {
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff === -1) return "Mañana";
  return capitalize(
    new Intl.DateTimeFormat(LOCALE, {
      weekday: "long",
      day: "numeric",
      month: "long",
      ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
    }).format(date),
  );
};

/** "19 nov 2026, 10:45 a.m." */
export const formatAbsolute = (date: Date): string =>
  new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" }).format(date);

/** "10:45 a.m." */
export const formatClock = (date: Date): string =>
  new Intl.DateTimeFormat(LOCALE, { timeStyle: "short" }).format(date);

/** "ahora", "hace 5 min", "ayer"… (mismo formato que `CnList`). */
export const formatRelative = (date: Date, now: Date = new Date()): string =>
  formatRelativeTime(date, now);

/**
 * Texto plano de un `ReactNode` (recorre elementos y sus `children`). Sirve para
 * buscar, exportar y anunciar contenido que llega como JSX.
 */
const rawText = (node: ReactNode): string => {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(rawText).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return rawText(node.props.children);
  return "";
};

export const toPlainText = (node: ReactNode): string => rawText(node).replace(/\s+/g, " ").trim();

/** Coincidencia sin distinguir acentos ni mayúsculas; todas las palabras deben aparecer. */
export const matchesText = (haystack: string, query: string): boolean => {
  const needle = normalizeListText(query);
  if (!needle) return true;
  const text = normalizeListText(haystack);
  return needle.split(/\s+/).every((word) => text.includes(word));
};

/**
 * Fecha "ahora" que se actualiza sola cada `intervalMs` (para que "hace 5 min"
 * no se quede congelado). Con `fixed` devuelve esa fecha y no programa nada.
 */
export const useLiveNow = (fixed?: Date, intervalMs = 60000, enabled = true): Date => {
  const [now, setNow] = useState(() => new Date());
  const active = !fixed && enabled && intervalMs > 0;
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    // Al volver a la pestaña, actualiza enseguida.
    const onVisible = () => {
      if (!document.hidden) setNow(new Date());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, intervalMs]);
  return fixed ?? now;
};

export type CnDayGroup<T> = { key: string; label: string; date: Date | null; items: T[] };

/** Agrupa por día respetando el orden de llegada; los elementos sin fecha van en "Sin fecha". */
export const groupByDay = <T>(
  items: readonly T[],
  getDate: (item: T) => CnDateInput | null | undefined,
  now: Date = new Date(),
  formatLabel: (date: Date, now: Date) => string = formatDayLabel,
): CnDayGroup<T>[] => {
  const groups = new Map<string, CnDayGroup<T>>();
  items.forEach((item) => {
    const date = toValidDate(getDate(item));
    const key = date ? dayKey(date) : "none";
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: date ? formatLabel(date, now) : "Sin fecha",
        date: date ? startOfDay(date) : null,
        items: [],
      };
      groups.set(key, group);
    }
    group.items.push(item);
  });
  return [...groups.values()];
};
