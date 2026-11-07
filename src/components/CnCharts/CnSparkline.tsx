import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { SparkLineChart, useDrawingArea, useXScale, useYScale } from "@mui/x-charts";
import { useId, useMemo } from "react";
import { CnIcon } from "../CnIcon";
import { CnSparklineSkeleton } from "./CnChartSkeleton";
import type { CnChartFormatOptions, CnChartTone, CnChartValueFormat } from "./chart-theme";
import { createValueFormatter, percentChange, resolveTone } from "./chart-theme";

export type CnSparklineProps = CnChartFormatOptions & {
  data: ReadonlyArray<number | null>;
  /** Etiquetas para el tooltip (fechas, periodos). */
  labels?: ReadonlyArray<string>;
  type?: "line" | "area" | "bar";
  /** Tono fijo, o `"trend"` para verde/rojo según la tendencia. */
  tone?: CnChartTone | string | "trend";
  /** Invierte la lectura de la tendencia (costos, tiempos). */
  invertTrend?: boolean;
  width?: number | string;
  height?: number;
  curve?: "smooth" | "linear" | "step";
  /** Marca el punto mínimo y máximo. */
  showExtremes?: boolean;
  /** Línea punteada en el promedio. */
  showAverage?: boolean;
  /** Valor final y variación a la derecha. */
  showValue?: boolean;
  showTooltip?: boolean;
  valueFormat?: CnChartValueFormat;
  loading?: boolean;
  emptyText?: string;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

const Extremes = ({ values, color }: { values: (number | null)[]; color: string }) => {
  const x = useXScale() as unknown as (v: number) => number;
  const y = useYScale() as unknown as (v: number) => number;
  const numeric = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v != null);
  if (numeric.length < 2) return null;
  const max = numeric.reduce((a, b) => (b.v > a.v ? b : a));
  const min = numeric.reduce((a, b) => (b.v < a.v ? b : a));
  return (
    <g>
      <circle cx={x(max.i)} cy={y(max.v)} r={3} fill="#fff" stroke={color} strokeWidth={2} />
      <circle cx={x(min.i)} cy={y(min.v)} r={3} fill="#fff" stroke={color} strokeWidth={2} />
    </g>
  );
};

const Average = ({ value, color }: { value: number; color: string }) => {
  const y = useYScale() as unknown as (v: number) => number;
  const { left, width } = useDrawingArea();
  return (
    <line
      x1={left}
      x2={left + width}
      y1={y(value)}
      y2={y(value)}
      stroke={color}
      strokeOpacity={0.5}
      strokeDasharray="3 3"
    />
  );
};

/** Mini gráfica de tendencia para tarjetas, tablas y KPIs. */
export const CnSparkline = ({
  data,
  labels,
  type = "line",
  tone = "trend",
  invertTrend = false,
  width = "100%",
  height = 40,
  curve = "smooth",
  showExtremes = false,
  showAverage = false,
  showValue = false,
  showTooltip = true,
  valueFormat = "number",
  loading = false,
  emptyText = "Sin datos",
  ariaLabel,
  sx,
  className,
  ...format
}: CnSparklineProps) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const values = useMemo(
    () => data.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : null)),
    [data],
  );
  const numeric = values.filter((v): v is number => v != null);
  const first = numeric[0];
  const last = numeric[numeric.length - 1];
  const change = numeric.length > 1 ? percentChange(last, first) : null;
  const up = (last ?? 0) >= (first ?? 0);
  const positive = up !== invertTrend;
  const color = tone === "trend" ? resolveTone(positive ? "success" : "error") : resolveTone(tone);
  const fmt = useMemo(() => createValueFormatter(valueFormat, format), [valueFormat, format]);
  const average = numeric.length ? numeric.reduce((a, b) => a + b, 0) / numeric.length : 0;

  if (loading) {
    return (
      <CnSparklineSkeleton
        type={type}
        width={width}
        height={height}
        sx={sx}
        className={className}
      />
    );
  }

  const label =
    ariaLabel ??
    (numeric.length
      ? `Tendencia: de ${fmt(first)} a ${fmt(last)}${change != null ? ` (${change >= 0 ? "+" : ""}${change.toFixed(1)} %)` : ""}`
      : emptyText);

  return (
    <Box
      role="img"
      aria-label={label}
      className={className}
      sx={[
        { display: "flex", alignItems: "center", gap: "10px", width, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ flex: 1, minWidth: 0, height }}>
        {numeric.length === 0 ? (
          <Box
            sx={{
              height,
              display: "flex",
              alignItems: "center",
              fontSize: "0.72rem",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {emptyText}
          </Box>
        ) : (
          <SparkLineChart
            data={values as number[]}
            height={height}
            plotType={type === "bar" ? "bar" : "line"}
            area={type === "area"}
            curve={curve === "smooth" ? "monotoneX" : curve === "step" ? "step" : "linear"}
            color={color}
            showTooltip={showTooltip}
            showHighlight={showTooltip}
            valueFormatter={(v) => fmt(v)}
            xAxis={
              labels
                ? { data: labels as string[], scaleType: type === "bar" ? "band" : "point" }
                : undefined
            }
            margin={{ top: 4, bottom: 4, left: 3, right: 3 }}
            sx={{
              "& .MuiLineChart-line": { strokeWidth: 2 },
              ...(type === "area" && {
                "& .MuiLineChart-area": { fill: `url(#cn-spark-${uid}) !important` },
              }),
            }}
          >
            <defs>
              <linearGradient id={`cn-spark-${uid}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {showAverage && <Average value={average} color={color} />}
            {showExtremes && type !== "bar" && <Extremes values={values} color={color} />}
          </SparkLineChart>
        )}
      </Box>
      {showValue && numeric.length > 0 && (
        <Box sx={{ textAlign: "right", flexShrink: 0, lineHeight: 1.15 }}>
          <Box
            sx={{
              fontSize: "0.85rem",
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              color: "var(--cn-color-text-primary, #111418)",
            }}
          >
            {fmt(last)}
          </Box>
          {change != null && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                fontSize: "0.7rem",
                fontWeight: 700,
                color,
              }}
            >
              <CnIcon name={up ? "trending_up" : "trending_down"} size="xs" />
              {`${change >= 0 ? "+" : ""}${change.toFixed(1)} %`}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
