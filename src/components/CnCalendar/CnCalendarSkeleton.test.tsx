import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnCalendar } from "./CnCalendar";
import { CnCalendarSkeleton } from "./CnCalendarSkeleton";

describe("CnCalendarSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnCalendarSkeleton showWeekNumbers />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "calendar");
  });

  it("follows weeks, months and range mode", () => {
    const { container, rerender } = render(<CnCalendarSkeleton weeks={5} />);
    expect(container.querySelectorAll("[data-cn-calendar-skeleton-week]")).toHaveLength(5);
    expect(container.querySelectorAll('[data-cn-calendar-skeleton-day="day"]')).toHaveLength(35);
    rerender(<CnCalendarSkeleton months={2} />);
    expect(container.querySelectorAll("[data-cn-calendar-skeleton-grid]")).toHaveLength(2);
    // Dos meses: solo los días de cada mes (30 + 31), sin días vecinos.
    expect(container.querySelectorAll('[data-cn-calendar-skeleton-day="day"]')).toHaveLength(61);
    rerender(<CnCalendarSkeleton mode="range" />);
    expect(container.querySelector('[data-cn-calendar-skeleton-day="range-start"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-cn-calendar-skeleton-day="range-mid"]')).toHaveLength(
      5,
    );
  });

  it("renders the month and year views", () => {
    const { container, rerender } = render(<CnCalendarSkeleton view="month" />);
    expect(
      container.querySelector('[data-cn-calendar-skeleton-list="month"]')?.children,
    ).toHaveLength(12);
    expect(container.querySelector("[data-cn-calendar-skeleton-grid]")).toBeNull();
    rerender(<CnCalendarSkeleton view="year" />);
    expect(container.querySelector('[data-cn-calendar-skeleton-list="year"]')).not.toBeNull();
  });

  it("replaces the calendar with its skeleton via the skeleton prop", () => {
    const { container } = render(<CnCalendar mode="range" months={2} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "calendar");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-cn-calendar-skeleton-grid]")).toHaveLength(2);
  });
});
