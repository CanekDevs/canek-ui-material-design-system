import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ReactNode } from "react";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnCellType } from "./cells";
import type { CnColumn, CnDataTableProps } from "./CnDataTable.types";
import {
  DEFAULT_COLUMN_WIDTH,
  DENSITY_PADDING,
  FALLBACK_COLUMN_WIDTH,
  LEAD_EXPAND,
  LEAD_NUMBER,
  LEAD_SELECT,
} from "./column-widths";

/** Columna mínima del skeleton (una `CnColumn` real también sirve). */
export type CnDataTableSkeletonColumn = {
  type?: CnCellType;
  align?: "left" | "center" | "right";
  width?: number | string;
  hidden?: boolean;
  filterable?: boolean;
  showInCards?: boolean;
};

export type CnDataTableSkeletonProps = CnSkeletonCommonProps & {
  /** Número de columnas o su definición (tipos, anchos, alineación). */
  columns?: number | readonly (CnColumn<never> | CnDataTableSkeletonColumn)[];
  /** Filas simuladas. */
  rows?: number;
  density?: CnDataTableProps["density"];
  /** Título del encabezado (`true` o el texto). */
  title?: ReactNode | boolean;
  description?: ReactNode | boolean;
  hideToolbar?: boolean;
  searchable?: boolean;
  /** Botón "Descargar" (`false` lo oculta, como en la tabla). */
  exportFormats?: CnDataTableProps["exportFormats"] | boolean;
  copyable?: boolean;
  printable?: boolean;
  /** Botón de filtros por columna (por defecto si alguna columna es filtrable). */
  filterToggle?: boolean;
  /** Fila de filtros visible bajo los encabezados. */
  columnFilters?: boolean;
  columnToggle?: boolean;
  densityToggle?: boolean;
  fullscreenToggle?: boolean;
  /** Casilla para mostrar/ocultar la selección en la barra. */
  selectionToggle?: boolean;
  /** Botones propios a la derecha de la barra (cantidad o `true` = 1). */
  toolbarActions?: number | boolean;
  selectable?: boolean;
  rowNumbers?: boolean;
  /** Columna de acciones por fila. */
  rowActions?: boolean;
  rowActionsPosition?: CnDataTableProps["rowActionsPosition"];
  /** Columna para expandir el detalle de la fila. */
  expandable?: boolean;
  /** Menú (⋮) en los encabezados. */
  columnActions?: boolean;
  pagination?: boolean;
  striped?: boolean;
  /** Vista en móvil (como en la tabla). */
  mobileLayout?: CnDataTableProps["mobileLayout"];
  /** Fuerza la vista: `auto` (tarjetas en móvil si `mobileLayout="cards"`), `table` o `cards`. */
  layout?: "auto" | "table" | "cards";
  maxHeight?: number | string;
};

type SkColumn = CnDataTableSkeletonColumn & { kind: CellKind };

type CellKind =
  "text" | "avatar" | "pill" | "tags" | "number" | "date" | "bar" | "image" | "rating" | "color";

const KIND_BY_TYPE: Partial<Record<CnCellType, CellKind>> = {
  avatar: "avatar",
  contact: "avatar",
  status: "pill",
  boolean: "pill",
  tags: "tags",
  list: "tags",
  number: "number",
  currency: "number",
  percent: "number",
  bytes: "number",
  duration: "number",
  date: "date",
  datetime: "date",
  daterange: "date",
  progress: "bar",
  sparkline: "bar",
  image: "image",
  rating: "rating",
  color: "color",
};

/** Tipos para columnas genéricas (cuando solo se da el número). */
const GENERIC_TYPES: CnCellType[] = ["avatar", "text", "status", "date", "currency", "text"];

const toColumns = (columns: CnDataTableSkeletonProps["columns"]): SkColumn[] => {
  const list: CnDataTableSkeletonColumn[] =
    typeof columns === "number" || columns === undefined
      ? Array.from({ length: Math.max(1, columns ?? 5) }, (_, i) => ({
          type: i === 0 ? "avatar" : GENERIC_TYPES[i % GENERIC_TYPES.length],
        }))
      : (columns as readonly CnDataTableSkeletonColumn[]).filter((column) => !column.hidden);
  return list.map((column) => {
    const kind = KIND_BY_TYPE[column.type ?? "text"] ?? "text";
    return {
      ...column,
      kind,
      align: column.align ?? (kind === "number" ? "right" : undefined),
    };
  });
};

const widthOf = (column: SkColumn) =>
  typeof column.width === "number"
    ? column.width
    : (DEFAULT_COLUMN_WIDTH[column.type ?? "text"] ?? FALLBACK_COLUMN_WIDTH);

const justify = (align?: "left" | "center" | "right") =>
  align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";

/** Contenido de una celda según su tipo. */
const CellShape = ({ column, row }: { column: SkColumn; row: number }) => {
  const seed = (row * 7 + (column.width ? 3 : 1)) % 5;
  switch (column.kind) {
    case "avatar":
      return (
        <Box
          sx={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, width: "100%" }}
        >
          <SkBlock circle width={28} />
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
            <SkText width={`${55 + seed * 7}%`} size={13} />
            <SkText width={`${35 + seed * 6}%`} size={10} />
          </Box>
        </Box>
      );
    case "pill":
      return <SkBlock width={70 + seed * 8} height={22} radius={999} />;
    case "tags":
      return (
        <Box sx={{ display: "flex", gap: "4px" }}>
          <SkBlock width={52 + seed * 4} height={20} radius={999} />
          {seed % 2 === 0 && <SkBlock width={44} height={20} radius={999} />}
        </Box>
      );
    case "number":
      return <SkText width={`${45 + seed * 8}%`} size={13} />;
    case "date":
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
          <SkText width={`${50 + seed * 5}%`} size={13} />
          <SkText width={`${30 + seed * 4}%`} size={10} />
        </Box>
      );
    case "bar":
      return <SkBlock width="80%" height={8} radius={4} />;
    case "image":
      return <SkBlock width={36} height={36} radius={6} />;
    case "rating":
      return (
        <Box sx={{ display: "flex", gap: "3px" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkBlock key={i} width={13} height={13} radius={3} />
          ))}
        </Box>
      );
    case "color":
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
          <SkBlock width={18} height={18} radius={4} />
          <SkText width="50%" size={12} />
        </Box>
      );
    default:
      return <SkText width={`${50 + seed * 9}%`} size={13} />;
  }
};

const iconButton = (key: string) => (
  <Box
    key={key}
    data-sk-part="tool"
    data-sk-tool={key}
    sx={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}
  >
    <SkBlock width={20} height={20} radius={5} />
  </Box>
);

const outlinedButton = (key: string, width: number) => (
  <Box
    key={key}
    data-sk-part="tool"
    data-sk-tool={key}
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      height: 32,
      px: "10px",
      boxSizing: "border-box",
      borderRadius: "var(--cn-radius-md, 8px)",
      border: "1px solid var(--cn-color-border, #dde0e4)",
    }}
  >
    <SkBlock width={16} height={16} radius={4} />
    <SkText width={width} size={12} />
  </Box>
);

/** Skeleton de `CnDataTable`: encabezado, barra, columnas tipadas, filas por densidad, paginación y tarjetas. */
export const CnDataTableSkeleton = ({
  columns,
  rows = 6,
  density = "comfortable",
  title = false,
  description = false,
  hideToolbar = false,
  searchable = true,
  exportFormats = true,
  copyable = true,
  printable = true,
  filterToggle,
  columnFilters = false,
  columnToggle = true,
  densityToggle = true,
  fullscreenToggle = true,
  selectionToggle = false,
  toolbarActions = 0,
  selectable = false,
  rowNumbers = false,
  rowActions = false,
  rowActionsPosition = "end",
  expandable = false,
  columnActions = true,
  pagination = true,
  striped = false,
  mobileLayout = "cards",
  layout = "auto",
  maxHeight,
  animation,
  ariaLabel = "Cargando tabla",
  sx,
  className,
}: CnDataTableSkeletonProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const cards = layout === "cards" || (layout === "auto" && isMobile && mobileLayout === "cards");
  const cols = toColumns(columns);
  const padY = DENSITY_PADDING[density];
  const showFilterToggle =
    (filterToggle ?? cols.some((column) => column.filterable !== false)) && !cards;
  const exportEnabled = Array.isArray(exportFormats) ? exportFormats.length > 0 : exportFormats;
  const actionCount = toolbarActions === true ? 1 : Number(toolbarActions) || 0;
  const rowCount = Math.max(1, rows);

  const caption = (title || description) && (
    <Box
      data-sk-part="caption"
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
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
        {title && <SkText width={160} size={12} />}
        {description && <SkText width="45%" size={11} />}
      </Box>
      <SkText width={74} size={11} />
    </Box>
  );

  const toolbar = !hideToolbar && (
    <Box
      data-sk-part="toolbar"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        px: "12px",
        py: "10px",
        minHeight: 56,
        boxSizing: "border-box",
        borderBottom: "1px solid var(--cn-color-border-subtle, #eceef1)",
      }}
    >
      {selectable && selectionToggle && (
        <SkBlock width={18} height={18} radius={4} sx={{ mx: "8px" }} />
      )}
      {(exportEnabled || copyable || (printable && !isMobile)) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
          {exportEnabled && outlinedButton("export", 66)}
          {copyable && outlinedButton("copy", 44)}
          {printable && !isMobile && outlinedButton("print", 52)}
        </Box>
      )}
      <Box sx={{ flex: 1 }} />
      {searchable && (
        <Box
          data-sk-part="search"
          sx={{
            order: { xs: 10, md: 0 },
            flex: { xs: "1 1 100%", md: "0 1 280px" },
            height: 34,
            px: "10px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "999px",
            backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
            border: "1px solid var(--cn-color-border, #dde0e4)",
          }}
        >
          <SkBlock circle width={16} />
          <SkText width="55%" size={12} />
        </Box>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
        {showFilterToggle && iconButton("filters")}
        {columnToggle && iconButton("columns")}
        {densityToggle && !cards && iconButton("density")}
        {fullscreenToggle && !isMobile && iconButton("fullscreen")}
      </Box>
      {actionCount > 0 && (
        <Box sx={{ display: "flex", gap: "8px" }}>
          {Array.from({ length: actionCount }, (_, i) => (
            <SkBlock key={i} width={96} height={32} radius={8} />
          ))}
        </Box>
      )}
    </Box>
  );

  // Columnas iniciales fijas (selección, detalle, número, acciones al inicio).
  type Lead = { key: string; width: number; head: ReactNode; cell: (row: number) => ReactNode };
  const actionsLead: Lead = {
    key: "actions",
    width: 88,
    head: <SkText width={52} size={12} sx={{ mx: "auto" }} />,
    cell: () => (
      <Box sx={{ display: "flex", justifyContent: "center", gap: "4px" }}>
        <SkBlock circle width={22} />
        <SkBlock circle width={22} />
      </Box>
    ),
  };
  const leads: Lead[] = [
    ...(selectable
      ? [
          {
            key: "select",
            width: LEAD_SELECT,
            head: <SkBlock width={18} height={18} radius={4} sx={{ mx: "auto" }} />,
            cell: () => <SkBlock width={18} height={18} radius={4} sx={{ mx: "auto" }} />,
          },
        ]
      : []),
    ...(expandable
      ? [
          {
            key: "expand",
            width: LEAD_EXPAND,
            head: null,
            cell: () => <SkBlock width={14} height={14} radius={3} sx={{ mx: "auto" }} />,
          },
        ]
      : []),
    ...(rowNumbers
      ? [
          {
            key: "number",
            width: LEAD_NUMBER,
            head: <SkText width={12} size={12} sx={{ mx: "auto" }} />,
            cell: (row: number) => (
              <SkText width={10 + (row % 2) * 6} size={12} sx={{ mx: "auto" }} />
            ),
          },
        ]
      : []),
    ...(rowActions && rowActionsPosition === "start" ? [actionsLead] : []),
  ];
  const trail: Lead[] = rowActions && rowActionsPosition === "end" ? [actionsLead] : [];
  const tableWidth =
    [...leads, ...trail].reduce((sum, lead) => sum + lead.width, 0) +
    cols.reduce((sum, column) => sum + widthOf(column), 0);

  const headCell = {
    boxSizing: "border-box" as const,
    padding: "10px 12px 8px",
    verticalAlign: "top",
    borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
  };
  const bodyCell = {
    boxSizing: "border-box" as const,
    padding: `${padY}px 12px`,
    verticalAlign: "middle",
    borderBottom: "1px solid var(--cn-color-border-subtle, #f0f1f3)",
  };

  const tableView = (
    <Box sx={{ overflow: "auto", maxHeight }}>
      <Box
        component="table"
        role="presentation"
        sx={{
          width: "100%",
          minWidth: tableWidth,
          tableLayout: "fixed",
          borderCollapse: "separate",
          borderSpacing: 0,
        }}
      >
        <colgroup>
          {leads.map((lead) => (
            <col key={lead.key} style={{ width: lead.width }} />
          ))}
          {cols.map((column, i) => (
            <col key={i} style={{ width: widthOf(column) }} />
          ))}
          {trail.map((lead) => (
            <col key={lead.key} style={{ width: lead.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {leads.map((lead) => (
              <Box component="th" key={lead.key} sx={headCell}>
                {lead.head}
              </Box>
            ))}
            {cols.map((column, i) => (
              <Box component="th" key={i} data-sk-part="header-cell" sx={headCell}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    justifyContent: justify(column.align),
                  }}
                >
                  <SkText width={`${40 + ((i * 13) % 30)}%`} size={12} />
                  {columnActions && <SkBlock width={4} height={14} radius={2} />}
                </Box>
                {columnFilters && column.filterable !== false && (
                  <Box
                    data-sk-part="filter"
                    sx={{
                      mt: "8px",
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
                    }}
                  >
                    <SkText width="60%" size={11} />
                  </Box>
                )}
              </Box>
            ))}
            {trail.map((lead) => (
              <Box component="th" key={lead.key} sx={headCell}>
                {lead.head}
              </Box>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, r) => (
            <Box
              component="tr"
              key={r}
              data-sk-part="row"
              sx={{
                backgroundColor:
                  striped && r % 2 === 1 ? "var(--cn-color-neutral-50, #fafbfc)" : "transparent",
              }}
            >
              {leads.map((lead) => (
                <Box component="td" key={lead.key} sx={bodyCell}>
                  {lead.cell(r)}
                </Box>
              ))}
              {cols.map((column, i) => (
                <Box
                  component="td"
                  key={i}
                  data-sk-part="cell"
                  data-sk-kind={column.kind}
                  sx={bodyCell}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      minHeight: 22,
                      justifyContent: justify(column.align),
                    }}
                  >
                    <CellShape column={column} row={r + i} />
                  </Box>
                </Box>
              ))}
              {trail.map((lead) => (
                <Box component="td" key={lead.key} sx={bodyCell}>
                  {lead.cell(r)}
                </Box>
              ))}
            </Box>
          ))}
        </tbody>
      </Box>
    </Box>
  );

  const cardColumns = cols.filter((column) => column.showInCards !== false);
  const [first, ...rest] = cardColumns;
  const cardsView = (
    <Box sx={{ p: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {Array.from({ length: Math.min(rowCount, 4) }, (_, r) => (
        <Box
          key={r}
          data-sk-part="card"
          sx={{
            p: "14px",
            borderRadius: "12px",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            {selectable && <SkBlock width={18} height={18} radius={4} />}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {first ? <CellShape column={first} row={r} /> : <SkText width="60%" size={13} />}
            </Box>
            {rowActions && <SkBlock circle width={22} />}
          </Box>
          {rest.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(88px, 36%) 1fr",
                gap: "8px 12px",
                alignItems: "center",
              }}
            >
              {rest.slice(0, 5).map((column, i) => (
                <Box key={i} sx={{ display: "contents" }}>
                  <SkText width="70%" size={10} />
                  <Box sx={{ display: "flex", minWidth: 0 }}>
                    <CellShape column={{ ...column, align: undefined }} row={r + i} />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
          {expandable && <SkText width={80} size={12} />}
        </Box>
      ))}
    </Box>
  );

  const footer = pagination && (
    <Box
      data-sk-part="pagination"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: "16px",
        minHeight: 52,
        px: "16px",
        borderTop: "1px solid var(--cn-color-border-subtle, #eceef1)",
      }}
    >
      <SkText width={isMobile ? 34 : 96} size={12} />
      <SkBlock width={44} height={22} radius={4} />
      <SkText width={70} size={12} />
      <Box sx={{ display: "flex", gap: "8px" }}>
        <SkBlock circle width={24} />
        <SkBlock circle width={24} />
      </Box>
    </Box>
  );

  return (
    <CnSkeletonGroup
      name="data-table"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <Box data-sk-layout={cards ? "cards" : "table"} data-sk-density={density}>
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
          {cards ? cardsView : tableView}
          {footer}
        </Box>
      </Box>
    </CnSkeletonGroup>
  );
};
