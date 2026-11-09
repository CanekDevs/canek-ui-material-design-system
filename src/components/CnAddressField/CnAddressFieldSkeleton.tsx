import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkLabeled } from "../CnSkeleton";
import type { CnAddressFieldProps, CnAddressPart } from "./CnAddressField";

export type CnAddressFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnAddressFieldProps["size"]>;
  label?: boolean | string;
  helperText?: boolean | string;
  /** Partes visibles (mismo orden y anchos que el campo). */
  fields?: CnAddressPart[];
};

const SPANS: Record<CnAddressPart, number> = {
  street: 6,
  exteriorNumber: 3,
  interiorNumber: 3,
  postalCode: 3,
  neighborhood: 5,
  municipality: 4,
  state: 6,
  country: 6,
  references: 12,
};

const SKELETON_DEFAULT_FIELDS: CnAddressPart[] = [
  "street",
  "exteriorNumber",
  "interiorNumber",
  "postalCode",
  "neighborhood",
  "municipality",
  "state",
  "references",
];

/** Skeleton de `CnAddressField`: la misma cuadrícula de partes del domicilio. */
export const CnAddressFieldSkeleton = ({
  size = "md",
  label = true,
  helperText = false,
  fields = SKELETON_DEFAULT_FIELDS,
  animation,
  ariaLabel = "Cargando domicilio",
  sx,
  className,
}: CnAddressFieldSkeletonProps) => (
  <CnSkeletonGroup
    name="address-field"
    animation={animation}
    ariaLabel={ariaLabel}
    sx={sx}
    className={className}
  >
    <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gap: "14px 12px",
        }}
      >
        {fields.map((part) => (
          <Box
            key={part}
            data-cn-skeleton-part={part}
            sx={{
              gridColumn: {
                xs: `span ${part === "exteriorNumber" || part === "interiorNumber" ? 6 : 12}`,
                sm: `span ${SPANS[part]}`,
              },
              minWidth: 0,
            }}
          >
            <CnFieldSkeleton
              size={size}
              rows={part === "references" ? 2 : undefined}
              endAdornment={part === "state" || part === "neighborhood" ? "chevron" : false}
            />
          </Box>
        ))}
      </Box>
    </SkLabeled>
  </CnSkeletonGroup>
);
