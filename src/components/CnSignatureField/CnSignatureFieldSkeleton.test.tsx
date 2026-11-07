import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnSignatureField } from "./CnSignatureField";
import { CnSignatureFieldSkeleton } from "./CnSignatureFieldSkeleton";

describe("CnSignatureFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnSignatureFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "signature-field");
  });

  it("follows height, mode selector and read-only variants", () => {
    const { container, rerender } = render(<CnSignatureFieldSkeleton height={140} />);
    const pad = container.querySelector('[data-sk-part="pad"]') as HTMLElement;
    expect(getComputedStyle(pad).height).toBe("140px");
    expect(container.querySelector('[data-sk-part="mode"]')).toBeInTheDocument();
    expect(container.querySelector('[data-sk-part="actions"]')).toBeInTheDocument();
    rerender(<CnSignatureFieldSkeleton readOnly />);
    expect(container.querySelector('[data-sk-part="mode"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-sk-part="actions"]')).not.toBeInTheDocument();
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnSignatureField label="Firma" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "signature-field");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
