import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import type { MouseEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";

/*
 * Infraestructura para las gráficas propias (heatmap, embudo, sankey,
 * velas, radiales, treemap): tooltip flotante y leyenda con el mismo estilo
 * que MUI X Charts.
 */

export type CnTooltipRow = { label: ReactNode; value: ReactNode; color?: string };
export type CnTooltipContent = { title?: ReactNode; rows: CnTooltipRow[]; footer?: ReactNode };

/** Tarjeta de tooltip (mismo aspecto que el de MUI X Charts con el tema de Canek). */
export const CnChartTooltipCard = ({ title, rows, footer }: CnTooltipContent) => (
  <Box
    sx={{
      minWidth: 140,
      maxWidth: 280,
      borderRadius: "10px",
      border: "1px solid var(--cn-color-border, #dde0e4)",
      backgroundColor: "var(--cn-color-surface, #ffffff)",
      boxShadow: "0 8px 24px rgba(17, 20, 24, 0.12)",
      overflow: "hidden",
      fontSize: "12px",
    }}
  >
    {title && (
      <Box
        sx={{
          px: "12px",
          py: "7px",
          fontWeight: 700,
          borderBottom: "1px solid var(--cn-color-border, #eceef1)",
          color: "var(--cn-color-text-primary, #111418)",
        }}
      >
        {title}
      </Box>
    )}
    <Box sx={{ px: "12px", py: "7px", display: "grid", gap: "4px" }}>
      {rows.map((row, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {row.color && (
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "3px",
                backgroundColor: row.color,
                flexShrink: 0,
              }}
            />
          )}
          <Box sx={{ flex: 1, color: "var(--cn-color-text-secondary, #4e5660)" }}>{row.label}</Box>
          <Box
            sx={{
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: "var(--cn-color-text-primary, #111418)",
            }}
          >
            {row.value}
          </Box>
        </Box>
      ))}
    </Box>
    {footer && (
      <Box
        sx={{
          px: "12px",
          pb: "8px",
          color: "var(--cn-color-text-muted, #6e7682)",
          fontSize: "11px",
        }}
      >
        {footer}
      </Box>
    )}
  </Box>
);

/** Tooltip que sigue al cursor dentro de un contenedor relativo. */
export const useChartTooltip = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<{ x: number; y: number; content: CnTooltipContent } | null>(
    null,
  );

  const show = useCallback((event: MouseEvent<Element>, content: CnTooltipContent) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    setState({ x: event.clientX - box.left, y: event.clientY - box.top, content });
  }, []);
  const hide = useCallback(() => setState(null), []);

  const layer = state ? (
    <Box
      role="tooltip"
      sx={{
        position: "absolute",
        left: state.x,
        top: state.y,
        transform: `translate(${
          containerRef.current && state.x > containerRef.current.clientWidth * 0.6
            ? "calc(-100% - 14px)"
            : "14px"
        }, ${state.y > 120 ? "calc(-100% - 10px)" : "10px"})`,
        pointerEvents: "none",
        zIndex: 5,
        transition: "left 60ms linear, top 60ms linear",
      }}
    >
      <CnChartTooltipCard {...state.content} />
    </Box>
  ) : null;

  return { containerRef, show, hide, layer, active: state !== null };
};

export type CnLegendItem = {
  id: string;
  label: ReactNode;
  color: string;
  hidden?: boolean;
  value?: ReactNode;
};

/** Leyenda en chips; clic para ocultar/mostrar. */
export const CnChartLegend = ({
  items,
  onToggle,
  direction = "row",
  align = "center",
}: {
  items: CnLegendItem[];
  onToggle?: (id: string) => void;
  direction?: "row" | "column";
  align?: "start" | "center" | "end";
}) => (
  <Box
    data-cn-chart-ignore
    sx={{
      display: "flex",
      flexDirection: direction,
      flexWrap: "wrap",
      justifyContent: direction === "row" ? align : undefined,
      gap: direction === "row" ? "4px 12px" : "4px",
      pt: direction === "row" ? "8px" : 0,
    }}
  >
    {items.map((item) => (
      <ButtonBase
        key={item.id}
        data-cn-legend-item
        data-color={item.color}
        data-hidden={item.hidden || undefined}
        disabled={!onToggle}
        onClick={() => onToggle?.(item.id)}
        aria-pressed={onToggle ? !item.hidden : undefined}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          px: "6px",
          py: "2px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--cn-color-neutral-600, #4e5660)",
          opacity: item.hidden ? 0.4 : 1,
          textDecoration: item.hidden ? "line-through" : "none",
          justifyContent: "flex-start",
          "&:hover": { backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)" },
          "&.Mui-disabled": { color: "var(--cn-color-neutral-600, #4e5660)" },
        }}
      >
        <Box
          component="span"
          sx={{
            width: 10,
            height: 10,
            borderRadius: "3px",
            backgroundColor: item.color,
            flexShrink: 0,
          }}
        />
        <span>{item.label}</span>
        {item.value !== undefined && (
          <Box
            component="span"
            sx={{ ml: "2px", fontWeight: 800, color: "var(--cn-color-text-primary, #111418)" }}
          >
            {item.value}
          </Box>
        )}
      </ButtonBase>
    ))}
  </Box>
);

/** Animación de entrada para formas SVG (respeta prefers-reduced-motion). */
export const enterSx = (animate: boolean) =>
  animate
    ? {
        "& .cn-enter": {
          animation: "cn-chart-enter 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
          transformBox: "fill-box",
          transformOrigin: "center",
        },
        "@keyframes cn-chart-enter": {
          from: { opacity: 0, transform: "scale(0.92)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
        "@media (prefers-reduced-motion: reduce)": { "& .cn-enter": { animation: "none" } },
      }
    : {};

/** Alterna un id dentro de un Set (estado de series ocultas). */
export const toggleInSet = (set: Set<string>, id: string) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};
