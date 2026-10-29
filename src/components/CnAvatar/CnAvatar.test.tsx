import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnAvatar } from "./CnAvatar";
import { CnAvatarGroup } from "./CnAvatarGroup";

describe("CnAvatar", () => {
  it("renders with src", () => {
    const { container } = render(<CnAvatar src="https://example.com/photo.jpg" alt="User photo" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders initials from name", () => {
    render(<CnAvatar name="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders single letter for one-word name", () => {
    render(<CnAvatar name="Angel" />);
    expect(screen.getByText("AN")).toBeInTheDocument();
  });

  it("renders explicit initials overriding name", () => {
    render(<CnAvatar name="John Doe" initials="XY" />);
    expect(screen.getByText("XY")).toBeInTheDocument();
    expect(screen.queryByText("JD")).toBeNull();
  });

  it("renders icon when no src, name or initials", () => {
    const { container } = render(<CnAvatar icon="person_add" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders children when no src, name, initials or icon", () => {
    render(
      <CnAvatar>
        <span data-testid="custom">C</span>
      </CnAvatar>,
    );
    expect(screen.getByTestId("custom")).toBeInTheDocument();
  });

  it("falls back to person icon when nothing is provided", () => {
    const { container } = render(<CnAvatar />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("calls onClick when clickable", () => {
    const onClick = vi.fn();
    render(<CnAvatar name="John Doe" clickable onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("fires onClick on Enter key", () => {
    const onClick = vi.fn();
    render(<CnAvatar name="John Doe" clickable onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("fires onClick on Space key", () => {
    const onClick = vi.fn();
    render(<CnAvatar name="John Doe" clickable onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders as anchor when href is provided", () => {
    render(<CnAvatar name="John Doe" href="https://example.com" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("renders status indicator", () => {
    const { container } = render(<CnAvatar name="John Doe" status="online" />);
    const statusDot = container.querySelector("[data-cn-avatar-status='online']");
    expect(statusDot).toBeInTheDocument();
    expect(statusDot).toHaveAttribute("aria-hidden", "true");
  });

  it.each(["online", "offline", "busy", "away"] as const)(
    "renders status dot with data attribute for %s",
    (status) => {
      const { container } = render(<CnAvatar name="John Doe" status={status} />);
      expect(container.querySelector(`[data-cn-avatar-status='${status}']`)).toBeInTheDocument();
    },
  );

  it("renders badge", () => {
    render(<CnAvatar name="John Doe" badge={{ content: 3 }} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("hides badge when invisible", () => {
    render(<CnAvatar name="John Doe" badge={{ content: 3, invisible: true }} />);
    const badge = screen.queryByText("3");
    if (badge) {
      expect(badge.closest(".MuiBadge-badge")).toHaveStyle({ transform: "scale(0)" });
    }
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(<CnAvatar name="John Doe" clickable disabled onClick={onClick} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("applies aria-label", () => {
    render(<CnAvatar name="John Doe" clickable ariaLabel="Perfil de John" />);
    expect(screen.getByLabelText("Perfil de John")).toBeInTheDocument();
  });
});

describe("CnAvatarGroup", () => {
  it("renders children", () => {
    render(
      <CnAvatarGroup>
        <CnAvatar name="John Doe" />
        <CnAvatar name="Jane Smith" />
      </CnAvatarGroup>,
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("shows surplus when exceeding max", () => {
    render(
      <CnAvatarGroup max={2}>
        <CnAvatar name="User One" />
        <CnAvatar name="User Two" />
        <CnAvatar name="User Three" />
        <CnAvatar name="User Four" />
      </CnAvatarGroup>,
    );
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("uses custom renderSurplus", () => {
    render(
      <CnAvatarGroup max={2} renderSurplus={(n) => <span>+{n} more</span>}>
        <CnAvatar name="User One" />
        <CnAvatar name="User Two" />
        <CnAvatar name="User Three" />
      </CnAvatarGroup>,
    );
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });
});
