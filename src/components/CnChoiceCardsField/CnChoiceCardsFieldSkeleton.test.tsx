import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnChoiceCardsField } from "./CnChoiceCardsField";
import { CnChoiceCardsFieldSkeleton } from "./CnChoiceCardsFieldSkeleton";

const cards = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-cn-skeleton-card]"));
const pieces = (card: HTMLElement) => card.querySelectorAll('[data-cn-skeleton="true"]').length;

describe("CnChoiceCardsFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnChoiceCardsFieldSkeleton helperText icon meta />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "choice-cards-field");
  });

  it("follows card count and per-option layout", () => {
    const { container, rerender } = render(<CnChoiceCardsFieldSkeleton options={4} />);
    expect(cards(container)).toHaveLength(4);
    rerender(
      <CnChoiceCardsFieldSkeleton
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B", description: "d", meta: "$1", icon: "bolt" },
        ]}
      />,
    );
    const [plain, full] = cards(container);
    // Título + indicador vs. ícono + título + metadato + descripción + indicador.
    expect(pieces(plain)).toBe(2);
    expect(pieces(full)).toBe(5);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(
      <CnChoiceCardsField
        label="Envío"
        options={[
          { value: "std", label: "Estándar" },
          { value: "exp", label: "Exprés" },
        ]}
        skeleton
      />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "choice-cards-field");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
