import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnChip } from "./CnChip";

describe("CnChip", () => {
  it("renders the label", () => {
    render(<CnChip label="Activo" />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renders subtitle below label", () => {
    render(<CnChip label="Phobos" subtitle="Activo" />);
    expect(screen.getByText("Phobos")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("fires onClick when clicked", () => {
    const onClick = vi.fn();
    render(<CnChip label="Clickable" onClick={onClick} />);
    fireEvent.click(screen.getByText("Clickable"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(<CnChip label="Disabled" disabled onClick={onClick} />);
    const chip = screen.getByText("Disabled").closest(".MuiChip-root");
    expect(chip).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(chip as HTMLElement);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires onDelete when delete icon clicked", () => {
    const onDelete = vi.fn();
    render(<CnChip label="Removable" onDelete={onDelete} />);
    const deleteIcon = document.querySelector(".MuiChip-deleteIcon");
    expect(deleteIcon).toBeInTheDocument();
    fireEvent.click(deleteIcon as HTMLElement);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not fire onDelete when disabled", () => {
    const onDelete = vi.fn();
    render(<CnChip label="Removable" onDelete={onDelete} disabled />);
    expect(document.querySelector(".MuiChip-deleteIcon")).toBeNull();
  });

  it("renders chevron when withChevron is set", () => {
    render(<CnChip label="Open" withChevron />);
    const deleteIcon = document.querySelector(".MuiChip-deleteIcon");
    expect(deleteIcon).toBeInTheDocument();
  });

  it("auto-applies circle shape for icon-only chips", () => {
    render(<CnChip label="" icon="add" />);
    const chip = document.querySelector(".MuiChip-root");
    expect(chip).toHaveStyle({ borderRadius: "50%" });
  });

  it("auto-applies circle shape for short counter labels", () => {
    render(<CnChip label="3" />);
    const chip = document.querySelector(".MuiChip-root");
    expect(chip).toHaveStyle({ borderRadius: "50%" });
  });

  it("respects explicit shape prop even for short labels", () => {
    render(<CnChip label="3" shape="pill" />);
    const chip = document.querySelector(".MuiChip-root");
    expect(chip).toHaveStyle({ borderRadius: "var(--cn-radius-full, 9999px)" });
  });

  it("renders avatar when passed as URL string", () => {
    render(<CnChip label="User" avatar="https://example.com/avatar.png" />);
    const avatar = document.querySelector(".MuiChip-avatar img");
    expect(avatar).toBeInTheDocument();
  });

  it("renders icon name string via CnIcon", () => {
    const { container } = render(<CnChip label="Check" icon="check" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
