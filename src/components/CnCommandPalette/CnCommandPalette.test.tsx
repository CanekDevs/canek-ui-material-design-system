import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnCommandPalette } from "./CnCommandPalette";
import type { CnCommandPaletteProps } from "./CnCommandPalette";
import { CnCommandPaletteSkeleton } from "./CnCommandPaletteSkeleton";
import { filterCommands, groupCommands } from "./command-utils";
import { CRM_COMMANDS } from "./commands-sample";

const Harness = (props: Partial<CnCommandPaletteProps> & { initialOpen?: boolean }) => {
  const { initialOpen = true, ...rest } = props;
  const [open, setOpen] = useState(initialOpen);
  return <CnCommandPalette commands={CRM_COMMANDS} open={open} onOpenChange={setOpen} {...rest} />;
};

const input = () => screen.getByRole("combobox", { name: "Paleta de comandos" });
const selected = () =>
  screen.getAllByRole("option").find((o) => o.getAttribute("aria-selected") === "true");

describe("filterCommands", () => {
  it("encuentra sin acentos ni mayúsculas, por palabras clave y descripción", () => {
    expect(filterCommands(CRM_COMMANDS, "lucia").map((c) => c.id)).toEqual(["c-lucia"]);
    expect(filterCommands(CRM_COMMANDS, "pipeline").map((c) => c.id)).toEqual(["ir-embudo"]);
    expect(filterCommands(CRM_COMMANDS, "monterrey").map((c) => c.id)).toEqual(["e-ferremex"]);
  });

  it("exige todas las palabras y pone primero lo que empieza con la búsqueda", () => {
    expect(filterCommands(CRM_COMMANDS, "crear tarea").map((c) => c.id)).toEqual(["nueva-tarea"]);
    const ids = filterCommands(CRM_COMMANDS, "em").map((c) => c.id);
    expect(ids[0]).toBe("ir-empresas");
    expect(ids).toContain("ir-embudo");
  });

  it("respeta el máximo y agrupa en el orden de aparición", () => {
    expect(filterCommands(CRM_COMMANDS, "", 3)).toHaveLength(3);
    expect(groupCommands(CRM_COMMANDS).map((g) => g.name)).toEqual([
      "Páginas",
      "Acciones",
      "Contactos",
      "Empresas",
    ]);
  });
});

describe("CnCommandPalette", () => {
  it("es un diálogo con un combobox que controla una lista agrupada", () => {
    render(<Harness />);
    expect(screen.getByRole("dialog", { name: "Paleta de comandos" })).toBeInTheDocument();
    const box = input();
    expect(box).toHaveAttribute("aria-expanded", "true");
    const list = screen.getByRole("listbox", { name: "Resultados" });
    expect(box).toHaveAttribute("aria-controls", list.id);
    expect(within(list).getByRole("group", { name: "Acciones" })).toBeInTheDocument();
    expect(box).toHaveFocus();
  });

  it("el primer comando queda activo y las flechas lo mueven saltando los deshabilitados", () => {
    render(<Harness />);
    expect(selected()).toHaveTextContent("Inicio");
    expect(input()).toHaveAttribute("aria-activedescendant", selected()?.id);
    fireEvent.change(input(), { target: { value: "importar" } });
    // el único resultado está deshabilitado: nada queda activo
    expect(selected()).toBeUndefined();
    fireEvent.change(input(), { target: { value: "crear" } });
    expect(selected()).toHaveTextContent("Crear contacto");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(selected()).toHaveTextContent("Crear oportunidad");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(selected()).toHaveTextContent("Crear tarea");
  });

  it("Intro ejecuta el comando activo y cierra", async () => {
    const onSelect = vi.fn();
    const own = vi.fn();
    const commands = CRM_COMMANDS.map((c) =>
      c.id === "nueva-tarea" ? { ...c, onSelect: own } : c,
    );
    render(<Harness commands={commands} onSelect={onSelect} />);
    fireEvent.change(input(), { target: { value: "tarea" } });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(own).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "nueva-tarea" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("el clic elige y los deshabilitados no hacen nada", async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("option", { name: /Importar contactos/ }));
    expect(onSelect).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("option", { name: /Reportes/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "ir-reportes" }));
  });

  it("muestra los recientes primero con la búsqueda vacía", () => {
    render(<Harness recent={["c-lucia", "no-existe"]} />);
    const groups = screen.getAllByRole("group");
    expect(groups[0]).toHaveAccessibleName("Recientes");
    expect(within(groups[0]).getAllByRole("option")).toHaveLength(1);
    // al buscar, Recientes desaparece
    fireEvent.change(input(), { target: { value: "lucia" } });
    expect(screen.queryByRole("group", { name: "Recientes" })).not.toBeInTheDocument();
  });

  it("dice cuando no hay resultados y cuenta los que hay", () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: "zzzz" } });
    expect(screen.getByText("Sin resultados. Prueba con otras palabras.")).toBeInTheDocument();
    expect(screen.getByText("0 resultados")).toBeInTheDocument();
    fireEvent.change(input(), { target: { value: "lucia" } });
    expect(screen.getByText("1 resultado")).toBeInTheDocument();
  });

  it("Escape cierra y el atajo global la abre", async () => {
    render(<Harness initialOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "k", code: "KeyK", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(input(), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("con hotkey={false} no escucha el teclado global", () => {
    render(<Harness initialOpen={false} hotkey={false} />);
    fireEvent.keyDown(window, { key: "k", code: "KeyK", ctrlKey: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("búsqueda controlada y estado de carga", () => {
    const onQueryChange = vi.fn();
    render(<Harness query="emp" onQueryChange={onQueryChange} loading />);
    expect(input()).toHaveValue("emp");
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    fireEvent.change(input(), { target: { value: "empr" } });
    expect(onQueryChange).toHaveBeenCalledWith("empr");
  });

  it("acepta textos extremos sin perderlos", () => {
    const long = "x".repeat(300);
    render(<Harness commands={[{ id: "l", label: long, description: long }]} />);
    expect(screen.getAllByText(long)).toHaveLength(2);
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<Harness skeleton />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});

describe("CnCommandPaletteSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnCommandPaletteSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "command-palette");
  });
});
