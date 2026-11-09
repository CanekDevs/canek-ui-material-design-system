import type { GoogleMapsNamespace } from "./google-maps-types";

/*
 * Carga única de la Maps JavaScript API.
 *
 * Replica el mecanismo del «dynamic library import» oficial: un <script> a
 * `maps.googleapis.com/maps/api/js` con `loading=async` y
 * `callback=google.maps.__ib__`, de modo que lo único que se toca en `window`
 * es `google.maps` (igual que el bootstrap de Google). Después se piden las
 * bibliotecas con `google.maps.importLibrary()`.
 */

export type CnMapsLoaderOptions = {
  apiKey: string;
  /** Canal o versión (`weekly`, `quarterly`, `beta`, `3.58`…). Por defecto `weekly`. */
  version?: string;
  language?: string;
  region?: string;
  /** Bibliotecas extra a precargar (`places`, `geometry`…). */
  libraries?: string[];
  /** Precarga la configuración de estos map IDs. */
  mapIds?: string[];
  /** `origin` reduce el referrer que se envía a Google. */
  authReferrerPolicy?: "origin";
  /** Nonce para CSP estrictas. */
  nonce?: string;
  /** Tiempo máximo de carga en ms. Por defecto 20 000. */
  timeoutMs?: number;
};

const SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";
const SCRIPT_ATTR = "data-cn-google-maps";

type GoogleWindow = Window & {
  google?: { maps?: Partial<GoogleMapsNamespace> & { __ib__?: () => void } };
};

let pending: Promise<GoogleMapsNamespace> | null = null;
let loadedWith: string | null = null;

const getWindow = () => (typeof window === "undefined" ? null : (window as GoogleWindow));

/** `google.maps` si ya está cargada (por nosotros o por la app). */
export const getLoadedGoogleMaps = (): GoogleMapsNamespace | null => {
  const maps = getWindow()?.google?.maps;
  return maps && typeof maps.Map === "function" ? (maps as GoogleMapsNamespace) : null;
};

/** URL del script con los parámetros del bootstrap oficial. */
export const buildMapsScriptUrl = (options: CnMapsLoaderOptions): string => {
  const params = new URLSearchParams();
  params.set("key", options.apiKey);
  params.set("v", options.version ?? "weekly");
  if (options.language) params.set("language", options.language);
  if (options.region) params.set("region", options.region);
  if (options.libraries?.length) params.set("libraries", options.libraries.join(","));
  if (options.mapIds?.length) params.set("map_ids", options.mapIds.join(","));
  if (options.authReferrerPolicy) params.set("auth_referrer_policy", options.authReferrerPolicy);
  params.set("loading", "async");
  params.set("callback", "google.maps.__ib__");
  return `${SCRIPT_URL}?${params.toString()}`;
};

const importAll = async (maps: GoogleMapsNamespace, extra: string[] = []) => {
  if (typeof maps.importLibrary === "function") {
    const names = Array.from(new Set(["core", "maps", "marker", ...extra]));
    await Promise.all(names.map((name) => maps.importLibrary!(name)));
  }
  return maps;
};

/**
 * Carga la API una sola vez. Llamadas posteriores reutilizan la misma promesa.
 * Si falla (error de red o tiempo agotado) el script se retira y la siguiente
 * llamada vuelve a intentarlo.
 */
export const loadGoogleMaps = (options: CnMapsLoaderOptions): Promise<GoogleMapsNamespace> => {
  const win = getWindow();
  if (!win) return Promise.reject(new Error("Google Maps solo puede cargarse en el navegador"));
  if (!options.apiKey) return Promise.reject(new Error("Falta la API key de Google Maps"));

  const ready = getLoadedGoogleMaps();
  if (ready && !pending) {
    pending = importAll(ready, options.libraries);
    return pending;
  }
  if (pending) {
    const signature = buildMapsScriptUrl(options);
    if (loadedWith && loadedWith !== signature && typeof console !== "undefined") {
      console.warn(
        "[CnMap] La API de Google Maps ya se cargó con otras opciones; se ignoran las nuevas.",
      );
    }
    return pending;
  }

  const src = buildMapsScriptUrl(options);
  loadedWith = src;
  const timeoutMs = options.timeoutMs ?? 20000;

  pending = new Promise<GoogleMapsNamespace>((resolve, reject) => {
    const google = (win.google ??= {});
    const maps = (google.maps ??= {});
    const script = document.createElement("script");
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timer);
      delete maps.__ib__;
    };
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      script.remove();
      pending = null;
      loadedWith = null;
      reject(new Error(message));
    };
    const timer = window.setTimeout(
      () => fail("Se agotó el tiempo para cargar Google Maps"),
      timeoutMs,
    );

    maps.__ib__ = () => {
      if (settled) return;
      const loaded = getLoadedGoogleMaps();
      if (!loaded) {
        fail("Google Maps respondió sin la API esperada");
        return;
      }
      importAll(loaded, options.libraries).then(
        (value) => {
          settled = true;
          cleanup();
          resolve(value);
        },
        (error: unknown) =>
          fail(error instanceof Error ? error.message : "No se pudieron cargar las bibliotecas"),
      );
    };

    script.src = src;
    script.async = true;
    script.setAttribute(SCRIPT_ATTR, "");
    if (options.nonce) script.nonce = options.nonce;
    script.onerror = () => fail("No se pudo cargar Google Maps (revisa la red o la CSP)");
    document.head.appendChild(script);
  });
  return pending;
};

/** Solo para pruebas: olvida el estado del cargador. */
export const resetGoogleMapsLoader = () => {
  pending = null;
  loadedWith = null;
  document.querySelectorAll(`script[${SCRIPT_ATTR}]`).forEach((node) => node.remove());
};
