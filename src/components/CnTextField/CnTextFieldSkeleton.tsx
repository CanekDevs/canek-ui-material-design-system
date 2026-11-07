import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnTextFieldSize, CnTextFieldType, CnTextFieldVariant } from "./CnTextField";

export type CnTextFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: CnTextFieldSize;
  variant?: CnTextFieldVariant;
  type?: CnTextFieldType;
  /** Etiqueta flotante (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  multiline?: boolean;
  rows?: number;
  minRows?: number;
  startIcon?: string | boolean;
  endIcon?: string | boolean;
  clearable?: boolean;
  passwordToggle?: boolean;
  showPasswordStrength?: boolean;
  showCounter?: boolean;
  maxLength?: number;
  fullWidth?: boolean;
  width?: number | string;
};

/** Skeleton de `CnTextField` con las mismas variantes y medidas. */
export const CnTextFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  type = "text",
  label = true,
  helperText = false,
  multiline = false,
  rows,
  minRows,
  startIcon,
  endIcon,
  clearable = false,
  passwordToggle = true,
  showPasswordStrength = false,
  showCounter = false,
  maxLength,
  fullWidth = true,
  width,
  animation,
  ariaLabel = "Cargando campo",
  sx,
  className,
}: CnTextFieldSkeletonProps) => {
  const isTextarea = type === "textarea" || multiline;
  const lines = isTextarea ? (rows ?? minRows ?? 3) : undefined;
  const isPassword = type === "password";
  const hasEnd = Boolean(endIcon) || clearable || (isPassword && passwordToggle);
  const counter = showCounter || (isTextarea && maxLength != null);

  return (
    <CnSkeletonGroup name="text-field" animation={animation} ariaLabel={ariaLabel} sx={sx} className={className}>
      <CnFieldSkeleton
        size={size}
        variant={variant}
        label={Boolean(label)}
        fullWidth={fullWidth}
        width={width}
        rows={lines}
        startAdornment={startIcon ? "icon" : false}
        endAdornment={hasEnd ? "icon" : false}
        below={
          isPassword && showPasswordStrength ? (
            <Box sx={{ display: "flex", gap: "4px", mt: "8px" }}>
              {[0, 1, 2, 3].map((i) => (
                <SkBlock key={i} height={4} width="25%" radius={2} />
              ))}
            </Box>
          ) : undefined
        }
      />
      {(helperText || counter) && (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: "12px", mt: "6px" }}>
          {helperText ? <SkText width="42%" size={11} /> : <span />}
          {counter && <SkText width={36} size={11} />}
        </Box>
      )}
    </CnSkeletonGroup>
  );
};
