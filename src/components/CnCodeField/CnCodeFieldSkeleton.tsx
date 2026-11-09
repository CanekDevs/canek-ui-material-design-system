import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLabeled, SkText, varyWidth } from "../CnSkeleton";
import type { CnCodeFieldProps } from "./CnCodeField";

export type CnCodeFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnCodeFieldProps["size"]>;
  label?: boolean | string;
  helperText?: boolean | string;
  /** Filas visibles. Por defecto 6. */
  rows?: number;
  lineNumbers?: boolean;
  /** Botón "Formatear" en la barra. */
  toolbar?: boolean;
};

const FONT = { sm: 12, md: 13, lg: 14 } as const;

/** Skeleton de `CnCodeField`: barra, numeración de líneas y líneas de código. */
export const CnCodeFieldSkeleton = ({
  size = "md",
  label = true,
  helperText = false,
  rows = 6,
  lineNumbers = true,
  toolbar = false,
  animation,
  ariaLabel = "Cargando editor de código",
  sx,
  className,
}: CnCodeFieldSkeletonProps) => {
  const fontSize = FONT[size];
  const lineHeight = Math.round(fontSize * 1.6);
  const count = Math.max(1, rows);
  return (
    <CnSkeletonGroup
      name="code-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
        <Box
          sx={{
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderRadius: "var(--cn-radius-md, 8px)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              px: "10px",
              height: 30,
              borderBottom: "1px solid var(--cn-color-border-subtle, #e9ecef)",
              backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
            }}
          >
            <SkText width={36} size={11} />
            <Box sx={{ flex: 1 }} />
            <SkText width={44} size={11} />
            {toolbar && (
              <Box data-cn-skeleton-format sx={{ display: "flex" }}>
                <SkBlock width={78} height={20} radius={6} />
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", py: "8px" }}>
            {lineNumbers && (
              <Box
                data-cn-skeleton-gutter
                sx={{
                  width: 36,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  pr: "8px",
                  borderRight: "1px solid var(--cn-color-border-subtle, #e9ecef)",
                }}
              >
                {Array.from({ length: count }, (_, i) => (
                  <Box key={i} sx={{ height: lineHeight, display: "flex", alignItems: "center" }}>
                    <SkText width={10} size={fontSize - 2} />
                  </Box>
                ))}
              </Box>
            )}
            <Box sx={{ flex: 1, px: "10px" }}>
              {Array.from({ length: count }, (_, i) => (
                <Box
                  key={i}
                  data-cn-skeleton-line
                  sx={{
                    height: lineHeight,
                    display: "flex",
                    alignItems: "center",
                    pl: `${(i % 3) * 14}px`,
                  }}
                >
                  <SkText width={varyWidth(i, 30, 45)} size={fontSize} />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </SkLabeled>
    </CnSkeletonGroup>
  );
};
