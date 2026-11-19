import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnButton } from "./CnButton";

describe("CnButton sx", () => {
  it("keeps every entry of an sx array on icon-only buttons", () => {
    render(
      <CnButton
        iconOnly
        icon="add"
        aria-label="Agregar"
        sx={[{ marginTop: "7px" }, { marginLeft: "9px" }]}
      />,
    );
    const button = screen.getByRole("button", { name: "Agregar" });
    expect(getComputedStyle(button).marginTop).toBe("7px");
    expect(getComputedStyle(button).marginLeft).toBe("9px");
  });
});
