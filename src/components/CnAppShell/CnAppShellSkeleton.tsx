import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";

export type CnAppShellSkeletonProps = CnSkeletonCommonProps & {
  /** Navegación en modo mini. */
  collapsed?: boolean;
  height?: string | number;
};

/** Skeleton de `CnAppShell`: navegación (264 o 64 px), barra de 56 px y bloques de contenido. */
export const CnAppShellSkeleton = ({
  collapsed = false,
  height = "100dvh",
  animation,
  ariaLabel = "Cargando aplicación",
  sx,
  className,
}: CnAppShellSkeletonProps) => (
  <CnSkeletonGroup
    name="app-shell"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      {
        display: "flex",
        height,
        minWidth: 0,
        overflow: "hidden",
        backgroundColor: "var(--cn-color-bg, #fafbfc)",
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Box
      sx={{
        width: collapsed ? 64 : 264,
        flex: "none",
        p: "8px",
        boxSizing: "border-box",
        display: { xs: "none", md: "block" },
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        borderRight: "1px solid var(--cn-color-border, #dde0e4)",
      }}
    >
      <SkBlock width={collapsed ? 32 : 140} height={28} radius={8} sx={{ m: "6px 6px 20px" }} />
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          sx={{
            height: 40,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            px: collapsed ? "14px" : "12px",
          }}
        >
          <SkBlock width={20} height={20} radius={6} />
          {!collapsed && <SkText width={varyWidth(i, 45, 35)} size={14} />}
        </Box>
      ))}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          height: 56,
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          px: "16px",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
        }}
      >
        <SkBlock width={40} height={40} circle />
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
          <SkBlock width="100%" height={36} radius={8} sx={{ maxWidth: 480 }} />
        </Box>
        <SkBlock width={40} height={40} circle />
      </Box>
      <Box sx={{ p: "24px", display: "grid", gap: "16px", minWidth: 0 }}>
        <SkText width="30%" size={24} />
        <SkBlock width="100%" height={120} radius={12} />
        <SkBlock width="100%" height={240} radius={12} />
      </Box>
    </Box>
  </CnSkeletonGroup>
);
