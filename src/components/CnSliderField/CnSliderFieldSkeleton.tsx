import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnSliderFieldProps } from "./CnSliderField";

type Size = NonNullable<CnSliderFieldProps["size"]>;

export type CnSliderFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: Size;
  /** Selección de rango: dos perillas. */
  range?: boolean;
  /**
   * Marcas: `true` una por paso (según `min`/`max`/`step`), un número de marcas
   * o la misma lista del campo (las que tienen `label` muestran texto).
   */
  marks?: CnSliderFieldProps["marks"] | number;
  min?: number;
  max?: number;
  step?: number;
  /** `on` muestra la burbuja del valor sobre cada perilla. */
  valueLabelDisplay?: CnSliderFieldProps["valueLabelDisplay"];
  /** Valor actual junto a la etiqueta. */
  showValue?: boolean;
  label?: boolean | string;
  helperText?: boolean | string;
};

/** Medidas de `Slider` de MUI por tamaño. */
const SLIDER: Record<Size, { rail: number; thumb: number; root: number }> = {
  sm: { rail: 2, thumb: 12, root: 30 },
  md: { rail: 4, thumb: 20, root: 30 },
  lg: { rail: 4, thumb: 20, root: 30 },
};

/** Máximo de marcas dibujadas con `marks={true}` (más se vuelven ruido). */
const MAX_STEP_MARKS = 21;

/** Skeleton de `CnSliderField`: riel, tramo activo, perilla(s), marcas y valor. */
export const CnSliderFieldSkeleton = ({
  size = "md",
  range = false,
  marks = false,
  min = 0,
  max = 100,
  step = 1,
  valueLabelDisplay = "auto",
  showValue = true,
  label = true,
  helperText = false,
  animation,
  ariaLabel = "Cargando control deslizante",
  sx,
  className,
}: CnSliderFieldSkeletonProps) => {
  const m = SLIDER[size];
  const span = max - min || 1;

  // Posiciones de las marcas (%) y si llevan texto.
  const markList: { at: number; label: boolean }[] = (() => {
    if (Array.isArray(marks)) {
      return marks.map((mark) => ({
        at: ((mark.value - min) / span) * 100,
        label: Boolean(mark.label),
      }));
    }
    const count =
      typeof marks === "number"
        ? marks
        : marks
          ? Math.min(MAX_STEP_MARKS, Math.floor(span / (step || 1)) + 1)
          : 0;
    if (count < 2) return count === 1 ? [{ at: 0, label: false }] : [];
    return Array.from({ length: count }, (_, i) => ({ at: (i / (count - 1)) * 100, label: false }));
  })();
  const markLabels = markList.some((mark) => mark.label);

  const thumbs = range ? [25, 70] : [40];
  const fillFrom = range ? thumbs[0] : 0;
  const fillTo = thumbs[thumbs.length - 1];
  const bubbles = valueLabelDisplay === "on";

  return (
    <CnSkeletonGroup
      name="slider-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {(label || showValue) && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            mb: "6px",
          }}
        >
          {label ? <SkText width={84} size={12} /> : <span />}
          {showValue && <SkText width={range ? 72 : 32} size={12} />}
        </Box>
      )}
      <Box sx={{ px: "8px", pt: bubbles ? "30px" : 0, pb: markLabels ? "20px" : 0 }}>
        <Box data-cn-skeleton-slider sx={{ position: "relative", height: m.root }}>
          <SkBlock
            width="100%"
            height={m.rail}
            radius={m.rail}
            sx={{ position: "absolute", top: (m.root - m.rail) / 2, left: 0, opacity: 0.55 }}
          />
          <SkBlock
            width={`${fillTo - fillFrom}%`}
            height={m.rail}
            radius={m.rail}
            sx={{ position: "absolute", top: (m.root - m.rail) / 2, left: `${fillFrom}%` }}
          />
          {markList.map((mark, i) => (
            <Box key={i} data-cn-skeleton-mark sx={{ display: "contents" }}>
              <SkBlock
                circle
                width={Math.max(2, m.rail)}
                sx={{
                  position: "absolute",
                  top: (m.root - Math.max(2, m.rail)) / 2,
                  left: `${mark.at}%`,
                  transform: "translateX(-50%)",
                }}
              />
              {mark.label && (
                <SkText
                  width={34}
                  size={11}
                  sx={{
                    position: "absolute",
                    top: m.root + 6,
                    left: `${mark.at}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              )}
            </Box>
          ))}
          {thumbs.map((at, i) => (
            <Box key={i} data-cn-skeleton-thumb sx={{ display: "contents" }}>
              <SkBlock
                circle
                width={m.thumb}
                sx={{
                  position: "absolute",
                  top: (m.root - m.thumb) / 2,
                  left: `${at}%`,
                  transform: "translateX(-50%)",
                  boxShadow: "0 1px 3px rgba(17, 20, 24, 0.2)",
                }}
              />
              {bubbles && (
                <SkBlock
                  width={32}
                  height={24}
                  radius={4}
                  sx={{
                    position: "absolute",
                    top: (m.root - m.thumb) / 2 - 32,
                    left: `${at}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>
      {helperText && <SkText width="40%" size={11} sx={{ mt: "6px" }} />}
    </CnSkeletonGroup>
  );
};
