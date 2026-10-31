import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnForm } from "./CnForm";
import type { CnFormField, CnFormHandle, CnFormProps, CnFormValues } from "./CnForm.types";

const baseFields: CnFormField[] = [
  { name: "name", type: "text", label: "Nombre", required: true },
  { name: "email", type: "email", label: "Correo" },
];

const Controlled = (
  props: Partial<CnFormProps> & { initial?: CnFormValues; spy?: (v: CnFormValues) => void },
) => {
  const { initial = {}, spy, ...rest } = props;
  const [value, setValue] = useState<CnFormValues>(initial);
  return (
    <CnForm
      fields={baseFields}
      onSubmit={() => {}}
      {...rest}
      value={value}
      onChange={(patch, next) => {
        setValue((prev) => ({ ...prev, ...patch }));
        spy?.(next);
        rest.onChange?.(patch, next);
      }}
    />
  );
};

const submit = () => fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

describe("CnForm", () => {
  it("renders title, fields and default actions", () => {
    render(<CnForm title="Alta" fields={baseFields} onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("heading", { name: "Alta" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guardar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });

  it("blocks submit and shows an accessible error summary", async () => {
    const onSubmit = vi.fn();
    render(<CnForm fields={baseFields} onSubmit={onSubmit} />);
    submit();
    expect(await screen.findByText("Revisa los campos marcados")).toBeInTheDocument();
    expect(screen.getAllByText("Campo requerido").length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates implicit email rule for type email", async () => {
    render(
      <CnForm
        fields={baseFields}
        defaultValues={{ name: "Ana", email: "mal" }}
        onSubmit={() => {}}
      />,
    );
    submit();
    expect(await screen.findAllByText("Email inválido")).not.toHaveLength(0);
  });

  it("submits values in uncontrolled mode", async () => {
    const onSubmit = vi.fn();
    render(<CnForm fields={baseFields} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "Ana" } });
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ name: "Ana", email: "" });
  });

  it("shows errors on blur when validateOn is blur", async () => {
    render(<CnForm fields={baseFields} onSubmit={() => {}} />);
    const input = screen.getByLabelText(/Nombre/);
    expect(screen.queryByText("Campo requerido")).not.toBeInTheDocument();
    fireEvent.blur(input);
    expect(await screen.findByText("Campo requerido")).toBeInTheDocument();
  });

  it("emits top-level patches for nested paths in controlled mode", () => {
    const onChange = vi.fn();
    render(
      <Controlled
        fields={[{ name: "address.city", type: "text", label: "Ciudad" }]}
        initial={{ address: { city: "", zip: "01000" } }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Ciudad"), { target: { value: "Puebla" } });
    const [patch, next] = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(patch).toEqual({ address: { city: "Puebla", zip: "01000" } });
    expect(next.address).toEqual({ city: "Puebla", zip: "01000" });
  });

  it("applies onFieldChange side effects", () => {
    const spy = vi.fn();
    render(
      <Controlled
        spy={spy}
        fields={[
          {
            name: "country",
            type: "text",
            label: "País",
            onFieldChange: () => ({ state: "" }),
          },
          { name: "state", type: "text", label: "Estado" },
        ]}
        initial={{ country: "MX", state: "CDMX" }}
      />,
    );
    fireEvent.change(screen.getByLabelText("País"), { target: { value: "US" } });
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ country: "US", state: "" }));
  });

  it("does not render nor validate hidden fields", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          { name: "hasCar", type: "switch", label: "¿Tienes auto?" },
          {
            name: "plate",
            type: "text",
            label: "Placa",
            required: true,
            visibleWhen: (v) => Boolean(v.hasCar),
          },
        ]}
        onSubmit={onSubmit}
        omitHiddenFields
      />,
    );
    expect(screen.queryByLabelText(/Placa/)).not.toBeInTheDocument();
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ hasCar: false });
  });

  it("maps serverError prop to fields", async () => {
    render(
      <CnForm
        fields={baseFields}
        onSubmit={() => {}}
        serverError={{ message: "Error", errors: { email: ["Ya registrado"] } }}
      />,
    );
    expect(await screen.findByText("Ya registrado")).toBeInTheDocument();
  });

  it("shows field errors thrown by onSubmit and clears them on edit", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue({ response: { data: { errors: { name: ["Duplicado"] } } } });
    render(<CnForm fields={baseFields} defaultValues={{ name: "Ana" }} onSubmit={onSubmit} />);
    submit();
    expect(await screen.findAllByText("Duplicado")).not.toHaveLength(0);
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "Ana 2" } });
    await waitFor(() => expect(screen.queryByText("Duplicado")).not.toBeInTheDocument());
  });

  it("shows a general error when onSubmit fails without field errors", async () => {
    const onError = vi.fn();
    render(
      <CnForm
        fields={baseFields}
        defaultValues={{ name: "Ana" }}
        onSubmit={() => Promise.reject(new Error("Servidor no disponible"))}
        onError={onError}
      />,
    );
    submit();
    expect(await screen.findByText("Servidor no disponible")).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  it("prevents double submission while pending", async () => {
    let resolve: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<CnForm fields={baseFields} defaultValues={{ name: "Ana" }} onSubmit={onSubmit} />);
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    fireEvent.submit(
      screen.getByRole("button", { name: /guardando/i }).closest("form") as HTMLFormElement,
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
  });

  it("sends FormData when files are present in auto mode", async () => {
    const onSubmit = vi.fn();
    const file = new File(["x"], "foto.png", { type: "image/png" });
    render(
      <CnForm
        fields={[
          { name: "title", type: "text", label: "Título" },
          { name: "photos", type: "file", label: "Fotos", multiple: true },
        ]}
        defaultValues={{ title: "Hola", photos: [file] }}
        submitMode="auto"
        onSubmit={onSubmit}
      />,
    );
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0] as FormData;
    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get("title")).toBe("Hola");
    expect((payload.get("photos[0]") as File).name).toBe("foto.png");
  });

  it("applies buildPayload and excludeFields", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={baseFields}
        defaultValues={{ name: "ana", email: "a@b.co" }}
        buildPayload={(v) => ({ ...v, name: String(v.name).toUpperCase() })}
        excludeFields={["email"]}
        onSubmit={onSubmit}
      />,
    );
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ name: "ANA" });
  });

  it("resets after submit when requested", async () => {
    render(<CnForm fields={baseFields} resetAfterSubmit onSubmit={() => {}} />);
    const input = screen.getByLabelText(/Nombre/);
    fireEvent.change(input, { target: { value: "Ana" } });
    submit();
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("exposes an imperative API through formRef", async () => {
    const ref = createRef<CnFormHandle>();
    const onSubmit = vi.fn();
    render(<CnForm formRef={ref} fields={baseFields} onSubmit={onSubmit} />);
    await act(async () => {
      ref.current?.setFieldValue("name", "Luis");
    });
    expect(ref.current?.getValues()).toMatchObject({ name: "Luis" });
    expect(ref.current?.isDirty()).toBe(true);
    let ok = false;
    await act(async () => {
      ok = (await ref.current?.submit()) ?? false;
    });
    expect(ok).toBe(true);
    expect(onSubmit).toHaveBeenCalled();
  });

  it("supports externalSubmitRef", async () => {
    const external = { current: null as (() => Promise<boolean>) | null };
    render(
      <CnForm fields={baseFields} onSubmit={() => {}} externalSubmitRef={external} hideActions />,
    );
    let result = true;
    await act(async () => {
      result = (await external.current?.()) ?? true;
    });
    expect(result).toBe(false);
  });

  it("notifies dirty changes", async () => {
    const onDirtyChange = vi.fn();
    render(<CnForm fields={baseFields} onSubmit={() => {}} onDirtyChange={onDirtyChange} />);
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "x" } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "" } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
  });

  it("runs async validators on submit", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          {
            name: "user",
            type: "text",
            label: "Usuario",
            validateAsync: async (v) => (v === "admin" ? "No disponible" : null),
          },
        ]}
        defaultValues={{ user: "admin" }}
        onSubmit={onSubmit}
      />,
    );
    submit();
    expect(await screen.findAllByText("No disponible")).not.toHaveLength(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders a bound custom field", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          {
            name: "color",
            type: "custom",
            render: ({ value, onChange }) => (
              <button type="button" onClick={() => onChange("rojo")}>
                Color: {String(value || "ninguno")}
              </button>
            ),
          },
        ]}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Color: ninguno" }));
    expect(screen.getByRole("button", { name: "Color: rojo" })).toBeInTheDocument();
    submit();
    await waitFor(() => expect(onSubmit.mock.calls[0][0]).toEqual({ color: "rojo" }));
  });

  describe("sectioned", () => {
    const sections: CnFormProps["sections"] = [
      {
        id: "general",
        title: "General",
        fields: [{ name: "company", type: "text", label: "Empresa" }],
      },
      {
        id: "contacts",
        title: "Contacto",
        repeatable: true,
        minItems: 1,
        maxItems: 2,
        canReorder: true,
        fields: [{ name: "email", type: "email", label: "Email", required: true }],
      },
    ];

    it("adds and removes repeatable items within limits", () => {
      render(<CnForm sections={sections} onSubmit={() => {}} />);
      expect(screen.getAllByLabelText(/Email/)).toHaveLength(1);
      expect(screen.queryByRole("button", { name: /Eliminar 1/ })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
      expect(screen.getAllByLabelText(/Email/)).toHaveLength(2);
      expect(screen.queryByRole("button", { name: /agregar contacto/i })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Eliminar 2/ }));
      expect(screen.getAllByLabelText(/Email/)).toHaveLength(1);
    });

    it("validates and submits array values", async () => {
      const onSubmit = vi.fn();
      render(<CnForm sections={sections} onSubmit={onSubmit} />);
      submit();
      expect(await screen.findAllByText("Campo requerido")).not.toHaveLength(0);
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "a@b.co" } });
      submit();
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit.mock.calls[0][0]).toEqual({ company: "", contacts: [{ email: "a@b.co" }] });
    });

    it("reorders items", async () => {
      const onSubmit = vi.fn();
      render(
        <CnForm
          sections={sections}
          defaultValues={{ contacts: [{ email: "a@a.co" }, { email: "b@b.co" }] }}
          onSubmit={onSubmit}
        />,
      );
      fireEvent.keyDown(screen.getByRole("button", { name: /Reordenar Contacto 1/ }), {
        key: "ArrowDown",
      });
      submit();
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect((onSubmit.mock.calls[0][0] as CnFormValues).contacts).toEqual([
        { email: "b@b.co" },
        { email: "a@a.co" },
      ]);
    });
  });

  describe("tabbed", () => {
    it("jumps to the tab with the first error on submit", async () => {
      render(
        <CnForm
          tabs={[
            {
              id: "a",
              label: "Datos",
              fields: [{ name: "name", type: "text", label: "Nombre", required: true }],
            },
            { id: "b", label: "Extra", fields: [{ name: "notes", type: "text", label: "Notas" }] },
          ]}
          onSubmit={() => {}}
        />,
      );
      fireEvent.click(screen.getByRole("tab", { name: /Extra/ }));
      expect(screen.getByLabelText("Notas")).toBeInTheDocument();
      submit();
      expect(await screen.findByLabelText(/Nombre/)).toBeInTheDocument();
    });
  });

  describe("wizard", () => {
    const steps: CnFormProps["steps"] = [
      {
        id: "one",
        title: "Cuenta",
        fields: [{ name: "user", type: "text", label: "Usuario", required: true }],
      },
      { id: "two", title: "Perfil", fields: [{ name: "bio", type: "textarea", label: "Bio" }] },
    ];

    it("validates the current step before advancing", async () => {
      const onSubmit = vi.fn();
      render(<CnForm steps={steps} onSubmit={onSubmit} />);
      fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
      expect(await screen.findByText("Campo requerido")).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(/Usuario/), { target: { value: "ana" } });
      fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
      expect(await screen.findByLabelText("Bio")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /atrás/i }));
      expect(await screen.findByLabelText(/Usuario/)).toHaveValue("ana");
      fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
      await screen.findByLabelText("Bio");
      submit();
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit.mock.calls[0][0]).toEqual({ user: "ana", bio: "" });
    });
  });

  describe("modal", () => {
    it("renders inside a dialog and asks before discarding changes", async () => {
      const onClose = vi.fn();
      render(
        <CnForm
          mode="modal"
          open
          title="Editar"
          fields={baseFields}
          onSubmit={() => {}}
          onClose={onClose}
          warnOnUnsavedChanges
        />,
      );
      const dialog = screen.getByRole("dialog", { name: "Editar" });
      fireEvent.change(within(dialog).getByLabelText(/Nombre/), { target: { value: "x" } });
      fireEvent.click(within(dialog).getByRole("button", { name: /cancelar/i }));
      expect(await screen.findByText("¿Descartar cambios?")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("applies implicit rules for phone, number and date fields", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          { name: "phone", type: "phone", label: "Teléfono" },
          { name: "qty", type: "number", label: "Cantidad", min: 1, max: 5 },
          { name: "start", type: "date", label: "Inicio", minDate: "2024-01-01" },
        ]}
        defaultValues={{ phone: "+52551234", qty: 9, start: "2023-05-01" }}
        onSubmit={onSubmit}
      />,
    );
    submit();
    expect(await screen.findAllByText(/Número inválido para México/)).not.toHaveLength(0);
    expect(screen.getAllByText("Máximo 5").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/posterior a 01\/01\/2024/).length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("supports dynamic rules, labels and options", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          {
            name: "type",
            type: "radio",
            label: "Tipo",
            options: [
              { value: "fisica", label: "Física" },
              { value: "moral", label: "Moral" },
            ],
          },
          {
            name: "rfc",
            type: "text",
            label: (v) => (v.type === "moral" ? "RFC empresa" : "RFC"),
            rules: (v) => [{ type: "rfc", personType: v.type === "moral" ? "moral" : "fisica" }],
          },
        ]}
        defaultValues={{ type: "moral", rfc: "GODE561231GR8" }}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByLabelText("RFC empresa")).toBeInTheDocument();
    submit();
    expect(await screen.findAllByText("RFC inválido")).not.toHaveLength(0);
  });

  it("validates and submits the extended field types", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          { name: "code", type: "otp", label: "Código", otpLength: 4 },
          { name: "card", type: "masked", label: "Tarjeta", maskPreset: "creditCard" },
          {
            name: "emails",
            type: "tags",
            label: "Correos",
            tagRules: [{ type: "email" }],
            required: true,
          },
          {
            name: "view",
            type: "segmented",
            label: "Vista",
            options: [
              { value: "list", label: "Lista" },
              { value: "grid", label: "Cuadrícula" },
            ],
          },
          { name: "price", type: "numberrange", label: "Precio" },
          { name: "color", type: "color", label: "Color" },
          {
            name: "pass",
            type: "password",
            label: "Clave",
            passwordRequirements: { minLength: 8 },
          },
        ]}
        defaultValues={{
          code: "12",
          card: "4111111111111112",
          price: [50, 10],
          color: "#12",
          pass: "corta",
        }}
        onSubmit={onSubmit}
      />,
    );
    submit();
    expect(await screen.findAllByText("Ingresa los 4 caracteres")).not.toHaveLength(0);
    expect(screen.getAllByText("Número de tarjeta no válido").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/mínimo no puede ser mayor/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Color no válido/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("La contraseña no cumple los requisitos").length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits default values for the new types", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          { name: "tags", type: "tags", label: "Etiquetas" },
          { name: "range", type: "numberrange", label: "Rango" },
          { name: "country", type: "country", label: "País" },
          { name: "mode", type: "segmented", label: "Modo", options: [{ value: "a", label: "A" }] },
        ]}
        onSubmit={onSubmit}
      />,
    );
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      tags: [],
      range: [null, null],
      country: null,
      mode: "",
    });
  });

  it("disables everything in readOnly mode", () => {
    render(<CnForm fields={baseFields} readOnly onSubmit={() => {}} />);
    expect(screen.getByLabelText(/Nombre/)).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("renders a skeleton while loading", () => {
    render(<CnForm fields={baseFields} isLoading onSubmit={() => {}} />);
    expect(screen.getByLabelText("Cargando formulario")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nombre/)).not.toBeInTheDocument();
  });
});
