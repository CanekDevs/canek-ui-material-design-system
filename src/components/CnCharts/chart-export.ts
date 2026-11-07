import { downloadBlob } from "../CnDataTable/export";

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
];

/**
 * Serializa un SVG con los estilos calculados en línea: las clases de MUI
 * (emotion) no viajan con el archivo exportado.
 */
export const serializeSvg = (svg: SVGSVGElement, background?: string): string => {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const source = [svg, ...Array.from(svg.querySelectorAll("*"))];
  const target = [clone, ...Array.from(clone.querySelectorAll("*"))];
  source.forEach((node, index) => {
    const copy = target[index] as SVGElement | undefined;
    if (!copy || !(node instanceof Element)) return;
    const computed = getComputedStyle(node);
    const inline = STYLE_PROPS.map((prop) => {
      const value = computed.getPropertyValue(prop);
      return value ? `${prop}:${value}` : "";
    })
      .filter(Boolean)
      .join(";");
    if (inline) copy.setAttribute("style", `${inline};${copy.getAttribute("style") ?? ""}`);
  });
  const { width, height } = svg.getBoundingClientRect();
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(Math.round(width) || svg.width.baseVal.value || 600));
  clone.setAttribute("height", String(Math.round(height) || svg.height.baseVal.value || 300));
  if (background) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", background);
    clone.insertBefore(rect, clone.firstChild);
  }
  return new XMLSerializer().serializeToString(clone);
};

/** Busca el SVG principal (el más grande) dentro de un contenedor. */
export const findChartSvg = (container: HTMLElement | null): SVGSVGElement | null => {
  if (!container) return null;
  const svgs = Array.from(container.querySelectorAll("svg")).filter(
    (svg) => !svg.closest("button") && !svg.closest("[data-cn-chart-ignore]"),
  );
  let best: SVGSVGElement | null = null;
  let bestArea = 0;
  for (const svg of svgs) {
    const { width, height } = svg.getBoundingClientRect();
    const area = (width || svg.width.baseVal.value) * (height || svg.height.baseVal.value);
    if (area >= bestArea) {
      best = svg;
      bestArea = area;
    }
  }
  return best;
};

export const downloadSvg = (svg: SVGSVGElement, filename: string) => {
  const text = serializeSvg(svg, "#ffffff");
  downloadBlob(new Blob([text], { type: "image/svg+xml;charset=utf-8" }), `${filename}.svg`);
};

/** Convierte el SVG en PNG (alta resolución, fondo blanco) y lo descarga. */
export const downloadPng = (svg: SVGSVGElement, filename: string, scale = 2): Promise<boolean> =>
  new Promise((resolve) => {
    const text = serializeSvg(svg, "#ffffff");
    const width = Number(svg.getBoundingClientRect().width) || 600;
    const height = Number(svg.getBoundingClientRect().height) || 300;
    const image = new Image();
    const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml;charset=utf-8" }));
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        resolve(false);
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${filename}.png`);
        resolve(Boolean(blob));
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    image.src = url;
  });

/** Nombre de archivo seguro a partir de un título. */
export const toFilename = (title: string | undefined, fallback = "grafica") =>
  (title || fallback)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || fallback;
