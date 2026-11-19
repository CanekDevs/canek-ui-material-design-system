import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnInfoCard } from "./CnInfoCard";
import { CnInfoCardSkeleton } from "./CnInfoCardSkeleton";

describe("CnInfoCard", () => {
  it("renders title, description and the tone icon as a note", () => {
    const { container } = render(
      <CnInfoCard tone="warning" title="Atención" description="Revisa los datos." />,
    );
    expect(screen.getByRole("note")).toHaveAccessibleName("Atención");
    expect(screen.getByText("Revisa los datos.")).toBeInTheDocument();
    expect(container.querySelector("[data-cn-info-card-icon]")).not.toBeNull();
  });

  it("hides the icon with icon={false}", () => {
    const { container } = render(<CnInfoCard title="Sin ícono" icon={false} />);
    expect(container.querySelector("[data-cn-info-card-icon]")).toBeNull();
  });

  it("supports the label/value data mode with a badge", () => {
    render(
      <CnInfoCard
        label="RFC"
        value="XAXX010101000"
        icon="verified"
        badge={{ label: "Validado", color: "success" }}
      />,
    );
    expect(screen.getByText("RFC")).toBeInTheDocument();
    expect(screen.getByText("XAXX010101000")).toBeInTheDocument();
    expect(screen.getByText("Validado")).toBeInTheDocument();
  });

  it("renders action buttons and links", () => {
    const onClick = vi.fn();
    render(
      <CnInfoCard
        title="Nueva versión"
        actions={[
          { label: "Actualizar", onClick },
          { label: "Notas", href: "https://canek.mx", target: "_blank", variant: "link" },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    const link = screen.getByRole("link", { name: "Notas" });
    expect(link).toHaveAttribute("href", "https://canek.mx");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("is dismissible (uncontrolled) and notifies onDismiss", () => {
    const onDismiss = vi.fn();
    render(<CnInfoCard title="Aviso" dismissible onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("keeps visibility under control with open", () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <CnInfoCard title="Controlado" dismissible open={false} onDismiss={onDismiss} />,
    );
    expect(screen.queryByText("Controlado")).not.toBeInTheDocument();
    rerender(<CnInfoCard title="Controlado" dismissible open onDismiss={onDismiss} />);
    expect(screen.getByText("Controlado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    // Controlada: sigue visible hasta que el padre cambie `open`.
    expect(screen.getByText("Controlado")).toBeInTheDocument();
  });

  it("toggles collapsible details", () => {
    const onExpandedChange = vi.fn();
    render(
      <CnInfoCard
        title="Política"
        details="Detalle completo"
        onExpandedChange={onExpandedChange}
      />,
    );
    const toggle = screen.getByRole("button", { name: "Ver detalles" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Detalle completo")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Ocultar detalles" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Detalle completo")).toBeInTheDocument();
  });

  it("renders media and becomes a button when clickable", () => {
    const onClick = vi.fn();
    const { container } = render(
      <CnInfoCard title="Con imagen" media={<img alt="" src="/x.png" />} onClick={onClick} />,
    );
    expect(container.querySelector("[data-cn-info-card-media]")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Con imagen/ }));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders the skeleton via skeleton and loading", () => {
    const { rerender } = render(<CnInfoCard title="Cargando" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "info-card");
    expect(screen.queryByText("Cargando")).not.toBeInTheDocument();
    rerender(<CnInfoCard title="Cargando" loading />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "info-card");
  });
});

describe("CnInfoCardSkeleton", () => {
  it("is a single accessible status that follows the variants", () => {
    const { container, rerender } = render(<CnInfoCardSkeleton actions={2} media />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(container.querySelectorAll("[data-cn-info-card-skeleton-actions] > *")).toHaveLength(2);
    expect(container.querySelector("[data-cn-info-card-skeleton-media]")).not.toBeNull();
    rerender(<CnInfoCardSkeleton icon={false} size="lg" />);
    expect(container.querySelector("[data-cn-info-card-skeleton-icon]")).toBeNull();
    expect(getComputedStyle(screen.getByRole("status")).paddingTop).toBe("24px");
  });
});
