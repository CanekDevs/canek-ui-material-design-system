import Box from "@mui/material/Box";
import { Fragment } from "react";
import { FIELD_SIZE_TOKENS } from "../../utils/field-styles";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLabeled } from "../CnSkeleton";
import type { CnOtpFieldProps } from "./CnOtpField";

type Size = NonNullable<CnOtpFieldProps["size"]>;

export type CnOtpFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: Size;
  /** Número de recuadros (por defecto 6). */
  length?: number;
  /** Separador cada N recuadros (p. ej. `3` → "123 456"). */
  groupSize?: number;
  /** Caracteres ocultos: un punto en lugar del carácter. */
  mask?: boolean;
  label?: boolean | string;
  helperText?: boolean | string;
};

/** Skeleton de `CnOtpField`: un recuadro por carácter, con separadores por grupo. */
export const CnOtpFieldSkeleton = ({
  size = "md",
  length = 6,
  groupSize,
  mask = false,
  label = true,
  helperText = false,
  animation,
  ariaLabel = "Cargando código",
  sx,
  className,
}: CnOtpFieldSkeletonProps) => {
  const tokens = FIELD_SIZE_TOKENS[size];
  const box = tokens.height + 4;
  const glyph = tokens.fontSize + 6;

  return (
    <CnSkeletonGroup
      name="otp-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
        <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {Array.from({ length: Math.max(0, length) }, (_, index) => (
            <Fragment key={index}>
              {groupSize && index > 0 && index % groupSize === 0 ? (
                <Box data-cn-skeleton-separator sx={{ display: "inline-flex" }}>
                  <SkBlock width={8} height={2} radius={1} />
                </Box>
              ) : null}
              <Box
                data-cn-skeleton-box
                sx={{
                  width: box,
                  height: box + 4,
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--cn-radius-md, 8px)",
                  border: "1px solid var(--cn-color-border, #dde0e4)",
                  backgroundColor: "var(--cn-color-surface, #ffffff)",
                }}
              >
                {mask ? (
                  <SkBlock circle width={Math.round(glyph * 0.45)} />
                ) : (
                  <SkBlock
                    width={Math.round(glyph * 0.55)}
                    height={Math.round(glyph * 0.8)}
                    radius={3}
                  />
                )}
              </Box>
            </Fragment>
          ))}
        </Box>
      </SkLabeled>
    </CnSkeletonGroup>
  );
};
