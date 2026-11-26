import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CRM_COMMANDS } from "../CnCommandPalette/commands-sample";
import { CRM_NAV } from "../CnSidebarNav/nav-sample";
import { CnAppShell } from "./CnAppShell";
import type { CnAppShellProps } from "./CnAppShell";
import { CnAppShellSkeleton } from "./CnAppShellSkeleton";

const setup = (props: Partial<CnAppShellProps> = {}) =>
  render(
    <CnAppShell
      height={600}
      nav={{ sections: CRM_NAV, activeId: "contactos" }}
      topBar={{ title: "Contactos" }}
      {...props}
    >
      <p>Contenido de la página</p>
    </CnAppShell>,
  );

describe("CnAppShell", () => {
  it("tiene navegación, encabezado y contenido principal con enlace para saltar", () => {
    setup();
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    const main = screen.getByRole("main");
    expect(within(main).getByText("Contenido de la página")).toBeInTheDocument();
    const skip = screen.getByRole("link", { name: "Saltar al contenido" });
    fireEvent.click(skip);
    expect(main).toHaveFocus();
  });

  it("en escritorio el botón de menú contrae y expande la navegación", async () => {
    const onCollapsedChange = vi.fn();
    setup({ onCollapsedChange });
    const nav = screen.getByRole("navigation");
    await userEvent.click(screen.getByRole("button", { name: "Contraer menú" }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(nav).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("button", { name: "Expandir menú" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("sin barra superior, el botón para contraer está al pie de la navegación", () => {
    setup({ topBar: undefined });
    expect(
      within(screen.getByRole("navigation")).getByRole("button", { name: "Contraer menú" }),
    ).toBeInTheDocument();
  });

  it("en móvil la navegación es un cajón que se cierra al navegar", async () => {
    const onNavigate = vi.fn((_i, e: { preventDefault: () => void }) => e.preventDefault());
    setup({ mobile: true, nav: { sections: CRM_NAV, onNavigate } });
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    const menu = screen.getByRole("button", { name: "Abrir menú" });
    await userEvent.click(menu);
    const nav = await screen.findByRole("navigation");
    await userEvent.click(within(nav).getByRole("link", { name: "Empresas" }));
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "empresas" }),
      expect.anything(),
    );
    await waitFor(() => expect(screen.queryByRole("navigation")).not.toBeInTheDocument());
  });

  it("decide móvil por el ancho del contenedor", () => {
    const original = globalThis.ResizeObserver;
    const rect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ width: 480 } as DOMRect);
    globalThis.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
    const { container } = setup();
    expect(container.querySelector("[data-cn-app-shell]")).toHaveAttribute("data-mobile", "true");
    rect.mockRestore();
    globalThis.ResizeObserver = original;
  });

  it("el botón de búsqueda de la barra abre la paleta de comandos", async () => {
    setup({ topBar: { title: "Contactos" }, commandPalette: { commands: CRM_COMMANDS } });
    await userEvent.click(screen.getByRole("button", { name: "Buscar o ir a…" }));
    expect(await screen.findByRole("dialog", { name: "Paleta de comandos" })).toBeInTheDocument();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    setup({ skeleton: true });
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });
});

describe("CnAppShellSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnAppShellSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "app-shell");
  });
});
