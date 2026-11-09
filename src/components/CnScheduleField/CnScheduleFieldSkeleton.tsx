import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkLabeled, SkText } from "../CnSkeleton";
import type { CnScheduleFieldProps } from "./CnScheduleField";

export type CnScheduleFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnScheduleFieldProps["size"]>;
  label?: boolean | string;
  helperText?: boolean | string;
  /** Filas (días). Por defecto 7. */
  days?: number;
  /** Días con horario (el resto se dibujan "cerrados"). Por defecto 5. */
  openDays?: number;
};

/** Skeleton de `CnScheduleField`: una fila por día con interruptor y rango de horas. */
export const CnScheduleFieldSkeleton = ({
  size = "md",
  label = true,
  helperText = false,
  days = 7,
  openDays = 5,
  animation,
  ariaLabel = "Cargando horario semanal",
  sx,
  className,
}: CnScheduleFieldSkeletonProps) => (
  <CnSkeletonGroup
    name="schedule-field"
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
        }}
      >
        {Array.from({ length: Math.max(1, days) }, (_, i) => (
          <Box
            key={i}
            data-cn-skeleton-day
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              px: "12px",
              py: "8px",
              borderTop: i ? "1px solid var(--cn-color-border-subtle, #e9ecef)" : 0,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", width: 150 }}>
              <SkBlock width={30} height={16} radius={999} />
              <SkText width={60} size={13} />
            </Box>
            {i < openDays ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CnFieldSkeleton size={size} label={false} width={128} />
                <SkBlock width={8} height={2} radius={1} />
                <CnFieldSkeleton size={size} label={false} width={128} />
              </Box>
            ) : (
              <SkText width={56} size={13} />
            )}
          </Box>
        ))}
      </Box>
    </SkLabeled>
  </CnSkeletonGroup>
);
