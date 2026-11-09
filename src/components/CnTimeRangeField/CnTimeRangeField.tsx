import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import type { Ref } from "react";
import { forwardRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import {
  getOutlinedFieldSx,
  groupLegendSx,
  helperTextSx,
  mergeSx,
  MUI_FIELD_SIZE,
} from "../../utils/field-styles";
import { formatMinutes, parseTimeToMinutes } from "../../utils/time-utils";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnTimeRangeFieldSkeleton } from "./CnTimeRangeFieldSkeleton";

/** Hora de inicio y fin en formato `HH:mm` (`""` = vacío). */
export type CnTimeRangeValue = [string, string];

export type CnTimeRangeFieldProps = CnFieldBaseProps<CnTimeRangeValue> & {
  startLabel?: string;
  endLabel?: string;
  /** Permite que el fin sea al día siguiente (turnos nocturnos: 22:00 – 06:00). */
  allowOvernight?: boolean;
  /** Duración mínima y máxima en minutos. */
  minDuration?: number;
  maxDuration?: number;
  /** Muestra la duración calculada junto a los campos. Por defecto `true`. */
  showDuration?: boolean;
  /** Paso de los minutos en el selector nativo. */
  minutesStep?: number;
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
};

const EMPTY: CnTimeRangeValue = ["", ""];

const toRange = (value: unknown): CnTimeRangeValue =>
  Array.isArray(value) ? [String(value[0] ?? ""), String(value[1] ?? "")] : EMPTY;

/** Duración en minutos de un rango (considera el cruce de medianoche si se permite). */
export const getTimeRangeMinutes = (value: unknown, allowOvernight = false): number | null => {
  const [start, end] = toRange(value);
  const from = parseTimeToMinutes(start);
  const to = parseTimeToMinutes(end);
  if (from === null || to === null) return null;
  if (to > from) return to - from;
  return allowOvernight && to !== from ? to + 1440 - from : null;
};

/** Reglas implícitas del rango de horas. */
export const buildTimeRangeRules = ({
  required,
  allowOvernight,
  minDuration,
  maxDuration,
}: {
  required?: boolean;
  allowOvernight?: boolean;
  minDuration?: number;
  maxDuration?: number;
} = {}): CnValidationRule[] => {
  const rules: CnValidationRule[] = [];
  if (required) {
    rules.push({
      type: "custom",
      message: "Indica la hora de inicio y de fin",
      validate: (v) => toRange(v).every((t) => t.trim() !== ""),
    });
  }
  rules.push({
    type: "custom",
    message: "Hora no válida",
    validate: (v) => toRange(v).every((t) => !t || parseTimeToMinutes(t) !== null),
  });
  rules.push({
    type: "custom",
    message: allowOvernight
      ? "La hora de fin no puede ser igual a la de inicio"
      : "La hora de fin debe ser posterior a la de inicio",
    validate: (v) => {
      const [start, end] = toRange(v);
      if (parseTimeToMinutes(start) === null || parseTimeToMinutes(end) === null) return true;
      return getTimeRangeMinutes(v, allowOvernight) !== null;
    },
  });
  if (minDuration !== undefined) {
    rules.push({
      type: "custom",
      message: `La duración mínima es ${formatMinutes(minDuration)}`,
      validate: (v) => {
        const minutes = getTimeRangeMinutes(v, allowOvernight);
        return minutes === null || minutes >= minDuration;
      },
    });
  }
  if (maxDuration !== undefined) {
    rules.push({
      type: "custom",
      message: `La duración máxima es ${formatMinutes(maxDuration)}`,
      validate: (v) => {
        const minutes = getTimeRangeMinutes(v, allowOvernight);
        return minutes === null || minutes <= maxDuration;
      },
    });
  }
  return rules;
};

/** Rango de horas "de – a" con duración calculada (horarios, turnos, citas…). */
export const CnTimeRangeField = forwardRef<HTMLDivElement, CnTimeRangeFieldProps>(
  function CnTimeRangeField(
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
      startLabel = "Inicio",
      endLabel = "Fin",
      allowOvernight = false,
      minDuration,
      maxDuration,
      showDuration = true,
      minutesStep,
      skeleton = false,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnTimeRangeValue>(
      value,
      defaultValue,
      EMPTY,
      onChange,
    );
    const range = toRange(current);
    const control = useFieldControl(range, {
      id,
      rules: [
        ...(rules ?? []),
        ...buildTimeRangeRules({ required, allowOvernight, minDuration, maxDuration }),
      ],
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

    if (skeleton) {
      return (
        <CnTimeRangeFieldSkeleton
          size={size}
          label={Boolean(label)}
          helperText={Boolean(control.helperText?.trim())}
          showDuration={showDuration}
          sx={sx}
          className={className}
        />
      );
    }

    const setPart = (index: 0 | 1, next: string) => {
      const updated: CnTimeRangeValue = [...range];
      updated[index] = next;
      control.markChanged();
      setCurrent(updated);
    };

    const minutes = getTimeRangeMinutes(range, allowOvernight);
    const overnight =
      minutes !== null &&
      (parseTimeToMinutes(range[1]) ?? 0) <= (parseTimeToMinutes(range[0]) ?? 0);
    const describedBy = control.helperText?.trim() ? control.helperId : undefined;

    const part = (index: 0 | 1) => (
      <TextField
        type="time"
        id={index === 0 ? control.id : `${control.id}-end`}
        label={index === 0 ? startLabel : endLabel}
        size={MUI_FIELD_SIZE[size]}
        value={range[index]}
        disabled={disabled}
        error={control.error}
        required={required}
        onChange={(event) => setPart(index, event.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: {
            readOnly,
            step: minutesStep ? minutesStep * 60 : undefined,
            name: name ? `${name}[${index}]` : undefined,
            "aria-describedby": describedBy,
          },
        }}
        sx={mergeSx(getOutlinedFieldSx(size), { flex: 1, minWidth: 0 })}
      />
    );

    return (
      <FormControl
        ref={ref as Ref<HTMLFieldSetElement>}
        component="fieldset"
        fullWidth
        error={control.error}
        disabled={disabled}
        required={required}
        className={className}
        data-cn-time-range-field
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
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", pt: label ? "6px" : 0 }}>
          {part(0)}
          <Box aria-hidden sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)" }}>
            –
          </Box>
          {part(1)}
          {showDuration && (
            <Box
              component="output"
              aria-live="polite"
              aria-label="Duración"
              data-cn-time-range-duration
              sx={{
                flexShrink: 0,
                minWidth: 72,
                px: "10px",
                py: "4px",
                borderRadius: "999px",
                fontSize: "var(--cn-font-size-sm, 12px)",
                fontWeight: 600,
                textAlign: "center",
                backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
                color:
                  minutes === null
                    ? "var(--cn-color-text-subtle, #9aa1aa)"
                    : "var(--cn-color-text, #222831)",
              }}
            >
              {minutes === null ? "—" : formatMinutes(minutes)}
              {overnight && (
                <Box
                  component="span"
                  sx={{ display: "block", fontSize: 10, fontWeight: 500, opacity: 0.75 }}
                >
                  +1 día
                </Box>
              )}
            </Box>
          )}
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
