import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkLabeled } from "../CnSkeleton";
import type { CnDurationFieldProps } from "./CnDurationField";

export type CnDurationFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnDurationFieldProps["size"]>;
  label?: boolean | string;
  helperText?: boolean | string;
  /** Número de unidades (campos) visibles. Por defecto 2. */
  units?: number;
  /** Número de atajos (chips); 0 = sin atajos. */
  presets?: number;
};

/** Skeleton de `CnDurationField`: un campo por unidad y chips de atajos. */
export const CnDurationFieldSkeleton = ({
  size = "md",
  label = true,
  helperText = false,
  units = 2,
  presets = 5,
  animation,
  ariaLabel = "Cargando duración",
  sx,
  className,
}: CnDurationFieldSkeletonProps) => (
  <CnSkeletonGroup
    name="duration-field"
    animation={animation}
    ariaLabel={ariaLabel}
    sx={sx}
    className={className}
  >
    <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
      <Box sx={{ display: "flex", gap: "8px" }}>
        {Array.from({ length: Math.max(1, units) }, (_, i) => (
          <Box key={i} data-cn-skeleton-unit sx={{ flex: 1, minWidth: 0 }}>
            <CnFieldSkeleton size={size} endAdornment="text" />
          </Box>
        ))}
      </Box>
      {presets > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px", mt: "8px" }}>
          {Array.from({ length: presets }, (_, i) => (
            <Box key={i} data-cn-skeleton-preset sx={{ display: "flex" }}>
              <SkBlock width={44 + ((i * 17) % 20)} height={24} radius={999} />
            </Box>
          ))}
        </Box>
      )}
    </SkLabeled>
  </CnSkeletonGroup>
);
