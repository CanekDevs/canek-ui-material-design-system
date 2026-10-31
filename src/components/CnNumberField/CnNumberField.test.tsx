import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sanitizeNumericInput } from "../../utils/number-utils";
import { CnNumberField, CnQuantityField } from "./CnNumberField";

describe("sanitizeNumericInput", () => {
  it("keeps a single decimal separator and sign", () => {
    expect(sanitizeNumericInput("-12,5.3a")).toBe("-12.53");
    expect(sanitizeNumericInput("007")).toBe("7");
    expect(sanitizeNumericInput("-5", { allowNegative: false })).toBe("5");
    expect(sanitizeNumericInput("1.239", { decimals: 2 })).toBe("1.23");
    expect(sanitizeNumericInput("1.5", { decimals: 0 })).toBe("1");
  });
});

describe("CnNumberField", () => {
  it("emits numbers, not strings", () => {
    const onChange = vi.fn();
    render(<CnNumberField label="Edad" onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "42" } });
    expect(onChange).toHaveBeenLastCalledWith(42);
  });

  it("emits null when cleared", () => {
    const onChange = vi.fn();
    render(<CnNumberField label="Edad" value={5} onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("clamps to min/max on blur", () => {
    const onChange = vi.fn();
    render(<CnNumberField label="Cantidad" min={1} max={10} onChange={onChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "50" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it("steps with arrow keys and stepper buttons", () => {
    const onChange = vi.fn();
    render(
      <CnNumberField label="Cantidad" value={1} step={0.1} showSteppers onChange={onChange} />,
    );
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith(1.1);
    fireEvent.click(screen.getByRole("button", { name: "Disminuir" }));
    expect(onChange).toHaveBeenLastCalledWith(0.9);
  });

  it("formats thousands when not focused", () => {
    render(<CnNumberField label="Monto" value={1234567.5} thousandSeparator onChange={() => {}} />);
    expect(screen.getByRole("spinbutton")).toHaveValue("1,234,567.5");
  });

  it("rejects negative input when min >= 0", () => {
    const onChange = vi.fn();
    render(<CnNumberField label="Cantidad" min={0} onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "-3" } });
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("shows stacked arrows by default", () => {
    const { container } = render(<CnNumberField label="Cantidad" />);
    expect(container.querySelector("[data-cn-number-stepper]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Aumentar" })).toBeInTheDocument();
  });

  it("repeats while the control is held down", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<CnNumberField label="Cantidad" defaultValue={0} onChange={onChange} />);
    const button = screen.getByRole("button", { name: "Aumentar" });
    fireEvent.pointerDown(button, { pointerType: "mouse", button: 0 });
    act(() => {
      vi.advanceTimersByTime(400 + 120 * 3);
    });
    fireEvent.pointerUp(button);
    vi.useRealTimers();
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it("uses large and small steps with modifiers and PageUp/Home/End", () => {
    const onChange = vi.fn();
    render(<CnNumberField label="N" value={50} min={0} max={100} step={1} onChange={onChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.keyDown(input, { key: "ArrowUp", shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(60);
    fireEvent.keyDown(input, { key: "ArrowDown", altKey: true });
    expect(onChange).toHaveBeenLastCalledWith(49.9);
    fireEvent.keyDown(input, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(input, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it("snaps to the step on blur", () => {
    const onChange = vi.fn();
    render(<CnNumberField label="N" step={5} snapToStep onChange={onChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it("restores min when empty values are not allowed", () => {
    const onChange = vi.fn();
    render(<CnNumberField label="N" min={1} value={3} allowEmpty={false} onChange={onChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("renders split controls centered (quantity selector)", () => {
    const onChange = vi.fn();
    render(<CnQuantityField label="Piezas" value={2} onChange={onChange} />);
    expect(screen.getByRole("spinbutton")).toHaveStyle({ textAlign: "center" });
    fireEvent.click(screen.getByRole("button", { name: "Aumentar" }));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("clears the value", () => {
    const onChange = vi.fn();
    render(<CnNumberField label="N" value={8} clearable onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("changes with the wheel only when enabled and focused", () => {
    const onChange = vi.fn();
    render(<CnNumberField label="N" value={1} allowWheel onChange={onChange} />);
    const input = screen.getByRole("spinbutton");
    act(() => input.focus());
    fireEvent.wheel(input, { deltaY: -100 });
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("disables controls at the limits", () => {
    render(<CnNumberField label="N" value={10} max={10} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Aumentar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Disminuir" })).not.toBeDisabled();
  });
});
