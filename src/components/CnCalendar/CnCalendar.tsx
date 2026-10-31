import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import type { SxProps, Theme } from "@mui/material/styles";
import type { KeyboardEvent } from "react";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CnWeekday } from "../../utils/date-utils";
import {
  addDays,
  addMonths,
  formatLongDate,
  formatMonthYear,
  getCalendarWeeks,
  getMonthNames,
  getWeekdayNames,
  isSameDay,
  isSameMonth,
  parseIsoDate,
  startOfMonth,
  startOfWeek,
  toIsoDate,
} from "../../utils/date-utils";
import { mergeSx } from "../../utils/field-styles";

export type CnCalendarView = "day" | "month" | "year";
export type CnCalendarRange = [string | null, string | null];

export type CnCalendarDisableOptions = {
  /** `YYYY-MM-DD` */
  min?: string;
  max?: string;
  disablePast?: boolean;
  disableFuture?: boolean;
  disableWeekends?: boolean;
  /** Días de la semana deshabilitados (0 = domingo). */
  disabledDays?: number[];
  /** Fechas puntuales deshabilitadas (`YYYY-MM-DD`), p. ej. días festivos. */
  disabledDates?: string[];
  shouldDisableDate?: (isoDate: string) => boolean;
};

type BaseProps = CnCalendarDisableOptions & {
  /** Vistas disponibles; `["month", "year"]` crea un selector de mes. */
  views?: CnCalendarView[];
  openTo?: CnCalendarView;
  locale?: string;
  weekStartsOn?: CnWeekday;
  /** Número de meses visibles (2 es útil para rangos). */
  months?: 1 | 2;
  /** Fechas marcadas con un punto (eventos, entregas…). */
  highlightedDates?: string[];
  /** Muestra el número de semana ISO. */
  showWeekNumbers?: boolean;
  /** Mes visible inicial cuando no hay valor (`YYYY-MM-DD`). */
  defaultMonth?: string;
  minYear?: number;
  maxYear?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onMonthChange?: (month: string) => void;
  sx?: SxProps<Theme>;
  className?: string;
  "aria-label"?: string;
};

export type CnCalendarProps = BaseProps &
  (
    | { mode?: "single"; value?: string | null; onChange?: (value: string) => void }
    | { mode: "range"; value?: CnCalendarRange; onChange?: (value: CnCalendarRange) => void }
  );

const todayIso = () => toIsoDate(new Date());

/** Indica si una fecha está deshabilitada según las opciones. */
export const isDateDisabled = (date: Date, options: CnCalendarDisableOptions): boolean => {
  const iso = toIsoDate(date);
  const today = todayIso();
  if (options.min && iso < options.min) return true;
  if (options.max && iso > options.max) return true;
  if (options.disablePast && iso < today) return true;
  if (options.disableFuture && iso > today) return true;
  const weekday = date.getDay();
  if (options.disableWeekends && (weekday === 0 || weekday === 6)) return true;
  if (options.disabledDays?.includes(weekday)) return true;
  if (options.disabledDates?.includes(iso)) return true;
  return Boolean(options.shouldDisableDate?.(iso));
};

const isoWeekNumber = (date: Date): number => {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNumber = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7,
    )
  );
};

const CELL = 36;

const dayButtonSx = {
  width: CELL,
  height: CELL,
  borderRadius: "50%",
  fontSize: "var(--cn-font-size-sm, 12px)",
  fontWeight: 500,
  color: "var(--cn-color-text, #222831)",
  position: "relative",
  transition: "background-color 120ms ease, color 120ms ease",
  "&:hover": { backgroundColor: "var(--cn-color-brand-50, #eef3fb)" },
  "&.Mui-focusVisible, &:focus-visible": {
    outline: "2px solid var(--cn-color-brand-400, #5081c4)",
    outlineOffset: 1,
  },
  "&[data-outside]": { color: "var(--cn-color-text-subtle, #9aa1aa)" },
  "&[data-today]": { boxShadow: "inset 0 0 0 1px var(--cn-color-brand-500, #3562a6)" },
  "&[data-in-range]": {
    borderRadius: 0,
    backgroundColor: "var(--cn-color-brand-50, #eef3fb)",
  },
  "&[data-selected]": {
    backgroundColor: "var(--cn-color-brand-600, #254d87)",
    color: "var(--cn-color-text-inverse, #ffffff)",
    borderRadius: "50%",
    "&:hover": { backgroundColor: "var(--cn-color-brand-700, #1c3d6d)" },
  },
  "&.Mui-disabled": {
    color: "var(--cn-color-neutral-300, #c5cad0)",
    textDecoration: "line-through",
  },
} as const;

const gridButtonSx = {
  height: 36,
  borderRadius: "var(--cn-radius-md, 8px)",
  fontSize: "var(--cn-font-size-sm, 12px)",
  fontWeight: 500,
  color: "var(--cn-color-text, #222831)",
  "&:hover": { backgroundColor: "var(--cn-color-brand-50, #eef3fb)" },
  "&.Mui-focusVisible, &:focus-visible": {
    outline: "2px solid var(--cn-color-brand-400, #5081c4)",
    outlineOffset: 1,
  },
  "&[data-current]": { boxShadow: "inset 0 0 0 1px var(--cn-color-brand-500, #3562a6)" },
  "&[data-selected]": {
    backgroundColor: "var(--cn-color-brand-600, #254d87)",
    color: "var(--cn-color-text-inverse, #ffffff)",
  },
  "&.Mui-disabled": { color: "var(--cn-color-neutral-300, #c5cad0)" },
} as const;

/**
 * Calendario accesible (patrón grid de WAI-ARIA) con vistas de día, mes y año,
 * selección simple o por rango, restricciones de fechas y navegación completa
 * por teclado. Sin dependencias de fechas.
 */
export const CnCalendar = forwardRef<HTMLDivElement, CnCalendarProps>(
  function CnCalendar(props, ref) {
    const {
      mode = "single",
      value,
      views = ["day", "month", "year"],
      openTo,
      locale = "es-MX",
      weekStartsOn = 1,
      months = 1,
      highlightedDates,
      showWeekNumbers = false,
      defaultMonth,
      minYear,
      maxYear,
      autoFocus = false,
      disabled = false,
      readOnly = false,
      onMonthChange,
      sx,
      className,
      "aria-label": ariaLabel,
      min,
      max,
      disablePast,
      disableFuture,
      disableWeekends,
      disabledDays,
      disabledDates,
      shouldDisableDate,
    } = props;

    const disableOptions = useMemo<CnCalendarDisableOptions>(
      () => ({
        min,
        max,
        disablePast,
        disableFuture,
        disableWeekends,
        disabledDays,
        disabledDates,
        shouldDisableDate,
      }),
      [
        disableFuture,
        disablePast,
        disableWeekends,
        disabledDates,
        disabledDays,
        max,
        min,
        shouldDisableDate,
      ],
    );

    const range: CnCalendarRange =
      mode === "range" ? ((value as CnCalendarRange | undefined) ?? [null, null]) : [null, null];
    const single = mode === "single" ? parseIsoDate(value as string | null | undefined) : null;
    const rangeStart = parseIsoDate(range[0]);
    const rangeEnd = parseIsoDate(range[1]);
    const anchor = single ?? rangeStart ?? parseIsoDate(defaultMonth) ?? new Date();

    const [visibleMonth, setVisibleMonth] = useState(() => {
      // Con dos meses y un máximo (p. ej. disableFuture), mostrar el mes previo
      // y el del máximo en lugar de un segundo mes completamente deshabilitado.
      const maxDate = max ? parseIsoDate(max) : disableFuture ? new Date() : null;
      if (months === 2 && maxDate && isSameMonth(anchor, maxDate))
        return startOfMonth(addMonths(anchor, -1));
      return startOfMonth(anchor);
    });
    const [focusedDate, setFocusedDate] = useState<Date>(anchor);
    const [view, setView] = useState<CnCalendarView>(openTo ?? views[0] ?? "day");
    const [hovered, setHovered] = useState<Date | null>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);
    const shouldFocusRef = useRef(autoFocus);

    const today = new Date();
    const monthNames = useMemo(() => getMonthNames(locale, "short"), [locale]);
    const weekdayNames = useMemo(
      () => getWeekdayNames(locale, weekStartsOn, "short"),
      [locale, weekStartsOn],
    );
    const highlighted = useMemo(() => new Set(highlightedDates ?? []), [highlightedDates]);
    const blocked = disabled || readOnly;
    const hasDayView = views.includes("day");

    // Si el valor cambia desde fuera, el calendario lo muestra.
    const valueKey = mode === "single" ? String(value ?? "") : `${range[0]}|${range[1]}`;
    useEffect(() => {
      const target = mode === "single" ? single : rangeStart;
      if (!target) return;
      setFocusedDate(target);
      setVisibleMonth((current) =>
        isSameMonth(current, target) || (months === 2 && isSameMonth(addMonths(current, 1), target))
          ? current
          : startOfMonth(target),
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valueKey]);

    const changeMonth = useCallback(
      (next: Date) => {
        const month = startOfMonth(next);
        setVisibleMonth(month);
        onMonthChange?.(toIsoDate(month));
      },
      [onMonthChange],
    );

    const moveFocus = (next: Date) => {
      shouldFocusRef.current = true;
      setFocusedDate(next);
      const lastVisible = addMonths(visibleMonth, months - 1);
      if (next < visibleMonth || next > addDays(startOfMonth(addMonths(lastVisible, 1)), -1)) {
        changeMonth(next < visibleMonth ? next : addMonths(next, -(months - 1)));
      }
    };

    useEffect(() => {
      if (!shouldFocusRef.current || view !== "day") return;
      shouldFocusRef.current = false;
      const iso = toIsoDate(focusedDate);
      gridRef.current?.querySelector<HTMLElement>(`[data-date="${iso}"]`)?.focus();
    }, [focusedDate, view, visibleMonth]);

    const selectDate = (date: Date) => {
      if (blocked || isDateDisabled(date, disableOptions)) return;
      const iso = toIsoDate(date);
      setFocusedDate(date);
      if (mode === "range") {
        const onChange = props.onChange as ((v: CnCalendarRange) => void) | undefined;
        if (!rangeStart || rangeEnd) {
          onChange?.([iso, null]);
        } else if (iso < toIsoDate(rangeStart)) {
          onChange?.([iso, toIsoDate(rangeStart)]);
        } else {
          onChange?.([toIsoDate(rangeStart), iso]);
        }
        return;
      }
      (props.onChange as ((v: string) => void) | undefined)?.(iso);
    };

    const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      const keyMap: Record<string, () => Date> = {
        ArrowLeft: () => addDays(focusedDate, -1),
        ArrowRight: () => addDays(focusedDate, 1),
        ArrowUp: () => addDays(focusedDate, -7),
        ArrowDown: () => addDays(focusedDate, 7),
        Home: () => startOfWeek(focusedDate, weekStartsOn),
        End: () => addDays(startOfWeek(focusedDate, weekStartsOn), 6),
        PageUp: () => addMonths(focusedDate, event.shiftKey ? -12 : -1),
        PageDown: () => addMonths(focusedDate, event.shiftKey ? 12 : 1),
      };
      if (keyMap[event.key]) {
        event.preventDefault();
        moveFocus(keyMap[event.key]());
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectDate(focusedDate);
      }
    };

    const previewEnd = mode === "range" && rangeStart && !rangeEnd ? hovered : null;
    const inRange = (date: Date): boolean => {
      const start = rangeStart;
      const end = rangeEnd ?? previewEnd;
      if (!start || !end) return false;
      const [a, b] = start <= end ? [start, end] : [end, start];
      return date > a && date < b;
    };

    // ─── Encabezado ──────────────────────────────────────────────────────
    const minNav = min ? parseIsoDate(min) : disablePast ? today : null;
    const maxNav = max ? parseIsoDate(max) : disableFuture ? today : null;
    const canPrev = !minNav || startOfMonth(visibleMonth) > startOfMonth(minNav);
    const lastMonth = addMonths(visibleMonth, months - 1);
    const canNext = !maxNav || startOfMonth(lastMonth) < startOfMonth(maxNav);

    const header = (monthDate: Date, index: number) => (
      <Box
        key={`h-${index}`}
        sx={{ display: "flex", alignItems: "center", gap: "4px", minHeight: 36 }}
      >
        {index === 0 && view === "day" && (
          <IconButton
            size="small"
            aria-label="Mes anterior"
            disabled={!canPrev}
            onClick={() => changeMonth(addMonths(visibleMonth, -1))}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {views.includes("year") || views.includes("month") ? (
            <ButtonBase
              onClick={() =>
                setView(
                  view === "day"
                    ? views.includes("year")
                      ? "year"
                      : "month"
                    : hasDayView
                      ? "day"
                      : view === "year"
                        ? "month"
                        : "year",
                )
              }
              aria-live="polite"
              aria-label={`${formatMonthYear(monthDate, locale)}. Cambiar vista`}
              sx={{
                px: "8px",
                py: "4px",
                gap: "2px",
                borderRadius: "var(--cn-radius-sm, 6px)",
                fontSize: "var(--cn-font-size-md, 14px)",
                fontWeight: 600,
                color: "var(--cn-color-text, #222831)",
                "&:hover": { backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)" },
                "&.Mui-focusVisible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
              }}
            >
              {view === "day"
                ? formatMonthYear(monthDate, locale)
                : String(monthDate.getFullYear())}
              {index === 0 && (
                <ExpandMoreIcon
                  fontSize="small"
                  sx={{
                    transform: view === "day" ? "none" : "rotate(180deg)",
                    transition: "transform 160ms ease",
                  }}
                />
              )}
            </ButtonBase>
          ) : (
            <Box
              component="span"
              aria-live="polite"
              sx={{ fontSize: "var(--cn-font-size-md, 14px)", fontWeight: 600 }}
            >
              {formatMonthYear(monthDate, locale)}
            </Box>
          )}
        </Box>
        {index === months - 1 && view === "day" && (
          <IconButton
            size="small"
            aria-label="Mes siguiente"
            disabled={!canNext}
            onClick={() => changeMonth(addMonths(visibleMonth, 1))}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );

    // ─── Vista de días ───────────────────────────────────────────────────
    const renderMonthGrid = (monthDate: Date, index: number) => {
      const weeks = getCalendarWeeks(monthDate, weekStartsOn);
      return (
        <Box key={`m-${index}`} sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {header(monthDate, index)}
          <Box
            role="grid"
            aria-label={formatMonthYear(monthDate, locale)}
            aria-multiselectable={mode === "range" || undefined}
            onKeyDown={handleGridKeyDown}
            onMouseLeave={() => setHovered(null)}
            sx={{ display: "flex", flexDirection: "column", gap: "2px" }}
          >
            <Box role="row" sx={{ display: "flex", gap: "2px" }}>
              {showWeekNumbers && (
                <Box role="columnheader" aria-label="Semana" sx={{ width: CELL }} />
              )}
              {weekdayNames.map((name) => (
                <Box
                  key={name}
                  role="columnheader"
                  aria-label={name}
                  sx={{
                    width: CELL,
                    textAlign: "center",
                    fontSize: "var(--cn-font-size-xs, 11px)",
                    fontWeight: 600,
                    color: "var(--cn-color-text-muted, #6e7682)",
                    lineHeight: "24px",
                  }}
                >
                  {name.slice(0, 2)}
                </Box>
              ))}
            </Box>
            {weeks.map((week) => (
              <Box role="row" key={toIsoDate(week[0])} sx={{ display: "flex", gap: "2px" }}>
                {showWeekNumbers && (
                  <Box
                    role="rowheader"
                    sx={{
                      width: CELL,
                      lineHeight: `${CELL}px`,
                      textAlign: "center",
                      fontSize: "var(--cn-font-size-xs, 11px)",
                      color: "var(--cn-color-text-subtle, #9aa1aa)",
                    }}
                  >
                    {isoWeekNumber(week[0])}
                  </Box>
                )}
                {week.map((date) => {
                  const iso = toIsoDate(date);
                  const outside = !isSameMonth(date, monthDate);
                  if (outside && months === 2) {
                    return <Box key={iso} role="gridcell" sx={{ width: CELL, height: CELL }} />;
                  }
                  const isDisabled = isDateDisabled(date, disableOptions);
                  const selected =
                    mode === "single"
                      ? isSameDay(date, single)
                      : isSameDay(date, rangeStart) || isSameDay(date, rangeEnd);
                  const focused =
                    isSameDay(date, focusedDate) && isSameMonth(focusedDate, monthDate);
                  return (
                    <Box
                      key={iso}
                      role="gridcell"
                      aria-selected={selected || undefined}
                      sx={{ width: CELL, height: CELL }}
                    >
                      <ButtonBase
                        data-date={iso}
                        data-outside={outside || undefined}
                        data-today={isSameDay(date, today) || undefined}
                        data-selected={selected || undefined}
                        data-in-range={(!selected && inRange(date)) || undefined}
                        tabIndex={focused ? 0 : -1}
                        disabled={isDisabled || blocked}
                        aria-label={formatLongDate(date, locale)}
                        aria-current={isSameDay(date, today) ? "date" : undefined}
                        onClick={() => selectDate(date)}
                        onMouseEnter={() => mode === "range" && setHovered(date)}
                        onFocus={() => {
                          if (!isSameDay(focusedDate, date)) setFocusedDate(date);
                        }}
                        sx={dayButtonSx}
                      >
                        {date.getDate()}
                        {highlighted.has(iso) && (
                          <Box
                            component="span"
                            aria-hidden
                            sx={{
                              position: "absolute",
                              bottom: 4,
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              backgroundColor: selected
                                ? "currentColor"
                                : "var(--cn-color-accent-500, #3d5afe)",
                            }}
                          />
                        )}
                      </ButtonBase>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      );
    };

    // ─── Vistas de mes y año ─────────────────────────────────────────────
    const selectedMonthDate = single ?? rangeStart;

    const renderMonths = () => (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {header(visibleMonth, 0)}
        <Box
          role="listbox"
          aria-label="Meses"
          sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}
        >
          {monthNames.map((name, monthIndex) => {
            const date = new Date(visibleMonth.getFullYear(), monthIndex, 1);
            const monthEnd = new Date(visibleMonth.getFullYear(), monthIndex + 1, 0);
            const outOfRange =
              (minNav !== null && monthEnd < startOfMonth(minNav)) ||
              (maxNav !== null && date > maxNav);
            const selected = selectedMonthDate ? isSameMonth(date, selectedMonthDate) : false;
            return (
              <ButtonBase
                key={name}
                role="option"
                aria-selected={selected}
                data-selected={selected || undefined}
                data-current={isSameMonth(date, today) || undefined}
                disabled={outOfRange || blocked}
                onClick={() => {
                  changeMonth(date);
                  if (hasDayView) {
                    setView("day");
                    setFocusedDate(date);
                  } else {
                    (props.onChange as ((v: string) => void) | undefined)?.(toIsoDate(date));
                  }
                }}
                sx={gridButtonSx}
              >
                {name}
              </ButtonBase>
            );
          })}
        </Box>
      </Box>
    );

    const yearList = useMemo(() => {
      const current = new Date().getFullYear();
      const from = minYear ?? (minNav ? minNav.getFullYear() : current - 100);
      const to = maxYear ?? (maxNav ? maxNav.getFullYear() : current + 20);
      return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
    }, [maxNav, maxYear, minNav, minYear]);

    const yearListRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      if (view !== "year") return;
      yearListRef.current
        ?.querySelector<HTMLElement>("[data-visible-year]")
        ?.scrollIntoView?.({ block: "center" });
    }, [view]);

    const renderYears = () => (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {header(visibleMonth, 0)}
        <Box
          ref={yearListRef}
          role="listbox"
          aria-label="Años"
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "6px",
            maxHeight: 236,
            overflowY: "auto",
            pr: "4px",
          }}
        >
          {yearList.map((year) => {
            const selected = selectedMonthDate ? selectedMonthDate.getFullYear() === year : false;
            return (
              <ButtonBase
                key={year}
                role="option"
                aria-selected={selected}
                data-selected={selected || undefined}
                data-current={year === today.getFullYear() || undefined}
                data-visible-year={year === visibleMonth.getFullYear() || undefined}
                disabled={blocked}
                onClick={() => {
                  const next = new Date(year, visibleMonth.getMonth(), 1);
                  changeMonth(next);
                  setView(views.includes("month") ? "month" : "day");
                }}
                sx={gridButtonSx}
              >
                {year}
              </ButtonBase>
            );
          })}
        </Box>
      </Box>
    );

    return (
      <Box
        ref={ref}
        className={className}
        data-cn-calendar={mode}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        sx={mergeSx(
          {
            display: "inline-flex",
            flexDirection: "column",
            padding: "8px",
            fontFamily: "var(--cn-font-sans, inherit)",
            "& .MuiButtonBase-root": { fontFamily: "inherit" },
            userSelect: "none",
            opacity: disabled ? 0.6 : 1,
            minWidth: 7 * CELL + 6 * 2 + 16 + (showWeekNumbers ? CELL + 2 : 0),
          },
          sx,
        )}
      >
        {view === "day" && hasDayView ? (
          <Box ref={gridRef} sx={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {Array.from({ length: months }, (_, index) =>
              renderMonthGrid(addMonths(visibleMonth, index), index),
            )}
          </Box>
        ) : view === "month" ? (
          renderMonths()
        ) : (
          renderYears()
        )}
      </Box>
    );
  },
);
