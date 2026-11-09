import {
  addDays,
  diffDays,
  normalizeSpan,
  recurrenceStarts,
  shiftDays,
  toDate,
  toIsoDate,
} from "./calendar-utils";
import type {
  CnCalendarEvent,
  CnEventChange,
  CnEventOccurrence,
  CnEventRecurrence,
  CnRecurrenceScope,
  CnWeekday,
} from "./CnEventCalendar.types";

/*
 * Ayudas para aplicar en el estado del consumidor los cambios que emite el
 * calendario, incluidos los alcances de recurrentes ("solo este", "este y los
 * siguientes", "todos").
 */

/** Fin que se guarda en el evento (en todo el día, el último día inclusive). */
const storedEnd = (end: Date, allDay: boolean): Date | string =>
  allDay ? toIsoDate(addDays(end, -1)) : end;

const storedStart = (start: Date, allDay: boolean): Date | string =>
  allDay ? toIsoDate(start) : start;

const nextResource = <T>(event: CnCalendarEvent<T>, change: CnEventChange<T>) => {
  if (change.resourceId === undefined) return event.resourceId;
  if (Array.isArray(event.resourceId) && change.previousResourceId) {
    return event.resourceId.map((id) =>
      id === change.previousResourceId ? (change.resourceId as string) : id,
    );
  }
  return change.resourceId;
};

const shiftWeekdays = (rule: CnEventRecurrence, dayDelta: number): CnEventRecurrence => {
  if (!dayDelta || rule.freq !== "weekly" || !rule.byWeekday?.length) return rule;
  return {
    ...rule,
    byWeekday: rule.byWeekday.map((d) => ((((d + dayDelta) % 7) + 7) % 7) as CnWeekday),
  };
};

const occurrenceIso = (occ: Pick<CnEventOccurrence, "start">) => toIsoDate(occ.start);

/** Inicios producidos antes de una fecha (para repartir `count`). */
const producedBefore = (event: CnCalendarEvent, before: Date): number => {
  const span = normalizeSpan(event);
  if (!span || !event.recurrence) return 0;
  return recurrenceStarts(span.start, { ...event.recurrence, exdates: [] }, before).length;
};

/**
 * Aplica un `CnEventChange` a la lista de eventos (inmutable). Sin `scope`, un
 * recurrente se mueve completo ("all").
 */
export const applyEventChange = <TMeta>(
  events: CnCalendarEvent<TMeta>[],
  change: CnEventChange<TMeta>,
): CnCalendarEvent<TMeta>[] => {
  const { event, occurrence, start, end, allDay } = change;
  const original = events.find((e) => e.id === event.id) ?? event;
  const recurring = Boolean(original.recurrence && occurrence.recurring);
  const scope: CnRecurrenceScope = recurring ? (change.scope ?? "all") : "all";
  const resourceId = nextResource(original, change);

  if (!recurring) {
    return events.map((e) =>
      e.id === original.id
        ? {
            ...e,
            start: storedStart(start, allDay),
            end: storedEnd(end, allDay),
            allDay: allDay || undefined,
            ...(resourceId !== undefined && { resourceId }),
          }
        : e,
    );
  }

  const rule = original.recurrence as CnEventRecurrence;
  const span = normalizeSpan(original as CnCalendarEvent);
  if (!span) return events;
  const dayDelta = diffDays(start, occurrence.start);
  const iso = occurrenceIso(occurrence);

  if (scope === "all" || (scope === "following" && occurrence.start <= span.start)) {
    const delta = start.getTime() - occurrence.start.getTime();
    const duration = end.getTime() - start.getTime();
    const newStart = allDay
      ? shiftDays(span.start, dayDelta)
      : new Date(span.start.getTime() + delta);
    const newEnd = allDay
      ? addDays(newStart, Math.max(1, diffDays(end, start)))
      : new Date(newStart.getTime() + duration);
    const exdates = rule.exdates
      ?.map((d) => toDate(d))
      .filter((d): d is Date => Boolean(d))
      .map((d) => toIsoDate(addDays(d, dayDelta)));
    return events.map((e) =>
      e.id === original.id
        ? {
            ...e,
            start: storedStart(newStart, allDay),
            end: storedEnd(newEnd, allDay),
            recurrence: { ...shiftWeekdays(rule, dayDelta), ...(exdates && { exdates }) },
            ...(resourceId !== undefined && { resourceId }),
          }
        : e,
    );
  }

  if (scope === "this") {
    const detached: CnCalendarEvent<TMeta> = {
      ...original,
      id: `${original.id}::${iso}`,
      start: storedStart(start, allDay),
      end: storedEnd(end, allDay),
      allDay: allDay || undefined,
      recurrence: undefined,
      ...(resourceId !== undefined && { resourceId }),
    };
    return [
      ...events.map((e) =>
        e.id === original.id
          ? { ...e, recurrence: { ...rule, exdates: [...(rule.exdates ?? []), iso] } }
          : e,
      ),
      detached,
    ];
  }

  // "following": la serie original termina el día anterior y nace una nueva.
  const before = producedBefore(original as CnCalendarEvent, occurrence.start);
  const untilIso = toIsoDate(addDays(occurrence.start, -1));
  const { count, ...rest } = rule;
  const truncated: CnEventRecurrence = { ...rest, until: untilIso };
  const newRule: CnEventRecurrence = {
    ...shiftWeekdays(rule, dayDelta),
    exdates: rule.exdates?.filter((d) => {
      const date = toDate(d);
      return date ? toIsoDate(date) >= iso : false;
    }),
    ...(count ? { count: Math.max(1, count - before) } : {}),
  };
  return [
    ...events.map((e) => (e.id === original.id ? { ...e, recurrence: truncated } : e)),
    {
      ...original,
      id: `${original.id}::${iso}+`,
      start: storedStart(start, allDay),
      end: storedEnd(end, allDay),
      recurrence: newRule,
      ...(resourceId !== undefined && { resourceId }),
    },
  ];
};

/** Elimina un evento u ocurrencias según el alcance (sin alcance, todo el evento). */
export const applyEventDelete = <TMeta>(
  events: CnCalendarEvent<TMeta>[],
  event: CnCalendarEvent<TMeta>,
  occurrence?: Pick<CnEventOccurrence, "start" | "recurring">,
  scope: CnRecurrenceScope = "all",
): CnCalendarEvent<TMeta>[] => {
  const original = events.find((e) => e.id === event.id);
  if (!original) return events;
  if (!original.recurrence || !occurrence?.recurring || scope === "all") {
    return events.filter((e) => e.id !== original.id);
  }
  const rule = original.recurrence;
  const iso = occurrenceIso(occurrence);
  if (scope === "this") {
    return events.map((e) =>
      e.id === original.id
        ? { ...e, recurrence: { ...rule, exdates: [...(rule.exdates ?? []), iso] } }
        : e,
    );
  }
  const span = normalizeSpan(original as CnCalendarEvent);
  if (span && occurrence.start <= span.start) return events.filter((e) => e.id !== original.id);
  const { count: _count, ...rest } = rule;
  return events.map((e) =>
    e.id === original.id
      ? { ...e, recurrence: { ...rest, until: toIsoDate(addDays(occurrence.start, -1)) } }
      : e,
  );
};
