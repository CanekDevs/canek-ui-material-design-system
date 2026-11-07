import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnToastProvider, useToast } from "./CnToast";
import { CnToastSkeleton } from "./CnToastSkeleton";

const pieces = (container: HTMLElement) =>
  container.querySelectorAll('[data-cn-skeleton="true"]').length;

describe("CnToastSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnToastSkeleton severity="error" details={2} action />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "toast");
  });

  it("follows the severity layout", () => {
    const { container, rerender } = render(<CnToastSkeleton severity="success" />);
    // ícono + título + 1 línea + cierre
    expect(pieces(container)).toBe(4);
    rerender(<CnToastSkeleton severity="info" />);
    // sin título por defecto
    expect(pieces(container)).toBe(3);
    rerender(<CnToastSkeleton severity="loading" />);
    expect(container.querySelector("[data-cn-toast-skeleton-close]")).toBeNull();
    rerender(<CnToastSkeleton severity="error" details={3} action />);
    expect(container.querySelector("[data-cn-toast-skeleton-details]")?.children).toHaveLength(3);
    expect(container.querySelector("[data-cn-toast-skeleton-action]")).not.toBeNull();
  });

  it("renders a toast as skeleton via the skeleton option", () => {
    const Trigger = () => {
      const toast = useToast();
      return (
        <button type="button" onClick={() => toast.success("Guardado", { skeleton: true })}>
          mostrar
        </button>
      );
    };
    render(
      <CnToastProvider>
        <Trigger />
      </CnToastProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "mostrar" }));
    });
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "toast");
    expect(screen.queryByText("Guardado")).not.toBeInTheDocument();
  });
});
