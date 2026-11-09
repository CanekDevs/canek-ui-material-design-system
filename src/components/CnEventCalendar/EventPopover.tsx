import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import type { MouseEvent, ReactNode } from "react";
import { CnAvatar, CnAvatarGroup } from "../CnAvatar";
import { CnButton } from "../CnButton";
import type { CnChipColor } from "../CnChip";
import { CnChip } from "../CnChip";
import { CnIcon } from "../CnIcon";
import { alpha, formatDayLong, formatOccurrenceTime, formatTime } from "./calendar-utils";
import type { CnEventCategory, CnEventOccurrence, CnEventStatus } from "./CnEventCalendar.types";

const CHIP_SX = { "& .MuiChip-label": { paddingInline: "8px" } };

export const STATUS_META: Record<
  CnEventStatus,
  { label: string; color: CnChipColor; icon: string }
> = {
  scheduled: { label: "Programado", color: "neutral", icon: "schedule" },
  confirmed: { label: "Confirmado", color: "success", icon: "check_circle" },
  tentative: { label: "Tentativo", color: "warning", icon: "pending" },
  cancelled: { label: "Cancelado", color: "error", icon: "cancel" },
};

const row = (icon: string, content: ReactNode) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.82rem" }}>
    <Box sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)", display: "flex", pt: "1px" }}>
      <CnIcon name={icon} size={16} />
    </Box>
    <Box sx={{ minWidth: 0, color: "var(--cn-color-text, #222831)", lineHeight: 1.45 }}>
      {content}
    </Box>
  </Box>
);

export type EventPopoverProps = {
  occurrence: CnEventOccurrence | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  locale: string;
  category?: CnEventCategory;
  actions?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
};

/** Tarjeta de detalle de un evento (título, horario, lugar, asistentes, descripción, acciones). */
export const EventPopover = ({
  occurrence,
  anchorEl,
  onClose,
  locale,
  category,
  actions,
  onEdit,
  onDelete,
}: EventPopoverProps) => {
  const open = Boolean(occurrence && anchorEl);
  const event = occurrence?.event;
  const status = event?.status ? STATUS_META[event.status] : null;
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          role: "dialog",
          "aria-label": event ? `Detalle: ${event.title}` : undefined,
          sx: {
            width: 320,
            maxWidth: "calc(100vw - 32px)",
            borderRadius: "12px",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            boxShadow: "0 12px 40px rgba(17, 20, 24, 0.14)",
            overflow: "hidden",
          },
        },
      }}
    >
      {occurrence && event && (
        <Box data-cn-event-popover>
          <Box sx={{ height: 5, backgroundColor: occurrence.color }} />
          <Box sx={{ p: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  borderRadius: "9px",
                  display: "grid",
                  placeItems: "center",
                  color: occurrence.color,
                  backgroundColor: alpha(occurrence.color, 0.14),
                }}
              >
                <CnIcon name={event.icon ?? category?.icon ?? "event"} size={18} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  component="h3"
                  sx={{
                    m: 0,
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: "var(--cn-color-text, #222831)",
                    wordBreak: "break-word",
                    ...(event.status === "cancelled" && { textDecoration: "line-through" }),
                  }}
                >
                  {event.title}
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px", mt: "6px" }}>
                  {category && (
                    <CnChip
                      sx={CHIP_SX}
                      size="small"
                      variant="soft"
                      color="neutral"
                      label={category.label}
                      icon={
                        <Box
                          component="span"
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: occurrence.color,
                            ml: "6px !important",
                          }}
                        />
                      }
                    />
                  )}
                  {status && (
                    <CnChip
                      sx={CHIP_SX}
                      size="small"
                      variant="soft"
                      color={status.color}
                      icon={status.icon}
                      label={status.label}
                    />
                  )}
                  {occurrence.recurring && (
                    <CnChip
                      sx={CHIP_SX}
                      size="small"
                      variant="soft"
                      color="info"
                      icon="repeat"
                      label="Se repite"
                    />
                  )}
                </Box>
              </Box>
              <IconButton
                size="small"
                aria-label="Cerrar"
                onClick={onClose}
                sx={{ mt: "-4px", mr: "-6px" }}
              >
                <CnIcon name="close" size={18} />
              </IconButton>
            </Box>

            {row("schedule", formatOccurrenceTime(occurrence, locale))}
            {event.location && row("location_on", event.location)}
            {event.attendees &&
              event.attendees.length > 0 &&
              row(
                "group",
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CnAvatarGroup max={5} size="xs" spacing="normal">
                    {event.attendees.map((a, i) => (
                      <CnAvatar
                        key={a.id ?? `${a.name}-${i}`}
                        name={a.name}
                        src={a.avatarUrl}
                        size="xs"
                      />
                    ))}
                  </CnAvatarGroup>
                  <Box component="span" sx={{ color: "var(--cn-color-text-muted, #6e7682)" }}>
                    {event.attendees.length === 1
                      ? event.attendees[0].name
                      : `${event.attendees.length} asistentes`}
                  </Box>
                </Box>,
              )}
            {event.description && (
              <Box
                sx={{
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  color: "var(--cn-color-text-muted, #6e7682)",
                  whiteSpace: "pre-line",
                  maxHeight: 160,
                  overflow: "auto",
                }}
              >
                {event.description}
              </Box>
            )}
            {(actions || onEdit || onDelete) && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  gap: "6px",
                  pt: "10px",
                  borderTop: "1px solid var(--cn-color-border, #eceef1)",
                }}
              >
                {actions}
                {onDelete && (
                  <CnButton
                    size="small"
                    variant="text"
                    color="error"
                    startIcon="delete_outline"
                    onClick={onDelete}
                  >
                    Eliminar
                  </CnButton>
                )}
                {onEdit && (
                  <CnButton
                    size="small"
                    variant="outlined"
                    color="accent"
                    startIcon="edit"
                    onClick={onEdit}
                  >
                    Editar
                  </CnButton>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Popover>
  );
};

export type DayListPopoverProps = {
  day: Date | null;
  anchorEl: HTMLElement | null;
  occurrences: CnEventOccurrence[];
  locale: string;
  onClose: () => void;
  onOpenEvent: (occurrence: CnEventOccurrence, anchor: HTMLElement) => void;
  onGoToDay?: (day: Date) => void;
};

/** Lista de todos los eventos de un día (desde "+N más"). */
export const DayListPopover = ({
  day,
  anchorEl,
  occurrences,
  locale,
  onClose,
  onOpenEvent,
  onGoToDay,
}: DayListPopoverProps) => (
  <Popover
    open={Boolean(day && anchorEl)}
    anchorEl={anchorEl}
    onClose={onClose}
    anchorOrigin={{ vertical: "center", horizontal: "center" }}
    transformOrigin={{ vertical: "center", horizontal: "center" }}
    slotProps={{
      paper: {
        role: "dialog",
        "aria-label": day ? `Eventos del ${formatDayLong(day, locale)}` : undefined,
        sx: { width: 260, borderRadius: "12px", p: "12px" },
      },
    }}
  >
    {day && (
      <Box data-cn-day-list>
        <Box sx={{ display: "flex", alignItems: "center", mb: "8px" }}>
          <Box sx={{ flex: 1, fontSize: "0.82rem", fontWeight: 700 }}>
            {formatDayLong(day, locale)}
          </Box>
          {onGoToDay && (
            <Tooltip title="Ver día">
              <IconButton size="small" aria-label="Ver día" onClick={() => onGoToDay(day)}>
                <CnIcon name="open_in_new" size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {occurrences.map((occ) => (
            <Box
              key={occ.key}
              component="button"
              type="button"
              onClick={(e: MouseEvent<HTMLElement>) => onOpenEvent(occ, e.currentTarget)}
              sx={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                px: "8px",
                py: "5px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                backgroundColor: alpha(occ.color, 0.12),
                borderLeft: `3px solid ${occ.color}`,
                "&:hover": { backgroundColor: alpha(occ.color, 0.2) },
                "&:focus-visible": { outline: "2px solid var(--cn-color-brand-500, #3562a6)" },
              }}
            >
              {!occ.allDay && (
                <Box component="span" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {formatTime(occ.start)}
                </Box>
              )}
              <Box
                component="span"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {occ.event.title}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    )}
  </Popover>
);
