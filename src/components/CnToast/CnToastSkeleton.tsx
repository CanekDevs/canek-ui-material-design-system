import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnToastSeverity } from "./CnToast";

export type CnToastSkeletonProps = CnSkeletonCommonProps & {
  /** Define la distribución por defecto: título (éxito/error/atención), cierre (no en carga). */
  severity?: CnToastSeverity;
  /** Título (por defecto según la severidad, como el aviso real). */
  title?: boolean | string;
  /** Líneas del mensaje. */
  lines?: number;
  /** Lista de detalles (errores por campo). */
  details?: number;
  /** Botón de acción ("Deshacer"). */
  action?: boolean | string;
  /** Botón de cierre (por defecto oculto en `loading`). */
  closable?: boolean;
  width?: number | string;
};

const WITH_TITLE: Record<CnToastSeverity, boolean> = {
  success: true,
  error: true,
  warning: true,
  info: false,
  loading: false,
};

/** Skeleton de un aviso de `CnToastProvider`, usable suelto (listas, previsualizaciones, cargas). */
export const CnToastSkeleton = ({
  severity = "info",
  title,
  lines = 1,
  details = 0,
  action = false,
  closable,
  width,
  animation,
  ariaLabel = "Cargando aviso",
  sx,
  className,
}: CnToastSkeletonProps) => {
  const hasTitle = title ?? WITH_TITLE[severity];
  const hasClose = (closable ?? true) && severity !== "loading";

  return (
    <CnSkeletonGroup
      name="toast"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
          width: width ?? "min(380px, calc(100vw - 32px))",
          padding: "12px 12px 12px 14px",
          borderRadius: "var(--cn-radius-md, 8px)",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderLeft: "4px solid var(--cn-color-border-strong, #c5cad0)",
          boxShadow: "0 8px 24px rgba(17, 20, 24, 0.14)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <SkBlock circle width={28} />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          pt: "3px",
        }}
      >
        {hasTitle && <SkText width="38%" size={13} />}
        {Array.from({ length: lines }, (_, i) => (
          <SkText
            key={i}
            width={i === lines - 1 ? (lines > 1 ? "64%" : "82%") : "100%"}
            size={12}
          />
        ))}
        {details > 0 && (
          <Box
            data-cn-toast-skeleton-details
            sx={{ display: "flex", flexDirection: "column", gap: "5px", mt: "2px", pl: "16px" }}
          >
            {Array.from({ length: details }, (_, i) => (
              <SkText key={i} width={`${55 + ((i * 29) % 35)}%`} size={11} />
            ))}
          </Box>
        )}
        {action && (
          <Box
            data-cn-toast-skeleton-action
            sx={{
              mt: "4px",
              height: 32,
              width: 92,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              borderRadius: "var(--cn-radius-md, 8px)",
            }}
          >
            <SkText width={52} size={12} />
          </Box>
        )}
      </Box>
      {hasClose && (
        <Box data-cn-toast-skeleton-close sx={{ display: "flex", p: "4px", mt: "-2px" }}>
          <SkBlock width={16} radius={4} />
        </Box>
      )}
    </CnSkeletonGroup>
  );
};
