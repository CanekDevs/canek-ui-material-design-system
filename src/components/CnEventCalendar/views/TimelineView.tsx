import Box from "@mui/material/Box";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { CnAvatar } from "../../CnAvatar";
import { CnIcon } from "../../CnIcon";
import { useCalendarContext } from "../calendar-context";
import {
  addDays,
  alpha,
  businessIntervals,
  diffDays,
  eventResourceIds,
  formatDayLong,
  formatHour,
  formatTime,
  isSameDay,
  minutesOfDay,
  resolveColor,
  startOfDay,
  toIsoDate,
  weekdayName,
} from "../calendar-utils";
import type {
  CnCalendarDateRange,
  CnCalendarResource,
  CnEventOccurrence,
} from "../CnEventCalendar.types";
import { AVAILABILITY_META, conflictRing, EventBadges } from "../event-badges";

const LABEL_W = 208;
const LANE_BY_DENSITY = { compact: 26, standard: 34, comfortable: 44 } as const;
const WEEK_DAY_W = 168;
const UNASSIGNED = "__none__";

export type TimelineViewProps = {
  range: CnCalendarDateRange;
  occurrences: CnEventOccurrence[];
  timelineRange: "day" | "week";
  hourWidth?: number;
  height?: number;
};

type Placed = { occ: CnEventOccurrence; x0: number; x1: number; lane: number };

type DragState = {
  occ: CnEventOccurrence;
  resourceId: string;
  mode: "move" | "resize";
  pointerId: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  moved: boolean;
  target: string;
  x0: number;
  x1: number;
};

type SelectState = { pointerId: number; resourceId: string; from: number; to: number };

/** Asigna filas (lanes) sin encimar a barras horizontales. */
export const assignLanes = <T extends { x0: number; x1: number }>(items: T[]) => {
  const sorted = [...items].sort((a, b) => a.x0 - b.x0 || b.x1 - a.x1);
  const ends: number[] = [];
  return sorted.map((item) => {
    let lane = ends.findIndex((end) => end <= item.x0);
    if (lane === -1) {
      lane = ends.length;
      ends.push(item.x1);
    } else ends[lane] = item.x1;
    return { ...item, lane };
  });
};

/**
 * Vista de recursos: una fila por persona, sala o vehículo y eje de tiempo
 * horizontal (día por horas o semana por días). Los eventos se arrastran en el
 * tiempo y entre filas; el borde derecho cambia la duración.
 */
export const TimelineView = ({
  range,
  occurrences,
  timelineRange,
  hourWidth = 64,
  height = 640,
}: TimelineViewProps) => {
  const ctx = useCalendarContext();
  const {
    locale,
    now,
    holidays,
    minHour,
    maxHour,
    slotDuration,
    workingHours,
    showNowIndicator,
    showWeekends,
    resources,
    conflicts,
    availability,
    density,
    renderEvent,
  } = ctx;
  const laneH = LANE_BY_DENSITY[density];
  const dayMode = timelineRange === "day";
  const gridStart = minHour * 60;
  const gridEnd = maxHour * 60;
  const dayMinutes = gridEnd - gridStart;
  const dayWidth = dayMode ? (dayMinutes / 60) * hourWidth : WEEK_DAY_W;
  const pxPerMin = dayWidth / dayMinutes;
  const snap = dayMode ? slotDuration : 60;
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selection, setSelection] = useState<SelectState | null>(null);
  const suppressClick = useRef(false);

  const days = useMemo(() => {
    const total = diffDays(range.end, range.start);
    return Array.from({ length: total }, (_, i) => addDays(range.start, i)).filter(
      (d) => dayMode || showWeekends || (d.getDay() !== 0 && d.getDay() !== 6),
    );
  }, [range.start, range.end, dayMode, showWeekends]);
  const totalWidth = days.length * dayWidth;

  /** Posición x de un instante (los fines se tratan como 24:00 del día anterior). */
  const xOf = (date: Date, isEnd = false): number => {
    let day = startOfDay(date);
    let minutes = minutesOfDay(date);
    if (isEnd && minutes === 0 && date.getSeconds() === 0) {
      day = addDays(day, -1);
      minutes = 24 * 60;
    }
    const idx = days.findIndex((d) => isSameDay(d, day));
    if (idx < 0) {
      const after = days.findIndex((d) => d > day);
      return after < 0 ? totalWidth : after * dayWidth;
    }
    const clamped = Math.min(Math.max(minutes - gridStart, 0), dayMinutes);
    return idx * dayWidth + clamped * pxPerMin;
  };

  /** Instante en la posición x (con ajuste al intervalo). */
  const timeAt = (x: number): Date => {
    const clampedX = Math.min(Math.max(x, 0), totalWidth - 0.001);
    const idx = Math.min(days.length - 1, Math.floor(clampedX / dayWidth));
    const raw = (clampedX - idx * dayWidth) / pxPerMin;
    const minutes = gridStart + Math.round(raw / snap) * snap;
    const day = days[idx];
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
  };

  const rows = useMemo(() => {
    const list: (CnCalendarResource & { unassigned?: boolean })[] = [...resources];
    if (occurrences.some((o) => eventResourceIds(o.event).length === 0)) {
      list.push({ id: UNASSIGNED, label: "Sin asignar", icon: "help_outline", unassigned: true });
    }
    return list;
  }, [resources, occurrences]);

  const placedByRow = useMemo(() => {
    const map = new Map<string, Placed[]>();
    for (const row of rows) {
      const items = occurrences
        .filter((o) => {
          const ids = eventResourceIds(o.event);
          return row.id === UNASSIGNED ? ids.length === 0 : ids.includes(row.id);
        })
        .map((occ) => {
          const x0 = xOf(occ.start);
          const x1 = xOf(occ.end, true);
          return { occ, x0, x1: Math.max(x1, x0 + 6) };
        })
        .filter((p) => p.x1 > 0 && p.x0 < totalWidth);
      map.set(row.id, assignLanes(items));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, occurrences, days, dayWidth, gridStart, gridEnd]);

  const canDrag = (occ: CnEventOccurrence) => ctx.editable && occ.event.editable !== false;

  // ─── Arrastrar eventos ───────────────────────────────────────────────
  const rowFromPoint = (x: number, y: number): string | null => {
    if (typeof document === "undefined" || typeof document.elementFromPoint !== "function") {
      return null;
    }
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-cn-resource-row]");
    return el?.dataset.cnResourceRow ?? null;
  };

  const onBarPointerDown = (p: Placed, resourceId: string) => (e: PointerEvent<HTMLElement>) => {
    if (!canDrag(p.occ) || e.button !== 0) return;
    e.stopPropagation();
    const mode = (e.target as HTMLElement).closest("[data-cn-resize]") ? "resize" : "move";
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({
      occ: p.occ,
      resourceId,
      mode,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      dx: 0,
      dy: 0,
      moved: false,
      target: resourceId,
      x0: p.x0,
      x1: p.x1,
    });
  };
  const onBarPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const moved = drag.moved || Math.abs(dx) > 3 || Math.abs(dy) > 3;
    if (!moved) return;
    const target =
      drag.mode === "move" ? (rowFromPoint(e.clientX, e.clientY) ?? drag.target) : drag.target;
    setDrag({ ...drag, dx, dy, moved, target });
  };
  const onBarPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const current = { ...drag, dx: e.clientX - drag.x };
    setDrag(null);
    if (!current.moved) return;
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
    const { occ } = current;
    const duration = occ.end.getTime() - occ.start.getTime();
    let start = occ.start;
    let end = occ.end;
    if (current.mode === "resize") {
      end = timeAt(current.x1 + current.dx);
      const minEnd = new Date(start.getTime() + snap * 60_000);
      if (end < minEnd) end = minEnd;
    } else if (occ.allDay) {
      const deltaDays = Math.round(current.dx / dayWidth);
      start = addDays(occ.start, deltaDays);
      end = addDays(occ.end, deltaDays);
    } else {
      start = timeAt(current.x0 + current.dx);
      end = new Date(start.getTime() + duration);
    }
    const targetResource = current.target === UNASSIGNED ? undefined : current.target;
    const changedRow = current.target !== current.resourceId;
    if (
      start.getTime() === occ.start.getTime() &&
      end.getTime() === occ.end.getTime() &&
      !changedRow
    ) {
      return;
    }
    if (!ctx.isDayEnabled(start)) return;
    ctx.changeEvent({
      event: occ.event,
      occurrence: occ,
      start,
      end,
      allDay: occ.allDay,
      kind: current.mode,
      via: "pointer",
      ...(changedRow && {
        resourceId: targetResource,
        previousResourceId: current.resourceId === UNASSIGNED ? undefined : current.resourceId,
      }),
    });
  };

  const openEvent = (occ: CnEventOccurrence) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (suppressClick.current) return;
    ctx.openEvent(occ, e.currentTarget);
  };

  // ─── Seleccionar horario en una fila ─────────────────────────────────
  const localX = (e: PointerEvent<HTMLElement>) =>
    e.clientX - e.currentTarget.getBoundingClientRect().left;
  const onRowPointerDown = (resourceId: string) => (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || drag) return;
    if ((e.target as HTMLElement).closest("[data-cn-event]")) return;
    const x = localX(e);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setSelection({ pointerId: e.pointerId, resourceId, from: x, to: x });
  };
  const onRowPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!selection || e.pointerId !== selection.pointerId || !ctx.selectable) return;
    setSelection({ ...selection, to: localX(e) });
  };
  const onRowPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (!selection || e.pointerId !== selection.pointerId) return;
    const { from, to, resourceId } = selection;
    setSelection(null);
    const a = timeAt(Math.min(from, to));
    let b = timeAt(Math.max(from, to));
    if (b <= a) b = new Date(a.getTime() + (dayMode ? slotDuration : 60) * 60_000);
    if (!ctx.isDayEnabled(a)) return;
    ctx.selectSlot({
      start: a,
      end: b,
      allDay: false,
      ...(resourceId !== UNASSIGNED && { resourceId }),
    });
  };

  // ─── Fondos (horario laboral, festivos, disponibilidad) ─────────────
  const rowBackground = (resourceId: string): ReactNode[] => {
    const nodes: ReactNode[] = [];
    days.forEach((day, idx) => {
      const left = idx * dayWidth;
      const holiday = holidays.get(toIsoDate(day));
      if (holiday?.blocked || !ctx.isDayEnabled(day)) {
        nodes.push(
          <Box
            key={`b${idx}`}
            data-cn-blocked
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left,
              width: dayWidth,
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent 0 6px, rgba(110,118,130,0.08) 6px 12px)",
            }}
          />,
        );
        return;
      }
      if (workingHours) {
        const intervals = businessIntervals(workingHours, day.getDay());
        const off: [number, number][] = [];
        let cursor = gridStart;
        for (const [a, b] of intervals) {
          off.push([cursor, Math.min(gridEnd, a)]);
          cursor = Math.max(cursor, b);
        }
        off.push([Math.max(gridStart, cursor), gridEnd]);
        off
          .filter(([a, b]) => b > a)
          .forEach(([a, b]) =>
            nodes.push(
              <Box
                key={`o${idx}-${a}`}
                data-cn-offhours
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: left + (a - gridStart) * pxPerMin,
                  width: (b - a) * pxPerMin,
                  backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
                }}
              />,
            ),
          );
      }
    });
    availability
      .filter((a) => !a.resourceId || a.resourceId === resourceId)
      .forEach((a, i) => {
        const x0 = xOf(a.start);
        const x1 = xOf(a.end, true);
        if (x1 <= x0) return;
        const meta = AVAILABILITY_META[a.status];
        nodes.push(
          <Box
            key={`a${i}`}
            data-cn-availability={a.status}
            title={a.label ?? meta.label}
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: x0,
              width: x1 - x0,
              background: meta.background,
              pointerEvents: "none",
            }}
          />,
        );
      });
    return nodes;
  };

  const gridLines = dayMode
    ? `repeating-linear-gradient(to right, var(--cn-color-border, #dde0e4) 0 1px, transparent 1px ${hourWidth}px)`
    : `repeating-linear-gradient(to right, var(--cn-color-border, #dde0e4) 0 1px, transparent 1px ${dayWidth}px)`;

  const nowX =
    showNowIndicator && now >= range.start && now < range.end && days.some((d) => isSameDay(d, now))
      ? xOf(now)
      : null;

  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);
  const stickyLabel = {
    position: "sticky",
    left: 0,
    zIndex: 3,
    backgroundColor: "var(--cn-color-surface, #fff)",
    borderRight: "1px solid var(--cn-color-border, #dde0e4)",
  } as const;

  const rowLoad = (resourceId: string) => {
    const items = placedByRow.get(resourceId) ?? [];
    const minutes = items
      .filter((p) => !p.occ.allDay)
      .reduce((acc, p) => acc + (p.occ.end.getTime() - p.occ.start.getTime()) / 60_000, 0);
    return Math.round((minutes / 60) * 10) / 10;
  };

  let lastGroup: string | undefined;

  return (
    <Box
      data-cn-event-calendar-view="timeline"
      role="grid"
      aria-label="Recursos"
      sx={{ maxHeight: height, overflow: "auto", position: "relative" }}
    >
      <Box sx={{ width: LABEL_W + totalWidth, minWidth: "100%" }}>
        {/* Encabezado */}
        <Box
          role="row"
          sx={{
            display: "flex",
            position: "sticky",
            top: 0,
            zIndex: 4,
            backgroundColor: "var(--cn-color-surface, #fff)",
            borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
          }}
        >
          <Box
            role="columnheader"
            sx={{
              ...stickyLabel,
              zIndex: 5,
              width: LABEL_W,
              flexShrink: 0,
              display: "flex",
              alignItems: "flex-end",
              px: "12px",
              pb: "6px",
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            Recurso
          </Box>
          <Box sx={{ position: "relative", width: totalWidth, flexShrink: 0 }}>
            <Box sx={{ display: "flex" }}>
              {days.map((day) => {
                const today = isSameDay(day, now);
                return (
                  <Box
                    key={day.getTime()}
                    role="columnheader"
                    aria-label={formatDayLong(day, locale)}
                    sx={{
                      width: dayWidth,
                      flexShrink: 0,
                      boxSizing: "border-box",
                      borderLeft: "1px solid var(--cn-color-border, #dde0e4)",
                      px: "8px",
                      pt: "6px",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      color: today
                        ? "var(--cn-color-brand-600, #254d87)"
                        : "var(--cn-color-text, #222831)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dayMode ? null : (
                      <Box
                        component="button"
                        type="button"
                        onClick={() => ctx.goToDay(day)}
                        sx={{
                          all: "unset",
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline" },
                          "&:focus-visible": {
                            outline: "2px solid var(--cn-color-accent-500, #3d5afe)",
                          },
                        }}
                      >
                        {`${weekdayName(day, locale)} ${day.getDate()}`}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ display: "flex", height: 22 }}>
              {days.map((day) =>
                dayMode ? (
                  hours.map((h) => (
                    <Box
                      key={`${day.getTime()}-${h}`}
                      sx={{
                        width: hourWidth,
                        flexShrink: 0,
                        boxSizing: "border-box",
                        borderLeft: "1px solid var(--cn-color-border-subtle, #eceef1)",
                        pl: "4px",
                        fontSize: "0.66rem",
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--cn-color-text-muted, #6e7682)",
                      }}
                    >
                      {formatHour(h)}
                    </Box>
                  ))
                ) : (
                  <Box
                    key={day.getTime()}
                    sx={{
                      width: dayWidth,
                      flexShrink: 0,
                      display: "flex",
                      justifyContent: "space-between",
                      px: "6px",
                      boxSizing: "border-box",
                      fontSize: "0.62rem",
                      color: "var(--cn-color-text-subtle, #9aa1aa)",
                    }}
                  >
                    <span>{formatHour(minHour)}</span>
                    <span>{formatHour(Math.round((minHour + maxHour) / 2))}</span>
                  </Box>
                ),
              )}
            </Box>
          </Box>
        </Box>

        {/* Filas */}
        {rows.map((row) => {
          const placed = placedByRow.get(row.id) ?? [];
          const lanes = Math.max(
            1,
            placed.reduce((acc, p) => Math.max(acc, p.lane + 1), 0),
          );
          const rowHeight = lanes * laneH + 8;
          const color = resolveColor(row.color);
          const conflictCount = placed.filter((p) => conflicts.get(p.occ.key)?.length).length;
          const load = rowLoad(row.id);
          const groupHeader =
            row.group && row.group !== lastGroup ? (
              <Box
                key={`g-${row.group}`}
                role="row"
                data-cn-resource-group={row.group}
                sx={{
                  ...stickyLabel,
                  borderRight: 0,
                  width: "100%",
                  px: "12px",
                  py: "4px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--cn-color-brand-600, #254d87)",
                  backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
                  borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
                }}
              >
                {row.group}
              </Box>
            ) : null;
          lastGroup = row.group;
          const sel = selection && selection.resourceId === row.id ? selection : null;
          const isDropTarget =
            drag?.moved &&
            drag.mode === "move" &&
            drag.target === row.id &&
            drag.resourceId !== row.id;
          return [
            groupHeader,
            <Box
              key={row.id}
              role="row"
              sx={{ display: "flex", borderBottom: "1px solid var(--cn-color-border, #dde0e4)" }}
            >
              <Box
                role="rowheader"
                data-cn-resource={row.id}
                sx={{
                  ...stickyLabel,
                  width: LABEL_W,
                  flexShrink: 0,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  px: "12px",
                  py: "6px",
                  minHeight: rowHeight,
                }}
              >
                {row.avatarUrl || (!row.icon && !row.unassigned) ? (
                  <CnAvatar name={row.label} src={row.avatarUrl} size="sm" />
                ) : (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      borderRadius: "9px",
                      display: "grid",
                      placeItems: "center",
                      color: row.unassigned ? "var(--cn-color-text-muted, #6e7682)" : color,
                      backgroundColor: row.unassigned
                        ? "var(--cn-color-neutral-100, #f1f3f5)"
                        : alpha(color, 0.14),
                    }}
                  >
                    <CnIcon name={row.icon ?? "help_outline"} size={18} />
                  </Box>
                )}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--cn-color-text, #222831)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.label}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "2px 8px",
                      fontSize: "0.68rem",
                      color: "var(--cn-color-text-muted, #6e7682)",
                    }}
                  >
                    {row.description && (
                      <Box
                        component="span"
                        sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {row.description}
                      </Box>
                    )}
                    {row.capacity && row.capacity > 1 && (
                      <span data-cn-resource-capacity>Cap. {row.capacity}</span>
                    )}
                    {load > 0 && <span data-cn-resource-load>{load} h</span>}
                  </Box>
                </Box>
                {conflictCount > 0 && (
                  <Box
                    component="span"
                    data-cn-resource-conflicts={conflictCount}
                    title={`${conflictCount} ${conflictCount === 1 ? "evento en conflicto" : "eventos en conflicto"}`}
                    sx={{ display: "inline-flex", color: "var(--cn-color-warning-600, #b8831a)" }}
                  >
                    <CnIcon name="warning" size={16} />
                  </Box>
                )}
              </Box>
              <Box
                role="gridcell"
                data-cn-resource-row={row.id}
                aria-label={`${row.label}, ${placed.length} ${placed.length === 1 ? "evento" : "eventos"}`}
                onPointerDown={onRowPointerDown(row.id)}
                onPointerMove={onRowPointerMove}
                onPointerUp={onRowPointerUp}
                onPointerCancel={() => setSelection(null)}
                sx={{
                  position: "relative",
                  width: totalWidth,
                  flexShrink: 0,
                  minHeight: rowHeight,
                  cursor: "cell",
                  backgroundImage: gridLines,
                  backgroundColor: isDropTarget ? "rgba(61, 90, 254, 0.06)" : undefined,
                  userSelect: drag?.moved || selection ? "none" : undefined,
                  touchAction: ctx.selectable ? "pan-y" : undefined,
                }}
              >
                {rowBackground(row.id)}
                {sel && (
                  <Box
                    data-cn-selection
                    sx={{
                      position: "absolute",
                      top: 3,
                      bottom: 3,
                      left: Math.min(sel.from, sel.to),
                      width: Math.max(4, Math.abs(sel.to - sel.from)),
                      borderRadius: "6px",
                      backgroundColor: "rgba(61, 90, 254, 0.14)",
                      border: "1px solid rgba(61, 90, 254, 0.5)",
                      pointerEvents: "none",
                    }}
                  />
                )}
                {placed.map((p) => {
                  const { occ } = p;
                  const occConflicts = conflicts.get(occ.key) ?? [];
                  const dragging =
                    drag?.moved && drag.occ.key === occ.key && drag.resourceId === row.id;
                  const width = Math.max(6, p.x1 - p.x0 - 2);
                  const narrow = width < 70;
                  const showTime = density === "comfortable" ? width >= 90 : width >= 150;
                  const draggable = canDrag(occ);
                  return (
                    <Box
                      key={`${occ.key}@${row.id}`}
                      component="button"
                      type="button"
                      data-cn-event={occ.event.id}
                      data-cn-occurrence={occ.key}
                      data-cn-resource={row.id}
                      aria-label={`${occ.event.title}, ${occ.allDay ? "todo el día" : `${formatTime(occ.start)} a ${formatTime(occ.end)}`}, ${row.label}`}
                      onClick={openEvent(occ)}
                      onPointerDown={onBarPointerDown(p, row.id)}
                      onPointerMove={onBarPointerMove}
                      onPointerUp={onBarPointerUp}
                      onPointerCancel={() => setDrag(null)}
                      sx={{
                        all: "unset",
                        boxSizing: "border-box",
                        position: "absolute",
                        top: 4 + p.lane * laneH,
                        height: laneH - 4,
                        left: p.x0 + 1,
                        width:
                          dragging && drag?.mode === "resize"
                            ? Math.max(6, width + drag.dx)
                            : width,
                        transform:
                          dragging && drag?.mode === "move"
                            ? `translate(${drag.dx}px, ${drag.dy}px)`
                            : undefined,
                        zIndex: dragging ? 3 : 1,
                        display: "flex",
                        flexDirection: density === "comfortable" && !narrow ? "column" : "row",
                        justifyContent:
                          density === "comfortable" && !narrow ? "center" : "flex-start",
                        alignItems: density === "comfortable" && !narrow ? "stretch" : "center",
                        gap: density === "comfortable" ? "0px" : "6px",
                        px: "6px",
                        overflow: "hidden",
                        borderRadius: "6px",
                        borderLeft: `3px solid ${occ.color}`,
                        backgroundColor: alpha(occ.color, dragging ? 0.32 : 0.18),
                        boxShadow: dragging ? "0 8px 20px rgba(17,20,24,0.18)" : undefined,
                        color: "var(--cn-color-text, #222831)",
                        fontSize: "0.72rem",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        cursor: draggable ? (dragging ? "grabbing" : "grab") : "pointer",
                        touchAction: draggable ? "none" : undefined,
                        opacity: occ.event.status === "cancelled" ? 0.6 : 1,
                        textDecoration:
                          occ.event.status === "cancelled" ? "line-through" : undefined,
                        ...conflictRing(occConflicts),
                        "&:hover": { backgroundColor: alpha(occ.color, 0.26) },
                        "&:focus-visible": {
                          outline: "2px solid var(--cn-color-accent-500, #3d5afe)",
                          outlineOffset: 1,
                        },
                      }}
                    >
                      {renderEvent ? (
                        renderEvent(occ, {
                          view: "timeline",
                          compact: narrow,
                          conflicts: occConflicts,
                        })
                      ) : (
                        <>
                          <Box
                            component="span"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              minWidth: 0,
                              fontWeight: 700,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {occ.event.title}
                            </Box>
                            <EventBadges occurrence={occ} conflicts={occConflicts} size={11} />
                          </Box>
                          {showTime && !occ.allDay && (
                            <Box
                              component="span"
                              sx={{
                                color: "var(--cn-color-text-muted, #6e7682)",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {formatTime(occ.start)} – {formatTime(occ.end)}
                            </Box>
                          )}
                        </>
                      )}
                      {draggable && !occ.allDay && (
                        <Box
                          component="span"
                          data-cn-resize
                          aria-hidden
                          sx={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            right: 0,
                            width: 7,
                            cursor: "ew-resize",
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
                {nowX !== null && (
                  <Box
                    data-cn-now-indicator
                    aria-hidden
                    sx={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: nowX,
                      width: 2,
                      backgroundColor: "var(--cn-color-error-500, #d63c3c)",
                      zIndex: 2,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </Box>
            </Box>,
          ];
        })}
        {rows.length === 0 && (
          <Box
            sx={{
              p: "24px",
              textAlign: "center",
              fontSize: "0.84rem",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            Sin recursos para mostrar.
          </Box>
        )}
      </Box>
    </Box>
  );
};
