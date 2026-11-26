import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Mide el ancho de un elemento con ResizeObserver (para diseños que responden al contenedor y no
 * a la ventana: una barra dentro de un panel o una historia a 320 px se comportan como en móvil).
 * Devuelve `null` antes de medir o donde no hay ResizeObserver (jsdom): quien lo usa decide el
 * diseño por omisión.
 */
export const useElementWidth = <T extends HTMLElement = HTMLDivElement>() => {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const nodeRef = useRef<T | null>(null);

  const ref = useCallback((el: T | null) => {
    nodeRef.current = el;
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return;
    const measure = () => {
      const next = Math.round(node.getBoundingClientRect().width);
      setWidth(next > 0 ? next : null);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref, nodeRef, width };
};
