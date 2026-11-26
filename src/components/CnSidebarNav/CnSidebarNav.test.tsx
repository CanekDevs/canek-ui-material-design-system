import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CnSidebarNav } from "./CnSidebarNav";
import { CnSidebarNavSkeleton } from "./CnSidebarNavSkeleton";
import { CRM_NAV } from "./nav-sample";

describe("CnSidebarNav", () => {
  it("es una navegación con nombre y marca la página actual", () => {
    render(<CnSidebarNav sections={CRM_NAV} activeId="contactos" />);
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    const current = within(nav).getByRole("link", { name: "Contactos" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: /Bandeja/ })).not.toHaveAttribute("aria-current");
  });

  it("abre al padre de la página actual y cierra o abre los padres al hacer clic", async () => {
    const user = userEvent.setup();
    render(<CnSidebarNav sections={CRM_NAV} activeId="pronostico" />);
    const parent = screen.getByRole("button", { name: /Oportunidades/ });
    expect(parent).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Pronóstico" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await user.click(parent);
    expect(parent).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Pronóstico" })).not.toBeInTheDocument();
  });

  it("avisa la navegación con la página elegida", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn((_item, event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(<CnSidebarNav sections={CRM_NAV} onNavigate={onNavigate} />);
    await user.click(screen.getByRole("link", { name: "Empresas" }));
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "empresas" }),
      expect.anything(),
    );
  });

  it("no navega a páginas deshabilitadas", () => {
    const onNavigate = vi.fn();
    render(<CnSidebarNav sections={CRM_NAV} onNavigate={onNavigate} />);
    const metas = screen.getByRole("button", { name: "Metas" });
    expect(metas).toBeDisabled();
    fireEvent.click(metas);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("abre al padre cuando la página actual cambia a una subpágina", () => {
    const { rerender } = render(<CnSidebarNav sections={CRM_NAV} activeId="inicio" />);
    expect(screen.getByRole("button", { name: /Oportunidades/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    rerender(<CnSidebarNav sections={CRM_NAV} activeId="embudo" />);
    expect(screen.getByRole("button", { name: /Oportunidades/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("anuncia las insignias en el nombre accesible del modo mini y abre un menú con subpáginas", async () => {
    const user = userEvent.setup();
    render(<CnSidebarNav sections={CRM_NAV} collapsed />);
    expect(screen.getByRole("link", { name: "Bandeja (12)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Oportunidades" }));
    const menu = await screen.findByRole("menu", { name: "Oportunidades" });
    expect(within(menu).getByRole("menuitem", { name: /Embudo/ })).toBeInTheDocument();
  });

  it("muestra el botón para contraer solo con onCollapsedChange", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const { rerender } = render(<CnSidebarNav sections={CRM_NAV} />);
    expect(screen.queryByRole("button", { name: "Contraer menú" })).not.toBeInTheDocument();
    rerender(<CnSidebarNav sections={CRM_NAV} onCollapsedChange={onCollapsedChange} />);
    await user.click(screen.getByRole("button", { name: "Contraer menú" }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
  });

  it("agrega favoritos y los muestra en su propio grupo", async () => {
    const user = userEvent.setup();
    const onFavoriteChange = vi.fn();
    render(
      <CnSidebarNav
        sections={CRM_NAV}
        favorites={["reportes"]}
        onFavoriteChange={onFavoriteChange}
      />,
    );
    expect(screen.getByText("Favoritos")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Reportes" })).toHaveLength(2);
    const star = screen.getAllByRole("button", { name: "Quitar de favoritos: Reportes" })[0];
    expect(star).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Agregar a favoritos: Empresas" }));
    expect(onFavoriteChange).toHaveBeenCalledWith("empresas", true);
  });

  it("pliega un grupo desde su encabezado", async () => {
    const user = userEvent.setup();
    render(<CnSidebarNav sections={CRM_NAV} />);
    const header = screen.getByRole("button", { name: "Análisis" });
    expect(header).toHaveAttribute("aria-expanded", "true");
    await user.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Reportes" })).not.toBeInTheDocument();
  });

  describe("teclado", () => {
    it("las flechas, Inicio y Fin recorren las páginas", () => {
      render(<CnSidebarNav sections={CRM_NAV} />);
      const inicio = screen.getByRole("link", { name: "Inicio" });
      inicio.focus();
      fireEvent.keyDown(inicio, { key: "ArrowDown" });
      expect(screen.getByRole("link", { name: /Bandeja/ })).toHaveFocus();
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
      expect(inicio).toHaveFocus();
      fireEvent.keyDown(inicio, { key: "End" });
      expect(screen.getByRole("link", { name: "Ajustes" })).toHaveFocus();
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" });
      expect(inicio).toHaveFocus();
    });

    it("derecha abre un padre, izquierda lo cierra y desde una subpágina vuelve al padre", () => {
      render(<CnSidebarNav sections={CRM_NAV} />);
      const parent = screen.getByRole("button", { name: /Oportunidades/ });
      parent.focus();
      fireEvent.keyDown(parent, { key: "ArrowRight" });
      expect(parent).toHaveAttribute("aria-expanded", "true");
      const child = screen.getByRole("link", { name: "Embudo" });
      child.focus();
      fireEvent.keyDown(child, { key: "ArrowLeft" });
      expect(parent).toHaveFocus();
      fireEvent.keyDown(parent, { key: "ArrowLeft" });
      expect(parent).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("acepta grupos vacíos y textos extremos sin perderlos", () => {
    const long = "x".repeat(300);
    render(
      <CnSidebarNav
        sections={[
          { id: "a", label: "Vacío", items: [] },
          { id: "b", items: [{ id: "l", label: long, href: "#l", badge: 125000 }] },
        ]}
      />,
    );
    expect(screen.getByText(long)).toBeInTheDocument();
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<CnSidebarNav skeleton sections={CRM_NAV} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

describe("CnSidebarNavSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnSidebarNavSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "sidebar-nav");
  });
});
