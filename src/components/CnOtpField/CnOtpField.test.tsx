import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnOtpField } from "./CnOtpField";

const boxes = () => screen.getAllByRole("textbox") as HTMLInputElement[];

describe("CnOtpField", () => {
  it("renders one box per character with one-time-code autocomplete", () => {
    render(<CnOtpField label="Código" length={4} />);
    expect(boxes()).toHaveLength(4);
    expect(boxes()[0]).toHaveAttribute("autocomplete", "one-time-code");
    expect(screen.getByLabelText("Carácter 2 de 4")).toBeInTheDocument();
  });

  it("types digit by digit and calls onComplete", () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<CnOtpField length={3} onChange={onChange} onComplete={onComplete} />);
    fireEvent.change(boxes()[0], { target: { value: "1" } });
    fireEvent.change(boxes()[1], { target: { value: "2" } });
    fireEvent.change(boxes()[2], { target: { value: "3" } });
    expect(onChange).toHaveBeenLastCalledWith("123");
    expect(onComplete).toHaveBeenCalledWith("123");
  });

  it("ignores letters in numeric mode", () => {
    const onChange = vi.fn();
    render(<CnOtpField length={3} onChange={onChange} />);
    fireEvent.change(boxes()[0], { target: { value: "a" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("distributes a pasted code", () => {
    const onChange = vi.fn();
    render(<CnOtpField length={6} onChange={onChange} />);
    fireEvent.paste(boxes()[0], { clipboardData: { getData: () => "12 34-56" } });
    expect(onChange).toHaveBeenLastCalledWith("123456");
  });

  it("deletes with backspace", () => {
    const onChange = vi.fn();
    render(<CnOtpField length={4} defaultValue="12" onChange={onChange} />);
    fireEvent.keyDown(boxes()[2], { key: "Backspace" });
    expect(onChange).toHaveBeenLastCalledWith("1");
  });

  it("uppercases alphanumeric codes", () => {
    const onChange = vi.fn();
    render(<CnOtpField length={2} inputType="alphanumeric" onChange={onChange} />);
    fireEvent.change(boxes()[0], { target: { value: "a" } });
    expect(onChange).toHaveBeenLastCalledWith("A");
  });
});
