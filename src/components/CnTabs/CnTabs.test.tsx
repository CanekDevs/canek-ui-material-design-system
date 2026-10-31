import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnTabs } from "./CnTabs";

const BASIC_OPTIONS = [
  { id: "overview", label: "Resumen" },
  { id: "details", label: "Detalles" },
  { id: "history", label: "Historial" },
];

describe("CnTabs", () => {
  it("renders all options", () => {
    render(<CnTabs options={BASIC_OPTIONS} value="overview" onChange={() => {}} />);
    expect(screen.getByText("Resumen")).toBeInTheDocument();
    expect(screen.getByText("Detalles")).toBeInTheDocument();
    expect(screen.getByText("Historial")).toBeInTheDocument();
  });

  it("marks selected tab", () => {
    render(<CnTabs options={BASIC_OPTIONS} value="details" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: /detalles/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /resumen/i })).toHaveAttribute("aria-selected", "false");
  });

  it("calls onChange when tab clicked", () => {
    const onChange = vi.fn();
    render(<CnTabs options={BASIC_OPTIONS} value="overview" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: /detalles/i }));
    expect(onChange).toHaveBeenCalledWith("details");
  });

  it("does not fire onChange when disabled", () => {
    const onChange = vi.fn();
    const options = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
    ];
    render(<CnTabs options={options} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("fires onTabClick when enabled", () => {
    const onTabClick = vi.fn();
    render(
      <CnTabs
        options={BASIC_OPTIONS}
        value="overview"
        onChange={() => {}}
        onTabClick={onTabClick}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /detalles/i }));
    expect(onTabClick).toHaveBeenCalledWith(BASIC_OPTIONS[1], 1, expect.anything());
  });

  it("does not fire onTabClick when disabled", () => {
    const onTabClick = vi.fn();
    const options = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
    ];
    render(<CnTabs options={options} value="a" onChange={() => {}} onTabClick={onTabClick} />);
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    expect(onTabClick).not.toHaveBeenCalled();
  });

  it("renders badge", () => {
    const options = [
      { id: "inbox", label: "Bandeja", badge: 5 },
      { id: "sent", label: "Enviados" },
    ];
    render(<CnTabs options={options} value="inbox" onChange={() => {}} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders icon by string name", () => {
    const options = [
      { id: "a", label: "Inicio", icon: "home" },
      { id: "b", label: "Buscar", icon: "search" },
    ];
    const { container } = render(<CnTabs options={options} value="a" onChange={() => {}} />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(2);
  });

  it("renders subtitle when provided", () => {
    const options = [
      { id: "a", label: "Phobos", subtitle: "Activo" },
      { id: "b", label: "Kairos", subtitle: "Beta" },
    ];
    render(<CnTabs options={options} value="a" onChange={() => {}} />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("renders error indicator when hasError", () => {
    const options = [
      { id: "a", label: "Válido" },
      { id: "b", label: "Con error", hasError: true },
    ];
    const { container } = render(<CnTabs options={options} value="a" onChange={() => {}} />);
    expect(container.querySelector("[data-cn-tabs-status='true']")).toBeInTheDocument();
  });

  it("renders loading spinner when isLoading", () => {
    const options = [
      { id: "a", label: "Listo" },
      { id: "b", label: "Cargando", isLoading: true },
    ];
    const { container } = render(<CnTabs options={options} value="a" onChange={() => {}} />);
    expect(container.querySelector("[data-cn-tabs-status='true']")).toBeInTheDocument();
  });

  it("hides labels when showIconOnly", () => {
    const options = [
      { id: "a", label: "Home", icon: "home" },
      { id: "b", label: "Search", icon: "search" },
    ];
    render(<CnTabs options={options} value="a" onChange={() => {}} showIconOnly />);
    expect(screen.queryByText("Home")).toBeNull();
    expect(screen.queryByText("Search")).toBeNull();
  });

  it("applies vertical orientation to MUI Tabs", () => {
    render(
      <CnTabs
        options={BASIC_OPTIONS}
        value="overview"
        onChange={() => {}}
        orientation="vertical"
      />,
    );
    const tabs = screen.getByRole("tablist");
    expect(tabs).toHaveAttribute("aria-orientation", "vertical");
  });

  it("renders pill variant with selected tab styled", () => {
    render(<CnTabs options={BASIC_OPTIONS} value="details" onChange={() => {}} variant="pill" />);
    const selected = screen.getByRole("tab", { name: /detalles/i });
    expect(selected).toHaveAttribute("aria-selected", "true");
  });

  it("does not render indicator when showIndicator is false", () => {
    const { container } = render(
      <CnTabs
        options={BASIC_OPTIONS}
        value="overview"
        onChange={() => {}}
        variant="line"
        showIndicator={false}
      />,
    );
    const indicator = container.querySelector(".MuiTabs-indicator");
    if (indicator) {
      expect(indicator).toHaveStyle({ display: "none" });
    }
  });

  it("attaches data-cn-tab-id to each tab", () => {
    const { container } = render(
      <CnTabs options={BASIC_OPTIONS} value="overview" onChange={() => {}} />,
    );
    expect(container.querySelector("[data-cn-tab-id='overview']")).toBeInTheDocument();
    expect(container.querySelector("[data-cn-tab-id='details']")).toBeInTheDocument();
  });

  it("applies data-cn-tab-selected to selected tab", () => {
    const { container } = render(
      <CnTabs options={BASIC_OPTIONS} value="details" onChange={() => {}} />,
    );
    expect(container.querySelector("[data-cn-tab-selected='true']")).toHaveAttribute(
      "data-cn-tab-id",
      "details",
    );
  });
});
