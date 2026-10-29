import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef, isValidElement } from "react";
import { CnIcon } from "../CnIcon";

export type CnEmptyStateVariant = "default" | "compact" | "card";
export type CnEmptyStateSize = "sm" | "md" | "lg";
export type CnEmptyStateColor =
  "neutral" | "primary" | "secondary" | "success" | "warning" | "error" | "info" | "accent";

export type CnEmptyStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  icon?: string | ReactNode;
  illustration?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;

  variant?: CnEmptyStateVariant;
  size?: CnEmptyStateSize;
  color?: CnEmptyStateColor;

  role?: "status" | "alert" | "none";
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

type ColorTokens = {
  fg: string;
  bg: string;
};

const COLOR_TOKENS: Record<CnEmptyStateColor, ColorTokens> = {
  neutral: {
    fg: "var(--cn-color-neutral-500, #6e7682)",
    bg: "rgba(var(--cn-color-rgb-neutral-500, 110, 118, 130), 0.10)",
  },
  primary: {
    fg: "var(--cn-color-brand-600, #254d87)",
    bg: "rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.10)",
  },
  secondary: {
    fg: "var(--cn-color-neutral-700, #363d45)",
    bg: "rgba(var(--cn-color-rgb-neutral-700, 54, 61, 69), 0.10)",
  },
  success: {
    fg: "var(--cn-color-success-600, #228740)",
    bg: "rgba(var(--cn-color-rgb-success-500, 46, 158, 79), 0.10)",
  },
  warning: {
    fg: "var(--cn-color-warning-600, #b8831a)",
    bg: "rgba(var(--cn-color-rgb-warning-500, 224, 160, 32), 0.10)",
  },
  error: {
    fg: "var(--cn-color-error-600, #b52f2f)",
    bg: "rgba(var(--cn-color-rgb-error-500, 214, 60, 60), 0.10)",
  },
  info: {
    fg: "var(--cn-color-info-600, #2367a8)",
    bg: "rgba(var(--cn-color-rgb-info-500, 44, 123, 200), 0.10)",
  },
  accent: {
    fg: "var(--cn-color-accent-500, #3d5afe)",
    bg: "rgba(var(--cn-color-rgb-accent-500, 61, 90, 254), 0.10)",
  },
};

type SizeTokens = {
  iconBox: number;
  iconSize: number;
  padding: number;
  gap: number;
  titleFont: string;
  descFont: string;
  titleWeight: number;
};

const SIZE_TOKENS: Record<CnEmptyStateSize, SizeTokens> = {
  sm: {
    iconBox: 40,
    iconSize: 20,
    padding: 16,
    gap: 8,
    titleFont: "var(--cn-font-size-sm, 12px)",
    descFont: "var(--cn-font-size-xs, 11px)",
    titleWeight: 600,
  },
  md: {
    iconBox: 56,
    iconSize: 28,
    padding: 32,
    gap: 12,
    titleFont: "var(--cn-font-size-base, 13px)",
    descFont: "var(--cn-font-size-sm, 12px)",
    titleWeight: 600,
  },
  lg: {
    iconBox: 72,
    iconSize: 36,
    padding: 48,
    gap: 16,
    titleFont: "var(--cn-font-size-md, 14px)",
    descFont: "var(--cn-font-size-base, 13px)",
    titleWeight: 600,
  },
};

const COMPACT_SIZE_TOKENS: SizeTokens = {
  iconBox: 32,
  iconSize: 16,
  padding: 8,
  gap: 6,
  titleFont: "var(--cn-font-size-sm, 12px)",
  descFont: "var(--cn-font-size-xs, 11px)",
  titleWeight: 600,
};

const resolveSizeTokens = (variant: CnEmptyStateVariant, size: CnEmptyStateSize): SizeTokens =>
  variant === "compact" ? COMPACT_SIZE_TOKENS : SIZE_TOKENS[size];

function CardIcon({
  icon,
  color,
  size,
}: {
  icon: string | ReactNode;
  color: CnEmptyStateColor;
  size: number;
}) {
  const tokens = COLOR_TOKENS[color];

  const content = (() => {
    if (typeof icon === "string") {
      return <CnIcon name={icon} size={Math.round(size * 0.55)} color="inherit" aria-hidden />;
    }
    if (isValidElement(icon)) return icon;
    return <span>{icon}</span>;
  })();

  return (
    <Box
      data-cn-empty-state-icon="true"
      aria-hidden="true"
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: tokens.bg,
        color: tokens.fg,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        "& svg": {
          fontSize: Math.round(size * 0.55),
        },
      }}
    >
      {content}
    </Box>
  );
}

export const CnEmptyState = forwardRef<HTMLDivElement, CnEmptyStateProps>(function CnEmptyState(
  {
    title = "Sin datos",
    description = "No hay elementos para mostrar.",
    icon,
    illustration,
    action,
    children,

    variant = "default",
    size = "md",
    color = "neutral",

    role = "status",
    ariaLabel,
    sx,
    className,
  },
  ref,
) {
  const tokens = resolveSizeTokens(variant, size);
  const colorTokens = COLOR_TOKENS[color];

  const resolvedIcon = icon ?? "inbox";
  const hasCustomIllustration = Boolean(illustration);

  const visual = hasCustomIllustration ? (
    <Box
      data-cn-empty-state-illustration="true"
      aria-hidden="true"
      sx={{
        display: "grid",
        placeItems: "center",
        maxWidth: "100%",
      }}
    >
      {illustration}
    </Box>
  ) : (
    <CardIcon icon={resolvedIcon} color={color} size={tokens.iconBox} />
  );

  const content = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: `${tokens.gap}px`,
        padding: `${tokens.padding}px`,
        textAlign: "center",
        width: "100%",
      }}
    >
      {visual}

      {(title || description) && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            maxWidth: variant === "compact" ? 280 : 400,
          }}
        >
          {title && (
            <Typography
              component="div"
              sx={{
                fontSize: tokens.titleFont,
                fontWeight: tokens.titleWeight,
                color: "var(--cn-color-text, #222831)",
                lineHeight: 1.35,
              }}
            >
              {title}
            </Typography>
          )}
          {description && (
            <Typography
              component="div"
              sx={{
                fontSize: tokens.descFont,
                fontWeight: 400,
                color: "var(--cn-color-text-muted, #6e7682)",
                lineHeight: 1.5,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      )}

      {action && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            flexWrap: "wrap",
            mt: `${Math.round(tokens.gap / 2)}px`,
          }}
        >
          {action}
        </Box>
      )}

      {children}
    </Box>
  );

  const variantSx: Record<string, unknown> = (() => {
    if (variant !== "card") return {};
    return {
      backgroundColor: "var(--cn-color-surface, #ffffff)",
      border: "1px dashed var(--cn-color-border, #dde0e4)",
      borderRadius: "var(--cn-radius-lg, 12px)",
    };
  })();

  return (
    <Box
      ref={ref}
      role={role === "none" ? undefined : role}
      aria-label={ariaLabel}
      data-cn-empty-state-variant={variant}
      data-cn-empty-state-size={size}
      data-cn-empty-state-color={color}
      className={className}
      sx={[
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          color: colorTokens.fg,
        },
        variantSx,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {content}
    </Box>
  );
});
