import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import type { ReactNode } from "react";
import { useState } from "react";
import { CnButton } from "../CnButton";
import { CnChip } from "../CnChip";
import { CnIcon } from "../CnIcon";
import type { CnTimelineExportFormat, CnTimelineFilter } from "./CnTimeline.types";

const EXPORT_LABEL: Record<CnTimelineExportFormat, { label: string; icon: string }> = {
  csv: { label: "CSV (hoja de cálculo)", icon: "table_chart" },
  json: { label: "JSON", icon: "data_object" },
};

/** Barra de `CnTimeline`: búsqueda, chips de filtro, expandir todo y exportar. */
export const TimelineToolbar = ({
  searchable,
  query,
  onQueryChange,
  searchPlaceholder,
  filters,
  active,
  onToggleFilter,
  onClearFilters,
  expandToggle,
  expanded,
  onToggleExpanded,
  exportFormats,
  onExport,
  extra,
}: {
  searchable: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  searchPlaceholder: string;
  filters: readonly CnTimelineFilter[];
  active: readonly string[];
  onToggleFilter: (id: string) => void;
  onClearFilters: () => void;
  expandToggle: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  exportFormats: readonly CnTimelineExportFormat[];
  onExport: (format: CnTimelineExportFormat) => void;
  extra?: ReactNode;
}) => {
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const hasActions = expandToggle || exportFormats.length > 0 || Boolean(extra);

  return (
    <Box
      data-cn-timeline-toolbar
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        mb: "16px",
        minWidth: 0,
        "@media print": { display: "none" },
      }}
    >
      {(searchable || hasActions) && (
        <Box
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", minWidth: 0 }}
        >
          {searchable && (
            <InputBase
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={searchPlaceholder}
              inputProps={{ "aria-label": "Buscar en el historial", type: "search" }}
              startAdornment={
                <CnIcon
                  name="search"
                  size={18}
                  sx={{
                    color: "var(--cn-color-text-muted, var(--cn-color-neutral-500, #6e7682))",
                    mr: "6px",
                  }}
                />
              }
              endAdornment={
                query ? (
                  <IconButton
                    size="small"
                    aria-label="Limpiar búsqueda"
                    onClick={() => onQueryChange("")}
                  >
                    <CnIcon name="close" size={16} />
                  </IconButton>
                ) : undefined
              }
              data-cn-timeline-search
              sx={{
                flex: "1 1 200px",
                maxWidth: 360,
                minWidth: 0,
                height: 34,
                px: "10px",
                fontSize: 13,
                borderRadius: "999px",
                backgroundColor: "var(--cn-color-bg, var(--cn-color-neutral-50, #fafbfc))",
                border: "1px solid var(--cn-color-border, #dde0e4)",
                transition: "border-color 140ms ease, box-shadow 140ms ease",
                "&.Mui-focused": {
                  backgroundColor: "var(--cn-color-surface, #fff)",
                  borderColor: "var(--cn-color-field-accent, var(--cn-color-brand-500, #3562a6))",
                  boxShadow: "0 0 0 3px rgba(53, 98, 166, 0.15)",
                },
                "& input": { minWidth: 0, textOverflow: "ellipsis" },
                "& input::-webkit-search-cancel-button": { display: "none" },
              }}
            />
          )}
          {hasActions && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "4px",
                ml: "auto",
                minWidth: 0,
              }}
            >
              {expandToggle && (
                <CnButton
                  size="small"
                  variant="text"
                  color="neutral"
                  startIcon={expanded ? "unfold_less" : "unfold_more"}
                  onClick={onToggleExpanded}
                  data-cn-timeline-expand-all
                >
                  {expanded ? "Contraer todo" : "Expandir todo"}
                </CnButton>
              )}
              {exportFormats.length > 0 && (
                <>
                  <CnButton
                    size="small"
                    variant="outlined"
                    color="neutral"
                    startIcon="download"
                    aria-haspopup={exportFormats.length > 1 ? "menu" : undefined}
                    aria-expanded={exportFormats.length > 1 ? Boolean(exportAnchor) : undefined}
                    onClick={(event) => {
                      if (exportFormats.length === 1) onExport(exportFormats[0]);
                      else setExportAnchor(event.currentTarget as HTMLElement);
                    }}
                    data-cn-timeline-export
                  >
                    Exportar
                  </CnButton>
                  <Menu
                    open={Boolean(exportAnchor)}
                    anchorEl={exportAnchor}
                    onClose={() => setExportAnchor(null)}
                    slotProps={{
                      paper: {
                        sx: {
                          borderRadius: "12px",
                          minWidth: 200,
                          "& .MuiMenuItem-root": { fontSize: 13, borderRadius: "8px", mx: "6px" },
                          "& .MuiListItemIcon-root": { minWidth: 30 },
                        },
                      },
                    }}
                  >
                    {exportFormats.map((format) => (
                      <MenuItem
                        key={format}
                        onClick={() => {
                          setExportAnchor(null);
                          onExport(format);
                        }}
                      >
                        <ListItemIcon>
                          <CnIcon name={EXPORT_LABEL[format].icon} size="sm" />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: 13 }}>
                          {EXPORT_LABEL[format].label}
                        </ListItemText>
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}
              {extra}
            </Box>
          )}
        </Box>
      )}
      {filters.length > 0 && (
        <Box
          role="group"
          aria-label="Filtrar historial"
          data-cn-timeline-filters
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", minWidth: 0 }}
        >
          {filters.map((filter) => {
            const on = active.includes(filter.id);
            return (
              <CnChip
                key={filter.id}
                size="small"
                label={filter.label}
                icon={on ? "check" : filter.icon}
                color={on ? (filter.color ?? "primary") : "neutral"}
                variant={on ? "soft" : "outlined"}
                onClick={() => onToggleFilter(filter.id)}
                aria-pressed={on}
                data-cn-timeline-filter={filter.id}
                sx={{ maxWidth: "100%" }}
              />
            );
          })}
          {active.length > 0 && (
            <CnButton size="small" variant="text" color="neutral" onClick={onClearFilters}>
              Quitar filtros
            </CnButton>
          )}
        </Box>
      )}
    </Box>
  );
};
