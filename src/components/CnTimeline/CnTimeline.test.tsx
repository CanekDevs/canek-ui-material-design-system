import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CnTimelineItem } from "./CnTimeline";
import { CnTimeline } from "./CnTimeline";
import { CnTimelineSkeleton } from "./CnTimelineSkeleton";
import { formatDayLabel, groupByDay } from "./timeline-utils";

const NOW = new Date(2026, 10, 19, 12, 0, 0);
const at = (days: number, hours = 0) => new Date(NOW.getTime() - days * 86400000 - hours * 3600000);

const ITEMS: CnTimelineItem[] = [
  {
    id: "1",
    title: "Factura timbrada",
    time: at(0, 1),
    icon: "receipt",
    tone: "success",
    actor: "Ana López",
  },
  { id: "2", title: "Pago registrado", time: at(1, 2), description: "SPEI 908812" },
  { id: "3", title: "Pedido creado", time: at(3) },
];

describe("timeline-utils", () => {
  it("labels days as Hoy / Ayer / fecha", () => {
    expect(formatDayLabel(at(0), NOW)).toBe("Hoy");
    expect(formatDayLabel(at(1), NOW)).toBe("Ayer");
    expect(formatDayLabel(new Date(2026, 10, 17), NOW)).toMatch(/^Martes, 17 de noviembre$/);
    expect(formatDayLabel(new Date(2025, 0, 2), NOW)).toMatch(/2025/);
  });

  it("groups keeping order and puts undated items in 'Sin fecha'", () => {
    const groups = groupByDay([...ITEMS, { id: "x", title: "?" }], (i) => i.time, NOW);
    expect(groups.map((g) => g.label)).toEqual(["Hoy", "Ayer", expect.any(String), "Sin fecha"]);
  });
});

describe("CnTimeline", () => {
  it("renders an ordered list with relative time and full date in <time>", () => {
    render(<CnTimeline items={ITEMS} now={NOW} ariaLabel="Historial" />);
    const list = screen.getByRole("list", { name: "Historial" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    const time = list.querySelector("time")!;
    expect(time).toHaveAttribute("dateTime", at(0, 1).toISOString());
    expect(time.textContent).toMatch(/hace 1 h/);
    expect(time.getAttribute("title")).toMatch(/2026/);
    expect(screen.getByText("Ana López")).toBeInTheDocument();
  });

  it("groups by day with headings", () => {
    render(<CnTimeline items={ITEMS} now={NOW} groupByDay />);
    expect(screen.getByRole("heading", { name: "Hoy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ayer" })).toBeInTheDocument();
  });

  it("marks tracking states and the current step", () => {
    render(
      <CnTimeline
        items={[
          { id: "a", title: "Recibido", status: "completed" },
          { id: "b", title: "En camino", status: "current" },
          { id: "c", title: "Entregado", status: "pending" },
        ]}
      />,
    );
    const current = screen.getByText("En camino").closest("li")!;
    expect(current).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Completado")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("renders metadata, attachments, tags and actions", () => {
    const onAction = vi.fn();
    const onFile = vi.fn();
    render(
      <CnTimeline
        items={[
          {
            id: "m",
            title: "Contrato actualizado",
            tags: ["Contratos", { label: "Crítico", color: "error" }],
            metadata: [{ label: "Campo", value: "Monto" }],
            attachments: [{ name: "contrato-v2.pdf", size: "1.2 MB", onClick: onFile }],
            actions: [{ label: "Revertir", icon: "undo", onClick: onAction }],
          },
        ]}
      />,
    );
    expect(screen.getByText("Crítico")).toBeInTheDocument();
    expect(screen.getByText("Monto")).toBeInTheDocument();
    fireEvent.click(screen.getByText("contrato-v2.pdf"));
    expect(onFile).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Revertir" }));
    expect(onAction).toHaveBeenCalled();
    expect(screen.getByRole("list", { name: "Adjuntos" })).toBeInTheDocument();
  });

  it("paginates locally with 'Ver más (n)' and then calls onLoadMore", () => {
    const onLoadMore = vi.fn();
    render(
      <CnTimeline items={ITEMS} now={NOW} initialVisible={2} hasMore onLoadMore={onLoadMore} />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Ver más (1)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Ver más" }));
    expect(onLoadMore).toHaveBeenCalled();
  });

  describe("collapsible descriptions", () => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
    afterEach(() => {
      if (original) Object.defineProperty(HTMLElement.prototype, "scrollHeight", original);
    });

    it("shows 'Ver más' when the description overflows and toggles it", () => {
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        get() {
          return this.hasAttribute?.("data-cn-timeline-description") ? 200 : 0;
        },
      });
      render(
        <CnTimeline items={[{ id: "d", title: "Nota", description: "Texto largo ".repeat(80) }]} />,
      );
      const toggle = screen.getByRole("button", { name: "Ver más" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(toggle);
      expect(screen.getByRole("button", { name: "Ver menos" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });
  });

  it("calls onItemClick from the title button", () => {
    const onItemClick = vi.fn();
    render(<CnTimeline items={ITEMS} now={NOW} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Pago registrado" }));
    expect(onItemClick).toHaveBeenCalledWith(ITEMS[1]);
  });

  it("renders horizontal and alternate layouts", () => {
    const { rerender, container } = render(
      <CnTimeline items={ITEMS} now={NOW} orientation="horizontal" />,
    );
    expect(container.querySelector('[data-cn-timeline="horizontal"]')).not.toBeNull();
    expect(screen.getByRole("region", { name: "Línea de tiempo" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    rerender(<CnTimeline items={ITEMS} now={NOW} align="alternate" />);
    expect(container.querySelector('[data-align="alternate"]')).not.toBeNull();
  });

  it("shows empty and skeleton states", () => {
    const { rerender } = render(<CnTimeline items={[]} />);
    expect(screen.getByText("Sin actividad")).toBeInTheDocument();
    rerender(<CnTimeline items={ITEMS} skeleton />);
    expect(screen.getByRole("status", { name: "Cargando actividad" })).toBeInTheDocument();
  });

  it("handles extreme data (long words, many tags, invalid dates)", () => {
    render(
      <CnTimeline
        items={[
          {
            id: "x",
            title: "Archivo_".repeat(20),
            time: "no-es-fecha",
            tags: Array.from({ length: 15 }, (_, i) => `Etiqueta ${i}`),
          },
        ]}
      />,
    );
    expect(screen.getByText("Etiqueta 14")).toBeInTheDocument();
    expect(document.querySelector("time")).toBeNull();
  });
});

describe("CnTimelineSkeleton", () => {
  it("renders vertical, alternate and horizontal skeletons", () => {
    const { rerender } = render(<CnTimelineSkeleton count={3} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<CnTimelineSkeleton count={3} align="alternate" groups />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<CnTimelineSkeleton count={3} orientation="horizontal" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
