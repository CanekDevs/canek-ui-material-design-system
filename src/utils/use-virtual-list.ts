import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type CnVirtualItem = {
  index: number;
  key: string | number;
  /** Posición (px) desde el inicio de la lista. */
  start: number;
  size: number;
};

export type CnVirtualAlign = "auto" | "start" | "center" | "end";

export type UseVirtualListParams = {
  /** Número total de filas. */
  count: number;
  /** Alto fijo de cada fila (px) o función por índice. Sin medición. */
  itemSize?: number | ((index: number) => number);
  /**
   * Alto estimado cuando no hay `itemSize`: las filas se miden al pintarse
   * (`measureElement`) y la estimación se corrige sola. Por defecto 36.
   */
  estimateSize?: number | ((index: number) => number);
  /** Clave estable por fila; conserva las medidas aunque cambie el filtrado. */
  getItemKey?: (index: number) => string | number;
  /** Filas extra arriba y abajo de la ventana visible. Por defecto 6. */
  overscan?: number;
  /** Alto supuesto del contenedor mientras no se puede medir (SSR, jsdom). Por defecto 320. */
  defaultViewportHeight?: number;
  /** Filas que siempre se pintan (p. ej. la primera y la última para Inicio/Fin). */
  pinned?: readonly number[];
  /** Se llama al acercarse al final (scroll infinito). */
  onEndReached?: () => void;
  /** Filas antes del final a las que se dispara `onEndReached`. Por defecto 5. */
  endReachedThreshold?: number;
  /** `false` pinta todas las filas (la ventana y `onEndReached` siguen calculándose). */
  enabled?: boolean;
  /** Espacio (px) entre el inicio del contenedor con scroll y la primera fila. */
  paddingStart?: number;
};

export type UseVirtualListReturn = {
  /** Ref del contenedor con scroll (`overflow: auto`). */
  scrollRef: (element: HTMLElement | null) => void;
  /** Filas a pintar, ordenadas. */
  items: CnVirtualItem[];
  /** Alto total de la lista (px). */
  totalSize: number;
  /** Ventana visible + overscan. */
  range: { start: number; end: number };
  /** Desplaza el contenedor hasta mostrar la fila. */
  scrollToIndex: (index: number, options?: { align?: CnVirtualAlign }) => void;
  /** Ref para cada fila pintada (requiere `data-index`) cuando el alto es variable. */
  measureElement: (element: HTMLElement | null) => void;
};

/** Fila o hueco a pintar: las filas fuera de la ventana se sustituyen por huecos del mismo alto. */
export type CnVirtualSlot =
  { type: "item"; item: CnVirtualItem } | { type: "spacer"; key: string; size: number };

/** Intercala huecos entre las filas pintadas para conservar el alto total y la posición. */
export const getVirtualSlots = (items: CnVirtualItem[], totalSize: number): CnVirtualSlot[] => {
  const slots: CnVirtualSlot[] = [];
  let cursor = 0;
  for (const item of items) {
    const gap = item.start - cursor;
    if (gap > 0.5) slots.push({ type: "spacer", key: `__spacer-${item.index}`, size: gap });
    slots.push({ type: "item", item });
    cursor = item.start + item.size;
  }
  const tail = totalSize - cursor;
  if (tail > 0.5) slots.push({ type: "spacer", key: "__spacer-end", size: tail });
  return slots;
};

/** Primer índice cuya fila cruza `offset` (búsqueda binaria sobre los inicios). */
const findIndexAt = (starts: Float64Array, count: number, offset: number): number => {
  let low = 0;
  let high = count - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (starts[mid] <= offset) low = mid;
    else high = mid - 1;
  }
  return low;
};

/**
 * Virtualización propia y ligera: solo pinta las filas visibles (más un margen)
 * dentro de un contenedor con scroll. Admite alto fijo, por índice o estimado y
 * medido, `scrollToIndex`, filas fijas y aviso al acercarse al final.
 */
export const useVirtualList = ({
  count,
  itemSize,
  estimateSize = 36,
  getItemKey,
  overscan = 6,
  defaultViewportHeight = 320,
  pinned,
  onEndReached,
  endReachedThreshold = 5,
  enabled = true,
  paddingStart = 0,
}: UseVirtualListParams): UseVirtualListReturn => {
  const elementRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(0);
  const sizesRef = useRef(new Map<string | number, number>());
  const itemObserverRef = useRef<ResizeObserver | null>(null);
  const [, setMeasureVersion] = useState(0);
  const getItemKeyRef = useRef(getItemKey);
  getItemKeyRef.current = getItemKey;
  const onEndReachedRef = useRef(onEndReached);
  onEndReachedRef.current = onEndReached;

  const measuring = itemSize === undefined;
  const keyAt = (index: number): string | number =>
    getItemKeyRef.current ? getItemKeyRef.current(index) : index;

  // Inicios de cada fila. Con alto fijo no hace falta recorrer la lista.
  const fixed = typeof itemSize === "number" ? itemSize : undefined;
  let starts: Float64Array | null = null;
  let totalSize: number;
  const sizeOf = (index: number): number => {
    if (fixed !== undefined) return fixed;
    if (typeof itemSize === "function") return itemSize(index);
    const measured = sizesRef.current.get(keyAt(index));
    if (measured !== undefined) return measured;
    return typeof estimateSize === "function" ? estimateSize(index) : estimateSize;
  };
  if (fixed !== undefined) {
    totalSize = fixed * count;
  } else {
    starts = new Float64Array(count + 1);
    for (let index = 0; index < count; index += 1) {
      starts[index + 1] = starts[index] + sizeOf(index);
    }
    totalSize = starts[count];
  }
  const startOf = (index: number): number =>
    fixed !== undefined ? index * fixed : (starts as Float64Array)[index];

  const height = viewport > 0 ? viewport : defaultViewportHeight;
  const top = Math.max(0, scrollTop - paddingStart);
  let first = 0;
  let last = -1;
  if (count > 0) {
    first =
      fixed !== undefined
        ? Math.min(count - 1, Math.floor(top / Math.max(1, fixed)))
        : findIndexAt(starts as Float64Array, count, top);
    last = first;
    while (last < count - 1 && startOf(last + 1) < top + height) last += 1;
  }
  const range = {
    start: count > 0 ? Math.max(0, first - overscan) : 0,
    end: count > 0 ? Math.min(count - 1, last + overscan) : -1,
  };

  const indices: number[] = [];
  if (!enabled) {
    for (let index = 0; index < count; index += 1) indices.push(index);
  } else {
    for (let index = range.start; index <= range.end; index += 1) indices.push(index);
    for (const index of pinned ?? []) {
      if (index >= 0 && index < count && (index < range.start || index > range.end)) {
        indices.push(index);
      }
    }
    indices.sort((a, b) => a - b);
  }
  const items: CnVirtualItem[] = indices.map((index) => ({
    index,
    key: keyAt(index),
    start: startOf(index),
    size: sizeOf(index),
  }));

  // Lo último calculado, para callbacks estables.
  const latest = useRef({ startOf, sizeOf, height, totalSize, scrollTop, paddingStart });
  latest.current = { startOf, sizeOf, height, totalSize, scrollTop, paddingStart };

  const scrollRef = useCallback((element: HTMLElement | null) => {
    if (element === elementRef.current) return;
    cleanupRef.current?.();
    cleanupRef.current = null;
    elementRef.current = element;
    if (!element) return;
    // El anclaje de scroll del navegador pelea con los huecos que cambian de alto.
    element.style.overflowAnchor = "none";
    const onScroll = () => setScrollTop(element.scrollTop);
    const measure = () => setViewport(element.clientHeight);
    element.addEventListener("scroll", onScroll, { passive: true });
    measure();
    setScrollTop(element.scrollTop);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(element);
    }
    cleanupRef.current = () => {
      element.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, []);

  useEffect(
    () => () => {
      cleanupRef.current?.();
      itemObserverRef.current?.disconnect();
    },
    [],
  );

  // Medición de filas de alto variable.
  const recordSize = useCallback((element: Element) => {
    const index = Number((element as HTMLElement).dataset.index);
    if (!Number.isFinite(index)) return;
    // `offsetHeight` ignora transformaciones (p. ej. la animación de un Popover).
    const size = (element as HTMLElement).offsetHeight;
    if (!(size > 0)) return;
    const key = getItemKeyRef.current ? getItemKeyRef.current(index) : index;
    if (Math.abs((sizesRef.current.get(key) ?? -1) - size) < 0.5) return;
    sizesRef.current.set(key, size);
    setMeasureVersion((version) => version + 1);
  }, []);
  const measureElement = useCallback(
    (element: HTMLElement | null) => {
      if (!element || !measuring) return;
      if (!itemObserverRef.current && typeof ResizeObserver !== "undefined") {
        itemObserverRef.current = new ResizeObserver((entries) => {
          for (const entry of entries) recordSize(entry.target);
        });
      }
      itemObserverRef.current?.observe(element);
      recordSize(element);
    },
    [measuring, recordSize],
  );

  const scrollToIndex = useCallback((index: number, options?: { align?: CnVirtualAlign }) => {
    const state = latest.current;
    if (index < 0) return;
    const align = options?.align ?? "auto";
    const start = state.startOf(index) + state.paddingStart;
    const size = state.sizeOf(index);
    const element = elementRef.current;
    const current = element ? element.scrollTop : state.scrollTop;
    let target = current;
    if (align === "start") target = start;
    else if (align === "end") target = start + size - state.height;
    else if (align === "center") target = start - (state.height - size) / 2;
    else if (start < current) target = start;
    else if (start + size > current + state.height) target = start + size - state.height;
    target = Math.max(0, Math.min(target, state.totalSize + state.paddingStart));
    if (Math.abs(target - current) < 0.5) return;
    if (element) {
      element.scrollTop = target;
      setScrollTop(element.scrollTop);
    } else {
      setScrollTop(target);
    }
  }, []);

  // Scroll infinito: avisa cuando la última fila visible se acerca al final.
  const lastVisible = last;
  useIsoLayoutEffect(() => {
    if (!onEndReachedRef.current || count === 0) return;
    if (lastVisible >= count - 1 - endReachedThreshold) onEndReachedRef.current();
  }, [count, endReachedThreshold, lastVisible]);

  return { scrollRef, items, totalSize, range, scrollToIndex, measureElement };
};
