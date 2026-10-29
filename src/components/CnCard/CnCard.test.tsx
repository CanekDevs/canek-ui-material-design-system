import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnCard } from "./CnCard";

describe("CnCard", () => {
  it("renders title and subtitle", () => {
    render(<CnCard title="Título" subtitle="Subtítulo" />);
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Subtítulo")).toBeInTheDocument();
  });

  it("renders description and children", () => {
    render(
      <CnCard description="Descripción">
        <span data-testid="custom-content">Contenido</span>
      </CnCard>,
    );
    expect(screen.getByText("Descripción")).toBeInTheDocument();
    expect(screen.getByTestId("custom-content")).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(<CnCard footer={<button>Acción</button>} />);
    expect(screen.getByRole("button", { name: "Acción" })).toBeInTheDocument();
  });

  it("renders header actions", () => {
    render(<CnCard title="Título" headerActions={<button>Menu</button>} />);
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });

  it("renders icon as string", () => {
    const { container } = render(<CnCard title="Con icono" icon="bolt" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("calls onClick when interactive", () => {
    const onClick = vi.fn();
    render(<CnCard title="Clickable" interactive onClick={onClick} />);
    const card = screen.getByRole("button");
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(<CnCard title="Disabled" interactive disabled onClick={onClick} />);
    const card = screen.queryByRole("button");
    expect(card).toBeNull();
  });

  it("fires onClick on Enter key when interactive", () => {
    const onClick = vi.fn();
    render(<CnCard title="Keyboard" interactive onClick={onClick} />);
    const card = screen.getByRole("button");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("fires onClick on Space key when interactive", () => {
    const onClick = vi.fn();
    render(<CnCard title="Keyboard" interactive onClick={onClick} />);
    const card = screen.getByRole("button");
    fireEvent.keyDown(card, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders as anchor when href is provided", () => {
    render(<CnCard title="Link" href="https://example.com" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("shows loading skeleton when loading", () => {
    const { container } = render(<CnCard title="Loading" loading />);
    expect(screen.queryByText("Loading")).toBeInTheDocument();
    expect(container.querySelector("[class*='MuiBox-root']")).toBeInTheDocument();
  });

  it("shows empty state when empty", () => {
    render(<CnCard empty emptyTitle="Sin datos" emptyDescription="No hay nada" />);
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
    expect(screen.getByText("No hay nada")).toBeInTheDocument();
  });

  it("does not render body content when empty", () => {
    render(<CnCard empty emptyTitle="Vacío" description="Esta descripción no debe aparecer" />);
    expect(screen.queryByText("Esta descripción no debe aparecer")).toBeNull();
  });

  it("applies aria-label", () => {
    render(<CnCard ariaLabel="Mi tarjeta" />);
    expect(screen.getByLabelText("Mi tarjeta")).toBeInTheDocument();
  });

  it("sets aria-disabled when disabled", () => {
    const { container } = render(<CnCard disabled />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute("aria-disabled", "true");
  });

  it("renders media in vertical layout", () => {
    render(<CnCard media={<img src="test.jpg" alt="media" />} title="Con media" />);
    expect(screen.getByAltText("media")).toBeInTheDocument();
  });

  it("renders media in horizontal layout", () => {
    render(
      <CnCard
        layout="horizontal"
        media={<img src="test.jpg" alt="horizontal" />}
        title="Horizontal"
      />,
    );
    expect(screen.getByAltText("horizontal")).toBeInTheDocument();
    expect(screen.getByText("Horizontal")).toBeInTheDocument();
  });
});
