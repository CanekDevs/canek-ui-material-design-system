import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { forwardRef, useCallback, useMemo, useState } from "react";
import { formatNumber } from "../../utils/number-utils";
import type { CnNumberFieldProps } from "../CnNumberField";
import { CnNumberField } from "../CnNumberField";

export type CnCurrencySelectorMode = "editable" | "readonly" | "hidden";

export type CnCurrencyFieldProps = Omit<
  CnNumberFieldProps,
  "prefix" | "format" | "thousandSeparator" | "startAdornment"
> & {
  /** Código ISO 4217 (MXN, USD, EUR...). Controlado si se pasa junto con `onCurrencyChange`. */
  currency?: string;
  defaultCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  /** Monedas disponibles en el selector. */
  currencies?: string[];
  /** `editable` muestra un selector, `readonly` el código, `hidden` solo el símbolo. */
  currencySelectorMode?: CnCurrencySelectorMode;
};

const DEFAULT_CURRENCIES = ["MXN", "USD", "EUR", "COP", "ARS", "CLP", "PEN", "BRL", "GBP", "CAD"];

export const getCurrencySymbol = (currency: string, locale = "es-MX"): string => {
  try {
    const parts = new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
};

export const CnCurrencyField = forwardRef<HTMLDivElement, CnCurrencyFieldProps>(
  function CnCurrencyField(
    {
      currency: currencyProp,
      defaultCurrency = "MXN",
      onCurrencyChange,
      currencies = DEFAULT_CURRENCIES,
      currencySelectorMode = "hidden",
      decimals = 2,
      locale = "es-MX",
      min = 0,
      controls = "none",
      disabled,
      readOnly,
      ...rest
    },
    ref,
  ) {
    const [internalCurrency, setInternalCurrency] = useState(defaultCurrency);
    const currency = (currencyProp ?? internalCurrency).toUpperCase();
    const symbol = useMemo(() => getCurrencySymbol(currency, locale), [currency, locale]);

    const handleCurrency = (next: string) => {
      if (currencyProp === undefined) setInternalCurrency(next);
      onCurrencyChange?.(next);
    };

    const format = useCallback(
      (num: number) => formatNumber(num, { locale, decimals }),
      [decimals, locale],
    );

    const options = currencies.includes(currency) ? currencies : [currency, ...currencies];

    const adornment =
      currencySelectorMode === "editable" ? (
        <InputAdornment position="start" sx={{ mr: "4px" }}>
          <Select
            variant="standard"
            disableUnderline
            value={currency}
            disabled={disabled || readOnly}
            onChange={(event) => handleCurrency(String(event.target.value))}
            inputProps={{ "aria-label": "Moneda" }}
            renderValue={(selected) => `${getCurrencySymbol(String(selected), locale)} ${selected}`}
            sx={{
              fontSize: "var(--cn-font-size-sm, 12px)",
              fontWeight: 600,
              color: "var(--cn-color-text-muted, #6e7682)",
              "& .MuiSelect-select": { paddingBlock: 0 },
            }}
          >
            {options.map((code) => (
              <MenuItem key={code} value={code} sx={{ fontSize: "var(--cn-font-size-base, 13px)" }}>
                {getCurrencySymbol(code, locale)} {code}
              </MenuItem>
            ))}
          </Select>
        </InputAdornment>
      ) : (
        <InputAdornment position="start">
          <span aria-label={`Moneda ${currency}`}>
            {symbol}
            {currencySelectorMode === "readonly" && symbol !== currency ? ` ${currency}` : ""}
          </span>
        </InputAdornment>
      );

    return (
      <CnNumberField
        ref={ref}
        {...rest}
        min={min}
        controls={controls}
        decimals={decimals}
        locale={locale}
        disabled={disabled}
        readOnly={readOnly}
        format={format}
        startAdornment={adornment}
      />
    );
  },
);
