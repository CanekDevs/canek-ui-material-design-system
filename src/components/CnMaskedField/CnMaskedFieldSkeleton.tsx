import Box from "@mui/material/Box";
import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock } from "../CnSkeleton";
import { MASK_PRESETS } from "../../utils/mask-utils";
import type { CnMaskedFieldProps } from "./CnMaskedField";

type FieldSize = NonNullable<CnMaskedFieldProps["size"]>;

const FONT_SIZE: Record<FieldSize, number> = { sm: 12, md: 13, lg: 15 };

/** Longitud de cada bloque de caracteres capturables de la máscara (`## #### ####` → [2, 4, 4]). */
const maskGroups = (mask: string): number[] =>
  mask
    .split(/[^#A*]+/)
    .map((group) => group.length)
    .filter((length) => length > 0);

export type CnMaskedFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: FieldSize;
  variant?: CnFieldSkeletonProps["variant"];
  /** Etiqueta flotante (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Máscara o preset: el valor se dibuja en bloques con su longitud real. */
  mask?: CnMaskedFieldProps["mask"];
  preset?: CnMaskedFieldProps["preset"];
  /** Ícono al inicio (tarjeta de crédito lo trae por defecto). */
  startIcon?: boolean | string;
  /** Insignia de la marca detectada (solo tarjeta de crédito). */
  showCardBrand?: CnMaskedFieldProps["showCardBrand"];
  /** Muestra el valor; `false` simula el campo vacío. */
  value?: boolean;
  fullWidth?: boolean;
  width?: number | string;
};

/** Skeleton de `CnMaskedField`: el valor sigue los bloques de la máscara. */
export const CnMaskedFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  mask,
  preset,
  startIcon,
  showCardBrand = true,
  value = true,
  fullWidth = true,
  width,
  animation,
  ariaLabel = "Cargando campo",
  sx,
  className,
}: CnMaskedFieldSkeletonProps) => {
  const resolved = mask ?? (preset ? MASK_PRESETS[preset].mask : "");
  const groups = maskGroups(resolved);
  const fontSize = FONT_SIZE[size];
  const charWidth = Math.round(fontSize * 0.62);
  const isCard = preset === "creditCard";
  const hasStartIcon = Boolean(startIcon) || (startIcon === undefined && isCard);

  return (
    <CnSkeletonGroup
      name="masked-field"
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
        startAdornment={hasStartIcon ? "icon" : false}
        value={value}
      >
        {value && groups.length > 0 ? (
          <Box
            data-cn-skeleton-mask
            sx={{ width: "100%", minWidth: 0, display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: `${charWidth}px`,
                overflow: "hidden",
              }}
            >
              {groups.map((length, i) => (
                <SkBlock
                  key={i}
                  width={length * charWidth}
                  height={Math.max(6, Math.round(fontSize * 0.8))}
                  radius={3}
                  sx={{ flexShrink: 0 }}
                />
              ))}
            </Box>
            {isCard && showCardBrand && <SkBlock width={34} height={16} radius={4} />}
          </Box>
        ) : undefined}
      </CnFieldSkeleton>
    </CnSkeletonGroup>
  );
};
