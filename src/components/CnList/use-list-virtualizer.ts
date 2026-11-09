import type { RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/*
 * Virtualizador ligero y local de CnList (filas de alto variable).
 * - Usa un alto estimado por fila y lo corrige al medir (ResizeObserver).
 * - Calcula la ventana visible con búsqueda binaria sobre los desplazamientos.
 * - Sin ResizeObserver ni medidas (jsdom) usa los estimados y `fallbackViewport`.
 */

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type UseListVirtualizerOptions = {
  enabled: boolean;
  count: number;
  getKey: (index: number) => string;
  estimateSize: (index: number) => number;
  scrollRef: RefObject<HTMLElement | null>;
  overscan?: number;
  /** Alto del área visible cuando aún no se puede medir. */
  fallbackViewport?: number;
  /** Espacio fijo entre filas (px). */
  gap?: number;
};

export type ListVirtualizer = {
  start: number;
  end: number;
  totalSize: number;
  offsetOf: (index: number) => number;
  sizeOf: (index: number) => number;
  /** Ref de medición para la fila `index`. */
  measure: (index: number) => (node: HTMLElement | null) => void;
  /** Desplaza lo mínimo para que la fila quede visible. */
  scrollToIndex: (index: number, options?: { paddingTop?: number }) => void;
  scrollTop: number;
  /** Índice de la fila que ocupa el desplazamiento `offset`. */
  indexAt: (offset: number) => number;
};

/** Primer índice `i` con `offsets[i + 1] > value` (fila que contiene `value`). */
const findIndex = (offsets: Float64Array, count: number, value: number) => {
  let low = 0;
  let high = count - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (offsets[mid + 1] <= value) low = mid + 1;
    else if (offsets[mid] > value) high = mid - 1;
    else return mid;
  }
  return Math.max(0, Math.min(count - 1, low));
};

export const useListVirtualizer = ({
  enabled,
  count,
  getKey,
  estimateSize,
  scrollRef,
  overscan = 6,
  fallbackViewport = 480,
  gap = 0,
}: UseListVirtualizerOptions): ListVirtualizer => {
  const sizes = useRef(new Map<string, number>());
  const [version, setVersion] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(0);
  const pending = useRef(false);
  const observer = useRef<ResizeObserver | null>(null);
  const keyOfNode = useRef(new WeakMap<Element, string>());

  const bump = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    const run = () => {
      pending.current = false;
      setVersion((v) => v + 1);
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
    else setTimeout(run, 0);
  }, []);

  const record = useCallback(
    (key: string, height: number) => {
      if (!height) return;
      const previous = sizes.current.get(key);
      if (previous !== undefined && Math.abs(previous - height) < 0.5) return;
      sizes.current.set(key, height);
      bump();
    },
    [bump],
  );

  useEffect(() => {
    if (!enabled || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const key = keyOfNode.current.get(entry.target);
        if (key !== undefined) record(key, (entry.target as HTMLElement).offsetHeight);
      });
    });
    observer.current = ro;
    return () => {
      ro.disconnect();
      observer.current = null;
    };
  }, [enabled, record]);

  // Desplazamiento y alto del área visible.
  useIsoLayoutEffect(() => {
    const node = scrollRef.current;
    if (!enabled || !node) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      setScrollTop(node.scrollTop);
      setViewport(node.clientHeight);
    };
    const onScroll = () => {
      if (frame) return;
      if (typeof requestAnimationFrame === "function") frame = requestAnimationFrame(read);
      else read();
    };
    read();
    node.addEventListener("scroll", onScroll, { passive: true });
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => setViewport(node.clientHeight));
      ro.observe(node);
    }
    return () => {
      node.removeEventListener("scroll", onScroll);
      if (frame && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
      ro?.disconnect();
    };
  }, [enabled, scrollRef]);

  const offsets = useMemo(() => {
    const result = new Float64Array(count + 1);
    if (!enabled) return result;
    for (let i = 0; i < count; i += 1) {
      const size = sizes.current.get(getKey(i)) ?? estimateSize(i);
      result[i + 1] = result[i] + size + (i < count - 1 ? gap : 0);
    }
    return result;
    // `version` invalida el cálculo cuando cambian las medidas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, count, getKey, estimateSize, gap, version]);

  const height = viewport || fallbackViewport;
  let start = 0;
  let end = count;
  if (enabled && count > 0) {
    start = Math.max(0, findIndex(offsets, count, scrollTop) - overscan);
    end = Math.min(count, findIndex(offsets, count, scrollTop + height) + 1 + overscan);
  }

  const measure = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      if (!enabled || !node) return;
      const key = getKey(index);
      keyOfNode.current.set(node, key);
      record(key, node.offsetHeight);
      observer.current?.observe(node);
    },
    [enabled, getKey, record],
  );

  const scrollToIndex = useCallback(
    (index: number, options?: { paddingTop?: number }) => {
      const node = scrollRef.current;
      if (!enabled || !node || index < 0 || index >= count) return;
      const top = offsets[index] - (options?.paddingTop ?? 0);
      const bottom = offsets[index + 1];
      const view = node.clientHeight || fallbackViewport;
      let next: number | null = null;
      if (top < node.scrollTop) next = top;
      else if (bottom > node.scrollTop + view) next = bottom - view;
      if (next === null) return;
      node.scrollTop = Math.max(0, next);
      setScrollTop(Math.max(0, next));
    },
    [enabled, count, offsets, scrollRef, fallbackViewport],
  );

  return {
    start,
    end,
    totalSize: offsets[count] ?? 0,
    offsetOf: (index) => offsets[index] ?? 0,
    sizeOf: (index) => (offsets[index + 1] ?? 0) - (offsets[index] ?? 0),
    measure,
    scrollToIndex,
    scrollTop,
    indexAt: (offset) => (count > 0 ? findIndex(offsets, count, offset) : -1),
  };
};
