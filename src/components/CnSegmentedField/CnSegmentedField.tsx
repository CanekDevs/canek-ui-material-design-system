import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { Ref } from "react";
import { forwardRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { FIELD_SIZE_TOKENS, groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import { OptionMedia } from "../../utils/option-media";
import type { CnFieldOption } from "../CnForm/CnForm.types";

export type CnSegmentedValue = string | number | "" | null | Array<string | number>;

export type CnSegmentedFieldProps = CnFieldBaseProps<CnSegmentedValue> & {
  options: readonly CnFieldOption[];
  /** Selección múltiple: el valor es un arreglo. */
  multiple?: boolean;
  /** Permite deseleccionar la opción activa (solo selección simple). */
  allowDeselect?: boolean;
  fullWidth?: boolean;
  /** Solo íconos (la etiqueta queda como texto accesible). */
  iconOnly?: boolean;
  orientation?: "horizontal" | "vertical";
};

const keyOf = (value: string | number) => `${typeof value}:${value}`;

/**
 * Botones segmentados (selección simple o múltiple) para elegir entre pocas
 * opciones visibles: vista, periodo, prioridad, días de la semana…
 */
export const CnSegmentedField = forwardRef<HTMLDivElement, CnSegmentedFieldProps>(
  function CnSegmentedField(
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
      multiple = false,
      allowDeselect = false,
      fullWidth = false,
      iconOnly = false,
      orientation = "horizontal",
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnSegmentedValue>(
      value,
      defaultValue,
      multiple ? [] : "",
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

    const byKey = new Map(options.map((option) => [keyOf(option.value), option]));
    const selected = multiple
      ? (Array.isArray(current) ? current : []).map(keyOf)
      : current === "" || current === null || current === undefined || Array.isArray(current)
        ? null
        : keyOf(current);

    return (
      <FormControl
        ref={ref as Ref<HTMLFieldSetElement>}
        component="fieldset"
        error={control.error}
        disabled={disabled}
        required={required}
        fullWidth={fullWidth}
        className={className}
        data-cn-segmented-field
        sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0 }, sx)}
      >
        {label && (
          <FormLabel component="legend" id={`${control.id}-label`} sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        <ToggleButtonGroup
          id={control.id}
          exclusive={!multiple}
          value={selected}
          orientation={orientation}
          fullWidth={fullWidth}
          disabled={disabled}
          aria-labelledby={label ? `${control.id}-label` : undefined}
          aria-describedby={control.helperText ? control.helperId : undefined}
          onChange={(_, next: string | string[] | null) => {
            if (readOnly) return;
            if (!multiple && next === null && !allowDeselect) return;
            control.markChanged();
            if (Array.isArray(next)) {
              // Conserva el orden declarado en las opciones.
              setCurrent(options.filter((o) => next.includes(keyOf(o.value))).map((o) => o.value));
            } else {
              setCurrent(next === null ? "" : (byKey.get(next)?.value ?? ""));
            }
          }}
          onBlur={onBlur}
          sx={{
            backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
            borderRadius: "var(--cn-radius-md, 8px)",
            padding: "3px",
            gap: "2px",
            "& .MuiToggleButtonGroup-grouped": {
              border: 0,
              borderRadius: "var(--cn-radius-sm, 6px) !important",
              margin: 0,
            },
          }}
        >
          {options.map((option) => (
            <ToggleButton
              key={keyOf(option.value)}
              value={keyOf(option.value)}
              disabled={option.disabled}
              aria-label={iconOnly ? option.label : undefined}
              title={iconOnly ? option.label : option.description}
              sx={{
                minHeight: FIELD_SIZE_TOKENS[size].height - 6,
                px: iconOnly ? "10px" : "14px",
                gap: "6px",
                textTransform: "none",
                fontFamily: "inherit",
                fontSize: FIELD_SIZE_TOKENS[size].fontSize,
                fontWeight: 600,
                color: "var(--cn-color-text-muted, #6e7682)",
                "&:hover": {
                  backgroundColor: "rgba(var(--cn-color-rgb-neutral-200, 221, 224, 228), 0.6)",
                },
                "&.Mui-selected, &.Mui-selected:hover": {
                  color: "var(--cn-color-brand-700, #1c3d6d)",
                  backgroundColor: "var(--cn-color-surface, #ffffff)",
                  boxShadow: "0 1px 3px rgba(17, 20, 24, 0.12)",
                },
                "&.Mui-focusVisible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
              }}
            >
              {(option.icon || option.flag || option.avatar || option.initials) && (
                <OptionMedia option={option} size={20} />
              )}
              {!iconOnly && <Box component="span">{option.label}</Box>}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {name && (
          <input
            type="hidden"
            name={name}
            value={Array.isArray(current) ? current.join(",") : String(current ?? "")}
          />
        )}
        {control.helperText && (
          <FormHelperText id={control.helperId} sx={helperTextSx}>
            {control.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);
