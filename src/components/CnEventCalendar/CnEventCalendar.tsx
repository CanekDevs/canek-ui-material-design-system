import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import GlobalStyles from "@mui/material/GlobalStyles";
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
import type { DragEvent, KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CnButton } from "../CnButton";
import { CnChip } from "../CnChip";
import { printRows } from "../CnDataTable/export";
import { CnIcon } from "../CnIcon";
import type { CnAvailabilityRange, CnEventCalendarContextValue } from "./calendar-context";
import { CnEventCalendarContext } from "./calendar-context";
import {
  addDays,
  compareOccurrences,
  filterEvents,
  formatDayLong,
  formatOccurrenceTime,
  getOccurrences,
  getTimeGridDays,
  getViewTitle,
  getVisibleRange,
  holidayMap,
  isOutOfBounds,
  localeWeekStart,
  occursOnDay,
  resolveColor,
  shiftDate,
  shiftDays,
  startOfDay,
  toDate,
  toIsoDate,
  VIEW_LABELS,
} from "./calendar-utils";
import {
  EventContextMenu,
  QuickAddInput,
  QuickCreatePopover,
  RecurrenceScopeDialog,
} from "./CalendarDialogs";
import type { EventContextMenuAction } from "./CalendarDialogs";
import { MiniMonth, SourcesList, UpcomingList } from "./CalendarSidebar";
import type {
  CnCalendarDateRange,
  CnCalendarEvent,
  CnCalendarSlot,
  CnCalendarSourceState,
  CnEventCalendarProps,
  CnEventCalendarView,
  CnEventChange,
  CnEventDraft,
  CnEventOccurrence,
  CnRecurrenceScope,
  CnWeekday,
} from "./CnEventCalendar.types";
import { CnEventCalendarSkeleton } from "./CnEventCalendarSkeleton";
import { findConflicts } from "./conflicts";
import type { CnConflictMode } from "./conflicts";
import { DayListPopover, EventPopover, openUrl, STATUS_META } from "./EventPopover";
import { downloadEventIcs, downloadIcs, readIcsFile } from "./ics";
import { googleCalendarUrl, toLinkInput } from "./integrations";
import { fromZonedWallTime, isValidTimeZone, timeZoneLabel, toZonedWallTime } from "./timezone";
import { AgendaView } from "./views/AgendaView";
import { MonthView } from "./views/MonthView";
import { MultiMonthView } from "./views/MultiMonthView";
import { TimelineView } from "./views/TimelineView";
import { isAllDayRowEvent, TimeGridView, useNow } from "./views/TimeGridView";
import { YearView } from "./views/YearView";

const DEFAULT_VIEWS: CnEventCalendarView[] = ["month", "week", "day", "agenda", "year"];

const VIEW_ICONS: Record<CnEventCalendarView, string> = {
  month: "calendar_month",
  week: "view_column",
  day: "today",
  agenda: "view_agenda",
  quarter: "view_module",
  year: "grid_view",
  multiMonth: "date_range",
  timeline: "timeline",
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

const menuText = {
  primaryTypographyProps: { fontSize: "0.84rem", fontWeight: 600 },
  secondaryTypographyProps: { fontSize: "0.72rem" },
};

/** Hoja de impresión en cuadrícula: solo el calendario marcado, sin barras ni scroll. */
const PRINT_CSS = `
@media print {
  @page { size: landscape; margin: 10mm; }
  body * { visibility: hidden !important; }
  [data-cn-print-target], [data-cn-print-target] * { visibility: visible !important; }
  [data-cn-print-target] {
    position: absolute !important; left: 0 !important; top: 0 !important;
    width: 100% !important; border: 0 !important; box-shadow: none !important; padding: 0 !important;
  }
  [data-cn-print-target] [role="toolbar"] > :not([data-cn-event-calendar-title]),
  [data-cn-print-target] [data-cn-no-print],
  [data-cn-print-target] aside { display: none !important; }
  [data-cn-print-target] [data-cn-time-grid],
  [data-cn-print-target] [data-cn-event-calendar-view="timeline"] {
    max-height: none !important; overflow: visible !important;
  }
  [data-cn-print-target] * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

type UndoEntry = { change: CnEventChange; label: string };

type SourceData = CnCalendarSourceState & { events: CnCalendarEvent[] };

const isTextInput = (el: HTMLElement) =>
  el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);

const DAY_MS = 86_400_000;

/**
 * Calendario de eventos y agenda: vistas mes, semana, día, agenda, trimestre,
 * año, varios meses y recursos; barras de varios días, "+N más", eventos
 * encimados, hora actual, horario laboral por día, zonas horarias, números de
 * semana, arrastrar para mover/redimensionar (también entre recursos), teclado
 * y deshacer, menú contextual, creación rápida y en lenguaje natural,
 * calendarios suscribibles, conflictos, disponibilidad, categorías, festivos,
 * búsqueda, exportación e importación `.ics`, enlaces a Google/Outlook/Yahoo,
 * videollamadas y mapas, impresión, pantalla completa y skeleton por vista.
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
    quickCreate = false,
    quickAdd = false,
    quickAddPlaceholder,
    renderEventActions,
    onEventEdit,
    onEventDelete,
    onEventDuplicate,
    editable = false,
    selectable,
    askRecurrenceScope = false,
    contextMenu = true,
    undoable = true,
    getEventUrl,
    onImport,
    integrations = true,
    sources = [],
    hiddenSources: hiddenSourcesProp,
    onHiddenSourcesChange,
    resources = [],
    timelineRange = "day",
    timelineHourWidth = 64,
    multiMonthCount = 3,
    availability = [],
    detectConflicts = false,
    sidebar = false,
    locale = "es-MX",
    weekStart: weekStartProp = 1,
    timeZone: timeZoneProp,
    secondaryTimeZone: secondaryProp,
    showWeekNumbers = false,
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
    density = "standard",
    eventDisplay = "auto",
    monthHeatmap = false,
    dayCapacity,
    renderEvent,
    renderDayCell,
    renderEventPopover,
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
  const realNow = useNow(showNowIndicator);
  const tz = isValidTimeZone(timeZoneProp) ? timeZoneProp : undefined;
  const secondaryTimeZone = isValidTimeZone(secondaryProp) ? secondaryProp : undefined;
  const now = useMemo(() => (tz ? toZonedWallTime(realNow, tz) : realNow), [realNow, tz]);
  const weekStart: CnWeekday = useMemo(
    () => (weekStartProp === "locale" ? localeWeekStart(locale) : weekStartProp),
    [weekStartProp, locale],
  );
  const rangeOptions = useMemo(
    () => ({ multiMonthCount, timelineRange }),
    [multiMonthCount, timelineRange],
  );

  // ─── Estado controlado / no controlado ──────────────────────────────
  const [innerView, setInnerView] = useState<CnEventCalendarView>(() =>
    isMobile && mobileView && views.includes(mobileView) ? mobileView : defaultView,
  );
  const view = viewProp ?? innerView;
  const [innerDate, setInnerDate] = useState<Date>(
    () => toDate(defaultDate) ?? startOfDay(tz ? toZonedWallTime(new Date(), tz) : new Date()),
  );
  const date = useMemo(() => toDate(dateProp) ?? innerDate, [dateProp, innerDate]);
  const [innerSearch, setInnerSearch] = useState("");
  const search = searchProp ?? innerSearch;
  const [innerHidden, setInnerHidden] = useState<string[]>(defaultHiddenCategories);
  const hidden = hiddenProp ?? innerHidden;
  const [innerHiddenSources, setInnerHiddenSources] = useState<string[]>(() =>
    sources.filter((s) => s.visible === false).map((s) => s.id),
  );
  const hiddenSources = hiddenSourcesProp ?? innerHiddenSources;

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
  const setHiddenSources = (next: string[]) => {
    setInnerHiddenSources(next);
    onHiddenSourcesChange?.(next);
  };

  const [fullscreen, setFullscreen] = useState(false);
  const [popover, setPopover] = useState<{ occ: CnEventOccurrence; anchor: HTMLElement } | null>(
    null,
  );
  const [dayList, setDayList] = useState<{ day: Date; anchor: HTMLElement } | null>(null);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [undoNotice, setUndoNotice] = useState<string | null>(null);
  const undoStack = useRef<UndoEntry[]>([]);
  const [ctxMenu, setCtxMenu] = useState<{
    occ: CnEventOccurrence;
    anchor: HTMLElement;
    top: number;
    left: number;
  } | null>(null);
  const [quickDraft, setQuickDraft] = useState<{
    draft: CnEventDraft;
    top: number;
    left: number;
  } | null>(null);
  const [scopePrompt, setScopePrompt] = useState<
    | { action: "change"; change: CnEventChange }
    | { action: "delete"; occ: CnEventOccurrence }
    | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [printing, setPrinting] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const pendingFocus = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  // ─── Datos derivados ────────────────────────────────────────────────
  const minDate = useMemo(() => toDate(minDateProp), [minDateProp]);
  const maxDate = useMemo(() => toDate(maxDateProp), [maxDateProp]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const holidaysMap = useMemo(() => holidayMap(holidays), [holidays]);
  const range = useMemo(
    () => getVisibleRange(view, date, weekStart, agendaRange, rangeOptions),
    [view, date, weekStart, agendaRange, rangeOptions],
  );
  const rangeStart = range.start.getTime();
  const rangeEnd = range.end.getTime();

  // ─── Calendarios suscribibles ────────────────────────────────────────
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;
  const [sourceData, setSourceData] = useState<Record<string, SourceData | undefined>>({});
  const sourceIdsKey = sources.map((s) => `${s.id}:${s.load ? 1 : 0}`).join("|");
  const hiddenSourcesKey = hiddenSources.join("|");

  const loadSource = useCallback(
    (id: string, loadRange: CnCalendarDateRange, isAlive: () => boolean = () => true) => {
      const source = sourcesRef.current.find((s) => s.id === id);
      if (!source?.load) return;
      setSourceData((prev) => ({
        ...prev,
        [id]: {
          events: prev[id]?.events ?? [],
          count: prev[id]?.count ?? 0,
          loading: true,
          error: null,
        },
      }));
      source.load(loadRange).then(
        (list) => {
          if (!isAlive()) return;
          setSourceData((prev) => ({
            ...prev,
            [id]: {
              events: list as CnCalendarEvent[],
              count: list.length,
              loading: false,
              error: null,
            },
          }));
        },
        (error: unknown) => {
          if (!isAlive()) return;
          setSourceData((prev) => ({
            ...prev,
            [id]: {
              events: prev[id]?.events ?? [],
              count: prev[id]?.count ?? 0,
              loading: false,
              error: error instanceof Error && error.message ? error.message : "No se pudo cargar",
            },
          }));
        },
      );
    },
    [],
  );

  useEffect(() => {
    let alive = true;
    const loadRange = { start: new Date(rangeStart), end: new Date(rangeEnd) };
    for (const s of sourcesRef.current) {
      if (s.load && !hiddenSources.includes(s.id)) loadSource(s.id, loadRange, () => alive);
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd, sourceIdsKey, hiddenSourcesKey, loadSource]);

  const allEvents = useMemo(() => {
    const hiddenSet = new Set(hiddenSources);
    const own = (events as CnCalendarEvent[]).filter(
      (e) => !(e.sourceId && hiddenSet.has(e.sourceId)),
    );
    const fromSources = sources
      .filter((s) => !hiddenSet.has(s.id))
      .flatMap((s) =>
        [...((s.events ?? []) as CnCalendarEvent[]), ...(sourceData[s.id]?.events ?? [])].map(
          (e) => ({
            ...e,
            sourceId: s.id,
            color:
              e.color ?? (e.category && categoryMap.get(e.category)?.color ? undefined : s.color),
          }),
        ),
      );
    return [...own, ...fromSources];
  }, [events, sources, hiddenSources, sourceData, categoryMap]);

  const filtered = useMemo(
    () => filterEvents(allEvents, { search, hiddenCategories: hidden, categories }),
    [allEvents, search, hidden, categories],
  );

  /** Lleva ocurrencias a la hora de pared de la zona y recorta al rango. */
  const project = useCallback(
    (list: CnEventOccurrence[], r: CnCalendarDateRange) => {
      if (!tz) return list;
      return list
        .map((o) =>
          o.allDay
            ? o
            : { ...o, start: toZonedWallTime(o.start, tz), end: toZonedWallTime(o.end, tz) },
        )
        .filter((o) => o.start < r.end && o.end > r.start)
        .sort(compareOccurrences);
    },
    [tz],
  );
  const expand = useCallback(
    (r: CnCalendarDateRange): CnCalendarDateRange =>
      tz ? { start: addDays(r.start, -2), end: addDays(r.end, 2) } : r,
    [tz],
  );
  const computeOccurrences = useCallback(
    (r: CnCalendarDateRange) => project(getOccurrences(filtered, expand(r), categories), r),
    [filtered, categories, project, expand],
  );

  const rawOccurrences = useMemo(
    () => getOccurrences(filtered, expand(range), categories),
    [filtered, range, categories, expand],
  );
  const occurrences = useMemo(
    () => project(rawOccurrences, range),
    [rawOccurrences, range, project],
  );
  const rawByKey = useMemo(() => new Map(rawOccurrences.map((o) => [o.key, o])), [rawOccurrences]);
  const occByKey = useMemo(() => new Map(occurrences.map((o) => [o.key, o])), [occurrences]);
  const compact = compactProp || isMobile;

  const conflictMode: CnConflictMode | null =
    detectConflicts === true ? "both" : detectConflicts || null;
  const conflicts = useMemo(
    () =>
      conflictMode ? findConflicts(occurrences, { mode: conflictMode, resources }) : new Map(),
    [occurrences, conflictMode, resources],
  );

  const availabilityRanges = useMemo<CnAvailabilityRange[]>(
    () =>
      availability
        .map((a) => {
          const start = toDate(a.start);
          const end = toDate(a.end);
          if (!start || !end || end <= start) return null;
          return {
            ...a,
            start: tz ? toZonedWallTime(start, tz) : start,
            end: tz ? toZonedWallTime(end, tz) : end,
          };
        })
        .filter((a): a is CnAvailabilityRange => Boolean(a)),
    [availability, tz],
  );

  // Rango visible para cargar del servidor.
  const rangeCallback = useRef(onRangeChange);
  rangeCallback.current = onRangeChange;
  useEffect(() => {
    rangeCallback.current?.({ start: new Date(rangeStart), end: new Date(rangeEnd) }, view);
  }, [rangeStart, rangeEnd, view]);

  // Foco tras mover con el teclado.
  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-cn-event="${CSS.escape?.(id) ?? id}"]`)
      ?.focus();
  });

  // Impresión en cuadrícula.
  useEffect(() => {
    if (!printing) return;
    const id = window.setTimeout(() => {
      try {
        window.print();
      } catch {
        // jsdom y navegadores sin impresión.
      }
      setPrinting(false);
    }, 60);
    return () => window.clearTimeout(id);
  }, [printing]);

  // ─── Navegación ─────────────────────────────────────────────────────
  const prevRange = getVisibleRange(
    view,
    shiftDate(view, date, -1, agendaRange, rangeOptions),
    weekStart,
    agendaRange,
    rangeOptions,
  );
  const nextRange = getVisibleRange(
    view,
    shiftDate(view, date, 1, agendaRange, rangeOptions),
    weekStart,
    agendaRange,
    rangeOptions,
  );
  const prevDisabled = Boolean(minDate && prevRange.end <= startOfDay(minDate));
  const nextDisabled = Boolean(maxDate && nextRange.start > maxDate);
  const navigate = (direction: 1 | -1) =>
    setDate(shiftDate(view, date, direction, agendaRange, rangeOptions));

  const isDayEnabled = useCallback(
    (day: Date) =>
      !isOutOfBounds(day, minDate, maxDate) && !holidaysMap.get(toIsoDate(day))?.blocked,
    [minDate, maxDate, holidaysMap],
  );

  // ─── Cambios, deshacer y alcance de recurrentes ──────────────────────
  const toReal = useCallback(
    (d: Date, allDay: boolean) => (tz && !allDay ? fromZonedWallTime(d, tz) : d),
    [tz],
  );
  const rawOf = (occ: CnEventOccurrence) => rawByKey.get(occ.key) ?? occ;

  const emitChange = (change: CnEventChange) => {
    onEventChange?.(change as CnEventChange<TMeta>);
    const undoableChange = !change.occurrence.recurring || !change.scope || change.scope === "all";
    if (undoable && change.via !== "undo" && undoableChange) {
      const label = change.kind === "move" ? "Evento movido" : "Duración actualizada";
      undoStack.current = [...undoStack.current.slice(-19), { change, label }];
      setUndoNotice(`${label}: ${change.event.title}`);
    }
  };

  const commitChange = (change: CnEventChange) => {
    const raw = rawOf(change.occurrence);
    const real: CnEventChange = {
      ...change,
      occurrence: raw,
      start: toReal(change.start, change.allDay),
      end: toReal(change.end, change.allDay),
    };
    if (askRecurrenceScope && raw.recurring && change.via !== "undo") {
      setScopePrompt({ action: "change", change: real });
      return;
    }
    emitChange(real);
  };

  const undo = (): boolean => {
    const entry = undoStack.current[undoStack.current.length - 1];
    if (!entry) return false;
    undoStack.current = undoStack.current.slice(0, -1);
    const { change } = entry;
    const current =
      (allEvents.find((e) => e.id === change.event.id) as CnCalendarEvent | undefined) ??
      change.event;
    onEventChange?.({
      event: current,
      occurrence: { ...change.occurrence, start: change.start, end: change.end },
      start: change.occurrence.start,
      end: change.occurrence.end,
      allDay: change.occurrence.allDay,
      kind: change.kind,
      resourceId: change.previousResourceId,
      previousResourceId: change.resourceId,
      scope: change.scope,
      via: "undo",
    } as CnEventChange<TMeta>);
    pendingFocus.current = change.event.id;
    setUndoNotice(null);
    setNotice("Cambio deshecho");
    return true;
  };

  const requestDelete = (occ: CnEventOccurrence) => {
    if (!onEventDelete) return;
    const raw = rawOf(occ);
    if (askRecurrenceScope && raw.recurring) {
      setScopePrompt({ action: "delete", occ: raw });
      return;
    }
    onEventDelete(raw.event as CnCalendarEvent<TMeta>, raw as CnEventOccurrence<TMeta>);
  };

  const resolveScope = (scope: CnRecurrenceScope) => {
    const prompt = scopePrompt;
    setScopePrompt(null);
    if (!prompt) return;
    if (prompt.action === "change") emitChange({ ...prompt.change, scope });
    else {
      onEventDelete?.(
        prompt.occ.event as CnCalendarEvent<TMeta>,
        prompt.occ as CnEventOccurrence<TMeta>,
        scope,
      );
    }
  };

  // ─── Selección y creación rápida ────────────────────────────────────
  const canQuickCreate = quickCreate && Boolean(onCreateEvent);
  const selectSlot = (slot: CnCalendarSlot) => {
    if (!isDayEnabled(slot.start)) return;
    onSlotClick?.({
      ...slot,
      start: toReal(slot.start, slot.allDay),
      end: toReal(slot.end, slot.allDay),
    });
    if (!canQuickCreate) return;
    const active = typeof document !== "undefined" ? document.activeElement : null;
    const rect = active instanceof HTMLElement ? active.getBoundingClientRect() : null;
    const point = lastPointer.current ?? (rect ? { x: rect.left, y: rect.bottom } : { x: 0, y: 0 });
    setQuickDraft({
      draft: {
        title: "",
        start: slot.start,
        end: slot.end,
        allDay: slot.allDay,
        resourceId: slot.resourceId,
      },
      top: point.y,
      left: point.x,
    });
  };

  const saveDraft = (draft: CnEventDraft) => {
    setQuickDraft(null);
    onCreateEvent?.({
      ...draft,
      start: toReal(draft.start, draft.allDay),
      end: toReal(draft.end, draft.allDay),
    });
  };

  const ctx: CnEventCalendarContextValue = {
    view,
    locale,
    weekStart,
    now,
    categories: categoryMap,
    holidays: holidaysMap,
    minDate,
    maxDate,
    editable: editable && Boolean(onEventChange),
    selectable: selectable ?? Boolean(onSlotClick || canQuickCreate),
    slotDuration,
    minHour: Math.max(0, Math.min(23, Math.floor(minHour))),
    maxHour: Math.max(Math.floor(minHour) + 1, Math.min(24, Math.ceil(maxHour))),
    hourHeight,
    scrollToHour,
    workingHours,
    showNowIndicator,
    showWeekends,
    showWeekNumbers,
    timeZone: tz,
    secondaryTimeZone,
    density,
    eventDisplay,
    monthHeatmap,
    dayCapacity: typeof dayCapacity === "number" ? () => dayCapacity : (dayCapacity ?? undefined),
    conflicts,
    availability: availabilityRanges,
    resources,
    renderEvent: renderEvent as CnEventCalendarContextValue["renderEvent"],
    renderDayCell,
    openEvent: (occ, anchor) => {
      setDayList(null);
      setPopover({ occ, anchor });
      onEventClick?.(occ.event as CnCalendarEvent<TMeta>, rawOf(occ) as CnEventOccurrence<TMeta>);
    },
    selectSlot,
    changeEvent: commitChange,
    goToDay: (day) => {
      setDayList(null);
      setDate(day);
      if (views.includes("day")) setView("day");
      else if (views.includes("week")) setView("week");
    },
    openDayList: (day, anchor) => setDayList({ day, anchor }),
    isDayEnabled,
  };

  // ─── Teclado sobre eventos (mover, redimensionar, eliminar, deshacer) ──
  const onRootKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (isTextInput(target)) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      if (undoable && undo()) e.preventDefault();
      return;
    }
    const el = target.closest?.<HTMLElement>("[data-cn-occurrence]");
    const occ = el?.dataset.cnOccurrence ? occByKey.get(el.dataset.cnOccurrence) : undefined;
    if (!el || !occ) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      if (onEventDelete) {
        e.preventDefault();
        requestDelete(occ);
      }
      return;
    }
    if (!e.key.startsWith("Arrow") || !undoable || !ctx.editable) return;
    if (occ.event.editable === false) return;
    const key = e.key;
    const resize = e.shiftKey;
    let start = occ.start;
    let end = occ.end;
    let kind: "move" | "resize" = resize ? "resize" : "move";
    let resourceId: string | undefined;
    let previousResourceId: string | undefined;
    const move = (fn: (d: Date) => Date) => {
      if (resize) end = fn(end);
      else {
        start = fn(start);
        end = fn(end);
      }
    };
    const byMinutes = (m: number) => (d: Date) => new Date(d.getTime() + m * 60_000);
    const byDays = (n: number) => (d: Date) => (occ.allDay ? addDays(d, n) : shiftDays(d, n));
    const horizontal = key === "ArrowLeft" || key === "ArrowRight";
    const sign = key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;

    if (view === "timeline") {
      if (horizontal) {
        if (occ.allDay) move(byDays(sign));
        else move(byMinutes(sign * (timelineRange === "week" ? 60 : slotDuration)));
      } else {
        if (resize) return;
        const ids = resources.map((r) => r.id);
        const current = el.dataset.cnResource;
        const idx = current ? ids.indexOf(current) : -1;
        const next = ids[idx + sign];
        if (idx < 0 || !next) return;
        resourceId = next;
        previousResourceId = current;
        kind = "move";
      }
    } else if ((view === "week" || view === "day") && !isAllDayRowEvent(occ)) {
      if (horizontal) {
        if (resize) return;
        move(byDays(sign));
      } else move(byMinutes(sign * slotDuration));
    } else {
      if (resize && !horizontal) return;
      move(byDays(horizontal ? sign : sign * 7));
    }
    const minLength = occ.allDay ? DAY_MS : slotDuration * 60_000;
    if (end.getTime() - start.getTime() < minLength) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isDayEnabled(start)) return;
    pendingFocus.current = occ.event.id;
    commitChange({
      event: occ.event,
      occurrence: occ,
      start,
      end,
      allDay: occ.allDay,
      kind,
      via: "keyboard",
      ...(resourceId && { resourceId, previousResourceId }),
    });
  };

  // ─── Menú contextual ─────────────────────────────────────────────────
  const onRootContextMenu = (e: MouseEvent<HTMLElement>) => {
    if (!contextMenu) return;
    const el = (e.target as HTMLElement).closest?.<HTMLElement>("[data-cn-occurrence]");
    const occ = el?.dataset.cnOccurrence ? occByKey.get(el.dataset.cnOccurrence) : undefined;
    if (!el || !occ) return;
    e.preventDefault();
    setCtxMenu({ occ, anchor: el, top: e.clientY, left: e.clientX });
  };

  const eventUrl = (occ: CnEventOccurrence) => {
    const raw = rawOf(occ);
    if (getEventUrl) {
      return getEventUrl(raw.event as CnCalendarEvent<TMeta>, raw as CnEventOccurrence<TMeta>);
    }
    if (raw.event.url) return raw.event.url;
    if (typeof window === "undefined") return `#evento=${encodeURIComponent(raw.event.id)}`;
    const { origin, pathname, search: query } = window.location;
    return `${origin}${pathname}${query}#evento=${encodeURIComponent(raw.event.id)}`;
  };

  const duplicate = (occ: CnEventOccurrence) => {
    const raw = rawOf(occ);
    if (onEventDuplicate) {
      onEventDuplicate(raw.event as CnCalendarEvent<TMeta>, raw as CnEventOccurrence<TMeta>);
      return;
    }
    const resource = raw.event.resourceId;
    onCreateEvent?.({
      title: `${raw.event.title} (copia)`,
      start: raw.start,
      end: raw.end,
      allDay: raw.allDay,
      category: raw.event.category,
      resourceId: Array.isArray(resource) ? resource[0] : resource,
      sourceId: raw.event.sourceId,
      location: raw.event.location,
      description: raw.event.description,
    });
    setNotice("Evento duplicado");
  };

  const onContextAction = (action: EventContextMenuAction) => {
    const menu = ctxMenu;
    if (!menu) return;
    const { occ, anchor } = menu;
    const raw = rawOf(occ);
    switch (action) {
      case "open":
        ctx.openEvent(occ, anchor);
        break;
      case "edit":
        onEventEdit?.(raw.event as CnCalendarEvent<TMeta>, raw as CnEventOccurrence<TMeta>);
        break;
      case "duplicate":
        duplicate(occ);
        break;
      case "delete":
        requestDelete(occ);
        break;
      case "copy-link": {
        const url = eventUrl(occ);
        const clip = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
        if (clip?.writeText) {
          clip.writeText(url).then(
            () => setNotice("Enlace copiado"),
            () => setNotice(url),
          );
        } else setNotice(url);
        break;
      }
      case "export":
        downloadEventIcs(raw.event as CnCalendarEvent, { calendarName, categories });
        break;
      case "google": {
        const input = toLinkInput(raw);
        if (input) openUrl(googleCalendarUrl(input));
        break;
      }
    }
  };

  // ─── Exportar / importar / imprimir ─────────────────────────────────
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
      `${typeof title === "string" ? `${title} · ` : ""}${getViewTitle(view, date, locale, weekStart, agendaRange, rangeOptions)}`,
    );
    if (!ok) setNotice("Permite las ventanas emergentes para imprimir");
  };
  const printGrid = () => {
    setExportAnchor(null);
    setFullscreen(false);
    setPrinting(true);
  };

  const importFile = (file: File) => {
    if (!onImport) return;
    if (!/\.ics$/i.test(file.name) && !/calendar/i.test(file.type)) {
      setNotice("Elige un archivo .ics");
      return;
    }
    readIcsFile(file, { categories }).then(
      (list) => {
        onImport(list as CnCalendarEvent<TMeta>[], file);
        setNotice(list.length === 1 ? "1 evento importado" : `${list.length} eventos importados`);
      },
      () => setNotice("No se pudo leer el archivo .ics"),
    );
  };
  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
  const dropHandlers = onImport
    ? {
        onDragOver: (e: DragEvent<HTMLElement>) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          if (!dropActive) setDropActive(true);
        },
        onDragLeave: (e: DragEvent<HTMLElement>) => {
          const next = e.relatedTarget as Node | null;
          if (!next || !e.currentTarget.contains(next)) setDropActive(false);
        },
        onDrop: (e: DragEvent<HTMLElement>) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          setDropActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) importFile(file);
        },
      }
    : {};

  const toggleCategory = (id: string) =>
    setHidden(hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id]);
  const toggleSource = (id: string) =>
    setHiddenSources(
      hiddenSources.includes(id) ? hiddenSources.filter((h) => h !== id) : [...hiddenSources, id],
    );

  const viewTitle = getViewTitle(view, date, locale, weekStart, agendaRange, rangeOptions);
  const sidebarOptions = sidebar === true ? {} : sidebar || null;
  const integrationOptions =
    integrations === false
      ? { addToCalendar: false, meeting: false, map: false }
      : integrations === true
        ? {}
        : integrations;
  const sourceStates: Record<string, CnCalendarSourceState | undefined> = sourceData;

  if (skeleton) {
    return (
      <CnEventCalendarSkeleton
        view={view}
        compact={compact && view === "month"}
        legend={showLegend && categories.length > 0}
        frame={frame}
        days={showWeekends ? 7 : 5}
        sidebar={Boolean(sidebarOptions) && !isMobile}
        multiMonthCount={multiMonthCount}
        rows={Math.max(3, Math.min(8, resources.length || 5))}
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
        {sidebarOptions && (
          <Tooltip title={sidebarOpen ? "Ocultar panel" : "Mostrar panel"}>
            <IconButton
              size="small"
              aria-label={sidebarOpen ? "Ocultar panel" : "Mostrar panel"}
              aria-pressed={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={toolbarIconSx}
            >
              <CnIcon name={sidebarOpen ? "menu_open" : "menu"} size="sm" />
            </IconButton>
          </Tooltip>
        )}
        <CnButton
          size="small"
          variant="outlined"
          color="neutral"
          onClick={() => setDate(startOfDay(now))}
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
        {tz && (
          <Tooltip title={`Horario en ${tz}`}>
            <Box
              component="span"
              data-cn-timezone={tz}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                px: "8px",
                height: 26,
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--cn-color-neutral-600, #4e5660)",
                backgroundColor: "var(--cn-color-neutral-100, #f1f3f5)",
              }}
            >
              <CnIcon name="public" size={13} />
              {timeZoneLabel(tz, realNow, locale)}
            </Box>
          </Tooltip>
        )}

        {quickAdd && onCreateEvent && (
          <QuickAddInput
            categories={categories}
            locale={locale}
            now={now}
            placeholder={quickAddPlaceholder}
            onSubmit={(draft) => {
              onCreateEvent({
                ...draft,
                start: toReal(draft.start, draft.allDay),
                end: toReal(draft.end, draft.allDay),
              });
              setNotice(`Evento creado: ${draft.title}`);
            }}
          />
        )}

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

        {(exportable || onImport) && (
          <Tooltip title={onImport ? "Exportar, importar e imprimir" : "Exportar e imprimir"}>
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
            onClick={() => onCreateEvent()}
            sx={{ height: 32, textTransform: "none" }}
          >
            {createLabel}
          </CnButton>
        )}
      </Box>

      {showLegend && (categories.length > 0 || (sources.length > 0 && !sidebarOptions)) && (
        <Box
          role="group"
          aria-label="Categorías"
          data-cn-no-print
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}
        >
          {!sidebarOptions &&
            sources.map((s) => {
              const off = hiddenSources.includes(s.id);
              const color = resolveColor(s.color);
              const state = sourceStates[s.id];
              return (
                <CnChip
                  key={`src-${s.id}`}
                  size="small"
                  variant={off ? "outlined" : "soft"}
                  color={state?.error ? "error" : "neutral"}
                  clickable
                  aria-pressed={!off}
                  data-cn-source={s.id}
                  onClick={() => toggleSource(s.id)}
                  label={`${s.label}${state?.loading ? " …" : ""}`}
                  icon={
                    <Box
                      component="span"
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "3px",
                        ml: "8px !important",
                        backgroundColor: off ? "transparent" : color,
                        border: `2px solid ${color}`,
                        boxSizing: "border-box",
                      }}
                    />
                  }
                  sx={{ ...CHIP_LABEL_SX, opacity: off ? 0.6 : 1 }}
                />
              );
            })}
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
  const framed = {
    border: "1px solid var(--cn-color-border, #dde0e4)",
    borderRadius: "10px",
    overflow: "hidden",
  };
  const body = (isFullscreen: boolean) => {
    if (loading) {
      return (
        <CnEventCalendarSkeleton
          view={view}
          bodyOnly
          compact={compact && view === "month"}
          days={showWeekends ? 7 : 5}
          height={Math.min(height ?? 420, 420)}
          multiMonthCount={multiMonthCount}
          rows={Math.max(3, Math.min(8, resources.length || 5))}
        />
      );
    }
    const gridHeight = isFullscreen ? Math.max(400, window.innerHeight - 260) : (height ?? 640);
    switch (view) {
      case "month":
        return (
          <Box sx={compact ? undefined : framed}>
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
          <Box sx={framed}>
            <TimeGridView
              view={view}
              days={getTimeGridDays(view, date, weekStart, showWeekends)}
              occurrences={occurrences}
              height={gridHeight}
            />
          </Box>
        );
      case "timeline":
        return (
          <Box sx={framed}>
            <TimelineView
              range={range}
              occurrences={occurrences}
              timelineRange={timelineRange}
              hourWidth={timelineHourWidth}
              height={gridHeight}
            />
          </Box>
        );
      case "multiMonth":
        return (
          <MultiMonthView
            range={range}
            occurrences={occurrences}
            onMonthClick={(month) => {
              setDate(month);
              if (views.includes("month")) setView("month");
            }}
          />
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

  const upcomingCount =
    sidebarOptions && sidebarOptions.upcoming !== false ? (sidebarOptions.upcoming ?? 5) : 0;
  const upcoming =
    sidebarOptions && sidebarOpen && upcomingCount > 0
      ? computeOccurrences({ start: startOfDay(now), end: addDays(now, 60) })
          .filter((o) => o.end > now)
          .sort(
            (a, b) =>
              Math.max(a.start.getTime(), now.getTime()) -
                Math.max(b.start.getTime(), now.getTime()) || Number(b.allDay) - Number(a.allDay),
          )
          .slice(0, upcomingCount)
      : [];

  const sidebarBlock = sidebarOptions && sidebarOpen && (
    <Box
      component="aside"
      aria-label="Panel del calendario"
      data-cn-sidebar
      sx={{
        width: { xs: "100%", md: sidebarOptions.width ?? 248 },
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      {sidebarOptions.miniMonth !== false && (
        <MiniMonth
          date={date}
          visibleRange={range}
          locale={locale}
          weekStart={weekStart}
          now={now}
          getOccurrences={computeOccurrences}
          onSelect={(day) => setDate(day)}
        />
      )}
      {sidebarOptions.sources !== false && sources.length > 0 && (
        <SourcesList
          sources={sources as never}
          hidden={hiddenSources}
          states={sourceStates}
          onToggle={toggleSource}
          onRetry={(id) => loadSource(id, range)}
        />
      )}
      {upcomingCount > 0 && (
        <UpcomingList
          occurrences={upcoming}
          locale={locale}
          now={now}
          onOpen={(occ, anchor) => ctx.openEvent(occ, anchor)}
        />
      )}
    </Box>
  );

  const content = (isFullscreen: boolean) => (
    <>
      {header(isFullscreen)}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "flex-start",
          gap: "18px",
          ...(isFullscreen && { flex: 1, minHeight: 0 }),
        }}
      >
        {sidebarBlock}
        <Box
          sx={{
            position: "relative",
            flex: 1,
            width: "100%",
            minWidth: 0,
            ...(isFullscreen && { minHeight: 0, alignSelf: "stretch", overflow: "auto" }),
          }}
        >
          {body(isFullscreen)}
        </Box>
      </Box>
    </>
  );

  const popoverOcc = popover?.occ ?? null;
  const closePopover = () => setPopover(null);
  const dayListOccurrences = dayList ? occurrences.filter((o) => occursOnDay(o, dayList.day)) : [];
  const rawPopoverOcc = popoverOcc ? rawOf(popoverOcc) : null;

  return (
    <CnEventCalendarContext.Provider value={ctx}>
      {printing && <GlobalStyles styles={PRINT_CSS} />}
      <Box
        ref={rootRef}
        component="section"
        aria-label={ariaLabel ?? (typeof title === "string" ? title : "Calendario de eventos")}
        aria-busy={loading || undefined}
        data-cn-event-calendar
        data-cn-print-target={printing || undefined}
        className={className}
        onKeyDown={onRootKeyDown}
        onContextMenu={onRootContextMenu}
        onPointerDownCapture={(e: PointerEvent<HTMLElement>) => {
          lastPointer.current = { x: e.clientX, y: e.clientY };
        }}
        onKeyDownCapture={() => {
          lastPointer.current = null;
        }}
        {...dropHandlers}
        sx={[
          { position: "relative", width: "100%", minWidth: 0, boxSizing: "border-box" },
          FRAME_SX[frame],
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {!fullscreen && content(false)}

        {dropActive && (
          <Box
            data-cn-drop-zone
            aria-hidden
            sx={{
              position: "absolute",
              inset: 6,
              zIndex: 10,
              display: "grid",
              placeItems: "center",
              borderRadius: "12px",
              border: "2px dashed var(--cn-color-accent-500, #3d5afe)",
              backgroundColor: "rgba(61, 90, 254, 0.08)",
              backdropFilter: "blur(1px)",
              pointerEvents: "none",
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--cn-color-accent-600, #304ffe)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CnIcon name="file_upload" size={22} />
              Suelta el archivo .ics para importarlo
            </Box>
          </Box>
        )}

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
              onKeyDown: onRootKeyDown,
              onContextMenu: onRootContextMenu,
            } as object,
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
          linkOccurrence={rawPopoverOcc}
          integrations={integrationOptions}
          conflicts={popoverOcc ? conflicts.get(popoverOcc.key) : undefined}
          timeZoneLabel={tz && popoverOcc ? timeZoneLabel(tz, popoverOcc.start, locale) : undefined}
          onDownloadIcs={
            rawPopoverOcc
              ? () =>
                  downloadEventIcs(rawPopoverOcc.event as CnCalendarEvent, {
                    calendarName,
                    categories,
                  })
              : undefined
          }
          content={
            popoverOcc && renderEventPopover
              ? renderEventPopover(popoverOcc as CnEventOccurrence<TMeta>, { close: closePopover })
              : undefined
          }
          actions={
            popoverOcc &&
            renderEventActions?.(popoverOcc as CnEventOccurrence<TMeta>, { close: closePopover })
          }
          onEdit={
            onEventEdit && rawPopoverOcc
              ? () => {
                  closePopover();
                  onEventEdit(
                    rawPopoverOcc.event as CnCalendarEvent<TMeta>,
                    rawPopoverOcc as CnEventOccurrence<TMeta>,
                  );
                }
              : undefined
          }
          onDelete={
            onEventDelete && popoverOcc
              ? () => {
                  closePopover();
                  requestDelete(popoverOcc);
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

        <EventContextMenu
          position={ctxMenu ? { top: ctxMenu.top, left: ctxMenu.left } : null}
          title={ctxMenu?.occ.event.title}
          onClose={() => setCtxMenu(null)}
          onAction={onContextAction}
          canEdit={Boolean(onEventEdit)}
          canDuplicate={Boolean(onEventDuplicate || onCreateEvent)}
          canDelete={Boolean(onEventDelete)}
        />

        <QuickCreatePopover
          draft={quickDraft?.draft ?? null}
          anchorPosition={quickDraft ? { top: quickDraft.top, left: quickDraft.left } : null}
          categories={categories}
          resources={resources}
          onCancel={() => setQuickDraft(null)}
          onSave={saveDraft}
        />

        <RecurrenceScopeDialog
          open={Boolean(scopePrompt)}
          action={scopePrompt?.action ?? "change"}
          onCancel={() => setScopePrompt(null)}
          onConfirm={resolveScope}
        />

        {onImport && (
          <input
            ref={fileInput}
            type="file"
            accept=".ics,text/calendar"
            hidden
            data-cn-import-input
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importFile(file);
              e.target.value = "";
            }}
          />
        )}

        <Menu
          anchorEl={exportAnchor}
          open={Boolean(exportAnchor)}
          onClose={() => setExportAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 240, borderRadius: "10px" } } }}
        >
          {exportable && [
            <MenuItem key="visible" onClick={() => exportIcs("visible")}>
              <ListItemIcon>
                <CnIcon name="event" size="sm" />
              </ListItemIcon>
              <ListItemText
                primary="Eventos visibles (.ics)"
                secondary="Google, Outlook, Apple"
                {...menuText}
              />
            </MenuItem>,
            <MenuItem key="all" onClick={() => exportIcs("all")}>
              <ListItemIcon>
                <CnIcon name="date_range" size="sm" />
              </ListItemIcon>
              <ListItemText
                primary="Todos los eventos (.ics)"
                secondary="Incluye repeticiones"
                {...menuText}
              />
            </MenuItem>,
          ]}
          {onImport && [
            exportable ? <Divider key="d-import" /> : null,
            <MenuItem
              key="import"
              onClick={() => {
                setExportAnchor(null);
                fileInput.current?.click();
              }}
            >
              <ListItemIcon>
                <CnIcon name="file_upload" size="sm" />
              </ListItemIcon>
              <ListItemText
                primary="Importar .ics…"
                secondary="También puedes soltar el archivo"
                {...menuText}
              />
            </MenuItem>,
          ]}
          {exportable && [
            <Divider key="d-print" />,
            <MenuItem key="print" onClick={print}>
              <ListItemIcon>
                <CnIcon name="print" size="sm" />
              </ListItemIcon>
              <ListItemText primary="Imprimir lista" secondary="Periodo visible" {...menuText} />
            </MenuItem>,
            <MenuItem key="print-grid" onClick={printGrid}>
              <ListItemIcon>
                <CnIcon name="grid_view" size="sm" />
              </ListItemIcon>
              <ListItemText
                primary="Imprimir vista"
                secondary="Cuadrícula de mes, semana o recursos"
                {...menuText}
              />
            </MenuItem>,
          ]}
        </Menu>

        <Snackbar
          open={Boolean(undoNotice)}
          autoHideDuration={6000}
          onClose={(_, reason) => {
            if (reason !== "clickaway") setUndoNotice(null);
          }}
          message={undoNotice}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          action={
            <CnButton
              size="small"
              variant="text"
              color="accent"
              onClick={() => undo()}
              sx={{ color: "#8ea2ff", textTransform: "none" }}
            >
              Deshacer
            </CnButton>
          }
        />
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
