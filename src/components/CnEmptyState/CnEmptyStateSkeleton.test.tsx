import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnEmptyState } from "./CnEmptyState";
import { CnEmptyStateSkeleton } from "./CnEmptyStateSkeleton";

const pieces = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-cn-skeleton="true"]');

describe("CnEmptyStateSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnEmptyStateSkeleton action />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "empty-state");
  });

  it("follows size, variant and pieces", () => {
    const { container, rerender } = render(<CnEmptyStateSkeleton size="lg" />);
    // ícono + título + 2 líneas
    expect(pieces(container)).toHaveLength(4);
    expect(getComputedStyle(pieces(container)[0]).width).toBe("72px");

    rerender(<CnEmptyStateSkeleton variant="compact" size="lg" />);
    expect(getComputedStyle(pieces(container)[0]).width).toBe("32px");

    rerender(<CnEmptyStateSkeleton action={2} />);
    expect(pieces(container)).toHaveLength(6);
  });

  it("replaces the empty state with its skeleton via the skeleton prop", () => {
    render(<CnEmptyState title="Sin resultados" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "empty-state");
    expect(screen.queryByText("Sin resultados")).not.toBeInTheDocument();
  });
});
