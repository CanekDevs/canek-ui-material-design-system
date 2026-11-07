import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useId, useMemo } from "react";
import { CnSkeleton } from "../CnSkeleton";
import { arcPath, linearPath, polar, smoothPath, squarify } from "./chart-geometry";
import { seeded, useChartWidth } from "./use-chart-width";

/*
 * Skeletons de gráficas: reproducen la forma de cada gráfica (barras, líneas,
 * anillos…) según sus variantes, con brillo animado que respeta el tema oscuro
 * y `prefers-reduced-motion`. No dependen de @mui/x-charts.
 */

export type CnChartSkeletonAnimation = "wave" | "pulse" | "none";
export type CnChartLegendPlacement = "top" | "bottom" | "right" | "left";

export type CnChartSkeletonBaseProps = {
  /** Alto del área de la gráfica (sin encabezado ni leyenda). */
  height?: number;
  animation?: CnChartSkeletonAnimation;
  /** Marco: tarjeta con borde (como `CnChartCard`) o sin marco. */
  frame?: "card" | "plain";
  /** Encabezado: título, subtítulo y botones de acción. */
  header?: boolean | { subtitle?: boolean; actions?: number };
  legend?: boolean | CnChartLegendPlacement;
  legendItems?: number;
  /** Muestra ejes y cuadrícula (gráficas cartesianas). */
  axes?: boolean;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

// ─── Infraestructura ──────────────────────────────────────────────────

type PaintProps = { fill: string; opacity?: number };

const SHAPE_BASE = "var(--cn-skeleton-base, #e4e7eb)";
const SHAPE_SOFT = "var(--cn-skeleton-soft, #eef0f3)";
const SHIMMER = "var(--cn-skeleton-highlight, #f6f7f9)";

/** SVG con gradiente de brillo compartido por todas las formas. */
const SkeletonSvg = ({
  width,
  height,
  animation,
  children,
}: {
  width: number;
  height: number;
  animation: CnChartSkeletonAnimation;
  children: (paint: PaintProps, soft: PaintProps) => ReactNode;
}) => {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true });
  const id = `cn-sk-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const animated = animation !== "none" && !reduceMotion;
  const fill = animation === "wave" && animated ? `url(#${id})` : SHAPE_BASE;

  return (
    <Box
      component="svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      sx={{
        display: "block",
        overflow: "visible",
        ...(animation === "pulse" &&
          animated && {
            animation: "cn-chart-skeleton-pulse 1.5s ease-in-out infinite",
            "@keyframes cn-chart-skeleton-pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.5 },
            },
          }),
      }}
    >
      {animation === "wave" && animated && (
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" x2={width} y1="0" y2="0">
            <stop offset="0" style={{ stopColor: SHAPE_BASE }} />
            <stop offset="0.4" style={{ stopColor: SHAPE_BASE }} />
            <stop offset="0.5" style={{ stopColor: SHIMMER }} />
            <stop offset="0.6" style={{ stopColor: SHAPE_BASE }} />
            <stop offset="1" style={{ stopColor: SHAPE_BASE }} />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from={`${-width} 0`}
              to={`${width} 0`}
              dur="1.6s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      )}
      {children({ fill }, { fill: SHAPE_SOFT })}
    </Box>
  );
};

const LegendSkeleton = ({
  items,
  vertical,
  animation,
}: {
  items: number;
  vertical: boolean;
  animation: CnChartSkeletonAnimation;
}) => (
  <Box
    aria-hidden="true"
    sx={{
      display: "flex",
      flexDirection: vertical ? "column" : "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: vertical ? "10px" : "8px 18px",
      py: vertical ? 0 : "4px",
    }}
  >
    {Array.from({ length: items }).map((_, i) => (
      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <CnSkeleton variant="circular" width={10} height={10} animation={animation} ariaLabel="" />
        <CnSkeleton
          variant="text"
          width={44 + ((i * 17) % 30)}
          height={10}
          animation={animation}
          ariaLabel=""
        />
      </Box>
    ))}
  </Box>
);

/** Marco común: encabezado, leyenda y área de la gráfica. */
export const CnChartSkeletonFrame = ({
  height = 300,
  animation = "wave",
  frame = "plain",
  header = false,
  legend = false,
  legendItems = 3,
  ariaLabel = "Cargando gráfica",
  sx,
  className,
  children,
}: CnChartSkeletonBaseProps & {
  children: (size: { width: number; height: number }) => ReactNode;
}) => {
  const [ref, width] = useChartWidth();
  const placement: CnChartLegendPlacement | null =
    legend === true ? "bottom" : legend === false ? null : legend;
  const side = placement === "left" || placement === "right";
  const headerConfig = header === true ? { subtitle: true, actions: 2 } : header || null;

  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      data-cn-skeleton="chart"
      className={className}
      sx={[
        {
          width: "100%",
          boxSizing: "border-box",
          ...(frame === "card" && {
            p: "18px 20px",
            borderRadius: "12px",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
          }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {headerConfig && (
        <Box
          aria-hidden="true"
          sx={{ display: "flex", alignItems: "flex-start", gap: "12px", mb: "16px" }}
        >
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <CnSkeleton variant="text" width="38%" height={16} animation={animation} ariaLabel="" />
            {headerConfig.subtitle !== false && (
              <CnSkeleton
                variant="text"
                width="24%"
                height={11}
                animation={animation}
                ariaLabel=""
              />
            )}
          </Box>
          {Array.from({ length: headerConfig.actions ?? 2 }).map((_, i) => (
            <CnSkeleton
              key={i}
              variant="circular"
              width={30}
              height={30}
              animation={animation}
              ariaLabel=""
            />
          ))}
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection:
            placement === "top"
              ? "column-reverse"
              : placement === "left"
                ? "row-reverse"
                : side
                  ? "row"
                  : "column",
          alignItems: side ? "center" : "stretch",
          gap: "12px",
        }}
      >
        <Box ref={ref} sx={{ flex: 1, minWidth: 0 }}>
          {children({ width: Math.max(60, side ? width : width), height })}
        </Box>
        {placement && <LegendSkeleton items={legendItems} vertical={side} animation={animation} />}
      </Box>
    </Box>
  );
};

/** Ejes y cuadrícula de las gráficas cartesianas. Devuelve el área útil. */
const cartesianArea = (width: number, height: number, axes: boolean, horizontal = false) => {
  const left = axes ? (horizontal ? 70 : 40) : 4;
  const bottom = axes ? 24 : 4;
  return { left, top: 8, right: width - 8, bottom: height - bottom };
};

const CartesianAxes = ({
  width,
  height,
  soft,
  paint,
  horizontal = false,
  ticks = 5,
}: {
  width: number;
  height: number;
  soft: PaintProps;
  paint: PaintProps;
  horizontal?: boolean;
  ticks?: number;
}) => {
  const area = cartesianArea(width, height, true, horizontal);
  const rows = Array.from(
    { length: ticks },
    (_, i) => area.top + ((area.bottom - area.top) / (ticks - 1)) * i,
  );
  return (
    <g>
      {!horizontal &&
        rows.map((y, i) => (
          <g key={i}>
            <rect x={area.left} y={y} width={area.right - area.left} height={1} {...soft} />
            <rect x={6} y={y - 4} width={24} height={8} rx={3} {...paint} />
          </g>
        ))}
      {horizontal &&
        Array.from(
          { length: ticks },
          (_, i) => area.left + ((area.right - area.left) / (ticks - 1)) * i,
        ).map((x, i) => (
          <g key={i}>
            <rect x={x} y={area.top} width={1} height={area.bottom - area.top} {...soft} />
            <rect x={x - 12} y={height - 14} width={24} height={8} rx={3} {...paint} />
          </g>
        ))}
    </g>
  );
};

// ─── Cartesianas ──────────────────────────────────────────────────────

export type CnBarChartSkeletonProps = CnChartSkeletonBaseProps & {
  layout?: "vertical" | "horizontal";
  /** Número de categorías. */
  bars?: number;
  /** Series por categoría (agrupadas) o capas (apiladas). */
  series?: number;
  stacked?: boolean;
  borderRadius?: number;
};

export const CnBarChartSkeleton = ({
  layout = "vertical",
  bars = 7,
  series = 1,
  stacked = false,
  borderRadius = 6,
  axes = true,
  ...rest
}: CnBarChartSkeletonProps) => {
  const horizontal = layout === "horizontal";
  const heights = useMemo(() => {
    const rand = seeded(bars * 31 + series * 7 + (stacked ? 3 : 0));
    return Array.from({ length: bars }, () =>
      Array.from({ length: series }, () => 0.35 + rand() * 0.6),
    );
  }, [bars, series, stacked]);

  return (
    <CnChartSkeletonFrame
      legendItems={series}
      {...rest}
      height={rest.height ?? (horizontal ? Math.max(200, bars * 40 + 40) : 300)}
    >
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint, soft) => {
            const area = cartesianArea(width, height, axes, horizontal);
            const span = horizontal ? area.bottom - area.top : area.right - area.left;
            const band = span / bars;
            const groupSize = band * 0.68;
            const shapes: ReactNode[] = [];
            heights.forEach((values, i) => {
              const start = (horizontal ? area.top : area.left) + band * i + (band - groupSize) / 2;
              if (stacked) {
                const total = Math.min(0.95, values.reduce((a, b) => a + b, 0) / series);
                let offset = 0;
                values.forEach((value, s) => {
                  const share = (value / values.reduce((a, b) => a + b, 0)) * total;
                  const length =
                    share * (horizontal ? area.right - area.left : area.bottom - area.top);
                  const gap = s < series - 1 ? 2 : 0;
                  shapes.push(
                    horizontal ? (
                      <rect
                        key={`${i}-${s}`}
                        x={area.left + offset}
                        y={start}
                        width={Math.max(0, length - gap)}
                        height={groupSize}
                        rx={s === series - 1 ? borderRadius : 0}
                        {...paint}
                        opacity={1 - s * 0.12}
                      />
                    ) : (
                      <rect
                        key={`${i}-${s}`}
                        x={start}
                        y={area.bottom - offset - length + gap}
                        width={groupSize}
                        height={Math.max(0, length - gap)}
                        rx={s === series - 1 ? borderRadius : 0}
                        {...paint}
                        opacity={1 - s * 0.12}
                      />
                    ),
                  );
                  offset += length;
                });
              } else {
                const size = groupSize / series;
                values.forEach((value, s) => {
                  const length =
                    value * (horizontal ? area.right - area.left : area.bottom - area.top);
                  const pos = start + size * s;
                  const thickness = Math.max(2, size - (series > 1 ? 3 : 0));
                  shapes.push(
                    horizontal ? (
                      <rect
                        key={`${i}-${s}`}
                        x={area.left}
                        y={pos}
                        width={length}
                        height={thickness}
                        rx={Math.min(borderRadius, thickness / 2)}
                        {...paint}
                      />
                    ) : (
                      <rect
                        key={`${i}-${s}`}
                        x={pos}
                        y={area.bottom - length}
                        width={thickness}
                        height={length}
                        rx={Math.min(borderRadius, thickness / 2)}
                        {...paint}
                      />
                    ),
                  );
                });
              }
              if (axes) {
                shapes.push(
                  horizontal ? (
                    <rect
                      key={`l-${i}`}
                      x={8}
                      y={start + groupSize / 2 - 4}
                      width={52}
                      height={8}
                      rx={3}
                      {...paint}
                    />
                  ) : (
                    <rect
                      key={`l-${i}`}
                      x={start + groupSize / 2 - 14}
                      y={height - 14}
                      width={28}
                      height={8}
                      rx={3}
                      {...paint}
                    />
                  ),
                );
              }
            });
            return (
              <>
                {axes && (
                  <CartesianAxes
                    width={width}
                    height={height}
                    soft={soft}
                    paint={paint}
                    horizontal={horizontal}
                  />
                )}
                {shapes}
              </>
            );
          }}
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

export type CnLineChartSkeletonProps = CnChartSkeletonBaseProps & {
  points?: number;
  series?: number;
  /** Relleno bajo la línea (gráfica de área). */
  area?: boolean;
  stacked?: boolean;
  curve?: "smooth" | "linear" | "step";
  markers?: boolean;
};

const lineSeries = (count: number, points: number, seed: number) => {
  const rand = seeded(seed);
  return Array.from({ length: count }, (_, s) => {
    let value = 0.3 + rand() * 0.4;
    return Array.from({ length: points }, () => {
      value = Math.min(0.95, Math.max(0.08, value + (rand() - 0.5) * 0.28));
      return value * (1 - s * 0.18);
    });
  });
};

export const CnLineChartSkeleton = ({
  points = 12,
  series = 1,
  area = false,
  stacked = false,
  curve = "smooth",
  markers = false,
  axes = true,
  ...rest
}: CnLineChartSkeletonProps) => {
  const data = useMemo(() => lineSeries(series, points, points * 13 + series), [points, series]);
  return (
    <CnChartSkeletonFrame legendItems={series} {...rest}>
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint, soft) => {
            const a = cartesianArea(width, height, axes);
            const h = a.bottom - a.top;
            const step = (a.right - a.left) / Math.max(1, points - 1);
            const cumulative = data.map((_, s) =>
              data[0].map((__, i) =>
                stacked
                  ? data.slice(0, s + 1).reduce((acc, row) => acc + row[i] / series, 0)
                  : data[s][i],
              ),
            );
            const pathOf = (pts: { x: number; y: number }[]) =>
              curve === "smooth" ? smoothPath(pts) : linearPath(pts, curve === "step");
            return (
              <>
                {axes && <CartesianAxes width={width} height={height} soft={soft} paint={paint} />}
                {axes &&
                  Array.from({ length: Math.min(points, 8) }).map((_, i, arr) => (
                    <rect
                      key={`x-${i}`}
                      x={a.left + ((a.right - a.left) / (arr.length - 1 || 1)) * i - 12}
                      y={height - 14}
                      width={24}
                      height={8}
                      rx={3}
                      {...paint}
                    />
                  ))}
                {cumulative
                  .map((values, s) => {
                    const pts = values.map((v, i) => ({
                      x: a.left + step * i,
                      y: a.bottom - v * h,
                    }));
                    const line = pathOf(pts);
                    return (
                      <g key={s}>
                        {area && (
                          <path
                            d={`${line} L ${pts[pts.length - 1].x} ${a.bottom} L ${pts[0].x} ${a.bottom} Z`}
                            {...paint}
                            opacity={0.45 - s * 0.08}
                          />
                        )}
                        <path
                          d={line}
                          fill="none"
                          stroke={paint.fill}
                          strokeWidth={3}
                          strokeLinecap="round"
                          opacity={1 - s * 0.15}
                        />
                        {markers &&
                          pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} {...paint} />)}
                      </g>
                    );
                  })
                  .reverse()}
              </>
            );
          }}
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

/** Área = línea con relleno. */
export const CnAreaChartSkeleton = (props: CnLineChartSkeletonProps) => (
  <CnLineChartSkeleton area {...props} />
);

export type CnComposedChartSkeletonProps = CnChartSkeletonBaseProps & {
  bars?: number;
  barSeries?: number;
  lineSeries?: number;
  /** Eje secundario a la derecha. */
  dualAxis?: boolean;
};

export const CnComposedChartSkeleton = ({
  bars = 8,
  barSeries = 1,
  lineSeries: lines = 1,
  dualAxis = true,
  axes = true,
  ...rest
}: CnComposedChartSkeletonProps) => {
  const barData = useMemo(() => lineSeries(barSeries, bars, bars * 5 + 1), [barSeries, bars]);
  const lineData = useMemo(() => lineSeries(lines, bars, bars * 11 + 2), [lines, bars]);
  return (
    <CnChartSkeletonFrame legendItems={barSeries + lines} {...rest}>
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint, soft) => {
            const a = cartesianArea(width, height, axes);
            const right = dualAxis && axes ? a.right - 34 : a.right;
            const band = (right - a.left) / bars;
            const h = a.bottom - a.top;
            return (
              <>
                {axes && <CartesianAxes width={width} height={height} soft={soft} paint={paint} />}
                {dualAxis &&
                  axes &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <rect
                      key={`r-${i}`}
                      x={width - 32}
                      y={a.top + (h / 4) * i - 4}
                      width={24}
                      height={8}
                      rx={3}
                      {...paint}
                    />
                  ))}
                {barData.map((values, s) =>
                  values.map((v, i) => {
                    const size = (band * 0.6) / barSeries;
                    return (
                      <rect
                        key={`${s}-${i}`}
                        x={a.left + band * i + band * 0.2 + size * s}
                        y={a.bottom - v * h}
                        width={size - 2}
                        height={v * h}
                        rx={4}
                        {...paint}
                        opacity={0.75}
                      />
                    );
                  }),
                )}
                {lineData.map((values, s) => {
                  const pts = values.map((v, i) => ({
                    x: a.left + band * i + band / 2,
                    y: a.bottom - Math.min(0.98, v + 0.15) * h,
                  }));
                  return (
                    <g key={`l-${s}`}>
                      <path d={smoothPath(pts)} fill="none" stroke={paint.fill} strokeWidth={3} />
                      {pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={4} {...paint} />
                      ))}
                    </g>
                  );
                })}
              </>
            );
          }}
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

export type CnScatterChartSkeletonProps = CnChartSkeletonBaseProps & {
  points?: number;
  /** Burbujas de distintos tamaños. */
  bubble?: boolean;
  trendLine?: boolean;
};

export const CnScatterChartSkeleton = ({
  points = 28,
  bubble = false,
  trendLine = false,
  axes = true,
  ...rest
}: CnScatterChartSkeletonProps) => {
  const dots = useMemo(() => {
    const rand = seeded(points * 3 + (bubble ? 1 : 0));
    return Array.from({ length: points }, () => {
      const x = rand();
      return {
        x,
        y: Math.min(0.95, Math.max(0.05, x * 0.7 + (rand() - 0.5) * 0.45 + 0.1)),
        r: bubble ? 5 + rand() * 16 : 5,
      };
    });
  }, [points, bubble]);
  return (
    <CnChartSkeletonFrame {...rest}>
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint, soft) => {
            const a = cartesianArea(width, height, axes);
            const px = (v: number) => a.left + 12 + v * (a.right - a.left - 24);
            const py = (v: number) => a.bottom - 8 - v * (a.bottom - a.top - 16);
            return (
              <>
                {axes && <CartesianAxes width={width} height={height} soft={soft} paint={paint} />}
                {dots.map((d, i) => (
                  <circle
                    key={i}
                    cx={px(d.x)}
                    cy={py(d.y)}
                    r={d.r}
                    {...paint}
                    opacity={bubble ? 0.7 : 1}
                  />
                ))}
                {trendLine && (
                  <line
                    x1={px(0)}
                    y1={py(0.12)}
                    x2={px(1)}
                    y2={py(0.82)}
                    stroke={paint.fill}
                    strokeWidth={3}
                    strokeDasharray="8 6"
                  />
                )}
              </>
            );
          }}
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

export type CnCandlestickChartSkeletonProps = CnChartSkeletonBaseProps & {
  candles?: number;
  /** Barras de volumen bajo las velas. */
  volume?: boolean;
};

export const CnCandlestickChartSkeleton = ({
  candles = 24,
  volume = false,
  axes = true,
  ...rest
}: CnCandlestickChartSkeletonProps) => {
  const data = useMemo(() => {
    const rand = seeded(candles * 17);
    let close = 0.5;
    return Array.from({ length: candles }, () => {
      const open = close;
      close = Math.min(0.9, Math.max(0.1, open + (rand() - 0.5) * 0.18));
      return {
        open,
        close,
        high: Math.max(open, close) + rand() * 0.06,
        low: Math.min(open, close) - rand() * 0.06,
        volume: 0.2 + rand() * 0.8,
      };
    });
  }, [candles]);
  return (
    <CnChartSkeletonFrame {...rest}>
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint, soft) => {
            const a = cartesianArea(width, height, axes);
            const priceBottom = volume ? a.top + (a.bottom - a.top) * 0.74 : a.bottom;
            const h = priceBottom - a.top;
            const band = (a.right - a.left) / candles;
            return (
              <>
                {axes && <CartesianAxes width={width} height={height} soft={soft} paint={paint} />}
                {data.map((c, i) => {
                  const cx = a.left + band * i + band / 2;
                  const top = priceBottom - Math.max(c.open, c.close) * h;
                  const bodyH = Math.max(2, Math.abs(c.open - c.close) * h);
                  return (
                    <g key={i}>
                      <rect
                        x={cx - 1}
                        y={priceBottom - c.high * h}
                        width={2}
                        height={(c.high - c.low) * h}
                        {...paint}
                      />
                      <rect
                        x={cx - band * 0.3}
                        y={top}
                        width={band * 0.6}
                        height={bodyH}
                        rx={2}
                        {...paint}
                        opacity={c.close >= c.open ? 1 : 0.6}
                      />
                      {volume && (
                        <rect
                          x={cx - band * 0.3}
                          y={a.bottom - c.volume * (a.bottom - priceBottom - 8)}
                          width={band * 0.6}
                          height={c.volume * (a.bottom - priceBottom - 8)}
                          rx={2}
                          {...paint}
                          opacity={0.5}
                        />
                      )}
                    </g>
                  );
                })}
              </>
            );
          }}
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

// ─── Radiales ─────────────────────────────────────────────────────────

export type CnPieChartSkeletonProps = CnChartSkeletonBaseProps & {
  variant?: "pie" | "donut" | "half";
  slices?: number;
  /** Grosor del anillo como fracción del radio (dona). */
  thickness?: number;
  /** Texto central (total). */
  centerLabel?: boolean;
  paddingAngle?: number;
};

export const CnPieChartSkeleton = ({
  variant = "pie",
  slices = 5,
  thickness = 0.38,
  centerLabel = variant !== "pie",
  paddingAngle,
  ...rest
}: CnPieChartSkeletonProps) => {
  const shares = useMemo(() => {
    const rand = seeded(slices * 19);
    const raw = Array.from({ length: slices }, () => 0.4 + rand());
    const total = raw.reduce((x, y) => x + y, 0);
    return raw.map((v) => v / total);
  }, [slices]);
  const half = variant === "half";
  return (
    <CnChartSkeletonFrame
      legend="right"
      legendItems={slices}
      {...rest}
      height={rest.height ?? (half ? 200 : 260)}
    >
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint, soft) => {
            const outer = half
              ? Math.min(width / 2, height - 10) - 4
              : Math.min(width, height) / 2 - 6;
            const cx = width / 2;
            const cy = half ? height - 6 : height / 2;
            const inner = variant === "pie" ? 0 : outer * (1 - thickness);
            const start = half ? -90 : 0;
            const sweep = half ? 180 : 360;
            const pad = paddingAngle ?? (variant === "pie" ? 1 : 2.5);
            let angle = start;
            return (
              <>
                {shares.map((share, i) => {
                  const end = angle + share * sweep;
                  const d = arcPath(
                    cx,
                    cy,
                    outer,
                    inner,
                    angle + pad / 2,
                    end - pad / 2,
                    variant === "pie" ? 0 : 4,
                  );
                  angle = end;
                  return <path key={i} d={d} {...paint} opacity={1 - (i % 3) * 0.14} />;
                })}
                {centerLabel && inner > 0 && (
                  <g>
                    <rect
                      x={cx - inner * 0.5}
                      y={cy - (half ? 30 : 14)}
                      width={inner}
                      height={16}
                      rx={4}
                      {...paint}
                    />
                    <rect
                      x={cx - inner * 0.32}
                      y={cy + (half ? -8 : 8)}
                      width={inner * 0.64}
                      height={9}
                      rx={3}
                      {...soft}
                    />
                  </g>
                )}
              </>
            );
          }}
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

export const CnDonutChartSkeleton = (props: Omit<CnPieChartSkeletonProps, "variant">) => (
  <CnPieChartSkeleton {...props} variant="donut" />
);

export type CnGaugeSkeletonProps = CnChartSkeletonBaseProps & {
  /** Semicírculo (180°), arco (270°) o círculo completo. */
  variant?: "semicircle" | "arc" | "full";
  startAngle?: number;
  endAngle?: number;
  /** Segmentos de color (umbrales). 0 = un solo arco. */
  segments?: number;
  needle?: boolean;
  thickness?: number;
};

const GAUGE_ANGLES = { semicircle: [-90, 90], arc: [-135, 135], full: [0, 360] } as const;

export const CnGaugeSkeleton = ({
  variant = "semicircle",
  startAngle,
  endAngle,
  segments = 0,
  needle = false,
  thickness = 0.22,
  ...rest
}: CnGaugeSkeletonProps) => {
  const [start, end] = [
    startAngle ?? GAUGE_ANGLES[variant][0],
    endAngle ?? GAUGE_ANGLES[variant][1],
  ];
  return (
    <CnChartSkeletonFrame {...rest} height={rest.height ?? (variant === "semicircle" ? 170 : 220)}>
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint, soft) => {
            const semi = variant === "semicircle";
            const outer = semi
              ? Math.min(width / 2, height - 8) - 4
              : Math.min(width, height) / 2 - 6;
            const cx = width / 2;
            const cy = semi ? height - 6 : height / 2;
            const inner = outer * (1 - thickness);
            const parts = Math.max(1, segments);
            const span = (end - start) / parts;
            return (
              <>
                {segments > 0 ? (
                  Array.from({ length: parts }).map((_, i) => (
                    <path
                      key={i}
                      d={arcPath(
                        cx,
                        cy,
                        outer,
                        inner,
                        start + span * i + 1,
                        start + span * (i + 1) - 1,
                        3,
                      )}
                      {...paint}
                      opacity={1 - i * 0.15}
                    />
                  ))
                ) : (
                  <>
                    <path d={arcPath(cx, cy, outer, inner, start, end, 6)} {...soft} />
                    <path
                      d={arcPath(cx, cy, outer, inner, start, start + (end - start) * 0.62, 6)}
                      {...paint}
                    />
                  </>
                )}
                {needle &&
                  (() => {
                    const tip = polar(cx, cy, inner - 6, start + (end - start) * 0.62);
                    return (
                      <g>
                        <line
                          x1={cx}
                          y1={cy}
                          x2={tip.x}
                          y2={tip.y}
                          stroke={paint.fill}
                          strokeWidth={4}
                          strokeLinecap="round"
                        />
                        <circle cx={cx} cy={cy} r={8} {...paint} />
                      </g>
                    );
                  })()}
                {!needle && (
                  <rect
                    x={cx - inner * 0.45}
                    y={cy - (semi ? 34 : 12)}
                    width={inner * 0.9}
                    height={22}
                    rx={5}
                    {...paint}
                  />
                )}
              </>
            );
          }}
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

export type CnRadarChartSkeletonProps = CnChartSkeletonBaseProps & {
  metrics?: number;
  series?: number;
  /** Rejilla poligonal o circular. */
  shape?: "polygon" | "circle";
  levels?: number;
};

export const CnRadarChartSkeleton = ({
  metrics = 6,
  series = 1,
  shape = "polygon",
  levels = 4,
  ...rest
}: CnRadarChartSkeletonProps) => {
  const values = useMemo(() => {
    const rand = seeded(metrics * 23 + series);
    return Array.from({ length: series }, () =>
      Array.from({ length: metrics }, () => 0.35 + rand() * 0.6),
    );
  }, [metrics, series]);
  return (
    <CnChartSkeletonFrame legendItems={series} {...rest} height={rest.height ?? 300}>
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint, soft) => {
            const cx = width / 2;
            const cy = height / 2;
            const r = Math.min(width, height) / 2 - 26;
            const angle = 360 / metrics;
            return (
              <>
                {Array.from({ length: levels }).map((_, l) => {
                  const rr = (r / levels) * (l + 1);
                  return shape === "circle" ? (
                    <circle
                      key={l}
                      cx={cx}
                      cy={cy}
                      r={rr}
                      fill="none"
                      stroke={soft.fill}
                      strokeWidth={1.5}
                    />
                  ) : (
                    <polygon
                      key={l}
                      points={Array.from({ length: metrics }, (_, i) =>
                        polar(cx, cy, rr, angle * i),
                      )
                        .map((p) => `${p.x},${p.y}`)
                        .join(" ")}
                      fill="none"
                      stroke={soft.fill}
                      strokeWidth={1.5}
                    />
                  );
                })}
                {Array.from({ length: metrics }).map((_, i) => {
                  const end = polar(cx, cy, r, angle * i);
                  const label = polar(cx, cy, r + 14, angle * i);
                  return (
                    <g key={i}>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={end.x}
                        y2={end.y}
                        stroke={soft.fill}
                        strokeWidth={1.5}
                      />
                      <rect
                        x={label.x - 16}
                        y={label.y - 4}
                        width={32}
                        height={8}
                        rx={3}
                        {...paint}
                      />
                    </g>
                  );
                })}
                {values.map((row, s) => (
                  <polygon
                    key={s}
                    points={row
                      .map((v, i) => polar(cx, cy, r * v, angle * i))
                      .map((p) => `${p.x},${p.y}`)
                      .join(" ")}
                    {...paint}
                    opacity={0.55 - s * 0.12}
                    stroke={paint.fill}
                    strokeWidth={2}
                  />
                ))}
              </>
            );
          }}
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

export type CnRadialBarChartSkeletonProps = CnChartSkeletonBaseProps & {
  rings?: number;
  /** Círculo completo o media luna. */
  variant?: "full" | "half";
};

export const CnRadialBarChartSkeleton = ({
  rings = 3,
  variant = "full",
  ...rest
}: CnRadialBarChartSkeletonProps) => (
  <CnChartSkeletonFrame
    legend="right"
    legendItems={rings}
    {...rest}
    height={rest.height ?? (variant === "half" ? 180 : 260)}
  >
    {({ width, height }) => (
      <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
        {(paint, soft) => {
          const half = variant === "half";
          const outer = half
            ? Math.min(width / 2, height - 6) - 4
            : Math.min(width, height) / 2 - 6;
          const cx = width / 2;
          const cy = half ? height - 4 : height / 2;
          const track = (outer * 0.62) / rings;
          const [start, end] = half ? [-90, 90] : [0, 360];
          return Array.from({ length: rings }).map((_, i) => {
            const ro = outer - i * track;
            const ri = ro - track * 0.72;
            return (
              <g key={i}>
                <path d={arcPath(cx, cy, ro, ri, start, end - 0.01)} {...soft} />
                <path
                  d={arcPath(
                    cx,
                    cy,
                    ro,
                    ri,
                    start,
                    start + (end - start) * (0.85 - i * 0.18),
                    track,
                  )}
                  {...paint}
                />
              </g>
            );
          });
        }}
      </SkeletonSvg>
    )}
  </CnChartSkeletonFrame>
);

export type CnRadialLineChartSkeletonProps = CnChartSkeletonBaseProps & {
  points?: number;
  series?: number;
  area?: boolean;
};

export const CnRadialLineChartSkeleton = ({
  points = 12,
  series = 1,
  area = true,
  ...rest
}: CnRadialLineChartSkeletonProps) => {
  const data = useMemo(() => lineSeries(series, points, points * 29 + series), [points, series]);
  return (
    <CnChartSkeletonFrame legendItems={series} {...rest} height={rest.height ?? 300}>
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint, soft) => {
            const cx = width / 2;
            const cy = height / 2;
            const r = Math.min(width, height) / 2 - 20;
            const inner = r * 0.18;
            return (
              <>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <circle
                    key={f}
                    cx={cx}
                    cy={cy}
                    r={inner + (r - inner) * f}
                    fill="none"
                    stroke={soft.fill}
                    strokeWidth={1.5}
                  />
                ))}
                {data.map((row, s) => {
                  const pts = row.map((v, i) =>
                    polar(cx, cy, inner + (r - inner) * v, (360 / points) * i),
                  );
                  return (
                    <path
                      key={s}
                      d={smoothPath(pts, true)}
                      fill={area ? paint.fill : "none"}
                      fillOpacity={area ? 0.45 : 0}
                      stroke={paint.fill}
                      strokeWidth={3}
                    />
                  );
                })}
              </>
            );
          }}
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

// ─── Otras ────────────────────────────────────────────────────────────

export type CnSparklineSkeletonProps = {
  type?: "line" | "area" | "bar";
  width?: number | string;
  height?: number;
  points?: number;
  animation?: CnChartSkeletonAnimation;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

export const CnSparklineSkeleton = ({
  type = "line",
  width = "100%",
  height = 40,
  points = 14,
  animation = "wave",
  ariaLabel = "Cargando gráfica",
  sx,
  className,
}: CnSparklineSkeletonProps) => {
  const [ref, measured] = useChartWidth(120);
  const values = useMemo(() => lineSeries(1, points, points * 7)[0], [points]);
  return (
    <Box
      ref={ref}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      data-cn-skeleton="sparkline"
      className={className}
      sx={[{ width, height, display: "block" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <SkeletonSvg width={measured} height={height} animation={animation}>
        {(paint) => {
          if (type === "bar") {
            const band = measured / points;
            return values.map((v, i) => (
              <rect
                key={i}
                x={band * i + band * 0.15}
                y={height - v * (height - 2)}
                width={band * 0.7}
                height={v * (height - 2)}
                rx={2}
                {...paint}
              />
            ));
          }
          const step = measured / Math.max(1, points - 1);
          const pts = values.map((v, i) => ({ x: step * i, y: height - 2 - v * (height - 6) }));
          const line = smoothPath(pts);
          return (
            <>
              {type === "area" && (
                <path
                  d={`${line} L ${measured} ${height} L 0 ${height} Z`}
                  {...paint}
                  opacity={0.45}
                />
              )}
              <path
                d={line}
                fill="none"
                stroke={paint.fill}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </>
          );
        }}
      </SkeletonSvg>
    </Box>
  );
};

export type CnHeatmapSkeletonProps = CnChartSkeletonBaseProps & {
  rows?: number;
  columns?: number;
  /** Rejilla de categorías o calendario (semanas × días). */
  variant?: "grid" | "calendar";
  gap?: number;
};

export const CnHeatmapSkeleton = ({
  rows,
  columns,
  variant = "grid",
  gap = 3,
  axes = true,
  ...rest
}: CnHeatmapSkeletonProps) => {
  const calendar = variant === "calendar";
  const r = rows ?? (calendar ? 7 : 6);
  const c = columns ?? (calendar ? 26 : 10);
  const shades = useMemo(() => {
    const rand = seeded(r * 41 + c);
    return Array.from({ length: r * c }, () => 0.25 + rand() * 0.75);
  }, [r, c]);
  return (
    <CnChartSkeletonFrame {...rest} height={rest.height ?? (calendar ? 150 : 280)}>
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint) => {
            const left = axes ? (calendar ? 28 : 64) : 0;
            const bottom = axes ? 20 : 0;
            const cellW = (width - left) / c;
            const cellH = calendar ? Math.min(cellW, (height - bottom) / r) : (height - bottom) / r;
            const size = calendar ? Math.min(cellW, cellH) : 0;
            return (
              <>
                {Array.from({ length: r }).map((_, y) =>
                  Array.from({ length: c }).map((__, x) => (
                    <rect
                      key={`${y}-${x}`}
                      x={left + x * (calendar ? size : cellW)}
                      y={y * (calendar ? size : cellH)}
                      width={(calendar ? size : cellW) - gap}
                      height={(calendar ? size : cellH) - gap}
                      rx={calendar ? 3 : 4}
                      {...paint}
                      opacity={shades[y * c + x]}
                    />
                  )),
                )}
                {axes &&
                  Array.from({ length: r }).map((_, y) => (
                    <rect
                      key={`ry-${y}`}
                      x={0}
                      y={y * (calendar ? size : cellH) + (calendar ? size : cellH) / 2 - 4}
                      width={left - 10}
                      height={8}
                      rx={3}
                      {...paint}
                    />
                  ))}
                {axes &&
                  !calendar &&
                  Array.from({ length: c }).map((_, x) => (
                    <rect
                      key={`rx-${x}`}
                      x={left + x * cellW + cellW / 2 - 12}
                      y={height - 12}
                      width={24}
                      height={8}
                      rx={3}
                      {...paint}
                    />
                  ))}
              </>
            );
          }}
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

export type CnFunnelChartSkeletonProps = CnChartSkeletonBaseProps & {
  steps?: number;
  orientation?: "vertical" | "horizontal";
  /** Embudo con cuello, pirámide o barras escalonadas. */
  variant?: "funnel" | "pyramid" | "bars";
};

export const CnFunnelChartSkeleton = ({
  steps = 5,
  orientation = "vertical",
  variant = "funnel",
  ...rest
}: CnFunnelChartSkeletonProps) => (
  <CnChartSkeletonFrame
    {...rest}
    height={rest.height ?? (orientation === "vertical" ? Math.max(220, steps * 52) : 220)}
  >
    {({ width, height }) => (
      <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
        {(paint) => {
          const vertical = orientation === "vertical";
          const along = vertical ? height : width;
          const across = vertical ? width * 0.7 : height * 0.85;
          const offset = vertical ? width * 0.15 : height * 0.075;
          const size = along / steps;
          const widths = Array.from({ length: steps + 1 }, (_, i) =>
            variant === "pyramid" ? (i / steps) * across : across * (1 - (i / steps) * 0.78),
          );
          return Array.from({ length: steps }).map((_, i) => {
            const pyramidIndex = variant === "pyramid" ? i + 1 : i;
            const w1 = variant === "pyramid" ? widths[i] : widths[i];
            const w2 = variant === "pyramid" ? widths[pyramidIndex] : widths[i + 1];
            const gap = 3;
            const s = size * i;
            const e = size * (i + 1) - gap;
            if (variant === "bars") {
              const w = widths[i];
              return vertical ? (
                <rect
                  key={i}
                  x={offset + (across - w) / 2}
                  y={s}
                  width={w}
                  height={e - s}
                  rx={6}
                  {...paint}
                  opacity={1 - i * 0.1}
                />
              ) : (
                <rect
                  key={i}
                  x={s}
                  y={offset + (across - w) / 2}
                  width={e - s}
                  height={w}
                  rx={6}
                  {...paint}
                  opacity={1 - i * 0.1}
                />
              );
            }
            const pts = vertical
              ? [
                  [offset + (across - w1) / 2, s],
                  [offset + (across + w1) / 2, s],
                  [offset + (across + w2) / 2, e],
                  [offset + (across - w2) / 2, e],
                ]
              : [
                  [s, offset + (across - w1) / 2],
                  [e, offset + (across - w2) / 2],
                  [e, offset + (across + w2) / 2],
                  [s, offset + (across + w1) / 2],
                ];
            return (
              <polygon
                key={i}
                points={pts.map((p) => p.join(",")).join(" ")}
                {...paint}
                opacity={1 - i * 0.1}
                strokeLinejoin="round"
              />
            );
          });
        }}
      </SkeletonSvg>
    )}
  </CnChartSkeletonFrame>
);

export type CnSankeyChartSkeletonProps = CnChartSkeletonBaseProps & {
  /** Columnas (niveles) del diagrama. */
  levels?: number;
  nodesPerLevel?: number;
};

export const CnSankeyChartSkeleton = ({
  levels = 3,
  nodesPerLevel = 3,
  ...rest
}: CnSankeyChartSkeletonProps) => (
  <CnChartSkeletonFrame {...rest} height={rest.height ?? 300}>
    {({ width, height }) => (
      <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
        {(paint) => {
          const nodeW = 12;
          const colX = (l: number) => 4 + ((width - nodeW - 8) / Math.max(1, levels - 1)) * l;
          const nodeH = (height - (nodesPerLevel - 1) * 14) / nodesPerLevel;
          const nodes = Array.from({ length: levels }, (_, l) =>
            Array.from(
              { length: nodesPerLevel - (l % 2 === 1 && nodesPerLevel > 2 ? 1 : 0) },
              (_x, n) => {
                const count = nodesPerLevel - (l % 2 === 1 && nodesPerLevel > 2 ? 1 : 0);
                const h = (height - (count - 1) * 14) / count;
                return { x: colX(l), y: n * (h + 14), h };
              },
            ),
          );
          const links: ReactNode[] = [];
          for (let l = 0; l < levels - 1; l += 1) {
            nodes[l].forEach((from, a) => {
              nodes[l + 1].forEach((to, b) => {
                if ((a + b) % 2 === 1 && nodes[l + 1].length > 1) return;
                const band = Math.min(from.h, to.h) * 0.42;
                const y1 = from.y + from.h / 2;
                const y2 = to.y + to.h / 2;
                const x1 = from.x + nodeW;
                const x2 = to.x;
                const mx = (x1 + x2) / 2;
                links.push(
                  <path
                    key={`${l}-${a}-${b}`}
                    d={`M ${x1} ${y1 - band / 2} C ${mx} ${y1 - band / 2} ${mx} ${y2 - band / 2} ${x2} ${y2 - band / 2} L ${x2} ${y2 + band / 2} C ${mx} ${y2 + band / 2} ${mx} ${y1 + band / 2} ${x1} ${y1 + band / 2} Z`}
                    {...paint}
                    opacity={0.35}
                  />,
                );
              });
            });
          }
          void nodeH;
          return (
            <>
              {links}
              {nodes.flat().map((n, i) => (
                <rect key={i} x={n.x} y={n.y} width={nodeW} height={n.h} rx={3} {...paint} />
              ))}
            </>
          );
        }}
      </SkeletonSvg>
    )}
  </CnChartSkeletonFrame>
);

export type CnTreemapSkeletonProps = CnChartSkeletonBaseProps & {
  tiles?: number;
};

export const CnTreemapSkeleton = ({ tiles = 9, ...rest }: CnTreemapSkeletonProps) => {
  const nodes = useMemo(() => {
    const rand = seeded(tiles * 37);
    return Array.from({ length: tiles }, (_, i) => ({ value: 1 + rand() * 9, item: i }));
  }, [tiles]);
  return (
    <CnChartSkeletonFrame {...rest} height={rest.height ?? 300}>
      {({ width, height }) => (
        <SkeletonSvg width={width} height={height} animation={rest.animation ?? "wave"}>
          {(paint, soft) =>
            squarify(nodes, 0, 0, width, height).map((r) => (
              <g key={r.item}>
                <rect
                  x={r.x + 2}
                  y={r.y + 2}
                  width={Math.max(0, r.width - 4)}
                  height={Math.max(0, r.height - 4)}
                  rx={6}
                  {...paint}
                  opacity={1 - (r.item % 4) * 0.12}
                />
                {r.width > 70 && r.height > 40 && (
                  <rect
                    x={r.x + 12}
                    y={r.y + 12}
                    width={Math.min(70, r.width - 24)}
                    height={9}
                    rx={3}
                    {...soft}
                  />
                )}
              </g>
            ))
          }
        </SkeletonSvg>
      )}
    </CnChartSkeletonFrame>
  );
};

/** Histograma: barras contiguas sin separación. */
export const CnHistogramSkeleton = ({ bars = 12, ...props }: CnBarChartSkeletonProps) => (
  <CnBarChartSkeleton bars={bars} borderRadius={2} {...props} />
);

// ─── Selector único ───────────────────────────────────────────────────

export type CnChartKind =
  | "bar"
  | "line"
  | "area"
  | "composed"
  | "scatter"
  | "pie"
  | "donut"
  | "gauge"
  | "radar"
  | "sparkline"
  | "heatmap"
  | "funnel"
  | "sankey"
  | "candlestick"
  | "radialBar"
  | "radialLine"
  | "treemap"
  | "histogram";

export type CnChartSkeletonProps = CnChartSkeletonBaseProps & {
  kind: CnChartKind;
} & Record<string, unknown>;

/** Skeleton de cualquier gráfica: `<CnChartSkeleton kind="donut" legend />`. */
export const CnChartSkeleton = ({ kind, ...props }: CnChartSkeletonProps) => {
  switch (kind) {
    case "bar":
      return <CnBarChartSkeleton {...props} />;
    case "histogram":
      return <CnHistogramSkeleton {...props} />;
    case "line":
      return <CnLineChartSkeleton {...props} />;
    case "area":
      return <CnAreaChartSkeleton {...props} />;
    case "composed":
      return <CnComposedChartSkeleton {...props} />;
    case "scatter":
      return <CnScatterChartSkeleton {...props} />;
    case "pie":
      return <CnPieChartSkeleton {...props} />;
    case "donut":
      return <CnDonutChartSkeleton {...props} />;
    case "gauge":
      return <CnGaugeSkeleton {...props} />;
    case "radar":
      return <CnRadarChartSkeleton {...props} />;
    case "sparkline":
      return <CnSparklineSkeleton {...(props as CnSparklineSkeletonProps)} />;
    case "heatmap":
      return <CnHeatmapSkeleton {...props} />;
    case "funnel":
      return <CnFunnelChartSkeleton {...props} />;
    case "sankey":
      return <CnSankeyChartSkeleton {...props} />;
    case "candlestick":
      return <CnCandlestickChartSkeleton {...props} />;
    case "radialBar":
      return <CnRadialBarChartSkeleton {...props} />;
    case "radialLine":
      return <CnRadialLineChartSkeleton {...props} />;
    case "treemap":
      return <CnTreemapSkeleton {...props} />;
    default:
      return null;
  }
};
