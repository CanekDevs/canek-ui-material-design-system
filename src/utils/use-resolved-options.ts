import { useEffect, useRef, useState } from "react";
import type { CnFieldOption } from "../components/CnForm/CnForm.types";
import { LruCache } from "./lru-cache";
import { optionValueKey } from "./option-filter";
import type { CnResolveOptions } from "./use-async-options";

export type UseResolvedOptionsParams = {
  /** Valores seleccionados. */
  values: readonly (string | number)[];
  /** `true` si el valor ya tiene opción (cargada, recordada o en `selectedOptions`). */
  isKnown: (value: string | number) => boolean;
  resolveOptions?: CnResolveOptions;
  /** Comparte las opciones resueltas entre campos con la misma clave. */
  cacheKey?: string;
};

export type UseResolvedOptionsReturn = {
  /** Opción resuelta de un valor (si ya llegó). */
  get: (value: string | number) => CnFieldOption | undefined;
  /** Hay una resolución en curso. */
  resolving: boolean;
  /** Todas las opciones resueltas que conoce este campo. */
  resolved: readonly CnFieldOption[];
};

const SELECTED_CACHE_SIZE = 500;
const sharedSelected = new Map<string, LruCache<string, CnFieldOption>>();

/** Vacía la caché de opciones seleccionadas resueltas (una clave o todas). */
export const clearResolvedOptionsCache = (cacheKey?: string): void => {
  if (cacheKey === undefined) sharedSelected.forEach((cache) => cache.clear());
  else sharedSelected.get(cacheKey)?.clear();
};

/**
 * Obtiene las opciones de valores seleccionados que no están en la página
 * cargada (`resolveOptions(values)`), en una sola petición por lote y con una
 * pequeña caché. Así los chips y etiquetas se ven bien al editar un registro
 * sin descargar toda la lista.
 */
export const useResolvedOptions = ({
  values,
  isKnown,
  resolveOptions,
  cacheKey,
}: UseResolvedOptionsParams): UseResolvedOptionsReturn => {
  const localRef = useRef<LruCache<string, CnFieldOption> | null>(null);
  if (!localRef.current) localRef.current = new LruCache(SELECTED_CACHE_SIZE);
  let cache = localRef.current;
  if (cacheKey) {
    let shared = sharedSelected.get(cacheKey);
    if (!shared) {
      shared = new LruCache(SELECTED_CACHE_SIZE);
      sharedSelected.set(cacheKey, shared);
    }
    cache = shared;
  }
  // Valores ya pedidos (resueltos o no) para no repetir la petición en bucle.
  const requestedRef = useRef(new Set<string>());
  const [, setVersion] = useState(0);
  const [resolving, setResolving] = useState(false);
  const resolverRef = useRef(resolveOptions);
  resolverRef.current = resolveOptions;

  const missing = resolveOptions
    ? values.filter((value) => {
        const key = optionValueKey(value);
        return !isKnown(value) && !cache.has(key) && !requestedRef.current.has(key);
      })
    : [];
  const missingKey = missing.map(optionValueKey).join("|");
  const missingRef = useRef(missing);
  missingRef.current = missing;
  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  useEffect(() => {
    const pending = missingRef.current;
    if (!resolverRef.current || pending.length === 0) return undefined;
    const controller = new AbortController();
    setResolving(true);
    Promise.resolve(resolverRef.current([...pending], { signal: controller.signal }))
      .then((options) => {
        if (controller.signal.aborted) return;
        for (const option of options ?? []) {
          cacheRef.current.set(optionValueKey(option.value), option);
        }
        pending.forEach((value) => requestedRef.current.add(optionValueKey(value)));
        setVersion((v) => v + 1);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        // Sin reintentos automáticos: se muestra el valor crudo o `getValueLabel`.
        pending.forEach((value) => requestedRef.current.add(optionValueKey(value)));
        setVersion((v) => v + 1);
      })
      .finally(() => {
        if (!controller.signal.aborted) setResolving(false);
      });
    return () => {
      controller.abort();
      setResolving(false);
    };
  }, [missingKey]);

  const resolved: CnFieldOption[] = [];
  for (const value of values) {
    const option = cache.get(optionValueKey(value));
    if (option) resolved.push(option);
  }

  return {
    get: (value) => cache.get(optionValueKey(value)),
    resolving,
    resolved,
  };
};
