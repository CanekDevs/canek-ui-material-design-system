import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { CnIcon } from "../CnIcon";
import type { CnAvailabilityRange } from "./calendar-context";
import { describeConflict } from "./conflicts";
import type { CnEventConflict, CnEventOccurrence } from "./CnEventCalendar.types";

/** Estilos y textos por estado de disponibilidad. */
export const AVAILABILITY_META: Record<
  CnAvailabilityRange["status"],
  { label: string; background: string }
> = {
  busy: {
    label: "Ocupado",
    background:
      "repeating-linear-gradient(135deg, rgba(214, 60, 60, 0.13) 0 6px, rgba(214, 60, 60, 0.05) 6px 12px)",
  },
  tentative: {
    label: "Tentativo",
    background:
      "repeating-linear-gradient(135deg, rgba(224, 160, 32, 0.16) 0 6px, rgba(224, 160, 32, 0.05) 6px 12px)",
  },
  free: { label: "Libre", background: "rgba(46, 158, 79, 0.09)" },
  away: {
    label: "Fuera de la oficina",
    background:
      "repeating-linear-gradient(135deg, rgba(110, 118, 130, 0.16) 0 6px, rgba(110, 118, 130, 0.05) 6px 12px)",
  },
};

/** Texto de recordatorios ("10 min antes, 1 h antes"). */
export const formatReminders = (minutes: number[]): string =>
  minutes
    .slice()
    .sort((a, b) => a - b)
    .map((m) => {
      if (m === 0) return "Al inicio";
      if (m % 1440 === 0) return `${m / 1440} ${m === 1440 ? "día" : "días"} antes`;
      if (m % 60 === 0) return `${m / 60} h antes`;
      return m > 60 ? `${Math.floor(m / 60)} h ${m % 60} min antes` : `${m} min antes`;
    })
    .join(", ");

/** Íconos de conflicto y recordatorio dentro de un evento. */
export const EventBadges = ({
  occurrence,
  conflicts = [],
  size = 12,
  inverse = false,
}: {
  occurrence: CnEventOccurrence;
  conflicts?: CnEventConflict[];
  size?: number;
  /** Sobre fondo de color (texto blanco). */
  inverse?: boolean;
}): ReactNode => {
  const reminders = occurrence.event.reminders?.length ? occurrence.event.reminders : null;
  if (!conflicts.length && !reminders) return null;
  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "center", gap: "2px", flexShrink: 0 }}
    >
      {conflicts.length > 0 && (
        <Box
          component="span"
          data-cn-conflict
          title={conflicts.map(describeConflict).join("\n")}
          sx={{
            display: "inline-flex",
            color: inverse ? "#fff" : "var(--cn-color-warning-600, #b8831a)",
          }}
        >
          <CnIcon name="warning" size={size} />
        </Box>
      )}
      {reminders && (
        <Box
          component="span"
          data-cn-reminder
          title={`Recordatorio: ${formatReminders(reminders)}`}
          sx={{ display: "inline-flex", opacity: 0.8 }}
        >
          <CnIcon name="notifications" size={size} />
        </Box>
      )}
    </Box>
  );
};

/** Contorno de advertencia para eventos en conflicto. */
export const conflictRing = (conflicts: CnEventConflict[] | undefined) =>
  conflicts?.length
    ? { outline: "2px dashed var(--cn-color-warning-500, #e0a020)", outlineOffset: "-1px" }
    : {};
