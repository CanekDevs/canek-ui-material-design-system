import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { useCallback, useRef, useState } from "react";

export type UseSortableListOptions = {
  count: number;
  /** Mueve el elemento `from` a la posición `to`. */
  onMove: (from: number, to: number) => void;
  disabled?: boolean;
  /** Nombre accesible de cada elemento (para el asa y los anuncios). */
  getItemLabel?: (index: number) => string;
  /** `y` = lista vertical (los demás se desplazan); `grid` = cuadrícula (se marca el destino). */
  axis?: "y" | "grid";
};

type DragState = {
  index: number;
  startX: number;
  startY: number;
  offsetX: number;
  offset: number;
  target: number;
  rects: DOMRect[];
};

/** Reubica un elemento dentro de un arreglo sin mutarlo. */
export const moveArrayItem = <T>(list: readonly T[], from: number, to: number): T[] => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/**
 * Lista ordenable vertical sin dependencias. Funciona con puntero (mouse,
 * touch, lápiz) arrastrando el asa, y con teclado: flechas arriba/abajo sobre
 * el asa mueven el elemento. Los cambios se anuncian en una región `aria-live`.
 */
export const useSortableList = ({
  count,
  onMove,
  disabled = false,
  getItemLabel,
  axis = "y",
}: UseSortableListOptions) => {
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const labelOf = useCallback(
    (index: number) => getItemLabel?.(index) ?? `Elemento ${index + 1}`,
    [getItemLabel],
  );

  const update = (next: DragState | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  const computeTarget = (state: DragState, offset: number, offsetX = 0): number => {
    const dragged = state.rects[state.index];
    if (axis === "grid") {
      // Destino = elemento cuyo centro está más cerca del centro arrastrado.
      const cx = dragged.left + dragged.width / 2 + offsetX;
      const cy = dragged.top + dragged.height / 2 + offset;
      let best = state.index;
      let bestDistance = Number.POSITIVE_INFINITY;
      state.rects.forEach((rect, i) => {
        const distance = Math.hypot(
          rect.left + rect.width / 2 - cx,
          rect.top + rect.height / 2 - cy,
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      return best;
    }
    const center = dragged.top + dragged.height / 2 + offset;
    let target = 0;
    state.rects.forEach((rect, i) => {
      if (i === state.index) return;
      if (center > rect.top + rect.height / 2) target += 1;
    });
    return target;
  };

  const onPointerDown = (index: number) => (event: PointerEvent<HTMLElement>) => {
    if (disabled || count < 2 || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    const rects = itemRefs.current
      .slice(0, count)
      .map((node) => node?.getBoundingClientRect() ?? new DOMRect());
    event.currentTarget.setPointerCapture?.(event.pointerId);
    update({
      index,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: 0,
      offset: 0,
      target: index,
      rects,
    });
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const state = dragRef.current;
    if (!state) return;
    const offset = event.clientY - state.startY;
    const offsetX = axis === "grid" ? event.clientX - state.startX : 0;
    update({ ...state, offset, offsetX, target: computeTarget(state, offset, offsetX) });
  };

  const finish = (event: PointerEvent<HTMLElement>) => {
    const state = dragRef.current;
    if (!state) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    update(null);
    if (state.target !== state.index) {
      onMove(state.index, state.target);
      setAnnouncement(
        `${labelOf(state.index)} movido a la posición ${state.target + 1} de ${count}`,
      );
    }
  };

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    const back = event.key === "ArrowUp" || (axis === "grid" && event.key === "ArrowLeft");
    const forward = event.key === "ArrowDown" || (axis === "grid" && event.key === "ArrowRight");
    const delta = back ? -1 : forward ? 1 : 0;
    if (!delta) return;
    event.preventDefault();
    const to = index + delta;
    if (to < 0 || to >= count) return;
    onMove(index, to);
    setAnnouncement(`${labelOf(index)} movido a la posición ${to + 1} de ${count}`);
    // Mantiene el foco en el asa del elemento movido.
    requestAnimationFrame(() => {
      itemRefs.current[to]?.querySelector<HTMLElement>("[data-cn-drag-handle]")?.focus();
    });
  };

  /** Desplazamiento visual de cada elemento mientras se arrastra. */
  const getItemStyle = (index: number): CSSProperties => {
    if (!drag) return {};
    if (index === drag.index) {
      return {
        transform:
          axis === "grid"
            ? `translate(${drag.offsetX}px, ${drag.offset}px) scale(1.04)`
            : `translateY(${drag.offset}px)`,
        zIndex: 5,
        position: "relative",
        boxShadow: "0 8px 24px rgba(17, 20, 24, 0.16)",
        transition: "box-shadow 120ms ease",
      };
    }
    if (axis === "grid") {
      return index === drag.target
        ? { outline: "2px dashed var(--cn-color-brand-500, #3562a6)", outlineOffset: 2 }
        : { transition: "opacity 120ms ease", opacity: 0.85 };
    }
    const dragged = drag.rects[drag.index];
    const gap =
      drag.rects.length > 1
        ? Math.max(0, (drag.rects[1]?.top ?? 0) - (drag.rects[0]?.bottom ?? 0))
        : 0;
    const shift = dragged.height + gap;
    let translate = 0;
    if (drag.index < index && index <= drag.target) translate = -shift;
    if (drag.index > index && index >= drag.target) translate = shift;
    return { transform: `translateY(${translate}px)`, transition: "transform 160ms ease" };
  };

  const getItemProps = (index: number) => ({
    ref: (node: HTMLElement | null) => {
      itemRefs.current[index] = node;
    },
    style: getItemStyle(index),
    "data-dragging": drag?.index === index || undefined,
  });

  const getHandleProps = (index: number) => ({
    "data-cn-drag-handle": true,
    role: "button" as const,
    tabIndex: disabled ? -1 : 0,
    "aria-roledescription": "asa para reordenar",
    "aria-label": `Reordenar ${labelOf(index)}. Usa las flechas ${axis === "grid" ? "del teclado" : "arriba y abajo"}`,
    "aria-disabled": disabled || count < 2 || undefined,
    onPointerDown: onPointerDown(index),
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: finish,
    onKeyDown: onKeyDown(index),
    style: {
      touchAction: "none",
      cursor: disabled ? "default" : drag ? "grabbing" : "grab",
    } as CSSProperties,
  });

  return { getItemProps, getHandleProps, isDragging: drag !== null, announcement };
};
