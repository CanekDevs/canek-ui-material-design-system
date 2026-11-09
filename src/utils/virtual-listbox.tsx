import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import ListSubheader from "@mui/material/ListSubheader";
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from "react";
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
} from "react";
import { formatCount } from "./option-filter";
import { getVirtualSlots, useVirtualList } from "./use-virtual-list";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Umbral por defecto a partir del cual se virtualiza una lista de opciones. */
export const CN_VIRTUALIZE_THRESHOLD = 100;

/** Resuelve la prop `virtualize` (`true`, `false` o umbral numérico) contra el número de filas. */
export const shouldVirtualize = (virtualize: boolean | number | undefined, count: number) => {
  if (virtualize === true) return true;
  if (virtualize === false) return false;
  const threshold = typeof virtualize === "number" ? virtualize : CN_VIRTUALIZE_THRESHOLD;
  return count > threshold;
};

// ─── Filas de estado (cargando más, reintentar, conteo) ────────────────────

export type CnListStatusProps = {
  /** Elemento de cada fila (`li` dentro de un `ul`, `div` en otros casos). */
  component?: "li" | "div";
  loadingMore?: boolean;
  loadMoreError?: string | null;
  onRetry?: () => void;
  /** Coincidencias que no se pintan por `maxResults`. */
  truncated?: number;
  /** Opciones cargadas / visibles. */
  shown?: number;
  /** Total del servidor. */
  total?: number;
};

const statusRowSx = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  px: "16px",
  py: "8px",
  fontSize: "var(--cn-font-size-sm, 12px)",
  color: "var(--cn-color-text-muted, #6e7682)",
  listStyle: "none",
} as const;

/** Filas al pie de una lista larga: "Cargando más…", "Reintentar", "N más…" y "Mostrando X de Y". */
export const CnListStatus = ({
  component = "li",
  loadingMore = false,
  loadMoreError,
  onRetry,
  truncated = 0,
  shown,
  total,
}: CnListStatusProps) => {
  const showCount = total !== undefined && shown !== undefined && total > shown;
  if (!loadingMore && !loadMoreError && truncated <= 0 && !showCount) return null;
  return (
    <>
      {loadingMore && (
        <Box component={component} role="presentation" data-cn-list-loading sx={statusRowSx}>
          <CircularProgress size={14} aria-hidden />
          Cargando más…
        </Box>
      )}
      {loadMoreError && !loadingMore && (
        <Box
          component={component}
          role="presentation"
          data-cn-list-error
          sx={{ ...statusRowSx, color: "var(--cn-color-danger-600, #c62828)" }}
        >
          <Box component="span" sx={{ flex: 1 }}>
            No se pudieron cargar más resultados.
          </Box>
          {onRetry && (
            <Button
              size="small"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onRetry}
              sx={{ minWidth: 0, textTransform: "none" }}
            >
              Reintentar
            </Button>
          )}
        </Box>
      )}
      {truncated > 0 && (
        <Box component={component} role="presentation" data-cn-list-truncated sx={statusRowSx}>
          {formatCount(truncated)} más, refina tu búsqueda
        </Box>
      )}
      {showCount && (
        <Box
          component={component}
          role="status"
          data-cn-list-count
          sx={{
            ...statusRowSx,
            position: "sticky",
            bottom: 0,
            py: "4px",
            fontSize: "var(--cn-font-size-xs, 11px)",
            borderTop: "1px solid var(--cn-color-border, #dde0e4)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
          }}
        >
          Mostrando {formatCount(shown as number)} de {formatCount(total as number)}
        </Box>
      )}
    </>
  );
};

// ─── Listbox virtual para MUI Autocomplete ──────────────────────────────────

export type CnVirtualListboxConfig = {
  /** `false` pinta todas las filas (se conserva el scroll infinito). */
  virtualize?: boolean;
  overscan?: number;
  /** Alto estimado de una opción (se mide al pintarse). Por defecto 36. */
  optionSize?: number;
  /** Alto estimado de una opción con descripción. Por defecto 52. */
  tallOptionSize?: number;
  /** Alto estimado del encabezado de grupo. Por defecto 32. */
  groupSize?: number;
  /** Contenido al pie (se evalúa en cada render para leer el estado más reciente). */
  renderFooter?: () => ReactNode;
  /** Scroll infinito. */
  onEndReached?: () => void;
  /** Lleva la opción seleccionada a la vista al abrir. */
  scrollToSelected?: boolean;
  /** Tamaño real del conjunto (p. ej. total del servidor) para `aria-setsize`. */
  setSize?: number;
};

export const CnVirtualListboxContext = createContext<CnVirtualListboxConfig>({});

/** Lo que `renderGroup` devuelve en modo virtual: el listbox lo aplana en filas. */
export type CnVirtualGroupParams = { key: string | number; group: string; children?: ReactNode };

const isGroupParams = (node: unknown): node is CnVirtualGroupParams =>
  Boolean(node) &&
  typeof node === "object" &&
  !isValidElement(node) &&
  "group" in (node as Record<string, unknown>);

type Row =
  | { kind: "group"; key: string; label: string }
  | { kind: "option"; key: string; element: ReactElement<Record<string, unknown>> };

const assignRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
};

export type CnVirtualListboxProps = HTMLAttributes<HTMLElement> & { ownerState?: unknown };

/**
 * Listbox virtualizado para `Autocomplete` (vía `slotProps.listbox.component`).
 * Aplana grupos en filas, pinta solo la ventana visible, conserva siempre la
 * primera y la última opción (Inicio/Fin del teclado de MUI las encuentran) y
 * agrega `aria-setsize`/`aria-posinset`. Se configura con
 * `CnVirtualListboxContext`.
 */
export const CnVirtualListbox = forwardRef<HTMLUListElement, CnVirtualListboxProps>(
  function CnVirtualListbox(props, forwardedRef) {
    const { children, ownerState, ...rest } = props;
    void ownerState;
    const config = useContext(CnVirtualListboxContext);
    const {
      overscan = 8,
      optionSize = 36,
      tallOptionSize = 52,
      groupSize = 32,
      virtualize = true,
    } = config;

    const rows: Row[] = [];
    const pushOption = (node: unknown) => {
      if (!isValidElement(node)) return;
      rows.push({
        kind: "option",
        key: String(node.key ?? `option-${rows.length}`),
        element: node as ReactElement<Record<string, unknown>>,
      });
    };
    const top = Array.isArray(children) ? (children as unknown[]) : [children];
    for (const node of top.flat()) {
      if (isGroupParams(node)) {
        rows.push({ kind: "group", key: `group-${node.key}`, label: node.group });
        Children.forEach(node.children, pushOption);
      } else {
        pushOption(node);
      }
    }

    let firstOption = -1;
    let lastOption = -1;
    let optionCount = 0;
    const ordinal = new Map<number, number>();
    rows.forEach((row, index) => {
      if (row.kind !== "option") return;
      if (firstOption < 0) firstOption = index;
      lastOption = index;
      optionCount += 1;
      ordinal.set(index, optionCount);
    });

    const virtual = useVirtualList({
      count: rows.length,
      estimateSize: (index) => {
        const row = rows[index];
        if (row.kind === "group") return groupSize;
        return row.element.props["data-cn-tall"] ? tallOptionSize : optionSize;
      },
      getItemKey: (index) => rows[index]?.key ?? index,
      overscan,
      pinned: [firstOption, lastOption],
      onEndReached: config.onEndReached,
      paddingStart: 8,
      enabled: virtualize,
    });

    const { scrollRef } = virtual;
    const setRefs = useCallback(
      (element: HTMLUListElement | null) => {
        scrollRef(element);
        assignRef(forwardedRef, element);
      },
      [forwardedRef, scrollRef],
    );

    // Al abrir, muestra la opción seleccionada aunque esté lejos.
    useIsoLayoutEffect(() => {
      if (!config.scrollToSelected) return;
      const index = rows.findIndex(
        (row) =>
          row.kind === "option" &&
          (row.element.props["aria-selected"] === true ||
            row.element.props["aria-selected"] === "true"),
      );
      if (index > 0) virtual.scrollToIndex(index, { align: "center" });
      // Solo al montar.
    }, []);

    const setSize = Math.max(config.setSize ?? 0, optionCount);

    return (
      <ul {...(rest as HTMLAttributes<HTMLUListElement>)} ref={setRefs} data-cn-virtual-listbox>
        {getVirtualSlots(virtual.items, virtual.totalSize).map((slot) => {
          if (slot.type === "spacer") {
            return (
              <li
                key={slot.key}
                role="presentation"
                aria-hidden
                style={{ height: slot.size, padding: 0, margin: 0, listStyle: "none" }}
              />
            );
          }
          const row = rows[slot.item.index];
          if (row.kind === "group") {
            return (
              <li
                key={row.key}
                role="presentation"
                data-index={slot.item.index}
                ref={virtual.measureElement}
                style={{ listStyle: "none" }}
              >
                <ListSubheader
                  component="div"
                  disableSticky
                  sx={{
                    lineHeight: `${groupSize}px`,
                    fontSize: "var(--cn-font-size-xs, 11px)",
                    fontWeight: 600,
                    color: "var(--cn-color-text-muted, #6e7682)",
                    backgroundColor: "transparent",
                  }}
                >
                  {row.label}
                </ListSubheader>
              </li>
            );
          }
          return cloneElement(row.element, {
            key: row.key,
            "data-index": slot.item.index,
            ref: virtual.measureElement,
            "aria-setsize": setSize,
            "aria-posinset": ordinal.get(slot.item.index),
          });
        })}
        {config.renderFooter?.()}
      </ul>
    );
  },
);
