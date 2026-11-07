import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnChoiceCardsField } from "../CnChoiceCardsField";
import { CnKeyValueField, findKeyValueIssues } from "../CnKeyValueField";
import { CnTransferListField } from "../CnTransferListField";
import { CnTreeSelectField } from "../CnTreeSelectField";
import type { CnTreeOption, CnTreeSelectValue } from "../CnTreeSelectField";
import { CnForm } from "./CnForm";
import type { CnFormHandle } from "./CnForm.types";

const PLANS = [
  { value: "basic", label: "Básico", description: "Para empezar", meta: "$0" },
  { value: "pro", label: "Pro", description: "Equipos", meta: "$20" },
  { value: "old", label: "Legado", disabled: true },
];

const TREE: CnTreeOption[] = [
  {
    value: "sales",
    label: "Ventas",
    children: [
      { value: "north", label: "Norte" },
      { value: "south", label: "Sur" },
    ],
  },
  { value: "hr", label: "Recursos humanos" },
];

describe("CnChoiceCardsField", () => {
  it("selects a single card with click and arrows", () => {
    const onChange = vi.fn();
    render(<CnChoiceCardsField label="Plan" options={PLANS} onChange={onChange} />);
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[1]);
    expect(onChange).toHaveBeenLastCalledWith("pro");
    fireEvent.keyDown(radios[1], { key: "ArrowRight" });
    // Salta la opción deshabilitada y vuelve al inicio.
    expect(onChange).toHaveBeenLastCalledWith("basic");
    expect(screen.getByText("$20")).toBeInTheDocument();
  });

  it("toggles several cards with multiple", () => {
    const Wrapper = () => {
      const [value, setValue] = useState<Array<string | number>>([]);
      return (
        <CnChoiceCardsField
          multiple
          options={PLANS}
          value={value}
          onChange={(next) => setValue(next as Array<string | number>)}
        />
      );
    };
    render(<Wrapper />);
    const boxes = screen.getAllByRole("checkbox");
    fireEvent.click(boxes[1]);
    fireEvent.click(boxes[0]);
    expect(boxes[0]).toHaveAttribute("aria-checked", "true");
    expect(boxes[1]).toHaveAttribute("aria-checked", "true");
    fireEvent.click(boxes[2]);
    expect(boxes[2]).toHaveAttribute("aria-checked", "false");
  });
});

describe("CnTransferListField", () => {
  it("moves checked items and respects max", () => {
    const onChange = vi.fn();
    const options = [
      { value: 1, label: "Leer" },
      { value: 2, label: "Escribir" },
      { value: 3, label: "Borrar" },
    ];
    const Wrapper = () => {
      const [value, setValue] = useState<Array<string | number>>([]);
      return (
        <CnTransferListField
          options={options}
          max={2}
          value={value}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      );
    };
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("option", { name: /Escribir/ }));
    fireEvent.click(screen.getByRole("button", { name: "Mover a seleccionados" }));
    expect(onChange).toHaveBeenLastCalledWith([2]);
    fireEvent.click(screen.getByRole("button", { name: "Mover todos a seleccionados" }));
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
    expect(screen.getByRole("button", { name: "Mover todos a seleccionados" })).toBeDisabled();
    fireEvent.doubleClick(screen.getByRole("option", { name: /Leer/ }));
    expect(onChange).toHaveBeenLastCalledWith([2]);
  });

  it("filters each list with its search box", () => {
    render(
      <CnTransferListField
        options={[
          { value: 1, label: "Ana" },
          { value: 2, label: "Luis" },
        ]}
      />,
    );
    fireEvent.change(screen.getByLabelText("Buscar en Disponibles"), { target: { value: "lu" } });
    expect(screen.queryByRole("option", { name: /Ana/ })).toBeNull();
    expect(screen.getByRole("option", { name: /Luis/ })).toBeInTheDocument();
  });
});

describe("CnTreeSelectField", () => {
  const open = () => fireEvent.click(screen.getByRole("combobox"));

  it("selects a single node and shows its path", () => {
    const onChange = vi.fn();
    render(
      <CnTreeSelectField
        label="Área"
        options={TREE}
        showPath
        defaultExpandAll
        onChange={onChange}
      />,
    );
    open();
    fireEvent.click(screen.getByRole("treeitem", { name: /Norte/ }));
    expect(onChange).toHaveBeenCalledWith("north");
  });

  it("cascades checks to children and reports leaves only", () => {
    const Wrapper = () => {
      const [value, setValue] = useState<CnTreeSelectValue>([]);
      return (
        <>
          <CnTreeSelectField
            label="Áreas"
            options={TREE}
            multiple
            valueMode="leaves"
            value={value}
            onChange={setValue}
          />
          <output data-testid="value">{JSON.stringify(value)}</output>
        </>
      );
    };
    render(<Wrapper />);
    open();
    fireEvent.click(screen.getByRole("treeitem", { name: /Ventas/ }));
    expect(screen.getByTestId("value")).toHaveTextContent('["north","south"]');
    // Expandir y desmarcar un hijo deja al padre indeterminado.
    fireEvent.click(
      within(screen.getByRole("treeitem", { name: /Ventas/ })).getByLabelText("Expandir"),
    );
    fireEvent.click(screen.getByRole("treeitem", { name: /Sur/ }));
    expect(screen.getByTestId("value")).toHaveTextContent('["north"]');
    expect(screen.getByRole("treeitem", { name: /Ventas/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("keeps ancestors visible when searching", () => {
    render(<CnTreeSelectField label="Área" options={TREE} />);
    open();
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "sur" } });
    expect(screen.getByRole("treeitem", { name: /Ventas/ })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /Sur/ })).toBeInTheDocument();
    expect(screen.queryByRole("treeitem", { name: /Recursos/ })).toBeNull();
  });
});

describe("CnKeyValueField", () => {
  it("adds, edits and removes pairs", () => {
    const onChange = vi.fn();
    render(<CnKeyValueField label="Metadatos" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    fireEvent.change(screen.getByLabelText("Clave"), { target: { value: "color" } });
    expect(onChange).toHaveBeenLastCalledWith([{ key: "color", value: "" }]);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar fila 1" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("emits an object with valueFormat object", () => {
    const onChange = vi.fn();
    render(<CnKeyValueField valueFormat="object" defaultValue={{ a: "1" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "2" } });
    expect(onChange).toHaveBeenLastCalledWith({ a: "2" });
  });

  it("detects duplicated and missing keys", () => {
    expect(
      findKeyValueIssues([
        { key: "a", value: "1" },
        { key: "a", value: "2" },
        { key: "", value: "x" },
      ]),
    ).toEqual({ duplicates: ["a"], missingKey: true });
  });
});

describe("CnForm with new field types", () => {
  it("keeps computed fields in sync, including inside repeatable sections", async () => {
    const ref = createRef<CnFormHandle>();
    render(
      <CnForm
        formRef={ref}
        sections={[
          {
            id: "lines",
            title: "Partida",
            repeatable: true,
            fields: [
              { name: "qty", type: "number", label: "Cantidad" },
              { name: "price", type: "number", label: "Precio" },
              {
                name: "amount",
                type: "display",
                label: "Importe",
                compute: (_values, ctx) =>
                  Number(ctx?.item?.qty ?? 0) * Number(ctx?.item?.price ?? 0),
              },
            ],
          },
          {
            id: "totals",
            fields: [
              {
                name: "total",
                type: "display",
                label: "Total",
                compute: (values) =>
                  ((values.lines as Array<{ amount?: number }>) ?? []).reduce(
                    (sum, line) => sum + Number(line.amount ?? 0),
                    0,
                  ),
                format: (value) => `$${Number(value).toFixed(2)}`,
              },
            ],
          },
        ]}
        defaultValues={{ lines: [{ qty: 2, price: 5 }] }}
        onSubmit={() => {}}
      />,
    );
    expect(ref.current?.getValues().total).toBe(10);
    expect(screen.getByText("$10.00")).toBeInTheDocument();
    ref.current?.setFieldValue("lines.0.qty", 3);
    await waitFor(() => expect(screen.getByText("$15.00")).toBeInTheDocument());
    expect(ref.current?.getValues()).toMatchObject({ lines: [{ amount: 15 }], total: 15 });
  });

  it("submits hidden fields without rendering them", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          { name: "id", type: "hidden" },
          { name: "name", type: "text", label: "Nombre" },
        ]}
        defaultValues={{ id: 42, name: "Ana" }}
        onSubmit={onSubmit}
      />,
    );
    expect(document.querySelector('[data-cn-field-path="id"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ id: 42, name: "Ana" }, expect.anything()),
    );
  });

  it("validates required choice cards, tree select and key-value fields", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          { name: "plan", type: "choicecards", label: "Plan", options: PLANS, required: true },
          { name: "area", type: "treeselect", label: "Área", options: TREE, required: true },
          {
            name: "meta",
            type: "keyvalue",
            label: "Metadatos",
            required: true,
          },
          {
            name: "perms",
            type: "transferlist",
            label: "Permisos",
            options: [{ value: 1, label: "Leer" }],
            required: true,
          },
        ]}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    await waitFor(() => expect(screen.getByText(/Hay 4 campos con errores/)).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
