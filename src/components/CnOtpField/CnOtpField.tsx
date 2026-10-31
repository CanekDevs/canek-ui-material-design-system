import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import type { ClipboardEvent, KeyboardEvent, Ref } from "react";
import { forwardRef, useEffect, useRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { FIELD_SIZE_TOKENS, groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";

export type CnOtpFieldProps = CnFieldBaseProps<string> & {
  /** Número de caracteres (por defecto 6). */
  length?: number;
  /** `numeric` solo dígitos; `alphanumeric` letras y números (en mayúsculas). */
  inputType?: "numeric" | "alphanumeric";
  /** Oculta los caracteres como contraseña. */
  mask?: boolean;
  /** Separa visualmente en grupos (p. ej. `3` → "123 456"). */
  groupSize?: number;
  /** Se llama al completar todos los caracteres. */
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
};

/**
 * Captura de códigos de verificación (OTP / 2FA): un recuadro por carácter,
 * pegado del código completo, navegación con flechas y autocompletado de SMS
 * (`autocomplete="one-time-code"`).
 */
export const CnOtpField = forwardRef<HTMLDivElement, CnOtpFieldProps>(function CnOtpField(
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
    length = 6,
    inputType = "numeric",
    mask = false,
    groupSize,
    onComplete,
    autoFocus,
  },
  ref,
) {
  const [current, setCurrent] = useControllableValue<string>(value, defaultValue, "", onChange);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const lastCompleteRef = useRef<string>("");
  const chars = Array.from({ length }, (_, i) => current[i] ?? "");
  const control = useFieldControl(current, {
    id,
    rules: [
      ...(rules ?? []),
      {
        type: "custom",
        message: `Ingresa los ${length} caracteres`,
        validate: (v) => !v || String(v).length === length,
      },
    ],
    formValues,
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs,
    internalValidation,
    error,
    helperText,
    reserveHelperSpace,
  });
  const blocked = Boolean(disabled || readOnly);
  const pattern = inputType === "numeric" ? /\d/ : /[a-z0-9]/i;

  useEffect(() => {
    if (current.length === length && current !== lastCompleteRef.current) {
      lastCompleteRef.current = current;
      onComplete?.(current);
    }
    if (current.length < length) lastCompleteRef.current = "";
  }, [current, length, onComplete]);

  const clean = (text: string) =>
    Array.from(text)
      .filter((char) => pattern.test(char))
      .join("")
      .toUpperCase();

  const focusAt = (index: number) => {
    const target = inputsRef.current[Math.max(0, Math.min(length - 1, index))];
    target?.focus();
    target?.select();
  };

  const writeAt = (index: number, text: string) => {
    const incoming = clean(text);
    if (!incoming) return;
    const next = chars.slice();
    for (let i = 0; i < incoming.length && index + i < length; i += 1)
      next[index + i] = incoming[i];
    control.markChanged();
    setCurrent(next.join("").slice(0, length));
    focusAt(index + incoming.length);
  };

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (blocked) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = chars.slice();
      if (next[index]) {
        next[index] = "";
      } else if (index > 0) {
        next[index - 1] = "";
        focusAt(index - 1);
      }
      control.markChanged();
      setCurrent(next.join("").replace(/\s+$/, "").slice(0, length));
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(length - 1);
    }
  };

  const handlePaste = (index: number) => (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (!blocked) writeAt(index, event.clipboardData.getData("text"));
  };

  const box = FIELD_SIZE_TOKENS[size].height + 4;

  return (
    <FormControl
      ref={ref as Ref<HTMLFieldSetElement>}
      component="fieldset"
      error={control.error}
      disabled={disabled}
      required={required}
      className={className}
      data-cn-otp-field
      sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0 }, sx)}
    >
      {label && (
        <FormLabel component="legend" id={`${control.id}-label`} sx={groupLegendSx}>
          {label}
        </FormLabel>
      )}
      <input type="hidden" name={name} value={current} />
      <Box
        role="group"
        aria-labelledby={label ? `${control.id}-label` : undefined}
        sx={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}
      >
        {chars.map((char, index) => (
          <Box key={index} sx={{ display: "contents" }}>
            {groupSize && index > 0 && index % groupSize === 0 && (
              <Box
                aria-hidden
                sx={{
                  width: 8,
                  height: 2,
                  backgroundColor: "var(--cn-color-neutral-300, #c5cad0)",
                }}
              />
            )}
            <Box
              component="input"
              ref={(node: HTMLInputElement | null) => {
                inputsRef.current[index] = node;
              }}
              id={index === 0 ? control.id : undefined}
              type={mask ? "password" : "text"}
              inputMode={inputType === "numeric" ? "numeric" : "text"}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              autoFocus={autoFocus && index === 0}
              maxLength={length}
              value={char}
              disabled={disabled}
              readOnly={readOnly}
              aria-label={`Carácter ${index + 1} de ${length}`}
              aria-invalid={control.error || undefined}
              aria-describedby={control.helperText ? control.helperId : undefined}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => {
                if (blocked) return;
                const typed =
                  event.currentTarget.value.replace(char, "") || event.currentTarget.value;
                writeAt(index, typed);
              }}
              onKeyDown={handleKeyDown(index)}
              onPaste={handlePaste(index)}
              onBlur={() => {
                control.markBlurred();
                onBlur?.();
              }}
              sx={{
                width: box,
                height: box + 4,
                textAlign: "center",
                fontSize: FIELD_SIZE_TOKENS[size].fontSize + 6,
                fontWeight: 600,
                fontFamily: "var(--cn-font-sans, inherit)",
                color: "var(--cn-color-text, #222831)",
                borderRadius: "var(--cn-radius-md, 8px)",
                border: "1px solid",
                borderColor: control.error
                  ? "var(--cn-color-error-500, #d63c3c)"
                  : char
                    ? "var(--cn-color-brand-300, #7c9fdc)"
                    : "var(--cn-color-border, #dde0e4)",
                backgroundColor: disabled
                  ? "var(--cn-color-neutral-100, #f4f5f7)"
                  : "var(--cn-color-surface, #ffffff)",
                outline: "none",
                caretColor: "var(--cn-color-brand-500, #3562a6)",
                transition: "border-color 120ms ease, box-shadow 120ms ease",
                "&:focus": {
                  borderColor: "var(--cn-color-brand-500, #3562a6)",
                  boxShadow: "0 0 0 3px rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.18)",
                },
              }}
            />
          </Box>
        ))}
      </Box>
      {control.helperText && (
        <FormHelperText id={control.helperId} sx={helperTextSx}>
          {control.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
});
