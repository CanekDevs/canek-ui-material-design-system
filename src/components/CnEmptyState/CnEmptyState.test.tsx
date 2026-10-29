import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnEmptyState } from "./CnEmptyState";

describe("CnEmptyState", () => {
  it("renders default title and description", () => {
    render(<CnEmptyState />);
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
    expect(screen.getByText("No hay elementos para mostrar.")).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    render(<CnEmptyState title="Sin productos" description="Agrega uno para empezar" />);
    expect(screen.getByText("Sin productos")).toBeInTheDocument();
    expect(screen.getByText("Agrega uno para empezar")).toBeInTheDocument();
  });

  it("renders default inbox icon when no icon passed", () => {
    const { container } = render(<CnEmptyState />);
    expect(container.querySelector("[data-cn-empty-state-icon='true']")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders icon by string name", () => {
    const { container } = render(<CnEmptyState icon="folder_open" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders icon as ReactNode inside circle", () => {
    render(<CnEmptyState icon={<span data-testid="custom-icon" />} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    const parent = screen.getByTestId("custom-icon").parentElement;
    expect(parent).toHaveAttribute("data-cn-empty-state-icon", "true");
  });

  it("renders illustration and hides icon", () => {
    const { container } = render(
      <CnEmptyState icon="folder_open" illustration={<span data-testid="custom-illustration" />} />,
    );
    expect(screen.getByTestId("custom-illustration")).toBeInTheDocument();
    expect(container.querySelector("[data-cn-empty-state-icon]")).toBeNull();
    expect(container.querySelector("[data-cn-empty-state-illustration]")).toBeInTheDocument();
  });

  it("renders action", () => {
    render(<CnEmptyState action={<button>Crear</button>} />);
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });

  it("renders children after action", () => {
    render(
      <CnEmptyState action={<button>Crear</button>}>
        <span data-testid="extra-content">Info extra</span>
      </CnEmptyState>,
    );
    expect(screen.getByTestId("extra-content")).toBeInTheDocument();
  });

  it("applies size as data attribute", () => {
    const { container } = render(<CnEmptyState size="lg" />);
    expect(container.querySelector("[data-cn-empty-state-size='lg']")).toBeInTheDocument();
  });

  it("applies color as data attribute", () => {
    const { container } = render(<CnEmptyState color="success" />);
    expect(container.querySelector("[data-cn-empty-state-color='success']")).toBeInTheDocument();
  });

  it("applies variant as data attribute", () => {
    const { container } = render(<CnEmptyState variant="card" />);
    expect(container.querySelector("[data-cn-empty-state-variant='card']")).toBeInTheDocument();
  });

  it("applies role status by default", () => {
    render(<CnEmptyState />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("applies role alert when specified", () => {
    render(<CnEmptyState role="alert" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does not apply role when none", () => {
    const { container } = render(<CnEmptyState role="none" />);
    expect(container.querySelector("[role='status']")).toBeNull();
    expect(container.querySelector("[role='alert']")).toBeNull();
  });

  it("applies aria-label when provided", () => {
    render(<CnEmptyState ariaLabel="No hay productos" />);
    expect(screen.getByLabelText("No hay productos")).toBeInTheDocument();
  });

  it("does not render text block when both title and description are falsy", () => {
    render(<CnEmptyState title={null} description={null} />);
    expect(screen.queryByText("Sin datos")).toBeNull();
    expect(screen.queryByText("No hay elementos para mostrar.")).toBeNull();
  });
});
