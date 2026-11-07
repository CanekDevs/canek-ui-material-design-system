import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ClearIcon from "@mui/icons-material/Clear";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DensityMediumIcon from "@mui/icons-material/DensityMedium";
import DensitySmallIcon from "@mui/icons-material/DensitySmall";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type {
  ColumnDef,
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
import type { MouseEvent } from "react";
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
import { copyRows, exportRows } from "./export";

const FORMAT_LABELS: Record<CnExportFormat, string> = {
  csv: "CSV",
  xls: "Excel (.xls)",
  tsv: "TSV",
  json: "JSON",
};

const AGGREGATE_LABELS: Record<CnAggregate, string> = {
  sum: "Total",
  avg: "Promedio",
  min: "Mínimo",
  max: "Máximo",
  count: "Registros",
};

const TONES = {
  error: "var(--cn-color-error-50, #fcecec)",
  warning: "var(--cn-color-warning-50, #fdf6e6)",
  success: "var(--cn-color-success-50, #eaf7ee)",
  info: "var(--cn-color-info-50, #eaf3fb)",
};

const readStore = <V,>(key: string | undefined, fallback: V): V => {
  if (!key || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`cnDataTable.${key}`);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};

const writeStore = (key: string | undefined, value: unknown) => {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`cnDataTable.${key}`, JSON.stringify(value));
  } catch {
    // Almacenamiento no disponible (modo privado): se ignora.
  }
};

type Stored = {
  visibility: VisibilityState;
  density?: "compact" | "comfortable";
  pageSize?: number;
  sorting?: SortingState;
};

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

/**
 * Tabla de datos: orden (múltiple con Shift), búsqueda sin acentos, filtros
 * por columna, paginación, selección con acciones masivas, acciones por fila
 * con confirmación, detalle expandible, agregados en el pie, exportación,
 * columnas visibles persistentes, modo servidor y vista de tarjetas en móvil.
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
  searchPlaceholder = "Buscar…",
  columnFilters: columnFiltersEnabled = false,
  columnToggle = true,
  densityToggle = true,
  exportFormats = ["xls", "csv", "json"],
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
  density: densityProp = "compact",
  striped = false,
  hoverable = true,
  stickyHeader = false,
  maxHeight,
  mobileLayout = "cards",
  persistKey,
  serverSide,
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

  const initialVisibility = useMemo(() => {
    const base: VisibilityState = {};
    for (const column of columns) if (column.hidden) base[column.id] = false;
    return base;
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const stored = useMemo(
    () =>
      readStore<Stored>(persistKey, {
        visibility: initialVisibility,
        density: densityProp,
        pageSize: initialPageSize,
        sorting: defaultSort,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [visibility, setVisibility] = useState<VisibilityState>(stored.visibility);
  const [density, setDensity] = useState(stored.density ?? densityProp);
  const [sorting, setSorting] = useState<SortingState>(stored.sorting ?? defaultSort);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(columnFiltersEnabled);
  const [paginationState, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: stored.pageSize ?? initialPageSize,
  });
  const [internalSelection, setInternalSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [confirmState, setConfirmState] = useState<{
    options: CnConfirmOptions;
    run: () => void | Promise<unknown>;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    writeStore(persistKey, { visibility, density, pageSize: paginationState.pageSize, sorting });
  }, [density, paginationState.pageSize, persistKey, sorting, visibility]);

  const rowIdOf = useCallback(
    (row: T, index: number) => {
      if (getRowId) return getRowId(row, index);
      const id = (row as { id?: unknown }).id;
      return id !== undefined && id !== null ? String(id) : `row-${index}`;
    },
    [getRowId],
  );

  // ─── Selección (controlada o interna) ──────────────────────────────────
  const selection = useMemo<RowSelectionState>(() => {
    if (!selectedIds) return internalSelection;
    return Object.fromEntries(selectedIds.map((id) => [id, true]));
  }, [internalSelection, selectedIds]);

  // ─── Columnas para el motor ───────────────────────────────────────────
  const columnDefs = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        accessorFn: (row: T) => valueOf(column, row),
        header: () => column.header,
        enableSorting: sortable && column.sortable !== false,
        sortDescFirst: false,
        enableHiding: column.hideable !== false,
        enableColumnFilter: column.filterable !== false,
        sortingFn: (a, b) => {
          const va = valueOf(column, a.original);
          const vb = valueOf(column, b.original);
          if (va === vb) return 0;
          if (va === null || va === undefined || va === "") return 1;
          if (vb === null || vb === undefined || vb === "") return -1;
          const na = Number(va);
          const nb = Number(vb);
          if (
            typeof va !== "boolean" &&
            Number.isFinite(na) &&
            Number.isFinite(nb) &&
            va !== "" &&
            vb !== ""
          )
            return na - nb;
          return String(va).localeCompare(String(vb), "es", { numeric: true, sensitivity: "base" });
        },
        filterFn: (row, _id, needle: string) =>
          normalizeSearchText(textOf(column, row.original)).includes(normalizeSearchText(needle)),
      })),
    [columns, sortable],
  );

  const isServer = Boolean(serverSide);
  const columnFiltersState = useMemo(
    () =>
      Object.entries(isServer ? (serverSide?.query.filters ?? {}) : filters)
        .filter(([, value]) => value)
        .map(([id, value]) => ({ id, value })),
    [filters, isServer, serverSide?.query.filters],
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
      globalFilter: isServer ? serverSide?.query.search : search,
      columnFilters: columnFiltersState,
      pagination: isServer
        ? { pageIndex: serverSide!.query.pageIndex, pageSize: serverSide!.query.pageSize }
        : paginationState,
      rowSelection: selection,
      expanded,
    },
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

  // Vuelve a la primera página cuando cambia la búsqueda o los filtros.
  useEffect(() => {
    if (!isServer) setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filters, isServer, search]);

  // Si la página actual queda fuera de rango (datos nuevos), retrocede.
  const pageCount = table.getPageCount();
  useEffect(() => {
    if (isServer || !pagination) return;
    if (paginationState.pageIndex > 0 && paginationState.pageIndex >= pageCount) {
      setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, pageCount - 1) }));
    }
  }, [isServer, pageCount, pagination, paginationState.pageIndex]);

  const visibleColumns = columns.filter((column) => visibility[column.id] !== false);
  const filteredRows = table.getFilteredRowModel().rows.map((row) => row.original);
  const pageRows = table.getRowModel().rows;
  const selectedRows = table.getSelectedRowModel().flatRows.map((row) => row.original);
  const totalCount = isServer ? (serverSide?.rowCount ?? 0) : filteredRows.length;

  // ─── Exportación ──────────────────────────────────────────────────────
  const exportColumns: CnExportColumn[] = visibleColumns.map((column) => ({
    id: column.id,
    header: typeof column.header === "string" ? column.header : column.id,
  }));
  const toExportRows = (rows: T[]): CnExportRow[] =>
    rows.map((row) => Object.fromEntries(visibleColumns.map((c) => [c.id, textOf(c, row)])));

  const rowsForScope = async (scope: "all" | "page" | "selected"): Promise<T[]> => {
    if (scope === "selected") return selectedRows;
    if (scope === "page") return pageRows.map((row) => row.original);
    if (isServer && fetchAllRows) return fetchAllRows();
    return isServer ? (data as T[]) : filteredRows;
  };

  const runExport = async (format: CnExportFormat, scope: "all" | "page" | "selected") => {
    setBusy(true);
    try {
      const rows = await rowsForScope(scope);
      const base =
        exportFilename ??
        (typeof title === "string" ? normalizeSearchText(title).replace(/\s+/g, "-") : "tabla");
      exportRows(format, exportColumns, toExportRows(rows), base);
    } finally {
      setBusy(false);
    }
  };

  const runCopy = async (scope: "all" | "page" | "selected") => {
    const rows = await rowsForScope(scope);
    const ok = await copyRows(exportColumns, toExportRows(rows));
    setNotice(
      ok
        ? `${rows.length} ${rows.length === 1 ? "fila copiada" : "filas copiadas"}`
        : "No se pudo copiar",
    );
  };

  // ─── Acciones con confirmación ────────────────────────────────────────
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
  const [menu, setMenu] = useState<{
    kind: "columns" | "export" | "row";
    anchor: HTMLElement;
    row?: T;
  } | null>(null);
  const closeMenu = () => setMenu(null);

  const cellPadding = density === "compact" ? "6px 12px" : "12px 16px";
  const hasActions = Boolean(rowActions?.length);
  const leadingCols = (selectable ? 1 : 0) + (renderDetail ? 1 : 0);
  const totalCols = leadingCols + visibleColumns.length + (hasActions ? 1 : 0);
  const showFooter = visibleColumns.some((column) => column.aggregate || column.footer);
  const searchValue = isServer ? (serverSide?.query.search ?? "") : search;
  const searchRef = useRef<HTMLInputElement | null>(null);

  const setColumnFilter = (id: string, value: string) => {
    if (isServer)
      emitQuery({ filters: { ...serverSide!.query.filters, [id]: value }, pageIndex: 0 });
    else setFilters((prev) => ({ ...prev, [id]: value }));
  };

  const actionsFor = (row: T) =>
    (rowActions ?? []).filter((action) => !action.visible || action.visible(row));

  const renderActionsCell = (row: T) => {
    const actions = actionsFor(row);
    if (actions.length === 0) return null;
    const inline = actions.filter((action) => action.inline);
    const inMenu = actions.filter((action) => !action.inline);
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "2px" }}>
        {inline.map((action) => (
          <Tooltip key={action.id} title={action.label}>
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
                      : "var(--cn-color-neutral-600, #4e5660)",
                }}
              >
                <CnIcon name={action.icon ?? "more_horiz"} size="sm" />
              </IconButton>
            </span>
          </Tooltip>
        ))}
        {inMenu.length > 0 && (
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
        )}
      </Box>
    );
  };

  const renderCellContent = (column: CnColumn<T>, row: T, index: number) => {
    const value = valueOf(column, row);
    if (column.cell) return column.cell(value, row, index);
    return renderTypedCell(column.type ?? "text", value, row, column.cellOptions);
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
            column.type === "currency" || column.type === "percent" ? column.type : "number",
            result,
            {},
            column.cellOptions,
          );
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems:
            column.align === "right" || column.type === "currency" || column.type === "number"
              ? "flex-end"
              : "flex-start",
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: "var(--cn-font-size-xs, 11px)",
            color: "var(--cn-color-text-muted, #6e7682)",
            fontWeight: 500,
          }}
        >
          {AGGREGATE_LABELS[column.aggregate as CnAggregate]}
        </Box>
        <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {formatted}
        </Box>
      </Box>
    );
  };

  const alignOf = (column: CnColumn<T>) =>
    column.align ??
    (column.type === "number" ||
    column.type === "currency" ||
    column.type === "percent" ||
    column.type === "duration"
      ? "right"
      : "left");

  // ─── Barra de herramientas ────────────────────────────────────────────
  const toolbar = !hideToolbar && (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        px: "16px",
        py: "12px",
        borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
      }}
    >
      {(title || description) && (
        <Box sx={{ minWidth: 0, mr: "auto", display: "flex", flexDirection: "column" }}>
          {title && (
            <Typography
              component="h2"
              sx={{ m: 0, fontSize: "var(--cn-font-size-md, 14px)", fontWeight: 700 }}
            >
              {title}
              <Box
                component="span"
                sx={{
                  ml: "8px",
                  fontSize: "var(--cn-font-size-xs, 11px)",
                  fontWeight: 500,
                  color: "var(--cn-color-text-muted, #6e7682)",
                }}
              >
                {loading
                  ? ""
                  : `${totalCount.toLocaleString("es-MX")} ${totalCount === 1 ? "registro" : "registros"}`}
              </Box>
            </Typography>
          )}
          {description && (
            <Typography
              sx={{
                fontSize: "var(--cn-font-size-xs, 11px)",
                color: "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      )}
      {searchable && (
        <InputBase
          inputRef={searchRef}
          value={searchValue}
          onChange={(event) => {
            if (isServer) emitQuery({ search: event.target.value, pageIndex: 0 });
            else setSearch(event.target.value);
          }}
          placeholder={searchPlaceholder}
          inputProps={{ "aria-label": "Buscar en la tabla" }}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: "var(--cn-color-neutral-400, #9aa1aa)" }} />
            </InputAdornment>
          }
          endAdornment={
            searchValue ? (
              <IconButton
                size="small"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  if (isServer) emitQuery({ search: "", pageIndex: 0 });
                  else setSearch("");
                  searchRef.current?.focus();
                }}
              >
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            ) : undefined
          }
          sx={{
            ml: title || description ? 0 : undefined,
            flex: { xs: "1 1 100%", sm: "0 1 260px" },
            order: { xs: 10, sm: 0 },
            height: 34,
            px: "8px",
            fontSize: "var(--cn-font-size-base, 13px)",
            borderRadius: "var(--cn-radius-md, 8px)",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            "&.Mui-focused": { borderColor: "var(--cn-color-brand-500, #3562a6)" },
          }}
        />
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          ml: title || description ? 0 : "auto",
        }}
      >
        {columns.some((c) => c.filterable !== false) && !cardsMode && (
          <Tooltip title={showFilters ? "Ocultar filtros" : "Filtrar por columna"}>
            <IconButton
              size="small"
              aria-pressed={showFilters}
              aria-label="Filtros por columna"
              onClick={() => setShowFilters((prev) => !prev)}
              sx={{ color: showFilters ? "var(--cn-color-brand-600, #254d87)" : undefined }}
            >
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {columnToggle && (
          <Tooltip title="Columnas">
            <IconButton
              size="small"
              aria-label="Columnas visibles"
              aria-haspopup="menu"
              onClick={(e) => setMenu({ kind: "columns", anchor: e.currentTarget })}
            >
              <ViewColumnOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {densityToggle && !cardsMode && (
          <Tooltip title={density === "compact" ? "Vista amplia" : "Vista compacta"}>
            <IconButton
              size="small"
              aria-label="Cambiar densidad"
              onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
            >
              {density === "compact" ? (
                <DensityMediumIcon fontSize="small" />
              ) : (
                <DensitySmallIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
        {(exportFormats !== false && exportFormats.length > 0) || copyable ? (
          <Tooltip title="Exportar">
            <span>
              <IconButton
                size="small"
                aria-label="Exportar"
                aria-haspopup="menu"
                disabled={busy || totalCount === 0}
                onClick={(e) => setMenu({ kind: "export", anchor: e.currentTarget })}
              >
                <FileDownloadOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ) : null}
      </Box>
      {toolbarActions && (
        <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{toolbarActions}</Box>
      )}
    </Box>
  );

  const bulkBar = selectable && selectedRows.length > 0 && (
    <Box
      role="region"
      aria-label="Acciones para la selección"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        px: "16px",
        py: "8px",
        backgroundColor: "var(--cn-color-brand-50, #eef3fb)",
        borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
        fontSize: "var(--cn-font-size-sm, 12px)",
      }}
    >
      <Box component="span" sx={{ fontWeight: 600, mr: "auto" }}>
        {selectedRows.length} {selectedRows.length === 1 ? "seleccionado" : "seleccionados"}
      </Box>
      {bulkActions?.map((action) => (
        <CnButton
          key={action.id}
          size="small"
          variant="outlined"
          color={action.color ?? "neutral"}
          startIcon={action.icon}
          onClick={() =>
            withConfirm(
              typeof action.confirm === "function" ? action.confirm(selectedRows) : action.confirm,
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
  );

  // ─── Cuerpo ───────────────────────────────────────────────────────────
  const isEmpty = !loading && pageRows.length === 0;
  const emptyNode = (
    <CnEmptyState
      icon={searchValue || columnFiltersState.length ? "search_off" : emptyIcon}
      title={searchValue || columnFiltersState.length ? "Sin resultados" : emptyTitle}
      description={
        searchValue || columnFiltersState.length
          ? "Prueba con otra búsqueda o quita los filtros."
          : emptyDescription
      }
      action={searchValue || columnFiltersState.length ? undefined : emptyAction}
      size="sm"
    />
  );

  const headerCellSx = {
    padding: cellPadding,
    fontSize: "var(--cn-font-size-xs, 11px)",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.03em",
    color: "var(--cn-color-text-muted, #6e7682)",
    backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
    whiteSpace: "nowrap" as const,
    borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
  };

  const tableView = (
    <TableContainer sx={{ maxHeight, overflowX: "auto" }}>
      <Table
        stickyHeader={stickyHeader || Boolean(maxHeight)}
        size="small"
        aria-busy={loading || undefined}
        aria-rowcount={totalCount}
      >
        <TableHead>
          <TableRow>
            {selectable && (
              <TableCell padding="checkbox" sx={headerCellSx}>
                <Checkbox
                  size="small"
                  checked={table.getIsAllPageRowsSelected()}
                  indeterminate={table.getIsSomePageRowsSelected()}
                  onChange={table.getToggleAllPageRowsSelectedHandler()}
                  slotProps={{
                    input: { "aria-label": "Seleccionar todas las filas de la página" },
                  }}
                />
              </TableCell>
            )}
            {renderDetail && <TableCell sx={{ ...headerCellSx, width: 40 }} aria-label="Detalle" />}
            {hasActions && rowActionsPosition === "start" && (
              <TableCell sx={{ ...headerCellSx, width: 56 }} aria-label="Acciones" />
            )}
            {table.getHeaderGroups()[0].headers.map((header) => {
              const column = columns.find((c) => c.id === header.column.id) as CnColumn<T>;
              const sorted = header.column.getIsSorted();
              const canSort = header.column.getCanSort();
              return (
                <TableCell
                  key={header.id}
                  align={alignOf(column)}
                  sortDirection={sorted || false}
                  sx={{
                    ...headerCellSx,
                    width: column.width,
                    minWidth: column.minWidth ?? 80,
                    ...(column.sticky && { position: "sticky", left: 0, zIndex: 3 }),
                  }}
                >
                  {canSort ? (
                    <TableSortLabel
                      active={Boolean(sorted)}
                      direction={sorted || "asc"}
                      onClick={header.column.getToggleSortingHandler()}
                      title="Ordenar (Shift para varias columnas)"
                    >
                      {column.header}
                      {sorted && sorting.length > 1 && !isServer && (
                        <Box component="span" sx={{ ml: "2px", fontSize: 9 }}>
                          {header.column.getSortIndex() + 1}
                        </Box>
                      )}
                    </TableSortLabel>
                  ) : (
                    column.header
                  )}
                </TableCell>
              );
            })}
            {hasActions && rowActionsPosition === "end" && (
              <TableCell sx={{ ...headerCellSx, width: 56 }} aria-label="Acciones" />
            )}
          </TableRow>
          {showFilters && (
            <TableRow>
              {Array.from(
                { length: leadingCols + (hasActions && rowActionsPosition === "start" ? 1 : 0) },
                (_, i) => (
                  <TableCell key={`f-${i}`} sx={{ ...headerCellSx, py: "4px" }} />
                ),
              )}
              {visibleColumns.map((column) => (
                <TableCell
                  key={`filter-${column.id}`}
                  sx={{ ...headerCellSx, py: "4px", textTransform: "none" }}
                >
                  {column.filterable !== false && (
                    <InputBase
                      value={
                        (isServer ? serverSide?.query.filters[column.id] : filters[column.id]) ?? ""
                      }
                      onChange={(event) => setColumnFilter(column.id, event.target.value)}
                      placeholder="Filtrar…"
                      inputProps={{
                        "aria-label": `Filtrar ${typeof column.header === "string" ? column.header : column.id}`,
                      }}
                      sx={{
                        width: "100%",
                        height: 28,
                        px: "6px",
                        fontSize: "var(--cn-font-size-sm, 12px)",
                        borderRadius: "var(--cn-radius-sm, 6px)",
                        border: "1px solid var(--cn-color-border, #dde0e4)",
                        backgroundColor: "var(--cn-color-surface, #ffffff)",
                      }}
                    />
                  )}
                </TableCell>
              ))}
              {hasActions && rowActionsPosition === "end" && (
                <TableCell sx={{ ...headerCellSx, py: "4px" }} />
              )}
            </TableRow>
          )}
        </TableHead>
        <TableBody>
          {loading &&
            Array.from({ length: Math.min(paginationState.pageSize, 6) }, (_, i) => (
              <TableRow key={`sk-${i}`}>
                {Array.from({ length: totalCols }, (_, j) => (
                  <TableCell key={j} sx={{ padding: cellPadding }}>
                    <CnSkeleton variant="text" width={j === 0 ? "70%" : "50%"} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {isEmpty && (
            <TableRow>
              <TableCell colSpan={totalCols} sx={{ border: 0, py: "24px" }}>
                {emptyNode}
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            pageRows.map((row, index) => {
              const original = row.original;
              const tone = getRowTone?.(original);
              const isExpanded = row.getIsExpanded();
              return (
                <Fragment key={row.id}>
                  <TableRow
                    hover={hoverable}
                    selected={row.getIsSelected()}
                    onClick={onRowClick ? () => onRowClick(original) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === "Enter" && event.target === event.currentTarget)
                              onRowClick(original);
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    data-row-id={row.id}
                    sx={{
                      cursor: onRowClick ? "pointer" : undefined,
                      backgroundColor: tone
                        ? TONES[tone]
                        : striped && index % 2 === 1
                          ? "var(--cn-color-neutral-50, #fafbfc)"
                          : undefined,
                      "&.Mui-selected, &.Mui-selected:hover": {
                        backgroundColor: "var(--cn-color-brand-50, #eef3fb)",
                      },
                      "&:focus-visible": {
                        outline: "2px solid var(--cn-color-brand-400, #5081c4)",
                        outlineOffset: -2,
                      },
                      "& > td": {
                        padding: cellPadding,
                        fontSize: "var(--cn-font-size-base, 13px)",
                        color: "var(--cn-color-text, #222831)",
                        borderBottom: "1px solid var(--cn-color-border-subtle, #eceef1)",
                        verticalAlign: "middle",
                      },
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          size="small"
                          checked={row.getIsSelected()}
                          onChange={row.getToggleSelectedHandler()}
                          slotProps={{ input: { "aria-label": `Seleccionar fila ${index + 1}` } }}
                        />
                      </TableCell>
                    )}
                    {renderDetail && (
                      <TableCell sx={{ width: 40 }} onClick={(event) => event.stopPropagation()}>
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
                              transition: "transform 140ms ease",
                            }}
                          />
                        </IconButton>
                      </TableCell>
                    )}
                    {hasActions && rowActionsPosition === "start" && (
                      <TableCell>{renderActionsCell(original)}</TableCell>
                    )}
                    {visibleColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={alignOf(column)}
                        sx={{
                          maxWidth: column.width ?? 360,
                          ...(column.sticky && {
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                            backgroundColor: "var(--cn-color-surface, #ffffff)",
                          }),
                        }}
                      >
                        {renderCellContent(column, original, index)}
                      </TableCell>
                    ))}
                    {hasActions && rowActionsPosition === "end" && (
                      <TableCell align="right">{renderActionsCell(original)}</TableCell>
                    )}
                  </TableRow>
                  {renderDetail && (
                    <TableRow>
                      <TableCell
                        colSpan={totalCols}
                        sx={{ p: 0, borderBottom: isExpanded ? undefined : 0 }}
                      >
                        <Collapse in={isExpanded} unmountOnExit>
                          <Box
                            sx={{
                              p: "12px 16px 16px",
                              backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
                            }}
                          >
                            {renderDetail(original)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
        </TableBody>
        {showFooter && !loading && !isEmpty && (
          <TableFooter>
            <TableRow>
              {Array.from(
                { length: leadingCols + (hasActions && rowActionsPosition === "start" ? 1 : 0) },
                (_, i) => (
                  <TableCell key={`ft-${i}`} />
                ),
              )}
              {visibleColumns.map((column) => (
                <TableCell
                  key={`foot-${column.id}`}
                  align={alignOf(column)}
                  sx={{
                    padding: cellPadding,
                    fontSize: "var(--cn-font-size-base, 13px)",
                    fontWeight: 700,
                    color: "var(--cn-color-text, #222831)",
                    borderTop: "2px solid var(--cn-color-border, #dde0e4)",
                  }}
                >
                  {renderFooterValue(column)}
                </TableCell>
              ))}
              {hasActions && rowActionsPosition === "end" && <TableCell />}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
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
        Array.from({ length: 3 }, (_, i) => (
          <Box component="li" key={i}>
            <CnSkeleton variant="rounded" height={110} />
          </Box>
        ))}
      {isEmpty && <Box component="li">{emptyNode}</Box>}
      {!loading &&
        pageRows.map((row, index) => {
          const original = row.original;
          const [first, ...rest] = visibleColumns.filter((column) => column.showInCards !== false);
          return (
            <Box
              component="li"
              key={row.id}
              data-row-id={row.id}
              onClick={onRowClick ? () => onRowClick(original) : undefined}
              sx={{
                p: "12px",
                borderRadius: "var(--cn-radius-md, 8px)",
                border: "1px solid var(--cn-color-border, #dde0e4)",
                backgroundColor: row.getIsSelected()
                  ? "var(--cn-color-brand-50, #eef3fb)"
                  : "var(--cn-color-surface, #ffffff)",
                cursor: onRowClick ? "pointer" : undefined,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                {selectable && (
                  <Checkbox
                    size="small"
                    sx={{ p: "2px" }}
                    checked={row.getIsSelected()}
                    onClick={(event) => event.stopPropagation()}
                    onChange={row.getToggleSelectedHandler()}
                    slotProps={{ input: { "aria-label": `Seleccionar fila ${index + 1}` } }}
                  />
                )}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontWeight: 600,
                    fontSize: "var(--cn-font-size-md, 14px)",
                  }}
                >
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
                  gridTemplateColumns: "minmax(90px, 40%) 1fr",
                  gap: "6px 12px",
                  fontSize: "var(--cn-font-size-sm, 12px)",
                }}
              >
                {rest.map((column) => (
                  <Fragment key={column.id}>
                    <Box component="dt" sx={{ color: "var(--cn-color-text-muted, #6e7682)" }}>
                      {column.header}
                    </Box>
                    <Box component="dd" sx={{ m: 0, minWidth: 0 }}>
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

  const menuRow = menu?.row;

  return (
    <Box
      className={className}
      data-cn-data-table
      sx={mergeSx(
        {
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          borderRadius: "var(--cn-radius-lg, 12px)",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          overflow: "hidden",
          fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
        },
        sx,
      )}
    >
      {toolbar}
      {bulkBar}
      {error && (
        <Box
          role="alert"
          sx={{
            px: "16px",
            py: "10px",
            color: "var(--cn-color-error-600, #b52f2f)",
            backgroundColor: "var(--cn-color-error-50, #fcecec)",
            fontSize: "var(--cn-font-size-sm, 12px)",
          }}
        >
          {error}
        </Box>
      )}
      {cardsMode ? cardsView : tableView}
      {pagination && !isEmpty && (
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
            `${from}–${to} de ${count.toLocaleString("es-MX")}`
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
          showFirstButton={!isMobile}
          showLastButton={!isMobile}
          sx={{
            borderTop: "1px solid var(--cn-color-border, #dde0e4)",
            "& .MuiTablePagination-toolbar": { minHeight: 44 },
          }}
        />
      )}

      {/* Menú de columnas */}
      <Menu open={menu?.kind === "columns"} anchorEl={menu?.anchor} onClose={closeMenu}>
        {columns.map((column) => (
          <MenuItem
            key={column.id}
            dense
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
            <ListItemText primaryTypographyProps={{ fontSize: 13 }}>{column.header}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Menú de exportación */}
      <Menu open={menu?.kind === "export"} anchorEl={menu?.anchor} onClose={closeMenu}>
        {(exportFormats || []).flatMap((format) => [
          <MenuItem
            key={`${format}-all`}
            dense
            onClick={() => {
              closeMenu();
              void runExport(format, "all");
            }}
          >
            <ListItemIcon>
              <FileDownloadOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ fontSize: 13 }}
              secondary={
                searchValue || columnFiltersState.length
                  ? "Registros filtrados"
                  : "Todos los registros"
              }
            >
              {FORMAT_LABELS[format]}
            </ListItemText>
          </MenuItem>,
        ])}
        {selectable &&
          selectedRows.length > 0 &&
          (exportFormats || []).slice(0, 1).map((format) => (
            <MenuItem
              key={`${format}-sel`}
              dense
              onClick={() => {
                closeMenu();
                void runExport(format, "selected");
              }}
            >
              <ListItemIcon>
                <FileDownloadOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontSize: 13 }}
                secondary={`${selectedRows.length} seleccionados`}
              >
                {FORMAT_LABELS[format]}
              </ListItemText>
            </MenuItem>
          ))}
        {copyable && (
          <MenuItem
            dense
            onClick={() => {
              closeMenu();
              void runCopy(selectable && selectedRows.length ? "selected" : "page");
            }}
          >
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ fontSize: 13 }}
              secondary="Se pega como tabla en Excel"
            >
              {selectable && selectedRows.length ? "Copiar selección" : "Copiar página"}
            </ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Menú de acciones de fila */}
      <Menu
        open={menu?.kind === "row"}
        anchorEl={menu?.anchor}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {menuRow &&
          actionsFor(menuRow)
            .filter((action) => !action.inline)
            .map((action) => (
              <MenuItem
                key={action.id}
                dense
                disabled={action.disabled?.(menuRow)}
                onClick={() => {
                  closeMenu();
                  runRowAction(action, menuRow);
                }}
                sx={{
                  color:
                    action.color === "error" ? "var(--cn-color-error-600, #b52f2f)" : undefined,
                }}
              >
                {action.icon && (
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <CnIcon name={action.icon} size="sm" />
                  </ListItemIcon>
                )}
                <ListItemText primaryTypographyProps={{ fontSize: 13 }}>
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
