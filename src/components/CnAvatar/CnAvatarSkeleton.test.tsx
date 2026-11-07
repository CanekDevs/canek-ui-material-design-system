import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnAvatar } from "./CnAvatar";
import { CnAvatarGroup } from "./CnAvatarGroup";
import { CnAvatarGroupSkeleton, CnAvatarSkeleton } from "./CnAvatarSkeleton";

const pieces = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-cn-skeleton="true"]');

describe("CnAvatarSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnAvatarSkeleton status badge />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "avatar");
  });

  it("follows size, variant, status and badge", () => {
    const { container, rerender } = render(<CnAvatarSkeleton size="xl" variant="square" />);
    expect(pieces(container)).toHaveLength(1);
    expect(getComputedStyle(pieces(container)[0]).width).toBe("64px");
    expect(getComputedStyle(pieces(container)[0]).borderRadius).toBe("0");

    rerender(<CnAvatarSkeleton status badge />);
    expect(pieces(container)).toHaveLength(3);
  });

  it("renders a group with a surplus avatar", () => {
    const { container } = render(<CnAvatarGroupSkeleton count={7} max={4} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "avatar-group");
    expect(pieces(container)).toHaveLength(4);
    expect(
      container.querySelectorAll('[data-cn-avatar-group-skeleton-item="surplus"]'),
    ).toHaveLength(1);
  });

  it("replaces the avatar and group via the skeleton prop", () => {
    const { rerender } = render(<CnAvatar name="Ana López" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "avatar");
    expect(screen.queryByText("AL")).not.toBeInTheDocument();

    rerender(
      <CnAvatarGroup skeleton>
        <CnAvatar name="Ana" />
        <CnAvatar name="Beto" />
      </CnAvatarGroup>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "avatar-group");
  });
});
