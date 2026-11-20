import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";
import type { CnTimelineAlign, CnTimelineOrientation, CnTimelineSize } from "./CnTimeline.types";

export type CnTimelineSkeletonProps = CnSkeletonCommonProps & {
  count?: number;
  orientation?: CnTimelineOrientation;
  align?: CnTimelineAlign;
  size?: CnTimelineSize;
  /** Encabezados de día. */
  groups?: boolean;
  /** Barra de búsqueda y filtros. */
  toolbar?: boolean;
  /** Líneas de descripción por elemento. */
  lines?: number;
};

const MARKER: Record<CnTimelineSize, number> = { sm: 24, md: 32 };

/** Skeleton de `CnTimeline`: marcadores, conector y textos por elemento. */
export const CnTimelineSkeleton = ({
  count = 4,
  orientation = "vertical",
  align = "left",
  size = "md",
  groups = false,
  toolbar = false,
  lines = 1,
  animation,
  ariaLabel = "Cargando actividad",
  sx,
  className,
}: CnTimelineSkeletonProps) => {
  const marker = MARKER[size];
  const toolbarNode = toolbar && (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", mb: "16px" }}>
      <SkBlock width="min(100%, 280px)" height={34} radius={17} />
      <Box sx={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {[64, 82, 56].map((w, i) => (
          <SkBlock key={i} width={w} height={24} radius={12} />
        ))}
      </Box>
    </Box>
  );
  const text = (i: number, right = false) => (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: right ? "flex-end" : "flex-start",
        gap: "6px",
        pt: "6px",
      }}
    >
      <SkText width={varyWidth(i, 45, 30)} size={13} />
      {Array.from({ length: lines }, (_, l) => (
        <SkText key={l} width={varyWidth(i + l + 2, 60, 35)} size={12} />
      ))}
    </Box>
  );

  if (orientation === "horizontal") {
    return (
      <CnSkeletonGroup
        name="timeline"
        animation={animation}
        ariaLabel={ariaLabel}
        className={className}
        sx={sx}
      >
        {toolbarNode}
        <Box sx={{ display: "flex", overflow: "hidden" }}>
          {Array.from({ length: count }, (_, i) => (
            <Box key={i} sx={{ flex: "1 0 auto", width: size === "sm" ? 168 : 208, pr: "16px" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: "10px", gap: "6px" }}>
                <SkBlock circle width={marker} />
                {i < count - 1 && <SkBlock width="100%" height={2} radius={1} sx={{ flex: 1 }} />}
              </Box>
              {text(i)}
            </Box>
          ))}
        </Box>
      </CnSkeletonGroup>
    );
  }

  const row = (i: number, last: boolean) => {
    const right = align === "right" || (align === "alternate" && i % 2 === 1);
    const markerCol = (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: marker,
          flexShrink: 0,
        }}
      >
        <SkBlock circle width={marker} />
        {!last && <SkBlock width={2} height={28} radius={1} sx={{ mt: "4px" }} />}
      </Box>
    );
    if (align === "alternate") {
      return (
        <Box
          key={i}
          sx={{ display: "grid", gridTemplateColumns: `1fr ${marker}px 1fr`, columnGap: "14px" }}
        >
          <Box sx={{ minWidth: 0 }}>{right ? text(i, true) : null}</Box>
          {markerCol}
          <Box sx={{ minWidth: 0 }}>{right ? null : text(i)}</Box>
        </Box>
      );
    }
    return (
      <Box
        key={i}
        sx={{ display: "flex", gap: "14px", flexDirection: right ? "row-reverse" : "row" }}
      >
        {markerCol}
        {text(i, right)}
      </Box>
    );
  };

  return (
    <CnSkeletonGroup
      name="timeline"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={sx}
    >
      {toolbarNode}
      <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {groups && <SkText width={64} size={11} sx={{ mb: "8px" }} />}
        {Array.from({ length: count }, (_, i) => (
          <Box key={i}>
            {groups && i > 0 && i % 3 === 0 && <SkText width={80} size={11} sx={{ my: "8px" }} />}
            {row(i, i === count - 1)}
          </Box>
        ))}
      </Box>
    </CnSkeletonGroup>
  );
};
