import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { ReactNode, UIEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CnTone } from "../../utils/tones";
import { CN_TONES } from "../../utils/tones";
import { CnAlert } from "../CnAlert";
import { CnButton } from "../CnButton";
import type { CnButtonColor } from "../CnButton";
import { CnConfirmDialog } from "../CnConfirmDialog";
import type { CnConfirmDialogProps } from "../CnConfirmDialog";
import { getServerErrorMessage } from "../CnForm/CnForm.helpers";
import { CnIcon } from "../CnIcon";

/*
 * Piezas compartidas por los paneles superpuestos (`CnDialog` y `CnDrawer`):
 * encabezado, pie con acciones, cuerpo con sombras de scroll y la guarda de
 * cierre con cambios sin guardar.
 */

/** Por qué se pidió cerrar el panel. */
export type CnOverlayCloseReason =
  "backdropClick" | "escapeKeyDown" | "closeButton" | "action" | "programmatic";

/** Jerarquía visual de una acción del pie. */
export type CnOverlayActionVariant = "primary" | "secondary" | "destructive" | "text";

export type CnOverlayAction = {
  id?: string;
  label: string;
  variant?: CnOverlayActionVariant;
  /** Color propio (sustituye al del `variant`). */
  color?: CnButtonColor;
  icon?: string;
  /** Si devuelve una promesa, el botón muestra "cargando" y bloquea el cierre. */
  onClick?: () => void | Promise<unknown>;
  loading?: boolean;
  disabled?: boolean;
  /**
   * Cierra el panel al terminar `onClick`. En `secondary`/`text` (cancelar)
   * pasa por la confirmación de cambios sin guardar; en `primary`/`destructive`
   * no (la acción es el guardado). Ajusta con `skipDirtyCheck`.
   */
  closes?: boolean;
  skipDirtyCheck?: boolean;
  /** `submit` envía el formulario del panel (`onSubmit`). */
  type?: "button" | "submit";
  /** Lado del pie (por defecto `end`). */
  align?: "start" | "end";
  autoFocus?: boolean;
  /** Texto accesible (si la etiqueta no basta). */
  ariaLabel?: string;
};

/** Textos de la confirmación "¿Descartar cambios?". */
export type CnDiscardConfirmOptions = Pick<
  CnConfirmDialogProps,
  "title" | "message" | "confirmLabel" | "cancelLabel" | "variant" | "icon" | "confirmColor"
>;

export const CN_DISCARD_CONFIRM_DEFAULTS: Required<
  Pick<CnDiscardConfirmOptions, "title" | "message" | "confirmLabel" | "cancelLabel" | "variant">
> & { confirmColor: CnButtonColor; icon: string } = {
  title: "¿Descartar cambios?",
  message: "Tienes cambios sin guardar. Si cierras, se perderán.",
  confirmLabel: "Descartar",
  cancelLabel: "Seguir editando",
  variant: "warning",
  confirmColor: "error",
  icon: "edit_off",
};

const ACTION_STYLE: Record<
  CnOverlayActionVariant,
  { variant: "contained" | "outlined" | "text"; color: CnButtonColor }
> = {
  primary: { variant: "contained", color: "primary" },
  secondary: { variant: "outlined", color: "neutral" },
  destructive: { variant: "contained", color: "error" },
  text: { variant: "text", color: "neutral" },
};

/** Mensaje legible de un error (texto, `Error` o error del servidor). */
export const overlayErrorMessage = (error: unknown): string | null => {
  if (!error) return null;
  if (typeof error === "string") return error;
  return (
    getServerErrorMessage(error) ??
    (error instanceof Error ? error.message : null) ??
    "No se pudo completar la acción."
  );
};

const isPromise = (value: unknown): value is Promise<unknown> =>
  Boolean(value) && typeof (value as Promise<unknown>).then === "function";

// ─── Guarda de cierre ─────────────────────────────────────────────────────

export type UseCloseGuardOptions = {
  onClose?: (reason: CnOverlayCloseReason) => void;
  /** Hay cambios sin guardar: pide confirmación antes de cerrar. */
  dirty?: boolean;
  /** Textos de la confirmación o `false` para cerrar sin preguntar. */
  discardConfirm?: CnDiscardConfirmOptions | false;
  /** Devuelve `false` (o una promesa con `false`) para cancelar el cierre. */
  onBeforeClose?: (reason: CnOverlayCloseReason) => boolean | void | Promise<boolean | void>;
  /** Bloquea el cierre (p. ej. mientras corre una acción). */
  blocked?: boolean;
};

/**
 * Centraliza el cierre: respeta acciones en curso, `onBeforeClose` y la
 * confirmación de cambios sin guardar (con `CnConfirmDialog`).
 */
export const useCloseGuard = ({
  onClose,
  dirty = false,
  discardConfirm,
  onBeforeClose,
  blocked = false,
}: UseCloseGuardOptions) => {
  const [pendingReason, setPendingReason] = useState<CnOverlayCloseReason | null>(null);
  const reasonRef = useRef<CnOverlayCloseReason | null>(null);

  const requestClose = useCallback(
    async (
      reason: CnOverlayCloseReason,
      options: { skipDirty?: boolean; fromAction?: boolean } = {},
    ) => {
      if (blocked && !options.fromAction) return false;
      if (onBeforeClose) {
        const allowed = await onBeforeClose(reason);
        if (allowed === false) return false;
      }
      if (dirty && !options.skipDirty && discardConfirm !== false) {
        reasonRef.current = reason;
        setPendingReason(reason);
        return false;
      }
      onClose?.(reason);
      return true;
    },
    [blocked, onBeforeClose, dirty, discardConfirm, onClose],
  );

  const texts = { ...CN_DISCARD_CONFIRM_DEFAULTS, ...(discardConfirm || {}) };
  const confirmNode = (
    <CnConfirmDialog
      open={pendingReason !== null}
      variant={texts.variant}
      title={texts.title}
      message={texts.message}
      confirmLabel={texts.confirmLabel}
      cancelLabel={texts.cancelLabel}
      confirmColor={texts.confirmColor}
      icon={texts.icon}
      onClose={() => setPendingReason(null)}
      onConfirm={() => {
        const reason = reasonRef.current ?? "programmatic";
        reasonRef.current = null;
        onClose?.(reason);
      }}
    />
  );

  return { requestClose, confirmNode, confirming: pendingReason !== null };
};

// ─── Acciones ─────────────────────────────────────────────────────────────

/** Ejecuta acciones del pie con carga, error y cierre. */
export const useOverlayActions = (
  requestClose: (
    reason: CnOverlayCloseReason,
    options?: { skipDirty?: boolean; fromAction?: boolean },
  ) => unknown,
) => {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (action: CnOverlayAction, key: string) => {
      setError(null);
      try {
        const result = action.onClick?.();
        if (isPromise(result)) {
          setPendingKey(key);
          await result;
        }
        if (mounted.current) setPendingKey(null);
        if (action.closes) {
          const variant = action.variant ?? "secondary";
          const skipDirty =
            action.skipDirtyCheck ?? (variant === "primary" || variant === "destructive");
          await requestClose("action", { skipDirty, fromAction: true });
        }
      } catch (caught) {
        if (mounted.current) {
          setPendingKey(null);
          setError(overlayErrorMessage(caught));
        }
      }
    },
    [requestClose],
  );

  return { pendingKey, error, setError, run };
};

// ─── Sombras de scroll ────────────────────────────────────────────────────

/** Indica si hay contenido oculto arriba o abajo del cuerpo desplazable. */
export const useScrollShadows = <E extends HTMLElement>(deps: readonly unknown[] = []) => {
  const ref = useRef<E | null>(null);
  const [state, setState] = useState({ top: false, bottom: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.scrollTop > 1;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    setState((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  const onScroll = useCallback((_event: UIEvent<E>) => measure(), [measure]);
  return { ref, onScroll, ...state, measure };
};

// ─── Encabezado ───────────────────────────────────────────────────────────

export type CnOverlayHeaderProps = {
  titleId: string;
  subtitleId?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: string | ReactNode | false;
  iconTone?: CnTone;
  headerActions?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  closeDisabled?: boolean;
  onBack?: () => void;
  backLabel?: string;
  /** Muestra la línea/sombra inferior (contenido desplazado). */
  raised?: boolean;
  /** Borde inferior siempre visible. */
  divider?: boolean;
  /** Líneas máximas del título. */
  titleLines?: number;
  padding: number;
  children?: ReactNode;
};

export const CnOverlayHeader = ({
  titleId,
  subtitleId,
  title,
  subtitle,
  icon,
  iconTone = "primary",
  headerActions,
  onClose,
  closeLabel = "Cerrar",
  closeDisabled,
  onBack,
  backLabel = "Regresar",
  raised = false,
  divider = false,
  titleLines = 3,
  padding,
  children,
}: CnOverlayHeaderProps) => {
  const tone = CN_TONES[iconTone];
  const clamp = (lines: number) => ({
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as const,
    WebkitLineClamp: lines,
    overflow: "hidden",
  });
  return (
    <Box
      data-cn-overlay-header
      data-raised={raised || undefined}
      sx={{
        position: "relative",
        zIndex: 1,
        flexShrink: 0,
        px: `${padding}px`,
        pt: `${padding - 4}px`,
        pb: children ? 0 : `${padding - 6}px`,
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        borderBottom: "1px solid",
        borderBottomColor:
          divider || raised ? "var(--cn-color-border-subtle, #e9ecef)" : "transparent",
        boxShadow: raised ? "0 6px 10px -8px rgba(15, 23, 42, 0.25)" : "none",
        transition: "box-shadow 160ms ease, border-color 160ms ease",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: "12px", minWidth: 0 }}>
        {onBack && (
          <CnButton
            iconOnly
            icon="arrow_back"
            size="small"
            variant="text"
            color="neutral"
            aria-label={backLabel}
            onClick={onBack}
            data-cn-overlay-back
            sx={{ flexShrink: 0, mt: "2px" }}
          />
        )}
        {icon !== false && icon != null && (
          <Box
            aria-hidden
            data-cn-overlay-icon
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: "var(--cn-radius-md, 8px)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: tone.main,
              backgroundColor: tone.soft,
            }}
          >
            {typeof icon === "string" ? <CnIcon name={icon} size="md" /> : icon}
          </Box>
        )}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 36,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "2px",
          }}
        >
          {title != null && (
            <Typography
              id={titleId}
              component="h2"
              sx={{
                m: 0,
                fontSize: "var(--cn-font-size-lg, 16px)",
                fontWeight: 700,
                lineHeight: 1.35,
                color: "var(--cn-color-text, #222831)",
                overflowWrap: "anywhere",
                ...clamp(titleLines),
              }}
            >
              {title}
            </Typography>
          )}
          {subtitle != null && (
            <Typography
              id={subtitleId}
              component="div"
              sx={{
                fontSize: "var(--cn-font-size-sm, 12px)",
                color: "var(--cn-color-text-muted, #6e7682)",
                lineHeight: 1.45,
                overflowWrap: "anywhere",
                ...clamp(2),
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {headerActions && (
          <Box
            data-cn-overlay-header-actions
            sx={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
          >
            {headerActions}
          </Box>
        )}
        {onClose && (
          <CnButton
            iconOnly
            icon="close"
            size="small"
            variant="text"
            color="neutral"
            aria-label={closeLabel}
            disabled={closeDisabled}
            onClick={onClose}
            data-cn-overlay-close
            sx={{ flexShrink: 0, mt: "2px" }}
          />
        )}
      </Box>
      {children}
    </Box>
  );
};

// ─── Cuerpo ───────────────────────────────────────────────────────────────

export type CnOverlayBodyProps = {
  scroll: ReturnType<typeof useScrollShadows<HTMLDivElement>>;
  errorMessage?: string | null;
  loading?: boolean;
  loadingNode?: ReactNode;
  padding: number;
  /** Atributo `data-*` que identifica el cuerpo. */
  dataAttr: string;
  sx?: SxProps<Theme>;
  children?: ReactNode;
};

/** Cuerpo desplazable: error arriba, skeleton en carga y foco por teclado si hay scroll. */
export const CnOverlayBody = ({
  scroll,
  errorMessage,
  loading = false,
  loadingNode,
  padding,
  dataAttr,
  sx,
  children,
}: CnOverlayBodyProps) => {
  const overflowing = scroll.top || scroll.bottom;
  return (
    <Box
      ref={scroll.ref}
      onScroll={scroll.onScroll}
      {...{ [dataAttr]: "" }}
      tabIndex={overflowing && !loading ? 0 : undefined}
      aria-busy={loading || undefined}
      sx={[
        {
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          px: `${padding}px`,
          py: "8px",
          fontSize: "var(--cn-font-size-base, 13px)",
          color: "var(--cn-color-text, #222831)",
          lineHeight: 1.55,
          overflowWrap: "anywhere",
          outline: "none",
          "&:focus-visible": {
            boxShadow: "inset 0 0 0 2px var(--cn-color-brand-500, #3562a6)",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {errorMessage && (
        <CnAlert severity="error" variant="outlined" sx={{ mb: "12px" }}>
          {errorMessage}
        </CnAlert>
      )}
      {loading ? loadingNode : children}
    </Box>
  );
};

// ─── Pie ──────────────────────────────────────────────────────────────────

export type CnOverlayFooterProps = {
  actions?: readonly CnOverlayAction[];
  /** Contenido libre a la izquierda (resumen, casilla "No volver a mostrar"…). */
  footerStart?: ReactNode;
  /** Pie propio (sustituye a las acciones). */
  footer?: ReactNode;
  pendingKey: string | null;
  onAction: (action: CnOverlayAction, key: string) => void;
  formId?: string;
  raised?: boolean;
  divider?: boolean;
  padding: number;
};

export const actionKey = (action: CnOverlayAction, index: number) => action.id ?? `a${index}`;

export const CnOverlayFooter = ({
  actions = [],
  footerStart,
  footer,
  pendingKey,
  onAction,
  formId,
  raised = false,
  divider = false,
  padding,
}: CnOverlayFooterProps) => {
  if (!footer && !footerStart && actions.length === 0) return null;
  const busy = pendingKey !== null;
  const render = (action: CnOverlayAction, index: number) => {
    const key = actionKey(action, index);
    const style = ACTION_STYLE[action.variant ?? "secondary"];
    const pending = pendingKey === key;
    return (
      <CnButton
        key={key}
        variant={style.variant}
        color={action.color ?? style.color}
        startIcon={action.icon}
        loading={pending || action.loading}
        disabled={action.disabled || (busy && !pending)}
        autoFocus={action.autoFocus}
        type={action.type === "submit" ? "submit" : "button"}
        form={action.type === "submit" ? formId : undefined}
        aria-label={action.ariaLabel}
        data-cn-overlay-action={key}
        onClick={action.type === "submit" ? undefined : () => onAction(action, key)}
        sx={{ maxWidth: "100%", minWidth: 0 }}
      >
        {action.label}
      </CnButton>
    );
  };
  const start = actions.filter((a) => a.align === "start");
  const end = actions.filter((a) => a.align !== "start");
  return (
    <Box
      data-cn-overlay-footer
      data-raised={raised || undefined}
      sx={{
        position: "relative",
        zIndex: 1,
        flexShrink: 0,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "8px",
        px: `${padding}px`,
        py: "12px",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        borderTop: "1px solid",
        borderTopColor:
          divider || raised ? "var(--cn-color-border-subtle, #e9ecef)" : "transparent",
        boxShadow: raised ? "0 -6px 10px -8px rgba(15, 23, 42, 0.25)" : "none",
        transition: "box-shadow 160ms ease, border-color 160ms ease",
        "@container (max-width: 399px)": {
          "& [data-cn-overlay-actions]": {
            flex: "1 1 100%",
            flexDirection: "column-reverse",
            alignItems: "stretch",
          },
          "& [data-cn-overlay-actions] > *": { width: "100%" },
        },
      }}
    >
      {footer ?? (
        <>
          {footerStart && (
            <Box
              data-cn-overlay-footer-start
              sx={{
                flex: "1 1 160px",
                minWidth: 0,
                mr: "auto",
                fontSize: "var(--cn-font-size-sm, 12px)",
                color: "var(--cn-color-text-muted, #6e7682)",
                overflowWrap: "anywhere",
              }}
            >
              {footerStart}
            </Box>
          )}
          {start.length > 0 && (
            <Box
              data-cn-overlay-actions="start"
              sx={{ display: "flex", flexWrap: "wrap", gap: "8px", mr: "auto", minWidth: 0 }}
            >
              {start.map((a) => render(a, actions.indexOf(a)))}
            </Box>
          )}
          {end.length > 0 && (
            <Box
              data-cn-overlay-actions="end"
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: "8px",
                minWidth: 0,
                maxWidth: "100%",
              }}
            >
              {end.map((a) => render(a, actions.indexOf(a)))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
