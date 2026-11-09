import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkLabeled } from "../CnSkeleton";
import type { CnLocationFieldProps } from "./CnLocationField";

export type CnLocationFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnLocationFieldProps["size"]>;
  label?: boolean | string;
  helperText?: boolean | string;
  showMap?: boolean;
  mapHeight?: number;
  showAddress?: boolean;
  /** Botón "Usar mi ubicación". */
  geolocation?: boolean;
};

/** Skeleton de `CnLocationField`: latitud, longitud, botón y mapa. */
export const CnLocationFieldSkeleton = ({
  size = "md",
  label = true,
  helperText = false,
  showMap = true,
  mapHeight = 220,
  showAddress = false,
  geolocation = true,
  animation,
  ariaLabel = "Cargando ubicación",
  sx,
  className,
}: CnLocationFieldSkeletonProps) => (
  <CnSkeletonGroup
    name="location-field"
    animation={animation}
    ariaLabel={ariaLabel}
    sx={sx}
    className={className}
  >
    <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CnFieldSkeleton size={size} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CnFieldSkeleton size={size} />
        </Box>
        {geolocation && (
          <Box data-cn-skeleton-geolocation sx={{ display: "flex" }}>
            <SkBlock width={150} height={size === "lg" ? 36 : 30} radius={8} />
          </Box>
        )}
      </Box>
      {showAddress && (
        <Box data-cn-skeleton-address sx={{ mt: "10px" }}>
          <CnFieldSkeleton size={size} />
        </Box>
      )}
      {showMap && (
        <Box data-cn-skeleton-map sx={{ mt: "10px" }}>
          <SkBlock width="100%" height={mapHeight} radius={8} />
        </Box>
      )}
    </SkLabeled>
  </CnSkeletonGroup>
);
