import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";

export type CnNotificationCenterSkeletonProps = CnSkeletonCommonProps & {
  /** `button`: solo la campana; `inline`: panel con encabezado, pestañas y filas. */
  mode?: "button" | "inline";
  rows?: number;
  tabs?: number;
};

/** Skeleton de `CnNotificationCenter` (campana o panel en línea). */
export const CnNotificationCenterSkeleton = ({
  mode = "button",
  rows = 5,
  tabs = 3,
  animation,
  ariaLabel = "Cargando notificaciones",
  sx,
  className,
}: CnNotificationCenterSkeletonProps) => {
  if (mode === "button") {
    return (
      <CnSkeletonGroup
        name="notification-center"
        inline
        animation={animation}
        ariaLabel={ariaLabel}
        className={className}
        sx={sx}
      >
        <SkBlock circle width={36} />
      </CnSkeletonGroup>
    );
  }
  return (
    <CnSkeletonGroup
      name="notification-center"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "var(--cn-radius-lg, 12px)",
          overflow: "hidden",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ px: "16px", pt: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
          <SkText width="40%" size={16} />
          <SkText width="22%" size={12} />
        </Box>
        <SkBlock circle width={28} />
      </Box>
      {tabs > 1 && (
        <Box
          sx={{
            display: "flex",
            gap: "16px",
            px: "16px",
            py: "12px",
            borderBottom: "1px solid var(--cn-color-border-subtle, #e9ecef)",
          }}
        >
          {Array.from({ length: tabs }, (_, i) => (
            <SkText key={i} width={56 + (i % 2) * 14} size={12} />
          ))}
        </Box>
      )}
      {Array.from({ length: rows }, (_, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            gap: "12px",
            px: "16px",
            py: "12px",
            borderBottom: i < rows - 1 ? "1px solid var(--cn-color-border-subtle, #e9ecef)" : 0,
          }}
        >
          <SkBlock width={32} radius="var(--cn-radius-md, 8px)" />
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            <SkText width={varyWidth(i, 45, 35)} size={13} />
            <SkText width={varyWidth(i + 3, 60, 35)} size={12} />
          </Box>
          <SkText width={40} size={11} />
        </Box>
      ))}
    </CnSkeletonGroup>
  );
};
