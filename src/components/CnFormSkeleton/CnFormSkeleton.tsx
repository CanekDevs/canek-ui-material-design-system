import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import type { SxProps, Theme } from "@mui/material/styles";
import { mergeSx } from "../../utils/field-styles";
import { CnSkeleton } from "../CnSkeleton";

export type CnFormSkeletonProps = {
  /** Filas de campos. */
  rows?: number;
  columns?: number;
  /** Incluye un bloque de título y descripción. */
  showHeader?: boolean;
  /** Incluye la barra de botones. */
  showActions?: boolean;
  /** Último campo como área de texto alta. */
  withTextarea?: boolean;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
};

/** Esqueleto de carga para formularios (mismas medidas que los campos reales). */
export const CnFormSkeleton = ({
  rows = 4,
  columns = 1,
  showHeader = false,
  showActions = false,
  withTextarea = false,
  ariaLabel = "Cargando formulario",
  sx,
}: CnFormSkeletonProps) => {
  const cols = Math.max(1, Math.min(4, columns));
  const count = rows * cols;
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      data-cn-form-skeleton
      sx={mergeSx({ display: "flex", flexDirection: "column", gap: "16px" }, sx)}
    >
      {showHeader && (
        <Box>
          <CnSkeleton variant="text" width="40%" height={20} />
          <CnSkeleton variant="text" width="65%" height={12} sx={{ mt: "6px" }} />
        </Box>
      )}
      <Grid container spacing={2}>
        {Array.from({ length: count }, (_, index) => (
          <Grid key={index} size={{ xs: 12, md: 12 / cols }}>
            <CnSkeleton variant="text" width="35%" height={12} sx={{ mb: "6px" }} />
            <CnSkeleton variant="rounded" height={40} />
          </Grid>
        ))}
        {withTextarea && (
          <Grid size={12}>
            <CnSkeleton variant="text" width="25%" height={12} sx={{ mb: "6px" }} />
            <CnSkeleton variant="rounded" height={96} />
          </Grid>
        )}
      </Grid>
      {showActions && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <CnSkeleton variant="rounded" width={96} height={36} />
          <CnSkeleton variant="rounded" width={112} height={36} />
        </Box>
      )}
    </Box>
  );
};
