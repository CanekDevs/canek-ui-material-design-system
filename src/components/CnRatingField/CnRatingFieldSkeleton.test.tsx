import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnRatingField } from "./CnRatingField";
import { CnRatingFieldSkeleton } from "./CnRatingFieldSkeleton";

const stars = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-cn-skeleton-star] > *"));

describe("CnRatingFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnRatingFieldSkeleton labels helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "rating-field");
  });

  it("follows star count and size", () => {
    const { container, rerender } = render(<CnRatingFieldSkeleton />);
    expect(stars(container)).toHaveLength(5);
    expect(getComputedStyle(stars(container)[0]).width).toBe("24px");
    rerender(<CnRatingFieldSkeleton max={10} size="lg" />);
    expect(stars(container)).toHaveLength(10);
    expect(getComputedStyle(stars(container)[0]).width).toBe("30px");
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnRatingField label="Satisfacción" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "rating-field");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
