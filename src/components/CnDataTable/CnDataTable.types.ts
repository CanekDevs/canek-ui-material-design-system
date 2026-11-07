import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { CnButtonColor } from "../CnButton";
import type { CnConfirmOptions } from "../CnConfirmDialog";
import type { CnCellOptions, CnCellType } from "./cells";
import type { CnExportFormat } from "./export";

export type CnRow = object;

export type CnAggregate = "sum" | "avg" | "min" | "max" | "count";

export type CnColumn<T extends CnRow = CnRow> = {
  /** Identificador único; también es la ruta del valor (`customer.name`) si no hay `accessor`. */
  id: string;
  header: ReactNode;
  /** Valor de la celda (para ordenar, filtrar, buscar y exportar). */
  accessor?: (row: T) => unknown;
  /** Celda tipada con formato integrado. */
  type?: CnCellType;
  cellOptions?: CnCellOptions;
  /** Render propio de la celda. */
  cell?: (value: unknown, row: T, index: number) => ReactNode;
  /** Texto exportado / buscado (por defecto el formato del tipo o el valor). */
  exportValue?: (value: unknown, row: T) => unknown;
  sortable?: boolean;
  filterable?: boolean;
  /** Se puede ocultar desde el menú de columnas. Por defecto `true`. */
  hideable?: boolean;
  /** Oculta la columna al inicio (se puede mostrar desde el menú). */
  hidden?: boolean;
  align?: "left" | "center" | "right";
  width?: number | string;
  minWidth?: number;
  /** Agregado en el pie (sobre las filas filtradas). */
  aggregate?: CnAggregate;
  /** Pie propio; recibe las filas filtradas. */
  footer?: ReactNode | ((rows: T[]) => ReactNode);
  /** Fija la columna a la izquierda al hacer scroll horizontal. */
  sticky?: boolean;
  /** Filtro de la columna: texto (por defecto) o lista de opciones (estado, booleano…). */
  filter?: "text" | "select";
  /** Ancho redimensionable. Por defecto `true`. */
  resizable?: boolean;
  /** Texto de ayuda junto al encabezado (ícono ⓘ con tooltip). */
  description?: string;
  /** Muestra el menú (⋮) de la columna. Por defecto `true`. */
  columnMenu?: boolean;
  /** Se puede agrupar por esta columna. Por defecto `true`. */
  groupable?: boolean;
  /** Muestra la columna en la vista de tarjetas (móvil). Por defecto `true`. */
  showInCards?: boolean;
};

export type CnRowAction<T extends CnRow = CnRow> = {
  id: string;
  label: string;
  icon?: string;
  color?: "default" | "error" | "warning" | "success" | "primary";
  onClick: (row: T) => void | Promise<unknown>;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  /** Confirmación previa (usa `CnConfirmDialog`). */
  confirm?: CnConfirmOptions | ((row: T) => CnConfirmOptions);
  /** Se muestra como botón de ícono en lugar de dentro del menú. */
  inline?: boolean;
  /** Tooltip (texto o según la fila, p. ej. por qué está deshabilitada). */
  tooltip?: string | ((row: T) => string | undefined);
};

export type CnBulkAction<T extends CnRow = CnRow> = {
  id: string;
  label: string;
  icon?: string;
  color?: CnButtonColor;
  onClick: (rows: T[]) => void | Promise<unknown>;
  confirm?: CnConfirmOptions | ((rows: T[]) => CnConfirmOptions);
};

export type CnSortItem = { id: string; desc: boolean };

export type CnTableQuery = {
  pageIndex: number;
  pageSize: number;
  sorting: CnSortItem[];
  search: string;
  filters: Record<string, string>;
};

/** Modo servidor: la tabla solo pinta y notifica cambios de página, orden y búsqueda. */
export type CnServerSide = {
  rowCount: number;
  query: CnTableQuery;
  onQueryChange: (query: CnTableQuery) => void;
};

export type CnDataTableProps<T extends CnRow = CnRow> = {
  data: readonly T[];
  columns: readonly CnColumn<T>[];
  getRowId?: (row: T, index: number) => string;
  title?: ReactNode;
  description?: ReactNode;
  loading?: boolean;
  error?: ReactNode;

  /** Acciones a la derecha de la barra (botón "Nuevo"…). */
  toolbarActions?: ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Muestra la fila de filtros por columna. */
  columnFilters?: boolean;
  /** Menú para mostrar/ocultar columnas. Por defecto `true`. */
  columnToggle?: boolean;
  densityToggle?: boolean;
  /** Formatos de exportación (`false` lo oculta). */
  exportFormats?: CnExportFormat[] | false;
  /** Copiar al portapapeles. Por defecto `true`. */
  copyable?: boolean;
  exportFilename?: string;
  /** Todas las filas para exportar en modo servidor. */
  fetchAllRows?: () => Promise<T[]>;
  hideToolbar?: boolean;

  sortable?: boolean;
  defaultSort?: CnSortItem[];
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];

  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[], rows: T[]) => void;
  bulkActions?: CnBulkAction<T>[];

  rowActions?: CnRowAction<T>[];
  rowActionsPosition?: "start" | "end";
  onRowClick?: (row: T) => void;
  /** Contenido expandible bajo cada fila. */
  renderDetail?: (row: T) => ReactNode;
  /** Resalta filas: tono predefinido o color CSS (`"#fff8e1"`). */
  getRowTone?: (row: T) => "error" | "warning" | "success" | "info" | (string & {}) | undefined;
  /** Columna con el número de fila. */
  rowNumbers?: boolean;
  /** Con selección activa, un clic en la fila la selecciona. */
  selectOnRowClick?: boolean;
  /** Menú (⋮) en los encabezados. Por defecto `true`. */
  columnActions?: boolean;
  /** Agrupar filas desde el menú de columna. Por defecto `true`. */
  groupable?: boolean;
  /** Columnas agrupadas al inicio. */
  defaultGrouping?: string[];
  /**
   * Exporta una fila por cada elemento de detalle (partidas de una orden,
   * integrantes de un equipo…), repitiendo los datos de la fila principal.
   */
  exportDetail?: {
    accessor: (row: T) => readonly object[] | undefined;
    columns: readonly CnColumn<object>[];
  };

  density?: "compact" | "comfortable" | "spacious";
  /** Casilla en la barra para mostrar/ocultar la columna de selección. */
  selectionToggle?: boolean;
  /** Botón "Imprimir". Por defecto `true`. */
  printable?: boolean;
  /** Botón de pantalla completa. Por defecto `true`. */
  fullscreenToggle?: boolean;
  /** Reordenar columnas arrastrándolas. Por defecto `true`. */
  columnReorder?: boolean;
  /** Redimensionar columnas. Por defecto `true`. */
  columnResize?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  /** Alto máximo con scroll interno (activa encabezado fijo). */
  maxHeight?: number | string;
  /** Vista en móvil: tarjetas (por defecto) o tabla con scroll. */
  mobileLayout?: "cards" | "table";
  /** Guarda columnas visibles, densidad, orden y tamaño de página en `localStorage`. */
  persistKey?: string;

  serverSide?: CnServerSide;

  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyIcon?: string;
  emptyAction?: ReactNode;

  sx?: SxProps<Theme>;
  className?: string;
};
