import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnConfirmDialog } from "./CnConfirmDialog";
import { CnConfirmDialogSkeleton } from "./CnConfirmDialogSkeleton";

const pieces = (container: HTMLElement) =>
  container.querySelectorAll('[data-cn-skeleton="true"]').length;

describe("CnConfirmDialogSkeleton", () => {
  it("is a single accessible status rendered inline", () => {
    render(<CnConfirmDialogSkeleton details requireText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "confirm-dialog");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("follows icon, message lines, cancel and the variant confirm button", () => {
    const { container, rerender } = render(<CnConfirmDialogSkeleton lines={2} />);
    const base = pieces(container);
    rerender(<CnConfirmDialogSkeleton lines={4} icon={false} hideCancel />);
    // +2 líneas, -1 ícono, -1 texto de cancelar
    expect(pieces(container)).toBe(base);
    expect(container.querySelector("[data-cn-confirm-skeleton-confirm]")).toHaveAttribute(
      "data-cn-confirm-skeleton-confirm",
      "text",
    );
    rerender(<CnConfirmDialogSkeleton variant="delete" />);
    expect(container.querySelector("[data-cn-confirm-skeleton-confirm]")).toHaveAttribute(
      "data-cn-confirm-skeleton-confirm",
      "icon",
    );
    rerender(<CnConfirmDialogSkeleton details requireText />);
    expect(container.querySelector("[data-cn-confirm-skeleton-details]")).not.toBeNull();
    expect(container.querySelector("[data-cn-confirm-skeleton-require]")).not.toBeNull();
  });

  it("uses the dialog width when it draws its own surface", () => {
    render(<CnConfirmDialogSkeleton surface maxWidth="sm" />);
    expect(getComputedStyle(screen.getByRole("status")).maxWidth).toBe("600px");
  });

  it("renders the skeleton inside the open dialog via the skeleton prop", () => {
    render(
      <CnConfirmDialog
        open
        variant="delete"
        title="¿Eliminar ACME?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        skeleton
      />,
    );
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.querySelector('[data-cn-skeleton="confirm-dialog"]')).not.toBeNull();
    expect(screen.queryByText("¿Eliminar ACME?")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
  });
});
