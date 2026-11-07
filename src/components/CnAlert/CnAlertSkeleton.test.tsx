import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnAlert } from "./CnAlert";
import { CnAlertSkeleton } from "./CnAlertSkeleton";

const pieces = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-cn-skeleton="true"]');

describe("CnAlertSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnAlertSkeleton title action closable />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "alert");
  });

  it("follows the pieces and the filled variant", () => {
    const { container, rerender } = render(<CnAlertSkeleton />);
    // ícono + 2 líneas
    expect(pieces(container)).toHaveLength(3);

    rerender(<CnAlertSkeleton title action closable lines={3} />);
    // ícono + título + 3 líneas + acción + cerrar
    expect(pieces(container)).toHaveLength(7);

    rerender(<CnAlertSkeleton variant="filled" title />);
    expect(pieces(container)).toHaveLength(1);
  });

  it("replaces the alert with its skeleton via the skeleton prop", () => {
    render(<CnAlert severity="error" title="Error" message="Algo falló" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "alert");
    expect(screen.queryByText("Algo falló")).not.toBeInTheDocument();
  });
});
