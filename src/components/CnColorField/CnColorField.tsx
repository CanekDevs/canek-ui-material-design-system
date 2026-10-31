import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputAdornment from "@mui/material/InputAdornment";
import Popover from "@mui/material/Popover";
import { forwardRef, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue } from "../../utils/field-control";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnTextField } from "../CnTextField";

export type CnColorFieldProps = CnFieldBaseProps<string> & {
  /** Colores sugeridos (hex). Por defecto, la paleta de canek. */
  presets?: string[];
  /** Permite escribir el color manualmente. */
  allowInput?: boolean;
  placeholder?: string;
};

export const DEFAULT_COLOR_PRESETS = [
  "#254d87",
  "#3562a6",
  "#3d5afe",
  "#2367a8",
  "#2e9e4f",
  "#228740",
  "#e0a020",
  "#b8831a",
  "#d63c3c",
  "#b52f2f",
  "#8e44ad",
  "#16a085",
  "#e67e22",
  "#6e7682",
  "#222831",
  "#ffffff",
];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normaliza `#abc` → `#aabbcc` en minúsculas; `null` si no es hex válido. */
export const normalizeHex = (value: string): string | null => {
  const trimmed = value.trim().startsWith("#") ? value.trim() : `#${value.trim()}`;
  if (!HEX.test(trimmed)) return null;
  const hex = trimmed.slice(1).toLowerCase();
  return `#${
    hex.length === 3
      ? Array.from(hex)
          .map((c) => c + c)
          .join("")
      : hex
  }`;
};

export const COLOR_RULE: CnValidationRule = {
  type: "custom",
  message: "Color no válido (formato #RRGGBB)",
  validate: (v) => !v || normalizeHex(String(v)) !== null,
};

const Swatch = ({ color, size = 18 }: { color: string; size?: number }) => (
  <Box
    component="span"
    aria-hidden
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: "var(--cn-radius-xs, 4px)",
      border: "1px solid rgba(0,0,0,0.15)",
      backgroundColor: normalizeHex(color) ?? "transparent",
      backgroundImage: normalizeHex(color)
        ? undefined
        : "linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%)",
      backgroundSize: "8px 8px",
      backgroundPosition: "0 0, 4px 4px",
    }}
  />
);

/** Selector de color: hex con validación, paleta sugerida y selector nativo. */
export const CnColorField = forwardRef<HTMLDivElement, CnColorFieldProps>(function CnColorField(
  {
    value,
    defaultValue,
    onChange,
    presets = DEFAULT_COLOR_PRESETS,
    allowInput = true,
    placeholder = "#000000",
    rules,
    disabled,
    readOnly,
    label,
    ...rest
  },
  ref,
) {
  const [current, setCurrent] = useControllableValue<string>(value, defaultValue, "", onChange);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const blocked = Boolean(disabled || readOnly);
  const valid = normalizeHex(current ?? "");

  const pick = (color: string) => {
    setCurrent(normalizeHex(color) ?? color);
  };

  return (
    <Box ref={anchorRef} sx={{ width: "100%" }}>
      <CnTextField
        ref={ref}
        {...rest}
        label={label}
        disabled={disabled}
        readOnly={readOnly || !allowInput}
        value={current ?? ""}
        placeholder={placeholder}
        maxLength={7}
        transform="lowercase"
        onChange={(text) => setCurrent(text && !text.startsWith("#") ? `#${text}` : text)}
        onBlur={() => {
          if (valid && valid !== current) setCurrent(valid);
          rest.onBlur?.();
        }}
        rules={[...(rules ?? []), COLOR_RULE]}
        slotProps={{ htmlInput: { spellCheck: false, autoComplete: "off" } }}
        startAdornment={
          <InputAdornment position="start">
            <ButtonBase
              aria-label={label ? `Elegir color: ${label}` : "Elegir color"}
              aria-haspopup="dialog"
              aria-expanded={open}
              disabled={blocked}
              onClick={() => setOpen(true)}
              sx={{
                borderRadius: "var(--cn-radius-xs, 4px)",
                "&.Mui-focusVisible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
              }}
            >
              <Swatch color={current ?? ""} size={22} />
            </ButtonBase>
          </InputAdornment>
        }
      />
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": "Selector de color",
            sx: { mt: "4px", p: "12px", borderRadius: "var(--cn-radius-lg, 12px)", width: 240 },
          } as Record<string, unknown>,
        }}
      >
        <Box
          role="listbox"
          aria-label="Colores sugeridos"
          sx={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "6px" }}
        >
          {presets.map((color) => {
            const selected = normalizeHex(color) === valid;
            return (
              <ButtonBase
                key={color}
                role="option"
                aria-selected={selected}
                aria-label={color}
                onClick={() => {
                  pick(color);
                  setOpen(false);
                }}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: color,
                  border: "1px solid rgba(0,0,0,0.15)",
                  outline: selected ? "2px solid var(--cn-color-brand-500, #3562a6)" : "none",
                  outlineOffset: 2,
                  "&.Mui-focusVisible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
                }}
              />
            );
          })}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            mt: "12px",
            fontSize: "var(--cn-font-size-sm, 12px)",
          }}
        >
          <Box
            component="input"
            type="color"
            aria-label="Color personalizado"
            value={valid ?? "#000000"}
            onChange={(event) => pick(event.currentTarget.value)}
            sx={{ width: 36, height: 28, p: 0, border: 0, background: "none", cursor: "pointer" }}
          />
          Personalizado
          <Box
            component="span"
            sx={{
              ml: "auto",
              fontFamily: "monospace",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {valid ?? "—"}
          </Box>
        </Box>
      </Popover>
    </Box>
  );
});
