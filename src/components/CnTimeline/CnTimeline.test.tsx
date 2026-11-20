import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CnTimelineItem } from "./CnTimeline";
import { CnTimeline } from "./CnTimeline";
import { CnTimelineSkeleton } from "./CnTimelineSkeleton";
import { timelineToCsv, timelineToJson } from "./timeline-export";
import { timelineFiltersBy } from "./timeline-filters";
import { formatDayLabel, groupByDay, matchesText, toPlainText } from "./timeline-utils";

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

describe("CnTimeline · bitácora", () => {
  const AUDIT: CnTimelineItem[] = [
    {
      id: "a1",
      title: "Contrato actualizado",
      type: "Cambio",
      actor: "Ana López",
      tone: "info",
      changes: [
        { field: "Monto", before: "$120", after: "$135" },
        { field: "Notas", before: null, after: "Nueva" },
      ],
    },
    { id: "a2", title: "Inicio de sesión", type: "Acceso", actor: "Carlos", tone: "warning" },
    { id: "a3", title: "Factura timbrada", type: "Cambio", actor: "Carlos", searchText: "F-1024" },
  ];

  it("renders field changes as before → after with del/ins", () => {
    const { container } = render(<CnTimeline items={AUDIT.slice(0, 1)} />);
    const changes = screen.getByRole("list", { name: "Cambios" });
    expect(within(changes).getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelector("del")).toHaveTextContent("Antes: $120");
    expect(container.querySelector("ins")).toHaveTextContent("Después: $135");
    expect(within(changes).getByText("vacío")).toBeInTheDocument();
  });

  it("searches (accent-insensitive, extra searchText) and announces the count", () => {
    const onQueryChange = vi.fn();
    render(<CnTimeline items={AUDIT} searchable onQueryChange={onQueryChange} />);
    const box = screen.getByRole("searchbox", { name: "Buscar en el historial" });
    fireEvent.change(box, { target: { value: "sesion" } });
    expect(onQueryChange).toHaveBeenCalledWith("sesion");
    expect(screen.getAllByRole("listitem").filter((li) => li.dataset.cnTimelineItem)).toHaveLength(
      1,
    );
    expect(document.querySelector("[data-cn-timeline-results]")).toHaveTextContent(
      "1 de 3 eventos",
    );
    fireEvent.change(box, { target: { value: "f-1024" } });
    expect(screen.getByText("Factura timbrada")).toBeInTheDocument();
  });

  it("filters with chips (any active matches) and clears from the empty state", () => {
    const filters = timelineFiltersBy(AUDIT, "type");
    expect(filters.map((f) => f.label)).toEqual(["Cambio", "Acceso"]);
    const onFiltersChange = vi.fn();
    render(
      <CnTimeline items={AUDIT} filters={filters} searchable onFiltersChange={onFiltersChange} />,
    );
    const chip = screen.getByRole("button", { name: "Acceso" });
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(onFiltersChange).toHaveBeenLastCalledWith(["type:Acceso"]);
    expect(screen.queryByText("Contrato actualizado")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda y filtros" }));
    expect(screen.getByText("Contrato actualizado")).toBeInTheDocument();
    expect(onFiltersChange).toHaveBeenLastCalledWith([]);
  });

  it("builds filters by actor, tone and status", () => {
    expect(timelineFiltersBy(AUDIT, "actor").map((f) => f.label)).toEqual(["Ana López", "Carlos"]);
    expect(timelineFiltersBy(AUDIT, "tone").map((f) => f.label)).toEqual([
      "Información",
      "Advertencia",
    ]);
    expect(timelineFiltersBy([{ id: "s", title: "x", status: "error" }], "status")[0].label).toBe(
      "Con error",
    );
  });

  it("exports CSV (escaped, formula-safe) and JSON, or delegates to onExport", () => {
    const csv = timelineToCsv([
      { id: "1", title: 'Dijo "hola", adiós', actor: "=SUMA(A1)", changes: AUDIT[0].changes },
    ]);
    const [header, row] = csv.split("\r\n");
    expect(header).toBe("id,fecha,tipo,titulo,autor,estado,descripcion,cambios,etiquetas");
    expect(row).toContain('"Dijo ""hola"", adiós"');
    expect(row).toContain("'=SUMA(A1)");
    expect(row).toContain("Monto: $120 → $135");
    const json = JSON.parse(timelineToJson([{ id: "j", title: <b>Negrita</b> }]));
    expect(json[0].titulo).toBe("Negrita");

    const onExport = vi.fn();
    render(<CnTimeline items={AUDIT} exportable onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /JSON/ }));
    expect(onExport).toHaveBeenCalledWith("json", AUDIT);
  });

  it("exports directly with a single format", () => {
    const onExport = vi.fn();
    render(<CnTimeline items={AUDIT} exportable={["csv"]} onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar" }));
    expect(onExport).toHaveBeenCalledWith("csv", AUDIT);
  });

  it("downloads a file through an object URL", () => {
    const create = vi.fn(() => "blob:x");
    const revoke = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<CnTimeline items={AUDIT} exportable={["json"]} exportFileName="bitacora" />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar" }));
    expect(create).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    click.mockRestore();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });
});

describe("CnTimeline · interacción", () => {
  it("expands and collapses every description at once", () => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return this.hasAttribute?.("data-cn-timeline-description") ? 200 : 0;
      },
    });
    render(
      <CnTimeline
        expandToggle
        items={[
          { id: "1", title: "A", description: "Largo ".repeat(80) },
          { id: "2", title: "B", description: "Largo ".repeat(80) },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Expandir todo" }));
    expect(screen.getAllByRole("button", { name: "Ver menos" })).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Contraer todo" }));
    expect(screen.getAllByRole("button", { name: "Ver más" })).toHaveLength(2);
    if (original) Object.defineProperty(HTMLElement.prototype, "scrollHeight", original);
  });

  it("moves focus with arrow keys, Home/End and opens with Enter", () => {
    const onItemClick = vi.fn();
    render(<CnTimeline items={ITEMS} now={NOW} onItemClick={onItemClick} />);
    const items = document.querySelectorAll<HTMLElement>("[data-cn-timeline-item]");
    expect(items[0]).toHaveAttribute("tabindex", "0");
    expect(items[1]).toHaveAttribute("tabindex", "-1");
    items[0].focus();
    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);
    expect(items[1]).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(items[1], { key: "End" });
    expect(document.activeElement).toBe(items[2]);
    fireEvent.keyDown(items[2], { key: "Home" });
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0], { key: "Enter" });
    expect(onItemClick).toHaveBeenCalledWith(ITEMS[0]);
  });

  it("highlights a deep-linked item, expanding the local pagination", () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<CnTimeline items={ITEMS} now={NOW} initialVisible={1} highlightId="3" />);
    const target = document.querySelector('[data-cn-timeline-item="3"]');
    expect(target).toHaveAttribute("data-highlighted", "true");
    expect(scroll).toHaveBeenCalled();
  });

  it("replies to comments and keeps the text when sending fails", async () => {
    const onReply = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce(undefined);
    render(
      <CnTimeline
        items={[{ id: "c", kind: "comment", title: "Ana comentó", description: "¿Lo revisas?" }]}
        onReply={onReply}
      />,
    );
    expect(document.querySelector("[data-cn-timeline-bubble]")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Responder" }));
    const send = screen.getByRole("button", { name: "Enviar" });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Respuesta"), { target: { value: "Claro" } });
    fireEvent.click(send);
    await waitFor(() => expect(screen.getByText(/No se pudo enviar/)).toBeInTheDocument());
    expect(screen.getByLabelText("Respuesta")).toHaveValue("Claro");
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(screen.queryByLabelText("Respuesta")).not.toBeInTheDocument());
    expect(onReply).toHaveBeenLastCalledWith(expect.objectContaining({ id: "c" }), "Claro");
  });

  it("shows progress with percent and ETA", () => {
    render(
      <CnTimeline
        showProgress
        eta="Entrega mañana"
        items={[
          { id: "a", title: "A", status: "completed" },
          { id: "b", title: "B", status: "completed" },
          { id: "c", title: "C", status: "current" },
          { id: "d", title: "D", status: "pending" },
        ]}
      />,
    );
    const bar = screen.getByRole("progressbar", { name: "2 de 4 pasos completados" });
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("Entrega mañana")).toBeInTheDocument();
  });

  it("renders attachments as file cards", () => {
    render(
      <CnTimeline
        attachmentsLayout="cards"
        items={[
          {
            id: "f",
            title: "Adjunto",
            attachments: [{ name: "contrato.pdf", bytes: 2048, mime: "application/pdf" }],
          },
        ]}
      />,
    );
    const list = screen.getByRole("list", { name: "Adjuntos" });
    expect(list).toHaveAttribute("data-cn-timeline-attachments", "cards");
    expect(within(list).getByText("contrato.pdf")).toBeInTheDocument();
  });

  it("shows an error state with retry", () => {
    const onRetry = vi.fn();
    render(<CnTimeline items={ITEMS} error="Sin conexión" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar el historial");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("refreshes relative times on an interval unless `now` is fixed", () => {
    vi.useFakeTimers();
    const start = new Date(2026, 10, 19, 12, 0, 0);
    vi.setSystemTime(start);
    render(<CnTimeline items={[{ id: "t", title: "T", time: start }]} liveInterval={60000} />);
    expect(document.querySelector("time")).toHaveTextContent("ahora");
    act(() => {
      vi.advanceTimersByTime(5 * 60000);
    });
    expect(document.querySelector("time")!.textContent).toMatch(/5 min/);
    vi.useRealTimers();
  });

  it("makes day headers sticky on request", () => {
    render(<CnTimeline items={ITEMS} now={NOW} groupByDay stickyHeaders stickyOffset={48} />);
    const heading = screen.getByRole("heading", { name: "Hoy" });
    expect(getComputedStyle(heading).position).toBe("sticky");
    expect(getComputedStyle(heading).top).toBe("48px");
  });
});

describe("timeline-utils · texto", () => {
  it("extracts plain text from JSX and matches without accents", () => {
    expect(
      toPlainText(
        <span>
          Hola <b>mundo</b> {3}
        </span>,
      ),
    ).toBe("Hola mundo 3");
    expect(matchesText("Inicio de sesión", "SESION inicio")).toBe(true);
    expect(matchesText("Inicio", "cierre")).toBe(false);
  });
});

describe("CnTimelineSkeleton", () => {
  it("renders the toolbar placeholder", () => {
    const { container } = render(<CnTimelineSkeleton count={2} toolbar />);
    expect(container.querySelectorAll("*").length).toBeGreaterThan(5);
  });

  it("renders vertical, alternate and horizontal skeletons", () => {
    const { rerender } = render(<CnTimelineSkeleton count={3} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<CnTimelineSkeleton count={3} align="alternate" groups />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<CnTimelineSkeleton count={3} orientation="horizontal" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
