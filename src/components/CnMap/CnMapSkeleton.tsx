import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock } from "../CnSkeleton";

export type CnMapSkeletonProps = CnSkeletonCommonProps & {
  /** Alto en px (o cualquier valor CSS). Por defecto 320. */
  height?: number | string;
  /** Muestra los controles de zoom. Por defecto `true`. */
  controls?: boolean;
  /** Pines de ejemplo. Por defecto 3. */
  pins?: number;
  /** Marco con borde y radio de 12 px. Por defecto `true`. */
  framed?: boolean;
};

const PIN_SPOTS = [
  { left: "32%", top: "38%" },
  { left: "58%", top: "52%" },
  { left: "44%", top: "68%" },
  { left: "70%", top: "30%" },
  { left: "22%", top: "60%" },
];

const ROADS = [
  { left: 0, right: 0, top: "45%", height: 6 },
  { top: 0, bottom: 0, left: "38%", width: 6 },
  { left: "38%", right: 0, top: "74%", height: 4 },
  { top: 0, bottom: "55%", left: "66%", width: 4 },
];

/** Skeleton de `CnMap`: lienzo, pines y controles. */
export const CnMapSkeleton = ({
  height = 320,
  controls = true,
  pins = 3,
  framed = true,
  animation,
  ariaLabel = "Cargando mapa",
  sx,
  className,
}: CnMapSkeletonProps) => (
  <CnSkeletonGroup
    name="map"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      {
        position: "relative",
        height,
        overflow: "hidden",
        borderRadius: framed ? "12px" : 0,
        border: framed ? "1px solid var(--cn-color-border, #dde0e4)" : 0,
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
      }}
    >
      {ROADS.map((road, index) => (
        <Box key={index} sx={{ position: "absolute", ...road }}>
          <SkBlock width="100%" height="100%" radius={3} />
        </Box>
      ))}
    </Box>
    {PIN_SPOTS.slice(0, Math.max(0, pins)).map((spot, index) => (
      <Box
        key={index}
        data-cn-skeleton-pin
        sx={{ position: "absolute", transform: "translate(-50%, -100%)", ...spot }}
      >
        <SkBlock width={22} height={22} circle />
      </Box>
    ))}
    {controls && (
      <Box
        data-cn-skeleton-controls
        sx={{
          position: "absolute",
          right: 10,
          bottom: 10,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <SkBlock width={34} height={34} radius={4} />
        <SkBlock width={34} height={34} radius={4} />
      </Box>
    )}
  </CnSkeletonGroup>
);
