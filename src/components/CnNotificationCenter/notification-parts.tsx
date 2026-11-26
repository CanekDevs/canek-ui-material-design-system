import Box from "@mui/material/Box";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useState } from "react";
import { CN_TONES } from "../../utils/tones";
import { CnButton } from "../CnButton";
import { CnIcon } from "../CnIcon";
import { CnSwitchField } from "../CnSwitchField";
import type { CnBrowserNotificationsApi } from "./useBrowserNotifications";
import type {
  CnNotification,
  CnNotificationAction,
  CnNotificationConnection,
  CnNotificationProgress,
  CnNotificationSettings,
} from "./CnNotificationCenter.types";

/*
 * Piezas del panel: contenido enriquecido de cada fila (mensaje, imagen,
 * avance y botones con carga), avisos de estado y la vista de preferencias.
 */

const stopRow = {
  onClick: (event: MouseEvent) => event.stopPropagation(),
  onKeyDown: (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") event.stopPropagation();
  },
};

const clamp = (lines: number) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: lines,
  overflow: "hidden",
});

// ─── Avance ───────────────────────────────────────────────────────────────

export const normalizeProgress = (
  progress: CnNotification["progress"],
): CnNotificationProgress | null => {
  if (progress === undefined || progress === null) return null;
  return typeof progress === "number" ? { value: progress } : progress;
};

const ProgressBar = ({ progress }: { progress: CnNotificationProgress }) => {
  const value =
    progress.value === undefined ? undefined : Math.max(0, Math.min(100, progress.value));
  const status = progress.status ?? (value === 100 ? "done" : "running");
  const tone =
    status === "error" ? CN_TONES.error : status === "done" ? CN_TONES.success : CN_TONES.primary;
  const label =
    progress.label ??
    (status === "done"
      ? "Completado"
      : status === "error"
        ? "Con error"
        : value === undefined
          ? "En proceso…"
          : `${Math.round(value)}%`);
  return (
    <Box data-cn-notification-progress={status} sx={{ mt: "6px", minWidth: 0 }}>
      <Box
        role="progressbar"
        aria-label={typeof label === "string" ? label : "Avance"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value === undefined ? undefined : Math.round(value)}
        sx={{
          position: "relative",
          height: 4,
          borderRadius: 2,
          overflow: "hidden",
          backgroundColor: "var(--cn-color-neutral-100, #eef0f2)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            insetBlock: 0,
            left: 0,
            borderRadius: 2,
            backgroundColor: tone.main,
            ...(value === undefined
              ? {
                  width: "40%",
                  animation: "cn-notification-indeterminate 1.4s ease-in-out infinite",
                  "@keyframes cn-notification-indeterminate": {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(250%)" },
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    animation: "none",
                    width: "100%",
                    opacity: 0.4,
                  },
                }
              : { width: `${value}%`, transition: "width 240ms ease" }),
          }}
        />
      </Box>
      <Box
        sx={{
          mt: "2px",
          fontSize: 11,
          color: status === "error" ? tone.main : "var(--cn-color-text-muted, #6e7682)",
          fontVariantNumeric: "tabular-nums",
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </Box>
    </Box>
  );
};

// ─── Botones con carga ───────────────────────────────────────────────────

const ActionButtons = ({
  notification,
  actions,
}: {
  notification: CnNotification;
  actions: readonly CnNotificationAction[];
}) => {
  const [pending, setPending] = useState<string | null>(null);
  return (
    <Box
      data-cn-notification-buttons
      {...stopRow}
      sx={{ display: "flex", flexWrap: "wrap", gap: "6px", mt: "8px", minWidth: 0 }}
    >
      {actions.map((action, i) => (
        <CnButton
          key={action.id}
          size="small"
          variant={action.variant ?? (i === 0 ? "contained" : "outlined")}
          color={action.color ?? (i === 0 ? "primary" : "neutral")}
          startIcon={action.icon}
          loading={pending === action.id}
          disabled={pending !== null && pending !== action.id}
          onClick={async () => {
            const result = action.onClick(notification);
            if (result && typeof (result as Promise<void>).then === "function") {
              setPending(action.id);
              try {
                await result;
              } finally {
                setPending(null);
              }
            }
          }}
          sx={{
            maxWidth: "100%",
            height: "auto",
            minHeight: 28,
            py: "3px",
            whiteSpace: "normal",
            lineHeight: 1.3,
            textAlign: "left",
          }}
        >
          {action.label}
        </CnButton>
      ))}
    </Box>
  );
};

/** Descripción de la fila: mensaje (2 líneas), imagen, avance y botones. */
export const NotificationContent = ({
  notification,
  muted,
}: {
  notification: CnNotification;
  muted: boolean;
}) => {
  const progress = normalizeProgress(notification.progress);
  const buttons = (notification.actions ?? []).filter((a) => a.appearance === "button");
  const urgent = notification.priority === "urgent" && !notification.read;
  if (
    !notification.message &&
    !notification.image &&
    !progress &&
    buttons.length === 0 &&
    !muted &&
    !urgent
  )
    return null;
  return (
    <Box data-cn-notification-content sx={{ minWidth: 0 }}>
      {urgent && (
        <Box
          component="span"
          data-cn-notification-urgent
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            mb: "2px",
            px: "10px",
            borderRadius: "999px",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: "18px",
            color: CN_TONES.error.text,
            backgroundColor: CN_TONES.error.soft,
          }}
        >
          <CnIcon name="priority_high" size={12} />
          Urgente
        </Box>
      )}
      {notification.message && (
        <Box sx={{ ...clamp(2), overflowWrap: "anywhere" }}>{notification.message}</Box>
      )}
      {notification.image && (
        <Box
          component="img"
          src={notification.image.src}
          alt={notification.image.alt ?? ""}
          loading="lazy"
          data-cn-notification-image
          sx={{
            display: "block",
            mt: "6px",
            width: "100%",
            maxWidth: 320,
            maxHeight: 160,
            objectFit: "cover",
            borderRadius: "var(--cn-radius-md, 8px)",
            border: "1px solid var(--cn-color-border-subtle, #e9ecef)",
            backgroundColor: "var(--cn-color-neutral-50, #f8f9fa)",
          }}
        />
      )}
      {progress && <ProgressBar progress={progress} />}
      {buttons.length > 0 && <ActionButtons notification={notification} actions={buttons} />}
      {muted && (
        <Box
          sx={{
            mt: "4px",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: 11,
            color: "var(--cn-color-text-subtle, #9aa1aa)",
          }}
        >
          <CnIcon name="volume_off" size={12} />
          Origen silenciado
        </Box>
      )}
    </Box>
  );
};

// ─── Avisos de estado ────────────────────────────────────────────────────

export const StatusBanner = ({
  connection,
  onReconnect,
  doNotDisturb,
  onDisableDnd,
}: {
  connection: CnNotificationConnection;
  onReconnect?: () => void;
  doNotDisturb: boolean;
  onDisableDnd?: () => void;
}) => {
  const rows: ReactNode[] = [];
  if (connection !== "online") {
    const offline = connection === "offline";
    rows.push(
      <Box
        key="connection"
        role="status"
        data-cn-notification-connection={connection}
        sx={bannerSx(offline ? "warning" : "info")}
      >
        <CnIcon
          name={offline ? "cloud_off" : "sync"}
          size={16}
          spin={!offline}
          sx={{ flexShrink: 0 }}
        />
        <Box sx={{ flex: "1 1 160px", minWidth: 0 }}>
          {offline
            ? "Sin conexión. Las nuevas llegarán al reconectar."
            : "Reconectando con el servidor…"}
        </Box>
        {offline && onReconnect && (
          <CnButton size="small" variant="text" color="neutral" onClick={onReconnect}>
            Reintentar
          </CnButton>
        )}
      </Box>,
    );
  }
  if (doNotDisturb) {
    rows.push(
      <Box key="dnd" role="status" data-cn-notification-dnd sx={bannerSx("neutral")}>
        <CnIcon name="do_not_disturb_on" size={16} sx={{ flexShrink: 0 }} />
        <Box sx={{ flex: "1 1 160px", minWidth: 0 }}>
          No molestar: sin vistas previas, sonidos ni avisos.
        </Box>
        {onDisableDnd && (
          <CnButton size="small" variant="text" color="neutral" onClick={onDisableDnd}>
            Desactivar
          </CnButton>
        )}
      </Box>,
    );
  }
  return rows.length ? <>{rows}</> : null;
};

const bannerSx = (tone: "warning" | "info" | "neutral") => ({
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  columnGap: "8px",
  rowGap: "2px",
  px: "16px",
  py: "6px",
  fontSize: 12,
  lineHeight: 1.4,
  color: tone === "neutral" ? "var(--cn-color-text-secondary, #4e5660)" : CN_TONES[tone].text,
  backgroundColor: tone === "neutral" ? "var(--cn-color-neutral-50, #f8f9fa)" : CN_TONES[tone].soft,
  borderBottom: "1px solid var(--cn-color-border-subtle, #e9ecef)",
  minWidth: 0,
});

// ─── Preferencias ─────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <Box
    role="heading"
    aria-level={3}
    sx={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: "var(--cn-color-text-muted, #6e7682)",
      mt: "8px",
    }}
  >
    {children}
  </Box>
);

export const SettingsView = ({
  settings,
  doNotDisturb,
  onDoNotDisturbChange,
  sound,
  onSoundChange,
  vibrate,
  onVibrateChange,
  browser,
  showBrowser,
  mutedSources,
  sourceLabels,
  onMuteSource,
  moreHref,
  onMore,
}: {
  settings: CnNotificationSettings;
  doNotDisturb: boolean;
  onDoNotDisturbChange: (value: boolean) => void;
  sound: boolean;
  onSoundChange?: (value: boolean) => void;
  vibrate: boolean;
  onVibrateChange?: (value: boolean) => void;
  browser: CnBrowserNotificationsApi;
  showBrowser: boolean;
  mutedSources: readonly string[];
  sourceLabels: Map<string, ReactNode>;
  onMuteSource?: (sourceId: string, muted: boolean) => void;
  moreHref?: string;
  onMore?: () => void;
}) => {
  const vibrateSupported = typeof navigator !== "undefined" && "vibrate" in navigator;
  return (
    <Box
      data-cn-notification-settings
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        px: "16px",
        py: "12px",
        minWidth: 0,
        overflowY: "auto",
      }}
    >
      <SectionTitle>Alertas</SectionTitle>
      <CnSwitchField
        label="No molestar"
        description="Silencia vistas previas, sonidos y avisos del escritorio."
        value={doNotDisturb}
        onChange={onDoNotDisturbChange}
      />
      {settings.showSound && onSoundChange && (
        <CnSwitchField
          label="Sonido"
          description="Un tono breve al recibir una notificación."
          value={sound}
          onChange={onSoundChange}
        />
      )}
      {settings.showVibrate && onVibrateChange && vibrateSupported && (
        <CnSwitchField
          label="Vibración"
          description="En teléfonos compatibles."
          value={vibrate}
          onChange={onVibrateChange}
        />
      )}
      {showBrowser && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            fontSize: 13,
            minWidth: 0,
          }}
        >
          <Box sx={{ minWidth: 0, flex: "1 1 180px" }}>
            <Box sx={{ fontWeight: 600, color: "var(--cn-color-text, #222831)" }}>
              Avisos del escritorio
            </Box>
            <Box sx={{ fontSize: 12, color: "var(--cn-color-text-muted, #6e7682)" }}>
              {!browser.supported
                ? "Tu navegador no los admite."
                : browser.permission === "granted"
                  ? "Activados para este navegador."
                  : browser.permission === "denied"
                    ? "Bloqueados. Actívalos desde la configuración del navegador."
                    : "Recibe avisos aunque la pestaña esté en segundo plano."}
            </Box>
          </Box>
          {browser.supported && browser.permission === "default" && (
            <CnButton
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => void browser.requestPermission()}
            >
              Activar
            </CnButton>
          )}
        </Box>
      )}
      {settings.categories && settings.categories.length > 0 && (
        <>
          <SectionTitle>Categorías</SectionTitle>
          {settings.categories.map((category) => (
            <CnSwitchField
              key={category.id}
              label={category.label}
              description={category.description}
              value={category.enabled}
              onChange={(enabled) => settings.onCategoryChange?.(category.id, enabled)}
              disabled={!settings.onCategoryChange}
            />
          ))}
        </>
      )}
      {onMuteSource && mutedSources.length > 0 && (
        <>
          <SectionTitle>Orígenes silenciados</SectionTitle>
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: "4px" }}>
            {mutedSources.map((id) => (
              <Box
                component="li"
                key={id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: 13,
                  minWidth: 0,
                }}
              >
                <CnIcon
                  name="volume_off"
                  size={16}
                  sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)" }}
                />
                <Box sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                  {sourceLabels.get(id) ?? id}
                </Box>
                <CnButton
                  size="small"
                  variant="text"
                  color="primary"
                  onClick={() => onMuteSource(id, false)}
                >
                  Reactivar
                </CnButton>
              </Box>
            ))}
          </Box>
        </>
      )}
      {(moreHref || onMore) && (
        <Box sx={{ mt: "4px" }}>
          <CnButton
            size="small"
            variant="text"
            color="primary"
            endIcon="arrow_forward"
            href={moreHref}
            onClick={onMore}
          >
            Todas las preferencias
          </CnButton>
        </Box>
      )}
    </Box>
  );
};
