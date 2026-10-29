import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import type { ChipProps } from "@mui/material/Chip";
import Chip from "@mui/material/Chip";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { forwardRef, isValidElement } from "react";
import { CnIcon } from "../CnIcon";

export type CnChipVariant = "filled" | "outlined" | "soft" | "light" | "ghost";
export type CnChipColor =
  "primary" | "secondary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";
export type CnChipSize = "small" | "medium" | "large";
export type CnChipShape = "pill" | "rounded" | "circle";

type AvatarInput = ReactNode | { src: string; alt?: string };

export type CnChipProps = Omit<
  ChipProps,
  | "label"
  | "variant"
  | "color"
  | "size"
  | "icon"
  | "avatar"
  | "onDelete"
  | "deleteIcon"
  | "clickable"
  | "onClick"
  | "sx"
  | "className"
> & {
  label: string | number | ReactNode;
  subtitle?: string | ReactNode;
  subtitleColor?: CnChipColor;
  variant?: CnChipVariant;
  color?: CnChipColor;
  size?: CnChipSize;
  shape?: CnChipShape;
  icon?: ReactNode | string;
  avatar?: AvatarInput;
  deleteIcon?: ReactNode;
  withChevron?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onDelete?: () => void;
  disabled?: boolean;
  clickable?: boolean;
  iconSize?: number;
  fontWeight?: number;
  letterSpacing?: string | number;
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
  multiline?: boolean;
  compact?: boolean;
  pulse?: boolean;
  glow?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

type ColorTokens = {
  main: string;
  dark: string;
  rgb: string;
  contrast: string;
};

const COLOR_TOKENS: Record<CnChipColor, ColorTokens> = {
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
  height: number;
  minWidth: number;
  paddingX: number;
  iconSize: number;
  avatarSize: number;
};

const SIZE_TOKENS: Record<CnChipSize, SizeTokens> = {
  small: { height: 24, minWidth: 48, paddingX: 8, iconSize: 14, avatarSize: 18 },
  medium: { height: 32, minWidth: 56, paddingX: 12, iconSize: 16, avatarSize: 22 },
  large: { height: 40, minWidth: 64, paddingX: 16, iconSize: 18, avatarSize: 28 },
};

const SHAPE_RADIUS: Record<CnChipShape, string> = {
  pill: "var(--cn-radius-full, 9999px)",
  rounded: "var(--cn-radius-md, 8px)",
  circle: "50%",
};

const buildVariantStyles = (
  variant: CnChipVariant,
  color: CnChipColor,
  isInteractive: boolean,
): Record<string, unknown> => {
  const t = COLOR_TOKENS[color];
  const base = {
    color: t.main,
    "& .MuiChip-deleteIcon": {
      color: `rgba(${t.rgb}, 0.6)`,
      "&:hover": { color: t.main },
    },
    "& .MuiChip-avatar": {
      backgroundColor: `rgba(${t.rgb}, 0.15)`,
      color: t.main,
    },
  };

  switch (variant) {
    case "filled":
      return {
        ...base,
        backgroundColor: t.main,
        color: t.contrast,
        "& .MuiChip-deleteIcon": {
          color: `rgba(255, 255, 255, 0.7)`,
          "&:hover": { color: t.contrast },
        },
        "& .MuiChip-avatar": {
          backgroundColor: `rgba(255, 255, 255, 0.2)`,
          color: t.contrast,
        },
        ...(isInteractive && { "&:hover": { backgroundColor: t.dark } }),
      };
    case "outlined":
      return {
        ...base,
        backgroundColor: "transparent",
        border: `1px solid ${t.main}`,
        color: t.main,
        ...(isInteractive && {
          "&:hover": {
            backgroundColor: `rgba(${t.rgb}, 0.06)`,
            borderColor: t.dark,
          },
        }),
      };
    case "soft":
      return {
        ...base,
        backgroundColor: `rgba(${t.rgb}, 0.12)`,
        color: t.dark,
        ...(isInteractive && {
          "&:hover": { backgroundColor: `rgba(${t.rgb}, 0.20)` },
        }),
      };
    case "light":
      return {
        ...base,
        backgroundColor: `rgba(${t.rgb}, 0.06)`,
        border: `1px solid rgba(${t.rgb}, 0.20)`,
        color: t.dark,
        ...(isInteractive && {
          "&:hover": {
            backgroundColor: `rgba(${t.rgb}, 0.12)`,
            borderColor: `rgba(${t.rgb}, 0.35)`,
          },
        }),
      };
    case "ghost":
      return {
        ...base,
        backgroundColor: "transparent",
        color: t.main,
        ...(isInteractive && {
          "&:hover": { backgroundColor: `rgba(${t.rgb}, 0.08)` },
        }),
      };
  }
};

const isAvatarObject = (value: AvatarInput | undefined): value is { src: string; alt?: string } =>
  typeof value === "object" &&
  value !== null &&
  "src" in value &&
  typeof (value as { src: unknown }).src === "string";

export const CnChip = forwardRef<HTMLDivElement, CnChipProps>(function CnChip(
  {
    label,
    subtitle,
    subtitleColor = "neutral",
    variant = "soft",
    color = "primary",
    size = "medium",
    shape,
    icon,
    avatar,
    deleteIcon,
    withChevron = false,
    onClick,
    onDelete,
    disabled = false,
    clickable,
    iconSize,
    fontWeight = 600,
    letterSpacing = "var(--cn-letter-spacing-wide, 0.04em)",
    textTransform = "none",
    multiline = false,
    compact = false,
    pulse = false,
    glow = false,
    sx,
    className,
    ...rest
  },
  ref,
) {
  const tokens = SIZE_TOKENS[size];
  const colorTokens = COLOR_TOKENS[color];
  const subtitleTokens = COLOR_TOKENS[subtitleColor];

  const hasLabel = typeof label === "string" ? label.length > 0 : Boolean(label);
  const hasIcon = Boolean(icon);
  const hasAvatar = Boolean(avatar);
  const hasSlot = hasIcon || hasAvatar;

  const iconOnly = hasSlot && !hasLabel;
  const counterChip =
    !hasSlot && typeof label === "string" && label.length > 0 && label.length <= 2;
  const autoCircle = iconOnly || counterChip;

  const resolvedShape: CnChipShape = shape ?? (autoCircle ? "circle" : "pill");
  const resolvedIconSize = iconSize ?? tokens.iconSize;

  const isClickable = clickable ?? Boolean(onClick);
  const isInteractive = isClickable && !disabled;

  const renderIconSlot = (): ReactElement | undefined => {
    if (!icon) return undefined;
    if (typeof icon === "string") {
      return <CnIcon name={icon} size={resolvedIconSize} color="inherit" />;
    }
    if (isValidElement(icon)) return icon;
    return <span>{icon}</span>;
  };

  const renderAvatarSlot = (): ReactElement | undefined => {
    if (!avatar) return undefined;
    if (typeof avatar === "string") {
      return <Avatar src={avatar} sx={{ width: tokens.avatarSize, height: tokens.avatarSize }} />;
    }
    if (isAvatarObject(avatar)) {
      return (
        <Avatar
          src={avatar.src}
          alt={avatar.alt}
          sx={{ width: tokens.avatarSize, height: tokens.avatarSize }}
        />
      );
    }
    if (isValidElement(avatar)) return avatar;
    return <span>{avatar}</span>;
  };

  const labelNode: ReactNode = subtitle ? (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        lineHeight: 1.2,
        gap: "2px",
      }}
    >
      <Box component="span" sx={{ fontSize: "inherit", fontWeight }}>
        {label}
      </Box>
      <Box
        component="span"
        sx={{
          fontSize: "0.7em",
          fontWeight: 500,
          color: subtitleTokens.dark,
          opacity: 0.85,
        }}
      >
        {subtitle}
      </Box>
    </Box>
  ) : (
    label
  );

  const resolvedDeleteIcon: ReactElement | undefined = onDelete ? (
    deleteIcon === undefined || deleteIcon === null ? (
      <CnIcon name="close" size={tokens.iconSize} color="inherit" />
    ) : isValidElement(deleteIcon) ? (
      deleteIcon
    ) : (
      <span>{deleteIcon}</span>
    )
  ) : withChevron ? (
    <CnIcon name="chevron_right" size={tokens.iconSize} color="inherit" />
  ) : undefined;

  const resolvedOnDelete = onDelete ?? (withChevron ? () => undefined : undefined);

  const baseSx: Record<string, unknown> = {
    height: tokens.height,
    minHeight: tokens.height,
    minWidth: tokens.minWidth,
    borderRadius: SHAPE_RADIUS[resolvedShape],
    fontWeight,
    letterSpacing,
    fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
    transition:
      "background-color var(--cn-duration-fast, 140ms) var(--cn-ease-standard, ease), border-color var(--cn-duration-fast, 140ms) var(--cn-ease-standard, ease), box-shadow var(--cn-duration-fast, 140ms) var(--cn-ease-standard, ease), transform var(--cn-duration-fast, 140ms) var(--cn-ease-standard, ease)",
    "& .MuiChip-label": {
      paddingInline: compact ? tokens.paddingX / 2 : tokens.paddingX,
      fontSize:
        size === "small"
          ? "var(--cn-font-size-xs, 11px)"
          : size === "large"
            ? "var(--cn-font-size-base, 13px)"
            : "var(--cn-font-size-sm, 12px)",
      textTransform,
      whiteSpace: multiline ? "normal" : "nowrap",
      overflow: multiline ? "visible" : "hidden",
      textOverflow: multiline ? "clip" : "ellipsis",
    },
    "& .MuiChip-icon": {
      marginLeft: compact ? tokens.paddingX / 2 : tokens.paddingX,
      marginRight: 0,
      color: "inherit",
    },
    "& .MuiChip-deleteIcon": {
      marginRight: compact ? tokens.paddingX / 2 : tokens.paddingX,
      marginLeft: 0,
    },
    "& .MuiChip-avatar": {
      marginLeft: compact ? 0 : "4px",
      marginRight: 0,
      width: tokens.avatarSize,
      height: tokens.avatarSize,
    },
    ...(isInteractive && {
      "&:active": { transform: "scale(0.98)" },
    }),
  };

  const variantSx = buildVariantStyles(variant, color, isInteractive);

  const circleSx: Record<string, unknown> =
    resolvedShape === "circle"
      ? {
          width: tokens.height,
          minWidth: tokens.height,
          padding: 0,
          "& .MuiChip-label": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            width: "100%",
            textAlign: "center",
          },
          "& .MuiChip-icon": {
            margin: 0,
          },
          "& .MuiChip-avatar": {
            margin: 0,
          },
        }
      : {};

  const multilineSx: Record<string, unknown> = multiline
    ? {
        height: "auto",
        minHeight: tokens.height,
        paddingBlock: "4px",
      }
    : {};

  const glowSx: Record<string, unknown> =
    glow && !disabled
      ? {
          boxShadow: `0 0 12px rgba(${colorTokens.rgb}, 0.35)`,
          "&:hover": {
            boxShadow: `0 0 18px rgba(${colorTokens.rgb}, 0.5)`,
          },
        }
      : {};

  const pulseSx: Record<string, unknown> =
    pulse && !disabled
      ? {
          animation: "cn-chip-pulse 2s ease-in-out infinite",
          "@keyframes cn-chip-pulse": {
            "0%, 100%": { boxShadow: `0 0 0 0 rgba(${colorTokens.rgb}, 0.5)` },
            "50%": { boxShadow: `0 0 0 6px rgba(${colorTokens.rgb}, 0)` },
          },
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
          },
        }
      : {};

  const disabledSx: Record<string, unknown> = disabled
    ? {
        opacity: 0.55,
        cursor: "not-allowed",
      }
    : {};

  return (
    <Chip
      ref={ref}
      label={labelNode}
      icon={!hasAvatar ? renderIconSlot() : undefined}
      avatar={hasAvatar ? renderAvatarSlot() : undefined}
      deleteIcon={resolvedDeleteIcon}
      onDelete={disabled ? undefined : resolvedOnDelete}
      onClick={disabled ? undefined : onClick}
      clickable={isInteractive}
      disabled={disabled}
      className={className}
      aria-disabled={disabled || undefined}
      aria-busy={pulse && !disabled ? true : undefined}
      sx={[
        baseSx,
        variantSx,
        circleSx,
        multilineSx,
        glowSx,
        pulseSx,
        disabledSx,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
});
