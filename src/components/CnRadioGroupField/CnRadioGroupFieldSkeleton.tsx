import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLabeled, SkText } from "../CnSkeleton";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import type { CnRadioGroupFieldProps } from "./CnRadioGroupField";

type Size = NonNullable<CnRadioGroupFieldProps["size"]>;

export type CnRadioGroupFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: Size;
  direction?: CnRadioGroupFieldProps["direction"];
  appearance?: CnRadioGroupFieldProps["appearance"];
  /** Leyenda del grupo. */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Número de opciones o las mismas opciones del campo (se respeta qué llevan descripción). */
  options?: number | readonly CnFieldOption[];
  /** Con `options` numérico: las opciones llevan descripción. */
  optionDescriptions?: boolean;
};

/** Medidas de `Radio` de MUI: caja con padding de 9px alrededor del ícono. */
const BOX: Record<Size, { hit: number; mark: number }> = {
  sm: { hit: 38, mark: 16 },
  md: { hit: 42, mark: 19 },
  lg: { hit: 42, mark: 19 },
};

/** Skeleton de `CnRadioGroupField`: radios simples o tarjetas, en fila o columna. */
export const CnRadioGroupFieldSkeleton = ({
  size = "md",
  direction = "row",
  appearance = "default",
  label = true,
  helperText = false,
  options = 3,
  optionDescriptions = false,
  animation,
  ariaLabel = "Cargando opciones",
  sx,
  className,
}: CnRadioGroupFieldSkeletonProps) => {
  const isCard = appearance === "card";
  const { hit, mark } = BOX[size];
  const descriptions: boolean[] =
    typeof options === "number"
      ? Array.from({ length: Math.max(0, options) }, () => optionDescriptions)
      : options.map((option) => Boolean(option.description));

  return (
    <CnSkeletonGroup
      name="radio-group-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
        <Box
          sx={
            isCard
              ? {
                  display: "grid",
                  gap: "8px",
                  gridTemplateColumns:
                    direction === "row" ? "repeat(auto-fit, minmax(160px, 1fr))" : "1fr",
                }
              : {
                  display: "flex",
                  flexDirection: direction === "row" ? "row" : "column",
                  flexWrap: direction === "row" ? "wrap" : "nowrap",
                  alignItems: direction === "row" ? "center" : "flex-start",
                  gap: direction === "row" ? "4px 16px" : "2px",
                }
          }
        >
          {descriptions.map((hasDescription, index) => (
            <Box
              key={index}
              data-cn-skeleton-option
              sx={{
                display: "flex",
                alignItems: isCard ? "flex-start" : "center",
                gap: "2px",
                minWidth: 0,
                ...(isCard && {
                  padding: "8px 12px 8px 4px",
                  border: "1px solid var(--cn-color-border, #dde0e4)",
                  borderRadius: "var(--cn-radius-md, 8px)",
                  backgroundColor: "var(--cn-color-surface, #ffffff)",
                }),
              }}
            >
              <Box
                sx={{
                  width: hit,
                  height: isCard ? hit - 7 : hit,
                  pt: isCard ? "2px" : 0,
                  display: "inline-flex",
                  alignItems: isCard ? "flex-start" : "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <SkBlock circle width={mark} />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  pt: isCard ? "4px" : 0,
                  minWidth: 0,
                  flex: isCard ? 1 : undefined,
                }}
              >
                <SkText width={isCard ? "55%" : 60 + ((index * 29) % 44)} size={13} />
                {hasDescription && (
                  <SkText width={isCard ? "80%" : 90 + ((index * 23) % 40)} size={11} />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </SkLabeled>
    </CnSkeletonGroup>
  );
};
