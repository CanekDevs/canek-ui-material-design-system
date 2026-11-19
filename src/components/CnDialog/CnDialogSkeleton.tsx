import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkLines, SkText } from "../CnSkeleton";

export type CnDialogSkeletonProps = CnSkeletonCommonProps & {
  /** Encabezado (título, subtítulo, ícono y cerrar). */
  header?: boolean;
  icon?: boolean;
  subtitle?: boolean;
  closeButton?: boolean;
  /** Párrafos de texto del cuerpo. */
  lines?: number;
  /** Campos de formulario en el cuerpo. */
  fields?: number;
  /** Pie con acciones. */
  footer?: boolean;
  actions?: number;
  /** Relleno lateral (igual que el panel). */
  padding?: number;
};

/**
 * Skeleton de `CnDialog` / `CnDrawer`: encabezado, cuerpo (texto o campos) y
 * pie con acciones, con las mismas medidas que el panel real.
 */
export const CnDialogSkeleton = ({
  header = true,
  icon = false,
  subtitle = true,
  closeButton = true,
  lines = 3,
  fields = 0,
  footer = true,
  actions = 2,
  padding = 24,
  animation,
  ariaLabel = "Cargando contenido",
  sx,
  className,
}: CnDialogSkeletonProps) => (
  <CnSkeletonGroup
    name="dialog"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      { display: "flex", flexDirection: "column", minWidth: 0, width: "100%" },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {header && (
      <Box
        data-cn-dialog-skeleton-header
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          px: `${padding}px`,
          pt: `${padding - 4}px`,
          pb: `${padding - 6}px`,
        }}
      >
        {icon && <SkBlock width={40} radius="var(--cn-radius-md, 8px)" />}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          <SkText width="55%" size={16} />
          {subtitle && <SkText width="35%" size={12} />}
        </Box>
        {closeButton && <SkBlock circle width={28} />}
      </Box>
    )}
    <Box
      data-cn-dialog-skeleton-body
      sx={{
        px: `${padding}px`,
        py: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        minWidth: 0,
      }}
    >
      {lines > 0 && <SkLines lines={lines} size={13} />}
      {Array.from({ length: fields }, (_, i) => (
        <CnFieldSkeleton key={i} />
      ))}
    </Box>
    {footer && actions > 0 && (
      <Box
        data-cn-dialog-skeleton-footer
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: "8px",
          px: `${padding}px`,
          py: "12px",
        }}
      >
        {Array.from({ length: actions }, (_, i) => (
          <SkBlock
            key={i}
            width={i === actions - 1 ? 104 : 88}
            height={36}
            radius="var(--cn-radius-md, 8px)"
          />
        ))}
      </Box>
    )}
  </CnSkeletonGroup>
);
