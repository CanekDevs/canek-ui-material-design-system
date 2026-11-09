import Box from "@mui/material/Box";
import type { MouseEvent, PointerEvent } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useCalendarContext } from "../calendar-context";
import {
  addDays,
  addMinutes,
  alpha,
  DAY_MS,
  diffDays,
  formatDayLong,
  formatHour,
  formatTime,
  isOutOfBounds,
  isSameDay,
  minutesOfDay,
  resolveColor,
  toIsoDate,
  weekdayName,
} from "../calendar-utils";
import type { CnEventOccurrence } from "../CnEventCalendar.types";
import { layoutSegments, layoutTimedEvents } from "../event-layout";

const GUTTER = 56;
const ALL_DAY_LANE = 22;

export type TimeGridViewProps = {
  view: "week" | "day";
  days: Date[];
  occurrences: CnEventOccurrence[];
  /** Alto máximo del área desplazable. */
  height?: number;
};

/** ¿Va en la franja "Todo el día"? (todo el día o 24 h o más). */
export const isAllDayRowEvent = (occ: Pick<CnEventOccurrence, "allDay" | "start" | "end">) =>
  occ.allDay || occ.end.getTime() - occ.start.getTime() >= DAY_MS;

type DragState = {
  occ: CnEventOccurrence;
  mode: "move" | "resize";
  pointerId: number;
  x: number;
  y: number;
  dayIndex: number;
  moved: boolean;
  start: Date;
  end: Date;
};

type SelectState = { pointerId: number; dayIndex: number; from: number; to: number };

const atMinutes = (day: Date, minutes: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);

/** Vista de semana o día: franja de todo el día y rejilla horaria con eventos acomodados. */
export const TimeGridView = ({ view, days, occurrences, height = 640 }: TimeGridViewProps) => {
  const ctx = useCalendarContext();
  const {
    locale,
    now,
    holidays,
    minDate,
    maxDate,
    minHour,
    maxHour,
    hourHeight,
    slotDuration,
    workingHours,
    showNowIndicator,
  } = ctx;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const columnsRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selection, setSelection] = useState<SelectState | null>(null);
  const suppressClick = useRef(false);

  const pxPerMin = hourHeight / 60;
  const gridStart = minHour * 60;
  const gridEnd = maxHour * 60;
  const totalHeight = (gridEnd - gridStart) * pxPerMin;
  const slotPx = slotDuration * pxPerMin;
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);
  const columnsTemplate = `repeat(${days.length}, minmax(0, 1fr))`;

  // Desplaza la rejilla a la hora de interés al montar o cambiar de vista.
  const firstDayKey = days[0]?.getTime();
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const showsToday = days.some((d) => isSameDay(d, now));
    const hour = ctx.scrollToHour ?? (showsToday ? Math.max(minHour, now.getHours() - 1) : 8);
    el.scrollTop = Math.max(0, (hour - minHour) * hourHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstDayKey, view]);

  const displayed = useMemo(
    () =>
      drag?.moved
        ? occurrences.map((o) =>
            o.key === drag.occ.key ? { ...o, start: drag.start, end: drag.end } : o,
          )
        : occurrences,
    [occurrences, drag],
  );
  const allDayItems = displayed.filter(isAllDayRowEvent);
  const timedItems = displayed.filter((o) => !isAllDayRowEvent(o));
  const allDaySegments = useMemo(
    () =>
      days.length
        ? layoutSegments(allDayItems, days[0], diffDays(days[days.length - 1], days[0]) + 1)
        : [],
    [allDayItems, days],
  );
  // Si se ocultan fines de semana, las columnas no son consecutivas: se mapea por fecha.
  const colOfOffset = (offset: number) => days.findIndex((d) => diffDays(d, days[0]) === offset);

  const canDrag = (occ: CnEventOccurrence) => ctx.editable && occ.event.editable !== false;

  const dayIndexAt = (clientX: number): number => {
    const rect = columnsRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return -1;
    const idx = Math.floor(((clientX - rect.left) / rect.width) * days.length);
    return Math.min(days.length - 1, Math.max(0, idx));
  };

  // ─── Mover / redimensionar ──────────────────────────────────────────
  const onEventPointerDown =
    (occ: CnEventOccurrence, dayIndex: number) => (e: PointerEvent<HTMLElement>) => {
      if (!canDrag(occ) || e.button !== 0) return;
      e.stopPropagation();
      const mode = (e.target as HTMLElement).closest("[data-cn-resize]") ? "resize" : "move";
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDrag({
        occ,
        mode,
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        dayIndex,
        moved: false,
        start: occ.start,
        end: occ.end,
      });
    };

  const onEventPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const moved = drag.moved || Math.abs(dx) > 3 || Math.abs(dy) > 3;
    if (!moved) return;
    const deltaMin = Math.round(dy / pxPerMin / slotDuration) * slotDuration;
    const { occ } = drag;
    if (drag.mode === "resize") {
      const end = addMinutes(occ.end, deltaMin);
      const minEnd = addMinutes(occ.start, slotDuration);
      setDrag({ ...drag, moved, end: end < minEnd ? minEnd : end });
      return;
    }
    const idx = dayIndexAt(e.clientX);
    const dayDelta = idx >= 0 ? diffDays(days[idx], days[drag.dayIndex]) : 0;
    const shifted = new Date(occ.start);
    shifted.setDate(shifted.getDate() + dayDelta);
    const start = addMinutes(shifted, deltaMin);
    setDrag({
      ...drag,
      moved,
      start,
      end: new Date(start.getTime() + (occ.end.getTime() - occ.start.getTime())),
    });
  };

  const onEventPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const current = drag;
    setDrag(null);
    if (!current.moved) return;
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
    const { occ, start, end, mode } = current;
    if (start.getTime() === occ.start.getTime() && end.getTime() === occ.end.getTime()) return;
    if (!ctx.isDayEnabled(start)) return;
    ctx.changeEvent({ event: occ.event, occurrence: occ, start, end, allDay: false, kind: mode });
  };

  const openEvent = (occ: CnEventOccurrence) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (suppressClick.current) return;
    ctx.openEvent(occ, e.currentTarget);
  };

  // ─── Seleccionar horario ────────────────────────────────────────────
  const slotAt = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const max = Math.ceil((gridEnd - gridStart) / slotDuration) - 1;
    return Math.min(max, Math.max(0, Math.floor(y / slotPx)));
  };

  const onColumnPointerDown = (dayIndex: number) => (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || drag) return;
    if ((e.target as HTMLElement).closest("[data-cn-event]")) return;
    if (!ctx.isDayEnabled(days[dayIndex])) return;
    const slot = slotAt(e);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setSelection({ pointerId: e.pointerId, dayIndex, from: slot, to: slot });
  };
  const onColumnPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!selection || e.pointerId !== selection.pointerId || !ctx.selectable) return;
    const to = slotAt(e);
    if (to !== selection.to) setSelection({ ...selection, to });
  };
  const onColumnPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (!selection || e.pointerId !== selection.pointerId) return;
    const { dayIndex, from, to } = selection;
    setSelection(null);
    const first = Math.min(from, to);
    const last = Math.max(from, to);
    const start = atMinutes(days[dayIndex], gridStart + first * slotDuration);
    const end = atMinutes(days[dayIndex], Math.min(gridEnd, gridStart + (last + 1) * slotDuration));
    ctx.selectSlot({ start, end, allDay: false });
  };

  // ─── Render ─────────────────────────────────────────────────────────
  const dayHeader = (day: Date) => {
    const today = isSameDay(day, now);
    const holiday = holidays.get(toIsoDate(day));
    return (
      <Box
        key={day.getTime()}
        role="columnheader"
        aria-label={`${formatDayLong(day, locale)}${holiday ? `, ${holiday.label}` : ""}`}
        sx={{
          minWidth: 0,
          py: "6px",
          textAlign: "center",
          borderLeft: "1px solid var(--cn-color-border, #dde0e4)",
        }}
      >
        <Box
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: today
              ? "var(--cn-color-brand-600, #254d87)"
              : "var(--cn-color-text-muted, #6e7682)",
          }}
        >
          {weekdayName(day, locale)}
        </Box>
        <Box
          component={view === "week" ? "button" : "span"}
          type={view === "week" ? "button" : undefined}
          aria-label={view === "week" ? `Ver ${formatDayLong(day, locale)}` : undefined}
          onClick={view === "week" ? () => ctx.goToDay(day) : undefined}
          sx={{
            all: "unset",
            cursor: view === "week" ? "pointer" : "default",
            mt: "2px",
            mx: "auto",
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: "1.05rem",
            fontWeight: 700,
            color: today ? "#fff" : "var(--cn-color-text, #222831)",
            backgroundColor: today ? "var(--cn-color-brand-600, #254d87)" : "transparent",
            "&:hover":
              view === "week" && !today
                ? { backgroundColor: "var(--cn-color-hover, rgba(0,0,0,0.04))" }
                : undefined,
            "&:focus-visible": { outline: "2px solid var(--cn-color-accent-500, #3d5afe)" },
          }}
        >
          {day.getDate()}
        </Box>
        {holiday && (
          <Box
            data-cn-holiday
            title={holiday.label}
            sx={{
              mt: "2px",
              px: "4px",
              fontSize: "0.66rem",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: resolveColor(holiday.color, "#b8831a"),
            }}
          >
            {holiday.label}
          </Box>
        )}
      </Box>
    );
  };

  const allDayLanes = allDaySegments.reduce((acc, s) => Math.max(acc, s.lane + 1), 0);

  const shading = (day: Date) => {
    const holiday = holidays.get(toIsoDate(day));
    const disabled = isOutOfBounds(day, minDate, maxDate);
    const hatch =
      "repeating-linear-gradient(135deg, transparent 0 6px, rgba(110,118,130,0.08) 6px 12px)";
    if (holiday?.blocked || disabled) {
      return [
        <Box
          key="b"
          data-cn-blocked
          sx={{ position: "absolute", inset: 0, backgroundImage: hatch }}
        />,
      ];
    }
    if (!workingHours) return [];
    const workDays = workingHours.days ?? [1, 2, 3, 4, 5];
    const off = "var(--cn-color-neutral-50, #fafbfc)";
    if (!workDays.includes(day.getDay() as never)) {
      return [
        <Box
          key="o"
          data-cn-offhours
          sx={{ position: "absolute", inset: 0, backgroundColor: off }}
        />,
      ];
    }
    const blocks: [number, number][] = [
      [gridStart, Math.min(gridEnd, workingHours.start * 60)],
      [Math.max(gridStart, workingHours.end * 60), gridEnd],
    ];
    return blocks
      .filter(([a, b]) => b > a)
      .map(([a, b]) => (
        <Box
          key={a}
          data-cn-offhours
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            top: (a - gridStart) * pxPerMin,
            height: (b - a) * pxPerMin,
            backgroundColor: off,
          }}
        />
      ));
  };

  return (
    <Box
      data-cn-event-calendar-view={view}
      role="grid"
      aria-label={view === "week" ? "Semana" : "Día"}
    >
      {/* Encabezados de día */}
      <Box
        role="row"
        sx={{
          display: "grid",
          gridTemplateColumns: `${GUTTER}px minmax(0, 1fr)`,
          borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
          overflowY: "hidden",
          scrollbarGutter: "stable",
        }}
      >
        <Box />
        <Box sx={{ display: "grid", gridTemplateColumns: columnsTemplate }}>
          {days.map(dayHeader)}
        </Box>
      </Box>

      {/* Todo el día */}
      <Box
        role="row"
        data-cn-all-day-row
        sx={{
          display: "grid",
          gridTemplateColumns: `${GUTTER}px minmax(0, 1fr)`,
          borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
          overflowY: "hidden",
          scrollbarGutter: "stable",
        }}
      >
        <Box
          sx={{
            fontSize: "0.66rem",
            color: "var(--cn-color-text-muted, #6e7682)",
            textAlign: "right",
            pr: "8px",
            pt: "6px",
          }}
        >
          Todo el día
        </Box>
        <Box
          sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: columnsTemplate,
            minHeight: Math.max(1, allDayLanes) * ALL_DAY_LANE + 8,
          }}
        >
          {days.map((day) => (
            <Box
              key={day.getTime()}
              role="gridcell"
              aria-label={`Todo el día, ${formatDayLong(day, locale)}`}
              onClick={() => {
                if (ctx.isDayEnabled(day))
                  ctx.selectSlot({ start: day, end: addDays(day, 1), allDay: true });
              }}
              sx={{ borderLeft: "1px solid var(--cn-color-border, #dde0e4)", cursor: "pointer" }}
            />
          ))}
          {allDaySegments.map((seg) => {
            const firstCol = colOfOffset(seg.startCol);
            const lastCol = colOfOffset(seg.startCol + seg.span - 1);
            // Con fines de semana ocultos se busca la columna visible más cercana.
            const startIdx =
              firstCol >= 0 ? firstCol : days.findIndex((d) => diffDays(d, days[0]) > seg.startCol);
            const endIdx =
              lastCol >= 0
                ? lastCol
                : days.length -
                  1 -
                  [...days]
                    .reverse()
                    .findIndex((d) => diffDays(d, days[0]) < seg.startCol + seg.span - 1);
            if (startIdx < 0 || endIdx < startIdx || endIdx >= days.length) return null;
            const occ = seg.item;
            return (
              <Box
                key={occ.key}
                component="button"
                type="button"
                data-cn-event={occ.event.id}
                aria-label={`${occ.event.title}, todo el día`}
                onClick={openEvent(occ)}
                sx={{
                  all: "unset",
                  boxSizing: "border-box",
                  position: "absolute",
                  top: 4 + seg.lane * ALL_DAY_LANE,
                  left: `calc(${(startIdx / days.length) * 100}% + 3px)`,
                  width: `calc(${((endIdx - startIdx + 1) / days.length) * 100}% - 6px)`,
                  height: ALL_DAY_LANE - 3,
                  px: "6px",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "5px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "#fff",
                  backgroundColor: occ.color,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  "&:focus-visible": {
                    outline: "2px solid var(--cn-color-accent-500, #3d5afe)",
                    outlineOffset: 1,
                  },
                }}
              >
                {occ.event.title}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Rejilla horaria */}
      <Box
        ref={scrollRef}
        data-cn-time-grid
        sx={{
          maxHeight: height,
          overflowY: "auto",
          scrollbarGutter: "stable",
          position: "relative",
        }}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: `${GUTTER}px minmax(0, 1fr)` }}>
          <Box sx={{ position: "relative", height: totalHeight }} aria-hidden>
            {hours.map((h, i) => (
              <Box
                key={h}
                sx={{
                  position: "absolute",
                  top: i * hourHeight - 7,
                  right: 8,
                  fontSize: "0.68rem",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--cn-color-text-muted, #6e7682)",
                  display: i === 0 ? "none" : "block",
                }}
              >
                {formatHour(h)}
              </Box>
            ))}
          </Box>
          <Box
            ref={columnsRef}
            role="row"
            sx={{
              display: "grid",
              gridTemplateColumns: columnsTemplate,
              position: "relative",
              userSelect: drag?.moved || selection ? "none" : undefined,
            }}
          >
            {days.map((day, dayIndex) => {
              const dayStart = atMinutes(day, gridStart);
              const dayEnd = atMinutes(day, gridEnd);
              const items = timedItems
                .filter((o) => o.start < dayEnd && o.end > dayStart)
                .map((o) => ({
                  occ: o,
                  start: o.start < dayStart ? dayStart : o.start,
                  end: o.end > dayEnd ? dayEnd : o.end,
                }));
              const layout = layoutTimedEvents(items);
              const showsNow =
                showNowIndicator &&
                isSameDay(day, now) &&
                minutesOfDay(now) >= gridStart &&
                minutesOfDay(now) < gridEnd;
              const sel = selection && selection.dayIndex === dayIndex ? selection : null;
              return (
                <Box
                  key={day.getTime()}
                  role="gridcell"
                  data-cn-day-column={toIsoDate(day)}
                  aria-label={formatDayLong(day, locale)}
                  onPointerDown={onColumnPointerDown(dayIndex)}
                  onPointerMove={onColumnPointerMove}
                  onPointerUp={onColumnPointerUp}
                  onPointerCancel={() => setSelection(null)}
                  sx={{
                    position: "relative",
                    height: totalHeight,
                    borderLeft: "1px solid var(--cn-color-border, #dde0e4)",
                    cursor: ctx.isDayEnabled(day) ? "cell" : "not-allowed",
                    touchAction: ctx.selectable ? "pan-y" : undefined,
                  }}
                >
                  {shading(day)}
                  {/* Líneas de hora y de intervalo */}
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      backgroundImage: `linear-gradient(to bottom, var(--cn-color-border, #dde0e4) 1px, transparent 1px)${
                        slotDuration < 60
                          ? `, linear-gradient(to bottom, var(--cn-color-border-subtle, #eceef1) 1px, transparent 1px)`
                          : ""
                      }`,
                      backgroundSize: `100% ${hourHeight}px${slotDuration < 60 ? `, 100% ${slotPx}px` : ""}`,
                    }}
                  />
                  {sel && (
                    <Box
                      data-cn-selection
                      sx={{
                        position: "absolute",
                        left: 2,
                        right: 2,
                        top: Math.min(sel.from, sel.to) * slotPx,
                        height: (Math.abs(sel.to - sel.from) + 1) * slotPx,
                        borderRadius: "6px",
                        backgroundColor: "rgba(61, 90, 254, 0.14)",
                        border: "1px solid rgba(61, 90, 254, 0.5)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  {layout.map(({ item, column, columns, span }) => {
                    const occ = item.occ;
                    const top = (minutesOfDay(item.start) - gridStart) * pxPerMin;
                    const endMin =
                      item.end.getTime() === dayEnd.getTime() ? gridEnd : minutesOfDay(item.end);
                    const blockHeight = Math.max(
                      18,
                      (endMin - minutesOfDay(item.start)) * pxPerMin - 2,
                    );
                    const draggable = canDrag(occ);
                    const isDragging = drag?.moved && drag.occ.key === occ.key;
                    const compactBlock = blockHeight < 36;
                    return (
                      <Box
                        key={occ.key}
                        component="button"
                        type="button"
                        data-cn-event={occ.event.id}
                        data-cn-column={column}
                        data-cn-columns={columns}
                        aria-label={`${occ.event.title}, ${formatTime(occ.start)} a ${formatTime(occ.end)}`}
                        onClick={openEvent(occ)}
                        onPointerDown={onEventPointerDown(occ, dayIndex)}
                        onPointerMove={onEventPointerMove}
                        onPointerUp={onEventPointerUp}
                        onPointerCancel={() => setDrag(null)}
                        sx={{
                          all: "unset",
                          boxSizing: "border-box",
                          position: "absolute",
                          top: top + 1,
                          height: blockHeight,
                          left: `calc(${(column / columns) * 100}% + 2px)`,
                          width: `calc(${(span / columns) * 100}% - 4px)`,
                          zIndex: isDragging ? 3 : 1,
                          px: "6px",
                          py: compactBlock ? 0 : "3px",
                          display: "flex",
                          flexDirection: compactBlock ? "row" : "column",
                          alignItems: compactBlock ? "center" : "stretch",
                          gap: compactBlock ? "6px" : "1px",
                          overflow: "hidden",
                          borderRadius: "6px",
                          borderLeft: `3px solid ${occ.color}`,
                          backgroundColor: alpha(occ.color, isDragging ? 0.3 : 0.16),
                          boxShadow: isDragging
                            ? "0 8px 20px rgba(17,20,24,0.18)"
                            : "0 0 0 1px var(--cn-color-surface, #fff)",
                          color: "var(--cn-color-text, #222831)",
                          fontSize: "0.72rem",
                          lineHeight: 1.25,
                          cursor: draggable ? (isDragging ? "grabbing" : "grab") : "pointer",
                          touchAction: draggable ? "none" : undefined,
                          opacity: occ.event.status === "cancelled" ? 0.6 : 1,
                          "&:hover": { backgroundColor: alpha(occ.color, 0.24) },
                          "&:focus-visible": {
                            outline: "2px solid var(--cn-color-accent-500, #3d5afe)",
                            outlineOffset: 1,
                          },
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: compactBlock ? "nowrap" : "normal",
                            textDecoration:
                              occ.event.status === "cancelled" ? "line-through" : undefined,
                          }}
                        >
                          {occ.event.title}
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            color: "var(--cn-color-text-muted, #6e7682)",
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatTime(occ.start)} – {formatTime(occ.end)}
                        </Box>
                        {!compactBlock && blockHeight > 60 && occ.event.location && (
                          <Box
                            component="span"
                            sx={{
                              color: "var(--cn-color-text-muted, #6e7682)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {occ.event.location}
                          </Box>
                        )}
                        {draggable && (
                          <Box
                            component="span"
                            data-cn-resize
                            aria-hidden
                            sx={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              bottom: 0,
                              height: 7,
                              cursor: "ns-resize",
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                  {showsNow && (
                    <Box
                      data-cn-now-indicator
                      aria-hidden
                      sx={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: (minutesOfDay(now) - gridStart) * pxPerMin,
                        height: 2,
                        backgroundColor: "var(--cn-color-error-500, #d63c3c)",
                        zIndex: 2,
                        pointerEvents: "none",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: -5,
                          top: -4,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: "var(--cn-color-error-500, #d63c3c)",
                        },
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

/** Hook de utilidad: fuerza un re-render cada minuto (indicador de hora actual). */
export const useNow = (enabled = true): Date => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [enabled]);
  return now;
};
