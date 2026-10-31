import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import type { Ref } from "react";
import { forwardRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import type { CnNumberFieldControls } from "../CnNumberField";
import { CnNumberField } from "../CnNumberField";

export type CnNumberRangeValue = [number | null, number | null];

export type CnNumberRangeFieldProps = CnFieldBaseProps<CnNumberRangeValue> & {
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  startLabel?: string;
  endLabel?: string;
  controls?: CnNumberFieldControls;
  thousandSeparator?: boolean;
};

export const NUMBER_RANGE_RULES: CnValidationRule[] = [
  {
    type: "custom",
    message: "El valor mínimo no puede ser mayor que el máximo",
    validate: (v) => {
      if (!Array.isArray(v)) return true;
      const [from, to] = v as CnNumberRangeValue;
      return from === null || to === null || from <= to;
    },
  },
];

/** Rango numérico "desde – hasta" (precios, edades, superficies…). */
export const CnNumberRangeField = forwardRef<HTMLDivElement, CnNumberRangeFieldProps>(
  function CnNumberRangeField(
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
      min,
      max,
      step,
      decimals,
      prefix,
      suffix,
      startLabel = "Mínimo",
      endLabel = "Máximo",
      controls = "none",
      thousandSeparator,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnNumberRangeValue>(
      value,
      defaultValue,
      [null, null],
      onChange,
    );
    const range: CnNumberRangeValue = Array.isArray(current) ? current : [null, null];
    const control = useFieldControl(range, {
      id,
      rules: [
        ...(rules ?? []),
        ...NUMBER_RANGE_RULES,
        ...(required
          ? [
              {
                type: "custom" as const,
                message: "Indica el mínimo y el máximo",
                validate: (v: unknown) => Array.isArray(v) && v.every((n) => n !== null),
              },
            ]
          : []),
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

    const setPart = (index: 0 | 1, next: number | null) => {
      const updated: CnNumberRangeValue = [...range];
      updated[index] = next;
      control.markChanged();
      setCurrent(updated);
    };

    const common = {
      min,
      max,
      step,
      decimals,
      prefix,
      suffix,
      controls,
      thousandSeparator,
      size,
      disabled,
      readOnly,
      error: control.error,
    };

    return (
      <FormControl
        ref={ref as Ref<HTMLFieldSetElement>}
        component="fieldset"
        fullWidth
        error={control.error}
        disabled={disabled}
        required={required}
        className={className}
        data-cn-number-range-field
        sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0 }, sx)}
      >
        {label && (
          <FormLabel component="legend" sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CnNumberField
            {...common}
            id={control.id}
            name={name ? `${name}[0]` : undefined}
            label={startLabel}
            value={range[0]}
            max={range[1] ?? max}
            onChange={(next) => setPart(0, next)}
            onBlur={() => {
              control.markBlurred();
              onBlur?.();
            }}
          />
          <Box aria-hidden sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)" }}>
            –
          </Box>
          <CnNumberField
            {...common}
            id={`${control.id}-end`}
            name={name ? `${name}[1]` : undefined}
            label={endLabel}
            value={range[1]}
            min={range[0] ?? min}
            onChange={(next) => setPart(1, next)}
            onBlur={() => {
              control.markBlurred();
              onBlur?.();
            }}
          />
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
