import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnBadge } from "./CnBadge";

describe("CnBadge", () => {
  it("renders standalone count badge", () => {
    const { container } = render(<CnBadge content={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(container.querySelector("[data-cn-badge-variant='count']")).toBeInTheDocument();
  });

  it("renders standalone dot badge", () => {
    const { container } = render(<CnBadge variant="dot" color="success" />);
    expect(container.querySelector("[data-cn-badge-variant='dot']")).toBeInTheDocument();
  });

  it("renders standalone label badge", () => {
    render(<CnBadge variant="label" content="NEW" />);
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("truncates count above max", () => {
    render(<CnBadge content={150} max={99} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("does not truncate count below max", () => {
    render(<CnBadge content={42} max={99} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("hides zero count by default", () => {
    const { container } = render(<CnBadge content={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows zero when showZero is true", () => {
    render(<CnBadge content={0} showZero />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("hides empty label", () => {
    const { container } = render(<CnBadge variant="label" content="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders with children wrapping count", () => {
    const { container } = render(
      <CnBadge content={5}>
        <span data-testid="child">Icon</span>
      </CnBadge>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(container.querySelector(".MuiBadge-root")).toBeInTheDocument();
  });

  it("renders with children wrapping dot", () => {
    const { container } = render(
      <CnBadge variant="dot" color="success">
        <span data-testid="child">Avatar</span>
      </CnBadge>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(container.querySelector(".MuiBadge-dot")).toBeInTheDocument();
  });

  it("applies color as data attribute", () => {
    const { container } = render(<CnBadge content={3} color="success" />);
    expect(container.querySelector("[data-cn-badge-color='success']")).toBeInTheDocument();
  });

  it("applies size as data attribute", () => {
    const { container } = render(<CnBadge content={3} size="lg" />);
    expect(container.querySelector("[data-cn-badge-size='lg']")).toBeInTheDocument();
  });

  it("applies pulse as data attribute", () => {
    const { container } = render(<CnBadge content={3} pulse />);
    expect(container.querySelector("[data-cn-badge-pulse='true']")).toBeInTheDocument();
  });

  it("renders custom aria-label", () => {
    render(<CnBadge content={3} ariaLabel="3 notificaciones" />);
    expect(screen.getByLabelText("3 notificaciones")).toBeInTheDocument();
  });

  it("renders standalone count with role status", () => {
    render(<CnBadge content={3} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("respects invisible prop with children", () => {
    const { container } = render(
      <CnBadge content={3} invisible>
        <span>Icon</span>
      </CnBadge>,
    );
    expect(container.querySelector(".MuiBadge-root")).toBeInTheDocument();
  });
});
