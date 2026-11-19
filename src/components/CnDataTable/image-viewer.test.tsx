import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnImageViewer } from "./cells";

describe("CnImageViewer", () => {
  it("names the element with role dialog", () => {
    render(<CnImageViewer images={["/a.png", "/b.png"]} index={0} onClose={() => undefined} />);
    expect(screen.getByRole("dialog", { name: "Visor de imágenes" })).toBeInTheDocument();
  });
});
