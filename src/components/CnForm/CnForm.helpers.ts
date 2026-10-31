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

  for (const part of parts) {
    const existing = current[part];
    if (existing === undefined || existing === null) {
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

  current[lastKey] = value;
  return result;
};

export const flattenObject = (
  obj: unknown,
  prefix = "",
): Record<string, unknown> => {
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
        arr[i] = key in (obj as Record<string, unknown>)
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
