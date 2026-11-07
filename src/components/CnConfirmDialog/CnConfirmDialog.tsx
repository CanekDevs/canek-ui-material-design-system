import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { getOutlinedFieldSx } from "../../utils/field-styles";
import { CnAlert } from "../CnAlert";
import { CnButton } from "../CnButton";
import type { CnButtonColor } from "../CnButton";
import { getServerErrorMessage } from "../CnForm/CnForm.helpers";
import { CnIcon } from "../CnIcon";

export type CnConfirmVariant =
  "delete" | "danger" | "warning" | "info" | "success" | "update" | "neutral";

export type CnConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Acción al confirmar. Si devuelve una promesa, el diálogo muestra "cargando"
   * y se cierra al resolverse; si falla, muestra el error y sigue abierto.
   */
  onConfirm: () => void | Promise<unknown>;
  /** Preset de textos, ícono y color. */
  variant?: CnConfirmVariant;
  title?: ReactNode;
  message?: ReactNode;
  /** Contenido extra bajo el mensaje (resumen del registro, lista de efectos…). */
  details?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: CnButtonColor;
  confirmIcon?: string;
  /** Ícono del encabezado (registro de `CnIcon`) o `false` para ocultarlo. */
  icon?: string | false;
  /** Estado de carga externo. */
  loading?: boolean;
  /** Error externo (texto o error del servidor). */
  error?: unknown;
  /**
   * Exige escribir este texto para habilitar la confirmación (acciones
   * irreversibles, p. ej. el nombre del registro).
   */
  requireText?: string;
  hideCancel?: boolean;
  /** Mantiene el diálogo abierto tras confirmar (el consumidor lo cierra). */
  keepOpenOnConfirm?: boolean;
  maxWidth?: "xs" | "sm" | "md";
};

type Preset = {
  title: string;
  message: string;
  confirmLabel: string;
  color: CnButtonColor;
  icon: string;
  confirmIcon?: string;
};

export const CN_CONFIRM_PRESETS: Record<CnConfirmVariant, Preset> = {
  delete: {
    title: "¿Eliminar registro?",
    message: "Esta acción no se puede deshacer.",
    confirmLabel: "Eliminar",
    color: "error",
    icon: "delete",
    confirmIcon: "delete",
  },
  danger: {
    title: "¿Continuar?",
    message: "Esta acción puede tener consecuencias importantes.",
    confirmLabel: "Continuar",
    color: "error",
    icon: "report",
  },
  warning: {
    title: "Advertencia",
    message: "Revisa la información antes de continuar.",
    confirmLabel: "Continuar",
    color: "warning",
    icon: "warning",
  },
  info: {
    title: "Confirmar acción",
    message: "¿Deseas continuar?",
    confirmLabel: "Aceptar",
    color: "info",
    icon: "info",
  },
  success: {
    title: "Listo",
    message: "La operación se completó correctamente.",
    confirmLabel: "Aceptar",
    color: "success",
    icon: "check_circle",
  },
  update: {
    title: "¿Guardar cambios?",
    message: "Se actualizará la información del registro.",
    confirmLabel: "Guardar",
    color: "primary",
    icon: "edit",
    confirmIcon: "save",
  },
  neutral: {
    title: "Confirmar",
    message: "¿Deseas continuar?",
    confirmLabel: "Aceptar",
    color: "neutral",
    icon: "help",
  },
};

const TONE: Record<CnButtonColor, { fg: string; bg: string }> = {
  primary: { fg: "var(--cn-color-brand-600, #254d87)", bg: "var(--cn-color-brand-50, #eef3fb)" },
  secondary: {
    fg: "var(--cn-color-neutral-700, #3a4048)",
    bg: "var(--cn-color-neutral-100, #f4f5f7)",
  },
  success: {
    fg: "var(--cn-color-success-600, #228740)",
    bg: "var(--cn-color-success-50, #eaf7ee)",
  },
  warning: {
    fg: "var(--cn-color-warning-600, #b8831a)",
    bg: "var(--cn-color-warning-50, #fdf6e6)",
  },
  info: { fg: "var(--cn-color-info-600, #22649f)", bg: "var(--cn-color-info-50, #eaf3fb)" },
  error: { fg: "var(--cn-color-error-600, #b52f2f)", bg: "var(--cn-color-error-50, #fcecec)" },
  accent: { fg: "var(--cn-color-accent-600, #3349d6)", bg: "var(--cn-color-accent-50, #eef0ff)" },
  neutral: {
    fg: "var(--cn-color-neutral-600, #4e5660)",
    bg: "var(--cn-color-neutral-100, #f4f5f7)",
  },
};

const toMessage = (error: unknown): string | null => {
  if (!error) return null;
  if (typeof error === "string") return error;
  return (
    getServerErrorMessage(error) ??
    (error instanceof Error ? error.message : null) ??
    "No se pudo completar la acción."
  );
};

/**
 * Diálogo de confirmación accesible (`alertdialog`) con presets, acciones
 * asíncronas (carga y error integrados) y confirmación por texto para
 * acciones irreversibles.
 */
export const CnConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  variant = "neutral",
  title,
  message,
  details,
  confirmLabel,
  cancelLabel = "Cancelar",
  confirmColor,
  confirmIcon,
  icon,
  loading: loadingProp = false,
  error: errorProp,
  requireText,
  hideCancel = false,
  keepOpenOnConfirm = false,
  maxWidth = "xs",
}: CnConfirmDialogProps) => {
  const preset = CN_CONFIRM_PRESETS[variant];
  const color = confirmColor ?? preset.color;
  const tone = TONE[color];
  const headerIcon = icon === false ? null : (icon ?? preset.icon);
  const baseId = useId().replace(/:/g, "");
  const [pending, setPending] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const loading = loadingProp || pending;
  const errorMessage = toMessage(errorProp) ?? internalError;
  const textOk = !requireText || typed.trim() === requireText;

  // Limpia el estado en cada apertura.
  useEffect(() => {
    if (!open) return;
    setTyped("");
    setInternalError(null);
    setPending(false);
  }, [open]);

  const handleConfirm = async () => {
    if (loading || !textOk) return;
    setInternalError(null);
    try {
      const result = onConfirm();
      if (result && typeof (result as Promise<unknown>).then === "function") {
        setPending(true);
        await result;
      }
      if (!keepOpenOnConfirm) onClose();
    } catch (caught) {
      setInternalError(toMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth={maxWidth}
      fullWidth
      role="alertdialog"
      aria-labelledby={`${baseId}-title`}
      aria-describedby={`${baseId}-message`}
      data-cn-confirm-dialog={variant}
      slotProps={{ paper: { sx: { borderRadius: "var(--cn-radius-lg, 12px)" } } }}
    >
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "14px", pt: "24px" }}>
        <Box sx={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          {headerIcon && (
            <Box
              aria-hidden
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: tone.fg,
                backgroundColor: tone.bg,
              }}
            >
              <CnIcon name={headerIcon} size="md" />
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <Typography
              id={`${baseId}-title`}
              component="h2"
              sx={{
                m: 0,
                fontSize: "var(--cn-font-size-lg, 16px)",
                fontWeight: 700,
                color: "var(--cn-color-text, #222831)",
                lineHeight: 1.35,
              }}
            >
              {title ?? preset.title}
            </Typography>
            <Typography
              id={`${baseId}-message`}
              component="div"
              sx={{
                fontSize: "var(--cn-font-size-base, 13px)",
                color: "var(--cn-color-text-muted, #6e7682)",
                lineHeight: 1.55,
              }}
            >
              {message ?? preset.message}
            </Typography>
          </Box>
        </Box>
        {details && <Box>{details}</Box>}
        {requireText && (
          <TextField
            size="small"
            fullWidth
            autoFocus
            label={`Escribe "${requireText}" para confirmar`}
            value={typed}
            disabled={loading}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleConfirm();
              }
            }}
            slotProps={{ htmlInput: { autoComplete: "off", spellCheck: false } }}
            sx={getOutlinedFieldSx("md")}
          />
        )}
        {errorMessage && (
          <CnAlert severity="error" variant="outlined">
            {errorMessage}
          </CnAlert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: "24px", pb: "20px", pt: 0, gap: "8px" }}>
        {!hideCancel && (
          <CnButton variant="outlined" color="neutral" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </CnButton>
        )}
        <CnButton
          variant="contained"
          color={color}
          startIcon={confirmIcon ?? preset.confirmIcon}
          loading={loading}
          disabled={!textOk}
          autoFocus={!requireText}
          onClick={() => void handleConfirm()}
        >
          {confirmLabel ?? preset.confirmLabel}
        </CnButton>
      </DialogActions>
    </Dialog>
  );
};

// ─── API por promesa ──────────────────────────────────────────────────────

export type CnConfirmOptions = Omit<CnConfirmDialogProps, "open" | "onClose" | "onConfirm"> & {
  /** Acción asíncrona; el diálogo espera su resultado antes de cerrarse. */
  onConfirm?: () => void | Promise<unknown>;
};

type ConfirmFn = (options?: CnConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Habilita `useConfirm()` en el árbol:
 * `if (await confirm({ variant: "delete", message: "Se borrará la factura" })) …`
 */
export const CnConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<{ options: CnConfirmOptions; open: boolean } | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const confirmedRef = useRef(false);

  const confirm = useCallback<ConfirmFn>((options = {}) => {
    resolverRef.current?.(false);
    confirmedRef.current = false;
    setState({ options, open: true });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback(() => {
    setState((prev) => (prev ? { ...prev, open: false } : prev));
    resolverRef.current?.(confirmedRef.current);
    resolverRef.current = null;
  }, []);

  const value = useMemo(() => confirm, [confirm]);
  const options = state?.options ?? {};

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <CnConfirmDialog
        {...options}
        open={Boolean(state?.open)}
        onClose={close}
        onConfirm={async () => {
          await options.onConfirm?.();
          confirmedRef.current = true;
        }}
      />
    </ConfirmContext.Provider>
  );
};

/** Pide confirmación y resuelve `true` si el usuario confirmó. Requiere `CnConfirmProvider`. */
export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <CnConfirmProvider>.");
  return ctx;
};
