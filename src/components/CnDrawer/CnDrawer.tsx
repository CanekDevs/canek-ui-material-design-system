import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import type { DrawerProps } from "@mui/material/Drawer";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import type { CnTone } from "../../utils/tones";
import { CnButton } from "../CnButton";
import { CnDialogSkeleton } from "../CnDialog/CnDialogSkeleton";
import type { CnDialogSkeletonProps } from "../CnDialog/CnDialogSkeleton";
import type {
  CnDiscardConfirmOptions,
  CnOverlayAction,
  CnOverlayCloseReason,
} from "../CnDialog/overlay-parts";
import {
  CnOverlayBody,
  CnOverlayFooter,
  CnOverlayHeader,
  overlayErrorMessage,
  useCloseGuard,
  useOverlayActions,
  useScrollShadows,
} from "../CnDialog/overlay-parts";
import { CnIcon } from "../CnIcon";
import { CnDrawerSkeleton } from "./CnDrawerSkeleton";

export type CnDrawerAnchor = "left" | "right" | "bottom";
/**
 * - `temporary`: modal sobre la página (con fondo), se cierra con Esc/clic fuera.
 * - `persistent`: en el flujo de la página, empuja el contenido; no bloquea.
 * - `mini`: persistente que al contraerse deja una franja con íconos.
 */
export type CnDrawerVariant = "temporary" | "persistent" | "mini";
export type CnDrawerSize = "sm" | "md" | "lg" | "xl" | "full";

export type CnDrawerProps = {
  open: boolean;
  /** Cierre (o contracción en `mini`) tras guardas y confirmación. */
  onClose?: (reason: CnOverlayCloseReason) => void;
  /** Expandir desde la franja `mini`. */
  onOpen?: () => void;
  anchor?: CnDrawerAnchor;
  variant?: CnDrawerVariant;
  /** Ancho (izq./der.) o alto (abajo): token o medida propia. */
  size?: CnDrawerSize | number | string;
  /** Permite arrastrar el borde interno para cambiar el tamaño. */
  resizable?: boolean;
  /** Tamaño controlado en px (con `resizable`). */
  resizeValue?: number;
  onResize?: (size: number) => void;
  minSize?: number;
  maxSize?: number;
  /** Ancho de la franja en `mini`. */
  miniSize?: number;
  /** Contenido de la franja `mini` contraída (por defecto, botón expandir + ícono). */
  miniContent?: ReactNode;

  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: string | ReactNode | false;
  iconTone?: CnTone;
  headerActions?: ReactNode;
  headerContent?: ReactNode;
  hideCloseButton?: boolean;
  closeLabel?: string;
  /** Flecha "Regresar" (paneles anidados). */
  onBack?: () => void;
  backLabel?: string;
  titleLines?: number;

  children?: ReactNode;
  actions?: readonly CnOverlayAction[];
  footerStart?: ReactNode;
  footer?: ReactNode;
  error?: unknown;

  dirty?: boolean;
  discardConfirm?: CnDiscardConfirmOptions | false;
  onBeforeClose?: (reason: CnOverlayCloseReason) => boolean | void | Promise<boolean | void>;
  disableBackdropClose?: boolean;
  disableEscapeKeyDown?: boolean;
  hideBackdrop?: boolean;

  /** Cuerpo en carga (mantiene el encabezado). */
  loading?: boolean;
  loadingSkeleton?: Omit<CnDialogSkeletonProps, "header" | "footer">;
  /** Skeleton completo del panel. */
  skeleton?: boolean;

  /** Ancho completo por debajo del breakpoint (`true` = `sm`). Solo `temporary`. */
  fullScreenOnMobile?: boolean | "sm" | "md";
  density?: "comfortable" | "compact";
  dividers?: boolean | "auto";

  ariaLabel?: string;
  keepMounted?: boolean;
  onExited?: () => void;
  /** Props extra del `Drawer` de MUI (solo `temporary`). */
  drawerProps?: Partial<Omit<DrawerProps, "open" | "onClose" | "children" | "anchor">>;
  paperSx?: SxProps<Theme>;
  bodySx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
  className?: string;
  id?: string;
};

const SIDE_SIZES: Record<CnDrawerSize, number | string> = {
  sm: 320,
  md: 440,
  lg: 640,
  xl: 880,
  full: "100%",
};
const BOTTOM_SIZES: Record<CnDrawerSize, string> = {
  sm: "30vh",
  md: "50vh",
  lg: "75vh",
  xl: "90vh",
  full: "100vh",
};
const BOTTOM_PERSISTENT: Record<CnDrawerSize, number | string> = {
  sm: 200,
  md: 320,
  lg: 480,
  xl: 640,
  full: "100%",
};

const KEY_STEP = 16;

const resolveSize = (
  size: CnDrawerSize | number | string,
  anchor: CnDrawerAnchor,
  variant: CnDrawerVariant,
): number | string => {
  if (typeof size === "number") return size;
  if (size in SIDE_SIZES) {
    const token = size as CnDrawerSize;
    if (anchor !== "bottom") return SIDE_SIZES[token];
    return variant === "temporary" ? BOTTOM_SIZES[token] : BOTTOM_PERSISTENT[token];
  }
  return size;
};

const cssSize = (value: number | string) => (typeof value === "number" ? `${value}px` : value);

/**
 * Panel lateral (izquierda, derecha o abajo) con el mismo encabezado, cuerpo y
 * pie que `CnDialog`: temporal (modal), persistente o mini; tamaño ajustable
 * arrastrando el borde y paneles anidados.
 */
export const CnDrawer = ({
  open,
  onClose,
  onOpen,
  anchor = "right",
  variant = "temporary",
  size = "md",
  resizable = false,
  resizeValue,
  onResize,
  minSize = 280,
  maxSize,
  miniSize = 64,
  miniContent,
  title,
  subtitle,
  icon,
  iconTone,
  headerActions,
  headerContent,
  hideCloseButton = false,
  closeLabel,
  onBack,
  backLabel,
  titleLines,
  children,
  actions,
  footerStart,
  footer,
  error,
  dirty = false,
  discardConfirm,
  onBeforeClose,
  disableBackdropClose = false,
  disableEscapeKeyDown = false,
  hideBackdrop,
  loading = false,
  loadingSkeleton,
  skeleton = false,
  fullScreenOnMobile = false,
  density = "comfortable",
  dividers = "auto",
  ariaLabel,
  keepMounted,
  onExited,
  drawerProps,
  paperSx,
  bodySx,
  sx,
  className,
  id,
}: CnDrawerProps) => {
  const theme = useTheme();
  const breakpoint = fullScreenOnMobile === true ? "sm" : fullScreenOnMobile || "sm";
  const isSmall = useMediaQuery(theme.breakpoints.down(breakpoint));
  const temporary = variant === "temporary";
  const mini = variant === "mini";
  const vertical = anchor === "bottom";
  const fullScreen = temporary && Boolean(fullScreenOnMobile) && isSmall;
  const padding = density === "compact" ? 16 : 20;

  const baseId = useId().replace(/:/g, "");
  const titleId = `${baseId}-title`;
  const subtitleId = `${baseId}-subtitle`;

  // ─── Tamaño ajustable ──────────────────────────────────────────────
  const baseSize = resolveSize(size, anchor, variant);
  const [dragSize, setDragSize] = useState<number | null>(null);
  const currentPx = resizeValue ?? dragSize;
  const effectiveSize: number | string = resizable && currentPx != null ? currentPx : baseSize;
  const panelRef = useRef<HTMLDivElement | null>(null);

  const viewportMax = () => {
    if (typeof window === "undefined") return maxSize ?? 4000;
    const limit = (vertical ? window.innerHeight : window.innerWidth) - 16;
    return Math.max(minSize, Math.min(maxSize ?? limit, limit));
  };
  const clamp = (value: number) => Math.round(Math.min(viewportMax(), Math.max(minSize, value)));
  const commitSize = (value: number) => {
    const next = clamp(value);
    if (resizeValue === undefined) setDragSize(next);
    onResize?.(next);
  };
  const measured = () => {
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return typeof effectiveSize === "number" ? effectiveSize : minSize;
    return vertical ? rect.height : rect.width;
  };

  const onHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const start = vertical ? event.clientY : event.clientX;
    const startSize = measured();
    const sign = anchor === "right" || anchor === "bottom" ? -1 : 1;
    const move = (e: PointerEvent) => {
      const delta = (vertical ? e.clientY : e.clientX) - start;
      commitSize(startSize + sign * delta);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.removeProperty("user-select");
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onHandleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const grow = anchor === "right" ? "ArrowLeft" : anchor === "left" ? "ArrowRight" : "ArrowUp";
    const shrink =
      anchor === "right" ? "ArrowRight" : anchor === "left" ? "ArrowLeft" : "ArrowDown";
    const step = event.shiftKey ? KEY_STEP * 4 : KEY_STEP;
    let next: number | null = null;
    if (event.key === grow) next = measured() + step;
    else if (event.key === shrink) next = measured() - step;
    else if (event.key === "Home") next = minSize;
    else if (event.key === "End") next = viewportMax();
    if (next === null) return;
    event.preventDefault();
    commitSize(next);
  };

  // ─── Cierre, acciones y scroll ─────────────────────────────────────
  const closeRef = useRef<
    (reason: CnOverlayCloseReason, o?: { skipDirty?: boolean; fromAction?: boolean }) => unknown
  >(() => undefined);
  const {
    pendingKey,
    error: actionError,
    setError,
    run,
  } = useOverlayActions((reason, options) => closeRef.current(reason, options));
  const guard = useCloseGuard({
    onClose,
    dirty,
    discardConfirm,
    onBeforeClose,
    blocked: pendingKey !== null,
  });
  closeRef.current = guard.requestClose;

  useEffect(() => {
    if (open) setError(null);
  }, [open, setError]);

  // Persistente/mini: devuelve el foco al cerrarse si estaba dentro del panel.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const expandButtonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (temporary) return;
    if (open) {
      const active = document.activeElement as HTMLElement | null;
      if (active && !panelRef.current?.contains(active)) returnFocusRef.current = active;
      return;
    }
    const active = document.activeElement;
    if (active && panelRef.current?.contains(active)) {
      const target = mini ? expandButtonRef.current : returnFocusRef.current;
      target?.focus();
    }
  }, [open, temporary, mini]);

  const scroll = useScrollShadows<HTMLDivElement>([open, loading, skeleton]);
  const autoDividers = dividers === "auto";
  const errorMessage = overlayErrorMessage(error) ?? actionError;

  const collapseIcon =
    anchor === "right" ? "chevron_right" : anchor === "left" ? "chevron_left" : "expand_more";
  const expandIcon =
    anchor === "right" ? "chevron_left" : anchor === "left" ? "chevron_right" : "expand_less";

  const header = (
    <CnOverlayHeader
      titleId={titleId}
      subtitleId={subtitleId}
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconTone={iconTone}
      headerActions={
        mini && !hideCloseButton ? (
          <>
            {headerActions}
            <CnButton
              iconOnly
              icon={collapseIcon}
              size="small"
              variant="text"
              color="neutral"
              aria-label={closeLabel ?? "Contraer panel"}
              aria-expanded
              onClick={() => void guard.requestClose("closeButton")}
              data-cn-drawer-collapse
            />
          </>
        ) : (
          headerActions
        )
      }
      onClose={hideCloseButton || mini ? undefined : () => void guard.requestClose("closeButton")}
      closeLabel={closeLabel}
      closeDisabled={pendingKey !== null}
      onBack={onBack}
      backLabel={backLabel}
      titleLines={titleLines}
      raised={autoDividers && scroll.top}
      divider={dividers === true}
      padding={padding}
    >
      {headerContent && (
        <Box data-cn-drawer-header-content sx={{ mt: "12px", minWidth: 0 }}>
          {headerContent}
        </Box>
      )}
    </CnOverlayHeader>
  );

  const content = skeleton ? (
    <CnDrawerSkeleton
      icon={Boolean(icon)}
      subtitle={Boolean(subtitle)}
      closeButton={!hideCloseButton}
      actions={actions?.length ?? 0}
      footer={Boolean(actions?.length || footer)}
      padding={padding}
    />
  ) : (
    <>
      {header}
      <CnOverlayBody
        scroll={scroll}
        dataAttr="data-cn-drawer-body"
        errorMessage={errorMessage}
        loading={loading}
        loadingNode={
          <CnDialogSkeleton
            header={false}
            footer={false}
            padding={0}
            ariaLabel="Cargando contenido del panel"
            {...loadingSkeleton}
          />
        }
        padding={padding}
        sx={bodySx}
      >
        {children}
      </CnOverlayBody>
      <CnOverlayFooter
        actions={actions}
        footerStart={footerStart}
        footer={footer}
        pendingKey={pendingKey}
        onAction={(action, key) => void run(action, key)}
        raised={autoDividers && scroll.bottom}
        divider={dividers === true}
        padding={padding}
      />
    </>
  );

  const handle = resizable && !fullScreen && (
    <Box
      role="separator"
      tabIndex={0}
      aria-label="Cambiar tamaño del panel"
      aria-orientation={vertical ? "horizontal" : "vertical"}
      aria-valuemin={minSize}
      aria-valuemax={maxSize}
      aria-valuenow={typeof effectiveSize === "number" ? effectiveSize : undefined}
      data-cn-drawer-resize
      onPointerDown={onHandlePointerDown}
      onKeyDown={onHandleKeyDown}
      onDoubleClick={() => {
        if (resizeValue === undefined) setDragSize(null);
        if (typeof baseSize === "number") onResize?.(baseSize);
      }}
      sx={{
        position: "absolute",
        zIndex: 3,
        touchAction: "none",
        outline: "none",
        ...(vertical
          ? { left: 0, right: 0, top: -4, height: 8, cursor: "row-resize" }
          : {
              top: 0,
              bottom: 0,
              width: 8,
              cursor: "col-resize",
              [anchor === "right" ? "left" : "right"]: -4,
            }),
        "&::after": {
          content: '""',
          position: "absolute",
          borderRadius: 2,
          backgroundColor: "transparent",
          transition: "background-color 120ms ease",
          ...(vertical
            ? { left: "50%", width: 40, ml: "-20px", top: 2, height: 4 }
            : { top: "50%", height: 40, mt: "-20px", left: 2, width: 4 }),
        },
        "&:hover::after, &:focus-visible::after": {
          backgroundColor: "var(--cn-color-brand-500, #3562a6)",
        },
      }}
    />
  );

  const panelSizeSx = vertical
    ? { height: fullScreen ? "100%" : cssSize(effectiveSize), maxHeight: "100%", width: "100%" }
    : { width: fullScreen ? "100%" : cssSize(effectiveSize), maxWidth: "100%" };

  const borderSide =
    anchor === "right" ? "borderLeft" : anchor === "left" ? "borderRight" : "borderTop";

  // ─── Temporal (modal) ──────────────────────────────────────────────
  if (temporary) {
    return (
      <>
        <Drawer
          {...drawerProps}
          anchor={anchor}
          open={open}
          keepMounted={keepMounted}
          hideBackdrop={hideBackdrop}
          disableEscapeKeyDown={disableEscapeKeyDown}
          onClose={(_event, reason) => {
            if (reason === "backdropClick" && disableBackdropClose) return;
            void guard.requestClose(reason);
          }}
          className={className}
          id={id}
          data-cn-drawer={variant}
          data-anchor={anchor}
          sx={sx}
          slotProps={{
            ...drawerProps?.slotProps,
            transition: { onExited },
            paper: {
              ref: panelRef,
              role: "dialog",
              "aria-modal": true,
              "aria-labelledby": title != null ? titleId : undefined,
              "aria-describedby": subtitle != null ? subtitleId : undefined,
              "aria-label": title == null ? ariaLabel : undefined,
              sx: [
                {
                  ...panelSizeSx,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "visible",
                  containerType: "inline-size",
                  backgroundColor: "var(--cn-color-surface, #ffffff)",
                  backgroundImage: "none",
                  boxShadow: "var(--cn-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.18))",
                  ...(vertical && {
                    borderTopLeftRadius: fullScreen ? 0 : "var(--cn-radius-lg, 12px)",
                    borderTopRightRadius: fullScreen ? 0 : "var(--cn-radius-lg, 12px)",
                  }),
                },
                ...(Array.isArray(paperSx) ? paperSx : [paperSx]),
              ],
            } as never,
          }}
        >
          {handle}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              borderRadius: "inherit",
            }}
          >
            {content}
          </Box>
        </Drawer>
        {guard.confirmNode}
      </>
    );
  }

  // ─── Persistente / mini (en el flujo) ───────────────────────────────
  const collapsedSize = mini ? miniSize : 0;
  const sizeProp = vertical ? "height" : "width";
  return (
    <>
      <Box
        component="aside"
        ref={panelRef}
        id={id}
        className={className}
        data-cn-drawer={variant}
        data-anchor={anchor}
        data-open={open || undefined}
        aria-labelledby={open && title != null ? titleId : undefined}
        aria-label={
          !open || title == null
            ? (ariaLabel ?? (typeof title === "string" ? title : undefined))
            : undefined
        }
        onKeyDown={(event) => {
          if (event.key === "Escape" && open && !disableEscapeKeyDown && !event.defaultPrevented) {
            event.stopPropagation();
            void guard.requestClose("escapeKeyDown");
          }
        }}
        sx={[
          {
            position: "relative",
            flexShrink: 0,
            boxSizing: "border-box",
            [sizeProp]: open ? cssSize(effectiveSize) : `${collapsedSize}px`,
            maxWidth: "100%",
            ...(vertical ? { width: "100%" } : { height: "100%" }),
            [borderSide]:
              open || mini ? "1px solid var(--cn-color-border, #dde0e4)" : "0 solid transparent",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            transition: `${sizeProp} 200ms ease`,
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {open && handle}
        <Box
          sx={[
            {
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              containerType: "inline-size",
              visibility: open ? "visible" : "hidden",
            },
            ...(Array.isArray(paperSx) ? paperSx : [paperSx]),
          ]}
          aria-hidden={!open || undefined}
        >
          {(open || keepMounted) && content}
        </Box>
        {mini && !open && (
          <Box
            data-cn-drawer-mini
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: vertical ? "row" : "column",
              alignItems: "center",
              gap: "8px",
              py: "12px",
              px: vertical ? "12px" : 0,
              overflow: "hidden",
            }}
          >
            <CnButton
              ref={expandButtonRef}
              iconOnly
              icon={expandIcon}
              size="small"
              variant="text"
              color="neutral"
              aria-label={typeof title === "string" ? `Expandir ${title}` : "Expandir panel"}
              aria-expanded={false}
              onClick={onOpen}
              data-cn-drawer-expand
            />
            {miniContent ??
              (typeof icon === "string" && (
                <Box
                  aria-hidden
                  sx={{ color: "var(--cn-color-text-muted, #6e7682)", display: "flex" }}
                >
                  <CnIcon name={icon} size="md" />
                </Box>
              ))}
          </Box>
        )}
      </Box>
      {guard.confirmNode}
    </>
  );
};
