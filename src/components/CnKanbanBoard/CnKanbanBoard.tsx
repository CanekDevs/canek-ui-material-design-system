import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import { formatCurrency } from "../../utils/number-utils";
import type { CnTone } from "../../utils/tones";
import { CN_TONES } from "../../utils/tones";
import { CnButton } from "../CnButton";
import { CnKanbanBoardSkeleton } from "./CnKanbanBoardSkeleton";

export type CnKanbanColumn = {
  id: string;
  title: string;
  /** Color de la marca superior de la columna. */
  tone?: CnTone;
  /** Límite de tarjetas (WIP). Al pasarlo, el contador se marca. */
  limit?: number;
};

/** Lo mínimo que necesita el tablero de cada tarjeta; agrega tus datos encima. */
export type CnKanbanItem = {
  id: string;
  columnId: string;
  /** Valor que se suma en el total de la columna (monto de la oportunidad). */
  value?: number;
  /** Nombre para los anuncios de lector de pantalla. */
  label?: string;
};

export type CnKanbanCardState = { dragging: boolean; grabbed: boolean };

export type CnKanbanBoardProps<T extends CnKanbanItem> = {
  columns: readonly CnKanbanColumn[];
  /** Tarjetas; el orden dentro de cada columna es el orden del arreglo. */
  items: readonly T[];
  renderCard: (item: T, state: CnKanbanCardState) => ReactNode;
  /** Se llama al soltar una tarjeta en otra posición o columna. */
  onMove: (itemId: string, toColumnId: string, toIndex: number) => void;
  /** Bloquea destinos (etapas cerradas, permisos). */
  canDrop?: (item: T, toColumnId: string) => boolean;
  /** Muestra la suma de `value` por columna. Por defecto, si alguna tarjeta tiene valor. */
  showTotals?: boolean;
  formatTotal?: (total: number) => string;
  /** Botón "Agregar" al pie de cada columna. */
  onAddCard?: (columnId: string) => void;
  addCardLabel?: string;
  /** Ancho de cada columna, en px. */
  columnWidth?: number;
  /** Alto máximo de la lista de cada columna (se desplaza por dentro). */
  maxColumnHeight?: number | string;
  emptyColumnText?: ReactNode;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

type Placement = { id: string; columnId: string; index: number };

const defaultTotal = (total: number) => formatCurrency(total, "MXN", "es-MX", 0);

/** Tablero por columnas: arrastrar entre etapas (mouse o teclado), límites WIP y totales. */
export function CnKanbanBoard<T extends CnKanbanItem>({
  columns,
  items,
  renderCard,
  onMove,
  canDrop,
  showTotals,
  formatTotal = defaultTotal,
  onAddCard,
  addCardLabel = "Agregar",
  columnWidth = 280,
  maxColumnHeight,
  emptyColumnText = "Suelta aquí una tarjeta",
  skeleton = false,
  ariaLabel = "Tablero",
  sx,
  className,
}: CnKanbanBoardProps<T>) {
  const helpId = useId();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ columnId: string; index: number } | null>(null);
  const [grab, setGrab] = useState<{ origin: Placement; current: Placement } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const totals = showTotals ?? items.some((item) => typeof item.value === "number");
  const label = (item: T) => item.label ?? item.id;
  const columnTitle = (id: string) => columns.find((c) => c.id === id)?.title ?? id;

  /** Tarjetas por columna, con la tarjeta tomada con teclado ya en su posición provisional. */
  const lists = useMemo(() => {
    const map = new Map<string, T[]>(columns.map((c) => [c.id, []]));
    for (const item of items) {
      if (grab && item.id === grab.current.id) continue;
      map.get(item.columnId)?.push(item);
    }
    if (grab) {
      const item = byId.get(grab.current.id);
      const list = map.get(grab.current.columnId);
      if (item && list) list.splice(Math.min(grab.current.index, list.length), 0, item);
    }
    return map;
  }, [columns, items, grab, byId]);

  if (skeleton) {
    return (
      <CnKanbanBoardSkeleton
        columns={columns.length || 4}
        columnWidth={columnWidth}
        sx={sx}
        className={className}
      />
    );
  }

  const allowed = (item: T, columnId: string) => !canDrop || canDrop(item, columnId);

  const indexInColumn = (id: string, columnId: string) =>
    items.filter((i) => i.columnId === columnId).findIndex((i) => i.id === id);

  // ─── Mouse (arrastrar y soltar nativo) ─────────────────────────────
  const onDragStart = (event: DragEvent, item: T) => {
    setDragId(item.id);
    event.dataTransfer.effectAllowed = "move";
    try {
      event.dataTransfer.setData("text/plain", item.id);
    } catch {
      // Algunos navegadores no permiten datos en pruebas; el id ya vive en el estado.
    }
  };

  const onDragOverColumn = (event: DragEvent, columnId: string, index: number) => {
    const item = dragId ? byId.get(dragId) : undefined;
    if (!item || !allowed(item, columnId)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTarget?.columnId !== columnId || dropTarget.index !== index) {
      setDropTarget({ columnId, index });
    }
  };

  const onDragOverCard = (event: DragEvent<HTMLElement>, columnId: string, index: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const after = rect.height > 0 && event.clientY > rect.top + rect.height / 2;
    event.stopPropagation();
    onDragOverColumn(event, columnId, after ? index + 1 : index);
  };

  const finishDrag = () => {
    setDragId(null);
    setDropTarget(null);
  };

  const onDrop = (event: DragEvent, columnId: string) => {
    event.preventDefault();
    const item = dragId ? byId.get(dragId) : undefined;
    if (item && dropTarget && allowed(item, columnId)) {
      let index = dropTarget.index;
      // Dentro de la misma columna, quitar la tarjeta corre los índices que están debajo.
      const from = indexInColumn(item.id, columnId);
      if (item.columnId === columnId && from >= 0 && from < index) index -= 1;
      if (item.columnId !== columnId || from !== index) {
        onMove(item.id, columnId, index);
        setAnnouncement(`${label(item)} movida a ${columnTitle(columnId)}, posición ${index + 1}.`);
      }
    }
    finishDrag();
  };

  // ─── Teclado ───────────────────────────────────────────────────────
  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>, item: T) => {
    if (event.target !== event.currentTarget) return;
    const key = event.key;

    if (!grab) {
      if (key === " " || key === "Enter") {
        event.preventDefault();
        const place = {
          id: item.id,
          columnId: item.columnId,
          index: indexInColumn(item.id, item.columnId),
        };
        setGrab({ origin: place, current: place });
        setAnnouncement(
          `${label(item)} tomada en ${columnTitle(item.columnId)}. Flechas para mover, Espacio para soltar, Escape para cancelar.`,
        );
      }
      return;
    }
    if (grab.current.id !== item.id) return;

    const columnIndex = columns.findIndex((c) => c.id === grab.current.columnId);
    const size = (lists.get(grab.current.columnId)?.length ?? 1) - 1;

    if (key === "ArrowLeft" || key === "ArrowRight") {
      event.preventDefault();
      const step = key === "ArrowLeft" ? -1 : 1;
      let next = columnIndex + step;
      while (next >= 0 && next < columns.length && !allowed(item, columns[next].id)) next += step;
      if (next < 0 || next >= columns.length) return;
      const target = columns[next];
      const length = lists.get(target.id)?.length ?? 0;
      const index = Math.min(grab.current.index, length);
      setGrab({ ...grab, current: { id: item.id, columnId: target.id, index } });
      setAnnouncement(`${target.title}, posición ${index + 1} de ${length + 1}.`);
      return;
    }
    if (key === "ArrowUp" || key === "ArrowDown") {
      event.preventDefault();
      const index = Math.max(0, Math.min(size, grab.current.index + (key === "ArrowUp" ? -1 : 1)));
      setGrab({ ...grab, current: { ...grab.current, index } });
      setAnnouncement(`Posición ${index + 1} de ${size + 1}.`);
      return;
    }
    if (key === " " || key === "Enter") {
      event.preventDefault();
      const { origin, current } = grab;
      setGrab(null);
      if (origin.columnId !== current.columnId || origin.index !== current.index) {
        onMove(item.id, current.columnId, current.index);
      }
      setAnnouncement(
        `${label(item)} soltada en ${columnTitle(current.columnId)}, posición ${current.index + 1}.`,
      );
      return;
    }
    if (key === "Escape") {
      event.preventDefault();
      setGrab(null);
      setAnnouncement(
        `Movimiento cancelado. ${label(item)} vuelve a ${columnTitle(grab.origin.columnId)}.`,
      );
    }
  };

  // Al moverse con teclado entre columnas la tarjeta se vuelve a montar: recupera el foco.
  const focusGrabbed = (node: HTMLElement | null, id: string) => {
    if (node && grab?.current.id === id && document.activeElement !== node) node.focus();
  };

  return (
    <Box
      component="section"
      aria-label={ariaLabel}
      data-cn-kanban-board
      className={className}
      sx={[
        {
          minWidth: 0,
          maxWidth: "100%",
          boxSizing: "border-box",
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          pb: "8px",
          color: "var(--cn-color-text, #222831)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box id={helpId} sx={{ display: "none" }}>
        Espacio o Enter para tomar la tarjeta; flechas para moverla; Espacio para soltar; Escape
        para cancelar.
      </Box>
      <Box
        role="status"
        aria-live="assertive"
        sx={{
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        {announcement}
      </Box>

      {columns.map((column) => {
        const list = lists.get(column.id) ?? [];
        const count = list.length;
        const over = column.limit !== undefined && count > column.limit;
        const total = list.reduce((sum, item) => sum + (item.value ?? 0), 0);
        const headingId = `${helpId}-${column.id}`;
        const dragged = dragId ? byId.get(dragId) : undefined;
        const blocked = Boolean(dragged && !allowed(dragged, column.id));
        const isTarget = dropTarget?.columnId === column.id;
        const tone = CN_TONES[column.tone ?? "neutral"];

        return (
          <Box
            key={column.id}
            component="section"
            aria-labelledby={headingId}
            data-cn-kanban-column={column.id}
            onDragOver={(event: DragEvent) => onDragOverColumn(event, column.id, count)}
            onDrop={(event: DragEvent) => onDrop(event, column.id)}
            sx={{
              flex: `0 0 ${columnWidth}px`,
              width: `${columnWidth}px`,
              maxWidth: "85vw",
              minWidth: 0,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              borderRadius: "var(--cn-radius-md, 8px)",
              backgroundColor: "var(--cn-color-surface-sunken, #f4f5f7)",
              borderTop: `3px solid ${tone.main}`,
              outline: isTarget ? `2px dashed ${CN_TONES.primary.main}` : "none",
              outlineOffset: "-2px",
              opacity: blocked ? 0.55 : 1,
              transition: "opacity 120ms",
            }}
          >
            <Box sx={{ p: "12px 12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                <Box
                  component="h3"
                  id={headingId}
                  sx={{
                    m: 0,
                    flex: 1,
                    minWidth: 0,
                    fontSize: "14px",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.title}
                </Box>
                <Box
                  component="span"
                  aria-label={
                    column.limit !== undefined
                      ? `${count} de ${column.limit} tarjetas${over ? ", límite superado" : ""}`
                      : `${count} tarjetas`
                  }
                  sx={{
                    flexShrink: 0,
                    px: "8px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 500,
                    lineHeight: "20px",
                    color: over ? CN_TONES.error.text : "var(--cn-color-text-muted, #6e7682)",
                    backgroundColor: over
                      ? CN_TONES.error.soft
                      : "var(--cn-color-surface, #ffffff)",
                  }}
                >
                  {column.limit !== undefined ? `${count}/${column.limit}` : count}
                </Box>
              </Box>
              {totals && (
                <Box
                  data-cn-kanban-total
                  sx={{ fontSize: "12px", color: "var(--cn-color-text-muted, #6e7682)" }}
                >
                  {formatTotal(total)}
                </Box>
              )}
            </Box>

            <Box
              component="ul"
              aria-labelledby={headingId}
              sx={{
                listStyle: "none",
                m: 0,
                p: "4px 8px 8px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                minHeight: "64px",
                maxHeight: maxColumnHeight,
                overflowY: maxColumnHeight ? "auto" : undefined,
              }}
            >
              {list.map((item, index) => {
                const grabbed = grab?.current.id === item.id;
                const dragging = dragId === item.id;
                const showLine = isTarget && dropTarget?.index === index && dragId !== item.id;
                return (
                  <Box
                    component="li"
                    key={item.id}
                    ref={(node: HTMLElement | null) => focusGrabbed(node, item.id)}
                    tabIndex={0}
                    draggable
                    aria-roledescription="tarjeta arrastrable"
                    aria-describedby={helpId}
                    aria-grabbed={grabbed}
                    data-cn-kanban-card={item.id}
                    onDragStart={(event: DragEvent) => onDragStart(event, item)}
                    onDragEnd={finishDrag}
                    onDragOver={(event: DragEvent<HTMLElement>) =>
                      onDragOverCard(event, column.id, index)
                    }
                    onKeyDown={(event: KeyboardEvent<HTMLElement>) => onCardKeyDown(event, item)}
                    sx={{
                      position: "relative",
                      minWidth: 0,
                      borderRadius: "var(--cn-radius-md, 8px)",
                      cursor: "grab",
                      opacity: dragging ? 0.4 : 1,
                      outline: "none",
                      transform: grabbed ? "rotate(-1deg)" : undefined,
                      boxShadow: grabbed
                        ? "var(--cn-shadow-lg, 0 10px 24px rgba(15, 23, 42, 0.1))"
                        : undefined,
                      "&:focus-visible": {
                        boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(61, 90, 254, 0.35))",
                      },
                      "&::before": showLine
                        ? {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: "-6px",
                            height: "3px",
                            borderRadius: "2px",
                            backgroundColor: CN_TONES.primary.main,
                          }
                        : undefined,
                    }}
                  >
                    {renderCard(item, { dragging, grabbed })}
                  </Box>
                );
              })}
              {count === 0 && (
                <Box
                  component="li"
                  sx={{
                    p: "16px 8px",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "var(--cn-color-text-muted, #6e7682)",
                    border: "1px dashed var(--cn-color-border, #dde0e4)",
                    borderRadius: "var(--cn-radius-md, 8px)",
                  }}
                >
                  {emptyColumnText}
                </Box>
              )}
            </Box>

            {onAddCard && (
              <Box sx={{ p: "0 8px 8px" }}>
                <CnButton
                  variant="text"
                  color="neutral"
                  startIcon="add"
                  fullWidth
                  aria-label={`${addCardLabel} en ${column.title}`}
                  onClick={() => onAddCard(column.id)}
                >
                  {addCardLabel}
                </CnButton>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
