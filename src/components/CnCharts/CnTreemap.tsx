import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useMemo, useState } from "react";
import { CnIcon } from "../CnIcon";
import { CnChartCard } from "./CnChartCard";
import { CnTreemapSkeleton } from "./CnChartSkeleton";
import type { CnChartCommonProps } from "./chart-common";
import { cardPropsOf, useFormatter } from "./chart-common";
import { enterSx, useChartTooltip } from "./chart-custom";
import { squarify } from "./chart-geometry";
import type { CnChartTone } from "./chart-theme";
import { interpolateScale, readableTextOn, resolveTone, sumValues } from "./chart-theme";
import { useChartWidth } from "./use-chart-width";

export type CnTreemapItem = {
  label: string;
  value?: number;
  tone?: CnChartTone | string;
  children?: CnTreemapItem[];
};

export type CnTreemapProps = Omit<CnChartCommonProps, "legend"> & {
  data: ReadonlyArray<CnTreemapItem>;
  /** Navegar al hacer clic en un grupo con hijos. */
  drillDown?: boolean;
  /** Muestra el % del total en cada rectángulo. */
  showPercent?: boolean;
  gap?: number;
  radius?: number;
  onItemClick?: (item: CnTreemapItem, path: CnTreemapItem[]) => void;
};

const valueOf = (item: CnTreemapItem): number =>
  item.children?.length ? sumValues(item.children.map(valueOf)) : Math.max(0, item.value ?? 0);

/** Treemap jerárquico con navegación por niveles. */
export const CnTreemap = (props: CnTreemapProps) => {
  const {
    data,
    drillDown = true,
    showPercent = true,
    gap = 3,
    radius = 6,
    onItemClick,
    height = 340,
    colors,
    animate = true,
  } = props;
  const format = useFormatter(props);
  const [ref, width] = useChartWidth();
  const tooltip = useChartTooltip();
  const [path, setPath] = useState<CnTreemapItem[]>([]);
  const level = useMemo(
    () => (path.length ? (path[path.length - 1].children ?? []) : data),
    [path, data],
  );
  const total = sumValues(level.map(valueOf));
  const rootColor = path.length ? colorOfRoot(path[0]) : null;

  function colorOfRoot(item: CnTreemapItem) {
    const index = data.indexOf(item);
    return colors?.[index % colors.length] ?? resolveTone(item.tone, Math.max(0, index));
  }

  const rects = useMemo(
    () =>
      squarify(
        level.map((item) => ({ value: valueOf(item), item })),
        0,
        0,
        width,
        height,
      ),
    [level, width, height],
  );
  const isEmpty = total <= 0;

  const card = cardPropsOf(props);
  return (
    <CnChartCard
      {...card}
      height={height}
      empty={!props.loading && !props.error && isEmpty && path.length === 0}
      skeleton={<CnTreemapSkeleton height={height} tiles={Math.min(14, data.length || 9)} />}
      exportData={() => ({
        columns: [
          { id: "group", header: "Grupo" },
          { id: "label", header: "Concepto" },
          { id: "value", header: "Valor", kind: "number" },
        ],
        rows: data.flatMap((item) =>
          item.children?.length
            ? item.children.map((child) => ({
                group: item.label,
                label: child.label,
                value: valueOf(child),
              }))
            : [{ group: "", label: item.label, value: valueOf(item) }],
        ),
      })}
    >
      {() => (
        <Box>
          {drillDown && path.length > 0 && (
            <Box
              data-cn-chart-ignore
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "2px",
                mb: "8px",
                fontSize: "12px",
              }}
            >
              <ButtonBase
                onClick={() => setPath([])}
                sx={{
                  px: "6px",
                  py: "2px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  color: "var(--cn-color-accent-600, #304ffe)",
                  "&:hover": { backgroundColor: "rgba(61, 90, 254, 0.08)" },
                }}
              >
                <CnIcon name="home" size="xs" />
                <Box component="span" sx={{ ml: "4px" }}>
                  Todo
                </Box>
              </ButtonBase>
              {path.map((item, i) => (
                <Box key={i} sx={{ display: "inline-flex", alignItems: "center" }}>
                  <CnIcon name="chevron_right" size="xs" />
                  <ButtonBase
                    disabled={i === path.length - 1}
                    onClick={() => setPath(path.slice(0, i + 1))}
                    sx={{
                      px: "6px",
                      py: "2px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      color:
                        i === path.length - 1
                          ? "var(--cn-color-text-primary, #111418)"
                          : "var(--cn-color-accent-600, #304ffe)",
                    }}
                  >
                    {item.label}
                  </ButtonBase>
                </Box>
              ))}
            </Box>
          )}
          <Box
            ref={(node: HTMLDivElement | null) => {
              ref.current = node;
              tooltip.containerRef.current = node;
            }}
            sx={{ position: "relative", ...enterSx(animate) }}
          >
            <svg
              width={width}
              height={height}
              role="img"
              aria-label={typeof props.title === "string" ? props.title : "Treemap"}
              style={{ display: "block" }}
            >
              {rects.map(({ x, y, width: w, height: h, item }, k) => {
                const index = level.indexOf(item);
                const base = rootColor
                  ? interpolateScale(
                      [rootColor, "#ffffff"],
                      Math.min(0.55, (index / Math.max(1, level.length)) * 0.6),
                    )
                  : (colors?.[index % colors.length] ?? resolveTone(item.tone, index));
                const value = valueOf(item);
                const share = total ? (value / total) * 100 : 0;
                const canDrill = drillDown && Boolean(item.children?.length);
                const text = readableTextOn(base);
                const iw = Math.max(0, w - gap);
                const ih = Math.max(0, h - gap);
                return (
                  <g
                    key={`${item.label}-${k}`}
                    className="cn-enter"
                    style={{
                      animationDelay: `${Math.min(500, k * 30)}ms`,
                      cursor: canDrill || onItemClick ? "pointer" : undefined,
                    }}
                    onMouseMove={(event) =>
                      tooltip.show(event, {
                        title: [...path.map((p) => p.label), item.label].join(" › "),
                        rows: [
                          { label: "Valor", value: format(value), color: base },
                          { label: "Del total", value: `${share.toFixed(1)} %` },
                          ...(item.children?.length
                            ? [{ label: "Elementos", value: String(item.children.length) }]
                            : []),
                        ],
                        footer: canDrill ? "Clic para ver el detalle" : undefined,
                      })
                    }
                    onMouseLeave={tooltip.hide}
                    onClick={() => {
                      onItemClick?.(item, [...path, item]);
                      if (canDrill) {
                        tooltip.hide();
                        setPath([...path, item]);
                      }
                    }}
                  >
                    <rect
                      x={x + gap / 2}
                      y={y + gap / 2}
                      width={iw}
                      height={ih}
                      rx={Math.min(radius, iw / 2, ih / 2)}
                      fill={base}
                    />
                    {iw > 64 && ih > 34 && (
                      <>
                        <text
                          x={x + gap / 2 + 10}
                          y={y + gap / 2 + 18}
                          fontSize={12}
                          fontWeight={700}
                          fill={text}
                          style={{ pointerEvents: "none" }}
                        >
                          {item.label.length * 7 > iw - 16
                            ? `${item.label.slice(0, Math.max(3, Math.floor((iw - 22) / 7)))}…`
                            : item.label}
                        </text>
                        <text
                          x={x + gap / 2 + 10}
                          y={y + gap / 2 + 34}
                          fontSize={11}
                          fill={text}
                          opacity={0.85}
                          style={{ pointerEvents: "none" }}
                        >
                          {format(value)}
                          {showPercent ? ` · ${share.toFixed(1)} %` : ""}
                        </text>
                      </>
                    )}
                    {canDrill && iw > 40 && ih > 40 && (
                      <text
                        x={x + w - gap / 2 - 10}
                        y={y + gap / 2 + 18}
                        textAnchor="end"
                        fontSize={12}
                        fill={text}
                        opacity={0.7}
                        style={{ pointerEvents: "none" }}
                      >
                        ⤢
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            {tooltip.layer}
          </Box>
        </Box>
      )}
    </CnChartCard>
  );
};
