import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";

export type CnCommandPaletteSkeletonProps = CnSkeletonCommonProps & {
  /** Filas simuladas. */
  rows?: number;
};

/** Skeleton de la lista de `CnCommandPalette`: encabezado de grupo y filas de 44 px con ícono y nombre. */
export const CnCommandPaletteSkeleton = ({
  rows = 6,
  animation,
  ariaLabel = "Cargando comandos",
  sx,
  className,
}: CnCommandPaletteSkeletonProps) => (
  <CnSkeletonGroup
    name="command-palette"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={sx}
  >
    <SkText width={80} size={11} sx={{ m: "6px 10px" }} />
    {Array.from({ length: rows }, (_, i) => (
      <Box
        key={i}
        sx={{ height: 44, display: "flex", alignItems: "center", gap: "12px", px: "10px" }}
      >
        <SkBlock width={20} height={20} radius={6} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SkText width={varyWidth(i, 35, 35)} size={14} />
        </Box>
      </Box>
    ))}
  </CnSkeletonGroup>
);
