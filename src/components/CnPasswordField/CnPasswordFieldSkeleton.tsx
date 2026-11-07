import Box from "@mui/material/Box";
import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";
import type { CnPasswordFieldProps } from "./CnPasswordField";
import { buildPasswordRequirements, DEFAULT_PASSWORD_REQUIREMENTS } from "./CnPasswordField";

export type CnPasswordFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnPasswordFieldProps["size"]>;
  variant?: CnFieldSkeletonProps["variant"];
  /** Etiqueta flotante (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Medidor de fortaleza (4 segmentos + nivel). */
  showStrength?: CnPasswordFieldProps["showStrength"];
  /** Requisitos: la configuración del campo o directamente cuántos son. */
  requirements?: CnPasswordFieldProps["requirements"] | number;
  /**
   * Muestra la lista de requisitos. El campo real la muestra al escribir, por
   * eso está oculta por defecto.
   */
  showRequirements?: boolean;
  /** Botón "Generar contraseña segura" (y copiar en el campo). */
  allowGenerate?: CnPasswordFieldProps["allowGenerate"];
  fullWidth?: boolean;
  width?: number | string;
};

/** Skeleton de `CnPasswordField`: campo con mostrar/ocultar, fortaleza, requisitos y generador. */
export const CnPasswordFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  showStrength = true,
  requirements = DEFAULT_PASSWORD_REQUIREMENTS,
  showRequirements = false,
  allowGenerate = false,
  fullWidth = true,
  width,
  animation,
  ariaLabel = "Cargando contraseña",
  sx,
  className,
}: CnPasswordFieldSkeletonProps) => {
  const requirementCount =
    typeof requirements === "number"
      ? requirements
      : requirements
        ? buildPasswordRequirements(requirements).length
        : 0;

  return (
    <CnSkeletonGroup
      name="password-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
        <CnFieldSkeleton
          size={size}
          variant={variant}
          label={Boolean(label)}
          helperText={Boolean(helperText)}
          fullWidth={fullWidth}
          width={width}
          endAdornment="icon"
          below={
            showStrength ? (
              <Box
                data-cn-skeleton-strength
                sx={{ display: "flex", alignItems: "center", gap: "4px", mt: "8px" }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <SkBlock key={i} height={4} width="25%" radius={2} />
                ))}
                <SkText width={44} size={11} sx={{ ml: "6px", flexShrink: 0 }} />
              </Box>
            ) : undefined
          }
        />
        {showRequirements && requirementCount > 0 && (
          <Box
            data-cn-skeleton-requirements
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: "4px 12px",
            }}
          >
            {Array.from({ length: requirementCount }, (_, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <SkBlock circle width={14} />
                <SkText width={varyWidth(i, 50, 35)} size={11} />
              </Box>
            ))}
          </Box>
        )}
        {allowGenerate && <SkBlock width={190} height={30} radius={6} />}
      </Box>
    </CnSkeletonGroup>
  );
};
