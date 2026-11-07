import Box from "@mui/material/Box";
import { CnChartCard } from "./CnChartCard";
import { CnFunnelChartSkeleton } from "./CnChartSkeleton";
import type { CnChartCommonProps } from "./chart-common";
import { cardPropsOf, useFormatter } from "./chart-common";
import { enterSx, useChartTooltip } from "./chart-custom";
import type { CnChartTone } from "./chart-theme";
import { interpolateScale, readableTextOn, resolveTone } from "./chart-theme";
import { useChartWidth } from "./use-chart-width";

export type CnFunnelStep = { label: string; value: number; tone?: CnChartTone | string };

export type CnFunnelChartProps = Omit<CnChartCommonProps, "legend"> & {
  steps: ReadonlyArray<CnFunnelStep>;
  orientation?: "vertical" | "horizontal";
  /** Embudo (trapecios), pirámide (vértice arriba) o barras centradas. */
  variant?: "funnel" | "pyramid" | "bars";
  /** Bordes curvos entre pasos. */
  curved?: boolean;
  /** Conversión respecto al paso anterior, al primero o ninguna. */
  conversion?: "previous" | "first" | "both" | false;
  /** Un solo tono degradado (default) o un color por paso. */
  tone?: CnChartTone | string;
  multicolor?: boolean;
  /** Ancho mínimo del último paso (fracción del primero). */
  neck?: number;
  gap?: number;
  onStepClick?: (step: CnFunnelStep, index: number) => void;
};

const pct = (value: number) => `${value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} %`;

/** Embudo de conversión con etiquetas y tasas por paso. */
export const CnFunnelChart = (props: CnFunnelChartProps) => {
  const {
    steps,
    orientation = "vertical",
    variant = "funnel",
    curved = true,
    conversion = "previous",
    tone = "accent",
    multicolor = false,
    neck = 0.22,
    gap = 4,
    onStepClick,
    colors,
    animate = true,
  } = props;
  const vertical = orientation === "vertical";
  const height = props.height ?? (vertical ? Math.max(240, steps.length * 64) : 260);
  const format = useFormatter(props);
  const [ref, width] = useChartWidth();
  const tooltip = useChartTooltip();
  const first = steps[0]?.value || 0;
  const maxValue = Math.max(1, ...steps.map((s) => s.value));
  const isEmpty = steps.length === 0 || maxValue <= 0;

  const colorOf = (step: CnFunnelStep, i: number) => {
    if (colors) return colors[i % colors.length];
    if (step.tone) return resolveTone(step.tone);
    if (multicolor) return resolveTone(undefined, i);
    // Un tono que se aclara paso a paso.
    const base = resolveTone(tone);
    const mix = steps.length > 1 ? i / (steps.length - 1) : 0;
    return interpolateScale([base, "#ffffff"], mix * 0.5);
  };

  // Espacio para etiquetas a la derecha (vertical) o abajo (horizontal).
  const labelSpace = vertical ? Math.min(220, Math.max(140, width * 0.32)) : 54;
  const along = vertical ? height : width;
  const across = vertical ? width - labelSpace : height - labelSpace;
  const size = along / Math.max(1, steps.length);
  const widthOf = (value: number) => Math.max(neck, value / maxValue) * across;

  const shapes = steps.map((step, i) => {
    const w1 =
      variant === "pyramid"
        ? (i / steps.length) * across + across / steps.length / 2
        : widthOf(step.value);
    const next = steps[i + 1];
    const w2 =
      variant === "pyramid"
        ? ((i + 1) / steps.length) * across
        : variant === "bars"
          ? w1
          : next
            ? widthOf(next.value)
            : w1 * 0.85;
    const s = size * i;
    const e = size * (i + 1) - gap;
    const c = across / 2;
    let d: string;
    if (variant === "bars") {
      d = vertical
        ? `M ${c - w1 / 2} ${s} h ${w1} v ${e - s} h ${-w1} Z`
        : `M ${s} ${c - w1 / 2} v ${w1} h ${e - s} v ${-w1} Z`;
    } else if (vertical) {
      const m = (s + e) / 2;
      d = curved
        ? `M ${c - w1 / 2} ${s} L ${c + w1 / 2} ${s} C ${c + w1 / 2} ${m} ${c + w2 / 2} ${m} ${c + w2 / 2} ${e} L ${c - w2 / 2} ${e} C ${c - w2 / 2} ${m} ${c - w1 / 2} ${m} ${c - w1 / 2} ${s} Z`
        : `M ${c - w1 / 2} ${s} L ${c + w1 / 2} ${s} L ${c + w2 / 2} ${e} L ${c - w2 / 2} ${e} Z`;
    } else {
      const m = (s + e) / 2;
      d = curved
        ? `M ${s} ${c - w1 / 2} C ${m} ${c - w1 / 2} ${m} ${c - w2 / 2} ${e} ${c - w2 / 2} L ${e} ${c + w2 / 2} C ${m} ${c + w2 / 2} ${m} ${c + w1 / 2} ${s} ${c + w1 / 2} Z`
        : `M ${s} ${c - w1 / 2} L ${e} ${c - w2 / 2} L ${e} ${c + w2 / 2} L ${s} ${c + w1 / 2} Z`;
    }
    const prev = steps[i - 1];
    const fromPrev = prev && prev.value ? (step.value / prev.value) * 100 : null;
    const fromFirst = first ? (step.value / first) * 100 : null;
    return { step, i, d, s, e, w1, color: colorOf(step, i), fromPrev, fromFirst };
  });

  const conversionText = (fromPrev: number | null, fromFirst: number | null) => {
    if (!conversion) return null;
    if (conversion === "first") return fromFirst != null ? pct(fromFirst) : null;
    if (conversion === "both")
      return [
        fromPrev != null ? `${pct(fromPrev)} del anterior` : null,
        fromFirst != null ? `${pct(fromFirst)} del total` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    return fromPrev != null ? `${pct(fromPrev)} del anterior` : null;
  };

  const card = cardPropsOf(props);
  return (
    <CnChartCard
      {...card}
      height={height}
      empty={!props.loading && !props.error && isEmpty}
      skeleton={
        <CnFunnelChartSkeleton
          steps={Math.max(3, steps.length)}
          orientation={orientation}
          variant={variant}
          height={height}
        />
      }
      exportData={() => ({
        columns: [
          { id: "label", header: "Paso" },
          { id: "value", header: "Valor", kind: "number" },
          { id: "fromPrev", header: "% del anterior", kind: "percent" },
          { id: "fromFirst", header: "% del total", kind: "percent" },
        ],
        rows: shapes.map((s) => ({
          label: s.step.label,
          value: s.step.value,
          fromPrev: s.fromPrev,
          fromFirst: s.fromFirst,
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
            aria-label={typeof props.title === "string" ? props.title : "Embudo"}
            style={{ display: "block" }}
          >
            {shapes.map(({ step, i, d, s, e, color, fromPrev, fromFirst, w1 }) => {
              const mid = (s + e) / 2;
              const textColor = readableTextOn(color);
              const conv = conversionText(fromPrev, fromFirst);
              return (
                <g
                  key={i}
                  className="cn-enter"
                  style={{
                    animationDelay: `${i * 70}ms`,
                    cursor: onStepClick ? "pointer" : undefined,
                  }}
                  onMouseMove={(event) =>
                    tooltip.show(event, {
                      title: step.label,
                      rows: [
                        { label: "Valor", value: format(step.value), color },
                        ...(fromPrev != null
                          ? [{ label: "Del paso anterior", value: pct(fromPrev) }]
                          : []),
                        ...(fromFirst != null && i > 0
                          ? [{ label: "Del total", value: pct(fromFirst) }]
                          : []),
                      ],
                    })
                  }
                  onMouseLeave={tooltip.hide}
                  onClick={() => onStepClick?.(step, i)}
                >
                  <path d={d} fill={color} />
                  {vertical ? (
                    <>
                      {w1 > 70 && (
                        <text
                          x={across / 2}
                          y={mid}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={13}
                          fontWeight={800}
                          fill={textColor}
                          style={{ pointerEvents: "none" }}
                        >
                          {format(step.value)}
                        </text>
                      )}
                      <text
                        x={across + 14}
                        y={mid - (conv ? 7 : 0)}
                        dominantBaseline="central"
                        fontSize={12.5}
                        fontWeight={700}
                        fill="var(--cn-color-text-primary, #111418)"
                      >
                        {step.label}
                        {w1 <= 70 ? ` · ${format(step.value)}` : ""}
                      </text>
                      {conv && (
                        <text
                          x={across + 14}
                          y={mid + 10}
                          dominantBaseline="central"
                          fontSize={11}
                          fill="var(--cn-color-text-muted, #6e7682)"
                        >
                          {conv}
                        </text>
                      )}
                    </>
                  ) : (
                    <>
                      <text
                        x={mid}
                        y={across / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={13}
                        fontWeight={800}
                        fill={textColor}
                        style={{ pointerEvents: "none" }}
                      >
                        {format(step.value)}
                      </text>
                      <text
                        x={mid}
                        y={across + 18}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={700}
                        fill="var(--cn-color-text-primary, #111418)"
                      >
                        {step.label}
                      </text>
                      {conv && (
                        <text
                          x={mid}
                          y={across + 34}
                          textAnchor="middle"
                          fontSize={10.5}
                          fill="var(--cn-color-text-muted, #6e7682)"
                        >
                          {conv}
                        </text>
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          {tooltip.layer}
        </Box>
      )}
    </CnChartCard>
  );
};

/** Pirámide (vértice arriba). */
export const CnPyramidChart = (props: Omit<CnFunnelChartProps, "variant">) => (
  <CnFunnelChart {...props} variant="pyramid" />
);
