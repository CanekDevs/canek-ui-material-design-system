import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CnButton } from "../CnButton";
import { getServerErrorMessage, parseServerErrors } from "../CnForm/CnForm.helpers";
import { CnIcon } from "../CnIcon";
import { CnToastSkeleton } from "./CnToastSkeleton";

export type CnToastSeverity = "success" | "error" | "warning" | "info" | "loading";

export type CnToastPosition =
  "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";

export type CnToastOptions = {
  /** Id para actualizar o cerrar el aviso (se genera si se omite). */
  id?: string;
  severity?: CnToastSeverity;
  title?: ReactNode;
  message?: ReactNode;
  /** Milisegundos antes de cerrarse; `null` lo deja fijo. Por defecto 5000 (errores 8000). */
  duration?: number | null;
  /** Botón de acción (p. ej. "Deshacer"). */
  action?: { label: string; onClick: () => void };
  /** Lista de detalles (errores por campo…). */
  details?: string[];
  closable?: boolean;
  /** Muestra el skeleton del aviso (misma distribución) mientras llega su contenido. */
  skeleton?: boolean;
};

export type CnToastItem = Required<Pick<CnToastOptions, "id" | "severity">> &
  Omit<CnToastOptions, "id" | "severity"> & { createdAt: number };

type MessageInput = ReactNode | CnToastOptions;

export type CnToastApi = {
  (options: CnToastOptions): string;
  success: (message: MessageInput, options?: CnToastOptions) => string;
  info: (message: MessageInput, options?: CnToastOptions) => string;
  warning: (message: MessageInput, options?: CnToastOptions) => string;
  /** Acepta texto o un error (axios, fetch, Laravel…): extrae mensaje y errores por campo. */
  error: (messageOrError: unknown, options?: CnToastOptions) => string;
  loading: (message: MessageInput, options?: CnToastOptions) => string;
  /** Muestra "cargando" y lo sustituye por éxito o error según la promesa. */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading?: ReactNode;
      success?: ReactNode | ((value: T) => ReactNode);
      error?: ReactNode | ((error: unknown) => ReactNode);
    },
  ) => Promise<T>;
  update: (id: string, options: CnToastOptions) => void;
  dismiss: (id?: string) => void;
};

const TONES: Record<CnToastSeverity, { icon: string; color: string; bg: string }> = {
  success: {
    icon: "check_circle",
    color: "var(--cn-color-success-600, #228740)",
    bg: "var(--cn-color-success-50, #eaf7ee)",
  },
  error: {
    icon: "error",
    color: "var(--cn-color-error-600, #b52f2f)",
    bg: "var(--cn-color-error-50, #fcecec)",
  },
  warning: {
    icon: "warning",
    color: "var(--cn-color-warning-600, #b8831a)",
    bg: "var(--cn-color-warning-50, #fdf6e6)",
  },
  info: {
    icon: "info",
    color: "var(--cn-color-info-600, #22649f)",
    bg: "var(--cn-color-info-50, #eaf3fb)",
  },
  loading: {
    icon: "info",
    color: "var(--cn-color-brand-600, #254d87)",
    bg: "var(--cn-color-brand-50, #eef3fb)",
  },
};

const DEFAULT_TITLES: Partial<Record<CnToastSeverity, string>> = {
  success: "Listo",
  error: "Error",
  warning: "Atención",
};

const isOptions = (value: unknown): value is CnToastOptions =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !("$$typeof" in (value as object)) &&
  ("message" in (value as object) || "title" in (value as object));

const humanize = (path: string) =>
  path
    .replace(/\.(\d+)(\.|$)/g, (_, n: string, end: string) => ` ${Number(n) + 1}${end ? " " : ""}`)
    .replace(/[._]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

/** Convierte un error de API en mensaje + detalles por campo. */
export const describeError = (error: unknown): { message: string; details: string[] } => {
  if (typeof error === "string") return { message: error, details: [] };
  const fields = parseServerErrors(error);
  const details = Object.entries(fields).map(([path, msg]) => `${humanize(path)}: ${msg}`);
  const message =
    getServerErrorMessage(error) ??
    (error instanceof Error && error.message ? error.message : undefined) ??
    (details.length ? "Revisa los datos enviados." : "No se pudo completar la operación.");
  return { message, details };
};

const ToastContext = createContext<CnToastApi | null>(null);

let counter = 0;
const nextId = () => `cn-toast-${(counter += 1)}`;

const ToastCard = ({ item, onDismiss }: { item: CnToastItem; onDismiss: (id: string) => void }) => {
  const tone = TONES[item.severity];
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef<number | null>(null);
  const duration =
    item.duration === undefined
      ? item.severity === "loading"
        ? null
        : item.severity === "error"
          ? 8000
          : 5000
      : item.duration;

  useEffect(() => {
    remainingRef.current = duration;
  }, [duration, item.createdAt]);

  useEffect(() => {
    if (paused || remainingRef.current === null) return;
    const started = Date.now();
    const timer = setTimeout(() => onDismiss(item.id), remainingRef.current);
    return () => {
      clearTimeout(timer);
      if (remainingRef.current !== null) {
        remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - started));
      }
    };
  }, [item.id, item.createdAt, onDismiss, paused, duration]);

  const title = item.title ?? DEFAULT_TITLES[item.severity];

  if (item.skeleton) {
    return (
      <CnToastSkeleton
        severity={item.severity}
        title={Boolean(title)}
        lines={item.message ? 1 : 0}
        details={Math.min(item.details?.length ?? 0, 6)}
        action={Boolean(item.action)}
        closable={item.closable !== false}
        sx={{ pointerEvents: "auto" }}
      />
    );
  }

  return (
    <Box
      role={item.severity === "error" ? "alert" : "status"}
      data-cn-toast={item.severity}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      sx={{
        pointerEvents: "auto",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        width: "min(380px, calc(100vw - 32px))",
        padding: "12px 12px 12px 14px",
        borderRadius: "var(--cn-radius-md, 8px)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderLeft: `4px solid ${tone.color}`,
        boxShadow: "0 8px 24px rgba(17, 20, 24, 0.14)",
        fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
        animation: "cn-toast-in 180ms ease-out",
        "@keyframes cn-toast-in": {
          from: { opacity: 0, transform: "translateY(-6px)" },
          to: { opacity: 1, transform: "none" },
        },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: tone.color,
          backgroundColor: tone.bg,
        }}
      >
        {item.severity === "loading" ? (
          <CircularProgress size={16} sx={{ color: tone.color }} />
        ) : (
          <CnIcon name={tone.icon} size="sm" />
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
        {title && (
          <Box
            sx={{
              fontSize: "var(--cn-font-size-base, 13px)",
              fontWeight: 700,
              color: "var(--cn-color-text, #222831)",
            }}
          >
            {title}
          </Box>
        )}
        {item.message && (
          <Box
            sx={{
              fontSize: "var(--cn-font-size-sm, 12px)",
              color: "var(--cn-color-text-muted, #6e7682)",
              lineHeight: 1.5,
              overflowWrap: "anywhere",
            }}
          >
            {item.message}
          </Box>
        )}
        {item.details && item.details.length > 0 && (
          <Box
            component="ul"
            sx={{
              m: "4px 0 0",
              pl: "16px",
              fontSize: "var(--cn-font-size-xs, 11px)",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {item.details.slice(0, 6).map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
            {item.details.length > 6 && <li>y {item.details.length - 6} más…</li>}
          </Box>
        )}
        {item.action && (
          <Box sx={{ mt: "6px" }}>
            <CnButton
              size="small"
              variant="outlined"
              color="neutral"
              onClick={() => {
                item.action?.onClick();
                onDismiss(item.id);
              }}
            >
              {item.action.label}
            </CnButton>
          </Box>
        )}
      </Box>
      {item.closable !== false && item.severity !== "loading" && (
        <IconButton
          size="small"
          aria-label="Cerrar aviso"
          onClick={() => onDismiss(item.id)}
          sx={{ mt: "-4px", mr: "-4px", color: "var(--cn-color-neutral-500, #6e7682)" }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
    </Box>
  );
};

export type CnToastProviderProps = {
  children: ReactNode;
  position?: CnToastPosition;
  /** Máximo de avisos visibles a la vez. Por defecto 4. */
  max?: number;
  /** Separación respecto al borde (px), útil con barras superiores fijas. */
  offset?: number;
};

/**
 * Notificaciones apiladas para toda la aplicación (`useToast()`): pausa al
 * pasar el mouse, acción "Deshacer", promesas y errores de API con detalles.
 */
export const CnToastProvider = ({
  children,
  position = "top-right",
  max = 4,
  offset = 16,
}: CnToastProviderProps) => {
  const [items, setItems] = useState<CnToastItem[]>([]);

  const dismiss = useCallback((id?: string) => {
    setItems((prev) => (id ? prev.filter((item) => item.id !== id) : []));
  }, []);

  const push = useCallback(
    (options: CnToastOptions): string => {
      const id = options.id ?? nextId();
      setItems((prev) => {
        const item: CnToastItem = {
          ...options,
          id,
          severity: options.severity ?? "info",
          createdAt: Date.now(),
        };
        const exists = prev.some((entry) => entry.id === id);
        const next = exists
          ? prev.map((entry) => (entry.id === id ? item : entry))
          : [...prev, item];
        return next.slice(-max);
      });
      return id;
    },
    [max],
  );

  const api = useMemo<CnToastApi>(() => {
    const withSeverity =
      (severity: CnToastSeverity) =>
      (message: MessageInput, options: CnToastOptions = {}) =>
        push(
          isOptions(message)
            ? { ...message, ...options, severity }
            : { ...options, message: message as ReactNode, severity },
        );
    const fn = ((options: CnToastOptions) => push(options)) as CnToastApi;
    fn.success = withSeverity("success");
    fn.info = withSeverity("info");
    fn.warning = withSeverity("warning");
    fn.loading = withSeverity("loading");
    fn.error = (messageOrError, options = {}) => {
      if (isOptions(messageOrError))
        return push({ ...messageOrError, ...options, severity: "error" });
      if (typeof messageOrError === "string" || messageOrError === undefined) {
        return push({ ...options, message: messageOrError, severity: "error" });
      }
      const { message, details } = describeError(messageOrError);
      return push({ details, ...options, message: options.message ?? message, severity: "error" });
    };
    fn.update = (id, options) => {
      push({ ...options, id });
    };
    fn.dismiss = dismiss;
    fn.promise = async (promise, messages) => {
      const id = push({ severity: "loading", message: messages.loading ?? "Procesando…" });
      try {
        const value = await promise;
        const success =
          typeof messages.success === "function"
            ? (messages.success as (v: typeof value) => ReactNode)(value)
            : messages.success;
        push({ id, severity: "success", message: success ?? "Operación completada." });
        return value;
      } catch (error) {
        if (messages.error !== undefined) {
          const text =
            typeof messages.error === "function"
              ? (messages.error as (e: unknown) => ReactNode)(error)
              : messages.error;
          push({ id, severity: "error", message: text });
        } else {
          const { message, details } = describeError(error);
          push({ id, severity: "error", message, details });
        }
        throw error;
      }
    };
    return fn;
  }, [dismiss, push]);

  const [vertical, horizontal] = position.split("-") as ["top" | "bottom", string];
  const ordered = vertical === "bottom" ? items : [...items].reverse();

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Box
        aria-live="polite"
        data-cn-toast-region={position}
        sx={{
          position: "fixed",
          zIndex: 1500,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          [vertical]: offset,
          ...(horizontal === "center"
            ? { left: "50%", transform: "translateX(-50%)", alignItems: "center" }
            : horizontal === "left"
              ? { left: offset, alignItems: "flex-start" }
              : { right: offset, alignItems: "flex-end" }),
        }}
      >
        {ordered.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </Box>
    </ToastContext.Provider>
  );
};

/** API de notificaciones. Requiere `CnToastProvider`. */
export const useToast = (): CnToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <CnToastProvider>.");
  return ctx;
};
