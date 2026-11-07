import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnRadioGroupField } from "./CnRadioGroupField";
import { CnRadioGroupFieldSkeleton } from "./CnRadioGroupFieldSkeleton";

const optionsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-cn-skeleton-option]"));

describe("CnRadioGroupFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnRadioGroupFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "radio-group-field");
  });

  it("follows option count and card appearance", () => {
    const { container, rerender } = render(<CnRadioGroupFieldSkeleton options={5} />);
    expect(optionsOf(container)).toHaveLength(5);
    expect(getComputedStyle(optionsOf(container)[0]).paddingRight).not.toBe("12px");
    rerender(<CnRadioGroupFieldSkeleton options={2} appearance="card" />);
    expect(optionsOf(container)).toHaveLength(2);
    expect(getComputedStyle(optionsOf(container)[0]).paddingRight).toBe("12px");
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(
      <CnRadioGroupField
        label="Frecuencia"
        options={[
          { value: 1, label: "Mensual" },
          { value: 12, label: "Anual" },
        ]}
        skeleton
      />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "radio-group-field");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
