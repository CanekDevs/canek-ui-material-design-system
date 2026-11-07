import Box from "@mui/material/Box";
import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import { dateValueWidth } from "./CnDateFieldSkeleton";
import type { CnDateRangeFieldProps } from "./CnDateRangeField";

type FieldSize = NonNullable<CnDateRangeFieldProps["size"]>;

const FONT_SIZE: Record<FieldSize, number> = { sm: 12, md: 13, lg: 15 };

export type CnDateRangeFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: FieldSize;
  variant?: CnFieldSkeletonProps["variant"];
  /** Leyenda del grupo (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Etiquetas flotantes de cada campo ("Desde" / "Hasta"). */
  fieldLabels?: boolean;
  /** Muestra las fechas; `false` simula el rango vacío. */
  value?: boolean;
};

/** Skeleton de `CnDateRangeField`: leyenda, "desde – hasta" y botón de calendario. */
export const CnDateRangeFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  fieldLabels = true,
  value = true,
  animation,
  ariaLabel = "Cargando rango de fechas",
  sx,
  className,
}: CnDateRangeFieldSkeletonProps) => {
  const part = (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <CnFieldSkeleton size={size} variant={variant} label={fieldLabels} value={value}>
        {value ? <SkText width={dateValueWidth("date", size)} size={FONT_SIZE[size]} /> : undefined}
      </CnFieldSkeleton>
    </Box>
  );
  return (
    <CnSkeletonGroup
      name="date-range-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {label && <SkText width={110} size={12} sx={{ mb: "10px" }} />}
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {part}
        <Box data-cn-skeleton-separator sx={{ display: "flex" }}>
          <SkBlock width={8} height={2} radius={1} />
        </Box>
        {part}
        <Box sx={{ display: "flex", p: "8px" }}>
          <SkBlock circle width={20} />
        </Box>
      </Box>
      {helperText && <SkText width="42%" size={11} sx={{ mt: "6px" }} />}
    </CnSkeletonGroup>
  );
};
