import type { ButtonProps } from "@mui/material/Button";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import type { IconButtonProps } from "@mui/material/IconButton";
import IconButton from "@mui/material/IconButton";
import type { TooltipProps } from "@mui/material/Tooltip";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEvent, MouseEventHandler, ReactNode } from "react";
import { forwardRef } from "react";

export type CnButtonVariant = "contained" | "outlined" | "text";
export type CnButtonColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "info"
  | "error"
  | "accent"
  | "neutral";
export type CnButtonSize = "small" | "medium" | "large";
export type CnButtonShape = "rounded" | "pill" | "square";
export type CnButtonLoadingPosition = "start" | "end" | "center";

type IconInput = ReactNode;

type CnButtonOwnProps = {
  iconOnly?: boolean;
  icon?: IconInput;
  variant?: CnButtonVariant;
  color?: CnButtonColor;
  size?: CnButtonSize;
  shape?: CnButtonShape;
  label?: string;
  startIcon?: IconInput;
  endIcon?: IconInput;
  loading?: boolean;
  loadingPosition?: CnButtonLoadingPosition;
  tooltip?: boolean;
  tooltipProps?: Omit<TooltipProps, "children">;
  children?: ReactNode;
  fullWidth?: boolean;
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
  "aria-label"?: string;
};

type ButtonPassThrough = Omit<
  ButtonProps,
  "color" | "variant" | "size" | "shape" | "startIcon" | "endIcon" | "children" | "href" | "onClick"
>;

type IconButtonPassThrough = Omit<
  IconButtonProps,
  "color" | "size" | "children" | "href" | "onClick"
>;

export type CnButtonProps = CnButtonOwnProps &
  ButtonPassThrough &
  IconButtonPassThrough & {
    onClick?: MouseEventHandler<HTMLElement>;
    sx?: SxProps<Theme>;
  };

type ColorTokens = {
  main: string;
  mainRgb: string;
  dark: string;
  contrast: string;
};

const COLOR_TOKENS: Record<CnButtonColor, ColorTokens> = {
  primary: {
    main: "var(--cn-color-brand-600, #254d87)",
    mainRgb: "var(--cn-color-rgb-brand-600, 37, 77, 135)",
    dark: "var(--cn-color-brand-700, #1c3d6d)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  secondary: {
    main: "var(--cn-color-neutral-700, #363d45)",
    mainRgb: "var(--cn-color-rgb-neutral-700, 54, 61, 69)",
    dark: "var(--cn-color-neutral-800, #222831)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  success: {
    main: "var(--cn-color-success-600, #228740)",
    mainRgb: "var(--cn-color-rgb-success-600, 34, 135, 64)",
    dark: "var(--cn-color-success-700, #176230)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  warning: {
    main: "var(--cn-color-warning-600, #b8831a)",
    mainRgb: "var(--cn-color-rgb-warning-600, 184, 131, 26)",
    dark: "var(--cn-color-warning-700, #8a6312)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  info: {
    main: "var(--cn-color-info-600, #2367a8)",
    mainRgb: "var(--cn-color-rgb-info-600, 35, 103, 168)",
    dark: "var(--cn-color-info-700, #1a4f82)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  error: {
    main: "var(--cn-color-error-600, #b52f2f)",
    mainRgb: "var(--cn-color-rgb-error-600, 181, 47, 47)",
    dark: "var(--cn-color-error-700, #8e2424)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  accent: {
    main: "var(--cn-color-accent-500, #3d5afe)",
    mainRgb: "var(--cn-color-rgb-accent-500, 61, 90, 254)",
    dark: "var(--cn-color-accent-600, #304ffe)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
  neutral: {
    main: "var(--cn-color-neutral-700, #363d45)",
    mainRgb: "var(--cn-color-rgb-neutral-700, 54, 61, 69)",
    dark: "var(--cn-color-neutral-800, #222831)",
    contrast: "var(--cn-color-neutral-0, #ffffff)",
  },
};

const SIZE_TOKENS: Record<
  CnButtonSize,
  { height: string; paddingX: string; font: string; spinner: number; icon: number }
> = {
  small: {
    height: "var(--cn-button-height-sm, 32px)",
    paddingX: "var(--cn-button-padding-x-sm, 12px)",
    font: "var(--cn-button-font-sm, 12px)",
    spinner: 14,
    icon: 16,
  },
  medium: {
    height: "var(--cn-button-height-md, 40px)",
    paddingX: "var(--cn-button-padding-x-md, 16px)",
    font: "var(--cn-button-font-md, 13px)",
    spinner: 16,
    icon: 18,
  },
  large: {
    height: "var(--cn-button-height-lg, 48px)",
    paddingX: "var(--cn-button-padding-x-lg, 20px)",
    font: "var(--cn-button-font-lg, 14px)",
    spinner: 18,
    icon: 20,
  },
};

const SHAPE_RADIUS: Record<CnButtonShape, string> = {
  rounded: "var(--cn-radius-md, 8px)",
  pill: "var(--cn-radius-full, 9999px)",
  square: "0",
};

function buildButtonSx(
  variant: CnButtonVariant,
  color: CnButtonColor,
  size: CnButtonSize,
  shape: CnButtonShape,
  loading: boolean,
  isLinkDisabled: boolean,
): SxProps<Theme> {
  const tokens = COLOR_TOKENS[color];
  const sizeTokens = SIZE_TOKENS[size];
  const radius = SHAPE_RADIUS[shape];

  const base: SxProps<Theme> = {
    textTransform: "none",
    fontWeight: "var(--cn-font-weight-semibold, 600)",
    letterSpacing: "var(--cn-letter-spacing-normal, 0)",
    borderRadius: radius,
    minHeight: sizeTokens.height,
    height: sizeTokens.height,
    paddingInline: sizeTokens.paddingX,
    paddingBlock: 0,
    fontSize: sizeTokens.font,
    lineHeight: 1,
    gap: "var(--cn-space-2, 8px)",
    transition: "var(--cn-transition-all, all 200ms cubic-bezier(0.4, 0, 0.2, 1))",
    opacity: loading ? 0.8 : 1,
    "&:focus-visible": {
      outline: "none",
      boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(80, 129, 196, 0.35))",
    },
    "&.Mui-disabled": {
      opacity: 0.55,
      backgroundColor:
        variant === "contained" ? "var(--cn-color-disabled-bg, #e9ecef)" : "transparent",
      color: "var(--cn-color-disabled-text, #9aa1aa)",
      borderColor: "var(--cn-color-disabled-border, #dde0e4)",
    },
  };

  if (isLinkDisabled) {
    Object.assign(base, {
      pointerEvents: "none",
      opacity: 0.5,
    });
  }

  if (variant === "contained") {
    if (color === "neutral") {
      Object.assign(base, {
        color: "var(--cn-color-text, #222831)",
        backgroundColor: "var(--cn-color-neutral-150, #e9ecef)",
        "&:hover": {
          backgroundColor: "var(--cn-color-neutral-200, #dde0e4)",
        },
        "&:active": {
          backgroundColor: "var(--cn-color-neutral-300, #c5cad0)",
        },
      });
    } else {
      Object.assign(base, {
        color: tokens.contrast,
        backgroundColor: tokens.main,
        boxShadow: "var(--cn-shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.04))",
        "&:hover": {
          backgroundColor: tokens.dark,
          boxShadow: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
        },
        "&:active": {
          backgroundColor: tokens.dark,
          transform: "translateY(1px)",
        },
      });
    }
  } else if (variant === "outlined") {
    Object.assign(base, {
      color: tokens.main,
      backgroundColor: "transparent",
      border: `1px solid ${tokens.main}`,
      "&:hover": {
        backgroundColor: `rgba(${tokens.mainRgb}, 0.06)`,
        borderColor: tokens.dark,
      },
      "&:active": {
        backgroundColor: `rgba(${tokens.mainRgb}, 0.10)`,
        borderColor: tokens.dark,
      },
    });
  } else {
    Object.assign(base, {
      color: tokens.main,
      backgroundColor: "transparent",
      "&:hover": {
        backgroundColor: `rgba(${tokens.mainRgb}, 0.06)`,
      },
      "&:active": {
        backgroundColor: `rgba(${tokens.mainRgb}, 0.10)`,
      },
    });
  }

  return base;
}

function renderIconSlot(
  slot: IconInput | undefined,
  sizePx: number,
): ReactNode | undefined {
  if (slot === undefined || slot === null) return undefined;
  if (typeof slot === "string" || typeof slot === "number") return slot;
  return <span style={{ display: "inline-flex", width: sizePx, height: sizePx }}>{slot}</span>;
}

export const CnButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, CnButtonProps>(
  function CnButton(
    {
      iconOnly = false,
      icon,
      variant = "contained",
      color = "primary",
      size = "medium",
      shape = "rounded",
      label,
      startIcon,
      endIcon,
      loading = false,
      loadingPosition = "center",
      tooltip = false,
      tooltipProps,
      children,
      fullWidth = false,
      href,
      target,
      rel,
      onClick,
      sx,
      disabled,
      "aria-label": ariaLabel,
      type,
      ...rest
    },
    ref,
  ) {
    const isLink = typeof href === "string" && href.length > 0;
    const resolvedDisabled = Boolean(disabled) || loading;
    const sizeTokens = SIZE_TOKENS[size];
    const content = children ?? label;

    const handleClick = (event: MouseEvent<HTMLElement>) => {
      if (resolvedDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    };

    const spinnerColor =
      variant === "contained" && color !== "neutral"
        ? COLOR_TOKENS[color].contrast
        : COLOR_TOKENS[color].main;

    const loadingSpinner = (
      <CircularProgress
        size={sizeTokens.spinner}
        thickness={4}
        sx={{ color: spinnerColor }}
        aria-hidden="true"
      />
    );

    if (iconOnly) {
      const iconElement = icon ?? content;
      const resolvedAriaLabel = ariaLabel ?? label;
      const isIconDisabled = resolvedDisabled;

      const iconButtonSx = buildButtonSx(
        variant,
        color,
        size,
        shape,
        loading,
        isLink && isIconDisabled,
      );

      const iconButtonSxMerged = {
        ...(iconButtonSx as Record<string, unknown>),
        width: sizeTokens.height,
        minWidth: sizeTokens.height,
        paddingInline: 0,
        ...(sx as Record<string, unknown>),
      };

      const iconButtonNode = (
        <IconButton
          ref={ref as React.Ref<HTMLButtonElement>}
          disabled={isIconDisabled}
          aria-busy={loading || undefined}
          aria-label={resolvedAriaLabel}
          onClick={handleClick}
          href={isLink ? href : undefined}
          target={isLink ? target : undefined}
          rel={isLink ? rel : undefined}
          component={isLink ? "a" : "button"}
          type={isLink ? undefined : (type ?? "button")}
          sx={iconButtonSxMerged}
          {...rest}
        >
          {loading ? loadingSpinner : renderIconSlot(iconElement, sizeTokens.icon)}
        </IconButton>
      );

      if (tooltip && tooltipProps) {
        return (
          <Tooltip arrow {...tooltipProps}>
            <span style={{ display: "inline-flex" }}>{iconButtonNode}</span>
          </Tooltip>
        );
      }

      return iconButtonNode;
    }

    const startIconResolved = renderIconSlot(startIcon, sizeTokens.icon);
    const endIconResolved = renderIconSlot(endIcon, sizeTokens.icon);

    const leadingIcon =
      loading && loadingPosition === "start"
        ? loadingSpinner
        : startIconResolved ?? (loading && loadingPosition === "center" ? loadingSpinner : undefined);

    const trailingIcon = loading && loadingPosition === "end" ? loadingSpinner : endIconResolved;

    const buttonSx = buildButtonSx(variant, color, size, shape, loading, isLink && resolvedDisabled);

    const buttonSxMerged = [buttonSx, ...(Array.isArray(sx) ? sx : [sx])];

    const buttonNode = (
      <Button
        ref={ref as React.Ref<HTMLButtonElement>}
        variant={variant}
        color={color === "neutral" ? "inherit" : color === "accent" ? "primary" : color}
        size={size}
        disabled={resolvedDisabled}
        aria-busy={loading || undefined}
        startIcon={leadingIcon}
        endIcon={trailingIcon}
        onClick={handleClick}
        href={isLink ? href : undefined}
        target={isLink ? target : undefined}
        rel={isLink ? rel : undefined}
        component={isLink ? "a" : "button"}
        type={isLink ? undefined : (type ?? "button")}
        fullWidth={fullWidth}
        sx={buttonSxMerged}
        {...rest}
      >
        {loading && loadingPosition === "center" ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--cn-space-2, 8px)",
            }}
          >
            {loadingSpinner}
            {content}
          </span>
        ) : (
          content
        )}
      </Button>
    );

    if (tooltip && tooltipProps) {
      return (
        <Tooltip arrow {...tooltipProps}>
          <span style={{ display: "inline-flex", width: fullWidth ? "100%" : undefined }}>
            {buttonNode}
          </span>
        </Tooltip>
      );
    }

    return buttonNode;
  },
);
