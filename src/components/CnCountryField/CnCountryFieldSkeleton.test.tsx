import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnCountryField } from "./CnCountryField";
import { CnCountryFieldSkeleton } from "./CnCountryFieldSkeleton";

describe("CnCountryFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnCountryFieldSkeleton helperText multiple />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "country-field");
  });

  it("switches from flag + name to chips with multiple", () => {
    const { container, rerender } = render(<CnCountryFieldSkeleton />);
    expect(container.querySelector("[data-cn-skeleton-chips]")).not.toBeInTheDocument();
    rerender(<CnCountryFieldSkeleton multiple selectedCount={5} limitTags={2} />);
    const chips = container.querySelector("[data-cn-skeleton-chips]");
    expect(chips?.children).toHaveLength(3);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnCountryField label="País" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "country-field");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
