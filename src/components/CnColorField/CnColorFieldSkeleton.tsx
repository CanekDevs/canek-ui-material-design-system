import Box from "@mui/material/Box";
import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnColorFieldProps } from "./CnColorField";
import { DEFAULT_COLOR_PRESETS } from "./CnColorField";

type FieldSize = NonNullable<CnColorFieldProps["size"]>;

const FONT_SIZE: Record<FieldSize, number> = { sm: 12, md: 13, lg: 15 };

export type CnColorFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: FieldSize;
  variant?: CnFieldSkeletonProps["variant"];
  /** Etiqueta flotante (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Muestra el valor hex (`#rrggbb`); `false` simula el campo vacío. */
  value?: boolean;
  /**
   * Muestra la paleta sugerida bajo el campo (en el campo real vive en el
   * selector emergente). Por defecto oculta.
   */
  palette?: boolean;
  /** Colores de la paleta (la lista del campo o cuántos son). */
  presets?: CnColorFieldProps["presets"] | number;
  fullWidth?: boolean;
  width?: number | string;
};

/** Skeleton de `CnColorField`: muestra de color, valor hex y, opcionalmente, la paleta. */
export const CnColorFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  value = true,
  palette = false,
  presets = DEFAULT_COLOR_PRESETS,
  fullWidth = true,
  width,
  animation,
  ariaLabel = "Cargando selector de color",
  sx,
  className,
}: CnColorFieldSkeletonProps) => {
  const fontSize = FONT_SIZE[size];
  const swatches = typeof presets === "number" ? presets : presets.length;
  return (
    <CnSkeletonGroup
      name="color-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <CnFieldSkeleton
        size={size}
        variant={variant}
        label={Boolean(label)}
        helperText={Boolean(helperText)}
        fullWidth={fullWidth}
        width={width}
        below={
          palette && swatches > 0 ? (
            <Box
              data-cn-skeleton-palette
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 22px)",
                gap: "6px",
                mt: "10px",
              }}
            >
              {Array.from({ length: swatches }, (_, i) => (
                <SkBlock key={i} circle width={22} />
              ))}
            </Box>
          ) : undefined
        }
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
          <SkBlock width={22} height={22} radius={4} />
          {value && <SkText width={Math.round(7 * fontSize * 0.62)} size={fontSize} />}
        </Box>
      </CnFieldSkeleton>
    </CnSkeletonGroup>
  );
};
