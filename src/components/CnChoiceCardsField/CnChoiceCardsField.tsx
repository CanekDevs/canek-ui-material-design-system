import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import type { KeyboardEvent, ReactNode } from "react";
import { forwardRef, useRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import { hasOptionMedia, OptionMedia } from "../../utils/option-media";
import type { CnFieldOption } from "../CnForm/CnForm.types";

export type CnChoiceCardsValue = string | number | "" | null | Array<string | number>;

export type CnChoiceCardsOption = CnFieldOption & {
  /** Texto destacado a la derecha (precio, insignia…). */
  meta?: ReactNode;
};

export type CnChoiceCardsFieldProps = CnFieldBaseProps<CnChoiceCardsValue> & {
  options: readonly CnChoiceCardsOption[];
  /** Selección múltiple (casillas): el valor es un arreglo. */
  multiple?: boolean;
  /** Columnas en escritorio (en móvil siempre 1). Por defecto 2. */
  columns?: 1 | 2 | 3 | 4;
  /** Permite deseleccionar la opción activa (selección simple). */
  allowDeselect?: boolean;
  /** Contenido propio de cada tarjeta. */
  renderOption?: (option: CnChoiceCardsOption, selected: boolean) => ReactNode;
};

const keyOf = (value: string | number) => `${typeof value}:${value}`;

/**
 * Tarjetas seleccionables con ícono, descripción y metadato: planes, métodos
 * de pago, tipos de envío, roles… Funciona como radio (simple) o como grupo
 * de casillas (`multiple`), con navegación por flechas.
 */
export const CnChoiceCardsField = forwardRef<HTMLFieldSetElement, CnChoiceCardsFieldProps>(
  function CnChoiceCardsField(
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
      reserveHelperSpace,
      sx,
      className,
      options,
      multiple = false,
      columns = 2,
      allowDeselect = false,
      renderOption,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnChoiceCardsValue>(
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
    const itemsRef = useRef<Array<HTMLDivElement | null>>([]);

    const selectedKeys = new Set(
      multiple
        ? (Array.isArray(current) ? current : []).map(keyOf)
        : current === "" || current === null || current === undefined || Array.isArray(current)
          ? []
          : [keyOf(current)],
    );

    const toggle = (option: CnChoiceCardsOption) => {
      if (disabled || readOnly || option.disabled) return;
      control.markChanged();
      const key = keyOf(option.value);
      if (multiple) {
        const next = selectedKeys.has(key)
          ? options.filter((o) => selectedKeys.has(keyOf(o.value)) && keyOf(o.value) !== key)
          : options.filter((o) => selectedKeys.has(keyOf(o.value)) || keyOf(o.value) === key);
        setCurrent(next.map((o) => o.value));
        return;
      }
      if (selectedKeys.has(key)) {
        if (allowDeselect) setCurrent("");
        return;
      }
      setCurrent(option.value);
    };

    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const firstSelected = options.findIndex((o) => selectedKeys.has(keyOf(o.value)));
    const tabStop = multiple ? -1 : firstSelected >= 0 ? firstSelected : (enabled[0] ?? -1);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        toggle(options[index]);
        return;
      }
      const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
      const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
      if (!forward && !backward) return;
      event.preventDefault();
      const pos = enabled.indexOf(index);
      const nextIndex = enabled[(pos + (forward ? 1 : -1) + enabled.length) % enabled.length];
      itemsRef.current[nextIndex]?.focus();
      if (!multiple && nextIndex !== undefined) toggle(options[nextIndex]);
    };

    const labelId = `${control.id}-label`;

    return (
      <FormControl
        ref={ref}
        component="fieldset"
        error={control.error}
        disabled={disabled}
        required={required}
        fullWidth
        className={className}
        data-cn-choice-cards-field
        sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0 }, sx)}
      >
        {label && (
          <FormLabel component="legend" id={labelId} sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        <Box
          id={control.id}
          role={multiple ? "group" : "radiogroup"}
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={control.helperText ? control.helperId : undefined}
          aria-required={required || undefined}
          aria-invalid={control.error || undefined}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              control.markBlurred();
              onBlur?.();
            }
          }}
          sx={{
            display: "grid",
            gap: "10px",
            gridTemplateColumns: {
              xs: "1fr",
              sm: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))`,
              md: `repeat(${columns}, minmax(0, 1fr))`,
            },
          }}
        >
          {options.map((option, index) => {
            const isSelected = selectedKeys.has(keyOf(option.value));
            const isDisabled = Boolean(disabled || option.disabled);
            return (
              <Box
                key={keyOf(option.value)}
                ref={(node: HTMLDivElement | null) => {
                  itemsRef.current[index] = node;
                }}
                role={multiple ? "checkbox" : "radio"}
                aria-checked={isSelected}
                aria-disabled={isDisabled || undefined}
                aria-readonly={readOnly || undefined}
                tabIndex={isDisabled ? -1 : multiple || index === tabStop ? 0 : -1}
                data-selected={isSelected || undefined}
                onClick={() => toggle(option)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  minWidth: 0,
                  borderRadius: "var(--cn-radius-md, 8px)",
                  border: "1.5px solid",
                  borderColor: isSelected
                    ? "var(--cn-color-brand-600, #254d87)"
                    : control.error
                      ? "var(--cn-color-error-500, #d63c3c)"
                      : "var(--cn-color-border, #dde0e4)",
                  backgroundColor: isSelected
                    ? "var(--cn-color-brand-50, #eef3fb)"
                    : "var(--cn-color-surface, #ffffff)",
                  cursor: isDisabled ? "not-allowed" : readOnly ? "default" : "pointer",
                  opacity: isDisabled ? 0.55 : 1,
                  transition: "border-color 140ms ease, background-color 140ms ease",
                  outline: "none",
                  "&:hover":
                    isDisabled || readOnly
                      ? undefined
                      : {
                          borderColor: isSelected
                            ? undefined
                            : "var(--cn-color-brand-300, #7c9fdc)",
                        },
                  "&:focus-visible": {
                    boxShadow: "0 0 0 3px rgba(var(--cn-color-rgb-brand-400, 80, 129, 196), 0.35)",
                  },
                }}
              >
                {renderOption ? (
                  renderOption(option, isSelected)
                ) : (
                  <>
                    {hasOptionMedia(option) && (
                      <Box sx={{ flexShrink: 0, display: "inline-flex", pt: "1px" }}>
                        <OptionMedia option={option} size={28} />
                      </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0, pr: "22px" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            fontSize: "var(--cn-font-size-base, 13px)",
                            fontWeight: 600,
                            color: "var(--cn-color-text, #222831)",
                          }}
                        >
                          {option.label}
                        </Box>
                        {option.meta && (
                          <Box
                            component="span"
                            sx={{
                              fontSize: "var(--cn-font-size-sm, 12px)",
                              fontWeight: 600,
                              color: "var(--cn-color-brand-700, #1c3d6d)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {option.meta}
                          </Box>
                        )}
                      </Box>
                      {option.description && (
                        <Box
                          sx={{
                            mt: "2px",
                            fontSize: "var(--cn-font-size-sm, 12px)",
                            color: "var(--cn-color-text-muted, #6e7682)",
                            lineHeight: 1.45,
                          }}
                        >
                          {option.description}
                        </Box>
                      )}
                    </Box>
                  </>
                )}
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 18,
                    height: 18,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: multiple ? "4px" : "50%",
                    border: isSelected ? 0 : "1.5px solid var(--cn-color-neutral-300, #c4c9cf)",
                    color: "var(--cn-color-brand-600, #254d87)",
                  }}
                >
                  {isSelected && <CheckCircleIcon sx={{ fontSize: 20 }} />}
                </Box>
              </Box>
            );
          })}
        </Box>
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
