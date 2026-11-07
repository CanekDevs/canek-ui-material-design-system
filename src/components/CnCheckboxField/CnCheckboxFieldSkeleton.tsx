import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLabeled, SkText } from "../CnSkeleton";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import type { CnCheckboxFieldProps } from "./CnCheckboxField";

type Size = NonNullable<CnCheckboxFieldProps["size"]>;
type LabelPlacement = NonNullable<CnCheckboxFieldProps["labelPlacement"]>;

export type CnCheckboxFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: Size;
  direction?: CnCheckboxFieldProps["direction"];
  labelPlacement?: LabelPlacement;
  /** Etiqueta: leyenda del grupo o texto junto a la casilla (modo simple). */
  label?: boolean | string;
  /** Texto secundario bajo la etiqueta (modo simple). */
  description?: boolean | string;
  helperText?: boolean | string;
  /**
   * Con opciones el skeleton es un grupo: número de opciones o las mismas
   * opciones del campo (se respeta qué opciones llevan descripción).
   */
  options?: number | readonly CnFieldOption[];
  /** Con `options` numérico: las opciones llevan descripción. */
  optionDescriptions?: boolean;
  /** Casilla "Seleccionar todo" al inicio del grupo. */
  selectAll?: boolean | string;
};

/** Medidas de `Checkbox` de MUI: caja con padding de 9px alrededor del ícono. */
const BOX: Record<Size, { hit: number; mark: number }> = {
  sm: { hit: 38, mark: 15 },
  md: { hit: 42, mark: 18 },
  lg: { hit: 42, mark: 18 },
};

const PLACEMENT_DIRECTION: Record<
  LabelPlacement,
  "row" | "row-reverse" | "column" | "column-reverse"
> = {
  end: "row",
  start: "row-reverse",
  top: "column-reverse",
  bottom: "column",
};

const ChoiceRow = ({
  size,
  labelPlacement,
  description,
  index,
  text = true,
}: {
  size: Size;
  labelPlacement: LabelPlacement;
  description: boolean;
  index: number;
  /** Muestra la etiqueta de texto. */
  text?: boolean;
}) => {
  const { hit, mark } = BOX[size];
  const vertical = labelPlacement === "top" || labelPlacement === "bottom";
  return (
    <Box
      data-cn-skeleton-option
      sx={{
        display: "inline-flex",
        flexDirection: PLACEMENT_DIRECTION[labelPlacement],
        alignItems: "center",
        gap: "2px",
      }}
    >
      <Box
        sx={{
          width: hit,
          height: hit,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <SkBlock width={mark} height={mark} radius={3} />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: vertical ? "center" : "flex-start",
          gap: "4px",
          minWidth: 0,
        }}
      >
        {text && <SkText width={64 + ((index * 29) % 48)} size={13} />}
        {description && <SkText width={96 + ((index * 23) % 40)} size={11} />}
      </Box>
    </Box>
  );
};

/** Skeleton de `CnCheckboxField`: casilla simple o grupo (fila/columna). */
export const CnCheckboxFieldSkeleton = ({
  size = "md",
  direction = "column",
  labelPlacement = "end",
  label = true,
  description = false,
  helperText = false,
  options,
  optionDescriptions = false,
  selectAll = false,
  animation,
  ariaLabel = "Cargando casillas",
  sx,
  className,
}: CnCheckboxFieldSkeletonProps) => {
  const isGroup = options !== undefined;
  const descriptions: boolean[] = !isGroup
    ? []
    : typeof options === "number"
      ? Array.from({ length: Math.max(0, options) }, () => optionDescriptions)
      : options.map((option) => Boolean(option.description));

  return (
    <CnSkeletonGroup
      name="checkbox-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {isGroup ? (
        <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
          <Box
            sx={{
              display: "flex",
              flexDirection: direction === "row" ? "row" : "column",
              flexWrap: direction === "row" ? "wrap" : "nowrap",
              alignItems: direction === "row" ? "center" : "flex-start",
              gap: direction === "row" ? "4px 16px" : "2px",
            }}
          >
            {selectAll && (
              <ChoiceRow size={size} labelPlacement="end" description={false} index={7} />
            )}
            {descriptions.map((hasDescription, index) => (
              <ChoiceRow
                key={index}
                size={size}
                labelPlacement={labelPlacement}
                description={hasDescription}
                index={index}
              />
            ))}
          </Box>
        </SkLabeled>
      ) : (
        <SkLabeled label={false} helperText={Boolean(helperText)}>
          <ChoiceRow
            size={size}
            labelPlacement={labelPlacement}
            description={Boolean(description)}
            index={3}
            text={Boolean(label)}
          />
        </SkLabeled>
      )}
    </CnSkeletonGroup>
  );
};
