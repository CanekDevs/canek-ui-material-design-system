import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnActivityComposer } from "./CnActivityComposer";
import { CnActivityComposerSkeleton } from "./CnActivityComposerSkeleton";
import { extractMentions, filterMentionables, findMentionQuery } from "./mentions";

const PEOPLE = [
  { id: "u1", name: "Carlos Méndez", description: "Ventas" },
  { id: "u2", name: "Lucía Ramírez", description: "Preventa" },
];

const typeIn = (element: HTMLElement, value: string) => {
  const textarea = element as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value, selectionStart: value.length } });
  textarea.setSelectionRange(value.length, value.length);
};

describe("mentions", () => {
  it("encuentra la mención en curso solo después de un espacio o al inicio", () => {
    expect(findMentionQuery("Hola @car", 9)).toEqual({ start: 5, query: "car" });
    expect(findMentionQuery("@", 1)).toEqual({ start: 0, query: "" });
    expect(findMentionQuery("correo@empresa", 14)).toBeNull();
    expect(findMentionQuery("Hola @carlos mendez y", 21)).toBeNull();
  });

  it("filtra sin acentos y extrae las menciones del texto", () => {
    expect(filterMentionables(PEOPLE, "lucia").map((p) => p.id)).toEqual(["u2"]);
    expect(filterMentionables(PEOPLE, "")).toHaveLength(2);
    expect(extractMentions("Avisar a @Carlos Méndez hoy", PEOPLE)).toEqual(["u1"]);
  });
});

describe("CnActivityComposer", () => {
  it("es un formulario con pestañas por tipo de actividad", () => {
    render(<CnActivityComposer onSubmit={vi.fn()} />);
    expect(screen.getByRole("form", { name: "Registrar actividad" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Nota/ })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: /Llamada/ }));
    expect(screen.getByRole("button", { name: "Registrar llamada" })).toBeInTheDocument();
  });

  it("sin texto no deja guardar", () => {
    render(<CnActivityComposer onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Guardar nota" })).toBeDisabled();
  });

  it("guarda con el tipo, el texto y las menciones y luego limpia", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CnActivityComposer onSubmit={onSubmit} mentionables={PEOPLE} />);
    const box = screen.getByRole("combobox", { name: "Nota" });
    typeIn(box, "Hablar con @Carlos Méndez del contrato");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Guardar nota" }));
    });
    expect(onSubmit).toHaveBeenCalledWith({
      type: "note",
      body: "Hablar con @Carlos Méndez del contrato",
      mentions: ["u1"],
    });
    expect(box).toHaveValue("");
  });

  it("Ctrl + Enter guarda", async () => {
    const onSubmit = vi.fn();
    render(<CnActivityComposer onSubmit={onSubmit} />);
    const box = screen.getByRole("textbox", { name: "Nota" });
    typeIn(box, "Nota rápida");
    await act(async () => {
      fireEvent.keyDown(box, { key: "Enter", ctrlKey: true });
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ body: "Nota rápida" }));
  });

  it("al escribir @ sugiere personas y se eligen con flechas y Enter", () => {
    render(<CnActivityComposer onSubmit={vi.fn()} mentionables={PEOPLE} />);
    const box = screen.getByRole("combobox", { name: "Nota" });
    typeIn(box, "Avisar a @");
    expect(box).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option")).toHaveLength(2);
    fireEvent.keyDown(box, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(box, { key: "Enter" });
    expect(box).toHaveValue("Avisar a @Lucía Ramírez ");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Escape cierra las sugerencias sin borrar el texto", () => {
    render(<CnActivityComposer onSubmit={vi.fn()} mentionables={PEOPLE} />);
    const box = screen.getByRole("combobox", { name: "Nota" });
    typeIn(box, "@car");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(box, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(box).toHaveValue("@car");
  });

  it("en llamada agrega duración en minutos", async () => {
    const onSubmit = vi.fn();
    render(<CnActivityComposer onSubmit={onSubmit} defaultType="call" />);
    typeIn(screen.getByRole("textbox", { name: "Llamada" }), "Revisamos precios");
    fireEvent.change(screen.getByLabelText("Duración (min)"), { target: { value: "12" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Registrar llamada" }));
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ type: "call", durationMinutes: 12 }),
    );
  });

  it("una tarea manda prioridad normal por defecto", async () => {
    const onSubmit = vi.fn();
    render(<CnActivityComposer onSubmit={onSubmit} defaultType="task" />);
    typeIn(screen.getByRole("textbox", { name: "Tarea" }), "Enviar contrato");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Crear tarea" }));
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ type: "task", priority: "normal" }),
    );
  });

  it("si guardar falla muestra el error y conserva el texto", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Sin conexión"));
    render(<CnActivityComposer onSubmit={onSubmit} />);
    const box = screen.getByRole("textbox", { name: "Nota" });
    typeIn(box, "No perder esto");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Guardar nota" }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Sin conexión");
    expect(box).toHaveValue("No perder esto");
  });

  it("Cancelar solo aparece con onCancel", () => {
    const onCancel = vi.fn();
    const { rerender } = render(<CnActivityComposer onSubmit={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    rerender(<CnActivityComposer onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("con un solo tipo no muestra pestañas", () => {
    render(<CnActivityComposer onSubmit={vi.fn()} types={["note"]} />);
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("deshabilitado bloquea el texto", () => {
    render(<CnActivityComposer onSubmit={vi.fn()} disabled />);
    expect(screen.getByRole("textbox", { name: "Nota" })).toBeDisabled();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<CnActivityComposer skeleton onSubmit={vi.fn()} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });
});

describe("CnActivityComposerSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnActivityComposerSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "activity-composer");
  });
});
