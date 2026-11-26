import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CnEmailComposer } from "./CnEmailComposer";
import type { CnEmailComposerProps } from "./CnEmailComposer";
import { CnEmailComposerSkeleton } from "./CnEmailComposerSkeleton";
import { fillVariables, isEmail, missingVariables } from "./email-utils";

const VARIABLES = [
  { key: "nombre", label: "Nombre", value: "Lucía" },
  { key: "fecha", label: "Fecha" },
];
const TEMPLATES = [
  { id: "t", name: "Cotización", subject: "Hola {{nombre}}", body: "<p>Hola {{nombre}}</p>" },
];

const setup = (props: Partial<CnEmailComposerProps> = {}) =>
  render(<CnEmailComposer variables={VARIABLES} templates={TEMPLATES} {...props} />);

describe("email-utils", () => {
  it("valida correos", () => {
    expect(isEmail("lucia@empresa.mx")).toBe(true);
    expect(isEmail(" a@b.co ")).toBe(true);
    expect(isEmail("lucia@")).toBe(false);
    expect(isEmail("sin arroba.mx")).toBe(false);
  });

  it("reemplaza variables con valor y reporta las que faltan", () => {
    expect(fillVariables("Hola {{nombre}}, el {{ fecha }}", VARIABLES)).toBe(
      "Hola Lucía, el {{ fecha }}",
    );
    expect(missingVariables("{{nombre}} {{fecha}} {{otra}}", VARIABLES)).toEqual(["fecha", "otra"]);
  });
});

describe("CnEmailComposer", () => {
  it("es un formulario con nombre y campos etiquetados", () => {
    setup({ onSend: vi.fn() });
    const form = screen.getByRole("form", { name: "Redactar correo" });
    expect(within(form).getByRole("group", { name: /Para/ })).toBeInTheDocument();
    expect(within(form).getByRole("textbox", { name: "Asunto" })).toBeInTheDocument();
    expect(within(form).getByRole("button", { name: "Enviar" })).toBeInTheDocument();
  });

  it("no envía sin destinatarios y lo explica", async () => {
    const onSend = vi.fn();
    setup({ onSend });
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText("Agrega al menos un destinatario.")).toBeInTheDocument();
  });

  it("envía con las variables ya reemplazadas", async () => {
    const onSend = vi.fn();
    setup({
      onSend,
      defaultValue: {
        to: ["lucia@empresa.mx"],
        subject: "Hola {{nombre}}",
        body: "<p>Hola {{nombre}}</p>",
      },
    });
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["lucia@empresa.mx"],
        subject: "Hola Lucía",
        body: "<p>Hola Lucía</p>",
      }),
    );
  });

  it("bloquea el envío si una variable usada no tiene valor", async () => {
    const onSend = vi.fn();
    setup({
      onSend,
      defaultValue: { to: ["lucia@empresa.mx"], subject: "Entrega el {{fecha}}", body: "" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText(/Faltan valores para: \{\{fecha\}\}/)).toBeInTheDocument();
  });

  it("muestra el error del servidor cuando el envío falla", async () => {
    const onSend = vi.fn().mockRejectedValue(new Error("Límite diario alcanzado."));
    setup({
      onSend,
      defaultValue: { to: ["lucia@empresa.mx"], subject: "Hola", body: "<p>x</p>" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("Límite diario alcanzado.")).toBeInTheDocument();
  });

  it("Ctrl + Intro envía", async () => {
    const onSend = vi.fn();
    setup({ onSend, defaultValue: { to: ["lucia@empresa.mx"], subject: "Hola", body: "" } });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Asunto" }), {
      key: "Enter",
      ctrlKey: true,
    });
    await waitFor(() => expect(onSend).toHaveBeenCalled());
  });

  it("aplica una plantilla desde el menú", async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.click(screen.getByRole("button", { name: "Plantillas" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Cotización" }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ subject: "Hola {{nombre}}", body: "<p>Hola {{nombre}}</p>" }),
    );
  });

  it("inserta una variable al final del cuerpo", async () => {
    const onChange = vi.fn();
    setup({ onChange, defaultValue: { body: "<p>Hola</p>" } });
    await userEvent.click(screen.getByRole("button", { name: "Insertar variable" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Nombre/ }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ body: "<p>Hola {{nombre}}</p>" }),
    );
  });

  it("CC y CCO aparecen al pedirlos", async () => {
    setup();
    expect(screen.queryByRole("group", { name: /^CC/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Agregar CC" }));
    expect(screen.getByRole("group", { name: /^CC$/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Agregar CCO" }));
    expect(screen.getByRole("group", { name: /CCO/ })).toBeInTheDocument();
  });

  it("la vista previa muestra el asunto resuelto", async () => {
    setup({ defaultValue: { to: ["a@b.mx"], subject: "Hola {{nombre}}" } });
    await userEvent.click(screen.getByRole("button", { name: "Vista previa" }));
    const region = screen.getByRole("region", { name: "Vista previa del correo" });
    expect(within(region).getByText("Hola Lucía")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toHaveAttribute("aria-pressed", "true");
  });

  it("guarda borrador sin validar destinatarios y descarta", async () => {
    const onSaveDraft = vi.fn();
    const onDiscard = vi.fn();
    setup({ onSaveDraft, onDiscard });
    await userEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ to: [] }));
    await userEvent.click(screen.getByRole("button", { name: "Descartar correo" }));
    expect(onDiscard).toHaveBeenCalled();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    setup({ skeleton: true });
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });
});

describe("CnEmailComposerSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnEmailComposerSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "email-composer");
  });
});
