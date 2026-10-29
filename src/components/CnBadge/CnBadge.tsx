import MuiBadge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef } from "react";

export type CnBadgeVariant = "count" | "dot" | "label";
export type CnBadgeColor =
  "primary" | "secondary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";
export type CnBadgeSize = "sm" | "md" | "lg";
export type CnBadgeOverlap = "circular" | "rectangular";

type AnchorOrigin = {
  vertical: "top" | "bottom";
  horizontal: "left" | "right";
};

export type CnBadgeProps = {
  children?: ReactNode;
  variant?: CnBadgeVariant;
  color?: CnBadgeColor;
  content?: ReactNode;
  max?: number;
  showZero?: boolean;
  invisible?: boolean;
  pulse?: boolean;
  size?: CnBadgeSize;
  overlap?: CnBadgeOverlap;
  anchorOrigin?: AnchorOrigin;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

type ColorTokens = { bg: string; fg: string; rgb: string };

const COLOR_TOKENS: Record<CnBadgeColor, ColorTokens> = {
  primary: {
    bg: "var(--cn-color-brand-600, #254d87)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
    rgb: "var(--cn-color-rgb-brand-600, 37, 77, 135)",
  },
  secondary: {
    bg: "var(--cn-color-neutral-700, #363d45)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
    rgb: "var(--cn-color-rgb-neutral-700, 54, 61, 69)",
  },
  success: {
    bg: "var(--cn-color-success-600, #228740)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
    rgb: "var(--cn-color-rgb-success-600, 34, 135, 64)",
  },
  warning: {
    bg: "var(--cn-color-warning-600, #b8831a)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
    rgb: "var(--cn-color-rgb-warning-600, 184, 131, 26)",
  },
  error: {
    bg: "var(--cn-color-error-600, #b52f2f)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
    rgb: "var(--cn-color-rgb-error-600, 181, 47, 47)",
  },
  info: {
    bg: "var(--cn-color-info-600, #2367a8)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
    rgb: "var(--cn-color-rgb-info-600, 35, 103, 168)",
  },
  accent: {
    bg: "var(--cn-color-accent-500, #3d5afe)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
    rgb: "var(--cn-color-rgb-accent-500, 61, 90, 254)",
  },
  neutral: {
    bg: "var(--cn-color-neutral-600, #4e5660)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
    rgb: "var(--cn-color-rgb-neutral-600, 78, 86, 96)",
  },
};

type SizeTokens = {
  dot: number;
  height: number;
  minWidth: number;
  fontSize: number;
  paddingX: number;
};

const SIZE_TOKENS: Record<CnBadgeSize, SizeTokens> = {
  sm: { dot: 6, height: 14, minWidth: 14, fontSize: 9, paddingX: 4 },
  md: { dot: 8, height: 18, minWidth: 18, fontSize: 10, paddingX: 5 },
  lg: { dot: 10, height: 22, minWidth: 22, fontSize: 11, paddingX: 6 },
};

const pulseKeyframes = (rgb: string): Record<string, unknown> => ({
  animation: "cn-badge-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  "@keyframes cn-badge-pulse": {
    "0%, 100%": { boxShadow: `0 0 0 0 rgba(${rgb}, 0.5)` },
    "50%": { boxShadow: `0 0 0 4px rgba(${rgb}, 0)` },
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
    boxShadow: `0 0 0 2px rgba(${rgb}, 0.2)`,
  },
});

const resolveStandaloneContent = (
  variant: CnBadgeVariant,
  content: ReactNode,
  max: number,
): ReactNode => {
  if (variant === "dot") return undefined;
  if (variant === "count" && typeof content === "number" && content > max) {
    return `${max}+`;
  }
  return content;
};

const isEmpty = (variant: CnBadgeVariant, content: ReactNode, showZero: boolean): boolean => {
  if (variant === "dot") return false;
  if (content === undefined || content === null) return true;
  if (variant === "count") {
    if (content === 0 || content === "0") return !showZero;
    return false;
  }
  return !content;
};

export const CnBadge = forwardRef<HTMLDivElement, CnBadgeProps>(function CnBadge(
  {
    children,
    variant = "count",
    color = "error",
    content,
    max = 99,
    showZero = false,
    invisible = false,
    pulse = false,
    size = "md",
    overlap = "rectangular",
    anchorOrigin = { vertical: "top", horizontal: "right" },
    ariaLabel,
    sx,
    className,
  },
  ref,
) {
  const tokens = COLOR_TOKENS[color];
  const sizes = SIZE_TOKENS[size];
  const isInvisible = invisible || isEmpty(variant, content, showZero);

  if (!children) {
    if (isInvisible) return null;

    const standaloneContent = resolveStandaloneContent(variant, content, max);

    const standaloneAriaLabel =
      ariaLabel ??
      (variant !== "dot" && standaloneContent !== undefined
        ? String(standaloneContent)
        : undefined);

    if (variant === "dot") {
      return (
        <Box
          ref={ref}
          data-cn-badge="true"
          data-cn-badge-variant="dot"
          data-cn-badge-color={color}
          data-cn-badge-size={size}
          data-cn-badge-pulse={pulse ? "true" : undefined}
          role={standaloneAriaLabel ? "status" : undefined}
          aria-label={standaloneAriaLabel}
          className={className}
          sx={[
            {
              display: "inline-block",
              width: sizes.dot,
              height: sizes.dot,
              borderRadius: "50%",
              backgroundColor: tokens.bg,
              flexShrink: 0,
            },
            ...(pulse ? [pulseKeyframes(tokens.rgb)] : []),
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        />
      );
    }

    const isLabel = variant === "label";

    return (
      <Box
        ref={ref}
        data-cn-badge="true"
        data-cn-badge-variant={variant}
        data-cn-badge-color={color}
        data-cn-badge-size={size}
        data-cn-badge-pulse={pulse ? "true" : undefined}
        role={standaloneAriaLabel ? "status" : undefined}
        aria-label={standaloneAriaLabel}
        className={className}
        sx={[
          {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: sizes.height,
            minWidth: isLabel ? undefined : sizes.minWidth,
            paddingInline: `${sizes.paddingX}px`,
            borderRadius: isLabel ? "var(--cn-radius-sm, 6px)" : "9999px",
            backgroundColor: tokens.bg,
            color: tokens.fg,
            fontSize: sizes.fontSize,
            fontWeight: 700,
            fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
            lineHeight: 1,
            letterSpacing: isLabel ? "0.04em" : 0,
            textTransform: isLabel ? "uppercase" : "none",
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          },
          ...(pulse ? [pulseKeyframes(tokens.rgb)] : []),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {standaloneContent}
      </Box>
    );
  }

  const isLabel = variant === "label";

  return (
    <MuiBadge
      ref={ref}
      badgeContent={variant === "dot" ? "" : content}
      variant={variant === "dot" ? "dot" : "standard"}
      invisible={isInvisible}
      overlap={overlap}
      anchorOrigin={anchorOrigin}
      max={variant === "count" ? max : undefined}
      color="default"
      className={className}
      sx={[
        {
          "& .MuiBadge-badge": {
            backgroundColor: tokens.bg,
            color: tokens.fg,
            fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: isLabel ? "0.04em" : 0,
            textTransform: isLabel ? "uppercase" : "none",
            boxShadow: "0 0 0 2px var(--cn-color-surface, #ffffff)",
            ...(variant === "dot" && {
              width: sizes.dot,
              height: sizes.dot,
              minWidth: sizes.dot,
              padding: 0,
              borderRadius: "50%",
            }),
            ...(variant === "count" && {
              fontSize: sizes.fontSize,
              height: sizes.height,
              minWidth: sizes.minWidth,
              paddingInline: `${sizes.paddingX}px`,
            }),
            ...(isLabel && {
              fontSize: sizes.fontSize,
              height: sizes.height,
              paddingInline: `${sizes.paddingX}px`,
              borderRadius: "var(--cn-radius-sm, 6px)",
            }),
            ...(pulse && pulseKeyframes(tokens.rgb)),
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      aria-label={ariaLabel}
    >
      {children}
    </MuiBadge>
  );
});
