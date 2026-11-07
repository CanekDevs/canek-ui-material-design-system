import Box from "@mui/material/Box";
import { PieChart, useDrawingArea } from "@mui/x-charts";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useChartWidth } from "./use-chart-width";
import { CnChartCard } from "./CnChartCard";
import { CnPieChartSkeleton } from "./CnChartSkeleton";
import type { CnChartCommonProps } from "./chart-common";
import {
  cardPropsOf,
  chartBaseSx,
  legendPosition,
  tooltipSlotProps,
  useFormatter,
} from "./chart-common";
import type { CnChartTone } from "./chart-theme";
import { resolveTone, sumValues } from "./chart-theme";

export type CnPieDatum = {
  id?: string | number;
  label: string;
  value: number;
  tone?: CnChartTone | string;
};

export type CnPieChartProps = CnChartCommonProps & {
  data: ReadonlyArray<CnPieDatum>;
  /** Pastel, dona o media dona (semicírculo). */
  variant?: "pie" | "donut" | "half";
  /** Grosor del anillo en px (dona). Por defecto 28 % del radio. */
  thickness?: number;
  /** Anillos exteriores adicionales (pastel anidado). */
  rings?: ReadonlyArray<{ label?: string; data: ReadonlyArray<CnPieDatum> }>;
  /** Texto central (dona): `true` = total; también acepta contenido propio. */
  centerLabel?: boolean | ReactNode;
  centerCaption?: ReactNode;
  /** Etiquetas sobre los segmentos. */
  arcLabels?: "value" | "percent" | "label" | false;
  /** Ángulo mínimo para mostrar la etiqueta del segmento. */
  arcLabelMinAngle?: number;
  paddingAngle?: number;
  cornerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  /** Agrupa en "Otros" lo que exceda N segmentos. */
  maxSlices?: number;
  othersLabel?: string;
  /** Ordena los segmentos de mayor a menor. */
  sort?: boolean;
  /** Muestra % junto al valor en tooltip y leyenda. */
  showPercent?: boolean;
  onSliceClick?: (datum: CnPieDatum, index: number) => void;
};

const groupOthers = (
  data: ReadonlyArray<CnPieDatum>,
  max: number | undefined,
  label: string,
  sort: boolean,
): CnPieDatum[] => {
  const list = sort ? [...data].sort((a, b) => b.value - a.value) : [...data];
  if (!max || list.length <= max) return list;
  const sorted = [...list].sort((a, b) => b.value - a.value);
  const keep = new Set(sorted.slice(0, max - 1));
  const others = sorted.slice(max - 1);
  return [
    ...list.filter((d) => keep.has(d)),
    { id: "__others", label, value: sumValues(others.map((d) => d.value)), tone: "neutral" },
  ];
};

const CenterLabel = ({
  half,
  primary,
  caption,
  centerY,
}: {
  half: boolean;
  primary: ReactNode;
  caption?: ReactNode;
  centerY?: number;
}) => {
  const { left, top, width, height } = useDrawingArea();
  const cx = left + width / 2;
  const cy = half && centerY !== undefined ? top + centerY : top + height / 2;
  return (
    <foreignObject
      x={cx - 90}
      y={cy - (half ? 44 : 30)}
      width={180}
      height={60}
      style={{ pointerEvents: "none" }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        <Box
          sx={{
            fontSize: "1.35rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--cn-color-text-primary, #111418)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {primary}
        </Box>
        {caption && (
          <Box
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {caption}
          </Box>
        )}
      </Box>
    </foreignObject>
  );
};

/** Pastel, dona, media dona y anillos anidados con total central. */
export const CnPieChart = (props: CnPieChartProps) => {
  const {
    data,
    variant = "pie",
    thickness,
    rings = [],
    centerLabel = variant !== "pie",
    centerCaption = "Total",
    arcLabels = variant === "pie" ? "percent" : false,
    arcLabelMinAngle = 18,
    paddingAngle,
    cornerRadius,
    startAngle,
    endAngle,
    maxSlices,
    othersLabel = "Otros",
    sort = false,
    showPercent = true,
    onSliceClick,
    height = 280,
    width,
    legend = variant === "half" ? "bottom" : "right",
    colors,
    animate = true,
  } = props;
  const [measureRef, measuredWidth] = useChartWidth();

  const format = useFormatter(props);
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const slices = useMemo(
    () => groupOthers(data, maxSlices, othersLabel, sort),
    [data, maxSlices, othersLabel, sort],
  );
  const total = sumValues(slices.map((d, i) => (hidden.has(i) ? 0 : d.value)));
  const fullTotal = sumValues(slices.map((d) => d.value));
  const half = variant === "half";
  const isEmpty = slices.length === 0 || fullTotal <= 0;
  const legendConfig = legendPosition(legend);
  const pct = (value: number, of: number) =>
    of > 0
      ? `${((value / of) * 100).toLocaleString("es-MX", { maximumFractionDigits: 1 })} %`
      : "0 %";

  const ringCount = rings.length + 1;

  const toSeries = (list: ReadonlyArray<CnPieDatum>, ring: number, bodyHeight: number) => {
    const ringTotal = sumValues(list.map((d) => d.value));
    const side =
      legendConfig && (legendConfig.placement === "left" || legendConfig.placement === "right");
    const legendH = legendConfig && !side ? 40 : 0;
    const plotW = (width ?? measuredWidth) - (side ? 170 : 0);
    // Radio disponible (px). La media dona solo ocupa la mitad superior.
    const radius = half
      ? Math.max(40, Math.min(plotW / 2 - 12, bodyHeight - legendH - 24))
      : Math.max(30, Math.min(plotW, bodyHeight - legendH) / 2 - 10);
    const outerPx = (radius * (ring + 1)) / ringCount;
    const fraction = thickness
      ? Math.min(0.9, thickness / Math.max(1, outerPx))
      : rings.length
        ? 0.45
        : 0.38;
    const inner =
      ring > 0
        ? (radius * ring) / ringCount + 3
        : variant === "pie"
          ? 0
          : rings.length
            ? outerPx * 0.55
            : outerPx * (1 - fraction);
    return {
      id: `ring${ring}`,
      data: list.map((d, i) => ({
        id: d.id ?? `${ring}-${i}`,
        value: d.value,
        label: d.label,
        color: colors?.[i % colors.length] ?? resolveTone(d.tone, i),
      })),
      innerRadius: inner,
      outerRadius: outerPx,
      paddingAngle: paddingAngle ?? (variant === "pie" ? 0.5 : 2),
      cornerRadius: cornerRadius ?? (variant === "pie" ? 2 : 6),
      startAngle: startAngle ?? (half ? -90 : 0),
      endAngle: endAngle ?? (half ? 90 : 360),
      cy: half ? radius + 6 : undefined,
      arcLabelMinAngle,
      ...(arcLabels && {
        arcLabel: (item: { value: number; label?: string }) =>
          arcLabels === "percent"
            ? pct(item.value, ringTotal)
            : arcLabels === "label"
              ? (item.label ?? "")
              : format(item.value),
      }),
      highlightScope: { fade: "global" as const, highlight: "item" as const },
      highlighted: { additionalRadius: 4 },
      faded: { additionalRadius: -2, color: "rgba(160, 166, 175, 0.35)" },
      valueFormatter: (item: { value: number }) =>
        showPercent ? `${format(item.value)} (${pct(item.value, ringTotal)})` : format(item.value),
    };
  };

  const seriesFor = (bodyHeight: number) => [
    toSeries(slices, 0, bodyHeight),
    ...rings.map((ring, i) => toSeries(ring.data, i + 1, bodyHeight)),
  ];

  const centerPrimary =
    centerLabel === true ? format(total) : centerLabel === false ? null : centerLabel;

  const card = cardPropsOf(props);
  return (
    <CnChartCard
      {...card}
      height={height}
      empty={!props.loading && !props.error && isEmpty}
      skeleton={
        <CnPieChartSkeleton
          variant={variant}
          slices={Math.min(8, slices.length || 5)}
          height={height}
          legend={legendConfig ? legendConfig.placement : false}
          legendItems={Math.min(6, slices.length || 4)}
          centerLabel={Boolean(centerPrimary)}
        />
      }
      exportData={() => ({
        columns: [
          { id: "label", header: "Concepto" },
          { id: "value", header: "Valor", kind: "number" },
          { id: "percent", header: "Porcentaje", kind: "percent" },
        ],
        rows: slices.map((d) => ({
          label: d.label,
          value: d.value,
          percent: fullTotal ? (d.value / fullTotal) * 100 : 0,
        })),
      })}
    >
      {({ height: bodyHeight }) => (
        <Box ref={measureRef} sx={{ width: "100%" }}>
          <PieChart
            series={seriesFor(bodyHeight) as never}
            height={bodyHeight}
            width={width}
            skipAnimation={!animate}
            hideLegend={!legendConfig}
            margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onHiddenItemsChange={(items) =>
              setHidden(
                new Set(
                  (items as { seriesId?: string; dataIndex?: number }[])
                    .filter((item) => item.seriesId === "ring0" && item.dataIndex != null)
                    .map((item) => item.dataIndex as number),
                ),
              )
            }
            onItemClick={
              onSliceClick &&
              ((_, item) => {
                if (item.seriesId === "ring0") onSliceClick(slices[item.dataIndex], item.dataIndex);
              })
            }
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
            sx={chartBaseSx}
          >
            {centerPrimary && variant !== "pie" && (
              <CenterLabel
                half={half}
                primary={centerPrimary}
                caption={centerCaption}
                centerY={half ? (seriesFor(bodyHeight)[0].cy as number) : undefined}
              />
            )}
          </PieChart>
        </Box>
      )}
    </CnChartCard>
  );
};

/** Dona con total central. */
export const CnDonutChart = (props: Omit<CnPieChartProps, "variant">) => (
  <CnPieChart {...props} variant="donut" />
);
