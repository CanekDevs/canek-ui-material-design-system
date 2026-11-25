import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";

export type CnDealCardSkeletonProps = CnSkeletonCommonProps & {
  density?: "comfortable" | "compact";
};

/** Skeleton de `CnDealCard`: título, empresa, monto, probabilidad y próxima actividad. */
export const CnDealCardSkeleton = ({
  density = "comfortable",
  animation,
  ariaLabel = "Cargando",
  sx,
  className,
}: CnDealCardSkeletonProps) => {
  const compact = density === "compact";
  return (
    <CnSkeletonGroup
      name="deal-card"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          p: compact ? "12px" : "16px",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "var(--cn-radius-md, 8px)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: compact ? "8px" : "12px" }}>
        <Box sx={{ display: "flex", gap: "8px" }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <SkText width="80%" size={14} />
            <SkText width="50%" size={12} />
          </Box>
          <SkBlock circle width={32} />
        </Box>
        <SkText width="45%" size={16} />
        <SkBlock width="100%" height={4} radius={2} />
        <SkText width="60%" size={12} />
        {!compact && (
          <Box sx={{ display: "flex", gap: "4px" }}>
            <SkBlock width={64} height={20} radius={4} />
            <SkBlock width={48} height={20} radius={4} />
          </Box>
        )}
      </Box>
    </CnSkeletonGroup>
  );
};
