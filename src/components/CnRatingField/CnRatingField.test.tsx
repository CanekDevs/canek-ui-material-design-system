import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnRatingField } from "./CnRatingField";

describe("CnRatingField", () => {
  it("renders accessible options and emits value", () => {
    const onChange = vi.fn();
    render(<CnRatingField label="Calificación" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("4 de 5"));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("uses custom labels", () => {
    render(
      <CnRatingField
        label="Calificación"
        labels={{ 5: "Excelente" }}
        value={5}
        onChange={() => {}}
      />,
    );
    expect(screen.getAllByText("Excelente").length).toBeGreaterThan(0);
  });
});
