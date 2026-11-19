import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { HTMLAttributes, MouseEvent, ReactNode } from "react";
import { createContext, forwardRef, isValidElement, useContext, useId, useState } from "react";
import { CnAvatar } from "../CnAvatar";
import { CnButton } from "../CnButton";
import type { CnCardVariant } from "../CnCard";
import { CnCard } from "../CnCard";
import type { CnChipColor } from "../CnChip";
import { CnChip } from "../CnChip";
import { CnEmptyState } from "../CnEmptyState";
import { CnIcon } from "../CnIcon";
import type { CnTone } from "../CnInfoCard/tones";
import { CN_TONES, prefersReducedMotion } from "../CnInfoCard/tones";
import { CnSkeletonGroup, SkLines } from "../CnSkeleton";
import { CnSectionCardSkeleton } from "./CnSectionCardSkeleton";

export type CnSectionCardVariant = CnCardVariant;
export type CnSectionCardPadding = "none" | "sm" | "md" | "lg";

export type CnSectionCardBadge = {
  label: ReactNode;
  color?: CnChipColor;
  icon?: string;
};

export type CnSectionCardEmptyState = {
  title?: ReactNode;
  description?: ReactNode;
  icon?: string;
  action?: ReactNode;
};

export type CnSectionCardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Texto pequeño bajo el subtítulo (fecha de actualización, fuente…). */
  caption?: ReactNode;
  /** Ícono por nombre (`ICON_REGISTRY`) o nodo propio. */
  icon?: string | ReactNode;
  /** Tono del recuadro del ícono. */
  iconTone?: CnTone;
  avatar?: { src?: string; name?: string };
  /** Contador, texto o configuración de chip junto al título. */
  badge?: ReactNode | CnSectionCardBadge;
  headerActions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  hideHeader?: boolean;
  /** Nivel del encabezado (`h2`–`h6`). Por defecto `h3`, `h4` si está anidada. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;

  variant?: CnSectionCardVariant;
  padding?: CnSectionCardPadding;
  /** Franja superior de acento (tono o color CSS). */
  accent?: CnTone | string;
  /** Línea entre encabezado y cuerpo. */
  headerDivider?: boolean;

  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Desmonta el cuerpo al plegar (por defecto se conserva el estado). */
  unmountOnCollapse?: boolean;
  expandLabel?: string;
  collapseLabel?: string;

  /** Encabezado fijo al desplazar (opcionalmente con desplazamiento superior en px). */
  stickyHeader?: boolean | number;

  /** Cuerpo cargando (líneas de skeleton) manteniendo el encabezado. */
  loading?: boolean;
  loadingLines?: number;
  /** Skeleton completo de la sección. */
  skeleton?: boolean;
  empty?: boolean;
  emptyState?: CnSectionCardEmptyState;
  /** Error al cargar el contenido (`true` usa el mensaje por defecto). */
  error?: ReactNode | boolean;
  onRetry?: () => void;
  retryLabel?: string;

  /** Asa de arrastre (para secciones reordenables). */
  dragHandle?: boolean | ReactNode;
  dragHandleProps?: HTMLAttributes<HTMLElement>;
  /** Secciones repetibles: botón eliminar en el encabezado. */
  onRemove?: () => void;
  removeLabel?: string;
  /** Secciones repetibles: botón añadir en el pie. */
  onAdd?: () => void;
  addLabel?: string;
  readOnly?: boolean;

  id?: string;
  component?: "section" | "div" | "article" | "aside";
  headerSx?: SxProps<Theme>;
  bodySx?: SxProps<Theme>;
  footerSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
  className?: string;
};

const PADDING_PX: Record<CnSectionCardPadding, number> = { none: 0, sm: 12, md: 16, lg: 24 };

/** Profundidad de anidación (las secciones internas se ven más ligeras). */
const SectionDepthContext = createContext(0);

const isBadgeConfig = (value: unknown): value is CnSectionCardBadge =>
  Boolean(value) &&
  typeof value === "object" &&
  !isValidElement(value) &&
  "label" in (value as object);

const toSxArray = (sx: SxProps<Theme> | undefined) => (Array.isArray(sx) ? sx : sx ? [sx] : []);

/**
 * Contenedor de sección: encabezado (ícono, título, subtítulo, insignia y
 * acciones), cuerpo plegable animado, pie y estados de carga, vacío y error.
 * Admite secciones anidadas y encabezado fijo.
 */
export const CnSectionCard = forwardRef<HTMLDivElement, CnSectionCardProps>(function CnSectionCard(
  {
    title,
    subtitle,
    caption,
    icon,
    iconTone = "primary",
    avatar,
    badge,
    headerActions,
    footer,
    children,
    hideHeader = false,
    headingLevel,
    variant,
    padding,
    accent,
    headerDivider = true,
    collapsible = false,
    collapsed: collapsedProp,
    defaultCollapsed = false,
    onCollapsedChange,
    unmountOnCollapse = false,
    expandLabel = "Expandir sección",
    collapseLabel = "Contraer sección",
    stickyHeader = false,
    loading = false,
    loadingLines = 3,
    skeleton = false,
    empty = false,
    emptyState,
    error,
    onRetry,
    retryLabel = "Reintentar",
    dragHandle,
    dragHandleProps,
    onRemove,
    removeLabel = "Eliminar sección",
    onAdd,
    addLabel = "Añadir",
    readOnly = false,
    id,
    component = "section",
    headerSx,
    bodySx,
    footerSx,
    sx,
    className,
  },
  ref,
) {
  const depth = useContext(SectionDepthContext);
  const nested = depth > 0;
  const resolvedVariant = variant ?? (nested ? "filled" : "outlined");
  const resolvedPadding = padding ?? (nested ? "sm" : "md");
  const pad = PADDING_PX[resolvedPadding];
  const level = headingLevel ?? (Math.min(6, 3 + depth) as 3 | 4 | 5 | 6);
  const autoId = useId();
  const titleId = `${autoId}-title`;
  const bodyId = `${autoId}-body`;
  const [collapsedState, setCollapsedState] = useState(defaultCollapsed);
  const collapsed = collapsible && (collapsedProp ?? collapsedState);
  const reduced = prefersReducedMotion();

  if (skeleton) {
    return (
      <CnSectionCardSkeleton
        variant={resolvedVariant}
        padding={resolvedPadding}
        icon={Boolean(icon || avatar)}
        avatar={Boolean(avatar)}
        subtitle={Boolean(subtitle)}
        badge={Boolean(badge)}
        headerActions={(headerActions ? 1 : 0) + (collapsible ? 1 : 0)}
        lines={collapsed ? 0 : loadingLines}
        footer={Boolean(footer || onAdd)}
        hideHeader={hideHeader}
        accent={Boolean(accent)}
        sx={sx}
        className={className}
      />
    );
  }

  const toggle = () => {
    const next = !collapsed;
    if (collapsedProp === undefined) setCollapsedState(next);
    onCollapsedChange?.(next);
  };

  const handleHeaderClick = (event: MouseEvent<HTMLElement>) => {
    if (!collapsible) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea, [role='button'], [data-cn-no-toggle]"))
      return;
    toggle();
  };

  const accentColor = accent
    ? accent in CN_TONES
      ? CN_TONES[accent as CnTone].main
      : accent
    : undefined;
  const tone = CN_TONES[iconTone];
  const stickyTop = typeof stickyHeader === "number" ? stickyHeader : 0;

  const iconNode = avatar ? (
    <CnAvatar src={avatar.src} name={avatar.name} size={nested ? "sm" : "md"} />
  ) : icon ? (
    <Box
      aria-hidden
      sx={{
        width: nested ? 28 : 34,
        height: nested ? 28 : 34,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        borderRadius: "var(--cn-radius-md, 8px)",
        backgroundColor: tone.soft,
        color: tone.main,
      }}
    >
      {typeof icon === "string" ? (
        <CnIcon name={icon} size={nested ? 16 : 20} color="inherit" aria-hidden />
      ) : (
        icon
      )}
    </Box>
  ) : null;

  const badgeNode =
    badge === undefined || badge === null || badge === false ? null : isBadgeConfig(badge) ? (
      <CnChip
        label={badge.label}
        color={badge.color ?? "neutral"}
        icon={badge.icon}
        variant="soft"
        size="small"
      />
    ) : typeof badge === "string" || typeof badge === "number" ? (
      <CnChip label={badge} color="neutral" variant="soft" size="small" />
    ) : (
      badge
    );

  const dragNode =
    dragHandle && !readOnly ? (
      <Box
        data-cn-section-drag-handle
        data-cn-no-toggle
        aria-label="Arrastrar para reordenar"
        {...dragHandleProps}
        sx={{
          display: "grid",
          placeItems: "center",
          color: "var(--cn-color-text-subtle, #9aa1aa)",
          cursor: "grab",
          mr: "-4px",
          "&:active": { cursor: "grabbing" },
        }}
      >
        {dragHandle === true ? (
          <CnIcon name="drag_indicator" size={18} color="inherit" />
        ) : (
          dragHandle
        )}
      </Box>
    ) : null;

  const hasBody = Boolean(children) || loading || empty || Boolean(error);
  const hasFooter = Boolean(footer) || (Boolean(onAdd) && !readOnly);

  const header = !hideHeader && (
    <Box
      data-cn-section-header
      onClick={handleHeaderClick}
      sx={[
        {
          display: "flex",
          alignItems: "center",
          gap: "12px",
          px: `${pad}px`,
          py: `${Math.max(pad - 2, 8)}px`,
          minWidth: 0,
          cursor: collapsible ? "pointer" : undefined,
          borderBottom:
            headerDivider && hasBody && !collapsed
              ? "1px solid var(--cn-color-border-subtle, #e9ecef)"
              : "1px solid transparent",
          transition: reduced ? "none" : "border-color 160ms ease",
          ...(stickyHeader && {
            position: "sticky",
            top: stickyTop,
            zIndex: 2,
            backgroundColor:
              resolvedVariant === "filled"
                ? "var(--cn-color-neutral-100, #f4f5f7)"
                : "var(--cn-color-surface, #ffffff)",
            borderTopLeftRadius: "inherit",
            borderTopRightRadius: "inherit",
          }),
        },
        ...toSxArray(headerSx),
      ]}
    >
      {dragNode}
      {iconNode}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          {title && (
            <Typography
              id={titleId}
              component={`h${level}` as "h3"}
              sx={{
                m: 0,
                fontSize: nested
                  ? "var(--cn-font-size-sm, 12px)"
                  : "var(--cn-font-size-base, 14px)",
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
          {badgeNode}
        </Box>
        {subtitle && (
          <Typography
            component="div"
            sx={{
              fontSize: nested ? "var(--cn-font-size-xs, 11px)" : "var(--cn-font-size-sm, 12px)",
              color: "var(--cn-color-text-muted, #6e7682)",
              lineHeight: 1.45,
              mt: "2px",
            }}
          >
            {subtitle}
          </Typography>
        )}
        {caption && (
          <Typography
            component="div"
            sx={{
              fontSize: "var(--cn-font-size-xs, 11px)",
              color: "var(--cn-color-text-subtle, #9aa1aa)",
              lineHeight: 1.4,
              mt: "2px",
            }}
          >
            {caption}
          </Typography>
        )}
      </Box>
      {(headerActions || (onRemove && !readOnly) || collapsible) && (
        <Box
          data-cn-section-actions
          sx={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
        >
          {headerActions}
          {onRemove && !readOnly && (
            <CnButton
              iconOnly
              icon="delete_outline"
              size="small"
              variant="text"
              color="error"
              aria-label={removeLabel}
              onClick={onRemove}
            />
          )}
          {collapsible && (
            <CnButton
              iconOnly
              size="small"
              variant="text"
              color="neutral"
              aria-label={collapsed ? expandLabel : collapseLabel}
              aria-expanded={!collapsed}
              aria-controls={bodyId}
              onClick={toggle}
              icon={
                <CnIcon
                  name="expand_more"
                  size={20}
                  color="inherit"
                  sx={{
                    transition: reduced ? "none" : "transform 200ms ease",
                    transform: collapsed ? "rotate(-90deg)" : "none",
                  }}
                />
              }
            />
          )}
        </Box>
      )}
    </Box>
  );

  let content: ReactNode = children;
  if (loading) {
    content = (
      <CnSkeletonGroup name="section-body" ariaLabel="Cargando contenido">
        <SkLines lines={loadingLines} size={12} />
      </CnSkeletonGroup>
    );
  } else if (error) {
    content = (
      <CnEmptyState
        variant="compact"
        size="sm"
        color="error"
        role="alert"
        icon="error_outline"
        title={error === true ? "No se pudo cargar el contenido" : error}
        action={
          onRetry ? (
            <CnButton
              size="small"
              variant="outlined"
              color="error"
              startIcon="refresh"
              onClick={onRetry}
            >
              {retryLabel}
            </CnButton>
          ) : undefined
        }
      />
    );
  } else if (empty) {
    content = (
      <CnEmptyState
        variant="compact"
        size="sm"
        icon={emptyState?.icon ?? "inbox"}
        title={emptyState?.title ?? "Sin contenido"}
        description={emptyState?.description}
        action={emptyState?.action}
      />
    );
  }

  const body = hasBody && (
    <Collapse
      in={!collapsed}
      timeout={reduced ? 0 : "auto"}
      unmountOnExit={unmountOnCollapse}
      id={bodyId}
    >
      <Box data-cn-section-body sx={[{ p: `${pad}px` }, ...toSxArray(bodySx)]}>
        <SectionDepthContext.Provider value={depth + 1}>{content}</SectionDepthContext.Provider>
      </Box>
    </Collapse>
  );

  const foot = hasFooter && !collapsed && (
    <Box
      data-cn-section-footer
      sx={[
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: "8px",
          px: `${pad}px`,
          py: `${Math.max(pad - 4, 8)}px`,
          borderTop: "1px solid var(--cn-color-border-subtle, #e9ecef)",
        },
        ...toSxArray(footerSx),
      ]}
    >
      {onAdd && !readOnly && (
        <CnButton size="small" variant="text" startIcon="add" onClick={onAdd} sx={{ mr: "auto" }}>
          {addLabel}
        </CnButton>
      )}
      {footer}
    </Box>
  );

  return (
    <CnCard
      ref={ref}
      component={component}
      variant={resolvedVariant}
      padding="none"
      accentColor={accentColor}
      accentPosition="top"
      className={className}
      ariaLabelledBy={title && !hideHeader ? titleId : undefined}
      cardProps={{ id, "data-cn-section-depth": depth } as Record<string, unknown>}
      sx={[{ height: "auto", ...(stickyHeader && { overflow: "visible" }) }, ...toSxArray(sx)]}
    >
      {header}
      {body}
      {foot}
    </CnCard>
  );
});
