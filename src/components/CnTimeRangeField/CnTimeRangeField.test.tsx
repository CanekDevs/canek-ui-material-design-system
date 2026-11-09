import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import { buildTimeRangeRules, CnTimeRangeField, getTimeRangeMinutes } from "./CnTimeRangeField";
import { CnTimeRangeFieldSkeleton } from "./CnTimeRangeFieldSkeleton";

describe("CnTimeRangeField", () => {
  it("emits a tuple and shows the duration", () => {
    const onChange = vi.fn();
    render(<CnTimeRangeField label="Horario" defaultValue={["09:00", ""]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Fin"), { target: { value: "17:30" } });
    expect(onChange).toHaveBeenLastCalledWith(["09:00", "17:30"]);
    expect(screen.getByRole("status", { name: "Duración" })).toHaveTextContent("8 h 30 min");
  });

  it("computes overnight durations", () => {
    expect(getTimeRangeMinutes(["22:00", "06:00"])).toBeNull();
    expect(getTimeRangeMinutes(["22:00", "06:00"], true)).toBe(480);
    render(<CnTimeRangeField allowOvernight defaultValue={["22:00", "06:00"]} />);
    expect(screen.getByText("+1 día")).toBeInTheDocument();
  });

  it("validates order, required and duration limits", () => {
    const rules = buildTimeRangeRules({ required: true, minDuration: 30, maxDuration: 120 });
    expect(validateFieldValue(["", ""], rules)).toContain("inicio y de fin");
    expect(validateFieldValue(["10:00", "09:00"], rules)).toContain("posterior");
    expect(validateFieldValue(["10:00", "10:15"], rules)).toContain("mínima");
    expect(validateFieldValue(["10:00", "13:00"], rules)).toContain("máxima");
    expect(validateFieldValue(["10:00", "11:00"], rules)).toBe("");
    expect(
      validateFieldValue(["22:00", "02:00"], buildTimeRangeRules({ allowOvernight: true })),
    ).toBe("");
  });

  it("shows the error after blur", () => {
    render(<CnTimeRangeField label="Horario" defaultValue={["12:00", "08:00"]} />);
    const start = screen.getByLabelText("Inicio");
    fireEvent.focus(start);
    fireEvent.blur(start);
    expect(
      screen.getByText("La hora de fin debe ser posterior a la de inicio"),
    ).toBeInTheDocument();
  });

  it("renders its skeleton", () => {
    const { container, rerender } = render(<CnTimeRangeFieldSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "time-range-field");
    expect(container.querySelector("[data-cn-skeleton-duration]")).not.toBeNull();
    rerender(<CnTimeRangeField label="Horario" showDuration={false} skeleton />);
    expect(container.querySelector("[data-cn-skeleton-duration]")).toBeNull();
  });
});
