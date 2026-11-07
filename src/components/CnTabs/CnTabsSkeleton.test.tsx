import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnTabs } from "./CnTabs";
import { CnTabsSkeleton } from "./CnTabsSkeleton";

const tabsOf = (container: HTMLElement) =>
  container.querySelectorAll("[data-cn-tabs-skeleton-tab]");

describe("CnTabsSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnTabsSkeleton icons badges panel />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "tabs");
  });

  it("follows tab count, icons, size and orientation", () => {
    const { container, rerender } = render(<CnTabsSkeleton tabs={5} />);
    expect(tabsOf(container)).toHaveLength(5);
    const plain = container.querySelectorAll('[data-cn-skeleton="true"]').length;
    rerender(<CnTabsSkeleton tabs={5} icons />);
    expect(container.querySelectorAll('[data-cn-skeleton="true"]').length).toBe(plain + 5);
    rerender(<CnTabsSkeleton size="lg" />);
    expect(getComputedStyle(tabsOf(container)[0] as HTMLElement).minHeight).toBe("42px");
    rerender(<CnTabsSkeleton orientation="vertical" />);
    const strip = container.querySelector("[data-cn-tabs-skeleton-strip]") as HTMLElement;
    expect(getComputedStyle(strip).flexDirection).toBe("column");
  });

  it("renders an optional panel", () => {
    const { container } = render(<CnTabsSkeleton panel={3} />);
    expect(container.querySelector("[data-cn-tabs-skeleton-panel]")).not.toBeNull();
  });

  it("replaces the tabs with their skeleton via the skeleton prop", () => {
    const { container } = render(
      <CnTabs
        options={[
          { id: 1, label: "Uno" },
          { id: 2, label: "Dos" },
        ]}
        value={2}
        onChange={() => undefined}
        skeleton
      />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "tabs");
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(tabsOf(container)).toHaveLength(2);
    expect(tabsOf(container)[1]).toHaveAttribute("data-cn-tabs-skeleton-tab", "selected");
  });
});
