import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef, useMemo } from "react";
import type { CnTone } from "../../utils/tones";
import type { CnActivityComposerProps } from "../CnActivityComposer";
import { CnActivityComposer } from "../CnActivityComposer";
import type { CnChipColor } from "../CnChip";
import { CnIcon } from "../CnIcon";
import type { CnTimelineFilter, CnTimelineItem, CnTimelineProps } from "../CnTimeline";
import { CnTimeline } from "../CnTimeline";
import { CnContactTimelineSkeleton } from "./CnContactTimelineSkeleton";

/** Canal o tipo de una interacción con el contacto. */
export type CnContactChannel =
  "note" | "call" | "email" | "meeting" | "task" | "message" | "deal" | "system";

export type CnContactActivity = Omit<CnTimelineItem, "type"> & {
  channel: CnContactChannel;
  /** Fijada arriba del historial (acuerdos, datos que todos deben ver). */
  pinned?: boolean;
};

export type CnContactTimelineProps = {
  activities: readonly CnContactActivity[];
  /**
   * Guarda una actividad nueva desde el compositor en línea. Sin esta prop, el compositor no
   * aparece.
   */
  onCreate?: CnActivityComposerProps["onSubmit"];
  /** Props del compositor (tipos, menciones, plantillas, nombre del registro). */
  composerProps?: Omit<CnActivityComposerProps, "onSubmit" | "skeleton">;
  /** Fija o quita de fijadas. Sin esta prop no se muestra la acción "Fijar". */
  onPinChange?: (activity: CnContactActivity, pinned: boolean) => void;
  /** Chips de filtro por canal (solo los canales que aparecen). */
  channelFilters?: boolean;
  /** Etiquetas propias por canal. */
  channelLabels?: Partial<Record<CnContactChannel, string>>;
  /** Props que pasan al historial (`searchable`, `hasMore`, `onLoadMore`, `now`…). */
  timelineProps?: Omit<
    CnTimelineProps,
    "items" | "filters" | "skeleton" | "error" | "onRetry" | "sx" | "className"
  >;
  /** Mensaje de error al cargar el historial. */
  error?: ReactNode;
  onRetry?: () => void;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

export const CONTACT_CHANNELS: Record<
  CnContactChannel,
  { label: string; icon: string; tone: CnTone; chip: CnChipColor }
> = {
  note: { label: "Notas", icon: "edit_note", tone: "warning", chip: "warning" },
  call: { label: "Llamadas", icon: "call", tone: "success", chip: "success" },
  email: { label: "Correos", icon: "mail", tone: "info", chip: "info" },
  meeting: { label: "Reuniones", icon: "groups", tone: "accent", chip: "accent" },
  task: { label: "Tareas", icon: "task_alt", tone: "primary", chip: "primary" },
  message: { label: "Mensajes", icon: "chat", tone: "info", chip: "info" },
  deal: { label: "Oportunidades", icon: "handshake", tone: "success", chip: "success" },
  system: { label: "Sistema", icon: "settings", tone: "neutral", chip: "neutral" },
};

const toItem = (
  activity: CnContactActivity,
  onPinChange: CnContactTimelineProps["onPinChange"],
): CnTimelineItem => {
  const { channel, pinned, ...rest } = activity;
  const meta = CONTACT_CHANNELS[channel];
  return {
    ...rest,
    type: channel,
    icon: rest.icon ?? (rest.avatar ? undefined : meta.icon),
    tone: rest.tone ?? meta.tone,
    actions: onPinChange
      ? [
          ...(rest.actions ?? []),
          {
            id: "pin",
            label: pinned ? "Quitar de fijadas" : "Fijar",
            icon: "push_pin",
            onClick: () => onPinChange(activity, !pinned),
          },
        ]
      : rest.actions,
  };
};

/** Historial multicanal de un contacto con filtros por canal, fijadas y compositor en línea. */
export const CnContactTimeline = forwardRef<HTMLDivElement, CnContactTimelineProps>(
  function CnContactTimeline(
    {
      activities,
      onCreate,
      composerProps,
      onPinChange,
      channelFilters = true,
      channelLabels,
      timelineProps,
      error,
      onRetry,
      skeleton = false,
      ariaLabel = "Historial del contacto",
      sx,
      className,
    },
    ref,
  ) {
    const pinned = useMemo(() => activities.filter((a) => a.pinned), [activities]);
    const rest = useMemo(() => activities.filter((a) => !a.pinned), [activities]);

    const filters = useMemo<CnTimelineFilter[]>(() => {
      if (!channelFilters) return [];
      const present = (Object.keys(CONTACT_CHANNELS) as CnContactChannel[]).filter((channel) =>
        rest.some((a) => a.channel === channel),
      );
      if (present.length < 2) return [];
      return present.map((channel) => ({
        id: channel,
        label: channelLabels?.[channel] ?? CONTACT_CHANNELS[channel].label,
        icon: CONTACT_CHANNELS[channel].icon,
        color: CONTACT_CHANNELS[channel].chip,
        match: (item: CnTimelineItem) => item.type === channel,
      }));
    }, [channelFilters, channelLabels, rest]);

    if (skeleton) {
      return (
        <CnContactTimelineSkeleton
          composer={Boolean(onCreate)}
          filters={channelFilters}
          sx={sx}
          className={className}
        />
      );
    }

    return (
      <Box
        ref={ref}
        component="section"
        aria-label={ariaLabel}
        data-cn-contact-timeline
        className={className}
        sx={[
          {
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            color: "var(--cn-color-text, #222831)",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {onCreate && <CnActivityComposer {...composerProps} onSubmit={onCreate} />}

        {pinned.length > 0 && (
          <Box
            component="section"
            aria-label="Fijadas"
            sx={{
              p: "16px",
              borderRadius: "var(--cn-radius-md, 8px)",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              backgroundColor: "var(--cn-color-surface-sunken, #f4f5f7)",
              minWidth: 0,
            }}
          >
            <Typography
              component="h3"
              sx={{
                m: 0,
                mb: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <CnIcon name="push_pin" size={18} />
              Fijadas ({pinned.length})
            </Typography>
            <CnTimeline
              items={pinned.map((a) => toItem(a, onPinChange))}
              size="sm"
              now={timelineProps?.now}
              ariaLabel="Actividades fijadas"
            />
          </Box>
        )}

        <CnTimeline
          groupByDay
          searchable
          searchPlaceholder="Buscar en el historial"
          emptyTitle="Sin actividad todavía"
          emptyDescription="Registra una nota, llamada o correo para empezar el historial."
          emptyIcon="history"
          {...timelineProps}
          items={rest.map((a) => toItem(a, onPinChange))}
          filters={filters}
          error={error}
          onRetry={onRetry}
          ariaLabel={timelineProps?.ariaLabel ?? "Actividades"}
        />
      </Box>
    );
  },
);
