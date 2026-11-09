import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { useMemo } from "react";
import { getCalendarWeeks } from "../../../utils/date-utils";
import { useCalendarContext } from "../calendar-context";
import {
  addDays,
  addMonths,
  diffDays,
  formatDayLong,
  isOutOfBounds,
  isSameDay,
  monthName,
  resolveColor,
  startOfDay,
  startOfWeek,
  toIsoDate,
  weekdayName,
} from "../calendar-utils";
import type { CnCalendarDateRange, CnEventOccurrence } from "../CnEventCalendar.types";

/** Conteo de ocurrencias por día (`YYYY-MM-DD`). */
export const countByDay = (
  occurrences: Pick<CnEventOccurrence, "start" | "end">[],
  range: CnCalendarDateRange,
): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const occ of occurrences) {
    const first = occ.start < range.start ? range.start : startOfDay(occ.start);
    const lastInstant = new Date(Math.max(occ.end.getTime() - 1, occ.start.getTime()));
    const last = lastInstant >= range.end ? addDays(range.end, -1) : startOfDay(lastInstant);
    for (let d = first; d <= last; d = addDays(d, 1)) {
      const key = toIsoDate(d);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
};

/** Nivel de intensidad 0-4 según el conteo y el máximo. */
export const heatLevel = (count: number, max: number): 0 | 1 | 2 | 3 | 4 => {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
};

const LEVEL_BG = [
  "transparent",
  "rgba(53, 98, 166, 0.16)",
  "rgba(53, 98, 166, 0.34)",
  "rgba(53, 98, 166, 0.58)",
  "rgba(37, 77, 135, 0.88)",
];

export type YearViewProps = {
  range: CnCalendarDateRange;
  occurrences: CnEventOccurrence[];
  onMonthClick: (month: Date) => void;
};

/** Resumen anual (o trimestral) con intensidad por día según el número de eventos. */
export const YearView = ({ range, occurrences, onMonthClick }: YearViewProps) => {
  const ctx = useCalendarContext();
  const { locale, weekStart, now, holidays, minDate, maxDate } = ctx;
  const counts = useMemo(() => countByDay(occurrences, range), [occurrences, range]);
  const max = useMemo(() => Math.max(0, ...counts.values()), [counts]);
  const monthsCount = Math.round(diffDays(range.end, range.start) / 30);
  const months = Array.from({ length: monthsCount }, (_, i) => addMonths(range.start, i));
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(new Date(2023, 0, 1), weekStart), i),
  );

  return (
    <Box data-cn-event-calendar-view={monthsCount === 3 ? "quarter" : "year"}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            monthsCount === 3
              ? { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }
              : {
                  xs: "repeat(1, minmax(0, 1fr))",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
          gap: "14px",
        }}
      >
        {months.map((month) => {
          const isCurrent =
            month.getMonth() === now.getMonth() && month.getFullYear() === now.getFullYear();
          return (
            <Box
              key={month.getTime()}
              data-cn-year-month
              sx={{
                p: "10px",
                borderRadius: "12px",
                border: `1px solid ${isCurrent ? "var(--cn-color-brand-300, #7c9fdc)" : "var(--cn-color-border, #dde0e4)"}`,
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => onMonthClick(month)}
                sx={{
                  all: "unset",
                  cursor: "pointer",
                  display: "block",
                  mb: "6px",
                  px: "4px",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  textTransform: "capitalize",
                  color: isCurrent
                    ? "var(--cn-color-brand-600, #254d87)"
                    : "var(--cn-color-text, #222831)",
                  "&:hover": { textDecoration: "underline" },
                  "&:focus-visible": {
                    outline: "2px solid var(--cn-color-accent-500, #3d5afe)",
                    borderRadius: "4px",
                  },
                }}
              >
                {monthName(month, locale)}
              </Box>
              <Box role="grid" aria-label={`${monthName(month, locale)} ${month.getFullYear()}`}>
                <Box role="row" sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {weekdays.map((d) => (
                    <Box
                      key={d.getDay()}
                      role="columnheader"
                      aria-label={weekdayName(d, locale, "long")}
                      sx={{
                        textAlign: "center",
                        fontSize: "0.64rem",
                        fontWeight: 700,
                        color: "var(--cn-color-text-subtle, #9aa1aa)",
                        py: "2px",
                      }}
                    >
                      {weekdayName(d, locale).charAt(0).toLocaleUpperCase()}
                    </Box>
                  ))}
                </Box>
                {getCalendarWeeks(month, weekStart).map((week, w) => (
                  <Box
                    key={w}
                    role="row"
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "2px",
                      mt: "2px",
                    }}
                  >
                    {week.map((day) => {
                      if (day.getMonth() !== month.getMonth()) {
                        return (
                          <Box
                            key={day.getTime()}
                            role="gridcell"
                            aria-hidden
                            sx={{ height: 24 }}
                          />
                        );
                      }
                      const key = toIsoDate(day);
                      const count = counts.get(key) ?? 0;
                      const level = heatLevel(count, max);
                      const holiday = holidays.get(key);
                      const today = isSameDay(day, now);
                      const label = `${formatDayLong(day, locale)}: ${count} ${count === 1 ? "evento" : "eventos"}${holiday ? `, ${holiday.label}` : ""}`;
                      return (
                        <Tooltip key={key} title={label} disableInteractive enterDelay={400}>
                          <Box
                            role="gridcell"
                            component="button"
                            type="button"
                            data-cn-date={key}
                            data-cn-heat={level}
                            aria-label={label}
                            disabled={isOutOfBounds(day, minDate, maxDate)}
                            onClick={() => ctx.goToDay(day)}
                            sx={{
                              all: "unset",
                              boxSizing: "border-box",
                              height: 24,
                              borderRadius: "6px",
                              display: "grid",
                              placeItems: "center",
                              cursor: "pointer",
                              fontSize: "0.7rem",
                              fontWeight: today || level >= 3 ? 700 : 500,
                              fontVariantNumeric: "tabular-nums",
                              color: level >= 3 ? "#fff" : "var(--cn-color-text, #222831)",
                              backgroundColor: LEVEL_BG[level],
                              boxShadow: today
                                ? "inset 0 0 0 2px var(--cn-color-brand-600, #254d87)"
                                : holiday
                                  ? `inset 0 0 0 1.5px ${resolveColor(holiday.color, "#e0a020")}`
                                  : undefined,
                              "&:disabled": { opacity: 0.35, cursor: "not-allowed" },
                              "&:hover": {
                                outline: "1px solid var(--cn-color-brand-400, #5081c4)",
                              },
                              "&:focus-visible": {
                                outline: "2px solid var(--cn-color-accent-500, #3d5afe)",
                              },
                            }}
                          >
                            {day.getDate()}
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box
        aria-hidden
        sx={{
          mt: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "4px",
          fontSize: "0.72rem",
          color: "var(--cn-color-text-muted, #6e7682)",
        }}
      >
        Menos
        {LEVEL_BG.map((bg, i) => (
          <Box
            key={i}
            sx={{
              width: 12,
              height: 12,
              borderRadius: "3px",
              backgroundColor: bg,
              border: "1px solid var(--cn-color-border, #dde0e4)",
            }}
          />
        ))}
        Más
      </Box>
    </Box>
  );
};
