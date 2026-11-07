import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { useState } from "react";
import { CnChartCard } from "./CnChartCard";
import { CnRadialBarChartSkeleton, CnRadialLineChartSkeleton } from "./CnChartSkeleton";
import type { CnChartCommonProps } from "./chart-common";
import { cardPropsOf, legendPosition, useFormatter } from "./chart-common";
import { CnChartLegend, enterSx, toggleInSet, useChartTooltip } from "./chart-custom";
import { arcPath, linearPath, niceTicks, polar, smoothPath } from "./chart-geometry";
import type { CnChartTone } from "./chart-theme";
import { resolveTone, withAlpha } from "./chart-theme";
import { useChartWidth } from "./use-chart-width";

// ─── Barras radiales ──────────────────────────────────────────────────

export type CnRadialBarItem = {
  label: string;
  value: number;
  /** Máximo propio (default: `max` de la gráfica). */
  max?: number;
  tone?: CnChartTone | string;
};

export type CnRadialBarChartProps = CnChartCommonProps & {
  data: ReadonlyArray<CnRadialBarItem>;
  max?: number;
  /** Círculo completo o media luna. */
  variant?: "full" | "half";
  /** Grosor de cada anillo (px). */
  thickness?: number;
  /** Separación entre anillos (px). */
  ringGap?: number;
  /** Muestra la pista de fondo de cada anillo. */
  track?: boolean;
  /** Texto central. `true` = promedio de avance. */
  centerLabel?: boolean | ReactNode;
  centerCaption?: ReactNode;
  /** Muestra el valor como % del máximo. */
  asPercent?: boolean;
};

/** Anillos concéntricos de avance (metas, objetivos, capacidad). */
export const CnRadialBarChart = (props: CnRadialBarChartProps) => {
  const {
    data,
    max = 100,
    variant = "full",
    thickness,
    ringGap = 6,
    track = true,
    centerLabel = true,
    centerCaption = "Promedio",
    asPercent = false,
    height = variant === "half" ? 220 : 280,
    legend = "right",
    colors,
    animate = true,
  } = props;
  const format = useFormatter(props);
  const [ref, width] = useChartWidth();
  const tooltip = useChartTooltip();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const half = variant === "half";
  const legendConfig = legendPosition(legend);
  const side =
    legendConfig && (legendConfig.placement === "left" || legendConfig.placement === "right");
  const plotW = side ? Math.max(160, width - 190) : width;
  const items = data
    .map((d, i) => ({ ...d, i, color: colors?.[i % colors.length] ?? resolveTone(d.tone, i) }))
    .filter((d) => !hidden.has(String(d.i)));
  const outer = half ? Math.min(plotW / 2, height - 12) - 6 : Math.min(plotW, height) / 2 - 8;
  const cx = plotW / 2;
  const cy = half ? height - 8 : height / 2;
  const ring =
    thickness ?? Math.max(8, Math.min(22, (outer * 0.62) / Math.max(1, data.length) - ringGap));
  const [start, end] = half ? [-90, 90] : [0, 360];
  const ratioOf = (d: CnRadialBarItem) => Math.min(1, Math.max(0, d.value / (d.max ?? max)));
  const avg = items.length ? items.reduce((a, d) => a + ratioOf(d), 0) / items.length : 0;
  const display = (d: CnRadialBarItem) =>
    asPercent ? `${(ratioOf(d) * 100).toFixed(0)} %` : format(d.value);
  const isEmpty = data.length === 0;

  const card = cardPropsOf(props);
  return (
    <CnChartCard
      {...card}
      height={height}
      empty={!props.loading && !props.error && isEmpty}
      skeleton={
        <CnRadialBarChartSkeleton
          rings={Math.min(6, data.length || 3)}
          variant={variant}
          height={height}
          legend={legendConfig ? legendConfig.placement : false}
          legendItems={data.length}
        />
      }
      exportData={() => ({
        columns: [
          { id: "label", header: "Concepto" },
          { id: "value", header: "Valor", kind: "number" },
          { id: "max", header: "Máximo", kind: "number" },
          { id: "percent", header: "Avance", kind: "percent" },
        ],
        rows: data.map((d) => ({
          label: d.label,
          value: d.value,
          max: d.max ?? max,
          percent: ratioOf(d) * 100,
        })),
      })}
    >
      {() => (
        <Box
          ref={(node: HTMLDivElement | null) => {
            ref.current = node;
            tooltip.containerRef.current = node;
          }}
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: side
              ? legendConfig?.placement === "left"
                ? "row-reverse"
                : "row"
              : "column",
            alignItems: "center",
            gap: "12px",
            ...enterSx(animate),
          }}
        >
          <svg
            width={plotW}
            height={height}
            role="img"
            aria-label={typeof props.title === "string" ? props.title : "Avance"}
            style={{ display: "block", flexShrink: 0 }}
          >
            {items.map((d, k) => {
              const ro = outer - k * (ring + ringGap);
              const ri = ro - ring;
              if (ri <= 4) return null;
              const sweep = (end - start) * ratioOf(d);
              return (
                <g
                  key={d.i}
                  onMouseMove={(event) =>
                    tooltip.show(event, {
                      title: d.label,
                      rows: [
                        { label: "Valor", value: format(d.value), color: d.color },
                        { label: "Avance", value: `${(ratioOf(d) * 100).toFixed(1)} %` },
                      ],
                    })
                  }
                  onMouseLeave={tooltip.hide}
                >
                  {track && (
                    <path
                      d={arcPath(cx, cy, ro, ri, start, end - 0.01)}
                      fill={withAlpha(d.color, 0.12)}
                    />
                  )}
                  {sweep > 0.5 && (
                    <path
                      className="cn-enter"
                      d={arcPath(cx, cy, ro, ri, start, start + sweep, ring / 2)}
                      fill={d.color}
                      style={{ animationDelay: `${k * 80}ms` }}
                    />
                  )}
                </g>
              );
            })}
            {centerLabel && (
              <foreignObject
                x={cx - 70}
                y={half ? cy - 52 : cy - 28}
                width={140}
                height={56}
                style={{ pointerEvents: "none" }}
              >
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1.15,
                  }}
                >
                  <Box
                    sx={{
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      color: "var(--cn-color-text-primary, #111418)",
                    }}
                  >
                    {centerLabel === true ? `${(avg * 100).toFixed(0)} %` : centerLabel}
                  </Box>
                  {centerCaption && (
                    <Box
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--cn-color-text-muted, #6e7682)",
                      }}
                    >
                      {centerCaption}
                    </Box>
                  )}
                </Box>
              </foreignObject>
            )}
          </svg>
          {legendConfig && (
            <CnChartLegend
              direction={side ? "column" : "row"}
              items={data.map((d, i) => ({
                id: String(i),
                label: d.label,
                color: colors?.[i % colors.length] ?? resolveTone(d.tone, i),
                hidden: hidden.has(String(i)),
                value: display(d),
              }))}
              onToggle={(id) => setHidden((h) => toggleInSet(h, id))}
            />
          )}
          {tooltip.layer}
        </Box>
      )}
    </CnChartCard>
  );
};

// ─── Líneas radiales (polar) ──────────────────────────────────────────

export type CnRadialLineSeries = {
  label: string;
  data: ReadonlyArray<number | null>;
  tone?: CnChartTone | string;
  area?: boolean;
};

export type CnRadialLineChartProps = CnChartCommonProps & {
  /** Categorías alrededor del círculo (meses, horas, días). */
  categories: ReadonlyArray<string>;
  series: CnRadialLineSeries[];
  curve?: "smooth" | "linear";
  markers?: boolean;
  /** Hueco central como fracción del radio. */
  innerRadius?: number;
  max?: number;
};

/** Líneas o áreas en coordenadas polares (ciclos: horas, meses, estaciones). */
export const CnRadialLineChart = (props: CnRadialLineChartProps) => {
  const {
    categories,
    series,
    curve = "smooth",
    markers = true,
    innerRadius = 0.16,
    max: maxProp,
    height = 340,
    legend,
    colors,
    animate = true,
  } = props;
  const format = useFormatter(props);
  const [ref, width] = useChartWidth();
  const tooltip = useChartTooltip();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const legendConfig = legendPosition(legend ?? (series.length > 1 ? "bottom" : false));
  const n = categories.length;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 28;
  const inner = radius * innerRadius;
  const values = series.flatMap((s) => s.data).filter((v): v is number => v != null);
  const ticks = niceTicks(0, maxProp ?? Math.max(1, ...values), 4);
  const max = ticks[ticks.length - 1] ?? 1;
  const r = (v: number) => inner + (v / max) * (radius - inner);
  const angle = (i: number) => (360 / n) * i;
  const isEmpty = n < 3 || values.length === 0;

  const card = cardPropsOf(props);
  return (
    <CnChartCard
      {...card}
      height={height}
      empty={!props.loading && !props.error && isEmpty}
      skeleton={
        <CnRadialLineChartSkeleton
          height={height}
          points={Math.max(6, Math.min(24, n || 12))}
          series={Math.min(3, series.length || 1)}
          legend={legendConfig ? legendConfig.placement : false}
          legendItems={series.length}
        />
      }
      exportData={() => ({
        columns: [
          { id: "category", header: "Categoría" },
          ...series.map((s, i) => ({ id: `s${i}`, header: s.label, kind: "number" as const })),
        ],
        rows: categories.map((c, ci) => ({
          category: c,
          ...Object.fromEntries(series.map((s, i) => [`s${i}`, s.data[ci]])),
        })),
      })}
    >
      {() => (
        <Box
          ref={(node: HTMLDivElement | null) => {
            ref.current = node;
            tooltip.containerRef.current = node;
          }}
          sx={{ position: "relative", ...enterSx(animate) }}
        >
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={typeof props.title === "string" ? props.title : "Gráfica polar"}
            style={{ display: "block" }}
          >
            {ticks.slice(1).map((t) => (
              <g key={t}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r(t)}
                  fill="none"
                  stroke="var(--cn-color-neutral-150, #e9ecef)"
                />
                <text
                  x={cx + 4}
                  y={cy - r(t) - 3}
                  fontSize={10}
                  fill="var(--cn-color-neutral-400, #9aa1aa)"
                >
                  {format(t)}
                </text>
              </g>
            ))}
            {categories.map((c, i) => {
              const a = polar(cx, cy, inner, angle(i));
              const b = polar(cx, cy, radius, angle(i));
              const l = polar(cx, cy, radius + 14, angle(i));
              return (
                <g key={c}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="var(--cn-color-neutral-150, #e9ecef)"
                  />
                  <text
                    x={l.x}
                    y={l.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fontWeight={hoverIndex === i ? 800 : 600}
                    fill="var(--cn-color-neutral-600, #4e5660)"
                  >
                    {c}
                  </text>
                </g>
              );
            })}
            {hoverIndex != null && (
              <path
                d={arcPath(
                  cx,
                  cy,
                  radius,
                  inner,
                  angle(hoverIndex) - 180 / n,
                  angle(hoverIndex) + 180 / n,
                )}
                fill="rgba(37, 77, 135, 0.06)"
                pointerEvents="none"
              />
            )}
            {series.map((s, si) => {
              if (hidden.has(String(si))) return null;
              const color = colors?.[si % colors.length] ?? resolveTone(s.tone, si);
              const pts = s.data
                .map((v, i) => (v == null ? null : polar(cx, cy, r(v), angle(i))))
                .filter((p): p is { x: number; y: number } => p !== null);
              const d = curve === "smooth" ? smoothPath(pts, true) : `${linearPath(pts)} Z`;
              return (
                <g key={si} className="cn-enter" style={{ animationDelay: `${si * 90}ms` }}>
                  <path
                    d={d}
                    fill={s.area !== false ? withAlpha(color, 0.18) : "none"}
                    stroke={color}
                    strokeWidth={2.2}
                  />
                  {markers &&
                    pts.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={hoverIndex === i ? 5 : 3}
                        fill="#fff"
                        stroke={color}
                        strokeWidth={2}
                      />
                    ))}
                </g>
              );
            })}
            {categories.map((c, i) => (
              <path
                key={`hit-${c}`}
                d={arcPath(cx, cy, radius + 8, 0, angle(i) - 180 / n, angle(i) + 180 / n)}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseMove={(event) =>
                  tooltip.show(event, {
                    title: c,
                    rows: series
                      .map((s, si) => ({ s, si }))
                      .filter(({ si }) => !hidden.has(String(si)))
                      .map(({ s, si }) => ({
                        label: s.label,
                        value: format(s.data[i] ?? null),
                        color: colors?.[si % colors.length] ?? resolveTone(s.tone, si),
                      })),
                  })
                }
                onMouseLeave={() => {
                  setHoverIndex(null);
                  tooltip.hide();
                }}
              />
            ))}
          </svg>
          {legendConfig && (
            <CnChartLegend
              items={series.map((s, i) => ({
                id: String(i),
                label: s.label,
                color: colors?.[i % colors.length] ?? resolveTone(s.tone, i),
                hidden: hidden.has(String(i)),
              }))}
              onToggle={(id) => setHidden((h) => toggleInSet(h, id))}
            />
          )}
          {tooltip.layer}
        </Box>
      )}
    </CnChartCard>
  );
};
