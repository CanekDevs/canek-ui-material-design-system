import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CnTopBar } from "./CnTopBar";
import { CnTopBarSkeleton } from "./CnTopBarSkeleton";

const user = {
  name: "Lucía Méndez",
  detail: "lucia@empresa.mx",
  actions: [
    { id: "perfil", label: "Mi perfil", icon: "person", onClick: vi.fn() },
    { id: "salir", label: "Cerrar sesión", icon: "logout", danger: true, onClick: vi.fn() },
  ],
};

describe("CnTopBar", () => {
  it("es un encabezado con el título de la sección", () => {
    render(<CnTopBar title="Contactos" />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contactos" })).toBeInTheDocument();
  });

  it("muestra el botón de menú solo con onMenuClick y refleja si el menú está abierto", async () => {
    const onMenuClick = vi.fn();
    const { rerender } = render(<CnTopBar title="Inicio" />);
    expect(screen.queryByRole("button", { name: "Abrir menú" })).not.toBeInTheDocument();
    rerender(<CnTopBar title="Inicio" onMenuClick={onMenuClick} menuOpen={false} />);
    const button = screen.getByRole("button", { name: "Abrir menú" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(button);
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it("el botón de búsqueda abre la paleta y muestra su atajo", async () => {
    const onSearchClick = vi.fn();
    render(<CnTopBar onSearchClick={onSearchClick} searchPlaceholder="Buscar o ir a…" />);
    const button = screen.getByRole("button", { name: "Buscar o ir a…" });
    expect(button).toHaveAttribute("aria-keyshortcuts");
    expect(within(button).getByText("K")).toBeInTheDocument();
    await userEvent.click(button);
    expect(onSearchClick).toHaveBeenCalled();
  });

  it("abre el menú de usuario con sus acciones y lo cierra al elegir una", async () => {
    render(<CnTopBar user={user} />);
    const trigger = screen.getByRole("button", { name: "Menú de Lucía Méndez" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await userEvent.click(trigger);
    const menu = await screen.findByRole("menu", { name: "Menú de Lucía Méndez" });
    const items = within(menu).getAllByRole("menuitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Mi perfil");
    expect(items[1]).toHaveTextContent("Cerrar sesión");
    await userEvent.click(within(menu).getByRole("menuitem", { name: /Cerrar sesión/ }));
    expect(user.actions[1].onClick).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Escape cierra el menú de usuario", async () => {
    render(<CnTopBar user={user} />);
    await userEvent.click(screen.getByRole("button", { name: "Menú de Lucía Méndez" }));
    const menu = await screen.findByRole("menu");
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Menú de Lucía Méndez" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  describe("compacta", () => {
    it("oculta el título y deja la búsqueda como ícono", async () => {
      const onSearchClick = vi.fn();
      render(<CnTopBar compact title="Contactos" onSearchClick={onSearchClick} />);
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Buscar o ir a…" }));
      expect(onSearchClick).toHaveBeenCalled();
    });

    it("abre la búsqueda propia encima de la barra y Escape la cierra", async () => {
      render(<CnTopBar compact search={<input aria-label="Buscar contactos" />} />);
      expect(screen.queryByRole("textbox", { name: "Buscar contactos" })).not.toBeInTheDocument();
      const toggle = screen.getByRole("button", { name: "Buscar o ir a…" });
      await userEvent.click(toggle);
      const input = screen.getByRole("textbox", { name: "Buscar contactos" });
      fireEvent.keyDown(input, { key: "Escape" });
      expect(screen.queryByRole("textbox", { name: "Buscar contactos" })).not.toBeInTheDocument();
    });

    it("se compacta sola cuando el contenedor es angosto", () => {
      const original = globalThis.ResizeObserver;
      const rect = vi
        .spyOn(HTMLElement.prototype, "getBoundingClientRect")
        .mockReturnValue({ width: 360 } as DOMRect);
      globalThis.ResizeObserver = class {
        observe() {}
        disconnect() {}
        unobserve() {}
      } as unknown as typeof ResizeObserver;
      render(<CnTopBar title="Contactos" />);
      expect(screen.getByRole("banner")).toHaveAttribute("data-compact", "true");
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      rect.mockRestore();
      globalThis.ResizeObserver = original;
    });
  });

  it("acepta textos extremos sin perderlos", () => {
    const long = "x".repeat(300);
    render(<CnTopBar title={long} />);
    expect(screen.getByText(long)).toBeInTheDocument();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<CnTopBar skeleton title="Contactos" />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByText("Contactos")).not.toBeInTheDocument();
  });
});

describe("CnTopBarSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnTopBarSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "top-bar");
  });
});
