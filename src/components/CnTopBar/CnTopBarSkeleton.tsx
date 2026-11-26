import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";

export type CnTopBarSkeletonProps = CnSkeletonCommonProps & {
  /** Botón de menú a la izquierda. */
  menu?: boolean;
  /** Barra de búsqueda al centro. */
  search?: boolean;
};

/** Skeleton de `CnTopBar`: 56 px de alto, menú, marca, búsqueda, acciones y avatar en sus lugares. */
export const CnTopBarSkeleton = ({
  menu = true,
  search = true,
  animation,
  ariaLabel = "Cargando barra superior",
  sx,
  className,
}: CnTopBarSkeletonProps) => (
  <CnSkeletonGroup
    name="top-bar"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      {
        height: 56,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        px: "16px",
        minWidth: 0,
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {menu && <SkBlock width={40} height={40} radius={20} />}
    <SkText width={120} size={16} />
    <Box sx={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
      {search && <SkBlock width="100%" height={36} radius={8} sx={{ maxWidth: 480 }} />}
    </Box>
    <SkBlock width={40} height={40} circle />
    <SkBlock width={40} height={40} circle />
  </CnSkeletonGroup>
);
