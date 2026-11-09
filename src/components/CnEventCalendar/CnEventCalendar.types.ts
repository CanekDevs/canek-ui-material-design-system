import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { CnWeekday } from "../../utils/date-utils";

export type { CnWeekday };

/** Vistas del calendario de eventos. */
export type CnEventCalendarView = "month" | "week" | "day" | "agenda" | "quarter" | "year";

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

/** Repetición sencilla (se expande dentro del rango visible). */
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

export type CnCalendarSlot = CnCalendarDateRange & { allDay: boolean };

export type CnEventChange<TMeta = unknown> = {
  event: CnCalendarEvent<TMeta>;
  occurrence: CnEventOccurrence<TMeta>;
  start: Date;
  /** Fin exclusivo (en todo el día, medianoche siguiente). */
  end: Date;
  allDay: boolean;
  kind: "move" | "resize";
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

export type CnEventActionHelpers = { close: () => void };

export type CnEventCalendarProps<TMeta = unknown> = {
  events?: CnCalendarEvent<TMeta>[];
  categories?: CnEventCategory[];

  // Vista y fecha (controladas o no)
  view?: CnEventCalendarView;
  defaultView?: CnEventCalendarView;
  onViewChange?: (view: CnEventCalendarView) => void;
  /** Vistas del selector (por defecto todas). */
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
  /** Botón "Nuevo evento" en la barra. */
  onCreateEvent?: () => void;
  createLabel?: string;
  /** Acciones en el detalle del evento. */
  renderEventActions?: (
    occurrence: CnEventOccurrence<TMeta>,
    helpers: CnEventActionHelpers,
  ) => ReactNode;
  onEventEdit?: (event: CnCalendarEvent<TMeta>, occurrence: CnEventOccurrence<TMeta>) => void;
  onEventDelete?: (event: CnCalendarEvent<TMeta>, occurrence: CnEventOccurrence<TMeta>) => void;
  /** Permite mover/redimensionar eventos arrastrando (semana, día y mes). */
  editable?: boolean;
  /** Selección de rango arrastrando en semana/día (por defecto si hay `onSlotClick`). */
  selectable?: boolean;

  // Configuración
  locale?: string;
  /** Primer día de la semana (0 = domingo, 1 = lunes). */
  weekStart?: CnWeekday;
  /** Minutos por fila en semana/día. */
  slotDuration?: 15 | 30 | 60;
  minHour?: number;
  maxHour?: number;
  /** Alto (px) de una hora en semana/día. */
  hourHeight?: number;
  /** Hora a la que se desplaza la rejilla al abrir (por defecto la actual o 8). */
  scrollToHour?: number;
  workingHours?: CnWorkingHours | false;
  showNowIndicator?: boolean;
  /** Mostrar sábado y domingo en la vista semanal. */
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
  /** Menú de exportación (.ics) e impresión. */
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
