import Box from "@mui/material/Box";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCalendarContext } from "../calendar-context";
import {
  addDays,
  addMonths,
  alpha,
  diffDays,
  formatDayLong,
  formatTime,
  isOutOfBounds,
  isSameDay,
  occursOnDay,
  resolveColor,
  startOfDay,
  startOfWeek,
  toIsoDate,
  weekdayName,
} from "../calendar-utils";
import type { CnCalendarDateRange, CnEventOccurrence } from "../CnEventCalendar.types";
import { layoutSegments, limitSegments } from "../event-layout";
import { EventListItem } from "./AgendaView";

const HEADER_H = 30;
const LANE_H = 22;
const MORE_H = 20;

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
  const { locale, weekStart, now, holidays, minDate, maxDate } = ctx;
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

  const moveFocus = (next: Date) => {
    setFocused(next);
    if (next.getMonth() !== date.getMonth() || next.getFullYear() !== date.getFullYear()) {
      onNavigate(next);
    }
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.dataset.cnDate) return;
    let next: Date | null = null;
    switch (event.key) {
      case "ArrowRight":
        next = addDays(focused, 1);
        break;
      case "ArrowLeft":
        next = addDays(focused, -1);
        break;
      case "ArrowDown":
        next = addDays(focused, 7);
        break;
      case "ArrowUp":
        next = addDays(focused, -7);
        break;
      case "Home":
        next = startOfWeek(focused, weekStart);
        break;
      case "End":
        next = addDays(startOfWeek(focused, weekStart), 6);
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
    moveFocus(next);
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
      start: shift(occ.start, delta),
      end: shift(occ.end, delta),
      allDay: occ.allDay,
      kind: "move",
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
    if (!inMonth) return { backgroundColor: "var(--cn-color-neutral-50, #fafbfc)" };
    return {};
  };

  const header = (
    <Box role="row" sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
      {weekdays.map((d) => (
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
          {compact ? weekdayName(d, locale, "short").charAt(0) : weekdayName(d, locale, "short")}
        </Box>
      ))}
    </Box>
  );

  // ─── Modo compacto (puntos + lista del día) ─────────────────────────
  if (compact) {
    const dayEvents = occurrences.filter((o) => occursOnDay(o, focused));
    return (
      <Box data-cn-event-calendar-view="month" data-compact>
        <Box ref={gridRef} role="grid" aria-label="Mes" onKeyDown={onGridKeyDown}>
          {header}
          {weeks.map((weekStartDay) => (
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
            </Box>
          ))}
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
  const rowMinHeight = HEADER_H + maxEventsPerDay * LANE_H + MORE_H;

  return (
    <Box
      ref={gridRef}
      role="grid"
      aria-label="Mes"
      data-cn-event-calendar-view="month"
      onKeyDown={onGridKeyDown}
      sx={{ userSelect: drag?.moved ? "none" : undefined }}
    >
      {header}
      {weeks.map((weekStartDay) => {
        const segments = layoutSegments(occurrences, weekStartDay, 7);
        const { visible, hidden } = limitSegments(segments, 7, maxEventsPerDay);
        return (
          <Box
            key={weekStartDay.getTime()}
            role="row"
            data-cn-month-week
            sx={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              minHeight: rowMinHeight,
              borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
              "&:last-of-type": { borderBottom: 0 },
            }}
          >
            {Array.from({ length: 7 }, (_, i) => {
              const day = addDays(weekStartDay, i);
              const inMonth = day.getMonth() === date.getMonth();
              const holiday = holidays.get(toIsoDate(day));
              const count = segments.filter(
                (s) => i >= s.startCol && i < s.startCol + s.span,
              ).length;
              const enabled = ctx.isDayEnabled(day);
              const isDropTarget = drag?.moved && drag.target && isSameDay(drag.target, day);
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
                    borderRight: "1px solid var(--cn-color-border, #dde0e4)",
                    "&:last-of-type": { borderRight: 0 },
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
                        top: HEADER_H + Math.max(0, maxEventsPerDay - 1) * LANE_H + 1,
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
                </Box>
              );
            })}

            {visible.map((seg) => {
              const occ = seg.item;
              const bar = occ.allDay || diffDays(new Date(occ.end.getTime() - 1), occ.start) > 0;
              const dragging = drag?.moved && drag.occ.key === occ.key;
              const day = addDays(weekStartDay, seg.startCol);
              return (
                <Box
                  key={`${occ.key}-${seg.startCol}`}
                  component="button"
                  type="button"
                  data-cn-event={occ.event.id}
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
                    top: HEADER_H + seg.lane * LANE_H,
                    left: `calc(${(seg.startCol / 7) * 100}% + ${seg.isStart ? 4 : 0}px)`,
                    width: `calc(${(seg.span / 7) * 100}% - ${(seg.isStart ? 4 : 0) + (seg.isEnd ? 4 : 0)}px)`,
                    height: LANE_H - 3,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    px: "6px",
                    fontSize: "0.72rem",
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
                    textDecoration: occ.event.status === "cancelled" ? "line-through" : undefined,
                    "&:focus-visible": {
                      outline: "2px solid var(--cn-color-accent-500, #3d5afe)",
                      outlineOffset: 1,
                    },
                  }}
                >
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
                  {!bar && (
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--cn-color-text-muted, #6e7682)",
                      }}
                    >
                      {formatTime(occ.start)}
                    </Box>
                  )}
                  <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {occ.event.title}
                  </Box>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};

/** Desplaza una fecha `days` días conservando la hora local. */
const shift = (date: Date, days: number): Date =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  );
