import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEvent, ReactNode } from "react";
import { forwardRef, useId, useState } from "react";
import { useElementWidth } from "../../utils/use-element-width";
import { CnCommandPalette } from "../CnCommandPalette";
import type { CnCommandPaletteProps } from "../CnCommandPalette";
import { CnSidebarNav } from "../CnSidebarNav";
import type { CnSidebarNavItem, CnSidebarNavProps } from "../CnSidebarNav";
import { CnTopBar } from "../CnTopBar";
import type { CnTopBarProps } from "../CnTopBar";
import { CnAppShellSkeleton } from "./CnAppShellSkeleton";

export type CnAppShellProps = {
  /** Navegación lateral. El shell controla el modo mini y el cajón móvil. */
  nav: Omit<CnSidebarNavProps, "collapsed" | "onCollapsedChange" | "skeleton">;
  /** Barra superior. El botón de menú lo pone el shell. */
  topBar?: Omit<CnTopBarProps, "onMenuClick" | "menuOpen" | "menuLabel" | "compact" | "skeleton">;
  /** Paleta de comandos: se abre con su atajo y con el botón de búsqueda de la barra. */
  commandPalette?: Omit<CnCommandPaletteProps, "open" | "onOpenChange">;
  children?: ReactNode;
  /** Modo mini de la navegación (controlado). */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Ancho del shell (px) por debajo del cual la navegación pasa a un cajón. */
  mobileBelow?: number;
  /** Fuerza el diseño móvil (`true`) o de escritorio (`false`). Sin valor, se decide por el ancho. */
  mobile?: boolean;
  /** Cajón móvil abierto (controlado). */
  mobileNavOpen?: boolean;
  onMobileNavOpenChange?: (open: boolean) => void;
  /** Alto del shell. Por omisión ocupa la ventana. */
  height?: string | number;
  /** Texto del enlace para saltar al contenido (visible al recibir foco). */
  skipLinkLabel?: string;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

/** Estructura de aplicación: navegación lateral, barra superior, contenido con scroll propio y cajón en móvil. */
export const CnAppShell = forwardRef<HTMLDivElement, CnAppShellProps>(function CnAppShell(
  {
    nav,
    topBar,
    commandPalette,
    children,
    collapsed: collapsedProp,
    defaultCollapsed = false,
    onCollapsedChange,
    mobileBelow = 900,
    mobile: mobileProp,
    mobileNavOpen: drawerProp,
    onMobileNavOpenChange,
    height = "100dvh",
    skipLinkLabel = "Saltar al contenido",
    skeleton = false,
    sx,
    className,
  },
  ref,
) {
  const mainId = `${useId()}-main`;
  const { ref: measureRef, width } = useElementWidth<HTMLDivElement>();
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const [innerDrawer, setInnerDrawer] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const mobile = mobileProp ?? (width !== null && width < mobileBelow);
  const collapsed = collapsedProp ?? innerCollapsed;
  const drawerOpen = drawerProp ?? innerDrawer;

  const setCollapsed = (next: boolean) => {
    if (collapsedProp === undefined) setInnerCollapsed(next);
    onCollapsedChange?.(next);
  };
  const setDrawer = (next: boolean) => {
    if (drawerProp === undefined) setInnerDrawer(next);
    onMobileNavOpenChange?.(next);
  };

  if (skeleton)
    return (
      <CnAppShellSkeleton collapsed={collapsed} height={height} sx={sx} className={className} />
    );

  const setRefs = (node: HTMLDivElement | null) => {
    measureRef(node);
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const onNavigate = (item: CnSidebarNavItem, event: MouseEvent<HTMLElement>) => {
    nav.onNavigate?.(item, event);
    if (mobile) setDrawer(false);
  };

  const menuLabel = mobile ? "Abrir menú" : collapsed ? "Expandir menú" : "Contraer menú";

  return (
    <Box
      ref={setRefs}
      data-cn-app-shell
      data-mobile={mobile || undefined}
      className={className}
      sx={[
        {
          position: "relative",
          display: "flex",
          height,
          minWidth: 0,
          maxWidth: "100%",
          overflow: "hidden",
          backgroundColor: "var(--cn-color-bg, #fafbfc)",
          color: "var(--cn-color-text, #222831)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="a"
        href={`#${mainId}`}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          document.getElementById(mainId)?.focus();
        }}
        sx={{
          position: "absolute",
          left: "8px",
          top: "8px",
          zIndex: "var(--cn-z-popover, 1060)",
          px: "12px",
          py: "8px",
          borderRadius: "var(--cn-radius-md, 8px)",
          backgroundColor: "var(--cn-color-surface-elevated, #ffffff)",
          color: "var(--cn-color-text, #222831)",
          boxShadow: "var(--cn-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.12))",
          transform: "translateY(-150%)",
          "&:focus": { transform: "none" },
        }}
      >
        {skipLinkLabel}
      </Box>

      {!mobile && (
        <CnSidebarNav
          {...nav}
          collapsed={collapsed}
          onCollapsedChange={topBar ? undefined : setCollapsed}
          onNavigate={onNavigate}
          sx={[{ flex: "none" }, ...(Array.isArray(nav.sx) ? nav.sx : [nav.sx])]}
        />
      )}

      {mobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawer(false)}
          ModalProps={{ keepMounted: false }}
          slotProps={{ paper: { sx: { width: "min(280px, 85vw)", backgroundImage: "none" } } }}
        >
          <CnSidebarNav {...nav} onNavigate={onNavigate} sx={{ width: "100%", borderRight: 0 }} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {topBar && (
          <CnTopBar
            {...topBar}
            compact={mobile ? true : undefined}
            onMenuClick={() => (mobile ? setDrawer(!drawerOpen) : setCollapsed(!collapsed))}
            menuOpen={mobile ? drawerOpen : !collapsed}
            menuLabel={menuLabel}
            onSearchClick={
              commandPalette ? () => setPaletteOpen(true) : (topBar.onSearchClick ?? undefined)
            }
            sx={[{ flex: "none" }, ...(Array.isArray(topBar.sx) ? topBar.sx : [topBar.sx])]}
          />
        )}
        <Box
          component="main"
          id={mainId}
          tabIndex={-1}
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflow: "auto",
            outline: "none",
          }}
        >
          {children}
        </Box>
      </Box>

      {commandPalette && (
        <CnCommandPalette {...commandPalette} open={paletteOpen} onOpenChange={setPaletteOpen} />
      )}
    </Box>
  );
});
