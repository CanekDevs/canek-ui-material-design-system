import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import type { TabsProps } from "@mui/material/Tabs";
import Tabs from "@mui/material/Tabs";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode, SyntheticEvent } from "react";
import { forwardRef, isValidElement } from "react";
import { CnIcon } from "../CnIcon";

export type CnTabsVariant = "line" | "pill" | "soft" | "contained" | "outlined";
export type CnTabsColor =
  "primary" | "secondary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";
export type CnTabsSize = "sm" | "md" | "lg";
export type CnTabsOrientation = "horizontal" | "vertical";
export type CnTabsIconPosition = "start" | "top";
export type CnTabsSubtitlePosition = "below" | "inline";

export type CnTabOption = {
  id: string | number;
  label: string;
  subtitle?: string;
  icon?: string | ReactNode;
  badge?: number | string;
  disabled?: boolean;
  hasError?: boolean;
  isLoading?: boolean;
};

export type CnTabsProps = Omit<
  TabsProps,
  "value" | "onChange" | "children" | "variant" | "orientation" | "sx" | "className"
> & {
  options: CnTabOption[];
  value: string | number;
  onChange: (value: string | number) => void;

  variant?: CnTabsVariant;
  color?: CnTabsColor;
  size?: CnTabsSize;
  orientation?: CnTabsOrientation;

  fullWidth?: boolean;
  centered?: boolean;
  scrollButtons?: "auto" | true | false;
  allowScrollButtonsMobile?: boolean;

  showIconOnly?: boolean;
  iconPosition?: CnTabsIconPosition;
  subtitlePosition?: CnTabsSubtitlePosition;

  showDividers?: boolean;
  showIndicator?: boolean;

  errorIcon?: ReactNode;
  loadingIndicator?: ReactNode;

  verticalWidth?: number | string;

  onTabClick?: (option: CnTabOption, index: number, event: SyntheticEvent) => void;

  sx?: SxProps<Theme>;
  tabSx?: SxProps<Theme>;
  className?: string;
};

type ColorTokens = { main: string; dark: string; rgb: string; contrast: string };

const COLOR_TOKENS: Record<CnTabsColor, ColorTokens> = {
  primary: {
    main: "var(--cn-color-brand-600, #254d87)",
    dark: "var(--cn-color-brand-700, #1c3d6d)",
    rgb: "var(--cn-color-rgb-brand-600, 37, 77, 135)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  secondary: {
    main: "var(--cn-color-neutral-700, #363d45)",
    dark: "var(--cn-color-neutral-800, #222831)",
    rgb: "var(--cn-color-rgb-neutral-700, 54, 61, 69)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  success: {
    main: "var(--cn-color-success-600, #228740)",
    dark: "var(--cn-color-success-700, #176230)",
    rgb: "var(--cn-color-rgb-success-600, 34, 135, 64)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  warning: {
    main: "var(--cn-color-warning-600, #b8831a)",
    dark: "var(--cn-color-warning-700, #8a6312)",
    rgb: "var(--cn-color-rgb-warning-600, 184, 131, 26)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  error: {
    main: "var(--cn-color-error-600, #b52f2f)",
    dark: "var(--cn-color-error-700, #8e2424)",
    rgb: "var(--cn-color-rgb-error-600, 181, 47, 47)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  info: {
    main: "var(--cn-color-info-600, #2367a8)",
    dark: "var(--cn-color-info-700, #1a4f82)",
    rgb: "var(--cn-color-rgb-info-600, 35, 103, 168)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  accent: {
    main: "var(--cn-color-accent-500, #3d5afe)",
    dark: "var(--cn-color-accent-600, #304ffe)",
    rgb: "var(--cn-color-rgb-accent-500, 61, 90, 254)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  neutral: {
    main: "var(--cn-color-neutral-600, #4e5660)",
    dark: "var(--cn-color-neutral-700, #363d45)",
    rgb: "var(--cn-color-rgb-neutral-600, 78, 86, 96)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
};

type SizeTokens = {
  minHeight: number;
  paddingX: string;
  paddingY: string;
  fontSize: string;
  iconSize: number;
  subtitleSize: string;
  badgeSize: number;
  gap: string;
};

const SIZE_TOKENS: Record<CnTabsSize, SizeTokens> = {
  sm: {
    minHeight: 30,
    paddingX: "10px",
    paddingY: "4px",
    fontSize: "var(--cn-font-size-sm, 12px)",
    iconSize: 14,
    subtitleSize: "var(--cn-font-size-xs, 11px)",
    badgeSize: 16,
    gap: "4px",
  },
  md: {
    minHeight: 36,
    paddingX: "12px",
    paddingY: "6px",
    fontSize: "var(--cn-font-size-base, 13px)",
    iconSize: 16,
    subtitleSize: "var(--cn-font-size-xs, 11px)",
    badgeSize: 18,
    gap: "6px",
  },
  lg: {
    minHeight: 42,
    paddingX: "16px",
    paddingY: "8px",
    fontSize: "var(--cn-font-size-md, 14px)",
    iconSize: 18,
    subtitleSize: "var(--cn-font-size-sm, 12px)",
    badgeSize: 20,
    gap: "8px",
  },
};

const resolveIcon = (icon: string | ReactNode, size: number): ReactNode => {
  if (typeof icon === "string") {
    return <CnIcon name={icon} size={size} color="inherit" aria-hidden />;
  }
  if (isValidElement(icon)) return icon;
  return icon;
};

function LoadingSpinner({ color }: { color: string }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        color,
        animation: "cn-tabs-spin 0.7s linear infinite",
        "@keyframes cn-tabs-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          animationDuration: "2s",
        },
      }}
    />
  );
}

export const CnTabs = forwardRef<HTMLDivElement, CnTabsProps>(function CnTabs(
  {
    options,
    value,
    onChange,
    variant = "line",
    color = "primary",
    size = "md",
    orientation = "horizontal",
    fullWidth = false,
    centered = false,
    scrollButtons = "auto",
    allowScrollButtonsMobile = true,
    showIconOnly = false,
    iconPosition = "start",
    subtitlePosition = "below",
    showDividers = false,
    showIndicator = true,
    errorIcon,
    loadingIndicator,
    verticalWidth = 240,
    onTabClick,
    sx,
    tabSx,
    className,
    ...rest
  },
  ref,
) {
  const tokens = SIZE_TOKENS[size];
  const colorTokens = COLOR_TOKENS[color];
  const isVertical = orientation === "vertical";
  const isScrollable = !isVertical && variant === "line";

  const handleChange = (_event: SyntheticEvent, newValue: string | number) => {
    onChange(newValue);
  };

  const renderBadge = (option: CnTabOption, isSelected: boolean) => {
    if (option.badge === undefined) return null;

    const isContained = variant === "contained";
    const isPill = variant === "pill";
    const isSoft = variant === "soft";

    let badgeBg: string;
    let badgeFg: string;

    if (isContained) {
      badgeBg = "rgba(255, 255, 255, 0.22)";
      badgeFg = colorTokens.contrast;
    } else if (isPill && isSelected) {
      badgeBg = "rgba(255, 255, 255, 0.3)";
      badgeFg = colorTokens.contrast;
    } else if (isSoft && isSelected) {
      badgeBg = `rgba(${colorTokens.rgb}, 0.15)`;
      badgeFg = colorTokens.main;
    } else {
      badgeBg = `rgba(${colorTokens.rgb}, 0.12)`;
      badgeFg = colorTokens.main;
    }

    return (
      <Box
        component="span"
        data-cn-tabs-badge="true"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: tokens.badgeSize,
          height: tokens.badgeSize,
          paddingInline: "4px",
          borderRadius: "9999px",
          backgroundColor: badgeBg,
          color: badgeFg,
          fontSize: "10px",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          transition: "background-color 140ms ease, color 140ms ease",
        }}
      >
        {option.badge}
      </Box>
    );
  };

  const renderTabLabel = (option: CnTabOption, isSelected: boolean) => {
    const hasIcon = Boolean(option.icon);
    const isIconOnly = showIconOnly && hasIcon;
    const isInline = subtitlePosition === "inline" && !isVertical;

    const iconNode =
      hasIcon && option.icon !== undefined ? resolveIcon(option.icon, tokens.iconSize) : null;

    const statusNode = option.hasError
      ? (errorIcon ?? <CnIcon name="error" size={tokens.iconSize - 2} color="error" aria-hidden />)
      : option.isLoading
        ? (loadingIndicator ?? <LoadingSpinner color={colorTokens.main} />)
        : null;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: isVertical ? "flex-start" : "center",
          gap: "2px",
          minWidth: 0,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: isVertical ? "flex-start" : "center",
            gap: "6px",
            flexDirection: iconPosition === "top" ? "column" : "row",
            width: "100%",
            minWidth: 0,
          }}
        >
          {iconNode && (
            <Box
              component="span"
              data-cn-tabs-icon="true"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "transform 140ms ease",
              }}
            >
              {iconNode}
            </Box>
          )}

          {!isIconOnly && (
            <Box
              component="span"
              data-cn-tabs-label="true"
              sx={{
                fontSize: tokens.fontSize,
                fontWeight: isSelected ? 700 : 500,
                lineHeight: 1.25,
                letterSpacing: "-0.005em",
                color: option.hasError ? "var(--cn-color-error-600, #b52f2f)" : "inherit",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {option.label}
            </Box>
          )}

          {statusNode && (
            <Box
              component="span"
              data-cn-tabs-status="true"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {statusNode}
            </Box>
          )}

          {renderBadge(option, isSelected)}
        </Box>

        {option.subtitle && !isIconOnly && (
          <Box
            component="span"
            data-cn-tabs-subtitle="true"
            sx={{
              display: isInline ? "inline" : "block",
              fontSize: tokens.subtitleSize,
              fontWeight: 400,
              lineHeight: 1.3,
              color: isSelected
                ? variant === "contained" || variant === "pill"
                  ? "rgba(255, 255, 255, 0.85)"
                  : "var(--cn-color-text-muted, #6e7682)"
                : "var(--cn-color-text-subtle, #9aa1aa)",
              textAlign: isVertical ? "left" : "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            {option.subtitle}
          </Box>
        )}
      </Box>
    );
  };

  const tabsSx: Record<string, unknown> = {
    minHeight: tokens.minHeight,
    "& .MuiTabs-flexContainer": {
      gap: variant === "pill" || variant === "contained" || variant === "soft" ? "4px" : 0,
    },
    "& .MuiTabs-indicator": {
      display: showIndicator ? "block" : "none",
    },
    "& .MuiTabs-scrollButtons": {
      color: "var(--cn-color-text-muted, #6e7682)",
      "&:hover": {
        backgroundColor: `rgba(${colorTokens.rgb}, 0.08)`,
      },
      "&.Mui-disabled": {
        opacity: 0.3,
      },
    },
  };

  const tabBaseSx: Record<string, unknown> = {
    textTransform: "none",
    fontWeight: 500,
    fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
    minHeight: tokens.minHeight,
    minWidth: "auto",
    paddingInline: tokens.paddingX,
    paddingBlock: tokens.paddingY,
    fontSize: tokens.fontSize,
    lineHeight: 1.25,
    opacity: 1,
    transition: "color 140ms ease, background-color 140ms ease, border-color 140ms ease",
    "&.Mui-disabled": {
      opacity: 0.4,
      cursor: "not-allowed",
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(80, 129, 196, 0.35))",
      borderRadius: "var(--cn-radius-sm, 6px)",
    },
  };

  const variantSx: Record<string, unknown> = (() => {
    switch (variant) {
      case "pill":
        return {
          backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
          borderRadius: "var(--cn-radius-full, 9999px)",
          padding: "4px",
          minHeight: tokens.minHeight + 8,
          "& .MuiTabs-indicator": {
            display: "none",
          },
          "& .MuiTab-root": {
            ...tabBaseSx,
            borderRadius: "var(--cn-radius-full, 9999px)",
            color: "var(--cn-color-text-muted, #6e7682)",
            zIndex: 1,
            "&.Mui-selected": {
              color: colorTokens.contrast,
              backgroundColor: colorTokens.main,
              fontWeight: 600,
            },
            "&:hover:not(.Mui-selected)": {
              backgroundColor: `rgba(${colorTokens.rgb}, 0.06)`,
              color: colorTokens.main,
            },
          },
        };

      case "soft":
        return {
          backgroundColor: `rgba(${colorTokens.rgb}, 0.06)`,
          borderRadius: "var(--cn-radius-lg, 12px)",
          padding: "4px",
          minHeight: tokens.minHeight + 8,
          "& .MuiTabs-indicator": {
            display: "none",
          },
          "& .MuiTab-root": {
            ...tabBaseSx,
            borderRadius: "var(--cn-radius-md, 8px)",
            color: "var(--cn-color-text-muted, #6e7682)",
            "&.Mui-selected": {
              color: colorTokens.main,
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              fontWeight: 600,
              boxShadow: "var(--cn-shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.04))",
            },
            "&:hover:not(.Mui-selected)": {
              color: colorTokens.main,
              backgroundColor: `rgba(${colorTokens.rgb}, 0.08)`,
            },
          },
        };

      case "contained":
        return {
          backgroundColor: colorTokens.main,
          borderRadius: "var(--cn-radius-lg, 12px)",
          padding: "4px",
          minHeight: tokens.minHeight + 8,
          "& .MuiTabs-indicator": {
            display: "none",
          },
          "& .MuiTab-root": {
            ...tabBaseSx,
            borderRadius: "var(--cn-radius-md, 8px)",
            color: `rgba(255, 255, 255, 0.72)`,
            "&.Mui-selected": {
              color: colorTokens.contrast,
              backgroundColor: `rgba(255, 255, 255, 0.18)`,
              fontWeight: 600,
            },
            "&:hover:not(.Mui-selected)": {
              color: colorTokens.contrast,
              backgroundColor: `rgba(255, 255, 255, 0.10)`,
            },
          },
        };

      case "outlined":
        return {
          border: `1px solid rgba(${colorTokens.rgb}, 0.25)`,
          borderRadius: "var(--cn-radius-lg, 12px)",
          padding: "4px",
          minHeight: tokens.minHeight + 8,
          "& .MuiTabs-indicator": {
            display: "none",
          },
          "& .MuiTab-root": {
            ...tabBaseSx,
            borderRadius: "var(--cn-radius-md, 8px)",
            color: "var(--cn-color-text-muted, #6e7682)",
            "&.Mui-selected": {
              color: colorTokens.main,
              backgroundColor: `rgba(${colorTokens.rgb}, 0.10)`,
              fontWeight: 600,
            },
            "&:hover:not(.Mui-selected)": {
              color: colorTokens.main,
              backgroundColor: `rgba(${colorTokens.rgb}, 0.04)`,
            },
          },
        };

      case "line":
      default:
        return {
          borderBottom: isVertical ? "none" : "1px solid var(--cn-color-border, #dde0e4)",
          borderRight: isVertical ? "1px solid var(--cn-color-border, #dde0e4)" : "none",
          "& .MuiTabs-indicator": {
            backgroundColor: colorTokens.main,
            height: isVertical ? "100%" : 2,
            width: isVertical ? 2 : "100%",
            borderRadius: isVertical ? "0 2px 2px 0" : "2px 2px 0 0",
          },
          "& .MuiTab-root": {
            ...tabBaseSx,
            color: "var(--cn-color-text-muted, #6e7682)",
            borderRight:
              isVertical && showDividers
                ? "1px solid var(--cn-color-border-subtle, #e9ecef)"
                : "none",
            "&:last-of-type": {
              borderRight: isVertical ? "none" : undefined,
            },
            "&.Mui-selected": {
              color: colorTokens.main,
              fontWeight: 600,
            },
            "&:hover:not(.Mui-selected)": {
              color: colorTokens.dark,
              backgroundColor: `rgba(${colorTokens.rgb}, 0.04)`,
            },
          },
        };
    }
  })();

  const wrapperSx: Record<string, unknown> = {
    ...(isVertical && {
      width: verticalWidth,
      display: "flex",
      flexDirection: "column",
    }),
    ...(fullWidth && !isVertical && { width: "100%" }),
  };

  return (
    <Tabs
      ref={ref}
      value={value}
      onChange={handleChange}
      orientation={orientation}
      variant={isScrollable ? "scrollable" : "standard"}
      scrollButtons={isScrollable ? scrollButtons : false}
      allowScrollButtonsMobile={allowScrollButtonsMobile}
      centered={!isScrollable && centered && !isVertical}
      className={className}
      sx={[tabsSx, variantSx, wrapperSx, ...(sx ? (Array.isArray(sx) ? sx : [sx]) : [])]}
      {...rest}
    >
      {options.map((option, index) => {
        const isSelected = value === option.id;

        return (
          <Tab
            key={option.id}
            value={option.id}
            disabled={option.disabled}
            data-cn-tab-id={String(option.id)}
            data-cn-tab-selected={isSelected ? "true" : undefined}
            label={renderTabLabel(option, isSelected)}
            onClick={(event) => {
              if (option.disabled) return;
              onTabClick?.(option, index, event);
            }}
            sx={[
              {
                ...(isVertical && {
                  justifyContent: "flex-start",
                  alignItems: "stretch",
                  textAlign: "left",
                }),
              },
              ...(Array.isArray(tabSx) ? tabSx : [tabSx]),
            ]}
          />
        );
      })}
    </Tabs>
  );
});
