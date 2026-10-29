import type { AvatarProps } from "@mui/material/Avatar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { KeyboardEvent, ReactNode } from "react";
import { forwardRef, useEffect, useState } from "react";
import { CnIcon } from "../CnIcon";

export type CnAvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type CnAvatarVariant = "circular" | "rounded" | "square";
export type CnAvatarColor =
  "primary" | "secondary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";
export type CnAvatarStatus = "online" | "offline" | "busy" | "away";
export type CnAvatarBadgeColor =
  "primary" | "secondary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";

export type CnAvatarBadge = {
  content: ReactNode;
  color?: CnAvatarBadgeColor;
  invisible?: boolean;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "right";
  };
};

export type CnAvatarProps = Omit<
  AvatarProps,
  "variant" | "src" | "alt" | "children" | "onClick" | "sx" | "className"
> & {
  src?: string;
  fallbackSrc?: string;
  alt?: string;
  name?: string;
  initials?: string;
  icon?: string;
  children?: ReactNode;

  size?: CnAvatarSize | number;
  variant?: CnAvatarVariant;
  color?: CnAvatarColor;
  status?: CnAvatarStatus;

  badge?: CnAvatarBadge;
  bordered?: boolean;
  borderColor?: string;

  clickable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  target?: "_blank" | "_self";

  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

const SIZE_MAP: Record<CnAvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  "2xl": 80,
};

const COLOR_MAP: Record<CnAvatarColor, { bg: string; fg: string }> = {
  primary: {
    bg: "var(--cn-color-brand-600, #254d87)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
  },
  secondary: {
    bg: "var(--cn-color-neutral-700, #363d45)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
  },
  success: {
    bg: "var(--cn-color-success-600, #228740)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
  },
  warning: {
    bg: "var(--cn-color-warning-600, #b8831a)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
  },
  error: {
    bg: "var(--cn-color-error-600, #b52f2f)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
  },
  info: {
    bg: "var(--cn-color-info-600, #2367a8)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
  },
  accent: {
    bg: "var(--cn-color-accent-500, #3d5afe)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
  },
  neutral: {
    bg: "var(--cn-color-neutral-500, #6e7682)",
    fg: "var(--cn-color-neutral-0, #ffffff)",
  },
};

const STATUS_MAP: Record<CnAvatarStatus, string> = {
  online: "var(--cn-color-success-500, #2e9e4f)",
  offline: "var(--cn-color-neutral-400, #9aa1aa)",
  busy: "var(--cn-color-error-500, #d63c3c)",
  away: "var(--cn-color-warning-500, #e0a020)",
};

const BADGE_COLOR_MAP: Record<CnAvatarBadgeColor, string> = {
  primary: "var(--cn-color-brand-600, #254d87)",
  secondary: "var(--cn-color-neutral-700, #363d45)",
  success: "var(--cn-color-success-600, #228740)",
  warning: "var(--cn-color-warning-600, #b8831a)",
  error: "var(--cn-color-error-600, #b52f2f)",
  info: "var(--cn-color-info-600, #2367a8)",
  accent: "var(--cn-color-accent-500, #3d5afe)",
  neutral: "var(--cn-color-neutral-600, #4e5660)",
};

const resolveSize = (size: CnAvatarSize | number): number =>
  typeof size === "number" ? size : SIZE_MAP[size];

const clampFontSize = (size: number): number => Math.max(10, Math.min(32, Math.round(size * 0.4)));

const clampIconSize = (size: number): number => Math.max(12, Math.min(40, Math.round(size * 0.55)));

function getInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

export const CnAvatar = forwardRef<HTMLDivElement, CnAvatarProps>(function CnAvatar(
  {
    src,
    fallbackSrc,
    alt,
    name,
    initials,
    icon,
    children,

    size = "md",
    variant = "circular",
    color = "primary",
    status,

    badge,
    bordered = false,
    borderColor,

    clickable = false,
    disabled = false,
    onClick,
    href,
    target = "_self",

    ariaLabel,
    sx,
    className,
    ...rest
  },
  ref,
) {
  const sizePx = resolveSize(size);
  const colorTokens = COLOR_MAP[color];
  const isLink = Boolean(href);
  const isInteractive = !disabled && (clickable || Boolean(onClick) || isLink);

  const [imgState, setImgState] = useState<"primary" | "fallback" | "failed">("primary");

  useEffect(() => {
    setImgState("primary");
  }, [src, fallbackSrc]);

  const handleImageError = () => {
    if (imgState === "primary" && fallbackSrc && fallbackSrc !== src) {
      setImgState("fallback");
      return;
    }
    setImgState("failed");
  };

  const resolvedSrc =
    imgState === "primary" ? src : imgState === "fallback" ? fallbackSrc : undefined;

  const fallbackInitials = initials ?? (name ? getInitialsFromName(name) : "");
  const fallbackContent: ReactNode = fallbackInitials ? (
    fallbackInitials
  ) : icon ? (
    <CnIcon name={icon} size={clampIconSize(sizePx)} color="inherit" aria-hidden />
  ) : (
    (children ?? <CnIcon name="person" size={clampIconSize(sizePx)} color="inherit" aria-hidden />)
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive || isLink) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  const statusSize = Math.max(8, Math.round(sizePx * 0.28));

  const avatarSx: SxProps<Theme> = [
    {
      width: sizePx,
      height: sizePx,
      fontSize: clampFontSize(sizePx),
      fontWeight: "var(--cn-font-weight-bold, 700)",
      backgroundColor: resolvedSrc ? undefined : colorTokens.bg,
      color: resolvedSrc ? undefined : colorTokens.fg,
      fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
      transition:
        "opacity var(--cn-duration-fast, 140ms) var(--cn-ease-standard, ease), transform var(--cn-duration-fast, 140ms) var(--cn-ease-standard, ease)",
      "& img": {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      },
      ...(bordered && {
        boxShadow: `0 0 0 2px ${borderColor ?? "var(--cn-color-surface, #ffffff)"}`,
      }),
      ...(isInteractive && {
        cursor: "pointer",
        "&:hover": {
          opacity: 0.88,
          transform: "scale(1.02)",
        },
        "&:active": {
          transform: "scale(0.98)",
        },
        "&:focus-visible": {
          outline: "none",
          boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(80, 129, 196, 0.35))",
        },
      }),
      ...(disabled && {
        opacity: 0.5,
        cursor: "not-allowed",
        pointerEvents: "none",
      }),
    },
    ...(Array.isArray(sx) ? sx : [sx]),
  ];

  const avatarNode = (
    <Avatar
      ref={ref}
      component={isLink ? "a" : "span"}
      {...(isLink && {
        href,
        target,
        rel: target === "_blank" ? "noopener noreferrer" : undefined,
      })}
      src={resolvedSrc}
      alt={alt ?? name ?? "avatar"}
      variant={variant}
      imgProps={{ onError: handleImageError }}
      onClick={isInteractive && !isLink ? onClick : undefined}
      onKeyDown={isInteractive && !isLink ? handleKeyDown : undefined}
      role={isInteractive && !isLink ? "button" : undefined}
      tabIndex={isInteractive && !isLink ? 0 : undefined}
      aria-label={ariaLabel ?? (isInteractive && !alt && !name ? "Avatar" : undefined)}
      aria-disabled={disabled || undefined}
      className={className}
      sx={avatarSx}
      {...rest}
    >
      {fallbackContent}
    </Avatar>
  );

  const withStatus = status ? (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {avatarNode}
      <Box
        aria-hidden="true"
        data-cn-avatar-status={status}
        sx={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: statusSize,
          height: statusSize,
          borderRadius: "50%",
          backgroundColor: STATUS_MAP[status],
          boxShadow: "0 0 0 2px var(--cn-color-surface, #ffffff)",
          pointerEvents: "none",
        }}
      />
    </Box>
  ) : (
    avatarNode
  );

  if (badge) {
    return (
      <Badge
        badgeContent={badge.content}
        invisible={badge.invisible}
        anchorOrigin={badge.anchorOrigin ?? { vertical: "top", horizontal: "right" }}
        overlap="circular"
        sx={{
          "& .MuiBadge-badge": {
            backgroundColor: badge.color ? BADGE_COLOR_MAP[badge.color] : BADGE_COLOR_MAP.error,
            color: "var(--cn-color-neutral-0, #ffffff)",
            fontSize: Math.max(9, Math.round(sizePx * 0.26)),
            fontWeight: "var(--cn-font-weight-bold, 700)",
            height: statusSize + 4,
            minWidth: statusSize + 4,
            padding: "0 4px",
            boxShadow: "0 0 0 2px var(--cn-color-surface, #ffffff)",
          },
        }}
      >
        {withStatus}
      </Badge>
    );
  }

  return withStatus;
});
