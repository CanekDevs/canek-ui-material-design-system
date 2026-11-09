import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import type { GridSize } from "@mui/material/Grid";
import type { ReactNode } from "react";
import type { CnFieldSize } from "../../utils/field-styles";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import {
  CnFieldSkeleton,
  CnSkeletonGroup,
  SkBlock,
  SkLabeled,
  SkText,
  varyWidth,
} from "../CnSkeleton";
import type {
  CnFormActionsAlign,
  CnFormFieldOrCustom,
  CnFormFieldType,
  CnFormGridProps,
  CnFormSection,
  CnFormSize,
  CnFormStep,
  CnFormTab,
  CnFormValues,
  CnFormVariant,
} from "../CnForm/CnForm.types";

/*
 * Skeleton de `CnForm`. Funciona de dos formas:
 * - Genérica (compatible con versiones anteriores): `rows` × `columns` campos de texto.
 * - Dinámica: recibe la misma configuración del formulario (`fields`, `sections`,
 *   `tabs`, `steps`) y dibuja un marcador con la forma de cada tipo de campo,
 *   respetando columnas y `xs/sm/md/lg/xl` de cada campo.
 * Solo usa primitivas del kit (no depende de los skeletons de cada campo).
 */

/** Descripción mínima de un campo (un `CnFormField` completo también sirve). */
export type CnFormSkeletonField = CnFormGridProps & {
  type?: CnFormFieldType;
  name?: string;
  label?: unknown;
  helperText?: unknown;
  size?: CnFieldSize;
  multiline?: boolean;
  rows?: unknown;
  minRows?: unknown;
  options?: unknown;
  direction?: "row" | "column";
  startIcon?: string;
  endIcon?: string;
  startAdornment?: unknown;
  endAdornment?: unknown;
  showCounter?: boolean;
  maxLength?: number;
  fileVariant?: "dropzone" | "button" | "compact" | "grid" | "card" | "avatar" | "masonry";
  otpLength?: number;
  marks?: unknown;
  optionColumns?: 1 | 2 | 3 | 4;
  showCountrySelect?: boolean;
  /** address: partes visibles. */
  addressFields?: readonly string[];
  /** duration: unidades visibles. */
  durationUnits?: readonly string[];
  durationPresets?: unknown;
  /** schedule: días visibles. */
  scheduleDays?: readonly string[];
  /** location: mapa y dirección. */
  showMap?: boolean;
  showAddress?: boolean;
  /** weekdays: atajos. */
  presets?: boolean;
  visibleWhen?: (formValues: CnFormValues, ctx?: never) => boolean;
};

/** Sección mínima (un `CnFormSection` completo también sirve). */
export type CnFormSkeletonSection = {
  title?: ReactNode | boolean;
  description?: ReactNode | boolean;
  /** Campos de la sección o su número (campos de texto genéricos). */
  fields?: number | readonly (CnFormFieldOrCustom | CnFormSkeletonField)[];
  columns?: 1 | 2 | 3 | 4;
  appearance?: CnFormSection["appearance"];
  padding?: CnFormSection["padding"];
  repeatable?: boolean;
  /** Elementos de una sección repetible. */
  initialItems?: number;
  minItems?: number;
  collapsible?: boolean;
  visibleWhen?: (formValues: CnFormValues) => boolean;
};

type AnyField = CnFormFieldOrCustom | CnFormSkeletonField;
type AnySection = CnFormSection | CnFormSkeletonSection;
type AnyGroup = { fields?: readonly AnyField[]; sections?: readonly AnySection[] };

export type CnFormSkeletonProps = CnSkeletonCommonProps & {
  /** Filas de campos genéricos (cuando no se pasan `fields`/`sections`). */
  rows?: number;
  columns?: number;
  /** Incluye un bloque de título y descripción. */
  showHeader?: boolean;
  /** Incluye la barra de botones. */
  showActions?: boolean;
  /** Último campo como área de texto alta. */
  withTextarea?: boolean;

  /** Campos del formulario (misma forma que en `CnForm`). */
  fields?: readonly AnyField[];
  /** Secciones con título, descripción, columnas y campos. */
  sections?: readonly AnySection[];
  /** Pestañas (variante `tabbed`): se dibujan las pestañas y el contenido de la primera. */
  tabs?: readonly (CnFormTab | ({ label?: string } & AnyGroup))[];
  /** Pasos (variante `wizard`): se dibuja el stepper y el contenido del primero. */
  steps?: readonly (CnFormStep | ({ title?: string } & AnyGroup))[];
  /** Variante del formulario; por defecto se deduce como en `CnForm`. */
  variant?: CnFormVariant;
  size?: CnFormSize;
  /** Pestaña/paso activo cuyo contenido se dibuja. */
  activeIndex?: number;
  tabsOrientation?: "horizontal" | "vertical";
  stepperOrientation?: "horizontal" | "vertical";
  /** Título (y descripción) del encabezado; `true` = marcador genérico. */
  title?: ReactNode | boolean;
  description?: ReactNode | boolean;
  /** Ícono del encabezado. */
  icon?: string | boolean;
  actionsAlign?: CnFormActionsAlign;
  /** Botón cancelar en la barra de acciones. */
  showCancel?: boolean;
  /** Acciones extra en la barra. */
  extraActions?: number;
  /** Valores actuales para evaluar `visibleWhen` (si no se pasan, todo se muestra). */
  formValues?: CnFormValues;
};

// ─── Utilidades ───────────────────────────────────────────────────────

const WIDE_TYPES = new Set<string>([
  "choicecards",
  "transferlist",
  "keyvalue",
  "textarea",
  "file",
  "custom",
  "radio",
  "slider",
  "range",
  "daterange",
  "richtext",
  "signature",
  "tags",
  "numberrange",
  "address",
  "repeater",
  "code",
  "schedule",
  "location",
]);

/** Columnas (de 12) de cada parte de `address`, igual que `CnAddressField`. */
const ADDRESS_SPANS: Record<string, number> = {
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

const ADDRESS_DEFAULT_PARTS = [
  "street",
  "exteriorNumber",
  "interiorNumber",
  "postalCode",
  "neighborhood",
  "municipality",
  "state",
  "references",
];

/** Fila de atajos (chips). */
const ChipRow = ({ count }: { count: number }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px", mt: "8px" }}>
    {Array.from({ length: count }, (_, i) => (
      <SkBlock key={i} width={48 + ((i * 17) % 28)} height={24} radius={999} />
    ))}
  </Box>
);

const asField = (item: AnyField): CnFormSkeletonField => item as CnFormSkeletonField;

const staticNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

const optionCount = (field: CnFormSkeletonField, fallback: number) =>
  Array.isArray(field.options) ? Math.max(1, Math.min(field.options.length, 8)) : fallback;

const isVisible = (
  item: { visibleWhen?: (values: CnFormValues) => boolean },
  values?: CnFormValues,
) => {
  if (!values || !item.visibleWhen) return true;
  try {
    return item.visibleWhen(values);
  } catch {
    return true;
  }
};

/** Igual que `getDefaultGrid` del formulario. */
const gridFor = (field: CnFormSkeletonField, columns: number) => {
  const type = field.type ?? "text";
  const isWide = WIDE_TYPES.has(type) || (type === "checkbox" && Array.isArray(field.options));
  const span = isWide ? 12 : Math.max(1, Math.round(12 / Math.max(1, Math.min(4, columns))));
  return {
    xs: (field.xs ?? 12) as GridSize,
    sm: (field.sm ?? (columns > 2 && !isWide ? 6 : undefined)) as GridSize | undefined,
    md: (field.md ?? span) as GridSize,
    lg: field.lg,
    xl: field.xl,
  };
};

const boxBorder = {
  border: "1px solid var(--cn-color-border, #dde0e4)",
  borderRadius: "var(--cn-radius-md, 8px)",
  backgroundColor: "var(--cn-color-surface, #ffffff)",
} as const;

const dashedBorder = {
  border: "1px dashed var(--cn-color-border-strong, #c5cad0)",
  borderRadius: "var(--cn-radius-md, 8px)",
  backgroundColor: "var(--cn-color-surface, #ffffff)",
} as const;

/** Lista de opciones (checkbox/radio) en fila o columna. */
const OptionList = ({
  count,
  circle,
  direction = "column",
}: {
  count: number;
  circle: boolean;
  direction?: "row" | "column";
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: direction,
      flexWrap: "wrap",
      gap: direction === "row" ? "8px 20px" : "10px",
    }}
  >
    {Array.from({ length: count }, (_, i) => (
      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {circle ? <SkBlock circle width={18} /> : <SkBlock width={18} height={18} radius={4} />}
        <SkText width={60 + ((i * 23) % 50)} size={13} />
      </Box>
    ))}
  </Box>
);

// ─── Campo ────────────────────────────────────────────────────────────

/** Marcador con la forma de un campo según su `type`. */
const FieldShape = ({ field, size }: { field: CnFormSkeletonField; size: CnFieldSize }) => {
  const type = field.type ?? "text";
  const fieldSize = field.size ?? size;
  const label = Boolean(field.label);
  const helperText = Boolean(field.helperText);
  const direction = field.direction ?? "column";

  const common = { size: fieldSize, label, helperText } as const;

  switch (type) {
    case "textarea": {
      const rows = staticNumber(field.rows) ?? staticNumber(field.minRows) ?? 3;
      return <CnFieldSkeleton {...common} rows={rows} />;
    }
    case "number":
      return <CnFieldSkeleton {...common} endAdornment="stepper" />;
    case "currency":
      return <CnFieldSkeleton {...common} startAdornment="text" endAdornment="text" />;
    case "phone":
      return <CnFieldSkeleton {...common} startAdornment="flag" />;
    case "tel":
      return (
        <CnFieldSkeleton {...common} startAdornment={field.showCountrySelect ? "flag" : false} />
      );
    case "search":
      return <CnFieldSkeleton {...common} startAdornment="icon" />;
    case "password":
      return <CnFieldSkeleton {...common} endAdornment="icon" />;
    case "select":
    case "autocomplete":
    case "treeselect":
      return <CnFieldSkeleton {...common} endAdornment="chevron" />;
    case "country":
      return <CnFieldSkeleton {...common} startAdornment="flag" endAdornment="chevron" />;
    case "date":
    case "time":
    case "datetime":
    case "month":
    case "year":
      return <CnFieldSkeleton {...common} endAdornment="icon" />;
    case "color":
      return (
        <CnFieldSkeleton {...common}>
          <SkBlock width={22} height={22} radius={5} />
          <SkText width="30%" size={13} />
        </CnFieldSkeleton>
      );
    case "tags":
      return (
        <CnFieldSkeleton {...common}>
          {[56, 72, 48].map((w, i) => (
            <SkBlock key={i} width={w} height={22} radius={999} />
          ))}
        </CnFieldSkeleton>
      );
    case "daterange":
    case "numberrange":
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Box sx={{ flex: 1 }}>
              <CnFieldSkeleton
                size={fieldSize}
                label={false}
                endAdornment={type === "daterange" ? "icon" : false}
              />
            </Box>
            <SkBlock width={10} height={2} radius={1} />
            <Box sx={{ flex: 1 }}>
              <CnFieldSkeleton
                size={fieldSize}
                label={false}
                endAdornment={type === "daterange" ? "icon" : false}
              />
            </Box>
          </Box>
        </SkLabeled>
      );
    case "checkbox":
      return Array.isArray(field.options) ? (
        <SkLabeled label={label} helperText={helperText}>
          <OptionList count={optionCount(field, 3)} circle={false} direction={direction} />
        </SkLabeled>
      ) : (
        <Box sx={{ py: "6px" }}>
          <OptionList count={1} circle={false} />
          {helperText && <SkText width="40%" size={11} sx={{ mt: "8px", ml: "28px" }} />}
        </Box>
      );
    case "radio":
      return (
        <SkLabeled label={label} helperText={helperText}>
          <OptionList count={optionCount(field, 3)} circle direction={direction} />
        </SkLabeled>
      );
    case "switch":
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px", py: "8px" }}>
          <SkBlock width={34} height={18} radius={999} />
          <SkText width={110} size={13} />
        </Box>
      );
    case "slider":
    case "range": {
      const marks = Array.isArray(field.marks) || field.marks === true;
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box
            sx={{
              position: "relative",
              height: 20,
              display: "flex",
              alignItems: "center",
              px: "8px",
            }}
          >
            <SkBlock width="100%" height={4} radius={2} />
            <Box sx={{ position: "absolute", left: "30%", display: "flex" }}>
              <SkBlock circle width={16} />
            </Box>
            {type === "range" && (
              <Box sx={{ position: "absolute", left: "70%", display: "flex" }}>
                <SkBlock circle width={16} />
              </Box>
            )}
          </Box>
          {marks && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: "6px", px: "4px" }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <SkText key={i} width={18} size={10} />
              ))}
            </Box>
          )}
        </SkLabeled>
      );
    }
    case "rating":
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ display: "flex", gap: "4px" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkBlock key={i} width={22} height={22} radius={5} />
            ))}
          </Box>
        </SkLabeled>
      );
    case "otp": {
      const length = Math.max(1, Math.min(field.otpLength ?? 6, 10));
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ display: "flex", gap: "8px" }}>
            {Array.from({ length }, (_, i) => (
              <Box key={i} sx={{ ...boxBorder, width: 42, height: 48, boxSizing: "border-box" }} />
            ))}
          </Box>
        </SkLabeled>
      );
    }
    case "segmented": {
      const count = optionCount(field, 3);
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ ...boxBorder, display: "inline-flex", gap: "2px", p: "3px" }}>
            {Array.from({ length: count }, (_, i) => (
              <Box key={i} sx={{ px: "12px", height: 28, display: "flex", alignItems: "center" }}>
                <SkText width={48 + ((i * 17) % 24)} size={12} />
              </Box>
            ))}
          </Box>
        </SkLabeled>
      );
    }
    case "choicecards": {
      const count = optionCount(field, 3);
      const cols = field.optionColumns ?? Math.min(count, 3);
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gap: "10px",
            }}
          >
            {Array.from({ length: count }, (_, i) => (
              <Box key={i} sx={{ ...boxBorder, p: "12px", display: "flex", gap: "10px" }}>
                <SkBlock circle width={18} />
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <SkText width="60%" size={13} />
                  <SkText width="85%" size={11} />
                </Box>
              </Box>
            ))}
          </Box>
        </SkLabeled>
      );
    }
    case "file": {
      const variant = field.fileVariant ?? "dropzone";
      let body: ReactNode;
      if (variant === "avatar") {
        body = (
          <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Box sx={{ ...dashedBorder, width: 112, height: 112, borderRadius: "50%" }} />
            <SkBlock width={130} height={30} radius={8} />
          </Box>
        );
      } else if (variant === "button" || variant === "compact") {
        body = <SkBlock width={170} height={variant === "compact" ? 30 : 36} radius={8} />;
      } else if (variant === "grid" || variant === "card" || variant === "masonry") {
        body = (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
              gap: "8px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  aspectRatio: variant === "grid" ? "1 / 1" : "4 / 3",
                  "& > *": { width: "100%", height: "100%" },
                }}
              >
                <SkBlock width="100%" height="100%" radius={8} />
              </Box>
            ))}
            <Box sx={{ ...dashedBorder, aspectRatio: variant === "grid" ? "1 / 1" : "4 / 3" }} />
          </Box>
        );
      } else {
        body = (
          <Box
            sx={{
              ...dashedBorder,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              p: "20px 16px",
            }}
          >
            <SkBlock circle width={28} />
            <SkText width={220} size={13} sx={{ maxWidth: "80%" }} />
          </Box>
        );
      }
      return (
        <SkLabeled label={label} helperText={helperText}>
          {body}
        </SkLabeled>
      );
    }
    case "richtext":
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ ...boxBorder, overflow: "hidden" }}>
            <Box
              sx={{
                display: "flex",
                gap: "6px",
                p: "8px 10px",
                borderBottom: "1px solid var(--cn-color-border-subtle, #e9ecef)",
              }}
            >
              {Array.from({ length: 8 }, (_, i) => (
                <SkBlock key={i} width={18} height={18} radius={4} />
              ))}
            </Box>
            <Box
              sx={{
                p: "12px 14px",
                minHeight: 120,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {[0, 1, 2].map((i) => (
                <SkText key={i} size={14} width={i === 2 ? "48%" : varyWidth(i, 78, 22)} />
              ))}
            </Box>
          </Box>
        </SkLabeled>
      );
    case "signature":
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ ...dashedBorder, position: "relative", height: 180 }}>
            <Box
              sx={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: 28,
                borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
              }}
            />
          </Box>
        </SkLabeled>
      );
    case "transferlist":
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ display: "flex", alignItems: "stretch", gap: "8px" }}>
            {[0, 1].map((pane) => (
              <Box
                key={pane}
                sx={{
                  ...boxBorder,
                  flex: 1,
                  minWidth: 0,
                  p: "10px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <SkText width="40%" size={12} />
                {[0, 1, 2].map((i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <SkBlock width={16} height={16} radius={3} />
                    <SkText width={varyWidth(i + pane, 35, 35)} size={13} />
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </SkLabeled>
      );
    case "keyvalue":
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[0, 1].map((i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Box sx={{ flex: 1 }}>
                  <CnFieldSkeleton size={fieldSize} label={false} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <CnFieldSkeleton size={fieldSize} label={false} />
                </Box>
                <SkBlock circle width={20} />
              </Box>
            ))}
          </Box>
        </SkLabeled>
      );
    case "address": {
      const parts = field.addressFields?.length ? field.addressFields : ADDRESS_DEFAULT_PARTS;
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              gap: "14px 12px",
            }}
          >
            {parts.map((part) => (
              <Box
                key={part}
                sx={{
                  gridColumn: {
                    xs: `span ${part === "exteriorNumber" || part === "interiorNumber" ? 6 : 12}`,
                    sm: `span ${ADDRESS_SPANS[part] ?? 6}`,
                  },
                  minWidth: 0,
                }}
              >
                <CnFieldSkeleton
                  size={fieldSize}
                  rows={part === "references" ? 2 : undefined}
                  endAdornment={part === "state" || part === "neighborhood" ? "chevron" : false}
                />
              </Box>
            ))}
          </Box>
        </SkLabeled>
      );
    }
    case "repeater":
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[0, 1].map((i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SkBlock width={14} height={10} radius={2} />
                <Box sx={{ flex: 1 }}>
                  <CnFieldSkeleton size={fieldSize} label={false} />
                </Box>
                <SkBlock circle width={18} />
                <SkBlock circle width={18} />
                <SkBlock circle width={18} />
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mt: "10px" }}>
            <SkBlock width={84} height={24} radius={6} />
            <Box sx={{ flex: 1 }} />
            <SkText width={56} size={11} />
          </Box>
        </SkLabeled>
      );
    case "duration": {
      const units = Math.max(1, field.durationUnits?.length ?? 2);
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ display: "flex", gap: "8px" }}>
            {Array.from({ length: units }, (_, i) => (
              <Box key={i} sx={{ flex: 1, minWidth: 0 }}>
                <CnFieldSkeleton size={fieldSize} endAdornment="text" />
              </Box>
            ))}
          </Box>
          {field.durationPresets !== false && <ChipRow count={5} />}
        </SkLabeled>
      );
    }
    case "code": {
      const rows = Math.min(staticNumber(field.minRows) ?? staticNumber(field.rows) ?? 6, 12);
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ ...boxBorder, overflow: "hidden" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: "10px",
                height: 30,
                borderBottom: "1px solid var(--cn-color-border-subtle, #e9ecef)",
              }}
            >
              <SkText width={36} size={11} />
            </Box>
            <Box sx={{ display: "flex", py: "8px" }}>
              <Box
                sx={{
                  width: 36,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "11px",
                  pr: "8px",
                  pt: "4px",
                  borderRight: "1px solid var(--cn-color-border-subtle, #e9ecef)",
                }}
              >
                {Array.from({ length: rows }, (_, i) => (
                  <SkText key={i} width={10} size={10} />
                ))}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  px: "10px",
                  pt: "4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "11px",
                }}
              >
                {Array.from({ length: rows }, (_, i) => (
                  <SkText key={i} width={varyWidth(i, 30, 45)} size={10} />
                ))}
              </Box>
            </Box>
          </Box>
        </SkLabeled>
      );
    }
    case "schedule": {
      const days = Math.max(1, field.scheduleDays?.length ?? 7);
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={boxBorder}>
            {Array.from({ length: days }, (_, i) => (
              <Box
                key={i}
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
                {i < Math.min(5, days) ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CnFieldSkeleton size={fieldSize} label={false} width={128} />
                    <SkBlock width={8} height={2} radius={1} />
                    <CnFieldSkeleton size={fieldSize} label={false} width={128} />
                  </Box>
                ) : (
                  <SkText width={56} size={13} />
                )}
              </Box>
            ))}
          </Box>
        </SkLabeled>
      );
    }
    case "location":
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Box sx={{ flex: 1 }}>
              <CnFieldSkeleton size={fieldSize} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <CnFieldSkeleton size={fieldSize} />
            </Box>
            <SkBlock width={150} height={30} radius={8} />
          </Box>
          {field.showAddress && (
            <Box sx={{ mt: "10px" }}>
              <CnFieldSkeleton size={fieldSize} />
            </Box>
          )}
          {field.showMap !== false && (
            <Box sx={{ mt: "10px" }}>
              <SkBlock width="100%" height={220} radius={8} />
            </Box>
          )}
        </SkLabeled>
      );
    case "weekdays": {
      const dim = fieldSize === "sm" ? 32 : fieldSize === "lg" ? 46 : 38;
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {Array.from({ length: 7 }, (_, i) => (
              <SkBlock key={i} circle width={dim} />
            ))}
          </Box>
          {field.presets !== false && <ChipRow count={3} />}
        </SkLabeled>
      );
    }
    case "timerange":
      return (
        <SkLabeled label={label} helperText={helperText}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Box sx={{ flex: 1 }}>
              <CnFieldSkeleton size={fieldSize} endAdornment="icon" />
            </Box>
            <SkBlock width={10} height={2} radius={1} />
            <Box sx={{ flex: 1 }}>
              <CnFieldSkeleton size={fieldSize} endAdornment="icon" />
            </Box>
            <SkBlock width={72} height={24} radius={999} />
          </Box>
        </SkLabeled>
      );
    case "display":
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", py: "4px" }}>
          {label && <SkText width={90} size={11} />}
          <SkText width="55%" size={14} />
        </Box>
      );
    case "custom":
      return <SkBlock width="100%" height={56} radius={8} />;
    default: {
      // text, email, url, masked, y tipos registrados.
      const multiline = Boolean(field.multiline);
      const rows = multiline
        ? (staticNumber(field.rows) ?? staticNumber(field.minRows) ?? 3)
        : undefined;
      return (
        <CnFieldSkeleton
          {...common}
          rows={rows}
          startAdornment={field.startIcon || field.startAdornment ? "icon" : false}
          endAdornment={field.endIcon || field.endAdornment ? "icon" : false}
        />
      );
    }
  }
};

// ─── Grupos ───────────────────────────────────────────────────────────

const FieldGrid = ({
  fields,
  columns,
  size,
  values,
}: {
  fields: readonly AnyField[];
  columns: number;
  size: CnFieldSize;
  values?: CnFormValues;
}) => {
  const visible = fields
    .map(asField)
    .filter((field) => field.type !== "hidden" && isVisible(field, values));
  if (visible.length === 0) return null;
  return (
    <Grid container columnSpacing={2} rowSpacing={1.5} sx={{ width: "100%" }}>
      {visible.map((field, index) => (
        <Grid
          key={field.name ?? index}
          size={gridFor(field, columns)}
          data-sk-field={field.type ?? "text"}
        >
          <FieldShape field={field} size={size} />
        </Grid>
      ))}
    </Grid>
  );
};

const genericFields = (count: number): CnFormSkeletonField[] =>
  Array.from({ length: count }, () => ({ type: "text", label: true }));

const SectionShape = ({
  section,
  columns,
  size,
  values,
}: {
  section: AnySection;
  columns: number;
  size: CnFieldSize;
  values?: CnFormValues;
}) => {
  const appearance = section.appearance ?? "card";
  const padding = { none: "0px", sm: "10px", md: "16px", lg: "24px" }[section.padding ?? "md"];
  const fields =
    typeof section.fields === "number" ? genericFields(section.fields) : (section.fields ?? []);
  const sectionColumns = section.columns ?? columns;
  const items = section.repeatable
    ? Math.max(section.initialItems ?? Math.max(section.minItems ?? 1, 1), 0)
    : 0;
  const grid = <FieldGrid fields={fields} columns={sectionColumns} size={size} values={values} />;

  return (
    <Box
      data-sk-part="section"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: appearance === "plain" ? 0 : padding,
        borderRadius: "var(--cn-radius-lg, 12px)",
        border:
          appearance === "card"
            ? "1px solid var(--cn-color-border, #dde0e4)"
            : "1px solid transparent",
        backgroundColor:
          appearance === "filled"
            ? "var(--cn-color-neutral-50, #fafbfc)"
            : appearance === "plain"
              ? "transparent"
              : "var(--cn-color-surface, #ffffff)",
        boxShadow:
          appearance === "elevated"
            ? "0 1px 3px rgba(17, 20, 24, 0.08), 0 6px 16px rgba(17, 20, 24, 0.06)"
            : "none",
      }}
    >
      {(section.title || section.description || section.collapsible) && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            {section.title && <SkText width="32%" size={15} />}
            {section.description && <SkText width="58%" size={12} />}
          </Box>
          {section.collapsible && <SkBlock circle width={22} />}
        </Box>
      )}
      {section.repeatable ? (
        <>
          {Array.from({ length: items }, (_, i) => (
            <Box
              key={i}
              data-sk-part="section-item"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                p: "12px",
                borderRadius: "var(--cn-radius-md, 8px)",
                border: "1px solid var(--cn-color-border, #dde0e4)",
                backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SkText width="22%" size={13} />
                <Box sx={{ flex: 1 }} />
                <SkBlock circle width={20} />
              </Box>
              {grid}
            </Box>
          ))}
          <SkBlock width={120} height={30} radius={8} />
        </>
      ) : (
        grid
      )}
    </Box>
  );
};

const GroupShape = ({
  group,
  columns,
  size,
  values,
}: {
  group: AnyGroup;
  columns: number;
  size: CnFieldSize;
  values?: CnFormValues;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    {group.fields && group.fields.length > 0 && (
      <FieldGrid fields={group.fields} columns={columns} size={size} values={values} />
    )}
    {group.sections
      ?.filter((section) => isVisible(section, values))
      .map((section, i) => (
        <SectionShape key={i} section={section} columns={columns} size={size} values={values} />
      ))}
  </Box>
);

const ButtonShape = ({ width }: { width: number }) => (
  <SkBlock width={width} height={36} radius={8} />
);

/** Esqueleto de carga para formularios (mismas medidas que los campos reales). */
export const CnFormSkeleton = ({
  rows = 4,
  columns = 1,
  showHeader = false,
  showActions = false,
  withTextarea = false,
  fields,
  sections,
  tabs,
  steps,
  variant: variantProp,
  size = "md",
  activeIndex = 0,
  tabsOrientation = "horizontal",
  stepperOrientation = "horizontal",
  title,
  description,
  icon,
  actionsAlign = "end",
  showCancel = true,
  extraActions = 0,
  formValues,
  animation,
  ariaLabel = "Cargando formulario",
  sx,
  className,
}: CnFormSkeletonProps) => {
  const cols = Math.max(1, Math.min(4, columns));
  const variant: CnFormVariant =
    variantProp ??
    (steps?.length
      ? "wizard"
      : tabs?.length
        ? "tabbed"
        : sections?.length
          ? "sectioned"
          : "simple");
  const dynamic = Boolean(fields?.length || sections?.length || tabs?.length || steps?.length);

  const legacyFields: CnFormSkeletonField[] = [
    ...genericFields(rows * cols),
    ...(withTextarea ? [{ type: "textarea", label: true, rows: 3 } as CnFormSkeletonField] : []),
  ];

  const groups: AnyGroup[] =
    variant === "tabbed"
      ? [...(tabs ?? [])]
      : variant === "wizard"
        ? [...(steps ?? [])]
        : [{ fields: dynamic ? fields : legacyFields, sections }];
  const current = groups[Math.min(Math.max(activeIndex, 0), Math.max(groups.length - 1, 0))] ?? {};
  const body = <GroupShape group={current} columns={cols} size={size} values={formValues} />;

  const hasHeader = showHeader || Boolean(title) || Boolean(description);

  let content: ReactNode = body;
  if (variant === "tabbed" && tabs?.length) {
    const vertical = tabsOrientation === "vertical";
    content = (
      <Box
        sx={{
          display: "flex",
          flexDirection: vertical ? "row" : "column",
          gap: "16px",
          minWidth: 0,
        }}
      >
        <Box
          data-sk-part="tabs"
          sx={{
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            gap: vertical ? "4px" : "20px",
            ...(vertical
              ? {
                  borderRight: "1px solid var(--cn-color-border, #dde0e4)",
                  pr: "12px",
                  minWidth: 160,
                }
              : { borderBottom: "1px solid var(--cn-color-border, #dde0e4)" }),
          }}
        >
          {tabs.map((_, i) => (
            <Box
              key={i}
              data-sk-part="tab"
              sx={{ py: vertical ? "8px" : "12px", px: vertical ? "8px" : "2px", display: "flex" }}
            >
              <SkText width={vertical ? 110 : 64 + ((i * 19) % 30)} size={13} />
            </Box>
          ))}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>{body}</Box>
      </Box>
    );
  } else if (variant === "wizard" && steps?.length) {
    const vertical = stepperOrientation === "vertical";
    content = (
      <Box sx={{ display: "flex", flexDirection: vertical ? "row" : "column", gap: "20px" }}>
        <Box
          data-sk-part="stepper"
          sx={{
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            alignItems: vertical ? "flex-start" : "center",
            gap: "10px",
            ...(vertical && { minWidth: 180 }),
          }}
        >
          {steps.map((_, i) => (
            <Box
              key={i}
              data-sk-part="step"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: vertical || i === steps.length - 1 ? "0 0 auto" : 1,
                minWidth: 0,
              }}
            >
              <SkBlock circle width={24} />
              <SkText width={70} size={13} />
              {!vertical && i < steps.length - 1 && (
                <Box
                  sx={{
                    flex: 1,
                    height: "1px",
                    minWidth: 16,
                    backgroundColor: "var(--cn-color-border, #dde0e4)",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>{body}</Box>
      </Box>
    );
  }

  const isWizard = variant === "wizard";
  const extras = Array.from({ length: Math.max(0, extraActions) }, (_, i) => (
    <ButtonShape key={`x${i}`} width={100} />
  ));
  const main = (
    <>
      {(showCancel || isWizard) && <ButtonShape width={96} />}
      <ButtonShape width={112} />
    </>
  );

  return (
    <CnSkeletonGroup
      name="form"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <Box
        data-cn-form-skeleton={variant}
        sx={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {hasHeader && (
          <Box
            data-sk-part="header"
            sx={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
          >
            {icon && <SkBlock width={36} height={36} radius={8} />}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <SkText width="40%" size={18} />
              {(showHeader || description) && <SkText width="65%" size={12} />}
            </Box>
          </Box>
        )}
        {content}
        {showActions && (
          <Box
            data-sk-part="actions"
            sx={{
              display: "flex",
              flexDirection: actionsAlign === "stretch" ? "column-reverse" : "row",
              alignItems: actionsAlign === "stretch" ? "stretch" : "center",
              justifyContent:
                actionsAlign === "start"
                  ? "flex-start"
                  : actionsAlign === "between"
                    ? "space-between"
                    : "flex-end",
              gap: "8px",
              flexWrap: "wrap",
              pt: "12px",
              borderTop: "1px solid var(--cn-color-border, #dde0e4)",
              ...(actionsAlign === "stretch" && { "& > *": { width: "100% !important" } }),
            }}
          >
            {actionsAlign === "between" ? (
              <>
                <Box sx={{ display: "flex", gap: "8px" }}>{extras}</Box>
                <Box sx={{ display: "flex", gap: "8px" }}>{main}</Box>
              </>
            ) : (
              <>
                {extras}
                {main}
              </>
            )}
          </Box>
        )}
      </Box>
    </CnSkeletonGroup>
  );
};
