import Box from "@mui/material/Box";
import { useMemo } from "react";
import { CnChartCard } from "./CnChartCard";
import { CnHeatmapSkeleton } from "./CnChartSkeleton";
import type { CnChartCommonProps } from "./chart-common";
import { cardPropsOf, useFormatter } from "./chart-common";
import { enterSx, useChartTooltip } from "./chart-custom";
import type { CnSequentialScale } from "./chart-theme";
import {
  CN_DIVERGING_SCALE,
  CN_SEQUENTIAL_SCALES,
  interpolateScale,
  readableTextOn,
} from "./chart-theme";
import { useChartWidth } from "./use-chart-width";

export type CnHeatmapCell = { x: string | number; y: string | number; value: number | null };
export type CnCalendarCell = { date: string | Date; value: number | null };

export type CnHeatmapProps = Omit<CnChartCommonProps, "legend" | "colors"> & {
  /** Rejilla de categorías (x × y) o calendario de días. */
  variant?: "grid" | "calendar";
  data: ReadonlyArray<CnHeatmapCell | CnCalendarCell>;
  /** Orden de columnas/filas (por defecto, orden de aparición). */
  xLabels?: ReadonlyArray<string | number>;
  yLabels?: ReadonlyArray<string | number>;
  /** Escala secuencial de Canek o lista de colores. */
  scale?: CnSequentialScale | ReadonlyArray<string>;
  /** Escala divergente centrada en `center` (p. ej. variaciones ±). */
  diverging?: boolean;
  center?: number;
  min?: number;
  max?: number;
  /** Muestra el valor dentro de cada celda. */
  cellLabels?: boolean;
  gap?: number;
  radius?: number;
  /** Barra de escala de color. */
  showScale?: boolean;
  /** Calendario: primer día de la semana (0 = domingo, 1 = lunes). */
  weekStart?: 0 | 1;
  xLabel?: string;
  yLabel?: string;
  onCellClick?: (cell: { x: string | number; y: string | number; value: number | null }) => void;
};

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const toDate = (value: string | Date) => {
  if (value instanceof Date) return value;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Mapa de calor de categorías o calendario de actividad. */
export const CnHeatmap = (props: CnHeatmapProps) => {
  const {
    variant = "grid",
    data,
    xLabels,
    yLabels,
    scale = "primary",
    diverging = false,
    center = 0,
    min: minProp,
    max: maxProp,
    cellLabels = variant === "grid",
    gap = variant === "calendar" ? 3 : 2,
    radius = variant === "calendar" ? 3 : 4,
    showScale = true,
    weekStart = 1,
    xLabel,
    yLabel,
    onCellClick,
    height: heightProp,
    animate = true,
  } = props;
  const format = useFormatter(props);
  const [ref, width] = useChartWidth();
  const tooltip = useChartTooltip();
  const calendar = variant === "calendar";

  const model = useMemo(() => {
    if (calendar) {
      const cells = (data as CnCalendarCell[]).map((c) => ({
        date: toDate(c.date),
        value: c.value,
      }));
      if (!cells.length)
        return {
          columns: [],
          rows: [],
          values: new Map<string, number | null>(),
          months: [] as { col: number; label: string }[],
        };
      const times = cells.map((c) => c.date.getTime());
      const start = new Date(Math.min(...times));
      const end = new Date(Math.max(...times));
      const offset = (start.getDay() - weekStart + 7) % 7;
      start.setDate(start.getDate() - offset);
      const values = new Map(cells.map((c) => [dayKey(c.date), c.value]));
      const weeks: Date[][] = [];
      const cursor = new Date(start);
      while (cursor <= end) {
        const week: Date[] = [];
        for (let i = 0; i < 7; i += 1) {
          week.push(new Date(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }
        weeks.push(week);
      }
      const months: { col: number; label: string }[] = [];
      weeks.forEach((week, col) => {
        const firstOfMonth = week.find((d) => d.getDate() === 1);
        if (firstOfMonth || col === 0) {
          const ref = firstOfMonth ?? week[0];
          months.push({ col, label: MONTHS[ref.getMonth()] });
        }
      });
      return {
        columns: weeks.map((_, i) => i),
        rows: Array.from({ length: 7 }, (_, i) => WEEKDAYS[(i + weekStart) % 7]),
        weeks,
        values,
        months,
      };
    }
    const cells = data as CnHeatmapCell[];
    const cols = xLabels ? [...xLabels] : Array.from(new Set(cells.map((c) => c.x)));
    const rows = yLabels ? [...yLabels] : Array.from(new Set(cells.map((c) => c.y)));
    const values = new Map(cells.map((c) => [`${c.x}¦${c.y}`, c.value]));
    return { columns: cols, rows, values, months: [] as { col: number; label: string }[] };
  }, [calendar, data, xLabels, yLabels, weekStart]);

  const numeric = Array.from(model.values.values()).filter(
    (v): v is number => typeof v === "number",
  );
  const min = minProp ?? (numeric.length ? Math.min(...numeric) : 0);
  const max = maxProp ?? (numeric.length ? Math.max(...numeric) : 1);
  const colors = diverging
    ? CN_DIVERGING_SCALE
    : typeof scale === "string"
      ? CN_SEQUENTIAL_SCALES[scale as CnSequentialScale]
      : (scale as string[]);
  const colorOf = (value: number | null | undefined) => {
    if (value == null) return "var(--cn-color-neutral-100, #f4f5f7)";
    if (diverging) {
      const span = Math.max(Math.abs(max - center), Math.abs(center - min)) || 1;
      return interpolateScale(colors, 0.5 + (value - center) / (2 * span));
    }
    return interpolateScale(colors, (value - min) / (max - min || 1));
  };

  const left = yLabel || model.rows.length ? (calendar ? 34 : 86) : 0;
  const top = calendar ? 18 : 0;
  const bottom = calendar ? 0 : 26;
  const cols = model.columns.length;
  const rows = model.rows.length;
  const cell = calendar ? Math.max(8, Math.min(18, (width - left) / Math.max(1, cols))) : 0;
  const cellW = calendar ? cell : (width - left) / Math.max(1, cols);
  const plotHeight =
    heightProp ?? (calendar ? top + cell * 7 + 8 : Math.max(180, rows * 34 + bottom));
  const cellH = calendar ? cell : (plotHeight - bottom - top) / Math.max(1, rows);
  const isEmpty = numeric.length === 0;

  const card = cardPropsOf(props);
  return (
    <CnChartCard
      {...card}
      height={plotHeight}
      empty={!props.loading && !props.error && isEmpty}
      skeleton={
        <CnHeatmapSkeleton
          variant={variant}
          rows={calendar ? 7 : Math.min(10, rows || 6)}
          columns={calendar ? Math.min(53, cols || 26) : Math.min(14, cols || 10)}
          height={plotHeight}
        />
      }
      exportData={() => ({
        columns: calendar
          ? [
              { id: "date", header: "Fecha", kind: "date" },
              { id: "value", header: "Valor", kind: "number" },
            ]
          : [
              { id: "y", header: yLabel ?? "Fila" },
              ...model.columns.map((c, i) => ({
                id: `c${i}`,
                header: String(c),
                kind: "number" as const,
              })),
            ],
        rows: calendar
          ? (data as CnCalendarCell[]).map((c) => ({
              date: dayKey(toDate(c.date)),
              value: c.value,
            }))
          : model.rows.map((r) => ({
              y: String(r),
              ...Object.fromEntries(
                model.columns.map((c, i) => [`c${i}`, model.values.get(`${c}¦${r}`) ?? null]),
              ),
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
            height={plotHeight}
            role="img"
            aria-label={typeof props.title === "string" ? props.title : "Mapa de calor"}
            style={{ display: "block" }}
          >
            {calendar &&
              model.months.map((m) => (
                <text
                  key={m.col}
                  x={left + m.col * cellW}
                  y={11}
                  fontSize={10}
                  fontWeight={600}
                  fill="var(--cn-color-neutral-500, #6e7682)"
                >
                  {m.label}
                </text>
              ))}
            {model.rows.map((label, r) =>
              calendar && r % 2 === 1 ? null : (
                <text
                  key={`r-${r}`}
                  x={left - 8}
                  y={top + r * cellH + cellH / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={calendar ? 9 : 11}
                  fill="var(--cn-color-neutral-500, #6e7682)"
                >
                  {String(label)}
                </text>
              ),
            )}
            {!calendar &&
              model.columns.map((label, c) => (
                <text
                  key={`c-${c}`}
                  x={left + c * cellW + cellW / 2}
                  y={plotHeight - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--cn-color-neutral-500, #6e7682)"
                >
                  {String(label)}
                </text>
              ))}
            {calendar && "weeks" in model
              ? (model.weeks as Date[][]).map((week, c) =>
                  week.map((day, r) => {
                    const key = dayKey(day);
                    const value = model.values.get(key);
                    if (value === undefined) return null;
                    return (
                      <rect
                        key={key}
                        className="cn-enter"
                        x={left + c * cellW}
                        y={top + r * cellH}
                        width={Math.max(1, cellW - gap)}
                        height={Math.max(1, cellH - gap)}
                        rx={radius}
                        fill={colorOf(value)}
                        style={{
                          cursor: onCellClick ? "pointer" : undefined,
                          animationDelay: `${Math.min(400, c * 6)}ms`,
                        }}
                        onMouseMove={(event) =>
                          tooltip.show(event, {
                            title: day.toLocaleDateString("es-MX", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }),
                            rows: [{ label: "Valor", value: format(value), color: colorOf(value) }],
                          })
                        }
                        onMouseLeave={tooltip.hide}
                        onClick={() => onCellClick?.({ x: key, y: WEEKDAYS[day.getDay()], value })}
                      />
                    );
                  }),
                )
              : model.rows.map((row, r) =>
                  model.columns.map((col, c) => {
                    const value = model.values.get(`${col}¦${row}`);
                    const fill = colorOf(value);
                    return (
                      <g key={`${r}-${c}`}>
                        <rect
                          className="cn-enter"
                          x={left + c * cellW}
                          y={top + r * cellH}
                          width={Math.max(1, cellW - gap)}
                          height={Math.max(1, cellH - gap)}
                          rx={radius}
                          fill={fill}
                          style={{
                            cursor: onCellClick ? "pointer" : undefined,
                            animationDelay: `${Math.min(400, (r + c) * 12)}ms`,
                          }}
                          onMouseMove={(event) =>
                            tooltip.show(event, {
                              title: `${yLabel ? `${yLabel}: ` : ""}${row} · ${xLabel ? `${xLabel}: ` : ""}${col}`,
                              rows: [{ label: "Valor", value: format(value ?? null), color: fill }],
                            })
                          }
                          onMouseLeave={tooltip.hide}
                          onClick={() => onCellClick?.({ x: col, y: row, value: value ?? null })}
                        />
                        {cellLabels && value != null && cellW > 34 && cellH > 18 && (
                          <text
                            x={left + c * cellW + (cellW - gap) / 2}
                            y={top + r * cellH + (cellH - gap) / 2}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={11}
                            fontWeight={700}
                            fill={fill.startsWith("var(") ? "#6e7682" : readableTextOn(fill)}
                            style={{ pointerEvents: "none" }}
                          >
                            {format(value)}
                          </text>
                        )}
                      </g>
                    );
                  }),
                )}
          </svg>
          {showScale && !isEmpty && (
            <Box
              data-cn-chart-ignore
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "8px",
                mt: "8px",
                fontSize: "11px",
                color: "var(--cn-color-neutral-500, #6e7682)",
              }}
            >
              <span>
                {calendar
                  ? "Menos"
                  : format(
                      diverging
                        ? center - Math.max(Math.abs(max - center), Math.abs(center - min))
                        : min,
                    )}
              </span>
              <Box
                sx={{
                  width: 140,
                  height: 8,
                  borderRadius: "999px",
                  background: `linear-gradient(90deg, ${colors.join(", ")})`,
                }}
              />
              <span>
                {calendar
                  ? "Más"
                  : format(
                      diverging
                        ? center + Math.max(Math.abs(max - center), Math.abs(center - min))
                        : max,
                    )}
              </span>
            </Box>
          )}
          {tooltip.layer}
        </Box>
      )}
    </CnChartCard>
  );
};

/** Calendario de actividad (tipo contribuciones). */
export const CnCalendarHeatmap = (props: Omit<CnHeatmapProps, "variant">) => (
  <CnHeatmap {...props} variant="calendar" />
);
