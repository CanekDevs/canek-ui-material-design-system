import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnColorField } from "./CnColorField";
import { CnColorFieldSkeleton } from "./CnColorFieldSkeleton";

describe("CnColorFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnColorFieldSkeleton helperText palette />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "color-field");
  });

  it("renders the palette with one swatch per preset", () => {
    const { container, rerender } = render(<CnColorFieldSkeleton />);
    expect(container.querySelector("[data-cn-skeleton-palette]")).not.toBeInTheDocument();
    rerender(<CnColorFieldSkeleton palette presets={8} />);
    expect(container.querySelector("[data-cn-skeleton-palette]")?.children).toHaveLength(8);
    rerender(<CnColorFieldSkeleton palette />);
    expect(container.querySelector("[data-cn-skeleton-palette]")?.children).toHaveLength(16);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnColorField label="Color" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "color-field");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
