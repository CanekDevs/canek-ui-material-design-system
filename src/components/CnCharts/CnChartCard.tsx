import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { CnButton } from "../CnButton";
import { CnEmptyState } from "../CnEmptyState";
import { CnIcon } from "../CnIcon";
import type { CnExportColumn, CnExportRow } from "../CnDataTable/export";
import { copyRows, exportRows } from "../CnDataTable/export";
import { downloadPng, downloadSvg, findChartSvg, toFilename } from "./chart-export";

// ─── Tipos ────────────────────────────────────────────────────────────

export type CnChartPeriod = {
  value: string;
  label: string;
  /** Días hacia atrás desde hoy (para calcular el rango). */
  days?: number;
};

export type CnChartDateRange = { from: string; to: string };

export type CnChartAction = {
  id?: string;
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  /** Botón visible en la barra (por defecto va dentro del menú ⋮). */
  inline?: boolean;
};

export type CnChartTypeOption = { value: string; label: string; icon: string };

export type CnChartExportData = { columns: CnExportColumn[]; rows: CnExportRow[] };

export type CnChartExportFormat = "png" | "svg" | "csv" | "xlsx" | "json" | "copy";

export type CnChartSummary = {
  value: ReactNode;
  label?: ReactNode;
  /** Variación en % (positiva = verde, negativa = rojo). */
  trend?: number | null;
  trendLabel?: ReactNode;
  /** Invierte los colores de la tendencia (p. ej. costos o tiempos). */
  invertTrend?: boolean;
};

export type CnChartRenderContext = { height: number; fullscreen: boolean };

export type CnChartCardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  /** Contenido o función que recibe el alto disponible (cambia en pantalla completa). */
  children?: ReactNode | ((context: CnChartRenderContext) => ReactNode);
  /** Alto del área de la gráfica. */
  height?: number;
  frame?: "card" | "outlined" | "elevated" | "plain";

  /** Valor destacado sobre la gráfica (total, promedio…) con tendencia. */
  summary?: CnChartSummary;
  footer?: ReactNode;

  // Estados
  loading?: boolean;
  /** Skeleton que se muestra mientras `loading` (cada gráfica pasa el suyo). */
  skeleton?: ReactNode;
  error?: ReactNode | boolean;
  onRetry?: () => void;
  empty?: boolean;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyIcon?: string;

  // Barra de herramientas
  actions?: CnChartAction[];
  /** Contenido libre a la derecha del encabezado (filtros, selects…). */
  toolbar?: ReactNode;
  periods?: CnChartPeriod[] | boolean;
  period?: string;
  defaultPeriod?: string;
  onPeriodChange?: (period: string, range: CnChartDateRange | null) => void;
  /** Agrega "Personalizado" con rango de fechas. */
  customRange?: boolean;
  typeOptions?: CnChartTypeOption[];
  type?: string;
  onTypeChange?: (type: string) => void;
  onRefresh?: () => void | Promise<unknown>;
  /** Formatos de descarga. `false` oculta el menú. */
  exportFormats?: CnChartExportFormat[] | false;
  /** Datos para CSV/XLSX/JSON/copiar (cada gráfica los genera). */
  exportData?: CnChartExportData | (() => CnChartExportData);
  exportFilename?: string;
  fullscreenable?: boolean;
  shareable?: boolean;
  onShare?: () => void;

  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

export const CN_CHART_DEFAULT_PERIODS: CnChartPeriod[] = [
  { value: "today", label: "Hoy", days: 1 },
  { value: "week", label: "Esta semana", days: 7 },
  { value: "month", label: "Este mes", days: 30 },
  { value: "quarter", label: "Este trimestre", days: 90 },
  { value: "year", label: "Este año", days: 365 },
];

const EXPORT_LABELS: Record<CnChartExportFormat, { label: string; icon: string; hint: string }> = {
  png: { label: "Imagen PNG", icon: "image", hint: "Alta resolución" },
  svg: { label: "Imagen SVG", icon: "polyline", hint: "Vectorial, editable" },
  csv: { label: "Datos CSV", icon: "table_view", hint: "Excel, Sheets" },
  xlsx: { label: "Excel (XLSX)", icon: "grid_on", hint: "Con formato" },
  json: { label: "JSON", icon: "data_object", hint: "Para desarrolladores" },
  copy: { label: "Copiar datos", icon: "content_copy", hint: "Pegar como tabla" },
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const rangeFromDays = (days: number): CnChartDateRange => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  return { from: isoDate(from), to: isoDate(to) };
};

const FRAME_SX: Record<NonNullable<CnChartCardProps["frame"]>, Record<string, unknown>> = {
  card: {
    borderRadius: "12px",
    border: "1px solid var(--cn-color-border, #dde0e4)",
    backgroundColor: "var(--cn-color-surface, #ffffff)",
    p: { xs: "14px 14px", sm: "18px 20px" },
  },
  outlined: {
    borderRadius: "12px",
    border: "1px solid var(--cn-color-border, #dde0e4)",
    p: { xs: "14px", sm: "18px 20px" },
  },
  elevated: {
    borderRadius: "12px",
    backgroundColor: "var(--cn-color-surface, #ffffff)",
    boxShadow: "0 1px 2px rgba(17, 20, 24, 0.06), 0 8px 24px rgba(17, 20, 24, 0.06)",
    p: { xs: "14px", sm: "18px 20px" },
  },
  plain: {},
};

const toolbarIconSx = {
  width: 32,
  height: 32,
  color: "var(--cn-color-neutral-600, #4e5660)",
  "&:hover": { backgroundColor: "rgba(37, 77, 135, 0.06)" },
};

// ─── Componente ───────────────────────────────────────────────────────

/**
 * Tarjeta para gráficas: encabezado, resumen, periodo, tipo de gráfica,
 * exportación (PNG/SVG/CSV/XLSX/JSON), pantalla completa y estados de carga,
 * vacío y error. Funciona con cualquier contenido.
 */
export const CnChartCard = ({
  title,
  subtitle,
  icon,
  children,
  height = 300,
  frame = "card",
  summary,
  footer,
  loading = false,
  skeleton,
  error,
  onRetry,
  empty = false,
  emptyTitle = "Sin datos para mostrar",
  emptyDescription = "Cuando haya información aparecerá aquí.",
  emptyIcon = "insights",
  actions = [],
  toolbar,
  periods,
  period: periodProp,
  defaultPeriod = "month",
  onPeriodChange,
  customRange = true,
  typeOptions,
  type,
  onTypeChange,
  onRefresh,
  exportFormats = ["png", "svg", "csv", "xlsx", "json", "copy"],
  exportData,
  exportFilename,
  fullscreenable = true,
  shareable = false,
  onShare,
  ariaLabel,
  sx,
  className,
}: CnChartCardProps) => {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const fullscreenBodyRef = useRef<HTMLDivElement | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const [periodAnchor, setPeriodAnchor] = useState<HTMLElement | null>(null);
  const [rangeAnchor, setRangeAnchor] = useState<HTMLElement | null>(null);
  const [innerPeriod, setInnerPeriod] = useState(defaultPeriod);
  const [range, setRange] = useState<CnChartDateRange>(() => rangeFromDays(30));

  const periodList = periods === true ? CN_CHART_DEFAULT_PERIODS : periods || [];
  const period = periodProp ?? innerPeriod;
  const periodLabel =
    period === "custom"
      ? `${range.from} – ${range.to}`
      : (periodList.find((p) => p.value === period)?.label ?? "Periodo");
  const filename = exportFilename ?? toFilename(typeof title === "string" ? title : undefined);
  const data = typeof exportData === "function" ? undefined : exportData;
  const resolveData = () => (typeof exportData === "function" ? exportData() : data);
  const hasData = Boolean(exportData);
  const formats = (exportFormats || []).filter((f) => f === "png" || f === "svg" || hasData);
  const showState = loading || Boolean(error) || empty;

  const selectPeriod = (value: string, nextRange: CnChartDateRange | null) => {
    setInnerPeriod(value);
    onPeriodChange?.(value, nextRange);
  };

  const refresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const runExport = async (format: CnChartExportFormat) => {
    setExportAnchor(null);
    const container = fullscreen ? fullscreenBodyRef.current : bodyRef.current;
    if (format === "png" || format === "svg") {
      const svg = findChartSvg(container);
      if (!svg) {
        setNotice("No se encontró la gráfica para exportar");
        return;
      }
      if (format === "svg") downloadSvg(svg, filename);
      else {
        const ok = await downloadPng(svg, filename);
        if (!ok) setNotice("No se pudo generar la imagen");
      }
      return;
    }
    const payload = resolveData();
    if (!payload) return;
    if (format === "copy") {
      const ok = await copyRows(payload.columns, payload.rows, "tsv");
      setNotice(ok ? "Datos copiados al portapapeles" : "No se pudieron copiar los datos");
      return;
    }
    exportRows(format, payload.columns, payload.rows, filename, {
      title: typeof title === "string" ? title : undefined,
    });
  };

  const share = async () => {
    if (onShare) {
      onShare();
      return;
    }
    const text = [title, subtitle].filter((v) => typeof v === "string").join(" — ");
    try {
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      if (nav && typeof nav.share === "function") {
        await nav.share({ title: typeof title === "string" ? title : "Gráfica", text });
        return;
      }
      await nav?.clipboard.writeText(text);
      setNotice("Copiado al portapapeles");
    } catch {
      /* el usuario canceló */
    }
  };

  const inlineActions = actions.filter((a) => a.inline);
  const menuActions = actions.filter((a) => !a.inline);
  const hasMenu = menuActions.length > 0 || shareable;

  const renderBody = (bodyHeight: number, isFullscreen: boolean) => {
    if (loading) {
      return (
        skeleton ?? (
          <Box
            role="status"
            aria-busy="true"
            aria-label="Cargando gráfica"
            sx={{
              height: bodyHeight,
              borderRadius: "8px",
              backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
            }}
          />
        )
      );
    }
    if (error) {
      return (
        <Box sx={{ minHeight: Math.min(bodyHeight, 260), display: "grid", placeItems: "center" }}>
          <CnEmptyState
            variant="compact"
            color="error"
            icon="error_outline"
            role="alert"
            title="No se pudo cargar la gráfica"
            description={typeof error === "boolean" ? "Intenta de nuevo en unos momentos." : error}
            action={
              onRetry ? (
                <CnButton size="small" variant="outlined" startIcon="refresh" onClick={onRetry}>
                  Reintentar
                </CnButton>
              ) : undefined
            }
          />
        </Box>
      );
    }
    if (empty) {
      return (
        <Box sx={{ minHeight: Math.min(bodyHeight, 260), display: "grid", placeItems: "center" }}>
          <CnEmptyState
            variant="compact"
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        </Box>
      );
    }
    return typeof children === "function"
      ? children({ height: bodyHeight, fullscreen: isFullscreen })
      : children;
  };

  const header = (isFullscreen: boolean) => {
    const hasHeader =
      title ||
      subtitle ||
      icon ||
      toolbar ||
      periodList.length > 0 ||
      typeOptions?.length ||
      onRefresh ||
      formats.length > 0 ||
      fullscreenable ||
      hasMenu ||
      inlineActions.length > 0;
    if (!hasHeader || (frame === "plain" && !title && !toolbar && !periodList.length)) return null;
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "10px 12px",
          mb: "14px",
        }}
      >
        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: "10px",
              display: "grid",
              placeItems: "center",
              color: "var(--cn-color-brand-600, #254d87)",
              backgroundColor: "var(--cn-color-brand-50, #eef3fb)",
            }}
          >
            <CnIcon name={icon} size="sm" />
          </Box>
        )}
        <Box sx={{ flex: "1 1 180px", minWidth: 0 }}>
          {title && (
            <Box
              component="h3"
              sx={{
                m: 0,
                fontSize: "0.98rem",
                fontWeight: 700,
                lineHeight: 1.3,
                color: "var(--cn-color-text-primary, #111418)",
              }}
            >
              {title}
            </Box>
          )}
          {subtitle && (
            <Box
              sx={{
                mt: "2px",
                fontSize: "0.8rem",
                color: "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              {subtitle}
            </Box>
          )}
        </Box>

        <Box
          data-cn-chart-ignore
          sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}
        >
          {toolbar}
          {typeOptions && typeOptions.length > 1 && (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={type}
              onChange={(_, value) => value && onTypeChange?.(value)}
              aria-label="Tipo de gráfica"
              sx={{
                mr: "4px",
                "& .MuiToggleButton-root": {
                  px: "8px",
                  py: "4px",
                  border: "1px solid var(--cn-color-border, #dde0e4)",
                  color: "var(--cn-color-neutral-500, #6e7682)",
                  "&.Mui-selected": {
                    color: "var(--cn-color-accent-600, #304ffe)",
                    backgroundColor: "rgba(61, 90, 254, 0.08)",
                  },
                },
              }}
            >
              {typeOptions.map((option) => (
                <ToggleButton key={option.value} value={option.value} aria-label={option.label}>
                  <Tooltip title={option.label}>
                    <Box component="span" sx={{ display: "flex" }}>
                      <CnIcon name={option.icon} size="sm" />
                    </Box>
                  </Tooltip>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
          {periodList.length > 0 && (
            <CnButton
              size="small"
              variant="outlined"
              color="accent"
              startIcon="calendar_month"
              endIcon="expand_more"
              onClick={(event) => setPeriodAnchor(event.currentTarget)}
              aria-label={`Periodo: ${periodLabel}`}
              sx={{ mr: "4px", height: 32, fontSize: "0.78rem" }}
            >
              {periodLabel}
            </CnButton>
          )}
          {inlineActions.map((action) => (
            <Tooltip key={action.id ?? action.label} title={action.label}>
              <span>
                <IconButton
                  size="small"
                  aria-label={action.label}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  sx={toolbarIconSx}
                >
                  <CnIcon name={action.icon ?? "bolt"} size="sm" />
                </IconButton>
              </span>
            </Tooltip>
          ))}
          {onRefresh && (
            <Tooltip title="Actualizar">
              <span>
                <IconButton
                  size="small"
                  aria-label="Actualizar"
                  onClick={refresh}
                  disabled={refreshing}
                  sx={{
                    ...toolbarIconSx,
                    ...(refreshing && {
                      "& svg": { animation: "cn-chart-spin 0.9s linear infinite" },
                      "@keyframes cn-chart-spin": { to: { transform: "rotate(360deg)" } },
                    }),
                  }}
                >
                  <CnIcon name="refresh" size="sm" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {formats.length > 0 && !showState && (
            <Tooltip title="Descargar">
              <IconButton
                size="small"
                aria-label="Descargar"
                aria-haspopup="menu"
                onClick={(event) => setExportAnchor(event.currentTarget)}
                sx={toolbarIconSx}
              >
                <CnIcon name="download" size="sm" />
              </IconButton>
            </Tooltip>
          )}
          {fullscreenable && (
            <Tooltip title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
              <IconButton
                size="small"
                aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                onClick={() => setFullscreen(!isFullscreen)}
                sx={toolbarIconSx}
              >
                <CnIcon name={isFullscreen ? "fullscreen_exit" : "fullscreen"} size="sm" />
              </IconButton>
            </Tooltip>
          )}
          {hasMenu && (
            <IconButton
              size="small"
              aria-label="Más opciones"
              aria-haspopup="menu"
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              sx={toolbarIconSx}
            >
              <CnIcon name="more_vert" size="sm" />
            </IconButton>
          )}
        </Box>
      </Box>
    );
  };

  const summaryBlock = summary && !loading && !error && !empty && (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        flexWrap: "wrap",
        gap: "4px 10px",
        mb: "12px",
      }}
    >
      <Box
        sx={{
          fontSize: "1.6rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--cn-color-text-primary, #111418)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {summary.value}
      </Box>
      {summary.trend != null && Number.isFinite(summary.trend) && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
            px: "8px",
            py: "2px",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            ...(summary.trend >= 0 !== Boolean(summary.invertTrend)
              ? {
                  color: "var(--cn-color-success-600, #228740)",
                  backgroundColor: "var(--cn-color-success-50, #eaf7ee)",
                }
              : {
                  color: "var(--cn-color-error-600, #b52f2f)",
                  backgroundColor: "var(--cn-color-error-50, #fcecec)",
                }),
          }}
        >
          <CnIcon name={summary.trend >= 0 ? "trending_up" : "trending_down"} size="xs" />
          {`${summary.trend >= 0 ? "+" : ""}${summary.trend.toFixed(1)}%`}
        </Box>
      )}
      {(summary.label || summary.trendLabel) && (
        <Box sx={{ fontSize: "0.78rem", color: "var(--cn-color-text-muted, #6e7682)" }}>
          {summary.label}
          {summary.label && summary.trendLabel ? " · " : ""}
          {summary.trendLabel}
        </Box>
      )}
    </Box>
  );

  const content = (isFullscreen: boolean) => (
    <>
      {header(isFullscreen)}
      {summaryBlock}
      <Box
        ref={isFullscreen ? fullscreenBodyRef : bodyRef}
        sx={{ position: "relative", minWidth: 0, ...(isFullscreen && { flex: 1, minHeight: 0 }) }}
      >
        {renderBody(
          isFullscreen ? Math.max(height, window.innerHeight - 200) : height,
          isFullscreen,
        )}
      </Box>
      {footer && !loading && (
        <Box
          sx={{
            mt: "14px",
            pt: "12px",
            borderTop: "1px solid var(--cn-color-border, #eceef1)",
            fontSize: "0.8rem",
            color: "var(--cn-color-text-muted, #6e7682)",
          }}
        >
          {footer}
        </Box>
      )}
    </>
  );

  return (
    <Box
      component="section"
      aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
      aria-busy={loading || undefined}
      className={className}
      sx={[
        { width: "100%", minWidth: 0, boxSizing: "border-box" },
        FRAME_SX[frame],
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {content(false)}

      <Dialog
        fullScreen
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        aria-label={typeof title === "string" ? title : "Gráfica"}
        slotProps={{
          paper: {
            sx: {
              p: { xs: "14px", md: "24px 28px" },
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
            },
          },
        }}
      >
        {fullscreen && content(true)}
      </Dialog>

      {/* Exportar */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 220, borderRadius: "10px" } } }}
      >
        {formats.map((format, index) => [
          index > 0 && formats[index - 1] === "svg" && format !== "svg" ? (
            <Divider key={`d-${format}`} />
          ) : null,
          <MenuItem key={format} onClick={() => void runExport(format)}>
            <ListItemIcon>
              <CnIcon name={EXPORT_LABELS[format].icon} size="sm" />
            </ListItemIcon>
            <ListItemText
              primary={EXPORT_LABELS[format].label}
              secondary={EXPORT_LABELS[format].hint}
              primaryTypographyProps={{ fontSize: "0.84rem", fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: "0.72rem" }}
            />
          </MenuItem>,
        ])}
      </Menu>

      {/* Más opciones */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 200, borderRadius: "10px" } } }}
      >
        {menuActions.map((action) => (
          <MenuItem
            key={action.id ?? action.label}
            disabled={action.disabled}
            onClick={() => {
              setMenuAnchor(null);
              action.onClick();
            }}
          >
            {action.icon && (
              <ListItemIcon>
                <CnIcon name={action.icon} size="sm" />
              </ListItemIcon>
            )}
            <ListItemText primaryTypographyProps={{ fontSize: "0.84rem", fontWeight: 600 }}>
              {action.label}
            </ListItemText>
          </MenuItem>
        ))}
        {shareable && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              void share();
            }}
          >
            <ListItemIcon>
              <CnIcon name="share" size="sm" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.84rem", fontWeight: 600 }}>
              Compartir
            </ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Periodo */}
      <Menu
        anchorEl={periodAnchor}
        open={Boolean(periodAnchor)}
        onClose={() => setPeriodAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 190, borderRadius: "10px" } } }}
      >
        {periodList.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === period}
            onClick={() => {
              setPeriodAnchor(null);
              selectPeriod(option.value, option.days ? rangeFromDays(option.days) : null);
            }}
            sx={{ fontSize: "0.84rem" }}
          >
            {option.label}
          </MenuItem>
        ))}
        {customRange && <Divider />}
        {customRange && (
          <MenuItem
            selected={period === "custom"}
            onClick={(event) => {
              setRangeAnchor(periodAnchor ?? event.currentTarget);
              setPeriodAnchor(null);
            }}
            sx={{ fontSize: "0.84rem" }}
          >
            <ListItemIcon>
              <CnIcon name="date_range" size="sm" />
            </ListItemIcon>
            Personalizado…
          </MenuItem>
        )}
      </Menu>
      <Popover
        open={Boolean(rangeAnchor)}
        anchorEl={rangeAnchor}
        onClose={() => setRangeAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: "16px", borderRadius: "12px", width: 280 } } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Box sx={{ fontSize: "0.82rem", fontWeight: 700 }}>Rango personalizado</Box>
          <TextField
            label="Desde"
            type="date"
            size="small"
            value={range.from}
            onChange={(event) => setRange((r) => ({ ...r, from: event.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={range.to}
            error={range.to < range.from}
            helperText={range.to < range.from ? "Debe ser posterior a la fecha inicial" : undefined}
            onChange={(event) => setRange((r) => ({ ...r, to: event.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <CnButton size="small" variant="text" onClick={() => setRangeAnchor(null)}>
              Cancelar
            </CnButton>
            <CnButton
              size="small"
              variant="contained"
              color="accent"
              disabled={!range.from || !range.to || range.to < range.from}
              onClick={() => {
                setRangeAnchor(null);
                selectPeriod("custom", range);
              }}
            >
              Aplicar
            </CnButton>
          </Box>
        </Box>
      </Popover>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
        message={notice}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};
