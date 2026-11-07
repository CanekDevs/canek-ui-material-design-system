import Box from "@mui/material/Box";
import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnPhoneFieldProps } from "./CnPhoneField";

type FieldSize = NonNullable<CnPhoneFieldProps["size"]>;

const FONT_SIZE: Record<FieldSize, number> = { sm: 12, md: 13, lg: 15 };

export type CnPhoneFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: FieldSize;
  variant?: CnFieldSkeletonProps["variant"];
  /** Etiqueta flotante (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  /**
   * Selector de país al inicio (bandera, "MX +52" y flecha). Con `false` queda
   * la bandera y la lada fija.
   */
  showCountrySelect?: CnPhoneFieldProps["showCountrySelect"];
  /** Muestra el número; `false` simula el campo vacío. */
  value?: boolean;
  fullWidth?: boolean;
  width?: number | string;
};

/** Skeleton de `CnPhoneField`: selector de país (bandera + lada) y número. */
export const CnPhoneFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  showCountrySelect = true,
  value = true,
  fullWidth = true,
  width,
  animation,
  ariaLabel = "Cargando teléfono",
  sx,
  className,
}: CnPhoneFieldSkeletonProps) => {
  const fontSize = FONT_SIZE[size];
  return (
    <CnSkeletonGroup
      name="phone-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <CnFieldSkeleton
        size={size}
        variant={variant}
        label={Boolean(label)}
        helperText={Boolean(helperText)}
        fullWidth={fullWidth}
        width={width}
        startAdornment="flag"
      >
        <Box sx={{ width: "100%", minWidth: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <Box
            data-cn-skeleton-country={showCountrySelect ? "select" : "fixed"}
            sx={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <SkBlock width={showCountrySelect ? 44 : 26} height={fontSize - 1} radius={3} />
            {showCountrySelect && <SkBlock width={8} height={5} radius={2} />}
          </Box>
          {value && <SkText width="44%" size={fontSize} />}
        </Box>
      </CnFieldSkeleton>
    </CnSkeletonGroup>
  );
};
