import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnIcon } from "./CnIcon";

describe("CnIcon", () => {
  it("renders a registered icon", () => {
    const { container } = render(<CnIcon name="add" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("resolves aliases", () => {
    const { container } = render(<CnIcon name="plus" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("returns null and warns on unregistered icon", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { container } = render(<CnIcon name="not_a_real_icon" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not_a_real_icon"));
    warn.mockRestore();
  });

  it("applies semantic color", () => {
    const { container } = render(<CnIcon name="check" color="success" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveStyle({ color: "var(--cn-color-success-600, #228740)" });
  });

  it("applies custom size as number", () => {
    const { container } = render(<CnIcon name="check" size={32} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveStyle({ fontSize: "32px" });
  });

  it("applies size keyword", () => {
    const { container } = render(<CnIcon name="check" size="xl" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveStyle({ fontSize: "32px" });
  });

  it("sets aria-hidden when no label", () => {
    const { container } = render(<CnIcon name="add" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("sets role img and aria-label when label is provided", () => {
    const { container } = render(<CnIcon name="add" label="Agregar" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("aria-label", "Agregar");
  });

  it("applies rotate transform", () => {
    const { container } = render(<CnIcon name="arrow_forward" rotate={90} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveStyle({ transform: "rotate(90deg)" });
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    const { container } = render(<CnIcon name="add" onClick={onClick} />);
    const svg = container.querySelector("svg") as SVGSVGElement;
    svg.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
