import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnPhoneField } from "./CnPhoneField";
import { CnPhoneFieldSkeleton } from "./CnPhoneFieldSkeleton";

const parts = (container: HTMLElement) =>
  container.querySelectorAll('[data-cn-skeleton="true"]').length;

describe("CnPhoneFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnPhoneFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "phone-field");
  });

  it("drops the selector chevron with a fixed country", () => {
    const { container, rerender } = render(<CnPhoneFieldSkeleton />);
    const withSelect = parts(container);
    rerender(<CnPhoneFieldSkeleton showCountrySelect={false} />);
    expect(parts(container)).toBe(withSelect - 1);
    expect(container.querySelector('[data-cn-skeleton-country="fixed"]')).toBeInTheDocument();
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnPhoneField label="Teléfono" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "phone-field");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
