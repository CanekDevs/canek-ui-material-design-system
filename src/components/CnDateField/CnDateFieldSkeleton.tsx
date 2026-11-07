import Box from "@mui/material/Box";
import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnDateFieldProps, CnDateFieldType } from "./CnDateField";

type FieldSize = NonNullable<CnDateFieldProps["size"]>;

const FONT_SIZE: Record<FieldSize, number> = { sm: 12, md: 13, lg: 15 };

/** Caracteres visibles por tipo (`DD/MM/YYYY`, `HH:mm`, `DD/MM/YYYY HH:mm`…). */
const VALUE_CHARS: Record<CnDateFieldType, number> = {
  date: 10,
  time: 5,
  datetime: 16,
  month: 7,
  year: 4,
};

/** Ancho aproximado del valor de fecha/hora en px. */
export const dateValueWidth = (type: CnDateFieldType, size: FieldSize, ampm = false) =>
  Math.round(
    (VALUE_CHARS[type] + (ampm && (type === "time" || type === "datetime") ? 3 : 0)) *
      FONT_SIZE[size] *
      0.6,
  );

export type CnDateFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: FieldSize;
  variant?: CnFieldSkeletonProps["variant"];
  /** Etiqueta (siempre flotante, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Fecha, hora, fecha y hora, mes o año: cambia el largo del valor. */
  type?: CnDateFieldType;
  /** Reloj de 12 horas (agrega "a. m."). */
  ampm?: CnDateFieldProps["ampm"];
  clearable?: CnDateFieldProps["clearable"];
  /** Muestra el valor; `false` simula el campo vacío (máscara). */
  value?: boolean;
  fullWidth?: boolean;
  width?: number | string;
};

/** Skeleton de `CnDateField`: valor con el largo del tipo e ícono de calendario/reloj. */
export const CnDateFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  type = "date",
  ampm = false,
  clearable = false,
  value = true,
  fullWidth = true,
  width,
  animation,
  ariaLabel = "Cargando fecha",
  sx,
  className,
}: CnDateFieldSkeletonProps) => (
  <CnSkeletonGroup
    name="date-field"
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
      endAdornment="icon"
    >
      <Box
        data-cn-skeleton-date={type}
        sx={{ width: "100%", minWidth: 0, display: "flex", alignItems: "center", gap: "8px" }}
      >
        <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
          {value && <SkText width={dateValueWidth(type, size, ampm)} size={FONT_SIZE[size]} />}
        </Box>
        {clearable && value && <SkBlock circle width={16} />}
      </Box>
    </CnFieldSkeleton>
  </CnSkeletonGroup>
);
