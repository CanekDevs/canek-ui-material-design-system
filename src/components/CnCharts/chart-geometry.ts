/** Geometría compartida por skeletons y gráficas propias (sin dependencias). */

const toRadians = (degrees: number) => ((degrees - 90) * Math.PI) / 180;

/** Punto en un círculo. Ángulo en grados: 0 = arriba, sentido horario. */
export const polar = (cx: number, cy: number, radius: number, degrees: number) => ({
  x: cx + radius * Math.cos(toRadians(degrees)),
  y: cy + radius * Math.sin(toRadians(degrees)),
});

/**
 * Trayectoria SVG de un sector o anillo (`inner` = 0 para pastel).
 * Ángulos en grados: 0 = arriba, sentido horario.
 */
export const arcPath = (
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number,
  cornerRadius = 0,
): string => {
  const sweep = Math.min(359.999, Math.max(0, end - start));
  if (sweep <= 0 || outer <= 0) return "";
  const finish = start + sweep;
  const large = sweep > 180 ? 1 : 0;
  // Esquinas redondeadas aproximadas: se recorta un poco cada extremo.
  const radius = Math.min(cornerRadius, (outer - inner) / 2);
  const trimOuter = radius > 0 ? Math.min(sweep / 4, (radius / outer) * (180 / Math.PI)) : 0;
  const trimInner =
    radius > 0 && inner > 0 ? Math.min(sweep / 4, (radius / inner) * (180 / Math.PI)) : 0;

  const o1 = polar(cx, cy, outer, start + trimOuter);
  const o2 = polar(cx, cy, outer, finish - trimOuter);
  if (inner <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${o1.x} ${o1.y}`,
      `A ${outer} ${outer} 0 ${large} 1 ${o2.x} ${o2.y}`,
      "Z",
    ].join(" ");
  }
  const i1 = polar(cx, cy, inner, finish - trimInner);
  const i2 = polar(cx, cy, inner, start + trimInner);
  if (radius <= 0) {
    return [
      `M ${o1.x} ${o1.y}`,
      `A ${outer} ${outer} 0 ${large} 1 ${o2.x} ${o2.y}`,
      `L ${i1.x} ${i1.y}`,
      `A ${inner} ${inner} 0 ${large} 0 ${i2.x} ${i2.y}`,
      "Z",
    ].join(" ");
  }
  const oc2 = polar(cx, cy, outer - radius, finish);
  const ic1 = polar(cx, cy, inner + radius, finish);
  const ic2 = polar(cx, cy, inner + radius, start);
  const oc1 = polar(cx, cy, outer - radius, start);
  const e1 = polar(cx, cy, outer, finish);
  const e2 = polar(cx, cy, inner, finish);
  const s1 = polar(cx, cy, inner, start);
  const s2 = polar(cx, cy, outer, start);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outer} ${outer} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `Q ${e1.x} ${e1.y} ${oc2.x} ${oc2.y}`,
    `L ${ic1.x} ${ic1.y}`,
    `Q ${e2.x} ${e2.y} ${i1.x} ${i1.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${i2.x} ${i2.y}`,
    `Q ${s1.x} ${s1.y} ${ic2.x} ${ic2.y}`,
    `L ${oc1.x} ${oc1.y}`,
    `Q ${s2.x} ${s2.y} ${o1.x} ${o1.y}`,
    "Z",
  ].join(" ");
};

/** Línea suave (Catmull-Rom → Bézier) entre puntos. */
export const smoothPath = (points: ReadonlyArray<{ x: number; y: number }>, closed = false) => {
  if (points.length === 0) return "";
  if (points.length < 3) {
    return `M ${points.map((p) => `${p.x} ${p.y}`).join(" L ")}${closed ? " Z" : ""}`;
  }
  const pts = closed ? [...points, points[0], points[1]] : points;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  const last = closed ? pts.length - 2 : pts.length - 1;
  for (let i = 0; i < last; i += 1) {
    const p0 = pts[i - 1] ?? (closed ? points[points.length - 1] : pts[i]);
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
  }
  return closed ? `${d} Z` : d;
};

/** Línea recta o escalonada entre puntos. */
export const linearPath = (points: ReadonlyArray<{ x: number; y: number }>, step = false) => {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    if (step) d += ` H ${points[i].x} V ${points[i].y}`;
    else d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
};

/** Valores "bonitos" para ticks de un eje lineal. */
export const niceTicks = (min: number, max: number, count = 5): number[] => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) return [min];
  const span = max - min;
  const rough = span / Math.max(1, count);
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / power;
  const step = (fraction >= 5 ? 10 : fraction >= 2 ? 5 : fraction >= 1 ? 2 : 1) * power;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + step / 2; value += step) {
    ticks.push(Number(value.toFixed(10)));
  }
  return ticks;
};

export type TreemapNode<T> = { value: number; item: T };
export type TreemapRect<T> = { x: number; y: number; width: number; height: number; item: T };

/** Algoritmo "squarified" de treemap (rectángulos lo más cuadrados posible). */
export const squarify = <T>(
  nodes: ReadonlyArray<TreemapNode<T>>,
  x: number,
  y: number,
  width: number,
  height: number,
): TreemapRect<T>[] => {
  const items = nodes.filter((n) => n.value > 0).sort((a, b) => b.value - a.value);
  const total = items.reduce((acc, n) => acc + n.value, 0);
  if (total <= 0 || width <= 0 || height <= 0) return [];
  const scale = (width * height) / total;
  const result: TreemapRect<T>[] = [];
  let rect = { x, y, width, height };
  let row: TreemapNode<T>[] = [];

  const worst = (current: TreemapNode<T>[], side: number) => {
    if (current.length === 0) return Infinity;
    const areas = current.map((n) => n.value * scale);
    const sum = areas.reduce((a, b) => a + b, 0);
    const max = Math.max(...areas);
    const min = Math.min(...areas);
    return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
  };

  const layoutRow = (current: TreemapNode<T>[]) => {
    const sum = current.reduce((a, n) => a + n.value * scale, 0);
    const horizontal = rect.width >= rect.height;
    const side = horizontal ? rect.height : rect.width;
    const thickness = sum / side;
    let offset = 0;
    for (const node of current) {
      const length = (node.value * scale) / thickness;
      result.push(
        horizontal
          ? { x: rect.x, y: rect.y + offset, width: thickness, height: length, item: node.item }
          : { x: rect.x + offset, y: rect.y, width: length, height: thickness, item: node.item },
      );
      offset += length;
    }
    rect = horizontal
      ? { x: rect.x + thickness, y: rect.y, width: rect.width - thickness, height: rect.height }
      : { x: rect.x, y: rect.y + thickness, width: rect.width, height: rect.height - thickness };
  };

  for (const node of items) {
    const side = Math.min(rect.width, rect.height);
    if (row.length === 0 || worst([...row, node], side) <= worst(row, side)) {
      row.push(node);
    } else {
      layoutRow(row);
      row = [node];
    }
  }
  if (row.length) layoutRow(row);
  return result;
};
