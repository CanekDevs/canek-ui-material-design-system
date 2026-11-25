import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnDealCard } from "./CnDealCard";
import { CnDealCardSkeleton } from "./CnDealCardSkeleton";

describe("CnDealCard", () => {
  it("muestra título, empresa y monto en pesos sin decimales", () => {
    render(<CnDealCard title="Licencias" company="Altavista" amount={1280000} />);
    expect(screen.getByRole("heading", { name: "Licencias" })).toBeInTheDocument();
    expect(screen.getByText("Altavista")).toBeInTheDocument();
    expect(screen.getByText(/1,280,000/)).toBeInTheDocument();
  });

  it("la probabilidad es una barra de progreso accesible y se limita a 0–100", () => {
    const { rerender } = render(<CnDealCard title="X" probability={60} />);
    const bar = screen.getByRole("progressbar", { name: "Probabilidad de cierre" });
    expect(bar).toHaveAttribute("aria-valuenow", "60");
    rerender(<CnDealCard title="X" probability={140} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    rerender(<CnDealCard title="X" probability={-5} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("calcula el monto ponderado", () => {
    render(<CnDealCard title="X" amount={1000} probability={25} showWeighted />);
    expect(screen.getByText(/Ponderado/)).toHaveTextContent("250");
  });

  it("ganada o perdida muestra el estado y oculta la probabilidad", () => {
    const { rerender } = render(<CnDealCard title="X" probability={50} status="won" />);
    expect(screen.getByText("Ganada")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    rerender(<CnDealCard title="X" status="lost" />);
    expect(screen.getByText("Perdida")).toBeInTheDocument();
  });

  it("marca la próxima actividad vencida", () => {
    render(
      <CnDealCard
        title="X"
        nextActivity={{ label: "Enviar contrato", due: "Ayer", overdue: true }}
      />,
    );
    expect(screen.getByText(/Vencida · Enviar contrato · Ayer/)).toBeInTheDocument();
  });

  it("con onClick toda la tarjeta es un botón usable con teclado", () => {
    const onClick = vi.fn();
    render(<CnDealCard title="Licencias" onClick={onClick} selected />);
    const button = screen.getByRole("button", { name: /Licencias/ });
    expect(button).toHaveAttribute("aria-pressed", "true");
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("sin onClick no es interactiva", () => {
    render(<CnDealCard title="X" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("compacta oculta etiquetas y fecha de cierre", () => {
    const { rerender } = render(<CnDealCard title="X" tags={["Renovación"]} closeDate="15 dic" />);
    expect(screen.getByText("Renovación")).toBeInTheDocument();
    rerender(<CnDealCard title="X" tags={["Renovación"]} closeDate="15 dic" density="compact" />);
    expect(screen.queryByText("Renovación")).not.toBeInTheDocument();
    expect(screen.queryByText(/Cierre/)).not.toBeInTheDocument();
  });

  it("sin monto ni probabilidad no pinta esas partes", () => {
    const { container } = render(<CnDealCard title="X" amount={null} />);
    expect(container.querySelector("[data-cn-deal-amount]")).toBeNull();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("acepta textos extremos sin perderlos", () => {
    const long = "x".repeat(300);
    render(<CnDealCard title={long} company={long} />);
    expect(screen.getAllByText(long)).toHaveLength(2);
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<CnDealCard skeleton title="Licencias" />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByText("Licencias")).not.toBeInTheDocument();
  });
});

describe("CnDealCardSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnDealCardSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "deal-card");
  });
});
