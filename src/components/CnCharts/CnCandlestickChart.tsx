import Box from "@mui/material/Box";
import type { MouseEvent } from "react";
import { useMemo, useState } from "react";
import { CnChartCard } from "./CnChartCard";
import { CnCandlestickChartSkeleton } from "./CnChartSkeleton";
import type { CnChartCommonProps } from "./chart-common";
import { cardPropsOf, useFormatter } from "./chart-common";
import { CnChartLegend, CnChartTooltipCard } from "./chart-custom";
import { linearPath, niceTicks } from "./chart-geometry";
import type { CnChartTone } from "./chart-theme";
import { createValueFormatter, movingAverage, resolveTone } from "./chart-theme";
import { useChartWidth } from "./use-chart-width";

export type CnCandle = {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type CnCandlestickChartProps = Omit<CnChartCommonProps, "legend" | "colors"> & {
  data: ReadonlyArray<CnCandle>;
  /** Panel de volumen bajo las velas. */
  volume?: boolean;
  /** Medias móviles sobre el cierre (p. ej. [7, 21]). */
  movingAverages?: number[];
  upTone?: CnChartTone | string;
  downTone?: CnChartTone | string;
  /** Velas huecas (cuerpo sin relleno cuando sube). */
  hollow?: boolean;
  dateFormat?: (date: Date) => string;
};

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));
const defaultDate = (d: Date) => d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

/** Velas japonesas (OHLC) con volumen y medias móviles. */
export const CnCandlestickChart = (props: CnCandlestickChartProps) => {
  const {
    data,
    volume = data.some((d) => d.volume != null),
    movingAverages = [],
    upTone = "success",
    downTone = "error",
    hollow = false,
    dateFormat = defaultDate,
    height = 340,
  } = props;
  const format = useFormatter(props);
  const compact = useMemo(
    () => createValueFormatter("compact", { locale: props.locale }),
    [props.locale],
  );
  const [ref, width] = useChartWidth();
  const [hover, setHover] = useState<number | null>(null);
  const up = resolveTone(upTone);
  const down = resolveTone(downTone);
  const maColors = ["accent", "warning", "violet", "teal"].map((t) => resolveTone(t));

  const left = 8;
  const right = 60;
  const top = 8;
  const bottom = 24;
  const plotW = Math.max(60, width - left - right);
  const volumeH = volume ? Math.round((height - top - bottom) * 0.22) : 0;
  const priceH = height - top - bottom - volumeH - (volume ? 10 : 0);
  const band = plotW / Math.max(1, data.length);
  const lows = data.map((d) => d.low);
  const highs = data.map((d) => d.high);
  const ticks = niceTicks(Math.min(...lows), Math.max(...highs), 5);
  const yMin = ticks[0] ?? 0;
  const yMax = ticks[ticks.length - 1] ?? 1;
  const y = (v: number) => top + priceH - ((v - yMin) / (yMax - yMin || 1)) * priceH;
  const maxVolume = Math.max(1, ...data.map((d) => d.volume ?? 0));
  const closes = data.map((d) => d.close);
  const averages = movingAverages.map((n) => ({ n, values: movingAverage(closes, n) }));
  const isEmpty = data.length === 0;
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(plotW / 70))));

  const onMove = (event: MouseEvent<SVGRectElement>) => {
    const box = (event.currentTarget as SVGRectElement).getBoundingClientRect();
    const index = Math.floor((event.clientX - box.left) / band);
    setHover(index >= 0 && index < data.length ? index : null);
  };

  const card = cardPropsOf(props);
  const candle = hover != null ? data[hover] : null;
  return (
    <CnChartCard
      {...card}
      height={height}
      empty={!props.loading && !props.error && isEmpty}
      skeleton={
        <CnCandlestickChartSkeleton
          height={height}
          candles={Math.min(40, data.length || 24)}
          volume={volume}
        />
      }
      exportData={() => ({
        columns: [
          { id: "date", header: "Fecha", kind: "date" },
          { id: "open", header: "Apertura", kind: "number" },
          { id: "high", header: "Máximo", kind: "number" },
          { id: "low", header: "Mínimo", kind: "number" },
          { id: "close", header: "Cierre", kind: "number" },
          { id: "volume", header: "Volumen", kind: "number" },
        ],
        rows: data.map((d) => ({ ...d, date: toDate(d.date).toISOString().slice(0, 10) })),
      })}
    >
      {() => (
        <Box ref={ref} sx={{ position: "relative" }}>
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={typeof props.title === "string" ? props.title : "Velas"}
            style={{ display: "block" }}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={left}
                  x2={left + plotW}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="var(--cn-color-neutral-150, #e9ecef)"
                  strokeDasharray="4 4"
                />
                <text
                  x={left + plotW + 8}
                  y={y(t)}
                  dominantBaseline="central"
                  fontSize={11}
                  fill="var(--cn-color-neutral-500, #6e7682)"
                >
                  {format(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) =>
              i % labelEvery === 0 ? (
                <text
                  key={`x-${i}`}
                  x={left + band * i + band / 2}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--cn-color-neutral-500, #6e7682)"
                >
                  {dateFormat(toDate(d.date))}
                </text>
              ) : null,
            )}
            {volume &&
              data.map((d, i) => {
                const h = ((d.volume ?? 0) / maxVolume) * volumeH;
                return (
                  <rect
                    key={`v-${i}`}
                    x={left + band * i + band * 0.18}
                    y={top + priceH + 10 + volumeH - h}
                    width={band * 0.64}
                    height={h}
                    rx={1.5}
                    fill={d.close >= d.open ? up : down}
                    opacity={hover === i ? 0.55 : 0.28}
                  />
                );
              })}
            {data.map((d, i) => {
              const rising = d.close >= d.open;
              const color = rising ? up : down;
              const cx = left + band * i + band / 2;
              const bodyTop = y(Math.max(d.open, d.close));
              const bodyH = Math.max(1.5, Math.abs(y(d.open) - y(d.close)));
              const bodyW = Math.max(2, band * 0.62);
              return (
                <g key={i} opacity={hover == null || hover === i ? 1 : 0.6}>
                  <line
                    x1={cx}
                    x2={cx}
                    y1={y(d.high)}
                    y2={y(d.low)}
                    stroke={color}
                    strokeWidth={1.4}
                  />
                  <rect
                    x={cx - bodyW / 2}
                    y={bodyTop}
                    width={bodyW}
                    height={bodyH}
                    rx={1.5}
                    fill={hollow && rising ? "var(--cn-color-surface, #fff)" : color}
                    stroke={color}
                    strokeWidth={hollow && rising ? 1.4 : 0}
                  />
                </g>
              );
            })}
            {averages.map((avg, a) => (
              <path
                key={avg.n}
                d={linearPath(
                  avg.values
                    .map((v, i) => (v == null ? null : { x: left + band * i + band / 2, y: y(v) }))
                    .filter((p): p is { x: number; y: number } => p !== null),
                )}
                fill="none"
                stroke={maColors[a % maColors.length]}
                strokeWidth={1.8}
              />
            ))}
            {hover != null && (
              <g pointerEvents="none">
                <line
                  x1={left + band * hover + band / 2}
                  x2={left + band * hover + band / 2}
                  y1={top}
                  y2={top + priceH + (volume ? volumeH + 10 : 0)}
                  stroke="var(--cn-color-neutral-400, #9aa1aa)"
                  strokeDasharray="3 3"
                />
                <rect
                  x={left + plotW + 2}
                  y={y(data[hover].close) - 10}
                  width={right - 4}
                  height={20}
                  rx={4}
                  fill={data[hover].close >= data[hover].open ? up : down}
                />
                <text
                  x={left + plotW + right / 2}
                  y={y(data[hover].close)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight={700}
                  fill="#fff"
                >
                  {compact(data[hover].close)}
                </text>
              </g>
            )}
            <rect
              x={left}
              y={top}
              width={plotW}
              height={height - top - bottom}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
            />
          </svg>
          {candle && hover != null && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: left + band * hover + band / 2 > width / 2 ? 12 : undefined,
                right: left + band * hover + band / 2 > width / 2 ? undefined : right + 8,
                pointerEvents: "none",
              }}
            >
              <CnChartTooltipCard
                title={toDate(candle.date).toLocaleDateString("es-MX", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                rows={[
                  { label: "Apertura", value: format(candle.open) },
                  { label: "Máximo", value: format(candle.high), color: up },
                  { label: "Mínimo", value: format(candle.low), color: down },
                  {
                    label: "Cierre",
                    value: format(candle.close),
                    color: candle.close >= candle.open ? up : down,
                  },
                  {
                    label: "Variación",
                    value: `${(((candle.close - candle.open) / (candle.open || 1)) * 100).toFixed(2)} %`,
                  },
                  ...(candle.volume != null
                    ? [{ label: "Volumen", value: compact(candle.volume) }]
                    : []),
                  ...averages.map((avg, a) => ({
                    label: `Media ${avg.n}`,
                    value: format(avg.values[hover]),
                    color: maColors[a % maColors.length],
                  })),
                ]}
              />
            </Box>
          )}
          {averages.length > 0 && (
            <CnChartLegend
              items={averages.map((avg, a) => ({
                id: String(avg.n),
                label: `Media móvil ${avg.n}`,
                color: maColors[a % maColors.length],
              }))}
            />
          )}
        </Box>
      )}
    </CnChartCard>
  );
};
