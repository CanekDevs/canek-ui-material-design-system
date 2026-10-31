import type { PointerEvent } from "react";
import { useCallback, useEffect, useRef } from "react";

/**
 * Repite una acción mientras se mantiene presionado un botón, acelerando con
 * el tiempo (400 ms de espera, luego 120 ms → 40 ms). Funciona con mouse,
 * touch y lápiz; el clic con teclado lo maneja el `onClick` normal del botón.
 */
export const usePressRepeat = (action: () => void, enabled = true) => {
  const actionRef = useRef(action);
  actionRef.current = action;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef(false);

  const stop = useCallback(() => {
    pressedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled || (event.pointerType === "mouse" && event.button !== 0)) return;
      // Evita que el botón robe el foco al input y que el `click` repita la acción.
      event.preventDefault();
      pressedRef.current = true;
      actionRef.current();
      let delay = 400;
      let count = 0;
      const tick = () => {
        if (!pressedRef.current) return;
        actionRef.current();
        count += 1;
        delay = count < 8 ? 120 : count < 20 ? 70 : 40;
        timerRef.current = setTimeout(tick, delay);
      };
      timerRef.current = setTimeout(tick, delay);
    },
    [enabled],
  );

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    /** Solo para activación por teclado (Enter/Espacio): el puntero ya actuó en `pointerdown`. */
    onClick: (event: { detail: number }) => {
      if (enabled && event.detail === 0) actionRef.current();
    },
  };
};
