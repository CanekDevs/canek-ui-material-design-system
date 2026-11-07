import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnFlagIconVariant } from "./CnFlagIcon";

export type CnFlagIconSkeletonProps = CnSkeletonCommonProps & {
  /** Alto en px; el ancho sigue la proporción 3:2. */
  size?: number;
  variant?: CnFlagIconVariant;
  /** Nombre del país (`with-name` y `full`): con texto, el ancho sigue su longitud. */
  name?: boolean | string;
  /** Lada (`full`). */
  dialCode?: boolean | string;
  /** Tamaño de fuente del texto acompañante (px). */
  fontSize?: number;
};

const textWidth = (value: boolean | string, font: number, fallback: number) =>
  typeof value === "string"
    ? Math.max(12, Math.round(value.length * font * 0.55))
    : font * fallback;

/** Skeleton de `CnFlagIcon`: bandera 3:2 y, según la variante, nombre y lada. */
export const CnFlagIconSkeleton = ({
  size = 16,
  variant = "icon",
  name = true,
  dialCode = true,
  fontSize = 13,
  animation,
  ariaLabel = "Cargando bandera",
  sx,
  className,
}: CnFlagIconSkeletonProps) => (
  <CnSkeletonGroup
    name="flag-icon"
    inline
    animation={animation}
    ariaLabel={ariaLabel}
    sx={sx}
    className={className}
  >
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <SkBlock width={Math.round(size * 1.5)} height={size} radius={2} />
      {variant !== "icon" && name && (
        <SkText width={textWidth(name, fontSize, 6)} size={fontSize} />
      )}
      {variant === "full" && dialCode && (
        <SkText width={textWidth(dialCode, fontSize, 2.6)} size={fontSize} />
      )}
    </Box>
  </CnSkeletonGroup>
);
