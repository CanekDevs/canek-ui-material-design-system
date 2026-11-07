import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLines, SkText } from "../CnSkeleton";
import type { CnAlertMode, CnAlertSeverity, CnAlertVariant } from "./CnAlert";

export type CnAlertSkeletonProps = CnSkeletonCommonProps & {
  variant?: CnAlertVariant;
  /** Se acepta por paridad con `CnAlert`; no cambia la forma. */
  severity?: CnAlertSeverity;
  /** `popup`/`toast`: ancho y radio de la notificación flotante (se muestra en línea). */
  mode?: CnAlertMode;
  title?: boolean | string;
  /** Mensaje: con texto, las líneas se estiman por su longitud y saltos de línea. */
  message?: boolean | string;
  /** Líneas del mensaje (prevalece sobre la estimación). */
  lines?: number;
  icon?: boolean;
  /** Acción (botón) a la derecha. */
  action?: boolean;
  /** Botón de cerrar. */
  closable?: boolean;
};

const MESSAGE_FONT = 12;
const MESSAGE_LINE = Math.round(MESSAGE_FONT * 1.5);
const TITLE_FONT = 13;
const ICON = 22;

const estimateLines = (message: boolean | string, lines?: number) => {
  if (lines != null) return Math.max(0, lines);
  if (!message) return 0;
  if (typeof message !== "string") return 2;
  const rows = message
    .split("\n")
    .filter((line) => line.trim() !== "")
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 80)), 0);
  return Math.min(Math.max(rows, 1), 5);
};

/** Skeleton de `CnAlert`: ícono, título, mensaje, acción y cerrar según sus variantes. */
export const CnAlertSkeleton = ({
  variant = "standard",
  mode = "inline",
  title = false,
  message = true,
  lines,
  icon = true,
  action = false,
  closable = false,
  animation,
  ariaLabel = "Cargando alerta",
  sx,
  className,
}: CnAlertSkeletonProps) => {
  const messageLines = estimateLines(message, lines);
  const isPopup = mode === "popup" || mode === "toast";
  const radius = isPopup ? "var(--cn-radius-lg, 12px)" : "var(--cn-radius-md, 8px)";
  const contentHeight =
    2 +
    (title ? Math.round(TITLE_FONT * 1.35) + (messageLines ? 4 : 0) : 0) +
    messageLines * MESSAGE_LINE;
  const height = 20 + Math.max(icon ? ICON : 0, contentHeight, closable ? 26 : 0);
  const sizeSx = isPopup ? { minWidth: { xs: "auto", sm: 320 }, maxWidth: 560 } : {};

  return (
    <CnSkeletonGroup
      name="alert"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {variant === "filled" ? (
        // Fondo sólido: la alerta entera es la pieza.
        <Box sx={sizeSx}>
          <SkBlock width="100%" height={height} radius={radius} />
        </Box>
      ) : (
        <Box
          sx={{
            ...sizeSx,
            display: "flex",
            alignItems: "flex-start",
            boxSizing: "border-box",
            minHeight: height,
            py: "10px",
            px: "12px",
            borderRadius: radius,
            ...(variant === "outlined"
              ? {
                  border: "1px solid var(--cn-color-border, #dde0e4)",
                  backgroundColor: "var(--cn-color-surface, #ffffff)",
                }
              : { backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)" }),
          }}
        >
          {icon && <SkBlock circle width={ICON} sx={{ mr: "10px" }} />}
          <Box sx={{ flex: 1, minWidth: 0, pt: "4px" }}>
            {title && (
              <SkText
                width={
                  typeof title === "string"
                    ? Math.min(Math.round(title.length * TITLE_FONT * 0.6), 480)
                    : "38%"
                }
                size={TITLE_FONT}
                sx={{ mb: messageLines ? "10px" : 0, maxWidth: "100%" }}
              />
            )}
            {messageLines > 0 && (
              <SkLines lines={messageLines} size={MESSAGE_FONT} gap={MESSAGE_LINE - 10} />
            )}
          </Box>
          {(action || closable) && (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: "4px", ml: "8px" }}>
              {action && <SkBlock width={64} height={26} radius="var(--cn-radius-md, 8px)" />}
              {closable && (
                <Box sx={{ p: "4px", mt: "2px", display: "flex" }}>
                  <SkBlock circle width={16} />
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </CnSkeletonGroup>
  );
};
