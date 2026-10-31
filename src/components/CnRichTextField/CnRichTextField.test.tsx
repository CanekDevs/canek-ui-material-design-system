import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { registerRichTextFieldType } from "../../rich-text";
import { CnForm } from "../CnForm";
import { CnRichTextField, normalizeLink } from "./CnRichTextField";

beforeAll(() => {
  // ProseMirror consulta geometría que jsdom no implementa.
  const rect = () => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  });
  Range.prototype.getBoundingClientRect = rect as never;
  Range.prototype.getClientRects = (() => ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: [][Symbol.iterator],
  })) as never;
  document.elementFromPoint = () => null;
});

describe("normalizeLink", () => {
  it("accepts safe protocols and adds https", () => {
    expect(normalizeLink("canek.mx")).toBe("https://canek.mx");
    expect(normalizeLink("https://canek.mx/a")).toBe("https://canek.mx/a");
    expect(normalizeLink("ana@canek.mx")).toBe("mailto:ana@canek.mx");
    expect(normalizeLink("tel:5512345678")).toBe("tel:5512345678");
  });

  it("rejects dangerous protocols", () => {
    expect(normalizeLink("javascript:alert(1)")).toBeNull();
    expect(normalizeLink("data:text/html,x")).toBeNull();
    expect(normalizeLink("  ")).toBeNull();
  });
});

describe("CnRichTextField", () => {
  it("renders label, toolbar and initial HTML", async () => {
    render(
      <CnRichTextField label="Descripción" defaultValue="<p>Hola <strong>mundo</strong></p>" />,
    );
    expect(screen.getByRole("toolbar", { name: "Formato de texto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Negrita/ })).toBeInTheDocument();
    expect(await screen.findByText("mundo")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Descripción" })).toBeInTheDocument();
  });

  it("uses the basic toolbar preset", () => {
    render(<CnRichTextField label="Nota" toolbar="basic" />);
    expect(screen.queryByRole("button", { name: /Deshacer/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Insertar enlace/ })).toBeInTheDocument();
  });

  it("reflects external value changes", async () => {
    const Wrapper = () => {
      const [value, setValue] = useState("<p>Uno</p>");
      return (
        <>
          <CnRichTextField label="Texto" value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue("<p>Dos</p>")}>
            cambiar
          </button>
        </>
      );
    };
    render(<Wrapper />);
    expect(await screen.findByText("Uno")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "cambiar" }));
    expect(await screen.findByText("Dos")).toBeInTheDocument();
  });

  it("hides the toolbar in readOnly mode", () => {
    render(<CnRichTextField label="Texto" readOnly defaultValue="<p>x</p>" />);
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("validates links in the dialog", async () => {
    render(<CnRichTextField label="Texto" />);
    fireEvent.click(screen.getByRole("button", { name: /Insertar enlace/ }));
    const input = await screen.findByLabelText("URL, correo o teléfono");
    fireEvent.change(input, { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(await screen.findByText(/Solo se permiten enlaces/)).toBeInTheDocument();
  });

  it("shows the character counter with a limit", async () => {
    render(<CnRichTextField label="Texto" maxLength={100} defaultValue="<p>Hola</p>" />);
    expect(await screen.findByText("4/100")).toBeInTheDocument();
  });
});

describe("richtext in CnForm", () => {
  it("renders the editor once registered and validates required", async () => {
    registerRichTextFieldType();
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          {
            name: "body",
            type: "richtext",
            label: "Contenido",
            required: true,
            componentProps: { toolbar: "basic" },
          },
        ]}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByRole("toolbar", { name: "Formato de texto" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    await waitFor(() => expect(screen.getAllByText("Campo requerido").length).toBeGreaterThan(0));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
