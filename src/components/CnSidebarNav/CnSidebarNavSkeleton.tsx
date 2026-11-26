import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";

export type CnSidebarNavSkeletonProps = CnSkeletonCommonProps & {
  /** Modo mini: solo íconos. */
  collapsed?: boolean;
  /** Páginas simuladas. */
  rows?: number;
};

/** Skeleton de `CnSidebarNav`: mismo ancho, alto de fila (40 px) y disposición que el menú real. */
export const CnSidebarNavSkeleton = ({
  collapsed = false,
  rows = 6,
  animation,
  ariaLabel = "Cargando navegación",
  sx,
  className,
}: CnSidebarNavSkeletonProps) => (
  <CnSkeletonGroup
    name="sidebar-nav"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      {
        width: collapsed ? 64 : 264,
        maxWidth: "100%",
        height: "100%",
        boxSizing: "border-box",
        p: "8px",
        borderRight: "1px solid var(--cn-color-border, #dde0e4)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {!collapsed && <SkText width="40%" size={11} sx={{ m: "6px 12px 8px" }} />}
    <Box sx={{ display: "grid", gap: "2px" }}>
      {Array.from({ length: rows }, (_, i) => (
        <Box
          key={i}
          sx={{
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "12px",
            px: collapsed ? "0px" : "12px",
          }}
        >
          <SkBlock width={20} height={20} radius={6} />
          {!collapsed && <SkText width={varyWidth(i, 50, 30)} size={14} />}
        </Box>
      ))}
    </Box>
  </CnSkeletonGroup>
);
