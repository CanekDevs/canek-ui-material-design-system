import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnAutocompleteField } from "./CnAutocompleteField";
import { CnAutocompleteFieldSkeleton } from "./CnAutocompleteFieldSkeleton";

const parts = (container: HTMLElement) =>
  container.querySelectorAll('[data-cn-skeleton="true"]').length;

describe("CnAutocompleteFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnAutocompleteFieldSkeleton helperText multiple />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "autocomplete-field");
  });

  it("caps chips at limitTags and adds a +N chip", () => {
    const { container, rerender } = render(
      <CnAutocompleteFieldSkeleton multiple selectedCount={3} limitTags={3} />,
    );
    const three = parts(container);
    rerender(<CnAutocompleteFieldSkeleton multiple selectedCount={9} limitTags={3} />);
    expect(parts(container)).toBe(three + 1);
  });

  it("drops the popup chevron with freeSolo", () => {
    const { container, rerender } = render(<CnAutocompleteFieldSkeleton />);
    const withChevron = parts(container);
    rerender(<CnAutocompleteFieldSkeleton freeSolo />);
    expect(parts(container)).toBe(withChevron - 1);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnAutocompleteField label="Ciudad" options={[]} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "autocomplete-field");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
