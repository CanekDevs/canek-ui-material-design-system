import { eventResourceIds, normalizeText } from "./calendar-utils";
import type {
  CnCalendarResource,
  CnEventConflict,
  CnEventOccurrence,
} from "./CnEventCalendar.types";

/*
 * Detección de conflictos: ocurrencias que se enciman en el tiempo y comparten
 * recurso (respetando su `capacity`) o asistente. Con `any`, cualquier
 * encimamiento cuenta (agenda personal). Los cancelados y los asistentes que
 * rechazaron no cuentan.
 */

export type CnConflictMode = "resource" | "attendee" | "any" | "both";

export type CnConflictOptions = {
  mode?: CnConflictMode;
  resources?: CnCalendarResource[];
};

type Occ = Pick<CnEventOccurrence, "key" | "event" | "start" | "end">;

const attendeeKeys = (occ: Occ): Map<string, string> => {
  const map = new Map<string, string>();
  for (const a of occ.event.attendees ?? []) {
    if (a.status === "declined") continue;
    const key = a.id ?? (a.email ? a.email.toLowerCase() : normalizeText(a.name));
    map.set(key, a.name);
  }
  return map;
};

const overlaps = (a: Occ, b: Occ) => a.start < b.end && b.start < a.end;

/** Conflictos por clave de ocurrencia. */
export const findConflicts = (
  occurrences: Occ[],
  options: CnConflictOptions = {},
): Map<string, CnEventConflict[]> => {
  const { mode = "both", resources = [] } = options;
  const result = new Map<string, CnEventConflict[]>();
  const add = (occ: Occ, conflict: CnEventConflict) => {
    const list = result.get(occ.key) ?? [];
    if (!list.some((c) => c.with === conflict.with && c.reason === conflict.reason)) {
      list.push(conflict);
      result.set(occ.key, list);
    }
  };
  const active = occurrences
    .filter((o) => o.event.status !== "cancelled" && o.end > o.start)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const resourceMap = new Map(resources.map((r) => [r.id, r]));
  const checkResources = mode === "resource" || mode === "both";
  const checkAttendees = mode === "attendee" || mode === "both";

  // Pares que se enciman (barrido por inicio).
  const pairs: [Occ, Occ][] = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length && active[j].start < active[i].end; j += 1) {
      if (overlaps(active[i], active[j])) pairs.push([active[i], active[j]]);
    }
  }

  if (mode === "any") {
    for (const [a, b] of pairs) {
      add(a, { with: b.key, title: b.event.title, reason: "overlap" });
      add(b, { with: a.key, title: a.event.title, reason: "overlap" });
    }
    return result;
  }

  if (checkAttendees) {
    for (const [a, b] of pairs) {
      const ka = attendeeKeys(a);
      for (const [key, name] of attendeeKeys(b)) {
        if (!ka.has(key)) continue;
        add(a, { with: b.key, title: b.event.title, reason: "attendee", label: name });
        add(b, { with: a.key, title: a.event.title, reason: "attendee", label: name });
      }
    }
  }

  if (checkResources) {
    for (const [a, b] of pairs) {
      const ra = new Set(eventResourceIds(a.event));
      for (const id of eventResourceIds(b.event)) {
        if (!ra.has(id)) continue;
        const resource = resourceMap.get(id);
        const capacity = Math.max(1, resource?.capacity ?? 1);
        if (capacity > 1) {
          // Con capacidad > 1 solo hay conflicto si en algún momento se excede.
          const peers = active.filter(
            (o) => eventResourceIds(o.event).includes(id) && overlaps(o, a) && overlaps(o, b),
          );
          const points = peers.map((o) => o.start.getTime());
          const peak = Math.max(
            ...points.map(
              (t) => peers.filter((o) => o.start.getTime() <= t && o.end.getTime() > t).length,
            ),
          );
          if (peak <= capacity) continue;
        }
        const label = resource?.label ?? id;
        add(a, { with: b.key, title: b.event.title, reason: "resource", label });
        add(b, { with: a.key, title: a.event.title, reason: "resource", label });
      }
    }
  }
  return result;
};

/** Texto breve de un conflicto ("Se empalma con X · Sala Maya"). */
export const describeConflict = (conflict: CnEventConflict): string =>
  `Se empalma con "${conflict.title}"${conflict.label ? ` · ${conflict.label}` : ""}`;
