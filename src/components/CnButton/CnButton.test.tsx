import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CnButton } from "./CnButton";

describe("CnButton", () => {
  it("renders children", () => {
    render(<CnButton>Guardar</CnButton>);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("renders label when no children", () => {
    render(<CnButton label="Enviar" />);
    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<CnButton onClick={onClick}>Click</CnButton>);
    await userEvent.click(screen.getByRole("button", { name: "Click" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <CnButton disabled onClick={onClick}>
        Disabled
      </CnButton>,
    );
    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("blocks interaction when loading", () => {
    const onClick = vi.fn();
    render(
      <CnButton loading onClick={onClick}>
        Enviando
      </CnButton>,
    );
    const button = screen.getByRole("button", { name: /enviando/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders an icon-only button with aria-label", () => {
    render(<CnButton iconOnly icon={<span data-testid="icon" />} aria-label="Cerrar" />);
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("uses anchor when href is provided", () => {
    render(<CnButton href="https://example.com">Visitar</CnButton>);
    const link = screen.getByRole("link", { name: "Visitar" });
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("renders string icons through CnIcon instead of plain text", () => {
    render(<CnButton startIcon="save">Guardar</CnButton>);
    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button).toHaveTextContent(/^Guardar$/);
    expect(button.querySelector("svg")).not.toBeNull();
  });
});
