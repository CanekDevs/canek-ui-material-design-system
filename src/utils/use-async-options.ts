import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CnFieldOption, CnFormOptionsPage } from "../components/CnForm/CnForm.types";
import { LruCache } from "./lru-cache";
import { optionValueKey } from "./option-filter";

export type CnLoadOptionsContext = {
  /** Texto buscado (vacío al abrir o cuando el campo no es de búsqueda). */
  input: string;
  /** Se aborta cuando llega una búsqueda más nueva o el campo se desmonta. */
  signal: AbortSignal;
  /** Página solicitada (empieza en 0). Los loaders que devuelven un arreglo la ignoran. */
  page: number;
  /** Tamaño de página sugerido. */
  pageSize: number;
};

/** Página de opciones: `hasMore` indica si hay más resultados; `total` es opcional. */
export type CnOptionsPage = CnFormOptionsPage;

/** Un loader puede devolver todas las opciones (arreglo) o una página. */
export type CnLoadOptionsResult = readonly CnFieldOption[] | CnOptionsPage;

export type CnLoadOptions = (ctx: CnLoadOptionsContext) => Promise<CnLoadOptionsResult>;

/** Resuelve las opciones de valores que no están en la página cargada (formularios de edición). */
export type CnResolveOptions = (
  values: Array<string | number>,
  ctx: { signal: AbortSignal },
) => Promise<readonly CnFieldOption[]>;

export const isOptionsPage = (result: unknown): result is CnOptionsPage =>
  Boolean(result) &&
  typeof result === "object" &&
  !Array.isArray(result) &&
  Array.isArray((result as CnOptionsPage).options);

/** Normaliza la respuesta de un loader (arreglo o página). */
export const toOptionsPage = (
  result: CnLoadOptionsResult | null | undefined,
): CnOptionsPage & { paginated: boolean } => {
  if (isOptionsPage(result)) {
    return {
      options: result.options ?? [],
      hasMore: Boolean(result.hasMore),
      total: result.total,
      paginated: true,
    };
  }
  const options = (result ?? []) as readonly CnFieldOption[];
  return { options, hasMore: false, total: undefined, paginated: false };
};

export type UseAsyncOptionsParams = {
  loadOptions?: CnLoadOptions;
  /** Valores que, al cambiar, vuelven a cargar las opciones (p. ej. el padre de un select en cascada). */
  deps?: readonly unknown[];
  /** Texto de búsqueda actual (solo autocomplete). */
  input?: string;
  debounceMs?: number;
  /** No busca hasta escribir N caracteres (0 = carga al montar). */
  minSearchLength?: number;
  /** No carga (p. ej. dependencias incompletas). */
  disabled?: boolean;
  /** Tamaño de página para loaders paginados. Por defecto 50. */
  pageSize?: number;
  /**
   * Comparte la caché entre campos con la misma clave (p. ej. `"clientes"`).
   * Cambiarla invalida lo cargado. Ver `clearOptionsCache`.
   */
  cacheKey?: string;
  /** Búsquedas distintas que se recuerdan (LRU). Por defecto 30. */
  cacheSize?: number;
};

export type UseAsyncOptionsReturn = {
  options: readonly CnFieldOption[];
  /** Cargando la primera página de la búsqueda actual. */
  loading: boolean;
  error: string | null;
  /** Fuerza una recarga (vacía la caché de este campo). */
  reload: () => void;
  /** El loader devolvió páginas (`{ options, hasMore }`). */
  paginated: boolean;
  /** Hay más páginas por cargar. */
  hasMore: boolean;
  /** Total informado por el servidor (si lo envía). */
  total?: number;
  /** Cargando la siguiente página. */
  loadingMore: boolean;
  /** Error al cargar la siguiente página. */
  loadMoreError: string | null;
  /** Pide la siguiente página (no hace nada si no hay más o ya se está cargando). */
  loadMore: () => void;
  /** Reintenta lo que falló (primera página o la siguiente). */
  retry: () => void;
  /** Falta texto para buscar (`minSearchLength`). */
  belowMinLength: boolean;
};

type CacheEntry = {
  options: readonly CnFieldOption[];
  hasMore: boolean;
  total?: number;
  nextPage: number;
  paginated: boolean;
};

type State = CacheEntry & {
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
};

const INITIAL: State = {
  options: [],
  hasMore: false,
  total: undefined,
  nextPage: 1,
  paginated: false,
  loading: false,
  loadingMore: false,
  error: null,
  loadMoreError: null,
};

const keyOf = (deps: readonly unknown[] | undefined) => {
  try {
    return JSON.stringify(deps ?? []);
  } catch {
    return String(deps?.length ?? 0);
  }
};

const messageOf = (caught: unknown) =>
  caught instanceof Error && caught.message ? caught.message : "No se pudieron cargar las opciones";

const sharedCaches = new Map<string, LruCache<string, CacheEntry>>();

const getSharedCache = (key: string, size: number) => {
  let cache = sharedCaches.get(key);
  if (!cache) {
    cache = new LruCache<string, CacheEntry>(size);
    sharedCaches.set(key, cache);
  }
  return cache;
};

/** Vacía la caché compartida de opciones remotas (una clave o todas). */
export const clearOptionsCache = (cacheKey?: string): void => {
  if (cacheKey === undefined) sharedCaches.forEach((cache) => cache.clear());
  else sharedCaches.get(cacheKey)?.clear();
};

/** Une páginas sin repetir valores (el servidor puede desplazar registros entre páginas). */
const mergeOptions = (
  current: readonly CnFieldOption[],
  incoming: readonly CnFieldOption[],
): readonly CnFieldOption[] => {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map((option) => optionValueKey(option.value)));
  const extra = incoming.filter((option) => {
    const key = optionValueKey(option.value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return extra.length ? [...current, ...extra] : current;
};

/**
 * Carga opciones de forma asíncrona con debounce, cancelación de peticiones
 * viejas, caché LRU por búsqueda y recarga cuando cambian sus dependencias.
 * Acepta loaders que devuelven un arreglo (todo de una vez) o páginas
 * `{ options, hasMore, total }` para scroll infinito (`loadMore`).
 */
export const useAsyncOptions = ({
  loadOptions,
  deps,
  input = "",
  debounceMs = 300,
  minSearchLength = 0,
  disabled = false,
  pageSize = 50,
  cacheKey,
  cacheSize = 30,
}: UseAsyncOptionsParams): UseAsyncOptionsReturn => {
  const [state, setState] = useState<State>(INITIAL);
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loadOptions);
  loaderRef.current = loadOptions;
  const depsKey = keyOf(deps);
  const firstRunRef = useRef(true);
  const localCacheRef = useRef<LruCache<string, CacheEntry> | null>(null);
  if (!localCacheRef.current) localCacheRef.current = new LruCache(cacheSize);
  const cache = cacheKey ? getSharedCache(cacheKey, cacheSize) : localCacheRef.current;
  const cacheRef = useRef(cache);
  cacheRef.current = cache;
  const lastDepsRef = useRef(depsKey);
  if (lastDepsRef.current !== depsKey) {
    lastDepsRef.current = depsKey;
    localCacheRef.current.clear();
  }
  const queryKey = `${depsKey}|${input}`;
  const queryRef = useRef({ queryKey, input, pageSize });
  queryRef.current = { queryKey, input, pageSize };
  const stateRef = useRef(state);
  stateRef.current = state;
  const moreRef = useRef<AbortController | null>(null);
  const belowMinLength = input.trim().length < minSearchLength;

  useEffect(() => {
    if (!loaderRef.current || disabled) {
      setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
      return undefined;
    }
    if (belowMinLength) {
      setState(INITIAL);
      return undefined;
    }
    const cached = cacheRef.current.get(queryKey);
    if (cached) {
      setState({ ...INITIAL, ...cached });
      return undefined;
    }
    const controller = new AbortController();
    // La primera carga y los cambios de dependencias no esperan el debounce.
    const wait = firstRunRef.current || input === "" ? 0 : debounceMs;
    firstRunRef.current = false;
    setState((prev) => ({ ...prev, loading: true, loadingMore: false, loadMoreError: null }));
    const timer = setTimeout(() => {
      let request: Promise<CnLoadOptionsResult>;
      try {
        request = Promise.resolve(
          loaderRef.current?.({ input, signal: controller.signal, page: 0, pageSize }) ?? [],
        );
      } catch (caught) {
        request = Promise.reject(caught);
      }
      request
        .then((result) => {
          if (controller.signal.aborted) return;
          const page = toOptionsPage(result);
          const entry: CacheEntry = {
            options: page.options,
            hasMore: page.paginated && page.hasMore,
            total: page.total,
            nextPage: 1,
            paginated: page.paginated,
          };
          cacheRef.current.set(queryKey, entry);
          setState({ ...INITIAL, ...entry });
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return;
          setState({ ...INITIAL, error: messageOf(caught) });
        });
    }, wait);
    return () => {
      clearTimeout(timer);
      controller.abort();
      moreRef.current?.abort();
      moreRef.current = null;
    };
    // `cacheKey` cambia la caché usada: se vuelve a consultar.
  }, [belowMinLength, cacheKey, debounceMs, disabled, input, nonce, pageSize, queryKey]);

  const loadMore = useCallback(() => {
    const current = stateRef.current;
    const loader = loaderRef.current;
    if (!loader || !current.hasMore || current.loading || current.loadingMore || moreRef.current) {
      return;
    }
    const { queryKey: key, input: text, pageSize: size } = queryRef.current;
    const controller = new AbortController();
    moreRef.current = controller;
    const page = current.nextPage;
    setState((prev) => ({ ...prev, loadingMore: true, loadMoreError: null }));
    let request: Promise<CnLoadOptionsResult>;
    try {
      request = Promise.resolve(
        loader({ input: text, signal: controller.signal, page, pageSize: size }),
      );
    } catch (caught) {
      request = Promise.reject(caught);
    }
    request
      .then((result) => {
        if (controller.signal.aborted) return;
        moreRef.current = null;
        const next = toOptionsPage(result);
        setState((prev) => {
          const entry: CacheEntry = {
            options: mergeOptions(prev.options, next.options),
            hasMore: next.paginated && next.hasMore && next.options.length > 0,
            total: next.total ?? prev.total,
            nextPage: page + 1,
            paginated: true,
          };
          cacheRef.current.set(key, entry);
          return { ...prev, ...entry, loadingMore: false, loadMoreError: null };
        });
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        moreRef.current = null;
        setState((prev) => ({ ...prev, loadingMore: false, loadMoreError: messageOf(caught) }));
      });
  }, []);

  const reload = useCallback(() => {
    cacheRef.current.delete(queryRef.current.queryKey);
    localCacheRef.current?.clear();
    setNonce((n) => n + 1);
  }, []);

  const retry = useCallback(() => {
    if (stateRef.current.loadMoreError) {
      setState((prev) => ({ ...prev, loadMoreError: null }));
      // El estado sin error se lee en el siguiente render.
      stateRef.current = { ...stateRef.current, loadMoreError: null };
      loadMore();
      return;
    }
    reload();
  }, [loadMore, reload]);

  return useMemo(
    () => ({
      options: state.options,
      loading: state.loading,
      error: state.error,
      reload,
      paginated: state.paginated,
      hasMore: state.hasMore,
      total: state.total,
      loadingMore: state.loadingMore,
      loadMoreError: state.loadMoreError,
      loadMore,
      retry,
      belowMinLength: Boolean(loadOptions) && belowMinLength,
    }),
    [belowMinLength, loadMore, loadOptions, reload, retry, state],
  );
};

/**
 * Recuerda las opciones ya vistas para que un valor seleccionado conserve su
 * etiqueta aunque la búsqueda remota actual ya no lo incluya.
 */
export const useOptionMemory = (
  options: readonly CnFieldOption[],
  extra?: readonly CnFieldOption[],
): ((value: string | number) => CnFieldOption | undefined) => {
  const memoryRef = useRef(new Map<string, CnFieldOption>());
  const lastOptionsRef = useRef<readonly CnFieldOption[] | null>(null);
  for (const option of extra ?? []) {
    const key = optionValueKey(option.value);
    if (!memoryRef.current.has(key)) memoryRef.current.set(key, option);
  }
  // Con listas grandes no se recorre de nuevo el mismo arreglo en cada render.
  if (lastOptionsRef.current !== options) {
    lastOptionsRef.current = options;
    for (const option of options) memoryRef.current.set(optionValueKey(option.value), option);
  }
  return (value) => memoryRef.current.get(optionValueKey(value));
};
