import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CnResolvedField } from "./CnForm.engine";
import { validateResolvedFields } from "./CnForm.engine";
import { getNestedValue, isDeepEqual, parseServerErrors, setNestedValue } from "./CnForm.helpers";
import type { CnFormValidateOn, CnFormValues } from "./CnForm.types";

type Options = {
  value?: CnFormValues;
  initialValues: CnFormValues;
  onChange?: (patch: CnFormValues, values: CnFormValues) => void;
  onDirtyChange?: (dirty: boolean) => void;
  validateOn: CnFormValidateOn;
  serverError?: unknown;
  /** Todos los campos (de todas las pestañas/pasos) resueltos para unos valores. */
  resolveFields: (values: CnFormValues) => CnResolvedField[];
};

const isUnder = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}.`) || prefix.startsWith(`${path}.`);

const withoutPaths = (errors: Record<string, string>, paths: string[]) => {
  let changed = false;
  const next: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) {
    if (paths.some((path) => isUnder(key, path))) {
      changed = true;
    } else {
      next[key] = message;
    }
  }
  return changed ? next : errors;
};

const topLevelPatch = (values: CnFormValues, paths: string[]): CnFormValues => {
  const patch: CnFormValues = {};
  for (const path of paths) {
    const key = path.split(".")[0];
    patch[key] = values[key];
  }
  return patch;
};

export const useCnFormState = ({
  value,
  initialValues,
  onChange,
  onDirtyChange,
  validateOn,
  serverError,
  resolveFields,
}: Options) => {
  const isControlled = value !== undefined;
  const [internalValues, setInternalValues] = useState<CnFormValues>(initialValues);
  const values = isControlled ? (value as CnFormValues) : internalValues;

  const valuesRef = useRef(values);
  const lastEmittedRef = useRef<CnFormValues | null>(null);
  const [baseline, setBaseline] = useState<CnFormValues>(() =>
    isControlled ? { ...initialValues, ...value } : initialValues,
  );

  const [touched, setTouched] = useState<Record<string, true>>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [asyncErrors, setAsyncErrors] = useState<Record<string, string>>({});
  const asyncTokensRef = useRef<Record<string, number>>({});

  // En modo controlado los valores externos se toman como fuente de verdad;
  // si cambian por algo distinto a nuestro onChange (carga de datos), pasan a
  // ser la nueva línea base para "cambios sin guardar".
  useEffect(() => {
    if (!isControlled) return;
    valuesRef.current = value as CnFormValues;
    if (lastEmittedRef.current && isDeepEqual(value, lastEmittedRef.current)) return;
    lastEmittedRef.current = null;
    setBaseline(value as CnFormValues);
  }, [isControlled, value]);

  if (!isControlled) valuesRef.current = internalValues;

  // Completa en modo controlado los valores que faltan (defaults de campos y
  // elementos iniciales de secciones repetibles).
  const didFillRef = useRef(false);
  useEffect(() => {
    if (!isControlled || didFillRef.current) return;
    didFillRef.current = true;
    const current = value as CnFormValues;
    const missing = Object.keys(initialValues).filter((key) => current[key] === undefined);
    if (missing.length === 0) return;
    const next = { ...current };
    for (const key of missing) next[key] = initialValues[key];
    valuesRef.current = next;
    lastEmittedRef.current = next;
    setBaseline(next);
    onChange?.(topLevelPatch(next, missing), next);
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const parsed = parseServerErrors(serverError);
    setServerErrors(parsed);
  }, [serverError]);

  const resolvedFields = useMemo(() => resolveFields(values), [resolveFields, values]);
  const liveErrors = useMemo(
    () => validateResolvedFields(resolvedFields, values),
    [resolvedFields, values],
  );

  const commit = useCallback(
    (next: CnFormValues, changedPaths: string[]) => {
      valuesRef.current = next;
      if (isControlled) {
        lastEmittedRef.current = next;
      } else {
        setInternalValues(next);
      }
      setServerErrors((prev) => withoutPaths(prev, changedPaths));
      setAsyncErrors((prev) => withoutPaths(prev, changedPaths));
      onChange?.(topLevelPatch(next, changedPaths), next);
    },
    [isControlled, onChange],
  );

  const touch = useCallback((paths: string | string[]) => {
    const list = Array.isArray(paths) ? paths : [paths];
    setTouched((prev) => {
      if (list.every((path) => prev[path])) return prev;
      const next = { ...prev };
      for (const path of list) next[path] = true;
      return next;
    });
  }, []);

  const setFieldValue = useCallback(
    (path: string, nextValue: unknown) => {
      const base = valuesRef.current;
      if (Object.is(getNestedValue(base, path), nextValue)) return;
      let next = setNestedValue(base, path, nextValue);
      const changed = [path];

      const resolved = resolveFields(next).find((item) => item.path === path);
      const extra = resolved?.field.onFieldChange?.(nextValue, next, path);
      if (extra && typeof extra === "object") {
        for (const [extraPath, extraValue] of Object.entries(extra)) {
          next = setNestedValue(next, extraPath, extraValue);
          changed.push(extraPath);
        }
      }
      commit(next, changed);
      if (validateOn === "change") touch(path);
    },
    [commit, resolveFields, touch, validateOn],
  );

  /** Reemplaza un subárbol completo (p. ej. el arreglo de una sección repetible). */
  const setValueAt = useCallback(
    (path: string, nextValue: unknown) => {
      commit(setNestedValue(valuesRef.current, path, nextValue), [path]);
    },
    [commit],
  );

  const runAsyncValidation = useCallback(
    async (targets: CnResolvedField[]): Promise<Record<string, string>> => {
      const current = valuesRef.current;
      const found: Record<string, string> = {};
      await Promise.all(
        targets
          .filter((item) => item.visible && item.field.validateAsync)
          .map(async (item) => {
            const token = (asyncTokensRef.current[item.path] ?? 0) + 1;
            asyncTokensRef.current[item.path] = token;
            let message: string | null | undefined | void;
            try {
              message = await item.field.validateAsync?.(
                getNestedValue(current, item.path),
                current,
                item.ctx,
              );
            } catch {
              message = undefined;
            }
            // Ignora respuestas de validaciones anteriores (condición de carrera).
            if (asyncTokensRef.current[item.path] !== token) return;
            if (message) found[item.path] = message;
            setAsyncErrors((prev) => {
              if (message)
                return prev[item.path] === message ? prev : { ...prev, [item.path]: message };
              if (!(item.path in prev)) return prev;
              const { [item.path]: _removed, ...rest } = prev;
              return rest;
            });
          }),
      );
      return found;
    },
    [],
  );

  const blur = useCallback(
    (path: string) => {
      if (validateOn !== "submit") touch(path);
      const resolved = resolveFields(valuesRef.current).find((item) => item.path === path);
      if (resolved?.field.validateAsync) {
        const syncError = validateResolvedFields([resolved], valuesRef.current)[path];
        if (!syncError) void runAsyncValidation([resolved]);
      }
    },
    [resolveFields, runAsyncValidation, touch, validateOn],
  );

  /** Valida (sincrónico + asíncrono) las rutas indicadas o todo el formulario. */
  const validate = useCallback(
    async (paths?: string[]): Promise<Record<string, string>> => {
      const current = valuesRef.current;
      const all = resolveFields(current);
      const targets = paths ? all.filter((item) => paths.includes(item.path)) : all;
      const syncErrors = validateResolvedFields(targets, current);
      const pending = targets.filter((item) => !syncErrors[item.path]);
      const asyncFound = await runAsyncValidation(pending);
      return { ...syncErrors, ...asyncFound };
    },
    [resolveFields, runAsyncValidation],
  );

  const reset = useCallback(
    (nextValues?: CnFormValues) => {
      const target = nextValues ?? baseline;
      valuesRef.current = target;
      if (isControlled) {
        lastEmittedRef.current = target;
        onChange?.(target, target);
      } else {
        setInternalValues(target);
      }
      setBaseline(target);
      setTouched({});
      setSubmitCount(0);
      setServerErrors({});
      setAsyncErrors({});
    },
    [baseline, isControlled, onChange],
  );

  const markSaved = useCallback(() => setBaseline(valuesRef.current), []);

  const isDirty = useMemo(() => !isDeepEqual(values, baseline), [baseline, values]);
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  const lastDirtyRef = useRef(isDirty);
  useEffect(() => {
    if (lastDirtyRef.current === isDirty) return;
    lastDirtyRef.current = isDirty;
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  /** Error visible para una ruta (servidor > validación > asíncrono). */
  const getError = useCallback(
    (path: string): string | undefined => {
      if (serverErrors[path]) return serverErrors[path];
      const shown = submitCount > 0 || (validateOn !== "submit" && touched[path]);
      if (!shown) return undefined;
      return liveErrors[path] || asyncErrors[path] || undefined;
    },
    [asyncErrors, liveErrors, serverErrors, submitCount, touched, validateOn],
  );

  const visibleErrors = useMemo(() => {
    const result: Record<string, string> = {};
    for (const item of resolvedFields) {
      const message = getError(item.path);
      if (message) result[item.path] = message;
    }
    for (const [path, message] of Object.entries(serverErrors)) {
      if (!result[path]) result[path] = message;
    }
    return result;
  }, [getError, resolvedFields, serverErrors]);

  return {
    values,
    valuesRef,
    resolvedFields,
    liveErrors,
    visibleErrors,
    serverErrors,
    submitCount,
    isDirty,
    dirtyRef,
    getError,
    setFieldValue,
    setValueAt,
    touch,
    blur,
    validate,
    reset,
    markSaved,
    setSubmitCount,
    setServerErrors,
  };
};
