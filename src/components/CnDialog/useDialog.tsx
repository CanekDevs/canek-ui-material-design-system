import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CnDialog } from "./CnDialog";
import type { CnDialogProps } from "./CnDialog";
import type { CnOverlayAction, CnOverlayCloseReason } from "./overlay-parts";

/** Controles que recibe el contenido de un diálogo abierto con `useDialog()`. */
export type CnDialogContext<T = unknown> = {
  id: string;
  /** Cierra el diálogo y resuelve la promesa de `open()` con `value`. */
  close: (value?: T) => void;
  /** Cambia opciones del diálogo abierto (título, `loading`, contenido…). */
  update: (patch: Partial<CnDialogOpenOptions<T>>) => void;
};

/** Acción con valor: al terminar `onClick`, cierra y resuelve con `value`. */
export type CnDialogOpenAction<T = unknown> = CnOverlayAction & { value?: T };

export type CnDialogOpenOptions<T = unknown> = Omit<
  CnDialogProps,
  "open" | "onClose" | "children" | "actions"
> & {
  /** Identificador para `close(id)` / `update(id)`; se genera si falta. */
  id?: string;
  content?: ReactNode | ((ctx: CnDialogContext<T>) => ReactNode);
  actions?: readonly CnDialogOpenAction<T>[];
  /** Se llama cuando el diálogo se cierra por cualquier motivo. */
  onClose?: (reason: CnOverlayCloseReason) => void;
};

export type CnDialogApi = {
  /** Abre un diálogo; resuelve con el `value` de la acción o `undefined` al cerrarlo. */
  open: <T = unknown>(options: CnDialogOpenOptions<T>) => Promise<T | undefined>;
  close: (id: string, value?: unknown) => void;
  update: (id: string, patch: Partial<CnDialogOpenOptions>) => void;
  closeAll: () => void;
};

type Entry = {
  id: string;
  options: CnDialogOpenOptions<unknown>;
  open: boolean;
  resolve: (value: unknown) => void;
};

const DialogContext = createContext<CnDialogApi | null>(null);

let counter = 0;

/**
 * Habilita `useDialog()`: abre diálogos de forma imperativa (y apilada) sin
 * declarar estado `open` en cada pantalla.
 */
export const CnDialogProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const entriesRef = useRef<Entry[]>([]);
  entriesRef.current = entries;

  const finish = useCallback((id: string, value: unknown, reason?: CnOverlayCloseReason) => {
    const entry = entriesRef.current.find((e) => e.id === id);
    if (!entry || !entry.open) return;
    entry.resolve(value);
    if (reason) entry.options.onClose?.(reason);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, open: false } : e)));
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id || e.open));
  }, []);

  const api = useMemo<CnDialogApi>(
    () => ({
      open: <T,>(options: CnDialogOpenOptions<T>) =>
        new Promise<T | undefined>((resolve) => {
          counter += 1;
          const id = options.id ?? `cn-dialog-${counter}`;
          setEntries((prev) => [
            ...prev.filter((e) => e.id !== id),
            {
              id,
              options: options as CnDialogOpenOptions<unknown>,
              open: true,
              resolve: resolve as (value: unknown) => void,
            },
          ]);
        }),
      close: (id, value) => finish(id, value, "programmatic"),
      update: (id, patch) =>
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, options: { ...e.options, ...patch } } : e)),
        ),
      closeAll: () => entriesRef.current.forEach((e) => finish(e.id, undefined, "programmatic")),
    }),
    [finish],
  );

  return (
    <DialogContext.Provider value={api}>
      {children}
      {entries.map((entry) => {
        const { content, actions, onClose: _onClose, onExited, ...rest } = entry.options;
        const ctx: CnDialogContext = {
          id: entry.id,
          close: (value) => finish(entry.id, value, "action"),
          update: (patch) => api.update(entry.id, patch),
        };
        return (
          <CnDialog
            key={entry.id}
            {...rest}
            open={entry.open}
            onClose={(reason) => finish(entry.id, undefined, reason)}
            onExited={() => {
              onExited?.();
              remove(entry.id);
            }}
            actions={actions?.map((action) =>
              "value" in action
                ? {
                    ...action,
                    closes: false,
                    onClick: async () => {
                      await action.onClick?.();
                      finish(entry.id, action.value, "action");
                    },
                  }
                : action,
            )}
          >
            {typeof content === "function" ? content(ctx) : content}
          </CnDialog>
        );
      })}
    </DialogContext.Provider>
  );
};

/** API imperativa de diálogos. Requiere `CnDialogProvider`. */
export const useDialog = (): CnDialogApi => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog debe usarse dentro de <CnDialogProvider>.");
  return ctx;
};
