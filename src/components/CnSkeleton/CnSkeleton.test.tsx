import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnSkeleton } from "./CnSkeleton";

describe("CnSkeleton", () => {
  it("renders with default props", () => {
    const { container } = render(<CnSkeleton />);
    expect(container.querySelector("[data-cn-skeleton='true']")).toBeInTheDocument();
  });

  it("applies variant as data attribute", () => {
    const { container } = render(<CnSkeleton variant="circular" />);
    expect(container.querySelector("[data-cn-skeleton-variant='circular']")).toBeInTheDocument();
  });

  it("applies animation as data attribute", () => {
    const { container } = render(<CnSkeleton animation="pulse" />);
    expect(container.querySelector("[data-cn-skeleton-animation='pulse']")).toBeInTheDocument();
  });

  it("applies width and height as numbers", () => {
    const { container } = render(<CnSkeleton width={100} height={24} />);
    const element = container.querySelector("[data-cn-skeleton='true']");
    expect(element).toHaveStyle({ width: "100px", height: "24px" });
  });

  it("applies width and height as strings", () => {
    const { container } = render(<CnSkeleton width="50%" height="1.5rem" />);
    const element = container.querySelector("[data-cn-skeleton='true']");
    expect(element).toHaveStyle({ width: "50%", height: "1.5rem" });
  });

  it("applies explicit radius", () => {
    const { container } = render(<CnSkeleton radius={16} />);
    const element = container.querySelector("[data-cn-skeleton='true']");
    expect(element).toHaveStyle({ borderRadius: "16px" });
  });

  it("uses circle radius for circular variant", () => {
    const { container } = render(<CnSkeleton variant="circular" width={40} height={40} />);
    const element = container.querySelector("[data-cn-skeleton='true']");
    expect(element).toHaveStyle({ borderRadius: "50%" });
  });

  it("uses no radius for rectangular variant", () => {
    const { container } = render(<CnSkeleton variant="rectangular" />);
    const element = container.querySelector("[data-cn-skeleton='true']");
    expect(element).toHaveStyle({ borderRadius: "0" });
  });

  it("renders single text line", () => {
    const { container } = render(<CnSkeleton variant="text" />);
    const element = container.querySelector("[data-cn-skeleton='true']");
    expect(element).toHaveStyle({ height: "0.85em" });
  });

  it("renders multiple text lines", () => {
    const { container } = render(<CnSkeleton variant="text" lines={3} />);
    const wrapper = container.querySelector("[data-cn-skeleton='true']");
    expect(wrapper).toHaveAttribute("data-cn-skeleton-variant", "text");
    const lines = wrapper?.querySelectorAll("div");
    expect(lines?.length).toBe(3);
  });

  it("last line of multiline is shorter", () => {
    const { container } = render(<CnSkeleton variant="text" lines={3} />);
    const wrapper = container.querySelector("[data-cn-skeleton='true']");
    const lines = wrapper?.querySelectorAll("div");
    const lastLine = lines?.[lines.length - 1];
    expect(lastLine).toHaveStyle({ width: "65%" });
  });

  it("applies custom gap between lines", () => {
    const { container } = render(<CnSkeleton variant="text" lines={2} lineGap={12} />);
    const wrapper = container.querySelector("[data-cn-skeleton='true']");
    expect(wrapper).toHaveStyle({ gap: "12px" });
  });

  it("applies accessibility role status and aria-busy", () => {
    render(<CnSkeleton />);
    const element = screen.getByRole("status");
    expect(element).toHaveAttribute("aria-busy", "true");
    expect(element).toHaveAttribute("aria-label", "Cargando contenido");
  });

  it("allows custom aria-label", () => {
    render(<CnSkeleton ariaLabel="Cargando productos" />);
    expect(screen.getByLabelText("Cargando productos")).toBeInTheDocument();
  });

  it("applies animation=none when specified", () => {
    const { container } = render(<CnSkeleton animation="none" />);
    expect(container.querySelector("[data-cn-skeleton-animation='none']")).toBeInTheDocument();
  });

  it("applies wave animation by default", () => {
    const { container } = render(<CnSkeleton />);
    expect(container.querySelector("[data-cn-skeleton-animation='wave']")).toBeInTheDocument();
  });
});
