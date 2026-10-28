import type { SxProps, Theme } from "@mui/material/styles";
import type { CSSProperties } from "react";
import { forwardRef } from "react";
import { ICON_ALIASES, ICON_REGISTRY } from "./icons";

export type CnIconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export type CnIconColor =
  | "inherit"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "accent"
  | "muted"
  | "subtle";

export type CnIconProps = {
  name: string;
  size?: CnIconSize | number;
  color?: CnIconColor | string;
  spin?: boolean;
  pulse?: boolean;
  rotate?: number;
  title?: string;
  label?: string;
  onClick?: () => void;
  sx?: SxProps<Theme>;
  style?: CSSProperties;
  className?: string;
};

const SIZE_MAP: Record<CnIconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  "2xl": 40,
};

const COLOR_MAP: Record<CnIconColor, string> = {
  inherit: "currentColor",
  primary: "var(--cn-color-brand-600, #254d87)",
  secondary: "var(--cn-color-neutral-700, #363d45)",
  success: "var(--cn-color-success-600, #228740)",
  warning: "var(--cn-color-warning-600, #b8831a)",
  error: "var(--cn-color-error-600, #b52f2f)",
  info: "var(--cn-color-info-600, #2367a8)",
  accent: "var(--cn-color-accent-500, #3d5afe)",
  muted: "var(--cn-color-text-muted, #6e7682)",
  subtle: "var(--cn-color-text-subtle, #9aa1aa)",
};

const isSemanticColor = (value: string): value is CnIconColor => value in COLOR_MAP;

const resolveSize = (size: CnIconSize | number): number =>
  typeof size === "number" ? size : SIZE_MAP[size];

const resolveColor = (color: CnIconColor | string): string =>
  isSemanticColor(color) ? COLOR_MAP[color] : color;

const resolveName = (name: string): string => ICON_ALIASES[name] ?? name;

export const CnIcon = forwardRef<SVGSVGElement, CnIconProps>(function CnIcon(
  {
    name,
    size = "md",
    color = "inherit",
    spin = false,
    pulse = false,
    rotate = 0,
    title,
    label,
    onClick,
    sx,
    style,
    className,
  },
  ref,
) {
  const resolvedName = resolveName(name);
  const IconComponent = ICON_REGISTRY[resolvedName];
  const sizePx = resolveSize(size);
  const colorValue = resolveColor(color);

  if (!IconComponent) {
    if (typeof console !== "undefined") {
      console.warn(`[CnIcon] Icon "${name}" is not registered.`);
    }
    return null;
  }

  const accessibilityProps = label
    ? { role: "img" as const, "aria-label": label, title: title ?? label }
    : { "aria-hidden": true as const, title };

  const animation = spin
    ? "cn-icon-spin 1s linear infinite"
    : pulse
      ? "cn-icon-pulse 2s ease-in-out infinite"
      : undefined;

  return (
    <IconComponent
      ref={ref}
      className={className}
      onClick={onClick}
      style={style}
      {...accessibilityProps}
      sx={[
        {
          fontSize: sizePx,
          color: colorValue,
          flexShrink: 0,
          cursor: onClick ? "pointer" : undefined,
          transform: rotate !== 0 ? `rotate(${rotate}deg)` : undefined,
          animation,
          "@keyframes cn-icon-spin": {
            from: { transform: `rotate(${rotate}deg)` },
            to: { transform: `rotate(${rotate + 360}deg)` },
          },
          "@keyframes cn-icon-pulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.4 },
          },
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
});
