import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnTagsField } from "./CnTagsField";
import { CnTagsFieldSkeleton } from "./CnTagsFieldSkeleton";

const chips = (container: HTMLElement) =>
  container.querySelectorAll("[data-cn-skeleton-chip]").length;

describe("CnTagsFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnTagsFieldSkeleton helperText maxTags={5} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "tags-field");
  });

  it("follows chip count and counter", () => {
    const { container, rerender } = render(<CnTagsFieldSkeleton label={false} />);
    expect(chips(container)).toBe(3);
    const base = container.querySelectorAll('[data-cn-skeleton="true"]').length;
    rerender(<CnTagsFieldSkeleton label={false} tags={6} maxTags={10} />);
    expect(chips(container)).toBe(6);
    // Tres chips más y el contador.
    expect(container.querySelectorAll('[data-cn-skeleton="true"]').length).toBe(base + 4);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnTagsField label="Etiquetas" defaultValue={["a", "b"]} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "tags-field");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
