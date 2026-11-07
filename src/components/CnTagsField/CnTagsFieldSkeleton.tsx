import Box from "@mui/material/Box";
import { FIELD_SIZE_TOKENS } from "../../utils/field-styles";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkLabeled, SkText } from "../CnSkeleton";
import type { CnTagsFieldProps } from "./CnTagsField";

type Size = NonNullable<CnTagsFieldProps["size"]>;

export type CnTagsFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: Size;
  /** Número de chips dentro del campo (por defecto 3). */
  tags?: number;
  /** Muestra el contador `n/max` bajo el campo. */
  maxTags?: number;
  /** Solo lectura: sin cuadro de captura tras los chips. */
  readOnly?: boolean;
  label?: boolean | string;
  helperText?: boolean | string;
};

/** Skeleton de `CnTagsField`: campo con borde, chips y cuadro de captura. */
export const CnTagsFieldSkeleton = ({
  size = "md",
  tags = 3,
  maxTags,
  readOnly = false,
  label = true,
  helperText = false,
  animation,
  ariaLabel = "Cargando etiquetas",
  sx,
  className,
}: CnTagsFieldSkeletonProps) => {
  const tokens = FIELD_SIZE_TOKENS[size];
  const count = Math.max(0, tags);

  return (
    <CnSkeletonGroup
      name="tags-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <SkLabeled label={Boolean(label)} fontSize={12}>
        <CnFieldSkeleton size={size} label={false}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "4px",
              width: "100%",
              py: "4px",
            }}
          >
            {Array.from({ length: count }, (_, index) => (
              <Box key={index} data-cn-skeleton-chip sx={{ display: "inline-flex" }}>
                <SkBlock width={52 + ((index * 31) % 44)} height={24} radius={12} />
              </Box>
            ))}
            {!readOnly && (
              <Box
                sx={{ flex: 1, minWidth: 120, display: "flex", alignItems: "center", py: "4px" }}
              >
                {count === 0 && <SkText width="55%" size={tokens.fontSize} />}
              </Box>
            )}
          </Box>
        </CnFieldSkeleton>
        {(helperText || maxTags !== undefined) && (
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: "8px", mt: "6px" }}>
            {helperText ? <SkText width="42%" size={11} /> : <span />}
            {maxTags !== undefined && <SkText width={28} size={11} />}
          </Box>
        )}
      </SkLabeled>
    </CnSkeletonGroup>
  );
};
