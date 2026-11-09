import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnDataTable } from "./CnDataTable";

const rows = [
  { id: 1, name: "Ana" },
  { id: 2, name: "Luis" },
];

describe("CnDataTable fullscreen", () => {
  it("mounts in a portal on <body> so transformed ancestors cannot trap it", () => {
    const { container } = render(
      <div style={{ transform: "translateZ(0)" }}>
        <CnDataTable title="Personas" data={rows} columns={[{ id: "name", header: "Nombre" }]} />
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Pantalla completa" }));
    const dialog = screen.getByRole("dialog", { name: "Personas" });
    expect(dialog.parentElement).toBe(document.body);
    expect(container.querySelector("[data-cn-data-table]")).toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Personas" })).not.toBeInTheDocument();
    expect(container.querySelector("[data-cn-data-table]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Pantalla completa" })).toHaveFocus();
  });
});
