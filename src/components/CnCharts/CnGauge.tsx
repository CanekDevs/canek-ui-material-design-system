import Box from "@mui/material/Box";
import { GaugeContainer, GaugeReferenceArc, GaugeValueArc, useGaugeState } from "@mui/x-charts";
import type { ReactNode } from "react";
import { CnChartCard } from "./CnChartCard";
import { CnGaugeSkeleton } from "./CnChartSkeleton";
import type { CnChartCommonProps } from "./chart-common";
import { cardPropsOf, useFormatter } from "./chart-common";
import { arcPath, polar } from "./chart-geometry";
import { useChartWidth } from "./use-chart-width";
import type { CnChartTone } from "./chart-theme";
import { resolveTone } from "./chart-theme";

export type CnGaugeSegment = {
  /** Límite superior del segmento (en unidades del valor). */
  to: number;
  label?: string;
  tone?: CnChartTone | string;
};

export type CnGaugeProps = Omit<CnChartCommonProps, "legend" | "colors"> & {
  value: number | null;
  min?: number;
  max?: number;
  /** Semicírculo (180°), arco (270°) o círculo completo. */
  variant?: "semicircle" | "arc" | "full";
  /** Rangos de color (p. ej. bajo / medio / alto). */
  segments?: CnGaugeSegment[];
  /** Tono del arco de valor (si no hay segmentos, o para colorearlo según el segmento). */
  tone?: CnChartTone | string;
  /** Colorea el valor con el tono del segmento en el que cae. */
  colorBySegment?: boolean;
  /** Aguja en lugar de (o además de) el arco de valor. */
  needle?: boolean;
  /** Marca de objetivo sobre el arco. */
  target?: number;
  targetLabel?: string;
  /** Grosor del arco en px. */
  thickness?: number;
  cornerRadius?: number;
  /** Texto central: valor formateado por defecto, o contenido propio. */
  centerLabel?: ReactNode | ((value: number | null) => ReactNode);
  caption?: ReactNode;
  showMinMax?: boolean;
};

const ANGLES = { semicircle: [-90, 90], arc: [-125, 125], full: [0, 360] } as const;

const toDegrees = (radians: number) => (radians * 180) / Math.PI;

const Segments = ({
  segments,
  min,
  max,
  thickness,
}: {
  segments: CnGaugeSegment[];
  min: number;
  max: number;
  thickness: number;
}) => {
  const { cx, cy, outerRadius, startAngle, endAngle } = useGaugeState();
  const start = toDegrees(startAngle);
  const end = toDegrees(endAngle);
  const span = end - start;
  const inner = outerRadius - thickness;
  let from = min;
  return (
    <g>
      {segments.map((segment, i) => {
        const a = start + ((Math.max(min, from) - min) / (max - min)) * span;
        const b = start + ((Math.min(max, segment.to) - min) / (max - min)) * span;
        from = segment.to;
        return (
          <path
            key={i}
            d={arcPath(
              cx,
              cy,
              outerRadius,
              inner,
              a + (i > 0 ? 0.6 : 0),
              b - (i < segments.length - 1 ? 0.6 : 0),
              2,
            )}
            fill={resolveTone(segment.tone, i)}
            opacity={0.9}
          />
        );
      })}
    </g>
  );
};

const Needle = ({ color }: { color: string }) => {
  const { cx, cy, innerRadius, valueAngle } = useGaugeState();
  if (valueAngle === null) return null;
  const angle = toDegrees(valueAngle);
  const tip = polar(cx, cy, innerRadius - 6, angle);
  const base1 = polar(cx, cy, 6, angle - 90);
  const base2 = polar(cx, cy, 6, angle + 90);
  return (
    <g style={{ transition: "transform 400ms ease" }}>
      <path
        d={`M ${base1.x} ${base1.y} L ${tip.x} ${tip.y} L ${base2.x} ${base2.y} Z`}
        fill={color}
      />
      <circle cx={cx} cy={cy} r={9} fill={color} />
      <circle cx={cx} cy={cy} r={3.5} fill="#fff" />
    </g>
  );
};

/** Indicador del valor sobre arcos segmentados. */
const ValueMarker = ({ color }: { color: string }) => {
  const { cx, cy, outerRadius, innerRadius, valueAngle } = useGaugeState();
  if (valueAngle === null) return null;
  const p = polar(cx, cy, (outerRadius + innerRadius) / 2, toDegrees(valueAngle));
  const r = Math.max(7, (outerRadius - innerRadius) / 2 + 3);
  return <circle cx={p.x} cy={p.y} r={r} fill="#fff" stroke={color} strokeWidth={4} />;
};

const TargetMark = ({
  target,
  min,
  max,
  label,
}: {
  target: number;
  min: number;
  max: number;
  label?: string;
}) => {
  const { cx, cy, outerRadius, innerRadius, startAngle, endAngle } = useGaugeState();
  const angle =
    toDegrees(startAngle) +
    ((target - min) / (max - min)) * (toDegrees(endAngle) - toDegrees(startAngle));
  const a = polar(cx, cy, innerRadius - 4, angle);
  const b = polar(cx, cy, outerRadius + 4, angle);
  const text = polar(cx, cy, outerRadius + 14, angle);
  return (
    <g>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="var(--cn-color-neutral-800, #222831)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {label && (
        <text
          x={text.x}
          y={text.y}
          fontSize={10}
          fontWeight={700}
          textAnchor="middle"
          fill="var(--cn-color-neutral-600, #4e5660)"
        >
          {label}
        </text>
      )}
    </g>
  );
};

const MinMax = ({
  min,
  max,
  format,
}: {
  min: number;
  max: number;
  format: (v: number) => string;
}) => {
  const { cx, cy, outerRadius, innerRadius, startAngle, endAngle } = useGaugeState();
  const r = (outerRadius + innerRadius) / 2;
  const a = polar(cx, cy, r, toDegrees(startAngle));
  const b = polar(cx, cy, r, toDegrees(endAngle));
  const style = { fontSize: 10, fontWeight: 600, fill: "var(--cn-color-neutral-500, #6e7682)" };
  return (
    <g>
      <text x={a.x} y={a.y + 16} textAnchor="middle" {...style}>
        {format(min)}
      </text>
      <text x={b.x} y={b.y + 16} textAnchor="middle" {...style}>
        {format(max)}
      </text>
    </g>
  );
};

const CenterText = ({
  label,
  caption,
  semi,
}: {
  label: ReactNode;
  caption?: ReactNode;
  semi: boolean;
}) => {
  const { cx, cy, innerRadius } = useGaugeState();
  const w = Math.max(80, innerRadius * 1.6);
  return (
    <foreignObject
      x={cx - w / 2}
      y={semi ? cy - innerRadius * 0.62 : cy - 26}
      width={w}
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
          lineHeight: 1.1,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            fontSize: "1.45rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--cn-color-text-primary, #111418)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {label}
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

/** Indicador radial con segmentos, aguja, meta y valor central. */
export const CnGauge = (props: CnGaugeProps) => {
  const {
    value,
    min = 0,
    max = 100,
    variant = "semicircle",
    segments,
    tone = "accent",
    colorBySegment = true,
    needle = false,
    target,
    targetLabel,
    thickness = 22,
    cornerRadius = 8,
    centerLabel,
    caption,
    showMinMax = variant !== "full",
    height = variant === "semicircle" ? 190 : 230,
    width,
    animate = true,
  } = props;
  const format = useFormatter(props);
  const [measureRef, measuredWidth] = useChartWidth();
  const [startAngle, endAngle] = ANGLES[variant];
  const clamped = value == null ? null : Math.min(max, Math.max(min, value));
  const activeSegment =
    segments?.find((s) => (clamped ?? min) <= s.to) ?? segments?.[segments.length - 1];
  const activeIndex = activeSegment && segments ? segments.indexOf(activeSegment) : 0;
  const valueColor =
    colorBySegment && activeSegment
      ? resolveTone(activeSegment.tone, activeIndex)
      : resolveTone(tone);
  const label =
    typeof centerLabel === "function" ? centerLabel(value) : (centerLabel ?? format(value));
  const semi = variant === "semicircle";
  const topSpace = target != null ? 22 : 8;
  const bottomSpace = showMinMax && semi ? 24 : 8;
  /** Radio en px según el espacio real (el semicírculo usa solo la mitad superior). */
  const radiusFor = (bodyHeight: number) => {
    const w = (width ?? measuredWidth) / 2 - 34;
    return Math.max(
      36,
      semi ? Math.min(w, bodyHeight - topSpace - bottomSpace) : Math.min(w, bodyHeight / 2 - topSpace),
    );
  };

  const card = cardPropsOf({ ...props, exportFormats: props.exportFormats ?? ["png", "svg"] });
  return (
    <CnChartCard
      {...card}
      height={height}
      skeleton={
        <CnGaugeSkeleton
          variant={variant}
          height={height}
          segments={segments?.length ?? 0}
          needle={needle}
        />
      }
      empty={!props.loading && !props.error && value == null}
      exportData={() => ({
        columns: [
          { id: "value", header: "Valor", kind: "number" },
          { id: "min", header: "Mínimo", kind: "number" },
          { id: "max", header: "Máximo", kind: "number" },
          { id: "segment", header: "Rango" },
        ],
        rows: [{ value, min, max, segment: activeSegment?.label ?? "" }],
      })}
    >
      {({ height: bodyHeight }) => (
        <Box ref={measureRef} sx={{ position: "relative" }}>
          <GaugeContainer
            height={bodyHeight}
            width={width}
            value={clamped}
            valueMin={min}
            valueMax={max}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={Math.max(8, radiusFor(bodyHeight) - thickness)}
            outerRadius={radiusFor(bodyHeight)}
            cornerRadius={segments ? 0 : cornerRadius}
            cy={semi ? radiusFor(bodyHeight) + topSpace - 4 : "50%"}
            skipAnimation={!animate}
            aria-label={typeof props.title === "string" ? props.title : "Indicador"}
            margin={{ top: 4, bottom: 4, left: 16, right: 16 }}
            sx={{
              "& .MuiGauge-referenceArc": { fill: "var(--cn-color-neutral-150, #e9ecef)" },
              "& .MuiGauge-valueArc": { fill: valueColor },
            }}
          >
            {segments ? (
              <Segments segments={segments} min={min} max={max} thickness={thickness} />
            ) : (
              <GaugeReferenceArc />
            )}
            {!needle && !segments && <GaugeValueArc />}
            {segments && !needle && <ValueMarker color={valueColor} />}
            {needle && <Needle color="var(--cn-color-neutral-800, #222831)" />}
            {target != null && (
              <TargetMark target={target} min={min} max={max} label={targetLabel} />
            )}
            {showMinMax && <MinMax min={min} max={max} format={(v) => format(v)} />}
            {!needle && (
              <CenterText label={label} caption={caption ?? activeSegment?.label} semi={semi} />
            )}
          </GaugeContainer>
          {needle && (
            <Box sx={{ textAlign: "center", mt: "-6px" }}>
              <Box
                sx={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: valueColor,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {label}
              </Box>
              {(caption ?? activeSegment?.label) && (
                <Box
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--cn-color-text-muted, #6e7682)",
                  }}
                >
                  {caption ?? activeSegment?.label}
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </CnChartCard>
  );
};
