import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import type { GoogleMapsNamespace } from "./google-maps-types";
import { loadGoogleMaps } from "./loader";
import type { CnMapStylePreset } from "./map-styles";

export type CnMapsProviderProps = {
  /** API key de Google Maps (restringida por referrer). Sin key se usa el iframe embebido. */
  apiKey?: string;
  /** Map ID por defecto (estilo de nube). */
  mapId?: string;
  /** Idioma de controles y etiquetas. Por defecto `es`. */
  language?: string;
  /** Región (sesgo de resultados y fronteras). Por defecto `MX`. */
  region?: string;
  /** Bibliotecas extra (`places`, `geometry`…). `maps`, `marker` y `core` siempre se cargan. */
  libraries?: string[];
  /** Preset por defecto de los `CnMap` sin `styles` ni `stylePreset`. */
  defaultStyle?: CnMapStylePreset;
  /** Canal de la API. Por defecto `weekly`. */
  version?: string;
  /** Nonce para CSP estrictas. */
  nonce?: string;
  /** `origin` reduce el referrer enviado a Google. */
  authReferrerPolicy?: "origin";
  /** Tiempo máximo de carga en ms. Por defecto 20 000. */
  timeoutMs?: number;
  children?: ReactNode;
};

export type CnMapsContextValue = {
  apiKey?: string;
  mapId?: string;
  language: string;
  region: string;
  defaultStyle?: CnMapStylePreset;
  /** `true` cuando hay key y el mapa interactivo puede cargarse. */
  enabled: boolean;
  /** Carga la API (una sola vez por página). */
  load: (apiKeyOverride?: string) => Promise<GoogleMapsNamespace>;
};

const noKey = () => Promise.reject(new Error("Falta la API key de Google Maps"));

const DEFAULT_CONTEXT: CnMapsContextValue = {
  language: "es",
  region: "MX",
  enabled: false,
  load: (apiKey) => (apiKey ? loadGoogleMaps({ apiKey, language: "es", region: "MX" }) : noKey()),
};

const CnMapsContext = createContext<CnMapsContextValue>(DEFAULT_CONTEXT);

/** Configuración compartida de Google Maps. La API se carga bajo demanda, al montar el primer mapa. */
export const CnMapsProvider = ({
  apiKey,
  mapId,
  language = "es",
  region = "MX",
  libraries,
  defaultStyle,
  version,
  nonce,
  authReferrerPolicy,
  timeoutMs,
  children,
}: CnMapsProviderProps) => {
  const librariesKey = (libraries ?? []).join(",");
  const load = useCallback(
    (apiKeyOverride?: string) => {
      const key = apiKeyOverride || apiKey;
      if (!key) return noKey();
      return loadGoogleMaps({
        apiKey: key,
        language,
        region,
        libraries: librariesKey ? librariesKey.split(",") : undefined,
        mapIds: mapId ? [mapId] : undefined,
        version,
        nonce,
        authReferrerPolicy,
        timeoutMs,
      });
    },
    [apiKey, language, region, librariesKey, mapId, version, nonce, authReferrerPolicy, timeoutMs],
  );
  const value = useMemo<CnMapsContextValue>(
    () => ({
      apiKey: apiKey || undefined,
      mapId: mapId || undefined,
      language,
      region,
      defaultStyle,
      enabled: Boolean(apiKey),
      load,
    }),
    [apiKey, mapId, language, region, defaultStyle, load],
  );
  return <CnMapsContext.Provider value={value}>{children}</CnMapsContext.Provider>;
};

/** Configuración de mapas más cercana (sin proveedor: sin key, iframe embebido). */
export const useMaps = () => useContext(CnMapsContext);
