import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnFlagIcon } from "./CnFlagIcon";
import { CnFlagIconSkeleton } from "./CnFlagIconSkeleton";

const pieces = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-cn-skeleton="true"]');

describe("CnFlagIconSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnFlagIconSkeleton variant="full" />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "flag-icon");
  });

  it("follows size and variant", () => {
    const { container, rerender } = render(<CnFlagIconSkeleton size={20} />);
    expect(pieces(container)).toHaveLength(1);
    expect(getComputedStyle(pieces(container)[0]).width).toBe("30px");

    rerender(<CnFlagIconSkeleton variant="with-name" />);
    expect(pieces(container)).toHaveLength(2);
    rerender(<CnFlagIconSkeleton variant="full" />);
    expect(pieces(container)).toHaveLength(3);
  });

  it("replaces the flag with its skeleton via the skeleton prop", () => {
    render(<CnFlagIcon code="MX" name="México" variant="with-name" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "flag-icon");
    expect(screen.queryByText("México")).not.toBeInTheDocument();
  });
});
