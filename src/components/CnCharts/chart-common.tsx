import type { SxProps, Theme } from "@mui/material/styles";
import { useDrawingArea, useXScale, useYScale } from "@mui/x-charts";
import { useMemo } from "react";
import type { CnChartCardProps } from "./CnChartCard";
import type { CnChartFormatOptions, CnChartTone, CnChartValueFormat } from "./chart-theme";
import { createValueFormatter, resolveTone, withAlpha } from "./chart-theme";

/** Props comunes de todas las gráficas (tarjeta, estados y formato). */
export type CnChartCommonProps = Pick<
  CnChartCardProps,
  | "title"
  | "subtitle"
  | "icon"
  | "frame"
  | "summary"
  | "footer"
  | "loading"
  | "error"
  | "onRetry"
  | "emptyTitle"
  | "emptyDescription"
  | "emptyIcon"
  | "actions"
  | "toolbar"
  | "periods"
  | "period"
  | "defaultPeriod"
  | "onPeriodChange"
  | "customRange"
  | "onRefresh"
  | "exportFormats"
  | "exportFilename"
  | "fullscreenable"
  | "shareable"
  | "onShare"
  | "ariaLabel"
  | "className"
> &
  CnChartFormatOptions & {
    /** Alto del área de la gráfica (incluye la leyenda). */
    height?: number;
    /** Ancho fijo; por defecto ocupa el ancho disponible. */
    width?: number;
    /** Formato de los valores (tooltip, ejes y etiquetas). */
    valueFormat?: CnChartValueFormat;
    /** Leyenda: posición o `false` para ocultarla. */
    legend?: boolean | "top" | "bottom" | "left" | "right";
    /** Colores propios (sustituyen la paleta de Canek). */
    colors?: string[];
    /** Animaciones de entrada y transición. */
    animate?: boolean;
    /** Props extra para la tarjeta contenedora. */
    card?: Partial<CnChartCardProps>;
    sx?: SxProps<Theme>;
  };

/** Extrae las props de tarjeta de las props de una gráfica. */
export const cardPropsOf = (props: CnChartCommonProps): Partial<CnChartCardProps> => ({
  title: props.title,
  subtitle: props.subtitle,
  icon: props.icon,
  frame: props.frame ?? (props.title ? "card" : "plain"),
  summary: props.summary,
  footer: props.footer,
  loading: props.loading,
  error: props.error,
  onRetry: props.onRetry,
  emptyTitle: props.emptyTitle,
  emptyDescription: props.emptyDescription,
  emptyIcon: props.emptyIcon,
  actions: props.actions,
  toolbar: props.toolbar,
  periods: props.periods,
  period: props.period,
  defaultPeriod: props.defaultPeriod,
  onPeriodChange: props.onPeriodChange,
  customRange: props.customRange,
  onRefresh: props.onRefresh,
  exportFormats: props.exportFormats,
  exportFilename: props.exportFilename,
  fullscreenable: props.fullscreenable ?? Boolean(props.title),
  shareable: props.shareable,
  onShare: props.onShare,
  ariaLabel: props.ariaLabel,
  className: props.className,
  sx: props.sx,
  ...props.card,
});

export const useFormatter = (props: CnChartCommonProps, format?: CnChartValueFormat) =>
  useMemo(
    () =>
      createValueFormatter(format ?? props.valueFormat ?? "number", {
        locale: props.locale,
        currency: props.currency,
        decimals: props.decimals,
        percentScale: props.percentScale,
        prefix: props.prefix,
        suffix: props.suffix,
      }),
    [
      format,
      props.valueFormat,
      props.locale,
      props.currency,
      props.decimals,
      props.percentScale,
      props.prefix,
      props.suffix,
    ],
  );

/** Posición de la leyenda para `ChartsWrapper`/`slotProps.legend`. */
export const legendPosition = (legend: CnChartCommonProps["legend"]) => {
  const placement = legend === true || legend === undefined ? "bottom" : legend;
  if (placement === false) return null;
  const vertical = placement === "top" || placement === "bottom" ? placement : "middle";
  const horizontal = placement === "left" ? "start" : placement === "right" ? "end" : "center";
  return {
    placement,
    position: { vertical, horizontal } as const,
    direction: (vertical === "middle" ? "vertical" : "horizontal") as "vertical" | "horizontal",
  };
};

/** Estilos de Canek sobre los elementos de MUI X Charts. */
export const chartBaseSx = {
  "& .MuiChartsAxis-tickLabel": {
    fill: "var(--cn-color-neutral-500, #6e7682) !important",
    fontSize: "11px !important",
    fontFamily: "inherit",
  },
  "& .MuiChartsAxis-label": {
    fill: "var(--cn-color-neutral-600, #4e5660) !important",
    fontSize: "12px !important",
    fontWeight: 600,
  },
  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
    stroke: "var(--cn-color-neutral-200, #dde0e4) !important",
  },
  "& .MuiChartsGrid-line": {
    stroke: "var(--cn-color-neutral-150, #e9ecef)",
    strokeDasharray: "4 4",
  },
  "& .MuiChartsLegend-root": { gap: "6px 16px" },
  "& .MuiChartsLegend-series": {
    borderRadius: "999px",
    px: "6px",
    py: "2px",
    transition: "background-color 120ms ease, opacity 120ms ease",
    "&:hover": { backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)" },
  },
  "& .MuiChartsLegend-label": {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--cn-color-neutral-600, #4e5660)",
  },
  "& .MuiChartsReferenceLine-label": {
    fontSize: "11px !important",
    fontWeight: 700,
  },
  "& .MuiBarLabel-root, & .MuiBarChart-barLabel": { fontSize: "11px", fontWeight: 700 },
  "& .MuiPieArcLabel-root, & .MuiPieChart-arcLabel": {
    fontSize: "12px !important",
    fontWeight: 700,
    fill: "#ffffff !important",
    paintOrder: "stroke",
    stroke: "rgba(17, 20, 24, 0.28)",
    strokeWidth: "2px",
  },
} as const;

/** Estilos del tooltip (vive en un portal). */
export const tooltipSlotProps = {
  sx: {
    "& .MuiChartsTooltip-paper": {
      borderRadius: "10px",
      border: "1px solid var(--cn-color-border, #dde0e4)",
      boxShadow: "0 8px 24px rgba(17, 20, 24, 0.12)",
    },
    "& .MuiChartsTooltip-cell": { fontSize: "12px" },
    "& .MuiChartsTooltip-valueCell": { fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  },
};

/** Gradientes verticales (u horizontales) para rellenos de series. */
export const GradientDefs = ({
  gradients,
  horizontal = false,
}: {
  gradients: { id: string; color: string; from?: number; to?: number }[];
  horizontal?: boolean;
}) => (
  <defs>
    {gradients.map((g) => (
      <linearGradient
        key={g.id}
        id={g.id}
        x1="0"
        y1="0"
        x2={horizontal ? "1" : "0"}
        y2={horizontal ? "0" : "1"}
      >
        <stop offset="0%" stopColor={g.color} stopOpacity={g.from ?? 0.55} />
        <stop offset="100%" stopColor={g.color} stopOpacity={g.to ?? 0.04} />
      </linearGradient>
    ))}
  </defs>
);

export type CnReferenceLine = {
  /** Eje sobre el que se traza: valor de x (vertical) o de y (horizontal). */
  axis: "x" | "y";
  value: number | string | Date;
  label?: string;
  tone?: CnChartTone | string;
  dashed?: boolean;
  /** Eje y secundario (`"right"`). */
  yAxis?: "left" | "right";
};

export type CnReferenceArea = {
  /** Rango en x (categorías o valores). Omitir para cubrir todo el ancho. */
  x?: [number | string | Date, number | string | Date];
  /** Rango en y. Omitir para cubrir todo el alto. */
  y?: [number, number];
  label?: string;
  tone?: CnChartTone | string;
  opacity?: number;
  yAxis?: "left" | "right";
};

type AnyScale = ((value: unknown) => number | undefined) & { bandwidth?: () => number };

/** Franja de referencia (umbral, meta, periodo destacado). */
export const ReferenceAreaPlot = ({
  areas,
  xAxisId,
}: {
  areas: CnReferenceArea[];
  xAxisId: string;
}) => {
  const drawing = useDrawingArea();
  const xScale = useXScale(xAxisId) as unknown as AnyScale;
  const yLeft = useYScale("left") as unknown as AnyScale;
  const yRight = useYScale(
    areas.some((a) => a.yAxis === "right") ? "right" : "left",
  ) as unknown as AnyScale;
  return (
    <g>
      {areas.map((area, index) => {
        const yScale = area.yAxis === "right" ? yRight : yLeft;
        const band = xScale.bandwidth?.() ?? 0;
        let x1 = drawing.left;
        let x2 = drawing.left + drawing.width;
        if (area.x) {
          const a = xScale(area.x[0]);
          const b = xScale(area.x[1]);
          if (a === undefined || b === undefined) return null;
          x1 = Math.min(a, b);
          x2 = Math.max(a, b) + band;
        }
        let y1 = drawing.top;
        let y2 = drawing.top + drawing.height;
        if (area.y) {
          const a = yScale(area.y[0]);
          const b = yScale(area.y[1]);
          if (a === undefined || b === undefined) return null;
          y1 = Math.max(drawing.top, Math.min(a, b));
          y2 = Math.min(drawing.top + drawing.height, Math.max(a, b));
        }
        const color = resolveTone(area.tone ?? "warning");
        return (
          <g key={index}>
            <rect
              x={x1}
              y={y1}
              width={Math.max(0, x2 - x1)}
              height={Math.max(0, y2 - y1)}
              fill={withAlpha(color, area.opacity ?? 0.1)}
            />
            {area.label && (
              <text
                x={x1 + 6}
                y={y1 + 14}
                fill={color}
                fontSize={11}
                fontWeight={700}
                style={{ pointerEvents: "none" }}
              >
                {area.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};
