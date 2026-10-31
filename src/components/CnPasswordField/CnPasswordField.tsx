import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import { forwardRef, useMemo, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue } from "../../utils/field-control";
import { CnButton } from "../CnButton";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnTextField } from "../CnTextField";

export type CnPasswordRequirement = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export type CnPasswordRequirementsConfig = {
  minLength?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  number?: boolean;
  symbol?: boolean;
  /** Requisitos adicionales. */
  custom?: CnPasswordRequirement[];
};

export type CnPasswordFieldProps = CnFieldBaseProps<string> & {
  placeholder?: string;
  /** Requisitos visibles como lista que se va marcando. `false` para ocultarla. */
  requirements?: CnPasswordRequirementsConfig | false;
  showStrength?: boolean;
  /** Botón para generar una contraseña segura. */
  allowGenerate?: boolean;
  generatedLength?: number;
  /** `new-password` para registros, `current-password` para inicio de sesión. */
  autoComplete?: string;
  autoFocus?: boolean;
};

export const DEFAULT_PASSWORD_REQUIREMENTS: CnPasswordRequirementsConfig = {
  minLength: 8,
  uppercase: true,
  lowercase: true,
  number: true,
  symbol: false,
};

export const buildPasswordRequirements = (
  config: CnPasswordRequirementsConfig,
): CnPasswordRequirement[] => {
  const list: CnPasswordRequirement[] = [];
  if (config.minLength) {
    list.push({
      id: "length",
      label: `Al menos ${config.minLength} caracteres`,
      test: (p) => p.length >= (config.minLength ?? 0),
    });
  }
  if (config.uppercase)
    list.push({ id: "upper", label: "Una letra mayúscula", test: (p) => /[A-ZÑÁÉÍÓÚ]/.test(p) });
  if (config.lowercase)
    list.push({ id: "lower", label: "Una letra minúscula", test: (p) => /[a-zñáéíóú]/.test(p) });
  if (config.number) list.push({ id: "number", label: "Un número", test: (p) => /\d/.test(p) });
  if (config.symbol)
    list.push({
      id: "symbol",
      label: "Un símbolo (!@#$…)",
      test: (p) => /[^A-Za-z0-9ÑñÁÉÍÓÚáéíóú]/.test(p),
    });
  return [...list, ...(config.custom ?? [])];
};

/** Regla de validación equivalente a los requisitos (la usa también `CnForm`). */
export const buildPasswordRule = (config: CnPasswordRequirementsConfig): CnValidationRule => {
  const requirements = buildPasswordRequirements(config);
  return {
    type: "custom",
    message: "La contraseña no cumple los requisitos",
    validate: (v) => !v || requirements.every((r) => r.test(String(v))),
  };
};

const CHARSETS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  number: "23456789",
  symbol: "!@#$%&*?-_+=",
};

/** Genera una contraseña con `crypto.getRandomValues` que incluye cada tipo de carácter. */
export const generatePassword = (length = 16): string => {
  const random = (max: number) => {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] % max;
  };
  const sets = Object.values(CHARSETS);
  const all = sets.join("");
  const chars = sets.map((set) => set[random(set.length)]);
  while (chars.length < Math.max(length, sets.length)) chars.push(all[random(all.length)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

/**
 * Contraseña con requisitos visibles que se marcan al escribir, medidor de
 * fortaleza, botón mostrar/ocultar y generador seguro con copia al portapapeles.
 */
export const CnPasswordField = forwardRef<HTMLDivElement, CnPasswordFieldProps>(
  function CnPasswordField(
    {
      value,
      defaultValue,
      onChange,
      rules,
      requirements = DEFAULT_PASSWORD_REQUIREMENTS,
      showStrength = true,
      allowGenerate = false,
      generatedLength = 16,
      autoComplete = "new-password",
      disabled,
      readOnly,
      ...rest
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<string>(value, defaultValue, "", onChange);
    const [copied, setCopied] = useState(false);
    const list = useMemo(
      () => (requirements ? buildPasswordRequirements(requirements) : []),
      [requirements],
    );
    const allRules = useMemo(
      () => [...(rules ?? []), ...(requirements ? [buildPasswordRule(requirements)] : [])],
      [requirements, rules],
    );
    const blocked = Boolean(disabled || readOnly);

    const copy = async () => {
      try {
        await navigator.clipboard?.writeText(current);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        setCopied(false);
      }
    };

    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}
        data-cn-password-field
      >
        <CnTextField
          ref={ref}
          {...rest}
          type="password"
          passwordToggle
          showPasswordStrength={showStrength}
          autoComplete={autoComplete}
          disabled={disabled}
          readOnly={readOnly}
          value={current}
          onChange={setCurrent}
          rules={allRules}
          endAdornment={
            allowGenerate && current && !blocked ? (
              <InputAdornment position="end">
                <Tooltip title={copied ? "¡Copiada!" : "Copiar"}>
                  <IconButton
                    size="small"
                    aria-label="Copiar contraseña"
                    onClick={() => void copy()}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : undefined
          }
        />
        {list.length > 0 && current.length > 0 && (
          <Box
            component="ul"
            aria-label="Requisitos de la contraseña"
            sx={{
              listStyle: "none",
              m: 0,
              p: 0,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: "2px 12px",
            }}
          >
            {list.map((requirement) => {
              const met = requirement.test(current);
              return (
                <Box
                  component="li"
                  key={requirement.id}
                  data-met={met || undefined}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "var(--cn-font-size-xs, 11px)",
                    color: met
                      ? "var(--cn-color-success-600, #228740)"
                      : "var(--cn-color-text-muted, #6e7682)",
                    transition: "color 140ms ease",
                  }}
                >
                  {met ? (
                    <CheckCircleIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 14 }} />
                  )}
                  <span>
                    {requirement.label}
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        overflow: "hidden",
                        clip: "rect(0 0 0 0)",
                      }}
                    >
                      {met ? " (cumplido)" : " (pendiente)"}
                    </Box>
                  </span>
                </Box>
              );
            })}
          </Box>
        )}
        {allowGenerate && !blocked && (
          <Box>
            <CnButton
              size="small"
              variant="text"
              startIcon="key"
              onClick={() => {
                setCurrent(generatePassword(generatedLength));
                setCopied(false);
              }}
            >
              Generar contraseña segura
            </CnButton>
          </Box>
        )}
      </Box>
    );
  },
);
