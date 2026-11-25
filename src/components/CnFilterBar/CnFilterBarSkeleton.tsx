import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock } from "../CnSkeleton";

export type CnFilterBarSkeletonProps = CnSkeletonCommonProps & {
  /** Caja de búsqueda. */
  search?: boolean;
  /** Chips de filtro rápido. */
  quickFilters?: number;
  /** Botón de vistas guardadas. */
  views?: boolean;
};

/** Skeleton de `CnFilterBar`: vistas, búsqueda, botón de filtros y chips. */
export const CnFilterBarSkeleton = ({
  search = true,
  quickFilters = 3,
  views = false,
  animation,
  ariaLabel = "Cargando",
  sx,
  className,
}: CnFilterBarSkeletonProps) => (
  <CnSkeletonGroup
    name="filter-bar"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={sx}
  >
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {views && <SkBlock width={160} height={40} radius={8} />}
        {search && <SkBlock width="min(320px, 100%)" height={40} radius={8} />}
        <SkBlock width={104} height={40} radius={8} />
      </Box>
      {quickFilters > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Array.from({ length: quickFilters }, (_, i) => (
            <SkBlock key={i} width={96 + (i % 2) * 24} height={32} radius={16} />
          ))}
        </Box>
      )}
    </Box>
  </CnSkeletonGroup>
);
