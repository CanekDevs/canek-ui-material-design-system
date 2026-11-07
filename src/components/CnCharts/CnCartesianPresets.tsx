import { useMemo } from "react";
import type { CnCartesianChartProps, CnCartesianSeries } from "./CnCartesianChart";
import { CnCartesianChart } from "./CnCartesianChart";
import type { CnChartCommonProps } from "./chart-common";
import type { CnChartTone } from "./chart-theme";
import { binValues, createValueFormatter } from "./chart-theme";

/** Barras verticales u horizontales, agrupadas, apiladas o al 100 %. */
export type CnBarChartProps<T = Record<string, unknown>> = Omit<CnCartesianChartProps<T>, "type">;

export const CnBarChart = <T,>(props: CnBarChartProps<T>) => (
  <CnCartesianChart<T> {...props} type="bar" />
);

/** Líneas con curvas, marcadores, metas y media móvil. */
export type CnLineChartProps<T = Record<string, unknown>> = Omit<CnCartesianChartProps<T>, "type">;

export const CnLineChart = <T,>(props: CnLineChartProps<T>) => (
  <CnCartesianChart<T> {...props} type="line" />
);

/** Áreas con gradiente, apiladas o al 100 %. */
export type CnAreaChartProps<T = Record<string, unknown>> = Omit<CnCartesianChartProps<T>, "type">;

export const CnAreaChart = <T,>(props: CnAreaChartProps<T>) => (
  <CnCartesianChart<T> gradient {...props} type="area" />
);

/**
 * Combinada: cada serie elige `type` (barra, línea o área) y `axis`
 * (izquierdo o derecho) para doble eje.
 */
export type CnComposedChartProps<T = Record<string, unknown>> = CnCartesianChartProps<T>;

export const CnComposedChart = <T,>(props: CnComposedChartProps<T>) => (
  <CnCartesianChart<T> type="bar" {...props} />
);

/** Histograma: distribución de valores crudos en intervalos. */
export type CnHistogramProps = CnChartCommonProps &
  Pick<
    CnCartesianChartProps,
    "referenceLines" | "referenceAreas" | "grid" | "xLabel" | "yLabel" | "barLabels" | "gradient"
  > & {
    values: ReadonlyArray<number>;
    /** Número de intervalos. */
    bins?: number;
    label?: string;
    tone?: CnChartTone | string;
    /** Formato de los límites de cada intervalo. */
    binFormat?: CnChartCommonProps["valueFormat"];
  };

export const CnHistogram = ({
  values,
  bins = 10,
  label = "Frecuencia",
  tone,
  binFormat,
  ...props
}: CnHistogramProps) => {
  const rows = useMemo(() => binValues(values, bins), [values, bins]);
  const fmt = useMemo(
    () =>
      createValueFormatter(binFormat ?? props.valueFormat ?? "compact", {
        locale: props.locale,
        currency: props.currency,
      }),
    [binFormat, props.valueFormat, props.locale, props.currency],
  );
  const series: CnCartesianSeries<(typeof rows)[number]>[] = [{ key: "count", label, tone }];
  return (
    <CnCartesianChart
      {...props}
      valueFormat="integer"
      type="bar"
      data={rows}
      categories={rows.map((r) => `${fmt(r.start)} – ${fmt(r.end)}`)}
      series={series}
      categoryGap={0.04}
      borderRadius={props.card?.frame === "plain" ? 2 : 3}
    />
  );
};
