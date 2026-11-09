import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { forwardRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import {
  getOutlinedFieldSx,
  groupLegendSx,
  helperTextSx,
  mergeSx,
  MUI_FIELD_SIZE,
  switchControlSx,
} from "../../utils/field-styles";
import type { CnWeekdayKey } from "../../utils/time-utils";
import { orderedWeekdays, parseTimeToMinutes, WEEKDAYS } from "../../utils/time-utils";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnScheduleFieldSkeleton } from "./CnScheduleFieldSkeleton";

export type { CnWeekdayKey } from "../../utils/time-utils";

export type CnScheduleRange = { start: string; end: string };
export type CnScheduleDay = { enabled: boolean; ranges: CnScheduleRange[] };
/** Disponibilidad por día (`mon`, `tue`… `sun`). Los días ausentes están cerrados. */
export type CnScheduleValue = Partial<Record<CnWeekdayKey, CnScheduleDay>>;

export type CnScheduleFieldProps = CnFieldBaseProps<CnScheduleValue> & {
  /** Primer día: 1 = lunes (por defecto) o 0 = domingo. */
  weekStart?: 0 | 1;
  /** Días que se muestran (por defecto toda la semana). */
  days?: CnWeekdayKey[];
  /** Rango con el que se habilita un día. Por defecto 09:00 – 18:00. */
  defaultRange?: CnScheduleRange;
  /** Rangos máximos por día. Por defecto 3. */
  maxRanges?: number;
  /** Paso de los minutos del selector nativo. */
  minutesStep?: number;
  /** Botón "copiar a todos los días". Por defecto `true`. */
  allowCopy?: boolean;
  /** Texto de un día cerrado. */
  closedText?: string;
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
};

const DEFAULT_RANGE: CnScheduleRange = { start: "09:00", end: "18:00" };
const DAY_NAMES = Object.fromEntries(WEEKDAYS.map((d) => [d.key, d.label])) as Record<
  CnWeekdayKey,
  string
>;

const asSchedule = (value: unknown): CnScheduleValue =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as CnScheduleValue) : {};

/** Problema de cada día: rangos incompletos, invertidos o traslapados. */
export const getScheduleIssues = (value: unknown): Partial<Record<CnWeekdayKey, string>> => {
  const issues: Partial<Record<CnWeekdayKey, string>> = {};
  for (const [key, day] of Object.entries(asSchedule(value)) as [CnWeekdayKey, CnScheduleDay][]) {
    if (!day?.enabled) continue;
    const ranges = Array.isArray(day.ranges) ? day.ranges : [];
    if (ranges.length === 0) {
      issues[key] = "Agrega al menos un horario";
      continue;
    }
    const parsed = ranges.map((r) => [parseTimeToMinutes(r?.start), parseTimeToMinutes(r?.end)]);
    if (parsed.some(([s, e]) => s === null || e === null)) {
      issues[key] = "Completa la hora de inicio y de fin";
      continue;
    }
    if (parsed.some(([s, e]) => (e as number) <= (s as number))) {
      issues[key] = "La hora de fin debe ser posterior a la de inicio";
      continue;
    }
    const sorted = [...parsed].sort((a, b) => (a[0] as number) - (b[0] as number));
    if (sorted.some((r, i) => i > 0 && (r[0] as number) < (sorted[i - 1][1] as number))) {
      issues[key] = "Los horarios se traslapan";
    }
  }
  return issues;
};

/** Reglas implícitas: requerido (algún día abierto) y horarios coherentes. */
export const buildScheduleRules = ({
  required,
}: { required?: boolean } = {}): CnValidationRule[] => {
  const rules: CnValidationRule[] = [];
  if (required) {
    rules.push({
      type: "custom",
      message: "Habilita al menos un día",
      validate: (v) => Object.values(asSchedule(v)).some((day) => day?.enabled),
    });
  }
  let lastIssue = "";
  rules.push({
    type: "custom",
    message: () => lastIssue || "Revisa los horarios",
    validate: (v) => {
      const [first] = Object.entries(getScheduleIssues(v)) as [CnWeekdayKey, string][];
      lastIssue = first ? `${DAY_NAMES[first[0]]}: ${first[1]}` : "";
      return !first;
    },
  });
  return rules;
};

/** Disponibilidad semanal: días habilitados con uno o varios rangos de horas. */
export const CnScheduleField = forwardRef<HTMLFieldSetElement, CnScheduleFieldProps>(
  function CnScheduleField(
    {
      id,
      name,
      label,
      helperText,
      error,
      required,
      disabled,
      readOnly,
      value,
      defaultValue,
      onChange,
      onBlur,
      rules,
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      debounceMs,
      internalValidation,
      size = "md",
      reserveHelperSpace,
      sx,
      className,
      weekStart = 1,
      days,
      defaultRange = DEFAULT_RANGE,
      maxRanges = 3,
      minutesStep,
      allowCopy = true,
      closedText = "Cerrado",
      skeleton = false,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnScheduleValue>(
      value,
      defaultValue,
      {},
      onChange,
    );
    const schedule = asSchedule(current);
    const control = useFieldControl(schedule, {
      id,
      rules: [...(rules ?? []), ...buildScheduleRules({ required })],
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      debounceMs: debounceMs ?? 0,
      internalValidation,
      error,
      helperText,
      reserveHelperSpace,
    });
    const visibleDays = orderedWeekdays(weekStart).filter((d) => !days || days.includes(d.key));
    const locked = Boolean(disabled || readOnly);
    const issues = getScheduleIssues(schedule);

    if (skeleton) {
      return (
        <CnScheduleFieldSkeleton
          size={size}
          days={visibleDays.length}
          label={Boolean(label)}
          helperText={Boolean(control.helperText?.trim())}
          sx={sx}
          className={className}
        />
      );
    }

    const emit = (next: CnScheduleValue) => {
      control.markChanged();
      setCurrent(next);
    };

    const setDay = (key: CnWeekdayKey, day: CnScheduleDay) => emit({ ...schedule, [key]: day });

    const toggleDay = (key: CnWeekdayKey, enabled: boolean) => {
      const day = schedule[key];
      setDay(key, {
        enabled,
        ranges: day?.ranges?.length ? day.ranges : [{ ...defaultRange }],
      });
    };

    const updateRange = (key: CnWeekdayKey, index: number, patch: Partial<CnScheduleRange>) => {
      const day = schedule[key] ?? { enabled: true, ranges: [] };
      setDay(key, {
        ...day,
        ranges: day.ranges.map((r, i) => (i === index ? { ...r, ...patch } : r)),
      });
    };

    const addRange = (key: CnWeekdayKey) => {
      const day = schedule[key] ?? { enabled: true, ranges: [] };
      const last = day.ranges[day.ranges.length - 1];
      const lastEnd = parseTimeToMinutes(last?.end);
      const start = lastEnd !== null ? Math.min(lastEnd + 60, 22 * 60) : 9 * 60;
      const fmt = (m: number) =>
        `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      setDay(key, {
        ...day,
        ranges: [
          ...day.ranges,
          { start: fmt(start), end: fmt(Math.min(start + 120, 23 * 60 + 59)) },
        ],
      });
    };

    const removeRange = (key: CnWeekdayKey, index: number) => {
      const day = schedule[key];
      if (!day) return;
      const ranges = day.ranges.filter((_, i) => i !== index);
      setDay(key, { enabled: ranges.length > 0 && day.enabled, ranges });
    };

    const copyToAll = (key: CnWeekdayKey) => {
      const source = schedule[key];
      if (!source) return;
      const next: CnScheduleValue = { ...schedule };
      for (const day of visibleDays) {
        next[day.key] = { enabled: source.enabled, ranges: source.ranges.map((r) => ({ ...r })) };
      }
      emit(next);
    };

    const timeInput = (key: CnWeekdayKey, index: number, part: "start" | "end", text: string) => (
      <TextField
        type="time"
        size={MUI_FIELD_SIZE[size]}
        value={text}
        disabled={disabled}
        error={Boolean(issues[key])}
        onChange={(event) => updateRange(key, index, { [part]: event.target.value })}
        slotProps={{
          htmlInput: {
            readOnly,
            step: minutesStep ? minutesStep * 60 : undefined,
            "aria-label": `${DAY_NAMES[key]}: ${part === "start" ? "inicio" : "fin"} del horario ${index + 1}`,
            name: name ? `${name}[${key}][ranges][${index}][${part}]` : undefined,
          },
        }}
        sx={mergeSx(getOutlinedFieldSx(size), { width: 128, flexShrink: 0 })}
      />
    );

    return (
      <FormControl
        ref={ref}
        component="fieldset"
        fullWidth
        error={control.error}
        disabled={disabled}
        required={required}
        className={className}
        data-cn-schedule-field
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            control.markBlurred();
            onBlur?.();
          }
        }}
        sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0 }, sx)}
      >
        {label && (
          <FormLabel component="legend" sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        <Box
          id={control.id}
          aria-describedby={control.helperText?.trim() ? control.helperId : undefined}
          sx={{
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderRadius: "var(--cn-radius-md, 8px)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
          }}
        >
          {visibleDays.map((dayInfo, rowIndex) => {
            const day = schedule[dayInfo.key];
            const enabled = Boolean(day?.enabled);
            const issue = issues[dayInfo.key];
            const issueId = `${control.id}-${dayInfo.key}-issue`;
            return (
              <Box
                key={dayInfo.key}
                role="group"
                aria-label={dayInfo.label}
                aria-describedby={issue ? issueId : undefined}
                data-cn-schedule-day={dayInfo.key}
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  gap: "8px 12px",
                  px: "12px",
                  py: "8px",
                  borderTop: rowIndex ? "1px solid var(--cn-color-border-subtle, #e9ecef)" : 0,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    width: 150,
                    minHeight: 36,
                  }}
                >
                  <Switch
                    size="small"
                    checked={enabled}
                    disabled={locked}
                    onChange={(_, checked) => toggleDay(dayInfo.key, checked)}
                    slotProps={{ input: { "aria-label": `Abrir ${dayInfo.label}` } }}
                    sx={switchControlSx}
                  />
                  <Box
                    component="span"
                    sx={{ fontSize: 13, fontWeight: 600, color: "var(--cn-color-text, #222831)" }}
                  >
                    {dayInfo.label}
                  </Box>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 260,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {!enabled && (
                    <Box
                      sx={{
                        minHeight: 36,
                        display: "flex",
                        alignItems: "center",
                        fontSize: 13,
                        color: "var(--cn-color-text-muted, #6e7682)",
                      }}
                    >
                      {closedText}
                    </Box>
                  )}
                  {enabled &&
                    day?.ranges.map((range, index) => (
                      <Box key={index} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {timeInput(dayInfo.key, index, "start", range.start)}
                        <Box aria-hidden sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)" }}>
                          –
                        </Box>
                        {timeInput(dayInfo.key, index, "end", range.end)}
                        {!locked && (
                          <IconButton
                            size="small"
                            aria-label={`Quitar horario ${index + 1} del ${dayInfo.label}`}
                            onClick={() => removeRange(dayInfo.key, index)}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        )}
                        {index === 0 && !locked && (
                          <>
                            {day.ranges.length < maxRanges && (
                              <Tooltip title="Agregar horario">
                                <IconButton
                                  size="small"
                                  aria-label={`Agregar horario al ${dayInfo.label}`}
                                  onClick={() => addRange(dayInfo.key)}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {allowCopy && visibleDays.length > 1 && (
                              <Tooltip title="Copiar a todos los días">
                                <IconButton
                                  size="small"
                                  aria-label={`Copiar el horario del ${dayInfo.label} a todos los días`}
                                  onClick={() => copyToAll(dayInfo.key)}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </Box>
                    ))}
                  {issue && (
                    <Box
                      id={issueId}
                      sx={{ fontSize: 11, color: "var(--cn-color-error-600, #b52f2f)" }}
                    >
                      {issue}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
        {control.helperText && (
          <FormHelperText id={control.helperId} sx={helperTextSx}>
            {control.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);
