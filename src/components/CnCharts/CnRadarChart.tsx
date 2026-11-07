import { RadarChart } from "@mui/x-charts";
import { CnChartCard } from "./CnChartCard";
import { CnRadarChartSkeleton } from "./CnChartSkeleton";
import type { CnChartCommonProps } from "./chart-common";
import {
  cardPropsOf,
  chartBaseSx,
  legendPosition,
  tooltipSlotProps,
  useFormatter,
} from "./chart-common";
import type { CnChartTone } from "./chart-theme";
import { resolveTone } from "./chart-theme";

export type CnRadarSeries = {
  label: string;
  /** Un valor por métrica, en el mismo orden que `metrics`. */
  data: ReadonlyArray<number>;
  tone?: CnChartTone | string;
  /** Relleno del área (default true). */
  fill?: boolean;
  hideMarks?: boolean;
};

export type CnRadarChartProps = CnChartCommonProps & {
  metrics: ReadonlyArray<string | { name: string; max?: number; min?: number }>;
  series: CnRadarSeries[];
  /** Máximo común de todas las métricas. */
  max?: number;
  /** Rejilla poligonal o circular. */
  shape?: "polygon" | "circle";
  /** Número de anillos de la rejilla. */
  divisions?: number;
  /** Resalta la métrica completa o la serie al pasar el cursor. */
  highlight?: "axis" | "series" | "none";
};

/** Radar (araña) para comparar perfiles en varias métricas. */
export const CnRadarChart = (props: CnRadarChartProps) => {
  const {
    metrics,
    series,
    max,
    shape = "polygon",
    divisions = 5,
    highlight = "axis",
    height = 320,
    width,
    legend,
    colors,
    animate = true,
  } = props;
  const format = useFormatter(props);
  const metricList = metrics.map((m) => (typeof m === "string" ? { name: m } : m));
  const isEmpty = metricList.length < 3 || series.length === 0;
  const legendConfig = legendPosition(legend ?? (series.length > 1 ? "bottom" : false));
  const computedMax =
    max ?? Math.max(1, ...series.flatMap((s) => s.data).filter((v) => Number.isFinite(v))) * 1.1;

  const card = cardPropsOf(props);
  return (
    <CnChartCard
      {...card}
      height={height}
      empty={!props.loading && !props.error && isEmpty}
      skeleton={
        <CnRadarChartSkeleton
          height={height}
          metrics={Math.max(3, metricList.length)}
          series={Math.min(3, series.length || 1)}
          shape={shape}
          levels={Math.min(divisions, 6)}
          legend={legendConfig ? legendConfig.placement : false}
          legendItems={series.length}
        />
      }
      exportData={() => ({
        columns: [
          { id: "metric", header: "Métrica" },
          ...series.map((s, i) => ({ id: `s${i}`, header: s.label, kind: "number" as const })),
        ],
        rows: metricList.map((m, mi) => ({
          metric: m.name,
          ...Object.fromEntries(series.map((s, i) => [`s${i}`, s.data[mi]])),
        })),
      })}
    >
      {({ height: bodyHeight }) => (
        <RadarChart
          height={bodyHeight}
          width={width}
          skipAnimation={!animate}
          hideLegend={!legendConfig}
          shape={shape === "circle" ? "circular" : "sharp"}
          divisions={divisions}
          highlight={highlight}
          radar={{
            metrics: metricList.map((m) => ({
              name: m.name,
              max: m.max ?? computedMax,
              min: m.min ?? 0,
            })),
          }}
          series={series.map((s, i) => ({
            id: `s${i}`,
            label: s.label,
            data: [...s.data],
            color: colors?.[i % colors.length] ?? resolveTone(s.tone, i),
            fillArea: s.fill ?? true,
            hideMark: s.hideMarks ?? false,
            valueFormatter: (v: number | null) => format(v),
          }))}
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
          sx={{
            ...chartBaseSx,
            "& .MuiRadarGrid-radial, & .MuiRadarGrid-divider": {
              stroke: "var(--cn-color-neutral-200, #dde0e4)",
            },
            "& .MuiRadarMetricLabels-root text, & .MuiRadarAxis-label": {
              fontSize: "11px",
              fontWeight: 600,
              fill: "var(--cn-color-neutral-600, #4e5660)",
            },
          }}
        />
      )}
    </CnChartCard>
  );
};
