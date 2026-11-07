import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ClearIcon from "@mui/icons-material/Clear";
import DensityLargeIcon from "@mui/icons-material/DensityLarge";
import DensityMediumIcon from "@mui/icons-material/DensityMedium";
import DensitySmallIcon from "@mui/icons-material/DensitySmall";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import LinearProgress from "@mui/material/LinearProgress";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import TablePagination from "@mui/material/TablePagination";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type {
  ColumnDef,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { DragEvent, MouseEvent } from "react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mergeSx } from "../../utils/field-styles";
import { normalizeSearchText } from "../CnAutocompleteField";
import { CnButton } from "../CnButton";
import type { CnConfirmOptions } from "../CnConfirmDialog";
import { CnConfirmDialog } from "../CnConfirmDialog";
import { CnEmptyState } from "../CnEmptyState";
import { getNestedValue } from "../CnForm/CnForm.helpers";
import { CnIcon } from "../CnIcon";
import { CnSkeleton } from "../CnSkeleton";
import { formatCellText, renderTypedCell } from "./cells";
import type {
  CnAggregate,
  CnColumn,
  CnDataTableProps,
  CnRow,
  CnRowAction,
  CnSortItem,
  CnTableQuery,
} from "./CnDataTable.types";
import type { CnExportColumn, CnExportFormat, CnExportRow } from "./export";
import { copyRows, exportRows, printRows } from "./export";

// ─── Constantes ───────────────────────────────────────────────────────────

const FORMATS: Record<CnExportFormat, { label: string; description: string; icon: string }> = {
  xls: { label: "Excel", description: "Hoja de cálculo (.xls)", icon: "table_view" },
  csv: { label: "CSV", description: "Valores separados por comas", icon: "dataset" },
  tsv: { label: "TSV", description: "Valores separados por tabuladores", icon: "view_list" },
  json: { label: "JSON", description: "Estructura de datos JSON", icon: "data_object" },
};

const COPY_FORMATS = [
  {
    id: "tsv" as const,
    label: "Tabla",
    description: "Se pega como tabla en Excel o Sheets",
    icon: "table_rows",
  },
  {
    id: "markdown" as const,
    label: "Markdown",
    description: "Para documentación o tickets",
    icon: "notes",
  },
  { id: "json" as const, label: "JSON", description: "Estructura de datos", icon: "data_object" },
];

const AGGREGATE_LABELS: Record<CnAggregate, string> = {
  sum: "Suma total",
  avg: "Promedio",
  min: "Mínimo",
  max: "Máximo",
  count: "Conteo total",
};

const DENSITY = {
  compact: { y: 6, label: "Compacta", next: "comfortable" as const },
  comfortable: { y: 10, label: "Cómoda", next: "spacious" as const },
  spacious: { y: 16, label: "Amplia", next: "compact" as const },
};

const TONES = {
  error: "rgba(214, 60, 60, 0.06)",
  warning: "rgba(196, 132, 16, 0.07)",
  success: "rgba(34, 135, 64, 0.06)",
  info: "rgba(34, 100, 159, 0.06)",
};

const DEFAULT_WIDTH: Partial<Record<string, number>> = {
  id: 150,
  code: 180,
  rfc: 220,
  curp: 280,
  number: 140,
  currency: 200,
  percent: 140,
  progress: 170,
  date: 200,
  datetime: 230,
  time: 140,
  duration: 140,
  boolean: 170,
  status: 170,
  tags: 230,
  avatar: 240,
  email: 280,
  phone: 210,
  link: 190,
  location: 240,
  image: 100,
  rating: 140,
};

const LEAD_SELECT = 48;
const LEAD_EXPAND = 44;

type Scope = "all" | "page" | "selected";

// ─── Persistencia ─────────────────────────────────────────────────────────

type Stored = {
  visibility?: VisibilityState;
  density?: "compact" | "comfortable" | "spacious";
  pageSize?: number;
  sorting?: SortingState;
  order?: ColumnOrderState;
  sizing?: ColumnSizingState;
  pinning?: ColumnPinningState;
};

const readStore = (key: string | undefined): Stored => {
  if (!key || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`cnDataTable.${key}`);
    return raw ? (JSON.parse(raw) as Stored) : {};
  } catch {
    return {};
  }
};

const writeStore = (key: string | undefined, value: Stored) => {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`cnDataTable.${key}`, JSON.stringify(value));
  } catch {
    // Almacenamiento no disponible (modo privado): se ignora.
  }
};

// ─── Valores ──────────────────────────────────────────────────────────────

const valueOf = <T extends CnRow>(column: CnColumn<T>, row: T): unknown =>
  column.accessor ? column.accessor(row) : getNestedValue(row, column.id);

/** Texto plano de la celda: búsqueda, filtros y exportación. */
const textOf = <T extends CnRow>(column: CnColumn<T>, row: T): string => {
  const value = valueOf(column, row);
  if (column.exportValue) {
    const exported = column.exportValue(value, row);
    return exported === null || exported === undefined ? "" : String(exported);
  }
  return formatCellText(column.type ?? "text", value, row, column.cellOptions);
};

const aggregate = <T extends CnRow>(column: CnColumn<T>, rows: T[]): number | null => {
  if (!column.aggregate) return null;
  if (column.aggregate === "count") return rows.length;
  const numbers = rows.map((row) => Number(valueOf(column, row))).filter((n) => Number.isFinite(n));
  if (numbers.length === 0) return null;
  switch (column.aggregate) {
    case "sum":
      return numbers.reduce((a, b) => a + b, 0);
    case "avg":
      return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    case "min":
      return Math.min(...numbers);
    case "max":
      return Math.max(...numbers);
    default:
      return null;
  }
};

const headerText = <T extends CnRow>(column: CnColumn<T>) =>
  typeof column.header === "string" ? column.header : column.id;

// ─── Estilos compartidos ──────────────────────────────────────────────────

const toolbarIconSx = {
  color: "var(--cn-color-neutral-700, #3a4048)",
  "&:hover": { backgroundColor: "rgba(37, 77, 135, 0.08)" },
};

const outlinedToolbarButtonSx = {
  height: 32,
  px: "10px",
  textTransform: "none" as const,
};

/**
 * Tabla de datos con el lenguaje visual de Canek: celdas tipadas en píldora con
 * copiar, barra Descargar/Copiar/Imprimir, búsqueda sin acentos, filtros por
 * columna, orden múltiple, columnas que se mueven, redimensionan y fijan,
 * densidad, pantalla completa, selección con acciones masivas, acciones por
 * fila con confirmación, detalle expandible, totales, modo servidor,
 * preferencias persistentes y vista de tarjetas en móvil.
 */
export const CnDataTable = <T extends CnRow>({
  data,
  columns,
  getRowId,
  title,
  description,
  loading = false,
  error,
  toolbarActions,
  searchable = true,
  searchPlaceholder = "Buscar en todas las columnas…",
  columnFilters: columnFiltersEnabled = false,
  columnToggle = true,
  densityToggle = true,
  exportFormats = ["xls", "csv", "tsv", "json"],
  copyable = true,
  exportFilename,
  fetchAllRows,
  hideToolbar = false,
  sortable = true,
  defaultSort = [],
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  selectable = false,
  selectedIds,
  onSelectionChange,
  bulkActions,
  rowActions,
  rowActionsPosition = "end",
  onRowClick,
  renderDetail,
  getRowTone,
  density: densityProp = "comfortable",
  striped = false,
  hoverable = true,
  stickyHeader = false,
  maxHeight,
  mobileLayout = "cards",
  persistKey,
  serverSide,
  selectionToggle = false,
  printable = true,
  fullscreenToggle = true,
  columnReorder = true,
  columnResize = true,
  emptyTitle = "Sin registros",
  emptyDescription = "No hay información para mostrar.",
  emptyIcon = "inbox",
  emptyAction,
  sx,
  className,
}: CnDataTableProps<T>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const cardsMode = isMobile && mobileLayout === "cards";

  const stored = useMemo(() => readStore(persistKey), [persistKey]);
  const initialVisibility = useMemo(() => {
    const base: VisibilityState = {};
    for (const column of columns) if (column.hidden) base[column.id] = false;
    return base;
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const initialPinning = useMemo<ColumnPinningState>(
    () => ({ left: columns.filter((c) => c.sticky).map((c) => c.id), right: [] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [visibility, setVisibility] = useState<VisibilityState>(
    stored.visibility ?? initialVisibility,
  );
  const [density, setDensity] = useState(stored.density ?? densityProp);
  const [sorting, setSorting] = useState<SortingState>(stored.sorting ?? defaultSort);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(stored.order ?? []);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(stored.sizing ?? {});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    stored.pinning ?? initialPinning,
  );
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(columnFiltersEnabled);
  const [paginationState, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: stored.pageSize ?? initialPageSize,
  });
  const [internalSelection, setInternalSelection] = useState<RowSelectionState>({});
  const [selectionVisible, setSelectionVisible] = useState(!selectionToggle);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    options: CnConfirmOptions;
    run: () => void | Promise<unknown>;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  useEffect(() => {
    writeStore(persistKey, {
      visibility,
      density,
      pageSize: paginationState.pageSize,
      sorting,
      order: columnOrder,
      sizing: columnSizing,
      pinning: columnPinning,
    });
  }, [
    columnOrder,
    columnPinning,
    columnSizing,
    density,
    paginationState.pageSize,
    persistKey,
    sorting,
    visibility,
  ]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFullscreen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const rowIdOf = useCallback(
    (row: T, index: number) => {
      if (getRowId) return getRowId(row, index);
      const id = (row as { id?: unknown }).id;
      return id !== undefined && id !== null ? String(id) : `row-${index}`;
    },
    [getRowId],
  );

  const selection = useMemo<RowSelectionState>(() => {
    if (!selectedIds) return internalSelection;
    return Object.fromEntries(selectedIds.map((id) => [id, true]));
  }, [internalSelection, selectedIds]);

  const columnsById = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  // ─── Motor ────────────────────────────────────────────────────────────
  const columnDefs = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        accessorFn: (row: T) => valueOf(column, row),
        header: () => column.header,
        size:
          typeof column.width === "number"
            ? column.width
            : (DEFAULT_WIDTH[column.type ?? "text"] ?? 190),
        minSize: column.minWidth ?? 90,
        maxSize: 900,
        enableResizing: columnResize && column.resizable !== false,
        enableSorting: sortable && column.sortable !== false,
        sortDescFirst: false,
        enableHiding: column.hideable !== false,
        enableColumnFilter: column.filterable !== false,
        enablePinning: true,
        sortingFn: (a, b) => {
          const va = valueOf(column, a.original);
          const vb = valueOf(column, b.original);
          if (va === vb) return 0;
          if (va === null || va === undefined || va === "") return 1;
          if (vb === null || vb === undefined || vb === "") return -1;
          const na = Number(va);
          const nb = Number(vb);
          if (typeof va !== "boolean" && Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
          return String(va).localeCompare(String(vb), "es", { numeric: true, sensitivity: "base" });
        },
        filterFn: (row, _id, needle: string) => {
          if (column.filter === "select")
            return String(valueOf(column, row.original) ?? "") === needle;
          return normalizeSearchText(textOf(column, row.original)).includes(
            normalizeSearchText(needle),
          );
        },
      })),
    [columnResize, columns, sortable],
  );

  const isServer = Boolean(serverSide);
  const serverFilters = serverSide?.query.filters;
  const activeFilters = useMemo(
    () => (isServer ? (serverFilters ?? {}) : filters),
    [filters, isServer, serverFilters],
  );
  const columnFiltersState = useMemo(
    () =>
      Object.entries(activeFilters)
        .filter(([, v]) => v)
        .map(([id, value]) => ({ id, value })),
    [activeFilters],
  );

  const emitQuery = (patch: Partial<CnTableQuery>) => {
    if (!serverSide) return;
    serverSide.onQueryChange({ ...serverSide.query, ...patch });
  };

  const table = useReactTable<T>({
    data: data as T[],
    columns: columnDefs,
    getRowId: rowIdOf,
    state: {
      sorting: isServer ? (serverSide?.query.sorting ?? []) : sorting,
      columnVisibility: visibility,
      columnOrder,
      columnSizing,
      columnPinning,
      globalFilter: isServer ? serverSide?.query.search : search,
      columnFilters: columnFiltersState,
      pagination: isServer
        ? { pageIndex: serverSide!.query.pageIndex, pageSize: serverSide!.query.pageSize }
        : paginationState,
      rowSelection: selection,
      expanded,
    },
    columnResizeMode: "onChange",
    manualPagination: isServer,
    manualSorting: isServer,
    manualFiltering: isServer,
    rowCount: serverSide?.rowCount,
    enableMultiSort: true,
    isMultiSortEvent: (event) => (event as MouseEvent).shiftKey,
    enableRowSelection: selectable,
    getRowCanExpand: () => Boolean(renderDetail),
    globalFilterFn: (row, _id, needle: string) => {
      const q = normalizeSearchText(needle ?? "");
      if (!q) return true;
      return columns.some(
        (column) =>
          visibility[column.id] !== false &&
          normalizeSearchText(textOf(column, row.original)).includes(q),
      );
    },
    onSortingChange: (updater) => {
      const prev = isServer ? (serverSide?.query.sorting ?? []) : sorting;
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (isServer) emitQuery({ sorting: next as CnSortItem[], pageIndex: 0 });
      else setSorting(next);
    },
    onColumnVisibilityChange: setVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning,
    onPaginationChange: (updater) => {
      const prev = isServer
        ? { pageIndex: serverSide!.query.pageIndex, pageSize: serverSide!.query.pageSize }
        : paginationState;
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (isServer) emitQuery(next);
      else setPagination(next);
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(selection) : updater;
      if (!selectedIds) setInternalSelection(next);
      const ids = Object.keys(next).filter((id) => next[id]);
      const byId = new Map(data.map((row, index) => [rowIdOf(row, index), row]));
      onSelectionChange?.(ids, ids.map((id) => byId.get(id)).filter(Boolean) as T[]);
    },
    onExpandedChange: setExpanded,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: isServer ? undefined : getSortedRowModel(),
    getFilteredRowModel: isServer ? undefined : getFilteredRowModel(),
    getPaginationRowModel: pagination && !isServer ? getPaginationRowModel() : undefined,
  });

  useEffect(() => {
    if (!isServer) setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filters, isServer, search]);

  const pageCount = table.getPageCount();
  useEffect(() => {
    if (isServer || !pagination) return;
    if (paginationState.pageIndex > 0 && paginationState.pageIndex >= pageCount) {
      setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, pageCount - 1) }));
    }
  }, [isServer, pageCount, pagination, paginationState.pageIndex]);

  // Columnas visibles en el orden actual (fijadas primero).
  const leafColumns = table.getVisibleLeafColumns();
  const visibleColumns = leafColumns.map((c) => columnsById.get(c.id) as CnColumn<T>);
  const filteredRows = table.getFilteredRowModel().rows.map((row) => row.original);
  const pageRows = table.getRowModel().rows;
  const selectedRows = table.getSelectedRowModel().flatRows.map((row) => row.original);
  const totalCount = isServer ? (serverSide?.rowCount ?? 0) : filteredRows.length;
  const allCount = isServer ? (serverSide?.rowCount ?? 0) : data.length;
  const searchValue = isServer ? (serverSide?.query.search ?? "") : search;
  const isFiltered = Boolean(searchValue) || columnFiltersState.length > 0;
  const showSelection = selectable && selectionVisible;

  // ─── Exportación / impresión ──────────────────────────────────────────
  const exportColumns: CnExportColumn[] = visibleColumns.map((column) => ({
    id: column.id,
    header: headerText(column),
  }));
  const toExportRows = (rows: T[]): CnExportRow[] =>
    rows.map((row) => Object.fromEntries(visibleColumns.map((c) => [c.id, textOf(c, row)])));

  const rowsForScope = async (scope: Scope): Promise<T[]> => {
    if (scope === "selected") return selectedRows;
    if (scope === "page") return pageRows.map((row) => row.original);
    if (isServer && fetchAllRows) return fetchAllRows();
    return isServer ? (data as T[]) : filteredRows;
  };

  const baseName =
    exportFilename ??
    (typeof title === "string" ? normalizeSearchText(title).replace(/[^\w]+/g, "-") : "tabla");

  const runExport = async (format: CnExportFormat, scope: Scope) => {
    setBusy(true);
    try {
      const rows = await rowsForScope(scope);
      exportRows(format, exportColumns, toExportRows(rows), baseName);
      setNotice(
        `${rows.length} ${rows.length === 1 ? "registro exportado" : "registros exportados"}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const runCopy = async (format: "tsv" | "json" | "markdown", scope: Scope) => {
    const rows = await rowsForScope(scope);
    const ok = await copyRows(exportColumns, toExportRows(rows), format);
    setNotice(
      ok
        ? `${rows.length} ${rows.length === 1 ? "fila copiada" : "filas copiadas"}`
        : "No se pudo copiar",
    );
  };

  const runPrint = async (scope: Scope) => {
    const rows = await rowsForScope(scope);
    const ok = printRows(
      exportColumns,
      toExportRows(rows),
      typeof title === "string" ? title : "Tabla",
    );
    if (!ok) setNotice("Permite las ventanas emergentes para imprimir");
  };

  // ─── Confirmaciones ───────────────────────────────────────────────────
  const withConfirm = (
    confirm: CnConfirmOptions | undefined,
    run: () => void | Promise<unknown>,
  ) => {
    if (confirm) setConfirmState({ options: confirm, run });
    else void run();
  };
  const runRowAction = (action: CnRowAction<T>, row: T) =>
    withConfirm(typeof action.confirm === "function" ? action.confirm(row) : action.confirm, () =>
      action.onClick(row),
    );

  // ─── Menús ────────────────────────────────────────────────────────────
  type MenuState =
    | { kind: "columns" | "export" | "copy" | "print"; anchor: HTMLElement }
    | { kind: "scope"; anchor: HTMLElement; action: (scope: Scope) => void; title: string }
    | { kind: "row"; anchor: HTMLElement; row: T }
    | { kind: "column"; anchor: HTMLElement; columnId: string };
  const [menu, setMenu] = useState<MenuState | null>(null);
  const closeMenu = () => setMenu(null);

  const filterInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const setColumnFilter = (id: string, value: string) => {
    if (isServer)
      emitQuery({ filters: { ...serverSide!.query.filters, [id]: value }, pageIndex: 0 });
    else setFilters((prev) => ({ ...prev, [id]: value }));
  };

  const actionsFor = (row: T) => (rowActions ?? []).filter((a) => !a.visible || a.visible(row));
  const hasActions = Boolean(rowActions?.length);

  // ─── Reordenar columnas (arrastrar el asa) ────────────────────────────
  const moveColumn = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const current = columnOrder.length ? [...columnOrder] : columns.map((c) => c.id);
    for (const c of columns) if (!current.includes(c.id)) current.push(c.id);
    const from = current.indexOf(sourceId);
    const to = current.indexOf(targetId);
    current.splice(from, 1);
    current.splice(to, 0, sourceId);
    setColumnOrder(current);
  };

  const resetLayout = () => {
    setColumnOrder([]);
    setColumnSizing({});
    setVisibility(initialVisibility);
    setColumnPinning(initialPinning);
    setSorting(defaultSort);
  };

  // ─── Geometría para columnas fijadas ──────────────────────────────────
  const leadWidth = (showSelection ? LEAD_SELECT : 0) + (renderDetail ? LEAD_EXPAND : 0);
  const pinnedLeftIds = new Set(columnPinning.left ?? []);
  const leftOffset = (columnId: string) => leadWidth + table.getColumn(columnId)!.getStart("left");
  const lastPinned = [...leafColumns].reverse().find((c) => pinnedLeftIds.has(c.id))?.id;

  const padY = DENSITY[density].y;
  const cellPad = `${padY}px 12px`;

  // ─── Render de celdas ─────────────────────────────────────────────────
  const renderCellContent = (column: CnColumn<T>, row: T, index: number) => {
    const value = valueOf(column, row);
    if (column.cell) return column.cell(value, row, index);
    return renderTypedCell(column.type ?? "text", value, row, column.cellOptions);
  };

  const alignOf = (column: CnColumn<T>) => column.align ?? "left";

  const renderActionsCell = (row: T) => {
    const actions = actionsFor(row);
    if (actions.length === 0) return null;
    const inline = actions.filter((a) => a.inline);
    const inMenu = actions.filter((a) => !a.inline);
    return (
      <Box sx={{ display: "flex", justifyContent: "center", gap: "2px" }}>
        {inline.map((action) => (
          <Tooltip key={action.id} title={action.label} arrow>
            <span>
              <IconButton
                size="small"
                aria-label={action.label}
                disabled={action.disabled?.(row)}
                onClick={(event) => {
                  event.stopPropagation();
                  runRowAction(action, row);
                }}
                sx={{
                  color:
                    action.color === "error"
                      ? "var(--cn-color-error-600, #b52f2f)"
                      : "var(--cn-color-brand-600, #254d87)",
                }}
              >
                <CnIcon name={action.icon ?? "more_horiz"} size="sm" />
              </IconButton>
            </span>
          </Tooltip>
        ))}
        {inMenu.length > 0 && (
          <Tooltip title="Opciones" arrow>
            <IconButton
              size="small"
              aria-label="Acciones"
              aria-haspopup="menu"
              onClick={(event) => {
                event.stopPropagation();
                setMenu({ kind: "row", anchor: event.currentTarget, row });
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  const renderFooterValue = (column: CnColumn<T>) => {
    if (column.footer)
      return typeof column.footer === "function" ? column.footer(filteredRows) : column.footer;
    const result = aggregate(column, filteredRows);
    if (result === null) return null;
    const formatted =
      column.aggregate === "count"
        ? result.toLocaleString("es-MX")
        : formatCellText(
            column.type === "currency" || column.type === "percent"
              ? column.type
              : column.type === "progress"
                ? "percent"
                : "number",
            result,
            {},
            column.cellOptions,
          );
    return (
      <Box sx={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
        <Box
          component="span"
          sx={{
            fontSize: "0.62rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--cn-color-text-muted, #6e7682)",
          }}
        >
          {AGGREGATE_LABELS[column.aggregate as CnAggregate]}
        </Box>
        <Box
          component="span"
          sx={{
            fontFamily: "var(--cn-font-mono, ui-monospace, monospace)",
            fontSize: "0.82rem",
            fontWeight: 800,
            color: "var(--cn-color-brand-700, #1c3d6d)",
          }}
        >
          {formatted}
        </Box>
      </Box>
    );
  };

  // ─── Opciones de filtro "select" ──────────────────────────────────────
  const selectOptions = (column: CnColumn<T>): { value: string; label: string }[] => {
    const map = column.cellOptions?.statusMap;
    if (map) {
      return Object.entries(map).map(([value, option]) => ({
        value,
        label: typeof option.label === "string" ? option.label : value,
      }));
    }
    if (column.type === "boolean") {
      return [
        { value: "true", label: String(column.cellOptions?.trueLabel ?? "Sí") },
        { value: "false", label: String(column.cellOptions?.falseLabel ?? "No") },
      ];
    }
    const seen = new Map<string, string>();
    for (const row of data) {
      const raw = valueOf(column, row);
      if (raw === null || raw === undefined || raw === "") continue;
      seen.set(String(raw), textOf(column, row));
      if (seen.size > 50) break;
    }
    return [...seen.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  };

  // ─── Barra superior ───────────────────────────────────────────────────
  const exportEnabled = exportFormats !== false && exportFormats.length > 0;
  const openScope = (anchor: HTMLElement, titleText: string, action: (scope: Scope) => void) =>
    setMenu({ kind: "scope", anchor, title: titleText, action });

  const caption = (title || description) && (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "12px",
        px: "4px",
        pb: "8px",
        mb: "12px",
        borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {title && (
          <Typography
            component="h2"
            sx={{
              m: 0,
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--cn-color-neutral-700, #3a4048)",
            }}
          >
            {title}
          </Typography>
        )}
        {description && (
          <Typography
            sx={{ fontSize: "0.72rem", color: "var(--cn-color-text-muted, #6e7682)", mt: "2px" }}
          >
            {description}
          </Typography>
        )}
      </Box>
      <Typography
        sx={{
          flexShrink: 0,
          fontSize: "0.68rem",
          fontWeight: 500,
          color: "var(--cn-color-text-muted, #6e7682)",
        }}
      >
        {loading && allCount === 0
          ? "Cargando…"
          : isFiltered && !isServer
            ? `${totalCount.toLocaleString("es-MX")} de ${allCount.toLocaleString("es-MX")} registros`
            : `${totalCount.toLocaleString("es-MX")} ${totalCount === 1 ? "registro" : "registros"}`}
      </Typography>
    </Box>
  );

  const selectionCount = selectedRows.length;

  const toolbar = !hideToolbar && (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        px: "12px",
        py: "10px",
        minHeight: 56,
        borderBottom: "1px solid var(--cn-color-border-subtle, #eceef1)",
      }}
    >
      {selectable && selectionToggle && (
        <Tooltip
          title={selectionVisible ? "Ocultar selección de filas" : "Seleccionar filas"}
          arrow
        >
          <Checkbox
            size="small"
            checked={selectionVisible}
            onChange={() => {
              if (selectionVisible) table.resetRowSelection();
              setSelectionVisible((prev) => !prev);
            }}
            slotProps={{ input: { "aria-label": "Mostrar selección de filas" } }}
          />
        </Tooltip>
      )}

      {selectionCount > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
          <Box
            component="span"
            sx={{
              px: "10px",
              py: "4px",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--cn-color-brand-700, #1c3d6d)",
              backgroundColor: "rgba(37, 77, 135, 0.1)",
            }}
          >
            {selectionCount} {selectionCount === 1 ? "seleccionado" : "seleccionados"}
          </Box>
          {bulkActions?.map((action) => (
            <CnButton
              key={action.id}
              size="small"
              variant="outlined"
              color={action.color ?? "primary"}
              startIcon={action.icon}
              sx={outlinedToolbarButtonSx}
              onClick={() =>
                withConfirm(
                  typeof action.confirm === "function"
                    ? action.confirm(selectedRows)
                    : action.confirm,
                  async () => {
                    await action.onClick(selectedRows);
                    table.resetRowSelection();
                  },
                )
              }
            >
              {action.label}
            </CnButton>
          ))}
          <CnButton
            size="small"
            variant="text"
            color="neutral"
            onClick={() => table.resetRowSelection()}
          >
            Quitar selección
          </CnButton>
        </Box>
      ) : (
        (exportEnabled || copyable || printable) && (
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            {exportEnabled && (
              <CnButton
                size="small"
                variant="outlined"
                startIcon="browser_updated"
                disabled={busy || totalCount === 0}
                sx={outlinedToolbarButtonSx}
                aria-haspopup="menu"
                onClick={(event) => setMenu({ kind: "export", anchor: event.currentTarget })}
              >
                Descargar
              </CnButton>
            )}
            {copyable && (
              <CnButton
                size="small"
                variant="outlined"
                startIcon="copy_all"
                disabled={totalCount === 0}
                sx={outlinedToolbarButtonSx}
                aria-haspopup="menu"
                onClick={(event) => setMenu({ kind: "copy", anchor: event.currentTarget })}
              >
                Copiar
              </CnButton>
            )}
            {printable && !isMobile && (
              <CnButton
                size="small"
                variant="outlined"
                startIcon="print"
                disabled={totalCount === 0}
                sx={outlinedToolbarButtonSx}
                onClick={(event) =>
                  openScope(event.currentTarget, "Imprimir", (scope) => void runPrint(scope))
                }
              >
                Imprimir
              </CnButton>
            )}
          </Box>
        )
      )}

      <Box sx={{ flex: 1 }} />

      {searchable && (
        <InputBase
          value={searchValue}
          onChange={(event) => {
            if (isServer) emitQuery({ search: event.target.value, pageIndex: 0 });
            else setSearch(event.target.value);
          }}
          placeholder={searchPlaceholder}
          inputProps={{ "aria-label": "Buscar en la tabla" }}
          startAdornment={
            <SearchIcon
              sx={{ fontSize: 20, color: "var(--cn-color-neutral-500, #6e7682)", mr: "6px" }}
            />
          }
          endAdornment={
            searchValue ? (
              <IconButton
                size="small"
                aria-label="Limpiar búsqueda"
                onClick={() => (isServer ? emitQuery({ search: "", pageIndex: 0 }) : setSearch(""))}
              >
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            ) : undefined
          }
          sx={{
            order: { xs: 10, md: 0 },
            flex: { xs: "1 1 100%", md: "0 1 280px" },
            height: 34,
            px: "10px",
            fontSize: "0.82rem",
            borderRadius: "999px",
            backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            transition:
              "border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease",
            "&.Mui-focused": {
              backgroundColor: "var(--cn-color-surface, #fff)",
              borderColor: "var(--cn-color-brand-500, #3562a6)",
              boxShadow: "0 0 0 3px rgba(53, 98, 166, 0.15)",
            },
          }}
        />
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
        {columns.some((c) => c.filterable !== false) && !cardsMode && (
          <Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"} arrow>
            <IconButton
              aria-label="Filtros por columna"
              aria-pressed={showFilters}
              onClick={() => setShowFilters((prev) => !prev)}
              sx={{
                ...toolbarIconSx,
                ...(showFilters && { color: "var(--cn-color-brand-600, #254d87)" }),
              }}
            >
              {showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
            </IconButton>
          </Tooltip>
        )}
        {columnToggle && (
          <Tooltip title="Mostrar/ocultar columnas" arrow>
            <IconButton
              aria-label="Columnas visibles"
              aria-haspopup="menu"
              onClick={(event) => setMenu({ kind: "columns", anchor: event.currentTarget })}
              sx={toolbarIconSx}
            >
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>
        )}
        {densityToggle && !cardsMode && (
          <Tooltip title={`Densidad: ${DENSITY[density].label}`} arrow>
            <IconButton
              aria-label="Cambiar densidad"
              onClick={() => setDensity(DENSITY[density].next)}
              sx={toolbarIconSx}
            >
              {density === "compact" ? (
                <DensitySmallIcon />
              ) : density === "comfortable" ? (
                <DensityMediumIcon />
              ) : (
                <DensityLargeIcon />
              )}
            </IconButton>
          </Tooltip>
        )}
        {fullscreenToggle && !isMobile && (
          <Tooltip title={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"} arrow>
            <IconButton
              aria-label="Pantalla completa"
              aria-pressed={fullscreen}
              onClick={() => setFullscreen((prev) => !prev)}
              sx={toolbarIconSx}
            >
              {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {toolbarActions && (
        <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{toolbarActions}</Box>
      )}
    </Box>
  );

  // ─── Encabezado ───────────────────────────────────────────────────────
  const stickyCell = (left: number, z = 2) => ({
    position: "sticky" as const,
    left,
    zIndex: z,
    backgroundColor: "var(--cn-color-surface, #ffffff)",
  });

  const headCellBase = {
    position: "relative" as const,
    boxSizing: "border-box" as const,
    textAlign: "left" as const,
    verticalAlign: "top",
    padding: "10px 12px 8px",
    borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
    backgroundColor: "var(--cn-color-surface, #ffffff)",
    color: "var(--cn-color-neutral-800, #2d333a)",
  };

  const isEmptyResult = !loading && pageRows.length === 0;
  const emptyNode = (
    <CnEmptyState
      icon={isFiltered ? "search_off" : emptyIcon}
      title={isFiltered ? "Sin resultados" : emptyTitle}
      description={isFiltered ? "Prueba con otra búsqueda o quita los filtros." : emptyDescription}
      action={
        isFiltered ? (
          <CnButton
            size="small"
            variant="outlined"
            color="neutral"
            onClick={() => {
              if (isServer) emitQuery({ search: "", filters: {}, pageIndex: 0 });
              else {
                setSearch("");
                setFilters({});
              }
            }}
          >
            Limpiar búsqueda y filtros
          </CnButton>
        ) : (
          emptyAction
        )
      }
      size="sm"
    />
  );

  const totalCols =
    (showSelection ? 1 : 0) + (renderDetail ? 1 : 0) + visibleColumns.length + (hasActions ? 1 : 0);
  const showFooter =
    !loading && !isEmptyResult && visibleColumns.some((c) => c.aggregate || c.footer);
  const tableWidth = leadWidth + table.getTotalSize() + (hasActions ? 88 : 0);

  const headerCells = table.getHeaderGroups()[0].headers.map((header) => {
    const column = columnsById.get(header.column.id) as CnColumn<T>;
    const sorted = header.column.getIsSorted();
    const canSort = header.column.getCanSort();
    const pinned = pinnedLeftIds.has(column.id);
    const sortIndex = header.column.getSortIndex();
    const filterValue = activeFilters[column.id] ?? "";
    return (
      <Box
        component="th"
        key={header.id}
        scope="col"
        aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
        onDragOver={(event: DragEvent) => {
          if (!dragging || dragging === column.id) return;
          event.preventDefault();
          setDropTarget(column.id);
        }}
        onDragLeave={() => setDropTarget((prev) => (prev === column.id ? null : prev))}
        onDrop={(event: DragEvent) => {
          event.preventDefault();
          if (dragging) moveColumn(dragging, column.id);
          setDragging(null);
          setDropTarget(null);
        }}
        sx={{
          ...headCellBase,
          width: header.getSize(),
          minWidth: header.getSize(),
          maxWidth: header.getSize(),
          ...(pinned && { ...stickyCell(leftOffset(column.id), 4) }),
          ...(pinned &&
            lastPinned === column.id && { boxShadow: "4px 0 6px -4px rgba(17,20,24,0.18)" }),
          ...(dropTarget === column.id && {
            boxShadow: "inset 3px 0 0 var(--cn-color-brand-500, #3562a6)",
          }),
          opacity: dragging === column.id ? 0.5 : 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px", minHeight: 24 }}>
          <Box
            component={canSort ? "button" : "span"}
            type={canSort ? "button" : undefined}
            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
            title={canSort ? "Ordenar (Shift + clic para varias columnas)" : undefined}
            sx={{
              ...(canSort && { all: "unset", cursor: "pointer" }),
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              minWidth: 0,
              flex: 1,
              borderRadius: "4px",
              "&:focus-visible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
              "&:hover .cn-sort-icon": { opacity: 1 },
            }}
          >
            {pinned && (
              <PushPinOutlinedIcon
                sx={{
                  fontSize: 13,
                  color: "var(--cn-color-brand-500, #3562a6)",
                  transform: "rotate(45deg)",
                }}
              />
            )}
            <Box
              component="span"
              sx={{
                fontSize: "0.8rem",
                fontWeight: 800,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "var(--cn-color-neutral-800, #2d333a)",
              }}
            >
              {column.header}
            </Box>
            {canSort && (
              <Box
                component="span"
                className="cn-sort-icon"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  flexShrink: 0,
                  opacity: sorted ? 1 : 0.4,
                  color: sorted
                    ? "var(--cn-color-brand-600, #254d87)"
                    : "var(--cn-color-neutral-500, #6e7682)",
                }}
              >
                {sorted === "asc" ? (
                  <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                ) : sorted === "desc" ? (
                  <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                ) : (
                  <SwapVertIcon sx={{ fontSize: 16 }} />
                )}
                {sorted &&
                  sortIndex >= 0 &&
                  (isServer ? (serverSide?.query.sorting.length ?? 0) : sorting.length) > 1 && (
                    <Box component="span" sx={{ fontSize: 9, fontWeight: 800, ml: "1px" }}>
                      {sortIndex + 1}
                    </Box>
                  )}
              </Box>
            )}
          </Box>
          {columnReorder && !pinned && (
            <Tooltip title="Arrastra para mover" arrow>
              <Box
                component="span"
                role="button"
                tabIndex={-1}
                aria-label="Mover columna"
                draggable
                onDragStart={(event: DragEvent) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", column.id);
                  setDragging(column.id);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setDropTarget(null);
                }}
                sx={{
                  display: "inline-flex",
                  cursor: "grab",
                  color: "var(--cn-color-neutral-500, #6e7682)",
                  opacity: 0.7,
                  p: "2px",
                  "&:hover": { opacity: 1 },
                  "&:active": { cursor: "grabbing" },
                }}
              >
                <DragHandleIcon sx={{ fontSize: 18 }} />
              </Box>
            </Tooltip>
          )}
          <IconButton
            size="small"
            aria-label="Opciones de columna"
            aria-haspopup="menu"
            onClick={(event) =>
              setMenu({ kind: "column", anchor: event.currentTarget, columnId: column.id })
            }
            sx={{ p: "2px", color: "var(--cn-color-neutral-500, #6e7682)" }}
          >
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {showFilters && (
          <Box sx={{ mt: "6px", minHeight: 30 }}>
            {column.filterable !== false &&
              (column.filter === "select" ? (
                <Box
                  component="select"
                  aria-label={`Filtrar ${headerText(column)}`}
                  value={filterValue}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    setColumnFilter(column.id, event.target.value)
                  }
                  sx={{
                    width: "100%",
                    height: 30,
                    border: 0,
                    borderBottom: "1px solid var(--cn-color-neutral-400, #9aa1aa)",
                    background: "transparent",
                    fontFamily: "inherit",
                    fontSize: "0.8rem",
                    color: filterValue
                      ? "var(--cn-color-text, #222831)"
                      : "var(--cn-color-text-subtle, #9aa1aa)",
                    outline: "none",
                    "&:focus": { borderBottom: "2px solid var(--cn-color-brand-500, #3562a6)" },
                  }}
                >
                  <option value="">Todos</option>
                  {selectOptions(column).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Box>
              ) : (
                <InputBase
                  inputRef={(node: HTMLInputElement | null) => {
                    filterInputs.current[column.id] = node;
                  }}
                  value={filterValue}
                  onChange={(event) => setColumnFilter(column.id, event.target.value)}
                  placeholder={`Filtrar por ${headerText(column)}`}
                  inputProps={{ "aria-label": `Filtrar ${headerText(column)}` }}
                  endAdornment={
                    filterValue ? (
                      <IconButton
                        size="small"
                        aria-label="Limpiar filtro"
                        onClick={() => setColumnFilter(column.id, "")}
                        sx={{ p: "2px" }}
                      >
                        <ClearIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    ) : undefined
                  }
                  sx={{
                    width: "100%",
                    height: 30,
                    fontSize: "0.8rem",
                    borderBottom: "1px solid var(--cn-color-neutral-400, #9aa1aa)",
                    transition: "border-color 140ms ease",
                    "&.Mui-focused": {
                      borderBottom: "2px solid var(--cn-color-brand-500, #3562a6)",
                    },
                    "& input::placeholder": {
                      color: "var(--cn-color-text-subtle, #9aa1aa)",
                      opacity: 1,
                    },
                  }}
                />
              ))}
          </Box>
        )}

        {header.column.getCanResize() && (
          <Box
            role="separator"
            aria-orientation="vertical"
            aria-label={`Redimensionar ${headerText(column)}`}
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            onDoubleClick={() => header.column.resetSize()}
            sx={{
              position: "absolute",
              top: 10,
              bottom: 10,
              right: 0,
              width: 7,
              cursor: "col-resize",
              userSelect: "none",
              touchAction: "none",
              display: "flex",
              justifyContent: "center",
              "&::after": {
                content: '""',
                width: 3,
                borderRadius: 2,
                backgroundColor: header.column.getIsResizing()
                  ? "var(--cn-color-brand-500, #3562a6)"
                  : "var(--cn-color-neutral-200, #dde0e4)",
                transition: "background-color 140ms ease",
              },
              "&:hover::after": { backgroundColor: "var(--cn-color-brand-400, #5081c4)" },
            }}
          />
        )}
      </Box>
    );
  });

  // ─── Cuerpo ───────────────────────────────────────────────────────────
  const bodyRowSx = (index: number, selected: boolean, tone?: keyof typeof TONES) => ({
    cursor: onRowClick ? "pointer" : undefined,
    backgroundColor: selected
      ? "rgba(37, 77, 135, 0.06)"
      : tone
        ? TONES[tone]
        : striped && index % 2 === 1
          ? "var(--cn-color-neutral-50, #fafbfc)"
          : "var(--cn-color-surface, #ffffff)",
    transition: "background-color 120ms ease",
    "& > td": {
      boxSizing: "border-box" as const,
      padding: cellPad,
      fontSize: "0.82rem",
      color: "var(--cn-color-text, #222831)",
      borderBottom: "1px solid var(--cn-color-border-subtle, #f0f1f3)",
      verticalAlign: "middle",
      backgroundColor: "inherit",
    },
    "&:hover .cn-cell-copy": { opacity: 0.75 },
    ...(hoverable && {
      "&:hover": {
        backgroundColor: selected
          ? "rgba(37, 77, 135, 0.09)"
          : "var(--cn-color-neutral-50, #f7f8fa)",
      },
    }),
    "&:focus-visible": {
      outline: "2px solid var(--cn-color-brand-400, #5081c4)",
      outlineOffset: -2,
    },
  });

  const tableView = (
    <Box
      sx={{
        position: "relative",
        overflow: "auto",
        maxHeight: fullscreen ? "calc(100vh - 190px)" : maxHeight,
        scrollbarWidth: "thin",
        scrollbarColor: "var(--cn-color-neutral-300, #c4c9cf) transparent",
      }}
    >
      {loading && pageRows.length > 0 && (
        <LinearProgress
          sx={{ position: "sticky", top: 0, left: 0, zIndex: 6, height: 2 }}
          aria-label="Actualizando"
        />
      )}
      <Box
        component="table"
        aria-busy={loading || undefined}
        aria-rowcount={totalCount}
        sx={{
          width: "100%",
          minWidth: tableWidth,
          tableLayout: "fixed",
          borderCollapse: "separate",
          borderSpacing: 0,
          fontFamily: "inherit",
        }}
      >
        <Box
          component="thead"
          sx={{
            ...((stickyHeader || maxHeight || fullscreen) && {
              position: "sticky",
              top: 0,
              zIndex: 5,
            }),
          }}
        >
          <tr>
            {showSelection && (
              <Box
                component="th"
                sx={{
                  ...headCellBase,
                  ...stickyCell(0, 4),
                  width: LEAD_SELECT,
                  padding: "8px 0 0 6px",
                }}
              >
                <Checkbox
                  size="small"
                  checked={table.getIsAllPageRowsSelected()}
                  indeterminate={table.getIsSomePageRowsSelected()}
                  onChange={table.getToggleAllPageRowsSelectedHandler()}
                  slotProps={{
                    input: { "aria-label": "Seleccionar todas las filas de la página" },
                  }}
                />
              </Box>
            )}
            {renderDetail && (
              <Box
                component="th"
                aria-label="Detalle"
                sx={{
                  ...headCellBase,
                  ...stickyCell(showSelection ? LEAD_SELECT : 0, 4),
                  width: LEAD_EXPAND,
                }}
              />
            )}
            {hasActions && rowActionsPosition === "start" && (
              <Box component="th" sx={{ ...headCellBase, width: 88, textAlign: "center" }}>
                <Box component="span" sx={{ fontSize: "0.8rem", fontWeight: 800 }}>
                  Acciones
                </Box>
              </Box>
            )}
            {headerCells}
            {hasActions && rowActionsPosition === "end" && (
              <Box component="th" sx={{ ...headCellBase, width: 88, textAlign: "center" }}>
                <Box component="span" sx={{ fontSize: "0.8rem", fontWeight: 800 }}>
                  Acciones
                </Box>
              </Box>
            )}
          </tr>
        </Box>
        <tbody>
          {loading &&
            pageRows.length === 0 &&
            Array.from({ length: Math.min(paginationState.pageSize, 6) }, (_, i) => (
              <Box component="tr" key={`sk-${i}`} sx={bodyRowSx(i, false)}>
                {Array.from({ length: totalCols }, (_, j) => (
                  <td key={j}>
                    <CnSkeleton
                      variant={j % 3 === 1 ? "rounded" : "text"}
                      width={j % 3 === 1 ? 110 : "65%"}
                      height={j % 3 === 1 ? 26 : undefined}
                    />
                  </td>
                ))}
              </Box>
            ))}
          {isEmptyResult && (
            <tr>
              <Box component="td" colSpan={totalCols} sx={{ py: "32px", borderBottom: 0 }}>
                <Box sx={{ position: "sticky", left: 0, width: "min(100%, 100vw - 64px)" }}>
                  {emptyNode}
                </Box>
              </Box>
            </tr>
          )}
          {pageRows.map((row, index) => {
            const original = row.original;
            const isExpanded = row.getIsExpanded();
            const selected = row.getIsSelected();
            return (
              <Fragment key={row.id}>
                <Box
                  component="tr"
                  data-row-id={row.id}
                  aria-selected={showSelection ? selected : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(original) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event: React.KeyboardEvent) => {
                          if (event.key === "Enter" && event.target === event.currentTarget)
                            onRowClick(original);
                        }
                      : undefined
                  }
                  sx={{
                    ...bodyRowSx(index, selected, getRowTone?.(original)),
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {showSelection && (
                    <Box
                      component="td"
                      onClick={(event: MouseEvent) => event.stopPropagation()}
                      sx={{
                        ...stickyCell(0, 2),
                        backgroundColor: "inherit !important",
                        padding: "0 0 0 6px !important",
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={selected}
                        onChange={row.getToggleSelectedHandler()}
                        slotProps={{ input: { "aria-label": `Seleccionar fila ${index + 1}` } }}
                      />
                    </Box>
                  )}
                  {renderDetail && (
                    <Box
                      component="td"
                      onClick={(event: MouseEvent) => event.stopPropagation()}
                      sx={{
                        ...stickyCell(showSelection ? LEAD_SELECT : 0, 2),
                        backgroundColor: "inherit !important",
                        padding: "0 0 0 4px !important",
                      }}
                    >
                      <IconButton
                        size="small"
                        aria-label={isExpanded ? "Ocultar detalle" : "Ver detalle"}
                        aria-expanded={isExpanded}
                        onClick={row.getToggleExpandedHandler()}
                      >
                        <ChevronRightIcon
                          fontSize="small"
                          sx={{
                            transform: isExpanded ? "rotate(90deg)" : "none",
                            transition: "transform 160ms ease",
                          }}
                        />
                      </IconButton>
                    </Box>
                  )}
                  {hasActions && rowActionsPosition === "start" && (
                    <td>{renderActionsCell(original)}</td>
                  )}
                  {row.getVisibleCells().map((cell) => {
                    const column = columnsById.get(cell.column.id) as CnColumn<T>;
                    const pinned = pinnedLeftIds.has(column.id);
                    return (
                      <Box
                        component="td"
                        key={cell.id}
                        sx={{
                          textAlign: alignOf(column),
                          overflow: "hidden",
                          ...(pinned && {
                            ...stickyCell(leftOffset(column.id), 2),
                            backgroundColor: "inherit !important",
                          }),
                          ...(pinned &&
                            lastPinned === column.id && {
                              boxShadow: "4px 0 6px -4px rgba(17,20,24,0.18)",
                            }),
                        }}
                      >
                        {renderCellContent(column, original, index)}
                      </Box>
                    );
                  })}
                  {hasActions && rowActionsPosition === "end" && (
                    <td>{renderActionsCell(original)}</td>
                  )}
                </Box>
                {renderDetail && isExpanded && (
                  <tr>
                    <Box
                      component="td"
                      colSpan={totalCols}
                      sx={{
                        p: 0,
                        borderBottom: "1px solid var(--cn-color-border-subtle, #f0f1f3)",
                      }}
                    >
                      <Collapse in appear>
                        <Box
                          sx={{
                            position: "sticky",
                            left: 0,
                            maxWidth: "100vw",
                            p: "14px 20px 18px 56px",
                            backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
                            borderLeft: "3px solid var(--cn-color-brand-500, #3562a6)",
                          }}
                        >
                          {renderDetail(original)}
                        </Box>
                      </Collapse>
                    </Box>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
        {showFooter && (
          <tfoot>
            <tr>
              {Array.from(
                {
                  length:
                    (showSelection ? 1 : 0) +
                    (renderDetail ? 1 : 0) +
                    (hasActions && rowActionsPosition === "start" ? 1 : 0),
                },
                (_, i) => (
                  <Box
                    component="td"
                    key={`fl-${i}`}
                    sx={{
                      backgroundColor: "var(--cn-color-neutral-50, #f7f8fa)",
                      borderTop: "2px solid var(--cn-color-border, #dde0e4)",
                    }}
                  />
                ),
              )}
              {visibleColumns.map((column) => (
                <Box
                  component="td"
                  key={`foot-${column.id}`}
                  sx={{
                    padding: "10px 12px",
                    textAlign: alignOf(column),
                    backgroundColor: "var(--cn-color-neutral-50, #f7f8fa)",
                    borderTop: "2px solid var(--cn-color-border, #dde0e4)",
                    ...(pinnedLeftIds.has(column.id) && stickyCell(leftOffset(column.id), 2)),
                  }}
                >
                  {renderFooterValue(column)}
                </Box>
              ))}
              {hasActions && rowActionsPosition === "end" && (
                <Box
                  component="td"
                  sx={{
                    backgroundColor: "var(--cn-color-neutral-50, #f7f8fa)",
                    borderTop: "2px solid var(--cn-color-border, #dde0e4)",
                  }}
                />
              )}
            </tr>
          </tfoot>
        )}
      </Box>
    </Box>
  );

  const cardsView = (
    <Box
      component="ul"
      aria-busy={loading || undefined}
      sx={{
        listStyle: "none",
        m: 0,
        p: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {loading &&
        pageRows.length === 0 &&
        Array.from({ length: 3 }, (_, i) => (
          <Box component="li" key={i}>
            <CnSkeleton variant="rounded" height={120} />
          </Box>
        ))}
      {isEmptyResult && <Box component="li">{emptyNode}</Box>}
      {pageRows.map((row, index) => {
        const original = row.original;
        const [first, ...rest] = visibleColumns.filter((column) => column.showInCards !== false);
        return (
          <Box
            component="li"
            key={row.id}
            data-row-id={row.id}
            onClick={onRowClick ? () => onRowClick(original) : undefined}
            sx={{
              p: "14px",
              borderRadius: "12px",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              backgroundColor: row.getIsSelected()
                ? "rgba(37, 77, 135, 0.06)"
                : "var(--cn-color-surface, #ffffff)",
              cursor: onRowClick ? "pointer" : undefined,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              "& .cn-cell-copy": { opacity: 0.7 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              {showSelection && (
                <Checkbox
                  size="small"
                  sx={{ p: "2px" }}
                  checked={row.getIsSelected()}
                  onClick={(event) => event.stopPropagation()}
                  onChange={row.getToggleSelectedHandler()}
                  slotProps={{ input: { "aria-label": `Seleccionar fila ${index + 1}` } }}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {first ? renderCellContent(first, original, index) : null}
              </Box>
              {hasActions && (
                <Box onClick={(event) => event.stopPropagation()}>
                  {renderActionsCell(original)}
                </Box>
              )}
            </Box>
            <Box
              component="dl"
              sx={{
                m: 0,
                display: "grid",
                gridTemplateColumns: "minmax(88px, 36%) 1fr",
                gap: "8px 12px",
                alignItems: "center",
              }}
            >
              {rest.map((column) => (
                <Fragment key={column.id}>
                  <Box
                    component="dt"
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "var(--cn-color-text-muted, #6e7682)",
                    }}
                  >
                    {column.header}
                  </Box>
                  <Box component="dd" sx={{ m: 0, minWidth: 0, fontSize: "0.82rem" }}>
                    {renderCellContent(column, original, index)}
                  </Box>
                </Fragment>
              ))}
            </Box>
            {renderDetail && (
              <Box onClick={(event) => event.stopPropagation()}>
                <CnButton
                  size="small"
                  variant="text"
                  color="neutral"
                  endIcon={row.getIsExpanded() ? "expand_less" : "expand_more"}
                  onClick={row.getToggleExpandedHandler()}
                >
                  {row.getIsExpanded() ? "Ocultar detalle" : "Ver detalle"}
                </CnButton>
                <Collapse in={row.getIsExpanded()} unmountOnExit>
                  <Box sx={{ pt: "8px" }}>{renderDetail(original)}</Box>
                </Collapse>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );

  // ─── Menús ────────────────────────────────────────────────────────────
  const menuPaperSx = {
    borderRadius: "12px",
    minWidth: 220,
    boxShadow: "0 10px 30px rgba(17, 20, 24, 0.14)",
    "& .MuiMenuItem-root": {
      fontSize: "0.82rem",
      borderRadius: "8px",
      mx: "6px",
      my: "1px",
      py: "7px",
    },
    "& .MuiListItemIcon-root": { minWidth: 32, color: "var(--cn-color-neutral-600, #4e5660)" },
  };

  const scopeItems = (action: (scope: Scope) => void) =>
    [
      {
        scope: "all" as const,
        label: isFiltered && !isServer ? "Registros filtrados" : "Todos los registros",
        count: totalCount,
        icon: "select_all",
      },
      { scope: "page" as const, label: "Página actual", count: pageRows.length, icon: "article" },
      ...(selectable
        ? [
            {
              scope: "selected" as const,
              label: "Seleccionados",
              count: selectionCount,
              icon: "check_box",
            },
          ]
        : []),
    ].map((item) => (
      <MenuItem
        key={item.scope}
        disabled={item.count === 0}
        onClick={() => {
          closeMenu();
          action(item.scope);
        }}
      >
        <ListItemIcon>
          <CnIcon name={item.icon} size="sm" />
        </ListItemIcon>
        <ListItemText primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 600 }}>
          {item.label}
        </ListItemText>
        <Box
          component="span"
          sx={{
            ml: "12px",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--cn-color-text-muted, #6e7682)",
          }}
        >
          {item.count.toLocaleString("es-MX")}
        </Box>
      </MenuItem>
    ));

  const menuColumn =
    menu?.kind === "column" ? (columnsById.get(menu.columnId) as CnColumn<T>) : undefined;
  const menuTableColumn = menuColumn ? table.getColumn(menuColumn.id) : undefined;

  const wrapperSx = fullscreen
    ? {
        position: "fixed" as const,
        inset: 0,
        zIndex: 1300,
        p: "20px",
        overflow: "auto",
        backgroundColor: "var(--cn-color-background, #f4f6f9)",
      }
    : {};

  return (
    <Box
      className={className}
      data-cn-data-table
      sx={mergeSx(
        { minWidth: 0, fontFamily: "var(--cn-font-sans, system-ui, sans-serif)", ...wrapperSx },
        sx,
      )}
    >
      {caption}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          borderRadius: "12px",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          overflow: "hidden",
        }}
      >
        {toolbar}
        {error && (
          <Box
            role="alert"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              px: "16px",
              py: "10px",
              color: "var(--cn-color-error-700, #922626)",
              backgroundColor: "rgba(214, 60, 60, 0.07)",
              fontSize: "0.8rem",
              borderBottom: "1px solid rgba(214, 60, 60, 0.2)",
            }}
          >
            <CnIcon name="error_outline" size="sm" />
            {error}
          </Box>
        )}
        {cardsMode ? cardsView : tableView}
        {pagination && !isEmptyResult && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
              pl: "16px",
              borderTop: "1px solid var(--cn-color-border-subtle, #eceef1)",
            }}
          >
            <Box sx={{ fontSize: "0.72rem", color: "var(--cn-color-text-muted, #6e7682)" }}>
              {selectionCount > 0
                ? `${selectionCount} de ${totalCount.toLocaleString("es-MX")} seleccionados`
                : null}
            </Box>
            <TablePagination
              component="div"
              count={totalCount}
              page={Math.min(
                table.getState().pagination.pageIndex,
                Math.max(0, Math.ceil(totalCount / table.getState().pagination.pageSize) - 1),
              )}
              rowsPerPage={table.getState().pagination.pageSize}
              rowsPerPageOptions={pageSizeOptions}
              onPageChange={(_, page) => table.setPageIndex(page)}
              onRowsPerPageChange={(event) => {
                table.setPageSize(Number(event.target.value));
                table.setPageIndex(0);
              }}
              labelRowsPerPage={isMobile ? "Filas" : "Filas por página"}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count.toLocaleString("es-MX")}`
              }
              getItemAriaLabel={(type) =>
                type === "first"
                  ? "Primera página"
                  : type === "last"
                    ? "Última página"
                    : type === "next"
                      ? "Página siguiente"
                      : "Página anterior"
              }
              showFirstButton={!isMobile && pageCount > 3}
              showLastButton={!isMobile && pageCount > 3}
              sx={{
                border: 0,
                "& .MuiTablePagination-toolbar": { minHeight: 52 },
                "& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel": {
                  fontSize: "0.82rem",
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Descargar */}
      <Menu
        open={menu?.kind === "export"}
        anchorEl={menu?.anchor}
        onClose={closeMenu}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        {(exportFormats || []).map((format) => (
          <MenuItem
            key={format}
            onClick={(event) =>
              openScope(
                event.currentTarget,
                `Descargar ${FORMATS[format].label}`,
                (scope) => void runExport(format, scope),
              )
            }
          >
            <ListItemIcon>
              <CnIcon name={FORMATS[format].icon} size="sm" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 700 }}
              secondaryTypographyProps={{ fontSize: "0.72rem" }}
              secondary={FORMATS[format].description}
            >
              {FORMATS[format].label}
            </ListItemText>
            <ChevronRightIcon
              sx={{ fontSize: 18, ml: "8px", color: "var(--cn-color-neutral-400, #9aa1aa)" }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Copiar */}
      <Menu
        open={menu?.kind === "copy"}
        anchorEl={menu?.anchor}
        onClose={closeMenu}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        {COPY_FORMATS.map((format) => (
          <MenuItem
            key={format.id}
            onClick={(event) =>
              openScope(
                event.currentTarget,
                `Copiar como ${format.label}`,
                (scope) => void runCopy(format.id, scope),
              )
            }
          >
            <ListItemIcon>
              <CnIcon name={format.icon} size="sm" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 700 }}
              secondaryTypographyProps={{ fontSize: "0.72rem" }}
              secondary={format.description}
            >
              {format.label}
            </ListItemText>
            <ChevronRightIcon
              sx={{ fontSize: 18, ml: "8px", color: "var(--cn-color-neutral-400, #9aa1aa)" }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Alcance (todos / página / selección) */}
      <Menu
        open={menu?.kind === "scope"}
        anchorEl={menu?.anchor}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        {menu?.kind === "scope" && [
          <Box
            key="title"
            sx={{
              px: "16px",
              pt: "6px",
              pb: "4px",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {menu.title}
          </Box>,
          ...scopeItems(menu.action),
        ]}
      </Menu>

      {/* Columnas */}
      <Menu
        open={menu?.kind === "columns"}
        anchorEl={menu?.anchor}
        onClose={closeMenu}
        slotProps={{ paper: { sx: { ...menuPaperSx, maxHeight: 420 } } }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
            px: "12px",
            pb: "6px",
          }}
        >
          <CnButton size="small" variant="text" onClick={() => setVisibility({})}>
            Mostrar todas
          </CnButton>
          <CnButton size="small" variant="text" color="neutral" onClick={resetLayout}>
            Restablecer
          </CnButton>
        </Box>
        <Divider sx={{ mb: "4px" }} />
        {table.getAllLeafColumns().map((tableColumn) => {
          const column = columnsById.get(tableColumn.id) as CnColumn<T>;
          const pinned = pinnedLeftIds.has(column.id);
          return (
            <MenuItem
              key={column.id}
              disabled={column.hideable === false}
              onClick={() =>
                setVisibility((prev) => ({ ...prev, [column.id]: prev[column.id] === false }))
              }
            >
              <Checkbox
                size="small"
                sx={{ p: "2px", mr: "8px" }}
                checked={visibility[column.id] !== false}
                tabIndex={-1}
              />
              <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>
                {column.header}
              </ListItemText>
              <Tooltip title={pinned ? "Desfijar" : "Fijar a la izquierda"} arrow>
                <IconButton
                  size="small"
                  aria-label={
                    pinned ? `Desfijar ${headerText(column)}` : `Fijar ${headerText(column)}`
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    tableColumn.pin(pinned ? false : "left");
                  }}
                  sx={{
                    ml: "8px",
                    color: pinned
                      ? "var(--cn-color-brand-600, #254d87)"
                      : "var(--cn-color-neutral-400, #9aa1aa)",
                  }}
                >
                  <PushPinOutlinedIcon
                    sx={{ fontSize: 16, transform: pinned ? "rotate(45deg)" : "none" }}
                  />
                </IconButton>
              </Tooltip>
            </MenuItem>
          );
        })}
      </Menu>

      {/* Menú de columna */}
      <Menu
        open={menu?.kind === "column"}
        anchorEl={menu?.anchor}
        onClose={closeMenu}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        {menuColumn &&
          menuTableColumn && [
            menuTableColumn.getCanSort() && (
              <MenuItem
                key="asc"
                onClick={() => {
                  menuTableColumn.toggleSorting(false);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <ArrowUpwardIcon fontSize="small" />
                </ListItemIcon>
                Ordenar ascendente
              </MenuItem>
            ),
            menuTableColumn.getCanSort() && (
              <MenuItem
                key="desc"
                onClick={() => {
                  menuTableColumn.toggleSorting(true);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <ArrowDownwardIcon fontSize="small" />
                </ListItemIcon>
                Ordenar descendente
              </MenuItem>
            ),
            menuTableColumn.getIsSorted() && (
              <MenuItem
                key="clear"
                onClick={() => {
                  menuTableColumn.clearSorting();
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <SwapVertIcon fontSize="small" />
                </ListItemIcon>
                Quitar orden
              </MenuItem>
            ),
            <Divider key="d1" />,
            menuColumn.filterable !== false && (
              <MenuItem
                key="filter"
                onClick={() => {
                  closeMenu();
                  setShowFilters(true);
                  setTimeout(() => filterInputs.current[menuColumn.id]?.focus(), 50);
                }}
              >
                <ListItemIcon>
                  <FilterListIcon fontSize="small" />
                </ListItemIcon>
                Filtrar por {headerText(menuColumn)}
              </MenuItem>
            ),
            <MenuItem
              key="pin"
              onClick={() => {
                menuTableColumn.pin(pinnedLeftIds.has(menuColumn.id) ? false : "left");
                closeMenu();
              }}
            >
              <ListItemIcon>
                <PushPinOutlinedIcon fontSize="small" />
              </ListItemIcon>
              {pinnedLeftIds.has(menuColumn.id) ? "Desfijar columna" : "Fijar a la izquierda"}
            </MenuItem>,
            menuTableColumn.getCanResize() && (
              <MenuItem
                key="size"
                onClick={() => {
                  menuTableColumn.resetSize();
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <CnIcon name="width_normal" size="sm" />
                </ListItemIcon>
                Restablecer ancho
              </MenuItem>
            ),
            menuColumn.hideable !== false && (
              <MenuItem
                key="hide"
                onClick={() => {
                  menuTableColumn.toggleVisibility(false);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <CnIcon name="visibility_off" size="sm" />
                </ListItemIcon>
                Ocultar columna
              </MenuItem>
            ),
          ]}
      </Menu>

      {/* Acciones de fila */}
      <Menu
        open={menu?.kind === "row"}
        anchorEl={menu?.anchor}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { ...menuPaperSx, minWidth: 180 } } }}
      >
        {menu?.kind === "row" &&
          actionsFor(menu.row)
            .filter((action) => !action.inline)
            .map((action) => (
              <MenuItem
                key={action.id}
                disabled={action.disabled?.(menu.row)}
                onClick={() => {
                  const row = menu.row;
                  closeMenu();
                  runRowAction(action, row);
                }}
                sx={{
                  color:
                    action.color === "error" ? "var(--cn-color-error-600, #b52f2f)" : undefined,
                }}
              >
                {action.icon && (
                  <ListItemIcon
                    sx={{ color: action.color === "error" ? "inherit !important" : undefined }}
                  >
                    <CnIcon name={action.icon} size="sm" />
                  </ListItemIcon>
                )}
                <ListItemText primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }}>
                  {action.label}
                </ListItemText>
              </MenuItem>
            ))}
      </Menu>

      <CnConfirmDialog
        {...(confirmState?.options ?? {})}
        open={Boolean(confirmState)}
        onClose={() => setConfirmState(null)}
        onConfirm={async () => {
          await confirmState?.options.onConfirm?.();
          await confirmState?.run();
        }}
      />
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={2500}
        onClose={() => setNotice(null)}
        message={notice}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};
