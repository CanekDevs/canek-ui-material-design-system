import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnRecordHeader } from "./CnRecordHeader";
import { CnRecordHeaderSkeleton } from "./CnRecordHeaderSkeleton";

const actions = (spies: Record<string, () => void> = {}) => [
  { id: "email", label: "Enviar correo", onClick: spies.email },
  { id: "call", label: "Llamar", onClick: spies.call },
  { id: "call_merge", label: "Combinar", onClick: spies.merge },
  { id: "delete", label: "Eliminar", danger: true, onClick: spies.delete },
];

describe("CnRecordHeader", () => {
  it("muestra nombre como encabezado, subtítulo, estado y etiquetas", () => {
    render(
      <CnRecordHeader
        title="Mariana López"
        subtitle="Directora de Compras"
        status={{ label: "Oportunidad", color: "info" }}
        tags={["Cliente clave"]}
      />,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Mariana López" })).toBeInTheDocument();
    expect(screen.getByText("Directora de Compras")).toBeInTheDocument();
    expect(screen.getByText("Oportunidad")).toBeInTheDocument();
    expect(screen.getByText("Cliente clave")).toBeInTheDocument();
  });

  it("respeta el nivel de encabezado", () => {
    render(<CnRecordHeader title="Grupo Altavista" headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("pinta los datos clave como lista de descripción", () => {
    const { container } = render(
      <CnRecordHeader
        title="X"
        facts={[
          { label: "Responsable", value: "Carlos" },
          { label: "Valor", value: "$10" },
        ]}
      />,
    );
    expect(container.querySelectorAll("dt")).toHaveLength(2);
    expect(screen.getByText("Carlos")).toBeInTheDocument();
  });

  it("muestra las acciones visibles y manda el resto al menú Más", () => {
    const spies = { email: vi.fn(), call: vi.fn(), merge: vi.fn(), delete: vi.fn() };
    render(<CnRecordHeader title="X" actions={actions(spies)} />);
    const group = screen.getByRole("group", { name: "Acciones del registro" });
    fireEvent.click(within(group).getByRole("button", { name: "Enviar correo" }));
    expect(spies.email).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Combinar" })).not.toBeInTheDocument();

    const more = screen.getByRole("button", { name: "Más acciones" });
    expect(more).toHaveAttribute("aria-haspopup", "menu");
    fireEvent.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    expect(spies.delete).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("el menú Más se cierra con Escape", () => {
    render(<CnRecordHeader title="X" actions={actions()} />);
    fireEvent.click(screen.getByRole("button", { name: "Más acciones" }));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.getByRole("button", { name: "Más acciones" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("sin acciones de sobra no muestra el menú Más", () => {
    render(<CnRecordHeader title="X" actions={actions().slice(0, 2)} />);
    expect(screen.queryByRole("button", { name: "Más acciones" })).not.toBeInTheDocument();
  });

  it("el botón Seguir es un interruptor con aria-pressed", () => {
    const onFollowChange = vi.fn();
    const { rerender } = render(
      <CnRecordHeader title="X" following={false} onFollowChange={onFollowChange} />,
    );
    const button = screen.getByRole("button", { name: "Seguir" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(onFollowChange).toHaveBeenCalledWith(true);
    rerender(<CnRecordHeader title="X" following onFollowChange={onFollowChange} />);
    expect(screen.getByRole("button", { name: "Siguiendo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("muestra Volver solo con onBack", () => {
    const onBack = vi.fn();
    const { rerender } = render(<CnRecordHeader title="X" />);
    expect(screen.queryByRole("button", { name: "Volver" })).not.toBeInTheDocument();
    rerender(<CnRecordHeader title="X" onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("acepta textos extremos sin perderlos", () => {
    const long = "x".repeat(300);
    render(<CnRecordHeader title={long} subtitle={long} />);
    expect(screen.getAllByText(long)).toHaveLength(2);
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<CnRecordHeader skeleton title="Mariana" actions={actions()} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByText("Mariana")).not.toBeInTheDocument();
  });
});

describe("CnRecordHeaderSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnRecordHeaderSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "record-header");
  });
});
