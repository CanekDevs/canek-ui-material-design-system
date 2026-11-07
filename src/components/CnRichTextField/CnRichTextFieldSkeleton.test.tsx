import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnRichTextField } from "./CnRichTextField";
import { CnRichTextFieldSkeleton } from "./CnRichTextFieldSkeleton";

const count = (container: HTMLElement, part: string) =>
  container.querySelectorAll(`[data-sk-part="${part}"]`).length;

describe("CnRichTextFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnRichTextFieldSkeleton helperText showCount />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "rich-text-field");
  });

  it("follows the toolbar preset, custom tools and read-only", () => {
    const { container, rerender } = render(<CnRichTextFieldSkeleton toolbar="basic" />);
    expect(count(container, "tool")).toBe(6);
    expect(count(container, "select")).toBe(0);
    rerender(<CnRichTextFieldSkeleton toolbar="full" />);
    // 2 (deshacer/rehacer) + 6 formato + 4 bloques + 4 alineación + 4 inserción
    expect(count(container, "tool")).toBe(20);
    expect(count(container, "select")).toBe(1);
    rerender(<CnRichTextFieldSkeleton toolbar={["bold", "link"]} />);
    expect(count(container, "tool")).toBe(2);
    rerender(<CnRichTextFieldSkeleton readOnly />);
    expect(count(container, "toolbar")).toBe(0);
  });

  it("follows minHeight and line count", () => {
    const { container } = render(<CnRichTextFieldSkeleton minHeight={120} lines={2} />);
    const editor = container.querySelector('[data-sk-part="editor"]') as HTMLElement;
    expect(getComputedStyle(editor).minHeight).toBe("120px");
    expect(editor.children).toHaveLength(2);
  });

  it("replaces the editor with its skeleton via the skeleton prop", () => {
    render(<CnRichTextField label="Descripción" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "rich-text-field");
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });
});
