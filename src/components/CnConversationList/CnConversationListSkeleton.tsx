import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";

export type CnConversationListSkeletonProps = CnSkeletonCommonProps & {
  /** Búsqueda arriba. */
  searchable?: boolean;
  /** Conversaciones simuladas. */
  rows?: number;
};

/** Skeleton de `CnConversationList`: búsqueda, encabezado de grupo y filas de 60 px con avatar. */
export const CnConversationListSkeleton = ({
  searchable = true,
  rows = 6,
  animation,
  ariaLabel = "Cargando conversaciones",
  sx,
  className,
}: CnConversationListSkeletonProps) => (
  <CnSkeletonGroup
    name="conversation-list"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      { minWidth: 0, backgroundColor: "var(--cn-color-surface, #ffffff)" },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {searchable && (
      <Box sx={{ p: "8px", borderBottom: "1px solid var(--cn-color-border, #dde0e4)" }}>
        <SkBlock width="100%" height={36} radius={8} />
      </Box>
    )}
    <Box sx={{ p: "4px 8px 8px" }}>
      <SkText width={50} size={11} sx={{ m: "12px 8px 8px" }} />
      {Array.from({ length: rows }, (_, i) => (
        <Box
          key={i}
          sx={{ minHeight: 60, display: "flex", alignItems: "center", gap: "10px", px: "8px" }}
        >
          <SkBlock width={36} height={36} circle />
          <Box sx={{ flex: 1, minWidth: 0, display: "grid", gap: "6px" }}>
            <SkText width={varyWidth(i, 40, 30)} size={14} />
            <SkText width={varyWidth(i + 3, 55, 30)} size={12} />
          </Box>
        </Box>
      ))}
    </Box>
  </CnSkeletonGroup>
);
