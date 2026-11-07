import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnKeyValueField } from "./CnKeyValueField";
import { CnKeyValueFieldSkeleton } from "./CnKeyValueFieldSkeleton";

const countOf = (container: HTMLElement, attr: string) =>
  container.querySelectorAll(`[${attr}]`).length;

describe("CnKeyValueFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnKeyValueFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "key-value-field");
  });

  it("follows row count, max rows and locked state", () => {
    const { container, rerender } = render(<CnKeyValueFieldSkeleton rows={3} />);
    expect(countOf(container, "data-cn-skeleton-row")).toBe(3);
    expect(countOf(container, "data-cn-skeleton-remove")).toBe(3);
    expect(countOf(container, "data-cn-skeleton-add")).toBe(1);
    rerender(<CnKeyValueFieldSkeleton rows={2} maxRows={2} />);
    expect(countOf(container, "data-cn-skeleton-add")).toBe(0);
    rerender(<CnKeyValueFieldSkeleton rows={2} readOnly />);
    expect(countOf(container, "data-cn-skeleton-remove")).toBe(0);
  });

  it("follows the field size", () => {
    const { container } = render(<CnKeyValueFieldSkeleton rows={1} size="lg" />);
    const field = container.querySelector(
      "[data-cn-skeleton-row] > div > div > div",
    ) as HTMLElement;
    expect(getComputedStyle(field).minHeight).toBe("48px");
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(
      <CnKeyValueField label="Atributos" defaultValue={[{ key: "a", value: "1" }]} skeleton />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "key-value-field");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
