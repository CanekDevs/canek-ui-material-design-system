import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import {
  buildDurationRules,
  CnDurationField,
  formatDuration,
  splitDuration,
} from "./CnDurationField";
import { CnDurationFieldSkeleton } from "./CnDurationFieldSkeleton";

describe("CnDurationField", () => {
  it("formats and splits durations", () => {
    expect(formatDuration(90)).toBe("1 h 30 min");
    expect(formatDuration(1590)).toBe("1 d 2 h 30 min");
    expect(formatDuration(75, "seconds")).toBe("1 min 15 s");
    expect(splitDuration(5400, ["hours", "minutes"])).toEqual({ hours: 1, minutes: 30 });
    expect(splitDuration(5400, ["hours"])).toEqual({ hours: 1.5 });
  });

  it("emits the total in minutes and normalizes on blur", () => {
    const onChange = vi.fn();
    render(<CnDurationField label="Duración" onChange={onChange} />);
    const minutes = screen.getByLabelText("Minutos");
    fireEvent.change(screen.getByLabelText("Horas"), { target: { value: "2" } });
    expect(onChange).toHaveBeenLastCalledWith(120);
    fireEvent.change(minutes, { target: { value: "90" } });
    expect(onChange).toHaveBeenLastCalledWith(210);
    fireEvent.blur(minutes);
    expect(screen.getByLabelText("Horas")).toHaveValue("3");
    expect(minutes).toHaveValue("30");
  });

  it("stores seconds and applies presets", () => {
    const onChange = vi.fn();
    render(
      <CnDurationField
        units={["minutes", "seconds"]}
        valueUnit="seconds"
        presets={[{ label: "1 min", value: 60 }]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "1 min" }));
    expect(onChange).toHaveBeenLastCalledWith(60);
    expect(screen.getByLabelText("Minutos")).toHaveValue("1");
    expect(screen.getByRole("button", { name: "1 min" })).toHaveAttribute("aria-pressed", "true");
  });

  it("filters default presets by min/max and validates", () => {
    render(<CnDurationField min={30} max={120} />);
    expect(screen.queryByRole("button", { name: "15 min" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2 h" })).toBeInTheDocument();
    const rules = buildDurationRules({ required: true, min: 30, max: 120 });
    expect(validateFieldValue(null, rules)).toBe("Indica la duración");
    expect(validateFieldValue(10, rules)).toContain("mínima es 30 min");
    expect(validateFieldValue(200, rules)).toContain("máxima es 2 h");
    expect(validateFieldValue(60, rules)).toBe("");
  });

  it("renders its skeleton", () => {
    const { container, rerender } = render(<CnDurationFieldSkeleton units={3} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "duration-field");
    expect(container.querySelectorAll("[data-cn-skeleton-unit]")).toHaveLength(3);
    rerender(
      <CnDurationField label="Duración" units={["days", "hours"]} presets={false} skeleton />,
    );
    expect(container.querySelectorAll("[data-cn-skeleton-unit]")).toHaveLength(2);
    expect(container.querySelectorAll("[data-cn-skeleton-preset]")).toHaveLength(0);
  });
});
