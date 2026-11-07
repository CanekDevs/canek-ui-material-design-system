import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLabeled, SkText } from "../CnSkeleton";
import type { CnRatingFieldProps } from "./CnRatingField";

type Size = NonNullable<CnRatingFieldProps["size"]>;

export type CnRatingFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: Size;
  /** Número de estrellas (por defecto 5). */
  max?: number;
  /** Texto descriptivo junto a las estrellas (`labels` del campo). */
  labels?: boolean | CnRatingFieldProps["labels"];
  label?: boolean | string;
  helperText?: boolean | string;
};

/** Tamaño de ícono de `Rating` de MUI: small / medium / large. */
const STAR: Record<Size, number> = { sm: 18, md: 24, lg: 30 };

/** Estrella de 5 puntas recortada sobre la pieza del skeleton. */
const STAR_CLIP =
  "polygon(50% 4%, 61.8% 37%, 96% 37%, 68.5% 58%, 79% 92%, 50% 71.5%, 21% 92%, 31.5% 58%, 4% 37%, 38.2% 37%)";

/** Skeleton de `CnRatingField`: fila de estrellas con la cantidad y tamaño del campo. */
export const CnRatingFieldSkeleton = ({
  size = "md",
  max = 5,
  labels = false,
  label = true,
  helperText = false,
  animation,
  ariaLabel = "Cargando calificación",
  sx,
  className,
}: CnRatingFieldSkeletonProps) => {
  const star = STAR[size];
  return (
    <CnSkeletonGroup
      name="rating-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Box sx={{ display: "inline-flex" }}>
            {Array.from({ length: Math.max(0, max) }, (_, i) => (
              <Box key={i} data-cn-skeleton-star sx={{ display: "inline-flex" }}>
                <SkBlock width={star} height={star} radius={0} sx={{ clipPath: STAR_CLIP }} />
              </Box>
            ))}
          </Box>
          {labels && <SkText width={56} size={12} />}
        </Box>
      </SkLabeled>
    </CnSkeletonGroup>
  );
};
