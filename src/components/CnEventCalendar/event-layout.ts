import { addDays, diffDays, startOfDay } from "./calendar-utils";

/*
 * Cálculos de acomodo puros (sin React):
 * - `layoutTimedEvents`: columnas lado a lado para eventos con hora que se
 *   enciman dentro de un día (semana/día).
 * - `layoutSegments`: barras de varios días en filas (lanes) por semana para
 *   el mes y la franja "Todo el día".
 */

export type CnTimedItem = { start: Date; end: Date };

export type CnTimedLayout<T extends CnTimedItem> = {
  item: T;
  /** Columna asignada (0…columns-1). */
  column: number;
  /** Columnas del grupo de eventos que se enciman. */
  columns: number;
  /** Columnas libres a la derecha que puede ocupar (≥ 1). */
  span: number;
};

/**
 * Acomoda eventos que se enciman en columnas (algoritmo voraz por grupos
 * transitivos). Cada evento ocupa la primera columna libre; el ancho del grupo
 * es el máximo de columnas simultáneas y cada evento se estira a las columnas
 * vacías a su derecha.
 */
export const layoutTimedEvents = <T extends CnTimedItem>(items: T[]): CnTimedLayout<T>[] => {
  const sorted = [...items].sort(
    (a, b) =>
      a.start.getTime() - b.start.getTime() ||
      b.end.getTime() - b.start.getTime() - (a.end.getTime() - a.start.getTime()),
  );
  const result: CnTimedLayout<T>[] = [];
  let group: CnTimedLayout<T>[] = [];
  let columnsEnd: number[] = [];
  let groupEnd = -Infinity;

  const flush = () => {
    const columns = columnsEnd.length;
    for (const entry of group) {
      entry.columns = columns;
      // Expande a la derecha mientras ninguna otra caja del grupo lo impida.
      let span = 1;
      for (let c = entry.column + 1; c < columns; c += 1) {
        const blocked = group.some(
          (other) =>
            other.column === c &&
            other.item.start < entry.item.end &&
            other.item.end > entry.item.start,
        );
        if (blocked) break;
        span += 1;
      }
      entry.span = span;
    }
    result.push(...group);
    group = [];
    columnsEnd = [];
  };

  for (const item of sorted) {
    const start = item.start.getTime();
    if (group.length && start >= groupEnd) {
      flush();
      groupEnd = -Infinity;
    }
    let column = columnsEnd.findIndex((end) => end <= start);
    if (column === -1) {
      column = columnsEnd.length;
      columnsEnd.push(item.end.getTime());
    } else {
      columnsEnd[column] = item.end.getTime();
    }
    group.push({ item, column, columns: 1, span: 1 });
    groupEnd = Math.max(groupEnd, item.end.getTime());
  }
  if (group.length) flush();
  return result;
};

export type CnSegment<T extends CnTimedItem> = {
  item: T;
  /** Columna inicial dentro de la fila (0-based). */
  startCol: number;
  /** Columnas que ocupa (≥ 1). */
  span: number;
  /** Fila (lane) asignada. */
  lane: number;
  /** ¿Empieza/termina en esta fila? (para redondear las puntas). */
  isStart: boolean;
  isEnd: boolean;
};

/**
 * Divide los elementos en segmentos para una fila de `days` columnas que
 * empieza en `rowStart`, y les asigna lanes sin que se enciman. Los más
 * largos y tempranos quedan arriba.
 */
export const layoutSegments = <T extends CnTimedItem>(
  items: T[],
  rowStart: Date,
  days: number,
): CnSegment<T>[] => {
  const start = startOfDay(rowStart);
  const rowEnd = addDays(start, days);
  const segments = items
    .filter((item) => item.start < rowEnd && item.end > start)
    .map((item) => {
      const first = item.start < start ? start : startOfDay(item.start);
      // Fin exclusivo: un evento que termina a medianoche no ocupa el día siguiente.
      const lastInstant = new Date(Math.max(item.end.getTime() - 1, item.start.getTime()));
      const last = lastInstant >= rowEnd ? addDays(rowEnd, -1) : startOfDay(lastInstant);
      const startCol = Math.max(0, diffDays(first, start));
      const endCol = Math.min(days - 1, Math.max(startCol, diffDays(last, start)));
      return {
        item,
        startCol,
        span: endCol - startCol + 1,
        lane: 0,
        isStart: item.start >= start,
        isEnd: item.end <= rowEnd,
      };
    })
    .sort((a, b) => a.startCol - b.startCol || b.span - a.span);

  const lanes: boolean[][] = [];
  for (const seg of segments) {
    let lane = 0;
    for (;;) {
      const row = (lanes[lane] ??= Array(days).fill(false));
      let free = true;
      for (let c = seg.startCol; c < seg.startCol + seg.span; c += 1) {
        if (row[c]) {
          free = false;
          break;
        }
      }
      if (free) {
        for (let c = seg.startCol; c < seg.startCol + seg.span; c += 1) row[c] = true;
        seg.lane = lane;
        break;
      }
      lane += 1;
    }
  }
  return segments;
};

/**
 * Decide qué segmentos caben cuando cada día muestra como máximo `maxLanes`
 * filas (si no caben todos, la última fila se reserva para "+N más") y cuenta
 * los ocultos por columna.
 */
export const limitSegments = <T extends CnTimedItem>(
  segments: CnSegment<T>[],
  days: number,
  maxLanes: number,
): { visible: CnSegment<T>[]; hidden: number[]; limits: number[] } => {
  const covers = (s: CnSegment<T>, c: number) => c >= s.startCol && c < s.startCol + s.span;
  const limits = Array.from({ length: days }, (_, c) => {
    const lanesUsed = segments.reduce(
      (acc, s) => (covers(s, c) ? Math.max(acc, s.lane + 1) : acc),
      0,
    );
    return lanesUsed > maxLanes ? Math.max(0, maxLanes - 1) : maxLanes;
  });
  const isVisible = (s: CnSegment<T>) => {
    for (let c = s.startCol; c < s.startCol + s.span; c += 1) if (s.lane >= limits[c]) return false;
    return true;
  };
  const visible = segments.filter(isVisible);
  const hidden = Array.from(
    { length: days },
    (_, c) => segments.filter((s) => covers(s, c) && !isVisible(s)).length,
  );
  return { visible, hidden, limits };
};
