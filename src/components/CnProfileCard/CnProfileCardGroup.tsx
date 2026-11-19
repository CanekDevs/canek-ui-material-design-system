import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { Fragment, useMemo, useState } from "react";
import { CnButton } from "../CnButton";
import type { CnTone } from "../../utils/tones";
import type { CnSectionCardEmptyState, CnSectionCardVariant } from "../CnSectionCard";
import { CnSectionCard } from "../CnSectionCard";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type {
  CnProfileCardLayout,
  CnProfileCardProps,
  CnProfileCardVariant,
} from "./CnProfileCard";
import { CnProfileCard } from "./CnProfileCard";
import { ProfileCardSkeletonBody } from "./CnProfileCardSkeleton";
import { resolvePersonEvent } from "./person-event";

export type CnProfileCardGroupItem = CnProfileCardProps & { id?: string | number };

export type CnProfileCardGroupProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: string | ReactNode;
  iconTone?: CnTone;
  people: CnProfileCardGroupItem[];
  /** `list`: filas compactas. `grid`: tarjetas verticales en cuadrícula. */
  layout?: "list" | "grid";
  /** Layout de cada tarjeta (por defecto `compact` en lista y `vertical` en cuadrícula). */
  cardLayout?: CnProfileCardLayout;
  cardVariant?: CnProfileCardVariant;
  /** Ancho mínimo de cada columna en cuadrícula (px). */
  minCardWidth?: number;
  /** `upcoming`: hoy primero, luego próximos y al final los pasados. */
  sort?: "upcoming" | "date" | "none";
  /** Solo eventos de ese mes (0–11) o del mes actual. */
  month?: number | "current";
  /** Agrupa con subtítulos "Hoy", "Próximos días", "Más adelante", "Pasados". */
  groupByProximity?: boolean;
  /** Muestra solo N y un botón "Ver todos". */
  maxVisible?: number;
  showAllLabel?: (total: number) => string;
  showLessLabel?: string;
  emptyState?: CnSectionCardEmptyState;
  headerActions?: ReactNode;
  footer?: ReactNode;
  variant?: CnSectionCardVariant;
  collapsible?: boolean;
  /** Tarjeta personalizada. */
  renderItem?: (person: CnProfileCardGroupItem, index: number) => ReactNode;
  today?: Date;
  /** Cargando: skeleton de N personas manteniendo el encabezado. */
  loading?: boolean;
  loadingCount?: number;
  /** Skeleton completo (encabezado incluido). */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

type Bucket = "today" | "soon" | "later" | "past" | "none";
const BUCKET_LABELS: Record<Bucket, string> = {
  today: "Hoy",
  soon: "Próximos días",
  later: "Más adelante",
  past: "Pasados",
  none: "Sin fecha",
};

const bucketOf = (days: number | null): Bucket => {
  if (days === null) return "none";
  if (days === 0) return "today";
  if (days < 0) return "past";
  return days <= 7 ? "soon" : "later";
};

/**
 * Lista de personas con eventos ("Cumpleaños del mes", "Nuevos ingresos"):
 * ordena por proximidad, filtra por mes, agrupa y resume con "Ver todos".
 */
export const CnProfileCardGroup = ({
  title,
  subtitle,
  icon,
  iconTone,
  people,
  layout = "list",
  cardLayout,
  cardVariant,
  minCardWidth = 200,
  sort = "upcoming",
  month,
  groupByProximity = false,
  maxVisible,
  showAllLabel = (total) => `Ver todos (${total})`,
  showLessLabel = "Ver menos",
  emptyState,
  headerActions,
  footer,
  variant,
  collapsible,
  renderItem,
  today,
  loading = false,
  loadingCount = 3,
  skeleton = false,
  sx,
  className,
}: CnProfileCardGroupProps) => {
  const [expanded, setExpanded] = useState(false);
  const isGrid = layout === "grid";
  const resolvedCardLayout = cardLayout ?? (isGrid ? "vertical" : "compact");

  const entries = useMemo(() => {
    const ref = today ?? new Date();
    const targetMonth = month === "current" ? ref.getMonth() : month;
    const list = people.map((person, index) => {
      const resolved = person.event ? resolvePersonEvent(person.event, ref) : null;
      return { person, index, when: resolved?.when ?? null, days: resolved?.days ?? null };
    });
    const filtered =
      targetMonth === undefined
        ? list
        : list.filter((entry) => entry.when && entry.when.getMonth() === targetMonth);
    if (sort === "none") return filtered;
    return [...filtered].sort((a, b) => {
      if (a.days === null || b.days === null) return a.days === null ? 1 : -1;
      if (sort === "date") return (a.when?.getTime() ?? 0) - (b.when?.getTime() ?? 0);
      const aPast = a.days < 0;
      const bPast = b.days < 0;
      if (aPast !== bPast) return aPast ? 1 : -1;
      return aPast ? b.days - a.days : a.days - b.days;
    });
  }, [people, today, month, sort]);

  const total = entries.length;
  const visible = maxVisible && !expanded ? entries.slice(0, maxVisible) : entries;
  const todayCount = entries.filter((e) => e.days === 0).length;

  const skeletonList = (count: number) => (
    <Box
      sx={
        isGrid
          ? {
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(min(${minCardWidth}px, 100%), 1fr))`,
              gap: "12px",
            }
          : { display: "flex", flexDirection: "column", gap: "8px" }
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <ProfileCardSkeletonBody key={i} layout={resolvedCardLayout} eyebrow={false} />
      ))}
    </Box>
  );

  if (skeleton) {
    return (
      <CnSkeletonGroup
        name="profile-card-group"
        ariaLabel="Cargando personas"
        className={className}
        sx={[
          {
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderRadius: "var(--cn-radius-lg, 12px)",
            overflow: "hidden",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            px: "16px",
            py: "14px",
            borderBottom: "1px solid var(--cn-color-border-subtle, #e9ecef)",
          }}
        >
          <SkBlock width={34} radius="var(--cn-radius-md, 8px)" />
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <SkText width="40%" size={14} />
            {subtitle && <SkText width="60%" size={12} />}
          </Box>
        </Box>
        <Box sx={{ p: "16px" }}>{skeletonList(loadingCount)}</Box>
      </CnSkeletonGroup>
    );
  }

  const renderPerson = (entry: (typeof entries)[number], i: number) =>
    renderItem ? (
      <Fragment key={entry.person.id ?? entry.index}>{renderItem(entry.person, i)}</Fragment>
    ) : (
      <CnProfileCard
        key={entry.person.id ?? entry.index}
        layout={resolvedCardLayout}
        variant={cardVariant ?? "outlined"}
        today={today}
        {...entry.person}
      />
    );

  const container = (children: ReactNode, key?: string) => (
    <Box
      key={key}
      role="list"
      sx={
        isGrid
          ? {
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(min(${minCardWidth}px, 100%), 1fr))`,
              gap: "12px",
            }
          : { display: "flex", flexDirection: "column", gap: "8px" }
      }
    >
      {children}
    </Box>
  );

  const items = (list: typeof entries) =>
    list.map((entry, i) => (
      <Box role="listitem" key={entry.person.id ?? entry.index} sx={{ minWidth: 0 }}>
        {renderPerson(entry, i)}
      </Box>
    ));

  let body: ReactNode;
  if (groupByProximity) {
    const order: Bucket[] = ["today", "soon", "later", "past", "none"];
    body = (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {order.map((bucket) => {
          const group = visible.filter((entry) => bucketOf(entry.days) === bucket);
          if (group.length === 0) return null;
          return (
            <Box key={bucket}>
              <Typography
                component="div"
                sx={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--cn-color-text-muted, #6e7682)",
                  mb: "8px",
                }}
              >
                {BUCKET_LABELS[bucket]}
              </Typography>
              {container(items(group))}
            </Box>
          );
        })}
      </Box>
    );
  } else {
    body = container(items(visible));
  }

  const toggle =
    maxVisible && total > maxVisible ? (
      <CnButton
        size="small"
        variant="text"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        {expanded ? showLessLabel : showAllLabel(total)}
      </CnButton>
    ) : null;

  return (
    <CnSectionCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconTone={iconTone}
      badge={
        title
          ? todayCount > 0
            ? { label: `${todayCount} hoy`, color: "warning", icon: "celebration" }
            : total
          : undefined
      }
      headerActions={headerActions}
      footer={
        toggle || footer ? (
          <>
            {footer}
            {toggle}
          </>
        ) : undefined
      }
      variant={variant}
      collapsible={collapsible}
      empty={!loading && total === 0}
      emptyState={{
        icon: emptyState?.icon ?? "event",
        title: emptyState?.title ?? "Sin eventos",
        description: emptyState?.description,
        action: emptyState?.action,
      }}
      className={className}
      sx={sx}
    >
      {loading ? skeletonList(loadingCount) : body}
    </CnSectionCard>
  );
};
