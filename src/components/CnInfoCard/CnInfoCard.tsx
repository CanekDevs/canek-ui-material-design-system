import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEvent, ReactNode } from "react";
import { forwardRef, isValidElement, useId, useState } from "react";
import { CnButton } from "../CnButton";
import { CnCard } from "../CnCard";
import type { CnChipColor } from "../CnChip";
import { CnChip } from "../CnChip";
import { CnIcon } from "../CnIcon";
import { CnInfoCardSkeleton } from "./CnInfoCardSkeleton";
import type { CnTone } from "./tones";
import { CN_TONE_ICONS, CN_TONES, prefersReducedMotion } from "./tones";

export type CnInfoCardTone = CnTone;
export type CnInfoCardVariant = "soft" | "outlined" | "filled" | "left-accent" | "elevated";
export type CnInfoCardSize = "sm" | "md" | "lg";
export type CnInfoCardLayout = "horizontal" | "vertical";

export type CnInfoCardAction = {
  label: ReactNode;
  onClick?: () => void;
  href?: string;
  target?: "_blank" | "_self";
  /** Nombre de ícono (`ICON_REGISTRY`) al inicio del botón. */
  icon?: string;
  /** `link` = botón de texto compacto, para enlaces tipo "Más información". */
  variant?: "contained" | "outlined" | "text" | "link";
  disabled?: boolean;
  "aria-label"?: string;
};

export type CnInfoCardBadge = {
  label: ReactNode;
  color?: CnChipColor;
  icon?: string;
  variant?: "soft" | "filled" | "outlined";
};

export type CnInfoCardProps = {
  /** Tono semántico (color del ícono, fondo y acentos). */
  tone?: CnInfoCardTone;
  variant?: CnInfoCardVariant;
  size?: CnInfoCardSize;
  /** `horizontal`: ícono a un lado. `vertical`: ícono arriba (tarjetas tipo "feature"). */
  layout?: CnInfoCardLayout;
  textAlign?: "left" | "center";

  /** Ícono por nombre, nodo propio o `false` para ocultarlo. Por defecto, el del tono. */
  icon?: string | ReactNode | false;
  iconPosition?: "start" | "end";

  /** Texto pequeño sobre el título (categoría, etiqueta del dato). */
  label?: ReactNode;
  title?: ReactNode;
  /** Valor destacado (modo dato: `label` + `value`, como TbInfoCard). */
  value?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  badge?: ReactNode | CnInfoCardBadge;

  actions?: ReactNode | CnInfoCardAction[];

  /** Muestra el botón de cerrar. */
  dismissible?: boolean;
  onDismiss?: () => void;
  dismissLabel?: string;
  /** Visibilidad controlada (si se omite, la tarjeta se oculta sola al cerrarla). */
  open?: boolean;

  /** Contenido plegable bajo la descripción. */
  details?: ReactNode;
  detailsLabel?: string;
  hideDetailsLabel?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;

  /** Imagen o ilustración. */
  media?: ReactNode;
  mediaPosition?: "top" | "start" | "end";

  onClick?: () => void;
  href?: string;
  target?: "_blank" | "_self";
  disabled?: boolean;

  /** Rol ARIA del contenedor. `alert` solo para avisos que deben anunciarse al aparecer. */
  role?: "note" | "status" | "alert" | "region" | "none";
  minHeight?: number | string;
  /** Muestra el skeleton de la tarjeta (mismas variantes). */
  loading?: boolean;
  /** Alias de `loading`. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const SIZE_TOKENS: Record<
  CnInfoCardSize,
  {
    padding: "sm" | "md" | "lg";
    iconBox: number;
    icon: number;
    title: string;
    value: string;
    text: string;
    label: string;
    gap: number;
  }
> = {
  sm: {
    padding: "sm",
    iconBox: 28,
    icon: 16,
    title: "var(--cn-font-size-sm, 12px)",
    value: "var(--cn-font-size-base, 14px)",
    text: "var(--cn-font-size-xs, 11px)",
    label: "10px",
    gap: 10,
  },
  md: {
    padding: "md",
    iconBox: 34,
    icon: 20,
    title: "var(--cn-font-size-base, 13px)",
    value: "var(--cn-font-size-lg, 16px)",
    text: "var(--cn-font-size-sm, 12px)",
    label: "10.5px",
    gap: 12,
  },
  lg: {
    padding: "lg",
    iconBox: 42,
    icon: 24,
    title: "var(--cn-font-size-lg, 16px)",
    value: "var(--cn-font-size-xl, 20px)",
    text: "var(--cn-font-size-base, 13px)",
    label: "11px",
    gap: 14,
  },
};

const isBadgeConfig = (value: unknown): value is CnInfoCardBadge =>
  Boolean(value) &&
  typeof value === "object" &&
  !isValidElement(value) &&
  "label" in (value as object);

const stop = (event: MouseEvent) => event.stopPropagation();

/**
 * Tarjeta informativa / callout: ícono con tono, título, descripción, acciones,
 * detalles plegables, medio y cierre. También cubre el modo "dato" (`label` +
 * `value`) de TbInfoCard.
 */
export const CnInfoCard = forwardRef<HTMLDivElement, CnInfoCardProps>(function CnInfoCard(
  {
    tone = "info",
    variant = "soft",
    size = "md",
    layout = "horizontal",
    textAlign,
    icon,
    iconPosition = "start",
    label,
    title,
    value,
    description,
    children,
    badge,
    actions,
    dismissible = false,
    onDismiss,
    dismissLabel = "Cerrar",
    open,
    details,
    detailsLabel = "Ver detalles",
    hideDetailsLabel = "Ocultar detalles",
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    media,
    mediaPosition = "top",
    onClick,
    href,
    target,
    disabled = false,
    role = "note",
    minHeight,
    loading = false,
    skeleton = false,
    sx,
    className,
  },
  ref,
) {
  const tokens = SIZE_TOKENS[size];
  const palette = CN_TONES[tone];
  const detailsId = useId();
  const titleId = useId();
  const [dismissed, setDismissed] = useState(false);
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const expanded = expandedProp ?? expandedState;
  const visible = open ?? !dismissed;
  const reduced = prefersReducedMotion();
  const isFilled = variant === "filled";
  const align = textAlign ?? (layout === "vertical" ? "center" : "left");
  const centered = align === "center";

  const resolvedIcon = icon === false ? null : (icon ?? CN_TONE_ICONS[tone]);
  const hasActions = Array.isArray(actions) ? actions.length > 0 : Boolean(actions);

  if (loading || skeleton) {
    return (
      <CnInfoCardSkeleton
        variant={variant}
        size={size}
        layout={layout}
        textAlign={align}
        icon={Boolean(resolvedIcon)}
        iconPosition={iconPosition}
        label={Boolean(label)}
        title={Boolean(title)}
        value={value !== undefined && value !== null}
        lines={description ? 2 : 0}
        actions={Array.isArray(actions) ? actions.length : actions ? 1 : 0}
        dismissible={dismissible}
        media={Boolean(media)}
        mediaPosition={mediaPosition}
        sx={[{ minHeight }, ...(Array.isArray(sx) ? sx : [sx])]}
        className={className}
      />
    );
  }

  const toggleDetails = () => {
    const next = !expanded;
    if (expandedProp === undefined) setExpandedState(next);
    onExpandedChange?.(next);
  };

  const handleDismiss = (event: MouseEvent) => {
    event.stopPropagation();
    if (open === undefined) setDismissed(true);
    onDismiss?.();
  };

  const textColor = isFilled ? palette.onSolid : "var(--cn-color-text, #222831)";
  const mutedColor = isFilled ? "rgba(255, 255, 255, 0.82)" : "var(--cn-color-text-muted, #6e7682)";

  const iconNode = resolvedIcon ? (
    <Box
      data-cn-info-card-icon
      aria-hidden
      sx={{
        width: tokens.iconBox,
        height: tokens.iconBox,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: "var(--cn-radius-md, 8px)",
        color: isFilled ? palette.onSolid : palette.main,
        backgroundColor: isFilled
          ? "rgba(255, 255, 255, 0.18)"
          : variant === "soft"
            ? palette.softHover
            : palette.soft,
        ...(centered && layout === "vertical" && { mx: "auto" }),
      }}
    >
      {typeof resolvedIcon === "string" ? (
        <CnIcon name={resolvedIcon} size={tokens.icon} color="inherit" aria-hidden />
      ) : (
        resolvedIcon
      )}
    </Box>
  ) : null;

  const badgeNode = badge ? (
    isBadgeConfig(badge) ? (
      <CnChip
        label={badge.label}
        icon={badge.icon}
        color={badge.color ?? (tone === "neutral" ? "neutral" : tone)}
        variant={
          badge.variant === "filled" ? "filled" : badge.variant === "outlined" ? "outlined" : "soft"
        }
        size="small"
        sx={isFilled ? { backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" } : undefined}
      />
    ) : (
      badge
    )
  ) : null;

  const actionNodes = Array.isArray(actions)
    ? actions.map((action, index) => {
        const isLink = action.variant === "link";
        const buttonVariant: "contained" | "outlined" | "text" =
          action.variant === undefined || action.variant === "link"
            ? isLink || index > 0
              ? "text"
              : "contained"
            : action.variant;
        return (
          <CnButton
            key={index}
            size="small"
            variant={buttonVariant}
            color={tone === "neutral" ? "neutral" : tone}
            startIcon={action.icon}
            href={action.href}
            target={action.target}
            rel={action.target === "_blank" ? "noopener noreferrer" : undefined}
            disabled={action.disabled}
            aria-label={action["aria-label"]}
            onClick={(event) => {
              event.stopPropagation();
              action.onClick?.();
            }}
            sx={[
              isLink ? { px: "4px", minWidth: 0, textDecoration: "underline" } : {},
              isFilled
                ? buttonVariant === "contained"
                  ? {
                      backgroundColor: "#fff",
                      color: palette.solid,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                    }
                  : { color: palette.onSolid, borderColor: "rgba(255,255,255,0.6)" }
                : {},
            ]}
          >
            {action.label}
          </CnButton>
        );
      })
    : actions;

  const textBlock = (
    <Box sx={{ flex: 1, minWidth: 0, textAlign: align }}>
      {(label || badgeNode) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: centered ? "center" : "space-between",
            gap: "8px",
            mb: title || value !== undefined ? "4px" : 0,
          }}
        >
          {label && (
            <Typography
              component="div"
              sx={{
                fontSize: tokens.label,
                fontWeight: "var(--cn-font-weight-semibold, 600)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: mutedColor,
                lineHeight: 1.3,
              }}
            >
              {label}
            </Typography>
          )}
          {badgeNode}
        </Box>
      )}
      {title && (
        <Typography
          id={titleId}
          component="div"
          sx={{
            fontSize: tokens.title,
            fontWeight: "var(--cn-font-weight-bold, 700)",
            color: isFilled ? palette.onSolid : variant === "soft" ? palette.text : textColor,
            lineHeight: 1.35,
          }}
        >
          {title}
        </Typography>
      )}
      {value !== undefined && value !== null && (
        <Typography
          component="div"
          data-cn-info-card-value
          sx={{
            fontSize: tokens.value,
            fontWeight: "var(--cn-font-weight-semibold, 600)",
            color: textColor,
            lineHeight: 1.3,
            mt: title ? "4px" : 0,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </Typography>
      )}
      {description && (
        <Typography
          component="div"
          sx={{
            fontSize: tokens.text,
            color: mutedColor,
            lineHeight: 1.55,
            mt: title || value !== undefined ? "4px" : 0,
          }}
        >
          {description}
        </Typography>
      )}
      {children && <Box sx={{ mt: "8px", color: textColor }}>{children}</Box>}
      {details && (
        <>
          <Collapse in={expanded} timeout={reduced ? 0 : "auto"} unmountOnExit>
            <Box
              id={detailsId}
              data-cn-info-card-details
              sx={{ mt: "8px", fontSize: tokens.text, color: textColor, lineHeight: 1.55 }}
            >
              {details}
            </Box>
          </Collapse>
          <Box
            sx={{ mt: "6px", display: "flex", justifyContent: centered ? "center" : "flex-start" }}
          >
            <CnButton
              size="small"
              variant="text"
              color={tone === "neutral" ? "neutral" : tone}
              endIcon={
                <CnIcon
                  name="expand_more"
                  size={16}
                  color="inherit"
                  sx={{
                    transition: reduced ? "none" : "transform 160ms ease",
                    transform: expanded ? "rotate(180deg)" : "none",
                  }}
                />
              }
              aria-expanded={expanded}
              aria-controls={expanded ? detailsId : undefined}
              onClick={(event) => {
                event.stopPropagation();
                toggleDetails();
              }}
              sx={{ px: "4px", minWidth: 0, ...(isFilled && { color: palette.onSolid }) }}
            >
              {expanded ? hideDetailsLabel : detailsLabel}
            </CnButton>
          </Box>
        </>
      )}
      {hasActions && (
        <Box
          data-cn-info-card-actions
          onClick={stop}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: centered ? "center" : "flex-start",
            gap: "8px",
            mt: tokens.gap === 10 ? "10px" : "12px",
          }}
        >
          {actionNodes}
        </Box>
      )}
    </Box>
  );

  const dismissButton = dismissible ? (
    <CnButton
      iconOnly
      icon="close"
      size="small"
      variant="text"
      color="neutral"
      aria-label={dismissLabel}
      onClick={handleDismiss}
      sx={{
        flexShrink: 0,
        mt: "-4px",
        mr: "-6px",
        ...(isFilled && { color: palette.onSolid }),
        ...(layout === "vertical" && { position: "absolute", top: 8, right: 8, m: 0 }),
      }}
    />
  ) : null;

  const mediaOnTop = mediaPosition === "top" || layout === "vertical";
  const mediaNode = media ? (
    <Box
      data-cn-info-card-media
      sx={
        mediaOnTop
          ? {
              mb: `${tokens.gap}px`,
              borderRadius: "var(--cn-radius-md, 8px)",
              overflow: "hidden",
              "& > img, & > video": { width: "100%", display: "block", objectFit: "cover" },
            }
          : {
              flexShrink: 0,
              width: { xs: 72, sm: 112 },
              alignSelf: "stretch",
              borderRadius: "var(--cn-radius-md, 8px)",
              overflow: "hidden",
              "& > img": { width: "100%", height: "100%", display: "block", objectFit: "cover" },
            }
      }
    >
      {media}
    </Box>
  ) : null;

  const body =
    layout === "vertical" ? (
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.gap}px`,
        }}
      >
        {iconNode}
        {textBlock}
        {dismissButton}
      </Box>
    ) : (
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: `${tokens.gap}px` }}>
        {!mediaOnTop && mediaPosition === "start" && mediaNode}
        {iconPosition === "start" && iconNode}
        {textBlock}
        {iconPosition === "end" && iconNode}
        {!mediaOnTop && mediaPosition === "end" && mediaNode}
        {dismissButton}
      </Box>
    );

  const surfaceSx: Record<string, unknown> = {
    soft: { backgroundColor: palette.soft, border: `1px solid ${palette.border}` },
    outlined: { backgroundColor: "var(--cn-color-surface, #ffffff)", borderColor: palette.border },
    filled: { backgroundColor: palette.solid, color: palette.onSolid },
    "left-accent": {
      backgroundColor: "var(--cn-color-surface, #ffffff)",
      borderLeft: `4px solid ${palette.main}`,
    },
    elevated: {},
  }[variant];

  const card = (
    <CnCard
      ref={ref}
      variant={
        variant === "outlined" || variant === "left-accent"
          ? "outlined"
          : variant === "elevated"
            ? "elevated"
            : "ghost"
      }
      padding={tokens.padding}
      interactive={Boolean(onClick || href)}
      onClick={onClick}
      href={href}
      target={target}
      disabled={disabled}
      className={className}
      ariaLabelledBy={title && !onClick && !href ? titleId : undefined}
      cardProps={(onClick || href || role === "none" ? {} : { role }) as Record<string, unknown>}
      sx={[
        { minHeight, height: "auto", color: textColor },
        surfaceSx,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {mediaOnTop && mediaNode}
      {body}
    </CnCard>
  );

  if (!dismissible && open === undefined) return card;
  return (
    <Collapse in={visible} timeout={reduced ? 0 : "auto"} unmountOnExit appear={false}>
      {card}
    </Collapse>
  );
});
