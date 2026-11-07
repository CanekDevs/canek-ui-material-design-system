import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLines, SkText } from "../CnSkeleton";
import type { CnConfirmDialogProps, CnConfirmVariant } from "./CnConfirmDialog";

type ConfirmMaxWidth = NonNullable<CnConfirmDialogProps["maxWidth"]>;

export type CnConfirmDialogSkeletonProps = CnSkeletonCommonProps & {
  /** Preset del diálogo: define si el botón de confirmar lleva ícono. */
  variant?: CnConfirmVariant;
  /** Ícono circular del encabezado (`false` para ocultarlo, como en el diálogo). */
  icon?: boolean | string;
  title?: boolean | string;
  /** Líneas del mensaje. */
  lines?: number;
  /** Bloque de detalles bajo el mensaje (alto en px o `true`). */
  details?: boolean | number;
  /** Campo "escribe X para confirmar". */
  requireText?: boolean | string;
  /** Ícono en el botón de confirmar (por defecto el del preset). */
  confirmIcon?: boolean | string;
  hideCancel?: boolean;
  /**
   * Superficie propia con borde y radio. Úsalo suelto; dentro de un diálogo
   * abierto (`Dialog` ya pinta el papel) déjalo en `false`.
   */
  surface?: boolean;
  /** Ancho como el diálogo (`xs` 444px, `sm` 600px, `md` 900px) cuando hay superficie. */
  maxWidth?: ConfirmMaxWidth;
};

const MAX_WIDTHS: Record<ConfirmMaxWidth, number> = { xs: 444, sm: 600, md: 900 };
const BUTTON_HEIGHT = 40;

/** Forma del botón de confirmar por preset (largo de la etiqueta e ícono), como `CN_CONFIRM_PRESETS`. */
const CONFIRM_SHAPE: Record<CnConfirmVariant, { label: number; icon: boolean }> = {
  delete: { label: 8, icon: true },
  danger: { label: 9, icon: false },
  warning: { label: 9, icon: false },
  info: { label: 7, icon: false },
  success: { label: 7, icon: false },
  update: { label: 7, icon: true },
  neutral: { label: 7, icon: false },
};

/**
 * Skeleton del cuerpo de `CnConfirmDialog` (ícono, título, mensaje, detalles y
 * botones). Se dibuja en línea, no como modal, para usarse dentro de un diálogo
 * abierto mientras cargan sus datos.
 */
export const CnConfirmDialogSkeleton = ({
  variant = "neutral",
  icon = true,
  title = true,
  lines = 2,
  details = false,
  requireText = false,
  confirmIcon,
  hideCancel = false,
  surface = false,
  maxWidth = "xs",
  animation,
  ariaLabel = "Cargando confirmación",
  sx,
  className,
}: CnConfirmDialogSkeletonProps) => {
  const shape = CONFIRM_SHAPE[variant];
  const hasConfirmIcon = confirmIcon ?? shape.icon;
  const confirmWidth = Math.max(84, Math.round(shape.label * 7.5) + 32) + (hasConfirmIcon ? 26 : 0);

  return (
    <CnSkeletonGroup
      name="confirm-dialog"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        { width: "100%" },
        surface && {
          maxWidth: MAX_WIDTHS[maxWidth],
          borderRadius: "var(--cn-radius-lg, 12px)",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          boxShadow: "var(--cn-shadow-lg, 0 10px 24px rgba(15, 23, 42, 0.10))",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          px: "24px",
          pt: "24px",
          pb: "20px",
        }}
      >
        <Box sx={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          {icon && <SkBlock circle width={40} />}
          <Box
            sx={{
              minWidth: 0,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              pt: "4px",
            }}
          >
            {title && <SkText width="62%" size={16} />}
            {lines > 0 && <SkLines lines={lines} size={13} gap={8} />}
          </Box>
        </Box>
        {details && (
          <Box data-cn-confirm-skeleton-details>
            <SkBlock
              height={typeof details === "number" ? details : 64}
              radius="var(--cn-radius-md, 8px)"
            />
          </Box>
        )}
        {requireText && (
          <Box
            data-cn-confirm-skeleton-require
            sx={{
              position: "relative",
              height: 40,
              display: "flex",
              alignItems: "center",
              px: "12px",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              borderRadius: "var(--cn-radius-md, 8px)",
            }}
          >
            <SkText width="52%" size={13} />
          </Box>
        )}
      </Box>
      <Box
        data-cn-confirm-skeleton-actions
        sx={{ display: "flex", justifyContent: "flex-end", gap: "8px", px: "24px", pb: "20px" }}
      >
        {!hideCancel && (
          <Box
            sx={{
              height: BUTTON_HEIGHT,
              width: 96,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              borderRadius: "var(--cn-radius-md, 8px)",
            }}
          >
            <SkText width={56} size={13} />
          </Box>
        )}
        <Box
          data-cn-confirm-skeleton-confirm={hasConfirmIcon ? "icon" : "text"}
          sx={{ display: "flex" }}
        >
          <SkBlock width={confirmWidth} height={BUTTON_HEIGHT} radius="var(--cn-radius-md, 8px)" />
        </Box>
      </Box>
    </CnSkeletonGroup>
  );
};
