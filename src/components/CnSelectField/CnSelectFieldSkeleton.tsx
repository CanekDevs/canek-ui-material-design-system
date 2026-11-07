import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnSelectFieldProps } from "./CnSelectField";

type FieldSize = NonNullable<CnSelectFieldProps["size"]>;

const FONT_SIZE: Record<FieldSize, number> = { sm: 12, md: 13, lg: 15 };

/** Ancho de chip variable (px) para que la fila no se vea uniforme. */
const chipWidth = (index: number) => 52 + ((index * 23) % 34);

/**
 * Fila de chips de selección múltiple (alto 22 px como los chips reales).
 * `limit` muestra solo los primeros y un chip corto "+N" con el resto.
 */
export const SkChipRow = ({
  count,
  limit,
  height = 22,
  media = false,
}: {
  count: number;
  limit?: number;
  height?: number;
  /** Chip con avatar (bandera, imagen…). */
  media?: boolean;
}) => {
  const visible = limit !== undefined ? Math.min(count, limit) : count;
  const rest = count - visible;
  return (
    <Box
      data-cn-skeleton-chips
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px", py: "4px" }}
    >
      {Array.from({ length: visible }, (_, i) => (
        <Box key={i} sx={{ position: "relative", display: "inline-flex" }}>
          <SkBlock width={chipWidth(i)} height={height} radius={height / 2} />
          {media && (
            <Box
              sx={{
                position: "absolute",
                left: 4,
                top: (height - 16) / 2,
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: "var(--cn-color-surface, #ffffff)",
                opacity: 0.6,
              }}
            />
          )}
        </Box>
      ))}
      {rest > 0 && <SkBlock width={28} height={height} radius={height / 2} />}
    </Box>
  );
};

/** Contenido + botón de limpiar al final (antes del adorno del campo). */
export const SkFieldContent = ({ children, clear }: { children: ReactNode; clear?: boolean }) => (
  <Box sx={{ width: "100%", minWidth: 0, display: "flex", alignItems: "center", gap: "6px" }}>
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {children}
    </Box>
    {clear && <SkBlock circle width={16} />}
  </Box>
);

/** Valor simple (con media opcional al inicio) en el tamaño de letra del campo. */
export const SkFieldValue = ({
  size,
  width = "46%",
  media = false,
}: {
  size: FieldSize;
  width?: number | string;
  media?: boolean;
}) => (
  <>
    {media && <SkBlock circle width={20} />}
    <SkText width={width} size={FONT_SIZE[size]} />
  </>
);

export type CnSelectFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: FieldSize;
  variant?: CnFieldSkeletonProps["variant"];
  /** Etiqueta flotante (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  multiple?: CnSelectFieldProps["multiple"];
  /** Selección múltiple como chips. */
  chips?: CnSelectFieldProps["chips"];
  /** Elementos seleccionados que se simulan con `multiple`. Por defecto 2. */
  selectedCount?: number;
  clearable?: CnSelectFieldProps["clearable"];
  /** Adorno al inicio (`true` o cualquier contenido). */
  startAdornment?: boolean | ReactNode;
  /** El valor lleva imagen, bandera o ícono (opciones con media). */
  optionMedia?: boolean;
  /** Muestra el valor; `false` simula el campo vacío (placeholder). */
  value?: boolean;
  fullWidth?: boolean;
  width?: number | string;
};

/** Skeleton de `CnSelectField`: valor o chips, chevron, limpiar y adornos. */
export const CnSelectFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  multiple = false,
  chips = false,
  selectedCount = 2,
  clearable = false,
  startAdornment = false,
  optionMedia = false,
  value = true,
  fullWidth = true,
  width,
  animation,
  ariaLabel = "Cargando selector",
  sx,
  className,
}: CnSelectFieldSkeletonProps) => {
  const count = Math.max(0, selectedCount);
  const hasValue = value && (!multiple || count > 0);

  let content: ReactNode = <SkFieldValue size={size} width="30%" />;
  if (hasValue) {
    if (multiple && chips) content = <SkChipRow count={count} media={optionMedia} />;
    else if (multiple)
      content = <SkFieldValue size={size} width={`${Math.min(80, 26 + count * 14)}%`} />;
    else content = <SkFieldValue size={size} media={optionMedia} />;
  }

  return (
    <CnSkeletonGroup
      name="select-field"
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
        startAdornment={startAdornment ? "icon" : false}
        endAdornment="chevron"
      >
        <SkFieldContent clear={clearable && hasValue}>{content}</SkFieldContent>
      </CnFieldSkeleton>
    </CnSkeletonGroup>
  );
};
