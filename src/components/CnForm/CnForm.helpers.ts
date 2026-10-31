export const getNestedValue = (obj: unknown, path: string): unknown => {
  if (!obj || !path) return undefined;
  if (typeof obj !== "object") return undefined;
  if (!path.includes(".")) return (obj as Record<string, unknown>)[path];

  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
};

export const setNestedValue = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> => {
  if (!path) return obj;

  const result: Record<string, unknown> = { ...obj };

  if (!path.includes(".")) {
    result[path] = value;
    return result;
  }

  const parts = path.split(".");
  const lastKey = parts.pop() as string;
  let current: Record<string, unknown> = result;

  parts.forEach((part, index) => {
    const existing = current[part];
    const nextKey = parts[index + 1] ?? lastKey;
    if (Array.isArray(existing)) {
      current[part] = [...existing];
    } else if (existing && typeof existing === "object" && !(existing instanceof Date)) {
      current[part] = { ...(existing as Record<string, unknown>) };
    } else {
      // Un segmento numérico siguiente indica que el contenedor es un arreglo.
      current[part] = /^\d+$/.test(nextKey) ? [] : {};
    }
    current = current[part] as Record<string, unknown>;
  });

  current[lastKey] = value;
  return result;
};

export const flattenObject = (obj: unknown, prefix = ""): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  if (obj === null || obj === undefined) {
    if (prefix) result[prefix] = obj;
    return result;
  }

  if (typeof obj !== "object") {
    if (prefix) result[prefix] = obj;
    return result;
  }

  if (obj instanceof Date || (typeof File !== "undefined" && obj instanceof File)) {
    if (prefix) result[prefix] = obj;
    return result;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const newKey = prefix ? `${prefix}.${index}` : `${index}`;
      Object.assign(result, flattenObject(item, newKey));
    });
    return result;
  }

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    Object.assign(result, flattenObject(value, newKey));
  }

  return result;
};

export const expandObject = (flatObj: Record<string, unknown>): Record<string, unknown> => {
  const objectResult: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(flatObj)) {
    if (value === undefined) continue;
    const parts = path.split(".");
    let current: Record<string, unknown> = objectResult;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const existing = current[part];
      if (existing === undefined || existing === null) {
        current[part] = {};
      } else if (existing instanceof Date) {
        current[part] = {};
      } else if (typeof File !== "undefined" && existing instanceof File) {
        current[part] = {};
      } else if (Array.isArray(existing)) {
        current[part] = [...existing];
      } else if (typeof existing === "object") {
        current[part] = { ...(existing as Record<string, unknown>) };
      } else {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  const convertToArrays = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj;
    if (typeof File !== "undefined" && obj instanceof File) return obj;
    if (Array.isArray(obj)) return obj.map(convertToArrays);
    if (typeof obj !== "object") return obj;

    const keys = Object.keys(obj);
    const allNumeric = keys.length > 0 && keys.every((k) => /^\d+$/.test(k));

    if (allNumeric && keys.includes("0")) {
      const indices = keys.map(Number).sort((a, b) => a - b);
      const arr: unknown[] = [];
      const maxIndex = indices[indices.length - 1];
      for (let i = 0; i <= maxIndex; i++) {
        const key = String(i);
        arr[i] =
          key in (obj as Record<string, unknown>)
            ? convertToArrays((obj as Record<string, unknown>)[key])
            : undefined;
      }
      return arr;
    }

    const result: Record<string, unknown> = {};
    for (const key of keys) {
      result[key] = convertToArrays((obj as Record<string, unknown>)[key]);
    }
    return result;
  };

  return convertToArrays(objectResult) as Record<string, unknown>;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !(value instanceof Date) &&
  !(typeof File !== "undefined" && value instanceof File) &&
  !(typeof Blob !== "undefined" && value instanceof Blob);

const isBinary = (value: unknown): value is Blob =>
  typeof Blob !== "undefined" && value instanceof Blob;

/** Igualdad estructural (usada para detectar cambios sin guardar). */
export const isDeepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => isDeepEqual(item, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a).filter((key) => a[key] !== undefined);
    const keysB = Object.keys(b).filter((key) => b[key] !== undefined);
    return keysA.length === keysB.length && keysA.every((key) => isDeepEqual(a[key], b[key]));
  }
  // "" / null / undefined se consideran equivalentes (campo vacío).
  const emptyish = (v: unknown) => v === "" || v === null || v === undefined;
  return emptyish(a) && emptyish(b);
};

/** Detecta si hay archivos en cualquier nivel del objeto. */
export const hasFiles = (value: unknown): boolean => {
  if (isBinary(value)) return true;
  if (Array.isArray(value)) return value.some(hasFiles);
  if (isPlainObject(value)) return Object.values(value).some(hasFiles);
  return false;
};

/** Normaliza rutas con corchetes (`items[0].name` → `items.0.name`). */
export const normalizePath = (path: string): string =>
  path.replace(/\[(\w+)\]/g, ".$1").replace(/^\./, "");

export type BuildFormDataOptions = {
  excludeFields?: string[];
  dateFormat?: (date: Date) => string;
};

/**
 * Serializa valores anidados a `FormData` con notación de corchetes
 * (`address[city]`, `items[0][name]`), compatible con PHP/Laravel, Rails y `qs`.
 * - Booleanos → "1"/"0"; `null` → ""; fechas → ISO (o `dateFormat`).
 * - Archivos existentes (`{ id, url }`) se envían como `campo[i][id]`.
 */
export const buildFormData = (
  values: Record<string, unknown>,
  { excludeFields = [], dateFormat }: BuildFormDataOptions = {},
): FormData => {
  const formData = new FormData();
  const excluded = new Set(excludeFields.map(normalizePath));

  const append = (key: string, dotted: string, value: unknown) => {
    if (value === undefined || excluded.has(dotted)) return;
    if (value === null) {
      formData.append(key, "");
    } else if (isBinary(value)) {
      formData.append(key, value, (value as File).name);
    } else if (value instanceof Date) {
      formData.append(key, dateFormat ? dateFormat(value) : value.toISOString());
    } else if (typeof value === "boolean") {
      formData.append(key, value ? "1" : "0");
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => append(`${key}[${index}]`, `${dotted}.${index}`, item));
    } else if (isPlainObject(value)) {
      if ("url" in value && "id" in value && !isBinary(value)) {
        formData.append(`${key}[id]`, String(value.id));
        return;
      }
      for (const [child, childValue] of Object.entries(value)) {
        append(`${key}[${child}]`, `${dotted}.${child}`, childValue);
      }
    } else {
      formData.append(key, String(value));
    }
  };

  for (const [key, value] of Object.entries(values)) append(key, key, value);
  return formData;
};

/** Elimina rutas del objeto (sin mutarlo). */
export const omitPaths = (
  values: Record<string, unknown>,
  paths: string[],
): Record<string, unknown> => {
  let result = values;
  for (const raw of paths) {
    const path = normalizePath(raw);
    const parts = path.split(".");
    const last = parts.pop() as string;
    const parent = parts.length ? getNestedValue(result, parts.join(".")) : result;
    if (!parent || typeof parent !== "object" || !(last in (parent as object))) continue;
    if (Array.isArray(parent)) continue;
    const { [last]: _removed, ...rest } = parent as Record<string, unknown>;
    result = parts.length ? setNestedValue(result, parts.join("."), rest) : rest;
  }
  return result;
};

const RESERVED_ERROR_KEYS = new Set([
  "message",
  "status",
  "statusCode",
  "statusText",
  "code",
  "name",
  "stack",
  "title",
  "detail",
  "type",
  "success",
  "error",
]);

const firstMessage = (value: unknown): string | undefined => {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstMessage(item);
      if (message) return message;
    }
  }
  if (isPlainObject(value) && typeof value.message === "string") return value.message;
  return undefined;
};

const collectFieldErrors = (
  source: unknown,
  prefix: string,
  out: Record<string, string>,
  depth: number,
  skipReserved = false,
): void => {
  if (depth > 6 || source === null || source === undefined) return;

  // [{ field|path|name, message }]
  if (Array.isArray(source)) {
    if (source.every((item) => isPlainObject(item))) {
      for (const item of source as Record<string, unknown>[]) {
        const rawPath = item.field ?? item.path ?? item.name ?? item.param ?? item.loc;
        const path = Array.isArray(rawPath) ? rawPath.join(".") : rawPath;
        const message = firstMessage(item.message ?? item.msg ?? item.messages);
        if (typeof path === "string" && path && message) {
          out[normalizePath(prefix ? `${prefix}.${path}` : path)] = message;
        }
      }
    }
    return;
  }

  if (!isPlainObject(source)) return;

  for (const [key, value] of Object.entries(source)) {
    // En el cuerpo raíz, claves como `message` o `status` no son campos.
    if (skipReserved && !prefix && RESERVED_ERROR_KEYS.has(key)) continue;
    const path = normalizePath(prefix ? `${prefix}.${key}` : key);
    const message =
      typeof value === "string" ||
      (Array.isArray(value) && value.every((v) => typeof v === "string"))
        ? firstMessage(value)
        : undefined;
    if (message) {
      out[path] = message;
    } else if (isPlainObject(value) || Array.isArray(value)) {
      collectFieldErrors(value, path, out, depth + 1);
    }
  }
};

/** Busca el cuerpo de la respuesta en errores de fetch/axios/clientes HTTP propios. */
const unwrapErrorBody = (error: unknown): unknown => {
  if (!error || typeof error !== "object") return error;
  const candidate = error as Record<string, unknown>;
  const response = candidate.response as Record<string, unknown> | undefined;
  return response?.data ?? candidate.payload ?? candidate.body ?? candidate.data ?? error;
};

/**
 * Extrae errores por campo de las formas más comunes de respuesta:
 * - `{ campo: "msg" }` o `{ campo: ["msg"] }` (y anidados)
 * - Laravel: `{ message, errors: { campo: ["msg"] } }`
 * - `{ data: { campo: [...] } }`, `{ fieldErrors: {...} }`
 * - Arreglos `[{ field|path, message }]` (zod, express-validator, etc.)
 * - Errores de axios (`error.response.data`) o con `payload` / `body`.
 */
export const parseServerErrors = (error: unknown): Record<string, string> => {
  const body = unwrapErrorBody(error);
  const out: Record<string, string> = {};
  if (isPlainObject(body)) {
    const container = body.errors ?? body.fieldErrors ?? body.data ?? body.details;
    if (container && (isPlainObject(container) || Array.isArray(container))) {
      collectFieldErrors(container, "", out, 0);
      if (Object.keys(out).length > 0) return out;
    }
  }
  collectFieldErrors(body, "", out, 0, true);
  return out;
};

/** Mensaje general del error (para mostrarlo arriba del formulario). */
export const getServerErrorMessage = (error: unknown): string | undefined => {
  if (!error) return undefined;
  if (typeof error === "string") return error.trim() || undefined;
  const body = unwrapErrorBody(error);
  if (isPlainObject(body)) {
    for (const key of ["message", "detail", "title", "error"]) {
      const value = body[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return undefined;
};
