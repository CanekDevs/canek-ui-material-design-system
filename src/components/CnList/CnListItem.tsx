import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import type {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  SyntheticEvent,
} from "react";
import { forwardRef, Fragment, isValidElement, useRef, useState } from "react";
import { CnAvatar } from "../CnAvatar";
import { CnChip } from "../CnChip";
import { CnIcon } from "../CnIcon";
import type {
  CnListAvatar,
  CnListBadge,
  CnListColor,
  CnListDensity,
  CnListIcon,
  CnListSize,
  CnListStatus,
  CnListTone,
  CnListVariant,
} from "./CnList.types";
import { CnListSkeleton } from "./CnListSkeleton";
import {
  COLOR_TOKENS,
  DENSITY_PADDING,
  formatFullDate,
  formatRelativeTime,
  highlightText,
  isListColor,
  SIZE_TOKENS,
  TONE_TOKENS,
} from "./list-utils";

/** Acción ya ligada a un elemento (lo que recibe `CnListItem`). */
export type CnListItemAction = {
  id: string;
  label: string;
  icon?: string;
  color?: "default" | "primary" | "success" | "warning" | "error";
  inline?: boolean;
  divider?: boolean;
  disabled?: boolean;
  tooltip?: string;
  onClick: () => void;
};

export type CnListItemSwipe = {
  label: string;
  icon?: string;
  color?: CnListColor;
  onTrigger: () => void;
};

export type CnListItemProps = Omit<HTMLAttributes<HTMLDivElement>, "title" | "color"> & {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  avatar?: CnListAvatar;
  icon?: CnListIcon;
  leading?: ReactNode;
  meta?: ReactNode;
  timestamp?: Date | string | number;
  status?: CnListStatus;
  badge?: CnListBadge;
  trailing?: ReactNode;
  chevron?: boolean;
  tone?: CnListTone;
  unread?: boolean;
  disabled?: boolean;
  href?: string;
  target?: "_blank" | "_self";

  selected?: boolean;
  /** Elemento actual (navegación). */
  active?: boolean;
  /** Muestra una palomita al final cuando está seleccionado (selección simple). */
  selectedIndicator?: boolean;

  variant?: CnListVariant;
  density?: CnListDensity;
  size?: CnListSize;
  descriptionLines?: number;
  /** Separador inferior. */
  divider?: boolean | "inset" | "full";
  /** Estilos de hover/clic (por defecto si hay `onClick`/`href`). */
  interactive?: boolean;

  depth?: number;
  indent?: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  /** Reserva el espacio del botón de expandir (alinea hermanos en un árbol). */
  reserveExpander?: boolean;

  checkbox?: boolean;
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;

  actions?: readonly CnListItemAction[];
  actionsVisibility?: "always" | "hover";
  swipeLeft?: CnListItemSwipe;
  swipeRight?: CnListItemSwipe;
  /** Props del asa para reordenar (`useSortableList().getHandleProps`). */
  dragHandleProps?: HTMLAttributes<HTMLElement> & Record<string, unknown>;

  /** Texto a resaltar en título/subtítulo. */
  highlight?: string;
  /** Dentro de `CnList` los controles internos no entran al orden de tabulación. */
  nestedFocus?: boolean;
  /** Muestra el skeleton de una fila con las mismas piezas. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
};

// ─── Piezas ──────────────────────────────────────────────────────────────

const isAvatarConfig = (
  value: CnListAvatar,
): value is Exclude<CnListAvatar, ReactNode> | Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !isValidElement(value) &&
  !Array.isArray(value) &&
  !(Symbol.iterator in (value as object));

const ListAvatar = ({ avatar, size }: { avatar: CnListAvatar; size: CnListSize }) => {
  if (!isAvatarConfig(avatar)) return <>{avatar}</>;
  const config = avatar as Exclude<CnListAvatar, ReactNode> & {
    src?: string;
    name?: string;
  };
  return <CnAvatar size={SIZE_TOKENS[size].avatar} alt={config.name} {...config} />;
};

const IconTile = ({ icon, size }: { icon: CnListIcon; size: CnListSize }) => {
  const tokens = SIZE_TOKENS[size];
  const config = typeof icon === "string" ? { name: icon } : icon;
  const color = "color" in config ? config.color : undefined;
  const token = color && isListColor(color) ? COLOR_TOKENS[color] : undefined;
  const bgColor = "bgColor" in config ? config.bgColor : undefined;
  return (
    <Box
      data-cn-list-icon=""
      sx={{
        width: tokens.iconBox,
        height: tokens.iconBox,
        borderRadius: "var(--cn-radius-md, 8px)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color: token?.fg ?? color ?? COLOR_TOKENS.primary.fg,
        backgroundColor: bgColor ?? token?.bg ?? COLOR_TOKENS.primary.bg,
      }}
    >
      <CnIcon name={config.name} size={tokens.iconSize} color="inherit" aria-hidden />
    </Box>
  );
};

const StatusChip = ({ status }: { status: CnListStatus }) => {
  const config = typeof status === "string" ? { label: status } : status;
  return (
    <CnChip
      label={config.label}
      color={config.color ?? "neutral"}
      variant={config.variant ?? "soft"}
      icon={config.icon}
      size="small"
      sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
    />
  );
};

const BadgePill = ({ badge }: { badge: CnListBadge }) => {
  const config =
    typeof badge === "number"
      ? { content: badge, variant: "count" as const }
      : badge === "dot"
        ? { variant: "dot" as const }
        : badge;
  const color = COLOR_TOKENS[config.color ?? "primary"].solid;
  if (config.variant === "dot") {
    return (
      <Box
        component="span"
        data-cn-list-badge="dot"
        aria-hidden
        sx={{ width: 8, height: 8, borderRadius: "999px", backgroundColor: color, flexShrink: 0 }}
      />
    );
  }
  const max = config.max ?? 99;
  const content =
    typeof config.content === "number" && config.content > max ? `${max}+` : config.content;
  if (content === undefined || content === null || content === 0) return null;
  return (
    <Box
      component="span"
      data-cn-list-badge="count"
      sx={{
        minWidth: 18,
        height: 18,
        px: "6px",
        boxSizing: "border-box",
        borderRadius: "999px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.66rem",
        fontWeight: 700,
        lineHeight: 1,
        color: "var(--cn-color-neutral-0, #ffffff)",
        backgroundColor: color,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {content}
    </Box>
  );
};

const ACTION_COLORS: Record<NonNullable<CnListItemAction["color"]>, string> = {
  default: "var(--cn-color-neutral-600, #4e5660)",
  primary: "var(--cn-color-brand-600, #254d87)",
  success: "var(--cn-color-success-600, #228740)",
  warning: "var(--cn-color-warning-600, #b8831a)",
  error: "var(--cn-color-error-600, #b52f2f)",
};

const stop = (event: SyntheticEvent) => event.stopPropagation();

/** Evita que Enter/Espacio en un control interno lleguen a la lista. */
const stopKeys = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") event.stopPropagation();
};

const menuPaperSx = {
  borderRadius: "12px",
  minWidth: 200,
  boxShadow: "0 10px 30px rgba(17, 20, 24, 0.14)",
  "& .MuiMenuItem-root": {
    fontSize: "0.82rem",
    borderRadius: "8px",
    mx: "6px",
    my: "1px",
    py: "7px",
  },
  "& .MuiListItemIcon-root": { minWidth: 32 },
};

const ItemActions = ({
  actions,
  label,
  tabIndex,
}: {
  actions: readonly CnListItemAction[];
  label: string;
  tabIndex?: number;
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const inline = actions.filter((a) => a.inline);
  const inMenu = actions.filter((a) => !a.inline);
  return (
    <Box
      data-cn-list-actions=""
      onClick={stop}
      onKeyDown={stopKeys}
      sx={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}
    >
      {inline.map((action) => (
        <Tooltip key={action.id} title={action.tooltip ?? action.label} arrow>
          <span>
            <IconButton
              size="small"
              tabIndex={tabIndex}
              aria-label={`${action.label}: ${label}`}
              disabled={action.disabled}
              onClick={action.onClick}
              sx={{ color: ACTION_COLORS[action.color ?? "default"] }}
            >
              <CnIcon name={action.icon ?? "more_horiz"} size="sm" />
            </IconButton>
          </span>
        </Tooltip>
      ))}
      {inMenu.length > 0 && (
        <>
          <IconButton
            size="small"
            tabIndex={tabIndex}
            aria-label={`Más acciones: ${label}`}
            aria-haspopup="menu"
            aria-expanded={Boolean(anchor) || undefined}
            onClick={(event) => setAnchor(event.currentTarget)}
            sx={{ color: "var(--cn-color-neutral-500, #6e7682)" }}
          >
            <CnIcon name="more_vert" size="sm" />
          </IconButton>
          <Menu
            open={Boolean(anchor)}
            anchorEl={anchor}
            onClose={() => setAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: menuPaperSx } }}
          >
            {inMenu.map((action, index) => (
              <Fragment key={action.id}>
                {action.divider && index > 0 && <Divider sx={{ my: "4px !important" }} />}
                <MenuItem
                  disabled={action.disabled}
                  onClick={() => {
                    setAnchor(null);
                    action.onClick();
                  }}
                  sx={{ color: action.color === "error" ? ACTION_COLORS.error : undefined }}
                >
                  {action.icon && (
                    <ListItemIcon sx={{ color: ACTION_COLORS[action.color ?? "default"] }}>
                      <CnIcon name={action.icon} size="sm" />
                    </ListItemIcon>
                  )}
                  <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>
                    {action.label}
                  </ListItemText>
                </MenuItem>
              </Fragment>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
};

// ─── Deslizar (táctil) ─────────────────────────────────────────────────

const SWIPE_THRESHOLD = 88;

const useSwipe = (left?: CnListItemSwipe, right?: CnListItemSwipe, disabled?: boolean) => {
  const [dx, setDx] = useState(0);
  const state = useRef<{ x: number; y: number; id: number; locked: boolean | null } | null>(null);
  const enabled = Boolean(left || right) && !disabled;

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!enabled || event.pointerType === "mouse") return;
    state.current = { x: event.clientX, y: event.clientY, id: event.pointerId, locked: null };
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const s = state.current;
    if (!s || s.id !== event.pointerId) return;
    const deltaX = event.clientX - s.x;
    const deltaY = event.clientY - s.y;
    if (s.locked === null) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      s.locked = Math.abs(deltaX) > Math.abs(deltaY);
      if (s.locked) event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    if (!s.locked) return;
    // Hacia la derecha usa `right`; hacia la izquierda, `left`.
    const allowed = (deltaX > 0 && right) || (deltaX < 0 && left) ? deltaX : deltaX / 6;
    setDx(Math.max(-160, Math.min(160, allowed)));
  };
  const onPointerEnd = (event: PointerEvent<HTMLElement>) => {
    const s = state.current;
    if (!s || s.id !== event.pointerId) return;
    state.current = null;
    if (dx >= SWIPE_THRESHOLD && right) right.onTrigger();
    else if (dx <= -SWIPE_THRESHOLD && left) left.onTrigger();
    setDx(0);
  };

  return {
    dx,
    enabled,
    handlers: enabled
      ? {
          onPointerDown,
          onPointerMove,
          onPointerUp: onPointerEnd,
          onPointerCancel: onPointerEnd,
        }
      : {},
  };
};

const SwipeBackground = ({
  action,
  side,
  dx,
}: {
  action: CnListItemSwipe;
  side: "left" | "right";
  dx: number;
}) => {
  const token = COLOR_TOKENS[action.color ?? (side === "left" ? "error" : "primary")];
  const armed = Math.abs(dx) >= SWIPE_THRESHOLD;
  return (
    <Box
      aria-hidden
      data-cn-list-swipe={side}
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: side === "right" ? "flex-start" : "flex-end",
        gap: "8px",
        px: "20px",
        color: "var(--cn-color-neutral-0, #ffffff)",
        backgroundColor: token.solid,
        opacity: armed ? 1 : 0.8,
        fontSize: "0.78rem",
        fontWeight: 700,
        transition: "opacity 120ms ease",
      }}
    >
      {action.icon && <CnIcon name={action.icon} size="sm" color="inherit" />}
      {action.label}
    </Box>
  );
};

// ─── Elemento ─────────────────────────────────────────────────────────

/**
 * Fila de lista con avatar/ícono, textos, meta, estado, insignia, acciones,
 * casilla, expansión de árbol y deslizar. Se usa sola o dentro de `CnList`.
 */
export const CnListItem = forwardRef<HTMLDivElement, CnListItemProps>(function CnListItem(
  {
    title,
    subtitle,
    description,
    avatar,
    icon,
    leading,
    meta,
    timestamp,
    status,
    badge,
    trailing,
    chevron = false,
    tone = "default",
    unread = false,
    disabled = false,
    href,
    target,
    selected = false,
    active = false,
    selectedIndicator = false,
    variant = "plain",
    density = "comfortable",
    size = "md",
    descriptionLines = 2,
    divider,
    interactive,
    depth = 0,
    indent = 20,
    expandable = false,
    expanded = false,
    onToggleExpand,
    reserveExpander = false,
    checkbox = false,
    checked = false,
    indeterminate = false,
    onCheckedChange,
    actions,
    actionsVisibility = "always",
    swipeLeft,
    swipeRight,
    dragHandleProps,
    highlight,
    nestedFocus = false,
    skeleton = false,
    sx,
    onClick,
    onKeyDown,
    role,
    tabIndex,
    style,
    className,
    ...rest
  },
  ref,
) {
  const tokens = SIZE_TOKENS[size];
  const padY = DENSITY_PADDING[density];
  const linkRef = useRef<HTMLAnchorElement>(null);
  const swipe = useSwipe(swipeLeft, swipeRight, disabled);

  if (skeleton) {
    return (
      <CnListSkeleton
        count={1}
        variant={variant}
        density={density}
        size={size}
        avatar={avatar ? "circle" : icon ? "square" : false}
        lines={(subtitle ? 1 : 0) + (description ? 1 : 0)}
        meta={Boolean(meta || timestamp)}
        trailing={Boolean(status || badge || chevron || actions?.length)}
        checkbox={checkbox}
        toolbar={false}
        sx={sx}
        className={className}
      />
    );
  }

  const innerTabIndex = nestedFocus ? -1 : undefined;
  const standaloneButton = Boolean(onClick) && !href && role === undefined && !disabled;
  const isInteractive = (interactive ?? Boolean(onClick || href)) && !disabled;
  const labelText = typeof title === "string" || typeof title === "number" ? String(title) : "";
  const showText = (node: ReactNode) =>
    highlight && typeof node === "string" ? highlightText(node, highlight) : node;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !standaloneButton) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.(event as unknown as MouseEvent<HTMLDivElement>);
    }
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    onClick?.(event);
  };

  // ─── Inicio ────────────────────────────────────────────────────────
  const leadingNode =
    leading ??
    (avatar !== undefined && avatar !== null ? (
      <ListAvatar avatar={avatar} size={size} />
    ) : icon ? (
      <IconTile icon={icon} size={size} />
    ) : null);
  const leadingWidth = leading ? 0 : avatar ? tokens.avatarPx : icon ? tokens.iconBox : 0;

  // ─── Fin ───────────────────────────────────────────────────────────
  const dateInfo = timestamp !== undefined ? formatFullDate(timestamp) : null;
  const metaNode =
    meta ??
    (timestamp !== undefined && dateInfo ? (
      <time dateTime={dateInfo.iso} title={dateInfo.label}>
        {formatRelativeTime(timestamp)}
      </time>
    ) : null);
  const secondaryTrailing =
    status || badge !== undefined ? (
      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {status && <StatusChip status={status} />}
        {badge !== undefined && <BadgePill badge={badge} />}
      </Box>
    ) : null;

  const insetLeft =
    tokens.padX +
    depth * indent +
    (dragHandleProps ? 24 : 0) +
    (expandable || reserveExpander ? 28 : 0) +
    (checkbox ? 32 : 0) +
    (leadingWidth ? leadingWidth + tokens.gap : 0);

  const dividerMode = divider === true ? "full" : divider || null;
  const isCard = variant === "card";
  const isInset = variant === "inset";
  const selectedBg = "rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.08)";
  const toneTokens = tone !== "default" ? TONE_TOKENS[tone] : null;
  const hoverActions = actionsVisibility === "hover" && actions && actions.length > 0;

  const rootSx: SxProps<Theme> = [
    {
      position: "relative",
      display: "block",
      boxSizing: "border-box",
      outline: "none",
      color: "var(--cn-color-text, #222831)",
      fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
      backgroundColor:
        toneTokens?.bg ?? (isCard ? "var(--cn-color-surface, #ffffff)" : "transparent"),
      boxShadow: toneTokens ? `inset 3px 0 0 ${toneTokens.bar}` : undefined,
      transition:
        "background-color var(--cn-duration-fast, 140ms) ease, box-shadow var(--cn-duration-fast, 140ms) ease, border-color var(--cn-duration-fast, 140ms) ease",
      overflow: swipe.enabled || isCard ? "hidden" : undefined,
      ...(isInset && { mx: "6px", borderRadius: "var(--cn-radius-md, 8px)" }),
      ...(isCard && {
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-lg, 12px)",
        boxShadow: [
          "var(--cn-shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.04))",
          toneTokens ? `inset 3px 0 0 ${toneTokens.bar}` : "",
        ]
          .filter(Boolean)
          .join(", "),
      }),
      ...(unread &&
        !toneTokens && {
          backgroundColor: "rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.04)",
        }),
      ...((selected || active) && {
        backgroundColor: selectedBg,
        ...(isCard && { borderColor: "var(--cn-color-brand-400, #5081c4)" }),
      }),
      ...(active && {
        "& [data-cn-list-title]": { color: "var(--cn-color-brand-700, #1c3d6d)" },
        ...(!isInset &&
          !isCard && { boxShadow: "inset 3px 0 0 var(--cn-color-brand-600, #254d87)" }),
      }),
      ...(isInteractive && {
        cursor: "pointer",
        "&:hover": {
          backgroundColor:
            selected || active
              ? "rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.12)"
              : "rgba(var(--cn-color-rgb-neutral-500, 110, 118, 130), 0.07)",
          ...(isCard && { boxShadow: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))" }),
        },
        "&:active": {
          backgroundColor: "rgba(var(--cn-color-rgb-neutral-500, 110, 118, 130), 0.12)",
        },
      }),
      "&:focus-visible": {
        boxShadow: "inset 0 0 0 2px var(--cn-color-brand-500, #3562a6)",
        ...(isCard && { boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(80, 129, 196, 0.35))" }),
      },
      ...(disabled && { opacity: 0.55, cursor: "not-allowed" }),
      ...(dividerMode && {
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          right: 0,
          left: dividerMode === "inset" ? `${insetLeft}px` : 0,
          height: "1px",
          backgroundColor: "var(--cn-color-border-subtle, #e9ecef)",
          pointerEvents: "none",
        },
      }),
      ...(hoverActions && {
        "@media (hover: hover)": {
          "& [data-cn-list-actions]": { opacity: 0, transition: "opacity 120ms ease" },
          "&:hover [data-cn-list-actions], &:focus-within [data-cn-list-actions], &:focus-visible [data-cn-list-actions]":
            { opacity: 1 },
        },
      }),
      "&[data-dragging]": {
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        zIndex: 5,
      },
    },
    ...(Array.isArray(sx) ? sx : [sx]),
  ];

  const titleNode = (
    <Box
      data-cn-list-title=""
      sx={{
        fontSize: `${tokens.title}px`,
        fontWeight: unread ? 700 : 600,
        lineHeight: 1.4,
        color: "var(--cn-color-text, #222831)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {href ? (
        <Box
          component="a"
          ref={linkRef}
          href={disabled ? undefined : href}
          target={target}
          rel={target === "_blank" ? "noopener noreferrer" : undefined}
          tabIndex={innerTabIndex}
          data-cn-list-link=""
          onClick={(event: MouseEvent) => {
            event.stopPropagation();
            if (disabled) event.preventDefault();
            else onClick?.(event as MouseEvent<HTMLDivElement>);
          }}
          sx={{
            color: "inherit",
            textDecoration: "none",
            outline: "none",
            "&::before": { content: '""', position: "absolute", inset: 0, zIndex: 0 },
            "&:focus-visible::before": {
              boxShadow: "inset 0 0 0 2px var(--cn-color-brand-500, #3562a6)",
              borderRadius: "inherit",
            },
          }}
        >
          {showText(title)}
        </Box>
      ) : (
        showText(title)
      )}
    </Box>
  );

  const content = (
    <Box
      data-cn-list-content=""
      {...swipe.handlers}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: description ? "flex-start" : "center",
        gap: `${tokens.gap}px`,
        px: `${tokens.padX}px`,
        py: `${padY}px`,
        pl: `${tokens.padX + depth * indent}px`,
        minWidth: 0,
        touchAction: swipe.enabled ? "pan-y" : undefined,
        transform: swipe.dx ? `translateX(${swipe.dx}px)` : undefined,
        transition: swipe.dx ? "none" : "transform 180ms ease",
        backgroundColor: swipe.dx ? "var(--cn-color-surface, #ffffff)" : undefined,
        // Controles por encima del enlace estirado.
        "& [data-cn-list-actions], & [data-cn-list-control]": { position: "relative", zIndex: 1 },
      }}
    >
      {unread && (
        <Box
          aria-hidden
          data-cn-list-unread=""
          sx={{
            position: "absolute",
            left: `${Math.max(3, tokens.padX / 2 - 3 + depth * indent)}px`,
            top: "50%",
            width: 6,
            height: 6,
            mt: "-3px",
            borderRadius: "999px",
            backgroundColor: "var(--cn-color-brand-600, #254d87)",
          }}
        />
      )}
      {dragHandleProps && (
        <Box
          data-cn-list-control=""
          {...dragHandleProps}
          tabIndex={nestedFocus ? -1 : (dragHandleProps.tabIndex as number | undefined)}
          onClick={stop}
          sx={{
            display: "grid",
            placeItems: "center",
            width: 20,
            mr: "-4px",
            alignSelf: "center",
            color: "var(--cn-color-neutral-400, #9aa1aa)",
            borderRadius: "4px",
            flexShrink: 0,
            "&:hover": { color: "var(--cn-color-neutral-600, #4e5660)" },
            "&:focus-visible": {
              outline: "none",
              boxShadow: "0 0 0 2px var(--cn-color-brand-500, #3562a6)",
            },
          }}
        >
          <CnIcon name="drag_indicator" size="sm" aria-hidden />
        </Box>
      )}
      {(expandable || reserveExpander) && (
        <Box
          data-cn-list-control=""
          sx={{ width: 24, flexShrink: 0, alignSelf: "center", mr: "-4px" }}
        >
          {expandable && (
            <IconButton
              size="small"
              tabIndex={innerTabIndex}
              aria-label={expanded ? `Contraer ${labelText}` : `Expandir ${labelText}`}
              aria-expanded={expanded}
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpand?.();
              }}
              onKeyDown={stopKeys}
              sx={{ p: "2px", color: "var(--cn-color-neutral-500, #6e7682)" }}
            >
              <CnIcon
                name="chevron_right"
                size="sm"
                style={{
                  transform: expanded ? "rotate(90deg)" : "none",
                  transition: "transform 160ms ease",
                }}
              />
            </IconButton>
          )}
        </Box>
      )}
      {checkbox && (
        <Box data-cn-list-control="" sx={{ alignSelf: "center", mx: "-6px", flexShrink: 0 }}>
          <Checkbox
            size="small"
            checked={checked}
            indeterminate={indeterminate}
            disabled={disabled}
            tabIndex={innerTabIndex}
            onClick={stop}
            onKeyDown={stopKeys}
            onChange={(event) => onCheckedChange?.(event.target.checked)}
            slotProps={{ input: { "aria-label": `Seleccionar ${labelText}`.trim() } }}
            sx={{ p: "4px" }}
          />
        </Box>
      )}
      {leadingNode && (
        <Box
          sx={{ display: "flex", flexShrink: 0, alignSelf: description ? "flex-start" : "center" }}
        >
          {leadingNode}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {titleNode}
        {subtitle && (
          <Box
            data-cn-list-subtitle=""
            sx={{
              fontSize: `${tokens.subtitle}px`,
              lineHeight: 1.45,
              color: "var(--cn-color-text-muted, #6e7682)",
              mt: "1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {showText(subtitle)}
          </Box>
        )}
        {description && (
          <Box
            data-cn-list-description=""
            sx={{
              fontSize: `${tokens.description}px`,
              lineHeight: 1.5,
              color: "var(--cn-color-text-muted, #6e7682)",
              mt: "2px",
              display: "-webkit-box",
              WebkitLineClamp: descriptionLines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {showText(description)}
          </Box>
        )}
      </Box>
      {(metaNode || secondaryTrailing) && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "4px",
            flexShrink: 0,
            alignSelf: description ? "flex-start" : "center",
          }}
        >
          {metaNode && (
            <Box
              data-cn-list-meta=""
              sx={{
                fontSize: `${tokens.meta}px`,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                color: unread
                  ? "var(--cn-color-brand-600, #254d87)"
                  : "var(--cn-color-text-muted, #6e7682)",
                fontWeight: unread ? 700 : 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {metaNode}
            </Box>
          )}
          {secondaryTrailing}
        </Box>
      )}
      {trailing && (
        <Box
          data-cn-list-control=""
          onClick={stop}
          onKeyDown={stopKeys}
          sx={{ display: "flex", alignItems: "center", flexShrink: 0, alignSelf: "center" }}
        >
          {trailing}
        </Box>
      )}
      {actions && actions.length > 0 && (
        <Box sx={{ alignSelf: "center" }}>
          <ItemActions actions={actions} label={labelText} tabIndex={innerTabIndex} />
        </Box>
      )}
      {selectedIndicator && selected && (
        <CnIcon
          name="check"
          size="sm"
          color="primary"
          aria-hidden
          sx={{ alignSelf: "center", flexShrink: 0 }}
        />
      )}
      {chevron && (
        <CnIcon
          name="chevron_right"
          size="sm"
          color="subtle"
          aria-hidden
          sx={{ alignSelf: "center", flexShrink: 0, mr: "-4px" }}
        />
      )}
    </Box>
  );

  return (
    <Box
      ref={ref}
      role={standaloneButton ? "button" : role}
      tabIndex={standaloneButton ? (tabIndex ?? 0) : tabIndex}
      aria-disabled={disabled || undefined}
      data-cn-list-item=""
      data-selected={selected || undefined}
      data-active={active || undefined}
      onClick={onClick || href ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      style={style}
      className={className}
      sx={rootSx}
      {...rest}
    >
      {swipe.dx > 0 && swipeRight && (
        <SwipeBackground action={swipeRight} side="right" dx={swipe.dx} />
      )}
      {swipe.dx < 0 && swipeLeft && (
        <SwipeBackground action={swipeLeft} side="left" dx={swipe.dx} />
      )}
      {content}
    </Box>
  );
});

// ─── Subencabezado ────────────────────────────────────────────────────

export type CnListSubheaderProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  icon?: string;
  count?: number;
  /** Fijo arriba al desplazar. */
  sticky?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  action?: ReactNode;
  size?: CnListSize;
  variant?: CnListVariant;
  sx?: SxProps<Theme>;
};

/** Encabezado de sección de una lista (fijo, con conteo y plegable). */
export const CnListSubheader = forwardRef<HTMLDivElement, CnListSubheaderProps>(
  function CnListSubheader(
    {
      title,
      children,
      description,
      icon,
      count,
      sticky = true,
      collapsible = false,
      collapsed = false,
      onToggle,
      action,
      size = "md",
      variant = "plain",
      sx,
      role,
      tabIndex,
      onKeyDown,
      ...rest
    },
    ref,
  ) {
    const tokens = SIZE_TOKENS[size];
    const standalone = collapsible && role === undefined;
    return (
      <Box
        ref={ref}
        data-cn-list-subheader=""
        role={standalone ? "button" : role}
        tabIndex={standalone ? (tabIndex ?? 0) : tabIndex}
        aria-expanded={collapsible ? !collapsed : undefined}
        onClick={collapsible ? onToggle : undefined}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || !standalone) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle?.();
          }
        }}
        sx={[
          {
            position: sticky ? "sticky" : "relative",
            top: 0,
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxSizing: "border-box",
            minHeight: 34,
            px: `${tokens.padX}px`,
            py: "6px",
            backgroundColor:
              variant === "card"
                ? "var(--cn-color-background, #f6f7f9)"
                : "var(--cn-color-surface, #ffffff)",
            borderBottom:
              variant === "card" ? "none" : "1px solid var(--cn-color-border-subtle, #eceef1)",
            color: "var(--cn-color-neutral-600, #4e5660)",
            fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
            outline: "none",
            userSelect: "none",
            ...(collapsible && {
              cursor: "pointer",
              "&:hover": { color: "var(--cn-color-text, #222831)" },
            }),
            "&:focus-visible": {
              boxShadow: "inset 0 0 0 2px var(--cn-color-brand-500, #3562a6)",
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...rest}
      >
        {collapsible && (
          <CnIcon
            name="expand_more"
            size="sm"
            aria-hidden
            style={{
              transform: collapsed ? "rotate(-90deg)" : "none",
              transition: "transform 160ms ease",
            }}
          />
        )}
        {icon && <CnIcon name={icon} size="sm" aria-hidden />}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box
            component="span"
            data-cn-list-subheader-title=""
            sx={{
              display: "block",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title ?? children}
          </Box>
          {description && (
            <Box
              component="span"
              sx={{
                display: "block",
                fontSize: "0.72rem",
                color: "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              {description}
            </Box>
          )}
        </Box>
        {count !== undefined && (
          <Box
            component="span"
            data-cn-list-count=""
            sx={{
              px: "7px",
              py: "1px",
              borderRadius: "999px",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "var(--cn-color-neutral-600, #4e5660)",
              backgroundColor: "rgba(var(--cn-color-rgb-neutral-500, 110, 118, 130), 0.12)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {count.toLocaleString("es-MX")}
          </Box>
        )}
        {action && (
          <Box onClick={stop} onKeyDown={stopKeys} sx={{ display: "flex", alignItems: "center" }}>
            {action}
          </Box>
        )}
      </Box>
    );
  },
);
