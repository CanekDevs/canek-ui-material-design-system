import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import { buildScheduleRules, CnScheduleField, getScheduleIssues } from "./CnScheduleField";
import type { CnScheduleValue } from "./CnScheduleField";
import { CnScheduleFieldSkeleton } from "./CnScheduleFieldSkeleton";

const Controlled = ({
  initial = {},
  onChange,
}: {
  initial?: CnScheduleValue;
  onChange?: (v: CnScheduleValue) => void;
}) => {
  const [value, setValue] = useState<CnScheduleValue>(initial);
  return (
    <CnScheduleField
      label="Horario"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};

describe("CnScheduleField", () => {
  it("enables a day with the default range and adds ranges", () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch", { name: "Abrir Lunes" }));
    expect(onChange).toHaveBeenLastCalledWith({
      mon: { enabled: true, ranges: [{ start: "09:00", end: "18:00" }] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar horario al Lunes" }));
    expect(onChange.mock.lastCall?.[0].mon.ranges).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Quitar horario 2 del Lunes" }));
    expect(onChange.mock.lastCall?.[0].mon.ranges).toHaveLength(1);
  });

  it("copies a day to all days", () => {
    const onChange = vi.fn();
    render(
      <Controlled
        onChange={onChange}
        initial={{ tue: { enabled: true, ranges: [{ start: "08:00", end: "12:00" }] } }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Copiar el horario del Martes a todos los días" }),
    );
    const value = onChange.mock.lastCall?.[0] as CnScheduleValue;
    expect(Object.keys(value)).toHaveLength(7);
    expect(value.sun).toEqual({ enabled: true, ranges: [{ start: "08:00", end: "12:00" }] });
  });

  it("edits times and shows per-day issues", () => {
    render(
      <Controlled
        initial={{ wed: { enabled: true, ranges: [{ start: "09:00", end: "18:00" }] } }}
      />,
    );
    const group = screen.getByRole("group", { name: "Miércoles" });
    fireEvent.change(within(group).getByLabelText("Miércoles: fin del horario 1"), {
      target: { value: "08:00" },
    });
    expect(
      within(group).getByText("La hora de fin debe ser posterior a la de inicio"),
    ).toBeInTheDocument();
  });

  it("detects overlaps and validates required", () => {
    const overlap: CnScheduleValue = {
      mon: {
        enabled: true,
        ranges: [
          { start: "09:00", end: "13:00" },
          { start: "12:00", end: "15:00" },
        ],
      },
    };
    expect(getScheduleIssues(overlap)).toEqual({ mon: "Los horarios se traslapan" });
    const rules = buildScheduleRules({ required: true });
    expect(validateFieldValue({}, rules)).toBe("Habilita al menos un día");
    expect(validateFieldValue(overlap, rules)).toBe("Lunes: Los horarios se traslapan");
    expect(
      validateFieldValue(
        { fri: { enabled: true, ranges: [{ start: "09:00", end: "10:00" }] } },
        rules,
      ),
    ).toBe("");
  });

  it("renders its skeleton", () => {
    const { container, rerender } = render(<CnScheduleFieldSkeleton days={3} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "schedule-field");
    expect(container.querySelectorAll("[data-cn-skeleton-day]")).toHaveLength(3);
    rerender(<CnScheduleField label="Horario" days={["mon", "tue"]} skeleton />);
    expect(container.querySelectorAll("[data-cn-skeleton-day]")).toHaveLength(2);
  });
});
