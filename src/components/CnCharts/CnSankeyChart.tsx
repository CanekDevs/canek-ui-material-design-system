import Box from "@mui/material/Box";
import { useMemo, useState } from "react";
import { CnChartCard } from "./CnChartCard";
import { CnSankeyChartSkeleton } from "./CnChartSkeleton";
import type { CnChartCommonProps } from "./chart-common";
import { cardPropsOf, useFormatter } from "./chart-common";
import { enterSx, useChartTooltip } from "./chart-custom";
import type { CnChartTone } from "./chart-theme";
import { resolveTone } from "./chart-theme";
import { useChartWidth } from "./use-chart-width";

export type CnSankeyNode = { id: string; label?: string; tone?: CnChartTone | string };
export type CnSankeyLink = { source: string; target: string; value: number };

export type CnSankeyChartProps = Omit<CnChartCommonProps, "legend"> & {
  nodes: ReadonlyArray<CnSankeyNode>;
  links: ReadonlyArray<CnSankeyLink>;
  nodeWidth?: number;
  nodePadding?: number;
  /** Color del flujo: del nodo origen, del destino o degradado. */
  linkColor?: "source" | "target" | "gradient";
  /** Muestra el valor junto a la etiqueta del nodo. */
  showValues?: boolean;
  onNodeClick?: (node: CnSankeyNode) => void;
  onLinkClick?: (link: CnSankeyLink) => void;
};

type LaidNode = CnSankeyNode & {
  level: number;
  value: number;
  x: number;
  y: number;
  h: number;
  color: string;
  outOffset: number;
  inOffset: number;
};

/** Distribuye nodos por niveles y apila flujos de forma proporcional. */
const layoutSankey = (
  nodes: ReadonlyArray<CnSankeyNode>,
  links: ReadonlyArray<CnSankeyLink>,
  width: number,
  height: number,
  nodeWidth: number,
  padding: number,
  colorOf: (node: CnSankeyNode, index: number) => string,
) => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const valid = links.filter(
    (l) => byId.has(l.source) && byId.has(l.target) && l.value > 0 && l.source !== l.target,
  );
  // Nivel = camino más largo desde un origen (evita ciclos con límite de iteraciones).
  const level = new Map(nodes.map((n) => [n.id, 0]));
  for (let pass = 0; pass < nodes.length; pass += 1) {
    let changed = false;
    for (const link of valid) {
      const next = (level.get(link.source) ?? 0) + 1;
      if (next > (level.get(link.target) ?? 0) && next < nodes.length) {
        level.set(link.target, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const inSum = new Map<string, number>();
  const outSum = new Map<string, number>();
  for (const link of valid) {
    outSum.set(link.source, (outSum.get(link.source) ?? 0) + link.value);
    inSum.set(link.target, (inSum.get(link.target) ?? 0) + link.value);
  }
  const maxLevel = Math.max(0, ...level.values());
  const columns: string[][] = Array.from({ length: maxLevel + 1 }, () => []);
  nodes.forEach((n) => columns[level.get(n.id) ?? 0].push(n.id));
  const valueOf = (id: string) => Math.max(inSum.get(id) ?? 0, outSum.get(id) ?? 0);
  // Escala vertical común: la columna más cargada define los px por unidad.
  const scale = Math.min(
    ...columns
      .filter((col) => col.length)
      .map(
        (col) =>
          (height - padding * (col.length - 1)) /
          Math.max(
            1e-9,
            col.reduce((a, id) => a + valueOf(id), 0),
          ),
      ),
  );
  const laid = new Map<string, LaidNode>();
  columns.forEach((col, c) => {
    const total = col.reduce((a, id) => a + valueOf(id), 0) * scale + padding * (col.length - 1);
    let y = (height - total) / 2;
    const x = maxLevel === 0 ? 0 : ((width - nodeWidth) / maxLevel) * c;
    col.forEach((id) => {
      const node = byId.get(id) as CnSankeyNode;
      const h = Math.max(2, valueOf(id) * scale);
      laid.set(id, {
        ...node,
        level: c,
        value: valueOf(id),
        x,
        y,
        h,
        color: colorOf(node, nodes.indexOf(node)),
        outOffset: 0,
        inOffset: 0,
      });
      y += h + padding;
    });
  });
  // Orden de flujos por posición del extremo opuesto (menos cruces).
  const sorted = [...valid].sort((a, b) => {
    const sa = laid.get(a.source) as LaidNode;
    const sb = laid.get(b.source) as LaidNode;
    return sa.y - sb.y || (laid.get(a.target) as LaidNode).y - (laid.get(b.target) as LaidNode).y;
  });
  const paths = sorted.map((link) => {
    const s = laid.get(link.source) as LaidNode;
    const t = laid.get(link.target) as LaidNode;
    const w = link.value * scale;
    const y0 = s.y + s.outOffset + w / 2;
    const y1 = t.y + t.inOffset + w / 2;
    s.outOffset += w;
    t.inOffset += w;
    const x0 = s.x + nodeWidth;
    const x1 = t.x;
    const mx = (x0 + x1) / 2;
    return { link, s, t, w, d: `M ${x0} ${y0} C ${mx} ${y0} ${mx} ${y1} ${x1} ${y1}` };
  });
  return { nodes: Array.from(laid.values()), paths, maxLevel };
};

/** Diagrama de Sankey: flujos entre etapas o categorías. */
export const CnSankeyChart = (props: CnSankeyChartProps) => {
  const {
    nodes,
    links,
    nodeWidth = 14,
    nodePadding = 14,
    linkColor = "gradient",
    showValues = true,
    onNodeClick,
    onLinkClick,
    height = 340,
    colors,
    animate = true,
  } = props;
  const format = useFormatter(props);
  const [ref, width] = useChartWidth();
  const tooltip = useChartTooltip();
  const [focus, setFocus] = useState<string | null>(null);
  const labelSpace = 120;
  const plotWidth = Math.max(120, width - labelSpace * 2);

  const layout = useMemo(
    () =>
      layoutSankey(
        nodes,
        links,
        plotWidth,
        height - 8,
        nodeWidth,
        nodePadding,
        (node, i) => colors?.[i % colors.length] ?? resolveTone(node.tone, i),
      ),
    [nodes, links, plotWidth, height, nodeWidth, nodePadding, colors],
  );
  const isEmpty = layout.paths.length === 0;
  const related = (id: string) =>
    focus === null ||
    focus === id ||
    layout.paths.some(
      (p) =>
        (p.link.source === focus && p.link.target === id) ||
        (p.link.target === focus && p.link.source === id),
    );

  const card = cardPropsOf(props);
  return (
    <CnChartCard
      {...card}
      height={height}
      empty={!props.loading && !props.error && isEmpty}
      skeleton={
        <CnSankeyChartSkeleton
          height={height}
          levels={Math.max(2, Math.min(5, layout.maxLevel + 1))}
        />
      }
      exportData={() => ({
        columns: [
          { id: "source", header: "Origen" },
          { id: "target", header: "Destino" },
          { id: "value", header: "Valor", kind: "number" },
        ],
        rows: links.map((l) => ({
          source: nodes.find((n) => n.id === l.source)?.label ?? l.source,
          target: nodes.find((n) => n.id === l.target)?.label ?? l.target,
          value: l.value,
        })),
      })}
    >
      {() => (
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
            aria-label={typeof props.title === "string" ? props.title : "Diagrama de flujo"}
            style={{ display: "block" }}
          >
            <defs>
              {layout.paths.map((p, i) => (
                <linearGradient
                  key={i}
                  id={`cn-sankey-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={p.s.x + nodeWidth + labelSpace}
                  x2={p.t.x + labelSpace}
                >
                  <stop offset="0%" stopColor={p.s.color} />
                  <stop offset="100%" stopColor={p.t.color} />
                </linearGradient>
              ))}
            </defs>
            <g transform={`translate(${labelSpace}, 4)`}>
              {layout.paths.map((p, i) => {
                const active =
                  focus === null ||
                  focus === p.link.source ||
                  focus === p.link.target ||
                  focus === `link-${i}`;
                const stroke =
                  linkColor === "gradient"
                    ? `url(#cn-sankey-${i})`
                    : linkColor === "target"
                      ? p.t.color
                      : p.s.color;
                return (
                  <path
                    key={i}
                    className="cn-enter"
                    d={p.d}
                    fill="none"
                    stroke={stroke}
                    strokeOpacity={active ? 0.45 : 0.08}
                    strokeWidth={Math.max(1, p.w)}
                    style={{
                      transition: "stroke-opacity 150ms ease",
                      cursor: onLinkClick ? "pointer" : undefined,
                    }}
                    onMouseEnter={() => setFocus(`link-${i}`)}
                    onMouseMove={(event) =>
                      tooltip.show(event, {
                        title: `${p.s.label ?? p.s.id} → ${p.t.label ?? p.t.id}`,
                        rows: [
                          { label: "Flujo", value: format(p.link.value), color: p.s.color },
                          {
                            label: `% de ${p.s.label ?? p.s.id}`,
                            value: `${((p.link.value / (p.s.value || 1)) * 100).toFixed(1)} %`,
                          },
                        ],
                      })
                    }
                    onMouseLeave={() => {
                      setFocus(null);
                      tooltip.hide();
                    }}
                    onClick={() => onLinkClick?.(p.link)}
                  />
                );
              })}
              {layout.nodes.map((node) => {
                const dim = !related(node.id);
                const isFirst = node.level === 0;
                const isLast = node.level === layout.maxLevel;
                const labelX = isLast
                  ? node.x + nodeWidth + 8
                  : isFirst
                    ? node.x - 8
                    : node.x + nodeWidth + 8;
                const anchor = isFirst && !isLast ? "end" : "start";
                return (
                  <g
                    key={node.id}
                    className="cn-enter"
                    opacity={dim ? 0.35 : 1}
                    style={{
                      transition: "opacity 150ms ease",
                      cursor: onNodeClick ? "pointer" : undefined,
                    }}
                    onMouseEnter={() => setFocus(node.id)}
                    onMouseMove={(event) =>
                      tooltip.show(event, {
                        title: node.label ?? node.id,
                        rows: [{ label: "Total", value: format(node.value), color: node.color }],
                      })
                    }
                    onMouseLeave={() => {
                      setFocus(null);
                      tooltip.hide();
                    }}
                    onClick={() => onNodeClick?.(node)}
                  >
                    <rect
                      x={node.x}
                      y={node.y}
                      width={nodeWidth}
                      height={node.h}
                      rx={3}
                      fill={node.color}
                    />
                    <text
                      x={labelX}
                      y={node.y + node.h / 2 - (showValues ? 6 : 0)}
                      textAnchor={anchor}
                      dominantBaseline="central"
                      fontSize={12}
                      fontWeight={700}
                      fill="var(--cn-color-text-primary, #111418)"
                    >
                      {node.label ?? node.id}
                    </text>
                    {showValues && (
                      <text
                        x={labelX}
                        y={node.y + node.h / 2 + 9}
                        textAnchor={anchor}
                        dominantBaseline="central"
                        fontSize={11}
                        fill="var(--cn-color-text-muted, #6e7682)"
                      >
                        {format(node.value)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
          {tooltip.layer}
        </Box>
      )}
    </CnChartCard>
  );
};
