import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnFileField } from "./CnFileField";
import { CnFileFieldSkeleton } from "./CnFileFieldSkeleton";

const count = (container: HTMLElement, part: string) =>
  container.querySelectorAll(`[data-sk-part="${part}"]`).length;

describe("CnFileFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnFileFieldSkeleton helperText constraints />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "file-field");
  });

  it("renders the shape of each variant", () => {
    const { container, rerender } = render(<CnFileFieldSkeleton files={3} />);
    expect(count(container, "dropzone")).toBe(1);
    expect(count(container, "file")).toBe(3);

    rerender(<CnFileFieldSkeleton variant="button" files={1} />);
    expect(count(container, "dropzone")).toBe(0);
    expect(count(container, "button")).toBe(1);

    rerender(<CnFileFieldSkeleton variant="grid" files={4} gridColumns={4} />);
    const gallery = container.querySelector('[data-sk-part="gallery"]') as HTMLElement;
    expect(getComputedStyle(gallery).gridTemplateColumns).toBe("repeat(4, minmax(0, 1fr))");
    expect(count(container, "file")).toBe(4);
    expect(count(container, "add")).toBe(1);

    rerender(<CnFileFieldSkeleton variant="grid" files={4} readOnly />);
    expect(count(container, "add")).toBe(0);

    rerender(<CnFileFieldSkeleton variant="avatar" thumbnailSize={88} />);
    const avatar = container.querySelector('[data-sk-part="avatar"]') as HTMLElement;
    expect(getComputedStyle(avatar).width).toBe("88px");
    expect(count(container, "file")).toBe(0);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    const { container } = render(<CnFileField label="Fotos" variant="grid" multiple skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "file-field");
    expect(container.querySelector('[data-sk-variant="grid"]')).toBeInTheDocument();
    expect(screen.queryByTestId("cn-file-input")).not.toBeInTheDocument();
  });
});
