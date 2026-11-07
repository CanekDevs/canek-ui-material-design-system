import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnMaskedField } from "./CnMaskedField";
import { CnMaskedFieldSkeleton } from "./CnMaskedFieldSkeleton";

const blocks = (container: HTMLElement) =>
  container.querySelectorAll('[data-cn-skeleton-mask] > div > [data-cn-skeleton="true"]').length;

describe("CnMaskedFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnMaskedFieldSkeleton preset="creditCard" helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "masked-field");
  });

  it("draws one block per mask group", () => {
    const { container, rerender } = render(<CnMaskedFieldSkeleton preset="creditCard" />);
    expect(blocks(container)).toBe(4);
    rerender(<CnMaskedFieldSkeleton preset="phoneMX" />);
    expect(blocks(container)).toBe(3);
    rerender(<CnMaskedFieldSkeleton mask="AAA-####" />);
    expect(blocks(container)).toBe(2);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnMaskedField label="CLABE" preset="clabe" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "masked-field");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
