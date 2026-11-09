import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";
import type { CnEventCalendarView } from "./CnEventCalendar.types";

export type CnEventCalendarSkeletonProps = CnSkeletonCommonProps & {
  view?: CnEventCalendarView;
  /** Barra superior (hoy, flechas, título, selector de vista). */
  toolbar?: boolean;
  /** Fila de categorías. */
  legend?: boolean;
  /** Semanas del mes. */
  weeks?: 4 | 5 | 6;
  /** Días en la vista semanal. */
  days?: number;
  /** Mes compacto (puntos). */
  compact?: boolean;
  /** Solo el cuerpo (lo usa el calendario cuando `loading`). */
  bodyOnly?: boolean;
  /** Marco de tarjeta. */
  frame?: "card" | "outlined" | "plain";
  /** Alto del área horaria (semana/día). */
  height?: number;
  /** Barra lateral (mini mes, calendarios y próximos). */
  sidebar?: boolean;
  /** Meses de la vista "multiMonth". */
  multiMonthCount?: number;
  /** Filas de recursos de la vista "timeline". */
  rows?: number;
};

const border = "1px solid var(--cn-color-border, #dde0e4)";

/** Barras de evento de ejemplo por semana: [columna inicial, columnas, fila]. */
const MONTH_BARS: [number, number, number][][] = [
  [
    [1, 3, 0],
    [5, 1, 1],
  ],
  [
    [0, 1, 0],
    [2, 1, 0],
    [3, 4, 1],
  ],
  [
    [1, 2, 0],
    [4, 1, 0],
    [6, 1, 1],
  ],
  [
    [0, 5, 0],
    [2, 1, 1],
  ],
  [
    [3, 1, 0],
    [5, 2, 0],
  ],
  [[1, 1, 0]],
];

/** Bloques de semana: [columna, inicio (h), duración (h)]. */
const WEEK_BLOCKS: [number, number, number][] = [
  [0, 1, 1.5],
  [1, 2.5, 1],
  [2, 0.5, 2],
  [3, 3, 1],
  [4, 1.5, 1.5],
  [5, 4, 1],
  [6, 2, 1],
];

/**
 * Skeleton de `CnEventCalendar` por vista: mes con barras, semana con bloques,
 * agenda, año, varios meses, recursos (filas con barras) y barra lateral.
 */
export const CnEventCalendarSkeleton = ({
  view = "month",
  toolbar = true,
  legend = false,
  weeks = 5,
  days = 7,
  compact = false,
  bodyOnly = false,
  frame = "card",
  height = 420,
  sidebar = false,
  multiMonthCount = 3,
  rows = 5,
  animation,
  ariaLabel = "Cargando calendario",
  sx,
  className,
}: CnEventCalendarSkeletonProps) => {
  const toolbarBlock = (
    <Box
      data-cn-event-calendar-skeleton-toolbar
      sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", mb: "14px" }}
    >
      <SkBlock width={56} height={32} radius={8} />
      <SkBlock circle width={30} />
      <SkBlock circle width={30} />
      <SkText width={150} size={18} sx={{ ml: "6px" }} />
      <Box sx={{ flex: 1 }} />
      <SkBlock width={220} height={32} radius={10} sx={{ display: { xs: "none", sm: "block" } }} />
      <SkBlock width={120} height={32} radius={8} />
    </Box>
  );

  const legendBlock = (
    <Box sx={{ display: "flex", gap: "8px", mb: "12px", flexWrap: "wrap" }}>
      {Array.from({ length: 4 }, (_, i) => (
        <SkBlock key={i} width={70 + ((i * 23) % 40)} height={24} radius={999} />
      ))}
    </Box>
  );

  const weekdayHeader = (cols: number) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        borderBottom: border,
      }}
    >
      {Array.from({ length: cols }, (_, i) => (
        <Box key={i} sx={{ py: "9px", display: "flex", justifyContent: "center" }}>
          <SkText width={26} size={11} />
        </Box>
      ))}
    </Box>
  );

  const month = compact ? (
    <Box data-cn-event-calendar-skeleton="month" data-compact>
      {weekdayHeader(7)}
      {Array.from({ length: weeks }, (_, w) => (
        <Box
          key={w}
          data-cn-event-calendar-skeleton-week
          sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
        >
          {Array.from({ length: 7 }, (_, d) => (
            <Box
              key={d}
              sx={{
                height: 44,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              <SkText width={14} size={12} />
              {(w * 7 + d) % 3 === 0 && <SkBlock circle width={5} />}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  ) : (
    <Box
      data-cn-event-calendar-skeleton="month"
      sx={{ border, borderRadius: "10px", overflow: "hidden" }}
    >
      {weekdayHeader(7)}
      {Array.from({ length: weeks }, (_, w) => (
        <Box
          key={w}
          data-cn-event-calendar-skeleton-week
          sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            height: 104,
            borderBottom: w < weeks - 1 ? border : 0,
          }}
        >
          {Array.from({ length: 7 }, (_, d) => (
            <Box key={d} sx={{ p: "8px", borderRight: d < 6 ? border : 0 }}>
              <SkText width={16} size={12} />
            </Box>
          ))}
          {MONTH_BARS[w % MONTH_BARS.length].map(([col, span, lane], i) => (
            <Box
              key={i}
              data-cn-event-calendar-skeleton-bar
              sx={{
                position: "absolute",
                top: 32 + lane * 22,
                left: `calc(${(col / 7) * 100}% + 4px)`,
                width: `calc(${(span / 7) * 100}% - 8px)`,
              }}
            >
              <SkBlock width="100%" height={18} radius={5} />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );

  const cols = view === "day" ? 1 : Math.max(1, days);
  const timeGrid = (
    <Box
      data-cn-event-calendar-skeleton={view}
      sx={{ border, borderRadius: "10px", overflow: "hidden" }}
    >
      <Box
        sx={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr)", borderBottom: border }}
      >
        <Box />
        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }, (_, i) => (
            <Box
              key={i}
              sx={{
                py: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <SkText width={24} size={10} />
              <SkBlock circle width={26} />
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr)", height }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            pr: "8px",
            pt: "40px",
            gap: "34px",
          }}
        >
          {Array.from({ length: Math.floor(height / 48) - 1 }, (_, i) => (
            <SkText key={i} width={28} size={10} />
          ))}
        </Box>
        <Box
          sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            backgroundImage:
              "linear-gradient(to bottom, var(--cn-color-border-subtle, #eceef1) 1px, transparent 1px)",
            backgroundSize: "100% 48px",
          }}
        >
          {Array.from({ length: cols }, (_, c) => (
            <Box key={c} sx={{ position: "relative", borderLeft: border }}>
              {WEEK_BLOCKS.filter(([col]) => (view === "day" ? col < 3 : col === c % 7)).map(
                ([, start, dur], i) => (
                  <Box
                    key={i}
                    data-cn-event-calendar-skeleton-block
                    sx={{
                      position: "absolute",
                      top: start * 48 * (view === "day" ? 1 + i : 1),
                      left: view === "day" ? `${i * 33}%` : 4,
                      width: view === "day" ? "31%" : "calc(100% - 8px)",
                      height: dur * 48 - 4,
                    }}
                  >
                    <SkBlock width="100%" height="100%" radius={6} />
                  </Box>
                ),
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );

  const agenda = (
    <Box
      data-cn-event-calendar-skeleton="agenda"
      sx={{ display: "flex", flexDirection: "column", gap: "14px" }}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} data-cn-event-calendar-skeleton-day sx={{ display: "flex", gap: "14px" }}>
          <Box
            sx={{
              width: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <SkText width={24} size={10} />
            <SkBlock circle width={32} />
          </Box>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            {Array.from({ length: 1 + (i % 2) }, (_, j) => (
              <Box
                key={j}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  p: "10px 12px",
                  border,
                  borderRadius: "10px",
                }}
              >
                <SkText width={70} size={11} />
                <Box sx={{ flex: 1 }}>
                  <SkText width={varyWidth(i + j, 40, 35)} size={13} />
                  <SkText width={varyWidth(i + j + 2, 20, 20)} size={10} sx={{ mt: "6px" }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );

  const months = view === "quarter" ? 3 : 12;
  const year = (
    <Box
      data-cn-event-calendar-skeleton={view}
      sx={{
        display: "grid",
        gridTemplateColumns:
          view === "quarter"
            ? { xs: "1fr", md: "repeat(3, 1fr)" }
            : { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
        gap: "14px",
      }}
    >
      {Array.from({ length: months }, (_, m) => (
        <Box
          key={m}
          data-cn-event-calendar-skeleton-month
          sx={{ p: "10px", border, borderRadius: "12px" }}
        >
          <SkText width={70} size={13} sx={{ mb: "8px" }} />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
            {Array.from({ length: 35 }, (_, d) => (
              <SkBlock
                key={d}
                width="100%"
                height={20}
                radius={5}
                sx={{ opacity: 0.35 + (((m + d) * 7) % 5) * 0.13 }}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );

  const timeline = (
    <Box
      data-cn-event-calendar-skeleton="timeline"
      sx={{ border, borderRadius: "10px", overflow: "hidden" }}
    >
      <Box sx={{ display: "flex", borderBottom: border, height: 44 }}>
        <Box sx={{ width: 180, flexShrink: 0, borderRight: border, p: "14px 12px" }}>
          <SkText width={60} size={11} />
        </Box>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            gap: "6%",
            px: "10px",
            pb: "8px",
          }}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <SkText key={i} width={28} size={10} />
          ))}
        </Box>
      </Box>
      {Array.from({ length: rows }, (_, r) => (
        <Box
          key={r}
          data-cn-event-calendar-skeleton-resource
          sx={{ display: "flex", height: 48, borderBottom: r < rows - 1 ? border : 0 }}
        >
          <Box
            sx={{
              width: 180,
              flexShrink: 0,
              borderRight: border,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              px: "12px",
            }}
          >
            <SkBlock circle width={30} />
            <Box sx={{ flex: 1 }}>
              <SkText width={varyWidth(r, 60, 30)} size={12} />
              <SkText width={40} size={9} sx={{ mt: "5px" }} />
            </Box>
          </Box>
          <Box
            sx={{
              position: "relative",
              flex: 1,
              backgroundImage:
                "linear-gradient(to right, var(--cn-color-border-subtle, #eceef1) 1px, transparent 1px)",
              backgroundSize: "12.5% 100%",
            }}
          >
            {[0, 1].map((k) => (
              <Box
                key={k}
                data-cn-event-calendar-skeleton-bar
                sx={{
                  position: "absolute",
                  top: 9,
                  left: `${((r * 17 + k * 41) % 60) + 4}%`,
                  width: `${12 + ((r * 7 + k * 5) % 14)}%`,
                }}
              >
                <SkBlock width="100%" height={30} radius={6} />
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );

  const multiMonth = (
    <Box
      data-cn-event-calendar-skeleton="multiMonth"
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: multiMonthCount >= 4 ? "repeat(2, 1fr)" : "1fr",
          md: `repeat(${Math.min(multiMonthCount, multiMonthCount >= 6 ? 3 : multiMonthCount === 4 ? 2 : multiMonthCount)}, 1fr)`,
          lg: `repeat(${Math.min(multiMonthCount, 4)}, 1fr)`,
        },
        gap: "14px",
      }}
    >
      {Array.from({ length: multiMonthCount }, (_, m) => (
        <Box
          key={m}
          data-cn-event-calendar-skeleton-month
          sx={{ p: "10px", border, borderRadius: "12px" }}
        >
          <SkText width={110} size={13} sx={{ mb: "8px" }} />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
            {Array.from({ length: 35 }, (_, d) => (
              <Box
                key={d}
                sx={{
                  height: 44,
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  alignItems: "center",
                  pt: "4px",
                }}
              >
                <SkText width={12} size={9} />
                {(m + d) % 3 === 0 && <SkBlock width="90%" height={9} radius={3} />}
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );

  const sidebarBlock = (
    <Box
      data-cn-event-calendar-skeleton-sidebar
      sx={{
        width: 236,
        flexShrink: 0,
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        gap: "18px",
      }}
    >
      <Box>
        <SkText width={110} size={13} sx={{ mb: "10px" }} />
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
          {Array.from({ length: 35 }, (_, d) => (
            <SkBlock key={d} circle width={20} />
          ))}
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <SkText width={80} size={10} />
        {Array.from({ length: 3 }, (_, i) => (
          <Box key={i} sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <SkBlock width={14} height={14} radius={4} />
            <SkText width={varyWidth(i, 70, 40)} size={12} />
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkText width={70} size={10} />
        {Array.from({ length: 3 }, (_, i) => (
          <SkBlock key={i} width="100%" height={38} radius={8} />
        ))}
      </Box>
    </Box>
  );

  const body =
    view === "month"
      ? month
      : view === "week" || view === "day"
        ? timeGrid
        : view === "agenda"
          ? agenda
          : view === "timeline"
            ? timeline
            : view === "multiMonth"
              ? multiMonth
              : year;

  return (
    <CnSkeletonGroup
      name="event-calendar"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        { width: "100%" },
        !bodyOnly && frame === "card"
          ? {
              p: { xs: "12px", sm: "16px 18px" },
              border,
              borderRadius: "12px",
              backgroundColor: "var(--cn-color-surface, #fff)",
            }
          : {},
        !bodyOnly && frame === "outlined"
          ? { p: { xs: "12px", sm: "16px 18px" }, border, borderRadius: "12px" }
          : {},
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {!bodyOnly && toolbar && toolbarBlock}
      {!bodyOnly && legend && legendBlock}
      {sidebar && !bodyOnly ? (
        <Box sx={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
          {sidebarBlock}
          <Box sx={{ flex: 1, minWidth: 0 }}>{body}</Box>
        </Box>
      ) : (
        body
      )}
    </CnSkeletonGroup>
  );
};
