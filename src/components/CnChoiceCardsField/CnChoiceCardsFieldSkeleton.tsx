import Box from "@mui/material/Box";
import { hasOptionMedia } from "../../utils/option-media";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLabeled, SkText } from "../CnSkeleton";
import type { CnChoiceCardsFieldProps, CnChoiceCardsOption } from "./CnChoiceCardsField";

export type CnChoiceCardsFieldSkeletonProps = CnSkeletonCommonProps & {
  /**
   * Número de tarjetas o las mismas opciones del campo (se respeta qué tarjetas
   * llevan ícono, descripción y metadato).
   */
  options?: number | readonly CnChoiceCardsOption[];
  /** Columnas en escritorio (en móvil siempre 1). Por defecto 2. */
  columns?: CnChoiceCardsFieldProps["columns"];
  /** Indicador cuadrado (casillas) en lugar de circular. */
  multiple?: boolean;
  /** Con `options` numérico: las tarjetas llevan ícono. */
  icon?: boolean;
  /** Con `options` numérico: las tarjetas llevan descripción. */
  description?: boolean;
  /** Con `options` numérico: las tarjetas llevan metadato (precio, insignia…). */
  meta?: boolean;
  label?: boolean | string;
  helperText?: boolean | string;
};

type CardShape = { icon: boolean; description: boolean; meta: boolean };

/** Skeleton de `CnChoiceCardsField`: rejilla de tarjetas con ícono, texto, metadato e indicador. */
export const CnChoiceCardsFieldSkeleton = ({
  options = 3,
  columns = 2,
  multiple = false,
  icon = false,
  description = true,
  meta = false,
  label = true,
  helperText = false,
  animation,
  ariaLabel = "Cargando opciones",
  sx,
  className,
}: CnChoiceCardsFieldSkeletonProps) => {
  const cards: CardShape[] =
    typeof options === "number"
      ? Array.from({ length: Math.max(0, options) }, () => ({ icon, description, meta }))
      : options.map((option) => ({
          icon: hasOptionMedia(option),
          description: Boolean(option.description),
          meta: Boolean(option.meta),
        }));

  return (
    <CnSkeletonGroup
      name="choice-cards-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
        <Box
          sx={{
            display: "grid",
            gap: "10px",
            gridTemplateColumns: {
              xs: "1fr",
              sm: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))`,
              md: `repeat(${columns}, minmax(0, 1fr))`,
            },
          }}
        >
          {cards.map((card, index) => (
            <Box
              key={index}
              data-cn-skeleton-card
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px",
                minWidth: 0,
                borderRadius: "var(--cn-radius-md, 8px)",
                border: "1.5px solid var(--cn-color-border, #dde0e4)",
                backgroundColor: "var(--cn-color-surface, #ffffff)",
              }}
            >
              {card.icon && <SkBlock width={28} height={28} radius={6} sx={{ mt: "1px" }} />}
              <Box sx={{ flex: 1, minWidth: 0, pr: "22px" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    minHeight: 19,
                  }}
                >
                  <SkText width={`${45 + ((index * 17) % 25)}%`} size={13} />
                  {card.meta && <SkText width={38} size={12} />}
                </Box>
                {card.description && (
                  <SkText width={`${62 + ((index * 23) % 30)}%`} size={12} sx={{ mt: "6px" }} />
                )}
              </Box>
              <SkBlock
                width={18}
                height={18}
                radius={multiple ? 4 : "50%"}
                sx={{ position: "absolute", top: 10, right: 10 }}
              />
            </Box>
          ))}
        </Box>
      </SkLabeled>
    </CnSkeletonGroup>
  );
};
