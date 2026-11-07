import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnForm } from "../CnForm";
import type { CnFormField } from "../CnForm";
import { CnFormSkeleton } from "./CnFormSkeleton";

const fieldShapes = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("[data-sk-field]")).map((el) =>
    el.getAttribute("data-sk-field"),
  );

const fields: CnFormField[] = [
  { name: "name", type: "text", label: "Nombre" },
  { name: "kind", type: "select", label: "Tipo", options: [] },
  { name: "secret", type: "hidden" },
  { name: "color", type: "radio", label: "Color", options: [{ value: 1, label: "Rojo" }] },
  { name: "notes", type: "textarea", label: "Notas" },
];

describe("CnFormSkeleton", () => {
  it("is a single accessible status (legacy API)", () => {
    const { container } = render(<CnFormSkeleton rows={2} columns={2} showHeader showActions />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status", { name: "Cargando formulario" })).toHaveAttribute(
      "data-cn-skeleton",
      "form",
    );
    expect(fieldShapes(container)).toHaveLength(4);
    expect(container.querySelector('[data-sk-part="header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-sk-part="actions"]')).toBeInTheDocument();
  });

  it("adds a textarea in legacy mode", () => {
    const { container } = render(<CnFormSkeleton rows={1} withTextarea />);
    expect(fieldShapes(container)).toEqual(["text", "textarea"]);
  });

  it("draws one shape per visible field, skipping hidden ones", () => {
    const { container } = render(<CnFormSkeleton fields={fields} columns={2} />);
    expect(fieldShapes(container)).toEqual(["text", "select", "radio", "textarea"]);
  });

  it("respects visibleWhen with formValues", () => {
    const { container } = render(
      <CnFormSkeleton
        formValues={{ show: false }}
        fields={[
          { name: "a", type: "text", label: "A" },
          {
            name: "b",
            type: "text",
            label: "B",
            visibleWhen: (v: Record<string, unknown>) => Boolean(v.show),
          },
        ]}
      />,
    );
    expect(fieldShapes(container)).toHaveLength(1);
  });

  it("renders sections, repeatable items, tabs and steps", () => {
    const { container, rerender } = render(
      <CnFormSkeleton
        sections={[
          { title: true, fields: 3, columns: 3 },
          { title: true, repeatable: true, initialItems: 2, fields: 1 },
        ]}
      />,
    );
    expect(container.querySelectorAll('[data-sk-part="section"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-sk-part="section-item"]')).toHaveLength(2);

    rerender(
      <CnFormSkeleton
        tabs={[{ label: "A", fields: [{ type: "text" }] }, { label: "B" }, { label: "C" }]}
      />,
    );
    expect(container.querySelectorAll('[data-sk-part="tab"]')).toHaveLength(3);

    rerender(<CnFormSkeleton steps={[{ title: "Uno" }, { title: "Dos" }]} />);
    expect(container.querySelectorAll('[data-sk-part="step"]')).toHaveLength(2);
    expect(container.querySelector('[data-cn-form-skeleton="wizard"]')).toBeInTheDocument();
  });

  it("CnForm `skeleton` renders the dynamic skeleton from its own fields", () => {
    const { container } = render(
      <CnForm title="Cliente" fields={fields} onSubmit={() => {}} skeleton />,
    );
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(fieldShapes(container)).toEqual(["text", "select", "radio", "textarea"]);
    expect(container.querySelector('[data-sk-part="header"]')).toBeInTheDocument();
  });

  it("CnForm `isLoading` uses the dynamic skeleton for the body", () => {
    const { container } = render(
      <CnForm title="Cliente" fields={fields} onSubmit={() => {}} isLoading />,
    );
    expect(screen.getByRole("status", { name: "Cargando formulario" })).toBeInTheDocument();
    expect(fieldShapes(container)).toEqual(["text", "select", "radio", "textarea"]);
  });
});
