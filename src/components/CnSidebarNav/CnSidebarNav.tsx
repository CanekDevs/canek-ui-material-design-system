import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ElementType, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { forwardRef, useId, useMemo, useState } from "react";
import { CnIcon } from "../CnIcon";
import { CnSidebarNavSkeleton } from "./CnSidebarNavSkeleton";

export type CnSidebarNavItem = {
  id: string;
  label: string;
  /** Nombre del ícono (`CnIcon`). En modo mini es lo único visible. */
  icon?: string;
  /** Destino. Con `href` el elemento es un enlace; sin él, un botón. */
  href?: string;
  /** Contador o texto corto a la derecha (p. ej. pendientes). En modo mini se ve como punto. */
  badge?: number | string;
  disabled?: boolean;
  /** Un nivel de subpáginas. El padre se pliega y se despliega. */
  children?: CnSidebarNavItem[];
};

export type CnSidebarNavSection = {
  id: string;
  /** Encabezado del grupo. Sin él, el grupo no tiene título (útil para el primero). */
  label?: string;
  items: CnSidebarNavItem[];
  /** El encabezado pliega y despliega el grupo. */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

export type CnSidebarNavProps = {
  /** Grupos de navegación. */
  sections: CnSidebarNavSection[];
  /** Id de la página actual: se marca con `aria-current="page"` y abre a su padre. */
  activeId?: string;
  /** Se llama al elegir una página. Para navegar sin recargar, llama a `event.preventDefault()`. */
  onNavigate?: (item: CnSidebarNavItem, event: MouseEvent<HTMLElement>) => void;
  /** Modo mini: solo íconos, con el nombre en un tooltip. */
  collapsed?: boolean;
  /** Muestra el botón para contraer y expandir el menú y avisa el cambio. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Ids marcados como favoritos: aparecen en un grupo «Favoritos» al inicio. */
  favorites?: string[];
  /** Activa el botón de favorito en cada página y avisa el cambio. */
  onFavoriteChange?: (id: string, favorite: boolean) => void;
  /** Padres abiertos al inicio (además del padre de la página actual). */
  defaultExpanded?: string[];
  /** Marca o logo arriba del menú. */
  header?: ReactNode;
  /** Contenido al pie (usuario, versión, ayuda). */
  footer?: ReactNode;
  /** Componente de enlace del router (recibe `href`); por omisión, `a`. */
  linkComponent?: ElementType;
  /** Nombre accesible de la navegación. */
  ariaLabel?: string;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

export const SIDEBAR_WIDTH = 264;
export const SIDEBAR_MINI_WIDTH = 64;

const FAVORITES_ID = "__favoritos";

const findParent = (sections: CnSidebarNavSection[], id?: string) => {
  if (!id) return undefined;
  for (const section of sections)
    for (const item of section.items)
      if (item.children?.some((child) => child.id === id)) return item.id;
  return undefined;
};

const flatten = (sections: CnSidebarNavSection[]) =>
  sections.flatMap((s) => s.items.flatMap((item) => [item, ...(item.children ?? [])]));

const badgeText = (badge: CnSidebarNavItem["badge"]) =>
  typeof badge === "number" ? (badge > 99 ? "99+" : String(badge)) : badge;

const itemSx = (active: boolean, mini: boolean, depth: number) => ({
  position: "relative" as const,
  width: "100%",
  minWidth: 0,
  minHeight: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: mini ? "center" : "flex-start",
  gap: "12px",
  pr: mini ? "0px" : "12px",
  pl: mini ? "0px" : depth ? "44px" : "12px",
  borderRadius: "var(--cn-radius-md, 8px)",
  fontFamily: "inherit",
  fontSize: "var(--cn-font-size-md, 14px)",
  fontWeight: active ? 600 : 500,
  textAlign: "left" as const,
  textDecoration: "none",
  color: active
    ? "var(--cn-color-control-primary-fg, var(--cn-color-text, #222831))"
    : "var(--cn-color-text, #222831)",
  backgroundColor: active
    ? "var(--cn-color-tone-primary-soft, var(--cn-color-active, rgba(0, 0, 0, 0.08)))"
    : "transparent",
  transition: "background-color 120ms ease",
  "&:hover": {
    backgroundColor: active
      ? "var(--cn-color-tone-primary-soft, var(--cn-color-active, rgba(0, 0, 0, 0.08)))"
      : "var(--cn-color-hover, rgba(0, 0, 0, 0.04))",
  },
  "&.Mui-focusVisible, &:focus-visible": {
    outline: "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
    outlineOffset: "-2px",
  },
  "&.Mui-disabled": { opacity: 0.45 },
});

const Pill = ({ value }: { value: CnSidebarNavItem["badge"] }) => (
  <Box
    component="span"
    aria-hidden
    sx={{
      flex: "none",
      minWidth: 20,
      height: 20,
      px: "6px",
      borderRadius: "999px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "var(--cn-font-size-xs, 11px)",
      fontWeight: 600,
      color: "var(--cn-color-control-primary-fg, var(--cn-color-text, #222831))",
      backgroundColor:
        "var(--cn-color-tone-primary-soft, var(--cn-color-active, rgba(0, 0, 0, 0.08)))",
    }}
  >
    {badgeText(value)}
  </Box>
);

const Dot = () => (
  <Box
    component="span"
    aria-hidden
    sx={{
      position: "absolute",
      top: 8,
      right: 14,
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: "var(--cn-color-control-primary-fg, var(--cn-color-text, #222831))",
      boxShadow: "0 0 0 2px var(--cn-color-surface, #ffffff)",
    }}
  />
);

/** Navegación lateral de aplicación: grupos plegables, subpáginas, modo mini, insignias, página actual y favoritos. */
export const CnSidebarNav = forwardRef<HTMLElement, CnSidebarNavProps>(function CnSidebarNav(
  {
    sections,
    activeId,
    onNavigate,
    collapsed = false,
    onCollapsedChange,
    favorites,
    onFavoriteChange,
    defaultExpanded = [],
    header,
    footer,
    linkComponent = "a",
    ariaLabel = "Navegación principal",
    skeleton = false,
    sx,
    className,
  },
  ref,
) {
  const uid = useId();
  const activeParent = findParent(sections, activeId);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([...defaultExpanded, ...(activeParent ? [activeParent] : [])]),
  );
  const [closedSections, setClosedSections] = useState<Set<string>>(
    () => new Set(sections.filter((s) => s.collapsible && s.defaultCollapsed).map((s) => s.id)),
  );
  const [miniMenu, setMiniMenu] = useState<{ anchor: HTMLElement; item: CnSidebarNavItem } | null>(
    null,
  );

  // cuando cambia la página actual, se abre su padre (después se puede volver a cerrar)
  const [seenActive, setSeenActive] = useState(activeId);
  if (activeId !== seenActive) {
    setSeenActive(activeId);
    if (activeParent && !expanded.has(activeParent))
      setExpanded((prev) => new Set(prev).add(activeParent));
  }

  const favoriteSet = useMemo(() => new Set(favorites ?? []), [favorites]);
  const allSections = useMemo<CnSidebarNavSection[]>(() => {
    if (!favorites?.length) return sections;
    const byId = new Map(flatten(sections).map((item) => [item.id, item]));
    const items = favorites
      .map((id) => byId.get(id))
      .filter((item): item is CnSidebarNavItem => Boolean(item))
      .map(({ children: _children, ...item }) => item);
    if (!items.length) return sections;
    return [{ id: FAVORITES_ID, label: "Favoritos", items }, ...sections];
  }, [sections, favorites]);

  if (skeleton)
    return (
      <CnSidebarNavSkeleton
        collapsed={collapsed}
        rows={Math.min(8, flatten(sections).length || 6)}
        sx={sx}
        className={className}
      />
    );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSection = (id: string) =>
    setClosedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // flechas, Inicio y Fin recorren las páginas visibles; derecha/izquierda abren y cierran padres
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const root = event.currentTarget;
    const target = event.target as HTMLElement;
    if (!target.hasAttribute("data-cn-nav-item")) return;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-cn-nav-item]:not([aria-disabled='true'])"),
    );
    const index = items.indexOf(target);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();
    const id = target.getAttribute("data-cn-nav-item") ?? "";
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(items.length - 1);
        break;
      case "ArrowRight":
        if (target.hasAttribute("aria-expanded") && !collapsed && !expanded.has(id)) {
          event.preventDefault();
          toggle(id);
        }
        break;
      case "ArrowLeft": {
        if (collapsed) break;
        if (target.getAttribute("aria-expanded") === "true") {
          event.preventDefault();
          toggle(id);
        } else {
          const parent = target.getAttribute("data-cn-nav-parent");
          if (parent) {
            event.preventDefault();
            root.querySelector<HTMLElement>(`[data-cn-nav-item="${CSS.escape(parent)}"]`)?.focus();
          }
        }
        break;
      }
      default:
    }
  };

  const renderLeaf = (item: CnSidebarNavItem, depth: number, parentId?: string) => {
    const active = item.id === activeId;
    const isLink = Boolean(item.href) && !item.disabled;
    const label = item.badge != null ? `${item.label} (${badgeText(item.badge)})` : item.label;
    const node = (
      <ButtonBase
        component={isLink ? linkComponent : "button"}
        {...(isLink ? { href: item.href } : { type: "button" })}
        data-cn-nav-item={item.id}
        data-cn-nav-parent={parentId}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? label : undefined}
        aria-disabled={item.disabled || undefined}
        disabled={item.disabled}
        onClick={(event: MouseEvent<HTMLElement>) => onNavigate?.(item, event)}
        sx={itemSx(active, collapsed, depth)}
      >
        {item.icon ? (
          <CnIcon name={item.icon} size={20} sx={{ flex: "none", color: "inherit" }} />
        ) : (
          !collapsed && depth === 0 && <Box component="span" sx={{ width: 20, flex: "none" }} />
        )}
        {collapsed ? (
          !item.icon && (
            <Box component="span" aria-hidden sx={{ fontWeight: 700 }}>
              {item.label.charAt(0).toUpperCase()}
            </Box>
          )
        ) : (
          <Box
            component="span"
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </Box>
        )}
        {item.badge != null && (collapsed ? <Dot /> : <Pill value={item.badge} />)}
      </ButtonBase>
    );

    const withFavorite =
      onFavoriteChange && !collapsed && !item.children?.length ? (
        <Box
          sx={{
            position: "relative",
            minWidth: 0,
            "& [data-cn-nav-fav]": { opacity: favoriteSet.has(item.id) ? 1 : 0 },
            "&:hover [data-cn-nav-fav], &:focus-within [data-cn-nav-fav]": { opacity: 1 },
            "& [data-cn-nav-item]": { pr: "40px" },
          }}
        >
          {node}
          <ButtonBase
            type="button"
            data-cn-nav-fav
            aria-pressed={favoriteSet.has(item.id)}
            aria-label={`${favoriteSet.has(item.id) ? "Quitar de" : "Agregar a"} favoritos: ${item.label}`}
            onClick={() => onFavoriteChange(item.id, !favoriteSet.has(item.id))}
            sx={{
              position: "absolute",
              right: "6px",
              top: "50%",
              transform: "translateY(-50%)",
              width: 28,
              height: 28,
              borderRadius: "50%",
              color: favoriteSet.has(item.id)
                ? "var(--cn-color-control-warning-fg, var(--cn-color-warning-600, #b8831a))"
                : "var(--cn-color-text-muted, #6e7682)",
              transition: "opacity 120ms ease",
              "&:hover": { backgroundColor: "var(--cn-color-hover, rgba(0, 0, 0, 0.04))" },
              "&.Mui-focusVisible": {
                opacity: 1,
                outline:
                  "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
              },
            }}
          >
            <CnIcon name={favoriteSet.has(item.id) ? "star" : "star_border"} size={18} />
          </ButtonBase>
        </Box>
      ) : (
        node
      );

    return collapsed ? (
      <Tooltip key={item.id} title={label} placement="right">
        <Box component="li" sx={{ listStyle: "none" }}>
          {withFavorite}
        </Box>
      </Tooltip>
    ) : (
      <Box component="li" key={item.id} sx={{ listStyle: "none", minWidth: 0 }}>
        {withFavorite}
      </Box>
    );
  };

  const renderParent = (item: CnSidebarNavItem, sectionId: string) => {
    const open = expanded.has(item.id);
    const childActive = item.children?.some((c) => c.id === activeId) ?? false;
    const listId = `${uid}-${sectionId}-${item.id}`;
    if (collapsed) {
      return (
        <Tooltip key={item.id} title={item.label} placement="right">
          <Box component="li" sx={{ listStyle: "none" }}>
            <ButtonBase
              type="button"
              data-cn-nav-item={item.id}
              aria-haspopup="menu"
              aria-label={item.label}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              onClick={(event) => setMiniMenu({ anchor: event.currentTarget, item })}
              sx={itemSx(childActive, true, 0)}
            >
              {item.icon ? (
                <CnIcon name={item.icon} size={20} sx={{ color: "inherit" }} />
              ) : (
                <Box component="span" aria-hidden sx={{ fontWeight: 700 }}>
                  {item.label.charAt(0).toUpperCase()}
                </Box>
              )}
              {item.badge != null && <Dot />}
            </ButtonBase>
          </Box>
        </Tooltip>
      );
    }
    return (
      <Box component="li" key={item.id} sx={{ listStyle: "none", minWidth: 0 }}>
        <ButtonBase
          type="button"
          data-cn-nav-item={item.id}
          aria-expanded={open}
          aria-controls={listId}
          aria-disabled={item.disabled || undefined}
          disabled={item.disabled}
          onClick={() => toggle(item.id)}
          sx={{
            ...itemSx(false, false, 0),
            color: childActive
              ? "var(--cn-color-control-primary-fg, var(--cn-color-text, #222831))"
              : "var(--cn-color-text, #222831)",
          }}
        >
          {item.icon ? (
            <CnIcon name={item.icon} size={20} sx={{ flex: "none", color: "inherit" }} />
          ) : (
            <Box component="span" sx={{ width: 20, flex: "none" }} />
          )}
          <Box
            component="span"
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </Box>
          {item.badge != null && <Pill value={item.badge} />}
          <CnIcon
            name="expand_more"
            size={18}
            sx={{
              flex: "none",
              color: "var(--cn-color-text-muted, #6e7682)",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 150ms ease",
            }}
          />
        </ButtonBase>
        {open && (
          <Box
            component="ul"
            id={listId}
            sx={{ m: 0, p: 0, mt: "2px", display: "grid", gap: "2px" }}
          >
            {item.children?.map((child) => renderLeaf(child, 1, item.id))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      ref={ref}
      component="nav"
      aria-label={ariaLabel}
      data-cn-sidebar-nav
      data-collapsed={collapsed || undefined}
      className={className}
      onKeyDown={onKeyDown}
      sx={[
        {
          width: collapsed ? SIDEBAR_MINI_WIDTH : SIDEBAR_WIDTH,
          maxWidth: "100%",
          minWidth: 0,
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          borderRight: "1px solid var(--cn-color-border, #dde0e4)",
          color: "var(--cn-color-text, #222831)",
          transition: "width 180ms ease",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {header && (
        <Box
          sx={{
            flex: "none",
            minHeight: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            px: collapsed ? "8px" : "16px",
            borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {header}
        </Box>
      )}

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", p: "8px" }}>
        {allSections.map((section, i) => {
          const closed = closedSections.has(section.id);
          const headingId = `${uid}-sec-${section.id}`;
          const listId = `${uid}-list-${section.id}`;
          return (
            <Box key={section.id} sx={{ mt: i ? "12px" : 0 }}>
              {section.label &&
                (collapsed ? (
                  i > 0 && (
                    <Box
                      role="separator"
                      sx={{
                        height: "1px",
                        mx: "8px",
                        mb: "12px",
                        bgcolor: "var(--cn-color-border, #dde0e4)",
                      }}
                    />
                  )
                ) : section.collapsible ? (
                  <ButtonBase
                    type="button"
                    id={headingId}
                    aria-expanded={!closed}
                    aria-controls={listId}
                    onClick={() => toggleSection(section.id)}
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      px: "12px",
                      py: "6px",
                      borderRadius: "var(--cn-radius-sm, 6px)",
                      fontFamily: "inherit",
                      fontSize: "var(--cn-font-size-xs, 11px)",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--cn-color-text-muted, #6e7682)",
                      "&.Mui-focusVisible": {
                        outline:
                          "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
                      },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {section.label}
                    </Box>
                    <CnIcon name={closed ? "expand_more" : "expand_less"} size={16} />
                  </ButtonBase>
                ) : (
                  <Box
                    id={headingId}
                    sx={{
                      px: "12px",
                      py: "6px",
                      fontSize: "var(--cn-font-size-xs, 11px)",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--cn-color-text-muted, #6e7682)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {section.label}
                  </Box>
                ))}
              {!(closed && !collapsed) && (
                <Box
                  component="ul"
                  id={listId}
                  aria-labelledby={section.label && !collapsed ? headingId : undefined}
                  aria-label={section.label && collapsed ? section.label : undefined}
                  sx={{ m: 0, p: 0, display: "grid", gap: "2px" }}
                >
                  {section.items.map((item) =>
                    item.children?.length ? renderParent(item, section.id) : renderLeaf(item, 0),
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {(footer || onCollapsedChange) && (
        <Box
          sx={{
            flex: "none",
            borderTop: "1px solid var(--cn-color-border, #dde0e4)",
            p: "8px",
            display: "grid",
            gap: "4px",
            minWidth: 0,
          }}
        >
          {footer}
          {onCollapsedChange && (
            <ButtonBase
              type="button"
              aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
              onClick={() => onCollapsedChange(!collapsed)}
              sx={{
                ...itemSx(false, collapsed, 0),
                color: "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              <CnIcon name={collapsed ? "menu" : "menu_open"} size={20} sx={{ color: "inherit" }} />
              {!collapsed && <Box component="span">Contraer menú</Box>}
            </ButtonBase>
          )}
        </Box>
      )}

      <Menu
        open={Boolean(miniMenu)}
        anchorEl={miniMenu?.anchor}
        onClose={() => setMiniMenu(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        MenuListProps={{ "aria-label": miniMenu?.item.label }}
      >
        {miniMenu?.item.children?.map((child) => (
          <MenuItem
            key={child.id}
            component={child.href && !child.disabled ? linkComponent : "li"}
            {...(child.href && !child.disabled ? { href: child.href } : {})}
            disabled={child.disabled}
            selected={child.id === activeId}
            aria-current={child.id === activeId ? "page" : undefined}
            onClick={(event: MouseEvent<HTMLElement>) => {
              onNavigate?.(child, event);
              setMiniMenu(null);
            }}
            sx={{ fontSize: "var(--cn-font-size-md, 14px)", gap: "10px", minWidth: 200 }}
          >
            {child.icon && <CnIcon name={child.icon} size={18} />}
            <Box component="span" sx={{ flex: 1 }}>
              {child.label}
            </Box>
            {child.badge != null && <Pill value={child.badge} />}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
});
