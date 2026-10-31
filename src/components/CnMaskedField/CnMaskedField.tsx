import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import { forwardRef, useMemo } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue } from "../../utils/field-control";
import type { CnMaskPreset, CnMaskPresetName } from "../../utils/mask-utils";
import {
  applyMask,
  detectCardBrand,
  maskCapacity,
  MASK_PRESETS,
  unmask,
} from "../../utils/mask-utils";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnTextField } from "../CnTextField";

export type CnMaskedFieldProps = CnFieldBaseProps<string> & {
  /** Máscara (`#` dígito, `A` letra, `*` alfanumérico) o un preset. */
  mask?: string;
  preset?: CnMaskPresetName;
  /** `raw` emite solo los caracteres capturados; `masked` incluye separadores. */
  valueMode?: "raw" | "masked";
  placeholder?: string;
  /** Exige que se complete toda la máscara. Por defecto `true`. */
  requireComplete?: boolean;
  /** Muestra la marca detectada en tarjetas de crédito. */
  showCardBrand?: boolean;
  startIcon?: string;
  autoFocus?: boolean;
  autoComplete?: string;
};

const BRAND_LABEL: Record<string, string> = {
  visa: "VISA",
  mastercard: "Mastercard",
  amex: "AMEX",
  discover: "Discover",
};

/** Reglas de la máscara (completitud + validación del preset). Las usa también `CnForm`. */
export const buildMaskRules = (
  mask: string,
  preset?: CnMaskPreset,
  requireComplete = true,
): CnValidationRule[] => {
  const capacity = maskCapacity(mask);
  const rules: CnValidationRule[] = [];
  if (requireComplete) {
    rules.push({
      type: "custom",
      message: `Formato incompleto: ${preset?.placeholder ?? mask.replace(/#/g, "0")}`,
      validate: (v) => !v || unmask(String(v), mask).length === capacity,
    });
  }
  if (preset?.validate) {
    const check = preset.validate;
    rules.push({
      type: "custom",
      message: preset.message ?? "Formato no válido",
      validate: (v) => {
        const raw = unmask(String(v ?? ""), mask);
        return !raw || raw.length < capacity || check(raw);
      },
    });
  }
  return rules;
};

/**
 * Campo con máscara de captura genérica y presets para México y pagos:
 * tarjeta (Luhn + marca), vencimiento, CVV, CLABE (dígito verificador), NSS,
 * CURP, RFC, CP, teléfono y hora.
 */
export const CnMaskedField = forwardRef<HTMLDivElement, CnMaskedFieldProps>(function CnMaskedField(
  {
    mask: maskProp,
    preset,
    valueMode = "raw",
    placeholder,
    requireComplete = true,
    showCardBrand = true,
    value,
    defaultValue,
    onChange,
    rules,
    startIcon,
    ...rest
  },
  ref,
) {
  const presetConfig: CnMaskPreset | undefined = preset ? MASK_PRESETS[preset] : undefined;
  const mask = maskProp ?? presetConfig?.mask ?? "";
  // Siempre controlado hacia CnTextField para que el texto visible lleve la máscara.
  const [current, setCurrent] = useControllableValue<string>(value, defaultValue, "", onChange);
  const maskRules = useMemo(
    () => buildMaskRules(mask, presetConfig, requireComplete),
    [mask, presetConfig, requireComplete],
  );
  const raw = unmask(String(current ?? ""), mask);
  const brand = preset === "creditCard" && showCardBrand ? detectCardBrand(raw) : "unknown";

  return (
    <CnTextField
      ref={ref}
      {...rest}
      value={applyMask(String(current ?? ""), mask)}
      placeholder={
        placeholder ?? presetConfig?.placeholder ?? mask.replace(/#/g, "0").replace(/[A*]/g, "X")
      }
      onChange={(text) => {
        const masked = applyMask(text, mask);
        setCurrent(valueMode === "raw" ? unmask(masked, mask) : masked);
      }}
      maxLength={mask.length}
      startIcon={startIcon ?? (preset === "creditCard" ? "credit_card" : undefined)}
      rules={[...(rules ?? []), ...maskRules]}
      slotProps={{
        htmlInput: {
          inputMode: presetConfig?.inputMode ?? (/^[#\W]*$/.test(mask) ? "numeric" : "text"),
          spellCheck: false,
        },
      }}
      endAdornment={
        brand !== "unknown" ? (
          <InputAdornment position="end">
            <Box
              component="span"
              aria-label={`Tarjeta ${BRAND_LABEL[brand]}`}
              sx={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.5,
                px: "6px",
                py: "2px",
                borderRadius: "4px",
                color: "#fff",
                backgroundColor:
                  brand === "visa"
                    ? "#1a1f71"
                    : brand === "mastercard"
                      ? "#eb001b"
                      : brand === "amex"
                        ? "#2e77bc"
                        : "#ff6000",
              }}
            >
              {BRAND_LABEL[brand]}
            </Box>
          </InputAdornment>
        ) : undefined
      }
    />
  );
});
