import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef, useId, useMemo } from "react";
import { mergeSx } from "../../utils/field-styles";
import { CnIcon } from "../CnIcon";
import { CnSkeleton } from "../CnSkeleton";

export type CnMetricColor =
  "primary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";

export type CnMetricTrend = {
  /** Variación (p. ej. `12.5` para +12.5 %). El signo define la dirección si no se indica. */
  value: number;
  direction?: "up" | "down" | "flat";
  /** Texto junto a la variación ("vs. mes anterior"). */
  label?: ReactNode;
  /** `false` cuando subir es malo (costos, quejas): pinta la subida en rojo. */
  upIsGood?: boolean;
  /** Formato de la variación. Por defecto porcentaje con 1 decimal. */
  format?: (value: number) => string;
};

export type CnMetricCardProps = {
  title: ReactNode;
  value: number | string | null | undefined;
  /** Formato del valor (`Intl.NumberFormat`, moneda…). */
  format?: (value: number) => string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  icon?: string;
  color?: CnMetricColor;
  description?: ReactNode;
  trend?: CnMetricTrend;
  /** Barra de avance hacia una meta. */
  progress?: { value: number; max?: number; label?: ReactNode };
  /** Serie para la mini gráfica (valores en orden). */
  sparkline?: number[];
  sparklineType?: "line" | "area" | "bar";
  /** Contenido al pie (enlace "Ver detalle", fecha de corte…). */
  footer?: ReactNode;
  variant?: "outlined" | "elevated" | "filled";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme>;
  className?: string;
};

const PALETTE: Record<CnMetricColor, { main: string; soft: string }> = {
  primary: {
    main: "var(--cn-color-brand-600, #254d87)",
    soft: "var(--cn-color-brand-50, #eef3fb)",
  },
  success: {
    main: "var(--cn-color-success-600, #228740)",
    soft: "var(--cn-color-success-50, #eaf7ee)",
  },
  warning: {
    main: "var(--cn-color-warning-600, #b8831a)",
    soft: "var(--cn-color-warning-50, #fdf6e6)",
  },
  error: { main: "var(--cn-color-error-600, #b52f2f)", soft: "var(--cn-color-error-50, #fcecec)" },
  info: { main: "var(--cn-color-info-600, #22649f)", soft: "var(--cn-color-info-50, #eaf3fb)" },
  accent: {
    main: "var(--cn-color-accent-600, #3349d6)",
    soft: "var(--cn-color-accent-50, #eef0ff)",
  },
  neutral: {
    main: "var(--cn-color-neutral-600, #4e5660)",
    soft: "var(--cn-color-neutral-100, #f4f5f7)",
  },
};

const VALUE_SIZE = { sm: "20px", md: "26px", lg: "34px" };

const defaultTrendFormat = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} %`;

/** Mini gráfica SVG sin dependencias. */
export const CnSparkline = ({
  data,
  type = "area",
  color = "currentColor",
  height = 36,
  width = 120,
  label,
}: {
  data: number[];
  type?: "line" | "area" | "bar";
  color?: string;
  height?: number;
  width?: number;
  label?: string;
}) => {
  const gradientId = `cn-spark-${useId().replace(/:/g, "")}`;
  const geometry = useMemo(() => {
    if (data.length === 0) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const pad = 2;
    const x = (i: number) =>
      data.length === 1 ? width / 2 : pad + (i * (width - pad * 2)) / (data.length - 1);
    const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
    const points = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    return { min, span, pad, x, y, points };
  }, [data, height, width]);

  if (!geometry) return null;
  const { points, x, y, pad, min, span } = geometry;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label ?? `Tendencia: ${data.join(", ")}`}
      style={{ display: "block", color, overflow: "visible" }}
    >
      {type === "bar" ? (
        data.map((v, i) => {
          const barWidth = Math.max(2, (width - pad * 2) / data.length - 2);
          const h = Math.max(1, ((v - min) / span) * (height - pad * 2));
          return (
            <rect
              key={i}
              x={pad + i * ((width - pad * 2) / data.length) + 1}
              y={height - pad - h}
              width={barWidth}
              height={h}
              rx={1.5}
              fill="currentColor"
              opacity={i === data.length - 1 ? 1 : 0.45}
            />
          );
        })
      ) : (
        <>
          {type === "area" && (
            <>
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              </defs>
              <polygon
                points={`${x(0)},${height} ${points.join(" ")} ${x(data.length - 1)},${height}`}
                fill={`url(#${gradientId})`}
              />
            </>
          )}
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={x(data.length - 1)}
            cy={y(data[data.length - 1])}
            r={2.5}
            fill="currentColor"
          />
        </>
      )}
    </svg>
  );
};

/**
 * Tarjeta de indicador (KPI): valor formateado, tendencia con semántica de
 * "bueno/malo", avance hacia una meta, mini gráfica y estado de carga.
 */
export const CnMetricCard = forwardRef<HTMLDivElement, CnMetricCardProps>(function CnMetricCard(
  {
    title,
    value,
    format,
    prefix,
    suffix,
    icon,
    color = "primary",
    description,
    trend,
    progress,
    sparkline,
    sparklineType = "area",
    footer,
    variant = "outlined",
    size = "md",
    loading = false,
    onClick,
    sx,
    className,
  },
  ref,
) {
  const tone = PALETTE[color];
  const shown =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "number" && format
        ? format(value)
        : typeof value === "number"
          ? value.toLocaleString("es-MX")
          : value;

  const direction = trend
    ? (trend.direction ?? (trend.value > 0 ? "up" : trend.value < 0 ? "down" : "flat"))
    : "flat";
  const good = direction === "flat" ? null : (direction === "up") === (trend?.upIsGood ?? true);
  const trendColor =
    good === null
      ? "var(--cn-color-neutral-600, #4e5660)"
      : good
        ? "var(--cn-color-success-600, #228740)"
        : "var(--cn-color-error-600, #b52f2f)";
  const TrendIcon =
    direction === "up"
      ? ArrowUpwardRoundedIcon
      : direction === "down"
        ? ArrowDownwardRoundedIcon
        : RemoveRoundedIcon;

  const pct = progress
    ? Math.max(0, Math.min(100, (progress.value / (progress.max ?? 100)) * 100))
    : 0;

  const body = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <Typography
          component="h3"
          sx={{
            m: 0,
            fontSize: "var(--cn-font-size-sm, 12px)",
            fontWeight: 600,
            color: "var(--cn-color-text-muted, #6e7682)",
            lineHeight: 1.4,
          }}
        >
          {title}
        </Typography>
        {icon && (
          <Box
            aria-hidden
            sx={{
              width: size === "sm" ? 30 : 36,
              height: size === "sm" ? 30 : 36,
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--cn-radius-md, 8px)",
              color: variant === "filled" ? "#fff" : tone.main,
              backgroundColor: variant === "filled" ? "rgba(255,255,255,0.18)" : tone.soft,
            }}
          >
            <CnIcon name={icon} size={size === "sm" ? "sm" : "md"} />
          </Box>
        )}
      </Box>

      {loading ? (
        <CnSkeleton variant="text" width="60%" height={VALUE_SIZE[size]} />
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <Box
            aria-live="polite"
            sx={{
              display: "flex",
              alignItems: "baseline",
              gap: "4px",
              fontSize: VALUE_SIZE[size],
              fontWeight: 800,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              color: variant === "filled" ? "#fff" : "var(--cn-color-text, #222831)",
              minWidth: 0,
              overflowWrap: "anywhere",
            }}
          >
            {prefix && (
              <Box component="span" sx={{ fontSize: "0.6em", fontWeight: 600 }}>
                {prefix}
              </Box>
            )}
            {shown}
            {suffix && (
              <Box component="span" sx={{ fontSize: "0.55em", fontWeight: 600, opacity: 0.8 }}>
                {suffix}
              </Box>
            )}
          </Box>
          {sparkline && sparkline.length > 1 && (
            <Box
              sx={{ width: 110, flexShrink: 0, color: variant === "filled" ? "#fff" : tone.main }}
            >
              <CnSparkline data={sparkline} type={sparklineType} />
            </Box>
          )}
        </Box>
      )}

      {trend && !loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              px: "6px",
              py: "1px",
              borderRadius: "999px",
              fontSize: "var(--cn-font-size-xs, 11px)",
              fontWeight: 700,
              color: variant === "filled" ? "#fff" : trendColor,
              backgroundColor:
                variant === "filled"
                  ? "rgba(255,255,255,0.18)"
                  : "var(--cn-color-neutral-100, #f4f5f7)",
            }}
          >
            <TrendIcon sx={{ fontSize: 13 }} aria-hidden />
            {(trend.format ?? defaultTrendFormat)(trend.value)}
          </Box>
          {trend.label && (
            <Box
              component="span"
              sx={{
                fontSize: "var(--cn-font-size-xs, 11px)",
                color:
                  variant === "filled"
                    ? "rgba(255,255,255,0.85)"
                    : "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              {trend.label}
            </Box>
          )}
        </Box>
      )}

      {progress && !loading && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Box
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.max ?? 100}
            aria-valuenow={progress.value}
            aria-label={typeof title === "string" ? `Avance de ${title}` : "Avance"}
            sx={{
              height: 6,
              borderRadius: 6,
              overflow: "hidden",
              backgroundColor:
                variant === "filled"
                  ? "rgba(255,255,255,0.25)"
                  : "var(--cn-color-neutral-150, #e9ecef)",
            }}
          >
            <Box
              sx={{
                width: `${pct}%`,
                height: "100%",
                borderRadius: 6,
                backgroundColor: variant === "filled" ? "#fff" : tone.main,
                transition: "width 300ms ease",
              }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "var(--cn-font-size-xs, 11px)",
              color:
                variant === "filled"
                  ? "rgba(255,255,255,0.85)"
                  : "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            <span>{progress.label}</span>
            <span>{Math.round(pct)} %</span>
          </Box>
        </Box>
      )}

      {description && (
        <Typography
          component="div"
          sx={{
            fontSize: "var(--cn-font-size-xs, 11px)",
            color:
              variant === "filled"
                ? "rgba(255,255,255,0.85)"
                : "var(--cn-color-text-muted, #6e7682)",
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      )}
      {footer && (
        <Box
          sx={{
            pt: "8px",
            mt: "2px",
            borderTop: "1px solid",
            borderColor:
              variant === "filled" ? "rgba(255,255,255,0.2)" : "var(--cn-color-border, #dde0e4)",
            fontSize: "var(--cn-font-size-xs, 11px)",
          }}
        >
          {footer}
        </Box>
      )}
    </Box>
  );

  const surfaceSx = {
    display: "flex",
    width: "100%",
    textAlign: "left",
    padding: size === "sm" ? "12px" : size === "lg" ? "22px" : "16px",
    borderRadius: "var(--cn-radius-lg, 12px)",
    fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
    border:
      variant === "outlined"
        ? "1px solid var(--cn-color-border, #dde0e4)"
        : "1px solid transparent",
    backgroundColor: variant === "filled" ? tone.main : "var(--cn-color-surface, #ffffff)",
    boxShadow:
      variant === "elevated"
        ? "0 1px 3px rgba(17, 20, 24, 0.08), 0 6px 16px rgba(17, 20, 24, 0.06)"
        : "none",
    transition: "box-shadow 140ms ease, border-color 140ms ease",
    ...(onClick && {
      cursor: "pointer",
      "&:hover": { borderColor: "var(--cn-color-brand-300, #7c9fdc)" },
      "&.Mui-focusVisible": {
        outline: "2px solid var(--cn-color-brand-400, #5081c4)",
        outlineOffset: 2,
      },
    }),
  };

  if (onClick) {
    return (
      <ButtonBase
        ref={ref as never}
        onClick={onClick}
        className={className}
        data-cn-metric-card={color}
        sx={mergeSx(surfaceSx, sx)}
      >
        {body}
      </ButtonBase>
    );
  }
  return (
    <Box
      ref={ref}
      component="section"
      className={className}
      data-cn-metric-card={color}
      aria-busy={loading || undefined}
      sx={mergeSx(surfaceSx, sx)}
    >
      {body}
    </Box>
  );
});
