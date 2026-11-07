import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { CSSProperties } from "react";
import { createContext, forwardRef, useContext } from "react";

export type CnSkeletonVariant = "rectangular" | "rounded" | "circular" | "text";
export type CnSkeletonAnimation = "pulse" | "wave" | "none";

export type CnSkeletonProps = {
  variant?: CnSkeletonVariant;
  animation?: CnSkeletonAnimation;

  width?: number | string;
  height?: number | string;
  radius?: number | string;

  lines?: number;
  lineGap?: number;

  ariaLabel?: string;
  sx?: SxProps<Theme>;
  style?: CSSProperties;
  className?: string;
};

const RADIUS_MAP: Record<Exclude<CnSkeletonVariant, "text">, string> = {
  rectangular: "0",
  rounded: "var(--cn-radius-md, 8px)",
  circular: "50%",
};

const TEXT_LINE_HEIGHT = "0.85em";
const TEXT_LINE_RADIUS = "var(--cn-radius-xs, 4px)";

const resolveDimension = (value: number | string | undefined): string | undefined => {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
};

const resolveTextWidth = (
  lineIndex: number,
  total: number,
  explicitWidth: number | string | undefined,
): string => {
  if (explicitWidth !== undefined) {
    return resolveDimension(explicitWidth) ?? "100%";
  }
  if (lineIndex === total - 1 && total > 1) {
    return "65%";
  }
  return "100%";
};

const pulseSx: Record<string, unknown> = {
  animation: "cn-skeleton-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  "@keyframes cn-skeleton-pulse": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.5 },
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
    opacity: 0.7,
  },
};

const waveSx: Record<string, unknown> = {
  position: "relative",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    transform: "translateX(-100%)",
    background:
      "linear-gradient(90deg, transparent 0%, var(--cn-skeleton-shimmer, rgba(255, 255, 255, 0.55)) 50%, transparent 100%)",
    animation: "cn-skeleton-wave 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    pointerEvents: "none",
  },
  "@keyframes cn-skeleton-wave": {
    "0%": { transform: "translateX(-100%)" },
    "100%": { transform: "translateX(100%)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    "&::after": {
      animation: "none",
      display: "none",
    },
    opacity: 0.7,
  },
};

const animationSx = (animation: CnSkeletonAnimation): Record<string, unknown> => {
  if (animation === "pulse") return pulseSx;
  if (animation === "wave") return waveSx;
  return {};
};

// El color sigue el tema de Canek (`[data-cn-theme="dark"]` redefine los tokens),
// no el modo del sistema operativo.
const baseSx = {
  display: "block",
  backgroundColor: "var(--cn-skeleton-base, #e4e7eb)",
  flexShrink: 0,
} as const;

/**
 * Contexto de grupo (lo provee `CnSkeletonGroup`): dentro de un skeleton
 * compuesto las piezas son decorativas y heredan su animación.
 */
export const CnSkeletonPartContext = createContext<{ animation: CnSkeletonAnimation } | null>(null);

export const CnSkeleton = forwardRef<HTMLDivElement, CnSkeletonProps>(function CnSkeleton(
  {
    variant = "rounded",
    animation: animationProp,
    width,
    height,
    radius,
    lines = 1,
    lineGap = 6,
    ariaLabel = "Cargando contenido",
    sx,
    style,
    className,
  },
  ref,
) {
  const group = useContext(CnSkeletonPartContext);
  const animation = animationProp ?? group?.animation ?? "wave";
  // Pieza decorativa dentro de un grupo: sin rol propio (un solo "status").
  const a11y = group
    ? { "aria-hidden": true as const }
    : { role: "status", "aria-busy": "true" as const, "aria-label": ariaLabel };
  const isText = variant === "text";

  if (isText && lines > 1) {
    return (
      <Box
        ref={ref}
        {...a11y}
        data-cn-skeleton="true"
        data-cn-skeleton-variant={variant}
        data-cn-skeleton-animation={animation}
        className={className}
        sx={[
          {
            display: "flex",
            flexDirection: "column",
            gap: `${lineGap}px`,
            width: resolveDimension(width) ?? "100%",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        style={style}
      >
        {Array.from({ length: lines }).map((_, index) => (
          <Box
            key={index}
            sx={[
              baseSx,
              {
                width: resolveTextWidth(index, lines, undefined),
                height: height !== undefined ? resolveDimension(height) : TEXT_LINE_HEIGHT,
                borderRadius: radius !== undefined ? resolveDimension(radius) : TEXT_LINE_RADIUS,
              },
              animationSx(animation),
            ]}
          />
        ))}
      </Box>
    );
  }

  const resolvedRadius = (() => {
    if (radius !== undefined) return resolveDimension(radius);
    if (isText) return TEXT_LINE_RADIUS;
    return RADIUS_MAP[variant as Exclude<CnSkeletonVariant, "text">];
  })();

  return (
    <Box
      ref={ref}
      {...a11y}
      data-cn-skeleton="true"
      data-cn-skeleton-variant={variant}
      data-cn-skeleton-animation={animation}
      className={className}
      sx={[
        baseSx,
        {
          width: resolveDimension(width) ?? (isText ? "100%" : undefined),
          height: resolveDimension(height) ?? (isText ? TEXT_LINE_HEIGHT : undefined),
          borderRadius: resolvedRadius,
        },
        animationSx(animation),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      style={style}
    />
  );
});
