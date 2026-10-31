import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import {
  DEFAULT_PHONE_COUNTRIES,
  formatNationalNumber,
  isValidNationalNumber,
  onlyDigits,
  parsePhoneValue,
  PHONE_COUNTRIES,
  toE164,
} from "../../utils/phone-countries";
import type { CnPhoneCountryCode } from "../CnForm/CnForm.types";

export type CnPhoneValueFormat = "e164" | "national";

export type CnPhoneFieldProps = CnFieldBaseProps<string> & {
  placeholder?: string;
  defaultCountry?: CnPhoneCountryCode;
  /** Países disponibles en el selector (por defecto, todos los soportados). */
  countries?: readonly CnPhoneCountryCode[];
  /** Oculta el selector y fija `defaultCountry`. */
  showCountrySelect?: boolean;
  onCountryChange?: (country: CnPhoneCountryCode) => void;
  /** `e164` → "+525512345678" (por defecto). `national` → "5512345678". */
  valueFormat?: CnPhoneValueFormat;
  /** Valida que el número tenga la longitud del país (además de `rules`). */
  validateLength?: boolean;
  autoFocus?: boolean;
};

export const CnPhoneField = forwardRef<HTMLDivElement, CnPhoneFieldProps>(function CnPhoneField(
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
    internalValidation = true,
    size = "md",
    reserveHelperSpace,
    sx,
    className,
    placeholder,
    defaultCountry = "MX",
    countries = DEFAULT_PHONE_COUNTRIES,
    showCountrySelect = true,
    onCountryChange,
    valueFormat = "e164",
    validateLength = true,
    autoFocus,
  },
  ref,
) {
  const external = value ?? defaultValue ?? "";
  const initial = useMemo(
    () => parsePhoneValue(external, countries, defaultCountry),
    // Solo para el estado inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [countryCode, setCountryCode] = useState<CnPhoneCountryCode>(initial.country);
  const [national, setNational] = useState(initial.national);
  const lastEmittedRef = useRef<string>(external);
  const country = PHONE_COUNTRIES[countryCode];

  // Sincroniza cambios externos (reset, carga de datos).
  useEffect(() => {
    if (value === undefined || value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    const parsed =
      valueFormat === "national" && !value.startsWith("+")
        ? { country: countryCode, national: onlyDigits(value) }
        : parsePhoneValue(value, countries, countryCode);
    setCountryCode(parsed.country);
    setNational(parsed.national);
  }, [countries, countryCode, value, valueFormat]);

  const lengthRule = useMemo(
    () =>
      validateLength
        ? [
            {
              type: "custom" as const,
              message: `Número inválido para ${country.name}. Ejemplo: ${country.example}`,
              validate: () => !national || isValidNationalNumber(national, country),
            },
          ]
        : [],
    [country, national, validateLength],
  );

  const control = useFieldControl(national, {
    id,
    rules: [...(rules ?? []), ...lengthRule],
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

  const emit = useCallback(
    (nextNational: string, nextCountry: CnPhoneCountryCode) => {
      const formatted =
        valueFormat === "national"
          ? nextNational
          : toE164(nextNational, PHONE_COUNTRIES[nextCountry]);
      lastEmittedRef.current = formatted;
      onChange?.(formatted);
    },
    [onChange, valueFormat],
  );

  const handleCountry = (next: CnPhoneCountryCode) => {
    setCountryCode(next);
    const trimmed = national.slice(0, PHONE_COUNTRIES[next].maxLength);
    setNational(trimmed);
    onCountryChange?.(next);
    if (trimmed) emit(trimmed, next);
  };

  const countrySelect =
    showCountrySelect && countries.length > 1 ? (
      <InputAdornment position="start" sx={{ mr: "4px" }}>
        <Select
          variant="standard"
          disableUnderline
          value={countryCode}
          disabled={disabled || readOnly}
          onChange={(event) => handleCountry(event.target.value as CnPhoneCountryCode)}
          inputProps={{ "aria-label": "País" }}
          renderValue={(code) => `${code} ${PHONE_COUNTRIES[code as CnPhoneCountryCode].dialCode}`}
          MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320 } } } }}
          sx={{
            fontSize: "var(--cn-font-size-sm, 12px)",
            fontWeight: 600,
            color: "var(--cn-color-text-muted, #6e7682)",
            "& .MuiSelect-select": { paddingBlock: 0 },
          }}
        >
          {countries.map((code) => (
            <MenuItem
              key={code}
              value={code}
              sx={{ fontSize: "var(--cn-font-size-base, 13px)", gap: "8px" }}
            >
              <strong style={{ minWidth: 24 }}>{code}</strong>
              {PHONE_COUNTRIES[code].name}
              <span style={{ marginLeft: "auto", color: "var(--cn-color-text-muted, #6e7682)" }}>
                {PHONE_COUNTRIES[code].dialCode}
              </span>
            </MenuItem>
          ))}
        </Select>
      </InputAdornment>
    ) : (
      <InputAdornment position="start">{country.dialCode}</InputAdornment>
    );

  return (
    <TextField
      ref={ref}
      id={control.id}
      name={name}
      label={label}
      placeholder={placeholder ?? country.example}
      required={required}
      disabled={disabled}
      error={control.error}
      helperText={control.helperText}
      value={formatNationalNumber(national, country)}
      autoFocus={autoFocus}
      fullWidth
      size={MUI_FIELD_SIZE[size]}
      className={className}
      data-cn-phone-field
      onChange={(event) => {
        const digits = onlyDigits(event.target.value).slice(0, country.maxLength);
        setNational(digits);
        control.markChanged();
        emit(digits, countryCode);
      }}
      onBlur={() => {
        control.markBlurred();
        onBlur?.();
      }}
      slotProps={{
        input: { readOnly, startAdornment: countrySelect },
        htmlInput: {
          inputMode: "tel",
          autoComplete: "tel-national",
          "aria-invalid": control.error || undefined,
        },
      }}
      sx={mergeSx(getOutlinedFieldSx(size), sx)}
    />
  );
});
