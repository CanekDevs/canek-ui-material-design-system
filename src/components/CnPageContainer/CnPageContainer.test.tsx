import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnMetricCard } from "../CnMetricCard";
import { CnPageContainer } from "./CnPageContainer";

describe("CnPageContainer", () => {
  const crumbs = [
    { label: "Inicio", href: "/" },
    { label: "Clientes", href: "/clientes" },
    { label: "ACME" },
  ];

  it("renders breadcrumbs, title and actions", () => {
    render(
      <CnPageContainer
        title="ACME"
        subtitle="Cliente desde 2020"
        breadcrumbs={crumbs}
        actions={<button type="button">Editar</button>}
      >
        contenido
      </CnPageContainer>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "ACME" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute("href", "/clientes");
    expect(screen.getByText("ACME", { selector: "[aria-current=page] *" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("navigates back to the previous breadcrumb with onNavigate", () => {
    const onNavigate = vi.fn();
    render(<CnPageContainer title="ACME" breadcrumbs={crumbs} back onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(onNavigate).toHaveBeenCalledWith("/clientes");
  });

  it("uses a custom link component", () => {
    const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
      <a href={href} data-router>
        {children}
      </a>
    );
    render(<CnPageContainer title="X" breadcrumbs={crumbs} linkComponent={Link} />);
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("data-router");
  });
});

describe("CnMetricCard", () => {
  it("formats value and colors trend by meaning", () => {
    render(
      <CnMetricCard
        title="Costos"
        value={1500}
        format={(v) => `$${v.toLocaleString("en-US")}`}
        trend={{ value: 8, upIsGood: false, label: "vs. mes anterior" }}
        progress={{ value: 30, max: 60, label: "Meta" }}
        sparkline={[1, 3, 2, 5]}
      />,
    );
    expect(screen.getByText("$1,500")).toBeInTheDocument();
    expect(screen.getByText("+8 %")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "30");
    expect(screen.getByText("50 %")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Tendencia/ })).toBeInTheDocument();
  });

  it("is clickable when onClick is provided", () => {
    const onClick = vi.fn();
    render(<CnMetricCard title="Ventas" value={10} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
