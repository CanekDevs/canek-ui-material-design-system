import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnForm } from "./CnForm";
import { applyDependencyResets, collectGroupFields } from "./CnForm.engine";
import type { CnFormField, CnFormHandle, CnFormValues } from "./CnForm.types";

const STATES = [
  { value: "JAL", label: "Jalisco" },
  { value: "NL", label: "Nuevo León" },
];
const CITIES: Record<string, { value: string; label: string }[]> = {
  JAL: [{ value: "GDL", label: "Guadalajara" }],
  NL: [{ value: "MTY", label: "Monterrey" }],
};

const cascade: CnFormField[] = [
  { name: "state", type: "select", label: "Estado", options: STATES },
  {
    name: "city",
    type: "select",
    label: "Ciudad",
    dependsOn: ["state"],
    loadOptions: async ({ formValues }) => CITIES[String(formValues.state)] ?? [],
  },
  { name: "street", type: "text", label: "Calle", dependsOn: ["city"] },
];

describe("CnForm dependencies", () => {
  it("resets dependents in cascade when a parent changes", () => {
    const resolve = (values: CnFormValues) =>
      collectGroupFields({ id: "root", fields: cascade }, values);
    const values = { state: "NL", city: "MTY", street: "Av. 1" };
    const result = applyDependencyResets(values, ["state"], resolve);
    expect(result.values).toEqual({ state: "NL", city: "", street: "" });
    expect(result.reset).toEqual(["city", "street"]);
  });

  it("uses item-relative paths inside repeatable sections", () => {
    const section = {
      id: "items",
      repeatable: true,
      fields: [
        { name: "kind", type: "text", label: "Tipo" },
        { name: "detail", type: "text", label: "Detalle", dependsOn: ["kind"] },
      ] as CnFormField[],
    };
    const resolve = (values: CnFormValues) =>
      collectGroupFields({ id: "root", sections: [section] }, values);
    const values = {
      items: [
        { kind: "a", detail: "x" },
        { kind: "b", detail: "y" },
      ],
    };
    const result = applyDependencyResets(values, ["items.1.kind"], resolve);
    expect(result.values.items).toEqual([
      { kind: "a", detail: "x" },
      { kind: "b", detail: "" },
    ]);
  });

  it("keeps the value when resetOnDependencyChange is false", () => {
    const fields: CnFormField[] = [
      { name: "a", type: "text" },
      { name: "b", type: "text", dependsOn: ["a"], resetOnDependencyChange: false },
    ];
    const resolve = (values: CnFormValues) => collectGroupFields({ id: "root", fields }, values);
    expect(applyDependencyResets({ a: "1", b: "keep" }, ["a"], resolve).reset).toEqual([]);
  });

  it("disables a dependent field until its parent has a value and loads remote options", async () => {
    const ref = createRef<CnFormHandle>();
    render(<CnForm formRef={ref} fields={cascade} onSubmit={() => {}} />);
    const city = screen.getByLabelText(/Ciudad/);
    expect(city).toHaveAttribute("aria-disabled", "true");

    ref.current?.setFieldValue("state", "JAL");
    await waitFor(() =>
      expect(screen.getByLabelText(/Ciudad/)).not.toHaveAttribute("aria-disabled"),
    );
    fireEvent.mouseDown(screen.getByLabelText(/Ciudad/));
    expect(await screen.findByRole("option", { name: "Guadalajara" })).toBeInTheDocument();
  });

  it("clears the dependent value through the form when the parent changes", async () => {
    const ref = createRef<CnFormHandle>();
    render(
      <CnForm
        formRef={ref}
        fields={cascade}
        defaultValues={{ state: "JAL", city: "GDL", street: "Juárez" }}
        onSubmit={() => {}}
      />,
    );
    ref.current?.setFieldValue("state", "NL");
    await waitFor(() =>
      expect(ref.current?.getValues()).toMatchObject({ state: "NL", city: "", street: "" }),
    );
  });

  it("searches remotely in autocomplete and creates new options", async () => {
    const loadOptions = vi.fn(async ({ input }: { input: string }) =>
      [
        { value: 1, label: "Ana" },
        { value: 2, label: "Luis" },
      ].filter((option) => option.label.toLowerCase().includes(input.toLowerCase())),
    );
    const onCreateOption = vi.fn(async (input: string) => ({ value: 99, label: input }));
    const ref = createRef<CnFormHandle>();
    render(
      <CnForm
        formRef={ref}
        fields={[
          {
            name: "person",
            type: "autocomplete",
            label: "Persona",
            loadOptions,
            searchDebounceMs: 0,
            onCreateOption,
          },
        ]}
        onSubmit={() => {}}
      />,
    );
    const input = screen.getByLabelText(/Persona/);
    input.focus();
    fireEvent.change(input, { target: { value: "lu" } });
    await waitFor(() =>
      expect(loadOptions).toHaveBeenLastCalledWith(expect.objectContaining({ input: "lu" })),
    );
    await waitFor(() => expect(screen.queryByRole("option", { name: "Ana" })).toBeNull());
    expect(screen.getByRole("option", { name: "Luis" })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Zoe" } });
    fireEvent.click(await screen.findByRole("option", { name: /Crear "Zoe"/ }));
    await waitFor(() => expect(ref.current?.getValues().person).toBe(99));
    expect(onCreateOption).toHaveBeenCalledWith("Zoe", expect.any(Object));
  });

  it("shows the label of a remote value from selectedOptions", () => {
    render(
      <CnForm
        fields={[
          {
            name: "owner",
            type: "autocomplete",
            label: "Responsable",
            loadOptions: async () => [],
            selectedOptions: [{ value: 7, label: "María López" }],
          },
        ]}
        defaultValues={{ owner: 7 }}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByLabelText(/Responsable/)).toHaveValue("María López");
  });
});

describe("CnForm imperative API", () => {
  it("sets several values, manual errors and clears them", async () => {
    const ref = createRef<CnFormHandle>();
    render(
      <CnForm
        formRef={ref}
        fields={[
          { name: "a", type: "text", label: "A" },
          { name: "b.c", type: "text", label: "C" },
        ]}
        onSubmit={() => {}}
      />,
    );
    ref.current?.setValues({ a: "uno", "b.c": "dos" });
    await waitFor(() => expect(ref.current?.getValues()).toEqual({ a: "uno", b: { c: "dos" } }));
    expect(ref.current?.getFieldValue("b.c")).toBe("dos");

    ref.current?.setFieldError("a", "Ya existe");
    expect(await screen.findByText("Ya existe")).toBeInTheDocument();
    expect(ref.current?.getErrors()).toEqual({ a: "Ya existe" });
    ref.current?.clearErrors("a");
    await waitFor(() => expect(screen.queryByText("Ya existe")).toBeNull());
  });

  it("validates only the given paths", async () => {
    const ref = createRef<CnFormHandle>();
    render(
      <CnForm
        formRef={ref}
        fields={[
          { name: "a", type: "text", label: "A", required: true },
          { name: "b", type: "text", label: "B", required: true },
        ]}
        onSubmit={() => {}}
      />,
    );
    let ok = true;
    await act(async () => {
      ok = (await ref.current?.validate("a")) ?? true;
    });
    expect(ok).toBe(false);
    expect(screen.getAllByText("Campo requerido")).toHaveLength(1);
  });

  it("reinitializes when defaultValues arrive after mount", async () => {
    const ref = createRef<CnFormHandle>();
    const fields: CnFormField[] = [{ name: "name", type: "text", label: "Nombre" }];
    const { rerender } = render(<CnForm formRef={ref} fields={fields} onSubmit={() => {}} />);
    rerender(
      <CnForm formRef={ref} fields={fields} defaultValues={{ name: "Ana" }} onSubmit={() => {}} />,
    );
    await waitFor(() => expect(screen.getByLabelText(/Nombre/)).toHaveValue("Ana"));
    expect(ref.current?.isDirty()).toBe(false);
  });
});
