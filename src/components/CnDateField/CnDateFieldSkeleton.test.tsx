import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnDateField } from "./CnDateField";
import { CnDateFieldSkeleton } from "./CnDateFieldSkeleton";
import { CnDateRangeField } from "./CnDateRangeField";
import { CnDateRangeFieldSkeleton } from "./CnDateRangeFieldSkeleton";

const valueWidth = (container: HTMLElement) =>
  parseInt(
    getComputedStyle(
      container.querySelector('[data-cn-skeleton-date] [data-cn-skeleton="true"]') as HTMLElement,
    ).width,
    10,
  );

describe("CnDateFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnDateFieldSkeleton helperText clearable />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "date-field");
  });

  it("sizes the value after the type", () => {
    const { container, rerender } = render(<CnDateFieldSkeleton type="date" />);
    const date = valueWidth(container);
    rerender(<CnDateFieldSkeleton type="datetime" />);
    expect(valueWidth(container)).toBeGreaterThan(date);
    rerender(<CnDateFieldSkeleton type="time" />);
    expect(valueWidth(container)).toBeLessThan(date);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnDateField label="Fecha" type="time" skeleton />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("data-cn-skeleton", "date-field");
    expect(status.querySelector('[data-cn-skeleton-date="time"]')).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});

describe("CnDateRangeFieldSkeleton", () => {
  it("is a single status with two fields and a separator", () => {
    const { container } = render(<CnDateRangeFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "date-range-field");
    expect(container.querySelector("[data-cn-skeleton-separator]")).toBeInTheDocument();
  });

  it("replaces the range field via the skeleton prop", () => {
    render(<CnDateRangeField label="Periodo" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "date-range-field");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
