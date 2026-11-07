import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnForm } from "./CnForm";
import { getInitialItemCount, isoToDate, normalizeDateValue } from "./CnForm.engine";
import { buildFormData } from "./CnForm.helpers";
import type { CnFormField, CnFormHandle } from "./CnForm.types";
import { validateFieldValue } from "./CnForm.validation";

const submit = () => fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

describe("normalizeDateValue", () => {
  it("accepts Date objects, zoned ISO strings and SQL datetimes", () => {
    const date = new Date(2024, 4, 6, 9, 5);
    expect(normalizeDateValue(date, "date")).toBe("2024-05-06");
    expect(normalizeDateValue(date, "datetime")).toBe("2024-05-06T09:05");
    expect(normalizeDateValue(date, "time")).toBe("09:05");
    expect(normalizeDateValue(date, "month")).toBe("2024-05");
    expect(normalizeDateValue("2024-05-06 10:30:00", "datetime")).toBe("2024-05-06T10:30");
    expect(normalizeDateValue("2024-05-06T10:30:00.000000Z", "date")).toMatch(/^2024-05-0\d$/);
    expect(normalizeDateValue("2024-05-06", "date")).toBe("2024-05-06");
    expect(normalizeDateValue("10:30:00", "time")).toBe("10:30");
    expect(normalizeDateValue(null, "date")).toBe("");
  });

  it("converts back to Date", () => {
    expect(isoToDate("2024-05-06", "date")?.getDate()).toBe(6);
    expect(isoToDate("2024-05-06T10:30", "datetime")?.getHours()).toBe(10);
    expect(isoToDate("", "date")).toBeNull();
  });

  it("renders and validates Date values in the form", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[{ name: "start", type: "date", label: "Inicio", required: true }]}
        defaultValues={{ start: new Date(2030, 0, 15) }}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByLabelText(/Inicio/)).toHaveValue("15/01/2030");
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});

describe("validation rules", () => {
  it("applies a rule only when its condition is met", () => {
    const rules = [
      { type: "required" as const, when: (values: Record<string, unknown>) => values.kind === "b" },
    ];
    expect(validateFieldValue("", rules, { kind: "a" })).toBe("");
    expect(validateFieldValue("", rules, { kind: "b" })).not.toBe("");
  });

  it("compares equalTo against the repeatable item first and skips empty values", () => {
    const rule = [{ type: "equalTo" as const, field: "password" }];
    const ctx = { sectionId: "users", index: 0, item: { password: "x" } };
    expect(validateFieldValue("x", rule, { password: "root" }, ctx)).toBe("");
    expect(validateFieldValue("", rule, { password: "root" })).toBe("");
    expect(
      validateFieldValue("y", [{ type: "equalTo", field: "$.password" }], { password: "y" }, ctx),
    ).toBe("");
  });

  it("supports between with a single bound and exactLength alias", () => {
    expect(validateFieldValue(5, [{ type: "between", min: 10 }])).not.toBe("");
    expect(validateFieldValue(50, [{ type: "between", min: 10 }])).toBe("");
    expect(validateFieldValue("abc", [{ type: "exactLength", length: 4 }])).not.toBe("");
  });

  it("validates tel fields implicitly", async () => {
    render(
      <CnForm
        fields={[{ name: "tel", type: "tel", label: "Tel" }]}
        defaultValues={{ tel: "12ab" }}
        onSubmit={() => {}}
      />,
    );
    submit();
    expect((await screen.findAllByText("Teléfono no válido")).length).toBeGreaterThan(0);
  });
});

describe("buildFormData options", () => {
  it("serializes primitive arrays as json or brackets and can omit existing files", () => {
    const values = { tags: ["a", "b"], logo: [{ id: 0, url: "/a.png", name: "a" }], ok: true };
    const json = buildFormData(values, { arrayFormat: "json", existingFiles: "omit" });
    expect(json.get("tags")).toBe('["a","b"]');
    expect(json.has("logo[0][id]")).toBe(false);
    expect(json.get("ok")).toBe("1");
    const brackets = buildFormData(values, { arrayFormat: "brackets", booleanFormat: "string" });
    expect(brackets.getAll("tags[]")).toEqual(["a", "b"]);
    expect(brackets.get("ok")).toBe("true");
  });
});

describe("CnForm parity", () => {
  it("starts repeatable sections empty with minItems 0 and shows emptyText", () => {
    expect(getInitialItemCount({ id: "x", fields: [], repeatable: true, minItems: 0 })).toBe(0);
    expect(getInitialItemCount({ id: "x", fields: [], repeatable: true })).toBe(1);
    render(
      <CnForm
        sections={[
          {
            id: "contacts",
            title: "Contactos",
            repeatable: true,
            minItems: 0,
            emptyText: "Sin contactos",
            fields: [{ name: "name", type: "text", label: "Nombre" }],
          },
        ]}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText("Sin contactos")).toBeInTheDocument();
  });

  it("evaluates canRemove per item", () => {
    render(
      <CnForm
        sections={[
          {
            id: "items",
            title: "Partida",
            repeatable: true,
            canRemove: (_values, ctx) => ctx?.item?.locked !== true,
            fields: [{ name: "name", type: "text", label: "Nombre" }],
          },
        ]}
        defaultValues={{ items: [{ name: "a", locked: true }, { name: "b" }] }}
        onSubmit={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /Eliminar 1/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Eliminar 2/ })).toBeInTheDocument();
  });

  it("disables actions with disableActions or a loading section", () => {
    const { rerender } = render(
      <CnForm fields={[{ name: "a", type: "text" }]} disableActions onSubmit={() => {}} />,
    );
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
    rerender(
      <CnForm
        sections={[{ id: "s", fields: [{ name: "a", type: "text" }] }]}
        loadingStates={{ sections: { s: true } }}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("passes payload and values to onSuccess", async () => {
    const onSuccess = vi.fn();
    render(
      <CnForm
        fields={[{ name: "a", type: "text", label: "A" }]}
        defaultValues={{ a: "x" }}
        onSubmit={() => {}}
        onSuccess={onSuccess}
      />,
    );
    submit();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ a: "x" }, { a: "x" }));
  });

  it("does not validate disabled tabs", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        tabs={[
          { id: "a", label: "A", fields: [{ name: "x", type: "text", label: "X" }] },
          {
            id: "b",
            label: "B",
            disabled: true,
            fields: [{ name: "y", type: "text", label: "Y", required: true }],
          },
        ]}
        onSubmit={onSubmit}
      />,
    );
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it("hides the general server error alert when showServerErrorAlert is false", async () => {
    render(
      <CnForm
        fields={[{ name: "a", type: "text" }]}
        showServerErrorAlert={false}
        onSubmit={() => {
          throw new Error("Falla general");
        }}
      />,
    );
    submit();
    await act(async () => {});
    expect(screen.queryByText("Falla general")).toBeNull();
  });

  it("resets an uncontrolled modal each time it opens", async () => {
    const fields: CnFormField[] = [{ name: "a", type: "text", label: "A" }];
    const { rerender } = render(
      <CnForm mode="modal" open fields={fields} onSubmit={() => {}} onClose={() => {}} />,
    );
    fireEvent.change(screen.getByLabelText("A"), { target: { value: "sucio" } });
    rerender(
      <CnForm mode="modal" open={false} fields={fields} onSubmit={() => {}} onClose={() => {}} />,
    );
    rerender(<CnForm mode="modal" open fields={fields} onSubmit={() => {}} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByLabelText("A")).toHaveValue(""));
  });

  it("uses dialogTitle and the header icon in modal mode", () => {
    render(
      <CnForm
        mode="modal"
        open
        title="Inline"
        dialogTitle="Nuevo cliente"
        icon="person"
        fields={[{ name: "a", type: "text" }]}
        onSubmit={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Nuevo cliente" })).toBeInTheDocument();
  });

  it("collects removed existing file ids in removedFilesName", async () => {
    const ref = createRef<CnFormHandle>();
    render(
      <CnForm
        formRef={ref}
        fields={[
          {
            name: "photos",
            type: "file",
            label: "Fotos",
            multiple: true,
            removedFilesName: "removed_ids",
          },
        ]}
        defaultValues={{ photos: [{ id: 7, url: "/a.png", name: "a.png" }] }}
        onSubmit={() => {}}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /quitar|eliminar/i })[0]);
    await waitFor(() => expect(ref.current?.getValues().removed_ids).toEqual([7]));
    expect(ref.current?.getValues().photos).toEqual([]);
  });

  it("accepts plain URLs as existing files", () => {
    render(
      <CnForm
        fields={[{ name: "doc", type: "file", label: "Doc" }]}
        defaultValues={{ doc: "https://cdn.test/files/contrato%20final.pdf" }}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText("contrato final.pdf")).toBeInTheDocument();
  });

  it("renders a custom select value and option label", () => {
    render(
      <CnForm
        fields={[
          {
            name: "plan",
            type: "select",
            label: "Plan",
            options: [{ value: 1, label: "basico" }],
            getOptionLabel: (option) => option.label.toUpperCase(),
            renderValue: (_value, selected) =>
              `Elegido: ${Array.isArray(selected) ? "" : selected?.label}`,
          },
        ]}
        defaultValues={{ plan: 1 }}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText("Elegido: BASICO")).toBeInTheDocument();
  });

  it("does not submit when Enter is pressed inside a custom control", () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          {
            name: "c",
            type: "custom",
            render: ({ value, onChange }) => (
              <input
                aria-label="Propio"
                value={String(value ?? "")}
                onChange={(e) => onChange(e.target.value)}
              />
            ),
          },
        ]}
        onSubmit={onSubmit}
      />,
    );
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    screen.getByLabelText("Propio").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
