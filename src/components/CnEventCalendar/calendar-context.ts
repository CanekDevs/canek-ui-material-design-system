import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { CnWeekday } from "../../utils/date-utils";
import type {
  CnBusinessHours,
  CnCalendarHoliday,
  CnCalendarResource,
  CnCalendarSlot,
  CnDayCellContext,
  CnEventCalendarView,
  CnEventCategory,
  CnEventChange,
  CnEventConflict,
  CnEventOccurrence,
  CnEventRenderContext,
  CnWorkingHours,
} from "./CnEventCalendar.types";

/** Bloque de disponibilidad ya convertido a fechas (hora de pared). */
export type CnAvailabilityRange = {
  start: Date;
  end: Date;
  status: "busy" | "tentative" | "free" | "away";
  resourceId?: string;
  label?: string;
};

/** Configuración compartida por todas las vistas. */
export type CnEventCalendarContextValue = {
  view: CnEventCalendarView;
  locale: string;
  weekStart: CnWeekday;
  now: Date;
  categories: Map<string, CnEventCategory>;
  holidays: Map<string, CnCalendarHoliday>;
  minDate: Date | null;
  maxDate: Date | null;
  editable: boolean;
  selectable: boolean;
  slotDuration: number;
  minHour: number;
  maxHour: number;
  hourHeight: number;
  scrollToHour?: number;
  workingHours: CnWorkingHours | CnBusinessHours[] | false;
  showNowIndicator: boolean;
  showWeekends: boolean;
  showWeekNumbers: boolean;
  /** Zona IANA de visualización (las fechas de las vistas ya están en su hora de pared). */
  timeZone?: string;
  secondaryTimeZone?: string;
  density: "compact" | "standard" | "comfortable";
  eventDisplay: "auto" | "block" | "dot";
  monthHeatmap: boolean;
  dayCapacity?: (day: Date) => number | undefined;
  conflicts: Map<string, CnEventConflict[]>;
  availability: CnAvailabilityRange[];
  resources: CnCalendarResource[];
  renderEvent?: (occurrence: CnEventOccurrence, ctx: CnEventRenderContext) => ReactNode;
  renderDayCell?: (day: Date, ctx: CnDayCellContext) => ReactNode;
  openEvent: (occurrence: CnEventOccurrence, anchor: HTMLElement) => void;
  selectSlot: (slot: CnCalendarSlot) => void;
  changeEvent: (change: CnEventChange) => void;
  /** Ir a un día (abre la vista "día" si existe). */
  goToDay: (day: Date) => void;
  /** Muestra la lista de eventos de un día (popover "+N más"). */
  openDayList: (day: Date, anchor: HTMLElement) => void;
  /** ¿Se puede seleccionar/soltar en ese día? */
  isDayEnabled: (day: Date) => boolean;
  fullHeight?: number;
};

export const CnEventCalendarContext = createContext<CnEventCalendarContextValue | null>(null);

export const useCalendarContext = (): CnEventCalendarContextValue => {
  const ctx = useContext(CnEventCalendarContext);
  if (!ctx) throw new Error("Las vistas de CnEventCalendar deben usarse dentro del calendario");
  return ctx;
};
