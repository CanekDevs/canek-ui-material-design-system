import { createEvent, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { CnKanbanItem } from "./CnKanbanBoard";
import { CnKanbanBoard } from "./CnKanbanBoard";
import { CnKanbanBoardSkeleton } from "./CnKanbanBoardSkeleton";
import { moveKanbanItem } from "./kanban-utils";

const COLUMNS = [
  { id: "a", title: "Prospecto" },
  { id: "b", title: "Propuesta", limit: 1 },
  { id: "c", title: "Ganada" },
];

const ITEMS: CnKanbanItem[] = [
  { id: "1", columnId: "a", label: "Uno", value: 100 },
  { id: "2", columnId: "a", label: "Dos", value: 50 },
  { id: "3", columnId: "b", label: "Tres", value: 1000 },
];

const Board = ({
  onMove,
  canDrop,
}: {
  onMove?: (id: string, column: string, index: number) => void;
  canDrop?: (item: CnKanbanItem, column: string) => boolean;
}) => {
  const [items, setItems] = useState(ITEMS);
  return (
    <CnKanbanBoard
      columns={COLUMNS}
      items={items}
      canDrop={canDrop}
      renderCard={(item) => <span>{item.label}</span>}
      onMove={(id, column, index) => {
        onMove?.(id, column, index);
        setItems((current) => moveKanbanItem(current, id, column, index));
      }}
    />
  );
};

const column = (title: string) => screen.getByRole("region", { name: title });
const card = (label: string) => screen.getByText(label).closest("li") as HTMLElement;

const dataTransfer = () => ({
  setData: vi.fn(),
  getData: vi.fn(),
  effectAllowed: "",
  dropEffect: "",
});

describe("moveKanbanItem", () => {
  it("mueve entre columnas y dentro de una columna sin mutar", () => {
    const moved = moveKanbanItem(ITEMS, "1", "b", 0);
    expect(moved.map((i) => `${i.id}${i.columnId}`)).toEqual(["2a", "1b", "3b"]);
    expect(ITEMS[0].columnId).toBe("a");
    expect(moveKanbanItem(ITEMS, "1", "a", 1).map((i) => i.id)).toEqual(["2", "1", "3"]);
    expect(moveKanbanItem(ITEMS, "3", "c", 5).map((i) => `${i.id}${i.columnId}`)).toEqual([
      "1a",
      "2a",
      "3c",
    ]);
    expect(moveKanbanItem(ITEMS, "x", "c", 0)).toEqual(ITEMS);
  });
});

describe("CnKanbanBoard", () => {
  it("pinta cada columna como región con su lista, contador y total", () => {
    render(<Board />);
    const lead = column("Prospecto");
    expect(within(lead).getAllByRole("listitem")).toHaveLength(2);
    expect(within(lead).getByLabelText("2 tarjetas")).toBeInTheDocument();
    expect(lead.querySelector("[data-cn-kanban-total]")).toHaveTextContent("150");
  });

  it("marca el límite WIP cuando se supera", () => {
    render(<Board />);
    expect(screen.getByLabelText("1 de 1 tarjetas")).toBeInTheDocument();
    const space = () => fireEvent.keyDown(card("Uno"), { key: " " });
    space();
    fireEvent.keyDown(card("Uno"), { key: "ArrowRight" });
    space();
    expect(screen.getByLabelText("2 de 1 tarjetas, límite superado")).toBeInTheDocument();
  });

  it("columnas vacías muestran el texto de vacío", () => {
    render(<Board />);
    expect(within(column("Ganada")).getByText("Suelta aquí una tarjeta")).toBeInTheDocument();
  });

  it("teclado: Espacio toma, flechas mueven, Espacio suelta y anuncia", () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    const uno = card("Uno");
    expect(uno).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(uno, { key: " " });
    expect(card("Uno")).toHaveAttribute("aria-grabbed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Uno tomada en Prospecto");
    fireEvent.keyDown(card("Uno"), { key: "ArrowRight" });
    fireEvent.keyDown(card("Uno"), { key: "ArrowRight" });
    expect(within(column("Ganada")).getByText("Uno")).toBeInTheDocument();
    fireEvent.keyDown(card("Uno"), { key: " " });
    expect(onMove).toHaveBeenCalledWith("1", "c", 0);
    expect(screen.getByRole("status")).toHaveTextContent("Uno soltada en Ganada, posición 1");
  });

  it("teclado: flecha abajo reordena dentro de la columna", () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    fireEvent.keyDown(card("Uno"), { key: "Enter" });
    fireEvent.keyDown(card("Uno"), { key: "ArrowDown" });
    fireEvent.keyDown(card("Uno"), { key: "Enter" });
    expect(onMove).toHaveBeenCalledWith("1", "a", 1);
  });

  it("Escape cancela y devuelve la tarjeta sin llamar a onMove", () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    fireEvent.keyDown(card("Uno"), { key: " " });
    fireEvent.keyDown(card("Uno"), { key: "ArrowRight" });
    fireEvent.keyDown(card("Uno"), { key: "Escape" });
    expect(onMove).not.toHaveBeenCalled();
    expect(within(column("Prospecto")).getByText("Uno")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Movimiento cancelado");
  });

  it("soltar sin mover no llama a onMove", () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    fireEvent.keyDown(card("Uno"), { key: " " });
    fireEvent.keyDown(card("Uno"), { key: " " });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("canDrop salta las columnas bloqueadas con teclado", () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} canDrop={(_, to) => to !== "b"} />);
    fireEvent.keyDown(card("Uno"), { key: " " });
    fireEvent.keyDown(card("Uno"), { key: "ArrowRight" });
    fireEvent.keyDown(card("Uno"), { key: " " });
    expect(onMove).toHaveBeenCalledWith("1", "c", 0);
  });

  it("mouse: arrastrar a otra columna y soltar llama a onMove", () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    const transfer = dataTransfer();
    fireEvent.dragStart(card("Dos"), { dataTransfer: transfer });
    const target = column("Ganada");
    const over = createEvent.dragOver(target, { dataTransfer: transfer });
    fireEvent(target, over);
    expect(over.defaultPrevented).toBe(true);
    fireEvent.drop(target, { dataTransfer: transfer });
    expect(onMove).toHaveBeenCalledWith("2", "c", 0);
    expect(within(column("Ganada")).getByText("Dos")).toBeInTheDocument();
  });

  it("mouse: una columna bloqueada no acepta la tarjeta", () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} canDrop={(_, to) => to !== "c"} />);
    const transfer = dataTransfer();
    fireEvent.dragStart(card("Dos"), { dataTransfer: transfer });
    const target = column("Ganada");
    const over = createEvent.dragOver(target, { dataTransfer: transfer });
    fireEvent(target, over);
    expect(over.defaultPrevented).toBe(false);
    fireEvent.drop(target, { dataTransfer: transfer });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("muestra Agregar por columna con nombre accesible", () => {
    const onAddCard = vi.fn();
    render(
      <CnKanbanBoard
        columns={COLUMNS}
        items={ITEMS}
        renderCard={(item) => item.label}
        onMove={vi.fn()}
        onAddCard={onAddCard}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Agregar en Propuesta" }));
    expect(onAddCard).toHaveBeenCalledWith("b");
  });

  it("sin valores no muestra totales", () => {
    const { container } = render(
      <CnKanbanBoard
        columns={COLUMNS}
        items={[{ id: "x", columnId: "a" }]}
        renderCard={() => "x"}
        onMove={vi.fn()}
      />,
    );
    expect(container.querySelector("[data-cn-kanban-total]")).toBeNull();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(
      <CnKanbanBoard
        skeleton
        columns={COLUMNS}
        items={ITEMS}
        renderCard={() => null}
        onMove={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});

describe("CnKanbanBoardSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnKanbanBoardSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "kanban-board");
  });
});
