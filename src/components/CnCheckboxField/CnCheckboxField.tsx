import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import type { ReactNode } from "react";
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

export type CnCheckboxValue = boolean | Array<string | number>;

export type CnCheckboxFieldProps = CnFieldBaseProps<CnCheckboxValue> & {
  /** Con `options` el campo es un grupo y su valor es un arreglo; sin ellas, un booleano. */
  options?: readonly CnFieldOption[];
  direction?: "row" | "column";
  /** Texto secundario bajo la etiqueta (modo simple). */
  description?: ReactNode;
  /** Agrega una casilla "Seleccionar todo" en modo grupo. */
  selectAll?: boolean | string;
  labelPlacement?: "start" | "end" | "top" | "bottom";
};

const OptionLabel = ({ label, description }: { label: ReactNode; description?: ReactNode }) => (
  <Box component="span" sx={{ display: "flex", flexDirection: "column" }}>
    <span>{label}</span>
    {description && (
      <Box
        component="span"
        sx={{
          fontSize: "var(--cn-font-size-xs, 11px)",
          fontWeight: 400,
          color: "var(--cn-color-text-muted, #6e7682)",
        }}
      >
        {description}
      </Box>
    )}
  </Box>
);

export const CnCheckboxField = forwardRef<HTMLDivElement, CnCheckboxFieldProps>(
  function CnCheckboxField(
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
      direction = "column",
      description,
      selectAll = false,
      labelPlacement = "end",
    },
    ref,
  ) {
    const isGroup = Array.isArray(options);
    const [current, setCurrent] = useControllableValue<CnCheckboxValue>(
      value,
      defaultValue,
      isGroup ? [] : false,
      onChange,
    );
    const control = useFieldControl(current, {
      id,
      rules,
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      // Sin escritura de por medio: se valida en cuanto cambia.
      debounceMs: debounceMs ?? 0,
      internalValidation,
      error,
      helperText,
      reserveHelperSpace,
    });
    const muiSize = size === "sm" ? "small" : "medium";
    const blocked = disabled || readOnly;

    const emit = (next: CnCheckboxValue) => {
      if (blocked) return;
      control.markChanged();
      setCurrent(next);
    };

    if (!isGroup) {
      return (
        <FormControl
          ref={ref}
          error={control.error}
          disabled={disabled}
          required={required}
          fullWidth
          className={className}
          data-cn-checkbox-field
          sx={sx}
        >
          <FormControlLabel
            labelPlacement={labelPlacement}
            control={
              <Checkbox
                id={control.id}
                name={name}
                size={muiSize}
                checked={Boolean(current)}
                onChange={(event) => emit(event.target.checked)}
                onBlur={onBlur}
                disabled={disabled}
                required={required}
                slotProps={{
                  input: {
                    "aria-describedby": control.helperText ? control.helperId : undefined,
                    "aria-invalid": control.error || undefined,
                    readOnly,
                  } as Record<string, unknown>,
                }}
                sx={choiceControlSx}
              />
            }
            label={
              <OptionLabel
                label={
                  <>
                    {label}
                    {required && (
                      <Box
                        component="span"
                        aria-hidden
                        sx={{ color: "var(--cn-color-error-500, #d63c3c)" }}
                      >
                        {" *"}
                      </Box>
                    )}
                  </>
                }
                description={description}
              />
            }
            sx={choiceLabelSx}
          />
          {control.helperText && (
            <FormHelperText id={control.helperId} sx={helperTextSx}>
              {control.helperText}
            </FormHelperText>
          )}
        </FormControl>
      );
    }

    const selected = Array.isArray(current) ? current : [];
    const enabledOptions = options.filter((option) => !option.disabled);
    const allChecked =
      enabledOptions.length > 0 && enabledOptions.every((o) => selected.includes(o.value));
    const someChecked = enabledOptions.some((o) => selected.includes(o.value));

    const toggle = (optionValue: string | number, checked: boolean) => {
      const next = checked
        ? [...selected, optionValue]
        : selected.filter((item) => item !== optionValue);
      // Conserva el orden declarado en las opciones.
      emit(options.map((o) => o.value).filter((v) => next.includes(v)));
    };

    return (
      <FormControl
        ref={ref as Ref<HTMLFieldSetElement>}
        component="fieldset"
        error={control.error}
        disabled={disabled}
        required={required}
        fullWidth
        className={className}
        data-cn-checkbox-field
        aria-describedby={control.helperText ? control.helperId : undefined}
        sx={mergeSx({ minWidth: 0 }, sx)}
      >
        {label && (
          <FormLabel component="legend" id={`${control.id}-label`} sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        <FormGroup row={direction === "row"} sx={{ gap: direction === "row" ? "4px 16px" : "2px" }}>
          {selectAll && (
            <FormControlLabel
              control={
                <Checkbox
                  size={muiSize}
                  checked={allChecked}
                  indeterminate={!allChecked && someChecked}
                  onChange={(event) =>
                    emit(
                      event.target.checked
                        ? options
                            .filter((o) => !o.disabled || selected.includes(o.value))
                            .map((o) => o.value)
                        : options
                            .filter((o) => o.disabled && selected.includes(o.value))
                            .map((o) => o.value),
                    )
                  }
                  sx={choiceControlSx}
                />
              }
              label={typeof selectAll === "string" ? selectAll : "Seleccionar todo"}
              sx={choiceLabelSx}
            />
          )}
          {options.map((option, index) => (
            <FormControlLabel
              key={`${typeof option.value}:${option.value}`}
              labelPlacement={labelPlacement}
              control={
                <Checkbox
                  id={index === 0 ? control.id : undefined}
                  name={name}
                  size={muiSize}
                  value={String(option.value)}
                  checked={selected.includes(option.value)}
                  onChange={(event) => toggle(option.value, event.target.checked)}
                  onBlur={onBlur}
                  disabled={disabled || option.disabled}
                  sx={choiceControlSx}
                />
              }
              label={<OptionLabel label={option.label} description={option.description} />}
              sx={choiceLabelSx}
            />
          ))}
        </FormGroup>
        {control.helperText && (
          <FormHelperText id={control.helperId} sx={helperTextSx}>
            {control.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);
