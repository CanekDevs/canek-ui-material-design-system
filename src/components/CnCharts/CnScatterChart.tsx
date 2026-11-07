import {
  ChartsReferenceLine,
  ScatterChart,
  useDrawingArea,
  useXScale,
  useYScale,
} from "@mui/x-charts";
import type { ScatterMarkerProps } from "@mui/x-charts";
import { createContext, useContext, useMemo } from "react";
import { CnChartCard } from "./CnChartCard";
import { CnScatterChartSkeleton } from "./CnChartSkeleton";
import type { CnChartCommonProps } from "./chart-common";
import {
  cardPropsOf,
  chartBaseSx,
  legendPosition,
  tooltipSlotProps,
  useFormatter,
} from "./chart-common";
import type { CnChartTone, CnChartValueFormat } from "./chart-theme";
import { createValueFormatter, linearRegression, resolveTone, withAlpha } from "./chart-theme";

export type CnScatterShape = "circle" | "square" | "diamond" | "triangle" | "cross";

export type CnScatterPoint = {
  x: number;
  y: number;
  size?: number;
  label?: string;
  id?: string | number;
};

export type CnScatterSeries<T = CnScatterPoint> = {
  label: string;
  data: ReadonlyArray<T>;
  /** Accesores cuando los registros no son `{ x, y }`. */
  x?: keyof T & string;
  y?: keyof T & string;
  /** Campo para el tamaño de la burbuja. */
  size?: keyof T & string;
  /** Campo con el nombre del punto (tooltip). */
  name?: keyof T & string;
  tone?: CnChartTone | string;
  shape?: CnScatterShape;
  /** Línea de tendencia (regresión lineal) de la serie. */
  trendLine?: boolean;
};

export type CnScatterChartProps<T = CnScatterPoint> = CnChartCommonProps & {
  series: CnScatterSeries<T>[];
  xFormat?: CnChartValueFormat;
  yFormat?: CnChartValueFormat;
  xLabel?: string;
  yLabel?: string;
  /** Tamaño base del punto (px). */
  markerSize?: number;
  /** Rango de radios para burbujas [mín, máx] en px. */
  bubbleRange?: [number, number];
  /** Divide el plano en cuadrantes (por defecto en los promedios). */
  quadrants?: boolean | { x?: number; y?: number; labels?: [string, string, string, string] };
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  grid?: "horizontal" | "vertical" | "both" | "none";
  onPointClick?: (point: T, series: CnScatterSeries<T>, index: number) => void;
};

type MarkerInfo = {
  sizes: Record<string, (number | undefined)[]>;
  shapes: Record<string, CnScatterShape>;
};
const MarkerContext = createContext<MarkerInfo>({ sizes: {}, shapes: {} });

const shapePath = (shape: CnScatterShape, x: number, y: number, r: number) => {
  switch (shape) {
    case "square":
      return `M ${x - r} ${y - r} h ${r * 2} v ${r * 2} h ${-r * 2} Z`;
    case "diamond":
      return `M ${x} ${y - r * 1.25} L ${x + r * 1.25} ${y} L ${x} ${y + r * 1.25} L ${x - r * 1.25} ${y} Z`;
    case "triangle":
      return `M ${x} ${y - r * 1.2} L ${x + r * 1.1} ${y + r * 0.8} L ${x - r * 1.1} ${y + r * 0.8} Z`;
    case "cross": {
      const t = r * 0.38;
      return `M ${x - t} ${y - r} h ${t * 2} v ${r - t} h ${r - t} v ${t * 2} h ${t - r} v ${r - t} h ${-t * 2} v ${t - r} h ${t - r} v ${-t * 2} h ${r - t} Z`;
    }
    default:
      return "";
  }
};

/** Marcador con tamaño por punto (burbujas) y forma por serie. */
const CnScatterMarker = (props: ScatterMarkerProps) => {
  const { sizes, shapes } = useContext(MarkerContext);
  const { seriesId, dataIndex, x, y, color, size, isHighlighted, isFaded, onClick } = props;
  const r = (sizes[seriesId]?.[dataIndex] ?? size) * (isHighlighted ? 1.15 : 1);
  const shape = shapes[seriesId] ?? "circle";
  const common = {
    fill: withAlpha(color, sizes[seriesId]?.[dataIndex] !== undefined ? 0.55 : 0.85),
    stroke: color,
    strokeWidth: isHighlighted ? 2 : 1,
    opacity: isFaded ? 0.25 : 1,
    onClick,
    style: { cursor: onClick ? "pointer" : undefined, transition: "opacity 120ms ease" },
  };
  return shape === "circle" ? (
    <circle cx={x} cy={y} r={r} {...common} />
  ) : (
    <path d={shapePath(shape, x, y, r)} {...common} />
  );
};

/** Línea de tendencia en coordenadas de datos. */
const TrendLines = ({
  lines,
}: {
  lines: {
    slope: number;
    intercept: number;
    color: string;
    from: number;
    to: number;
    r2: number;
  }[];
}) => {
  const xScale = useXScale() as unknown as (v: number) => number;
  const yScale = useYScale() as unknown as (v: number) => number;
  const { left, top, width, height } = useDrawingArea();
  return (
    <g>
      <clipPath id="cn-scatter-trend-clip">
        <rect x={left} y={top} width={width} height={height} />
      </clipPath>
      {lines.map((line, i) => {
        const x1 = xScale(line.from);
        const x2 = xScale(line.to);
        const y1 = yScale(line.slope * line.from + line.intercept);
        const y2 = yScale(line.slope * line.to + line.intercept);
        return (
          <g key={i} clipPath="url(#cn-scatter-trend-clip)">
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={line.color}
              strokeWidth={2}
              strokeDasharray="7 5"
            />
            <text
              x={x2 - 4}
              y={y2 - 8}
              textAnchor="end"
              fontSize={11}
              fontWeight={700}
              fill={line.color}
            >
              {`R² ${line.r2.toFixed(2)}`}
            </text>
          </g>
        );
      })}
    </g>
  );
};

const QuadrantLabels = ({ labels }: { labels: [string, string, string, string] }) => {
  const { left, top, width, height } = useDrawingArea();
  const style = { fontSize: 11, fontWeight: 700, fill: "var(--cn-color-neutral-400, #9aa1aa)" };
  return (
    <g style={{ pointerEvents: "none" }}>
      <text x={left + 8} y={top + 16} {...style}>
        {labels[0]}
      </text>
      <text x={left + width - 8} y={top + 16} textAnchor="end" {...style}>
        {labels[1]}
      </text>
      <text x={left + 8} y={top + height - 8} {...style}>
        {labels[2]}
      </text>
      <text x={left + width - 8} y={top + height - 8} textAnchor="end" {...style}>
        {labels[3]}
      </text>
    </g>
  );
};

/** Dispersión y burbujas con tendencia y cuadrantes. */
export const CnScatterChart = <T,>(props: CnScatterChartProps<T>) => {
  const {
    series,
    xFormat,
    yFormat,
    xLabel,
    yLabel,
    markerSize = 6,
    bubbleRange = [5, 26],
    quadrants = false,
    xMin,
    xMax,
    yMin,
    yMax,
    grid = "both",
    onPointClick,
    height = 320,
    width,
    legend,
    colors,
    animate = true,
  } = props;
  const formatY = useFormatter(props, yFormat);
  const formatX = useMemo(
    () =>
      createValueFormatter(xFormat ?? "number", { locale: props.locale, currency: props.currency }),
    [xFormat, props.locale, props.currency],
  );

  const resolved = useMemo(
    () =>
      series.map((s, index) => {
        const points = s.data.map((row, i) => {
          const r = row as Record<string, unknown>;
          return {
            x: Number(r[s.x ?? "x"]),
            y: Number(r[s.y ?? "y"]),
            size: s.size ? Number(r[s.size]) : undefined,
            name: s.name ? String(r[s.name]) : typeof r.label === "string" ? r.label : undefined,
            id: (r.id as string | number | undefined) ?? i,
          };
        });
        return {
          s,
          index,
          points,
          color: colors?.[index % colors.length] ?? resolveTone(s.tone, index),
        };
      }),
    [series, colors],
  );

  const allPoints = resolved.flatMap((r) => r.points);
  const isEmpty = allPoints.length === 0;
  const sizeValues = allPoints.map((p) => p.size).filter((v): v is number => typeof v === "number");
  const sizeMin = Math.min(...sizeValues);
  const sizeMax = Math.max(...sizeValues);
  const radiusOf = (value: number | undefined) =>
    value === undefined || !sizeValues.length
      ? undefined
      : bubbleRange[0] +
        (Math.sqrt(Math.max(0, value - sizeMin)) / Math.sqrt(Math.max(1e-9, sizeMax - sizeMin))) *
          (bubbleRange[1] - bubbleRange[0]);

  const markerInfo: MarkerInfo = {
    sizes: Object.fromEntries(
      resolved.map((r) => [`s${r.index}`, r.points.map((p) => radiusOf(p.size))]),
    ),
    shapes: Object.fromEntries(resolved.map((r) => [`s${r.index}`, r.s.shape ?? "circle"])),
  };

  const trends = resolved
    .filter((r) => r.s.trendLine)
    .map((r) => {
      const fit = linearRegression(r.points);
      const xs = r.points.map((p) => p.x);
      return fit ? { ...fit, color: r.color, from: Math.min(...xs), to: Math.max(...xs) } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const quadrantConfig = quadrants === true ? {} : quadrants || null;
  const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / (values.length || 1);
  const qx = quadrantConfig?.x ?? avg(allPoints.map((p) => p.x));
  const qy = quadrantConfig?.y ?? avg(allPoints.map((p) => p.y));
  const legendConfig = legendPosition(legend ?? (series.length > 1 ? "bottom" : false));

  const card = cardPropsOf(props);
  return (
    <CnChartCard
      {...card}
      height={height}
      empty={!props.loading && !props.error && isEmpty}
      skeleton={
        <CnScatterChartSkeleton
          height={height}
          bubble={sizeValues.length > 0}
          trendLine={trends.length > 0}
          legend={legendConfig ? legendConfig.placement : false}
          legendItems={series.length}
        />
      }
      exportData={() => ({
        columns: [
          { id: "series", header: "Serie" },
          { id: "name", header: "Punto" },
          { id: "x", header: xLabel ?? "X", kind: "number" },
          { id: "y", header: yLabel ?? "Y", kind: "number" },
          ...(sizeValues.length ? [{ id: "size", header: "Tamaño", kind: "number" as const }] : []),
        ],
        rows: resolved.flatMap((r) =>
          r.points.map((p) => ({
            series: r.s.label,
            name: p.name ?? "",
            x: p.x,
            y: p.y,
            size: p.size,
          })),
        ),
      })}
    >
      {({ height: bodyHeight }) => (
        <MarkerContext.Provider value={markerInfo}>
          <ScatterChart
            height={bodyHeight}
            width={width}
            skipAnimation={!animate}
            hideLegend={!legendConfig}
            grid={{
              horizontal: grid === "horizontal" || grid === "both",
              vertical: grid === "vertical" || grid === "both",
            }}
            xAxis={[
              {
                label: xLabel,
                min: xMin,
                max: xMax,
                valueFormatter: (v: number | null) => formatX(v),
              },
            ]}
            yAxis={[
              {
                label: yLabel,
                min: yMin,
                max: yMax,
                valueFormatter: (v: number | null) => formatY(v),
                width: 56,
              },
            ]}
            series={
              resolved.map((r) => ({
                id: `s${r.index}`,
                label: r.s.label,
                color: r.color,
                markerSize,
                data: r.points.map((p) => ({ x: p.x, y: p.y, id: p.id })),
                valueFormatter: (
                  value: { x: number; y: number } | null,
                  context: { dataIndex: number },
                ) => {
                  if (!value) return "";
                  const point = r.points[context.dataIndex];
                  const base = `${xLabel ?? "X"}: ${formatX(value.x)} · ${yLabel ?? "Y"}: ${formatY(value.y)}`;
                  return point?.name ? `${point.name} — ${base}` : base;
                },
              })) as never
            }
            slots={{ marker: CnScatterMarker }}
            slotProps={{
              legend: legendConfig
                ? {
                    position: legendConfig.position,
                    direction: legendConfig.direction,
                    toggleVisibilityOnClick: true,
                  }
                : undefined,
              tooltip: { sx: tooltipSlotProps.sx },
            }}
            onItemClick={
              onPointClick &&
              ((_: unknown, item: { seriesId: string | number; dataIndex: number }) => {
                const r = resolved[Number(String(item.seriesId).slice(1))];
                if (r) onPointClick(r.s.data[item.dataIndex], r.s, item.dataIndex);
              })
            }
            sx={chartBaseSx}
          >
            {quadrantConfig && (
              <>
                <ChartsReferenceLine
                  x={qx}
                  lineStyle={{
                    stroke: "var(--cn-color-neutral-300, #c5cad0)",
                    strokeDasharray: "4 4",
                  }}
                />
                <ChartsReferenceLine
                  y={qy}
                  lineStyle={{
                    stroke: "var(--cn-color-neutral-300, #c5cad0)",
                    strokeDasharray: "4 4",
                  }}
                />
                {quadrantConfig.labels && <QuadrantLabels labels={quadrantConfig.labels} />}
              </>
            )}
            {trends.length > 0 && <TrendLines lines={trends} />}
          </ScatterChart>
        </MarkerContext.Provider>
      )}
    </CnChartCard>
  );
};

/** Burbujas: dispersión con tamaño por punto (`series[].size`). */
export const CnBubbleChart = <T,>(props: CnScatterChartProps<T>) => (
  <CnScatterChart<T> {...props} />
);
