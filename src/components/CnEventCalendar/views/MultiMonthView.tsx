import Box from "@mui/material/Box";
import type { MouseEvent } from "react";
import { useMemo } from "react";
import { getCalendarWeeks } from "../../../utils/date-utils";
import { useCalendarContext } from "../calendar-context";
import {
  addDays,
  addMonths,
  alpha,
  diffDays,
  formatDayLong,
  isoWeek,
  isOutOfBounds,
  isSameDay,
  monthName,
  occursOnDay,
  resolveColor,
  startOfWeek,
  toIsoDate,
  weekdayName,
} from "../calendar-utils";
import type { CnCalendarDateRange, CnEventOccurrence } from "../CnEventCalendar.types";
import { MONTH_HEAT_BG } from "./MonthView";
import { countByDay, heatLevel } from "./YearView";

export type MultiMonthViewProps = {
  range: CnCalendarDateRange;
  occurrences: CnEventOccurrence[];
  onMonthClick: (month: Date) => void;
};

const COLUMNS: Record<number, Record<string, string>> = {
  1: { xs: "1fr" },
  2: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  3: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
  4: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
  6: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
  12: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    md: "repeat(3, minmax(0, 1fr))",
    lg: "repeat(4, minmax(0, 1fr))",
  },
};

/**
 * Varios meses (2, 3, 4, 6 o 12) con hasta dos eventos por día y "+N"; el
 * clic en un día abre su lista y el nombre del mes abre la vista mensual.
 */
export const MultiMonthView = ({ range, occurrences, onMonthClick }: MultiMonthViewProps) => {
  const ctx = useCalendarContext();
  const { locale, weekStart, now, holidays, minDate, maxDate, monthHeatmap, showWeekNumbers } = ctx;
  const monthsCount = Math.max(1, Math.round(diffDays(range.end, range.start) / 30.4));
  const months = Array.from({ length: monthsCount }, (_, i) => addMonths(range.start, i));
  const counts = useMemo(() => countByDay(occurrences, range), [occurrences, range]);
  const max = useMemo(() => Math.max(0, ...counts.values()), [counts]);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(new Date(2023, 0, 1), weekStart), i),
  );
  const columns = COLUMNS[monthsCount] ?? COLUMNS[3];
  const gridCols = `${showWeekNumbers ? "22px " : ""}repeat(7, minmax(0, 1fr))`;

  return (
    <Box
      data-cn-event-calendar-view="multiMonth"
      sx={{ display: "grid", gridTemplateColumns: columns, gap: "14px" }}
    >
      {months.map((month) => {
        const isCurrent =
          month.getMonth() === now.getMonth() && month.getFullYear() === now.getFullYear();
        return (
          <Box
            key={month.getTime()}
            data-cn-multi-month={toIsoDate(month).slice(0, 7)}
            sx={{
              p: "10px",
              borderRadius: "12px",
              border: `1px solid ${isCurrent ? "var(--cn-color-brand-300, #7c9fdc)" : "var(--cn-color-border, #dde0e4)"}`,
              minWidth: 0,
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
                fontSize: "0.88rem",
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
              {`${monthName(month, locale)} ${month.getFullYear()}`}
            </Box>
            <Box role="grid" aria-label={`${monthName(month, locale)} ${month.getFullYear()}`}>
              <Box role="row" sx={{ display: "grid", gridTemplateColumns: gridCols }}>
                {showWeekNumbers && <Box aria-hidden />}
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
                  sx={{ display: "grid", gridTemplateColumns: gridCols, gap: "2px", mt: "2px" }}
                >
                  {showWeekNumbers && (
                    <Box
                      data-cn-week-number
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: "var(--cn-color-text-subtle, #9aa1aa)",
                        pt: "4px",
                        textAlign: "center",
                      }}
                    >
                      {isoWeek(addDays(week[0], 3))}
                    </Box>
                  )}
                  {week.map((day) => {
                    if (day.getMonth() !== month.getMonth()) {
                      return <Box key={day.getTime()} role="gridcell" aria-hidden />;
                    }
                    const key = toIsoDate(day);
                    const list = occurrences.filter((o) => occursOnDay(o, day));
                    const holiday = holidays.get(key);
                    const today = isSameDay(day, now);
                    const disabled = isOutOfBounds(day, minDate, maxDate);
                    const level = monthHeatmap ? heatLevel(counts.get(key) ?? 0, max) : 0;
                    const label = `${formatDayLong(day, locale)}: ${list.length} ${list.length === 1 ? "evento" : "eventos"}${holiday ? `, ${holiday.label}` : ""}`;
                    return (
                      <Box
                        key={key}
                        role="gridcell"
                        component="button"
                        type="button"
                        data-cn-date={key}
                        aria-label={label}
                        disabled={disabled}
                        onClick={(e: MouseEvent<HTMLElement>) => {
                          if (list.length) ctx.openDayList(day, e.currentTarget);
                          else if (ctx.isDayEnabled(day)) {
                            ctx.selectSlot({ start: day, end: addDays(day, 1), allDay: true });
                          }
                        }}
                        sx={{
                          all: "unset",
                          boxSizing: "border-box",
                          minWidth: 0,
                          height: 52,
                          p: "2px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1px",
                          backgroundColor: holiday
                            ? alpha(resolveColor(holiday.color, "#e0a020"), 0.1)
                            : MONTH_HEAT_BG[level],
                          boxShadow: today
                            ? "inset 0 0 0 2px var(--cn-color-brand-600, #254d87)"
                            : undefined,
                          "&:hover": { backgroundColor: "var(--cn-color-hover, rgba(0,0,0,0.04))" },
                          "&:disabled": { opacity: 0.35, cursor: "not-allowed" },
                          "&:focus-visible": {
                            outline: "2px solid var(--cn-color-accent-500, #3d5afe)",
                          },
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: today ? 800 : 600,
                            textAlign: "center",
                            fontVariantNumeric: "tabular-nums",
                            color: today
                              ? "var(--cn-color-brand-600, #254d87)"
                              : "var(--cn-color-text, #222831)",
                          }}
                        >
                          {day.getDate()}
                        </Box>
                        {list.slice(0, 2).map((o) => (
                          <Box
                            key={o.key}
                            component="span"
                            data-cn-occurrence={o.key}
                            title={o.event.title}
                            sx={{
                              display: "block",
                              height: 11,
                              lineHeight: "11px",
                              px: "3px",
                              borderRadius: "3px",
                              fontSize: "0.56rem",
                              fontWeight: 600,
                              color: "#fff",
                              backgroundColor: o.color,
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {o.event.title}
                          </Box>
                        ))}
                        {list.length > 2 && (
                          <Box
                            component="span"
                            data-cn-more
                            sx={{
                              fontSize: "0.56rem",
                              fontWeight: 700,
                              textAlign: "center",
                              color: "var(--cn-color-text-muted, #6e7682)",
                            }}
                          >
                            +{list.length - 2}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
