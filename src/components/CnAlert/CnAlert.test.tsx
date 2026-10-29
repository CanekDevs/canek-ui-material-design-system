import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnAlert } from "./CnAlert";

describe("CnAlert", () => {
  it("renders message", () => {
    render(<CnAlert message="Algo ocurrió" />);
    expect(screen.getByText("Algo ocurrió")).toBeInTheDocument();
  });

  it("renders title and message", () => {
    render(<CnAlert title="Error" message="Algo falló" />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Algo falló")).toBeInTheDocument();
  });

  it("renders children instead of message", () => {
    render(
      <CnAlert>
        <span data-testid="custom">Contenido</span>
      </CnAlert>,
    );
    expect(screen.getByTestId("custom")).toBeInTheDocument();
  });

  it("renders icon by default", () => {
    const { container } = render(<CnAlert severity="success" message="OK" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("hides icon when iconMode is none", () => {
    const { container } = render(<CnAlert iconMode="none" message="Sin icono" />);
    expect(container.querySelector(".MuiAlert-icon")).toBeNull();
  });

  it("hides icon when icon is false", () => {
    const { container } = render(<CnAlert icon={false} message="Sin icono" />);
    expect(container.querySelector(".MuiAlert-icon")).toBeNull();
  });

  it("renders custom icon by name", () => {
    const { container } = render(<CnAlert icon="bolt" message="Custom" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders custom icon as node", () => {
    render(<CnAlert icon={<span data-testid="my-icon" />} message="Node" />);
    expect(screen.getByTestId("my-icon")).toBeInTheDocument();
  });

  it("fires onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<CnAlert message="Cerrar" closable onClose={onClose} />);
    const closeButton = screen.getByRole("button", { name: "Cerrar alerta" });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledWith("close");
  });

  it("does not render close button when closable is false", () => {
    render(<CnAlert message="No cerrable" closable={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cerrar alerta" })).toBeNull();
  });

  it("does not render close button when onClose is missing", () => {
    render(<CnAlert message="Sin callback" closable />);
    expect(screen.queryByRole("button", { name: "Cerrar alerta" })).toBeNull();
  });

  it("renders action content", () => {
    render(<CnAlert message="Con acción" action={<button data-testid="action-btn">Ver</button>} />);
    expect(screen.getByTestId("action-btn")).toBeInTheDocument();
  });

  it("renders both action and close button", () => {
    const onClose = vi.fn();
    render(
      <CnAlert
        message="Con ambos"
        action={<button data-testid="action-btn">Ver</button>}
        closable
        onClose={onClose}
      />,
    );
    expect(screen.getByTestId("action-btn")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar alerta" })).toBeInTheDocument();
  });

  it("parses bullet list messages", () => {
    const message = "• Email: Ingresa tu correo\n• Name: Ingresa tu nombre";
    render(<CnAlert message={message} />);
    expect(screen.getByText("Email:")).toBeInTheDocument();
    expect(screen.getByText("Ingresa tu correo")).toBeInTheDocument();
    expect(screen.getByText("Name:")).toBeInTheDocument();
    expect(screen.getByText("Ingresa tu nombre")).toBeInTheDocument();
  });

  it("applies role='alert' to error severity by default", () => {
    render(<CnAlert severity="error" message="Error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies role='status' to success severity by default", () => {
    render(<CnAlert severity="success" message="OK" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("respects explicit role override", () => {
    render(<CnAlert severity="error" message="Error" role="status" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders popup inside Snackbar", () => {
    render(<CnAlert mode="popup" open message="Notificación" />);
    expect(screen.getByText("Notificación")).toBeInTheDocument();
  });

  it("does not render popup when open is false", () => {
    const { container } = render(<CnAlert mode="popup" open={false} message="Oculta" />);
    expect(container.querySelector("[role='presentation']")).toBeNull();
  });
});
