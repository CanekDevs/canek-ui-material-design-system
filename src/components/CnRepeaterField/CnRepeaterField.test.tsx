import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import { buildRepeaterRules, CnRepeaterField } from "./CnRepeaterField";
import { CnRepeaterFieldSkeleton } from "./CnRepeaterFieldSkeleton";

const Controlled = (props: {
  initial: string[];
  onChange?: (v: string[]) => void;
  maxItems?: number;
}) => {
  const [value, setValue] = useState(props.initial);
  return (
    <CnRepeaterField
      label="Pasos"
      itemLabel="Paso"
      value={value}
      maxItems={props.maxItems}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
};

describe("CnRepeaterField", () => {
  it("adds, edits and removes items", () => {
    const onChange = vi.fn();
    render(<Controlled initial={["a"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(onChange).toHaveBeenLastCalledWith(["a", ""]);
    fireEvent.change(screen.getByRole("textbox", { name: "Paso 2" }), { target: { value: "b" } });
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Paso 1" }));
    expect(onChange).toHaveBeenLastCalledWith(["b"]);
    expect(screen.getByText("1 elemento")).toBeInTheDocument();
  });

  it("reorders with buttons and the keyboard handle", () => {
    const onChange = vi.fn();
    render(<Controlled initial={["a", "b", "c"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Bajar Paso 1" }));
    expect(onChange).toHaveBeenLastCalledWith(["b", "a", "c"]);
    const handle = screen.getByRole("button", { name: /Reordenar Paso 3/ });
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith(["b", "c", "a"]);
    expect(screen.getByRole("button", { name: "Subir Paso 1" })).toBeDisabled();
  });

  it("respects min and max items", () => {
    render(<CnRepeaterField label="Correos" minItems={1} maxItems={2} />);
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Eliminar Elemento 1" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar" })).not.toBeInTheDocument();
  });

  it("shows the empty state and custom renderers", () => {
    const { rerender } = render(<CnRepeaterField label="Lista" emptyText="Nada aún" />);
    expect(screen.getByText("Nada aún")).toBeInTheDocument();
    rerender(
      <CnRepeaterField<number>
        label="Números"
        value={[1, 2]}
        renderItem={({ value, label }) => <span aria-label={label}>#{value}</span>}
      />,
    );
    expect(screen.getByLabelText("Elemento 2", { selector: "span" })).toHaveTextContent("#2");
  });

  it("validates required, min and max", () => {
    const rules = buildRepeaterRules({ required: true, minItems: 2, maxItems: 3 });
    expect(validateFieldValue(["", ""], rules)).toBe("Agrega al menos un elemento");
    expect(validateFieldValue(["a"], rules)).toContain("al menos 2");
    expect(validateFieldValue(["a", "b", "c", "d"], rules)).toContain("Máximo 3");
    expect(validateFieldValue(["a", "b"], rules)).toBe("");
  });

  it("renders its skeleton", () => {
    const { container, rerender } = render(<CnRepeaterFieldSkeleton items={2} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "repeater-field");
    expect(container.querySelectorAll("[data-cn-skeleton-item]")).toHaveLength(2);
    rerender(<CnRepeaterField label="Lista" skeleton />);
    expect(container.querySelector("[data-cn-skeleton-empty]")).not.toBeNull();
  });
});
