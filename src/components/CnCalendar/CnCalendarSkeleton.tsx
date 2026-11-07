import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnCalendarView } from "./CnCalendar";

export type CnCalendarSkeletonProps = CnSkeletonCommonProps & {
  /** Vista visible: días (cuadrícula), meses (3×4) o años (4 columnas). */
  view?: CnCalendarView;
  /** Vistas disponibles: con más de una, el título lleva el selector de vista. */
  views?: CnCalendarView[];
  /** `range` dibuja una banda de rango seleccionada. */
  mode?: "single" | "range";
  /** Meses visibles en la vista de días. */
  months?: 1 | 2;
  /** Filas de semanas por mes (el calendario siempre dibuja 6). */
  weeks?: 4 | 5 | 6;
  showWeekNumbers?: boolean;
};

const CELL = 36;
const GAP = 2;

/** Primer día (columna) y días de cada mes de ejemplo cuando hay dos meses. */
const MONTH_SHAPES = [
  { offset: 3, days: 30 },
  { offset: 5, days: 31 },
];

const gridButton = (key: number) => (
  <Box
    key={key}
    sx={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
  >
    <SkText width={28 + ((key * 7) % 10)} size={12} />
  </Box>
);

/** Skeleton de `CnCalendar`: encabezado con flechas, días de la semana y cuadrícula por vista. */
export const CnCalendarSkeleton = ({
  view = "day",
  views = ["day", "month", "year"],
  mode = "single",
  months = 1,
  weeks = 6,
  showWeekNumbers = false,
  animation,
  ariaLabel = "Cargando calendario",
  sx,
  className,
}: CnCalendarSkeletonProps) => {
  const hasViewSwitch = views.length > 1 && (views.includes("year") || views.includes("month"));
  const visibleMonths = view === "day" ? months : 1;

  const header = (index: number) => (
    <Box
      data-cn-calendar-skeleton-header
      sx={{ display: "flex", alignItems: "center", gap: "4px", minHeight: 36 }}
    >
      {index === 0 && view === "day" ? <SkBlock circle width={28} /> : <Box sx={{ width: 28 }} />}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <SkText width={view === "day" ? 112 : 44} size={14} />
        {hasViewSwitch && index === 0 && <SkBlock width={10} height={6} radius={2} />}
      </Box>
      {index === visibleMonths - 1 && view === "day" ? (
        <SkBlock circle width={28} />
      ) : (
        <Box sx={{ width: 28 }} />
      )}
    </Box>
  );

  const cell = (
    key: string,
    content: "day" | "empty" | "range-start" | "range-mid" | "range-end",
  ) => (
    <Box
      key={key}
      data-cn-calendar-skeleton-day={content === "empty" ? undefined : content}
      sx={{
        width: CELL,
        height: CELL,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {content === "range-mid" ? (
        <SkBlock width={CELL + GAP} height={CELL - 4} radius={0} sx={{ opacity: 0.6 }} />
      ) : content === "range-start" || content === "range-end" ? (
        <SkBlock circle width={CELL - 4} />
      ) : content === "day" ? (
        <SkText width={14} size={12} />
      ) : null}
    </Box>
  );

  const monthGrid = (index: number) => {
    // Un mes: semanas completas (con días de meses vecinos). Dos meses: forma real con huecos.
    const shape = months === 2 ? MONTH_SHAPES[index] : { offset: 0, days: weeks * 7 };
    const totalWeeks = weeks;
    // Rango de ejemplo de una semana (días 10 a 16 del primer mes).
    const rangeFrom = shape.offset + 9;
    const rangeTo = shape.offset + 15;

    return (
      <Box key={index} sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {header(index)}
        <Box
          data-cn-calendar-skeleton-grid
          sx={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}
        >
          <Box sx={{ display: "flex", gap: `${GAP}px` }}>
            {showWeekNumbers && <Box sx={{ width: CELL }} />}
            {Array.from({ length: 7 }, (_, d) => (
              <Box
                key={d}
                sx={{
                  width: CELL,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SkText width={14} size={11} />
              </Box>
            ))}
          </Box>
          {Array.from({ length: totalWeeks }, (_, w) => (
            <Box key={w} data-cn-calendar-skeleton-week sx={{ display: "flex", gap: `${GAP}px` }}>
              {showWeekNumbers && (
                <Box
                  sx={{
                    width: CELL,
                    height: CELL,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SkText width={12} size={11} />
                </Box>
              )}
              {Array.from({ length: 7 }, (_, d) => {
                const i = w * 7 + d;
                const outside = i < shape.offset || i >= shape.offset + shape.days;
                if (outside && months === 2) return cell(`${w}-${d}`, "empty");
                if (mode === "range" && index === 0) {
                  if (i === rangeFrom) return cell(`${w}-${d}`, "range-start");
                  if (i === rangeTo) return cell(`${w}-${d}`, "range-end");
                  if (i > rangeFrom && i < rangeTo) return cell(`${w}-${d}`, "range-mid");
                }
                return cell(`${w}-${d}`, "day");
              })}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <CnSkeletonGroup
      name="calendar"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          display: "inline-flex",
          flexDirection: "column",
          p: "8px",
          minWidth: 7 * CELL + 6 * GAP + 16 + (showWeekNumbers ? CELL + GAP : 0),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {view === "day" && (
        <Box sx={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {Array.from({ length: visibleMonths }, (_, i) => monthGrid(i))}
        </Box>
      )}
      {view === "month" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {header(0)}
          <Box
            data-cn-calendar-skeleton-list="month"
            sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}
          >
            {Array.from({ length: 12 }, (_, i) => gridButton(i))}
          </Box>
        </Box>
      )}
      {view === "year" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {header(0)}
          <Box
            data-cn-calendar-skeleton-list="year"
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "6px",
              maxHeight: 236,
              overflow: "hidden",
              pr: "4px",
            }}
          >
            {Array.from({ length: 24 }, (_, i) => gridButton(i))}
          </Box>
        </Box>
      )}
    </CnSkeletonGroup>
  );
};
