import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnPasswordField } from "./CnPasswordField";
import { CnPasswordFieldSkeleton } from "./CnPasswordFieldSkeleton";

describe("CnPasswordFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnPasswordFieldSkeleton showRequirements allowGenerate helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "password-field");
  });

  it("shows the strength meter and one row per requirement", () => {
    const { container, rerender } = render(<CnPasswordFieldSkeleton showStrength={false} />);
    expect(container.querySelector("[data-cn-skeleton-strength]")).not.toBeInTheDocument();
    rerender(<CnPasswordFieldSkeleton showRequirements requirements={5} />);
    expect(container.querySelector("[data-cn-skeleton-strength]")).toBeInTheDocument();
    expect(container.querySelector("[data-cn-skeleton-requirements]")?.children).toHaveLength(5);
    rerender(<CnPasswordFieldSkeleton showRequirements />);
    expect(container.querySelector("[data-cn-skeleton-requirements]")?.children).toHaveLength(4);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    const { container } = render(<CnPasswordField label="Contraseña" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "password-field");
    expect(container.querySelector('input[type="password"]')).not.toBeInTheDocument();
  });
});
