import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useContext } from "react";
import type { CnFieldSize } from "../../utils/field-styles";
import { FIELD_SIZE_TOKENS } from "../../utils/field-styles";
import type { CnSkeletonAnimation } from "./CnSkeleton";
import { CnSkeleton, CnSkeletonPartContext } from "./CnSkeleton";

/*
 * Kit para construir los skeletons de cada componente:
 * - `CnSkeletonGroup`: raíz accesible (un solo `role="status"`) que comparte la
 *   animación con todas las piezas internas (que quedan como decorativas).
 * - `CnFieldSkeleton`: campo con borde, etiqueta flotante, valor, adornos y
 *   ayuda, con las mismas medidas que los campos reales.
 * - Utilidades pequeñas: líneas de texto, círculos, filas.
 */

/** Grupo más cercano (o `null` fuera de un grupo). */
export const useSkeletonGroup = () => useContext(CnSkeletonPartContext);

/** Props comunes de todos los skeletons de componentes. */
export type CnSkeletonCommonProps = {
  animation?: CnSkeletonAnimation;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

export type CnSkeletonGroupProps = CnSkeletonCommonProps & {
  /** Nombre del componente (queda en `data-cn-skeleton`). */
  name: string;
  children: ReactNode;
  /** `inline-flex` en lugar de bloque (botones, chips, insignias…). */
  inline?: boolean;
};

/** Raíz accesible de un skeleton compuesto. */
export const CnSkeletonGroup = ({
  name,
  children,
  inline = false,
  animation = "wave",
  ariaLabel = "Cargando",
  sx,
  className,
}: CnSkeletonGroupProps) => (
  <CnSkeletonPartContext.Provider value={{ animation }}>
    <Box
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      data-cn-skeleton={name}
      className={className}
      sx={[
        inline ? { display: "inline-flex", verticalAlign: "middle" } : { display: "block" },
        { boxSizing: "border-box", maxWidth: "100%" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  </CnSkeletonPartContext.Provider>
);

/** Bloque rectangular dentro de un grupo. */
export const SkBlock = ({
  width,
  height,
  radius,
  circle = false,
  sx,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  circle?: boolean;
  sx?: SxProps<Theme>;
}) => (
  <CnSkeleton
    variant={circle ? "circular" : "rounded"}
    width={width}
    height={height ?? width}
    radius={radius}
    sx={sx}
  />
);

/** Línea de texto (alto según tamaño de fuente aproximado). */
export const SkText = ({
  width = "100%",
  size = 12,
  sx,
}: {
  width?: number | string;
  /** Tamaño de fuente que representa (px). */
  size?: number;
  sx?: SxProps<Theme>;
}) => (
  <CnSkeleton variant="text" width={width} height={Math.max(6, Math.round(size * 0.8))} sx={sx} />
);

/** Párrafo de varias líneas (la última más corta). */
export const SkLines = ({
  lines = 3,
  size = 12,
  gap = 7,
  lastWidth = "62%",
}: {
  lines?: number;
  size?: number;
  gap?: number;
  lastWidth?: string;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: `${gap}px` }}>
    {Array.from({ length: lines }, (_, i) => (
      <SkText key={i} size={size} width={i === lines - 1 && lines > 1 ? lastWidth : "100%"} />
    ))}
  </Box>
);

/** Ancho "natural" variable para listas (evita que todo se vea igual). */
export const varyWidth = (index: number, base = 60, spread = 30) =>
  `${base + ((index * 37) % spread)}%`;

// ─── Campo ────────────────────────────────────────────────────────────

export type CnFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: CnFieldSize;
  /** Igual que los campos: con borde, relleno o solo línea inferior. */
  variant?: "outlined" | "filled" | "standard";
  /** Etiqueta flotante sobre el borde. */
  label?: boolean;
  /** Texto de ayuda bajo el campo. */
  helperText?: boolean;
  fullWidth?: boolean;
  width?: number | string;
  /** Filas (multilínea). */
  rows?: number;
  /** Adornos al inicio/fin: ícono, texto (prefijo/sufijo) o nada. */
  startAdornment?: "icon" | "text" | "flag" | false;
  endAdornment?: "icon" | "text" | "chevron" | "stepper" | false;
  /** Contenido propio dentro del control (chips, cajas…). */
  children?: ReactNode;
  /** Muestra el valor (barra) dentro del control. */
  value?: boolean;
  /** Contenido extra bajo el control (medidor, contador…). */
  below?: ReactNode;
};

/** Campo genérico con borde (texto, select, número, fecha…). */
export const CnFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  fullWidth = true,
  width,
  rows,
  startAdornment = false,
  endAdornment = false,
  children,
  value = true,
  below,
  animation,
  ariaLabel = "Cargando campo",
  sx,
  className,
}: CnFieldSkeletonProps) => {
  const group = useSkeletonGroup();
  const tokens = FIELD_SIZE_TOKENS[size];
  const lineHeight = Math.round(tokens.fontSize * 1.45);
  const height = rows && rows > 1 ? tokens.height + (rows - 1) * lineHeight : tokens.height;
  const pad = size === "sm" ? 10 : size === "lg" ? 14 : 12;
  const iconSize = size === "lg" ? 20 : 18;

  const control = (
    <Box sx={{ width: width ?? (fullWidth ? "100%" : 260), maxWidth: "100%" }}>
      <Box
        sx={{
          position: "relative",
          minHeight: height,
          boxSizing: "border-box",
          display: "flex",
          alignItems: rows && rows > 1 ? "flex-start" : "center",
          gap: "8px",
          px: `${pad}px`,
          py: rows && rows > 1 ? `${pad}px` : 0,
          ...(variant === "outlined" && {
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderRadius: "var(--cn-radius-md, 8px)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
          }),
          ...(variant === "filled" && {
            borderBottom: "1px solid var(--cn-color-border-strong, #c5cad0)",
            borderRadius: "var(--cn-radius-md, 8px) var(--cn-radius-md, 8px) 0 0",
            backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
            pt: label ? "14px" : undefined,
          }),
          ...(variant === "standard" && {
            borderBottom: "1px solid var(--cn-color-border-strong, #c5cad0)",
            px: 0,
            pt: label ? "14px" : undefined,
          }),
        }}
      >
        {label && variant !== "outlined" && (
          <Box sx={{ position: "absolute", top: 5, left: variant === "standard" ? 0 : pad, display: "flex" }}>
            <SkText width={Math.round(tokens.fontSize * 5)} size={tokens.fontSize - 2} />
          </Box>
        )}
        {label && variant === "outlined" && (
          <Box
            sx={{
              position: "absolute",
              top: -6,
              left: pad - 4,
              px: "4px",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              display: "flex",
            }}
          >
            <SkText width={Math.round(tokens.fontSize * 5.5)} size={tokens.fontSize - 1} />
          </Box>
        )}
        {startAdornment === "icon" && <SkBlock circle width={iconSize} />}
        {startAdornment === "text" && <SkBlock width={18} height={tokens.fontSize} radius={3} />}
        {startAdornment === "flag" && <SkBlock width={22} height={15} radius={3} />}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {children ??
            (value &&
              (rows && rows > 1 ? (
                <Box sx={{ width: "100%" }}>
                  <SkLines
                    lines={Math.min(rows, 4)}
                    size={tokens.fontSize}
                    gap={lineHeight - tokens.fontSize}
                  />
                </Box>
              ) : (
                <SkText width="46%" size={tokens.fontSize} />
              )))}
        </Box>
        {endAdornment === "icon" && <SkBlock circle width={iconSize} />}
        {endAdornment === "text" && <SkBlock width={22} height={tokens.fontSize} radius={3} />}
        {endAdornment === "chevron" && <SkBlock width={10} height={6} radius={2} />}
        {endAdornment === "stepper" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <SkBlock width={12} height={Math.max(6, (height - 18) / 2)} radius={2} />
            <SkBlock width={12} height={Math.max(6, (height - 18) / 2)} radius={2} />
          </Box>
        )}
      </Box>
      {below}
      {helperText && <SkText width="42%" size={11} sx={{ mt: "6px" }} />}
    </Box>
  );

  // Dentro de otro skeleton se integra como pieza; suelto, es un grupo propio.
  if (group) return control;
  return (
    <CnSkeletonGroup
      name="field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {control}
    </CnSkeletonGroup>
  );
};

/** Bloque de etiqueta + contenido para controles sin borde (checkbox, radio, slider…). */
export const SkLabeled = ({
  label = true,
  helperText = false,
  children,
  fontSize = 13,
}: {
  label?: boolean;
  helperText?: boolean;
  children: ReactNode;
  fontSize?: number;
}) => (
  <Box>
    {label && <SkText width={Math.round(fontSize * 7)} size={fontSize} sx={{ mb: "10px" }} />}
    {children}
    {helperText && <SkText width="40%" size={11} sx={{ mt: "8px" }} />}
  </Box>
);
