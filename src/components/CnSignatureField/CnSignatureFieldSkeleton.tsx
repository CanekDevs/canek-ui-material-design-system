import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";

export type CnSignatureFieldSkeletonProps = CnSkeletonCommonProps & {
  /** Etiqueta (legend) sobre el área de firma. */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Alto del área de firma en px (igual que el campo). */
  height?: number;
  /** Selector "Dibujar / Escribir" sobre el área. */
  allowTyped?: boolean;
  /** Sin acciones ni selector (como `disabled`/`readOnly` en el campo). */
  readOnly?: boolean;
  /** Muestra la línea base "Firma aquí". */
  baseline?: boolean;
};

/** Skeleton de `CnSignatureField`: etiqueta, selector de modo, área con línea base y acciones. */
export const CnSignatureFieldSkeleton = ({
  label = true,
  helperText = false,
  height = 180,
  allowTyped = true,
  readOnly = false,
  baseline = true,
  animation,
  ariaLabel = "Cargando campo de firma",
  sx,
  className,
}: CnSignatureFieldSkeletonProps) => (
  <CnSkeletonGroup
    name="signature-field"
    animation={animation}
    ariaLabel={ariaLabel}
    sx={sx}
    className={className}
  >
    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <SkText width={120} size={13} sx={{ mb: "2px" }} />}
      {allowTyped && !readOnly && (
        <Box
          data-sk-part="mode"
          sx={{
            display: "inline-flex",
            alignSelf: "flex-start",
            gap: "2px",
            p: "3px",
            borderRadius: "var(--cn-radius-md, 8px)",
            border: "1px solid var(--cn-color-border, #dde0e4)",
          }}
        >
          {[0, 1].map((i) => (
            <Box
              key={i}
              sx={{ display: "flex", alignItems: "center", gap: "6px", px: "10px", height: 24 }}
            >
              <SkBlock circle width={14} />
              <SkText width={52} size={12} />
            </Box>
          ))}
        </Box>
      )}
      <Box
        data-sk-part="pad"
        sx={{
          position: "relative",
          height,
          boxSizing: "border-box",
          borderRadius: "var(--cn-radius-md, 8px)",
          border: "1px dashed var(--cn-color-border-strong, #c5cad0)",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          overflow: "hidden",
        }}
      >
        {baseline && !readOnly && (
          <Box
            sx={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 28,
              borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
              pb: "4px",
            }}
          >
            <SkText width={70} size={11} />
          </Box>
        )}
      </Box>
      {!readOnly && (
        <Box data-sk-part="actions" sx={{ display: "flex", gap: "8px" }}>
          {[96, 64].map((w, i) => (
            <Box
              key={i}
              sx={{ display: "flex", alignItems: "center", gap: "6px", px: "8px", height: 30 }}
            >
              <SkBlock circle width={16} />
              <SkText width={w} size={13} />
            </Box>
          ))}
        </Box>
      )}
      {helperText && <SkText width="42%" size={11} />}
    </Box>
  </CnSkeletonGroup>
);
