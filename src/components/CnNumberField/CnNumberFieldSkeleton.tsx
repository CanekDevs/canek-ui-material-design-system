import Box from "@mui/material/Box";
import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkText, useSkeletonGroup } from "../CnSkeleton";
import type { CnNumberFieldControls, CnNumberFieldProps } from "./CnNumberField";

type FieldSize = NonNullable<CnNumberFieldProps["size"]>;

const FONT_SIZE: Record<FieldSize, number> = { sm: 12, md: 13, lg: 15 };
const HEIGHT: Record<FieldSize, number> = { sm: 32, md: 40, lg: 48 };

export type CnNumberFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: FieldSize;
  variant?: CnFieldSkeletonProps["variant"];
  /** Etiqueta flotante (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Estilo de los controles: flechas apiladas, − valor +, − + al final o ninguno. */
  controls?: CnNumberFieldControls;
  /** Prefijo / sufijo de texto (`$`, `kg`…). */
  prefix?: boolean | string;
  suffix?: boolean | string;
  /** Prefijo más ancho (p. ej. selector de moneda "$ MXN"). */
  prefixWidth?: number;
  clearable?: CnNumberFieldProps["clearable"];
  textAlign?: CnNumberFieldProps["textAlign"];
  /** Muestra el valor; `false` simula el campo vacío. */
  value?: boolean;
  fullWidth?: boolean;
  width?: number | string;
};

/** Skeleton de `CnNumberField` con sus cuatro estilos de controles. */
export const CnNumberFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  controls = "stacked",
  prefix = false,
  suffix = false,
  prefixWidth,
  clearable = false,
  textAlign,
  value = true,
  fullWidth = true,
  width,
  animation,
  ariaLabel = "Cargando campo numérico",
  sx,
  className,
}: CnNumberFieldSkeletonProps) => {
  const group = useSkeletonGroup();
  const fontSize = FONT_SIZE[size];
  const split = Math.min(30, HEIGHT[size] - 8);
  const align = textAlign ?? (controls === "split" ? "center" : "left");
  const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

  const field = (
    <CnFieldSkeleton
      size={size}
      variant={variant}
      label={Boolean(label)}
      helperText={Boolean(helperText)}
      fullWidth={fullWidth}
      width={width}
      endAdornment={controls === "stacked" ? "stepper" : false}
    >
      <Box
        data-cn-skeleton-controls={controls}
        sx={{ width: "100%", minWidth: 0, display: "flex", alignItems: "center", gap: "8px" }}
      >
        {controls === "split" && <SkBlock width={split} height={split} radius={6} />}
        {prefix && <SkBlock width={prefixWidth ?? 14} height={fontSize} radius={3} />}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", justifyContent: justify }}>
          {value && <SkText width={controls === "split" ? "40%" : "32%"} size={fontSize} />}
        </Box>
        {suffix && <SkBlock width={20} height={fontSize} radius={3} />}
        {clearable && value && <SkBlock circle width={16} />}
        {controls === "inline" && (
          <Box sx={{ display: "flex", gap: "6px" }}>
            <SkBlock circle width={20} />
            <SkBlock circle width={20} />
          </Box>
        )}
        {controls === "split" && <SkBlock width={split} height={split} radius={6} />}
      </Box>
    </CnFieldSkeleton>
  );

  // Dentro de otro skeleton (rango, moneda) se integra como pieza.
  if (group) return field;
  return (
    <CnSkeletonGroup
      name="number-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {field}
    </CnSkeletonGroup>
  );
};
