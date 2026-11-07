import { useEffect, useRef, useState } from "react";

/**
 * Mide el ancho disponible de un contenedor (ResizeObserver).
 * Antes de medir (o en entornos sin ResizeObserver) usa `fallback`.
 */
export const useChartWidth = <T extends HTMLElement = HTMLDivElement>(fallback = 600) => {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const next = Math.round(node.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
};

/** Pseudoaleatorio determinista: los skeletons no "brincan" entre renders. */
export const seeded = (seed: number) => {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};
