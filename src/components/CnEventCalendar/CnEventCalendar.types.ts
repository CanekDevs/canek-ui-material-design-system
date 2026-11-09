import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { CnWeekday } from "../../utils/date-utils";

export type { CnWeekday };

/** Vistas del calendario de eventos. */
export type CnEventCalendarView =
  | "month"
  | "week"
  | "day"
  | "agenda"
  | "quarter"
  | "year"
  /** Varios meses (ver `multiMonthCount`). */
  | "multiMonth"
  /** Recursos: filas por persona/sala/vehículo con eje horizontal de tiempo. */
  | "timeline";

/** Fecha como `Date` o cadena ISO local (`YYYY-MM-DD` o `YYYY-MM-DDTHH:mm`). */
export type CnEventDateInput = Date | string;

/** Tonos con nombre (además se acepta cualquier color CSS en `color`). */
export type CnEventTone =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "purple"
  | "pink"
  | "teal"
  | "orange";

export type CnEventStatus = "scheduled" | "confirmed" | "tentative" | "cancelled";

export type CnEventAttendee = {
  id?: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  status?: "accepted" | "declined" | "pending";
};

/** Repetición (se expande dentro del rango visible). */
export type CnEventRecurrence = {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  /** Cada cuántas unidades (por defecto 1). */
  interval?: number;
  /** Última fecha (inclusive). */
  until?: CnEventDateInput;
  /** Número total de ocurrencias (desde la primera). */
  count?: number;
  /** Días de la semana para `weekly` (0 = domingo). */
  byWeekday?: CnWeekday[];
  /**
   * Día de la semana n-ésimo del mes para `monthly` / `yearly` (RRULE
   * `BYDAY=2MO`, `-1FR`): `{ weekday: 1, nth: 2 }` = segundo lunes; `nth: -1`
   * = el último.
   */
  byNthWeekday?: { weekday: CnWeekday; nth: number }[];
  /** Días del mes para `monthly` / `yearly` (RRULE `BYMONTHDAY`); `-1` = último día. */
  byMonthDay?: number[];
  /** Fechas excluidas (`YYYY-MM-DD`). */
  exdates?: CnEventDateInput[];
};

export type CnCalendarEvent<TMeta = unknown> = {
  id: string;
  title: string;
  start: CnEventDateInput;
  /**
   * Fin. En eventos de todo el día es la fecha del último día (inclusive):
   * `start: "2026-11-10", end: "2026-11-12"` ocupa tres días. En eventos con
   * hora es exclusivo; si falta, dura una hora.
   */
  end?: CnEventDateInput;
  allDay?: boolean;
  /** Tono con nombre o color CSS (`#e91e63`, `var(--x)`…). Gana sobre la categoría. */
  color?: CnEventTone | string;
  /** Id de la categoría (ver `categories`). */
  category?: string;
  description?: string;
  location?: string;
  attendees?: CnEventAttendee[];
  status?: CnEventStatus;
  recurrence?: CnEventRecurrence;
  /** Ícono (nombre de `CnIcon`) para el detalle; por defecto el de la categoría. */
  icon?: string;
  /** `false` impide arrastrar este evento aunque el calendario sea `editable`. */
  editable?: boolean;
  /** Recurso(s) asignados (vista "timeline" y detección de conflictos). */
  resourceId?: string | string[];
  /** Calendario de origen (ver `sources`); se asigna solo al venir de una fuente. */
  sourceId?: string;
  /** Recordatorios en minutos antes del inicio (campana; se exportan como VALARM). */
  reminders?: number[];
  /** Enlace de videollamada explícito (si falta se detecta en lugar/descripción). */
  meetingUrl?: string;
  /** Enlace público del evento (para "Copiar enlace"). */
  url?: string;
  meta?: TMeta;
};

export type CnEventCategory = {
  id: string;
  label: string;
  color?: CnEventTone | string;
  icon?: string;
};

/** Ocurrencia concreta (los eventos recurrentes generan varias). */
export type CnEventOccurrence<TMeta = unknown> = {
  /** Clave única (id del evento + inicio para recurrentes). */
  key: string;
  event: CnCalendarEvent<TMeta>;
  start: Date;
  /** Fin exclusivo (en todo el día: medianoche del día siguiente al último). */
  end: Date;
  allDay: boolean;
  color: string;
  recurring: boolean;
};

/** Rango con fin exclusivo. */
export type CnCalendarDateRange = { start: Date; end: Date };

export type CnCalendarSlot = CnCalendarDateRange & {
  allDay: boolean;
  /** Recurso de la fila (vista "timeline"). */
  resourceId?: string;
};

/** Alcance de un cambio sobre un evento recurrente. */
export type CnRecurrenceScope = "this" | "following" | "all";

export type CnEventChange<TMeta = unknown> = {
  event: CnCalendarEvent<TMeta>;
  occurrence: CnEventOccurrence<TMeta>;
  start: Date;
  /** Fin exclusivo (en todo el día, medianoche siguiente). */
  end: Date;
  allDay: boolean;
  kind: "move" | "resize";
  /** Recurso destino (vista "timeline"; arrastrar entre filas). */
  resourceId?: string;
  /** Recurso de origen cuando cambió de fila. */
  previousResourceId?: string;
  /** Alcance elegido para eventos recurrentes (con `askRecurrenceScope`). */
  scope?: CnRecurrenceScope;
  /** Origen del cambio. */
  via?: "pointer" | "keyboard" | "undo";
};

/** Borrador que entrega la creación rápida (`onCreateEvent(draft)`). */
export type CnEventDraft = {
  title: string;
  start: Date;
  /** Fin exclusivo (en todo el día, medianoche siguiente). */
  end: Date;
  allDay: boolean;
  category?: string;
  resourceId?: string;
  sourceId?: string;
  location?: string;
  description?: string;
  /** Texto original cuando viene del alta en lenguaje natural. */
  text?: string;
};

/** Persona, sala, vehículo… para la vista de recursos. */
export type CnCalendarResource = {
  id: string;
  label: string;
  description?: string;
  avatarUrl?: string;
  /** Ícono de `CnIcon` cuando no hay avatar (sala, vehículo…). */
  icon?: string;
  color?: CnEventTone | string;
  /** Eventos simultáneos permitidos (salas con varios espacios); por defecto 1. */
  capacity?: number;
  /** Agrupador (área, piso, flotilla). */
  group?: string;
};

/** Bloque de disponibilidad (libre/ocupado) que sombrea la rejilla. */
export type CnAvailabilityBlock = {
  start: CnEventDateInput;
  end: CnEventDateInput;
  status: "busy" | "tentative" | "free" | "away";
  /** Recurso al que aplica (sin él aplica a todo). */
  resourceId?: string;
  label?: string;
};

/** Calendario suscribible (varios calendarios como en Google Calendar). */
export type CnCalendarSource<TMeta = unknown> = {
  id: string;
  label: string;
  color?: CnEventTone | string;
  /** Eventos estáticos. */
  events?: CnCalendarEvent<TMeta>[];
  /** Carga por rango visible (se vuelve a pedir al cambiar el rango). */
  load?: (range: CnCalendarDateRange) => Promise<CnCalendarEvent<TMeta>[]>;
  /** Visible al inicio (por defecto `true`). */
  visible?: boolean;
  description?: string;
};

/** Estado de carga de una fuente. */
export type CnCalendarSourceState = {
  loading: boolean;
  error: string | null;
  count: number;
};

export type CnCalendarHoliday = {
  date: CnEventDateInput;
  label: string;
  /** Día bloqueado: no se puede seleccionar ni soltar eventos. */
  blocked?: boolean;
  color?: CnEventTone | string;
};

export type CnWorkingHours = {
  /** Hora de inicio (0-24, admite decimales: 8.5 = 8:30). */
  start: number;
  end: number;
  /** Días laborables (por defecto lunes a viernes). */
  days?: CnWeekday[];
};

/** Horario laboral por días (varias entradas permiten turnos partidos). */
export type CnBusinessHours = {
  days: CnWeekday[];
  start: number;
  end: number;
};

/** Conflicto detectado para una ocurrencia. */
export type CnEventConflict = {
  /** Clave de la otra ocurrencia. */
  with: string;
  title: string;
  reason: "resource" | "attendee" | "overlap";
  /** Recurso o asistente compartido. */
  label?: string;
};

export type CnEventActionHelpers = { close: () => void };

export type CnEventRenderContext = {
  view: CnEventCalendarView;
  /** Bloque chico (poco alto o barra de mes). */
  compact: boolean;
  conflicts: CnEventConflict[];
};

export type CnDayCellContext = {
  view: CnEventCalendarView;
  occurrences: CnEventOccurrence[];
  inMonth: boolean;
};

export type CnSidebarOptions = {
  /** Mini mes navegador con puntos de eventos (por defecto `true`). */
  miniMonth?: boolean;
  /** Próximos eventos (cantidad, por defecto 5) o `false`. */
  upcoming?: number | false;
  /** Lista de calendarios (`sources`, por defecto `true`). */
  sources?: boolean;
  /** Ancho en px (por defecto 248). */
  width?: number;
};

export type CnCalendarIntegrations = {
  /** "Agregar a Google / Outlook / Office 365 / Yahoo" y .ics por evento. */
  addToCalendar?: boolean;
  /** Botón "Unirse" si hay enlace de Meet, Zoom, Teams o Webex. */
  meeting?: boolean;
  /** "Ver en mapa" (Google Maps) para el lugar. */
  map?: boolean;
};

export type CnEventCalendarProps<TMeta = unknown> = {
  events?: CnCalendarEvent<TMeta>[];
  categories?: CnEventCategory[];

  // Vista y fecha (controladas o no)
  view?: CnEventCalendarView;
  defaultView?: CnEventCalendarView;
  onViewChange?: (view: CnEventCalendarView) => void;
  /** Vistas del selector (por defecto mes, semana, día, agenda y año). */
  views?: CnEventCalendarView[];
  /** Vista inicial en pantallas chicas (no controlada). `false` respeta `defaultView`. */
  mobileView?: CnEventCalendarView | false;
  date?: CnEventDateInput;
  defaultDate?: CnEventDateInput;
  onDateChange?: (date: Date) => void;
  /** Rango visible (para pedir eventos al servidor). Se emite al montar y al cambiar. */
  onRangeChange?: (range: CnCalendarDateRange, view: CnEventCalendarView) => void;

  // Interacción
  onEventClick?: (event: CnCalendarEvent<TMeta>, occurrence: CnEventOccurrence<TMeta>) => void;
  /** Clic (o arrastre de selección) sobre un día u horario vacío. */
  onSlotClick?: (slot: CnCalendarSlot) => void;
  /** Al mover o redimensionar un evento (`editable`). */
  onEventChange?: (change: CnEventChange<TMeta>) => void;
  /**
   * Botón "Nuevo evento" en la barra (sin argumento) y, con `quickCreate` o
   * `quickAdd`, recibe el borrador del formulario rápido o del texto en
   * lenguaje natural.
   */
  onCreateEvent?: (draft?: CnEventDraft) => void;
  createLabel?: string;
  /** Formulario rápido (título, horario, categoría) al seleccionar un horario o día vacío. */
  quickCreate?: boolean;
  /** Campo de alta rápida en lenguaje natural ("Reunión con Ana mañana 10:00–11:30 #trabajo"). */
  quickAdd?: boolean;
  quickAddPlaceholder?: string;
  /** Acciones en el detalle del evento. */
  renderEventActions?: (
    occurrence: CnEventOccurrence<TMeta>,
    helpers: CnEventActionHelpers,
  ) => ReactNode;
  onEventEdit?: (event: CnCalendarEvent<TMeta>, occurrence: CnEventOccurrence<TMeta>) => void;
  /** Eliminar (detalle, menú contextual y tecla Supr). `scope` con `askRecurrenceScope`. */
  onEventDelete?: (
    event: CnCalendarEvent<TMeta>,
    occurrence: CnEventOccurrence<TMeta>,
    scope?: CnRecurrenceScope,
  ) => void;
  /** "Duplicar" en el menú contextual (si falta y hay `onCreateEvent`, crea un borrador copia). */
  onEventDuplicate?: (event: CnCalendarEvent<TMeta>, occurrence: CnEventOccurrence<TMeta>) => void;
  /** Permite mover/redimensionar eventos arrastrando (semana, día, mes y recursos). */
  editable?: boolean;
  /** Selección de rango arrastrando en semana/día (por defecto si hay `onSlotClick` o `quickCreate`). */
  selectable?: boolean;
  /** Pregunta "solo este / este y siguientes / todos" al cambiar o eliminar recurrentes. */
  askRecurrenceScope?: boolean;
  /** Menú contextual (clic derecho) sobre eventos. Por defecto `true`. */
  contextMenu?: boolean;
  /** Flechas para mover/redimensionar, Supr para eliminar y Ctrl+Z con aviso "Deshacer". Por defecto `true`. */
  undoable?: boolean;
  /** Enlace para "Copiar enlace" (por defecto `event.url` o la URL actual con `#evento=id`). */
  getEventUrl?: (event: CnCalendarEvent<TMeta>, occurrence: CnEventOccurrence<TMeta>) => string;
  /** Importar `.ics` (menú y soltar archivo): recibe los eventos leídos. */
  onImport?: (events: CnCalendarEvent<TMeta>[], file: File) => void;
  /** Enlaces de integración en el detalle (por defecto todos activos). */
  integrations?: boolean | CnCalendarIntegrations;

  // Calendarios, recursos y disponibilidad
  /** Calendarios suscribibles con color, carga por rango y alternador. */
  sources?: CnCalendarSource<TMeta>[];
  /** Ids de calendarios ocultos (controlado). */
  hiddenSources?: string[];
  onHiddenSourcesChange?: (hidden: string[]) => void;
  /** Recursos para la vista "timeline" (filas). */
  resources?: CnCalendarResource[];
  /** Rango de la vista de recursos. */
  timelineRange?: "day" | "week";
  /** Ancho (px) de una hora en la vista de recursos por día. */
  timelineHourWidth?: number;
  /** Meses de la vista "multiMonth". */
  multiMonthCount?: 2 | 3 | 4 | 6 | 12;
  /** Bloques libres/ocupados que sombrean semana, día y recursos. */
  availability?: CnAvailabilityBlock[];
  /** Detecta eventos encimados del mismo recurso o asistente (`true` = ambos; `any` = todos). */
  detectConflicts?: boolean | "resource" | "attendee" | "any";

  // Barra lateral
  /** Barra lateral con mini mes, calendarios y próximos eventos. */
  sidebar?: boolean | CnSidebarOptions;

  // Configuración
  locale?: string;
  /** Primer día de la semana (0 = domingo, 1 = lunes) o `"locale"` según la región. */
  weekStart?: CnWeekday | "locale";
  /** Zona horaria IANA en la que se muestran los eventos (`"America/Bogota"`). */
  timeZone?: string;
  /** Segunda columna de horas en semana/día con otra zona IANA. */
  secondaryTimeZone?: string;
  /** Números de semana ISO en mes y semana. */
  showWeekNumbers?: boolean;
  /** Minutos por fila en semana/día. */
  slotDuration?: 15 | 30 | 60;
  minHour?: number;
  maxHour?: number;
  /** Alto (px) de una hora en semana/día. */
  hourHeight?: number;
  /** Hora a la que se desplaza la rejilla al abrir (por defecto la actual o 8). */
  scrollToHour?: number;
  /** Horario laboral (uno general o una lista por días; admite turnos partidos). */
  workingHours?: CnWorkingHours | CnBusinessHours[] | false;
  showNowIndicator?: boolean;
  /** Mostrar sábado y domingo (semana, mes y recursos semanal). */
  showWeekends?: boolean;
  /** Eventos visibles por día en el mes antes de "+N más". */
  maxEventsPerDay?: number;
  /** Días de la agenda: `month` (mes de la fecha) o un número de días. */
  agendaRange?: "month" | number;
  holidays?: CnCalendarHoliday[];
  minDate?: CnEventDateInput;
  maxDate?: CnEventDateInput;
  /** Mes compacto (puntos) con la lista del día seleccionado. En móvil es automático. */
  compact?: boolean;
  /** Densidad de los eventos en mes, semana y recursos. */
  density?: "compact" | "standard" | "comfortable";
  /** Mes: `auto` (barras todo el día, punto con hora), `block` (todo barra) o `dot`. */
  eventDisplay?: "auto" | "block" | "dot";
  /** Mes y varios meses: color de fondo según la carga del día. */
  monthHeatmap?: boolean;
  /** Capacidad diaria (eventos) para la insignia "3/8" en el mes. */
  dayCapacity?: number | ((day: Date) => number | undefined);

  // Personalización
  /** Contenido de cada evento (semana, día, mes y recursos). */
  renderEvent?: (occurrence: CnEventOccurrence<TMeta>, ctx: CnEventRenderContext) => ReactNode;
  /** Contenido extra al pie de cada día del mes. */
  renderDayCell?: (day: Date, ctx: CnDayCellContext) => ReactNode;
  /** Reemplaza el contenido del detalle del evento. */
  renderEventPopover?: (
    occurrence: CnEventOccurrence<TMeta>,
    helpers: CnEventActionHelpers,
  ) => ReactNode;

  // Barra y filtros
  title?: ReactNode;
  subtitle?: ReactNode;
  toolbar?: ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (search: string) => void;
  showLegend?: boolean;
  hiddenCategories?: string[];
  defaultHiddenCategories?: string[];
  onHiddenCategoriesChange?: (hidden: string[]) => void;
  /** Menú de exportación (.ics), importación e impresión (lista o cuadrícula). */
  exportable?: boolean;
  exportFilename?: string;
  calendarName?: string;
  fullscreenable?: boolean;

  // Estados
  /** Muestra el skeleton de la vista en el cuerpo (conserva la barra). */
  loading?: boolean;
  /** Reemplaza todo el componente por su skeleton. */
  skeleton?: boolean;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;

  frame?: "card" | "outlined" | "plain";
  /** Alto máximo del área desplazable de semana/día (px). */
  height?: number;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};
