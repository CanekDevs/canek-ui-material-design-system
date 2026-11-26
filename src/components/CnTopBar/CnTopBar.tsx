import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef, useId, useState } from "react";
import { useElementWidth } from "../../utils/use-element-width";
import { CnAvatar } from "../CnAvatar";
import { KbdKeys } from "../CnCommandPalette/kbd";
import { CnIcon } from "../CnIcon";
import { CnTopBarSkeleton } from "./CnTopBarSkeleton";

export type CnTopBarUserAction = {
  id: string;
  label: string;
  icon?: string;
  /** Acción destructiva o de salida (se pinta en rojo y va separada). */
  danger?: boolean;
  onClick?: () => void;
};

export type CnTopBarUser = {
  name: string;
  /** Correo o rol bajo el nombre en el menú. */
  detail?: string;
  avatarSrc?: string;
  actions?: CnTopBarUserAction[];
};

export type CnTopBarProps = {
  /** Marca o logo a la izquierda. */
  brand?: ReactNode;
  /** Título de la sección actual. Se oculta en anchos chicos. */
  title?: ReactNode;
  /** Muestra el botón de menú (abre la navegación) y avisa el clic. */
  onMenuClick?: () => void;
  /** Nombre accesible del botón de menú. */
  menuLabel?: string;
  /** Estado del menú que controla el botón (para `aria-expanded`). */
  menuOpen?: boolean;
  /** Botón de búsqueda que abre la paleta de comandos (con su atajo a la vista). */
  onSearchClick?: () => void;
  searchPlaceholder?: string;
  /** Atajo que se muestra en el botón de búsqueda (p. ej. `"mod+k"`). */
  searchHotkey?: string;
  /** Búsqueda propia (p. ej. un `CnSearchField`) en lugar del botón. */
  search?: ReactNode;
  /** Acciones a la derecha: notificaciones, ayuda, creación rápida… */
  actions?: ReactNode;
  /** Usuario con su menú (perfil, ajustes, salir). */
  user?: CnTopBarUser;
  /** Ancho (px) por debajo del cual la búsqueda pasa a ícono y se oculta el título. */
  compactBelow?: number;
  /** Fuerza el modo compacto (`true`) o el completo (`false`). Sin valor, se decide por el ancho. */
  compact?: boolean;
  /** Queda fija arriba al hacer scroll. */
  sticky?: boolean;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const iconButtonSx = {
  width: 40,
  height: 40,
  flex: "none",
  color: "var(--cn-color-text-muted, #6e7682)",
  "&:hover": { backgroundColor: "var(--cn-color-hover, rgba(0, 0, 0, 0.04))" },
  "&.Mui-focusVisible": {
    outline: "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
  },
};

/** Barra superior de aplicación: menú, marca, título, búsqueda, acciones y menú de usuario; se compacta en anchos chicos. */
export const CnTopBar = forwardRef<HTMLElement, CnTopBarProps>(function CnTopBar(
  {
    brand,
    title,
    onMenuClick,
    menuLabel = "Abrir menú",
    menuOpen,
    onSearchClick,
    searchPlaceholder = "Buscar o ir a…",
    searchHotkey = "mod+k",
    search,
    actions,
    user,
    compactBelow = 640,
    compact: compactProp,
    sticky = false,
    skeleton = false,
    sx,
    className,
  },
  ref,
) {
  const uid = useId();
  const { ref: measureRef, width } = useElementWidth<HTMLElement>();
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const compact = compactProp ?? (width !== null && width < compactBelow);

  if (skeleton)
    return (
      <CnTopBarSkeleton
        menu={Boolean(onMenuClick)}
        search={Boolean(onSearchClick || search)}
        sx={sx}
        className={className}
      />
    );

  const setRefs = (node: HTMLElement | null) => {
    measureRef(node);
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const userMenuId = `${uid}-user-menu`;
  const regular = user?.actions?.filter((a) => !a.danger) ?? [];
  const danger = user?.actions?.filter((a) => a.danger) ?? [];

  return (
    <Box
      ref={setRefs}
      component="header"
      data-cn-top-bar
      data-compact={compact || undefined}
      className={className}
      sx={[
        {
          position: sticky ? "sticky" : "relative",
          top: 0,
          zIndex: sticky ? "var(--cn-z-sticky, 1020)" : "auto",
          minWidth: 0,
          maxWidth: "100%",
          boxSizing: "border-box",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          px: compact ? "8px" : "16px",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
          color: "var(--cn-color-text, #222831)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {onMenuClick && (
        <IconButton
          aria-label={menuLabel}
          aria-expanded={menuOpen}
          onClick={onMenuClick}
          sx={iconButtonSx}
        >
          <CnIcon name="menu" size={22} />
        </IconButton>
      )}

      {brand && (
        <Box
          sx={{
            // la marca cede espacio (se recorta) para que acciones y usuario siempre quepan
            flex: "0 1 auto",
            display: "flex",
            alignItems: "center",
            minWidth: 0,
            maxWidth: compact ? 140 : 220,
            overflow: "hidden",
          }}
        >
          {brand}
        </Box>
      )}

      {title && !compact && (
        <Typography
          component="h1"
          sx={{
            m: 0,
            minWidth: 0,
            flexShrink: 1,
            maxWidth: "40%",
            fontSize: "var(--cn-font-size-lg, 16px)",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
        {search && !compact && (
          <Box sx={{ width: "100%", maxWidth: 480, minWidth: 0 }}>{search}</Box>
        )}
        {!search && onSearchClick && !compact && (
          <ButtonBase
            type="button"
            onClick={onSearchClick}
            aria-label={searchPlaceholder}
            aria-keyshortcuts={searchHotkey ? searchHotkey.replace(/mod/i, "Control") : undefined}
            sx={{
              width: "100%",
              maxWidth: 480,
              minWidth: 0,
              height: 36,
              px: "10px",
              gap: "8px",
              justifyContent: "flex-start",
              borderRadius: "var(--cn-radius-md, 8px)",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              backgroundColor: "var(--cn-color-surface-sunken, #f4f5f7)",
              color: "var(--cn-color-text-muted, #6e7682)",
              fontFamily: "inherit",
              fontSize: "var(--cn-font-size-md, 14px)",
              "&:hover": { borderColor: "var(--cn-color-border-strong, #c5cad0)" },
              "&.Mui-focusVisible": {
                outline:
                  "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
              },
            }}
          >
            <CnIcon name="search" size={18} />
            <Box
              component="span"
              sx={{
                flex: 1,
                minWidth: 0,
                textAlign: "left",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {searchPlaceholder}
            </Box>
            {searchHotkey && <KbdKeys hotkey={searchHotkey} />}
          </ButtonBase>
        )}
      </Box>

      {compact && (search || onSearchClick) && (
        <IconButton
          aria-label={searchPlaceholder}
          aria-expanded={search && !onSearchClick ? searchOpen : undefined}
          onClick={onSearchClick ?? (() => setSearchOpen(true))}
          sx={iconButtonSx}
        >
          <CnIcon name="search" size={22} />
        </IconButton>
      )}

      {/* en compacto, la búsqueda propia se abre encima de la barra */}
      {compact && search && !onSearchClick && searchOpen && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            px: "8px",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSearchOpen(false);
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>{search}</Box>
          <IconButton
            aria-label="Cerrar búsqueda"
            onClick={() => setSearchOpen(false)}
            sx={iconButtonSx}
          >
            <CnIcon name="close" size={22} />
          </IconButton>
        </Box>
      )}

      {actions && (
        <Box sx={{ flex: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          {actions}
        </Box>
      )}

      {user && (
        <>
          <IconButton
            aria-label={`Menú de ${user.name}`}
            aria-haspopup="menu"
            aria-expanded={Boolean(userAnchor)}
            aria-controls={userAnchor ? userMenuId : undefined}
            onClick={(event) => setUserAnchor(event.currentTarget)}
            sx={{ ...iconButtonSx, p: "4px" }}
          >
            <CnAvatar name={user.name} src={user.avatarSrc} size="sm" />
          </IconButton>
          <Menu
            id={userMenuId}
            open={Boolean(userAnchor)}
            anchorEl={userAnchor}
            onClose={() => setUserAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            MenuListProps={{ "aria-label": `Menú de ${user.name}` }}
            slotProps={{
              paper: { sx: { minWidth: 220, maxWidth: "min(320px, calc(100vw - 32px))" } },
            }}
          >
            <Box sx={{ px: "16px", py: "8px", minWidth: 0 }} aria-hidden>
              <Typography sx={{ fontSize: "14px", fontWeight: 600, overflowWrap: "anywhere" }}>
                {user.name}
              </Typography>
              {user.detail && (
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "var(--cn-color-text-muted, #6e7682)",
                    overflowWrap: "anywhere",
                  }}
                >
                  {user.detail}
                </Typography>
              )}
            </Box>
            {(regular.length > 0 || danger.length > 0) && <Divider />}
            {regular.map((action) => (
              <MenuItem
                key={action.id}
                onClick={() => {
                  setUserAnchor(null);
                  action.onClick?.();
                }}
                sx={{ gap: "10px", fontSize: "14px" }}
              >
                {action.icon && <CnIcon name={action.icon} size={18} />}
                {action.label}
              </MenuItem>
            ))}
            {danger.length > 0 && regular.length > 0 && <Divider />}
            {danger.map((action) => (
              <MenuItem
                key={action.id}
                onClick={() => {
                  setUserAnchor(null);
                  action.onClick?.();
                }}
                sx={{
                  gap: "10px",
                  fontSize: "14px",
                  color: "var(--cn-color-control-error-fg, var(--cn-color-error-600, #b52f2f))",
                }}
              >
                {action.icon && <CnIcon name={action.icon} size={18} />}
                {action.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
});
