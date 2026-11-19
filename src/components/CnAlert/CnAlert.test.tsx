import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  describe("callout (antes CnInfoCard)", () => {
    it("left-accent variant draws a colored left border", () => {
      render(<CnAlert variant="left-accent" severity="warning" message="Nota" />);
      const alert = screen.getByRole("alert");
      expect(getComputedStyle(alert).borderLeftWidth).toBe("4px");
    });

    it("renders descriptor actions in a row below the message", () => {
      const onOpen = vi.fn();
      const { container } = render(
        <CnAlert
          message="Hay una actualización"
          actions={[
            { label: "Abrir", onClick: onOpen },
            {
              label: "Más información",
              variant: "link",
              href: "https://example.com",
              target: "_blank",
            },
          ]}
        />,
      );
      expect(container.querySelector("[data-cn-alert-actions]")).not.toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
      expect(onOpen).toHaveBeenCalledTimes(1);
      const link = screen.getByRole("link", { name: "Más información" });
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("accepts custom nodes as actions", () => {
      render(<CnAlert message="Custom" actions={<button>Propio</button>} />);
      expect(screen.getByRole("button", { name: "Propio" })).toBeInTheDocument();
    });

    it("toggles collapsible details (uncontrolled)", () => {
      render(<CnAlert message="Resumen" details={<span>Detalle oculto</span>} />);
      const toggle = screen.getByRole("button", { name: "Ver detalles" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText("Detalle oculto")).toBeNull();
      fireEvent.click(toggle);
      expect(screen.getByText("Detalle oculto")).toBeInTheDocument();
      const hide = screen.getByRole("button", { name: "Ocultar detalles" });
      expect(hide).toHaveAttribute("aria-expanded", "true");
      expect(hide.getAttribute("aria-controls")).toBeTruthy();
    });

    it("supports controlled details", () => {
      const onExpandedChange = vi.fn();
      render(
        <CnAlert
          message="Resumen"
          details="Detalle"
          expanded={false}
          onExpandedChange={onExpandedChange}
          detailsLabel="Más"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Más" }));
      expect(onExpandedChange).toHaveBeenCalledWith(true);
      expect(screen.queryByText("Detalle")).toBeNull();
    });

    it("dismissible hides itself without onClose", async () => {
      render(<CnAlert message="Me voy" dismissible closeLabel="Cerrar aviso" />);
      fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
      await waitFor(() => expect(screen.getByText("Me voy")).not.toBeVisible());
    });

    it("dismissible respects controlled visible", () => {
      const onClose = vi.fn();
      render(<CnAlert message="Me quedo" dismissible visible onClose={onClose} />);
      fireEvent.click(screen.getByRole("button", { name: "Cerrar alerta" }));
      expect(onClose).toHaveBeenCalledWith("close");
      expect(screen.getByText("Me quedo")).toBeVisible();
    });

    it("closable + onClose does not auto-hide (backwards compatible)", () => {
      render(<CnAlert message="Sigo aquí" closable onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Cerrar alerta" }));
      expect(screen.getByText("Sigo aquí")).toBeVisible();
    });

    it("role note does not announce; role none removes MUI's default alert role", () => {
      const { container, rerender } = render(
        <CnAlert severity="error" role="note" message="Nota" />,
      );
      expect(screen.getByRole("note")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).toBeNull();
      rerender(<CnAlert severity="error" role="none" message="Nota" />);
      expect(screen.queryByRole("alert")).toBeNull();
      expect(container.querySelector(".MuiAlert-root")).toHaveAttribute("role", "none");
    });

    it("accepts a node title", () => {
      render(<CnAlert title={<span data-testid="t">Título</span>} message="m" />);
      expect(screen.getByTestId("t")).toBeInTheDocument();
    });

    it("wraps long unbroken strings", () => {
      render(<CnAlert message={"x".repeat(200)} />);
      const message = document.querySelector(".MuiAlert-message") as HTMLElement;
      expect(getComputedStyle(message).overflowWrap).toBe("anywhere");
    });

    it("skeleton reflects actions and details", () => {
      const { container } = render(
        <CnAlert message="m" details="d" actions={[{ label: "A" }, { label: "B" }]} skeleton />,
      );
      expect(container.querySelector("[data-cn-alert-skeleton-details]")).not.toBeNull();
      expect(container.querySelector("[data-cn-alert-skeleton-actions]")?.children).toHaveLength(2);
    });
  });
});
