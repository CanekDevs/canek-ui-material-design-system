import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { getCalendarWeeks } from "../../utils/date-utils";
import { CnIcon } from "../CnIcon";
import {
  addDays,
  addMonths,
  formatDayLong,
  formatTime,
  isSameDay,
  monthName,
  occursOnDay,
  resolveColor,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toIsoDate,
  weekdayName,
} from "./calendar-utils";
import type {
  CnCalendarDateRange,
  CnCalendarSource,
  CnCalendarSourceState,
  CnEventOccurrence,
  CnWeekday,
} from "./CnEventCalendar.types";

const sectionTitle = {
  fontSize: "0.7rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--cn-color-text-muted, #6e7682)",
  mb: "8px",
} as const;

// ─── Mini mes ─────────────────────────────────────────────────────────

export type MiniMonthProps = {
  date: Date;
  visibleRange: CnCalendarDateRange;
  locale: string;
  weekStart: CnWeekday;
  now: Date;
  /** Ocurrencias del rango indicado (para los puntos). */
  getOccurrences: (range: CnCalendarDateRange) => CnEventOccurrence[];
  onSelect: (day: Date) => void;
};

/** Mes chico para navegar, con puntos de eventos y el rango visible resaltado. */
export const MiniMonth = ({
  date,
  visibleRange,
  locale,
  weekStart,
  now,
  getOccurrences,
  onSelect,
}: MiniMonthProps) => {
  const [month, setMonth] = useState(() => startOfMonth(date));
  const dateKey = startOfMonth(date).getTime();
  useEffect(() => setMonth(new Date(dateKey)), [dateKey]);
  const weeks = getCalendarWeeks(month, weekStart);
  const range = { start: weeks[0][0], end: addDays(weeks[weeks.length - 1][6], 1) };
  const occurrences = getOccurrences(range);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(new Date(2023, 0, 1), weekStart), i),
  );
  return (
    <Box data-cn-mini-month sx={{ userSelect: "none" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: "4px" }}>
        <Box
          sx={{
            flex: 1,
            fontSize: "0.84rem",
            fontWeight: 700,
            textTransform: "capitalize",
            color: "var(--cn-color-text, #222831)",
          }}
        >
          {`${monthName(month, locale)} ${month.getFullYear()}`}
        </Box>
        <IconButton
          size="small"
          aria-label="Mes anterior"
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <CnIcon name="chevron_left" size={16} />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Mes siguiente"
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <CnIcon name="chevron_right" size={16} />
        </IconButton>
      </Box>
      <Box role="grid" aria-label="Mini calendario">
        <Box role="row" sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {weekdays.map((d) => (
            <Box
              key={d.getDay()}
              role="columnheader"
              aria-label={weekdayName(d, locale, "long")}
              sx={{
                textAlign: "center",
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "var(--cn-color-text-subtle, #9aa1aa)",
                py: "2px",
              }}
            >
              {weekdayName(d, locale).charAt(0).toLocaleUpperCase()}
            </Box>
          ))}
        </Box>
        {weeks.map((week, w) => (
          <Box key={w} role="row" sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {week.map((day) => {
              const inMonth = day.getMonth() === month.getMonth();
              const inRange = day >= visibleRange.start && day < visibleRange.end;
              const today = isSameDay(day, now);
              const selected = isSameDay(day, date);
              const dots = occurrences.filter((o) => occursOnDay(o, day)).slice(0, 3);
              return (
                <Box
                  key={day.getTime()}
                  role="gridcell"
                  component="button"
                  type="button"
                  data-cn-mini-date={toIsoDate(day)}
                  aria-label={`${formatDayLong(day, locale)}${dots.length ? `, con eventos` : ""}`}
                  aria-selected={selected}
                  onClick={() => onSelect(startOfDay(day))}
                  sx={{
                    all: "unset",
                    boxSizing: "border-box",
                    height: 30,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1px",
                    cursor: "pointer",
                    borderRadius: "8px",
                    fontSize: "0.72rem",
                    fontWeight: today || selected ? 800 : 500,
                    fontVariantNumeric: "tabular-nums",
                    color: today
                      ? "#fff"
                      : inMonth
                        ? "var(--cn-color-text, #222831)"
                        : "var(--cn-color-text-subtle, #9aa1aa)",
                    backgroundColor: today
                      ? "var(--cn-color-brand-600, #254d87)"
                      : inRange
                        ? "rgba(53, 98, 166, 0.08)"
                        : "transparent",
                    "&:hover": {
                      backgroundColor: today
                        ? "var(--cn-color-brand-700, #1d3e6e)"
                        : "var(--cn-color-hover, rgba(0,0,0,0.05))",
                    },
                    "&:focus-visible": { outline: "2px solid var(--cn-color-accent-500, #3d5afe)" },
                  }}
                >
                  {day.getDate()}
                  <Box sx={{ display: "flex", gap: "2px", height: 4 }}>
                    {dots.map((o) => (
                      <Box
                        key={o.key}
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          backgroundColor: today ? "#fff" : o.color,
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
    </Box>
  );
};

// ─── Calendarios (fuentes) ───────────────────────────────────────────

export type SourcesListProps = {
  sources: CnCalendarSource[];
  hidden: string[];
  states: Record<string, CnCalendarSourceState | undefined>;
  onToggle: (id: string) => void;
  onRetry: (id: string) => void;
};

/** Lista de calendarios con alternador, carga y error por fuente. */
export const SourcesList = ({ sources, hidden, states, onToggle, onRetry }: SourcesListProps) => (
  <Box data-cn-sources role="group" aria-label="Calendarios">
    <Box sx={sectionTitle}>Calendarios</Box>
    <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {sources.map((s) => {
        const on = !hidden.includes(s.id);
        const color = resolveColor(s.color);
        const state = states[s.id];
        return (
          <Box
            key={s.id}
            data-cn-source={s.id}
            sx={{ display: "flex", alignItems: "center", gap: "4px", minHeight: 30 }}
          >
            <Box
              component="button"
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={s.label}
              title={s.description}
              onClick={() => onToggle(s.id)}
              sx={{
                all: "unset",
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                px: "6px",
                py: "4px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: "var(--cn-color-text, #222831)",
                "&:hover": { backgroundColor: "var(--cn-color-hover, rgba(0,0,0,0.04))" },
                "&:focus-visible": { outline: "2px solid var(--cn-color-accent-500, #3d5afe)" },
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 14,
                  height: 14,
                  flexShrink: 0,
                  borderRadius: "4px",
                  border: `2px solid ${color}`,
                  backgroundColor: on ? color : "transparent",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
              >
                {on && <CnIcon name="check" size={10} />}
              </Box>
              <Box
                component="span"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </Box>
            </Box>
            {state?.loading && (
              <CircularProgress
                size={12}
                aria-label={`Cargando ${s.label}`}
                data-cn-source-loading
                sx={{ mr: "6px" }}
              />
            )}
            {state?.error && !state.loading && (
              <Tooltip title={`${state.error}. Reintentar`}>
                <IconButton
                  size="small"
                  aria-label={`Reintentar ${s.label}`}
                  data-cn-source-error
                  onClick={() => onRetry(s.id)}
                  sx={{ color: "var(--cn-color-error-500, #d63c3c)" }}
                >
                  <CnIcon name="error_outline" size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      })}
    </Box>
  </Box>
);

// ─── Próximos eventos ────────────────────────────────────────────────

export type UpcomingListProps = {
  occurrences: CnEventOccurrence[];
  locale: string;
  now: Date;
  onOpen: (occurrence: CnEventOccurrence, anchor: HTMLElement) => void;
};

/** Próximos eventos a partir de ahora. */
export const UpcomingList = ({ occurrences, locale, now, onOpen }: UpcomingListProps) => {
  const today = startOfDay(now);
  const label = useMemo(
    () => (day: Date) => {
      const d = startOfDay(day);
      if (isSameDay(d, today)) return "Hoy";
      if (isSameDay(d, addDays(today, 1))) return "Mañana";
      const text = `${weekdayName(d, locale)} ${d.getDate()} ${monthName(d, locale, "short")}`;
      return text.charAt(0).toLocaleUpperCase() + text.slice(1);
    },
    [today, locale],
  );
  return (
    <Box data-cn-upcoming>
      <Box sx={sectionTitle}>Próximos</Box>
      {occurrences.length === 0 ? (
        <Box sx={{ fontSize: "0.78rem", color: "var(--cn-color-text-muted, #6e7682)" }}>
          Sin eventos próximos
        </Box>
      ) : (
        <Box
          role="list"
          aria-label="Próximos eventos"
          sx={{ display: "flex", flexDirection: "column", gap: "4px" }}
        >
          {occurrences.map((o) => {
            const start = o.start < now ? now : o.start;
            return (
              <Box
                key={o.key}
                role="listitem"
                component="button"
                type="button"
                data-cn-occurrence={o.key}
                data-cn-event={o.event.id}
                onClick={(e: MouseEvent<HTMLElement>) => onOpen(o, e.currentTarget)}
                sx={{
                  all: "unset",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  display: "flex",
                  gap: "8px",
                  p: "6px 8px",
                  borderRadius: "8px",
                  borderLeft: `3px solid ${o.color}`,
                  "&:hover": { backgroundColor: "var(--cn-color-hover, rgba(0,0,0,0.04))" },
                  "&:focus-visible": { outline: "2px solid var(--cn-color-accent-500, #3d5afe)" },
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--cn-color-text, #222831)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {o.event.title}
                  </Box>
                  <Box
                    sx={{
                      fontSize: "0.7rem",
                      color: "var(--cn-color-text-muted, #6e7682)",
                    }}
                  >
                    {label(start)}
                    {o.allDay ? " · Todo el día" : ` · ${formatTime(o.start)}`}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
