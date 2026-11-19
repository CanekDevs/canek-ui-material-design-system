import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnSectionCard } from "./CnSectionCard";
import { CnSectionCardSkeleton } from "./CnSectionCardSkeleton";

describe("CnSectionCard", () => {
  it("renders a labelled section with heading, subtitle, badge and footer", () => {
    render(
      <CnSectionCard
        title="Datos generales"
        subtitle="Información del cliente"
        caption="Actualizado hoy"
        icon="business"
        badge={12}
        footer={<button type="button">Guardar</button>}
      >
        Contenido
      </CnSectionCard>,
    );
    const heading = screen.getByRole("heading", { level: 3, name: "Datos generales" });
    expect(heading).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Datos generales" })).toHaveTextContent("Contenido");
    expect(screen.getByText("Información del cliente")).toBeInTheDocument();
    expect(screen.getByText("Actualizado hoy")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("collapses with the toggle button and the header (uncontrolled)", () => {
    const onCollapsedChange = vi.fn();
    const { container } = render(
      <CnSectionCard title="Plegable" collapsible onCollapsedChange={onCollapsedChange}>
        Cuerpo
      </CnSectionCard>,
    );
    const toggle = screen.getByRole("button", { name: "Contraer sección" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("button", { name: "Expandir sección" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    fireEvent.click(container.querySelector("[data-cn-section-header]") as HTMLElement);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  it("respects the controlled collapsed prop", () => {
    const onCollapsedChange = vi.fn();
    render(
      <CnSectionCard title="Controlada" collapsible collapsed onCollapsedChange={onCollapsedChange}>
        Cuerpo
      </CnSectionCard>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Expandir sección" }));
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: "Expandir sección" })).toBeInTheDocument();
  });

  it("does not toggle when clicking header actions", () => {
    const onCollapsedChange = vi.fn();
    render(
      <CnSectionCard
        title="Acciones"
        collapsible
        onCollapsedChange={onCollapsedChange}
        headerActions={<button type="button">Editar</button>}
      >
        Cuerpo
      </CnSectionCard>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(onCollapsedChange).not.toHaveBeenCalled();
  });

  it("shows loading, empty and error states", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <CnSectionCard title="Estados" loading>
        Cuerpo
      </CnSectionCard>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "section-body");
    expect(screen.queryByText("Cuerpo")).not.toBeInTheDocument();

    rerender(<CnSectionCard title="Estados" empty emptyState={{ title: "Nada por aquí" }} />);
    expect(screen.getByText("Nada por aquí")).toBeInTheDocument();

    rerender(<CnSectionCard title="Estados" error="Falló la carga" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falló la carga");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("nests sections with a lower heading level", () => {
    const { container } = render(
      <CnSectionCard title="Padre">
        <CnSectionCard title="Hija">Interno</CnSectionCard>
      </CnSectionCard>,
    );
    expect(screen.getByRole("heading", { level: 4, name: "Hija" })).toBeInTheDocument();
    expect(container.querySelector('[data-cn-section-depth="1"]')).not.toBeNull();
  });

  it("renders repeatable controls unless read-only", () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const { rerender } = render(
      <CnSectionCard title="Contacto 1" onAdd={onAdd} onRemove={onRemove} dragHandle>
        Campos
      </CnSectionCard>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar sección" }));
    fireEvent.click(screen.getByRole("button", { name: "Añadir" }));
    expect(onRemove).toHaveBeenCalled();
    expect(onAdd).toHaveBeenCalled();
    expect(screen.getByLabelText("Arrastrar para reordenar")).toBeInTheDocument();
    rerender(
      <CnSectionCard title="Contacto 1" onAdd={onAdd} onRemove={onRemove} dragHandle readOnly>
        Campos
      </CnSectionCard>,
    );
    expect(screen.queryByRole("button", { name: "Eliminar sección" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Añadir" })).not.toBeInTheDocument();
  });

  it("makes the header sticky", () => {
    const { container } = render(
      <CnSectionCard title="Fija" stickyHeader={56}>
        Cuerpo
      </CnSectionCard>,
    );
    const header = container.querySelector("[data-cn-section-header]") as HTMLElement;
    expect(getComputedStyle(header).position).toBe("sticky");
    expect(getComputedStyle(header).top).toBe("56px");
  });

  it("renders the skeleton via the skeleton prop", () => {
    render(
      <CnSectionCard title="Pedido" skeleton>
        Cuerpo
      </CnSectionCard>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "section-card");
    expect(screen.queryByText("Pedido")).not.toBeInTheDocument();
  });
});

describe("CnSectionCardSkeleton", () => {
  it("is a single status with header, body and footer pieces", () => {
    const { container, rerender } = render(<CnSectionCardSkeleton footer headerActions={2} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(container.querySelector("[data-cn-section-skeleton-footer]")).not.toBeNull();
    rerender(<CnSectionCardSkeleton lines={0} hideHeader />);
    expect(container.querySelector("[data-cn-section-skeleton-header]")).toBeNull();
    expect(container.querySelector("[data-cn-section-skeleton-body]")).toBeNull();
  });
});
