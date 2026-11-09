import Box from "@mui/material/Box";
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCalendarContext } from "../calendar-context";
import {
  addDays,
  addMonths,
  alpha,
  diffDays,
  formatDayLong,
  formatTime,
  isoWeek,
  isOutOfBounds,
  isSameDay,
  occursOnDay,
  resolveColor,
  shiftDays,
  startOfDay,
  startOfWeek,
  toIsoDate,
  weekdayName,
} from "../calendar-utils";
import type { CnCalendarDateRange, CnEventOccurrence } from "../CnEventCalendar.types";
import { conflictRing, EventBadges } from "../event-badges";
import { layoutSegments, limitSegments } from "../event-layout";
import { EventListItem } from "./AgendaView";
import { countByDay, heatLevel } from "./YearView";

const HEADER_H = 30;
const MORE_H = 20;
const WEEK_NUMBER_W = 30;
const LANE_BY_DENSITY = { compact: 18, standard: 22, comfortable: 27 } as const;

/** Fondo del mapa de calor del mes (niveles 0-4). */
export const MONTH_HEAT_BG = [
  "transparent",
  "rgba(53, 98, 166, 0.05)",
  "rgba(53, 98, 166, 0.1)",
  "rgba(53, 98, 166, 0.16)",
  "rgba(53, 98, 166, 0.24)",
];

/** Color de la insignia de capacidad según el uso. */
export const capacityTone = (count: number, capacity: number) => {
  const ratio = capacity > 0 ? count / capacity : 0;
  if (ratio > 1) return { bg: "rgba(214, 60, 60, 0.14)", fg: "#b42727" };
  if (ratio >= 0.75) return { bg: "rgba(224, 160, 32, 0.18)", fg: "#8a5d00" };
  return { bg: "rgba(46, 158, 79, 0.14)", fg: "#1f7a3a" };
};

export type MonthViewProps = {
  date: Date;
  range: CnCalendarDateRange;
  occurrences: CnEventOccurrence[];
  maxEventsPerDay: number;
  compact?: boolean;
  /** Cambia la fecha del calendario (al salir del mes con el teclado). */
  onNavigate: (date: Date) => void;
};

type DragState = {
  occ: CnEventOccurrence;
  pointerId: number;
  x: number;
  y: number;
  originDay: Date;
  moved: boolean;
  target: Date | null;
};

const dayFromPoint = (x: number, y: number): Date | null => {
  if (typeof document === "undefined" || typeof document.elementFromPoint !== "function") {
    return null;
  }
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-cn-date]");
  const iso = el?.dataset.cnDate;
  if (!iso) return null;
  const [y0, m0, d0] = iso.split("-").map(Number);
  return new Date(y0, m0 - 1, d0);
};

const isWeekend = (day: Date) => day.getDay() === 0 || day.getDay() === 6;

/** Vista mensual: barras de varios días por semana, "+N más", teclado y modo compacto. */
export const MonthView = ({
  date,
  range,
  occurrences,
  maxEventsPerDay,
  compact = false,
  onNavigate,
}: MonthViewProps) => {
  const ctx = useCalendarContext();
  const {
    locale,
    weekStart,
    now,
    holidays,
    minDate,
    maxDate,
    showWeekends,
    showWeekNumbers,
    density,
    eventDisplay,
    monthHeatmap,
    dayCapacity,
    conflicts,
    renderEvent,
    renderDayCell,
  } = ctx;
  const laneH = LANE_BY_DENSITY[density];
  const gridRef = useRef<HTMLDivElement | null>(null);
  const focusWithin = useRef(false);
  const [focused, setFocused] = useState<Date>(() =>
    date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      ? startOfDay(now)
      : startOfDay(date),
  );
  const [drag, setDrag] = useState<DragState | null>(null);
  const suppressClick = useRef(false);

  // Si la fecha externa cambia de mes, el foco se mueve a ese mes.
  useEffect(() => {
    setFocused((prev) =>
      prev.getMonth() === date.getMonth() && prev.getFullYear() === date.getFullYear()
        ? prev
        : startOfDay(date),
    );
  }, [date]);

  useEffect(() => {
    if (!focusWithin.current) return;
    gridRef.current?.querySelector<HTMLElement>(`[data-cn-date="${toIsoDate(focused)}"]`)?.focus();
  }, [focused, range.start]);

  const weeks = useMemo(() => {
    const count = Math.round(diffDays(range.end, range.start) / 7);
    return Array.from({ length: count }, (_, w) => addDays(range.start, w * 7));
  }, [range.start, range.end]);

  const weekdays = useMemo(() => {
    const first = startOfWeek(new Date(2023, 0, 1), weekStart);
    return Array.from({ length: 7 }, (_, i) => addDays(first, i));
  }, [weekStart]);

  // Columnas visibles (sin fines de semana si `showWeekends` es falso).
  const hideWeekends = !showWeekends && !compact;
  const visibleCols = weekdays.map((d) => !(hideWeekends && isWeekend(d)));
  const colCount = visibleCols.filter(Boolean).length;
  const visibleBefore = (col: number) => visibleCols.slice(0, col).filter(Boolean).length;
  const visibleIn = (col: number, span: number) =>
    visibleCols.slice(col, col + span).filter(Boolean).length;
  const gridColumns = `repeat(${colCount}, minmax(0, 1fr))`;

  const counts = useMemo(
    () => (monthHeatmap || dayCapacity ? countByDay(occurrences, range) : null),
    [monthHeatmap, dayCapacity, occurrences, range],
  );
  const maxCount = useMemo(() => (counts ? Math.max(0, ...counts.values()) : 0), [counts]);

  const moveFocus = (next: Date, step = 0) => {
    let target = next;
    if (hideWeekends && step) {
      for (let i = 0; i < 3 && isWeekend(target); i += 1) target = addDays(target, step);
    }
    setFocused(target);
    if (target.getMonth() !== date.getMonth() || target.getFullYear() !== date.getFullYear()) {
      onNavigate(target);
    }
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.dataset.cnDate) return;
    let next: Date | null = null;
    let step = 0;
    switch (event.key) {
      case "ArrowRight":
        next = addDays(focused, 1);
        step = 1;
        break;
      case "ArrowLeft":
        next = addDays(focused, -1);
        step = -1;
        break;
      case "ArrowDown":
        next = addDays(focused, 7);
        break;
      case "ArrowUp":
        next = addDays(focused, -7);
        break;
      case "Home":
        next = startOfWeek(focused, weekStart);
        step = 1;
        break;
      case "End":
        next = addDays(startOfWeek(focused, weekStart), 6);
        step = -1;
        break;
      case "PageUp":
        next = addMonths(focused, -1);
        break;
      case "PageDown":
        next = addMonths(focused, 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (compact) return;
        if (ctx.isDayEnabled(focused)) {
          ctx.selectSlot({ start: focused, end: addDays(focused, 1), allDay: true });
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    moveFocus(next, step);
  };

  // ─── Arrastrar eventos entre días ─────────────────────────────────
  const canDrag = (occ: CnEventOccurrence) => ctx.editable && occ.event.editable !== false;

  const onBarPointerDown =
    (occ: CnEventOccurrence, day: Date) => (e: PointerEvent<HTMLElement>) => {
      if (!canDrag(occ) || e.button !== 0) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDrag({
        occ,
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        originDay: day,
        moved: false,
        target: null,
      });
    };
  const onBarPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const moved = drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4;
    if (!moved) return;
    const target = dayFromPoint(e.clientX, e.clientY);
    setDrag({ ...drag, moved, target: target ?? drag.target });
  };
  const onBarPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { occ, moved, target, originDay } = drag;
    setDrag(null);
    if (!moved) return;
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
    if (!target || !ctx.isDayEnabled(target)) return;
    const delta = diffDays(target, originDay);
    if (delta === 0) return;
    ctx.changeEvent({
      event: occ.event,
      occurrence: occ,
      start: shiftDays(occ.start, delta),
      end: shiftDays(occ.end, delta),
      allDay: occ.allDay,
      kind: "move",
      via: "pointer",
    });
  };

  const openEvent = (occ: CnEventOccurrence) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (suppressClick.current) return;
    ctx.openEvent(occ, e.currentTarget);
  };

  const dayLabel = (day: Date, count: number) => {
    const holiday = holidays.get(toIsoDate(day));
    return [
      formatDayLong(day, locale),
      isSameDay(day, now) ? "hoy" : null,
      count ? `${count} ${count === 1 ? "evento" : "eventos"}` : "sin eventos",
      holiday ? holiday.label : null,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const cellProps = (day: Date, count: number) => {
    const iso = toIsoDate(day);
    const disabled = isOutOfBounds(day, minDate, maxDate);
    return {
      role: "gridcell",
      "data-cn-date": iso,
      tabIndex: isSameDay(day, focused) ? 0 : -1,
      "aria-label": dayLabel(day, count),
      "aria-selected": compact ? isSameDay(day, focused) : undefined,
      "aria-disabled": disabled || undefined,
      onFocus: () => {
        focusWithin.current = true;
        if (!isSameDay(day, focused)) setFocused(day);
      },
      onBlur: () => {
        focusWithin.current = false;
      },
    };
  };

  const dayNumber = (day: Date, inMonth: boolean, clickable: boolean) => {
    const today = isSameDay(day, now);
    return (
      <Box
        component={clickable ? "button" : "span"}
        type={clickable ? "button" : undefined}
        tabIndex={-1}
        aria-hidden
        onClick={
          clickable
            ? (e: MouseEvent) => {
                e.stopPropagation();
                ctx.goToDay(day);
              }
            : undefined
        }
        sx={{
          all: "unset",
          minWidth: 24,
          height: 24,
          px: "4px",
          boxSizing: "border-box",
          borderRadius: "999px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.78rem",
          fontWeight: today ? 700 : 600,
          fontVariantNumeric: "tabular-nums",
          cursor: clickable ? "pointer" : "inherit",
          color: today
            ? "var(--cn-color-neutral-0, #fff)"
            : inMonth
              ? "var(--cn-color-text, #222831)"
              : "var(--cn-color-text-subtle, #9aa1aa)",
          backgroundColor: today ? "var(--cn-color-brand-600, #254d87)" : "transparent",
          "&:hover":
            clickable && !today
              ? { backgroundColor: "var(--cn-color-hover, rgba(0,0,0,0.04))" }
              : undefined,
        }}
      >
        {day.getDate()}
      </Box>
    );
  };

  const cellBackground = (day: Date, inMonth: boolean) => {
    const holiday = holidays.get(toIsoDate(day));
    if (holiday?.blocked) {
      return {
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent 0 6px, rgba(110,118,130,0.08) 6px 12px)",
      };
    }
    if (holiday) return { backgroundColor: alpha(resolveColor(holiday.color, "#e0a020"), 0.07) };
    if (monthHeatmap && counts) {
      const level = heatLevel(counts.get(toIsoDate(day)) ?? 0, maxCount);
      if (level > 0) return { backgroundColor: MONTH_HEAT_BG[level] };
    }
    if (!inMonth) return { backgroundColor: "var(--cn-color-neutral-50, #fafbfc)" };
    return {};
  };

  const capacityBadge = (day: Date): ReactNode => {
    const capacity = dayCapacity?.(day);
    if (!capacity || !counts) return null;
    const count = counts.get(toIsoDate(day)) ?? 0;
    const tone = capacityTone(count, capacity);
    return (
      <Box
        component="span"
        data-cn-capacity={`${count}/${capacity}`}
        title={`${count} de ${capacity} lugares ocupados`}
        sx={{
          ml: "auto",
          flexShrink: 0,
          px: "6px",
          height: 18,
          lineHeight: "18px",
          borderRadius: "999px",
          fontSize: "0.66rem",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          backgroundColor: tone.bg,
          color: tone.fg,
        }}
      >
        {count}/{capacity}
      </Box>
    );
  };

  const weekNumberCell = (weekStartDay: Date, height?: number) =>
    showWeekNumbers ? (
      <Box
        data-cn-week-number
        aria-label={`Semana ${isoWeek(addDays(weekStartDay, 3))}`}
        sx={{
          width: WEEK_NUMBER_W,
          flexShrink: 0,
          pt: "8px",
          textAlign: "center",
          fontSize: "0.64rem",
          fontWeight: 700,
          color: "var(--cn-color-text-subtle, #9aa1aa)",
          borderRight: "1px solid var(--cn-color-border, #dde0e4)",
          minHeight: height,
          boxSizing: "border-box",
        }}
      >
        {isoWeek(addDays(weekStartDay, 3))}
      </Box>
    ) : null;

  const withWeekNumber = (weekStartDay: Date, row: ReactNode, height?: number) =>
    showWeekNumbers ? (
      <Box key={weekStartDay.getTime()} sx={{ display: "flex" }}>
        {weekNumberCell(weekStartDay, height)}
        <Box sx={{ flex: 1, minWidth: 0 }}>{row}</Box>
      </Box>
    ) : (
      row
    );

  const header = (
    <Box sx={{ display: "flex" }}>
      {showWeekNumbers && (
        <Box
          aria-hidden
          sx={{
            width: WEEK_NUMBER_W,
            flexShrink: 0,
            borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
            borderRight: "1px solid var(--cn-color-border, #dde0e4)",
            fontSize: "0.62rem",
            fontWeight: 700,
            color: "var(--cn-color-text-subtle, #9aa1aa)",
            display: "grid",
            placeItems: "center",
          }}
        >
          S
        </Box>
      )}
      <Box role="row" sx={{ flex: 1, display: "grid", gridTemplateColumns: gridColumns }}>
        {weekdays
          .filter((_, i) => visibleCols[i])
          .map((d) => (
            <Box
              key={d.getDay()}
              role="columnheader"
              aria-label={weekdayName(d, locale, "long")}
              sx={{
                py: "8px",
                textAlign: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--cn-color-text-muted, #6e7682)",
                borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
              }}
            >
              {compact
                ? weekdayName(d, locale, "short").charAt(0)
                : weekdayName(d, locale, "short")}
            </Box>
          ))}
      </Box>
    </Box>
  );

  // ─── Modo compacto (puntos + lista del día) ─────────────────────────
  if (compact) {
    const dayEvents = occurrences.filter((o) => occursOnDay(o, focused));
    return (
      <Box data-cn-event-calendar-view="month" data-compact>
        <Box ref={gridRef} role="grid" aria-label="Mes" onKeyDown={onGridKeyDown}>
          {header}
          {weeks.map((weekStartDay) =>
            withWeekNumber(
              weekStartDay,
              <Box
                key={weekStartDay.getTime()}
                role="row"
                sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
              >
                {Array.from({ length: 7 }, (_, i) => {
                  const day = addDays(weekStartDay, i);
                  const inMonth = day.getMonth() === date.getMonth();
                  const list = occurrences.filter((o) => occursOnDay(o, day));
                  const selected = isSameDay(day, focused);
                  return (
                    <Box
                      key={i}
                      {...cellProps(day, list.length)}
                      onClick={() => setFocused(day)}
                      sx={{
                        height: 44,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "3px",
                        cursor: "pointer",
                        borderRadius: "10px",
                        outline: "none",
                        opacity: isOutOfBounds(day, minDate, maxDate) ? 0.4 : 1,
                        ...cellBackground(day, inMonth),
                        ...(selected && {
                          boxShadow: "inset 0 0 0 2px var(--cn-color-brand-500, #3562a6)",
                        }),
                        "&:focus-visible": {
                          boxShadow: "inset 0 0 0 2px var(--cn-color-accent-500, #3d5afe)",
                        },
                      }}
                    >
                      {dayNumber(day, inMonth, false)}
                      <Box sx={{ display: "flex", gap: "2px", height: 5 }}>
                        {list.slice(0, 3).map((o) => (
                          <Box
                            key={o.key}
                            sx={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              backgroundColor: o.color,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>,
            ),
          )}
        </Box>
        <Box
          sx={{ mt: "12px", pt: "12px", borderTop: "1px solid var(--cn-color-border, #eceef1)" }}
        >
          <Box sx={{ fontSize: "0.8rem", fontWeight: 700, mb: "8px" }}>
            {formatDayLong(focused, locale)}
          </Box>
          {dayEvents.length === 0 ? (
            <Box
              sx={{ fontSize: "0.8rem", color: "var(--cn-color-text-muted, #6e7682)", py: "8px" }}
            >
              Sin eventos este día
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {dayEvents.map((o) => (
                <EventListItem key={o.key} occurrence={o} day={focused} dense />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // ─── Mes completo ───────────────────────────────────────────────────
  const footerH = renderDayCell ? 22 : 0;
  const rowMinHeight = HEADER_H + maxEventsPerDay * laneH + MORE_H + footerH;

  return (
    <Box
      ref={gridRef}
      role="grid"
      aria-label="Mes"
      data-cn-event-calendar-view="month"
      data-cn-density={density}
      onKeyDown={onGridKeyDown}
      sx={{ userSelect: drag?.moved ? "none" : undefined }}
    >
      {header}
      {weeks.map((weekStartDay, w) => {
        const segments = layoutSegments(occurrences, weekStartDay, 7);
        const { visible, hidden } = limitSegments(segments, 7, maxEventsPerDay);
        const row = (
          <Box
            key={weekStartDay.getTime()}
            role="row"
            data-cn-month-week
            sx={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: gridColumns,
              minHeight: rowMinHeight,
              borderBottom:
                w === weeks.length - 1 ? 0 : "1px solid var(--cn-color-border, #dde0e4)",
            }}
          >
            {Array.from({ length: 7 }, (_, i) => {
              if (!visibleCols[i]) return null;
              const day = addDays(weekStartDay, i);
              const inMonth = day.getMonth() === date.getMonth();
              const holiday = holidays.get(toIsoDate(day));
              const count = segments.filter(
                (s) => i >= s.startCol && i < s.startCol + s.span,
              ).length;
              const enabled = ctx.isDayEnabled(day);
              const isDropTarget = drag?.moved && drag.target && isSameDay(drag.target, day);
              const lastVisible = visibleCols.lastIndexOf(true) === i;
              return (
                <Box
                  key={i}
                  {...cellProps(day, count)}
                  onClick={() => {
                    if (suppressClick.current || !enabled) return;
                    ctx.selectSlot({ start: day, end: addDays(day, 1), allDay: true });
                  }}
                  sx={{
                    position: "relative",
                    minWidth: 0,
                    p: "4px",
                    borderRight: lastVisible ? 0 : "1px solid var(--cn-color-border, #dde0e4)",
                    cursor: enabled ? "pointer" : "not-allowed",
                    outline: "none",
                    opacity: isOutOfBounds(day, minDate, maxDate) ? 0.45 : 1,
                    ...cellBackground(day, inMonth),
                    ...(isDropTarget && { backgroundColor: "rgba(61, 90, 254, 0.08)" }),
                    "&:focus-visible": {
                      boxShadow: "inset 0 0 0 2px var(--cn-color-accent-500, #3d5afe)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      height: HEADER_H - 6,
                      minWidth: 0,
                    }}
                  >
                    {dayNumber(day, inMonth, true)}
                    {holiday && (
                      <Box
                        component="span"
                        data-cn-holiday
                        title={holiday.label}
                        sx={{
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          color: holiday.blocked
                            ? "var(--cn-color-text-muted, #6e7682)"
                            : resolveColor(holiday.color, "#b8831a"),
                        }}
                      >
                        {holiday.label}
                      </Box>
                    )}
                    {capacityBadge(day)}
                  </Box>
                  {hidden[i] > 0 && (
                    <Box
                      component="button"
                      type="button"
                      data-cn-more
                      tabIndex={-1}
                      onClick={(e: MouseEvent<HTMLElement>) => {
                        e.stopPropagation();
                        ctx.openDayList(day, e.currentTarget);
                      }}
                      sx={{
                        all: "unset",
                        position: "absolute",
                        left: 6,
                        right: 6,
                        top: HEADER_H + Math.max(0, maxEventsPerDay - 1) * laneH + 1,
                        height: MORE_H - 2,
                        px: "6px",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        color: "var(--cn-color-text-muted, #6e7682)",
                        "&:hover": {
                          backgroundColor: "var(--cn-color-hover, rgba(0,0,0,0.04))",
                          color: "var(--cn-color-text, #222831)",
                        },
                      }}
                    >
                      +{hidden[i]} más
                    </Box>
                  )}
                  {renderDayCell && (
                    <Box
                      data-cn-day-cell-slot
                      onClick={(e: MouseEvent) => e.stopPropagation()}
                      sx={{
                        position: "absolute",
                        left: 4,
                        right: 4,
                        bottom: 3,
                        height: footerH - 4,
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                        fontSize: "0.68rem",
                      }}
                    >
                      {renderDayCell(day, {
                        view: "month",
                        inMonth,
                        occurrences: occurrences.filter((o) => occursOnDay(o, day)),
                      })}
                    </Box>
                  )}
                </Box>
              );
            })}

            {visible.map((seg) => {
              const width = visibleIn(seg.startCol, seg.span);
              if (width === 0) return null;
              const occ = seg.item;
              const longBar =
                occ.allDay || diffDays(new Date(occ.end.getTime() - 1), occ.start) > 0;
              const bar =
                eventDisplay === "block" ? true : eventDisplay === "dot" ? false : longBar;
              const dragging = drag?.moved && drag.occ.key === occ.key;
              const day = addDays(weekStartDay, seg.startCol);
              const left = visibleBefore(seg.startCol);
              const occConflicts = conflicts.get(occ.key) ?? [];
              return (
                <Box
                  key={`${occ.key}-${seg.startCol}`}
                  component="button"
                  type="button"
                  data-cn-event={occ.event.id}
                  data-cn-occurrence={occ.key}
                  tabIndex={-1}
                  aria-label={`${occ.event.title}, ${occ.allDay ? "todo el día" : formatTime(occ.start)}`}
                  onClick={openEvent(occ)}
                  onPointerDown={onBarPointerDown(occ, day)}
                  onPointerMove={onBarPointerMove}
                  onPointerUp={onBarPointerUp}
                  onPointerCancel={() => setDrag(null)}
                  sx={{
                    all: "unset",
                    boxSizing: "border-box",
                    position: "absolute",
                    top: HEADER_H + seg.lane * laneH,
                    left: `calc(${(left / colCount) * 100}% + ${seg.isStart ? 4 : 0}px)`,
                    width: `calc(${(width / colCount) * 100}% - ${(seg.isStart ? 4 : 0) + (seg.isEnd ? 4 : 0)}px)`,
                    height: laneH - 3,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    px: "6px",
                    fontSize: density === "comfortable" ? "0.76rem" : "0.72rem",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    cursor: canDrag(occ) ? "grab" : "pointer",
                    touchAction: canDrag(occ) ? "none" : undefined,
                    opacity: dragging ? 0.5 : occ.event.status === "cancelled" ? 0.6 : 1,
                    borderTopLeftRadius: seg.isStart ? 5 : 0,
                    borderBottomLeftRadius: seg.isStart ? 5 : 0,
                    borderTopRightRadius: seg.isEnd ? 5 : 0,
                    borderBottomRightRadius: seg.isEnd ? 5 : 0,
                    ...(bar
                      ? {
                          backgroundColor: occ.color,
                          color: "#fff",
                          fontWeight: 600,
                          "&:hover": { filter: "brightness(0.94)" },
                        }
                      : {
                          color: "var(--cn-color-text, #222831)",
                          "&:hover": { backgroundColor: alpha(occ.color, 0.12) },
                        }),
                    ...conflictRing(occConflicts),
                    textDecoration: occ.event.status === "cancelled" ? "line-through" : undefined,
                    "&:focus-visible": {
                      outline: "2px solid var(--cn-color-accent-500, #3d5afe)",
                      outlineOffset: 1,
                    },
                  }}
                >
                  {renderEvent ? (
                    renderEvent(occ, { view: "month", compact: true, conflicts: occConflicts })
                  ) : (
                    <>
                      {!bar && (
                        <Box
                          component="span"
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            flexShrink: 0,
                            backgroundColor: occ.color,
                          }}
                        />
                      )}
                      {!occ.allDay && (!bar || !longBar) && (
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                            color: bar ? "inherit" : "var(--cn-color-text-muted, #6e7682)",
                            opacity: bar ? 0.85 : 1,
                          }}
                        >
                          {formatTime(occ.start)}
                        </Box>
                      )}
                      <Box
                        component="span"
                        sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {occ.event.title}
                      </Box>
                      <EventBadges
                        occurrence={occ}
                        conflicts={occConflicts}
                        size={11}
                        inverse={bar}
                      />
                    </>
                  )}
                </Box>
              );
            })}
          </Box>
        );
        return withWeekNumber(weekStartDay, row, rowMinHeight);
      })}
    </Box>
  );
};
