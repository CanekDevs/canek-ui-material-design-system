import type { CnFieldOption } from "../components/CnForm/CnForm.types";

/** Normaliza para buscar sin importar acentos ni mayúsculas. */
export const normalizeSearchText = (value: string): string =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Texto normalizado por opción. Se calcula una sola vez por objeto: filtrar
// 10,000 opciones en cada tecla solo hace `includes` sobre cadenas listas.
const searchTextCache = new WeakMap<object, string>();

/** Texto de búsqueda normalizado (`label` + `searchText`) de una opción, en caché. */
export const getOptionSearchText = (option: CnFieldOption): string => {
  let text = searchTextCache.get(option);
  if (text === undefined) {
    text = normalizeSearchText(`${option.label} ${option.searchText ?? ""}`);
    searchTextCache.set(option, text);
  }
  return text;
};

/** Calcula por adelantado el texto normalizado (útil al recibir listas grandes). */
export const precomputeOptionSearchText = (options: readonly CnFieldOption[]): void => {
  for (const option of options) getOptionSearchText(option);
};

/** Filtro propio: recibe las opciones y el texto escrito. */
export type CnFilterOptions = (
  options: readonly CnFieldOption[],
  input: string,
) => readonly CnFieldOption[];

export type CnFilterResult = {
  /** Opciones a mostrar (como máximo `maxResults`). */
  options: CnFieldOption[];
  /** Total de coincidencias (incluye las recortadas). */
  total: number;
};

/**
 * Filtro rápido sin acentos: cada palabra escrita debe aparecer en la etiqueta
 * o en `searchText`. Conserva el orden original (y con él los grupos).
 */
export const filterOptionsFast = (
  options: readonly CnFieldOption[],
  input: string,
  maxResults?: number,
): CnFilterResult => {
  const tokens = normalizeSearchText(input).split(/\s+/).filter(Boolean);
  const limit = maxResults && maxResults > 0 ? maxResults : Infinity;
  if (tokens.length === 0) {
    return {
      options: limit < options.length ? options.slice(0, limit) : [...options],
      total: options.length,
    };
  }
  const result: CnFieldOption[] = [];
  let total = 0;
  for (const option of options) {
    const text = getOptionSearchText(option);
    let match = true;
    for (const token of tokens) {
      if (!text.includes(token)) {
        match = false;
        break;
      }
    }
    if (!match) continue;
    total += 1;
    if (result.length < limit) result.push(option);
  }
  return { options: result, total };
};

/** Clave estable de un valor que conserva su tipo (`1` ≠ `"1"`). */
export const optionValueKey = (value: string | number): string => `${typeof value}:${value}`;

/** Formatea conteos como "12,340". */
export const formatCount = (value: number): string => {
  try {
    return new Intl.NumberFormat("es-MX").format(value);
  } catch {
    return String(value);
  }
};
