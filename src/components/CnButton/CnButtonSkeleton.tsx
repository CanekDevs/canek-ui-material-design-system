import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnButtonShape, CnButtonSize, CnButtonVariant } from "./CnButton";

export type CnButtonSkeletonProps = CnSkeletonCommonProps & {
  variant?: CnButtonVariant;
  size?: CnButtonSize;
  shape?: CnButtonShape;
  /** Botón cuadrado solo con ícono (círculo si `shape="pill"`). */
  iconOnly?: boolean;
  /** Texto del botón: con un string, el ancho sigue su longitud. */
  label?: boolean | string;
  startIcon?: boolean | string;
  endIcon?: boolean | string;
  fullWidth?: boolean;
  /** Ancho fijo (ignora el cálculo por etiqueta). */
  width?: number | string;
};

/** Medidas reales de `CnButton` por tamaño. */
const SIZES: Record<
  CnButtonSize,
  { height: number; paddingX: number; font: number; icon: number }
> = {
  small: { height: 32, paddingX: 12, font: 12, icon: 16 },
  medium: { height: 40, paddingX: 16, font: 13, icon: 18 },
  large: { height: 48, paddingX: 20, font: 14, icon: 20 },
};

const RADIUS: Record<CnButtonShape, string> = {
  rounded: "var(--cn-radius-md, 8px)",
  pill: "var(--cn-radius-full, 9999px)",
  square: "0",
};

const GAP = 8;

/** Skeleton de `CnButton` con las mismas variantes, tamaños y formas. */
export const CnButtonSkeleton = ({
  variant = "contained",
  size = "medium",
  shape = "rounded",
  iconOnly = false,
  label = true,
  startIcon = false,
  endIcon = false,
  fullWidth = false,
  width,
  animation,
  ariaLabel = "Cargando botón",
  sx,
  className,
}: CnButtonSkeletonProps) => {
  const t = SIZES[size];
  const radius = iconOnly && shape === "pill" ? "50%" : RADIUS[shape];
  const hasLabel = !iconOnly && Boolean(label);
  const labelWidth = hasLabel
    ? typeof label === "string"
      ? Math.max(20, Math.round(label.length * t.font * 0.58))
      : Math.round(t.font * 5)
    : 0;
  const icons = iconOnly ? 0 : Number(Boolean(startIcon)) + Number(Boolean(endIcon));
  const pieces = (hasLabel ? 1 : 0) + icons;
  const naturalWidth = iconOnly
    ? t.height
    : t.paddingX * 2 + labelWidth + icons * t.icon + Math.max(0, pieces - 1) * GAP;
  const resolvedWidth = iconOnly ? t.height : (width ?? (fullWidth ? "100%" : naturalWidth));

  const body =
    variant === "contained" ? (
      // Relleno sólido: el botón entero es la pieza.
      <SkBlock width={resolvedWidth} height={t.height} radius={radius} />
    ) : (
      <Box
        sx={{
          width: resolvedWidth,
          height: t.height,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: `${GAP}px`,
          px: iconOnly ? 0 : `${t.paddingX}px`,
          borderRadius: radius,
          ...(variant === "outlined" && {
            border: "1px solid var(--cn-color-border, #dde0e4)",
          }),
        }}
      >
        {iconOnly ? (
          <SkBlock circle width={t.icon} />
        ) : (
          <>
            {startIcon && <SkBlock circle width={t.icon} />}
            {hasLabel && <SkText width={labelWidth} size={t.font} />}
            {endIcon && <SkBlock circle width={t.icon} />}
          </>
        )}
      </Box>
    );

  return (
    <CnSkeletonGroup
      name="button"
      inline
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        fullWidth && !iconOnly ? { display: "flex", width: "100%" } : {},
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {body}
    </CnSkeletonGroup>
  );
};
