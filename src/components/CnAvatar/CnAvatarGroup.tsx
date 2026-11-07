import type { AvatarGroupProps } from "@mui/material/AvatarGroup";
import AvatarGroup from "@mui/material/AvatarGroup";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { Children, forwardRef } from "react";
import type { CnAvatarSize, CnAvatarVariant } from "./CnAvatar";
import { CnAvatarGroupSkeleton } from "./CnAvatarSkeleton";

export type CnAvatarGroupSpacing = "tight" | "normal" | "loose" | number;

export type CnAvatarGroupProps = Omit<
  AvatarGroupProps,
  "variant" | "spacing" | "sx" | "children" | "max" | "total" | "renderSurplus"
> & {
  children: ReactNode;
  max?: number;
  total?: number;
  spacing?: CnAvatarGroupSpacing;
  variant?: CnAvatarVariant;
  size?: CnAvatarSize | number;
  renderSurplus?: (surplus: number) => ReactNode;
  /** Muestra el skeleton del grupo (mismo número, tamaño, forma y superposición). */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
};

const SIZE_MAP: Record<CnAvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  "2xl": 80,
};

const SPACING_MAP: Record<"tight" | "normal" | "loose", number> = {
  tight: -12,
  normal: -8,
  loose: -4,
};

const resolveSize = (size: CnAvatarSize | number): number =>
  typeof size === "number" ? size : SIZE_MAP[size];

const resolveSpacing = (spacing: CnAvatarGroupSpacing): number =>
  typeof spacing === "number" ? spacing : SPACING_MAP[spacing];

const clampFontSize = (size: number): number => Math.max(9, Math.min(28, Math.round(size * 0.35)));

export const CnAvatarGroup = forwardRef<HTMLDivElement, CnAvatarGroupProps>(function CnAvatarGroup(
  {
    children,
    max = 4,
    total,
    spacing = "normal",
    variant = "circular",
    size = "md",
    renderSurplus,
    skeleton = false,
    sx,
    ...rest
  },
  ref,
) {
  if (skeleton) {
    return (
      <CnAvatarGroupSkeleton
        count={Children.toArray(children).length}
        max={max}
        total={total}
        spacing={spacing}
        variant={variant}
        size={size}
        sx={sx}
        className={rest.className}
      />
    );
  }

  const sizePx = resolveSize(size);
  const spacingPx = resolveSpacing(spacing);
  const fontSize = clampFontSize(sizePx);

  return (
    <AvatarGroup
      ref={ref}
      max={max}
      total={total}
      spacing={spacingPx}
      renderSurplus={renderSurplus}
      sx={[
        {
          "& .MuiAvatar-root": {
            width: sizePx,
            height: sizePx,
            fontSize,
            fontWeight: "var(--cn-font-weight-bold, 700)",
            fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
            border: "2px solid var(--cn-color-surface, #ffffff)",
            backgroundColor: "var(--cn-color-neutral-500, #6e7682)",
            color: "var(--cn-color-neutral-0, #ffffff)",
            transition: "transform var(--cn-duration-fast, 140ms) var(--cn-ease-standard, ease)",
            "&:hover": {
              transform: "translateY(-2px)",
              zIndex: 2,
            },
          },
          "& .MuiAvatarGroup-root": {
            "& .MuiAvatar-root": {
              borderRadius:
                variant === "circular"
                  ? "50%"
                  : variant === "rounded"
                    ? "var(--cn-radius-md, 8px)"
                    : "0",
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {children}
    </AvatarGroup>
  );
});
