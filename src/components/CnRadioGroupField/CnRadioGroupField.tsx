import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import type { Ref } from "react";
import { forwardRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import {
  choiceControlSx,
  choiceLabelSx,
  groupLegendSx,
  helperTextSx,
  mergeSx,
} from "../../utils/field-styles";
import type { CnFieldOption } from "../CnForm/CnForm.types";

export type CnRadioValue = string | number | "" | null;

export type CnRadioGroupFieldProps = CnFieldBaseProps<CnRadioValue> & {
  options: readonly CnFieldOption[];
  direction?: "row" | "column";
  /** Opciones como tarjetas seleccionables en lugar de radios simples. */
  appearance?: "default" | "card";
};

const keyOf = (value: string | number): string => `${typeof value}:${value}`;

export const CnRadioGroupField = forwardRef<HTMLDivElement, CnRadioGroupFieldProps>(
  function CnRadioGroupField(
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
      options,
      direction = "row",
      appearance = "default",
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnRadioValue>(
      value,
      defaultValue,
      "",
      onChange,
    );
    const control = useFieldControl(current, {
      id,
      rules,
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

    const selectedKey =
      current === "" || current === null || current === undefined ? "" : keyOf(current);
    const isCard = appearance === "card";

    return (
      <FormControl
        ref={ref as Ref<HTMLFieldSetElement>}
        component="fieldset"
        error={control.error}
        disabled={disabled}
        required={required}
        fullWidth
        className={className}
        data-cn-radio-group-field
        sx={mergeSx({ minWidth: 0 }, sx)}
      >
        {label && (
          <FormLabel component="legend" id={`${control.id}-label`} sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        <RadioGroup
          name={name ?? control.id}
          row={direction === "row"}
          value={selectedKey}
          aria-labelledby={label ? `${control.id}-label` : undefined}
          aria-describedby={control.helperText ? control.helperId : undefined}
          aria-invalid={control.error || undefined}
          onChange={(event) => {
            if (readOnly) return;
            const option = options.find((o) => keyOf(o.value) === event.target.value);
            if (!option) return;
            control.markChanged();
            setCurrent(option.value);
          }}
          onBlur={onBlur}
          sx={{
            gap: isCard ? "8px" : direction === "row" ? "4px 16px" : "2px",
            ...(isCard && {
              display: "grid",
              gridTemplateColumns:
                direction === "row" ? "repeat(auto-fit, minmax(160px, 1fr))" : "1fr",
            }),
          }}
        >
          {options.map((option, index) => {
            const key = keyOf(option.value);
            const checked = key === selectedKey;
            return (
              <FormControlLabel
                key={key}
                value={key}
                disabled={disabled || option.disabled}
                control={
                  <Radio
                    id={index === 0 ? control.id : undefined}
                    size={size === "sm" ? "small" : "medium"}
                    sx={choiceControlSx}
                  />
                }
                label={
                  <Box component="span" sx={{ display: "flex", flexDirection: "column" }}>
                    <span>{option.label}</span>
                    {option.description && (
                      <Box
                        component="span"
                        sx={{
                          fontSize: "var(--cn-font-size-xs, 11px)",
                          fontWeight: 400,
                          color: "var(--cn-color-text-muted, #6e7682)",
                        }}
                      >
                        {option.description}
                      </Box>
                    )}
                  </Box>
                }
                sx={mergeSx(
                  choiceLabelSx,
                  isCard
                    ? {
                        alignItems: "flex-start",
                        padding: "8px 12px 8px 4px",
                        border: "1px solid",
                        borderColor: checked
                          ? "var(--cn-color-brand-500, #3562a6)"
                          : "var(--cn-color-border, #dde0e4)",
                        borderRadius: "var(--cn-radius-md, 8px)",
                        backgroundColor: checked
                          ? "var(--cn-color-brand-50, #eef3fb)"
                          : "var(--cn-color-surface, #ffffff)",
                        transition: "border-color 140ms ease, background-color 140ms ease",
                        "& .MuiRadio-root": { paddingTop: "2px" },
                      }
                    : {},
                )}
              />
            );
          })}
        </RadioGroup>
        {control.helperText && (
          <FormHelperText id={control.helperId} sx={helperTextSx}>
            {control.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);
