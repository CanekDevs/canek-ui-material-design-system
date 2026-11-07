import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnMetricCardProps } from "./CnMetricCard";

type MetricVariant = NonNullable<CnMetricCardProps["variant"]>;
type MetricSize = NonNullable<CnMetricCardProps["size"]>;
type MetricSparklineType = NonNullable<CnMetricCardProps["sparklineType"]>;

export type CnMetricCardSkeletonProps = CnSkeletonCommonProps & {
  variant?: MetricVariant;
  size?: MetricSize;
  /** Ícono del encabezado. */
  icon?: boolean | string;
  /** Píldora de tendencia (con etiqueta). */
  trend?: boolean;
  /** Mini gráfica junto al valor. */
  sparkline?: boolean;
  sparklineType?: MetricSparklineType;
  /** Barra de avance hacia una meta. */
  progress?: boolean;
  /** Líneas de descripción. */
  description?: boolean | number;
  footer?: boolean;
  width?: number | string;
};

const VALUE_SIZE: Record<MetricSize, number> = { sm: 20, md: 26, lg: 34 };
const PADDING: Record<MetricSize, number> = { sm: 12, md: 16, lg: 22 };

const SHAPE_BASE = "var(--cn-skeleton-base, #e4e7eb)";
const SHAPE_SOFT = "var(--cn-skeleton-soft, #eef0f3)";

// Serie fija para la forma de la mini gráfica.
const SERIES = [0.35, 0.5, 0.42, 0.66, 0.58, 0.8, 0.9];

const SparkShape = ({ type }: { type: MetricSparklineType }) => {
  const width = 110;
  const height = 36;
  if (type === "bar") {
    return (
      <Box
        data-cn-metric-skeleton-sparkline="bar"
        sx={{ display: "flex", alignItems: "flex-end", gap: "2px", height, width }}
      >
        {SERIES.map((v, i) => (
          <SkBlock
            key={i}
            width={`${100 / SERIES.length}%`}
            height={Math.round(v * height)}
            radius={1.5}
          />
        ))}
      </Box>
    );
  }
  const x = (i: number) => 2 + (i * (width - 4)) / (SERIES.length - 1);
  const y = (v: number) => height - 2 - v * (height - 4);
  const points = SERIES.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg
      data-cn-metric-skeleton-sparkline={type}
      aria-hidden="true"
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block", width, overflow: "visible" }}
    >
      {type === "area" && (
        <polygon
          points={`${x(0)},${height} ${points} ${x(SERIES.length - 1)},${height}`}
          fill={SHAPE_SOFT}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={SHAPE_BASE}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

/** Skeleton de `CnMetricCard`: título, ícono, valor, tendencia, mini gráfica, avance y pie. */
export const CnMetricCardSkeleton = ({
  variant = "outlined",
  size = "md",
  icon = true,
  trend = true,
  sparkline = false,
  sparklineType = "area",
  progress = false,
  description = false,
  footer = false,
  width,
  animation,
  ariaLabel = "Cargando indicador",
  sx,
  className,
}: CnMetricCardSkeletonProps) => {
  const iconBox = size === "sm" ? 30 : 36;
  const descriptionLines = typeof description === "number" ? description : description ? 1 : 0;

  return (
    <CnSkeletonGroup
      name="metric-card"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: width ?? "100%",
          p: `${PADDING[size]}px`,
          borderRadius: "var(--cn-radius-lg, 12px)",
          border:
            variant === "outlined"
              ? "1px solid var(--cn-color-border, #dde0e4)"
              : "1px solid transparent",
          backgroundColor:
            variant === "filled"
              ? "var(--cn-color-neutral-100, #f4f5f7)"
              : "var(--cn-color-surface, #ffffff)",
          boxShadow:
            variant === "elevated"
              ? "0 1px 3px rgba(17, 20, 24, 0.08), 0 6px 16px rgba(17, 20, 24, 0.06)"
              : "none",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <SkText width="48%" size={12} sx={{ mt: "3px" }} />
        {icon && <SkBlock width={iconBox} radius="var(--cn-radius-md, 8px)" />}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <SkBlock
          width="55%"
          height={Math.round(VALUE_SIZE[size] * 0.9)}
          radius="var(--cn-radius-sm, 6px)"
          sx={{ maxWidth: VALUE_SIZE[size] * 6 }}
        />
        {sparkline && <SparkShape type={sparklineType} />}
      </Box>

      {trend && (
        <Box
          data-cn-metric-skeleton-trend
          sx={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <SkBlock width={56} height={18} radius={999} />
          <SkText width={84} size={11} />
        </Box>
      )}

      {progress && (
        <Box
          data-cn-metric-skeleton-progress
          sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
        >
          <SkBlock height={6} radius={6} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <SkText width={64} size={11} />
            <SkText width={28} size={11} />
          </Box>
        </Box>
      )}

      {descriptionLines > 0 &&
        Array.from({ length: descriptionLines }, (_, i) => (
          <SkText key={i} width={i === descriptionLines - 1 ? "70%" : "100%"} size={11} />
        ))}

      {footer && (
        <Box
          data-cn-metric-skeleton-footer
          sx={{ pt: "8px", mt: "2px", borderTop: "1px solid var(--cn-color-border, #dde0e4)" }}
        >
          <SkText width="44%" size={11} />
        </Box>
      )}
    </CnSkeletonGroup>
  );
};
