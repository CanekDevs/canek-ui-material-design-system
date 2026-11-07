import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnTransferListField } from "./CnTransferListField";
import { CnTransferListFieldSkeleton } from "./CnTransferListFieldSkeleton";

const options = ["Ana", "Luis", "María", "Jorge"].map((label, i) => ({ value: i + 1, label }));

describe("CnTransferListFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnTransferListFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "transfer-list-field");
  });

  it("follows item counts, search and orientation variants", () => {
    const { container, rerender } = render(
      <CnTransferListFieldSkeleton availableItems={4} selectedItems={1} />,
    );
    expect(container.querySelectorAll('[data-sk-part="pane"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-sk-part="item"]')).toHaveLength(5);
    expect(container.querySelectorAll('[data-sk-part="search"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-sk-part="transfer"]')).toHaveLength(4);
    rerender(
      <CnTransferListFieldSkeleton searchable={false} orientation="vertical" availableItems={2} />,
    );
    expect(container.querySelectorAll('[data-sk-part="search"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-sk-part="item"]')).toHaveLength(4);
    expect(container.querySelector('[data-sk-orientation="vertical"]')).toBeInTheDocument();
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    const { container } = render(
      <CnTransferListField label="Equipo" options={options} defaultValue={[2]} skeleton />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "transfer-list-field");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-sk-part="item"]')).toHaveLength(4);
  });
});
