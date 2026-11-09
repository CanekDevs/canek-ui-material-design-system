import type { CnLatLng, CnMapStyleRule } from "./google-maps-types";

/*
 * Presets de estilo (formato del Styling Wizard), tonos de marcador y
 * utilidades de URL (iframe embebido y Static Maps).
 */

export type CnMapStylePreset =
  "default" | "silver" | "dark" | "night" | "retro" | "minimal" | "canek";

export type CnMapTone = "brand" | "accent" | "success" | "warning" | "error" | "info" | "neutral";

export const MAP_TONE_COLORS: Record<CnMapTone, string> = {
  brand: "#254d87",
  accent: "#3d5afe",
  success: "#2e7d32",
  warning: "#ed6c02",
  error: "#d32f2f",
  info: "#0288d1",
  neutral: "#4e5660",
};

const rule = (
  featureType: string | undefined,
  elementType: string | undefined,
  stylers: CnMapStyleRule["stylers"],
): CnMapStyleRule => ({
  ...(featureType ? { featureType } : {}),
  ...(elementType ? { elementType } : {}),
  stylers,
});
const color = (value: string) => [{ color: value }];
const off = [{ visibility: "off" }];

/** «Silver» del Styling Wizard. */
const SILVER: CnMapStyleRule[] = [
  rule(undefined, "geometry", color("#f5f5f5")),
  rule(undefined, "labels.icon", off),
  rule(undefined, "labels.text.fill", color("#616161")),
  rule(undefined, "labels.text.stroke", color("#f5f5f5")),
  rule("administrative.land_parcel", "labels.text.fill", color("#bdbdbd")),
  rule("poi", "geometry", color("#eeeeee")),
  rule("poi", "labels.text.fill", color("#757575")),
  rule("poi.park", "geometry", color("#e5e5e5")),
  rule("poi.park", "labels.text.fill", color("#9e9e9e")),
  rule("road", "geometry", color("#ffffff")),
  rule("road.arterial", "labels.text.fill", color("#757575")),
  rule("road.highway", "geometry", color("#dadada")),
  rule("road.highway", "labels.text.fill", color("#616161")),
  rule("road.local", "labels.text.fill", color("#9e9e9e")),
  rule("transit.line", "geometry", color("#e5e5e5")),
  rule("transit.station", "geometry", color("#eeeeee")),
  rule("water", "geometry", color("#c9c9c9")),
  rule("water", "labels.text.fill", color("#9e9e9e")),
];

/** «Dark» del Styling Wizard. */
const DARK: CnMapStyleRule[] = [
  rule(undefined, "geometry", color("#212121")),
  rule(undefined, "labels.icon", off),
  rule(undefined, "labels.text.fill", color("#757575")),
  rule(undefined, "labels.text.stroke", color("#212121")),
  rule("administrative", "geometry", color("#757575")),
  rule("administrative.country", "labels.text.fill", color("#9e9e9e")),
  rule("administrative.land_parcel", undefined, off),
  rule("administrative.locality", "labels.text.fill", color("#bdbdbd")),
  rule("poi", "labels.text.fill", color("#757575")),
  rule("poi.park", "geometry", color("#181818")),
  rule("poi.park", "labels.text.fill", color("#616161")),
  rule("poi.park", "labels.text.stroke", color("#1b1b1b")),
  rule("road", "geometry.fill", color("#2c2c2c")),
  rule("road", "labels.text.fill", color("#8a8a8a")),
  rule("road.arterial", "geometry", color("#373737")),
  rule("road.highway", "geometry", color("#3c3c3c")),
  rule("road.highway.controlled_access", "geometry", color("#4e4e4e")),
  rule("road.local", "labels.text.fill", color("#616161")),
  rule("transit", "labels.text.fill", color("#757575")),
  rule("water", "geometry", color("#000000")),
  rule("water", "labels.text.fill", color("#3d3d3d")),
];

/** «Night» (ejemplo de modo noche de la documentación de Google). */
const NIGHT: CnMapStyleRule[] = [
  rule(undefined, "geometry", color("#242f3e")),
  rule(undefined, "labels.text.stroke", color("#242f3e")),
  rule(undefined, "labels.text.fill", color("#746855")),
  rule("administrative.locality", "labels.text.fill", color("#d59563")),
  rule("poi", "labels.text.fill", color("#d59563")),
  rule("poi.park", "geometry", color("#263c3f")),
  rule("poi.park", "labels.text.fill", color("#6b9a76")),
  rule("road", "geometry", color("#38414e")),
  rule("road", "geometry.stroke", color("#212a37")),
  rule("road", "labels.text.fill", color("#9ca5b3")),
  rule("road.highway", "geometry", color("#746855")),
  rule("road.highway", "geometry.stroke", color("#1f2835")),
  rule("road.highway", "labels.text.fill", color("#f3d19c")),
  rule("transit", "geometry", color("#2f3948")),
  rule("transit.station", "labels.text.fill", color("#d59563")),
  rule("water", "geometry", color("#17263c")),
  rule("water", "labels.text.fill", color("#515c6d")),
  rule("water", "labels.text.stroke", color("#17263c")),
];

/** «Retro» del Styling Wizard. */
const RETRO: CnMapStyleRule[] = [
  rule(undefined, "geometry", color("#ebe3cd")),
  rule(undefined, "labels.text.fill", color("#523735")),
  rule(undefined, "labels.text.stroke", color("#f5f1e6")),
  rule("administrative", "geometry.stroke", color("#c9b2a6")),
  rule("administrative.land_parcel", "geometry.stroke", color("#dcd2be")),
  rule("administrative.land_parcel", "labels.text.fill", color("#ae9e90")),
  rule("landscape.natural", "geometry", color("#dfd2ae")),
  rule("poi", "geometry", color("#dfd2ae")),
  rule("poi", "labels.text.fill", color("#93817c")),
  rule("poi.park", "geometry.fill", color("#a5b076")),
  rule("poi.park", "labels.text.fill", color("#447530")),
  rule("road", "geometry", color("#f5f1e6")),
  rule("road.arterial", "geometry", color("#fdfcf8")),
  rule("road.highway", "geometry", color("#f8c967")),
  rule("road.highway", "geometry.stroke", color("#e9bc62")),
  rule("road.highway.controlled_access", "geometry", color("#e98d58")),
  rule("road.highway.controlled_access", "geometry.stroke", color("#db8555")),
  rule("road.local", "labels.text.fill", color("#806b63")),
  rule("transit.line", "geometry", color("#dfd2ae")),
  rule("transit.line", "labels.text.fill", color("#8f7d77")),
  rule("transit.line", "labels.text.stroke", color("#ebe3cd")),
  rule("transit.station", "geometry", color("#dfd2ae")),
  rule("water", "geometry.fill", color("#b9d3c2")),
  rule("water", "labels.text.fill", color("#92998d")),
];

/** Mapa base limpio: sin negocios, sin transporte, carreteras simplificadas. */
const MINIMAL: CnMapStyleRule[] = [
  rule("poi", undefined, off),
  rule("poi.park", "geometry", [{ visibility: "on" }]),
  rule("transit", undefined, off),
  rule("road", "labels.icon", off),
  rule("road.local", undefined, [{ visibility: "simplified" }]),
  rule("administrative.land_parcel", undefined, off),
  rule("administrative.neighborhood", undefined, off),
];

/** Paleta Canek (claro): neutrales fríos, agua y vías en tonos de marca. */
const CANEK: CnMapStyleRule[] = [
  rule(undefined, "geometry", color("#f4f5f7")),
  rule(undefined, "labels.text.fill", color("#4e5660")),
  rule(undefined, "labels.text.stroke", color("#ffffff")),
  rule("administrative", "geometry.stroke", color("#c5cad0")),
  rule("administrative.locality", "labels.text.fill", color("#254d87")),
  rule("administrative.land_parcel", undefined, off),
  rule("landscape.man_made", "geometry", color("#e9ecef")),
  rule("poi", "labels.icon", off),
  rule("poi", "geometry", color("#e9ecef")),
  rule("poi", "labels.text.fill", color("#6e7682")),
  rule("poi.business", undefined, off),
  rule("poi.park", "geometry", color("#dde8dc")),
  rule("road", "geometry", color("#ffffff")),
  rule("road", "geometry.stroke", color("#dde0e4")),
  rule("road", "labels.text.fill", color("#6e7682")),
  rule("road.arterial", "geometry", color("#fafbfc")),
  rule("road.highway", "geometry", color("#d4e0f4")),
  rule("road.highway", "geometry.stroke", color("#a8c0e8")),
  rule("road.highway", "labels.text.fill", color("#1c3d6d")),
  rule("transit.line", "geometry", color("#c5cad0")),
  rule("transit.station", "labels.text.fill", color("#3d5afe")),
  rule("water", "geometry", color("#a8c0e8")),
  rule("water", "labels.text.fill", color("#3562a6")),
];

/** Paleta Canek (oscuro), para `[data-cn-theme="dark"]`. */
const CANEK_DARK: CnMapStyleRule[] = [
  rule(undefined, "geometry", color("#111418")),
  rule(undefined, "labels.text.fill", color("#9aa1aa")),
  rule(undefined, "labels.text.stroke", color("#111418")),
  rule("administrative", "geometry.stroke", color("#363d45")),
  rule("administrative.locality", "labels.text.fill", color("#a8c0e8")),
  rule("administrative.land_parcel", undefined, off),
  rule("landscape.man_made", "geometry", color("#181c22")),
  rule("poi", "labels.icon", off),
  rule("poi", "geometry", color("#181c22")),
  rule("poi", "labels.text.fill", color("#6e7682")),
  rule("poi.business", undefined, off),
  rule("poi.park", "geometry", color("#16251d")),
  rule("road", "geometry", color("#222831")),
  rule("road", "geometry.stroke", color("#111418")),
  rule("road", "labels.text.fill", color("#9aa1aa")),
  rule("road.highway", "geometry", color("#1c3d6d")),
  rule("road.highway", "geometry.stroke", color("#142c50")),
  rule("road.highway", "labels.text.fill", color("#d4e0f4")),
  rule("transit.line", "geometry", color("#363d45")),
  rule("transit.station", "labels.text.fill", color("#8c9eff")),
  rule("water", "geometry", color("#0b1a33")),
  rule("water", "labels.text.fill", color("#5081c4")),
];

/** Presets incluidos (JSON listo para `styles`). `default` es el mapa de Google sin cambios. */
export const CN_MAP_STYLE_PRESETS: Record<CnMapStylePreset, CnMapStyleRule[]> = {
  default: [],
  silver: SILVER,
  dark: DARK,
  night: NIGHT,
  retro: RETRO,
  minimal: MINIMAL,
  canek: CANEK,
};

/** Variante oscura de cada preset (los oscuros se quedan igual). */
export const CN_MAP_DARK_PRESETS: Record<CnMapStylePreset, CnMapStyleRule[]> = {
  default: DARK,
  silver: DARK,
  dark: DARK,
  night: NIGHT,
  retro: RETRO,
  minimal: [...DARK, ...MINIMAL],
  canek: CANEK_DARK,
};

/** Estilos finales: `styles` explícitos ganan; si no, el preset (variante oscura si aplica). */
export const resolveMapStyles = ({
  styles,
  stylePreset = "default",
  dark = false,
}: {
  styles?: CnMapStyleRule[] | null;
  stylePreset?: CnMapStylePreset;
  dark?: boolean;
}): CnMapStyleRule[] | undefined => {
  if (styles) return styles;
  const preset = (dark ? CN_MAP_DARK_PRESETS : CN_MAP_STYLE_PRESETS)[stylePreset];
  return preset && preset.length ? preset : undefined;
};

/* --------------------------------------------------------------- URLs ---- */

/** Iframe embebido sin API key (`maps.google.com/maps?q=…&output=embed`). */
export const getEmbedMapUrl = ({
  center,
  query,
  zoom = 15,
}: {
  center?: CnLatLng | null;
  query?: string;
  zoom?: number;
}) => {
  const q = center ? `${center.lat},${center.lng}` : encodeURIComponent(query ?? "");
  return `https://maps.google.com/maps?q=${q}&z=${zoom}&output=embed`;
};

/** Enlace para abrir el punto (o la búsqueda) en Google Maps. */
export const getOpenInMapsUrl = ({ center, query }: { center?: CnLatLng | null; query?: string }) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    center ? `${center.lat},${center.lng}` : (query ?? ""),
  )}`;

const toStaticValue = (value: string | number | boolean) => {
  const text = String(value);
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text);
  if (!hex) return text;
  let digits = hex[1];
  if (digits.length === 3)
    digits = digits
      .split("")
      .map((c) => c + c)
      .join("");
  return `0x${digits.toLowerCase()}`;
};

/**
 * Convierte el JSON del Styling Wizard a valores del parámetro `style=` de la
 * Static API: `feature:road.local|element:geometry|color:0x00ff00`.
 * Cada styler queda como regla independiente y en el mismo orden.
 */
export const wizardStylesToStaticParams = (styles: CnMapStyleRule[] | null | undefined) =>
  (styles ?? [])
    .map((entry) => {
      const parts: string[] = [];
      if (entry.featureType && entry.featureType !== "all")
        parts.push(`feature:${entry.featureType}`);
      if (entry.elementType && entry.elementType !== "all")
        parts.push(`element:${entry.elementType}`);
      for (const styler of entry.stylers ?? []) {
        for (const [key, value] of Object.entries(styler)) {
          parts.push(`${key}:${toStaticValue(value)}`);
        }
      }
      return entry.stylers?.length ? parts.join("|") : "";
    })
    .filter(Boolean);

export type CnStaticMapMarker = {
  position: CnLatLng;
  /** Hex (`#254d87`) o tono de Canek. */
  color?: string;
  tone?: CnMapTone;
  /** Una letra o dígito (la Static API solo admite un carácter). */
  label?: string;
  size?: "tiny" | "mid" | "small";
};

export type CnStaticMapOptions = {
  apiKey: string;
  center?: CnLatLng;
  zoom?: number;
  /** `[ancho, alto]` en px o `"600x300"`. Máximo 640×640 por escala. */
  size?: [number, number] | string;
  /** 1 o 2 (alta densidad). */
  scale?: 1 | 2;
  mapType?: "roadmap" | "satellite" | "terrain" | "hybrid";
  format?: "png" | "png32" | "jpg" | "gif";
  markers?: CnStaticMapMarker[];
  /** JSON del Styling Wizard. */
  styles?: CnMapStyleRule[];
  stylePreset?: CnMapStylePreset;
  /** Estilo de nube (ignora `styles`). */
  mapId?: string;
  language?: string;
  region?: string;
};

/** Límite de longitud de URL de la Static API. */
export const STATIC_MAP_URL_LIMIT = 16384;

/**
 * URL de Maps Static API (imagen PNG) con los mismos estilos del wizard.
 * Útil para impresión, PDF o export a PNG.
 */
export const getStaticMapUrl = ({
  apiKey,
  center,
  zoom,
  size = [600, 300],
  scale = 2,
  mapType,
  format,
  markers = [],
  styles,
  stylePreset,
  mapId,
  language,
  region,
}: CnStaticMapOptions): string => {
  const params: string[] = [];
  const add = (key: string, value: string) =>
    params.push(`${key}=${encodeURIComponent(value).replace(/%2C/g, ",").replace(/%3A/g, ":")}`);
  if (center) add("center", `${center.lat},${center.lng}`);
  if (zoom !== undefined) add("zoom", String(zoom));
  add("size", Array.isArray(size) ? `${size[0]}x${size[1]}` : size);
  if (scale !== 1) add("scale", String(scale));
  if (mapType) add("maptype", mapType);
  if (format) add("format", format);
  if (language) add("language", language);
  if (region) add("region", region);
  for (const marker of markers) {
    const parts: string[] = [];
    if (marker.size) parts.push(`size:${marker.size}`);
    const hex = marker.color ?? (marker.tone ? MAP_TONE_COLORS[marker.tone] : undefined);
    if (hex) parts.push(`color:${toStaticValue(hex)}`);
    const label = marker.label?.trim().charAt(0).toUpperCase();
    if (label && /[A-Z0-9]/.test(label)) parts.push(`label:${label}`);
    parts.push(`${marker.position.lat},${marker.position.lng}`);
    add("markers", parts.join("|"));
  }
  if (mapId) {
    add("map_id", mapId);
  } else {
    for (const style of wizardStylesToStaticParams(resolveMapStyles({ styles, stylePreset }))) {
      add("style", style);
    }
  }
  add("key", apiKey);
  const url = `https://maps.googleapis.com/maps/api/staticmap?${params.join("&")}`;
  if (url.length > STATIC_MAP_URL_LIMIT && typeof console !== "undefined") {
    console.warn(
      `[CnMap] La URL estática mide ${url.length} caracteres (límite ${STATIC_MAP_URL_LIMIT}).`,
    );
  }
  return url;
};
