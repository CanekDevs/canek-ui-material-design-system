import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef, useEffect, useRef, useState } from "react";
import { CnIcon } from "../CnIcon";
import { CnDescriptionListSkeleton } from "./CnDescriptionListSkeleton";

export type CnDescriptionListLayout = "stacked" | "inline";
export type CnDescriptionListVariant = "plain" | "card";
export type CnDescriptionListSize = "sm" | "md";

export type CnDescriptionItem = {
  /** Identificador estable (por defecto, el índice). */
  id?: string;
  /** Etiqueta del dato ("Correo", "RFC", "Responsable"). */
  label: string;
  /** Valor. Vacío (`null`, `undefined` o `""`) muestra `emptyValue`. */
  value?: ReactNode;
  /** Ícono antes de la etiqueta. */
  icon?: string;
  /** Texto que se copia; si existe, aparece el botón "Copiar". */
  copyValue?: string;
  /** Convierte el valor en enlace (correo, teléfono, sitio). */
  href?: string;
  /** Texto de ayuda bajo el valor. */
  hint?: ReactNode;
  /** Columnas que ocupa (`"full"` = toda la fila). */
  span?: 1 | 2 | "full";
};

export type CnDescriptionListProps = {
  items: readonly CnDescriptionItem[];
  /** Título del bloque (p. ej. "Datos de contacto"). */
  title?: ReactNode;
  /** Acción a la derecha del título (botón "Editar"). */
  action?: ReactNode;
  /** Columnas máximas; bajan solas cuando no caben (`minColumnWidth`). */
  columns?: 1 | 2 | 3 | 4;
  /** Ancho mínimo de una columna, en px, antes de pasar a menos columnas. */
  minColumnWidth?: number;
  /** `stacked`: etiqueta arriba del valor. `inline`: etiqueta a la izquierda. */
  layout?: CnDescriptionListLayout;
  /** `card` agrega borde, fondo y relleno. */
  variant?: CnDescriptionListVariant;
  size?: CnDescriptionListSize;
  /** Separador entre filas (solo `layout="inline"`). */
  dividers?: boolean;
  /** Texto para valores vacíos. */
  emptyValue?: ReactNode;
  /** Se llama después de copiar un valor. */
  onCopy?: (item: CnDescriptionItem) => void;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  /** Filas del skeleton. */
  skeletonCount?: number;
  /** Nivel del encabezado del título. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

const isEmpty = (value: ReactNode) => value === null || value === undefined || value === "";

const FONT = {
  sm: { label: "12px", value: "13px", gap: "12px" },
  md: { label: "12px", value: "14px", gap: "16px" },
} as const;

const CopyButton = ({
  label,
  text,
  onCopied,
}: {
  label: string;
  text: string;
  onCopied: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      onCopied();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <ButtonBase
      onClick={copy}
      aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
      title={copied ? "Copiado" : "Copiar"}
      sx={{
        flexShrink: 0,
        width: "24px",
        height: "24px",
        borderRadius: "var(--cn-radius-sm, 4px)",
        color: copied
          ? "var(--cn-color-success-600, #228740)"
          : "var(--cn-color-text-muted, #6e7682)",
        "&:hover": { backgroundColor: "var(--cn-color-surface-sunken, #f4f5f7)" },
        "&.Mui-focusVisible": {
          boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(61, 90, 254, 0.35))",
        },
      }}
    >
      <CnIcon name={copied ? "check" : "content_copy"} size={16} />
    </ButtonBase>
  );
};

/** Lista de pares etiqueta–valor de solo lectura, en columnas responsivas y con copiar. */
export const CnDescriptionList = forwardRef<HTMLDivElement, CnDescriptionListProps>(
  function CnDescriptionList(
    {
      items,
      title,
      action,
      columns = 2,
      minColumnWidth = 200,
      layout = "stacked",
      variant = "plain",
      size = "md",
      dividers = layout === "inline",
      emptyValue = "—",
      onCopy,
      skeleton = false,
      skeletonCount,
      headingLevel = 3,
      ariaLabel,
      sx,
      className,
    },
    ref,
  ) {
    if (skeleton) {
      return (
        <CnDescriptionListSkeleton
          count={skeletonCount ?? Math.max(items.length, 4)}
          columns={columns}
          minColumnWidth={minColumnWidth}
          layout={layout}
          variant={variant}
          title={Boolean(title)}
          sx={sx}
          className={className}
        />
      );
    }

    const font = FONT[size];
    const gap = font.gap;
    const track = `minmax(max(${minColumnWidth}px, calc((100% - ${columns - 1} * ${gap}) / ${columns})), 1fr)`;

    return (
      <Box
        ref={ref}
        data-cn-description-list
        className={className}
        sx={[
          {
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            color: "var(--cn-color-text, #222831)",
          },
          variant === "card" && {
            p: "16px",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderRadius: "var(--cn-radius-md, 8px)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {(title || action) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            {title && (
              <Typography
                component={`h${headingLevel}`}
                sx={{
                  m: 0,
                  flex: 1,
                  minWidth: 0,
                  fontSize: "16px",
                  fontWeight: 500,
                  lineHeight: 1.4,
                  overflowWrap: "anywhere",
                }}
              >
                {title}
              </Typography>
            )}
            {action && <Box sx={{ flexShrink: 0, ml: "auto" }}>{action}</Box>}
          </Box>
        )}
        <Box
          component="dl"
          aria-label={ariaLabel}
          sx={{
            m: 0,
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, ${track})`,
            columnGap: gap,
            rowGap: layout === "inline" ? 0 : gap,
            minWidth: 0,
          }}
        >
          {items.map((item, index) => {
            const empty = isEmpty(item.value);
            const value = empty ? emptyValue : item.value;
            return (
              <Box
                key={item.id ?? index}
                data-cn-description-item
                sx={{
                  minWidth: 0,
                  gridColumn:
                    item.span === "full" ? "1 / -1" : item.span === 2 ? "span 2" : undefined,
                  display: layout === "inline" ? "grid" : "flex",
                  flexDirection: "column",
                  gridTemplateColumns:
                    layout === "inline" ? "minmax(96px, 40%) minmax(0, 1fr)" : undefined,
                  alignItems: layout === "inline" ? "baseline" : undefined,
                  gap: layout === "inline" ? "12px" : "4px",
                  py: layout === "inline" ? "10px" : 0,
                  borderBottom:
                    layout === "inline" && dividers
                      ? "1px solid var(--cn-color-border-subtle, var(--cn-color-border, #dde0e4))"
                      : undefined,
                }}
              >
                <Box
                  component="dt"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    minWidth: 0,
                    fontSize: font.label,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: "var(--cn-color-text-muted, #6e7682)",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.icon && <CnIcon name={item.icon} size={16} />}
                  {item.label}
                </Box>
                <Box
                  component="dd"
                  sx={{
                    m: 0,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "4px",
                    fontSize: font.value,
                    lineHeight: 1.5,
                    color: empty
                      ? "var(--cn-color-text-muted, #6e7682)"
                      : "var(--cn-color-text, #222831)",
                  }}
                >
                  <Box sx={{ flex: "0 1 auto", minWidth: 0, overflowWrap: "anywhere" }}>
                    {item.href && !empty ? (
                      <Box
                        component="a"
                        href={item.href}
                        sx={{
                          color: "inherit",
                          textDecoration: "underline",
                          textDecorationColor: "var(--cn-color-border-strong, #b8bec6)",
                          textUnderlineOffset: "3px",
                          "&:hover": { textDecorationColor: "currentColor" },
                        }}
                      >
                        {value}
                      </Box>
                    ) : (
                      value
                    )}
                    {item.hint && (
                      <Box
                        sx={{
                          mt: "2px",
                          fontSize: "12px",
                          color: "var(--cn-color-text-muted, #6e7682)",
                        }}
                      >
                        {item.hint}
                      </Box>
                    )}
                  </Box>
                  {item.copyValue && !empty && (
                    <CopyButton
                      label={item.label}
                      text={item.copyValue}
                      onCopied={() => onCopy?.(item)}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  },
);
