import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnTreeSelectField } from "./CnTreeSelectField";
import { CnTreeSelectFieldSkeleton } from "./CnTreeSelectFieldSkeleton";

describe("CnTreeSelectFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnTreeSelectFieldSkeleton helperText multiple />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "tree-select-field");
  });

  it("shows up to four chips plus a +N chip", () => {
    const { container, rerender } = render(
      <CnTreeSelectFieldSkeleton multiple selectedCount={3} />,
    );
    expect(container.querySelector("[data-cn-skeleton-chips]")?.children).toHaveLength(3);
    rerender(<CnTreeSelectFieldSkeleton multiple selectedCount={9} />);
    expect(container.querySelector("[data-cn-skeleton-chips]")?.children).toHaveLength(5);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnTreeSelectField label="Área" options={[{ value: "a", label: "A" }]} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "tree-select-field");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
