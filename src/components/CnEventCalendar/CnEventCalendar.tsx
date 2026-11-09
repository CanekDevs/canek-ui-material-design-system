import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import { useTheme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CnButton } from "../CnButton";
import { CnChip } from "../CnChip";
import { printRows } from "../CnDataTable/export";
import { CnIcon } from "../CnIcon";
import type { CnEventCalendarContextValue } from "./calendar-context";
import { CnEventCalendarContext } from "./calendar-context";
import {
  filterEvents,
  formatDayLong,
  formatOccurrenceTime,
  getOccurrences,
  getTimeGridDays,
  getViewTitle,
  getVisibleRange,
  holidayMap,
  isOutOfBounds,
  occursOnDay,
  resolveColor,
  shiftDate,
  startOfDay,
  toDate,
  toIsoDate,
  VIEW_LABELS,
} from "./calendar-utils";
import type {
  CnCalendarEvent,
  CnCalendarSlot,
  CnEventCalendarProps,
  CnEventCalendarView,
  CnEventChange,
  CnEventOccurrence,
} from "./CnEventCalendar.types";
import { CnEventCalendarSkeleton } from "./CnEventCalendarSkeleton";
import { DayListPopover, EventPopover, STATUS_META } from "./EventPopover";
import { downloadIcs } from "./ics";
import { AgendaView } from "./views/AgendaView";
import { MonthView } from "./views/MonthView";
import { TimeGridView, useNow } from "./views/TimeGridView";
import { YearView } from "./views/YearView";

const DEFAULT_VIEWS: CnEventCalendarView[] = ["month", "week", "day", "agenda", "year"];

const VIEW_ICONS: Record<CnEventCalendarView, string> = {
  month: "calendar_month",
  week: "view_column",
  day: "today",
  agenda: "view_agenda",
  quarter: "view_module",
  year: "grid_view",
};

const FRAME_SX = {
  card: {
    borderRadius: "12px",
    border: "1px solid var(--cn-color-border, #dde0e4)",
    backgroundColor: "var(--cn-color-surface, #ffffff)",
    p: { xs: "12px", sm: "16px 18px" },
  },
  outlined: {
    borderRadius: "12px",
    border: "1px solid var(--cn-color-border, #dde0e4)",
    p: { xs: "12px", sm: "16px 18px" },
  },
  plain: {},
} as const;

/** Padding del texto en px (en `sx` un número se multiplica por el spacing). */
const CHIP_LABEL_SX = { "& .MuiChip-label": { paddingInline: "8px" } };

const toolbarIconSx = {
  width: 32,
  height: 32,
  color: "var(--cn-color-neutral-600, #4e5660)",
  "&:hover": { backgroundColor: "rgba(37, 77, 135, 0.06)" },
};

/**
 * Calendario de eventos y agenda: vistas mes, semana, día, agenda, trimestre y
 * año; barras de varios días, "+N más", eventos encimados lado a lado,
 * indicador de hora actual, horario laboral, arrastrar para mover o
 * seleccionar, categorías con filtro, festivos, búsqueda, exportación `.ics`,
 * impresión, pantalla completa y skeleton por vista.
 */
export const CnEventCalendar = <TMeta,>(props: CnEventCalendarProps<TMeta>) => {
  const {
    events = [],
    categories = [],
    view: viewProp,
    defaultView = "month",
    onViewChange,
    views = DEFAULT_VIEWS,
    mobileView = "agenda",
    date: dateProp,
    defaultDate,
    onDateChange,
    onRangeChange,
    onEventClick,
    onSlotClick,
    onEventChange,
    onCreateEvent,
    createLabel = "Nuevo evento",
    renderEventActions,
    onEventEdit,
    onEventDelete,
    editable = false,
    selectable,
    locale = "es-MX",
    weekStart = 1,
    slotDuration = 30,
    minHour = 0,
    maxHour = 24,
    hourHeight = 48,
    scrollToHour,
    workingHours = { start: 9, end: 18 },
    showNowIndicator = true,
    showWeekends = true,
    maxEventsPerDay = 3,
    agendaRange = "month",
    holidays,
    minDate: minDateProp,
    maxDate: maxDateProp,
    compact: compactProp = false,
    title,
    subtitle,
    toolbar,
    searchable = false,
    searchPlaceholder = "Buscar eventos…",
    search: searchProp,
    onSearchChange,
    showLegend = true,
    hiddenCategories: hiddenProp,
    defaultHiddenCategories = [],
    onHiddenCategoriesChange,
    exportable = true,
    exportFilename = "calendario",
    calendarName,
    fullscreenable = true,
    loading = false,
    skeleton = false,
    emptyTitle,
    emptyDescription,
    frame = "card",
    height,
    ariaLabel,
    sx,
    className,
  } = props;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  const now = useNow(showNowIndicator);

  // ─── Estado controlado / no controlado ──────────────────────────────
  const [innerView, setInnerView] = useState<CnEventCalendarView>(() =>
    isMobile && mobileView && views.includes(mobileView) ? mobileView : defaultView,
  );
  const view = viewProp ?? innerView;
  const [innerDate, setInnerDate] = useState<Date>(
    () => toDate(defaultDate) ?? startOfDay(new Date()),
  );
  const date = useMemo(() => toDate(dateProp) ?? innerDate, [dateProp, innerDate]);
  const [innerSearch, setInnerSearch] = useState("");
  const search = searchProp ?? innerSearch;
  const [innerHidden, setInnerHidden] = useState<string[]>(defaultHiddenCategories);
  const hidden = hiddenProp ?? innerHidden;

  const setView = (next: CnEventCalendarView) => {
    if (next === view) return;
    setInnerView(next);
    onViewChange?.(next);
  };
  const setDate = (next: Date) => {
    setInnerDate(next);
    onDateChange?.(next);
  };
  const setSearch = (next: string) => {
    setInnerSearch(next);
    onSearchChange?.(next);
  };
  const setHidden = (next: string[]) => {
    setInnerHidden(next);
    onHiddenCategoriesChange?.(next);
  };

  const [fullscreen, setFullscreen] = useState(false);
  const [popover, setPopover] = useState<{ occ: CnEventOccurrence; anchor: HTMLElement } | null>(
    null,
  );
  const [dayList, setDayList] = useState<{ day: Date; anchor: HTMLElement } | null>(null);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // ─── Datos derivados ────────────────────────────────────────────────
  const minDate = useMemo(() => toDate(minDateProp), [minDateProp]);
  const maxDate = useMemo(() => toDate(maxDateProp), [maxDateProp]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const holidaysMap = useMemo(() => holidayMap(holidays), [holidays]);
  const range = useMemo(
    () => getVisibleRange(view, date, weekStart, agendaRange),
    [view, date, weekStart, agendaRange],
  );
  const filtered = useMemo(
    () => filterEvents(events, { search, hiddenCategories: hidden, categories }),
    [events, search, hidden, categories],
  );
  const occurrences = useMemo(
    () => getOccurrences(filtered, range, categories),
    [filtered, range, categories],
  );
  const compact = compactProp || isMobile;

  // Rango visible para cargar del servidor.
  const rangeCallback = useRef(onRangeChange);
  rangeCallback.current = onRangeChange;
  const rangeStart = range.start.getTime();
  const rangeEnd = range.end.getTime();
  useEffect(() => {
    rangeCallback.current?.({ start: new Date(rangeStart), end: new Date(rangeEnd) }, view);
  }, [rangeStart, rangeEnd, view]);

  // ─── Navegación ─────────────────────────────────────────────────────
  const prevRange = getVisibleRange(
    view,
    shiftDate(view, date, -1, agendaRange),
    weekStart,
    agendaRange,
  );
  const nextRange = getVisibleRange(
    view,
    shiftDate(view, date, 1, agendaRange),
    weekStart,
    agendaRange,
  );
  const prevDisabled = Boolean(minDate && prevRange.end <= startOfDay(minDate));
  const nextDisabled = Boolean(maxDate && nextRange.start > maxDate);
  const navigate = (direction: 1 | -1) => setDate(shiftDate(view, date, direction, agendaRange));

  const isDayEnabled = useCallback(
    (day: Date) =>
      !isOutOfBounds(day, minDate, maxDate) && !holidaysMap.get(toIsoDate(day))?.blocked,
    [minDate, maxDate, holidaysMap],
  );

  const ctx: CnEventCalendarContextValue = {
    locale,
    weekStart,
    now,
    categories: categoryMap,
    holidays: holidaysMap,
    minDate,
    maxDate,
    editable: editable && Boolean(onEventChange),
    selectable: selectable ?? Boolean(onSlotClick),
    slotDuration,
    minHour: Math.max(0, Math.min(23, Math.floor(minHour))),
    maxHour: Math.max(Math.floor(minHour) + 1, Math.min(24, Math.ceil(maxHour))),
    hourHeight,
    scrollToHour,
    workingHours,
    showNowIndicator,
    openEvent: (occ, anchor) => {
      setDayList(null);
      setPopover({ occ, anchor });
      onEventClick?.(occ.event as CnCalendarEvent<TMeta>, occ as CnEventOccurrence<TMeta>);
    },
    selectSlot: (slot: CnCalendarSlot) => {
      if (!isDayEnabled(slot.start)) return;
      onSlotClick?.(slot);
    },
    changeEvent: (change: CnEventChange) => onEventChange?.(change as CnEventChange<TMeta>),
    goToDay: (day) => {
      setDayList(null);
      setDate(day);
      if (views.includes("day")) setView("day");
      else if (views.includes("week")) setView("week");
    },
    openDayList: (day, anchor) => setDayList({ day, anchor }),
    isDayEnabled,
  };

  // ─── Exportar / imprimir ────────────────────────────────────────────
  const exportIcs = (scope: "visible" | "all") => {
    setExportAnchor(null);
    const list =
      scope === "all"
        ? filtered
        : filtered.filter((e) => occurrences.some((o) => o.event.id === e.id));
    downloadIcs(list as CnCalendarEvent[], exportFilename, { calendarName, categories });
  };
  const print = () => {
    setExportAnchor(null);
    const columns = [
      { id: "date", header: "Fecha" },
      { id: "time", header: "Horario" },
      { id: "title", header: "Evento" },
      { id: "category", header: "Categoría" },
      { id: "location", header: "Lugar" },
      { id: "status", header: "Estado" },
    ];
    const rows = occurrences.map((o) => ({
      date: formatDayLong(o.start, locale),
      time: formatOccurrenceTime(o, locale).split(" · ").pop(),
      title: o.event.title,
      category: o.event.category
        ? (categoryMap.get(o.event.category)?.label ?? o.event.category)
        : "",
      location: o.event.location ?? "",
      status: o.event.status ? STATUS_META[o.event.status].label : "",
    }));
    const ok = printRows(
      columns,
      rows,
      `${typeof title === "string" ? `${title} · ` : ""}${getViewTitle(view, date, locale, weekStart, agendaRange)}`,
    );
    if (!ok) setNotice("Permite las ventanas emergentes para imprimir");
  };

  const toggleCategory = (id: string) =>
    setHidden(hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id]);

  const viewTitle = getViewTitle(view, date, locale, weekStart, agendaRange);

  if (skeleton) {
    return (
      <CnEventCalendarSkeleton
        view={view}
        compact={compact && view === "month"}
        legend={showLegend && categories.length > 0}
        frame={frame}
        days={showWeekends ? 7 : 5}
        sx={sx}
        className={className}
      />
    );
  }

  // ─── Barra ──────────────────────────────────────────────────────────
  const header = (isFullscreen: boolean) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", mb: "14px" }}>
      {(title || subtitle) && (
        <Box>
          {title && (
            <Box
              component="h2"
              sx={{
                m: 0,
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--cn-color-text, #222831)",
              }}
            >
              {title}
            </Box>
          )}
          {subtitle && (
            <Box
              sx={{ mt: "2px", fontSize: "0.8rem", color: "var(--cn-color-text-muted, #6e7682)" }}
            >
              {subtitle}
            </Box>
          )}
        </Box>
      )}
      <Box
        role="toolbar"
        aria-label="Navegación del calendario"
        sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}
      >
        <CnButton
          size="small"
          variant="outlined"
          color="neutral"
          onClick={() => setDate(startOfDay(new Date()))}
          sx={{ height: 32, px: "12px", textTransform: "none" }}
        >
          Hoy
        </CnButton>
        <Box sx={{ display: "flex" }}>
          <Tooltip title="Anterior">
            <span>
              <IconButton
                size="small"
                aria-label="Anterior"
                disabled={prevDisabled}
                onClick={() => navigate(-1)}
                sx={toolbarIconSx}
              >
                <CnIcon name="chevron_left" size="sm" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Siguiente">
            <span>
              <IconButton
                size="small"
                aria-label="Siguiente"
                disabled={nextDisabled}
                onClick={() => navigate(1)}
                sx={toolbarIconSx}
              >
                <CnIcon name="chevron_right" size="sm" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Box
          component="h2"
          aria-live="polite"
          data-cn-event-calendar-title
          sx={{
            m: 0,
            mr: "auto",
            fontSize: { xs: "0.98rem", sm: "1.1rem" },
            fontWeight: 700,
            color: "var(--cn-color-text, #222831)",
            whiteSpace: "nowrap",
          }}
        >
          {viewTitle}
        </Box>

        {searchable && (
          <InputBase
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            inputProps={{ "aria-label": "Buscar eventos" }}
            startAdornment={
              <CnIcon
                name="search"
                size={18}
                sx={{ color: "var(--cn-color-neutral-500, #6e7682)", mr: "6px" }}
              />
            }
            endAdornment={
              search ? (
                <IconButton
                  size="small"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch("")}
                >
                  <CnIcon name="close" size={14} />
                </IconButton>
              ) : undefined
            }
            sx={{
              order: { xs: 10, md: 0 },
              flex: { xs: "1 1 100%", md: "0 1 240px" },
              height: 34,
              px: "10px",
              fontSize: "0.82rem",
              borderRadius: "999px",
              backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              transition: "border-color 140ms ease, box-shadow 140ms ease",
              "&.Mui-focused": {
                backgroundColor: "var(--cn-color-surface, #fff)",
                borderColor: "var(--cn-color-brand-500, #3562a6)",
                boxShadow: "0 0 0 3px rgba(53, 98, 166, 0.15)",
              },
            }}
          />
        )}

        {views.length > 1 && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, value: CnEventCalendarView | null) => value && setView(value)}
            aria-label="Vista"
            sx={{
              height: 32,
              "& .MuiToggleButton-root": {
                px: { xs: "8px", md: "12px" },
                py: 0,
                gap: "6px",
                textTransform: "none",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "1px solid var(--cn-color-border, #dde0e4)",
                color: "var(--cn-color-neutral-600, #4e5660)",
                "&.Mui-selected": {
                  color: "var(--cn-color-accent-600, #304ffe)",
                  backgroundColor: "rgba(61, 90, 254, 0.08)",
                },
              },
            }}
          >
            {views.map((v) => (
              <ToggleButton key={v} value={v} aria-label={VIEW_LABELS[v]}>
                {isMobile ? <CnIcon name={VIEW_ICONS[v]} size={18} /> : VIEW_LABELS[v]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        {toolbar}

        {exportable && (
          <Tooltip title="Exportar e imprimir">
            <IconButton
              size="small"
              aria-label="Exportar"
              aria-haspopup="menu"
              onClick={(e) => setExportAnchor(e.currentTarget)}
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
        {onCreateEvent && (
          <CnButton
            size="small"
            variant="contained"
            color="accent"
            startIcon="add"
            onClick={onCreateEvent}
            sx={{ height: 32, textTransform: "none" }}
          >
            {createLabel}
          </CnButton>
        )}
      </Box>

      {showLegend && categories.length > 0 && (
        <Box
          role="group"
          aria-label="Categorías"
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}
        >
          {categories.map((c) => {
            const off = hidden.includes(c.id);
            const color = resolveColor(c.color);
            return (
              <CnChip
                key={c.id}
                size="small"
                variant={off ? "outlined" : "soft"}
                color="neutral"
                clickable
                aria-pressed={!off}
                data-cn-category={c.id}
                onClick={() => toggleCategory(c.id)}
                label={c.label}
                icon={
                  <Box
                    component="span"
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      ml: "8px !important",
                      backgroundColor: off ? "transparent" : color,
                      border: `2px solid ${color}`,
                      boxSizing: "border-box",
                    }}
                  />
                }
                sx={{
                  ...CHIP_LABEL_SX,
                  opacity: off ? 0.6 : 1,
                  textDecoration: off ? "line-through" : undefined,
                }}
              />
            );
          })}
          {hidden.length > 0 && (
            <CnButton
              size="small"
              variant="text"
              color="accent"
              onClick={() => setHidden([])}
              sx={{ textTransform: "none" }}
            >
              Mostrar todas
            </CnButton>
          )}
        </Box>
      )}
    </Box>
  );

  // ─── Cuerpo ─────────────────────────────────────────────────────────
  const body = (isFullscreen: boolean) => {
    if (loading) {
      return (
        <CnEventCalendarSkeleton
          view={view}
          bodyOnly
          compact={compact && view === "month"}
          days={showWeekends ? 7 : 5}
          height={Math.min(height ?? 420, 420)}
        />
      );
    }
    const gridHeight = isFullscreen ? Math.max(400, window.innerHeight - 260) : (height ?? 640);
    switch (view) {
      case "month":
        return (
          <Box
            sx={
              compact
                ? undefined
                : {
                    border: "1px solid var(--cn-color-border, #dde0e4)",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }
            }
          >
            <MonthView
              date={date}
              range={range}
              occurrences={occurrences}
              maxEventsPerDay={Math.max(1, maxEventsPerDay)}
              compact={compact}
              onNavigate={setDate}
            />
          </Box>
        );
      case "week":
      case "day":
        return (
          <Box
            sx={{
              border: "1px solid var(--cn-color-border, #dde0e4)",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <TimeGridView
              view={view}
              days={getTimeGridDays(view, date, weekStart, showWeekends)}
              occurrences={occurrences}
              height={gridHeight}
            />
          </Box>
        );
      case "agenda":
        return (
          <AgendaView
            range={range}
            occurrences={occurrences}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            dense={isMobile}
          />
        );
      case "quarter":
      case "year":
        return (
          <YearView
            range={range}
            occurrences={occurrences}
            onMonthClick={(month) => {
              setDate(month);
              if (views.includes("month")) setView("month");
            }}
          />
        );
    }
  };

  const content = (isFullscreen: boolean) => (
    <>
      {header(isFullscreen)}
      <Box
        sx={{
          position: "relative",
          minWidth: 0,
          ...(isFullscreen && { flex: 1, minHeight: 0, overflow: "auto" }),
        }}
      >
        {body(isFullscreen)}
      </Box>
    </>
  );

  const popoverOcc = popover?.occ ?? null;
  const closePopover = () => setPopover(null);
  const dayListOccurrences = dayList ? occurrences.filter((o) => occursOnDay(o, dayList.day)) : [];

  return (
    <CnEventCalendarContext.Provider value={ctx}>
      <Box
        component="section"
        aria-label={ariaLabel ?? (typeof title === "string" ? title : "Calendario de eventos")}
        aria-busy={loading || undefined}
        data-cn-event-calendar
        className={className}
        sx={[
          { width: "100%", minWidth: 0, boxSizing: "border-box" },
          FRAME_SX[frame],
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {!fullscreen && content(false)}

        <Dialog
          fullScreen
          open={fullscreen}
          onClose={() => setFullscreen(false)}
          aria-label={typeof title === "string" ? title : "Calendario"}
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

        <EventPopover
          occurrence={popoverOcc}
          anchorEl={popover?.anchor ?? null}
          onClose={closePopover}
          locale={locale}
          category={
            popoverOcc?.event.category ? categoryMap.get(popoverOcc.event.category) : undefined
          }
          actions={
            popoverOcc &&
            renderEventActions?.(popoverOcc as CnEventOccurrence<TMeta>, { close: closePopover })
          }
          onEdit={
            onEventEdit && popoverOcc
              ? () => {
                  closePopover();
                  onEventEdit(
                    popoverOcc.event as CnCalendarEvent<TMeta>,
                    popoverOcc as CnEventOccurrence<TMeta>,
                  );
                }
              : undefined
          }
          onDelete={
            onEventDelete && popoverOcc
              ? () => {
                  closePopover();
                  onEventDelete(
                    popoverOcc.event as CnCalendarEvent<TMeta>,
                    popoverOcc as CnEventOccurrence<TMeta>,
                  );
                }
              : undefined
          }
        />
        <DayListPopover
          day={dayList?.day ?? null}
          anchorEl={dayList?.anchor ?? null}
          occurrences={dayListOccurrences}
          locale={locale}
          onClose={() => setDayList(null)}
          onOpenEvent={(occ) => {
            // El ancla de la lista se cierra: el detalle se ancla al botón "+N más".
            const anchor = dayList?.anchor;
            setDayList(null);
            if (anchor) ctx.openEvent(occ, anchor);
          }}
          onGoToDay={views.includes("day") || views.includes("week") ? ctx.goToDay : undefined}
        />

        <Menu
          anchorEl={exportAnchor}
          open={Boolean(exportAnchor)}
          onClose={() => setExportAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 230, borderRadius: "10px" } } }}
        >
          <MenuItem onClick={() => exportIcs("visible")}>
            <ListItemIcon>
              <CnIcon name="event" size="sm" />
            </ListItemIcon>
            <ListItemText
              primary="Eventos visibles (.ics)"
              secondary="Google, Outlook, Apple"
              primaryTypographyProps={{ fontSize: "0.84rem", fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: "0.72rem" }}
            />
          </MenuItem>
          <MenuItem onClick={() => exportIcs("all")}>
            <ListItemIcon>
              <CnIcon name="date_range" size="sm" />
            </ListItemIcon>
            <ListItemText
              primary="Todos los eventos (.ics)"
              secondary="Incluye repeticiones"
              primaryTypographyProps={{ fontSize: "0.84rem", fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: "0.72rem" }}
            />
          </MenuItem>
          <Divider />
          <MenuItem onClick={print}>
            <ListItemIcon>
              <CnIcon name="print" size="sm" />
            </ListItemIcon>
            <ListItemText
              primary="Imprimir"
              secondary="Lista del periodo visible"
              primaryTypographyProps={{ fontSize: "0.84rem", fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: "0.72rem" }}
            />
          </MenuItem>
        </Menu>

        <Snackbar
          open={Boolean(notice)}
          autoHideDuration={3000}
          onClose={() => setNotice(null)}
          message={notice}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </Box>
    </CnEventCalendarContext.Provider>
  );
};
