import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlaceIcon from "@mui/icons-material/Place";
import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CnMapSkeleton } from "./CnMapSkeleton";
import { useMaps } from "./CnMapsProvider";
import type {
  CnLatLng,
  CnMapStyleRule,
  GAdvancedMarker,
  GClassicMarker,
  GInfoWindow,
  GLatLng,
  GListener,
  GMap,
  GoogleMapsNamespace,
} from "./google-maps-types";
import type { CnMapStylePreset, CnMapTone } from "./map-styles";
import { getEmbedMapUrl, getOpenInMapsUrl, MAP_TONE_COLORS, resolveMapStyles } from "./map-styles";

export type CnMapMarker = {
  id: string | number;
  position: CnLatLng;
  /** Texto del tooltip nativo y de la lista accesible. */
  title?: string;
  /** Texto corto dentro del pin (1–2 caracteres). */
  label?: string;
  /** Color hex del pin; gana sobre `tone`. */
  color?: string;
  /** Tono de Canek. Por defecto `brand`. */
  tone?: CnMapTone;
  /** URL de una imagen propia para el marcador. */
  icon?: string;
  onClick?: (marker: CnMapMarker) => void;
  /** Contenido de la ventana de información al seleccionar el marcador. */
  info?: ReactNode;
};

export type CnMapControls = {
  zoom?: boolean;
  fullscreen?: boolean;
  mapType?: boolean;
  streetView?: boolean;
  rotate?: boolean;
  scale?: boolean;
};

export type CnMapProps = {
  /** Centro del mapa. Si falta, se usa el primer marcador. */
  center?: CnLatLng | null;
  /** Zoom (1–21). Por defecto 15. */
  zoom?: number;
  markers?: CnMapMarker[];
  /** Ajusta la vista a todos los marcadores (cuando hay más de uno). Por defecto `true`. */
  fitBounds?: boolean;
  /** Búsqueda de texto (dirección). Sin coordenadas siempre usa el iframe embebido. */
  query?: string;
  /** Alto del lienzo. Por defecto 320. */
  height?: number | string;
  /** Nombre accesible del mapa (y `title` del iframe). Por defecto "Mapa". */
  title?: string;
  /** `false` oculta todos los controles; un objeto los activa uno a uno. */
  controls?: boolean | CnMapControls;
  /** Gestos de desplazamiento. Por defecto `cooperative`. */
  gestureHandling?: "cooperative" | "greedy" | "none" | "auto";
  /** Clic en el mapa (solo con API key). */
  onClick?: (position: CnLatLng) => void;
  /** Modo selector: un único marcador arrastrable en `center`. */
  picker?: boolean;
  /** Fin de arrastre del marcador del selector. */
  onMarkerDrag?: (position: CnLatLng) => void;
  /** Tono del marcador del selector. Por defecto `error` (rojo, como Google). */
  pickerTone?: CnMapTone;
  /** JSON exportado tal cual del Styling Wizard (mapstyle.withgoogle.com). */
  styles?: CnMapStyleRule[];
  /** Estilo de nube de Google; gana sobre `styles` y `stylePreset`. */
  mapId?: string;
  /** Preset incluido. Por defecto el `defaultStyle` del proveedor o `default`. */
  stylePreset?: CnMapStylePreset;
  /** `auto` sigue `[data-cn-theme="dark"]`. Por defecto `auto`. */
  theme?: "auto" | "light" | "dark";
  /** API key propia (si no, la del `CnMapsProvider`). */
  apiKey?: string;
  /** Muestra el skeleton en lugar del mapa. */
  skeleton?: boolean;
  /** Borde del marco. Por defecto `true`. */
  framed?: boolean;
  /** Radio del marco. Por defecto 12 px. */
  radius?: number | string;
  /** Enlace "Abrir en Google Maps" bajo el mapa embebido. Por defecto `true`. */
  showOpenLink?: boolean;
  /** Lista de marcadores accesible: `auto` (oculta hasta enfocar; visible en el iframe con 2+). */
  markerList?: "auto" | "visible" | "hidden";
  /** Texto cuando no hay nada que mostrar. */
  emptyText?: ReactNode;
  /** Opciones extra para `google.maps.Map` (escape hatch). */
  mapOptions?: Record<string, unknown>;
  /** Se llama cuando el mapa interactivo está listo. */
  onLoad?: (map: GMap, google: GoogleMapsNamespace) => void;
  sx?: SxProps<Theme>;
  className?: string;
};

/** Centro por defecto del selector sin valor (Zócalo, CDMX). */
export const CN_MAP_DEFAULT_CENTER: CnLatLng = { lat: 19.432608, lng: -99.133209 };

const DEFAULT_CONTROLS: Required<CnMapControls> = {
  zoom: true,
  fullscreen: true,
  mapType: false,
  streetView: false,
  rotate: false,
  scale: false,
};

const PICKER_ID = "__cn-map-picker__";

const isLatLng = (value: unknown): value is CnLatLng =>
  Boolean(value) &&
  Number.isFinite((value as CnLatLng).lat) &&
  Number.isFinite((value as CnLatLng).lng);

const toLiteral = (value: GLatLng | CnLatLng | null | undefined): CnLatLng | null => {
  if (!value) return null;
  if (typeof (value as GLatLng).lat === "function") {
    const v = value as GLatLng;
    return { lat: v.lat(), lng: v.lng() };
  }
  return isLatLng(value) ? { lat: value.lat, lng: value.lng } : null;
};

/** Pin SVG para marcadores clásicos (sin `mapId`). */
export const getPinSvgUrl = (hex: string, withDot = true) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 1C6.8 1 1 6.8 1 14c0 9.8 13 25 13 25s13-15.2 13-25C27 6.8 21.2 1 14 1z" fill="${hex}" stroke="#ffffff" stroke-width="1.5"/>${
      withDot ? '<circle cx="14" cy="14" r="4.5" fill="#ffffff"/>' : ""
    }</svg>`,
  )}`;

/** Sigue `[data-cn-theme="dark"]` en `<html>`. */
const useCanekDark = (theme: "auto" | "light" | "dark") => {
  const read = () =>
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-cn-theme") === "dark";
  const [dark, setDark] = useState(read);
  useEffect(() => {
    if (theme !== "auto" || typeof MutationObserver === "undefined") return;
    setDark(read());
    const observer = new MutationObserver(() => setDark(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-cn-theme"],
    });
    return () => observer.disconnect();
  }, [theme]);
  return theme === "auto" ? dark : theme === "dark";
};

type MarkerHandle = {
  instance: GClassicMarker | GAdvancedMarker;
  listeners: GListener[];
  remove: () => void;
};

const createMarker = (
  g: GoogleMapsNamespace,
  map: GMap,
  marker: CnMapMarker,
  draggable: boolean,
  advanced: boolean,
): MarkerHandle => {
  const hex = marker.color ?? MAP_TONE_COLORS[marker.tone ?? "brand"];
  if (advanced && g.marker) {
    let content: HTMLElement | undefined;
    if (marker.icon) {
      const img = document.createElement("img");
      img.src = marker.icon;
      img.alt = "";
      img.style.width = "32px";
      content = img;
    } else {
      const pin = new g.marker.PinElement({
        background: hex,
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        glyph: marker.label || undefined,
      });
      content = (pin.element ?? pin) as HTMLElement;
    }
    const instance = new g.marker.AdvancedMarkerElement({
      map,
      position: marker.position,
      title: marker.title ?? "",
      content,
      gmpDraggable: draggable,
    });
    return {
      instance,
      listeners: [],
      remove: () => {
        instance.map = null;
      },
    };
  }
  const instance = new g.Marker({
    map,
    position: marker.position,
    title: marker.title,
    draggable,
    label: marker.label
      ? { text: marker.label, color: "#ffffff", fontSize: "11px", fontWeight: "700" }
      : undefined,
    icon: marker.icon
      ? marker.icon
      : {
          url: getPinSvgUrl(hex, !marker.label),
          scaledSize: new g.Size(28, 40),
          anchor: new g.Point(14, 40),
          labelOrigin: new g.Point(14, 14),
        },
  });
  return { instance, listeners: [], remove: () => instance.setMap(null) };
};

const markerPosition = (instance: GClassicMarker | GAdvancedMarker): CnLatLng | null =>
  "getPosition" in instance && typeof instance.getPosition === "function"
    ? toLiteral(instance.getPosition())
    : toLiteral((instance as GAdvancedMarker).position);

const srOnlyUntilFocus = {
  position: "absolute",
  top: 8,
  left: 8,
  zIndex: 2,
  "&:not(:focus-within)": {
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
} as const;

/**
 * Mapa de Google con estilos (JSON del Styling Wizard, presets o `mapId`),
 * marcadores con ventana de información y modo selector.
 * Sin API key cae al iframe embebido de siempre.
 */
export const CnMap = ({
  center,
  zoom = 15,
  markers = [],
  fitBounds = true,
  query,
  height = 320,
  title = "Mapa",
  controls = true,
  gestureHandling = "cooperative",
  onClick,
  picker = false,
  onMarkerDrag,
  pickerTone = "error",
  styles,
  mapId: mapIdProp,
  stylePreset,
  theme = "auto",
  apiKey: apiKeyProp,
  skeleton = false,
  framed = true,
  radius = 12,
  showOpenLink = true,
  markerList = "auto",
  emptyText = "Sin ubicación para mostrar",
  mapOptions,
  onLoad,
  sx,
  className,
}: CnMapProps) => {
  const maps = useMaps();
  const apiKey = apiKeyProp || maps.apiKey;
  const mapId = mapIdProp || maps.mapId;
  const dark = useCanekDark(theme);
  const preset = stylePreset ?? maps.defaultStyle ?? "default";

  const validCenter = isLatLng(center) ? center : null;
  const pickerMarker: CnMapMarker | null =
    picker && validCenter
      ? { id: PICKER_ID, position: validCenter, tone: pickerTone, title }
      : null;
  const allMarkers = useMemo(
    () => (pickerMarker ? [pickerMarker] : markers.filter((m) => isLatLng(m.position))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [picker, validCenter?.lat, validCenter?.lng, pickerTone, title, markers],
  );
  const effectiveCenter =
    validCenter ?? allMarkers[0]?.position ?? (picker ? CN_MAP_DEFAULT_CENTER : null);
  const interactive = Boolean(apiKey) && Boolean(effectiveCenter);

  const resolvedStyles = useMemo(
    () => (mapId ? undefined : resolveMapStyles({ styles, stylePreset: preset, dark })),
    [mapId, styles, preset, dark],
  );
  const stylesRequested = Boolean(styles?.length || mapId || preset !== "default");
  const controlFlags: Required<CnMapControls> =
    controls === false
      ? {
          zoom: false,
          fullscreen: false,
          mapType: false,
          streetView: false,
          rotate: false,
          scale: false,
        }
      : { ...DEFAULT_CONTROLS, ...(controls === true ? {} : controls) };

  // ---------------------------------------------------------- interactivo --
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GMap | null>(null);
  const googleRef = useRef<GoogleMapsNamespace | null>(null);
  const markerHandles = useRef(new Map<string | number, MarkerHandle>());
  const infoWindowRef = useRef<GInfoWindow | null>(null);
  const [infoNode] = useState(() =>
    typeof document === "undefined" ? null : document.createElement("div"),
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tilesReady, setTilesReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [openInfoId, setOpenInfoId] = useState<string | number | null>(null);
  const [embedSelected, setEmbedSelected] = useState<string | number | null>(null);

  const handlers = useRef({ onClick, onMarkerDrag, markers: allMarkers, onLoad });
  handlers.current = { onClick, onMarkerDrag, markers: allMarkers, onLoad };

  // Valores iniciales para crear el mapa (los cambios se aplican en otros efectos).
  const initial = useRef({ effectiveCenter, zoom, resolvedStyles, controlFlags, gestureHandling });
  initial.current = { effectiveCenter, zoom, resolvedStyles, controlFlags, gestureHandling };
  const colorScheme = mapId ? (dark ? "DARK" : "LIGHT") : "";

  useEffect(() => {
    if (!interactive || !apiKey) return;
    let cancelled = false;
    let tilesTimer: number | undefined;
    const listeners: GListener[] = [];
    const handles = markerHandles.current;
    setStatus("loading");
    setTilesReady(false);
    setErrorMessage(null);
    maps.load(apiKey).then(
      (g) => {
        if (cancelled || !containerRef.current) return;
        const init = initial.current;
        const map = new g.Map(containerRef.current, {
          center: init.effectiveCenter,
          zoom: init.zoom,
          ...(mapId ? { mapId, colorScheme } : { styles: init.resolvedStyles ?? null }),
          zoomControl: init.controlFlags.zoom,
          fullscreenControl: init.controlFlags.fullscreen,
          mapTypeControl: init.controlFlags.mapType,
          streetViewControl: init.controlFlags.streetView,
          rotateControl: init.controlFlags.rotate,
          scaleControl: init.controlFlags.scale,
          gestureHandling: init.gestureHandling,
          clickableIcons: false,
          ...mapOptions,
        });
        googleRef.current = g;
        mapRef.current = map;
        listeners.push(
          map.addListener("click", (event) => {
            const point = toLiteral(event.latLng);
            if (point) handlers.current.onClick?.(point);
          }),
        );
        listeners.push(g.event.addListenerOnce(map, "tilesloaded", () => setTilesReady(true)));
        // Si el contenedor está oculto Google no emite `tilesloaded`: no bloquear el mapa.
        tilesTimer = window.setTimeout(() => setTilesReady(true), 6000);
        setStatus("ready");
        handlers.current.onLoad?.(map, g);
      },
      (error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar el mapa");
      },
    );
    return () => {
      cancelled = true;
      window.clearTimeout(tilesTimer);
      listeners.forEach((listener) => listener.remove());
      handles.forEach((handle) => {
        handle.listeners.forEach((listener) => listener.remove());
        handle.remove();
      });
      handles.clear();
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      if (mapRef.current) googleRef.current?.event.clearInstanceListeners?.(mapRef.current);
      mapRef.current = null;
    };
    // Recrea el mapa solo si cambia lo que Google fija al instanciar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, apiKey, mapId, colorScheme, attempt]);

  // Estilos, controles y gestos.
  const stylesKey = JSON.stringify(resolvedStyles ?? null);
  const controlsKey = JSON.stringify(controlFlags);
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) return;
    map.setOptions({
      ...(mapId ? {} : { styles: resolvedStyles ?? null }),
      zoomControl: controlFlags.zoom,
      fullscreenControl: controlFlags.fullscreen,
      mapTypeControl: controlFlags.mapType,
      streetViewControl: controlFlags.streetView,
      rotateControl: controlFlags.rotate,
      scaleControl: controlFlags.scale,
      gestureHandling,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stylesKey, controlsKey, gestureHandling, mapId]);

  // Centro y zoom.
  const centerKey = effectiveCenter ? `${effectiveCenter.lat},${effectiveCenter.lng}` : "";
  const shouldFit = fitBounds && !picker && allMarkers.length > 1;
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map || !effectiveCenter || (shouldFit && !validCenter)) return;
    map.panTo(effectiveCenter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, centerKey]);
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map || shouldFit) return;
    if (map.getZoom() !== zoom) map.setZoom(zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, zoom]);

  // Marcadores.
  const markersKey = JSON.stringify(
    allMarkers.map((m) => [
      m.id,
      m.position.lat,
      m.position.lng,
      m.title,
      m.label,
      m.color,
      m.tone,
      m.icon,
    ]),
  );
  useEffect(() => {
    const map = mapRef.current;
    const g = googleRef.current;
    if (status !== "ready" || !map || !g) return;
    const handles = markerHandles.current;
    handles.forEach((handle) => {
      handle.listeners.forEach((listener) => listener.remove());
      handle.remove();
    });
    handles.clear();
    const advanced = Boolean(mapId && g.marker);
    for (const marker of allMarkers) {
      const isPicker = marker.id === PICKER_ID;
      const handle = createMarker(g, map, marker, isPicker, advanced);
      handle.listeners.push(
        handle.instance.addListener("click", () => {
          const current = handlers.current.markers.find((m) => m.id === marker.id);
          if (!current) return;
          current.onClick?.(current);
          if (current.info) setOpenInfoId(current.id);
        }),
      );
      if (isPicker) {
        handle.listeners.push(
          handle.instance.addListener("dragend", (event) => {
            const point = toLiteral(event?.latLng) ?? markerPosition(handle.instance);
            if (point) handlers.current.onMarkerDrag?.(point);
          }),
        );
      }
      handles.set(marker.id, handle);
    }
    if (shouldFit) {
      const bounds = new g.LatLngBounds();
      allMarkers.forEach((m) => bounds.extend(m.position));
      map.fitBounds(bounds, 48);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, markersKey, mapId, shouldFit]);

  // Ventana de información (contenido React vía portal).
  const openMarker = allMarkers.find((m) => m.id === openInfoId && m.info);
  useEffect(() => {
    const map = mapRef.current;
    const g = googleRef.current;
    if (status !== "ready" || !map || !g || !infoNode) return;
    const handle = openMarker ? markerHandles.current.get(openMarker.id) : undefined;
    if (!openMarker || !handle) {
      infoWindowRef.current?.close();
      return;
    }
    if (!infoWindowRef.current) {
      infoWindowRef.current = new g.InfoWindow({ maxWidth: 320 });
      infoWindowRef.current.addListener("closeclick", () => setOpenInfoId(null));
    }
    infoWindowRef.current.setContent(infoNode);
    infoWindowRef.current.open({ map, anchor: handle.instance });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, openMarker?.id, markersKey]);

  const focusMarker = (marker: CnMapMarker) => {
    const map = mapRef.current;
    if (map) map.panTo(marker.position);
    marker.onClick?.(marker);
    if (marker.info) setOpenInfoId(marker.id);
  };

  if (skeleton) {
    return (
      <CnMapSkeleton
        height={height}
        framed={framed}
        controls={controls !== false}
        pins={Math.min(3, Math.max(1, markers.length))}
        sx={sx}
        className={className}
      />
    );
  }

  const frameSx = {
    position: "relative",
    height,
    overflow: "hidden",
    borderRadius: typeof radius === "number" ? `${radius}px` : radius,
    border: framed ? "1px solid var(--cn-color-border, #dde0e4)" : 0,
    backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
  } as const;

  const listMarkers = allMarkers.filter((m) => m.id !== PICKER_ID);
  const renderList = (mode: "overlay" | "inline", onSelect: (m: CnMapMarker) => void) => (
    <Box
      component="ul"
      aria-label="Marcadores del mapa"
      data-cn-map-markers
      sx={[
        {
          listStyle: "none",
          m: 0,
          p: "4px",
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
        },
        mode === "overlay"
          ? {
              ...srOnlyUntilFocus,
              maxWidth: "calc(100% - 16px)",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(17, 20, 24, 0.18)",
            }
          : { mt: "6px", p: 0 },
      ]}
    >
      {listMarkers.map((m, index) => {
        const selected = mode === "inline" && embedSelected === m.id;
        return (
          <li key={m.id}>
            <Button
              size="small"
              variant={selected ? "contained" : "outlined"}
              onClick={() => onSelect(m)}
              aria-pressed={mode === "inline" ? selected : undefined}
              startIcon={
                <PlaceIcon
                  sx={{
                    color: selected ? undefined : (m.color ?? MAP_TONE_COLORS[m.tone ?? "brand"]),
                  }}
                />
              }
              sx={{ textTransform: "none", fontWeight: 600, fontSize: 12, py: "2px" }}
            >
              {m.title ?? m.label ?? `Marcador ${index + 1}`}
            </Button>
          </li>
        );
      })}
    </Box>
  );

  // ------------------------------------------------------------ embebido --
  if (!interactive) {
    const selectedMarker = listMarkers.find((m) => m.id === embedSelected);
    const embedCenter = selectedMarker?.position ?? effectiveCenter;
    const openUrl = getOpenInMapsUrl({ center: embedCenter, query });
    const hasContent = Boolean(embedCenter || query?.trim());
    const showList = markerList === "visible" || (markerList === "auto" && listMarkers.length > 1);
    return (
      <Box data-cn-map data-cn-map-mode="embed" className={className} sx={mergeRootSx(sx)}>
        <Box sx={frameSx}>
          {hasContent ? (
            <Box
              component="iframe"
              title={title}
              src={getEmbedMapUrl({ center: embedCenter, query, zoom })}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sx={{ width: "100%", height: "100%", border: 0, display: "block" }}
            />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                color: "var(--cn-color-text-subtle, #9aa1aa)",
                fontSize: 12,
                textAlign: "center",
                px: 2,
              }}
            >
              <LocationOnIcon />
              {emptyText}
            </Box>
          )}
        </Box>
        {showList &&
          renderList("inline", (m) => {
            setEmbedSelected(m.id);
            m.onClick?.(m);
          })}
        {selectedMarker?.info && (
          <Box
            data-cn-map-info
            sx={{
              mt: "6px",
              p: "8px 10px",
              borderRadius: "8px",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              fontSize: 13,
            }}
          >
            {selectedMarker.info}
          </Box>
        )}
        {((showOpenLink && hasContent) || stylesRequested) && (
          <Box
            sx={{
              mt: "6px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "4px 12px",
              fontSize: 12,
            }}
          >
            {showOpenLink && hasContent && (
              <Link
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: 12 }}
              >
                Abrir en Google Maps
                <OpenInNewIcon sx={{ fontSize: 14 }} />
              </Link>
            )}
            {stylesRequested && (
              <Box
                component="span"
                data-cn-map-style-note
                sx={{ color: "var(--cn-color-text-muted, #6e7682)", fontSize: 11 }}
              >
                Los estilos del mapa requieren una API key de Google Maps.
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  }

  // --------------------------------------------------------- interactivo --
  return (
    <Box
      data-cn-map
      data-cn-map-mode="interactive"
      role="region"
      aria-label={title}
      aria-busy={status === "loading" || undefined}
      className={className}
      sx={mergeRootSx(sx)}
    >
      <Box sx={frameSx}>
        <Box ref={containerRef} data-cn-map-canvas sx={{ position: "absolute", inset: 0 }} />
        {status !== "error" && !tilesReady && (
          <Box sx={{ position: "absolute", inset: 0, zIndex: 1 }}>
            <CnMapSkeleton
              height="100%"
              framed={false}
              controls={controls !== false}
              pins={Math.min(3, Math.max(1, allMarkers.length))}
            />
          </Box>
        )}
        {status === "error" && (
          <Box
            role="alert"
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              p: 2,
              textAlign: "center",
              fontSize: 13,
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            <ErrorOutlineIcon sx={{ color: "var(--cn-color-error-500, #d32f2f)" }} />
            <span>{errorMessage ?? "No se pudo cargar el mapa"}</span>
            <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setAttempt((n) => n + 1)}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Reintentar
              </Button>
              <Button
                size="small"
                href={getOpenInMapsUrl({ center: effectiveCenter })}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon />}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Abrir en Google Maps
              </Button>
            </Box>
          </Box>
        )}
        {markerList !== "hidden" &&
          markerList !== "visible" &&
          status === "ready" &&
          listMarkers.length > 0 &&
          renderList("overlay", focusMarker)}
      </Box>
      {markerList === "visible" && listMarkers.length > 0 && renderList("inline", focusMarker)}
      {infoNode && openMarker?.info ? createPortal(openMarker.info, infoNode) : null}
    </Box>
  );
};

const mergeRootSx = (sx?: SxProps<Theme>): SxProps<Theme> => [
  { minWidth: 0, width: "100%" },
  ...(Array.isArray(sx) ? sx : [sx]),
];
