import { downloadBlob } from "../CnDataTable/export";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Propiedades de estilo que se copian en línea al exportar un SVG. */
const STYLE_PROPS = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "text-anchor",
  "dominant-baseline",
  "visibility",
  "display",
  "paint-order",
];

/** Tamaño declarado de un SVG (atributo o `baseVal`). */
const declaredSize = (svg: SVGSVGElement, axis: "width" | "height"): number =>
  Number(svg.getAttribute(axis)) || svg[axis]?.baseVal?.value || 0;

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Busca el SVG principal (el más grande) dentro de un contenedor. */
export const findChartSvg = (container: HTMLElement | null): SVGSVGElement | null => {
  if (!container) return null;
  const svgs = Array.from(container.querySelectorAll("svg")).filter(
    (svg) =>
      !svg.closest("button") &&
      !svg.closest("[data-cn-chart-ignore]") &&
      !svg.parentElement?.closest("svg"),
  );
  let best: SVGSVGElement | null = null;
  let bestArea = 0;
  for (const svg of svgs) {
    const { width, height } = svg.getBoundingClientRect();
    const area = (width || declaredSize(svg, "width")) * (height || declaredSize(svg, "height"));
    if (area >= bestArea) {
      best = svg;
      bestArea = area;
    }
  }
  return best;
};

const el = (name: string, attrs: Record<string, string | number>) => {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
};

const textEl = (content: string, attrs: Record<string, string | number>): SVGTextElement => {
  const node = el("text", { "font-family": FONT, ...attrs }) as SVGTextElement;
  node.textContent = content;
  return node;
};

/**
 * Sustituye cada `foreignObject` por texto SVG en la misma posición. Un SVG con
 * `foreignObject` "contamina" el canvas y el navegador bloquea el PNG.
 */
const replaceForeignObjects = (source: SVGSVGElement, clone: SVGSVGElement) => {
  const origin = source.getBoundingClientRect();
  const originals = Array.from(source.querySelectorAll("foreignObject"));
  const copies = Array.from(clone.querySelectorAll("foreignObject"));
  originals.forEach((foreign, index) => {
    const copy = copies[index];
    if (!copy) return;
    const group = el("g", {});
    const leaves = Array.from(foreign.querySelectorAll("*")).filter(
      (node) => node.children.length === 0 && (node.textContent ?? "").trim(),
    );
    for (const leaf of leaves) {
      const box = leaf.getBoundingClientRect();
      const style = getComputedStyle(leaf);
      group.appendChild(
        textEl((leaf.textContent ?? "").trim(), {
          x: box.left - origin.left + box.width / 2,
          y: box.top - origin.top + box.height / 2,
          "text-anchor": "middle",
          "dominant-baseline": "central",
          "font-size": style.fontSize,
          "font-weight": style.fontWeight,
          fill: style.color,
        }),
      );
    }
    copy.replaceWith(group);
  });
};

/** Copia los estilos calculados en línea (las clases de emotion no viajan). */
const inlineStyles = (source: Element, clone: Element) => {
  const from = [source, ...Array.from(source.querySelectorAll("*"))];
  const to = [clone, ...Array.from(clone.querySelectorAll("*"))];
  from.forEach((node, index) => {
    const copy = to[index];
    if (!copy || node.closest("foreignObject")) return;
    const computed = getComputedStyle(node);
    const inline = STYLE_PROPS.map((prop) => {
      const value = computed.getPropertyValue(prop);
      return value ? `${prop}:${value}` : "";
    })
      .filter(Boolean)
      .join(";");
    if (inline) copy.setAttribute("style", `${inline};${copy.getAttribute("style") ?? ""}`);
  });
};

type LegendEntry = { label: string; color: string };

/** Lee la leyenda HTML (MUI X o la de Canek) para dibujarla en la imagen. */
const readLegend = (container: HTMLElement): LegendEntry[] => {
  const canek = Array.from(container.querySelectorAll<HTMLElement>("[data-cn-legend-item]"))
    .filter((item) => !item.dataset.hidden)
    .map((item) => ({
      label: (item.textContent ?? "").trim(),
      color: item.dataset.color ?? "#999",
    }));
  if (canek.length) return canek;
  return Array.from(container.querySelectorAll<HTMLElement>(".MuiChartsLegend-series"))
    .filter((item) => getComputedStyle(item).opacity !== "0.5")
    .map((item) => {
      const fillNode = item.querySelector<SVGElement>(
        ".MuiChartsLabelMark-fill, svg circle, svg rect, svg path",
      );
      const box = item.querySelector<HTMLElement>(
        ".MuiChartsLegend-mark, .MuiChartsLabelMark-root",
      );
      const fill = fillNode ? fillNode.getAttribute("fill") || getComputedStyle(fillNode).fill : "";
      const background = box ? getComputedStyle(box).backgroundColor : "";
      const color =
        (fill && fill !== "none" && fill) ||
        (background && background !== "rgba(0, 0, 0, 0)" && background) ||
        "#999";
      return { label: (item.textContent ?? "").trim(), color };
    })
    .filter((entry) => entry.label);
};

export type CnChartImageOptions = {
  title?: string;
  subtitle?: string;
  background?: string;
  /** Incluye la leyenda HTML bajo la gráfica. */
  legend?: boolean;
};

/**
 * Arma un SVG autocontenido de la gráfica: título, subtítulo, gráfica
 * (estilos en línea, sin `foreignObject`) y leyenda.
 */
export const buildChartSvg = (
  container: HTMLElement,
  options: CnChartImageOptions = {},
): { svg: string; width: number; height: number } | null => {
  const source = findChartSvg(container);
  if (!source) return null;
  const box = source.getBoundingClientRect();
  const chartW = Math.round(box.width) || declaredSize(source, "width") || 600;
  const chartH = Math.round(box.height) || declaredSize(source, "height") || 300;
  const pad = 20;
  const width = chartW + pad * 2;

  const clone = source.cloneNode(true) as SVGSVGElement;
  inlineStyles(source, clone);
  replaceForeignObjects(source, clone);
  clone.removeAttribute("class");
  clone.setAttribute("x", String(pad));
  clone.setAttribute("width", String(chartW));
  clone.setAttribute("height", String(chartH));
  clone.setAttribute("overflow", "visible");

  const root = el("svg", { xmlns: SVG_NS, width, height: 0 }) as SVGSVGElement;
  root.appendChild(
    el("rect", { width: "100%", height: "100%", fill: options.background ?? "#ffffff" }),
  );

  let y = pad;
  if (options.title) {
    root.appendChild(
      textEl(options.title, {
        x: pad,
        y: y + 14,
        "font-size": 16,
        "font-weight": 700,
        fill: "#111418",
      }),
    );
    y += 24;
  }
  if (options.subtitle) {
    root.appendChild(
      textEl(options.subtitle, { x: pad, y: y + 10, "font-size": 12, fill: "#6e7682" }),
    );
    y += 20;
  }
  if (options.title || options.subtitle) y += 8;
  clone.setAttribute("y", String(y));
  root.appendChild(clone);
  y += chartH;

  // Leyenda en filas que se ajustan al ancho.
  const entries = options.legend === false ? [] : readLegend(container);
  if (entries.length) {
    y += 14;
    let x = pad;
    const rowH = 22;
    for (const entry of entries) {
      const itemW = 18 + Math.min(240, entry.label.length * 7) + 18;
      if (x + itemW > width - pad && x > pad) {
        x = pad;
        y += rowH;
      }
      root.appendChild(
        el("rect", { x, y: y - 9, width: 10, height: 10, rx: 3, fill: entry.color }),
      );
      root.appendChild(
        textEl(entry.label, {
          x: x + 16,
          y,
          "font-size": 12,
          "font-weight": 600,
          fill: "#4e5660",
          "dominant-baseline": "central",
        }),
      );
      x += itemW;
    }
    y += rowH - 8;
  }
  const height = Math.round(y + pad);
  root.setAttribute("height", String(height));
  root.setAttribute("viewBox", `0 0 ${width} ${height}`);
  return { svg: new XMLSerializer().serializeToString(root), width, height };
};

/** Compatibilidad: serializa un SVG suelto con estilos en línea. */
export const serializeSvg = (svg: SVGSVGElement, background?: string): string => {
  const holder = document.createElement("div");
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineStyles(svg, clone);
  replaceForeignObjects(svg, clone);
  const { width, height } = svg.getBoundingClientRect();
  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("width", String(Math.round(width) || 600));
  clone.setAttribute("height", String(Math.round(height) || 300));
  if (background)
    clone.insertBefore(
      el("rect", { width: "100%", height: "100%", fill: background }),
      clone.firstChild,
    );
  holder.appendChild(clone);
  return new XMLSerializer().serializeToString(clone);
};

export const downloadSvgText = (svg: string, filename: string) =>
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${filename}.svg`);

/** Rasteriza un SVG (texto) a PNG. Resuelve con el Blob o `null` si el navegador lo bloquea. */
export const svgToPngBlob = (
  svg: string,
  width: number,
  height: number,
  scale = 2,
): Promise<Blob | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const context = canvas.getContext("2d");
        if (!context) return resolve(null);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/png");
      } catch {
        // Canvas contaminado u otro bloqueo del navegador.
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });

/** Descarga la gráfica de un contenedor como PNG (con título y leyenda). */
export const downloadChartPng = async (
  container: HTMLElement,
  filename: string,
  options?: CnChartImageOptions,
): Promise<boolean> => {
  const built = buildChartSvg(container, options);
  if (!built) return false;
  const blob = await svgToPngBlob(built.svg, built.width, built.height);
  if (!blob) return false;
  downloadBlob(blob, `${filename}.png`);
  return true;
};

/** Descarga la gráfica de un contenedor como SVG (con título y leyenda). */
export const downloadChartSvg = (
  container: HTMLElement,
  filename: string,
  options?: CnChartImageOptions,
): boolean => {
  const built = buildChartSvg(container, options);
  if (!built) return false;
  downloadSvgText(built.svg, filename);
  return true;
};

/** Nombre de archivo seguro a partir de un título. */
export const toFilename = (title: string | undefined, fallback = "grafica") =>
  (title || fallback)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || fallback;
