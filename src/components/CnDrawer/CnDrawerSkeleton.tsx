import type { CnDialogSkeletonProps } from "../CnDialog/CnDialogSkeleton";
import { CnDialogSkeleton } from "../CnDialog/CnDialogSkeleton";

export type CnDrawerSkeletonProps = CnDialogSkeletonProps;

/**
 * Skeleton de `CnDrawer`: mismo encabezado/cuerpo/pie que el diálogo, ocupando
 * todo el alto del panel (el pie queda abajo).
 */
export const CnDrawerSkeleton = ({
  padding = 20,
  lines = 4,
  fields = 2,
  ariaLabel = "Cargando panel",
  sx,
  ...rest
}: CnDrawerSkeletonProps) => (
  <CnDialogSkeleton
    padding={padding}
    lines={lines}
    fields={fields}
    ariaLabel={ariaLabel}
    sx={[
      {
        height: "100%",
        "& [data-cn-dialog-skeleton-body]": { flex: 1 },
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...rest}
  />
);
