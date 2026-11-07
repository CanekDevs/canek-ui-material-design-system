import Box from "@mui/material/Box";
import { FIELD_SIZE_TOKENS } from "../../utils/field-styles";
import { hasOptionMedia } from "../../utils/option-media";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLabeled, SkText } from "../CnSkeleton";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import type { CnSegmentedFieldProps } from "./CnSegmentedField";

type Size = NonNullable<CnSegmentedFieldProps["size"]>;

export type CnSegmentedFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: Size;
  /** Número de segmentos o las mismas opciones del campo (se respeta cuáles llevan ícono). */
  options?: number | readonly CnFieldOption[];
  /** Con `options` numérico: los segmentos llevan ícono. */
  icons?: boolean;
  /** Solo íconos (sin texto). */
  iconOnly?: boolean;
  fullWidth?: boolean;
  orientation?: CnSegmentedFieldProps["orientation"];
  label?: boolean | string;
  helperText?: boolean | string;
};

/** Skeleton de `CnSegmentedField`: riel con segmentos (texto, ícono o ambos). */
export const CnSegmentedFieldSkeleton = ({
  size = "md",
  options = 3,
  icons = false,
  iconOnly = false,
  fullWidth = false,
  orientation = "horizontal",
  label = true,
  helperText = false,
  animation,
  ariaLabel = "Cargando opciones",
  sx,
  className,
}: CnSegmentedFieldSkeletonProps) => {
  const tokens = FIELD_SIZE_TOKENS[size];
  const vertical = orientation === "vertical";
  const segments: boolean[] =
    typeof options === "number"
      ? Array.from({ length: Math.max(0, options) }, () => icons || iconOnly)
      : options.map((option) => hasOptionMedia(option) || iconOnly);

  return (
    <CnSkeletonGroup
      name="segmented-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={[{ width: fullWidth ? "100%" : "fit-content" }, ...(Array.isArray(sx) ? sx : [sx])]}
      className={className}
    >
      <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
        <Box
          sx={{
            display: fullWidth ? "flex" : "inline-flex",
            flexDirection: vertical ? "column" : "row",
            width: fullWidth ? "100%" : undefined,
            maxWidth: "100%",
            boxSizing: "border-box",
            padding: "3px",
            gap: "2px",
            borderRadius: "var(--cn-radius-md, 8px)",
            backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
          }}
        >
          {segments.map((hasIcon, index) => (
            <Box
              key={index}
              data-cn-skeleton-segment
              sx={{
                flex: fullWidth ? 1 : undefined,
                minHeight: tokens.height - 6,
                boxSizing: "border-box",
                px: iconOnly ? "10px" : "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                borderRadius: "var(--cn-radius-sm, 6px)",
                // El primer segmento se ve como el activo (superficie elevada).
                ...(index === 0 && {
                  backgroundColor: "var(--cn-color-surface, #ffffff)",
                  boxShadow: "0 1px 3px rgba(17, 20, 24, 0.12)",
                }),
              }}
            >
              {hasIcon && <SkBlock circle width={20} />}
              {!iconOnly && (
                <SkText
                  width={Math.round(tokens.fontSize * (2.6 + ((index * 7) % 4) * 0.6))}
                  size={tokens.fontSize}
                />
              )}
            </Box>
          ))}
        </Box>
      </SkLabeled>
    </CnSkeletonGroup>
  );
};
