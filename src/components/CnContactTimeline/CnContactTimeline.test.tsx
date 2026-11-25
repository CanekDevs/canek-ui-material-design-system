import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CnContactActivity } from "./CnContactTimeline";
import { CnContactTimeline } from "./CnContactTimeline";
import { CnContactTimelineSkeleton } from "./CnContactTimelineSkeleton";

const NOW = new Date("2026-11-25T12:00:00");

const ACTIVITIES: CnContactActivity[] = [
  {
    id: "p",
    channel: "note",
    pinned: true,
    title: "Acuerdo de precios",
    time: "2026-11-10T10:00:00",
  },
  { id: "c", channel: "call", title: "Llamada con Mariana", time: "2026-11-25T10:00:00" },
  { id: "e", channel: "email", title: "Propuesta enviada", time: "2026-11-25T09:00:00" },
  { id: "m", channel: "meeting", title: "Demo del producto", time: "2026-11-24T16:00:00" },
];

const renderTimeline = (props: Partial<Parameters<typeof CnContactTimeline>[0]> = {}) =>
  render(<CnContactTimeline activities={ACTIVITIES} timelineProps={{ now: NOW }} {...props} />);

describe("CnContactTimeline", () => {
  it("es una sección con nombre accesible y muestra las actividades", () => {
    renderTimeline();
    expect(screen.getByRole("region", { name: "Historial del contacto" })).toBeInTheDocument();
    expect(screen.getByText("Llamada con Mariana")).toBeInTheDocument();
  });

  it("separa las fijadas arriba y no las repite en el historial", () => {
    renderTimeline();
    const pinned = screen.getByRole("region", { name: "Fijadas" });
    expect(within(pinned).getByText("Acuerdo de precios")).toBeInTheDocument();
    expect(screen.getAllByText("Acuerdo de precios")).toHaveLength(1);
    expect(within(pinned).getByRole("heading", { name: /Fijadas \(1\)/ })).toBeInTheDocument();
  });

  it("crea chips de filtro solo para los canales presentes y filtra", () => {
    renderTimeline();
    expect(screen.getByRole("button", { name: /Llamadas/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tareas/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Correos/ }));
    expect(screen.getByText("Propuesta enviada")).toBeInTheDocument();
    expect(screen.queryByText("Llamada con Mariana")).not.toBeInTheDocument();
  });

  it("sin channelFilters no muestra chips de canal", () => {
    renderTimeline({ channelFilters: false });
    expect(screen.queryByRole("button", { name: /Llamadas/ })).not.toBeInTheDocument();
  });

  it("acepta etiquetas propias por canal", () => {
    renderTimeline({ channelLabels: { call: "Telefonía" } });
    expect(screen.getByRole("button", { name: /Telefonía/ })).toBeInTheDocument();
  });

  it("la acción Fijar llama a onPinChange con el valor contrario", () => {
    const onPinChange = vi.fn();
    renderTimeline({ onPinChange });
    fireEvent.click(screen.getAllByRole("button", { name: "Fijar" })[0]);
    expect(onPinChange).toHaveBeenCalledWith(expect.objectContaining({ channel: "call" }), true);
    fireEvent.click(screen.getByRole("button", { name: "Quitar de fijadas" }));
    expect(onPinChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: "p" }), false);
  });

  it("sin onPinChange no ofrece fijar", () => {
    renderTimeline();
    expect(screen.queryByRole("button", { name: "Fijar" })).not.toBeInTheDocument();
  });

  it("muestra el compositor solo con onCreate", () => {
    const { rerender } = renderTimeline();
    expect(screen.queryByRole("form", { name: "Registrar actividad" })).not.toBeInTheDocument();
    rerender(
      <CnContactTimeline activities={ACTIVITIES} timelineProps={{ now: NOW }} onCreate={vi.fn()} />,
    );
    expect(screen.getByRole("form", { name: "Registrar actividad" })).toBeInTheDocument();
  });

  it("sin actividades muestra el estado vacío", () => {
    render(<CnContactTimeline activities={[]} timelineProps={{ now: NOW }} />);
    expect(screen.getByText("Sin actividad todavía")).toBeInTheDocument();
  });

  it("muestra el error de carga con reintentar", () => {
    const onRetry = vi.fn();
    render(<CnContactTimeline activities={[]} error="No se pudo cargar" onRetry={onRetry} />);
    expect(screen.getByText("No se pudo cargar")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<CnContactTimeline skeleton activities={ACTIVITIES} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByText("Llamada con Mariana")).not.toBeInTheDocument();
  });
});

describe("CnContactTimelineSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnContactTimelineSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "contact-timeline");
  });
});
