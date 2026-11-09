import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLabeled } from "../CnSkeleton";
import type { CnWeekdaysFieldProps } from "./CnWeekdaysField";

export type CnWeekdaysFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnWeekdaysFieldProps["size"]>;
  label?: boolean | string;
  helperText?: boolean | string;
  /** Número de atajos bajo los días (0 = sin atajos). */
  presets?: number;
  dayFormat?: CnWeekdaysFieldProps["dayFormat"];
};

const DIM = { sm: 32, md: 38, lg: 46 } as const;

/** Skeleton de `CnWeekdaysField`: siete botones de día y los atajos. */
export const CnWeekdaysFieldSkeleton = ({
  size = "md",
  label = true,
  helperText = false,
  presets = 3,
  dayFormat = "initial",
  animation,
  ariaLabel = "Cargando días de la semana",
  sx,
  className,
}: CnWeekdaysFieldSkeletonProps) => {
  const dim = DIM[size];
  return (
    <CnSkeletonGroup
      name="weekdays-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {Array.from({ length: 7 }, (_, i) => (
            <Box key={i} data-cn-skeleton-day sx={{ display: "flex" }}>
              {dayFormat === "initial" ? (
                <SkBlock circle width={dim} />
              ) : (
                <SkBlock width={dayFormat === "short" ? 52 : 84} height={dim} radius={999} />
              )}
            </Box>
          ))}
        </Box>
        {presets > 0 && (
          <Box sx={{ display: "flex", gap: "6px", mt: "8px" }}>
            {Array.from({ length: presets }, (_, i) => (
              <Box key={i} data-cn-skeleton-preset sx={{ display: "flex" }}>
                <SkBlock width={64 + ((i * 23) % 30)} height={24} radius={999} />
              </Box>
            ))}
          </Box>
        )}
      </SkLabeled>
    </CnSkeletonGroup>
  );
};
