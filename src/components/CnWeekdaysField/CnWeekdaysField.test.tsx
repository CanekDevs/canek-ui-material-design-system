import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import { buildWeekdaysRules, CnWeekdaysField } from "./CnWeekdaysField";
import { CnWeekdaysFieldSkeleton } from "./CnWeekdaysFieldSkeleton";

describe("CnWeekdaysField", () => {
  it("starts on monday by default and toggles days", () => {
    const onChange = vi.fn();
    render(<CnWeekdaysField label="Días" defaultValue={[3]} onChange={onChange} />);
    const buttons = screen.getAllByRole("button", { pressed: false });
    expect(buttons[0]).toHaveAccessibleName("Lunes");
    fireEvent.click(screen.getByRole("button", { name: "Viernes" }));
    expect(onChange).toHaveBeenLastCalledWith([3, 5]);
    fireEvent.click(screen.getByRole("button", { name: "Miércoles" }));
    expect(onChange).toHaveBeenLastCalledWith([5]);
  });

  it("supports sunday first and presets", () => {
    const onChange = vi.fn();
    render(<CnWeekdaysField label="Días" weekStart={0} onChange={onChange} />);
    const group = screen.getByRole("group", { name: "Días" });
    expect(group.querySelector("[data-cn-weekday]")).toHaveAccessibleName("Domingo");
    fireEvent.click(screen.getByRole("button", { name: "Laborables" }));
    expect(onChange).toHaveBeenLastCalledWith([1, 2, 3, 4, 5]);
    fireEvent.click(screen.getByRole("button", { name: "Fin de semana" }));
    expect(onChange).toHaveBeenLastCalledWith([0, 6]);
  });

  it("moves focus with arrow keys", () => {
    render(<CnWeekdaysField label="Días" />);
    const monday = screen.getByRole("button", { name: "Lunes" });
    monday.focus();
    fireEvent.keyDown(monday, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Martes" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowLeft" });
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowLeft" });
    expect(screen.getByRole("button", { name: "Domingo" })).toHaveFocus();
  });

  it("validates required, min and max", () => {
    const rules = buildWeekdaysRules({ required: true, minDays: 2, maxDays: 3 });
    expect(validateFieldValue([], rules)).toContain("al menos un día");
    expect(validateFieldValue([1], rules)).toContain("al menos 2");
    expect(validateFieldValue([1, 2, 3, 4], rules)).toContain("máximo 3");
    expect(validateFieldValue([1, 2], rules)).toBe("");
  });

  it("shows the validation message after blur", () => {
    render(<CnWeekdaysField label="Días" required />);
    const monday = screen.getByRole("button", { name: "Lunes" });
    fireEvent.focus(monday);
    fireEvent.blur(monday);
    expect(screen.getByText("Elige al menos un día")).toBeInTheDocument();
  });

  it("renders its skeleton", () => {
    const { container, rerender } = render(<CnWeekdaysFieldSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "weekdays-field");
    expect(container.querySelectorAll("[data-cn-skeleton-day]")).toHaveLength(7);
    rerender(<CnWeekdaysField label="Días" skeleton presets={false} />);
    expect(container.querySelectorAll("[data-cn-skeleton-preset]")).toHaveLength(0);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
