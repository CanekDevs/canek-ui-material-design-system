// Entrada principal: piezas de gráficas que NO dependen de @mui/x-charts
// (skeletons, tarjeta, paleta y formatos). Las gráficas viven en
// "@canek-ui/material-design-system/charts".
export * from "./CnChartSkeleton";
export { CnChartCard, CN_CHART_DEFAULT_PERIODS } from "./CnChartCard";
export type {
  CnChartAction,
  CnChartCardProps,
  CnChartDateRange,
  CnChartExportData,
  CnChartExportFormat,
  CnChartPeriod,
  CnChartRenderContext,
  CnChartSummary,
  CnChartTypeOption,
} from "./CnChartCard";
export {
  CN_CHART_TONE_ORDER,
  CN_DIVERGING_SCALE,
  CN_SEQUENTIAL_SCALES,
  binValues,
  createValueFormatter,
  getChartPalette,
  interpolateScale,
  linearRegression,
  movingAverage,
  percentChange,
  readableTextOn,
  resolveTone,
  sumValues,
  withAlpha,
} from "./chart-theme";
export type {
  CnChartFormatOptions,
  CnChartTone,
  CnChartValueFormat,
  CnSequentialScale,
} from "./chart-theme";
