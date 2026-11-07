import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnCurrencyField } from "./CnCurrencyField";
import { CnCurrencyFieldSkeleton } from "./CnCurrencyFieldSkeleton";

const prefixWidth = (container: HTMLElement) =>
  getComputedStyle(
    container.querySelector(
      '[data-cn-skeleton-controls] > [data-cn-skeleton="true"]',
    ) as HTMLElement,
  ).width;

describe("CnCurrencyFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnCurrencyFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "currency-field");
  });

  it("widens the prefix with the currency selector", () => {
    const { container, rerender } = render(<CnCurrencyFieldSkeleton />);
    const hidden = parseInt(prefixWidth(container), 10);
    rerender(<CnCurrencyFieldSkeleton currencySelectorMode="editable" />);
    expect(parseInt(prefixWidth(container), 10)).toBeGreaterThan(hidden);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnCurrencyField label="Monto" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "currency-field");
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });
});
