import { createContext, useContext } from "react";
import type { CnWeekday } from "../../utils/date-utils";
import type {
  CnCalendarHoliday,
  CnCalendarSlot,
  CnEventCategory,
  CnEventChange,
  CnEventOccurrence,
  CnWorkingHours,
} from "./CnEventCalendar.types";

/** Configuración compartida por todas las vistas. */
export type CnEventCalendarContextValue = {
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
  workingHours: CnWorkingHours | false;
  showNowIndicator: boolean;
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
