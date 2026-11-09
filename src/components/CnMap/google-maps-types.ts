/*
 * Tipos mínimos de la Maps JavaScript API que usa `CnMap`.
 * No dependemos de `@types/google.maps`: solo describimos lo que tocamos.
 */

export type CnLatLng = { lat: number; lng: number };

/** Regla de estilo tal como la exporta el Styling Wizard (`MapTypeStyle`). */
export type CnMapStyleRule = {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number | boolean>>;
};

export type GLatLng = { lat(): number; lng(): number };
export type GListener = { remove(): void };

export type GMapEvent = { latLng?: GLatLng | null };

export interface GMap {
  setOptions(options: Record<string, unknown>): void;
  setCenter(center: CnLatLng): void;
  panTo(center: CnLatLng): void;
  setZoom(zoom: number): void;
  getZoom(): number | undefined;
  fitBounds(bounds: unknown, padding?: number): void;
  addListener(event: string, handler: (event: GMapEvent) => void): GListener;
}

export interface GMarkerLike {
  addListener(event: string, handler: (event: GMapEvent) => void): GListener;
}

export interface GClassicMarker extends GMarkerLike {
  setMap(map: GMap | null): void;
  setPosition(position: CnLatLng): void;
  setDraggable?(draggable: boolean): void;
  getPosition(): GLatLng | null | undefined;
}

export interface GAdvancedMarker extends GMarkerLike {
  map: GMap | null;
  position: CnLatLng | GLatLng | null;
  gmpDraggable?: boolean;
}

export interface GInfoWindow {
  setContent(content: Node | string): void;
  open(options: { map: GMap; anchor?: unknown }): void;
  close(): void;
  addListener(event: string, handler: () => void): GListener;
}

export interface GLatLngBounds {
  extend(point: CnLatLng): void;
}

type Ctor<T> = new (...args: never[]) => T;

/** Subconjunto de `google.maps` que usamos. */
export interface GoogleMapsNamespace {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GMap;
  Marker: new (options: Record<string, unknown>) => GClassicMarker;
  InfoWindow: new (options?: Record<string, unknown>) => GInfoWindow;
  LatLngBounds: Ctor<GLatLngBounds>;
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  event: {
    addListenerOnce(instance: unknown, event: string, handler: () => void): GListener;
    clearInstanceListeners?(instance: unknown): void;
  };
  marker?: {
    AdvancedMarkerElement: new (options: Record<string, unknown>) => GAdvancedMarker;
    PinElement: new (options: Record<string, unknown>) => { element?: HTMLElement } & object;
  };
  importLibrary?: (name: string) => Promise<unknown>;
}
