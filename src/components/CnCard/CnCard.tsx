import Box from "@mui/material/Box";
import type { CardProps } from "@mui/material/Card";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { KeyboardEvent, ReactNode } from "react";
import { forwardRef } from "react";
import { CnIcon } from "../CnIcon";

export type CnCardVariant = "elevated" | "outlined" | "filled" | "ghost";
export type CnCardSize = "sm" | "md" | "lg";
export type CnCardPadding = "none" | "sm" | "md" | "lg";
export type CnCardRadius = "none" | "sm" | "md" | "lg" | "xl" | "full";
export type CnCardShadow = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type CnCardLayout = "vertical" | "horizontal";
export type CnCardAccentPosition = "top" | "left";
export type CnCardDividerPosition = "top" | "bottom" | "both" | "between";
export type CnCardIconColor =
  "primary" | "secondary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";

export type CnCardHeaderIcon = {
  name: string;
  color?: CnCardIconColor | string;
  bgColor?: string;
  size?: number;
};

export type CnCardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  media?: ReactNode;
  headerActions?: ReactNode;
  icon?: string | CnCardHeaderIcon;

  variant?: CnCardVariant;
  size?: CnCardSize;
  padding?: CnCardPadding;
  shadow?: CnCardShadow;
  radius?: CnCardRadius;
  layout?: CnCardLayout;

  accentColor?: string;
  accentPosition?: CnCardAccentPosition;
  backgroundColor?: string;
  glass?: boolean;

  dividers?: boolean | CnCardDividerPosition;
  dividerInset?: boolean;

  interactive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  target?: "_blank" | "_self";
  component?: React.ElementType;

  loading?: boolean;
  empty?: boolean;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyIcon?: string;
  emptyAction?: ReactNode;

  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  sx?: SxProps<Theme>;
  cardProps?: Omit<CardProps, "children" | "onClick" | "sx" | "className">;
};

const PADDING_MAP: Record<CnCardPadding, number> = {
  none: 0,
  sm: 1.5,
  md: 2,
  lg: 3,
};

const SHADOW_MAP: Record<CnCardShadow, string> = {
  none: "none",
  xs: "var(--cn-shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.04))",
  sm: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
  md: "var(--cn-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.08))",
  lg: "var(--cn-shadow-lg, 0 10px 24px rgba(15, 23, 42, 0.10))",
  xl: "var(--cn-shadow-xl, 0 18px 44px rgba(15, 23, 42, 0.14))",
};

const RADIUS_MAP: Record<CnCardRadius, string> = {
  none: "0",
  sm: "var(--cn-radius-sm, 6px)",
  md: "var(--cn-radius-md, 8px)",
  lg: "var(--cn-radius-lg, 12px)",
  xl: "var(--cn-radius-xl, 16px)",
  full: "var(--cn-radius-full, 9999px)",
};

const SIZE_TOKENS: Record<
  CnCardSize,
  { title: string; subtitle: string; description: string; iconBox: number; iconSize: number }
> = {
  sm: {
    title: "var(--cn-font-size-sm, 12px)",
    subtitle: "var(--cn-font-size-xs, 11px)",
    description: "var(--cn-font-size-xs, 11px)",
    iconBox: 28,
    iconSize: 16,
  },
  md: {
    title: "var(--cn-font-size-base, 13px)",
    subtitle: "var(--cn-font-size-sm, 12px)",
    description: "var(--cn-font-size-sm, 12px)",
    iconBox: 32,
    iconSize: 18,
  },
  lg: {
    title: "var(--cn-font-size-lg, 16px)",
    subtitle: "var(--cn-font-size-base, 13px)",
    description: "var(--cn-font-size-base, 13px)",
    iconBox: 40,
    iconSize: 22,
  },
};

const ICON_COLOR_MAP: Record<CnCardIconColor, { fg: string; bg: string }> = {
  primary: {
    fg: "var(--cn-color-brand-600, #254d87)",
    bg: "rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.10)",
  },
  secondary: {
    fg: "var(--cn-color-neutral-700, #363d45)",
    bg: "rgba(var(--cn-color-rgb-neutral-600, 78, 86, 96), 0.10)",
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
  neutral: {
    fg: "var(--cn-color-neutral-600, #4e5660)",
    bg: "rgba(var(--cn-color-rgb-neutral-500, 110, 118, 130), 0.10)",
  },
};

const isIconColorToken = (value: string): value is CnCardIconColor => value in ICON_COLOR_MAP;

const resolveDividerPosition = (
  dividers: boolean | CnCardDividerPosition | undefined,
): { top: boolean; bottom: boolean; between: boolean } => {
  if (!dividers) return { top: false, bottom: false, between: false };
  if (dividers === true) return { top: false, bottom: true, between: true };
  switch (dividers) {
    case "top":
      return { top: true, bottom: false, between: false };
    case "bottom":
      return { top: false, bottom: true, between: false };
    case "both":
      return { top: true, bottom: true, between: false };
    case "between":
      return { top: false, bottom: false, between: true };
  }
};

function CardIcon({ icon, size }: { icon: string | CnCardHeaderIcon; size: CnCardSize }) {
  const tokens = SIZE_TOKENS[size];
  const config: CnCardHeaderIcon = typeof icon === "string" ? { name: icon } : icon;

  const colorToken =
    config.color && isIconColorToken(config.color) ? ICON_COLOR_MAP[config.color] : undefined;

  const fgColor = colorToken?.fg ?? config.color ?? ICON_COLOR_MAP.primary.fg;
  const bgColor = config.bgColor ?? colorToken?.bg ?? ICON_COLOR_MAP.primary.bg;

  return (
    <Box
      sx={{
        width: tokens.iconBox,
        height: tokens.iconBox,
        borderRadius: "var(--cn-radius-md, 8px)",
        display: "grid",
        placeItems: "center",
        backgroundColor: bgColor,
        color: fgColor,
        flexShrink: 0,
      }}
    >
      <CnIcon
        name={config.name}
        size={config.size ?? tokens.iconSize}
        color="inherit"
        aria-hidden
      />
    </Box>
  );
}

function CardSkeleton({ size }: { size: CnCardSize }) {
  const tokens = SIZE_TOKENS[size];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Box
          sx={{
            width: tokens.iconBox,
            height: tokens.iconBox,
            borderRadius: "var(--cn-radius-md, 8px)",
            backgroundColor: "var(--cn-color-neutral-150, #e9ecef)",
            animation: "cn-card-pulse 1.6s ease-in-out infinite",
            "@keyframes cn-card-pulse": {
              "0%, 100%": { opacity: 0.6 },
              "50%": { opacity: 1 },
            },
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: "60%",
              height: "14px",
              borderRadius: "var(--cn-radius-xs, 4px)",
              backgroundColor: "var(--cn-color-neutral-150, #e9ecef)",
              mb: "6px",
              animation: "cn-card-pulse 1.6s ease-in-out infinite",
            }}
          />
          <Box
            sx={{
              width: "40%",
              height: "10px",
              borderRadius: "var(--cn-radius-xs, 4px)",
              backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
              animation: "cn-card-pulse 1.6s ease-in-out infinite",
            }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          width: "100%",
          height: "60px",
          borderRadius: "var(--cn-radius-sm, 6px)",
          backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
          animation: "cn-card-pulse 1.6s ease-in-out infinite",
        }}
      />
      <Box
        sx={{
          width: "80%",
          height: "10px",
          borderRadius: "var(--cn-radius-xs, 4px)",
          backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
          animation: "cn-card-pulse 1.6s ease-in-out infinite",
        }}
      />
    </Box>
  );
}

function CardEmpty({
  icon = "inbox",
  title = "Sin datos",
  description,
  action,
}: {
  icon?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: "32px",
        px: "16px",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "var(--cn-radius-lg, 12px)",
          backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
          color: "var(--cn-color-neutral-400, #9aa1aa)",
          display: "grid",
          placeItems: "center",
          mb: "12px",
        }}
      >
        <CnIcon name={icon} size={28} color="inherit" aria-hidden />
      </Box>
      {title && (
        <Typography
          sx={{
            fontSize: "var(--cn-font-size-base, 13px)",
            fontWeight: "var(--cn-font-weight-semibold, 600)",
            color: "var(--cn-color-text, #222831)",
            lineHeight: 1.3,
            mb: description ? "4px" : 0,
          }}
        >
          {title}
        </Typography>
      )}
      {description && (
        <Typography
          sx={{
            fontSize: "var(--cn-font-size-sm, 12px)",
            color: "var(--cn-color-text-muted, #6e7682)",
            lineHeight: 1.5,
            maxWidth: 320,
          }}
        >
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: "16px" }}>{action}</Box>}
    </Box>
  );
}

export const CnCard = forwardRef<HTMLDivElement, CnCardProps>(function CnCard(
  {
    title,
    subtitle,
    description,
    children,
    footer,
    media,
    headerActions,
    icon,

    variant = "elevated",
    size = "md",
    padding = "md",
    shadow,
    radius = "lg",
    layout = "vertical",

    accentColor,
    accentPosition = "top",
    backgroundColor,
    glass = false,

    dividers = false,
    dividerInset = false,

    interactive = false,
    disabled = false,
    onClick,
    href,
    target = "_self",
    component,

    loading = false,
    empty = false,
    emptyTitle,
    emptyDescription,
    emptyIcon,
    emptyAction,

    ariaLabel,
    ariaLabelledBy,
    className,
    sx,
    cardProps,
    ...rest
  },
  ref,
) {
  const paddingValue = PADDING_MAP[padding];
  const isHorizontal = layout === "horizontal";
  const tokens = SIZE_TOKENS[size];
  const dividerConfig = resolveDividerPosition(dividers);

  const resolvedShadow: CnCardShadow = shadow ?? (variant === "elevated" ? "sm" : "none");

  const isClickable = interactive && !disabled && (Boolean(onClick) || Boolean(href));

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isClickable || href) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  const handleClick = () => {
    if (!isClickable) return;
    onClick?.();
  };

  const variantSx: Record<string, unknown> = (() => {
    const base: Record<string, unknown> = {
      backgroundColor: "var(--cn-color-surface, #ffffff)",
      border: "none",
    };
    switch (variant) {
      case "outlined":
        return {
          ...base,
          backgroundColor: "transparent",
          border: "1px solid var(--cn-color-border, #dde0e4)",
        };
      case "filled":
        return {
          ...base,
          backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
        };
      case "ghost":
        return {
          ...base,
          backgroundColor: "transparent",
        };
      case "elevated":
      default:
        return base;
    }
  })();

  const glassSx: Record<string, unknown> = glass
    ? {
        backgroundColor: "rgba(255, 255, 255, 0.65)",
        backdropFilter: "blur(12px) saturate(180%)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
      }
    : {};

  const accentSx: Record<string, unknown> = accentColor
    ? accentPosition === "top"
      ? { borderTop: `3px solid ${accentColor}` }
      : { borderLeft: `3px solid ${accentColor}` }
    : {};

  const interactiveSx: Record<string, unknown> = isClickable
    ? {
        cursor: "pointer",
        transition:
          "transform var(--cn-duration-fast, 140ms) var(--cn-ease-standard, ease), box-shadow var(--cn-duration-fast, 140ms) var(--cn-ease-standard, ease), border-color var(--cn-duration-fast, 140ms) var(--cn-ease-standard, ease)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "var(--cn-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.08))",
        },
        "&:active": {
          transform: "translateY(0)",
        },
        "&:focus-visible": {
          outline: "none",
          boxShadow:
            "var(--cn-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.08)), var(--cn-shadow-focus, 0 0 0 3px rgba(80, 129, 196, 0.35))",
        },
      }
    : {};

  const disabledSx: Record<string, unknown> = disabled
    ? {
        opacity: 0.55,
        cursor: "not-allowed",
        pointerEvents: "none",
      }
    : {};

  const rootSx: SxProps<Theme> = [
    {
      position: "relative",
      display: "flex",
      flexDirection: isHorizontal ? "row" : "column",
      width: "100%",
      height: "100%",
      padding: paddingValue === 0 ? 0 : `${paddingValue * 8}px`,
      borderRadius: RADIUS_MAP[radius],
      boxShadow: SHADOW_MAP[resolvedShadow],
      overflow: "hidden",
      textDecoration: "none",
      color: "inherit",
      fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
    },
    variantSx,
    glassSx,
    accentSx,
    interactiveSx,
    disabledSx,
    ...(backgroundColor ? [{ backgroundColor }] : []),
    ...(Array.isArray(sx) ? sx : [sx]),
  ];

  const hasHeader = Boolean(title || subtitle || icon || headerActions);
  const hasBody = Boolean(description || children);
  const hasFooter = Boolean(footer);

  const dividerBaseSx: Record<string, unknown> = {
    borderTop: "1px solid var(--cn-color-border-subtle, #e9ecef)",
    marginInline: dividerInset ? `-${paddingValue * 8}px` : 0,
  };

  const content = (
    <>
      {dividerConfig.top && (
        <Box
          sx={{
            ...dividerBaseSx,
            mt: paddingValue ? `-${paddingValue * 8}px` : 0,
            mb: paddingValue ? `${paddingValue * 8}px` : 0,
          }}
        />
      )}

      {hasHeader && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            mb: hasBody ? "12px" : 0,
            minWidth: 0,
          }}
        >
          {icon && <CardIcon icon={icon} size={size} />}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {title && (
              <Typography
                component="div"
                sx={{
                  fontSize: tokens.title,
                  fontWeight: "var(--cn-font-weight-bold, 700)",
                  color: "var(--cn-color-text, #222831)",
                  lineHeight: 1.35,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                component="div"
                sx={{
                  fontSize: tokens.subtitle,
                  fontWeight: "var(--cn-font-weight-medium, 500)",
                  color: "var(--cn-color-text-muted, #6e7682)",
                  lineHeight: 1.4,
                  mt: title ? "2px" : 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerActions && (
            <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "4px" }}>
              {headerActions}
            </Box>
          )}
        </Box>
      )}

      {media && !isHorizontal && (
        <Box
          sx={{
            mx: `-${paddingValue * 8}px`,
            my: hasHeader ? `${paddingValue * 8}px` : 0,
            mt: hasHeader ? `${paddingValue * 8}px` : `-${paddingValue * 8}px`,
            mb: `${paddingValue * 8}px`,
            "& > *": {
              width: "100%",
              display: "block",
            },
          }}
        >
          {media}
        </Box>
      )}

      {dividerConfig.between && (hasHeader || media) && hasBody && (
        <Box sx={{ ...dividerBaseSx, mb: "12px" }} />
      )}

      {loading && <CardSkeleton size={size} />}

      {!loading && empty && (
        <CardEmpty
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      )}

      {!loading && !empty && hasBody && (
        <Box>
          {description && (
            <Typography
              component="div"
              sx={{
                fontSize: tokens.description,
                lineHeight: 1.55,
                color: "var(--cn-color-text-muted, #6e7682)",
                mb: children ? "12px" : 0,
              }}
            >
              {description}
            </Typography>
          )}
          {children}
        </Box>
      )}

      {dividerConfig.bottom && hasFooter && (
        <Box sx={{ ...dividerBaseSx, mt: "12px", mb: "12px" }} />
      )}

      {hasFooter && !loading && !empty && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            mt: hasBody ? "12px" : 0,
          }}
        >
          {footer}
        </Box>
      )}
    </>
  );

  const innerContent = isHorizontal ? (
    <>
      {media && (
        <Box
          sx={{
            flexShrink: 0,
            width: "40%",
            minWidth: 120,
            marginInlineEnd: `${paddingValue * 8}px`,
            borderRadius: "var(--cn-radius-md, 8px)",
            overflow: "hidden",
            "& > *": { width: "100%", display: "block", height: "100%", objectFit: "cover" },
          }}
        >
          {media}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>{content}</Box>
    </>
  ) : (
    content
  );

  const Component = component ?? (href ? "a" : "div");

  return (
    <Card
      ref={ref}
      component={Component}
      {...(href && {
        href,
        target,
        rel: target === "_blank" ? "noopener noreferrer" : undefined,
      })}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      role={isClickable && !href ? "button" : undefined}
      tabIndex={isClickable && !href ? 0 : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-disabled={disabled || undefined}
      elevation={0}
      className={className}
      sx={rootSx}
      {...rest}
      {...cardProps}
    >
      {innerContent}
    </Card>
  );
});
