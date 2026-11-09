import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkLabeled } from "../CnSkeleton";
import type { CnTimeRangeFieldProps } from "./CnTimeRangeField";

export type CnTimeRangeFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnTimeRangeFieldProps["size"]>;
  label?: boolean | string;
  helperText?: boolean | string;
  /** Píldora con la duración calculada. */
  showDuration?: boolean;
};

/** Skeleton de `CnTimeRangeField`: dos campos de hora, separador y duración. */
export const CnTimeRangeFieldSkeleton = ({
  size = "md",
  label = true,
  helperText = false,
  showDuration = true,
  animation,
  ariaLabel = "Cargando rango de horas",
  sx,
  className,
}: CnTimeRangeFieldSkeletonProps) => {
  const part = (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <CnFieldSkeleton size={size} endAdornment="icon" />
    </Box>
  );
  return (
    <CnSkeletonGroup
      name="time-range-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {part}
          <SkBlock width={8} height={2} radius={1} />
          {part}
          {showDuration && (
            <Box data-cn-skeleton-duration sx={{ display: "flex" }}>
              <SkBlock width={72} height={24} radius={999} />
            </Box>
          )}
        </Box>
      </SkLabeled>
    </CnSkeletonGroup>
  );
};
