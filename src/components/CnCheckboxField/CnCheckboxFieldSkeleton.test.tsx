import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnCheckboxField } from "./CnCheckboxField";
import { CnCheckboxFieldSkeleton } from "./CnCheckboxFieldSkeleton";

const count = (container: HTMLElement) =>
  container.querySelectorAll("[data-cn-skeleton-option]").length;

describe("CnCheckboxFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnCheckboxFieldSkeleton options={3} helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "checkbox-field");
  });

  it("follows single vs group, option count and select all", () => {
    const { container, rerender } = render(<CnCheckboxFieldSkeleton />);
    expect(count(container)).toBe(1);
    rerender(<CnCheckboxFieldSkeleton options={4} />);
    expect(count(container)).toBe(4);
    rerender(<CnCheckboxFieldSkeleton options={4} selectAll />);
    expect(count(container)).toBe(5);
  });

  it("renders descriptions only for options that have them", () => {
    const pieces = (container: HTMLElement) =>
      container.querySelectorAll('[data-cn-skeleton="true"]').length;
    const { container, rerender } = render(
      <CnCheckboxFieldSkeleton label={false} options={[{ value: 1, label: "A" }]} />,
    );
    const plain = pieces(container);
    rerender(
      <CnCheckboxFieldSkeleton
        label={false}
        options={[{ value: 1, label: "A", description: "d" }]}
      />,
    );
    expect(pieces(container)).toBe(plain + 1);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnCheckboxField label="Acepto" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "checkbox-field");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
