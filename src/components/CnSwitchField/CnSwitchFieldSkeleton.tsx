import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLabeled, SkText } from "../CnSkeleton";
import type { CnSwitchFieldProps } from "./CnSwitchField";

type Size = NonNullable<CnSwitchFieldProps["size"]>;
type LabelPlacement = NonNullable<CnSwitchFieldProps["labelPlacement"]>;

export type CnSwitchFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: Size;
  labelPlacement?: LabelPlacement;
  label?: boolean | string;
  /** Texto secundario bajo la etiqueta. */
  description?: boolean | string;
  helperText?: boolean | string;
};

/** Medidas de `Switch` de MUI (raíz, riel y perilla). */
const SWITCH: Record<
  Size,
  { width: number; height: number; track: number; trackH: number; thumb: number }
> = {
  sm: { width: 40, height: 24, track: 26, trackH: 10, thumb: 16 },
  md: { width: 58, height: 38, track: 34, trackH: 14, thumb: 20 },
  lg: { width: 58, height: 38, track: 34, trackH: 14, thumb: 20 },
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

/** Skeleton de `CnSwitchField`: riel + perilla y etiqueta en la posición del campo. */
export const CnSwitchFieldSkeleton = ({
  size = "md",
  labelPlacement = "end",
  label = true,
  description = false,
  helperText = false,
  animation,
  ariaLabel = "Cargando interruptor",
  sx,
  className,
}: CnSwitchFieldSkeletonProps) => {
  const m = SWITCH[size];
  const vertical = labelPlacement === "top" || labelPlacement === "bottom";
  const thumbLeft = (m.width - m.track) / 2 - (m.thumb - m.trackH) / 2;

  return (
    <CnSkeletonGroup
      name="switch-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <SkLabeled label={false} helperText={Boolean(helperText)}>
        <Box
          sx={{
            display: "inline-flex",
            flexDirection: PLACEMENT_DIRECTION[labelPlacement],
            alignItems: "center",
            gap: "2px",
          }}
        >
          <Box
            data-cn-skeleton-switch
            sx={{ position: "relative", width: m.width, height: m.height, flexShrink: 0 }}
          >
            <SkBlock
              width={m.track}
              height={m.trackH}
              radius={m.trackH / 2}
              sx={{
                position: "absolute",
                top: (m.height - m.trackH) / 2,
                left: (m.width - m.track) / 2,
                opacity: 0.6,
              }}
            />
            <SkBlock
              circle
              width={m.thumb}
              sx={{
                position: "absolute",
                top: (m.height - m.thumb) / 2,
                left: Math.max(0, thumbLeft),
                boxShadow: "0 1px 3px rgba(17, 20, 24, 0.2)",
              }}
            />
          </Box>
          {(label || description) && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: vertical ? "center" : "flex-start",
                gap: "4px",
                minWidth: 0,
              }}
            >
              {label && <SkText width={92} size={13} />}
              {description && <SkText width={180} size={11} />}
            </Box>
          )}
        </Box>
      </SkLabeled>
    </CnSkeletonGroup>
  );
};
