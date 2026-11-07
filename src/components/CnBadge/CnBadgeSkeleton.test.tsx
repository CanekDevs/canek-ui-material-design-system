import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnBadge } from "./CnBadge";
import { CnBadgeSkeleton } from "./CnBadgeSkeleton";

const pieces = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-cn-skeleton="true"]');

describe("CnBadgeSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnBadgeSkeleton child />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "badge");
  });

  it("switches between dot and count pill", () => {
    const { container, rerender } = render(<CnBadgeSkeleton variant="dot" size="lg" />);
    expect(getComputedStyle(pieces(container)[0]).width).toBe("10px");

    rerender(<CnBadgeSkeleton content={1250} max={999} />);
    const pill = pieces(container)[0];
    expect(getComputedStyle(pill).height).toBe("18px");
    expect(parseInt(getComputedStyle(pill).width, 10)).toBeGreaterThan(18);
  });

  it("draws the wrapped element placeholder", () => {
    const { container } = render(<CnBadgeSkeleton child overlap="circular" childSize={48} />);
    expect(pieces(container)).toHaveLength(2);
    expect(getComputedStyle(pieces(container)[0]).width).toBe("48px");
  });

  it("replaces the badge with its skeleton via the skeleton prop", () => {
    render(
      <CnBadge content={5} skeleton>
        <span>Bandeja</span>
      </CnBadge>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "badge");
    expect(screen.queryByText("Bandeja")).not.toBeInTheDocument();
  });
});
