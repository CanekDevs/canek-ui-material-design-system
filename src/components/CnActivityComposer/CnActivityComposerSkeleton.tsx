import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";

export type CnActivityComposerSkeletonProps = CnSkeletonCommonProps & {
  /** Pestañas de tipo de actividad (0 o 1 = sin pestañas). */
  tabs?: number;
};

/** Skeleton de `CnActivityComposer`: pestañas, área de texto y pie con acciones. */
export const CnActivityComposerSkeleton = ({
  tabs = 5,
  animation,
  ariaLabel = "Cargando",
  sx,
  className,
}: CnActivityComposerSkeletonProps) => (
  <CnSkeletonGroup
    name="activity-composer"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      {
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-md, 8px)",
        overflow: "hidden",
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {tabs > 1 && (
      <Box
        sx={{
          display: "flex",
          gap: "24px",
          px: "16px",
          height: "48px",
          alignItems: "center",
          borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: tabs }, (_, i) => (
          <SkText key={i} width={64} size={14} sx={{ flexShrink: 0 }} />
        ))}
      </Box>
    )}
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", p: "16px" }}>
      <SkBlock width="100%" height={96} radius={6} />
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <SkText width="40%" size={12} />
        <SkBlock width={128} height={36} radius={8} sx={{ ml: "auto" }} />
      </Box>
    </Box>
  </CnSkeletonGroup>
);
