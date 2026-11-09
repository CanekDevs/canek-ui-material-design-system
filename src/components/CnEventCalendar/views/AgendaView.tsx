import Box from "@mui/material/Box";
import type { MouseEvent, ReactNode } from "react";
import { useMemo } from "react";
import { CnAvatar, CnAvatarGroup } from "../../CnAvatar";
import { CnEmptyState } from "../../CnEmptyState";
import { CnIcon } from "../../CnIcon";
import { useCalendarContext } from "../calendar-context";
import {
  addDays,
  alpha,
  diffDays,
  formatTime,
  isSameDay,
  monthName,
  occursOnDay,
  resolveColor,
  toIsoDate,
  weekdayName,
} from "../calendar-utils";
import type { CnCalendarDateRange, CnEventOccurrence } from "../CnEventCalendar.types";
import { STATUS_META } from "../EventPopover";

/** Texto corto del horario dentro de un día concreto. */
const timeInDay = (occ: CnEventOccurrence, day: Date): string => {
  if (occ.allDay) {
    const total = diffDays(occ.end, occ.start);
    if (total <= 1) return "Todo el día";
    return `Día ${diffDays(day, occ.start) + 1} de ${total}`;
  }
  const startsToday = isSameDay(occ.start, day);
  const endsToday = isSameDay(occ.end, day) || occ.end.getTime() === addDays(day, 1).getTime();
  if (startsToday && endsToday) return `${formatTime(occ.start)} – ${formatTime(occ.end)}`;
  if (startsToday) return `Desde ${formatTime(occ.start)}`;
  if (endsToday) return `Hasta ${formatTime(occ.end)}`;
  return "Todo el día";
};

/** Renglón de evento (agenda, mes compacto). */
export const EventListItem = ({
  occurrence: occ,
  day,
  dense = false,
}: {
  occurrence: CnEventOccurrence;
  /** Versión angosta (móvil, mes compacto): horario arriba y sin avatares. */
  dense?: boolean;
  day: Date;
}) => {
  const ctx = useCalendarContext();
  const event = occ.event;
  const category = event.category ? ctx.categories.get(event.category) : undefined;
  const status = event.status && event.status !== "scheduled" ? STATUS_META[event.status] : null;
  return (
    <Box
      component="button"
      type="button"
      data-cn-event={event.id}
      aria-label={`${event.title}, ${timeInDay(occ, day)}`}
      onClick={(e: MouseEvent<HTMLElement>) => ctx.openEvent(occ, e.currentTarget)}
      sx={{
        all: "unset",
        boxSizing: "border-box",
        width: "100%",
        cursor: "pointer",
        display: "flex",
        flexDirection: dense ? "column" : "row",
        alignItems: dense ? "stretch" : "center",
        gap: dense ? "2px" : "12px",
        p: "8px 12px",
        borderRadius: "10px",
        border: "1px solid var(--cn-color-border, #eceef1)",
        borderLeft: `4px solid ${occ.color}`,
        backgroundColor: "var(--cn-color-surface, #fff)",
        transition: "background-color 120ms ease, box-shadow 120ms ease",
        "&:hover": { backgroundColor: alpha(occ.color, 0.06) },
        "&:focus-visible": { boxShadow: "0 0 0 3px rgba(61, 90, 254, 0.25)" },
      }}
    >
      <Box
        sx={{
          width: dense ? "auto" : 92,
          flexShrink: 0,
          fontSize: "0.76rem",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color: "var(--cn-color-text-muted, #6e7682)",
        }}
      >
        {timeInDay(occ, day)}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            fontSize: "0.86rem",
            fontWeight: 600,
            color: "var(--cn-color-text, #222831)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textDecoration: event.status === "cancelled" ? "line-through" : undefined,
          }}
        >
          {event.title}
        </Box>
        {(event.location || category || status) && (
          <Box
            sx={{
              mt: "2px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "4px 10px",
              fontSize: "0.74rem",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {category && (
              <Box
                component="span"
                sx={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Box
                  component="span"
                  sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: occ.color }}
                />
                {category.label}
              </Box>
            )}
            {event.location && (
              <Box
                component="span"
                sx={{ display: "inline-flex", alignItems: "center", gap: "2px" }}
              >
                <CnIcon name="location_on" size={13} />
                {event.location}
              </Box>
            )}
            {status && (
              <Box
                component="span"
                sx={{ display: "inline-flex", alignItems: "center", gap: "2px" }}
              >
                <CnIcon name={status.icon} size={13} />
                {status.label}
              </Box>
            )}
            {occ.recurring && <CnIcon name="repeat" size={13} label="Se repite" />}
          </Box>
        )}
      </Box>
      {!dense && event.attendees && event.attendees.length > 0 && (
        <CnAvatarGroup max={3} size="xs" sx={{ display: { xs: "none", sm: "flex" } }}>
          {event.attendees.map((a, i) => (
            <CnAvatar key={a.id ?? `${a.name}-${i}`} name={a.name} src={a.avatarUrl} size="xs" />
          ))}
        </CnAvatarGroup>
      )}
    </Box>
  );
};

export type AgendaViewProps = {
  range: CnCalendarDateRange;
  occurrences: CnEventOccurrence[];
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  dense?: boolean;
};

/** Lista por día de las ocurrencias del rango. */
export const AgendaView = ({
  range,
  occurrences,
  emptyTitle,
  emptyDescription,
  dense = false,
}: AgendaViewProps) => {
  const ctx = useCalendarContext();
  const { locale, now, holidays } = ctx;
  const groups = useMemo(() => {
    const total = diffDays(range.end, range.start);
    const result: { day: Date; items: CnEventOccurrence[] }[] = [];
    for (let i = 0; i < total; i += 1) {
      const day = addDays(range.start, i);
      const items = occurrences.filter((o) => occursOnDay(o, day));
      if (items.length || holidays.has(toIsoDate(day))) result.push({ day, items });
    }
    return result;
  }, [range.start, range.end, occurrences, holidays]);

  if (!groups.some((g) => g.items.length)) {
    return (
      <Box
        data-cn-event-calendar-view="agenda"
        sx={{ py: "32px", display: "grid", placeItems: "center" }}
      >
        <CnEmptyState
          variant="compact"
          icon="event_busy"
          title={emptyTitle ?? "Sin eventos"}
          description={emptyDescription ?? "No hay eventos en este periodo."}
        />
      </Box>
    );
  }

  return (
    <Box
      data-cn-event-calendar-view="agenda"
      role="list"
      aria-label="Agenda"
      sx={{ display: "flex", flexDirection: "column", gap: "4px" }}
    >
      {groups.map(({ day, items }, idx) => {
        const today = isSameDay(day, now);
        const holiday = holidays.get(toIsoDate(day));
        const newMonth = idx === 0 || groups[idx - 1].day.getMonth() !== day.getMonth();
        return (
          <Box key={day.getTime()} role="listitem" data-cn-agenda-day={toIsoDate(day)}>
            {newMonth && (
              <Box
                sx={{
                  mt: idx === 0 ? 0 : "12px",
                  mb: "6px",
                  px: "4px",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--cn-color-brand-600, #254d87)",
                }}
              >
                {`${monthName(day, locale)} ${day.getFullYear()}`}
              </Box>
            )}
            <Box
              sx={{
                display: "flex",
                gap: "14px",
                p: "8px",
                borderRadius: "12px",
                backgroundColor: today ? "rgba(53, 98, 166, 0.05)" : "transparent",
              }}
            >
              <Box
                component="button"
                type="button"
                aria-label={`Ver ${weekdayName(day, locale, "long")} ${day.getDate()}`}
                onClick={() => ctx.goToDay(day)}
                sx={{
                  all: "unset",
                  cursor: "pointer",
                  width: 48,
                  flexShrink: 0,
                  textAlign: "center",
                  pt: "2px",
                  "&:focus-visible": {
                    outline: "2px solid var(--cn-color-accent-500, #3d5afe)",
                    borderRadius: "8px",
                  },
                }}
              >
                <Box
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: today
                      ? "var(--cn-color-brand-600, #254d87)"
                      : "var(--cn-color-text-muted, #6e7682)",
                  }}
                >
                  {weekdayName(day, locale)}
                </Box>
                <Box
                  sx={{
                    mx: "auto",
                    mt: "2px",
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: today ? "#fff" : "var(--cn-color-text, #222831)",
                    backgroundColor: today ? "var(--cn-color-brand-600, #254d87)" : "transparent",
                  }}
                >
                  {day.getDate()}
                </Box>
              </Box>
              <Box
                sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {holiday && (
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      color: resolveColor(holiday.color, "#b8831a"),
                      pt: "4px",
                    }}
                  >
                    <CnIcon name={holiday.blocked ? "block" : "celebration"} size={14} />
                    {holiday.label}
                  </Box>
                )}
                {items.map((occ) => (
                  <EventListItem key={occ.key} occurrence={occ} day={day} dense={dense} />
                ))}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
