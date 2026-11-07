import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnOtpField } from "./CnOtpField";
import { CnOtpFieldSkeleton } from "./CnOtpFieldSkeleton";

const boxes = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-cn-skeleton-box]"));

describe("CnOtpFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnOtpFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "otp-field");
  });

  it("follows length, groups and size", () => {
    const { container, rerender } = render(<CnOtpFieldSkeleton />);
    expect(boxes(container)).toHaveLength(6);
    expect(getComputedStyle(boxes(container)[0]).width).toBe("44px");
    expect(container.querySelectorAll("[data-cn-skeleton-separator]")).toHaveLength(0);
    rerender(<CnOtpFieldSkeleton length={8} groupSize={4} size="lg" />);
    expect(boxes(container)).toHaveLength(8);
    expect(getComputedStyle(boxes(container)[0]).width).toBe("52px");
    expect(container.querySelectorAll("[data-cn-skeleton-separator]")).toHaveLength(1);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnOtpField label="Código" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "otp-field");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
