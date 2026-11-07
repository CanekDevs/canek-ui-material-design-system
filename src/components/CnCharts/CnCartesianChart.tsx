import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import {
  AreaPlot,
  BarPlot,
  ChartsAxis,
  ChartsAxisHighlight,
  ChartsClipPath,
  ChartsDataProvider,
  ChartsGrid,
  ChartsLegend,
  ChartsReferenceLine,
  ChartsSurface,
  ChartsTooltip,
  ChartsWrapper,
  LineHighlightPlot,
  LinePlot,
  MarkPlot,
} from "@mui/x-charts";
import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import { CnChartCard } from "./CnChartCard";
import type { CnChartTypeOption } from "./CnChartCard";
import {
  CnAreaChartSkeleton,
  CnBarChartSkeleton,
  CnComposedChartSkeleton,
  CnLineChartSkeleton,
} from "./CnChartSkeleton";
import type { CnChartCommonProps, CnReferenceArea, CnReferenceLine } from "./chart-common";
import {
  GradientDefs,
  ReferenceAreaPlot,
  cardPropsOf,
  chartBaseSx,
  legendPosition,
  tooltipSlotProps,
  useFormatter,
} from "./chart-common";
import type { CnChartTone, CnChartValueFormat } from "./chart-theme";
import {
  createValueFormatter,
  movingAverage,
  resolveTone,
  sumValues,
  withAlpha,
} from "./chart-theme";

export type CnCartesianType = "bar" | "line" | "area";
export type CnCurve = "smooth" | "linear" | "step" | "natural" | "monotone";

export type CnCartesianSeries<T = Record<string, unknown>> = {
  /** Campo del registro con el valor (o usa `data`). */
  key?: keyof T & string;
  data?: ReadonlyArray<number | null>;
  /** Valor calculado por registro. */
  value?: (row: T, index: number) => number | null;
  label: string;
  /** Tono de Canek o color CSS. */
  tone?: CnChartTone | string;
  /** Tipo (gráfica combinada). Por defecto el de la gráfica. */
  type?: CnCartesianType;
  /** Eje y: izquierdo (default) o derecho (doble eje). */
  axis?: "left" | "right";
  /** Grupo de apilado (sobrescribe `stacked`). */
  stack?: string;
  valueFormat?: CnChartValueFormat;
  curve?: CnCurve;
  /** Marcadores en los puntos (líneas). */
  markers?: boolean;
  /** Línea punteada (proyecciones, metas). */
  dashed?: boolean;
  /** Relleno con gradiente (áreas y barras). */
  gradient?: boolean;
  /** Oculta la serie al inicio (se activa desde la leyenda). */
  hidden?: boolean;
  /** Agrega una serie de media móvil de N periodos. */
  movingAverage?: number;
};

export type CnCartesianChartProps<T = Record<string, unknown>> = CnChartCommonProps & {
  data: ReadonlyArray<T>;
  /** Campo con la categoría o fecha del eje x. */
  xKey?: keyof T & string;
  /** Categorías explícitas (si no se usa `xKey`). */
  categories?: ReadonlyArray<string | number | Date>;
  series: CnCartesianSeries<T>[];
  /** Tipo por defecto de las series. */
  type?: CnCartesianType;
  /** Selector de tipo en la tarjeta (`true` = barras, línea y área). */
  typeOptions?: CnCartesianType[] | boolean;
  onTypeChange?: (type: CnCartesianType) => void;
  /** Barras horizontales. */
  layout?: "vertical" | "horizontal";
  /** Apila todas las series; `"percent"` = 100 %. */
  stacked?: boolean | "percent";
  curve?: CnCurve;
  markers?: boolean;
  /** Relleno con gradiente en todas las series de área/barra. */
  gradient?: boolean;
  barLabels?: boolean | "inside" | "outside";
  borderRadius?: number;
  /** Separación entre categorías (0 a 1). */
  categoryGap?: number;
  grid?: "horizontal" | "vertical" | "both" | "none";
  xFormat?: (value: unknown) => string;
  xLabel?: string;
  yLabel?: string;
  yRightLabel?: string;
  yRightFormat?: CnChartValueFormat;
  yMin?: number;
  yMax?: number;
  /** Inclina las etiquetas del eje x (grados). */
  xTickAngle?: number;
  referenceLines?: CnReferenceLine[];
  referenceAreas?: CnReferenceArea[];
  /** Control de rango bajo la gráfica para acercar un periodo. */
  zoom?: boolean | { start?: number; end?: number };
  connectNulls?: boolean;
  /** Tooltip por eje (todas las series) o por elemento. */
  tooltip?: "axis" | "item" | "none";
  onItemClick?: (item: {
    series: CnCartesianSeries<T>;
    index: number;
    value: number | null;
    row: T | undefined;
    category: unknown;
  }) => void;
  /** Contenido SVG adicional dentro del área de la gráfica. */
  children?: ReactNode;
};

const CURVES: Record<CnCurve, "catmullRom" | "linear" | "step" | "natural" | "monotoneX"> = {
  // Monótona: suave pero sin rebasar los datos (no inventa picos).
  smooth: "monotoneX",
  linear: "linear",
  step: "step",
  natural: "natural",
  monotone: "monotoneX",
};

const TYPE_OPTIONS: Record<CnCartesianType, CnChartTypeOption> = {
  bar: { value: "bar", label: "Barras", icon: "bar_chart" },
  line: { value: "line", label: "Líneas", icon: "show_chart" },
  area: { value: "area", label: "Área", icon: "area_chart" },
};

const getPath = (row: unknown, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc == null ? acc : (acc as Record<string, unknown>)[key]),
      row,
    );

const defaultXFormat = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  }
  return String(value ?? "");
};

/**
 * Motor de gráficas cartesianas de Canek (barras, líneas, áreas y
 * combinadas) sobre la composición de MUI X Charts.
 */
export const CnCartesianChart = <T,>(props: CnCartesianChartProps<T>) => {
  const {
    data,
    xKey,
    categories: categoriesProp,
    series: seriesProp,
    type: typeProp = "bar",
    typeOptions,
    onTypeChange,
    layout = "vertical",
    stacked = false,
    curve = "smooth",
    markers,
    gradient = false,
    barLabels = false,
    borderRadius = 6,
    categoryGap = 0.3,
    grid = layout === "horizontal" ? "vertical" : "horizontal",
    xFormat = defaultXFormat,
    xLabel,
    yLabel,
    yRightLabel,
    yRightFormat,
    yMin,
    yMax,
    xTickAngle,
    referenceLines = [],
    referenceAreas = [],
    zoom = false,
    connectNulls = false,
    tooltip = "axis",
    onItemClick,
    children,
    height = 300,
    width,
    legend,
    colors,
    animate = true,
  } = props;

  const [innerType, setInnerType] = useState<CnCartesianType>(typeProp);
  const chartType = typeOptions ? innerType : typeProp;
  const formatValue = useFormatter(props);
  const formatRight = useMemo(
    () => (yRightFormat ? createValueFormatter(yRightFormat, props) : formatValue),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [yRightFormat, formatValue],
  );
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const horizontal = layout === "horizontal";

  // ─── Datos ──────────────────────────────────────────────────────────
  const allCategories = useMemo(
    () =>
      categoriesProp ??
      (xKey
        ? data.map((row) => getPath(row, xKey) as string | number | Date)
        : data.map((_, i) => i + 1)),
    [categoriesProp, data, xKey],
  );

  const resolvedSeries = useMemo(() => {
    const base = seriesProp.map((series, index) => {
      const values: (number | null)[] = series.data
        ? [...series.data]
        : data.map((row, rowIndex) => {
            const raw = series.value
              ? series.value(row, rowIndex)
              : series.key
                ? getPath(row, series.key)
                : null;
            return typeof raw === "number" && Number.isFinite(raw)
              ? raw
              : raw == null
                ? null
                : Number(raw);
          });
      return { series, values, index };
    });
    const extras = base
      .filter(({ series }) => series.movingAverage && series.movingAverage > 1)
      .map(({ series, values }, i) => ({
        series: {
          label: `${series.label} (media ${series.movingAverage})`,
          tone: withAlpha(resolveTone(series.tone, seriesProp.indexOf(series)), 0.55),
          type: "line" as const,
          dashed: true,
          axis: series.axis,
          valueFormat: series.valueFormat,
          markers: false,
        } as CnCartesianSeries<T>,
        values: movingAverage(values, series.movingAverage ?? 2),
        index: seriesProp.length + i,
      }));
    return [...base, ...extras];
  }, [data, seriesProp]);

  // Zoom: ventana de índices visibles.
  const total = allCategories.length;
  const zoomConfig = typeof zoom === "object" ? zoom : {};
  const [range, setRange] = useState<[number, number]>([
    zoomConfig.start ?? 0,
    Math.min(total - 1, zoomConfig.end ?? total - 1),
  ]);
  const windowStart = zoom ? Math.min(range[0], Math.max(0, total - 1)) : 0;
  const windowEnd = zoom ? Math.min(range[1], total - 1) : total - 1;
  const categories = allCategories.slice(windowStart, windowEnd + 1);
  const visibleRows = data.slice(windowStart, windowEnd + 1);

  const isEmpty =
    total === 0 || resolvedSeries.every(({ values }) => values.every((v) => v == null));
  const hasRight = resolvedSeries.some(({ series }) => series.axis === "right");
  const anyBar = resolvedSeries.some(({ series }) => (series.type ?? chartType) === "bar");
  const percent = stacked === "percent";
  const xIsDate = categories.length > 0 && categories[0] instanceof Date;
  const scaleType = anyBar || horizontal ? "band" : xIsDate ? "time" : "point";

  const xAxisId = "x";
  const categoryAxis = {
    id: xAxisId,
    scaleType,
    data: categories as (string | number | Date)[],
    valueFormatter: (value: unknown) => xFormat(value),
    label: horizontal ? undefined : xLabel,
    categoryGapRatio: categoryGap,
    barGapRatio: 0.15,
    ...(xTickAngle && { tickLabelStyle: { angle: xTickAngle, textAnchor: "end" as const } }),
    height: xTickAngle ? 56 : undefined,
  };
  const valueAxisLeft = {
    id: "left",
    label: horizontal ? xLabel : yLabel,
    min: percent ? 0 : yMin,
    max: percent ? 1 : yMax,
    valueFormatter: (value: number | null) =>
      percent ? `${Math.round((value ?? 0) * 100)} %` : formatValue(value),
    width: horizontal ? undefined : 56,
  };
  const valueAxisRight = {
    id: "right",
    position: "right" as const,
    label: yRightLabel,
    valueFormatter: (value: number | null) => formatRight(value),
    width: 56,
  };

  // Etiquetas de barra: se omiten en segmentos demasiado pequeños para leerse.
  const labelThreshold = (() => {
    if (!barLabels || !stacked) return 0;
    let max = 0;
    for (let i = windowStart; i <= windowEnd; i += 1) {
      max = Math.max(max, sumValues(resolvedSeries.map(({ values }) => Math.abs(values[i] ?? 0))));
    }
    return max * 0.07;
  })();

  const muiSeries = resolvedSeries.map(({ series, values, index }) => {
    const seriesType = horizontal ? "bar" : (series.type ?? chartType);
    const color = colors?.[index % colors.length] ?? resolveTone(series.tone, index);
    const fmt = series.valueFormat
      ? createValueFormatter(series.valueFormat, props)
      : series.axis === "right"
        ? formatRight
        : formatValue;
    const stack = series.stack ?? (stacked ? "total" : undefined);
    const common = {
      id: `s${index}`,
      label: series.label,
      color,
      data: values.slice(windowStart, windowEnd + 1),
      valueFormatter: (value: number | null) => fmt(value),
      stack,
      stackOffset: percent ? ("expand" as const) : undefined,
      ...(series.hidden && { hidden: true }),
    };
    if (seriesType === "bar") {
      return {
        ...common,
        type: "bar" as const,
        layout: horizontal ? ("horizontal" as const) : ("vertical" as const),
        ...(horizontal
          ? { xAxisId: series.axis === "right" ? "right" : "left", yAxisId: xAxisId }
          : { xAxisId, yAxisId: series.axis === "right" ? "right" : "left" }),
        ...(barLabels && {
          barLabel: (item: { value: number | null }) =>
            item.value == null || item.value === 0 || Math.abs(item.value) < labelThreshold
              ? null
              : percent
                ? null
                : fmt(item.value),
          barLabelPlacement: barLabels === "outside" ? ("outside" as const) : ("center" as const),
        }),
      };
    }
    return {
      ...common,
      type: "line" as const,
      xAxisId,
      yAxisId: series.axis === "right" ? "right" : "left",
      area: seriesType === "area",
      curve: CURVES[series.curve ?? curve],
      showMark: series.markers ?? markers ?? (categories.length <= 14 && seriesType === "line"),
      connectNulls,
    };
  });

  const gradientSeries = muiSeries.filter((s, i) => {
    const source = resolvedSeries[i].series;
    const isFill = s.type === "bar" || ("area" in s && s.area);
    return isFill && (source.gradient ?? (gradient || ("area" in s && s.area)));
  });

  const legendConfig = legendPosition(legend ?? (resolvedSeries.length > 1 ? "bottom" : false));
  const clipId = `cn-clip-${uid}`;

  const seriesSx = Object.fromEntries(
    muiSeries.flatMap((s, i) => {
      const source = resolvedSeries[i].series;
      const rules: [string, Record<string, unknown>][] = [];
      if (gradientSeries.includes(s)) {
        if (s.type === "bar") {
          rules.push([`& g[data-series="${s.id}"] rect`, { fill: `url(#cn-grad-${uid}-${s.id})` }]);
        } else {
          rules.push([
            `& .MuiLineChart-area[data-series="${s.id}"], & .MuiAreaElement-root[data-series="${s.id}"]`,
            { fill: `url(#cn-grad-${uid}-${s.id}) !important` },
          ]);
        }
      }
      if (source.dashed) {
        rules.push([
          `& .MuiLineChart-line[data-series="${s.id}"], & .MuiLineElement-root[data-series="${s.id}"]`,
          { strokeDasharray: "6 5" },
        ]);
      }
      return rules;
    }),
  );

  const exportData = () => ({
    columns: [
      { id: "category", header: xLabel ?? "Categoría" },
      ...resolvedSeries.map(({ series, index }) => ({
        id: `s${index}`,
        header: series.label,
        kind: "number" as const,
      })),
    ],
    rows: allCategories.map((category, i) => ({
      category: xFormat(category),
      ...Object.fromEntries(resolvedSeries.map(({ index, values }) => [`s${index}`, values[i]])),
    })),
  });

  const skeleton = (() => {
    const shared = {
      height,
      legend: legendConfig ? legendConfig.placement : false,
      legendItems: resolvedSeries.length,
    } as const;
    const types = new Set(resolvedSeries.map(({ series }) => series.type ?? chartType));
    if (types.size > 1)
      return (
        <CnComposedChartSkeleton
          {...shared}
          bars={Math.min(12, total || 8)}
          barSeries={
            resolvedSeries.filter(({ series }) => (series.type ?? chartType) === "bar").length || 1
          }
          lineSeries={
            resolvedSeries.filter(({ series }) => (series.type ?? chartType) !== "bar").length || 1
          }
          dualAxis={hasRight}
        />
      );
    if (chartType === "bar" || horizontal)
      return (
        <CnBarChartSkeleton
          {...shared}
          layout={layout}
          bars={Math.min(horizontal ? 10 : 12, total || 7)}
          series={stacked ? Math.min(4, resolvedSeries.length) : Math.min(3, resolvedSeries.length)}
          stacked={Boolean(stacked)}
          borderRadius={borderRadius}
        />
      );
    if (chartType === "area")
      return (
        <CnAreaChartSkeleton
          {...shared}
          series={Math.min(3, resolvedSeries.length)}
          stacked={Boolean(stacked)}
          points={Math.min(16, total || 12)}
        />
      );
    return (
      <CnLineChartSkeleton
        {...shared}
        series={Math.min(3, resolvedSeries.length)}
        points={Math.min(16, total || 12)}
        markers={markers}
        curve={curve === "step" ? "step" : curve === "linear" ? "linear" : "smooth"}
      />
    );
  })();

  const card = cardPropsOf(props);
  const options =
    typeOptions === true
      ? (["bar", "line", "area"] as CnCartesianType[])
      : typeOptions || undefined;

  const renderChart = (chartHeight: number) => (
    <Box sx={{ width: "100%" }}>
      <ChartsDataProvider
        series={muiSeries as never}
        xAxis={
          (horizontal
            ? [
                valueAxisLeft,
                ...(hasRight ? [{ ...valueAxisRight, position: "top" as const }] : []),
              ]
            : [categoryAxis]) as never
        }
        yAxis={
          (horizontal
            ? [{ ...categoryAxis, width: 124 }]
            : [valueAxisLeft, ...(hasRight ? [valueAxisRight] : [])]) as never
        }
        height={chartHeight}
        width={width}
        skipAnimation={!animate}
        margin={{ top: 12, right: hasRight ? 4 : horizontal ? 24 : 12, bottom: 4, left: 4 }}
      >
        <ChartsWrapper
          legendPosition={legendConfig?.position}
          legendDirection={legendConfig?.direction}
          hideLegend={!legendConfig}
          sx={[
            chartBaseSx,
            seriesSx,
            {
              "& .MuiBarLabel-root, & .MuiBarChart-barLabel": {
                fill:
                  barLabels === "outside"
                    ? "var(--cn-color-neutral-700, #363d45) !important"
                    : "#ffffff !important",
                ...(barLabels !== "outside" && {
                  paintOrder: "stroke",
                  stroke: "rgba(17, 20, 24, 0.25)",
                  strokeWidth: "2px",
                }),
              },
            },
          ]}
        >
          {legendConfig && <ChartsLegend toggleVisibilityOnClick />}
          <ChartsSurface>
            <GradientDefs
              horizontal={horizontal}
              gradients={gradientSeries.map((s) => ({
                id: `cn-grad-${uid}-${s.id}`,
                color: s.color,
                from: s.type === "bar" ? 1 : 0.5,
                to: s.type === "bar" ? 0.55 : 0.03,
              }))}
            />
            {grid !== "none" && (
              <ChartsGrid
                horizontal={grid === "horizontal" || grid === "both"}
                vertical={grid === "vertical" || grid === "both"}
              />
            )}
            {referenceAreas.length > 0 && (
              <ReferenceAreaPlot areas={referenceAreas} xAxisId={xAxisId} />
            )}
            <g clipPath={`url(#${clipId})`}>
              <AreaPlot skipAnimation={!animate} />
              <BarPlot
                borderRadius={borderRadius}
                skipAnimation={!animate}
                onItemClick={
                  onItemClick &&
                  ((_, item) => {
                    const i = Number(item.seriesId.slice(1));
                    const source = resolvedSeries[i];
                    onItemClick({
                      series: source.series,
                      index: windowStart + item.dataIndex,
                      value: source.values[windowStart + item.dataIndex] ?? null,
                      row: visibleRows[item.dataIndex],
                      category: categories[item.dataIndex],
                    });
                  })
                }
              />
              <LinePlot skipAnimation={!animate} />
              <ChartsAxisHighlight
                x={horizontal ? "none" : anyBar ? "band" : "line"}
                y={horizontal ? "band" : "none"}
              />
              <LineHighlightPlot />
            </g>
            <MarkPlot
              skipAnimation={!animate}
              onItemClick={
                onItemClick &&
                ((_, item) => {
                  const i = Number(item.seriesId.slice(1));
                  const source = resolvedSeries[i];
                  onItemClick({
                    series: source.series,
                    index: windowStart + item.dataIndex,
                    value: source.values[windowStart + item.dataIndex] ?? null,
                    row: visibleRows[item.dataIndex],
                    category: categories[item.dataIndex],
                  });
                })
              }
            />
            {referenceLines.map((line, index) => {
              const color = resolveTone(line.tone ?? "error");
              const lineStyle = {
                stroke: color,
                strokeWidth: 1.5,
                ...(line.dashed !== false && { strokeDasharray: "6 4" }),
              };
              const valueAxis = line.yAxis === "right" ? "right" : "left";
              const onCategory = line.axis === "x";
              if (horizontal) {
                return onCategory ? (
                  <ChartsReferenceLine
                    key={index}
                    y={line.value as never}
                    axisId={xAxisId}
                    label={line.label}
                    labelAlign="end"
                    lineStyle={lineStyle}
                    labelStyle={{ fill: color }}
                  />
                ) : (
                  <ChartsReferenceLine
                    key={index}
                    x={line.value as number}
                    axisId={valueAxis}
                    label={line.label}
                    labelAlign="start"
                    lineStyle={lineStyle}
                    labelStyle={{ fill: color }}
                  />
                );
              }
              return onCategory ? (
                <ChartsReferenceLine
                  key={index}
                  x={line.value as never}
                  axisId={xAxisId}
                  label={line.label}
                  labelAlign="start"
                  lineStyle={lineStyle}
                  labelStyle={{ fill: color }}
                />
              ) : (
                <ChartsReferenceLine
                  key={index}
                  y={line.value as number}
                  axisId={valueAxis}
                  label={line.label}
                  labelAlign="end"
                  lineStyle={lineStyle}
                  labelStyle={{ fill: color }}
                />
              );
            })}
            <ChartsAxis />
            <ChartsClipPath id={clipId} offset={{ top: 8, bottom: 2, left: 2, right: 2 }} />
            {children}
          </ChartsSurface>
          {tooltip !== "none" && <ChartsTooltip trigger={tooltip} sx={tooltipSlotProps.sx} />}
        </ChartsWrapper>
      </ChartsDataProvider>
      {zoom && total > 2 && (
        <Box data-cn-chart-ignore sx={{ px: "12px", pt: "4px" }}>
          <Slider
            size="small"
            value={[windowStart, windowEnd]}
            min={0}
            max={total - 1}
            step={1}
            disableSwap
            onChange={(_, value) => {
              const [a, b] = value as number[];
              if (b - a >= 1) setRange([a, b]);
            }}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => xFormat(allCategories[value])}
            getAriaLabel={(index) => (index === 0 ? "Inicio del rango" : "Fin del rango")}
            sx={{
              color: "var(--cn-color-accent-500, #3d5afe)",
              "& .MuiSlider-rail": { opacity: 0.25 },
            }}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <CnChartCard
      {...card}
      height={height}
      skeleton={skeleton}
      empty={!props.loading && !props.error && isEmpty}
      exportData={exportData}
      typeOptions={options?.map((t) => TYPE_OPTIONS[t])}
      type={chartType}
      onTypeChange={(value) => {
        setInnerType(value as CnCartesianType);
        onTypeChange?.(value as CnCartesianType);
      }}
    >
      {({ height: bodyHeight }) => renderChart(bodyHeight)}
    </CnChartCard>
  );
};

/** Total por serie (útil para resúmenes). */
export const seriesTotals = (values: ReadonlyArray<ReadonlyArray<number | null>>) =>
  values.map((row) => sumValues(row));
