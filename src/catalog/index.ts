import { CATALOG_ACTIONS_FEEDBACK } from "./entries/actions-feedback";
import { CATALOG_CONTENT_MEDIA } from "./entries/content-media";
import { CATALOG_DATA } from "./entries/data";
import { CATALOG_ACTIVITY } from "./entries/activity";
import { CATALOG_FORMS_A } from "./entries/forms-a";
import { CATALOG_FORMS_B } from "./entries/forms-b";
import { CATALOG_LAYOUT_OVERLAYS } from "./entries/layout-overlays";
import { CATALOG_AI } from "./entries/ai";
import type { CnCatalogEntry } from "./types";

export type * from "./types";

/** Todas las entradas del catálogo, una por componente principal. */
export const CN_CATALOG: CnCatalogEntry[] = [
  ...CATALOG_AI,
  ...CATALOG_ACTIONS_FEEDBACK,
  ...CATALOG_FORMS_A,
  ...CATALOG_FORMS_B,
  ...CATALOG_ACTIVITY,
  ...CATALOG_DATA,
  ...CATALOG_LAYOUT_OVERLAYS,
  ...CATALOG_CONTENT_MEDIA,
];

const BY_NAME = new Map(CN_CATALOG.map((entry) => [entry.name, entry]));

export const getCatalogEntry = (name: string): CnCatalogEntry => {
  const entry = BY_NAME.get(name);
  if (!entry) throw new Error(`Sin entrada de catálogo para ${name} (src/catalog/entries).`);
  return entry;
};

/**
 * Descripción de Storybook con las tres secciones obligatorias.
 * Uso: `parameters: { docs: { description: { component: catalogDocs("CnButton") } } }`.
 */
export const catalogDocs = (name: string, extra?: string): string => {
  const entry = getCatalogEntry(name);
  return [
    `${entry.summary}`,
    "",
    `**Para qué sirve.** ${entry.purpose}`,
    "",
    `**Cuándo NO usarlo.** ${entry.whenNot}`,
    "",
    `**Relación con vecinos.** ${entry.neighbors}`,
    ...(extra ? ["", extra] : []),
  ].join("\n");
};
