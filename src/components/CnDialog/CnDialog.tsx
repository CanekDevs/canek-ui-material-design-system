import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { FormEvent, ReactNode, RefObject } from "react";
import { useCallback, useEffect, useId, useRef } from "react";
import type { CnTone } from "../../utils/tones";
import { CnDialogSkeleton } from "./CnDialogSkeleton";
import type { CnDialogSkeletonProps } from "./CnDialogSkeleton";
import type {
  CnDiscardConfirmOptions,
  CnOverlayAction,
  CnOverlayCloseReason,
} from "./overlay-parts";
import {
  actionKey,
  CnOverlayBody,
  CnOverlayFooter,
  CnOverlayHeader,
  overlayErrorMessage,
  useCloseGuard,
  useOverlayActions,
  useScrollShadows,
} from "./overlay-parts";

export type CnDialogSize = "sm" | "md" | "lg" | "xl" | "fullscreen";
export type CnDialogDensity = "comfortable" | "compact";
export type CnDialogInitialFocus =
  "dialog" | "first-field" | "primary-action" | RefObject<HTMLElement | null>;

export type CnDialogProps = {
  open: boolean;
  /** Se llama con el motivo cuando el cierre procede (tras guardas y confirmación). */
  onClose?: (reason: CnOverlayCloseReason) => void;

  // Encabezado
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Ícono del registro de `CnIcon`, nodo propio o `false`. */
  icon?: string | ReactNode | false;
  iconTone?: CnTone;
  /** Botones extra junto a cerrar (ayuda, pantalla completa, menú…). */
  headerActions?: ReactNode;
  /** Contenido bajo el título dentro del encabezado fijo (pestañas, pasos, buscador). */
  headerContent?: ReactNode;
  hideCloseButton?: boolean;
  closeLabel?: string;
  /** Flecha "Regresar" (diálogos con pasos o apilados). */
  onBack?: () => void;
  backLabel?: string;
  titleLines?: number;

  // Cuerpo y pie
  children?: ReactNode;
  actions?: readonly CnOverlayAction[];
  /** Contenido a la izquierda del pie. */
  footerStart?: ReactNode;
  /** Pie propio (sustituye a `actions`). */
  footer?: ReactNode;
  /** Error a mostrar sobre el cuerpo (texto, `Error` o error del servidor). */
  error?: unknown;

  // Tamaño
  size?: CnDialogSize;
  /** Pantalla completa por debajo del breakpoint (`true` = `sm`). */
  fullScreenOnMobile?: boolean | "sm" | "md";
  /** Alto fijo del panel (útil para contenido que cambia de alto, como pestañas). */
  height?: number | string;
  density?: CnDialogDensity;
  /** Líneas divisorias de encabezado/pie: siempre o solo al desplazar (`auto`). */
  dividers?: boolean | "auto";

  // Cierre
  disableBackdropClose?: boolean;
  disableEscapeKeyDown?: boolean;
  /** Hay cambios sin guardar: al cerrar se pide "¿Descartar cambios?". */
  dirty?: boolean;
  discardConfirm?: CnDiscardConfirmOptions | false;
  /** Devuelve `false` para cancelar el cierre (guardas propias). */
  onBeforeClose?: (reason: CnOverlayCloseReason) => boolean | void | Promise<boolean | void>;

  // Formulario
  /**
   * Convierte el panel en `<form>`: las acciones `type: "submit"` lo envían. Si
   * devuelve una promesa se muestra "cargando" y los errores quedan en el panel.
   */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void | Promise<unknown>;
  /** Cierra al terminar `onSubmit` sin error (sin confirmar cambios). */
  closeOnSubmit?: boolean;

  // Carga
  /** Cuerpo en carga (apertura asíncrona): mantiene el encabezado y muestra skeleton. */
  loading?: boolean;
  /** Ajustes del skeleton del cuerpo en `loading`. */
  loadingSkeleton?: Omit<CnDialogSkeletonProps, "header" | "footer">;
  /** Skeleton completo (encabezado, cuerpo y pie). */
  skeleton?: boolean;

  // Foco y accesibilidad
  /** Foco inicial al abrir; al cerrar regresa al elemento que lo abrió. */
  initialFocus?: CnDialogInitialFocus;
  role?: "dialog" | "alertdialog";
  ariaLabel?: string;
  ariaDescribedBy?: string;

  keepMounted?: boolean;
  onExited?: () => void;
  /** Props extra del `Dialog` de MUI (`disablePortal`, `container`, …). */
  dialogProps?: Partial<Omit<DialogProps, "open" | "onClose" | "children">>;
  paperSx?: SxProps<Theme>;
  bodySx?: SxProps<Theme>;
  className?: string;
  id?: string;
};

const WIDTHS: Record<Exclude<CnDialogSize, "fullscreen">, number> = {
  sm: 420,
  md: 600,
  lg: 880,
  xl: 1200,
};

const FIELD_SELECTOR = [
  "input:not([type=hidden]):not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[contenteditable=true]",
].join(",");

/**
 * Diálogo modal de propósito general: encabezado y pie fijos, cuerpo con
 * scroll y sombras, acciones con carga, tamaños, pantalla completa en móvil,
 * confirmación de cambios sin guardar y manejo de foco.
 */
export const CnDialog = ({
  open,
  onClose,
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
  size = "md",
  fullScreenOnMobile = false,
  height,
  density = "comfortable",
  dividers = "auto",
  disableBackdropClose = false,
  disableEscapeKeyDown = false,
  dirty = false,
  discardConfirm,
  onBeforeClose,
  onSubmit,
  closeOnSubmit = false,
  loading = false,
  loadingSkeleton,
  skeleton = false,
  initialFocus = "dialog",
  role = "dialog",
  ariaLabel,
  ariaDescribedBy,
  keepMounted,
  onExited,
  dialogProps,
  paperSx,
  bodySx,
  className,
  id,
}: CnDialogProps) => {
  const theme = useTheme();
  const breakpoint = fullScreenOnMobile === true ? "sm" : fullScreenOnMobile || "sm";
  const isSmall = useMediaQuery(theme.breakpoints.down(breakpoint));
  const fullScreen = size === "fullscreen" || (Boolean(fullScreenOnMobile) && isSmall);
  const padding = density === "compact" ? 16 : 24;

  const baseId = useId().replace(/:/g, "");
  const titleId = `${baseId}-title`;
  const subtitleId = `${baseId}-subtitle`;
  const formId = `${baseId}-form`;
  const paperRef = useRef<HTMLDivElement | null>(null);

  const actionsRef = useRef<
    (reason: CnOverlayCloseReason, o?: { skipDirty?: boolean; fromAction?: boolean }) => unknown
  >(() => undefined);
  const {
    pendingKey,
    error: actionError,
    setError,
    run,
  } = useOverlayActions((reason, options) => actionsRef.current(reason, options));
  const guard = useCloseGuard({
    onClose,
    dirty,
    discardConfirm,
    onBeforeClose,
    blocked: pendingKey !== null,
  });
  actionsRef.current = guard.requestClose;

  // Limpia el error de acciones en cada apertura.
  useEffect(() => {
    if (open) setError(null);
  }, [open, setError]);

  const scroll = useScrollShadows<HTMLDivElement>([open, loading, skeleton]);
  const autoDividers = dividers === "auto";
  const errorMessage = overlayErrorMessage(error) ?? actionError;

  const applyInitialFocus = useCallback(() => {
    const paper = paperRef.current;
    if (!paper || initialFocus === "dialog") return;
    let target: HTMLElement | null = null;
    if (typeof initialFocus === "object") target = initialFocus.current;
    else if (initialFocus === "first-field") {
      target = paper.querySelector<HTMLElement>(`[data-cn-dialog-body] :is(${FIELD_SELECTOR})`);
    } else if (initialFocus === "primary-action") {
      const index = (actions ?? []).findIndex(
        (a) => a.variant === "primary" || a.variant === "destructive",
      );
      if (index >= 0) {
        const key = actionKey(actions![index], index);
        target = paper.querySelector<HTMLElement>(`[data-cn-overlay-action="${key}"]`);
      }
    }
    target?.focus();
  }, [initialFocus, actions]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSubmit || pendingKey !== null) return;
    const index = (actions ?? []).findIndex((a) => a.type === "submit");
    const submitAction = index >= 0 ? actions![index] : undefined;
    void run(
      {
        label: submitAction?.label ?? "submit",
        variant: "primary",
        onClick: () => onSubmit(event),
        closes: closeOnSubmit,
        skipDirtyCheck: true,
      },
      submitAction ? actionKey(submitAction, index) : "submit",
    );
  };

  const header = (
    <CnOverlayHeader
      titleId={titleId}
      subtitleId={subtitleId}
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconTone={iconTone}
      headerActions={headerActions}
      onClose={hideCloseButton ? undefined : () => void guard.requestClose("closeButton")}
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
        <Box data-cn-dialog-header-content sx={{ mt: "12px", minWidth: 0 }}>
          {headerContent}
        </Box>
      )}
    </CnOverlayHeader>
  );

  const body = (
    <CnOverlayBody
      scroll={scroll}
      dataAttr="data-cn-dialog-body"
      errorMessage={errorMessage}
      loading={loading}
      loadingNode={
        <CnDialogSkeleton
          header={false}
          footer={false}
          padding={0}
          ariaLabel="Cargando contenido del diálogo"
          {...loadingSkeleton}
        />
      }
      padding={padding}
      sx={bodySx}
    >
      {children}
    </CnOverlayBody>
  );

  const footerNode = (
    <CnOverlayFooter
      actions={actions}
      footerStart={footerStart}
      footer={footer}
      pendingKey={pendingKey}
      onAction={(action, key) => void run(action, key)}
      formId={onSubmit ? formId : undefined}
      raised={autoDividers && scroll.bottom}
      divider={dividers === true}
      padding={padding}
    />
  );

  const content = skeleton ? (
    <CnDialogSkeleton
      icon={Boolean(icon)}
      subtitle={Boolean(subtitle)}
      closeButton={!hideCloseButton}
      actions={actions?.length ?? 0}
      footer={Boolean(actions?.length || footer)}
      padding={padding}
      ariaLabel="Cargando diálogo"
    />
  ) : (
    <>
      {header}
      {body}
      {footerNode}
    </>
  );

  return (
    <>
      <Dialog
        {...dialogProps}
        open={open}
        keepMounted={keepMounted}
        fullScreen={fullScreen}
        maxWidth={false}
        scroll="paper"
        disableEscapeKeyDown={disableEscapeKeyDown}
        onClose={(_event, reason) => {
          if (reason === "backdropClick" && disableBackdropClose) return;
          void guard.requestClose(reason);
        }}
        role={role}
        aria-labelledby={title != null ? titleId : undefined}
        aria-describedby={ariaDescribedBy ?? (subtitle != null ? subtitleId : undefined)}
        className={className}
        id={id}
        data-cn-dialog={size}
        slotProps={{
          ...dialogProps?.slotProps,
          transition: {
            onEntered: applyInitialFocus,
            onExited,
          },
          paper: {
            ref: paperRef,
            "aria-label": title == null ? ariaLabel : undefined,
            "data-fullscreen": fullScreen || undefined,
            sx: [
              {
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                containerType: "inline-size",
                backgroundColor: "var(--cn-color-surface, #ffffff)",
                backgroundImage: "none",
                boxShadow: "var(--cn-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.18))",
              },
              fullScreen
                ? { m: 0, width: "100%", maxWidth: "100%", height: "100%", maxHeight: "100%" }
                : {
                    m: "16px",
                    width: "calc(100% - 32px)",
                    maxWidth: WIDTHS[size as keyof typeof WIDTHS],
                    maxHeight: "calc(100% - 32px)",
                    borderRadius: "var(--cn-radius-lg, 12px)",
                    ...(height != null && { height }),
                  },
              ...(Array.isArray(paperSx) ? paperSx : [paperSx]),
            ],
          } as never,
        }}
      >
        {onSubmit && !skeleton ? (
          <Box
            component="form"
            id={formId}
            noValidate
            onSubmit={handleSubmit}
            sx={{ display: "contents" }}
          >
            {content}
          </Box>
        ) : (
          content
        )}
      </Dialog>
      {guard.confirmNode}
    </>
  );
};
