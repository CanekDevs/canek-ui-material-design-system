import { normalizeSearchText } from "../../utils/option-filter";

/** Persona que se puede mencionar con `@`. */
export type CnMentionable = {
  id: string;
  name: string;
  /** Texto secundario en la lista (puesto, correo). */
  description?: string;
  avatarSrc?: string;
};

/** Mención en curso: texto después de `@` hasta el cursor. */
export type CnMentionQuery = { start: number; query: string };

/**
 * Busca una mención en curso: un `@` al inicio o después de un espacio, seguido de hasta dos
 * palabras sin salto de línea, que termina en el cursor.
 */
export const findMentionQuery = (text: string, caret: number): CnMentionQuery | null => {
  const before = text.slice(0, caret);
  const match = before.match(/(^|\s)@([^\s@]*(?: [^\s@]*)?)$/);
  if (!match) return null;
  const query = match[2];
  return { start: caret - query.length - 1, query };
};

/** Filtra personas por nombre o descripción, sin acentos ni mayúsculas. */
export const filterMentionables = (
  people: readonly CnMentionable[],
  query: string,
  limit = 6,
): CnMentionable[] => {
  const q = normalizeSearchText(query);
  return people
    .filter(
      (person) =>
        !q || normalizeSearchText(`${person.name} ${person.description ?? ""}`).includes(q),
    )
    .slice(0, limit);
};

/** Ids de las personas cuyo `@Nombre` aparece en el texto. */
export const extractMentions = (text: string, people: readonly CnMentionable[]): string[] =>
  people.filter((person) => text.includes(`@${person.name}`)).map((person) => person.id);
