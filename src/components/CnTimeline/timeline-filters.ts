import type { CnTone } from "../../utils/tones";
import type { CnChipColor } from "../CnChip";
import type { CnTimelineFilter, CnTimelineItem, CnTimelineStatus } from "./CnTimeline.types";
import { toPlainText } from "./timeline-utils";

const TONE_LABEL: Record<CnTone, string> = {
  primary: "Principal",
  success: "Éxito",
  warning: "Advertencia",
  error: "Error",
  info: "Información",
  accent: "Destacado",
  neutral: "Neutral",
};
const TONE_CHIP: Partial<Record<CnTone, CnChipColor>> = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  primary: "primary",
  accent: "accent",
};
const STATUS_LABEL: Record<CnTimelineStatus, string> = {
  completed: "Completados",
  current: "En curso",
  pending: "Pendientes",
  error: "Con error",
};

/** Texto en el que busca la barra (título, descripción, autor, tipo, etiquetas, cambios…). */
export const timelineSearchText = (item: CnTimelineItem): string =>
  [
    toPlainText(item.title),
    toPlainText(item.description),
    toPlainText(item.actor),
    item.type ?? "",
    ...(item.tags ?? []).map((t) => (typeof t === "string" ? t : t.label)),
    ...(item.metadata ?? []).map((m) => `${toPlainText(m.label)} ${toPlainText(m.value)}`),
    ...(item.changes ?? []).map(
      (c) => `${toPlainText(c.field)} ${toPlainText(c.before)} ${toPlainText(c.after)}`,
    ),
    ...(item.attachments ?? []).map((a) => a.name),
    item.searchText ?? "",
  ].join(" ");

/**
 * Genera chips de filtro a partir de los datos: uno por cada tipo, autor (texto),
 * tono o estado distinto, en orden de aparición.
 */
export const timelineFiltersBy = (
  items: readonly CnTimelineItem[],
  by: "type" | "actor" | "tone" | "status",
): CnTimelineFilter[] => {
  const seen = new Map<string, CnTimelineFilter>();
  items.forEach((item) => {
    if (by === "type" && item.type && !seen.has(item.type)) {
      const type = item.type;
      seen.set(type, { id: `type:${type}`, label: type, match: (i) => i.type === type });
    } else if (by === "actor" && typeof item.actor === "string" && !seen.has(item.actor)) {
      const actor = item.actor;
      seen.set(actor, {
        id: `actor:${actor}`,
        label: actor,
        icon: "person",
        match: (i) => i.actor === actor,
      });
    } else if (by === "tone" && item.tone && !seen.has(item.tone)) {
      const tone = item.tone;
      seen.set(tone, {
        id: `tone:${tone}`,
        label: TONE_LABEL[tone],
        color: TONE_CHIP[tone],
        match: (i) => i.tone === tone,
      });
    } else if (by === "status" && item.status && !seen.has(item.status)) {
      const status = item.status;
      seen.set(status, {
        id: `status:${status}`,
        label: STATUS_LABEL[status],
        match: (i) => i.status === status,
      });
    }
  });
  return [...seen.values()];
};
