import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnSwitchField } from "./CnSwitchField";

describe("CnSwitchField", () => {
  it("toggles and emits boolean", () => {
    const onChange = vi.fn();
    render(<CnSwitchField label="Notificaciones" description="Por correo" onChange={onChange} />);
    const control = screen.getByRole("switch", { name: /Notificaciones/ });
    fireEvent.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByText("Por correo")).toBeInTheDocument();
  });

  it("respects readOnly", () => {
    const onChange = vi.fn();
    render(<CnSwitchField label="Activo" readOnly onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch", { name: /Activo/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows helper text", () => {
    render(<CnSwitchField label="Activo" helperText="Ayuda" />);
    expect(screen.getByText("Ayuda")).toBeInTheDocument();
  });
});
