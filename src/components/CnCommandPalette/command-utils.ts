import { normalizeSearchText } from "../../utils/option-filter";

export type CnCommand = {
  id: string;
  label: string;
  /** Grupo donde aparece (p. ej. «Páginas», «Acciones», «Contactos»). */
  group?: string;
  /** Nombre del ícono (`CnIcon`). */
  icon?: string;
  /** Texto secundario (ruta, correo, estado). También cuenta para la búsqueda. */
  description?: string;
  /** Atajo que se muestra a la derecha (p. ej. `"mod+shift+n"`). Solo se muestra; no se registra. */
  hotkey?: string;
  /** Palabras extra para encontrarlo (sinónimos, nombre en inglés…). */
  keywords?: string[];
  disabled?: boolean;
  /** Destino. Si no hay `onSelect` en el comando ni en la paleta, se navega aquí. */
  href?: string;
  onSelect?: () => void;
};

export type CnCommandGroup = { name: string; commands: CnCommand[] };

const DEFAULT_GROUP = "Resultados";

/**
 * Filtra y ordena comandos: todas las palabras de la búsqueda deben aparecer (sin importar acentos
 * ni mayúsculas) en el nombre, la descripción, el grupo o las palabras clave. Primero los que
 * empiezan con la búsqueda, luego los que la contienen en el nombre y al final el resto.
 */
export const filterCommands = (
  commands: readonly CnCommand[],
  query: string,
  max = Infinity,
): CnCommand[] => {
  const q = normalizeSearchText(query);
  if (!q) return commands.slice(0, max);
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored: { command: CnCommand; score: number; index: number }[] = [];
  commands.forEach((command, index) => {
    const label = normalizeSearchText(command.label);
    const haystack = normalizeSearchText(
      [command.label, command.description, command.group, ...(command.keywords ?? [])].join(" "),
    );
    if (!tokens.every((t) => haystack.includes(t))) return;
    const words = label.split(/\s+/);
    const score = label.startsWith(q)
      ? 0
      : label.includes(q)
        ? 1
        : tokens.every((t) => words.some((w) => w.startsWith(t)))
          ? 2
          : 3;
    scored.push({ command, score, index });
  });
  scored.sort((a, b) => a.score - b.score || a.index - b.index);
  return scored.slice(0, max).map((s) => s.command);
};

/** Agrupa conservando el orden: cada grupo aparece donde está su primer comando. */
export const groupCommands = (commands: readonly CnCommand[]): CnCommandGroup[] => {
  const groups = new Map<string, CnCommand[]>();
  for (const command of commands) {
    const name = command.group ?? DEFAULT_GROUP;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)?.push(command);
  }
  return Array.from(groups, ([name, list]) => ({ name, commands: list }));
};
