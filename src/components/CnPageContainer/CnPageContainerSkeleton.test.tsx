import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnPageContainer } from "./CnPageContainer";
import { CnPageContainerSkeleton } from "./CnPageContainerSkeleton";

const piecesIn = (container: HTMLElement, selector: string) =>
  container.querySelector(selector)?.querySelectorAll('[data-cn-skeleton="true"]').length ?? 0;

describe("CnPageContainerSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnPageContainerSkeleton back icon tabs content="table" />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "page-container");
  });

  it("follows breadcrumbs, actions, tabs and content shape", () => {
    const { container, rerender } = render(<CnPageContainerSkeleton breadcrumbs={2} actions={3} />);
    // 2 etiquetas + 1 separador
    expect(piecesIn(container, "[data-cn-page-skeleton-breadcrumbs]")).toBe(3);
    expect(piecesIn(container, "[data-cn-page-skeleton-actions]")).toBe(3);
    expect(container.querySelector("[data-cn-page-skeleton-tabs]")).toBeNull();
    expect(container.querySelector('[data-cn-page-skeleton-content="blocks"]')).not.toBeNull();
    rerender(<CnPageContainerSkeleton breadcrumbs={false} tabs={4} content="cards" items={6} />);
    expect(container.querySelector("[data-cn-page-skeleton-breadcrumbs]")).toBeNull();
    expect(container.querySelector("[data-cn-page-skeleton-tabs]")).not.toBeNull();
    expect(
      container.querySelector('[data-cn-page-skeleton-content="cards"]')?.children,
    ).toHaveLength(6);
  });

  it("applies the max width", () => {
    render(<CnPageContainerSkeleton maxWidth="md" />);
    expect(getComputedStyle(screen.getByRole("status")).maxWidth).toBe("960px");
  });

  it("renders the skeleton via loading and the skeleton alias", () => {
    const crumbs = [{ label: "Inicio", href: "/" }, { label: "ACME" }];
    const { container, rerender } = render(
      <CnPageContainer title="ACME" breadcrumbs={crumbs} loading>
        contenido
      </CnPageContainer>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "page-container");
    expect(screen.queryByText("contenido")).not.toBeInTheDocument();
    expect(piecesIn(container, "[data-cn-page-skeleton-breadcrumbs]")).toBe(3);
    rerender(
      <CnPageContainer title="ACME" skeleton skeletonContent="table">
        contenido
      </CnPageContainer>,
    );
    expect(container.querySelector('[data-cn-page-skeleton-content="table"]')).not.toBeNull();
  });
});
