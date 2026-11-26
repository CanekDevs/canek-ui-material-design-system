import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLines, SkText, varyWidth } from "../CnSkeleton";

export type CnContactTimelineSkeletonProps = CnSkeletonCommonProps & {
  /** Compositor en línea arriba del historial. */
  composer?: boolean;
  /** Búsqueda y chips de canal. */
  filters?: boolean;
  /** Actividades. */
  count?: number;
};

/** Skeleton de `CnContactTimeline`: compositor, filtros y actividades con marcador. */
export const CnContactTimelineSkeleton = ({
  composer = true,
  filters = true,
  count = 4,
  animation,
  ariaLabel = "Cargando",
  sx,
  className,
}: CnContactTimelineSkeletonProps) => (
  <CnSkeletonGroup
    name="contact-timeline"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={sx}
  >
    <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {composer && (
        <Box
          sx={{
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderRadius: "var(--cn-radius-md, 8px)",
            p: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <Box sx={{ display: "flex", gap: "24px", overflow: "hidden" }}>
            {Array.from({ length: 5 }, (_, i) => (
              <SkText key={i} width={64} size={14} sx={{ flexShrink: 0 }} />
            ))}
          </Box>
          <SkBlock width="100%" height={96} radius={6} />
          <SkBlock width={128} height={36} radius={8} sx={{ alignSelf: "flex-end" }} />
        </Box>
      )}
      {filters && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <SkBlock width="min(280px, 100%)" height={40} radius={8} />
          {Array.from({ length: 4 }, (_, i) => (
            <SkBlock key={i} width={88} height={32} radius={16} />
          ))}
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <SkText width={56} size={12} />
        {Array.from({ length: count }, (_, i) => (
          <Box key={i} sx={{ display: "flex", gap: "12px" }}>
            <SkBlock circle width={32} />
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}
            >
              <SkText width={varyWidth(i, 40, 30)} size={14} />
              <SkLines lines={2} size={13} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  </CnSkeletonGroup>
);
