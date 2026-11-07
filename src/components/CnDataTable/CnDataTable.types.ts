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
  getRowTone?: (row: T) => "error" | "warning" | "success" | "info" | undefined;

  density?: "compact" | "comfortable";
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
