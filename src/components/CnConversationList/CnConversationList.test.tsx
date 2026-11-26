import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CnConversationList, conversationBucket } from "./CnConversationList";
import type { CnConversationListProps } from "./CnConversationList";
import { CnConversationListSkeleton } from "./CnConversationListSkeleton";
import { CONVERSATIONS_NOW, CRM_CONVERSATIONS } from "./conversations-sample";

const setup = (props: Partial<CnConversationListProps> = {}) =>
  render(
    <CnConversationList conversations={CRM_CONVERSATIONS} now={CONVERSATIONS_NOW} {...props} />,
  );

const item = (name: RegExp | string) => screen.getByRole("button", { name });

describe("conversationBucket", () => {
  it("separa fijadas, hoy, ayer, últimos 7 días, anteriores y sin fecha", () => {
    const now = new Date(2026, 10, 26, 12);
    expect(
      conversationBucket({ id: "a", title: "a", pinned: true, time: new Date(2020, 0, 1) }, now),
    ).toBe("Fijadas");
    expect(conversationBucket({ id: "a", title: "a", time: new Date(2026, 10, 26, 1) }, now)).toBe(
      "Hoy",
    );
    expect(conversationBucket({ id: "a", title: "a", time: new Date(2026, 10, 25, 23) }, now)).toBe(
      "Ayer",
    );
    expect(conversationBucket({ id: "a", title: "a", time: new Date(2026, 10, 21) }, now)).toBe(
      "Últimos 7 días",
    );
    expect(conversationBucket({ id: "a", title: "a", time: new Date(2026, 9, 1) }, now)).toBe(
      "Anteriores",
    );
    expect(conversationBucket({ id: "a", title: "a" }, now)).toBe("Sin fecha");
  });
});

describe("CnConversationList", () => {
  it("agrupa por fecha en orden y marca la actual", () => {
    setup({ selectedId: "c1" });
    const nav = screen.getByRole("navigation", { name: "Conversaciones" });
    const lists = within(nav).getAllByRole("list");
    expect(
      lists.map(
        (l) =>
          l.getAttribute("aria-labelledby") &&
          document.getElementById(l.getAttribute("aria-labelledby") ?? "")?.textContent,
      ),
    ).toEqual(["Fijadas", "Hoy", "Ayer", "Últimos 7 días", "Anteriores"]);
    expect(item(/Lucía Méndez · Grupo Bajío/)).toHaveAttribute("aria-current", "true");
  });

  it("anuncia los no leídos y elige al hacer clic", async () => {
    const onSelect = vi.fn();
    setup({ onSelect });
    expect(item(/Equipo de ventas Norte/)).toHaveAccessibleName(
      expect.stringContaining("14 sin leer"),
    );
    await userEvent.click(item(/^Andrés Núñez/));
    expect(onSelect).toHaveBeenCalledWith("c4");
  });

  it("busca sin acentos en título y último mensaje", () => {
    setup();
    const search = screen.getByRole("searchbox", { name: "Buscar conversaciones" });
    fireEvent.change(search, { target: { value: "flete" } });
    expect(screen.getAllByRole("button", { name: /Grupo Bajío/ })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Andrés/ })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.getByText("Sin conversaciones para «zzz».")).toBeInTheDocument();
  });

  it("fija, renombra y borra desde el menú", async () => {
    const user = userEvent.setup();
    const onPinChange = vi.fn();
    const onRename = vi.fn();
    const onDelete = vi.fn();
    setup({ onPinChange, onRename, onDelete });

    await user.click(screen.getByRole("button", { name: "Acciones de Andrés Núñez" }));
    await user.click(await screen.findByRole("menuitem", { name: /Fijar/ }));
    expect(onPinChange).toHaveBeenCalledWith("c4", true);

    await user.click(screen.getByRole("button", { name: "Acciones de Ferremex del Norte" }));
    expect(await screen.findByRole("menuitem", { name: /Quitar de fijadas/ })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /Renombrar/ }));
    const input = await screen.findByRole("textbox", {
      name: "Nuevo nombre para Ferremex del Norte",
    });
    await user.clear(input);
    await user.type(input, "Ferremex Monterrey{Enter}");
    expect(onRename).toHaveBeenCalledWith("c2", "Ferremex Monterrey");

    await user.click(screen.getByRole("button", { name: "Acciones de Andrés Núñez" }));
    await user.click(await screen.findByRole("menuitem", { name: /Borrar/ }));
    expect(onDelete).toHaveBeenCalledWith("c4");
  });

  it("F2 renombra, Escape cancela y un nombre vacío no se guarda", async () => {
    const onRename = vi.fn();
    setup({ onRename });
    const target = item(/^Andrés Núñez/);
    target.focus();
    fireEvent.keyDown(target, { key: "F2" });
    const input = screen.getByRole("textbox", { name: "Nuevo nombre para Andrés Núñez" });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("textbox", { name: /Nuevo nombre/ })).not.toBeInTheDocument();
    fireEvent.keyDown(item(/^Andrés Núñez/), { key: "F2" });
    const again = screen.getByRole("textbox", { name: "Nuevo nombre para Andrés Núñez" });
    fireEvent.change(again, { target: { value: "   " } });
    fireEvent.keyDown(again, { key: "Enter" });
    expect(onRename).not.toHaveBeenCalled();
  });

  it("las flechas, Inicio y Fin recorren las conversaciones", () => {
    setup();
    const first = screen
      .getAllByRole("button")
      .find((b) => b.hasAttribute("data-cn-conversation")) as HTMLElement;
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(document.activeElement).not.toBe(first);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "ArrowUp" });
    expect(item(/Soporte · Pedido/)).toHaveFocus();
  });

  it("sin acciones no muestra menú y vacía muestra su texto", () => {
    const { rerender } = setup();
    expect(screen.queryByRole("button", { name: /^Acciones de/ })).not.toBeInTheDocument();
    rerender(<CnConversationList conversations={[]} />);
    expect(screen.getByText("No hay conversaciones.")).toBeInTheDocument();
  });

  it("acepta textos extremos sin perderlos", () => {
    const long = "x".repeat(300);
    setup({ conversations: [{ id: "l", title: long, preview: long, unread: 999 }] });
    expect(screen.getAllByText(long)).toHaveLength(2);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    setup({ skeleton: true });
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

describe("CnConversationListSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnConversationListSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "conversation-list");
  });
});
