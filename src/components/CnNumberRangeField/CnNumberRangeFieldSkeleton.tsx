import Box from "@mui/material/Box";
import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnNumberFieldControls } from "../CnNumberField";
import { CnNumberFieldSkeleton } from "../CnNumberField/CnNumberFieldSkeleton";
import type { CnNumberRangeFieldProps } from "./CnNumberRangeField";

export type CnNumberRangeFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnNumberRangeFieldProps["size"]>;
  variant?: CnFieldSkeletonProps["variant"];
  /** Leyenda del grupo (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Etiquetas flotantes de cada campo ("Mínimo" / "Máximo"). */
  fieldLabels?: boolean;
  controls?: CnNumberFieldControls;
  prefix?: boolean | string;
  suffix?: boolean | string;
  /** Muestra los valores; `false` simula el rango vacío. */
  value?: boolean;
};

/** Skeleton de `CnNumberRangeField`: leyenda, dos campos numéricos y separador "–". */
export const CnNumberRangeFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  fieldLabels = true,
  controls = "none",
  prefix = false,
  suffix = false,
  value = true,
  animation,
  ariaLabel = "Cargando rango numérico",
  sx,
  className,
}: CnNumberRangeFieldSkeletonProps) => {
  const part = (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <CnNumberFieldSkeleton
        size={size}
        variant={variant}
        label={fieldLabels}
        controls={controls}
        prefix={prefix}
        suffix={suffix}
        value={value}
      />
    </Box>
  );
  return (
    <CnSkeletonGroup
      name="number-range-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {label && <SkText width={96} size={12} sx={{ mb: "10px" }} />}
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {part}
        <Box data-cn-skeleton-separator sx={{ display: "flex" }}>
          <SkBlock width={8} height={2} radius={1} />
        </Box>
        {part}
      </Box>
      {helperText && <SkText width="42%" size={11} sx={{ mt: "6px" }} />}
    </CnSkeletonGroup>
  );
};
