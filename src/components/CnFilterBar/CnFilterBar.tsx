import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef, useId, useState } from "react";
import { CnButton } from "../CnButton";
import { CnChip } from "../CnChip";
import { CnIcon } from "../CnIcon";
import { CnSearchField } from "../CnSearchField";
import { CnSelectField } from "../CnSelectField";
import { CnTextField } from "../CnTextField";
import { CnFilterBarSkeleton } from "./CnFilterBarSkeleton";

export type CnFilterValue = string | string[];

export type CnFilterDefinition = {
  id: string;
  label: string;
  /** `select` = un valor; `multiselect` = varios; `text` = texto libre. */
  type: "select" | "multiselect" | "text";
  options?: readonly { value: string; label: string }[];
  placeholder?: string;
};

export type CnQuickFilter = {
  id: string;
  label: string;
  icon?: string;
  /** Cuántos resultados tiene (se muestra junto a la etiqueta). */
  count?: number;
};

export type CnSavedView = { id: string; label: string };

export type CnFilterBarProps = {
  /** Texto de búsqueda (controlado). Sin `onSearchChange` no hay buscador. */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Chips de un clic ("Mis oportunidades", "Vencidas"). */
  quickFilters?: readonly CnQuickFilter[];
  activeQuickFilters?: readonly string[];
  onQuickFiltersChange?: (ids: string[]) => void;
  /** Filtros del panel "Filtros". */
  filters?: readonly CnFilterDefinition[];
  values?: Readonly<Record<string, CnFilterValue | undefined>>;
  onValuesChange?: (values: Record<string, CnFilterValue | undefined>) => void;
  /** Vistas guardadas. */
  views?: readonly CnSavedView[];
  activeViewId?: string;
  onViewChange?: (id: string) => void;
  /** Muestra "Guardar vista actual" en el menú de vistas. */
  onSaveView?: (name: string) => void;
  /** Total de resultados con los filtros aplicados. */
  resultCount?: number;
  /** Texto del total ("oportunidades"). */
  resultNoun?: string;
  /** Contenido a la derecha (ordenar, exportar). */
  actions?: ReactNode;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

const isActive = (value: CnFilterValue | undefined) =>
  Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";

/** Texto del chip de un filtro activo ("Etapa: Propuesta, Negociación"). */
export const describeFilterValue = (
  definition: CnFilterDefinition,
  value: CnFilterValue,
): string => {
  const values = Array.isArray(value) ? value : [value];
  const labels = values.map(
    (v) => definition.options?.find((option) => option.value === v)?.label ?? v,
  );
  return `${definition.label}: ${labels.join(", ")}`;
};

/** Barra de filtros: búsqueda, filtros rápidos, panel de filtros con chips activos y vistas guardadas. */
export const CnFilterBar = forwardRef<HTMLDivElement, CnFilterBarProps>(function CnFilterBar(
  {
    search,
    onSearchChange,
    searchPlaceholder = "Buscar",
    quickFilters = [],
    activeQuickFilters = [],
    onQuickFiltersChange,
    filters = [],
    values = {},
    onValuesChange,
    views = [],
    activeViewId,
    onViewChange,
    onSaveView,
    resultCount,
    resultNoun = "resultados",
    actions,
    skeleton = false,
    ariaLabel = "Filtros",
    sx,
    className,
  },
  ref,
) {
  const panelId = useId();
  const viewsId = useId();
  const [panelAnchor, setPanelAnchor] = useState<HTMLElement | null>(null);
  const [viewsAnchor, setViewsAnchor] = useState<HTMLElement | null>(null);
  const [saveAnchor, setSaveAnchor] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState<Record<string, CnFilterValue | undefined>>({});
  const [viewName, setViewName] = useState("");

  if (skeleton) {
    return (
      <CnFilterBarSkeleton
        search={Boolean(onSearchChange)}
        quickFilters={quickFilters.length}
        views={views.length > 0}
        sx={sx}
        className={className}
      />
    );
  }

  const active = filters.filter((f) => isActive(values[f.id]));
  const hasAny = active.length > 0 || activeQuickFilters.length > 0 || Boolean(search);
  const activeView = views.find((v) => v.id === activeViewId);

  const openPanel = (anchor: HTMLElement) => {
    setDraft({ ...values });
    setPanelAnchor(anchor);
  };
  const apply = () => {
    onValuesChange?.(draft);
    setPanelAnchor(null);
  };
  const removeFilter = (id: string) => onValuesChange?.({ ...values, [id]: undefined });
  const toggleQuick = (id: string) =>
    onQuickFiltersChange?.(
      activeQuickFilters.includes(id)
        ? activeQuickFilters.filter((q) => q !== id)
        : [...activeQuickFilters, id],
    );
  const clearAll = () => {
    onValuesChange?.(Object.fromEntries(filters.map((f) => [f.id, undefined])));
    onQuickFiltersChange?.([]);
    onSearchChange?.("");
  };
  const saveView = () => {
    const name = viewName.trim();
    if (!name) return;
    onSaveView?.(name);
    setViewName("");
    setSaveAnchor(null);
  };

  return (
    <Box
      ref={ref}
      role="search"
      aria-label={ariaLabel}
      data-cn-filter-bar
      className={className}
      sx={[
        {
          minWidth: 0,
          maxWidth: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          color: "var(--cn-color-text, #222831)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", minWidth: 0 }}
      >
        {views.length > 0 && (
          <>
            <CnButton
              variant="outlined"
              color="neutral"
              startIcon="bookmark"
              endIcon="expand_more"
              aria-haspopup="menu"
              aria-expanded={Boolean(viewsAnchor)}
              aria-controls={viewsAnchor ? viewsId : undefined}
              onClick={(event) => setViewsAnchor(event.currentTarget)}
              sx={{ maxWidth: "100%" }}
            >
              <Box
                component="span"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {activeView ? activeView.label : "Vistas"}
              </Box>
            </CnButton>
            <Menu
              id={viewsId}
              anchorEl={viewsAnchor}
              open={Boolean(viewsAnchor)}
              onClose={() => setViewsAnchor(null)}
            >
              {views.map((view) => (
                <MenuItem
                  key={view.id}
                  selected={view.id === activeViewId}
                  onClick={() => {
                    setViewsAnchor(null);
                    onViewChange?.(view.id);
                  }}
                  sx={{ gap: "12px", fontSize: "14px" }}
                >
                  <Box sx={{ width: "18px", display: "flex" }}>
                    {view.id === activeViewId && <CnIcon name="check" size={18} />}
                  </Box>
                  {view.label}
                </MenuItem>
              ))}
              {onSaveView && <Divider />}
              {onSaveView && (
                <MenuItem
                  onClick={() => {
                    setSaveAnchor(viewsAnchor);
                    setViewsAnchor(null);
                  }}
                  sx={{ gap: "12px", fontSize: "14px" }}
                >
                  <CnIcon name="add" size={18} />
                  Guardar vista actual
                </MenuItem>
              )}
            </Menu>
            <Popover
              open={Boolean(saveAnchor)}
              anchorEl={saveAnchor}
              onClose={() => setSaveAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              slotProps={{ paper: { sx: { p: "16px", width: "min(320px, 90vw)", mt: "4px" } } }}
            >
              <Box
                component="form"
                aria-label="Guardar vista"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveView();
                }}
                sx={{ display: "flex", flexDirection: "column", gap: "12px" }}
              >
                <CnTextField
                  label="Nombre de la vista"
                  value={viewName}
                  onChange={setViewName}
                  size="sm"
                  autoFocus
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <CnButton variant="text" color="neutral" onClick={() => setSaveAnchor(null)}>
                    Cancelar
                  </CnButton>
                  <CnButton type="submit" variant="contained" disabled={!viewName.trim()}>
                    Guardar
                  </CnButton>
                </Box>
              </Box>
            </Popover>
          </>
        )}

        {onSearchChange && (
          <Box sx={{ flex: "1 1 220px", minWidth: 0, maxWidth: "420px" }}>
            <CnSearchField
              value={search ?? ""}
              onChange={(value) => onSearchChange(value ?? "")}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              size="sm"
              clearable
              recentSearches={false}
            />
          </Box>
        )}

        {filters.length > 0 && (
          <>
            <CnButton
              variant="outlined"
              color={active.length > 0 ? "primary" : "neutral"}
              startIcon="filter_list"
              aria-haspopup="dialog"
              aria-expanded={Boolean(panelAnchor)}
              aria-controls={panelAnchor ? panelId : undefined}
              onClick={(event) => openPanel(event.currentTarget)}
            >
              {active.length > 0 ? `Filtros (${active.length})` : "Filtros"}
            </CnButton>
            <Popover
              open={Boolean(panelAnchor)}
              anchorEl={panelAnchor}
              onClose={() => setPanelAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              slotProps={{
                paper: {
                  id: panelId,
                  role: "dialog",
                  "aria-label": "Filtros",
                  sx: { p: "16px", width: "min(360px, 92vw)", mt: "4px" },
                } as object,
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filters.map((filter) =>
                  filter.type === "text" ? (
                    <CnTextField
                      key={filter.id}
                      label={filter.label}
                      placeholder={filter.placeholder}
                      value={(draft[filter.id] as string | undefined) ?? ""}
                      onChange={(value) => setDraft((d) => ({ ...d, [filter.id]: value }))}
                      size="sm"
                    />
                  ) : (
                    <CnSelectField
                      key={filter.id}
                      label={filter.label}
                      placeholder={filter.placeholder}
                      multiple={filter.type === "multiselect"}
                      chips={filter.type === "multiselect"}
                      clearable
                      options={filter.options ?? []}
                      value={
                        filter.type === "multiselect"
                          ? ((draft[filter.id] as string[] | undefined) ?? [])
                          : ((draft[filter.id] as string | undefined) ?? "")
                      }
                      onChange={(value) =>
                        setDraft((d) => ({
                          ...d,
                          [filter.id]: Array.isArray(value)
                            ? value.map(String)
                            : value === null || value === ""
                              ? undefined
                              : String(value),
                        }))
                      }
                      size="sm"
                    />
                  ),
                )}
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", gap: "8px", pt: "4px" }}
                >
                  <CnButton
                    variant="text"
                    color="neutral"
                    onClick={() =>
                      setDraft(Object.fromEntries(filters.map((f) => [f.id, undefined])))
                    }
                  >
                    Limpiar
                  </CnButton>
                  <CnButton variant="contained" onClick={apply}>
                    Aplicar
                  </CnButton>
                </Box>
              </Box>
            </Popover>
          </>
        )}

        {actions && (
          <Box
            sx={{ ml: "auto", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}
          >
            {actions}
          </Box>
        )}
      </Box>

      {(quickFilters.length > 0 || active.length > 0 || resultCount !== undefined) && (
        <Box
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", minWidth: 0 }}
        >
          {quickFilters.length > 0 && (
            <Box role="group" aria-label="Filtros rápidos" sx={{ display: "contents" }}>
              {quickFilters.map((quick) => {
                const on = activeQuickFilters.includes(quick.id);
                return (
                  <CnChip
                    key={quick.id}
                    label={
                      quick.count !== undefined ? `${quick.label} · ${quick.count}` : quick.label
                    }
                    icon={on ? "check" : quick.icon}
                    variant={on ? "filled" : "outlined"}
                    color={on ? "primary" : "neutral"}
                    clickable
                    aria-pressed={on}
                    onClick={() => toggleQuick(quick.id)}
                  />
                );
              })}
            </Box>
          )}
          {active.map((filter) => (
            <CnChip
              key={filter.id}
              label={describeFilterValue(filter, values[filter.id] as CnFilterValue)}
              variant="soft"
              color="primary"
              onDelete={() => removeFilter(filter.id)}
              aria-label={`Quitar filtro ${describeFilterValue(filter, values[filter.id] as CnFilterValue)}`}
            />
          ))}
          {hasAny && (onValuesChange || onQuickFiltersChange || onSearchChange) && (
            <CnButton variant="text" color="neutral" size="small" onClick={clearAll}>
              Limpiar todo
            </CnButton>
          )}
          {resultCount !== undefined && (
            <Box
              role="status"
              sx={{ ml: "auto", fontSize: "12px", color: "var(--cn-color-text-muted, #6e7682)" }}
            >
              {new Intl.NumberFormat("es-MX").format(resultCount)} {resultNoun}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
});
