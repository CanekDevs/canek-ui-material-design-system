/**
 * Catálogo de componentes: fuente única de la documentación de uso de cada componente.
 * Storybook toma de aquí la descripción (`catalogDocs`), el README genera su índice y las
 * pruebas de gobierno exigen que todo componente tenga su entrada.
 */

export type CnCatalogCategory =
  | "fundamentos"
  | "acciones"
  | "formularios"
  | "datos"
  | "graficas"
  | "retroalimentacion"
  | "superposiciones"
  | "navegacion"
  | "layout"
  | "contenido"
  | "medios"
  | "ia";

/** Tipos de sistema donde el componente aporta (para el catálogo por dominio). */
export type CnCatalogDomain =
  | "general"
  | "erp"
  | "crm"
  | "cms"
  | "ecommerce"
  | "pos"
  | "reservas"
  | "pagos"
  | "rrhh"
  | "landing"
  | "dashboards"
  | "ia";

export type CnCatalogStatus = "estable" | "beta" | "planeado";

export type CnCatalogEntry = {
  /** Nombre del componente principal (p. ej. `CnDataTable`). */
  name: string;
  /** Carpeta en `src/components` (por defecto, igual a `name`). */
  folder?: string;
  category: CnCatalogCategory;
  domains: CnCatalogDomain[];
  status: CnCatalogStatus;
  /** Una línea: qué es. */
  summary: string;
  /** Problemas que resuelve, en lenguaje de producto. */
  purpose: string;
  /** Casos en los que hay que usar otro componente, nombrándolo. */
  whenNot: string;
  /** Componentes con los que se combina o se confunde, y cómo se relacionan. */
  neighbors: string;
  /** Otros componentes exportados desde la misma carpeta (skeletons, grupos, hooks). */
  related?: string[];
};
