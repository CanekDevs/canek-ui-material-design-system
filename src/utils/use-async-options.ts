import { useEffect, useMemo, useRef, useState } from "react";
import type { CnFieldOption } from "../components/CnForm/CnForm.types";

export type CnLoadOptionsContext = {
  /** Texto buscado (vacío al abrir o cuando el campo no es de búsqueda). */
  input: string;
  /** Se aborta cuando llega una búsqueda más nueva o el campo se desmonta. */
  signal: AbortSignal;
};

export type CnLoadOptions = (ctx: CnLoadOptionsContext) => Promise<readonly CnFieldOption[]>;

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
};

export type UseAsyncOptionsReturn = {
  options: readonly CnFieldOption[];
  loading: boolean;
  error: string | null;
  /** Fuerza una recarga. */
  reload: () => void;
};

const keyOf = (deps: readonly unknown[] | undefined) => {
  try {
    return JSON.stringify(deps ?? []);
  } catch {
    return String(deps?.length ?? 0);
  }
};

/**
 * Carga opciones de forma asíncrona con debounce, cancelación de peticiones
 * viejas y recarga cuando cambian sus dependencias.
 */
export const useAsyncOptions = ({
  loadOptions,
  deps,
  input = "",
  debounceMs = 300,
  minSearchLength = 0,
  disabled = false,
}: UseAsyncOptionsParams): UseAsyncOptionsReturn => {
  const [options, setOptions] = useState<readonly CnFieldOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loadOptions);
  loaderRef.current = loadOptions;
  const depsKey = keyOf(deps);
  const firstRunRef = useRef(true);
  const cacheRef = useRef(new Map<string, readonly CnFieldOption[]>());
  const lastDepsRef = useRef(depsKey);
  if (lastDepsRef.current !== depsKey) {
    lastDepsRef.current = depsKey;
    cacheRef.current.clear();
  }

  useEffect(() => {
    if (!loaderRef.current || disabled) {
      setLoading(false);
      return;
    }
    if (input.trim().length < minSearchLength) {
      setOptions([]);
      setLoading(false);
      return;
    }
    const cacheKey = `${depsKey}|${input}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setOptions(cached);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    // La primera carga y los cambios de dependencias no esperan el debounce.
    const wait = firstRunRef.current || input === "" ? 0 : debounceMs;
    firstRunRef.current = false;
    setLoading(true);
    const timer = setTimeout(() => {
      Promise.resolve(loaderRef.current?.({ input, signal: controller.signal }))
        .then((result) => {
          if (controller.signal.aborted) return;
          cacheRef.current.set(cacheKey, result ?? []);
          setOptions(result ?? []);
          setError(null);
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return;
          setOptions([]);
          setError(caught instanceof Error ? caught.message : "No se pudieron cargar las opciones");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, wait);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [debounceMs, depsKey, disabled, input, minSearchLength, nonce]);

  return useMemo(
    () => ({
      options,
      loading,
      error,
      reload: () => {
        cacheRef.current.clear();
        setNonce((n) => n + 1);
      },
    }),
    [error, loading, options],
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
  for (const option of extra ?? [])
    memoryRef.current.set(`${typeof option.value}:${option.value}`, option);
  for (const option of options)
    memoryRef.current.set(`${typeof option.value}:${option.value}`, option);
  return (value) => memoryRef.current.get(`${typeof value}:${value}`);
};
