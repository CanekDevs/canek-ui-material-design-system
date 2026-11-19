import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Popper from "@mui/material/Popper";
import { useEffect, useState } from "react";
import { CN_TONES } from "../../utils/tones";
import { CnButton } from "../CnButton";
import { CnIcon } from "../CnIcon";
import { formatRelative, toValidDate } from "../CnTimeline/timeline-utils";
import type { CnNotification } from "./CnNotificationCenter.types";

export type CnNotificationPreviewProps = {
  anchorEl: HTMLElement | null;
  items: readonly CnNotification[];
  rotateMs?: number;
  onOpen: (notification: CnNotification) => void;
  /** Quita una notificación de la vista previa (no la descarta del centro). */
  onSkip: (id: string) => void;
  onViewAll: () => void;
  onClose: () => void;
};

/**
 * Vista previa flotante de notificaciones recién llegadas (equivale a
 * `TbNotificationFloater`): rota entre ellas, se pausa al pasar el cursor y
 * permite abrir, saltar, ver todas o cerrar.
 */
export const CnNotificationPreview = ({
  anchorEl,
  items,
  rotateMs = 6000,
  onOpen,
  onSkip,
  onViewAll,
  onClose,
}: CnNotificationPreviewProps) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;
  const safeIndex = total ? index % total : 0;
  const current = items[safeIndex];
  const firstId = items[0]?.id;

  useEffect(() => setIndex(0), [firstId]);
  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % total), rotateMs);
    return () => window.clearInterval(timer);
  }, [paused, total, rotateMs]);

  if (!current || !anchorEl) return null;
  const tone = CN_TONES[current.tone ?? "info"];
  const date = toValidDate(current.time);

  return (
    <Popper
      open
      anchorEl={anchorEl}
      placement="bottom-end"
      modifiers={[
        { name: "offset", options: { offset: [0, 8] } },
        { name: "preventOverflow", options: { padding: 8 } },
      ]}
      sx={{ zIndex: 1300 }}
    >
      <Box
        role="region"
        aria-label="Notificaciones nuevas"
        data-cn-notification-preview
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        sx={{
          width: 360,
          maxWidth: "calc(100vw - 16px)",
          boxSizing: "border-box",
          display: "flex",
          overflow: "hidden",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          borderRadius: "var(--cn-radius-lg, 12px)",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          boxShadow: "var(--cn-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.18))",
        }}
      >
        <Box aria-hidden sx={{ width: 4, flexShrink: 0, backgroundColor: tone.main }} />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
            <Box
              aria-hidden
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: tone.main,
                backgroundColor: tone.soft,
              }}
            >
              <CnIcon name={current.icon ?? "notifications"} size="sm" />
            </Box>
            <ButtonBase
              onClick={() => onOpen(current)}
              data-cn-notification-preview-open
              sx={{
                flex: 1,
                minWidth: 0,
                display: "block",
                textAlign: "left",
                borderRadius: "4px",
                "&.Mui-focusVisible": { outline: "2px solid var(--cn-color-brand-500, #3562a6)" },
              }}
            >
              <Box
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--cn-color-text, #222831)",
                  overflowWrap: "anywhere",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflow: "hidden",
                }}
              >
                {current.title}
              </Box>
              {current.message && (
                <Box
                  sx={{
                    mt: "2px",
                    fontSize: 12,
                    color: "var(--cn-color-text-muted, #6e7682)",
                    overflowWrap: "anywhere",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                >
                  {current.message}
                </Box>
              )}
              {(current.source || date) && (
                <Box
                  sx={{
                    mt: "4px",
                    fontSize: 11,
                    color: "var(--cn-color-text-subtle, #9aa1aa)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {current.source}
                  {current.source && date ? " · " : null}
                  {date && formatRelative(date)}
                </Box>
              )}
            </ButtonBase>
            <CnButton
              iconOnly
              icon="close"
              size="small"
              variant="text"
              color="neutral"
              aria-label="Cerrar vista previa"
              onClick={onClose}
              sx={{ flexShrink: 0, mt: "-4px", mr: "-6px" }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "4px",
              justifyContent: "space-between",
            }}
          >
            {total > 1 ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <CnButton
                  iconOnly
                  icon="chevron_left"
                  size="small"
                  variant="text"
                  color="neutral"
                  aria-label="Anterior"
                  onClick={() => setIndex((i) => (i - 1 + total) % total)}
                />
                <Box
                  aria-live="polite"
                  sx={{ fontSize: 11, color: "var(--cn-color-text-muted, #6e7682)" }}
                >
                  {safeIndex + 1} de {total}
                </Box>
                <CnButton
                  iconOnly
                  icon="chevron_right"
                  size="small"
                  variant="text"
                  color="neutral"
                  aria-label="Siguiente"
                  onClick={() => setIndex((i) => (i + 1) % total)}
                />
              </Box>
            ) : (
              <span />
            )}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "flex-end" }}>
              <CnButton
                size="small"
                variant="text"
                color="neutral"
                onClick={() => onSkip(current.id)}
              >
                Omitir
              </CnButton>
              <CnButton size="small" variant="outlined" color="primary" onClick={onViewAll}>
                Ver todas
              </CnButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Popper>
  );
};
