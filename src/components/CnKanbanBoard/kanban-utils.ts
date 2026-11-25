import type { CnKanbanItem } from "./CnKanbanBoard";

/**
 * Aplica un movimiento del tablero a un arreglo plano de tarjetas sin mutarlo: cambia la columna
 * de la tarjeta y la deja en la posición `toIndex` de esa columna. Úsalo dentro de `onMove`.
 */
export const moveKanbanItem = <T extends CnKanbanItem>(
  items: readonly T[],
  itemId: string,
  toColumnId: string,
  toIndex: number,
): T[] => {
  const moving = items.find((item) => item.id === itemId);
  if (!moving) return [...items];
  const rest = items.filter((item) => item.id !== itemId);
  const moved = { ...moving, columnId: toColumnId };
  const inColumn = rest.filter((item) => item.columnId === toColumnId);
  const clamped = Math.max(0, Math.min(toIndex, inColumn.length));
  if (clamped < inColumn.length) {
    const anchor = rest.indexOf(inColumn[clamped]);
    return [...rest.slice(0, anchor), moved, ...rest.slice(anchor)];
  }
  if (inColumn.length > 0) {
    const anchor = rest.indexOf(inColumn[inColumn.length - 1]) + 1;
    return [...rest.slice(0, anchor), moved, ...rest.slice(anchor)];
  }
  return [...rest, moved];
};
